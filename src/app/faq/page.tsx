import { Metadata } from 'next';
import Link from 'next/link';
import { Phone } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent, Button, Card, CardContent } from '@/components/ui';
import { faqItems, faqCategories, getFAQsByCategory } from '@/data/faq';
import { siteConfig } from '@/data/site-config';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Find answers to common questions about appliance repair services, pricing, warranty, scheduling, and more. CoastPro Appliance Repair FAQ.',
  openGraph: {
    title: 'FAQ | CoastPro Appliance Repair',
    description: 'Answers to your appliance repair questions.',
  },
};

// JSON-LD FAQ Schema
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Find answers to common questions about our appliance repair services
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* FAQ List */}
            <div className="lg:col-span-2 space-y-12">
              {faqCategories.map((category) => {
                const categoryFAQs = getFAQsByCategory(category.id as typeof faqItems[0]['category']);
                if (categoryFAQs.length === 0) return null;

                return (
                  <div key={category.id}>
                    <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">
                      {category.label}
                    </h2>
                    <Card>
                      <CardContent className="p-6">
                        <Accordion type="single">
                          {categoryFAQs.map((faq) => (
                            <AccordionItem key={faq.id} value={faq.id}>
                              <AccordionTrigger className="text-left text-gray-900 hover:text-primary-600">
                                {faq.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-gray-600">
                                {faq.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Still Have Questions */}
              <Card className="bg-primary-50 border-primary-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    Still Have Questions?
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Can&apos;t find what you&apos;re looking for? Our team is happy to help!
                  </p>
                  <div className="space-y-3">
                    <a href={`tel:${siteConfig.contact.phoneClean}`}>
                      <Button className="w-full" leftIcon={<Phone className="h-4 w-4" />}>
                        Call Us
                      </Button>
                    </a>
                    <Link href="/contact">
                      <Button variant="outline" className="w-full">
                        Contact Form
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Info */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-4">
                    Quick Info
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Service Call Fee</dt>
                      <dd className="font-semibold text-gray-900">
                        ${siteConfig.serviceFee.diagnostic} ({siteConfig.serviceFee.note})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Warranty</dt>
                      <dd className="font-semibold text-gray-900">
                        {siteConfig.trustSignals.warrantyDays}-Day Parts & Labor
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Same-Day Service</dt>
                      <dd className="font-semibold text-gray-900">
                        Available for appointments before noon
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Service Area</dt>
                      <dd className="font-semibold text-gray-900">All of Orange County</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Emergency */}
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    Emergency Service
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Broken refrigerator? Flooding washer? We offer 24/7 emergency service.
                  </p>
                  <a href={`tel:${siteConfig.contact.phoneClean}`}>
                    <Button variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-100">
                      Emergency: {siteConfig.contact.phone}
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
