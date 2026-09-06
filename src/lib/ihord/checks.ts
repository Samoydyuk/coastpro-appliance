import { requireDb } from '@/lib/db';

/**
 * The owner's own ticks against the dispatcher's visits.
 *
 * Not to be confused with the dispatcher's `Reconciled`, which is *their*
 * agreement that a visit is settled. This is the other half: somebody sat down,
 * read the row — what was sold, what was bought, what came in, what paperwork
 * exists — and satisfied themselves it is right. A reconciliation is only worth
 * anything if both claims are recorded separately.
 *
 * Keyed by the dispatcher's job number rather than a JobPocket id, because the
 * rows most worth ticking are the ones JobPocket has no copy of.
 */

export interface IhordCheck {
  jobNumber: string;
  checked: boolean;
  note: string | null;
  /**
   * What the parts on this visit cost, as the owner records it.
   *
   * The figure the dispatcher's `parts` column has to be checked against, and
   * deliberately not read out of JobPocket's line items: a receipt exists
   * before anybody enters it, and the reconciliation is where the gap between
   * those two is supposed to show up — not somewhere it gets papered over.
   */
  partsCostCents: number | null;
  checkedAt: string;
}

/**
 * Every tick, by job number.
 *
 * The whole table in one read: it is one row per visit ever checked, which is
 * hundreds, and the page needs an answer for every row it draws. Failure is not
 * caught here — a checklist that silently forgets which rows were done is worse
 * than one that says it is broken.
 */
export async function getChecks(): Promise<Map<string, IhordCheck>> {
  const sql = requireDb();
  const rows = await sql<
    Array<{
      job_number: string;
      checked: boolean;
      note: string | null;
      parts_cost_cents: number | null;
      checked_at: Date;
    }>
  >`select job_number, checked, note, parts_cost_cents, checked_at from ihord_checks`;

  const byNumber = new Map<string, IhordCheck>();
  for (const row of rows) {
    byNumber.set(row.job_number, {
      jobNumber: row.job_number,
      checked: row.checked,
      note: row.note,
      partsCostCents: row.parts_cost_cents,
      checkedAt: row.checked_at.toISOString(),
    });
  }
  return byNumber;
}

/**
 * Tick a row, untick it, note it, or record what its parts cost.
 *
 * All four together, because they are one row and the screen writes whichever
 * of them just changed while sending the rest back unaltered.
 *
 * Unticking updates rather than deletes: the note is usually why the row was
 * reopened, and the parts figure is worth keeping whatever the tick says —
 * deleting the row would throw both away along with the tick.
 */
export async function setCheck(
  jobNumber: string,
  checked: boolean,
  note: string | null,
  partsCostCents: number | null
): Promise<void> {
  const sql = requireDb();
  await sql`
    insert into ihord_checks (job_number, checked, note, parts_cost_cents, checked_at, updated_at)
    values (${jobNumber}, ${checked}, ${note}, ${partsCostCents}, now(), now())
    on conflict (job_number) do update set
      checked          = excluded.checked,
      note             = excluded.note,
      parts_cost_cents = excluded.parts_cost_cents,
      checked_at       = excluded.checked_at,
      updated_at       = now()
  `;
}
