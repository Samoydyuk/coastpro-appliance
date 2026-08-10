import { Metadata } from 'next';
import { Camera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { CTABanner, PageHeader, StatsBand } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Our Work Gallery',
  description: 'See examples of our appliance repair work throughout Orange County. Before and after photos of refrigerator, washer, dryer, and other appliance repairs.',
  openGraph: {
    title: 'Gallery | CoastPro Appliance Repair',
    description: 'Photos of our appliance repair work in Orange County.',
  },
};

// Placeholder gallery items
const galleryItems = [
  { id: 1, title: 'Refrigerator Compressor Repair', location: 'Irvine', category: 'Refrigerator' },
  { id: 2, title: 'Washer Drum Bearing Replacement', location: 'Newport Beach', category: 'Washer' },
  { id: 3, title: 'Gas Range Igniter Fix', location: 'Costa Mesa', category: 'Oven' },
  { id: 4, title: 'Dryer Heating Element Repair', location: 'Huntington Beach', category: 'Dryer' },
  { id: 5, title: 'Dishwasher Pump Replacement', location: 'Anaheim', category: 'Dishwasher' },
  { id: 6, title: 'Microwave Magnetron Repair', location: 'Santa Ana', category: 'Microwave' },
  { id: 7, title: 'Ice Maker Water Line Fix', location: 'Orange', category: 'Ice Maker' },
  { id: 8, title: 'Sub-Zero Refrigerator Service', location: 'Laguna Beach', category: 'Refrigerator' },
  { id: 9, title: 'Front-Load Washer Door Seal', location: 'Mission Viejo', category: 'Washer' },
];

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our Work"
        title="Problem solved."
        titleMuted="Back to normal."
        subtitle="Examples of appliance repairs we've completed throughout Orange County."
      />

      <StatsBand />

      {/* Gallery Grid */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4 mb-12">
          <div className="eyebrow">01 — Recent Work</div>
        </div>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((item) => (
              <Card key={item.id} hover className="cursor-pointer group">
                <CardContent className="p-0">
                  {/* Image Placeholder */}
                  <div className="aspect-[4/3] bg-cream-dark flex items-center justify-center transition-colors group-hover:bg-primary-200">
                    <Camera className="h-10 w-10 text-primary-400" strokeWidth={1.25} />
                  </div>
                  <div className="p-6 border-t border-primary-500/20">
                    <div className="eyebrow mb-3">{item.category}</div>
                    <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500">{item.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Placeholder Notice */}
          <div className="mt-12">
            <div className="inline-flex items-center gap-3 border border-primary-500/30 px-5 py-3 text-gray-600">
              <Camera className="h-4 w-4 text-primary-500" strokeWidth={1.5} />
              <span className="text-sm">Add your repair photos to showcase your work</span>
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        title="Need Your Appliance Repaired?"
        subtitle="Our expert technicians are ready to help!"
      />
    </>
  );
}
