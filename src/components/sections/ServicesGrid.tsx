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
import { Card, CardContent, Button } from '@/components/ui';
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
  title?: string;
  subtitle?: string;
}

export function ServicesGrid({
  showAll = false,
  title = "Our Appliance Repair Services",
  subtitle = "We repair all major household appliances with same-day service available"
}: ServicesGridProps) {
  const displayedServices = showAll ? services : services.slice(0, 6);

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {displayedServices.map((service) => {
            const IconComponent = iconMap[service.icon] || Cog;

            return (
              <Link key={service.id} href={`/services/${service.slug}`}>
                <Card hover className="h-full group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600 transition-colors">
                      <IconComponent className="h-7 w-7 text-primary-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-xl text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {service.shortDescription}
                    </p>
                    <div className="flex items-center text-primary-600 font-medium">
                      <span>Learn More</span>
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* View All Button */}
        {!showAll && (
          <div className="text-center">
            <Link href="/services">
              <Button variant="outline" size="lg">
                View All Services
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
