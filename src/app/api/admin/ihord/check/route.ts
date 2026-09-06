import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { setCheck } from '@/lib/ihord/checks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Ticking one visit off the reconciliation.
 *
 * One row per request, deliberately. The checklist is worked through a row at a
 * time and each tick is its own decision — a batch endpoint would invite a
 * "tick everything visible" button, which is the one thing that would make the
 * whole record meaningless.
 *
 * Nothing here reaches the dispatcher or JobPocket: a tick is this console's
 * own record that somebody looked. Neither set of books is touched.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    const body = (await request.json()) as {
      jobNumber?: string;
      checked?: boolean;
      note?: string | null;
      partsCostCents?: number | null;
    };

    // The dispatcher's own format. Validated rather than trusted, because this
    // string is the primary key and a typo would silently create a row that
    // never lines up with anything on the page.
    if (!body.jobNumber || !/^[A-Z]+-[\w-]{1,24}$/.test(body.jobNumber)) {
      return NextResponse.json({ error: 'A job number is required' }, { status: 400 });
    }
    if (typeof body.checked !== 'boolean') {
      return NextResponse.json({ error: 'checked must be true or false' }, { status: 400 });
    }

    // A whole number of cents, or nothing. Rejected rather than rounded: this
    // is a figure somebody will claim money against, and quietly turning a
    // mistyped amount into a plausible one is how a claim becomes wrong.
    const parts = body.partsCostCents;
    if (parts != null && (!Number.isInteger(parts) || parts < 0 || parts > 100_000_00)) {
      return NextResponse.json({ error: 'That parts cost looks wrong' }, { status: 400 });
    }

    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : null;
    await setCheck(body.jobNumber, body.checked, note || null, parts ?? null);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('ihord check save failed:', error);
    return NextResponse.json({ error: 'Could not save the tick.' }, { status: 500 });
  }
}
