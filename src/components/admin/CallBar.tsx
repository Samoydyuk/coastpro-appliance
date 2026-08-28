'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Answering the business number at a desk.
 *
 * Lives in the admin layout, so a call is caught on whichever screen the
 * dispatcher happens to be reading — a phone that only rings on the calendar
 * is a phone that gets missed.
 *
 * Two rules run through this file.
 *
 * The heartbeat goes out **only while the socket is actually up**, never
 * merely while the tab is open. Presence is what the server uses to decide the
 * call comes here rather than to somebody's phone, so a tab claiming to be
 * ready while its connection is dead would ring an empty desk for
 * thirty-five seconds in silence.
 *
 * And leaving is announced. Closing the tab tells the server to backdate that
 * presence, so the next call goes straight on instead of waiting out the
 * window.
 */

type Status = 'off' | 'connecting' | 'ready' | 'ringing' | 'live' | 'error';

interface CallerCard {
  fromDisplay: string;
  client: { name: string; address: string | null } | null;
  activeJob: { jobNumber: string | null; type: string | null } | null;
}

/** The SDK is loaded on demand: nobody who never answers a call pays for it. */
async function loadSdk() {
  const mod = await import('@telnyx/webrtc');
  return mod.TelnyxRTC;
}

async function post(action: string, body: unknown = {}) {
  const response = await fetch(`/api/admin/dispatch/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const parsed = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(parsed?.error ?? 'That did not go through.');
  }
  return response.json();
}

export function CallBar({ teamMemberId }: { teamMemberId: string | null }) {
  const [status, setStatus] = useState<Status>('off');
  const [error, setError] = useState<string | null>(null);
  const [caller, setCaller] = useState<CallerCard | null>(null);
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const clientRef = useRef<any>(null);
  const callRef = useRef<any>(null);
  const heartbeat = useRef<ReturnType<typeof setInterval> | null>(null);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedAt = useRef<number>(0);

  const stopHeartbeat = useCallback(() => {
    if (heartbeat.current) clearInterval(heartbeat.current);
    heartbeat.current = null;
  }, []);

  const goOffline = useCallback(() => {
    stopHeartbeat();
    if (!teamMemberId) return;
    // `keepalive` so the request survives the page going away — an unload is
    // exactly when this matters most.
    navigator.sendBeacon?.(
      '/api/admin/dispatch/offline',
      new Blob([JSON.stringify({ teamMemberId })], { type: 'application/json' })
    );
  }, [teamMemberId, stopHeartbeat]);

  const disconnect = useCallback(() => {
    try {
      callRef.current?.hangup();
    } catch {
      /* a call that is already gone is the state we wanted */
    }
    callRef.current = null;
    try {
      clientRef.current?.disconnect();
    } catch {
      /* same */
    }
    clientRef.current = null;
    goOffline();
    setStatus('off');
    setCaller(null);
  }, [goOffline]);

  const connect = useCallback(async () => {
    if (!teamMemberId) return;
    setStatus('connecting');
    setError(null);

    try {
      const session = await post('session', { teamMemberId });
      const TelnyxRTC = await loadSdk();

      const client = new TelnyxRTC({ login_token: session.token });
      clientRef.current = client;

      // Where the far end's audio actually comes out. Without an element the
      // SDK has nowhere to attach the remote track and the call is silent —
      // connected, metered, and useless.
      client.remoteElement = 'coastpro-call-audio';

      client.on('telnyx.ready', () => {
        setStatus('ready');
        void post('registered', { teamMemberId }).catch(() => {});

        stopHeartbeat();
        heartbeat.current = setInterval(() => {
          // Guarded on the live socket, not on the tab. This is the line that
          // decides whether a call rings here or on a phone.
          if (clientRef.current?.connected) {
            void post('heartbeat', { teamMemberId }).catch(() => {});
          }
        }, 30_000);
      });

      client.on('telnyx.error', (event: any) => {
        setError(event?.error?.message ?? 'The phone connection failed.');
        setStatus('error');
        stopHeartbeat();
      });

      client.on('telnyx.socket.close', () => {
        // The socket is the presence signal; without it the server must stop
        // sending calls here immediately.
        stopHeartbeat();
        setStatus((was) => (was === 'live' || was === 'ringing' ? was : 'off'));
      });

      client.on('telnyx.notification', (notification: any) => {
        const call = notification?.call;
        if (!call) return;

        switch (call.state) {
          case 'ringing':
            callRef.current = call;
            setStatus('ringing');
            void lookUpCaller(call.options?.remoteCallerNumber ?? '');
            break;
          case 'active':
            callRef.current = call;
            startedAt.current = Date.now();
            setSeconds(0);
            setStatus('live');
            if (ticker.current) clearInterval(ticker.current);
            ticker.current = setInterval(
              () => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)),
              1000
            );
            break;
          case 'hangup':
          case 'destroy':
            if (ticker.current) clearInterval(ticker.current);
            ticker.current = null;
            callRef.current = null;
            setCaller(null);
            setMuted(false);
            setStatus(clientRef.current?.connected ? 'ready' : 'off');
            break;
        }
      });

      client.connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the phone.');
      setStatus('error');
    }
  }, [teamMemberId, stopHeartbeat]);

  const lookUpCaller = async (from: string) => {
    setCaller({ fromDisplay: from || 'Unknown number', client: null, activeJob: null });
    if (!from) return;
    try {
      const response = await fetch(`/api/admin/dispatch/caller?from=${encodeURIComponent(from)}`);
      const body = await response.json();
      if (body?.context) {
        setCaller({
          fromDisplay: body.context.fromDisplay ?? from,
          client: body.context.client,
          activeJob: body.context.activeJob,
        });
      }
    } catch {
      // The number alone is still enough to answer with.
    }
  };

  // Leaving the desk, however the tab goes.
  useEffect(() => {
    const onLeave = () => goOffline();
    window.addEventListener('pagehide', onLeave);
    return () => {
      window.removeEventListener('pagehide', onLeave);
      stopHeartbeat();
    };
  }, [goOffline, stopHeartbeat]);

  if (!teamMemberId) return null;

  const answer = () => {
    try {
      callRef.current?.answer();
    } catch {
      setError('Could not pick that up.');
    }
  };

  const hangup = () => {
    try {
      callRef.current?.hangup();
    } catch {
      /* already gone */
    }
  };

  const toggleMute = () => {
    const call = callRef.current;
    if (!call) return;
    if (muted) call.unmuteAudio();
    else call.muteAudio();
    setMuted(!muted);
  };

  return (
    <>
      {/* The remote audio has to live somewhere in the document. */}
      <audio id="coastpro-call-audio" ref={audioRef} autoPlay />

      <div className="flex flex-wrap items-center gap-3 border-b border-primary-500/15 bg-[#fcfcfb] px-5 py-2">
        {status === 'off' || status === 'error' ? (
          <>
            <button
              type="button"
              onClick={connect}
              className="h-8 rounded-card bg-ink px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-cream"
            >
              Take calls here
            </button>
            <span className="text-xs text-gray-600">
              {error ?? 'Calls are going to the phone.'}
            </span>
          </>
        ) : status === 'connecting' ? (
          <span className="text-xs text-gray-600">Connecting the phone…</span>
        ) : status === 'ready' ? (
          <>
            <Dot colour="#0ca30c" />
            <span className="text-xs text-gray-600">
              On duty — calls ring here and on the phone.
            </span>
            <button
              type="button"
              onClick={disconnect}
              className="ml-auto h-8 rounded-card border border-primary-500/30 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink"
            >
              Stop
            </button>
          </>
        ) : (
          <>
            <Dot colour={status === 'ringing' ? '#fab219' : '#0ca30c'} />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-ink">
                {caller?.client?.name ?? caller?.fromDisplay ?? 'Incoming call'}
              </div>
              <div className="truncate text-xs text-gray-600">
                {status === 'ringing' ? 'Ringing' : formatDuration(seconds)}
                {caller?.client?.address ? ` · ${caller.client.address}` : ''}
                {caller?.activeJob?.jobNumber ? ` · ${caller.activeJob.jobNumber}` : ''}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {status === 'ringing' && (
                <button
                  type="button"
                  onClick={answer}
                  className="h-8 rounded-card px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-cream"
                  style={{ backgroundColor: '#0ca30c' }}
                >
                  Answer
                </button>
              )}
              {status === 'live' && (
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`h-8 rounded-card border px-3 font-heading text-[10px] font-semibold uppercase tracking-label ${
                    muted
                      ? 'border-ink bg-ink text-cream'
                      : 'border-primary-500/30 text-gray-600 hover:border-ink hover:text-ink'
                  }`}
                >
                  {muted ? 'Unmute' : 'Mute'}
                </button>
              )}
              <button
                type="button"
                onClick={hangup}
                className="h-8 rounded-card px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-cream"
                style={{ backgroundColor: '#d03b3b' }}
              >
                {status === 'ringing' ? 'Decline' : 'Hang up'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Dot({ colour }: { colour: string }) {
  return (
    <span
      aria-hidden
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: colour }}
    />
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
