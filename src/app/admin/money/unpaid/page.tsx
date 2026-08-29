import Link from 'next/link';
import { money, percent, shortDate } from '@/lib/admin/format';
import { getUnpaid } from '@/lib/money/client';
import { OperationsApiError } from '@/lib/bookings/client';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { NotConnected } from '@/components/admin/NotConnected';
import { RankedBars } from '@/components/admin/charts';
import { Pager } from '@/components/admin/Pager';
import { STATUS } from '@/components/admin/palette';
import { serverTranslator } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

/**
 * Age as ordered severity, not as a category.
 *
 * The same four colours carry the buckets in the chart and the days in the
 * table, so a reader learns one encoding rather than two.
 */
const AGE_COLOURS = [STATUS.good, STATUS.warning, STATUS.serious, STATUS.critical];

function ageColour(days: number): string {
  return days > 90 ? AGE_COLOURS[3]! : days > 60 ? AGE_COLOURS[2]! : days > 30 ? AGE_COLOURS[1]! : AGE_COLOURS[0]!;
}

export default async function UnpaidPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const t = serverTranslator();
  const bucket = (searchParams.bucket as string) || undefined;
  const offset = Number(searchParams.offset ?? 0) || 0;

  let report: Awaited<ReturnType<typeof getUnpaid>> | null = null;
  let unconfigured = false;
  let failure: string | null = null;

  try {
    report = await getUnpaid({ bucket, offset });
  } catch (error) {
    if (error instanceof OperationsApiError) {
      if (error.code === 'not_configured') unconfigured = true;
      else failure = error.message;
    } else {
      return <SetupNotice error={error} />;
    }
  }

  if (unconfigured) {
    return (
      <div className="space-y-6">
        <Header />
        <NotConnected what={t('money.notConnected')} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Header />
        <Warning>{failure ?? t('money.noAnswer')}</Warning>
      </div>
    );
  }

  const oldest = report.jobs[0] ?? null;
  const over60 = report.aging.days60.cents + report.aging.days90.cents;

  const buckets = [
    { label: t('money.ageUnder30'), value: report.aging.current.cents / 100, jobs: report.aging.current.jobs, colour: AGE_COLOURS[0]! },
    { label: t('money.age30to60'), value: report.aging.days30.cents / 100, jobs: report.aging.days30.jobs, colour: AGE_COLOURS[1]! },
    { label: t('money.age60to90'), value: report.aging.days60.cents / 100, jobs: report.aging.days60.jobs, colour: AGE_COLOURS[2]! },
    { label: t('money.ageOver90'), value: report.aging.days90.cents / 100, jobs: report.aging.days90.jobs, colour: AGE_COLOURS[3]! },
  ];

  return (
    <div className="space-y-6">
      <Header />
      {failure ? <Warning>{failure}</Warning> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t('unpaid.owed')}
          value={money(report.outstanding.totalCents, t.lang)}
          emphasis
          higherIsBetter={false}
          hint={t.plural(report.outstanding.jobs, 'plural.invoice')}
        />
        <StatTile
          label={t('unpaid.yoursOfIt')}
          value={money(report.outstanding.ownShareCents, t.lang)}
          emphasis
          // The gross figure is a hole twice the size of the real one on a
          // dispatcher-heavy account: half of a split ticket was never yours.
          hint={t('money.afterDispatchersShare')}
        />
        <StatTile
          label={t('unpaid.over60')}
          value={money(over60, t.lang)}
          higherIsBetter={false}
          hint={
            report.outstanding.totalCents
              ? t('money.ofWhatIsOwed', {
                  pct: percent(over60 / report.outstanding.totalCents, 0, t.lang),
                })
              : undefined
          }
        />
        <StatTile
          label={t('unpaid.oldest')}
          value={oldest ? t.plural(oldest.daysOwed, 'plural.day') : '—'}
          higherIsBetter={false}
          hint={oldest?.clientName ?? undefined}
        />
      </div>

      <Panel title={t('unpaid.howOld')} subtitle={t('money.measuredToToday')}>
        {report.outstanding.jobs > 0 ? (
          <RankedBars
            format="money"
            items={buckets.map((bucket) => ({
              label: bucket.label,
              value: bucket.value,
              color: bucket.colour,
              note: t.plural(bucket.jobs, 'plural.invoice'),
            }))}
          />
        ) : (
          <Empty>{t('money.nothingOutstandingLong')}</Empty>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* The chart shows the shape; these open it. */}
          {[
            { k: '', l: t('unpaid.all') },
            { k: 'current', l: t('unpaid.under30') },
            { k: 'days30', l: t('unpaid.31to60') },
            { k: 'days60', l: t('unpaid.61to90') },
            { k: 'days90', l: t('unpaid.over90') },
          ].map((band) => (
            <Link
              key={band.k || 'all'}
              href={band.k ? `/admin/money/unpaid?bucket=${band.k}` : '/admin/money/unpaid'}
              className={`rounded-card border px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label transition-colors ${
                (bucket ?? '') === band.k
                  ? 'border-ink bg-ink text-cream'
                  : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
              }`}
            >
              {band.l}
            </Link>
          ))}
        </div>
        <Hint>{t('money.unpaidNoWindowHint')}</Hint>
      </Panel>

      <Panel
        title={t('unpaid.everyInvoice')}
        subtitle={t('money.oldestFirst')}
        action={
          <a
            href="/api/admin/export?type=unpaid"
            className="inline-flex h-8 items-center rounded-card border border-primary-500/30 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink"
          >
            {t('common.exportCsv')}
          </a>
        }
      >
        {report.jobs.length === 0 ? (
          <Empty>{t('unpaid.nothing')}</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('common.client')}</Th>
                <Th>{t('common.job')}</Th>
                <Th>{t('unpaid.finished')}</Th>
                <Th numeric>{t('common.days')}</Th>
                <Th numeric>{t('common.invoice')}</Th>
                <Th numeric>{t('common.yours')}</Th>
              </tr>
            </thead>
            <tbody>
              {report.jobs.map((job) => (
                <tr key={job.id}>
                  <Td>{job.clientName ?? '—'}</Td>
                  <Td>
                    <Link
                      href={`/admin/calendar/${job.id}`}
                      className="text-ink underline decoration-primary-500/40 underline-offset-2 hover:text-primary-600"
                    >
                      {job.jobNumber ?? t('common.job')}
                    </Link>
                    <span className="ml-2 text-[11px] text-gray-500">{job.brandName}</span>
                  </Td>
                  <Td className="text-gray-600">
                    {job.completedAt ? shortDate(new Date(job.completedAt), t.lang) : '—'}
                  </Td>
                  <Td numeric>
                    <span style={{ color: ageColour(job.daysOwed) }} className="font-medium">
                      {job.daysOwed}
                    </span>
                  </Td>
                  <Td numeric>{money(job.totalCents, t.lang)}</Td>
                  <Td numeric className="text-gray-600">
                    {money(job.ownShareCents, t.lang)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pager
          base={`/admin/money/unpaid${bucket ? `?bucket=${bucket}` : ''}`}
          offset={report.offset}
          shown={report.jobs.length}
          total={report.total}
          hasMore={report.hasMore}
        />
        <Hint>{t('money.writeOffHint')}</Hint>
      </Panel>
    </div>
  );
}

function Header() {
  const t = serverTranslator();
  return (
    <div>
      <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
        {t('unpaid.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-600">{t('unpaid.subtitle')}</p>
    </div>
  );
}
