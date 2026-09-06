'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ShieldOff, Clock, FileText, Camera, ArrowUpRight } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import type { Visit } from '@/lib/customer/client';
import { siteConfig } from '@/data/site-config';

const CUSTOMER_SUPPLIED_PARTS_NOTE =
  'Warranty does not cover parts supplied by the customer.';

function longDate(iso: string | null, timeZone: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone,
  });
}

function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * What the warranty says, in a sentence a person can act on.
 *
 * Whether the work is finished is asked FIRST, and that order is the whole
 * point. The list deliberately includes visits that have not happened yet —
 * SCHEDULED, IN_PROGRESS and PAUSED are all in the endpoint's status filter —
 * and a job booked for next Tuesday has no invoice, so it has no warranty days
 * either. Asking "are there any days?" first told that customer "No warranty
 * recorded for this visit", on the page they opened to check their cover, about
 * a repair nobody has carried out, and invited them to ring and argue about
 * paperwork that does not exist yet.
 *
 * The other rule worth keeping: a finished visit where nobody recorded a
 * warranty says exactly that, rather than falling back on the ninety days the
 * rest of the site advertises. Printing a number we cannot evidence, on a page
 * a customer may later wave at us, is not a kindness.
 */
function warrantyLine(visit: Visit, timeZone: string): {
  tone: 'good' | 'over' | 'none' | 'pending';
  headline: string;
  detail: string | null;
} {
  const { warranty } = visit;
  const bothDays = warranty.partsDays ?? warranty.laborDays;

  // Not finished: the warranty has not started, which is a different thing
  // from having none.
  if (!warranty.startsOn) {
    if (bothDays == null) {
      return {
        tone: 'pending',
        headline: 'Booked — warranty starts when the work is done',
        detail: 'The cover is written on your invoice and will show here afterwards.',
      };
    }
    return {
      tone: 'pending',
      headline: 'Warranty starts when the work is finished',
      detail:
        warranty.partsDays === warranty.laborDays
          ? `${bothDays} days from that date.`
          : `Parts ${warranty.partsDays ?? 0} days, labour ${warranty.laborDays ?? 0} days.`,
    };
  }

  if (warranty.partsDays == null && warranty.laborDays == null) {
    return {
      tone: 'none',
      headline: 'No warranty recorded for this visit',
      detail: `If you think that is wrong, call ${siteConfig.contact.phone} — we can check the paperwork.`,
    };
  }

  const ends = [warranty.partsUntil, warranty.laborUntil].filter(Boolean) as string[];
  const last = ends.sort()[ends.length - 1] ?? null;

  if (!warranty.active) {
    return {
      tone: 'over',
      headline: `Warranty ended ${longDate(last, timeZone)}`,
      detail: `Call ${siteConfig.contact.phone} anyway — a fault that looks like the old one is worth a look.`,
    };
  }

  const sameLength =
    warranty.partsDays === warranty.laborDays || !warranty.partsUntil || !warranty.laborUntil;

  if (sameLength) {
    const left = daysLeft(last);
    return {
      tone: 'good',
      headline: `Under warranty until ${longDate(last, timeZone)}`,
      detail: left != null && left > 0 ? `${left} day${left === 1 ? '' : 's'} left.` : null,
    };
  }

  return {
    tone: 'good',
    headline: 'Under warranty',
    detail:
      `Parts until ${longDate(warranty.partsUntil, timeZone)} · `
      + `Labour until ${longDate(warranty.laborUntil, timeZone)}`,
  };
}

const TONE: Record<string, { border: string; text: string; Icon: typeof ShieldCheck }> = {
  good: { border: 'border-primary-700/40 bg-primary-700/5', text: 'text-primary-800', Icon: ShieldCheck },
  over: { border: 'border-primary-500/25', text: 'text-gray-600', Icon: ShieldOff },
  none: { border: 'border-primary-500/25', text: 'text-gray-600', Icon: ShieldOff },
  pending: { border: 'border-primary-500/25', text: 'text-gray-600', Icon: Clock },
};

export function VisitCard({ visit, timeZone }: { visit: Visit; timeZone: string }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  // The route now answers 200 only when the callback really reached the shop —
  // anything else is an error the customer is told about, rather than a quiet
  // "we have it" for a message that went nowhere. What comes back with the 200
  // is whether the warranty was live, which decides what we may promise about
  // the price.
  const [sent, setSent] = useState<{ underWarranty: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const w = warrantyLine(visit, timeZone);
  const tone = TONE[w.tone];
  const when = visit.completedAt ?? visit.scheduledAt;

  async function fileCallback(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/my/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: visit.id, description }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? 'Something went wrong. Please call us.');
        return;
      }
      setSent({ underWarranty: Boolean(body?.warrantyActive) });
    } catch {
      setError(`We could not send that. Please call ${siteConfig.contact.phone}.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <div>
            <h2 className="font-heading text-lg font-bold uppercase tracking-tight text-ink">
              {visit.title || 'Service visit'}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {longDate(when, timeZone)}
              {visit.jobNumber ? ` · ${visit.jobNumber}` : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="font-heading text-lg font-bold text-ink">{usd(visit.totalCents)}</p>
            {visit.balanceCents > 0 && (
              <p className="mt-0.5 text-sm text-red-800">{usd(visit.balanceCents)} outstanding</p>
            )}
          </div>
        </div>

        {(visit.diagnosis || visit.resolution) && (
          <div className="mt-5 space-y-2 border-t border-primary-500/20 pt-5">
            {visit.diagnosis && (
              <p className="text-[15px] leading-relaxed text-gray-600">
                <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                  Found:{' '}
                </span>
                {visit.diagnosis}
              </p>
            )}
            {visit.resolution && (
              <p className="text-[15px] leading-relaxed text-gray-600">
                <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                  Fixed:{' '}
                </span>
                {visit.resolution}
              </p>
            )}
          </div>
        )}

        <div className={`mt-5 border ${tone.border} p-4`}>
          <div className="flex items-start gap-3">
            <tone.Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone.text}`} strokeWidth={1.5} />
            <div>
              <p className={`font-heading text-[12px] font-semibold uppercase tracking-label ${tone.text}`}>
                {w.headline}
              </p>
              {w.detail && <p className="mt-1.5 text-sm text-gray-600">{w.detail}</p>}
              {w.tone !== 'none' && (
                <p className="mt-2 text-[13px] text-gray-500">{CUSTOMER_SUPPLIED_PARTS_NOTE}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {visit.reportToken && (
            <Link href={`/report/${visit.reportToken}`}>
              <Button size="sm" variant="outline" leftIcon={<FileText className="h-3.5 w-3.5" />}>
                Full report
              </Button>
            </Link>
          )}

          {!sent && (
            <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
              It has broken again
            </Button>
          )}

          <Link href="/book-appointment" className="ml-auto">
            <Button size="sm" variant="ghost" rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}>
              Book another visit
            </Button>
          </Link>

          {visit.photoCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-500">
              <Camera className="h-3.5 w-3.5" strokeWidth={1.5} />
              {visit.photoCount} photo{visit.photoCount === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {sent && (
          <p className="mt-5 border border-primary-700/40 bg-primary-700/5 p-4 text-sm text-primary-800">
            We have it. Someone will call you about this repair — you do not need to book anything.{' '}
            {sent.underWarranty
              ? 'The return visit is covered by your warranty.'
              : 'The warranty on this repair has run out, so we will agree the price with you before any work starts.'}
          </p>
        )}

        {open && !sent && (
          <form onSubmit={fileCallback} className="mt-5 border-t border-primary-500/20 pt-5">
            <label
              htmlFor={`what-${visit.id}`}
              className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink"
            >
              What is it doing?
            </label>
            <p className="mt-1.5 mb-3 text-sm text-gray-600">
              This goes straight to us marked as a callback on this repair — not as a new job.
            </p>
            <textarea
              id={`what-${visit.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-card border border-primary-500/25 bg-cream-light p-3 text-[15px] text-ink focus:border-ink focus:outline-none"
              placeholder="Same noise as before, started again on Tuesday…"
            />
            {error && <p className="mt-3 text-sm text-red-800">{error}</p>}
            <div className="mt-3">
              <Button type="submit" size="sm" isLoading={busy}>
                Send it
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
