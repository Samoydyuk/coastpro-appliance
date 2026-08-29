'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang, useT } from '@/components/admin/LanguageProvider';
import { numberLocale } from '@/lib/i18n';

/**
 * Putting a visit in the diary because somebody rang.
 *
 * It goes in by the same door as a booking from the website — filed as a
 * request, then accepted — so a job booked here and a job booked by a customer
 * are the same kind of job, with the same numbering and the same shape. There
 * is no second way to make one.
 *
 * The arrival windows are what the booking page is offering, shown as a
 * convenience. They are not a limit: the owner can type any time at all, which
 * is the difference between their diary and a customer's request.
 */

const field = 'h-9 w-full rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm';

interface ArrivalWindow {
  label: string;
  startISO: string;
  endISO: string;
}

interface Service {
  id: string;
  name: string;
}

/**
 * The next `count` days, as YYYY-MM-DD in the reader's own timezone.
 *
 * `value` is the day the API is asked for and never moves with the language;
 * the two labels are only what the chip reads.
 */
function nextDays(count: number, locale: string) {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
    return {
      value,
      isToday: i === 0,
      weekday: date.toLocaleDateString(locale, { weekday: 'short' }),
      day: date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
    };
  });
}

export function BookJobForm({ services }: { services: Service[] }) {
  const t = useT();
  const lang = useLang();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [service, setService] = useState('');
  const [description, setDescription] = useState('');

  // Rebuilt when the language changes: the switch refreshes the server
  // components without unmounting this one, so a ref would keep the old names.
  const days = useMemo(() => nextDays(14, numberLocale(lang)), [lang]);
  const [date, setDate] = useState(days[0].value);
  const [windows, setWindows] = useState<ArrivalWindow[]>([]);
  const [loadingWindows, setLoadingWindows] = useState(false);
  const [picked, setPicked] = useState<ArrivalWindow | null>(null);
  const [exactTime, setExactTime] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  /** One id per filled-in form, so a double click is not a second van. */
  const externalId = useRef(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `console-${crypto.randomUUID()}`
      : `console-${Date.now()}`
  );

  useEffect(() => {
    let cancelled = false;
    setLoadingWindows(true);
    setPicked(null);

    fetch(`/api/booking/windows?date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setWindows(d.windows ?? []);
      })
      .catch(() => {
        if (!cancelled) setWindows([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingWindows(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setDone(null);

    // A window if one was picked; otherwise whatever was typed; otherwise no
    // time at all, which is a job to ring about rather than an error.
    const start = picked?.startISO ?? (exactTime ? new Date(exactTime).toISOString() : undefined);
    const end = picked?.endISO;

    try {
      const response = await fetch('/api/admin/bookings/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalId: externalId.current,
          name,
          phone,
          address,
          service: services.find((s) => s.id === service)?.name,
          description,
          scheduledStart: start,
          scheduledEnd: end,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { error?: string; jobId?: string }
        | null;

      if (!response.ok) {
        // The server's own wording when it has one.
        setError(body?.error ?? t('work.book.failed'));
        return;
      }

      setDone(t('work.book.done'));
      setName('');
      setPhone('');
      setAddress('');
      setDescription('');
      setPicked(null);
      setExactTime('');
      // A fresh id, or the next booking would be treated as a retry of this one.
      externalId.current = `console-${crypto.randomUUID()}`;
      router.refresh();
    } catch {
      setError(t('work.form.noServer'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Labelled label={t('work.book.name')}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={field}
            placeholder={t('work.book.namePlaceholder')}
          />
        </Labelled>
        <Labelled label={t('work.book.phone')}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            type="tel"
            className={field}
            placeholder="(949) 555-0101"
          />
        </Labelled>
        <Labelled label={t('work.book.address')}>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={field}
            placeholder="12 Bay Street, Irvine"
          />
        </Labelled>
        <Labelled label={t('work.book.service')}>
          <select value={service} onChange={(e) => setService(e.target.value)} className={field}>
            <option value="">{t('work.book.notSureYet')}</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Labelled>
      </div>

      <Labelled label={t('work.book.problem')}>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={field}
          placeholder={t('work.book.problemPlaceholder')}
        />
      </Labelled>

      <div>
        <div className="font-heading text-[10px] uppercase tracking-label text-gray-500">
          {t('work.book.when')}
        </div>

        {/* -mx-1/px-1 so the focus ring of the first chip is not clipped */}
        <div className="mt-2 flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-2">
          {days.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDate(d.value)}
              className={`shrink-0 rounded-card border px-2.5 py-2 text-center transition-colors ${
                date === d.value
                  ? 'border-ink bg-ink text-cream'
                  : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
              }`}
            >
              <span className="block font-heading text-[9px] font-semibold uppercase tracking-label">
                {d.isToday ? t('work.form.today') : d.weekday}
              </span>
              <span className="mt-0.5 block text-xs">{d.day}</span>
            </button>
          ))}
        </div>

        {loadingWindows ? (
          <p className="text-xs text-gray-600">{t('work.form.checkingCalendar')}</p>
        ) : windows.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {windows.map((w) => (
              <button
                key={w.startISO}
                type="button"
                onClick={() => {
                  setPicked(picked?.startISO === w.startISO ? null : w);
                  setExactTime('');
                }}
                className={`rounded-card border px-2 py-2 font-heading text-[10px] font-semibold uppercase tracking-label transition-colors ${
                  picked?.startISO === w.startISO
                    ? 'border-ink bg-ink text-cream'
                    : 'border-primary-500/25 text-ink hover:border-ink'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-600">{t('work.book.noWindows')}</p>
        )}

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <Labelled label={t('work.form.ownTime')}>
            <input
              type="datetime-local"
              value={exactTime}
              onChange={(e) => {
                setExactTime(e.target.value);
                setPicked(null);
              }}
              className={field}
            />
          </Labelled>
          <p className="pb-2 text-xs text-gray-600">{t('work.book.notLimited')}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-primary-500/15 pt-4">
        <button
          type="submit"
          disabled={busy || !name.trim() || !phone.trim()}
          className="h-9 rounded-card bg-ink px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-cream disabled:opacity-50"
        >
          {busy ? t('work.book.submitting') : t('work.book.submit')}
        </button>
        {error && <span className="text-xs" style={{ color: '#8f2323' }}>{error}</span>}
        {done && <span className="text-xs" style={{ color: '#006300' }}>{done}</span>}
      </div>
    </form>
  );
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}
