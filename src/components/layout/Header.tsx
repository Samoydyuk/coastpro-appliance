'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Phone, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui';
import { siteConfig } from '@/data/site-config';
import { cn } from '@/lib/utils';
import { trackPhoneClick, trackBookNowClick } from '@/lib/gtag';

const navigation = [
  { name: 'Home', href: '/' },
  {
    name: 'Services',
    href: '/services',
    children: [
      { name: 'Refrigerator Repair', href: '/services/refrigerator' },
      { name: 'Washer Repair', href: '/services/washer' },
      { name: 'Dryer Repair', href: '/services/dryer' },
      { name: 'Dryer Vent Cleaning', href: '/services/dryer-vent-cleaning' },
      { name: 'Dishwasher Repair', href: '/services/dishwasher' },
      { name: 'Oven & Range Repair', href: '/services/oven-range' },
      { name: 'Microwave Repair', href: '/services/microwave' },
      { name: 'All Services', href: '/services' },
    ],
  },
  { name: 'Service Areas', href: '/service-areas' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'About', href: '/about' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Contact', href: '/contact' },
];

const navLinkClass =
  'px-3 py-2 font-heading text-[11px] font-semibold uppercase tracking-label text-primary-600 hover:text-ink transition-colors flex items-center gap-1';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <>
      {/* Top Bar */}
      <div className="bg-ink text-cream py-2.5 text-[11px] hidden md:block">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-5 font-heading font-medium uppercase tracking-label">
            <span>Same-Day Service Available</span>
            <span className="text-primary-500">/</span>
            <span>90-Day Warranty</span>
          </div>
          <a
            href={`tel:${siteConfig.contact.phoneClean}`}
            className="flex items-center gap-2 hover:text-primary-300 transition-colors"
            onClick={() => trackPhoneClick('top_bar')}
          >
            <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="font-heading font-semibold tracking-label">
              {siteConfig.contact.phone}
            </span>
          </a>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-cream border-b border-primary-500/20">
        <nav className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Wordmark */}
            <Link href="/" className="flex items-center">
              <div>
                <div className="wordmark text-base text-ink leading-none">CoastPro</div>
                <div className="eyebrow mt-1.5 hidden sm:block">Appliance Repair</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center">
              {navigation.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => item.children && setOpenDropdown(item.name)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <Link href={item.href} className={cn(navLinkClass)}>
                    {item.name}
                    {item.children && <ChevronDown className="h-3 w-3" strokeWidth={2} />}
                  </Link>

                  {item.children && openDropdown === item.name && (
                    <div className="absolute top-full left-0 w-60 bg-cream-light border border-primary-500/25 py-2 z-50">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block px-4 py-2.5 text-sm text-gray-600 hover:text-ink hover:bg-cream-dark/50 transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-4">
              <a
                href={`tel:${siteConfig.contact.phoneClean}`}
                className="hidden md:flex items-center gap-2 font-heading text-xs font-semibold uppercase tracking-label text-ink hover:text-primary-600 transition-colors"
                onClick={() => trackPhoneClick('header')}
              >
                <Phone className="h-4 w-4" strokeWidth={1.5} />
                <span>{siteConfig.contact.phone}</span>
              </a>
              <Link href="/book-appointment" onClick={() => trackBookNowClick('header')}>
                <Button size="md" className="hidden sm:flex">
                  Book Now
                </Button>
              </Link>

              <button
                type="button"
                className="lg:hidden p-2 text-ink hover:text-primary-600 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" strokeWidth={1.5} />
                ) : (
                  <Menu className="h-6 w-6" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-cream-light border-t border-primary-500/20">
            <div className="container mx-auto px-4 py-4">
              {navigation.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className="block py-3 font-heading text-xs font-semibold uppercase tracking-label text-ink border-b border-primary-500/15"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  {item.children && (
                    <div className="pl-4">
                      {item.children.slice(0, -1).map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block py-2.5 text-sm text-gray-600 hover:text-ink border-b border-primary-500/10"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <a
                href={`tel:${siteConfig.contact.phoneClean}`}
                className="flex items-center gap-3 mt-6 px-4 py-4 bg-ink text-cream font-heading text-xs font-semibold uppercase tracking-label"
                onClick={() => trackPhoneClick('mobile_menu')}
              >
                <Phone className="h-4 w-4" strokeWidth={1.5} />
                <span>Call {siteConfig.contact.phone}</span>
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
