import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { listPublishedArticles, photoUrl } from '@/lib/marketing/published';
import { PhotoTreatment } from '@/components/marketing/PhotoTreatment';

/**
 * What was actually fixed, this month, with the photographs.
 *
 * The site has no reviews yet and inventing them is not on the table. This is
 * the honest substitute and the stronger one: three real repairs, each with the
 * machine, the fault and a photograph taken in somebody's kitchen. Nobody has
 * to be asked to believe anything.
 *
 * Quiet on purpose — a headline, three frames and a line each. The photographs
 * carry it.
 */
export async function RecentRepairs() {
  const articles = await listPublishedArticles();
  const recent = articles.filter((article) => article.photos.length > 0).slice(0, 3);
  if (recent.length === 0) return null;

  return (
    <section className="bg-cream py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-3">Recent repairs</div>
            <h2 className="headline text-2xl sm:text-3xl">
              And here is one
              <span className="headline-muted"> of each, done.</span>
            </h2>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500 transition-colors hover:text-ink"
          >
            All repair notes
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {recent.map((article) => {
            const photo = article.photos[0];
            const subject =
              [article.manufacturer, article.applianceType].filter(Boolean).join(' ') || 'Repair';
            const place = [article.city, article.state].filter(Boolean).join(', ');
            return (
              <Link key={article.slug} href={`/blog/${article.slug}`} className="group block">
                <PhotoTreatment
                  src={photoUrl(photo)}
                  alt={photo.alt || `${subject} repair`}
                  treatment={photo.treatment}
                  aspect={4 / 3}
                  sizes="(min-width: 768px) 33vw, 100vw"
                />
                <div className="mt-4">
                  <div className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
                    {subject}
                    {place ? ` · ${place}` : ''}
                  </div>
                  <p className="mt-1.5 font-heading text-[15px] font-bold uppercase leading-snug tracking-label text-ink transition-colors group-hover:text-brand">
                    {article.title}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
