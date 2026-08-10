import { Clock, Award, FileText, Tag, Camera, CalendarCheck, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui';
import { siteConfig } from '@/data/site-config';

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

/**
 * Two-column split: the headline holds the left rail while the reasons scroll
 * past as a numbered list. Intentionally not a card grid — the sections either
 * side of it already use one.
 */
export function TrustSignals() {
  return (
    <section className="py-20 lg:py-24 bg-cream-light">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left rail */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <div className="eyebrow">02 — Why CoastPro</div>
              <h2 className="headline text-2xl sm:text-3xl md:text-4xl mt-4 mb-6">
                Built on doing it
                <br />
                <span className="headline-muted">the right way.</span>
              </h2>
              <div className="rule-short mb-6" />
              <p className="text-lg text-gray-600 max-w-sm mb-10">
                Seven standards we hold to on every job in Orange County.
              </p>

              {/* Fills the rail and puts the price and the phone where the
                  reasons are being read. */}
              <div className="border border-primary-500/25 p-6 max-w-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-3xl font-extrabold text-ink leading-none">
                    ${siteConfig.serviceCall.minimum}
                  </span>
                  <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500">
                    Minimum call
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-3 mb-6">
                  {siteConfig.serviceCall.note}. Includes the visit and a full diagnosis.
                </p>
                <a href={`tel:${siteConfig.contact.phoneClean}`} className="block">
                  <Button className="w-full" leftIcon={<Phone className="h-4 w-4" />}>
                    {siteConfig.contact.phone}
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Numbered list */}
          <div className="lg:col-span-7">
            {signals.map((signal, i) => (
              <div
                key={signal.title}
                className="group flex gap-6 py-7 border-t border-primary-500/20 last:border-b"
              >
                <span className="font-heading text-xs font-bold text-primary-400 pt-1 w-6 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <signal.icon className="h-4 w-4 text-primary-500 shrink-0" strokeWidth={1.5} />
                    <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink">
                      {signal.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{signal.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
