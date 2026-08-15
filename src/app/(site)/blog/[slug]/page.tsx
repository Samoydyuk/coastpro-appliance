import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, FileText, Check } from 'lucide-react';
import { Phone, Calendar, ShieldCheck } from 'lucide-react';
import { getPublishedArticle, listPublishedArticles, photoUrl } from '@/lib/marketing/published';
import { renderMarkdown } from '@/lib/marketing/markdown';
import { splitArticle, readingMinutes } from '@/lib/marketing/sections';
import { PhotoTreatment } from '@/components/marketing/PhotoTreatment';
import { siteConfig } from '@/data/site-config';
import { breadcrumbSchema } from '@/lib/schema';
import { articleTitle } from '@/lib/seo';

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

  const headline = article.metaTitle || article.title;

  return {
    title: articleTitle(headline),
    description: article.metaDesc ?? undefined,
    alternates: { canonical: './' },
    openGraph: {
      title: headline,
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

  const { intro, sections } = splitArticle(article.body, article.title);
  const [lead, ...rest] = article.photos;
  // One line under the pair rather than one under each: two captions side by
  // side under two pictures is a wall of small grey text nobody reads.
  const restCaption = rest
    .map((photo) => photo.alt)
    .filter(Boolean)
    .join(' · ');

  /**
   * The three lines somebody reads to decide whether this is their fault.
   *
   * Taken from the job sheet rather than the prose — a paraphrase of a
   * diagnosis is not a diagnosis. Declared once because the desktop layout puts
   * it in the rail beside the piece and the narrow one keeps it under the
   * photograph, where the drawing has it.
   */
  const issueCard = (article.diagnosis || article.repairPerformed) ? (
      
      <div className="flex flex-col gap-4 rounded-card border border-primary-500/20 p-5 sm:flex-row sm:gap-6 lg:flex-col lg:gap-4">
        <div className="flex shrink-0 flex-row items-center gap-3 sm:w-28 sm:flex-col sm:items-center sm:text-center lg:w-auto lg:flex-row lg:items-center lg:text-left">
          <span className="icon-disc h-10 w-10 border-ink bg-ink text-cream">
            <FileText className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <span className="font-heading text-[10px] font-semibold uppercase tracking-label text-ink">
            The issue
          </span>
        </div>
        <dl className="grid flex-1 gap-2 border-t border-primary-500/15 pt-4 text-[14px] sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-4">
          {article.metaDesc && (
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                Issue
              </dt>
              <dd className="text-gray-700">{article.metaDesc}</dd>
            </div>
          )}
          {article.diagnosis && (
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                Diagnosis
              </dt>
              <dd className="text-gray-700">{article.diagnosis}</dd>
            </div>
          )}
          {article.repairPerformed && (
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                Repair
              </dt>
              <dd className="text-gray-700">{article.repairPerformed}</dd>
            </div>
          )}
        </dl>
      </div>
  ) : null;

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
        <div className="mx-auto max-w-6xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500 hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            Repair notes
          </Link>

          {/* Wide screens get a rail rather than the same narrow column with
              more air around it — the piece was readable but looked like a
              phone held up to a monitor (owner report). The prose keeps its
              measure; the summary and the ask move beside it. */}
          <div className="mt-2 grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14">
            <div className="min-w-0">

          {/* What it was and where, against how long this takes to read. Both
              are the first things somebody scanning a list of repairs wants. */}
          <div className="mt-8 flex items-baseline justify-between gap-4 border-b border-primary-500/15 pb-3">
            <div className="eyebrow">
              {subject}
              {place ? ` · ${place}` : ''}
            </div>
            <div className="flex shrink-0 items-center gap-1.5 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
              <Clock className="h-3 w-3" strokeWidth={1.5} />
              {readingMinutes(article.body)} min read
            </div>
          </div>

          <h1 className="headline mt-6 max-w-2xl text-[1.7rem] sm:text-3xl md:text-4xl lg:text-[2.6rem]">{article.title}</h1>
          <p className="mt-3 text-[15px] text-gray-600">
            What our technician found — and why it matters.
          </p>

          {article.errorCodes.length > 0 && (
            <p className="mt-4 font-mono text-xs text-primary-600">
              {article.errorCodes.join(' · ')}
            </p>
          )}

          {lead && (
            <div className="mt-8">
              {/* Restrained: the headline is already above it in HTML, so the
                  frame carries the wordmark and its place in the sequence and
                  nothing that would be said twice (§26). */}
              <PhotoTreatment
                src={photoUrl(lead)}
                alt={lead.alt || `${subject} repair`}
                treatment={lead.treatment}
                aspect={16 / 9}
                priority
                restrained
              />
            </div>
          )}

          {issueCard && <div className="mt-8 lg:hidden">{issueCard}</div>}

          {intro && (
            <div
              className="mt-8 max-w-2xl space-y-4 text-[15px] leading-relaxed text-gray-700"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(intro) }}
            />
          )}

          {/* Numbered, because a repair is a sequence and the reader is
              following one. */}
          <div className="mt-10 max-w-2xl space-y-9">
            {sections.map((section, index) => (
              <section key={section.heading} className="flex gap-4 sm:gap-6">
                <div className="flex shrink-0 items-start gap-2 pt-0.5 sm:gap-3">
                  <span className="font-heading text-lg font-extrabold tabular-nums text-brand">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="mt-3 hidden h-px w-4 bg-brand/40 sm:block" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-base font-bold uppercase tracking-label text-ink">
                    {section.heading}
                  </h2>

                  {section.kind === 'parts' && article.parts.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {article.parts.map((part) => (
                        <li
                          key={part.description}
                          className="rounded-card border border-primary-500/20 px-4 py-3"
                        >
                          <div className="font-heading text-[13px] font-semibold uppercase tracking-label text-ink">
                            {part.description}
                          </div>
                          {/* Deliberately the make, never the number: a part
                              number in public copy is an invitation to order
                              the wrong thing. */}
                          {article.manufacturer && (
                            <div className="mt-0.5 text-[12px] text-gray-500">
                              {article.manufacturer} OEM
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : section.kind === 'expect' && section.bullets.length > 0 ? (
                    <>
                      {section.body.split('\n').some((line) => line.trim() && !/^[-*+]\s/.test(line.trim())) && (
                        <div
                          className="mt-3 text-[15px] leading-relaxed text-gray-700"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(
                              section.body
                                .split('\n')
                                .filter((line) => !/^[-*+]\s/.test(line.trim()))
                                .join('\n')
                            ),
                          }}
                        />
                      )}
                      <ul className="mt-3 space-y-2">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3 text-[15px] text-gray-700">
                            <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-ink text-cream">
                              <Check className="h-2.5 w-2.5" strokeWidth={3} />
                            </span>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <div
                      className="mt-3 space-y-4 text-[15px] leading-relaxed text-gray-700 [&>ul]:list-disc [&>ul]:space-y-2 [&>ul]:pl-5 [&_strong]:font-semibold [&_strong]:text-ink"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(section.body) }}
                    />
                  )}
                </div>
              </section>
            ))}
          </div>

          {/* The rest of the photographs. Labelled before and after only when
              the job sheet says which is which — a guess here would caption a
              picture wrongly, which is the whole reason these captions were
              rewritten in the first place. */}
          {rest.length > 0 && (
            <div className="mt-12">
              <div className="grid gap-3 sm:grid-cols-2">
                {rest.map((photo) => (
                  <PhotoTreatment
                    key={photo.id}
                    src={photoUrl(photo)}
                    alt={photo.alt || `${subject} repair`}
                    treatment={photo.treatment}
                    aspect={4 / 3}
                  />
                ))}
              </div>
              {restCaption && (
                <p className="mt-3 text-center text-[13px] text-gray-500">{restCaption}</p>
              )}
            </div>
          )}

            </div>

            {/* The rail. Sticky, because the summary is what somebody checks
                against their own machine halfway down the piece. */}
            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-6">
                {issueCard}
                <div className="rounded-card bg-ink px-5 py-6 text-center">
                  <h2 className="font-heading text-base font-bold uppercase tracking-label text-cream">
                    Having a similar issue?
                  </h2>
                  <p className="mt-2 text-[13px] text-cream/70">
                    Our technicians are standing by to help.
                  </p>
                  <Link
                    href="/book-appointment"
                    className="mt-4 flex items-center justify-center gap-2 rounded-card bg-cream px-4 py-2.5 font-heading text-[10px] font-semibold uppercase tracking-label text-ink transition-colors hover:bg-white"
                  >
                    <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Schedule service
                  </Link>
                  <a
                    href={`tel:${siteConfig.contact.phoneClean}`}
                    className="mt-2 flex items-center justify-center gap-2 rounded-card border border-cream/30 px-4 py-2.5 font-heading text-[10px] font-semibold uppercase tracking-label text-cream transition-colors hover:bg-cream/10"
                  >
                    <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {siteConfig.contact.phone}
                  </a>
                  <p className="mt-4 text-[11px] leading-snug text-cream/60">
                    Same-day service available · Upfront, honest pricing
                  </p>
                </div>
              </div>
            </aside>
          </div>

          {/* The ask, in the words the mockup uses and at the width of the
              piece. The site's full-bleed banner sat outside the column and
              read as the end of the page rather than the end of the article. */}
          <div className="mt-12 max-w-2xl rounded-card bg-ink px-6 py-8 text-center lg:hidden">
            <h2 className="font-heading text-lg font-bold uppercase tracking-label text-cream sm:text-xl">
              Having a similar issue?
            </h2>
            <p className="mt-2 text-[15px] text-cream/70">
              Our technicians are standing by to help.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/book-appointment"
                className="flex flex-1 items-center justify-center gap-2 rounded-card bg-cream px-5 py-3 font-heading text-[11px] font-semibold uppercase tracking-label text-ink transition-colors hover:bg-white"
              >
                <Calendar className="h-4 w-4" strokeWidth={1.5} />
                Schedule service
              </Link>
              <a
                href={`tel:${siteConfig.contact.phoneClean}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-card border border-cream/30 px-5 py-3 font-heading text-[11px] font-semibold uppercase tracking-label text-cream transition-colors hover:bg-cream/10"
              >
                <Phone className="h-4 w-4" strokeWidth={1.5} />
                {siteConfig.contact.phone}
              </a>
            </div>
            <p className="mt-5 flex items-center justify-center gap-2 text-[12px] text-cream/60">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
              Same-day service available · Upfront, honest pricing
            </p>
          </div>
        </div>
      </article>
    </>
  );
}
