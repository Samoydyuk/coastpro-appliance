import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { serviceAreas } from '@/data/service-areas';

interface ServiceAreasProps {
  showAll?: boolean;
}

export function ServiceAreas({ showAll = false }: ServiceAreasProps) {
  const areas = showAll ? serviceAreas : serviceAreas.slice(0, 8);

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Serving All of Orange County
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Fast, reliable appliance repair service throughout Orange County, CA
          </p>
        </div>

        {/* Areas Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {areas.map((area) => (
            <Link
              key={area.id}
              href={`/service-areas/${area.slug}`}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              <MapPin className="h-5 w-5 text-primary-600 shrink-0" />
              <span className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                {area.name}
              </span>
            </Link>
          ))}
        </div>

        {/* View All & CTA */}
        <div className="text-center space-y-4">
          {!showAll && (
            <Link href="/service-areas">
              <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View All Service Areas
              </Button>
            </Link>
          )}
          <p className="text-gray-600">
            Don&apos;t see your city?{' '}
            <Link href="/contact" className="text-primary-600 hover:text-primary-700 font-medium">
              Contact us
            </Link>{' '}
            - we likely serve your area!
          </p>
        </div>
      </div>
    </section>
  );
}
