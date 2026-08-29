import Link from 'next/link';
import { money, percent } from '@/lib/admin/format';
import { Panel, Table, Td, Th } from '@/components/admin/ui';

/**
 * Three revenue figures, and why they will never agree.
 *
 * The console now holds all three, and left unlabelled they look like one
 * number that keeps changing:
 *
 * - **Invoiced** — every job JobPocket billed for, whoever sent it.
 * - **Traceable** — the part of that which began as a website enquiry or a
 *   call to a tracked number. Dispatcher work, calls to the shop's own line
 *   and customers who already had it arrive with nothing to attribute, so this
 *   can never reach the first.
 * - **Reported to Google Ads** — frozen when the job was marked won, and
 *   deliberately never amended. `src/lib/jobpocket.ts` enforces that in SQL:
 *   "a figure already sent to a third party must never be quietly rewritten".
 *   This component is the console finally holding up its end of that sentence.
 *
 * The vocabulary is what actually does the work: `value_cents` is never called
 * "revenue" anywhere again — it is "marked" or "reported". JobPocket money is
 * "billed" or "invoiced". One word per number, in tiles, headers and CSV alike.
 */
export function MoneyBasis({
  invoicedCents,
  attributedCents,
  reportedCents,
}: {
  /** The whole business, from JobPocket. Omit where the page cannot ask. */
  invoicedCents?: number;
  attributedCents: number;
  reportedCents: number;
}) {
  const share =
    invoicedCents && invoicedCents > 0 ? attributedCents / invoicedCents : null;

  return (
    <Panel title="Three revenue figures, three different questions">
      <Table>
        <thead>
          <tr>
            <Th>Figure</Th>
            <Th numeric>Amount</Th>
            <Th>What it answers</Th>
          </tr>
        </thead>
        <tbody>
          {invoicedCents !== undefined && (
            <tr>
              <Td>Invoiced in JobPocket</Td>
              <Td numeric className="font-medium">
                {money(invoicedCents)}
              </Td>
              <Td className="text-gray-600">All the work, whoever it came from.</Td>
            </tr>
          )}
          <tr>
            <Td>Traceable to an enquiry</Td>
            <Td numeric className="font-medium">
              {money(attributedCents)}
              {share !== null ? (
                <span className="ml-2 text-[11px] font-normal text-gray-500">
                  {percent(share, 0)}
                </span>
              ) : null}
            </Td>
            <Td className="text-gray-600">
              The jobs that began as a website form or a call to a tracked number.
            </Td>
          </tr>
          <tr>
            <Td>Reported to Google Ads</Td>
            <Td numeric className="font-medium">
              {money(reportedCents)}
            </Td>
            <Td className="text-gray-600">
              Fixed when the job was marked won. Never amended.
            </Td>
          </tr>
        </tbody>
      </Table>

      <p className="mt-3 text-xs leading-relaxed text-gray-600">
        These do not add up, and they are not meant to. The first is the business. The second is the
        part of it advertising can be judged on — dispatcher work, calls to the shop&apos;s own
        number and customers who already had it arrive with nothing to trace, so channel revenue can
        never reach the business total. The third is the figure Google Ads holds: it was uploaded
        against a click on the day the job was marked won and cannot be amended from here, so it
        stays where it is and the invoice figure is shown beside it rather than written over it.{' '}
        <Link href="/admin/money" className="text-ink underline underline-offset-2">
          The whole picture is under Money.
        </Link>
      </p>
    </Panel>
  );
}

/**
 * The same point in one sentence, for pages where the panel would be too heavy.
 *
 * Goes at the *head* of a marketing screen — before the reader believes a
 * number — where the full panel goes at the foot of Profit, after they have one.
 */
export function MoneyBasisLine({
  attributedCents,
  reportedCents,
}: {
  attributedCents: number;
  reportedCents: number;
}) {
  return (
    <p className="text-xs leading-relaxed text-gray-600">
      Revenue here is real invoice money, and it covers only the work that started as an enquiry or
      a call to a tracked number — {money(attributedCents)}. Anything from a dispatcher, from the
      shop&apos;s own line, or from a customer who already had us has nothing to attribute it to.
      The figure Google Ads holds is different again — {money(reportedCents)} — because it was fixed
      when each job was marked won.{' '}
      <Link href="/admin/money" className="text-ink underline underline-offset-2">
        Money
      </Link>{' '}
      has the business total.
    </p>
  );
}
