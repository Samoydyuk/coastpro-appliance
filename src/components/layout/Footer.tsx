import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { siteConfig } from '@/data/site-config';
import { services } from '@/data/services';
import { serviceAreas } from '@/data/service-areas';

const footerServices = services.slice(0, 6);
const footerAreas = serviceAreas.slice(0, 8);

const columnTitleClass =
  'font-heading text-[11px] font-semibold uppercase tracking-label text-cream mb-6';
const linkClass = 'text-primary-300 hover:text-cream transition-colors';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink text-primary-300">
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company */}
          <div>
            {/* The light cut of the same file: on this ground the dark half of
                the wordmark would simply be missing. */}
            {/* Same height as the header, so the brand is one size on the
                site — and nudged down four pixels, which is the offset a
                heading's line box gives its capitals. Without it the mark sits
                four pixels above the three column heads beside it, on a row
                the eye reads as one line. */}
            <Image
              src="/images/coastpro-logo-light.png"
              alt="CoastPro.us"
              width={2264}
              height={321}
              className="mt-1 h-5 w-auto"
            />
            <div className="h-px w-16 bg-primary-500/50 my-6" />
            <p className="leading-relaxed">
              {siteConfig.tagline}. Professional appliance repair throughout Orange County.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className={columnTitleClass}>Our Services</h3>
            <ul className="space-y-3">
              {footerServices.map((service) => (
                <li key={service.id}>
                  <Link href={`/services/${service.slug}`} className={linkClass}>
                    {service.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/services"
                  className="text-cream hover:text-primary-300 transition-colors"
                >
                  View All Services →
                </Link>
              </li>
              <li>
                <Link
                  href="/brands"
                  className="text-cream hover:text-primary-300 transition-colors"
                >
                  Brands We Service →
                </Link>
              </li>
              <li>
                <Link
                  href="/error-codes"
                  className="text-cream hover:text-primary-300 transition-colors"
                >
                  Error Codes Explained →
                </Link>
              </li>
            </ul>
          </div>

          {/* Areas */}
          <div>
            <h3 className={columnTitleClass}>Service Areas</h3>
            <ul className="space-y-3">
              {footerAreas.map((area) => (
                <li key={area.id}>
                  <Link href={`/service-areas/${area.slug}`} className={linkClass}>
                    {area.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/service-areas"
                  className="text-cream hover:text-primary-300 transition-colors"
                >
                  View All Areas →
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className={columnTitleClass}>Contact Us</h3>
            <ul className="space-y-4">
              <li>
                <a href={`tel:${siteConfig.contact.phoneClean}`} className={`flex items-start gap-3 ${linkClass}`}>
                  <Phone className="h-4 w-4 mt-1 shrink-0" strokeWidth={1.5} />
                  <span>{siteConfig.contact.phone}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${siteConfig.contact.email}`} className={`flex items-start gap-3 ${linkClass}`}>
                  <Mail className="h-4 w-4 mt-1 shrink-0" strokeWidth={1.5} />
                  <span>{siteConfig.contact.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-1 shrink-0" strokeWidth={1.5} />
                <span>{siteConfig.contact.address.full}</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-1 shrink-0" strokeWidth={1.5} />
                <span>Every Day: {siteConfig.businessHours.weekdays}</span>
              </li>
              <li>
                <Link href="/blog" className={linkClass}>
                  Repair notes
                </Link>
              </li>
              {/* The way back in. A past customer checking whether their
                  warranty still runs has no other route to it — the page is
                  noindex, so a search will never surface it, and a link they
                  were texted months ago is long gone from the thread. */}
              <li>
                <Link href="/my" className={linkClass}>
                  Your repairs &amp; warranty
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-500/25">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <p className="text-primary-400">
              © {currentYear} {siteConfig.name}. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className={linkClass}>
                Privacy Policy
              </Link>
              <Link href="/terms" className={linkClass}>
                Terms of Service
              </Link>
              <Link href="/sitemap.xml" className={linkClass}>
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
