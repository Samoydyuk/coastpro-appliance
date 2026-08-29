import Link from 'next/link';
import { parseRange } from '@/lib/admin/range';
import { rangeLabel } from '@/lib/i18n/range';
import { count, money, percent } from '@/lib/admin/format';
import { getTechnicianProfiles, type TechnicianProfile } from '@/lib/money/client';
import { OperationsApiError } from '@/lib/bookings/client';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { NotConnected } from '@/components/admin/NotConnected';
import { serverTranslator } from '@/lib/i18n/server';
import { STATUS } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

/**
 * Each technician, and what the books say about improving on them.
 *
 * The advice comes from JobPocket, already carrying the numbers it was drawn
 * from, and this page does not add to it. That is deliberate: a console that
 * writes its own recommendations is a console inventing a second opinion about
 * the same data, and the first one somebody disagrees with is the last one
 * anybody reads.
 */
export default async function TechnicianProfilePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const t = serverTranslator();
  const range = parseRange({
    range: searchParams.range as string,
    from: searchParams.from as string,
    to: searchParams.to as string,
  });

  let report: Awaited<ReturnType<typeof getTechnicianProfiles>> | null = null;
  let unconfigured = false;
  let failure: string | null = null;

  try {
    report = await getTechnicianProfiles(range.from, range.to);
  } catch (error) {
    if (error instanceof OperationsApiError) {
      if (error.code === 'not_configured') unconfigured = true;
      else failure = error.message;
    } else {
      return <SetupNotice error={error} />;
    }
  }

  const header = (
    <div>
      <Link
        href={`/admin/money/technicians?range=${range.key}`}
        className="font-heading text-[10px] uppercase tracking-label text-gray-500 hover:text-ink"
      >
        {t('common.back')}
      </Link>
      <h1 className="mt-1 font-heading text-xl font-bold uppercase tracking-label text-ink">
        {t('profile.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        {rangeLabel(range, t)} · {report?.creditRule ?? ''}
      </p>
    </div>
  );

  if (unconfigured) {
    return (
      <div className="space-y-6">
        {header}
        <NotConnected what={t('money.notConnected')} />
      </div>
    );
  }
  if (!report) {
    return (
      <div className="space-y-6">
        {header}
        <Warning>{failure ?? t('money.noAnswer')}</Warning>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}
      {failure ? <Warning>{failure}</Warning> : null}

      {report.technicians.length === 0 ? (
        <Panel title={t('profile.title')}>
          <Empty>{t('profile.noWork')}</Empty>
        </Panel>
      ) : (
        report.technicians.map((tech) => (
          <Person key={tech.techId ?? 'you'} tech={tech} account={report.account} t={t} range={range.key} />
        ))
      )}

      <Hint>{t('profile.hint')}</Hint>
    </div>
  );
}

function Person({
  tech,
  account,
  t,
  range,
}: {
  tech: TechnicianProfile;
  account: { jobs: number; attachPct: number; avgTicketCents: number };
  t: ReturnType<typeof serverTranslator>;
  range: string;
}) {
  return (
    <Panel
      title={tech.name}
      subtitle={`${t.plural(tech.jobs, 'plural.job')} · ${money(tech.ownShareRevenueCents, t.lang)}`}
      action={
        tech.techId ? (
          <Link
            href={`/admin/money/jobs?range=${range}&techId=${tech.techId}&title=${encodeURIComponent(tech.name)}&back=/admin/money/technicians/profile`}
            className="inline-flex h-8 items-center rounded-card border border-primary-500/30 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink"
          >
            {t('common.detail')}
          </Link>
        ) : undefined
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t('money.avgTicket')} value={money(tech.avgTicketCents, t.lang)} />
        <StatTile
          label={t('profile.partsRate')}
          value={`${tech.partsAttachPct}%`}
          // Against the rest of the same books, which is the only fair
          // comparison — a trade average from somewhere else is not evidence.
          hint={t('profile.againstBooks', { pct: String(account.attachPct) })}
          higherIsBetter
        />
        <StatTile
          label={t('profile.serviceCalls')}
          value={count(tech.serviceCallOnly, t.lang)}
          higherIsBetter={false}
          hint={t('profile.serviceCallsHint')}
        />
        <StatTile
          label={t('profile.time')}
          value={tech.avgActualMinutes ? `${tech.avgActualMinutes} min` : '—'}
          higherIsBetter={false}
          hint={t('profile.booked', { n: String(tech.avgEstimatedMinutes) })}
        />
      </div>

      {tech.advice.length > 0 && (
        <div className="mt-4 space-y-2">
          {tech.advice.map((item) => (
            <div
              key={item.key}
              className="rounded-card border-l-2 bg-[#f8f7f4] px-3 py-2 text-xs leading-relaxed text-ink"
              style={{
                borderLeftColor: item.severity === 'high' ? STATUS.serious : STATUS.warning,
              }}
            >
              {item.finding}
              {item.worthCents ? (
                <span className="ml-2 font-medium">
                  {t('profile.worth', { amount: money(item.worthCents, t.lang) })}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Cut title={t('profile.byAppliance')} t={t}>
          {tech.byType.map((row) => (
            <tr key={row.type}>
              <Td>{row.type}</Td>
              <Td numeric className="text-gray-600">
                {count(row.jobs, t.lang)}
              </Td>
              <Td numeric>{money(row.revenueCents, t.lang)}</Td>
            </tr>
          ))}
        </Cut>

        <Cut title={t('profile.byMake')} t={t}>
          {tech.byAppliance.slice(0, 8).map((row) => (
            <tr key={row.brand}>
              <Td>{row.brand}</Td>
              <Td numeric className="text-gray-600">
                {count(row.jobs, t.lang)}
              </Td>
              <Td numeric />
            </tr>
          ))}
          {tech.applianceUnrecorded > 0 && (
            <tr>
              <Td className="text-gray-500">{t('profile.makeUnrecorded')}</Td>
              <Td numeric>
                <span style={{ color: STATUS.warning }}>
                  {count(tech.applianceUnrecorded, t.lang)}
                </span>
              </Td>
              <Td numeric />
            </tr>
          )}
        </Cut>

        <Cut title={t('profile.byDispatcher')} t={t}>
          {tech.byDispatcher.map((row) => (
            <tr key={row.name}>
              <Td>{row.name}</Td>
              <Td numeric className="text-gray-600">
                {row.keptPct === null ? '—' : `${row.keptPct}%`}
              </Td>
              <Td numeric>{money(row.keptCents, t.lang)}</Td>
            </tr>
          ))}
        </Cut>
      </div>
    </Panel>
  );
}

/** One small three-column cut, used three times with different contents. */
function Cut({
  title,
  t,
  children,
}: {
  title: string;
  t: ReturnType<typeof serverTranslator>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="pb-1 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
        {title}
      </div>
      <Table>
        <tbody>{children}</tbody>
      </Table>
      <span className="sr-only">{t('common.detail')}</span>
    </div>
  );
}
