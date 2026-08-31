'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { money, shortDate } from '@/lib/admin/format';
import { Empty, Hint, Panel, Table, Td, Th } from '@/components/admin/ui';
import { useT } from '@/components/admin/LanguageProvider';
import type { ManualCharge, ManualChargeResult } from '@/lib/marketplace/client';

/**
 * Writing down a lead cost nothing will ever push.
 *
 * Thumbtack's webhook only goes forward. Two real leads arrived the day before
 * it was connected, and there is no backfill to fetch them with — so the cost
 * of those two, and of any lead that lands while a webhook is broken, exists
 * nowhere but on a billing page somebody has to read. This panel is the only
 * way it gets into the books.
 *
 * It is built to be used twice in a row, because that is the job in hand: a
 * successful entry keeps the date and clears everything else, so the second
 * lead of the same afternoon is an amount and a return key. What was just added
 * is echoed back with an undo beside it — the moment to take a mistyped figure
 * out is the second after typing it, not after hunting for the row.
 *
 * The type import is erased at build time, so nothing from the marketplace
 * client — which reads the operations key — reaches the browser bundle.
 */

/** The shop's date, not the server's. `en-CA` is this codebase's ISO formatter. */
function todayInShop(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.NEXT_PUBLIC_SHOP_TIMEZONE || 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function ManualLeadCost({
  provider,
  charges,
  chargedCents,
  truncated,
}: {
  /** The `LeadCostOrigin` provider key, `THUMBTACK`. Never a label. */
  provider: string;
  charges: ManualCharge[];
  chargedCents: number;
  truncated: boolean;
}) {
  const t = useT();
  const router = useRouter();

  const [day, setDay] = useState(todayInShop);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [externalId, setExternalId] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<ManualCharge | null>(null);
  const [corrected, setCorrected] = useState(false);
  const [duplicate, setDuplicate] = useState(false);

  /**
   * Rows already taken away, held here until the server list catches up.
   *
   * They are dimmed rather than hidden. `router.refresh()` re-renders the page
   * from the server and that is not instant, so hiding the row would leave a
   * total on the screen that no longer matches the rows under it — and the
   * total is JobPocket's figure, which this side does not get to adjust. What
   * the marking has to do is stop the row being deleted a second time.
   */
  const [removed, setRemoved] = useState<string[]>([]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setDuplicate(false);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      setError(t('marketplace.manual.badDay'));
      return;
    }
    // Rounded here rather than sent as dollars: money crosses the wire as whole
    // cents everywhere in this console, and a fraction of a cent arriving at
    // JobPocket means somebody sent dollars by mistake.
    const amountCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError(t('marketplace.manual.badAmount'));
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/admin/marketplace/charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          day,
          amountCents,
          description: description.trim() || undefined,
          externalId: externalId.trim() || undefined,
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | (ManualChargeResult & { error?: string })
        | null;
      // A body that did not arrive is treated as a failure even on a 200: the
      // echo below is the owner's confirmation that the figure landed, and an
      // empty one would be a claim this side cannot support.
      if (!response.ok || !result?.charge) {
        setError(result?.error ?? t('marketplace.manual.failed'));
        return;
      }

      setAdded(result.charge);
      // A lead id that had already been entered corrects the earlier row rather
      // than adding a second one, and the echo has to say so — otherwise the
      // same confirmation appears twice and the list only grows by one.
      setCorrected(result.created === false);
      setDuplicate((result.possibleDuplicates?.length ?? 0) > 0);
      // The date stays. Everything that changes lead to lead is cleared.
      setAmount('');
      setDescription('');
      setExternalId('');
      router.refresh();
    } catch {
      setError(t('marketplace.manual.noServer'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (charge: ManualCharge, confirmFirst: boolean) => {
    if (
      confirmFirst &&
      !confirm(
        t('marketplace.manual.removeConfirm', {
          amount: money(charge.amountCents, t.lang),
          day: shortDate(charge.chargedAt, t.lang),
        })
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/marketplace/charges?id=${encodeURIComponent(charge.id)}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? t('marketplace.manual.removeFailed'));
        return;
      }
      setRemoved((current) => [...current, charge.id]);
      if (added?.id === charge.id) {
        setAdded(null);
        setDuplicate(false);
      }
      router.refresh();
    } catch {
      setError(t('marketplace.manual.noServer'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title={t('marketplace.manual.title')} subtitle={t('marketplace.manual.sub')}>
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <Field label={t('marketplace.manual.day')}>
          <input
            type="date"
            value={day}
            onChange={(event) => setDay(event.target.value)}
            required
            className="h-9 rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm"
          />
        </Field>

        <Field label={t('common.amount')}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
              className="h-9 w-28 rounded-card border border-primary-500/30 bg-[#fcfcfb] pl-7 pr-3 text-sm tabular-nums"
            />
          </div>
        </Field>

        <Field label={t('marketplace.manual.what')}>
          <input
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={300}
            placeholder={t('marketplace.manual.whatPlaceholder')}
            className="h-9 w-64 rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm"
          />
        </Field>

        <Field label={t('marketplace.manual.theirId')}>
          <input
            type="text"
            value={externalId}
            onChange={(event) => setExternalId(event.target.value)}
            maxLength={120}
            className="h-9 w-44 rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm"
          />
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="h-9 rounded-card bg-ink px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-cream disabled:opacity-50"
        >
          {t('marketplace.manual.add')}
        </button>
      </form>

      <p className="mt-2 text-xs text-gray-500">{t('marketplace.manual.theirIdHint')}</p>

      <div className="mt-3 space-y-1.5 text-xs">
        {error && <p className="text-[#8f2323]">{error}</p>}

        {added && !error && (
          <p className="text-[#006300]">
            {t(corrected ? 'marketplace.manual.corrected' : 'marketplace.manual.added', {
              amount: money(added.amountCents, t.lang),
              day: shortDate(added.chargedAt, t.lang),
            })}{' '}
            <button
              type="button"
              disabled={busy}
              // No confirmation on this one: it undoes something that happened a
              // second ago and the person doing it is the person who typed it.
              onClick={() => remove(added, false)}
              className="underline decoration-primary-500/40 underline-offset-2 disabled:opacity-50"
            >
              {t('marketplace.manual.undo')}
            </button>
          </p>
        )}

        {/* Not a refusal. Two leads can cost the same on the same day, so the
            question goes to the person who was reading the billing page. */}
        {duplicate && !error && (
          <p style={{ color: '#8a5a12' }}>{t('marketplace.manual.duplicate')}</p>
        )}
      </div>

      <div className="mt-5">
        {charges.length === 0 ? (
          <Empty>{t('marketplace.manual.none')}</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('marketplace.manual.day')}</Th>
                <Th numeric>{t('common.amount')}</Th>
                <Th>{t('marketplace.manual.what')}</Th>
                <Th>{t('marketplace.manual.theirId')}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {charges.map((charge) => {
                const going = removed.includes(charge.id);
                return (
                  <tr key={charge.id} className={going ? 'opacity-40' : undefined}>
                    <Td className="text-gray-600">{shortDate(charge.chargedAt, t.lang)}</Td>
                    <Td numeric>{money(charge.amountCents, t.lang)}</Td>
                    <Td className="text-gray-600">{charge.description ?? '—'}</Td>
                    <Td className="text-gray-500">{charge.externalId ?? '—'}</Td>
                    <Td className="text-right">
                      {going ? (
                        <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
                          {t('marketplace.manual.removing')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => remove(charge, true)}
                          className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500 underline decoration-primary-500/30 underline-offset-2 hover:text-ink disabled:opacity-50"
                        >
                          {t('marketplace.manual.remove')}
                        </button>
                      )}
                    </Td>
                  </tr>
                );
              })}
              <tr>
                <Td className="font-medium">{t('marketplace.manual.total')}</Td>
                <Td numeric className="font-medium">
                  {money(chargedCents, t.lang)}
                </Td>
                <Td />
                <Td />
                <Td />
              </tr>
            </tbody>
          </Table>
        )}
      </div>

      {truncated && <Hint>{t('marketplace.manual.truncated')}</Hint>}

      <Hint>{t('marketplace.manual.hint')}</Hint>
    </Panel>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}
