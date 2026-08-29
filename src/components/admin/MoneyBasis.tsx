import Link from 'next/link';
import { money, percent } from '@/lib/admin/format';
import { Panel, Table, Td, Th } from '@/components/admin/ui';
import { serverTranslator } from '@/lib/i18n/server';

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
  const t = serverTranslator();
  const share =
    invoicedCents && invoicedCents > 0 ? attributedCents / invoicedCents : null;

  return (
    <Panel title={t('money.basis.title')}>
      <Table>
        <thead>
          <tr>
            <Th>{t('money.basis.figure')}</Th>
            <Th numeric>{t('common.amount')}</Th>
            <Th>{t('money.basis.answers')}</Th>
          </tr>
        </thead>
        <tbody>
          {invoicedCents !== undefined && (
            <tr>
              <Td>{t('money.basis.invoiced')}</Td>
              <Td numeric className="font-medium">
                {money(invoicedCents, t.lang)}
              </Td>
              <Td className="text-gray-600">{t('money.basis.invoicedAnswer')}</Td>
            </tr>
          )}
          <tr>
            <Td>{t('money.basis.traceable')}</Td>
            <Td numeric className="font-medium">
              {money(attributedCents, t.lang)}
              {share !== null ? (
                <span className="ml-2 text-[11px] font-normal text-gray-500">
                  {percent(share, 0, t.lang)}
                </span>
              ) : null}
            </Td>
            <Td className="text-gray-600">{t('money.basis.traceableAnswer')}</Td>
          </tr>
          <tr>
            <Td>{t('money.basis.reported')}</Td>
            <Td numeric className="font-medium">
              {money(reportedCents, t.lang)}
            </Td>
            <Td className="text-gray-600">{t('money.basis.reportedAnswer')}</Td>
          </tr>
        </tbody>
      </Table>

      <p className="mt-3 text-xs leading-relaxed text-gray-600">
        {t('money.basis.note')}{' '}
        {/* The link carries a whole sentence rather than one word: which word
            the link falls on is not the same in both languages. */}
        <Link href="/admin/money" className="text-ink underline underline-offset-2">
          {t('money.basis.wholePicture')}
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
  const t = serverTranslator();
  return (
    <p className="text-xs leading-relaxed text-gray-600">
      {t('money.basis.line', {
        attributed: money(attributedCents, t.lang),
        reported: money(reportedCents, t.lang),
      })}{' '}
      {/* A whole sentence, not the word "Money": Ukrainian does not put the
          section name where English does. */}
      <Link href="/admin/money" className="text-ink underline underline-offset-2">
        {t('money.basis.businessTotal')}
      </Link>
    </p>
  );
}
