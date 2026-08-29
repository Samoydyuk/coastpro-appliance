'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '@/components/admin/LanguageProvider';
import {
  numberLocale,
  translator,
  type Lang,
  type TranslationKey,
  type Translator,
} from '@/lib/i18n';

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
  /**
   * The number they are ringing from, or null while nobody knows yet.
   *
   * Null rather than the words "Incoming call": this field was being compared
   * against its own placeholder to decide whether to show the number, and a
   * sentence used as a sentinel stops working the moment it is translated.
   */
  fromDisplay: string | null;
  match: 'existing' | 'new' | 'multiple';
  client: { name: string; address: string | null; phone: string | null } | null;
  history: { jobCount: number; balanceDue: number; unpaidCount: number } | null;
  activeJob: {
    jobNumber: string | null;
    type: string | null;
    status: string | null;
    scheduledAt: string | null;
    appliance: string | null;
  } | null;
  lastJob: {
    type: string | null;
    diagnosis: string | null;
    appliance: string | null;
    completedAt: string | null;
  } | null;
  recentJobs: Array<{
    id: string;
    jobNumber: string | null;
    type: string | null;
    appliance: string | null;
    status: string;
    paymentStatus: string;
    total: number;
    at: string | null;
  }>;
}

const EMPTY_CARD: Omit<CallerCard, 'fromDisplay'> = {
  match: 'new',
  client: null,
  history: null,
  activeJob: null,
  lastJob: null,
  recentJobs: [],
};

/**
 * Plain words for a status nobody says out loud as SCREAMING_SNAKE.
 *
 * The enum values arrive from JobPocket and are looked up here, never
 * rewritten: what changes is the label beside them. Anything the dictionary
 * has no word for yet falls back to the old lowercasing — which reads as
 * English wherever it lands, and so names the status that still needs adding.
 */
const STATUS_KEYS: Record<string, TranslationKey> = {
  DRAFT: 'shared.status.DRAFT',
  SENT: 'shared.status.SENT',
  APPROVED: 'shared.status.APPROVED',
  SCHEDULED: 'shared.status.SCHEDULED',
  IN_PROGRESS: 'shared.status.IN_PROGRESS',
  PAUSED: 'shared.status.PAUSED',
  COMPLETED: 'shared.status.COMPLETED',
  INVOICED: 'shared.status.INVOICED',
  PAID: 'shared.status.PAID',
  CANCELLED: 'shared.status.CANCELLED',
};

const PAY_KEYS: Record<string, TranslationKey> = {
  UNPAID: 'shared.pay.UNPAID',
  PARTIAL: 'shared.pay.PARTIAL',
  PAID: 'shared.pay.PAID',
  REFUNDED: 'shared.pay.REFUNDED',
  WRITTEN_OFF: 'shared.pay.WRITTEN_OFF',
  FREE: 'shared.pay.FREE',
};

function humanise(value: string): string {
  return value.toLowerCase().replace(/_/g, ' ');
}

function statusLabel(t: Translator, value: string): string {
  const key = STATUS_KEYS[value];
  return key ? t(key) : humanise(value);
}

function payLabel(t: Translator, value: string): string {
  const key = PAY_KEYS[value];
  return key ? t(key) : humanise(value);
}

/**
 * Whether a status is worth a second look.
 *
 * Only two things on a job history make a dispatcher change what they say:
 * work that is still open, and money that never arrived.
 */
function jobTone(status: string): 'warn' | 'good' | 'neutral' {
  if (status === 'COMPLETED' || status === 'PAID' || status === 'INVOICED') return 'good';
  if (status === 'CANCELLED' || status === 'DRAFT') return 'neutral';
  return 'warn';
}

function payTone(status: string): 'warn' | 'good' | 'neutral' {
  if (status === 'PAID' || status === 'FREE') return 'good';
  if (status === 'REFUNDED' || status === 'WRITTEN_OFF') return 'neutral';
  return 'warn';
}

/** "Fri 14:00" — enough to answer "are you coming today?" without a calendar. */
function whenLabel(iso: string | null, lang: Lang): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(numberLocale(lang), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** A date on its own, for work that is already finished. */
function dayLabel(iso: string | null, lang: Lang): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(numberLocale(lang), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Dollars, in whichever language. `narrowSymbol` because without it a
 * Ukrainian locale writes "500,00 USD" and the dollar sign vanishes from a
 * chip that exists to say how much somebody owes.
 */
function money(amount: number, lang: Lang): string {
  return amount.toLocaleString(numberLocale(lang), {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  });
}

/** The SDK is loaded on demand: nobody who never answers a call pays for it. */
async function loadSdk() {
  const mod = await import('@telnyx/webrtc');
  return mod.TelnyxRTC;
}

/**
 * Remembers that this desk is on the phones.
 *
 * Being on duty is a shift, not a page. A reload used to drop the dispatcher
 * off the phones without saying so — and worse, calls carried on being routed
 * here for the rest of the presence window, ringing a tab that had no idea.
 */
const ON_DUTY_KEY = 'coastpro:dispatch-on-duty';

async function post(t: Translator, action: string, body: unknown = {}) {
  const response = await fetch(`/api/admin/dispatch/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    // The server's own words when it has any — it knows what went wrong and
    // this component does not.
    const parsed = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(parsed?.error ?? t('shared.call.err.request'));
  }
  return response.json();
}

/**
 * Ask for the microphone, and say what went wrong in words that suggest a fix.
 *
 * A refusal and a missing device look identical from a promise rejection, and
 * "could not access the microphone" tells a dispatcher nothing they can act on.
 */
async function requestMicrophone(t: Translator): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(t('shared.call.err.noMediaApi'));
  }
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    const name = (err as { name?: string })?.name;
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      throw new Error(t('shared.call.err.micBlocked'));
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      throw new Error(t('shared.call.err.micMissing'));
    }
    if (name === 'NotReadableError') {
      throw new Error(t('shared.call.err.micBusy'));
    }
    // The browser's own name for the fault, kept as it is: it is a DOM
    // constant, not a sentence, and it is the thing worth searching for.
    throw new Error(t('shared.call.err.micOther', { detail: name ? ` (${name})` : '' }));
  }
}

const CHIP_TONES = {
  warn: 'bg-[#fdf0e6] text-[#8a4b12]',
  good: 'bg-[#e8f3e8] text-[#1f5c22]',
  neutral: 'bg-primary-500/10 text-gray-600',
} as const;

function Chip({
  tone,
  children,
}: {
  tone: keyof typeof CHIP_TONES;
  children: React.ReactNode;
}) {
  return (
    <span className={`rounded-full px-2 py-[1px] text-[10px] font-medium ${CHIP_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function CallBar({ teamMemberId }: { teamMemberId: string | null }) {
  /**
   * Built from the language rather than taken from `useT`, so it is the same
   * object between renders.
   *
   * A fresh translator every render would put a new value in the dependency
   * list of `connect` and `placeCall` — and this bar re-renders once a second
   * for the whole of a call, because it is counting the seconds. Everything
   * downstream of those callbacks would be rebuilt on every tick. Nothing here
   * would break today; it is the kind of thing that breaks later, when an
   * effect that tears down the socket picks up a dependency on one of them.
   */
  const lang = useLang();
  const t = useMemo(() => translator(lang), [lang]);

  const [status, setStatus] = useState<Status>('off');
  const [error, setError] = useState<string | null>(null);
  const [caller, setCaller] = useState<CallerCard | null>(null);
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  /** How far the connection got, so a failure can name the step it died on. */
  const [stage, setStage] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  /** Something worth knowing that is not a failure. */
  const [notice, setNotice] = useState<string | null>(null);

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
        const { callId } = await post(t, 'outbound', {
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
          ...EMPTY_CARD,
          client: request.name ? { name: request.name, address: null, phone: request.toE164 } : null,
        });
        setStatus('live');
        if (ticker.current) clearInterval(ticker.current);
        ticker.current = setInterval(
          () => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)),
          1000
        );
      } catch (err) {
        outbound.current = null;
        setError(err instanceof Error ? err.message : t('shared.call.err.outbound'));
      }
    },
    [teamMemberId, t]
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
    // Leaving on purpose is the one thing that ends the shift.
    try {
      localStorage.removeItem(ON_DUTY_KEY);
    } catch {
      /* nothing to forget */
    }
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

  const connect = useCallback(async (options?: { resuming?: boolean }) => {
    if (!teamMemberId) return;
    setStatus('connecting');
    setError(null);
    // Cleared here rather than on ready: the resume path sets its notice after
    // connecting, and clearing it there would be a race with this handler.
    if (!options?.resuming) setNotice(null);

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
       * `checkPermissions`, it only asks when a call is already ringing.
       *
       * Skipped when a shift is being restored, because there is no click to
       * spend: the page just loaded. Connecting needs no microphone at all —
       * only answering does, and that has a button behind it. Demanding one
       * here is what kept sending the dispatcher back to pressing the button
       * after every reload.
       */
      let micStream: MediaStream | null = null;
      if (!options?.resuming) {
        setStage(t('shared.call.stage.mic'));
        micStream = await requestMicrophone(t);
      }

      const session = await post(t, 'session', { teamMemberId });
      lineE164.current = session.lineE164 ?? null;
      setStage(t('shared.call.stage.loading'));
      const TelnyxRTC = await loadSdk();

      // Permission is what was wanted, not the recording. Holding this open
      // would leave the browser's recording indicator lit and take a second
      // capture of the same microphone alongside the call's own.
      micStream?.getTracks().forEach((track) => track.stop());

      setStage(t('shared.call.stage.connecting'));
      const client = new TelnyxRTC({
        login_token: session.token,
        // The app needed this: direct peer-to-peer fails on some carrier
        // networks and the call connects to silence. A relay always works.
        forceRelayCandidate: true,
      });
      clientRef.current = client;

      client.on('telnyx.socket.open', () => setStage(t('shared.call.stage.signingIn')));
      client.on('telnyx.socket.error', () => setStage(t('shared.call.stage.socketFailed')));

      client.on('telnyx.ready', () => {
        if (watchdog.current) clearTimeout(watchdog.current);
        watchdog.current = null;
        setStage(null);
        wasOnDuty.current = true;
        try {
          localStorage.setItem(ON_DUTY_KEY, '1');
        } catch {
          /* private browsing: the shift simply will not survive a reload */
        }
        setStatus('ready');
        // Announce presence immediately; the interval below only keeps it
        // fresh. Waiting the first thirty seconds would leave a window where
        // the desk is connected but the server still routes past it.
        void post(t, 'registered', { teamMemberId }).catch((err: Error) =>
          // Swallowing this is how a desk ends up connected but never routed
          // to: the browser believes it is on the phones and the server has
          // never heard of it.
          setError(t('shared.call.err.notTold', { message: err.message }))
        );

        const queued = pendingDial.current;
        pendingDial.current = null;
        if (queued) void placeCall(queued);

        stopHeartbeat();
        heartbeat.current = setInterval(() => {
          // Guarded on the live socket, not on the tab. This is the line that
          // decides whether a call rings here or on a phone.
          if (clientRef.current?.connected) {
            void post(t, 'heartbeat', { teamMemberId }).catch((err: Error) =>
              setError(t('shared.call.err.lostServer', { message: err.message }))
            );
          }
        }, 30_000);
      });

      client.on('telnyx.error', (event: any) => {
        setError(event?.error?.message ?? t('shared.call.err.phoneFailed'));
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
            setError(t('shared.call.err.closed'));
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
            // `remoteCallerNumber` is not in the SDK's own typings; the other
            // two are what it falls back to when an invite is shaped
            // differently. Any of them is only a hint, so none is required.
            void lookUpCaller(
              call.options?.remoteCallerNumber ??
                call.options?.callerNumber ??
                call.options?.remoteCallerName ??
                ''
            );
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
              void post(t, 'ended', {
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
            t('shared.call.err.noAnswer', {
              stage: stageRef.current
                ? t('shared.call.err.stoppedAt', { stage: stageRef.current })
                : '',
            })
        );
      }, 15_000);

      await client.connect().catch((err: unknown) => {
        throw new Error(err instanceof Error ? err.message : t('shared.call.err.unreachable'));
      });
    } catch (err) {
      if (watchdog.current) clearTimeout(watchdog.current);
      watchdog.current = null;
      // A shift being restored on page load failed quietly: nobody asked for
      // this just now, so an alarming red line about it would be noise. The
      // button comes back and says the desk is off, which is true.
      if (options?.resuming) {
        setStatus('off');
        return;
      }
      setError(err instanceof Error ? err.message : t('shared.call.err.startPhone'));
      setStatus('error');
    }
  }, [teamMemberId, stopHeartbeat, startRinging, stopRinging, t]);

  /** Put the far end's audio into the page's own element. */
  const attachAudio = (call: any) => {
    const element = audioRef.current;
    const stream = call?.remoteStream;
    if (!element || !stream) return;
    element.srcObject = stream;
    void element.play().catch(() => {
      // Autoplay policy: the answer was a click, so this should not happen —
      // but a muted call is worse than a noisy console.
      setError(t('shared.call.err.audioBlocked'));
    });
  };

  /**
   * Who is ringing.
   *
   * The number the SDK reports is never the customer's: the server dials this
   * desk *from* the business line, so the invite says CoastPro's own number
   * whoever is calling. Showing it would tell the dispatcher they are being
   * rung by themselves, so nothing is claimed until the server says who it is.
   *
   * It is still passed along, where it serves only to tell two simultaneous
   * calls apart.
   */
  const lookUpCaller = async (from: string) => {
    setCaller({ fromDisplay: null, ...EMPTY_CARD });
    try {
      const response = await fetch(`/api/admin/dispatch/caller?from=${encodeURIComponent(from)}`);
      const body = await response.json();
      if (body?.context) {
        setCaller({
          fromDisplay: body.context.fromDisplay ?? null,
          match: body.context.match ?? 'new',
          client: body.context.client,
          history: body.context.history,
          activeJob: body.context.activeJob,
          lastJob: body.context.lastJob,
          recentJobs: body.context.recentJobs ?? [],
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
   * Come back on the phones after a reload.
   *
   * Only when the microphone is already ours. Asking for it without a click is
   * refused outright by some browsers, and an admin page that greeted the
   * dispatcher with a failed connection every morning would be worse than the
   * button they are trying to avoid pressing.
   */
  useEffect(() => {
    if (!teamMemberId) return;
    let cancelled = false;

    const resume = async () => {
      try {
        if (localStorage.getItem(ON_DUTY_KEY) !== '1') return;
      } catch {
        return;
      }
      if (!cancelled) await connect({ resuming: true });

      /**
       * Say so if the first call will interrupt itself to ask for a microphone.
       *
       * Not a failure — the prompt appears on Answer, which is a click, and it
       * works. But a dispatcher should know before the phone rings, not while
       * somebody is waiting on the line.
       */
      try {
        const permission = await navigator.permissions?.query({
          name: 'microphone' as PermissionName,
        });
        if (!cancelled && permission && permission.state !== 'granted') {
          setNotice(t('shared.call.notice.micLater'));
        }
      } catch {
        /* Safari has no such query; the prompt on Answer works there anyway */
      }
    };

    void resume();
    return () => {
      cancelled = true;
    };
    // Deliberately once per desk: this restores a shift, it does not follow
    // state. `connect` is stable for a given teamMemberId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamMemberId]);

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
   * Do not let a call be lost to a stray click.
   *
   * Everything inside the console navigates without reloading, so a call
   * survives being carried from screen to screen. Leaving the console
   * altogether — a typed address, a bookmark, closing the tab — cannot be made
   * survivable, so it is worth one question first.
   */
  useEffect(() => {
    if (status !== 'live' && status !== 'ringing') return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [status]);

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
      setError(t('shared.call.err.answer'));
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
              onClick={() => void connect()}
              className="h-8 rounded-card bg-ink px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-cream"
            >
              {t('shared.call.takeCalls')}
            </button>
            <span className={`text-xs ${error ? 'text-[#b3261e]' : 'text-gray-600'}`}>
              {error ?? t('shared.call.goingToPhone')}
            </span>
          </>
        ) : status === 'connecting' ? (
          <span className="text-xs text-gray-600">{stage ?? t('shared.call.connecting')}…</span>
        ) : status === 'ready' ? (
          <>
            <Dot colour="#0ca30c" />
            <span className="text-xs text-gray-600">{notice ?? t('shared.call.onDuty')}</span>
            <button
              type="button"
              onClick={disconnect}
              className="ml-auto h-8 rounded-card border border-primary-500/30 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink"
            >
              {t('shared.call.stop')}
            </button>
          </>
        ) : (
          <>
            <Dot colour={status === 'ringing' ? '#fab219' : '#0ca30c'} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="truncate text-sm font-medium text-ink">
                  {caller?.client?.name ?? caller?.fromDisplay ?? t('shared.call.incoming')}
                </span>
                {/* The number they are ringing from, always — it is not always
                    the one on their record, and the dispatcher may need to
                    ring back on this one. */}
                {caller?.client && caller.fromDisplay && (
                  <span className="text-xs text-gray-600">{caller.fromDisplay}</span>
                )}
                <span className="text-[11px] text-gray-500">
                  {status === 'ringing' ? t('shared.call.ringing') : formatDuration(seconds)}
                </span>

                {caller?.match === 'new' && caller.client === null && (
                  <Chip tone="neutral">{t('shared.call.firstTime')}</Chip>
                )}
                {caller?.history && caller.history.jobCount > 0 && (
                  <Chip tone="neutral">{t.plural(caller.history.jobCount, 'plural.job')}</Chip>
                )}
                {/* Money is said plainly or not at all. */}
                {caller?.history && caller.history.balanceDue > 0 && (
                  <Chip tone="warn">
                    {t('shared.call.owes', {
                      amount: money(caller.history.balanceDue, t.lang),
                    })}
                    {caller.history.unpaidCount > 1
                      ? ` · ${t.plural(caller.history.unpaidCount, 'plural.invoice')}`
                      : ''}
                  </Chip>
                )}
                {/* One number, several people on it: naming one of them would
                    be a guess, so say there is a choice to make. */}
                {caller?.match === 'multiple' && (
                  <Chip tone="warn">{t('shared.call.multiple')}</Chip>
                )}
              </div>

              <div className="truncate text-xs text-gray-600">
                {caller?.client?.address ?? ''}
              </div>

              {caller?.activeJob && (
                <div className="truncate text-xs text-ink">
                  <span className="font-medium">
                    {caller.activeJob.jobNumber ?? t('shared.call.booked')}
                  </span>
                  {caller.activeJob.type ? ` · ${caller.activeJob.type}` : ''}
                  {caller.activeJob.appliance ? ` · ${caller.activeJob.appliance}` : ''}
                  {whenLabel(caller.activeJob.scheduledAt, t.lang)
                    ? ` · ${whenLabel(caller.activeJob.scheduledAt, t.lang)}`
                    : ''}
                  {caller.activeJob.status ? ` · ${statusLabel(t, caller.activeJob.status)}` : ''}
                </div>
              )}

              {/* Only when there is nothing running — "what did you do for me
                  last time" is the second question, never the first. */}
              {!caller?.activeJob && caller?.lastJob && (
                <div className="truncate text-xs text-gray-600">
                  {t('shared.call.lastVisit')}
                  {dayLabel(caller.lastJob.completedAt, t.lang)
                    ? ` ${dayLabel(caller.lastJob.completedAt, t.lang)}`
                    : ''}
                  {caller.lastJob.appliance ? ` · ${caller.lastJob.appliance}` : ''}
                  {caller.lastJob.diagnosis ? ` · ${caller.lastJob.diagnosis}` : ''}
                </div>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              {status === 'ringing' && (
                <button
                  type="button"
                  onClick={answer}
                  className="h-8 rounded-card px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-cream"
                  style={{ backgroundColor: '#0ca30c' }}
                >
                  {t('shared.call.answer')}
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
                  {muted ? t('shared.call.unmute') : t('shared.call.mute')}
                </button>
              )}
              <button
                type="button"
                onClick={hangup}
                className="h-8 rounded-card px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-cream"
                style={{ backgroundColor: '#d03b3b' }}
              >
                {status === 'ringing' ? t('shared.call.decline') : t('shared.call.hangUp')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* The customer's last visits, under the bar rather than in it — five
          rows do not belong on a strip, and this is the thing a dispatcher
          reads while the phone is still ringing. */}
      {(status === 'ringing' || status === 'live') && caller?.recentJobs?.length ? (
        <div className="border-b border-primary-500/15 bg-[#fcfcfb] px-5 pb-2">
          <button
            type="button"
            onClick={() => setHistoryOpen((open) => !open)}
            className="font-heading text-[10px] uppercase tracking-label text-gray-500 hover:text-ink"
          >
            {historyOpen ? '▾' : '▸'} {t.plural(caller.recentJobs.length, 'shared.lastJobs')}
          </button>

          {historyOpen && (
            <div className="mt-1 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-xs">
                <tbody>
                  {caller.recentJobs.map((job) => (
                    <tr key={job.id} className="border-t border-primary-500/10">
                      <td className="whitespace-nowrap py-1 pr-3 text-gray-500">
                        {dayLabel(job.at, t.lang) ?? '—'}
                      </td>
                      <td className="whitespace-nowrap py-1 pr-3">
                        {/* A Link, emphatically not an anchor. A plain href
                            reloads the page, which takes this component down
                            with it and hangs up on the customer mid-sentence —
                            the call lives in the layout precisely so that
                            reading a job does not end it. */}
                        <Link
                          href={`/admin/calendar/${job.id}`}
                          className="font-medium text-ink hover:text-primary-600"
                        >
                          {job.jobNumber ?? t('common.job')}
                        </Link>
                      </td>
                      <td className="py-1 pr-3 text-gray-600">
                        {[job.type, job.appliance].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="whitespace-nowrap py-1 pr-2">
                        <Chip tone={jobTone(job.status)}>{statusLabel(t, job.status)}</Chip>
                      </td>
                      <td className="whitespace-nowrap py-1 pr-3">
                        <Chip tone={payTone(job.paymentStatus)}>
                          {payLabel(t, job.paymentStatus)}
                        </Chip>
                      </td>
                      <td className="whitespace-nowrap py-1 text-right text-gray-600">
                        {job.total > 0 ? money(job.total, t.lang) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
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
