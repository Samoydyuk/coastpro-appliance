import { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { PageHeader } from '@/components/sections';
import { ContactForm } from '@/components/forms';
import { siteConfig } from '@/data/site-config';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: `Contact CoastPro Appliance Repair for fast, reliable appliance repair services in Orange County. Call ${siteConfig.contact.phone} or fill out our contact form.`,
  openGraph: {
    title: 'Contact Us | CoastPro Appliance Repair',
    description: 'Get in touch with our expert appliance repair team. Same-day service available.',
  },
};

const contactInfo = [
  {
    icon: Phone,
    title: 'Phone',
    content: siteConfig.contact.phone,
    href: `tel:${siteConfig.contact.phoneClean}`,
    description: 'Call us for immediate assistance',
  },
  {
    icon: Mail,
    title: 'Email',
    content: siteConfig.contact.email,
    href: `mailto:${siteConfig.contact.email}`,
    description: 'Send us an email anytime',
  },
  {
    icon: MapPin,
    title: 'Service Area',
    content: 'Orange County, CA',
    description: 'Serving all OC cities',
  },
  {
    icon: Clock,
    title: 'Business Hours',
    content: `Every Day: ${siteConfig.businessHours.weekdays}`,
    description: 'Open 7 days a week',
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Let's get it"
        titleMuted="working again."
        subtitle="Ready to get your appliance fixed? Contact us today for fast, reliable service."
        location="Irvine, CA"
      />

      {/* Contact Section */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-8">
                  <div className="eyebrow mb-3">01 — Message Us</div>
                  <h2 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-3">
                    Send Us a Message
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Fill out the form below and we&apos;ll get back to you as soon as possible.
                  </p>
                  <ContactForm />
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              {contactInfo.map((info) => (
                <Card key={info.title}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <span className="icon-disc h-12 w-12 shrink-0">
                        <info.icon className="h-5 w-5" strokeWidth={1.5} />
                      </span>
                      <div>
                        <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500 mb-2">{info.title}</h3>
                        {info.href ? (
                          <a
                            href={info.href}
                            className="font-heading font-semibold text-ink hover:text-primary-600 transition-colors"
                          >
                            {info.content}
                          </a>
                        ) : (
                          <div className="font-heading font-semibold text-ink">{info.content}</div>
                        )}
                        <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Emergency Notice */}
              <Card className="bg-primary-800 border-primary-800">
                <CardContent className="p-6">
                  <h3 className="font-heading text-sm font-bold uppercase tracking-label text-cream mb-3">
                    Emergency Service
                  </h3>
                  <p className="text-primary-200 text-sm mb-5">
                    {siteConfig.businessHours.emergency}
                  </p>
                  <a
                    href={`tel:${siteConfig.contact.phoneClean}`}
                    className="inline-flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-label text-cream hover:text-primary-300 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    Call Now
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section (Placeholder) */}
      <section className="py-20 bg-cream-light border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-10">
            <div className="eyebrow">02 — Coverage</div>
            <h2 className="headline text-2xl sm:text-3xl md:text-4xl mt-4 mb-6">
              Our service
              <br />
              <span className="headline-muted">area.</span>
            </h2>
            <div className="rule-short mb-6" />
            <p className="text-lg text-gray-600">
              We proudly serve all of Orange County, California.
            </p>
          </div>
          <div className="h-96 overflow-hidden border border-primary-500/25">
            <iframe
              src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=Orange+County,CA&zoom=10"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="CoastPro Appliance Repair Service Area - Irvine, Orange County"
            />
          </div>
        </div>
      </section>
    </>
  );
}
