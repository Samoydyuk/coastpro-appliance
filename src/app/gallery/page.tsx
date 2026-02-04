import { Metadata } from 'next';
import { Camera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { CTABanner } from '@/components/sections';

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
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Our Work Gallery
          </h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            See examples of appliance repairs we&apos;ve completed throughout Orange County
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((item) => (
              <Card key={item.id} hover className="cursor-pointer group">
                <CardContent className="p-0">
                  {/* Image Placeholder */}
                  <div className="aspect-[4/3] bg-gray-200 flex items-center justify-center group-hover:bg-gray-300 transition-colors">
                    <Camera className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-primary-600 font-medium mb-1">
                      {item.category}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500">{item.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Placeholder Notice */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 text-gray-600">
              <Camera className="h-5 w-5" />
              <span>Add your repair photos to showcase your work</span>
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
