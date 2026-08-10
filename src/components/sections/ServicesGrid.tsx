import Link from 'next/link';
import {
  Refrigerator,
  WashingMachine,
  Wind,
  UtensilsCrossed,
  Flame,
  Microwave,
  Cog,
  Snowflake,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { services } from '@/data/services';

const iconMap: Record<string, React.ElementType> = {
  Refrigerator: Refrigerator,
  WashingMachine: WashingMachine,
  Dryer: Wind,
  Dishwasher: UtensilsCrossed,
  Oven: Flame,
  Microwave: Microwave,
  Cog: Cog,
  Snowflake: Snowflake,
};

interface ServicesGridProps {
  showAll?: boolean;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

export function ServicesGrid({
  showAll = false,
  eyebrow = "Services",
  title = "What we repair",
  subtitle = "We repair all major household appliances, with same-day service available."
}: ServicesGridProps) {
  const displayedServices = showAll ? services : services.slice(0, 6);

  return (
    <section className="py-20 bg-cream">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-14">
          <div className="eyebrow">{eyebrow}</div>
          <h2 className="headline text-2xl sm:text-3xl md:text-4xl mt-4 mb-6">{title}</h2>
          <div className="rule-short mb-6" />
          <p className="text-lg text-gray-600">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-primary-500/20 mb-14">
          {displayedServices.map((service) => {
            const IconComponent = iconMap[service.icon] || Cog;

            return (
              <Link
                key={service.id}
                href={`/services/${service.slug}`}
                className="group p-8 border-b border-r border-primary-500/20 transition-colors hover:bg-cream-dark/50"
              >
                <span className="icon-disc h-12 w-12 mb-6 transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-cream">
                  <IconComponent className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-3">
                  {service.name}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">{service.shortDescription}</p>
                <span className="inline-flex items-center font-heading text-[11px] font-semibold uppercase tracking-label text-primary-600 group-hover:text-ink transition-colors">
                  Learn More
                  <ArrowRight className="h-3.5 w-3.5 ml-2 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>

        {!showAll && (
          <Link href="/services">
            <Button variant="outline" size="lg">
              View All Services
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}
