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
 * The person who will be standing in the kitchen.
 *
 * Every photograph on the site is of a machine. A premium home service is not
 * bought from a company — it is bought from whoever is about to be let through
 * the front door, and the site never says who that is.
 *
 * No portrait yet, so this says what is true in words and leaves a space the
 * photograph slots into later. Deliberately understated: a name, a sentence,
 * and the two facts a person weighs before letting somebody in.
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
            <div className="eyebrow mb-3">Who comes out</div>
            <h2 className="headline text-2xl sm:text-3xl">
              One technician.
              <span className="headline-muted"> Not a rota.</span>
            </h2>
            <div className="rule-short my-6" />
            <p className="text-[15px] leading-relaxed text-gray-600 sm:text-base">
              The same person diagnoses the machine, orders the part and comes back to fit it — so
              nothing is explained twice and nobody arrives without knowing what they are walking
              into.
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
