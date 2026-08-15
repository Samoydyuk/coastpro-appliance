import Link from 'next/link';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui';
import { siteConfig } from '@/data/site-config';

/**
 * What the service call actually buys.
 *
 * The figure was on the site but never explained, which is the worst way to
 * publish a price: competitors advertise $95 and $75 diagnostic fees, so a bare
 * $150 reads as more expensive rather than as differently structured. The
 * difference is that this one is credited against the repair and covers small
 * work outright — that is the whole argument, and it was not being made.
 *
 * Every claim here already exists in `site-config.serviceCall`; this section
 * says it in front of the customer instead of in a footnote.
 */
export function ServiceCallExplained() {
  const { minimum, includes, appliedToRepair } = siteConfig.serviceCall;

  return (
    <section className="py-20 lg:py-24 bg-cream-dark border-t border-primary-500/20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="eyebrow">06 — Pricing</div>
            <h2 className="headline text-2xl sm:text-3xl md:text-4xl mt-4 mb-8">
              What the ${minimum}
              <br />
              <span className="headline-muted">actually covers.</span>
            </h2>
            <div className="rule max-w-xs mb-8" />
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/book-appointment">
                <Button size="lg" className="w-full sm:w-auto">
                  Book a Visit
                </Button>
              </Link>
              <a href={`tel:${siteConfig.contact.phoneClean}`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                  leftIcon={<Phone className="h-4 w-4" />}
                >
                  {siteConfig.contact.phone}
                </Button>
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-8">
            <div className="border-b border-primary-500/20 pb-8">
              <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-3">
                It is a minimum, not a diagnostic fee
              </h3>
              <p className="text-lg leading-relaxed text-gray-600 max-w-prose">
                The ${minimum} covers the visit, a full diagnosis, and {includes}. Plenty of calls end
                there — a dishwasher that needed its drain clearing, a dryer stopped by a door switch,
                a refrigerator icing up because its coils had not been touched in five years. When
                that is the whole job, that is the whole bill.
              </p>
            </div>

            <div className="border-b border-primary-500/20 pb-8">
              <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-3">
                Approve a repair and you do not pay twice
              </h3>
              <p className="text-lg leading-relaxed text-gray-600 max-w-prose">
                {appliedToRepair}. This is the part worth comparing when you are ringing round: a
                cheaper call-out that is charged on top of the repair usually costs more by the time
                the work is done than one that is credited against it.
              </p>
            </div>

            <div className="border-b border-primary-500/20 pb-8">
              <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-3">
                You see the number before we start
              </h3>
              <p className="text-lg leading-relaxed text-gray-600 max-w-prose">
                Once we know the fault you get the figure — parts and labour — and nothing happens
                until you say so. If the machine is not worth the repair, we tell you that too, with
                what a replacement would run. We would rather lose the job than sell you a repair
                that does not make sense on a unit near the end of its life.
              </p>
            </div>

            <div>
              <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-3">
                {siteConfig.trustSignals.warrantyDays} days on the work
              </h3>
              <p className="text-lg leading-relaxed text-gray-600 max-w-prose">
                Every repair carries a {siteConfig.trustSignals.warrantyDays}-day warranty on parts
                and labour. If the same fault comes back inside that window, we come back for it —
                and we photograph the work as we go, so there is a record of what was done rather
                than a conversation about it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
