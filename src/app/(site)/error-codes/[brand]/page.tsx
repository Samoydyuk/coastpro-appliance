import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Phone, ArrowRight, Info } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { CTABanner } from '@/components/sections';
import {
  brandErrorCodes,
  getErrorCodesForBrand,
  serviceSlugForAppliance,
  COST_BAND_COPY,
  CODE_CAVEAT_SHORT,
  VERDICT_COPY,
  type CodeVerdict,
  type ErrorCode,
} from '@/data/error-codes';
import { getBrandBySlug } from '@/data/brands';
import { getServiceBySlug } from '@/data/services';
import { errorCodesUpdated, updatedAt } from '@/data/content-dates';
import { photoCaptions } from '@/data/work-photos';
import { siteConfig } from '@/data/site-config';
import { breadcrumbSchema } from '@/lib/schema';

interface CodesPageProps {
  params: Promise<{ brand: string }>;
}

export async function generateStaticParams() {
  return brandErrorCodes.map((entry) => ({ brand: entry.brandSlug }));
}

export async function generateMetadata({ params }: CodesPageProps): Promise<Metadata> {
  const { brand } = await params;
  const entry = getErrorCodesForBrand(brand);

  if (!entry) return { title: 'Not Found' };

  return {
    title: entry.seo.title,
    description: entry.seo.description,
    openGraph: { title: entry.seo.title, description: entry.seo.description },
  };
}

const VERDICT_VARIANT: Record<CodeVerdict, 'success' | 'warning' | 'info'> = {
  'not-a-fault': 'success',
  diy: 'warning',
  tech: 'info',
};

/**
 * The published range for a code's appliance, and where in it this fault sits.
 *
 * Returns nothing when there is no band, no matching service, or the service
 * is priced as a flat job rather than a range — printing "between $200 and
 * $200" would read as a system talking to itself.
 */
function costFor(code: ErrorCode) {
  if (!code.costBand) return null;

  const slug = serviceSlugForAppliance(code.appliance);
  const service = slug ? getServiceBySlug(slug) : undefined;
  if (!service || service.priceRange.min === service.priceRange.max) return null;

  return {
    band: COST_BAND_COPY[code.costBand],
    min: service.priceRange.min,
    max: service.priceRange.max,
    name: service.name.replace(' Repair', '').toLowerCase(),
  };
}

/** Keeps a linked code clear of the sticky header when jumped to directly. */
function CodeEntry({ code }: { code: ErrorCode }) {
  const cost = costFor(code);
  const photo = code.photo ? photoCaptions[code.photo] : undefined;

  return (
    <article id={code.anchor} className="scroll-mt-28 border-b border-primary-500/20 py-10 last:border-b-0">
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-5">
        <div>
          <h3 className="font-heading text-xl font-bold text-ink">{code.code}</h3>
          <div className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500 mt-2">
            {code.appliance}
          </div>
        </div>
        <Badge variant={VERDICT_VARIANT[code.verdict]} size="sm">
          {VERDICT_COPY[code.verdict].label}
        </Badge>
      </div>

      <dl className="space-y-5">
        <div>
          <dt className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500 mb-2">
            What the machine is reporting
          </dt>
          <dd className="text-lg leading-relaxed text-gray-600 max-w-prose">{code.means}</dd>
        </div>

        <div>
          <dt className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500 mb-2">
            What puts it there
          </dt>
          <dd className="text-lg leading-relaxed text-gray-600 max-w-prose">{code.causes}</dd>
        </div>

        {code.selfCheck && (
          <div className="border-l-2 border-primary-500/40 pl-5">
            <dt className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-2">
              Before you call anyone
            </dt>
            <dd className="text-lg leading-relaxed text-gray-600 max-w-prose">{code.selfCheck}</dd>
          </div>
        )}

        {/* The published range for the appliance, plus which end of it this
            fault sits at. No figure is invented here: the numbers are the ones
            already printed on the service page, and the band is a judgement
            about the repair rather than a quote for it. */}
        {cost && (
          <div>
            <dt className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500 mb-2">
              What it usually costs
            </dt>
            <dd className="text-lg leading-relaxed text-gray-600 max-w-prose">
              Most {cost.name} jobs land between{' '}
              <strong className="text-ink">
                ${cost.min} and ${cost.max}
              </strong>
              , parts included, and the ${siteConfig.serviceCall.minimum} minimum service call is
              part of that rather than on top of it. This one {cost.band}.
            </dd>
          </div>
        )}

        <div>
          <dt className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500 mb-2">
            True for
          </dt>
          <dd className="text-gray-600 max-w-prose">{code.appliesTo}</dd>
        </div>
      </dl>

      {/* Only where the photograph is of this fault. Everywhere else the entry
          simply ends — a stock image against an error number is decoration. */}
      {/* Small on purpose. The picture is evidence beside the entry, not the
          subject of it — at full column width it read as a hero and pushed the
          next code off the screen. */}
      {photo && (
        <figure className="mt-7 w-[220px] max-w-full">
          <Image
            src={`/images/work/${code.photo}`}
            alt={photo.alt}
            width={440}
            height={330}
            className="w-full h-auto border border-primary-500/20"
            sizes="220px"
          />
          <figcaption className="mt-2 font-heading text-[10px] font-semibold uppercase tracking-label leading-relaxed text-primary-500">
            {photo.location ? `${photo.location} — ` : ''}
            {photo.caption ?? 'From a CoastPro visit'}
          </figcaption>
        </figure>
      )}
    </article>
  );
}

export default async function BrandErrorCodesPage({ params }: CodesPageProps) {
  const { brand } = await params;
  const entry = getErrorCodesForBrand(brand);

  if (!entry) notFound();

  const brandPage = getBrandBySlug(entry.brandSlug);
  const others = brandErrorCodes.filter((other) => other.brandSlug !== entry.brandSlug);

  // Grouped so a reader looking at a washer is not scrolling past refrigerator
  // codes to find it. Order follows the data rather than an alphabet, because
  // the data is already ordered by how often we are asked.
  const byAppliance = entry.codes.reduce<Record<string, ErrorCode[]>>((groups, code) => {
    (groups[code.appliance] ??= []).push(code);
    return groups;
  }, {});

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      '@id': `${siteConfig.seo.siteUrl}/error-codes/${entry.brandSlug}#article`,
      headline: `${entry.name} error codes, explained`,
      description: entry.seo.description,
      url: `${siteConfig.seo.siteUrl}/error-codes/${entry.brandSlug}`,
      author: { '@id': `${siteConfig.seo.siteUrl}/#organization` },
      publisher: { '@id': `${siteConfig.seo.siteUrl}/#organization` },
      about: { '@type': 'Brand', name: entry.name },
    },
    breadcrumbSchema([
      { name: 'Error codes', path: '/error-codes' },
      { name: entry.name, path: `/error-codes/${entry.brandSlug}` },
    ]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <section className="bg-cream border-b border-primary-500/20 py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <nav className="flex items-center gap-2 text-sm text-primary-500 mb-8">
              <Link href="/" className="hover:text-ink transition-colors">Home</Link>
              <span>/</span>
              <Link href="/error-codes" className="hover:text-ink transition-colors">Error codes</Link>
              <span>/</span>
              <span className="text-ink">{entry.name}</span>
            </nav>

            <div className="eyebrow mb-4">Error codes</div>
            <h1 className="headline text-3xl sm:text-4xl md:text-5xl">
              {entry.name} error codes,
              <br />
              <span className="headline-muted">and what each one costs you.</span>
            </h1>
            <div className="rule-short my-8" />

            {/* A date a reader can check, from the same record the sitemap
                uses. Reference pages are worth less when nobody can tell
                whether they were written last month or in 2019. */}
            <div className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500 mb-6">
              <span>{entry.codes.length} codes</span>
              <span className="text-primary-400 px-2">·</span>
              <span>
                Reviewed{' '}
                <time dateTime={errorCodesUpdated[entry.brandSlug]}>
                  {updatedAt(errorCodesUpdated[entry.brandSlug]).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })}
                </time>
              </span>
            </div>

            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-prose">{entry.intro}</p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href={`tel:${siteConfig.contact.phoneClean}`}>
                <Button size="lg" leftIcon={<Phone className="h-4 w-4" />}>
                  {siteConfig.contact.phone}
                </Button>
              </a>
              <Link href="/book-appointment">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-ink text-ink hover:bg-ink hover:text-cream"
                >
                  Book a visit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* One sentence, not the full paragraph. The long version lives on the
          index, where somebody reading about codes in general is; repeating it
          on all ten brand pages made them resemble each other more than it
          made any of them honest. */}
      <section className="bg-cream-light border-b border-primary-500/20 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl flex items-start gap-4">
            <Info className="h-5 w-5 text-primary-500 shrink-0 mt-1" strokeWidth={1.5} />
            <p className="text-gray-600 max-w-prose">{CODE_CAVEAT_SHORT}</p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="eyebrow mb-4">01 — Reading it</div>
            <h2 className="headline text-2xl sm:text-3xl mb-6">Where the code shows up</h2>
            <p className="text-lg leading-relaxed text-gray-600 max-w-prose">{entry.howToRead}</p>

          </div>
        </div>
      </section>

      {/* Kenmore only, and it comes before the codes rather than after because
          on that page it *is* the answer — the two entries below it are the
          handful of things true regardless of who built the machine. */}
      {entry.crossReference && (
        <section className="py-20 bg-cream-light border-t border-primary-500/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <div className="eyebrow mb-4">02 — Model prefix</div>
              <h2 className="headline text-2xl sm:text-3xl mb-6">
                Find your three digits, then read that brand&rsquo;s codes
              </h2>
              <p className="text-lg leading-relaxed text-gray-600 max-w-prose mb-10">
                The number on the plate begins with three digits and a full stop. Those three name
                the company that actually built the machine, and its code set is the one that
                applies to you.
              </p>

              <div className="border-t border-l border-primary-500/20">
                {entry.crossReference.map((ref) => (
                  <div
                    key={ref.prefix}
                    className="grid grid-cols-1 sm:grid-cols-[9rem_1fr] border-b border-r border-primary-500/20"
                  >
                    <div className="p-5 sm:border-r border-primary-500/20 bg-cream">
                      <div className="font-heading text-lg font-bold text-ink">{ref.prefix}</div>
                      <div className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500 mt-1">
                        {ref.builder}
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-gray-600 leading-relaxed mb-3">{ref.note}</p>
                      {ref.brandSlug && (
                        <Link
                          href={`/error-codes/${ref.brandSlug}`}
                          className="inline-flex items-center font-heading text-[11px] font-semibold uppercase tracking-label text-primary-600 hover:text-ink transition-colors"
                        >
                          {ref.builder} error codes
                          <ArrowRight className="h-3.5 w-3.5 ml-2" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {Object.entries(byAppliance).map(([appliance, codes], index) => {
        // Section numbers continue from whatever came before, and the ground
        // alternates from it too — the prefix table above is cream-light, the
        // "how to read" section is cream.
        const position = index + (entry.crossReference ? 3 : 2);
        const startsDark = Boolean(entry.crossReference);
        const dark = index % 2 === 0 ? startsDark : !startsDark;

        return (
          <section
            key={appliance}
            className={`py-16 border-t border-primary-500/20 ${dark ? 'bg-cream' : 'bg-cream-light'}`}
          >
            <div className="container mx-auto px-4">
              <div className="max-w-4xl">
                <div className="eyebrow mb-4">
                  {String(position).padStart(2, '0')} — {appliance}
                </div>
                <h2 className="headline text-2xl sm:text-3xl mb-4">{appliance} codes</h2>
                <div>
                  {codes.map((code) => (
                    <CodeEntry key={code.anchor} code={code} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {brandPage && (
        <section className="py-16 bg-cream-light border-t border-primary-500/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl flex flex-col sm:flex-row sm:items-center gap-6 sm:justify-between">
              <div>
                <div className="eyebrow mb-3">The brand</div>
                <h2 className="headline text-xl mb-2">What we open a {brandPage.name} for</h2>
                <p className="text-gray-600 max-w-prose">{brandPage.summary}</p>
              </div>
              <Link href={`/brands/${brandPage.slug}`} className="shrink-0">
                <Button variant="outline" className="border-ink text-ink hover:bg-ink hover:text-cream">
                  {brandPage.name} repair
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-cream border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="eyebrow mb-4">Other brands</div>
          <h2 className="headline text-2xl mb-8">Codes for everything else we work on</h2>
          <div className="flex flex-wrap gap-4">
            {others.map((other) => (
              <Link
                key={other.brandSlug}
                href={`/error-codes/${other.brandSlug}`}
                className="flex items-center gap-2 px-4 py-2 border border-primary-500/25 hover:border-ink hover:bg-cream-dark/50 transition-colors"
              >
                <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                  {other.name}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-primary-400" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        title={`Got a ${entry.name} code you cannot clear?`}
        subtitle="Tell us the code and the model number when you book — it decides what comes on the van. Same-day appointments across Orange County."
      />
    </>
  );
}
