import { ServiceArea } from '@/types';

export const serviceAreas: ServiceArea[] = [
  {
    id: "irvine",
    slug: "irvine",
    name: "Irvine",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92602", "92603", "92604", "92606", "92612", "92614", "92617", "92618", "92620"],
    coordinates: { lat: 33.6846, lng: -117.8265 },
    description: "Irvine residents trust CoastPro Appliance Repair for fast, reliable service. Our technicians serve all Irvine neighborhoods including Woodbridge, Northwood, Turtle Rock, University Park, and the Irvine Spectrum area. We understand that a broken appliance can disrupt your busy lifestyle, which is why we offer same-day service throughout Irvine.",
    landmarks: ["Irvine Spectrum Center", "UC Irvine", "Great Park", "Woodbridge"],
    neighboringCities: ["tustin", "newport-beach", "costa-mesa", "lake-forest"],
    seo: {
      title: "Appliance Repair Irvine CA | Same-Day Service | CoastPro Appliance",
      description: "Professional appliance repair in Irvine, CA. Refrigerator, washer, dryer, dishwasher repair. 90-day warranty. Same-day service. Call (949) 749-0006.",
      keywords: ["appliance repair irvine", "refrigerator repair irvine ca", "washer repair irvine", "dryer repair irvine"]
    }
  },
  {
    id: "newport-beach",
    slug: "newport-beach",
    name: "Newport Beach",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92657", "92658", "92659", "92660", "92661", "92662", "92663"],
    coordinates: { lat: 33.6189, lng: -117.9289 },
    description: "Newport Beach homeowners rely on CoastPro Appliance Repair for premium appliance service. We specialize in high-end and luxury appliances common in Corona del Mar, Balboa Island, Newport Coast, and Fashion Island area homes. Our technicians are trained on Sub-Zero, Viking, Wolf, and other premium brands.",
    landmarks: ["Fashion Island", "Balboa Peninsula", "Newport Harbor", "Corona del Mar"],
    neighboringCities: ["costa-mesa", "irvine", "huntington-beach", "laguna-beach"],
    seo: {
      title: "Appliance Repair Newport Beach CA | Premium Service",
      description: "Expert appliance repair in Newport Beach. Sub-Zero, Viking, Wolf specialists. High-end refrigerator, range repair. Same-day service. Call (949) 749-0006.",
      keywords: ["appliance repair newport beach", "sub-zero repair newport beach", "viking repair newport beach", "luxury appliance repair"]
    }
  },
  {
    id: "costa-mesa",
    slug: "costa-mesa",
    name: "Costa Mesa",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92626", "92627", "92628"],
    coordinates: { lat: 33.6411, lng: -117.9187 },
    description: "Costa Mesa residents count on CoastPro Appliance Repair for affordable, professional service. We serve all Costa Mesa neighborhoods including Mesa Verde, South Coast Metro, Eastside, and Westside. Our technicians provide fast, reliable repairs for all major appliance brands.",
    landmarks: ["South Coast Plaza", "Segerstrom Center", "Triangle Square", "The LAB"],
    neighboringCities: ["newport-beach", "huntington-beach", "irvine", "santa-ana"],
    seo: {
      title: "Appliance Repair Costa Mesa CA | Affordable & Fast",
      description: "Professional appliance repair in Costa Mesa. All brands serviced. Refrigerator, washer, dryer repair. 90-day warranty. Call (949) 749-0006.",
      keywords: ["appliance repair costa mesa", "refrigerator repair costa mesa", "washer repair costa mesa", "dryer repair costa mesa"]
    }
  },
  {
    id: "huntington-beach",
    slug: "huntington-beach",
    name: "Huntington Beach",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92646", "92647", "92648", "92649"],
    coordinates: { lat: 33.6595, lng: -117.9988 },
    description: "Huntington Beach homeowners trust CoastPro Appliance Repair for fast, reliable service. From downtown to Huntington Harbour, Seacliff, and Bolsa Chica, our technicians serve all HB neighborhoods with same-day appointments and quality repairs.",
    landmarks: ["Huntington Beach Pier", "Pacific City", "Bolsa Chica", "Main Street"],
    neighboringCities: ["costa-mesa", "fountain-valley", "westminster", "seal-beach"],
    seo: {
      title: "Appliance Repair Huntington Beach CA | Same-Day Service",
      description: "Fast appliance repair in Huntington Beach. Refrigerator, washer, dryer, dishwasher repair. All brands. 90-day warranty. Call (949) 749-0006.",
      keywords: ["appliance repair huntington beach", "refrigerator repair huntington beach", "washer repair huntington beach"]
    }
  },
  {
    id: "anaheim",
    slug: "anaheim",
    name: "Anaheim",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92801", "92802", "92804", "92805", "92806", "92807", "92808"],
    coordinates: { lat: 33.8366, lng: -117.9143 },
    description: "Anaheim families trust CoastPro Appliance Repair for dependable service. We serve all Anaheim areas including Anaheim Hills, West Anaheim, and neighborhoods near Disneyland and Angel Stadium. Quick response times and quality repairs keep your home running smoothly.",
    landmarks: ["Disneyland Resort", "Angel Stadium", "Honda Center", "Anaheim Hills"],
    neighboringCities: ["orange", "fullerton", "placentia", "yorba-linda"],
    seo: {
      title: "Appliance Repair Anaheim CA | Fast & Reliable",
      description: "Trusted appliance repair in Anaheim. Refrigerator, washer, dryer repair. Serving Anaheim Hills to West Anaheim. 90-day warranty. Call (949) 749-0006.",
      keywords: ["appliance repair anaheim", "refrigerator repair anaheim", "washer repair anaheim", "appliance repair anaheim hills"]
    }
  },
  {
    id: "santa-ana",
    slug: "santa-ana",
    name: "Santa Ana",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92701", "92703", "92704", "92705", "92706", "92707"],
    coordinates: { lat: 33.7455, lng: -117.8677 },
    description: "Santa Ana residents depend on CoastPro Appliance Repair for affordable, quality service. As the county seat of Orange County, Santa Ana is at the heart of our service area. We provide fast response times and competitive pricing throughout all Santa Ana neighborhoods.",
    landmarks: ["MainPlace Mall", "Santa Ana Zoo", "Discovery Cube", "Downtown Santa Ana"],
    neighboringCities: ["orange", "tustin", "costa-mesa", "garden-grove"],
    seo: {
      title: "Appliance Repair Santa Ana CA | Affordable Service",
      description: "Quality appliance repair in Santa Ana. Refrigerator, washer, dryer repair. Affordable pricing, 90-day warranty. Call (949) 749-0006.",
      keywords: ["appliance repair santa ana", "refrigerator repair santa ana", "washer repair santa ana", "affordable appliance repair"]
    }
  },
  {
    id: "orange",
    slug: "orange",
    name: "Orange",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92856", "92857", "92862", "92865", "92866", "92867", "92868", "92869"],
    coordinates: { lat: 33.7879, lng: -117.8531 },
    description: "Orange residents trust CoastPro Appliance Repair for professional service in the heart of Orange County. From Old Towne to Orange Hills, we serve all neighborhoods with same-day appointments and expert repairs on all major appliance brands.",
    landmarks: ["Old Towne Orange", "The Outlets at Orange", "Chapman University", "Orange Hills"],
    neighboringCities: ["anaheim", "santa-ana", "tustin", "villa-park"],
    seo: {
      title: "Appliance Repair Orange CA | Professional Service",
      description: "Expert appliance repair in Orange, CA. All major brands. Refrigerator, washer, dryer repair. Same-day service available. Call (949) 749-0006.",
      keywords: ["appliance repair orange ca", "refrigerator repair orange", "washer repair orange ca"]
    }
  },
  {
    id: "tustin",
    slug: "tustin",
    name: "Tustin",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92780", "92781", "92782"],
    coordinates: { lat: 33.7458, lng: -117.8262 },
    description: "Tustin homeowners count on CoastPro Appliance Repair for reliable service. From Old Town Tustin to Tustin Ranch and the Tustin Legacy area, our technicians provide fast, professional repairs throughout the city.",
    landmarks: ["The District at Tustin Legacy", "Old Town Tustin", "Tustin Ranch", "Peters Canyon"],
    neighboringCities: ["irvine", "santa-ana", "orange"],
    seo: {
      title: "Appliance Repair Tustin CA | Same-Day Appointments",
      description: "Reliable appliance repair in Tustin. Serving Tustin Ranch, Old Town & Legacy. All brands repaired. 90-day warranty. Call (949) 749-0006.",
      keywords: ["appliance repair tustin", "refrigerator repair tustin", "washer repair tustin", "tustin ranch appliance repair"]
    }
  },
  {
    id: "laguna-beach",
    slug: "laguna-beach",
    name: "Laguna Beach",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92651", "92652"],
    coordinates: { lat: 33.5422, lng: -117.7831 },
    description: "Laguna Beach homeowners trust CoastPro Appliance Repair for premium service. We understand the unique needs of coastal homes and are experienced with the high-end appliances common in Laguna Beach properties. From Top of the World to South Laguna, we've got you covered.",
    landmarks: ["Main Beach", "Festival of Arts", "Laguna Art Museum", "Top of the World"],
    neighboringCities: ["newport-beach", "laguna-niguel", "aliso-viejo"],
    seo: {
      title: "Appliance Repair Laguna Beach CA | Coastal Experts",
      description: "Premium appliance repair in Laguna Beach. High-end and luxury appliances. Sub-Zero, Viking, Wolf specialists. Call (949) 749-0006.",
      keywords: ["appliance repair laguna beach", "luxury appliance repair laguna beach", "sub-zero repair laguna beach"]
    }
  },
  {
    id: "mission-viejo",
    slug: "mission-viejo",
    name: "Mission Viejo",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92690", "92691", "92692"],
    coordinates: { lat: 33.6000, lng: -117.6720 },
    description: "Mission Viejo families trust CoastPro Appliance Repair for dependable service. As one of the safest cities in America, Mission Viejo residents expect quality - and we deliver. We serve all MV neighborhoods with prompt, professional repairs.",
    landmarks: ["Mission Viejo Lake", "The Shops at Mission Viejo", "Kaleidoscope", "Oso Creek Trail"],
    neighboringCities: ["lake-forest", "laguna-hills", "rancho-santa-margarita"],
    seo: {
      title: "Appliance Repair Mission Viejo CA | Trusted Service",
      description: "Dependable appliance repair in Mission Viejo. Family-owned, quality service. All brands repaired. 90-day warranty. Call (949) 749-0006.",
      keywords: ["appliance repair mission viejo", "refrigerator repair mission viejo", "washer repair mission viejo"]
    }
  },
  {
    id: "lake-forest",
    slug: "lake-forest",
    name: "Lake Forest",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92630"],
    coordinates: { lat: 33.6469, lng: -117.6890 },
    description: "Lake Forest residents rely on CoastPro Appliance Repair for fast, friendly service. From Foothill Ranch to the Portola Hills area, we provide same-day appointments and quality repairs throughout Lake Forest.",
    landmarks: ["Foothill Ranch Towne Centre", "Lake Forest Sports Park", "Etnies Skatepark"],
    neighboringCities: ["mission-viejo", "irvine", "laguna-hills"],
    seo: {
      title: "Appliance Repair Lake Forest CA | Fast & Friendly",
      description: "Fast appliance repair in Lake Forest. Refrigerator, washer, dryer repair. Serving Foothill Ranch area. 90-day warranty. Call (949) 749-0006.",
      keywords: ["appliance repair lake forest", "refrigerator repair lake forest", "appliance repair foothill ranch"]
    }
  },
  {
    id: "fullerton",
    slug: "fullerton",
    name: "Fullerton",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92831", "92832", "92833", "92834", "92835"],
    coordinates: { lat: 33.8703, lng: -117.9253 },
    description: "Fullerton homeowners trust CoastPro Appliance Repair for reliable service. From Downtown Fullerton to Sunny Hills and Amerige Heights, we provide expert repairs throughout this vibrant city. Cal State Fullerton area included!",
    landmarks: ["Downtown Fullerton", "Cal State Fullerton", "Fullerton Arboretum", "Muckenthaler Cultural Center"],
    neighboringCities: ["anaheim", "placentia", "brea", "la-habra"],
    seo: {
      title: "Appliance Repair Fullerton CA | Expert Technicians",
      description: "Expert appliance repair in Fullerton. All brands serviced. Refrigerator, washer, dryer repair. Same-day service. Call (949) 749-0006.",
      keywords: ["appliance repair fullerton", "refrigerator repair fullerton", "washer repair fullerton ca"]
    }
  },
  {
    id: "yorba-linda",
    slug: "yorba-linda",
    name: "Yorba Linda",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92886", "92887"],
    coordinates: { lat: 33.8886, lng: -117.8131 },
    description: "Yorba Linda residents trust CoastPro Appliance Repair for premium service in the 'Land of Gracious Living.' We serve all Yorba Linda neighborhoods with professional repairs on standard and high-end appliances alike.",
    landmarks: ["Richard Nixon Presidential Library", "Black Gold Golf Club", "Yorba Linda Library"],
    neighboringCities: ["placentia", "anaheim", "brea"],
    seo: {
      title: "Appliance Repair Yorba Linda CA | Premium Service",
      description: "Premium appliance repair in Yorba Linda. All brands including high-end. Refrigerator, washer, dryer repair. Call (949) 749-0006.",
      keywords: ["appliance repair yorba linda", "refrigerator repair yorba linda", "washer repair yorba linda"]
    }
  },
  {
    id: "brea",
    slug: "brea",
    name: "Brea",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92821", "92822", "92823"],
    coordinates: { lat: 33.9167, lng: -117.9000 },
    description: "Brea residents count on CoastPro Appliance Repair for quality service. From the Brea Mall area to Carbon Canyon and Brea Hills, our technicians provide fast, reliable repairs throughout the city.",
    landmarks: ["Brea Mall", "Downtown Brea", "Carbon Canyon Regional Park", "Brea Sports Park"],
    neighboringCities: ["fullerton", "placentia", "yorba-linda", "la-habra"],
    seo: {
      title: "Appliance Repair Brea CA | Quality Service",
      description: "Quality appliance repair in Brea. All major brands. Refrigerator, washer, dryer repair. 90-day warranty. Call (949) 749-0006.",
      keywords: ["appliance repair brea", "refrigerator repair brea", "washer repair brea ca"]
    }
  },
  {
    id: "placentia",
    slug: "placentia",
    name: "Placentia",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92870", "92871"],
    coordinates: { lat: 33.8722, lng: -117.8703 },
    description: "Placentia homeowners trust CoastPro Appliance Repair for dependable service. We serve all Placentia neighborhoods with prompt, professional repairs at competitive prices.",
    landmarks: ["Downtown Placentia", "Tri-City Park", "Placentia Champions Sports Complex"],
    neighboringCities: ["fullerton", "yorba-linda", "anaheim"],
    seo: {
      title: "Appliance Repair Placentia CA | Dependable Service",
      description: "Dependable appliance repair in Placentia. Refrigerator, washer, dryer repair. All brands. 90-day warranty. Call (949) 749-0006.",
      keywords: ["appliance repair placentia", "refrigerator repair placentia", "washer repair placentia"]
    }
  }
];

export function getServiceAreaBySlug(slug: string): ServiceArea | undefined {
  return serviceAreas.find(area => area.slug === slug);
}

export function getNeighboringAreas(currentSlug: string): ServiceArea[] {
  const current = getServiceAreaBySlug(currentSlug);
  if (!current) return [];
  return serviceAreas.filter(a => current.neighboringCities.includes(a.slug));
}
