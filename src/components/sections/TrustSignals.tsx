import { Clock, Award, FileText, Tag, Camera, CalendarCheck, MapPin } from 'lucide-react';

const signals = [
  {
    icon: Clock,
    title: 'Same-Day Service',
    description: "Call before noon and we'll do our best to get to you the same day.",
  },
  {
    icon: Award,
    title: '90-Day Warranty',
    description: 'Every repair is backed by a 90-day workmanship warranty.',
  },
  {
    icon: FileText,
    title: 'Upfront, Transparent Pricing',
    description: 'You approve an estimate before any work begins. No hidden fees.',
  },
  {
    icon: Tag,
    title: 'Parts at Fair Price',
    description: 'We source parts from established suppliers and charge standard retail price — no hidden markups.',
  },
  {
    icon: Camera,
    title: 'Photo-Documented Work',
    description: 'We document each repair with before/after photos.',
  },
  {
    icon: CalendarCheck,
    title: 'We Respect Your Time',
    description: 'We confirm your appointment and give advance notice before arrival.',
  },
  {
    icon: MapPin,
    title: 'Locally Owned & Operated',
    description: 'A local Orange County business.',
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
