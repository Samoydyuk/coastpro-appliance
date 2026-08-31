import { NextRequest } from 'next/server';
import { requireAdmin, adminJson } from '@/lib/admin-guard';
import { OperationsApiError } from '@/lib/bookings/client';
import { recordManualCharge, deleteManualCharge } from '@/lib/marketplace/client';
import { requireDb, quietly } from '@/lib/db';
import { clientIp, hashIp } from '@/lib/tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * What a lead cost, typed in by hand.
 *
 * The form on `/admin/marketplace` posts here rather than to JobPocket, and
 * that is the whole reason this file exists. The operations key can read every
 * customer in the business; it lives on this server, sealed, and it must never
 * be handed to a browser to make one write with.
 *
 * `requireAdmin` runs first and it is not redundant. `src/middleware.ts` has
 * already turned an unauthenticated request away, but the matcher there is a
 * list of path patterns one edit away from letting this through, and what is
 * behind this route is the ability to write costs into the owner's books.
 */

/**
 * Ten thousand dollars for one introduction.
 *
 * JobPocket enforces the same ceiling and its refusal is the one that counts;
 * this copy exists so that a decimal point lost twice comes back as a sentence
 * about decimal points rather than as a validator saying "Invalid request".
 * The real figure is $12 to $90, so nothing legitimate goes anywhere near it.
 */
const MAX_LEAD_CHARGE_CENTS = 1_000_000;

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const body = (await request.json().catch(() => null)) as {
    provider?: string;
    day?: string;
    amountCents?: number;
    description?: string;
    externalId?: string;
  } | null;

  const day = String(body?.day ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return adminJson({ error: 'Pick the day the marketplace charged.' }, { status: 400 });
  }

  const amountCents = Number(body?.amountCents);
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return adminJson({ error: 'That amount is not money I can record.' }, { status: 400 });
  }
  if (amountCents > MAX_LEAD_CHARGE_CENTS) {
    return adminJson(
      { error: 'That is far more than a lead has ever cost — check the decimal point.' },
      { status: 400 }
    );
  }

  const provider = String(body?.provider ?? '').trim();
  if (!provider) {
    return adminJson({ error: 'Which marketplace charged it?' }, { status: 400 });
  }

  try {
    const result = await recordManualCharge({
      provider,
      chargedAt: middayOf(day),
      amountCents,
      description: body?.description?.trim().slice(0, 300) || undefined,
      externalId: body?.externalId?.trim().slice(0, 120) || undefined,
    });

    await audit(request, result.charge.id, result.created ? 'lead_charge_recorded' : 'lead_charge_corrected', {
      amountCents,
      day,
      provider,
    });

    return adminJson(result);
  } catch (error) {
    return relay(error, 'Could not record that in JobPocket.');
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return adminJson({ error: 'Missing id' }, { status: 400 });

  try {
    const result = await deleteManualCharge(id);
    await audit(request, result.id, 'lead_charge_deleted', { origin: result.origin });
    return adminJson(result);
  } catch (error) {
    return relay(error, 'Could not remove that in JobPocket.');
  }
}

/**
 * Midday, and the middle of the day is doing real work here.
 *
 * A billing page gives a date; `LeadCharge.chargedAt` is a timestamp, so some
 * hour has to be chosen. Midnight is the obvious choice and it is the wrong
 * one: a bare `YYYY-MM-DD` reads as midnight UTC, and every date on this
 * console is drawn in the shop's timezone — several hours behind — so a charge
 * entered for the 30th would come straight back onto the screen dated the 29th,
 * in the list it was just added to, under its own delete button. Noon UTC is
 * the same calendar day from Los Angeles to Kyiv, and it stays comfortably
 * inside the day of future slack JobPocket allows for exactly this reason.
 */
function middayOf(day: string): string {
  return `${day}T12:00:00.000Z`;
}

/**
 * JobPocket's own refusals, handed back as they were written.
 *
 * They name what to do about it — a charge the marketplace sent and will not
 * let be overwritten, a booking request belonging to somebody else — so the
 * status travels with the message. Anything else is this console's plumbing
 * failing rather than the typing being wrong, and reads as a 502.
 */
function relay(error: unknown, fallback: string) {
  if (error instanceof OperationsApiError) {
    const passThrough = error.status === 400 || error.status === 404 || error.status === 409;
    return adminJson({ error: error.message }, { status: passThrough ? error.status : 502 });
  }
  console.error('[Marketplace] Manual charge failed:', error);
  return adminJson({ error: fallback }, { status: 500 });
}

/**
 * The console's own note of who typed a number into the books.
 *
 * `quietly` because a missing audit row must never be the reason a cost the
 * owner just entered comes back as a failure — the charge is already written in
 * JobPocket by the time this runs.
 */
async function audit(
  request: NextRequest,
  chargeId: string,
  action: string,
  // Strings and numbers only, which is what the driver will serialise as JSON
  // without being asked twice.
  detail: Record<string, string | number>
): Promise<void> {
  await quietly(async () => {
    const sql = requireDb();
    await sql`
      insert into admin_audit (action, entity, entity_id, detail, ip_hash)
      values (${action}, 'lead_charge', ${chargeId}, ${sql.json(detail)},
              ${hashIp(clientIp(request.headers) ?? 'unknown')})
    `;
  });
}
