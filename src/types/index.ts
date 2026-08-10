// Service Types
export interface Service {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  icon: string;
  image: string;
  commonProblems: Problem[];
  features: string[];
  priceRange: {
    min: number;
    max: number;
    unit: string;
  };
  /**
   * Set for services billed by measure rather than as a flat repair, e.g.
   * dryer vent cleaning charged per foot of duct against a minimum order.
   * When present it replaces the priceRange display.
   */
  pricing?: {
    lines: { label: string; value: string }[];
    minimum: number;
    /** Feet of duct the minimum order already covers. */
    includedFeet: number;
    /** One-line form of the rate card, for sidebars and banners. */
    summary: string;
    notes: string[];
  };
  estimatedTime: string;
  warranty: string;
  brands: string[];
  relatedServices: string[];
  seo: SEOData;
}

export interface Problem {
  title: string;
  description: string;
  symptoms: string[];
  solution: string;
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
}

// Testimonial Types
export interface Testimonial {
  id: string;
  customerName: string;
  location: string;
  rating: number;
  reviewText: string;
  serviceType: string;
  date: string;
  verified: boolean;
}

// Service Area Types
export interface ServiceArea {
  id: string;
  slug: string;
  name: string;
  county: string;
  state: string;
  zipCodes: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  landmarks?: string[];
  neighboringCities: string[];
  seo: SEOData;
}

// FAQ Types
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  relatedServices?: string[];
  order: number;
}

export type FAQCategory =
  | 'general'
  | 'pricing'
  | 'scheduling'
  | 'warranty'
  | 'services'
  | 'emergency';

// Blog Types
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: Author;
  publishedAt: string;
  updatedAt?: string;
  category: BlogCategory;
  tags: string[];
  readingTime: number;
  featured: boolean;
  seo: SEOData;
}

export interface Author {
  name: string;
  role: string;
  avatar: string;
  bio?: string;
}

export type BlogCategory =
  | 'maintenance-tips'
  | 'repair-guides'
  | 'buying-guides'
  | 'energy-efficiency'
  | 'appliance-news';

// Contact Form Types
export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  preferredDate?: string;
  preferredTime?: string;
}

// Team Member Types
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  certifications?: string[];
}
