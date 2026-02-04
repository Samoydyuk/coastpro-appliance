import { Clock, Award, ThumbsUp, Wrench, BadgeCheck, Users } from 'lucide-react';
import { siteConfig } from '@/data/site-config';

const signals = [
  {
    icon: Clock,
    title: 'Same-Day Service',
    description: 'Book before noon for same-day repair appointments',
  },
  {
    icon: Award,
    title: `${siteConfig.trustSignals.warrantyDays}-Day Warranty`,
    description: 'All repairs backed by our comprehensive warranty',
  },
  {
    icon: ThumbsUp,
    title: `${siteConfig.trustSignals.satisfactionRate} Satisfaction`,
    description: 'Based on thousands of customer reviews',
  },
  {
    icon: Wrench,
    title: `${siteConfig.trustSignals.repairsCompleted} Repairs`,
    description: 'Trusted by Orange County homeowners',
  },
  {
    icon: BadgeCheck,
    title: 'Upfront Pricing',
    description: 'No hidden fees or surprise charges',
  },
  {
    icon: Users,
    title: 'Expert Technicians',
    description: 'Factory-trained on all major brands',
  },
];

export function TrustSignals() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose CoastPro Appliance Repair?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We&apos;re committed to providing the best appliance repair experience in Orange County
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {signals.map((signal) => (
            <div
              key={signal.title}
              className="flex items-start gap-4 p-6 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                <signal.icon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {signal.title}
                </h3>
                <p className="text-gray-600">{signal.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
