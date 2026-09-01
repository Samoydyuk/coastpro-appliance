/**
 * Trades CoastPro sends work to, and everything that backs the recommendation.
 *
 * A "trusted partner" page is only worth the words if the trust is shown rather
 * than asserted, so nothing here is our opinion of anybody: every number, every
 * review and every photograph comes off the partner's own public profile, and
 * `proof.checkedOn` says when it was read. Numbers on somebody else's platform
 * keep moving; a figure printed without a date quietly becomes a false claim
 * about six months from now, and the date is what stops that.
 *
 * Fields left `null` render nothing at all rather than a placeholder — see the
 * portrait handling in components/sections/Technician.tsx for the same idea.
 */

export interface PartnerReview {
  author: string;
  /** ISO, formatted for display at render time. */
  date: string;
  /** The job category the review was filed under, in the platform's wording. */
  job: string;
  text: string;
}

export interface Partner {
  slug: string;
  name: string;
  trade: string;
  city: string;
  yearsInBusiness: number;
  crewSize: number;
  respondsIn: string;
  proof: {
    url: string;
    platform: string;
    hires: number;
    reviews: number;
    rating: number;
    /** Share of reviews at five stars, as the platform reports it. */
    fiveStarShare: string;
    photos: number;
    topPro: number[];
    backgroundChecked: boolean;
    /** Date the figures above were read off the profile. */
    checkedOn: string;
  };
  quote: string;
  /** What reviewers keep saying, and how often — the platform's own tally. */
  keywords: Array<{ word: string; count: number }>;
  reviews: PartnerReview[];
  photos: Array<{ file: string; alt: string; caption: string }>;
  work: Array<{ group: string; note: string; items: string[] }>;
  payments: string[];
  /** Relative to /images/partners/<slug>/, or null while there is none. */
  portrait: string | null;
  /** Filled in only if the partner agrees to be contacted directly. */
  direct: { phone: string; phoneClean: string; email: string } | null;
}

export const partners: Partner[] = [
  {
    slug: 'ivan-smith',
    name: 'Ivan Smith',
    // Not "handyman". The reviews say what he is actually known for, and the
    // tally under `keywords` is not close: treadmill 52, elliptical 11,
    // fitness 10, belt 8. Leading with the twenty-item service list would bury
    // the one claim that is genuinely proven.
    trade: 'Handyman & fitness equipment repair',
    city: 'Irvine, CA',
    yearsInBusiness: 24,
    crewSize: 2,
    respondsIn: 'about a minute',

    proof: {
      url: 'https://www.thumbtack.com/ca/irvine/handyman/ivan-smith/service/483119853227147272',
      platform: 'Thumbtack',
      hires: 1070,
      reviews: 788,
      rating: 5.0,
      fiveStarShare: '98%',
      photos: 339,
      topPro: [2023, 2024, 2025],
      backgroundChecked: true,
      checkedOn: '2026-08-30',
    },

    quote:
      'My task is to save you from household chores, because there are much more pleasant things in life that are worth spending your time on.',

    keywords: [
      { word: 'fix', count: 104 },
      { word: 'treadmill', count: 52 },
      { word: 'repair', count: 50 },
      { word: 'equipment', count: 15 },
      { word: 'machine', count: 13 },
      { word: 'parts', count: 12 },
      { word: 'elliptical', count: 11 },
      { word: 'fitness', count: 10 },
      { word: 'belt', count: 8 },
      { word: 'maintenance', count: 5 },
    ],

    // Verbatim, spelling and emphasis included. Five is what the profile serves
    // in its page source; the other 783 load behind a script we do not scrape.
    reviews: [
      {
        author: 'Walter T.',
        date: '2026-06-01',
        job: 'Exercise Equipment Repair',
        text: 'Ivan and his partner came early. He responded super quickly over the weekend. They worked fast and explained what they were doing as they diagnosed the problem. Very straightforward and fair pricing. My treadmill is back up and running! Thank you Ivan!!!',
      },
      {
        author: 'Daniel A.',
        date: '2026-03-19',
        job: 'Exercise Equipment Repair',
        text: 'I am definitely recommending this guy to anyone that could use his services, he’s very knowledgeable, quick, and reliable. He fixed my treadmill and figured the problem effortlessly and fixed it right away!',
      },
      {
        author: 'Tamerie H.',
        date: '2026-02-21',
        job: 'Exercise Equipment Repair',
        text: 'Ivan let me know almost as soon as I posted that he could be available that day. I had an appointment and let him know when I would be home. He got right back to me with a time frame, and it was all set up. He came when he said he would. It took him about 10 seconds to realize what the problem was and maybe 10 or 15 minutes to fix it. Since my exercise bike was apparently assembled incorrectly, after Ivan finished, it worked great, and is now without the annoying noise I put up with for the last 4 years. If we have need of any other repair, we will definitely be calling Ivan.',
      },
      {
        author: 'CELINE T.',
        date: '2026-02-12',
        job: 'Dishwasher Installation',
        text: 'He is so on top of it, I like it. VERY fast, like the speed of light when it comes to responding and coming out. We needed assistance with a full appliance re-installation / repair. Ivan came right away and provided very fair pricing.',
      },
      {
        author: 'Lindsey S.',
        date: '2026-01-10',
        job: 'Exercise Equipment Repair',
        text: 'Ivan and his brother make one hell of a team. They responded to our request within minutes and were able to arrive to our house to diagnose and make the repairs the same day! Very cost effective, super nice and communicated through the whole process very well! Will use for future jobs and recommend to anyone and everyone!',
      },
    ],

    // Three, not the 339 on the profile: the rest are served by a script, and
    // of what the page does hand over, most turned out to be reviewers' avatars
    // rather than his work. Three photographs of finished jobs say more than a
    // grid padded out with other people's profile pictures.
    photos: [
      {
        file: '01-wall-mount.jpeg',
        alt: 'Articulating wall mount bolted to a painted wall',
        caption: 'Wall mount',
      },
      {
        file: '02-pendant-light.jpeg',
        alt: 'Woven rattan pendant light hung and wired from a ceiling rose',
        caption: 'Pendant light',
      },
      {
        file: '03-bunk-bed.jpeg',
        alt: 'Assembled wooden bunk bed with mattresses in a child’s bedroom',
        caption: 'Bunk bed, assembled',
      },
    ],

    // All twenty services from the profile, grouped the way somebody looking
    // for one of them would think about it. Fitness equipment first: it is the
    // only group the reviews actually prove.
    work: [
      {
        group: 'Fitness equipment',
        note: 'What the reviews are almost entirely about.',
        items: [
          'Exercise equipment repair',
          'Fitness equipment assembly',
          'Treadmill',
          'Elliptical',
          'Exercise bike',
          'Stair climber',
        ],
      },
      {
        group: 'Mount & hang',
        note: 'Anything that has to hold weight on a wall or a ceiling.',
        items: [
          'TV mounting',
          'Lighting installation',
          'Fan installation',
          'Picture hanging and art installation',
          'Closet and shelving system installation',
          'Cabinet installation',
        ],
      },
      {
        group: 'Assemble',
        note: 'Flat-pack, garden and playground.',
        items: [
          'Furniture assembly',
          'Play equipment construction and assembly',
          'Screen installation or replacement',
        ],
      },
      {
        group: 'Plumbing fixtures',
        note: 'Swapping a fixture, not chasing a leak in the wall.',
        items: [
          'Sink or faucet installation or replacement',
          'Toilet installation or replacement',
          'Garbage disposal installation',
        ],
      },
      {
        group: 'Around the house',
        note: 'General handyman work.',
        items: [
          'Handyman',
          'Door repair',
          'Lawn mower repair',
          'Appliance installation',
          'Appliance repair or maintenance',
          'Dishwasher installation',
        ],
      },
    ],

    payments: ['Apple Pay', 'Cash', 'Venmo', 'Zelle'],

    portrait: 'portrait.jpeg',
    direct: null,
  },
];

export function getPartnerBySlug(slug: string): Partner | undefined {
  return partners.find((partner) => partner.slug === slug);
}
