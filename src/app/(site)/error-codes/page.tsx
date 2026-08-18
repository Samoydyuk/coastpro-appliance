import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import { Badge } from '@/components/ui';
import { CTABanner } from '@/components/sections';
import { brandErrorCodes, CODE_CAVEAT, VERDICT_COPY, type CodeVerdict } from '@/data/error-codes';
import { siteConfig } from '@/data/site-config';
import { breadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Appliance Error Codes Explained | CoastPro Orange County',
  description:
    'What the code on your display actually means — Samsung, LG, Whirlpool, GE, Bosch, Frigidaire and more. Which codes are faults, which are not, and what each one needs.',
};

const VERDICT_VARIANT: Record<CodeVerdict, 'success' | 'warning' | 'info'> = {
  'not-a-fault': 'success',
  diy: 'warning',
  tech: 'info',
};

export default function ErrorCodesIndexPage() {
  const schema = breadcrumbSchema([{ name: 'Error codes', path: '/error-codes' }]);

  // Worth counting rather than asserting: the claim on this page is that a
  // meaningful share of codes need nobody, and the number should come from the
  // data rather than from a copywriter.
  const allCodes = brandErrorCodes.flatMap((entry) => entry.codes);
  const noCallout = allCodes.filter((code) => code.verdict !== 'tech').length;

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
              <span className="text-ink">Error codes</span>
            </nav>

            <div className="eyebrow mb-4">Error codes</div>
            <h1 className="headline text-3xl sm:text-4xl md:text-5xl">
              The code on the display,
              <br />
              <span className="headline-muted">in plain English.</span>
            </h1>
            <div className="rule-short my-8" />

            <p className="text-lg md:text-xl text-gray-600 max-w-prose mb-6">
              A code is the most specific thing you can hand a technician before they arrive, and
              it is the thing that is hardest to look up without landing on a forum arguing with
              itself. So here is the whole set, brand by brand: what the machine detected, what
              causes it, and whether it genuinely needs anybody.
            </p>
            <p className="text-lg text-gray-600 max-w-prose">
              Of the {allCodes.length} codes below, {noCallout} do not need a call-out at all. Some
              of them are not faults in the first place — a child lock, a showroom mode, a
              measurement of your dryer duct. We would rather tell you that here than charge you to
              hear it in your kitchen.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-cream-light border-b border-primary-500/20 py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl flex items-start gap-4">
            <Info className="h-5 w-5 text-primary-500 shrink-0 mt-1.5" strokeWidth={1.5} />
            <p className="text-lg leading-relaxed text-gray-600 max-w-prose">{CODE_CAVEAT}</p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="eyebrow mb-4">By brand</div>
          <h2 className="headline text-2xl sm:text-3xl mb-10">Pick the badge on the machine</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-primary-500/20">
            {brandErrorCodes.map((entry) => {
              const notFaults = entry.codes.filter((code) => code.verdict === 'not-a-fault').length;

              return (
                <Link
                  key={entry.brandSlug}
                  href={`/error-codes/${entry.brandSlug}`}
                  className="group p-8 border-b border-r border-primary-500/20 transition-colors hover:bg-cream-dark/50"
                >
                  <div className="flex items-baseline justify-between gap-4 mb-3">
                    <h3 className="font-heading text-lg font-bold uppercase tracking-label text-ink">
                      {entry.name}
                    </h3>
                    <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500 shrink-0">
                      {entry.crossReference
                        ? `${entry.crossReference.length} prefixes`
                        : `${entry.codes.length} codes`}
                    </span>
                  </div>

                  <p className="text-gray-600 leading-relaxed mb-6">
                    {entry.codes
                      .slice(0, 5)
                      .map((code) => code.code)
                      .join(' · ')}
                  </p>

                  {notFaults > 0 && (
                    <div className="mb-6">
                      <Badge variant="success" size="sm">
                        {notFaults} of these {notFaults === 1 ? 'is' : 'are'} not a fault
                      </Badge>
                    </div>
                  )}

                  <span className="inline-flex items-center font-heading text-[11px] font-semibold uppercase tracking-label text-primary-600 group-hover:text-ink transition-colors">
                    {entry.name} codes
                    <ArrowRight className="h-3.5 w-3.5 ml-2 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream-light border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="eyebrow mb-4">How to read these</div>
            <h2 className="headline text-2xl mb-8">Every code carries one of three labels</h2>

            <dl className="space-y-6">
              {(Object.keys(VERDICT_COPY) as CodeVerdict[]).map((verdict) => (
                <div key={verdict} className="border-b border-primary-500/20 pb-6 last:border-b-0">
                  <dt className="mb-3">
                    <Badge variant={VERDICT_VARIANT[verdict]} size="sm">
                      {VERDICT_COPY[verdict].label}
                    </Badge>
                  </dt>
                  <dd className="text-lg leading-relaxed text-gray-600 max-w-prose">
                    {VERDICT_COPY[verdict].meaning}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="text-lg leading-relaxed text-gray-600 max-w-prose mt-10">
              One thing worth saying out loud, because it comes up on every brand: a code names
              what the machine detected, not what broke. Bosch&rsquo;s E15 reports water in the base
              pan and has nothing to say about which seal let it there. Finding that is the repair.
              Anyone who quotes a part off a code alone is guessing with your money.
            </p>

            <div className="mt-10">
              <Link
                href="/services"
                className="inline-flex items-center font-heading text-[11px] font-semibold uppercase tracking-label text-primary-600 hover:text-ink transition-colors"
              >
                Browse by appliance instead
                <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        title="Have the code and the model number ready"
        subtitle={`Those two things decide what comes on the van, and often finish the job on the first visit. Call ${siteConfig.contact.phone}.`}
      />
    </>
  );
}
