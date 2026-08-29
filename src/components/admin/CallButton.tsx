'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/components/admin/LanguageProvider';

/**
 * The phone number on a record, made dialable.
 *
 * Asks the call bar to ring the number on the business line, so the customer
 * sees the number that is printed on the van rather than somebody's mobile.
 *
 * If there is no desk on this page — no dispatcher seat, so no call bar — this
 * stays an ordinary `tel:` link and hands off to whatever the machine uses for
 * phone calls. A button that looks live and does nothing is worse than a link.
 */
export function CallButton({
  phone,
  name,
  clientId,
}: {
  phone: string;
  name?: string;
  clientId?: string;
}) {
  const t = useT();
  const [desk, setDesk] = useState(false);

  useEffect(() => {
    // The bar marks the document when it mounts; read it after paint so this
    // never disagrees with the server-rendered markup.
    setDesk(document.documentElement.dataset.coastproPhone === 'on');
  }, []);

  if (!desk) {
    return (
      <a href={`tel:${phone}`} className="text-ink hover:text-primary-600">
        {phone}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent('coastpro:call', {
            detail: { toE164: phone, name: name ?? '', clientId },
          })
        )
      }
      className="inline-flex items-center gap-1.5 text-ink underline decoration-primary-500/40 underline-offset-2 hover:text-primary-600"
      title={t('shared.callButton.title')}
    >
      {phone}
      <span aria-hidden className="text-[11px] text-primary-600">
        {t('shared.callButton.action')}
      </span>
    </button>
  );
}
