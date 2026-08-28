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

/**
 * Ask for the microphone, and say what went wrong in words that suggest a fix.
 *
 * A refusal and a missing device look identical from a promise rejection, and
 * "could not access the microphone" tells a dispatcher nothing they can act on.
 */
async function requestMicrophone(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      'This browser will not share a microphone with the page. Chrome, Edge or Safari over https will.'
    );
  }
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    const name = (err as { name?: string })?.name;
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      throw new Error(
        'The microphone is blocked for this site. Click the padlock in the address bar, allow the microphone, then reload.'
      );
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      throw new Error('No microphone found. Plug one in, or pick one in the system sound settings.');
    }
    if (name === 'NotReadableError') {
      throw new Error('Another program is holding the microphone. Close it and try again.');
    }
    throw new Error(
      `The microphone could not be opened${name ? ` (${name})` : ''}.`
    );
  }
}

export function CallBar({ teamMemberId }: { teamMemberId: string | null }) {
  const [status, setStatus] = useState<Status>('off');
  const [error, setError] = useState<string | null>(null);
  const [caller, setCaller] = useState<CallerCard | null>(null);
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  /** How far the connection got, so a failure can name the step it died on. */
  const [stage, setStage] = useState<string | null>(null);

  const clientRef = useRef<any>(null);
  const callRef = useRef<any>(null);
  const heartbeat = useRef<ReturnType<typeof setInterval> | null>(null);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedAt = useRef<number>(0);

  const ringing = useRef<{ ctx: AudioContext; timer: ReturnType<typeof setInterval> } | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOnDuty = useRef(false);
  const stageRef = useRef<string | null>(null);
  stageRef.current = stage;
  /** The business number. Dialling without it is a SIP 403 from Telnyx. */
  const lineE164 = useRef<string | null>(null);
  /** Set while an outbound call is up, so its minutes get reported. */
  const outbound = useRef<{ callId: string; answered: boolean } | null>(null);
  /** A number asked for before the desk was on the phones. */
  const pendingDial = useRef<{ toE164: string; name: string; clientId?: string } | null>(null);

  /**
   * A ring, generated rather than fetched.
   *
   * A dispatcher looking at another screen has to hear the call, and shipping
   * an audio file for two notes is not worth a request or a cache entry.
   */
  const startRinging = useCallback(() => {
    if (ringing.current) return;
    try {
      const ctx = new AudioContext();
      const beep = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      };
      beep();
      ringing.current = { ctx, timer: setInterval(beep, 2500) };
    } catch {
      // No audio context is a quieter phone, not a broken one.
    }
  }, []);

  const stopRinging = useCallback(() => {
    if (!ringing.current) return;
    clearInterval(ringing.current.timer);
    void ringing.current.ctx.close().catch(() => {});
    ringing.current = null;
  }, []);

  /**
   * Dialling out from a record.
   *
   * Held in a ref so `connect` can drain a queued number without the two
   * functions depending on each other.
   */
  const connectRef = useRef<(() => Promise<void>) | null>(null);

  const placeCall = useCallback(
    async (request: { toE164: string; name: string; clientId?: string }) => {
      if (!teamMemberId) return;

      // Not on the phones yet: remember the number and go on. The caller asked
      // to ring somebody, not to be told about a socket.
      if (!clientRef.current?.connected) {
        pendingDial.current = request;
        setStatus((was) => (was === 'connecting' ? was : 'connecting'));
        await connectRef.current?.();
        return;
      }

      try {
        const { callId } = await post('outbound', {
          teamMemberId,
          toE164: request.toE164,
          ...(request.clientId ? { clientId: request.clientId } : {}),
        });
        outbound.current = { callId, answered: false };

        const call = clientRef.current.newCall({
          destinationNumber: request.toE164,
          // Without this Telnyx answers SIP 403 "Caller Origination Number is
          // Invalid", and the customer would not recognise the number anyway.
          callerNumber: lineE164.current ?? undefined,
          callerName: 'CoastPro',
          remoteElement: 'coastpro-call-audio',
        });
        callRef.current = call;
        startedAt.current = Date.now();
        setSeconds(0);
        setCaller({
          fromDisplay: request.toE164,
          client: request.name ? { name: request.name, address: null } : null,
          activeJob: null,
        });
        setStatus('live');
        if (ticker.current) clearInterval(ticker.current);
        ticker.current = setInterval(
          () => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)),
          1000
        );
      } catch (err) {
        outbound.current = null;
        setError(err instanceof Error ? err.message : 'That call would not go through.');
      }
    },
    [teamMemberId]
  );

  const stopHeartbeat = useCallback(() => {
    if (heartbeat.current) clearInterval(heartbeat.current);
    heartbeat.current = null;
  }, []);

  const goOffline = useCallback(() => {
    stopHeartbeat();
    if (!teamMemberId) return;
    // Only if we were ever on the phones. Announcing a departure that never
    // happened backdates presence on every page unload, which buries the one
    // signal that says whether the desk ever connected.
    if (!wasOnDuty.current) return;
    wasOnDuty.current = false;
    // `keepalive` so the request survives the page going away — an unload is
    // exactly when this matters most.
    navigator.sendBeacon?.(
      '/api/admin/dispatch/offline',
      new Blob([JSON.stringify({ teamMemberId })], { type: 'application/json' })
    );
  }, [teamMemberId, stopHeartbeat]);

  const disconnect = useCallback(() => {
    if (watchdog.current) clearTimeout(watchdog.current);
    watchdog.current = null;
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
    setStage(null);
    setCaller(null);
  }, [goOffline]);

  const connect = useCallback(async () => {
    if (!teamMemberId) return;
    setStatus('connecting');
    setError(null);

    try {
      /**
       * The microphone is asked for first, before anything is awaited.
       *
       * Safari only opens the permission prompt while it can still see the
       * click that caused it, and an `await` in front of this spends that
       * click. That is what "no allow-microphone button appeared" looks like
       * from the outside: no prompt, no error, nothing.
       *
       * The SDK will not ask on our behalf — `connect()` never calls
       * `checkPermissions`, it only asks when a call is already ringing, which
       * is the worst possible moment to discover the answer is no.
       */
      setStage('Asking for the microphone');
      const micStream = await requestMicrophone();

      const session = await post('session', { teamMemberId });
      lineE164.current = session.lineE164 ?? null;
      setStage('Loading the phone');
      const TelnyxRTC = await loadSdk();

      // Permission is what was wanted, not the recording. Holding this open
      // would leave the browser's recording indicator lit and take a second
      // capture of the same microphone alongside the call's own.
      micStream.getTracks().forEach((track) => track.stop());

      setStage('Connecting');
      const client = new TelnyxRTC({
        login_token: session.token,
        // The app needed this: direct peer-to-peer fails on some carrier
        // networks and the call connects to silence. A relay always works.
        forceRelayCandidate: true,
      });
      clientRef.current = client;

      client.on('telnyx.socket.open', () => setStage('Signing in'));
      client.on('telnyx.socket.error', () =>
        setStage('The connection to the phone network failed')
      );

      client.on('telnyx.ready', () => {
        if (watchdog.current) clearTimeout(watchdog.current);
        watchdog.current = null;
        setStage(null);
        wasOnDuty.current = true;
        setStatus('ready');
        // Announce presence immediately; the interval below only keeps it
        // fresh. Waiting the first thirty seconds would leave a window where
        // the desk is connected but the server still routes past it.
        void post('registered', { teamMemberId }).catch((err: Error) =>
          // Swallowing this is how a desk ends up connected but never routed
          // to: the browser believes it is on the phones and the server has
          // never heard of it.
          setError(`Connected, but the server was not told: ${err.message}`)
        );

        const queued = pendingDial.current;
        pendingDial.current = null;
        if (queued) void placeCall(queued);

        stopHeartbeat();
        heartbeat.current = setInterval(() => {
          // Guarded on the live socket, not on the tab. This is the line that
          // decides whether a call rings here or on a phone.
          if (clientRef.current?.connected) {
            void post('heartbeat', { teamMemberId }).catch((err: Error) =>
              setError(`Lost touch with the server: ${err.message}`)
            );
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
        setStatus((was) => {
          if (was === 'live' || was === 'ringing') return was;
          // Closing before ever reaching ready is a failure, not an idle desk,
          // and it has to say so — a bar that quietly reads "off" is how a
          // dispatcher ends up believing they are on the phones when they
          // are not.
          if (was === 'connecting') {
            setError('The phone network closed the connection. Try again.');
            return 'error';
          }
          return 'off';
        });
      });

      client.on('telnyx.notification', (notification: any) => {
        const call = notification?.call;
        if (!call) return;

        switch (call.state) {
          case 'ringing':
            callRef.current = call;
            setStatus('ringing');
            startRinging();
            void lookUpCaller(call.options?.remoteCallerNumber ?? '');
            break;
          case 'active':
            callRef.current = call;
            if (outbound.current) outbound.current.answered = true;
            // Belt and braces on the audio. `answer()` is given the element
            // too, but a call that connects to silence is the failure that
            // took two weeks to find on iOS, and it is invisible in every log.
            stopRinging();
            attachAudio(call);
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
            stopRinging();
            if (outbound.current) {
              // Minutes are metered here because nothing else sees the end of a
              // call the browser dialled itself — the server never placed it.
              const spent = startedAt.current
                ? Math.round((Date.now() - startedAt.current) / 1000)
                : 0;
              void post('ended', {
                callId: outbound.current.callId,
                answered: outbound.current.answered,
                durationSec: spent,
              }).catch(() => {});
              outbound.current = null;
            }
            if (ticker.current) clearInterval(ticker.current);
            ticker.current = null;
            callRef.current = null;
            setCaller(null);
            setMuted(false);
            setStatus(clientRef.current?.connected ? 'ready' : 'off');
            break;
        }
      });

      /**
       * A connection that never arrives must say so.
       *
       * `connect()` resolves when the socket opens, not when the SIP
       * registration succeeds, so a bad token leaves the bar sitting on
       * "connecting" for ever. Silence here reads as "it is working", which is
       * the worst thing this component could claim.
       */
      if (watchdog.current) clearTimeout(watchdog.current);
      watchdog.current = setTimeout(() => {
        setStatus((was) => (was === 'connecting' ? 'error' : was));
        setError(
          (was) =>
            was ??
            `The phone network did not answer${
              stageRef.current ? ` — it stopped at: ${stageRef.current}` : ''
            }. Try again.`
        );
      }, 15_000);

      await client.connect().catch((err: unknown) => {
        throw new Error(
          err instanceof Error ? err.message : 'Could not reach the phone network.'
        );
      });
    } catch (err) {
      if (watchdog.current) clearTimeout(watchdog.current);
      watchdog.current = null;
      setError(err instanceof Error ? err.message : 'Could not start the phone.');
      setStatus('error');
    }
  }, [teamMemberId, stopHeartbeat, startRinging, stopRinging]);

  /** Put the far end's audio into the page's own element. */
  const attachAudio = (call: any) => {
    const element = audioRef.current;
    const stream = call?.remoteStream;
    if (!element || !stream) return;
    element.srcObject = stream;
    void element.play().catch(() => {
      // Autoplay policy: the answer was a click, so this should not happen —
      // but a muted call is worse than a noisy console.
      setError('The browser blocked the call audio. Click the page and try again.');
    });
  };

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

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  /**
   * Any record can ask for a call.
   *
   * A window event rather than a context, because the pages that show a phone
   * number are server components — a provider would drag every one of them
   * over the client boundary for the sake of one button.
   */
  useEffect(() => {
    const onRequest = (event: Event) => {
      const detail = (event as CustomEvent).detail ?? {};
      if (!detail.toE164) return;
      void placeCall({
        toE164: String(detail.toE164),
        name: String(detail.name ?? ''),
        ...(detail.clientId ? { clientId: String(detail.clientId) } : {}),
      });
    };
    window.addEventListener('coastpro:call', onRequest);
    return () => window.removeEventListener('coastpro:call', onRequest);
  }, [placeCall]);

  /**
   * Tell the call buttons on every record that there is a desk here.
   *
   * Only when there really is one. Marking the page regardless turned every
   * phone number in the console into a live-looking "call" button with nothing
   * behind it — the exact failure CallButton falls back to a plain link to
   * avoid.
   */
  useEffect(() => {
    if (!teamMemberId) return;
    document.documentElement.dataset.coastproPhone = 'on';
    return () => {
      delete document.documentElement.dataset.coastproPhone;
    };
  }, [teamMemberId]);

  // Leaving the desk, however the tab goes: closed, navigated away from, or
  // this component taken off the page.
  useEffect(() => {
    const onLeave = () => goOffline();
    window.addEventListener('pagehide', onLeave);
    return () => {
      window.removeEventListener('pagehide', onLeave);
      stopHeartbeat();
      stopRinging();
      // Without this the socket outlives the bar: the desk stays present, the
      // server keeps routing calls to it, and there is no longer any Answer
      // button on the page to press.
      try {
        clientRef.current?.disconnect();
      } catch {
        /* a connection that is already gone is the state we wanted */
      }
      clientRef.current = null;
      goOffline();
    };
  }, [goOffline, stopHeartbeat, stopRinging]);

  if (!teamMemberId) return null;

  const answer = () => {
    try {
      // Named on the call itself. The client carries a default, but a call
      // that connects to silence is invisible in every log, so this says it
      // where it cannot be missed.
      callRef.current?.answer({ remoteElement: 'coastpro-call-audio' });
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
            <span className={`text-xs ${error ? 'text-[#b3261e]' : 'text-gray-600'}`}>
              {error ?? 'Calls are going to the phone.'}
            </span>
          </>
        ) : status === 'connecting' ? (
          <span className="text-xs text-gray-600">{stage ?? 'Connecting the phone'}…</span>
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
