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
    <section className="py-20 bg-cream-light">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-14">
          <div className="eyebrow">Why CoastPro</div>
          <h2 className="headline text-2xl sm:text-3xl md:text-4xl mt-4 mb-6">
            Built on doing it
            <br />
            <span className="headline-muted">the right way.</span>
          </h2>
          <div className="rule-short mb-6" />
          <p className="text-lg text-gray-600">
            We&apos;re committed to providing the best appliance repair experience in Orange County.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-primary-500/20">
          {signals.map((signal) => (
            <div
              key={signal.title}
              className="p-8 border-b border-r border-primary-500/20 transition-colors hover:bg-cream-dark/40"
            >
              <span className="icon-disc h-12 w-12 mb-6">
                <signal.icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-3">
                {signal.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">{signal.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
