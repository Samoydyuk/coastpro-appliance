'use client';

import { InlineWidget, useCalendlyEventListener } from 'react-calendly';
import { trackCalendlyBooking } from '@/lib/gtag';

interface PrefillData {
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  customAnswers?: Record<string, string>;
}

interface CalendlyEmbedProps {
  url?: string;
  prefill?: PrefillData;
  utm?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  };
}

export function CalendlyEmbed({
  url = 'https://calendly.com/samoydyuk88/30min',
  prefill,
  utm,
}: CalendlyEmbedProps) {
  // Calendly posts a message into the page when a time is confirmed. The
  // webhook is the authoritative record, but this fires immediately and works
  // even before the webhook is connected, so the booking is never invisible.
  useCalendlyEventListener({
    onEventScheduled: () => {
      trackCalendlyBooking();
      fetch('/api/calendly/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: prefill?.email, name: prefill?.name }),
        credentials: 'same-origin',
        keepalive: true,
      }).catch(() => {
        /* the webhook will catch it */
      });
    },
  });

  return (
    <div className="calendly-container">
      <InlineWidget
        url={url}
        styles={{
          height: '700px',
          minWidth: '320px',
        }}
        pageSettings={{
          backgroundColor: 'f8f7f4',
          hideEventTypeDetails: false,
          hideLandingPageDetails: false,
          primaryColor: '8b7b6e',
          textColor: '111111',
        }}
        prefill={prefill}
        utm={utm}
      />
    </div>
  );
}
