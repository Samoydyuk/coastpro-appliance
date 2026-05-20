export const siteConfig = {
  name: "CoastPro Appliance Repair",
  tagline: "Orange County's Trusted Appliance Repair Experts",
  description: "Professional appliance repair services in Orange County, CA. Same-day service, 90-day warranty on all repairs. We fix refrigerators, washers, dryers, dishwashers, and more.",

  contact: {
    phone: "(949) 449-1008",
    phoneClean: "9494491008",
    email: "appliance@coastpro.us",
    address: {
      street: "",
      city: "Irvine",
      state: "CA",
      zip: "",
      full: "Irvine, CA",
    },
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

  serviceFee: {
    diagnostic: 75,
    note: "Waived with repair",
  },
} as const;

export type SiteConfig = typeof siteConfig;
