import { Service } from '@/types';

export const services: Service[] = [
  {
    id: "refrigerator",
    slug: "refrigerator",
    name: "Refrigerator Repair",
    shortDescription: "Expert refrigerator repair for all brands. Fix cooling issues, ice maker problems, and more.",
    fullDescription: "Our certified technicians specialize in refrigerator repair for all major brands including Samsung, LG, Whirlpool, GE, Sub-Zero, and more. We diagnose and fix cooling issues, ice maker problems, water leaks, strange noises, and temperature inconsistencies. With same-day service available, we'll get your refrigerator running properly and keep your food fresh.",
    icon: "Refrigerator",
    image: "/images/appliances/refrigerator.jpg",
    commonProblems: [
      {
        title: "Not Cooling Properly",
        description: "Refrigerator isn't maintaining proper temperature",
        symptoms: ["Food spoiling quickly", "Warm air inside", "Frost buildup in freezer"],
        solution: "Could be compressor, thermostat, or condenser coils issue. Our technicians will diagnose and repair."
      },
      {
        title: "Ice Maker Not Working",
        description: "Ice maker stopped producing ice or making strange noises",
        symptoms: ["No ice production", "Small or misshapen cubes", "Ice tastes bad", "Leaking water"],
        solution: "May need water inlet valve, ice maker assembly, or filter replacement."
      },
      {
        title: "Water Leaking",
        description: "Water pooling inside or under the refrigerator",
        symptoms: ["Puddles on floor", "Water inside fridge", "Moisture on walls"],
        solution: "Often caused by clogged drain line, faulty water inlet valve, or damaged door seal."
      },
      {
        title: "Strange Noises",
        description: "Unusual sounds coming from the refrigerator",
        symptoms: ["Buzzing", "Clicking", "Humming loudly", "Rattling"],
        solution: "Could indicate fan motor, compressor, or condenser issues."
      }
    ],
    features: [
      "Same-day service available",
      "All major brands serviced",
      "90-day warranty on repairs",
      "Upfront pricing - no surprises",
      "Experienced technicians"
    ],
    priceRange: { min: 150, max: 450, unit: "repair" },
    estimatedTime: "1-2 hours",
    warranty: "90-day parts & labor warranty",
    brands: ["Samsung", "LG", "Whirlpool", "GE", "Frigidaire", "KitchenAid", "Sub-Zero", "Viking", "Maytag", "Kenmore"],
    relatedServices: ["ice-maker", "freezer"],
    seo: {
      title: "Refrigerator Repair Orange County | Same-Day Service",
      description: "Professional refrigerator repair in Orange County. All brands serviced including Samsung, LG, Sub-Zero. Same-day appointments. 90-day warranty. Call (949) 449-1008.",
      keywords: ["refrigerator repair orange county", "fridge repair near me", "samsung refrigerator repair", "lg refrigerator repair irvine"]
    }
  },
  {
    id: "washer",
    slug: "washer",
    name: "Washer Repair",
    shortDescription: "Professional washing machine repair. Fix leaks, spin issues, and drainage problems fast.",
    fullDescription: "Don't let a broken washing machine pile up your laundry. Our expert technicians repair all washer types including top-load, front-load, and high-efficiency models. We fix leaks, spin cycle problems, drainage issues, and electrical failures for all major brands.",
    icon: "WashingMachine",
    image: "/images/appliances/washer.jpg",
    commonProblems: [
      {
        title: "Won't Spin",
        description: "Washer fills with water but won't spin or agitate",
        symptoms: ["Clothes still soaking wet", "Drum won't move", "Unusual noises during spin"],
        solution: "May be lid switch, motor coupling, or drive belt issue."
      },
      {
        title: "Water Leaking",
        description: "Water leaking from the washer during or after cycles",
        symptoms: ["Puddles around washer", "Water under machine", "Wet floor after wash"],
        solution: "Could be door seal, pump, hoses, or inlet valve."
      },
      {
        title: "Won't Drain",
        description: "Water remains in the drum after wash cycle",
        symptoms: ["Standing water in drum", "Error codes", "Clothes soaking wet"],
        solution: "Often pump, drain hose, or filter blockage."
      },
      {
        title: "Excessive Vibration",
        description: "Washer shakes or moves during operation",
        symptoms: ["Loud banging", "Walking across floor", "Unbalanced loads"],
        solution: "May need leveling, shock absorbers, or drum bearing replacement."
      }
    ],
    features: [
      "Top-load & front-load repair",
      "All major brands",
      "Same-day appointments",
      "90-day warranty",
      "Upfront pricing"
    ],
    priceRange: { min: 125, max: 350, unit: "repair" },
    estimatedTime: "1-2 hours",
    warranty: "90-day parts & labor warranty",
    brands: ["Samsung", "LG", "Whirlpool", "Maytag", "GE", "Kenmore", "Speed Queen", "Bosch", "Electrolux"],
    relatedServices: ["dryer"],
    seo: {
      title: "Washer Repair Orange County | All Brands Serviced",
      description: "Expert washing machine repair in Orange County. Front-load & top-load. Samsung, LG, Whirlpool & more. Same-day service. Call (949) 449-1008.",
      keywords: ["washer repair orange county", "washing machine repair near me", "samsung washer repair", "lg washer repair"]
    }
  },
  {
    id: "dryer",
    slug: "dryer",
    name: "Dryer Repair",
    shortDescription: "Fast dryer repair service. Fix no heat, tumbling issues, and more.",
    fullDescription: "Is your dryer not heating or taking forever to dry clothes? Our skilled technicians repair gas and electric dryers from all major manufacturers. We diagnose and fix heating elements, thermostats, motors, belts, and venting issues to get your laundry routine back on track.",
    icon: "Dryer",
    image: "/images/appliances/dryer.jpg",
    commonProblems: [
      {
        title: "No Heat",
        description: "Dryer runs but doesn't produce heat",
        symptoms: ["Clothes still wet after cycle", "Cold air only", "Takes multiple cycles"],
        solution: "Could be heating element, thermal fuse, gas igniter, or thermostat."
      },
      {
        title: "Won't Start",
        description: "Dryer doesn't turn on or respond to controls",
        symptoms: ["No power", "No response to buttons", "Door won't close properly"],
        solution: "May be door switch, start switch, thermal fuse, or power issue."
      },
      {
        title: "Makes Noise",
        description: "Unusual sounds during operation",
        symptoms: ["Squeaking", "Grinding", "Thumping", "Rattling"],
        solution: "Often drum support rollers, belt, or motor bearings."
      },
      {
        title: "Takes Too Long",
        description: "Clothes take multiple cycles to dry",
        symptoms: ["Extended dry times", "Clothes damp after cycle", "Dryer feels hot"],
        solution: "Usually clogged vent, lint buildup, or heating element issue."
      }
    ],
    features: [
      "Gas & electric dryer repair",
      "Vent cleaning available",
      "All major brands",
      "Same-day service",
      "90-day warranty"
    ],
    priceRange: { min: 125, max: 350, unit: "repair" },
    estimatedTime: "1-2 hours",
    warranty: "90-day parts & labor warranty",
    brands: ["Samsung", "LG", "Whirlpool", "Maytag", "GE", "Kenmore", "Speed Queen", "Bosch", "Electrolux"],
    relatedServices: ["washer"],
    seo: {
      title: "Dryer Repair Orange County | Gas & Electric",
      description: "Professional dryer repair in Orange County. Gas and electric dryers. Fix no heat, noise, won't start. Same-day service. Call (949) 449-1008.",
      keywords: ["dryer repair orange county", "dryer not heating", "gas dryer repair", "electric dryer repair near me"]
    }
  },
  {
    id: "dishwasher",
    slug: "dishwasher",
    name: "Dishwasher Repair",
    shortDescription: "Expert dishwasher repair. Fix cleaning issues, leaks, and drainage problems.",
    fullDescription: "Stop hand-washing dishes and let us fix your dishwasher. Our technicians repair all dishwasher brands and models, addressing issues like poor cleaning, leaks, drainage problems, and strange noises. We'll have your dishwasher sparkling clean dishes again in no time.",
    icon: "Dishwasher",
    image: "/images/appliances/dishwasher.jpg",
    commonProblems: [
      {
        title: "Not Cleaning Well",
        description: "Dishes come out dirty or with residue",
        symptoms: ["Food particles remain", "Cloudy glasses", "Spots on dishes"],
        solution: "May be spray arm, water inlet valve, or detergent dispenser issue."
      },
      {
        title: "Won't Drain",
        description: "Standing water in the bottom after cycle",
        symptoms: ["Water pooling", "Bad odor", "Error codes"],
        solution: "Could be drain pump, hose, or garbage disposal connection."
      },
      {
        title: "Leaking Water",
        description: "Water on floor around or under dishwasher",
        symptoms: ["Puddles", "Water damage to cabinets", "Wet floor"],
        solution: "Often door gasket, pump seal, or water inlet valve."
      },
      {
        title: "Won't Start",
        description: "Dishwasher doesn't respond or start cycle",
        symptoms: ["No lights", "Buttons don't work", "Door won't latch"],
        solution: "May be door latch, control board, or power issue."
      }
    ],
    features: [
      "All brands & models",
      "Built-in & portable",
      "Same-day service",
      "90-day warranty",
      "Clean-up included"
    ],
    priceRange: { min: 125, max: 300, unit: "repair" },
    estimatedTime: "1-1.5 hours",
    warranty: "90-day parts & labor warranty",
    brands: ["Bosch", "KitchenAid", "Whirlpool", "Samsung", "LG", "GE", "Miele", "Frigidaire", "Maytag"],
    relatedServices: ["garbage-disposal"],
    seo: {
      title: "Dishwasher Repair Orange County | All Brands",
      description: "Expert dishwasher repair in Orange County. Bosch, KitchenAid, Samsung & more. Fix leaks, drainage, cleaning issues. Call (949) 449-1008.",
      keywords: ["dishwasher repair orange county", "bosch dishwasher repair", "dishwasher not draining", "dishwasher repair near me"]
    }
  },
  {
    id: "oven-range",
    slug: "oven-range",
    name: "Oven & Range Repair",
    shortDescription: "Professional oven and stove repair. Fix heating, ignition, and temperature issues.",
    fullDescription: "Whether your oven won't heat, burners won't ignite, or temperature is inconsistent, our certified technicians can fix it. We repair gas and electric ovens, ranges, cooktops, and stoves from all major brands. Get back to cooking delicious meals with our expert repair service.",
    icon: "Oven",
    image: "/images/appliances/oven.jpg",
    commonProblems: [
      {
        title: "Oven Won't Heat",
        description: "Oven doesn't reach temperature or heat at all",
        symptoms: ["Food undercooked", "No heat", "Uneven cooking"],
        solution: "Could be heating element, igniter, thermostat, or control board."
      },
      {
        title: "Burners Won't Ignite",
        description: "Gas burners click but don't light",
        symptoms: ["Clicking sound", "No flame", "Weak flame"],
        solution: "Often igniter, spark module, or clogged burner ports."
      },
      {
        title: "Temperature Issues",
        description: "Oven too hot, too cold, or fluctuates",
        symptoms: ["Burnt food", "Undercooked food", "Inconsistent results"],
        solution: "May be thermostat, sensor, or calibration issue."
      },
      {
        title: "Self-Clean Problems",
        description: "Self-cleaning cycle doesn't work or door locks",
        symptoms: ["Door stuck", "Cycle won't complete", "Error codes"],
        solution: "Could be door latch, thermal fuse, or control board."
      }
    ],
    features: [
      "Gas & electric repair",
      "All brands serviced",
      "Same-day appointments",
      "90-day warranty",
      "Safety inspection included"
    ],
    priceRange: { min: 150, max: 400, unit: "repair" },
    estimatedTime: "1-2 hours",
    warranty: "90-day parts & labor warranty",
    brands: ["GE", "Whirlpool", "Samsung", "LG", "KitchenAid", "Frigidaire", "Viking", "Wolf", "Thermador"],
    relatedServices: ["microwave"],
    seo: {
      title: "Oven & Range Repair Orange County | Gas & Electric",
      description: "Expert oven and stove repair in Orange County. Gas & electric. Fix heating, ignition, temperature issues. Same-day service. Call (949) 449-1008.",
      keywords: ["oven repair orange county", "stove repair near me", "gas range repair", "electric oven repair"]
    }
  },
  {
    id: "microwave",
    slug: "microwave",
    name: "Microwave Repair",
    shortDescription: "Quick microwave repair. Fix heating issues, turntable problems, and more.",
    fullDescription: "Is your microwave not heating, making strange noises, or displaying error codes? Our technicians repair built-in and countertop microwaves from all major brands. We'll diagnose the problem and have your microwave working like new.",
    icon: "Microwave",
    image: "/images/appliances/microwave.jpg",
    commonProblems: [
      {
        title: "Not Heating",
        description: "Microwave runs but food stays cold",
        symptoms: ["Food not warming", "Runs but no heat", "Uneven heating"],
        solution: "Usually magnetron, diode, or capacitor issue."
      },
      {
        title: "Turntable Not Spinning",
        description: "Turntable doesn't rotate during operation",
        symptoms: ["Plate stuck", "Uneven cooking", "Motor noise"],
        solution: "Could be turntable motor, coupler, or roller guide."
      },
      {
        title: "Sparking Inside",
        description: "Sparks or arcing visible during operation",
        symptoms: ["Visible sparks", "Burning smell", "Damaged interior"],
        solution: "May be waveguide cover, stirrer, or damaged paint."
      },
      {
        title: "Buttons Don't Work",
        description: "Control panel unresponsive or erratic",
        symptoms: ["Keys not responding", "Random beeping", "Display issues"],
        solution: "Often control panel, touchpad, or control board."
      }
    ],
    features: [
      "Built-in & countertop",
      "All major brands",
      "Quick diagnostics",
      "90-day warranty",
      "Over-the-range models"
    ],
    priceRange: { min: 100, max: 250, unit: "repair" },
    estimatedTime: "45 min - 1 hour",
    warranty: "90-day parts & labor warranty",
    brands: ["Samsung", "LG", "Panasonic", "GE", "Whirlpool", "Sharp", "KitchenAid", "Frigidaire"],
    relatedServices: ["oven-range"],
    seo: {
      title: "Microwave Repair Orange County | Built-In & Countertop",
      description: "Professional microwave repair in Orange County. Samsung, LG, GE & more. Fix heating, turntable, display issues. Call (949) 449-1008.",
      keywords: ["microwave repair orange county", "microwave not heating", "built-in microwave repair", "over the range microwave repair"]
    }
  },
  {
    id: "garbage-disposal",
    slug: "garbage-disposal",
    name: "Garbage Disposal Repair",
    shortDescription: "Fast garbage disposal repair and installation. Fix jams, leaks, and motor issues.",
    fullDescription: "Garbage disposal jammed, leaking, or won't turn on? Our technicians quickly diagnose and repair all garbage disposal problems. We also offer new installation if your unit needs replacement. Get your kitchen sink back in working order fast.",
    icon: "Cog",
    image: "/images/appliances/garbage-disposal.jpg",
    commonProblems: [
      {
        title: "Won't Turn On",
        description: "Disposal doesn't respond when switched on",
        symptoms: ["No sound", "No humming", "Complete silence"],
        solution: "Could be reset button, switch, or motor failure."
      },
      {
        title: "Jammed/Stuck",
        description: "Motor hums but blades don't spin",
        symptoms: ["Humming sound", "Blades stuck", "Won't grind"],
        solution: "Usually object stuck in blades or motor issue."
      },
      {
        title: "Leaking",
        description: "Water dripping from disposal unit",
        symptoms: ["Water under sink", "Puddles", "Wet cabinet"],
        solution: "May be flange, seals, or connections."
      },
      {
        title: "Bad Odor",
        description: "Foul smell coming from disposal",
        symptoms: ["Persistent odor", "Smell when running", "Bacteria buildup"],
        solution: "Often requires deep cleaning or component replacement."
      }
    ],
    features: [
      "Repair & installation",
      "All brands",
      "Same-day service",
      "90-day warranty",
      "Plumbing connections"
    ],
    priceRange: { min: 100, max: 250, unit: "repair" },
    estimatedTime: "30 min - 1 hour",
    warranty: "90-day parts & labor warranty",
    brands: ["InSinkErator", "Waste King", "Moen", "GE", "KitchenAid", "Whirlpool"],
    relatedServices: ["dishwasher"],
    seo: {
      title: "Garbage Disposal Repair Orange County | Fast Service",
      description: "Expert garbage disposal repair in Orange County. Fix jams, leaks, motor issues. Installation available. Same-day service. Call (949) 449-1008.",
      keywords: ["garbage disposal repair orange county", "disposal not working", "insinkerator repair", "garbage disposal installation"]
    }
  },
  {
    id: "ice-maker",
    slug: "ice-maker",
    name: "Ice Maker Repair",
    shortDescription: "Professional ice maker repair. Fix production issues, leaks, and quality problems.",
    fullDescription: "Whether it's a built-in ice maker, standalone unit, or commercial ice machine, our technicians can repair it. We fix low ice production, poor ice quality, leaks, and mechanical failures to keep your ice flowing.",
    icon: "Snowflake",
    image: "/images/appliances/ice-maker.jpg",
    commonProblems: [
      {
        title: "No Ice Production",
        description: "Ice maker stopped making ice completely",
        symptoms: ["Empty bin", "No ice forming", "System not cycling"],
        solution: "Could be water inlet valve, thermostat, or motor."
      },
      {
        title: "Small or Hollow Ice",
        description: "Ice cubes are undersized or hollow",
        symptoms: ["Thin ice", "Hollow cubes", "Melting quickly"],
        solution: "May be water pressure, inlet valve, or temperature issue."
      },
      {
        title: "Ice Tastes Bad",
        description: "Ice has unpleasant taste or odor",
        symptoms: ["Foul taste", "Smells bad", "Cloudy ice"],
        solution: "Often water filter, supply line, or cleaning needed."
      },
      {
        title: "Leaking Water",
        description: "Water leaking from ice maker",
        symptoms: ["Puddles", "Ice buildup", "Wet freezer"],
        solution: "Could be inlet valve, water line, or fill tube."
      }
    ],
    features: [
      "Built-in & standalone",
      "Commercial units",
      "All brands",
      "90-day warranty",
      "Water line service"
    ],
    priceRange: { min: 125, max: 350, unit: "repair" },
    estimatedTime: "1-1.5 hours",
    warranty: "90-day parts & labor warranty",
    brands: ["Sub-Zero", "Scotsman", "GE", "Whirlpool", "Samsung", "LG", "KitchenAid", "U-Line"],
    relatedServices: ["refrigerator"],
    seo: {
      title: "Ice Maker Repair Orange County | All Types",
      description: "Professional ice maker repair in Orange County. Built-in, standalone, commercial. Fix production, quality issues. Call (949) 449-1008.",
      keywords: ["ice maker repair orange county", "ice machine repair", "sub-zero ice maker repair", "commercial ice maker repair"]
    }
  }
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find(service => service.slug === slug);
}

export function getRelatedServices(currentSlug: string): Service[] {
  const current = getServiceBySlug(currentSlug);
  if (!current) return [];
  return services.filter(s => current.relatedServices.includes(s.slug));
}
