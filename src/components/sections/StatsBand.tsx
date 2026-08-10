import { siteConfig } from '@/data/site-config';
import { services } from '@/data/services';
import { serviceAreas } from '@/data/service-areas';

const stats = [
  {
    value: String(siteConfig.trustSignals.warrantyDays),
    unit: 'day',
    label: 'Workmanship warranty',
  },
  {
    value: String(serviceAreas.length),
    unit: 'cities',
    label: 'Across Orange County',
  },
  {
    value: String(services.length),
    unit: 'services',
    label: 'Repair & maintenance jobs',
  },
  {
    value: 'Same',
    unit: 'day',
    label: 'Service when booked by noon',
  },
];

/**
 * Espresso band directly under the hero — a hard tonal break that stops the
 * page reading as one continuous cream field.
 */
export function StatsBand() {
  return (
    <section className="bg-primary-900 py-14 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`px-2 lg:px-8 ${i !== 0 ? 'lg:border-l lg:border-cream/15' : ''}`}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-4xl lg:text-5xl font-extrabold text-cream leading-none">
                  {stat.value}
                </span>
                <span className="font-heading text-xs font-semibold uppercase tracking-label text-primary-400">
                  {stat.unit}
                </span>
              </div>
              <div className="h-px w-10 bg-cream/25 my-4" />
              <p className="text-sm text-primary-300 leading-snug">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
