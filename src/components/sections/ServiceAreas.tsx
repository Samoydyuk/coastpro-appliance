import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui';
import { serviceAreas } from '@/data/service-areas';

interface ServiceAreasProps {
  showAll?: boolean;
}

/**
 * Coverage list. Deliberately typographic — a dense wrapped index of city
 * names rather than another bordered card grid.
 */
export function ServiceAreas({ showAll = false }: ServiceAreasProps) {
  const areas = showAll ? serviceAreas : serviceAreas.slice(0, 12);

  return (
    <section className="py-20 lg:py-24 bg-cream">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-4">
            <div className="eyebrow">04 — Coverage</div>
            <h2 className="headline text-2xl sm:text-3xl md:text-4xl mt-4 mb-6">
              Serving all of
              <br />
              <span className="headline-muted">Orange County.</span>
            </h2>
            <div className="rule-short mb-6" />
            <p className="text-lg text-gray-600 mb-8 max-w-sm">
              Fast, reliable appliance repair across the county.
            </p>
            <Link href="/service-areas">
              <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
                All Areas
              </Button>
            </Link>
          </div>

          <div className="lg:col-span-8">
            <div className="flex flex-wrap gap-x-8 gap-y-4 border-t border-primary-500/20 pt-8">
              {areas.map((area) => (
                <Link
                  key={area.id}
                  href={`/service-areas/${area.slug}`}
                  className="font-heading text-lg sm:text-xl font-bold uppercase tracking-tight text-primary-500 hover:text-ink transition-colors"
                >
                  {area.name}
                </Link>
              ))}
            </div>

            <p className="flex items-center gap-2 text-gray-600 mt-10 pt-8 border-t border-primary-500/20">
              <MapPin className="h-4 w-4 text-primary-500 shrink-0" strokeWidth={1.5} />
              Don&apos;t see your city?{' '}
              <Link
                href="/contact"
                className="text-ink underline underline-offset-4 hover:text-primary-600"
              >
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
