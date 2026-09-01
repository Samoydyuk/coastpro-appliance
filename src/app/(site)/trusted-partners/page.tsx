import fs from 'node:fs';
import path from 'node:path';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Phone, ShieldCheck, Award, MapPin, Star, ArrowUpRight } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { CTABanner } from '@/components/sections';
import { getPartnerBySlug } from '@/data/partners';
import { services } from '@/data/services';
import { siteConfig } from '@/data/site-config';

/**
 * Ivan's page, on our domain.
 *
 * The first draft opened with our referral programme and kept him waiting until
 * the third screen — accurate, and it read as a page about CoastPro that
 * happened to mention a handyman. So the order is inverted: his name, his face,
 * his words and his eight hundred reviews come first, and everything said in
 * our voice — why we vouch for him, where his work stops and ours starts, how a
 * call reaches him — is compressed into one band at the end. He is the subject;
 * we are the reference.
 *
 * Every figure, review and photograph came off his own public profile and is
 * dated — see data/partners.ts on why the date matters more than the numbers.
 *
 * Kept out of the index, the sitemap and every menu: it exists to be shown to
 * Ivan and agreed with him first. Publishing it is four edits — this `robots`
 * block, STATIC_ROUTES in app/sitemap.ts, pageUpdated in data/content-dates.ts,
 * and wherever it should finally be linked from.
 */
export const metadata: Metadata = {
  title: 'Ivan Smith — trusted partner',
  description:
    'Ivan Smith, handyman and fitness equipment repair in Irvine — the trade CoastPro sends work to when a job is not appliance repair.',
  robots: { index: false, follow: false },
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** '2026-06-01' → 'June 2026'. Parsed from the parts so no timezone shifts it. */
function monthYear(iso: string): string {
  const [year, month] = iso.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

/** '2026-08-30' → '30 August 2026'. */
function fullDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}

/**
 * A portrait if the file is really there, and no grey box if it is not — the
 * same check components/sections/Technician.tsx makes, for the same reason.
 */
function portraitSrc(slug: string, file: string | null): string | null {
  if (!file) return null;
  const src = `/images/partners/${slug}/${file}`;
  try {
    return fs.existsSync(path.join(process.cwd(), 'public', src.replace(/^\//, ''))) ? src : null;
  } catch {
    return null;
  }
}

/** Three sizes, not a continuous scale: 104 against 5 would be unreadable. */
function keywordSize(count: number): string {
  if (count >= 50) return 'text-xl sm:text-2xl';
  if (count >= 12) return 'text-base sm:text-lg';
  return 'text-sm';
}

export default function TrustedPartnersPage() {
  const partner = getPartnerBySlug('ivan-smith');
  if (!partner) return null;

  const { proof } = partner;
  const portrait = portraitSrc(partner.slug, partner.portrait);
  const callHref = partner.direct
    ? `tel:${partner.direct.phoneClean}`
    : `tel:${siteConfig.contact.phoneClean}`;
  const callLabel = partner.direct ? partner.direct.phone : siteConfig.contact.phone;

  const stats = [
    { value: String(partner.yearsInBusiness), unit: 'years', label: 'In the trade' },
    {
      value: proof.hires.toLocaleString('en-US'),
      unit: 'jobs',
      label: `Hired through ${proof.platform}`,
    },
    {
      value: String(proof.reviews),
      unit: 'reviews',
      label: `${proof.fiveStarShare} of them five stars`,
    },
    { value: proof.rating.toFixed(1), unit: 'rating', label: 'Out of five, across all of them' },
  ];

  return (
    <>
      {/* Comes off the day this goes public — along with the robots block. */}
      <div className="bg-ink py-2">
        <div className="container mx-auto px-4">
          <p className="text-center font-heading text-[10px] font-semibold uppercase tracking-label text-primary-300">
            Preview — not published yet
          </p>
        </div>
      </div>

      {/* His name and his face on the first screen. The eyebrow is the only
          thing here in our voice, and it is four words long. */}
      <section className="bg-cream border-b border-primary-500/20 py-10 lg:py-14">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-primary-500 mb-8">
            <Link href="/" className="hover:text-ink transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-ink">{partner.name}</span>
          </nav>

          <div
            className={`grid gap-8 lg:gap-12 items-center ${
              portrait ? 'md:grid-cols-[0.7fr_1.3fr]' : 'max-w-3xl'
            }`}
          >
            {portrait && (
              <div className="relative aspect-square overflow-hidden rounded-card bg-primary-800 max-w-[280px] md:max-w-none">
                <Image
                  src={portrait}
                  alt={`${partner.name}, ${partner.trade.toLowerCase()} in ${partner.city}`}
                  fill
                  sizes="(min-width: 768px) 35vw, 280px"
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <div>
              <div className="eyebrow mb-3">A CoastPro trusted partner</div>

              <h1 className="headline text-3xl sm:text-4xl md:text-5xl">{partner.name}</h1>
              <p className="font-heading text-sm sm:text-base font-semibold uppercase tracking-label text-primary-500 mt-3">
                {partner.trade}
              </p>

              <div className="flex items-center gap-2 text-gray-600 mt-3 mb-6">
                <MapPin className="h-4 w-4 shrink-0 text-primary-500" strokeWidth={1.5} />
                <span>
                  {partner.city} · {partner.yearsInBusiness} years · crew of {partner.crewSize}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-7">
                {proof.topPro.length > 0 && (
                  <Badge variant="info">
                    <Award className="h-3 w-3 mr-1.5" strokeWidth={2} />
                    Top Pro {proof.topPro.join(' · ')}
                  </Badge>
                )}
                {proof.backgroundChecked && (
                  <Badge variant="success">
                    <ShieldCheck className="h-3 w-3 mr-1.5" strokeWidth={2} />
                    Background checked
                  </Badge>
                )}
                <Badge>Replies in {partner.respondsIn}</Badge>
              </div>

              {/* His sentence, not ours, doing the work a lead paragraph does. */}
              <blockquote className="border-l-2 border-primary-500/40 pl-5 mb-7">
                <p className="font-heading text-lg sm:text-xl font-semibold uppercase leading-tight tracking-tight text-ink max-w-prose">
                  &ldquo;{partner.quote}&rdquo;
                </p>
              </blockquote>

              <div className="flex flex-col sm:flex-row gap-3">
                <a href={callHref}>
                  <Button leftIcon={<Phone className="h-4 w-4" />}>{callLabel}</Button>
                </a>
                <a href={proof.url} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    className="border-ink text-ink hover:bg-ink hover:text-cream"
                    rightIcon={<ArrowUpRight className="h-4 w-4" />}
                  >
                    {proof.platform} profile
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary-900 py-10 lg:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`px-2 lg:px-8 ${i !== 0 ? 'lg:border-l lg:border-cream/15' : ''}`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-3xl lg:text-4xl font-extrabold text-cream leading-none">
                    {stat.value}
                  </span>
                  <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-400">
                    {stat.unit}
                  </span>
                </div>
                <p className="mt-3 text-[13px] text-primary-300 leading-snug">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Figures on somebody else's platform keep moving. Undated they turn
              into a false claim on their own, without anybody touching the page. */}
          <p className="mt-8 text-[13px] text-primary-400">
            Read off his{' '}
            <a
              href={proof.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cream underline underline-offset-4 hover:text-primary-200 transition-colors"
            >
              {proof.platform} profile
            </a>{' '}
            on {fullDate(proof.checkedOn)} — check there, not here, for today&rsquo;s.
          </p>
        </div>
      </section>

      <section className="py-14 lg:py-16 bg-cream">
        <div className="container mx-auto px-4">
          <div className="eyebrow mb-3">01 — What customers keep saying</div>
          <h2 className="headline text-2xl sm:text-3xl mb-6">
            Not the rating. <span className="headline-muted">The words underneath it.</span>
          </h2>
          <p className="text-base leading-relaxed text-gray-600 max-w-prose mb-8">
            {proof.platform}&rsquo;s own count of the words that turn up across all {proof.reviews}{' '}
            reviews. Ivan lists twenty services and can do them — what customers keep paying him for,
            over and over, is fixing exercise machines.
          </p>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 mb-12">
            {partner.keywords.map((keyword) => (
              <span
                key={keyword.word}
                className="inline-flex items-baseline gap-1.5 border border-primary-500/25 px-3 py-1.5"
              >
                <span
                  className={`font-heading font-extrabold uppercase tracking-tight text-ink ${keywordSize(
                    keyword.count
                  )}`}
                >
                  {keyword.word}
                </span>
                <span className="font-heading text-[10px] font-semibold uppercase tracking-label text-primary-500">
                  {keyword.count}
                </span>
              </span>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {partner.reviews.map((review) => (
              <Card key={`${review.author}-${review.date}`} className="flex">
                <CardContent className="flex flex-col p-5">
                  <div className="flex items-center gap-0.5 mb-4" aria-label="Five out of five">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star
                        key={i}
                        className="h-3 w-3 fill-primary-600 text-primary-600"
                        strokeWidth={0}
                        aria-hidden="true"
                      />
                    ))}
                  </div>

                  <p className="text-[15px] leading-relaxed text-gray-600 mb-5 flex-grow">
                    {review.text}
                  </p>

                  <div className="pt-4 border-t border-primary-500/20">
                    <p className="font-heading text-[13px] font-bold uppercase tracking-label text-ink">
                      {review.author}
                    </p>
                    <p className="text-[13px] text-gray-600 mt-0.5">
                      {review.job} · {monthYear(review.date)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-6 text-sm text-gray-600">
            Word for word from his profile — the five it puts on its own front page.{' '}
            <a
              href={proof.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline underline-offset-4 hover:text-primary-600 transition-colors"
            >
              Read the other {proof.reviews - partner.reviews.length}
              <ArrowUpRight className="inline h-3.5 w-3.5 ml-0.5" strokeWidth={2} />
            </a>
          </p>
        </div>
      </section>

      <section className="py-14 lg:py-16 bg-cream-dark/40 border-y border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="eyebrow mb-3">02 — His work</div>
          <h2 className="headline text-2xl sm:text-3xl mb-10">
            Finished jobs, <span className="headline-muted">and everything he takes on.</span>
          </h2>

          <div className="grid gap-5 sm:grid-cols-3">
            {partner.photos.map((photo) => (
              <figure key={photo.file} className="group">
                <div className="relative aspect-[4/3] overflow-hidden bg-primary-800">
                  <Image
                    src={`/images/partners/${partner.slug}/${photo.file}`}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <figcaption className="mt-3 font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                  {photo.caption}
                </figcaption>
              </figure>
            ))}
          </div>

          <p className="mt-4 mb-12 text-sm text-gray-600">
            Three of the {proof.photos} on his profile —{' '}
            <a
              href={proof.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline underline-offset-4 hover:text-primary-600 transition-colors"
            >
              the rest are there
              <ArrowUpRight className="inline h-3.5 w-3.5 ml-0.5" strokeWidth={2} />
            </a>
          </p>

          <div className="space-y-7">
            {partner.work.map((group) => (
              <div key={group.group} className="sm:grid sm:grid-cols-[180px_1fr] sm:gap-8">
                <div className="mb-3 sm:mb-0">
                  <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                    {group.group}
                  </h3>
                  <p className="text-[13px] text-gray-600 mt-1">{group.note}</p>
                </div>
                <div className="flex flex-wrap gap-2 content-start">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1.5 border border-primary-500/25 font-heading text-[10px] font-semibold uppercase tracking-label text-ink"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Everything in our voice, in one band, at the end. Why we vouch for him,
          where his work stops and ours starts, and how a call reaches him —
          three short columns rather than three full sections, because on his
          page our reasoning is a footnote and not the argument. */}
      <section className="py-14 lg:py-16 bg-cream">
        <div className="container mx-auto px-4">
          <div className="eyebrow mb-3">03 — The arrangement</div>
          <h2 className="headline text-2xl sm:text-3xl mb-10">
            He installs it. <span className="headline-muted">We repair it.</span>
          </h2>

          <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
            <div>
              <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-4">
                Why we vouch for him
              </h3>
              <ul className="space-y-3 text-[15px] leading-relaxed text-gray-600">
                <li>Twenty-four years in one trade — long enough to have met the awkward version of the job.</li>
                <li>
                  {proof.reviews} reviews on a platform where the customer, not the contractor,
                  decides what gets published.
                </li>
                <li>Identity and background verified, with the check on file.</li>
                <li>A line agreed out loud, so nobody quotes twice on the same job.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-4">
                Where the line falls
              </h3>
              <p className="text-[15px] leading-relaxed text-gray-600 mb-4">
                His list includes appliance installation, which touches ours. The split: Ivan puts
                the new machine in, hangs it, wires it or builds it — and handles the whole exercise
                equipment side, which we have never done. A machine that has{' '}
                <em className="not-italic text-ink">broken</em> stays with us.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {services.map((service) => (
                  <Link
                    key={service.slug}
                    href={`/services/${service.slug}`}
                    className="px-2.5 py-1 border border-primary-500/25 hover:border-ink hover:bg-cream-dark/50 transition-colors font-heading text-[10px] font-semibold uppercase tracking-label text-ink"
                  >
                    {service.name.replace(' Repair', '')}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-4">
                {partner.direct ? 'Calling him' : 'Reaching him'}
              </h3>
              {partner.direct ? (
                <p className="text-[15px] leading-relaxed text-gray-600">
                  Call {partner.direct.phone} and say CoastPro sent you. Price and date are his — we
                  take no cut and do not set his rates.
                </p>
              ) : (
                <p className="text-[15px] leading-relaxed text-gray-600">
                  Ring {siteConfig.contact.phone} as usual. If it is a broken appliance we book it
                  ourselves; if it is a mount, an install or a treadmill we hand you to Ivan there
                  and then. Price and date are his — we take no cut.
                </p>
              )}
              <p className="text-[15px] leading-relaxed text-gray-600 mt-4">
                He takes {partner.payments.slice(0, -1).join(', ')} and{' '}
                {partner.payments[partner.payments.length - 1]}, and replies in{' '}
                {partner.respondsIn}.
              </p>
              <p className="text-[13px] text-gray-500 mt-4">
                If it goes wrong we want to hear about it. It was our recommendation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        title={`Need ${partner.name.split(' ')[0]}?`}
        subtitle={`Describe the job on the phone and we will tell you straight away whether it is his or ours. Call ${siteConfig.contact.phone}.`}
        // The $150 minimum is ours and covers our visit. Leaving the standard
        // footnote here would attach it to Ivan's work, which it has nothing to
        // do with — his prices are his own.
        note={`Our $${siteConfig.serviceCall.minimum} minimum applies to CoastPro appliance repair visits only. ${partner.name} sets his own prices.`}
      />
    </>
  );
}
