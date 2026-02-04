'use client';

import { InlineWidget } from 'react-calendly';

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
  return (
    <div className="calendly-container">
      <InlineWidget
        url={url}
        styles={{
          height: '700px',
          minWidth: '320px',
        }}
        pageSettings={{
          backgroundColor: 'ffffff',
          hideEventTypeDetails: false,
          hideLandingPageDetails: false,
          primaryColor: '2563eb',
          textColor: '1f2937',
        }}
        prefill={prefill}
        utm={utm}
      />
    </div>
  );
}
