import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Camera, MapPin } from 'lucide-react';
import { Button } from '@/components/ui';
import { CTABanner, PageHeader, StatsBand } from '@/components/sections';
import { getWorkPhotos } from '@/lib/work-photos';
import { listJournalPhotos, photoUrl } from '@/lib/marketing/published';
import { PhotoTreatment } from '@/components/marketing/PhotoTreatment';
import { siteConfig } from '@/data/site-config';

export const metadata: Metadata = {
  title: 'Our Work Gallery',
  description:
    'Photos of appliance repairs CoastPro has completed across Orange County — refrigerators, washers, dryers and dryer vent cleaning.',
  openGraph: {
    title: 'Gallery | CoastPro Appliance Repair',
    description: 'Photos of our appliance repair work in Orange County.',
  },
};

export default async function GalleryPage() {
  const photos = getWorkPhotos();
  // The repairs that have been written up, in the same visual language as the
  // articles they came from. Each leads back to its piece.
  const journal = await listJournalPhotos(12);

  return (
    <>
      <PageHeader
        eyebrow="Our Work"
        title="Problem solved."
        titleMuted="Back to normal."
        subtitle="Photos from jobs we've completed across Orange County."
      />

      <StatsBand />

      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="eyebrow mb-12">01 — Recent Work</div>

          {photos.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo) => (
                <figure key={photo.src} className="group">
                  <div className="relative aspect-[4/5] overflow-hidden bg-primary-800">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                  <figcaption className="mt-5 pt-5 border-t border-primary-500/20">
                    {photo.location && (
                      <div className="flex items-center gap-2 mb-3 text-primary-600">
                        <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                        <span className="font-heading text-[10px] font-semibold uppercase tracking-label">
                          {photo.location}
                        </span>
                      </div>
                    )}
                    <p className="font-heading text-sm font-bold uppercase tracking-label text-ink leading-snug">
                      {photo.caption ?? photo.alt}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            /* An honest empty state beats a grid of placeholder cards standing
               in for work we cannot show. */
            <div className="max-w-xl border border-primary-500/25 p-10">
              <span className="icon-disc h-12 w-12 mb-6">
                <Camera className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <h2 className="headline text-2xl mb-4">Photos on the way</h2>
              <p className="text-gray-600 mb-8">
                We&apos;re putting together before and after photos from recent jobs. In the
                meantime, call and we&apos;ll talk you through what your repair involves.
              </p>
              <a href={`tel:${siteConfig.contact.phoneClean}`}>
                <Button>{siteConfig.contact.phone}</Button>
              </a>
            </div>
          )}

          {/* The repairs that have been written up, in the same visual language
              as the pieces they came from — real jobs rather than a folder of
              files, each one leading back to its article. */}
          {journal.length > 0 && (
            <div className="mt-20">
              <div className="eyebrow mb-8">Service Journal</div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {journal.map((photo) => (
                  <Link key={photo.id} href={`/blog/${photo.slug}`} className="group block">
                    <PhotoTreatment
                      src={photoUrl(photo)}
                      alt={photo.alt || photo.title}
                      treatment={photo.treatment}
                      aspect={4 / 5}
                      className="transition-opacity group-hover:opacity-95"
                    />
                    <p className="mt-4 font-heading text-sm font-bold uppercase leading-snug tracking-label text-ink group-hover:text-brand">
                      {photo.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {photos.length > 0 && (
            <p className="mt-14 text-gray-600">
              Every repair is documented with before and after photos.{' '}
              <Link
                href="/services"
                className="text-ink underline underline-offset-4 hover:text-primary-600"
              >
                See what we repair
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      <CTABanner
        title="Need your appliance repaired?"
        subtitle="Our technicians are ready to help. Same-day service available."
      />
    </>
  );
}
