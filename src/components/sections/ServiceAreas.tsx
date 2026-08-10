import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui';
import { serviceAreas } from '@/data/service-areas';
import { getInitials } from '@/lib/utils';

interface ServiceAreasProps {
  showAll?: boolean;
}

export function ServiceAreas({ showAll = false }: ServiceAreasProps) {
  const areas = showAll ? serviceAreas : serviceAreas.slice(0, 8);

  return (
    <section className="py-20 bg-cream-light">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-14">
          <div className="eyebrow">Service Areas</div>
          <h2 className="headline text-2xl sm:text-3xl md:text-4xl mt-4 mb-6">
            Serving all of
            <br />
            <span className="headline-muted">Orange County.</span>
          </h2>
          <div className="rule-short mb-6" />
          <p className="text-lg text-gray-600">
            Fast, reliable appliance repair throughout Orange County, CA.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-t border-l border-primary-500/20 mb-14">
          {areas.map((area) => (
            <Link
              key={area.id}
              href={`/service-areas/${area.slug}`}
              className="group flex items-center gap-4 p-5 border-b border-r border-primary-500/20 transition-colors hover:bg-cream-dark/50"
            >
              <span className="icon-disc h-10 w-10 shrink-0 text-[11px] font-heading font-bold tracking-wider transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-cream">
                {getInitials(area.name)}
              </span>
              <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                {area.name}
              </span>
            </Link>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {!showAll && (
            <Link href="/service-areas">
              <Button variant="outline" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View All Areas
              </Button>
            </Link>
          )}
          <p className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4 text-primary-500" strokeWidth={1.5} />
            Don&apos;t see your city?{' '}
            <Link href="/contact" className="text-ink underline underline-offset-4 hover:text-primary-600">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
