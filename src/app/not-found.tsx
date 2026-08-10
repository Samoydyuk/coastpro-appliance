import Link from 'next/link';
import { Home, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui';
import { siteConfig } from '@/data/site-config';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center py-24 bg-cream">
      <div className="container mx-auto px-4">
        <div className="eyebrow mb-4">Error 404</div>
        <h1 className="headline text-4xl sm:text-5xl md:text-6xl mb-2">Page not found.</h1>
        <div className="rule-short my-8" />
        <p className="text-lg text-gray-600 mb-10 max-w-prose">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
          It might have been moved or doesn&apos;t exist.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <Link href="/">
            <Button leftIcon={<Home className="h-4 w-4" />}>
              Go Home
            </Button>
          </Link>
          <Link href="/services">
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              View Services
            </Button>
          </Link>
        </div>

        <p className="text-gray-600">
          Need help? Call us at{' '}
          <a
            href={`tel:${siteConfig.contact.phoneClean}`}
            className="font-heading font-semibold text-ink hover:text-primary-600 inline-flex items-center gap-1.5 transition-colors"
          >
            <Phone className="h-4 w-4" />
            {siteConfig.contact.phone}
          </a>
        </p>
      </div>
    </div>
  );
}
