import { Testimonial } from '@/types';

export const testimonials: Testimonial[] = [
  {
    id: "1",
    customerName: "Sarah M.",
    location: "Irvine",
    rating: 5,
    reviewText: "My refrigerator stopped cooling on a Sunday afternoon. I called CoastPro Appliance Repair and they had a technician at my house within 2 hours! Mike diagnosed the problem quickly, had the part in his truck, and fixed it on the spot. Saved all my food and my sanity. Highly recommend!",
    serviceType: "refrigerator",
    date: "2024-01-15",
    verified: true
  },
  {
    id: "2",
    customerName: "David L.",
    location: "Newport Beach",
    rating: 5,
    reviewText: "We have a Sub-Zero refrigerator that needed repair. Most companies wanted to charge a fortune or didn't know how to work on it. CoastPro Appliance Repair sent a technician who was factory-trained on Sub-Zero appliances. Professional, knowledgeable, and fair pricing. Will definitely use again.",
    serviceType: "refrigerator",
    date: "2024-01-08",
    verified: true
  },
  {
    id: "3",
    customerName: "Jennifer K.",
    location: "Costa Mesa",
    rating: 5,
    reviewText: "Our washing machine was making terrible noises and wouldn't spin properly. The technician, Carlos, was punctual, professional, and explained everything clearly. He fixed the issue in about an hour and the washer works better than ever. Great service at a reasonable price!",
    serviceType: "washer",
    date: "2024-01-02",
    verified: true
  },
  {
    id: "4",
    customerName: "Robert T.",
    location: "Huntington Beach",
    rating: 5,
    reviewText: "Fast and reliable service! My dryer wasn't heating and I called on a Tuesday morning. They came out the same day, diagnosed a bad heating element, and had it fixed within an hour. Fair price and 90-day warranty gave me peace of mind.",
    serviceType: "dryer",
    date: "2023-12-28",
    verified: true
  },
  {
    id: "5",
    customerName: "Maria G.",
    location: "Anaheim",
    rating: 5,
    reviewText: "I've used CoastPro Appliance Repair twice now - once for my dishwasher and once for my oven. Both times they were professional, on-time, and fixed the problem quickly. They're now my go-to for any appliance issues. Thank you!",
    serviceType: "dishwasher",
    date: "2023-12-20",
    verified: true
  },
  {
    id: "6",
    customerName: "James W.",
    location: "Santa Ana",
    rating: 5,
    reviewText: "Excellent experience from start to finish. Called about my broken garbage disposal, got an appointment for the next morning, and the technician had it running in 30 minutes. Very reasonable pricing and great customer service.",
    serviceType: "garbage-disposal",
    date: "2023-12-15",
    verified: true
  },
  {
    id: "7",
    customerName: "Lisa H.",
    location: "Orange",
    rating: 5,
    reviewText: "Our gas range stopped working right before Thanksgiving! CoastPro Appliance Repair came out on short notice and saved our holiday dinner. The technician was knowledgeable, friendly, and got our oven working perfectly. Can't thank them enough!",
    serviceType: "oven-range",
    date: "2023-11-22",
    verified: true
  },
  {
    id: "8",
    customerName: "Michael P.",
    location: "Tustin",
    rating: 5,
    reviewText: "My built-in microwave stopped working and I was worried about the cost since it's a high-end model. The technician was upfront about the pricing, diagnosed it quickly, and the repair was much more affordable than I expected. Great job!",
    serviceType: "microwave",
    date: "2023-11-15",
    verified: true
  },
  {
    id: "9",
    customerName: "Karen S.",
    location: "Laguna Beach",
    rating: 5,
    reviewText: "We have a Viking range that needed repair. CoastPro Appliance Repair sent someone who knew exactly what they were doing. Professional, clean work area, and the range works perfectly now. Premium service for our premium appliances!",
    serviceType: "oven-range",
    date: "2023-11-08",
    verified: true
  },
  {
    id: "10",
    customerName: "Steven R.",
    location: "Mission Viejo",
    rating: 5,
    reviewText: "Ice maker in our refrigerator stopped working. The technician arrived on time, quickly found the issue, and had it repaired the same visit. Ice is flowing again! Appreciate the professional service.",
    serviceType: "ice-maker",
    date: "2023-11-01",
    verified: true
  },
  {
    id: "11",
    customerName: "Amanda C.",
    location: "Lake Forest",
    rating: 5,
    reviewText: "Our front-load washer was leaking badly. Called CoastPro Appliance Repair and they came out the next day. The technician was very thorough, found the problem, and fixed it properly. No more leaks! Highly recommend their service.",
    serviceType: "washer",
    date: "2023-10-25",
    verified: true
  },
  {
    id: "12",
    customerName: "Thomas B.",
    location: "Fullerton",
    rating: 5,
    reviewText: "Dryer was taking 3 cycles to dry clothes. Turned out to be a clogged vent and faulty thermostat. The technician cleaned everything out and replaced the part. Now clothes dry in one cycle like they should. Great service!",
    serviceType: "dryer",
    date: "2023-10-18",
    verified: true
  }
];

export function getTestimonialsByService(serviceSlug: string): Testimonial[] {
  return testimonials.filter(t => t.serviceType === serviceSlug);
}

export function getTestimonialsByLocation(location: string): Testimonial[] {
  return testimonials.filter(t =>
    t.location.toLowerCase() === location.toLowerCase()
  );
}

export function getFeaturedTestimonials(count: number = 6): Testimonial[] {
  return testimonials
    .filter(t => t.rating === 5)
    .slice(0, count);
}
