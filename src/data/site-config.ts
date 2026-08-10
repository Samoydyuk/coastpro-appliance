export const siteConfig = {
  name: "CoastPro Appliance Repair",
  tagline: "Orange County's Trusted Appliance Repair Experts",
  description: "Professional appliance repair services in Orange County, CA. Same-day service, 90-day warranty on all repairs. We fix refrigerators, washers, dryers, dishwashers, and more.",

  contact: {
    phone: "(949) 749-0006",
    phoneClean: "9497490006",
    email: "appliance@coastpro.us",
    address: {
      street: "",
      city: "Irvine",
      state: "CA",
      zip: "",
      full: "Irvine, CA",
    },
  },

  appointment: {
    arrivalWindow: "3-hour",
    noticeMinutes: 30,
  },

  businessHours: {
    weekdays: "9:00 AM - 8:00 PM",
    saturday: "9:00 AM - 8:00 PM",
    sunday: "9:00 AM - 8:00 PM",
    emergency: "24/7 Emergency Service Available",
  },

  trustSignals: {
    sameDayService: true,
    warrantyDays: 90,
  },

  seo: {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://coastpro.us",
    locale: "en_US",
    twitterHandle: "@coastproappliance",
  },

  pricing: {
    // The published range covers most jobs; premium brands and awkward
    // faults legitimately run past it, so never present it as a ceiling.
    rangeNote:
      "Typical range for most jobs. High-end brands and complex faults can run higher — you approve the quote before any work starts.",
  },

  serviceCall: {
    minimum: 150,
    // Short line for banners and footnotes.
    note: "Quick fixes included",
    // The kind of work the call itself covers, spelled out.
    includes: "resets, adjustments, leveling and other work that takes only a few minutes",
  },
} as const;

export type SiteConfig = typeof siteConfig;
