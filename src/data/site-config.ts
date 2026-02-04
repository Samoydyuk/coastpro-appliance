export const siteConfig = {
  name: "CoastPro Appliance Repair",
  tagline: "Orange County's Trusted Appliance Repair Experts",
  description: "Professional appliance repair services in Orange County, CA. Same-day service, 90-day warranty on all repairs. We fix refrigerators, washers, dryers, dishwashers, and more.",

  contact: {
    phone: "(949) 555-0123",
    phoneClean: "9495550123",
    email: "info@coastproappliance.com",
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

  social: {
    facebook: "https://facebook.com/coastproappliance",
    instagram: "https://instagram.com/coastproappliance",
    yelp: "https://yelp.com/biz/coastpro-appliance",
    google: "https://g.page/coastpro-appliance",
  },

  trustSignals: {
    repairsCompleted: "50,000+",
    satisfactionRate: "98%",
    sameDayService: true,
    warrantyDays: 90,
  },

  seo: {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://coastpro.us",
    locale: "en_US",
    twitterHandle: "@coastproappliance",
  },

  serviceFee: {
    diagnostic: 89,
    note: "Waived with repair",
  },
} as const;

export type SiteConfig = typeof siteConfig;
