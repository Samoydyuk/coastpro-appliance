'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/components/admin/LanguageProvider';

export interface ConnectionState {
  provider: 'google' | 'meta' | 'search-console';
  label: string;
  /** Whether the app itself is registered — nothing can be connected without it. */
  appReady: boolean;
  /** What is connected right now, in words. */
  connectedAs: string | null;
  connectedAt: string | null;
  /** What to do about it when the app is not registered. */
  setupHint: string;
  /**
   * Set when a key in the environment is doing the work instead of a signed-in
   * account. Nothing here can connect or disconnect it — the buttons would be
   * lies — so the card shows the identity and stays out of the way.
   */
  managedByKey?: string | null;
}

/**
 * Connect and disconnect, in the place the numbers appear.
 *
 * The distinction the copy has to keep making: registering the *application*
 * with Google and Meta is a one-time job somebody does in a developer console,
 * and no button here can do it. Connecting an *account* is the recurring one —
 * after a password change, after consent is withdrawn — and that is what this
 * turns into a click instead of an edit-and-redeploy.
 */
export function PresenceConnections({ connections }: { connections: ConnectionState[] }) {
  const router = useRouter();
  const t = useT();
  const [busy, setBusy] = useState<string | null>(null);

  const disconnect = async (provider: string, label: string) => {
    if (!confirm(t('marketing.presence.disconnectConfirm', { label }))) return;
    setBusy(provider);
    try {
      await fetch('/api/admin/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', provider }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const button =
    'h-8 rounded-card border border-primary-500/40 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-ink transition-colors hover:bg-cream-dark/50 disabled:opacity-50';

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {connections.map((connection) => (
        <div
          key={connection.provider}
          className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-primary-500/25 bg-cream-light px-4 py-3"
        >
          <div className="min-w-0">
            <div className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
              {connection.label}
            </div>
            <p className="mt-0.5 truncate text-[11px] text-gray-600">
              {connection.managedByKey
                ? connection.managedByKey
                : !connection.appReady
                  ? connection.setupHint
                  : connection.connectedAs
                    ? connection.connectedAs
                    : t('marketing.presence.notConnected')}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            {connection.managedByKey && (
              <span className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
                {t('marketing.presence.key')}
              </span>
            )}
            {!connection.managedByKey && connection.appReady && (
              <a href={`/api/admin/presence/connect/${connection.provider}`} className={button}>
                {connection.connectedAs
                  ? t('marketing.presence.reconnect')
                  : t('marketing.presence.connect')}
              </a>
            )}
            {!connection.managedByKey && connection.connectedAs && (
              <button
                type="button"
                disabled={busy === connection.provider}
                onClick={() => disconnect(connection.provider, connection.label)}
                className={button}
              >
                {busy === connection.provider ? '…' : t('marketing.presence.disconnect')}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
