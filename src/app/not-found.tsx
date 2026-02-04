import Link from 'next/link';
import { Home, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui';
import { siteConfig } from '@/data/site-config';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-8xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="font-heading text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
          It might have been moved or doesn&apos;t exist.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
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

        <p className="text-gray-500">
          Need help? Call us at{' '}
          <a
            href={`tel:${siteConfig.contact.phoneClean}`}
            className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
          >
            <Phone className="h-4 w-4" />
            {siteConfig.contact.phone}
          </a>
        </p>
      </div>
    </div>
  );
}
