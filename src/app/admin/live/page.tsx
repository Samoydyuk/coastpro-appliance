'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { channelLabel } from '@/lib/attribution';
import { count, relativeTime } from '@/lib/admin/format';
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

const EVENT_LABELS: Record<string, string> = {
  click_phone: 'tapped the phone number',
  form_start: 'started a form',
  form_submit: 'submitted a form',
  calendly_booked: 'booked an appointment',
  rage_click: 'clicked repeatedly on something',
  js_error: 'hit a script error',
};

const NOTABLE = new Set(['click_phone', 'form_submit', 'calendly_booked']);

export default function LivePage() {
  const [data, setData] = useState<{
    sessions: LiveSession[];
    recent: LiveEvent[];
    today: { sessions: number; leads: number; calls: number };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch('/api/admin/live', { cache: 'no-store' });
        const body = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setError(body?.error ?? 'Could not load.');
          return;
        }
        setError(null);
        setData(body);
      } catch {
        if (!cancelled) setError('Could not reach the server.');
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
        <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">Live</h1>
        <span className="flex items-center gap-2 text-xs text-gray-500">
          <span
            aria-hidden
            className="inline-block h-2 w-2 animate-pulse rounded-full"
            style={{ backgroundColor: STATUS.good }}
          />
          refreshing every 10 seconds
        </span>
      </div>

      {error && (
        <div className="rounded-card border px-4 py-3 text-sm" style={{ borderColor: STATUS.critical }}>
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="On the site now" value={data ? count(data.sessions.length) : '—'} />
        <Tile label="Visits today" value={data ? count(data.today.sessions) : '—'} />
        <Tile
          label="Requests today"
          value={data ? count(data.today.leads + data.today.calls) : '—'}
          note={data ? `${data.today.leads} forms · ${data.today.calls} calls` : undefined}
        />
      </div>

      <Panel title="Right now" subtitle="Visits with activity in the last five minutes">
        {!data ? (
          <Empty>Loading…</Empty>
        ) : data.sessions.length === 0 ? (
          <Empty>Nobody on the site at the moment.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Channel</Th>
                <Th>Campaign</Th>
                <Th>Where</Th>
                <Th>Device</Th>
                <Th>Landed on</Th>
                <Th>Now reading</Th>
                <Th numeric>Pages</Th>
                <Th numeric>Last seen</Th>
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
                    {session.city || 'Unknown'}
                    {session.region ? `, ${session.region}` : ''}
                  </Td>
                  <Td className="capitalize">{session.device || '—'}</Td>
                  <Td className="max-w-[180px] truncate font-mono text-xs">
                    {session.landing_path || '—'}
                  </Td>
                  <Td className="max-w-[180px] truncate font-mono text-xs">
                    {session.current_path || '—'}
                  </Td>
                  <Td numeric>{session.pageviews}</Td>
                  <Td numeric className="whitespace-nowrap text-xs">
                    {relativeTime(session.last_seen_at)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Hint>
          A green row means that visit has already asked for service. Watching this while a new
          campaign goes live is the fastest way to catch a broken landing page or a mis-targeted
          location.
        </Hint>
      </Panel>

      <Panel title="Last hour" subtitle="Things worth noticing as they happen">
        {!data ? (
          <Empty>Loading…</Empty>
        ) : data.recent.length === 0 ? (
          <Empty>Nothing notable in the last hour.</Empty>
        ) : (
          <ul className="space-y-2">
            {data.recent.map((event, index) => (
              <li key={index} className="flex items-baseline gap-3 text-sm">
                <span className="w-16 shrink-0 text-xs tabular-nums text-gray-500">
                  {relativeTime(event.ts)}
                </span>
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: channelColor(event.channel ?? '') }}
                />
                <span className={NOTABLE.has(event.type) ? 'font-medium text-ink' : 'text-gray-700'}>
                  Someone from {channelLabel(event.channel)}
                  {event.city ? ` in ${event.city}` : ''}{' '}
                  {EVENT_LABELS[event.type] ?? event.type}
                  {event.path ? (
                    <span className="text-gray-500"> on {event.path}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <p className="text-center text-xs text-gray-500">
        <Link href="/admin/leads" className="underline">
          Leads
        </Link>{' '}
        holds everything that turned into a request.
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
