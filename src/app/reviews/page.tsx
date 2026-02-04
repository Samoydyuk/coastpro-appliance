import { Metadata } from 'next';
import Link from 'next/link';
import { Star, Quote, CheckCircle } from 'lucide-react';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { CTABanner } from '@/components/sections';
import { testimonials } from '@/data/testimonials';

export const metadata: Metadata = {
  title: 'Customer Reviews & Testimonials',
  description: 'Read what our customers say about CoastPro Appliance Repair. 4.9 star rating from 500+ verified reviews. Real testimonials from Orange County homeowners.',
  openGraph: {
    title: 'Reviews | CoastPro Appliance Repair',
    description: '4.9 star rating from 500+ verified customer reviews.',
  },
};

const reviewStats = {
  average: 4.9,
  total: 500,
  breakdown: [
    { stars: 5, percentage: 92 },
    { stars: 4, percentage: 6 },
    { stars: 3, percentage: 1 },
    { stars: 2, percentage: 1 },
    { stars: 1, percentage: 0 },
  ],
};

export default function ReviewsPage() {
  return (
    <>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Customer Reviews
          </h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto mb-6">
            See what our customers are saying about CoastPro Appliance Repair
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-8 w-8 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="text-2xl font-bold">{reviewStats.average}</span>
            <span className="text-primary-200">({reviewStats.total}+ reviews)</span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Rating Breakdown */}
              <div>
                <h2 className="font-heading text-xl font-bold text-gray-900 mb-4">
                  Rating Breakdown
                </h2>
                <div className="space-y-2">
                  {reviewStats.breakdown.map((item) => (
                    <div key={item.stars} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-16">{item.stars} stars</span>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust Info */}
              <div className="text-center md:text-left">
                <h2 className="font-heading text-xl font-bold text-gray-900 mb-4">
                  Verified Reviews
                </h2>
                <p className="text-gray-600">
                  All reviews are from real customers who have used our appliance repair services throughout Orange County.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    {testimonial.verified && (
                      <Badge variant="success" size="sm">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <Quote className="h-8 w-8 text-primary-200 mb-3" />

                  <p className="text-gray-700 flex-grow mb-6 leading-relaxed">
                    &quot;{testimonial.reviewText}&quot;
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {testimonial.customerName}
                      </div>
                      <div className="text-sm text-gray-500">{testimonial.location}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(testimonial.date).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Ready to experience our service?
            </p>
            <Link href="/book-appointment">
              <Button>Book Your Appointment</Button>
            </Link>
          </div>
        </div>
      </section>

      <CTABanner
        title="Join Our Satisfied Customers"
        subtitle="Experience the CoastPro Appliance Repair difference today"
      />
    </>
  );
}
