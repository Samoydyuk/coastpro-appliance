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
      title: "Appliance Repair Irvine, CA | Same-Day Service",
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
      title: "Appliance Repair Newport Beach, CA",
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
      title: "Appliance Repair Costa Mesa, CA",
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
      title: "Appliance Repair Huntington Beach, CA",
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
      title: "Appliance Repair Anaheim, CA | Same-Day Service",
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
      title: "Appliance Repair Santa Ana, CA | Same-Day Service",
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
      title: "Appliance Repair Orange, CA | Same-Day Service",
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
      title: "Appliance Repair Tustin, CA | Same-Day Service",
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
      title: "Appliance Repair Laguna Beach, CA",
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
      title: "Appliance Repair Mission Viejo, CA",
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
      title: "Appliance Repair Lake Forest, CA",
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
      title: "Appliance Repair Fullerton, CA | Same-Day Service",
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
      title: "Appliance Repair Yorba Linda, CA",
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
      title: "Appliance Repair Brea, CA | Same-Day Service",
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
      title: "Appliance Repair Placentia, CA | Same-Day Service",
      description: "Dependable appliance repair in Placentia. Refrigerator, washer, dryer repair. All brands. 90-day warranty. Call (949) 749-0006.",
      keywords: ["appliance repair placentia", "refrigerator repair placentia", "washer repair placentia"]
    }
  },
  {
    id: "garden-grove",
    slug: "garden-grove",
    name: "Garden Grove",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92840", "92841", "92843", "92844", "92845"],
    coordinates: { lat: 33.7739, lng: -117.9414 },
    description: "Garden Grove runs on hard north county water and post-war tract housing, and both show up inside the machines. CoastPro repairs appliances across the city, from Little Saigon to the Historic Main Street district.",
    landmarks: ["Little Saigon", "Historic Main Street", "Garden Grove Park", "Christ Cathedral"],
    neighboringCities: ["santa-ana", "anaheim", "orange", "westminster"],
    seo: {
      title: "Appliance Repair Garden Grove, CA | Same-Day",
      description: "Appliance repair in Garden Grove — hard water scale, post-war housing, all major brands. 90-day warranty. Call (949) 749-0006.",
      keywords: ["appliance repair garden grove", "refrigerator repair garden grove", "washer repair garden grove ca"]
    }
  },
  {
    id: "westminster",
    slug: "westminster",
    name: "Westminster",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92683", "92684", "92685"],
    coordinates: { lat: 33.7514, lng: -117.9939 },
    description: "Westminster housing is largely 1950s and 60s tract, and the appliances inside it work hard in multi-generational households. CoastPro covers the whole city including the Little Saigon core.",
    landmarks: ["Little Saigon", "Asian Garden Mall", "Westminster Mall", "Sigler Park"],
    neighboringCities: ["garden-grove", "huntington-beach", "fountain-valley", "santa-ana"],
    seo: {
      title: "Appliance Repair Westminster, CA | Same-Day",
      description: "Appliance repair in Westminster — high-cycle households, 1950s and 60s housing, all major brands. 90-day warranty. Call (949) 749-0006.",
      keywords: ["appliance repair westminster ca", "refrigerator repair westminster", "washer repair westminster"]
    }
  },
  {
    id: "buena-park",
    slug: "buena-park",
    name: "Buena Park",
    county: "Orange County",
    state: "CA",
    zipCodes: ["90620", "90621", "90622", "90624"],
    coordinates: { lat: 33.8675, lng: -117.9981 },
    description: "Buena Park sits on the hardest water in the county and a housing stock built mostly between the fifties and the seventies. CoastPro repairs appliances throughout the city and the surrounding north county neighborhoods.",
    landmarks: ["Knott's Berry Farm", "Buena Park Downtown", "Ralph B. Clark Regional Park"],
    neighboringCities: ["fullerton", "anaheim", "la-habra", "cypress"],
    seo: {
      title: "Appliance Repair Buena Park, CA | Same-Day",
      description: "Appliance repair in Buena Park — hard water scale on elements and valves, older tract housing, all brands. Call (949) 749-0006.",
      keywords: ["appliance repair buena park", "refrigerator repair buena park", "washer repair buena park ca"]
    }
  },
  {
    id: "la-habra",
    slug: "la-habra",
    name: "La Habra",
    county: "Orange County",
    state: "CA",
    zipCodes: ["90631", "90632", "90633"],
    coordinates: { lat: 33.9319, lng: -117.9461 },
    description: "La Habra is the north edge of the county and it has the water to match — scale is the recurring theme in the machines here. CoastPro covers the city and the hills above it.",
    landmarks: ["La Habra Children's Museum", "Westridge Golf Club", "La Bonita Park"],
    neighboringCities: ["brea", "fullerton", "buena-park"],
    seo: {
      title: "Appliance Repair La Habra, CA | Same-Day",
      description: "Appliance repair in La Habra — hard water scale, older housing stock, all major brands. 90-day warranty. Call (949) 749-0006.",
      keywords: ["appliance repair la habra", "refrigerator repair la habra ca", "washer repair la habra"]
    }
  },
  {
    id: "fountain-valley",
    slug: "fountain-valley",
    name: "Fountain Valley",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92708", "92728"],
    coordinates: { lat: 33.7092, lng: -117.9536 },
    description: "Fountain Valley is single-story tract housing from the sixties and seventies with unusually long ownership, which means original kitchens and appliances that were looked after. CoastPro covers the whole city.",
    landmarks: ["Mile Square Regional Park", "Fountain Valley Recreation Center", "Talbert Nature Preserve"],
    neighboringCities: ["huntington-beach", "costa-mesa", "santa-ana", "westminster"],
    seo: {
      title: "Appliance Repair Fountain Valley, CA | Same-Day",
      description: "Appliance repair in Fountain Valley — original kitchens in long-held homes, garage laundry, all major brands. Call (949) 749-0006.",
      keywords: ["appliance repair fountain valley", "refrigerator repair fountain valley ca", "washer repair fountain valley"]
    }
  },
  {
    id: "laguna-niguel",
    slug: "laguna-niguel",
    name: "Laguna Niguel",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92677"],
    coordinates: { lat: 33.5225, lng: -117.7075 },
    description: "Laguna Niguel is hillside master-planned housing from the eighties through the two-thousands, with a heavy mix of detached homes and attached communities. CoastPro covers the whole city from Crown Valley to Bear Brand.",
    landmarks: ["Laguna Niguel Regional Park", "Crown Valley Community Park", "Bear Brand Plaza"],
    neighboringCities: ["mission-viejo", "laguna-beach", "lake-forest"],
    seo: {
      title: "Appliance Repair Laguna Niguel, CA | Same-Day",
      description: "Appliance repair in Laguna Niguel — hillside master-planned housing, attached communities, all major brands. Call (949) 749-0006.",
      keywords: ["appliance repair laguna niguel", "refrigerator repair laguna niguel", "washer repair laguna niguel ca"]
    }
  },
  {
    id: "aliso-viejo",
    slug: "aliso-viejo",
    name: "Aliso Viejo",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92656", "92698"],
    coordinates: { lat: 33.5767, lng: -117.7256 },
    description: "Aliso Viejo is the county's youngest city and it shows in the work — nineties and two-thousands housing, a great deal of it attached, with laundry in closets rather than garages. CoastPro covers the whole city.",
    landmarks: ["Aliso Viejo Town Center", "Soka University", "Aliso and Wood Canyons Wilderness Park"],
    neighboringCities: ["laguna-niguel", "lake-forest", "mission-viejo", "laguna-beach"],
    seo: {
      title: "Appliance Repair Aliso Viejo, CA | Same-Day",
      description: "Appliance repair in Aliso Viejo — newer attached housing, closet laundry and long vent runs, all major brands. Call (949) 749-0006.",
      keywords: ["appliance repair aliso viejo", "refrigerator repair aliso viejo ca", "washer repair aliso viejo"]
    }
  },
  {
    id: "san-clemente",
    slug: "san-clemente",
    name: "San Clemente",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92672", "92673", "92674"],
    coordinates: { lat: 33.4270, lng: -117.6120 },
    description: "San Clemente splits between older beach housing near the pier and the newer Talega and Forster Ranch developments inland. The two ends need different things, and CoastPro covers both.",
    landmarks: ["San Clemente Pier", "Talega", "Forster Ranch", "Casa Romantica"],
    neighboringCities: ["dana-point", "san-juan-capistrano", "laguna-niguel"],
    seo: {
      title: "Appliance Repair San Clemente, CA | Same-Day",
      description: "Appliance repair in San Clemente — coastal salt air near the pier, newer Talega housing inland, all major brands. Call (949) 749-0006.",
      keywords: ["appliance repair san clemente", "refrigerator repair san clemente ca", "washer repair talega"]
    }
  },
  {
    id: "villa-park",
    slug: "villa-park",
    name: "Villa Park",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92861", "92867"],
    coordinates: { lat: 33.8144, lng: -117.8131 },
    description: "The smallest city in Orange County and the one with the largest lots — half-acre minimums, custom homes and kitchens specified rather than delivered. CoastPro repairs the built-in and professional equipment those kitchens contain.",
    landmarks: ["Villa Park Town Center", "Santiago Oaks Regional Park", "Hidden Valley"],
    neighboringCities: ["orange", "anaheim", "tustin", "yorba-linda"],
    seo: {
      title: "Appliance Repair Villa Park, CA | Built-In Specialists",
      description: "Appliance repair in Villa Park — built-in refrigeration and professional ranges in custom kitchens. Sub-Zero, Wolf, Viking, Thermador. Call (949) 749-0006.",
      keywords: ["appliance repair villa park", "sub-zero repair villa park", "viking range repair villa park ca"]
    }
  },
  {
    id: "coto-de-caza",
    slug: "coto-de-caza",
    name: "Coto de Caza",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92679"],
    coordinates: { lat: 33.6086, lng: -117.5867 },
    description: "A gated, unincorporated community of large custom homes where the kitchens were specified alongside the house. CoastPro services the built-in refrigeration and professional cooking these homes were built around.",
    landmarks: ["Coto de Caza Golf & Racquet Club", "Coto Valley", "Trabuco Canyon"],
    neighboringCities: ["rancho-santa-margarita", "mission-viejo", "lake-forest"],
    seo: {
      title: "Appliance Repair Coto de Caza, CA | Built-In & Pro",
      description: "Appliance repair in Coto de Caza — Sub-Zero, Wolf, Viking and Thermador in custom kitchens, plus everyday machines. Call (949) 749-0006.",
      keywords: ["appliance repair coto de caza", "sub-zero repair coto de caza", "wolf range repair coto de caza"]
    }
  },
  {
    id: "ladera-ranch",
    slug: "ladera-ranch",
    name: "Ladera Ranch",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92694"],
    coordinates: { lat: 33.5511, lng: -117.6414 },
    description: "Ladera Ranch went in almost entirely between 1999 and 2010, which means a whole community's appliances are reaching the same age at the same time. CoastPro covers all of it.",
    landmarks: ["Ladera Ranch Town Green", "Founders Park", "Avendale Village"],
    neighboringCities: ["mission-viejo", "san-juan-capistrano", "rancho-santa-margarita"],
    seo: {
      title: "Appliance Repair Ladera Ranch, CA | Same-Day",
      description: "Appliance repair in Ladera Ranch — a community whose original appliances are ageing out together. All major brands. Call (949) 749-0006.",
      keywords: ["appliance repair ladera ranch", "refrigerator repair ladera ranch", "washer repair ladera ranch ca"]
    }
  },
  {
    id: "north-tustin",
    slug: "north-tustin",
    name: "North Tustin",
    county: "Orange County",
    state: "CA",
    zipCodes: ["92705"],
    coordinates: { lat: 33.7644, lng: -117.7967 },
    description: "Unincorporated hillside above Tustin — Cowan Heights, Lemon Heights and Panorama Heights, with large lots and custom homes across several decades of building. CoastPro covers all of it.",
    landmarks: ["Cowan Heights", "Lemon Heights", "Panorama Heights", "Peters Canyon Regional Park"],
    neighboringCities: ["tustin", "orange", "irvine", "villa-park"],
    seo: {
      title: "Appliance Repair North Tustin, CA | Cowan & Lemon Heights",
      description: "Appliance repair in North Tustin — Cowan Heights, Lemon Heights and Panorama Heights. Built-in refrigeration and everyday machines. Call (949) 749-0006.",
      keywords: ["appliance repair north tustin", "appliance repair cowan heights", "appliance repair lemon heights"]
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
