// Google Analytics & Ads conversion tracking utilities

export const GA_MEASUREMENT_ID = 'G-W9Q0EMD7Q5';

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
};

export const trackBookNowClick = (location: string) => {
  trackEvent('book_now_click', 'conversion', location);
};

export const trackFormSubmit = (formName: string) => {
  trackEvent('form_submit', 'conversion', formName);
};

export const trackCalendlyBooking = () => {
  trackEvent('calendly_booking', 'conversion', 'appointment_scheduled');
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
