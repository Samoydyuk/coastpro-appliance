import { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
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
    content: 'Mon-Fri: 7AM-8PM',
    description: `Sat: ${siteConfig.businessHours.saturday} | Sun: ${siteConfig.businessHours.sunday}`,
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Ready to get your appliance fixed? Contact us today for fast, reliable service.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-8">
                  <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">
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
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                        <info.icon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{info.title}</h3>
                        {info.href ? (
                          <a
                            href={info.href}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            {info.content}
                          </a>
                        ) : (
                          <div className="font-medium text-gray-900">{info.content}</div>
                        )}
                        <p className="text-sm text-gray-500 mt-1">{info.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Emergency Notice */}
              <Card className="bg-accent-50 border-accent-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Emergency Service
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {siteConfig.businessHours.emergency}
                  </p>
                  <a
                    href={`tel:${siteConfig.contact.phoneClean}`}
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
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
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-4">
              Our Service Area
            </h2>
            <p className="text-gray-600">
              We proudly serve all of Orange County, California
            </p>
          </div>
          <div className="bg-gray-200 rounded-xl h-96 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4" />
              <p>Interactive map would be displayed here</p>
              <p className="text-sm">Google Maps integration available</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
