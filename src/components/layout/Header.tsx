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
      { name: 'Dishwasher Repair', href: '/services/dishwasher' },
      { name: 'Oven & Range Repair', href: '/services/oven-range' },
      { name: 'Microwave Repair', href: '/services/microwave' },
      { name: 'All Services', href: '/services' },
    ],
  },
  { name: 'Service Areas', href: '/service-areas' },
  { name: 'About', href: '/about' },
  { name: 'Reviews', href: '/reviews' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Contact', href: '/contact' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <>
      {/* Top Bar */}
      <div className="bg-primary-900 text-white py-2 text-sm hidden md:block">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span>Same-Day Service Available</span>
            <span className="text-primary-300">|</span>
            <span>90-Day Warranty</span>
          </div>
          <a
            href={`tel:${siteConfig.contact.phoneClean}`}
            className="flex items-center gap-2 hover:text-primary-200 transition-colors"
            onClick={() => trackPhoneClick('top_bar')}
          >
            <Phone className="h-4 w-4" />
            <span className="font-semibold">{siteConfig.contact.phone}</span>
          </a>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <nav className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="hidden sm:block">
                <div className="font-heading font-bold text-xl text-gray-900">
                  CoastPro Appliance
                </div>
                <div className="text-xs text-gray-500">Orange County&apos;s #1 Choice</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => item.children && setOpenDropdown(item.name)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      'px-4 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors font-medium flex items-center gap-1'
                    )}
                  >
                    {item.name}
                    {item.children && <ChevronDown className="h-4 w-4" />}
                  </Link>

                  {/* Dropdown */}
                  {item.children && openDropdown === item.name && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <a
                href={`tel:${siteConfig.contact.phoneClean}`}
                className="hidden md:flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                onClick={() => trackPhoneClick('header')}
              >
                <Phone className="h-5 w-5" />
                <span>{siteConfig.contact.phone}</span>
              </a>
              <Link href="/book-appointment" onClick={() => trackBookNowClick('header')}>
                <Button size="md" className="hidden sm:flex">
                  Book Now
                </Button>
              </Link>

              {/* Mobile Menu Button */}
              <button
                type="button"
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-gray-700" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className="block px-4 py-3 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  {item.children && (
                    <div className="ml-4 space-y-1">
                      {item.children.slice(0, -1).map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-4 border-t border-gray-100">
                <a
                  href={`tel:${siteConfig.contact.phoneClean}`}
                  className="flex items-center gap-3 px-4 py-3 bg-primary-50 rounded-lg text-primary-600 font-semibold"
                  onClick={() => trackPhoneClick('mobile_menu')}
                >
                  <Phone className="h-5 w-5" />
                  <span>Call {siteConfig.contact.phone}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
