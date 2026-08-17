import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { Phone } from 'lucide-react';
import { siteConfig } from '@/data/site-config';

/**
 * A portrait if there is one, and no gap where there is not.
 *
 * There is no photograph of the technician in the project yet. Rendering the
 * file anyway would put a broken image on the page, and a placeholder grey box
 * announces the absence — so the block simply becomes text-led until a real
 * picture is dropped in, and gains its column the moment one is.
 */
const PORTRAIT = '/images/work/technician.jpg';
function hasPortrait(): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), 'public', PORTRAIT.replace(/^\//, '')));
  } catch {
    return false;
  }
}

/**
 * What actually happens once somebody is in the kitchen.
 *
 * Every photograph on the site is of a machine, and the site never describes
 * the part a customer is really buying: an hour of a stranger in their house.
 * The first draft sold that as "one technician, not a rota", which reads as a
 * limit on the business rather than a promise to the customer — the owner's
 * judgement, and he was right.
 *
 * So it describes the visit instead: found, shown, tidied, and a date rather
 * than a vague week. Nothing here is a claim that needs proving; it is ordinary
 * work described properly, which is most of what premium means in this trade.
 */
export function Technician() {
  const portrait = hasPortrait();

  return (
    <section className="bg-cream-dark/40 py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div
          className={`mx-auto grid max-w-4xl gap-10 md:items-center ${
            portrait ? 'md:grid-cols-[1fr_1.3fr]' : 'max-w-2xl'
          }`}
        >
          {portrait && (
            <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-primary-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PORTRAIT}
                alt="CoastPro technician on a service call"
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div>
            <div className="eyebrow mb-3">The visit</div>
            <h2 className="headline text-2xl sm:text-3xl">
              Diagnosed, explained,
              <span className="headline-muted"> left clean.</span>
            </h2>
            <div className="rule-short my-6" />
            <p className="text-[15px] leading-relaxed text-gray-600 sm:text-base">
              We find the fault, show you what it is, and put the kitchen back the way we found it.
              If a part has to come, you get a date for it — not &ldquo;sometime next week&rdquo;.
            </p>
            <p className="mt-4 text-[13px] text-gray-500">
              Licensed and insured. Every repair carries a 90-day warranty on parts and labour.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/book-appointment"
                className="rounded-card bg-ink px-5 py-3 font-heading text-[11px] font-semibold uppercase tracking-label text-cream"
              >
                Book a visit
              </Link>
              <a
                href={`tel:${siteConfig.contact.phoneClean}`}
                className="flex items-center gap-2 rounded-card border border-primary-500/25 px-5 py-3 font-heading text-[11px] font-semibold uppercase tracking-label text-ink"
              >
                <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
                {siteConfig.contact.phone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
