// Google Analytics & Ads conversion tracking utilities
//
// Every helper here now reports twice: once to Google, and once to our own
// collector at /api/track. The two answer different questions — Google's copy
// feeds the ad platform's bidding, ours feeds the admin panel and survives the
// ad blockers that eat a third of the Google copy.

import { track } from '@/lib/analytics';

/**
 * The GA4 properties this site reports to. Both are live: the second was added
 * without retiring the first, so the changeover leaves no gap in the reporting.
 *
 * Nothing here routes events — `window.gtag('event', …)` delivers to every
 * property configured in the layout, which is why the helpers below name no
 * property at all. These are for reference and for anything that needs to
 * address a property directly.
 */
export const GA_MEASUREMENT_ID = 'G-W9Q0EMD7Q5';
export const GA_MEASUREMENT_ID_2 = 'G-YHP77HZFZ8';

// Track custom events in Google Analytics
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Predefined conversion events
export const trackPhoneClick = (location: string) => {
  trackEvent('phone_click', 'contact', location);
  track('click_phone', { label: location });
};

export const trackBookNowClick = (location: string) => {
  trackEvent('book_now_click', 'conversion', location);
  track('click_cta', { label: location });
};

export const trackFormSubmit = (formName: string) => {
  trackEvent('form_submit', 'conversion', formName);
  track('form_submit', { label: formName });
};

export const trackFormStart = (formName: string) => {
  track('form_start', { label: formName });
};

export const trackFormField = (formName: string, field: string) => {
  track('form_field', { label: field, meta: { form: formName } });
};

export const trackFormError = (formName: string, fields: string[]) => {
  track('form_error', { label: formName, meta: { fields } });
};



// Google Ads conversion tracking (will be activated when AW-ID is added)
export const trackAdsConversion = (conversionLabel: string) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', {
      send_to: conversionLabel,
    });
  }
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}
