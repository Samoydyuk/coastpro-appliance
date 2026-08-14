import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHeader, CTABanner } from '@/components/sections';
import { listPublishedArticles } from '@/lib/marketing/published';

/**
 * Repairs that were actually done, written up.
 *
 * Rebuilt on a timer rather than on every request: an article changes when
 * somebody publishes one, and the publish route revalidates this path itself,
 * so the hour here is only a backstop.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Repair Notes',
  description:
    'Write-ups of real appliance repairs across Orange County — the fault, what it turned out to be, and what fixed it.',
  alternates: { canonical: './' },
};

export default async function BlogIndexPage() {
  const articles = await listPublishedArticles();

  return (
    <>
      <PageHeader
        eyebrow="Repair notes"
        title="Real jobs,"
        titleMuted="written up."
        subtitle="What came in, what it turned out to be, and what fixed it. No customers named, no addresses — just the appliance and the fault."
      />

      <section className="container mx-auto px-4 py-16 lg:py-24">
        {articles.length === 0 ? (
          <p className="max-w-prose text-gray-600">
            Nothing here yet. The first write-ups go up as jobs are finished.
          </p>
        ) : (
          <ul className="grid gap-px overflow-hidden rounded-card border border-primary-500/20 bg-primary-500/20 sm:grid-cols-2">
            {articles.map((article) => (
              <li key={article.slug} className="bg-cream">
                <Link href={`/blog/${article.slug}`} className="group block h-full p-6 sm:p-8">
                  {/* The frame the article opens with. A repair note without a
                      picture of the repair is a paragraph in a list; with one it
                      is the reason somebody clicks. */}
                  {article.photos[0] && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`/api/repair-photo/${article.photos[0].id}`}
                      alt={article.photos[0].alt || ''}
                      loading="lazy"
                      className="mb-5 aspect-[16/10] w-full rounded-card border border-primary-500/15 object-cover"
                    />
                  )}
                  <div className="eyebrow mb-3">
                    {[article.manufacturer, article.applianceType].filter(Boolean).join(' ') ||
                      'Repair'}
                    {article.city ? ` — ${article.city}` : ''}
                  </div>
                  <h2 className="font-heading text-lg font-bold leading-snug text-ink">
                    {article.title}
                  </h2>
                  {article.metaDesc && (
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">{article.metaDesc}</p>
                  )}
                  <span className="mt-5 inline-flex items-center gap-2 font-heading text-[10px] font-semibold uppercase tracking-label text-primary-600">
                    Read it
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                      strokeWidth={1.5}
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CTABanner />
    </>
  );
}
