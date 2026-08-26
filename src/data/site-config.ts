export const siteConfig = {
  name: "CoastPro Appliance Repair",
  tagline: "Orange County's Trusted Appliance Repair Experts",
  description: "Appliance repair across Orange County, CA — refrigerators, washers, dryers, dishwashers and ovens. Same-day service, 90-day warranty, $150 service call.",

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

  /**
   * Where else this business exists, as `sameAs` in the structured data.
   *
   * This is the line Google follows from the site to the Business Profile, and
   * the profile is what puts a local trade into the map pack — which is where
   * most of this trade's customers actually start. Until a profile exists there
   * is nothing to point at, so the list is empty and the property is omitted
   * rather than sent blank.
   *
   * Fill each in as it goes live. Same name, same phone, same everything as
   * `contact` above — a citation that disagrees with the site is worse than no
   * citation, and the old (949) 449-1008 number is still out there. As of
   * 2026-08-26 it is still first in the Instagram bio, above the current one,
   * which is the live source everything else is copying from.
   */
  profiles: ['https://www.instagram.com/coastpro/'],

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
    includes: "resets, adjustments, leveling and other work that doesn't take long",
    // What happens to the fee when the job turns out to be a real repair. This
    // is the thing customers are actually worried about when they hear a
    // minimum — that agreeing to the work means paying for the visit twice —
    // so it is said plainly wherever the minimum is.
    appliedToRepair:
      "Approve the repair and this becomes part of its labor — you don't pay for the visit twice",
  },
} as const;

export type SiteConfig = typeof siteConfig;
