'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { channelLabel } from '@/lib/attribution';
import { count } from '@/lib/admin/format';
import { useT } from '@/components/admin/LanguageProvider';
import type { Translator } from '@/lib/i18n';
import { Empty, Hint, Panel, Table, Td, Th } from '@/components/admin/ui';
import { STATUS, channelColor } from '@/components/admin/palette';

/**
 * Who is on the site right now.
 *
 * Polled rather than streamed: a console with one viewer does not need a
 * persistent connection, and a plain request every ten seconds cannot get stuck
 * in a half-open state that quietly stops updating.
 */

interface LiveSession {
  id: string;
  channel: string | null;
  campaign: string | null;
  city: string | null;
  region: string | null;
  device: string | null;
  landing_path: string | null;
  current_path: string | null;
  pageviews: number;
  started_at: string;
  last_seen_at: string;
  converted: boolean;
}

interface LiveEvent {
  type: string;
  label: string | null;
  path: string | null;
  ts: string;
  channel: string | null;
  city: string | null;
}

const NOTABLE = new Set(['click_phone', 'form_submit', 'calendly_booked']);

/**
 * What the visitor did, as a verb phrase.
 *
 * The event type is the key and stays in English; only the phrase is
 * translated, and it is handed to the sentence below as one placeholder —
 * Ukrainian does not put the verb where English does.
 */
function eventAction(t: Translator, type: string): string {
  switch (type) {
    case 'click_phone':
      return t('website.live.act.clickPhone');
    case 'form_start':
      return t('website.live.act.formStart');
    case 'form_submit':
      return t('website.live.act.formSubmit');
    case 'calendly_booked':
      return t('website.live.act.calendlyBooked');
    case 'rage_click':
      return t('website.live.act.rageClick');
    case 'js_error':
      return t('website.live.act.jsError');
    default:
      return type;
  }
}

/** The value in the database stays 'mobile' / 'tablet' / 'desktop'. */
function deviceLabel(t: Translator, device: string | null): string {
  switch (device) {
    case 'mobile':
      return t('website.device.mobile');
    case 'tablet':
      return t('website.device.tablet');
    case 'desktop':
      return t('website.device.desktop');
    case 'unknown':
      return t('website.device.unknown');
    default:
      return device || '—';
  }
}

/**
 * How long ago, in the reader's language.
 *
 * `relativeTime` in format.ts writes "ago" and takes no language — on a feed
 * made of sentences that one English word is read as a word, so the same
 * arithmetic is done here against the dictionary. The English wording is
 * unchanged.
 */
function ago(t: Translator, value: string): string {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return t('website.time.secondsAgo', { n: seconds });
  if (seconds < 3600) return t('website.time.minutesAgo', { n: Math.round(seconds / 60) });
  if (seconds < 86_400) return t('website.time.hoursAgo', { n: Math.round(seconds / 3600) });
  return t('website.time.daysAgo', { n: Math.round(seconds / 86_400) });
}

export default function LivePage() {
  const t = useT();
  const [data, setData] = useState<{
    sessions: LiveSession[];
    recent: LiveEvent[];
    today: { sessions: number; leads: number; calls: number };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // `useT()` hands back a fresh function every render, so it cannot go in the
  // dependency list — the poller would be torn down and rebuilt ten times a
  // second. A ref keeps the effect mounted once and the wording current.
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch('/api/admin/live', { cache: 'no-store' });
        const body = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setError(body?.error ?? tRef.current('website.live.loadFailed'));
          return;
        }
        setError(null);
        setData(body);
      } catch {
        if (!cancelled) setError(tRef.current('website.live.unreachable'));
      }
    };

    load();
    const timer = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
          {t('website.live.title')}
        </h1>
        <span className="flex items-center gap-2 text-xs text-gray-500">
          <span
            aria-hidden
            className="inline-block h-2 w-2 animate-pulse rounded-full"
            style={{ backgroundColor: STATUS.good }}
          />
          {t('website.live.refreshing')}
        </span>
      </div>

      {error && (
        <div className="rounded-card border px-4 py-3 text-sm" style={{ borderColor: STATUS.critical }}>
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Tile
          label={t('website.live.onSiteNow')}
          value={data ? count(data.sessions.length, t.lang) : '—'}
        />
        <Tile
          label={t('website.live.visitsToday')}
          value={data ? count(data.today.sessions, t.lang) : '—'}
        />
        <Tile
          label={t('website.live.requestsToday')}
          value={data ? count(data.today.leads + data.today.calls, t.lang) : '—'}
          note={
            data
              ? t('website.live.formsAndCalls', {
                  forms: t.plural(data.today.leads, 'website.plural.form'),
                  calls: t.plural(data.today.calls, 'website.plural.call'),
                })
              : undefined
          }
        />
      </div>

      <Panel title={t('website.live.rightNow')} subtitle={t('website.live.rightNowSub')}>
        {!data ? (
          <Empty>{t('website.live.loading')}</Empty>
        ) : data.sessions.length === 0 ? (
          <Empty>{t('website.live.nobody')}</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('website.live.channel')}</Th>
                <Th>{t('website.live.campaign')}</Th>
                <Th>{t('website.live.where')}</Th>
                <Th>{t('website.live.device')}</Th>
                <Th>{t('website.live.landedOn')}</Th>
                <Th>{t('website.live.nowReading')}</Th>
                <Th numeric>{t('website.live.pages')}</Th>
                <Th numeric>{t('website.live.lastSeen')}</Th>
              </tr>
            </thead>
            <tbody>
              {data.sessions.map((session) => (
                <tr key={session.id} className={session.converted ? 'bg-[#e6f4ec]' : undefined}>
                  <Td>
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      <span
                        aria-hidden
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: channelColor(session.channel ?? '') }}
                      />
                      {channelLabel(session.channel)}
                    </span>
                  </Td>
                  <Td className="max-w-[160px] truncate">{session.campaign || '—'}</Td>
                  <Td className="whitespace-nowrap">
                    {session.city || t('website.live.unknownCity')}
                    {session.region ? `, ${session.region}` : ''}
                  </Td>
                  <Td>{deviceLabel(t, session.device)}</Td>
                  <Td className="max-w-[180px] truncate font-mono text-xs">
                    {session.landing_path || '—'}
                  </Td>
                  <Td className="max-w-[180px] truncate font-mono text-xs">
                    {session.current_path || '—'}
                  </Td>
                  <Td numeric>{session.pageviews}</Td>
                  <Td numeric className="whitespace-nowrap text-xs">
                    {ago(t, session.last_seen_at)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Hint>{t('website.live.greenRowHint')}</Hint>
      </Panel>

      <Panel title={t('website.live.lastHour')} subtitle={t('website.live.lastHourSub')}>
        {!data ? (
          <Empty>{t('website.live.loading')}</Empty>
        ) : data.recent.length === 0 ? (
          <Empty>{t('website.live.nothingNotable')}</Empty>
        ) : (
          <ul className="space-y-2">
            {data.recent.map((event, index) => (
              <li key={index} className="flex items-baseline gap-3 text-sm">
                <span className="w-16 shrink-0 text-xs tabular-nums text-gray-500">
                  {ago(t, event.ts)}
                </span>
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: channelColor(event.channel ?? '') }}
                />
                <span className={NOTABLE.has(event.type) ? 'font-medium text-ink' : 'text-gray-700'}>
                  {/* One key, not four fragments: the channel, the town and the
                      verb all move about between languages, and only a whole
                      sentence can put them where they belong. */}
                  {event.city
                    ? t('website.live.someoneIn', {
                        channel: channelLabel(event.channel),
                        city: event.city,
                        action: eventAction(t, event.type),
                      })
                    : t('website.live.someone', {
                        channel: channelLabel(event.channel),
                        action: eventAction(t, event.type),
                      })}
                  {event.path ? (
                    <span className="text-gray-500"> {t('website.live.onPath', { path: event.path })}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <p className="text-center text-xs text-gray-500">
        <Link href="/admin/leads" className="underline">
          {t('website.live.leadsLink')}
        </Link>{' '}
        {t('website.live.leadsHolds')}
      </p>
    </div>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-card border border-primary-500/20 bg-[#fcfcfb] px-5 py-4">
      <p className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
        {label}
      </p>
      <p className="mt-2 font-heading text-3xl font-bold tabular-nums text-ink">{value}</p>
      {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
    </div>
  );
}
