import { Metadata } from 'next';
import Link from 'next/link';
import { Phone } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent, Button, Card, CardContent } from '@/components/ui';
import { PageHeader } from '@/components/sections';
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

      <PageHeader
        eyebrow="FAQ"
        title="Questions,"
        titleMuted="answered."
        subtitle="Common questions about our appliance repair services."
      />

      {/* FAQ Content */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* FAQ List */}
            <div className="lg:col-span-2 space-y-12">
              {faqCategories.map((category) => {
                const categoryFAQs = getFAQsByCategory(category.id as typeof faqItems[0]['category']);
                if (categoryFAQs.length === 0) return null;

                return (
                  <div key={category.id}>
                    <h2 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-6">
                      {category.label}
                    </h2>
                    <Card>
                      <CardContent className="p-6">
                        <Accordion type="single">
                          {categoryFAQs.map((faq) => (
                            <AccordionItem key={faq.id} value={faq.id}>
                              <AccordionTrigger className="text-left">
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
              <Card className="bg-cream-dark">
                <CardContent className="p-6">
                  <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-3">
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
                  <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-5">
                    Quick Info
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-label text-primary-500 mb-1">Minimum Service Call</dt>
                      <dd className="font-heading font-semibold text-ink">
                        ${siteConfig.serviceCall.minimum}
                      </dd>
                      <dd className="text-xs leading-relaxed text-gray-600 mt-1">
                        {siteConfig.serviceCall.appliedToRepair}.
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-label text-primary-500 mb-1">Warranty</dt>
                      <dd className="font-heading font-semibold text-ink">
                        {siteConfig.trustSignals.warrantyDays}-Day Parts & Labor
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-label text-primary-500 mb-1">Same-Day Service</dt>
                      <dd className="font-heading font-semibold text-ink">
                        Available for appointments before noon
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-label text-primary-500 mb-1">Service Area</dt>
                      <dd className="font-heading font-semibold text-ink">All of Orange County</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Emergency */}
              <Card className="bg-primary-800 border-primary-800 text-cream">
                <CardContent className="p-6">
                  <h3 className="font-heading text-sm font-bold uppercase tracking-label text-cream mb-3">
                    Emergency Service
                  </h3>
                  <p className="text-primary-200 text-sm mb-5">
                    Broken refrigerator? Flooding washer? We offer 24/7 emergency service.
                  </p>
                  <a href={`tel:${siteConfig.contact.phoneClean}`}>
                    <Button variant="outline" className="w-full border-cream/60 text-cream hover:bg-cream hover:text-ink">
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
