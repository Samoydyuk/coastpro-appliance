import { FAQItem } from '@/types';

export const faqItems: FAQItem[] = [
  // General
  {
    id: "service-areas",
    question: "What areas do you serve?",
    answer: "We proudly serve all of Orange County, California including Irvine, Newport Beach, Costa Mesa, Huntington Beach, Anaheim, Santa Ana, Orange, Tustin, Laguna Beach, Mission Viejo, Lake Forest, Fullerton, Yorba Linda, Brea, Placentia, and surrounding cities.",
    category: "general",
    order: 1
  },
  {
    id: "appliance-types",
    question: "What types of appliances do you repair?",
    answer: "We repair all major household appliances including refrigerators, washers, dryers, dishwashers, ovens, ranges, cooktops, microwaves, garbage disposals and ice makers, on both gas and electric units from all major brands. We also clean dryer vents and install washers, dryers, dishwashers and garbage disposals.",
    category: "general",
    order: 2
  },
  {
    id: "brands-serviced",
    question: "What brands do you service?",
    answer: "We service all major appliance brands including Samsung, LG, Whirlpool, GE, Frigidaire, KitchenAid, Maytag, Bosch, Sub-Zero, Viking, Wolf, Thermador, Miele, Kenmore, Speed Queen, and many more. Our technicians are experienced with all major brands.",
    category: "general",
    order: 3
  },

  // Pricing
  {
    id: "service-call-cost",
    question: "How much does a service call cost?",
    answer: "Our minimum service call is $150. It covers the technician visit and a complete diagnosis. Quick fixes are included in that call rather than billed on top — resetting the appliance, adjustments, leveling and anything else that doesn't take long. If the job needs parts or more extensive work, we quote it for your approval before we start.",
    category: "pricing",
    order: 1
  },
  {
    id: "repair-cost",
    question: "How much will my repair cost?",
    answer: "Most repairs land between $150 and $450 including parts, and nothing is billed below the $150 minimum service call. The exact figure depends on the appliance, the fault and the parts needed — high-end brands such as Sub-Zero, Viking, Wolf and Miele, and jobs that are awkward to access, can run above that range. Either way our technician gives you a detailed, upfront quote after diagnosing the issue, and no work starts until you approve it. There are no hidden fees or surprises.",
    category: "pricing",
    order: 2
  },
  {
    id: "payment-methods",
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover), debit cards, cash, and checks. Payment is due upon completion of the repair.",
    category: "pricing",
    order: 3
  },

  // Scheduling
  {
    id: "same-day-service",
    question: "Do you offer same-day service?",
    answer: "Yes! We offer same-day service for most appointments booked before 12 PM. We understand that a broken appliance can disrupt your daily routine, so we do our best to get to you as quickly as possible.",
    category: "scheduling",
    order: 1
  },
  {
    id: "appointment-window",
    question: "What is your appointment window?",
    answer: "We book a 3-hour arrival window so you are not waiting all day. Your technician calls no later than 30 minutes before arriving, so you know when to expect them.",
    category: "scheduling",
    order: 2
  },
  {
    id: "weekend-service",
    question: "Do you work on weekends?",
    answer: "Yes, we work 7 days a week, 9:00 AM to 8:00 PM every day including Saturday and Sunday. Emergency service is available 24/7 for urgent situations.",
    category: "scheduling",
    order: 3
  },
  {
    id: "emergency-service",
    question: "Do you offer emergency service?",
    answer: "Yes, we offer 24/7 emergency service for urgent situations like a broken refrigerator with food at risk. Emergency calls may have an additional fee. Call our main number and select the emergency option.",
    category: "scheduling",
    order: 4
  },

  // Warranty
  {
    id: "repair-warranty",
    question: "What warranty do you provide on repairs?",
    answer: "All our repairs come with a 90-day warranty covering both parts and labor. If the same issue recurs within 90 days of our repair, we'll fix it at no additional cost.",
    category: "warranty",
    order: 1
  },
  {
    id: "parts-used",
    question: "Do you use original manufacturer parts?",
    answer: "We use OEM (Original Equipment Manufacturer) parts whenever possible. In some cases, we may recommend high-quality aftermarket parts that meet or exceed OEM specifications, which can save you money without sacrificing quality.",
    category: "warranty",
    order: 2
  },
  {
    id: "appliance-warranty",
    question: "Can you work on appliances still under manufacturer warranty?",
    answer: "If your appliance is under manufacturer warranty, we recommend contacting the manufacturer first as the repair may be covered. However, if you prefer our service or the warranty has specific limitations, we're happy to help.",
    category: "warranty",
    order: 3
  },

  // Services
  {
    id: "repair-time",
    question: "How long does a typical repair take?",
    answer: "Most repairs are completed in 1-2 hours during a single visit. Some complex repairs or situations requiring special-order parts may require a follow-up visit. We'll always let you know what to expect.",
    category: "services",
    order: 1
  },
  {
    id: "parts-availability",
    question: "Do you carry parts on your trucks?",
    answer: "Yes, our service vehicles are stocked with common parts for major appliances. This allows us to complete most repairs on the first visit. For less common parts, we can typically get them within 1-2 business days.",
    category: "services",
    order: 2
  },
  {
    id: "installation",
    question: "Do you install new appliances?",
    answer: "Yes. Alongside repair we install washers, dryers, dishwashers and garbage disposals, and we can handle basic hookups. For anything outside that — built-in refrigeration, ranges and other full installations — we can recommend trusted partners.",
    category: "services",
    order: 3
  },
  {
    id: "second-opinions",
    question: "Can I get a second opinion on a repair quote?",
    answer: "Absolutely. We're confident in our fair pricing, but we understand you may want to compare. The $150 minimum service call still applies for the visit, and we'll provide a detailed written quote you can compare with others.",
    category: "services",
    order: 4
  },

  // Emergency
  {
    id: "emergency-refrigerator",
    question: "My refrigerator stopped working. Is this an emergency?",
    answer: "A non-working refrigerator can be urgent due to food spoilage risk. We recommend calling us right away - we offer same-day service for refrigerator emergencies and can often get to you within hours.",
    category: "emergency",
    order: 1
  },
  {
    id: "gas-leak",
    question: "I smell gas from my appliance. What should I do?",
    answer: "If you smell gas, immediately turn off the appliance, open windows, evacuate your home, and call your gas company's emergency line from outside. Do not use any electrical switches or create sparks. Once cleared by the gas company, call us for appliance repair.",
    category: "emergency",
    order: 2
  },
  {
    id: "flooding",
    question: "My washer or dishwasher is flooding. What should I do?",
    answer: "First, turn off the water supply to the appliance and unplug it if safe to do so. Clean up the water to prevent damage. Then call us for emergency service - we can often get to you the same day to diagnose and repair the issue.",
    category: "emergency",
    order: 3
  }
];

export function getFAQsByCategory(category: FAQItem['category']): FAQItem[] {
  return faqItems
    .filter(item => item.category === category)
    .sort((a, b) => a.order - b.order);
}

export function getAllFAQs(): FAQItem[] {
  return faqItems.sort((a, b) => a.order - b.order);
}

export const faqCategories = [
  { id: 'general', label: 'General Questions' },
  { id: 'pricing', label: 'Pricing & Payment' },
  { id: 'scheduling', label: 'Scheduling & Availability' },
  { id: 'warranty', label: 'Warranty & Parts' },
  { id: 'services', label: 'Services' },
  { id: 'emergency', label: 'Emergency Situations' },
] as const;
