import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CTABanner } from '@/components/sections';
import { getPublishedArticle, listPublishedArticles } from '@/lib/marketing/published';
import { renderMarkdown } from '@/lib/marketing/markdown';
import { siteConfig } from '@/data/site-config';
import { breadcrumbSchema } from '@/lib/schema';

export const revalidate = 3600;
/**
 * An article published after the last build still has to work. `false` would
 * 404 it until the next deploy, which would make the publish button a lie.
 */
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = await listPublishedArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) return { title: 'Not found' };

  return {
    title: article.metaTitle || article.title,
    description: article.metaDesc ?? undefined,
    alternates: { canonical: './' },
    openGraph: {
      title: article.metaTitle || article.title,
      description: article.metaDesc ?? undefined,
      type: 'article',
      publishedTime: article.publishedAt ?? undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) notFound();

  const subject =
    [article.manufacturer, article.applianceType].filter(Boolean).join(' ') || 'Appliance repair';
  const place = [article.city, article.state].filter(Boolean).join(', ');

  // Marked up as an article about a repair, not as a review or an offer: there
  // is no rating here, no price and no named customer, and claiming otherwise
  // in the structured data would be the same lie as claiming it in the prose.
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDesc ?? undefined,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.updatedAt ?? undefined,
    author: { '@type': 'Organization', name: siteConfig.name },
    publisher: { '@type': 'Organization', name: siteConfig.name },
    about: subject,
    ...(place ? { contentLocation: { '@type': 'Place', name: place } } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            schema,
            breadcrumbSchema([
              { name: 'Repair Notes', path: '/blog' },
              { name: article.title, path: `/blog/${slug}` },
            ]),
          ]),
        }}
      />

      <article className="container mx-auto px-4 py-16 lg:py-24">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500 hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            Repair notes
          </Link>

          <div className="eyebrow mb-4 mt-8">
            {subject}
            {place ? ` — ${place}` : ''}
          </div>

          <h1 className="headline text-[1.7rem] sm:text-3xl md:text-4xl">{article.title}</h1>

          {article.errorCodes.length > 0 && (
            <p className="mt-4 font-mono text-xs text-primary-600">
              {article.errorCodes.join(' · ')}
            </p>
          )}

          <div className="rule-short my-8" />

          {article.photos.length > 0 && (
            <div className="mb-10 grid gap-3 sm:grid-cols-2">
              {article.photos.map((photo) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={photo.id}
                  src={`/api/repair-photo/${photo.id}`}
                  alt={photo.alt || `${subject} repair`}
                  loading="lazy"
                  className="w-full rounded-card border border-primary-500/20 object-cover"
                />
              ))}
            </div>
          )}

          <div
            className="space-y-5 text-[15px] leading-relaxed text-gray-700 [&>h2]:mt-10 [&>h2]:font-heading [&>h2]:text-lg [&>h2]:font-bold [&>h2]:uppercase [&>h2]:tracking-label [&>h2]:text-ink [&>h3]:mt-8 [&>h3]:font-heading [&>h3]:text-base [&>h3]:font-semibold [&>h3]:text-ink [&>ul]:list-disc [&>ul]:space-y-2 [&>ul]:pl-5 [&_strong]:font-semibold [&_strong]:text-ink"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }}
          />
        </div>
      </article>

      <CTABanner />
    </>
  );
}
