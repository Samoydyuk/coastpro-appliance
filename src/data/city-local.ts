/**
 * The part of a city page that is actually about the city.
 *
 * The city pages were, measurably, the same page fifteen times: 78–82% of the
 * text on `/service-areas/brea` also appeared on `/service-areas/irvine`, and
 * the difference was almost entirely the substituted name. That is the shape
 * Google calls a doorway page, and it is why none of the fifteen ranked.
 *
 * What follows is written per city and is meant to be true of that city and
 * awkward to say about its neighbour: when the housing was built, what that
 * implies about the machines inside it, what the water or the air does to them,
 * and which brands a technician actually opens there. The service pages already
 * work this way — they share only 26–29% — so the standard is one the site has
 * met before.
 *
 * Kept out of `service-areas.ts` so the routing data stays readable, and so
 * this file can be extended a city at a time.
 *
 * On honesty: these are the patterns a technician sees, stated as such. No
 * invented statistics, no counts of jobs we cannot show, no claim that a
 * neighbourhood's appliances fail at some rate. Local colour is not a licence
 * to make things up — a city page that overstates is worth less than the
 * boilerplate it replaced, because it is wrong rather than merely thin.
 */

export interface CityLocal {
  /** Housing stock and its consequences. Two or three sentences. */
  housing: string;
  /** What the local water, air or build era does to appliances here. */
  conditions: string;
  /** What a technician typically opens in this city. */
  brands: string[];
  /** Named neighbourhoods, beyond the landmark badges. */
  neighborhoods: string[];
  /** Honest drive time from the Irvine base, in traffic. */
  driveTime: string;
  /** City-specific questions. Feeds the on-page accordion and FAQPage schema. */
  faq: Array<{ q: string; a: string }>;
}

export const cityLocal: Record<string, CityLocal> = {
  irvine: {
    housing:
      'Irvine is a master-planned city, and that shows up in the work. The villages went in on a schedule — Woodbridge and University Park in the seventies and eighties, Westpark and Oak Creek in the nineties, Portola Springs and the Great Park neighborhoods in the last fifteen years — so a technician can usually guess the appliance generation from the address before knocking.',
    conditions:
      'A great deal of Irvine housing is attached: condos, townhomes and carriage units with the laundry pair stacked in a hallway closet rather than standing in a garage. That closet is the recurring theme. Vents run long and turn twice before they reach an exterior wall, drain hoses sit at awkward heights, and a machine that would be a twenty-minute job in a detached home becomes an hour because it has to come out before it can be opened.',
    brands: ['Whirlpool', 'GE', 'LG', 'Samsung', 'Bosch', 'KitchenAid', 'Sub-Zero'],
    neighborhoods: [
      'Woodbridge',
      'Northwood',
      'Turtle Rock',
      'University Park',
      'Westpark',
      'Quail Hill',
      'Oak Creek',
      'Cypress Village',
      'Portola Springs',
      'Great Park',
      'Orchard Hills',
      'Stonegate',
    ],
    driveTime: 'We are based in Irvine, so most of the city is inside twenty minutes.',
    faq: [
      {
        q: 'Do you work in Irvine condos and attached homes with closet laundry?',
        a: 'Yes, and it is most of what we do here. A stacked pair in a hallway closet has to be drawn out before the back panel is reachable, so we allow for it in the appointment rather than discovering it on site. Tell us it is a closet install when you book and the window accounts for it.',
      },
      {
        q: 'Does my Irvine HOA need to approve an appliance repair?',
        a: 'For a repair inside the unit, generally no — associations regulate alterations, not service calls. It matters when a repair turns into a replacement that changes a vent, a water line or an exterior penetration. If we hit that point we say so before doing anything, so you can check with the association first.',
      },
      {
        q: 'How quickly can you reach Portola Springs or the Great Park neighborhoods?',
        a: 'Same day is realistic across all of Irvine, including the newer eastern villages. Those homes are the youngest stock in the city, so faults there tend to be control boards, sensors and water-line fittings rather than worn mechanical parts.',
      },
    ],
  },

  'newport-beach': {
    housing:
      'Newport Beach runs from Balboa Island cottages on lots barely wider than the house to Newport Coast estates with two dishwashers and a wine column. The kitchens differ as much as the buildings: a galley on the Peninsula where the refrigerator cannot be pulled forward without moving the island, and a Newport Coast pantry where three built-ins sit in a run.',
    conditions:
      'This is the coast, and salt air is the constant. It reaches condenser coils and control boards, and on units within a few blocks of the water it shows up as corrosion on terminals and connectors long before anything mechanical wears out. Built-in refrigeration suffers most, because a coil that cannot breathe holds the salt against the fins.',
    brands: ['Sub-Zero', 'Wolf', 'Viking', 'Thermador', 'Miele', 'Bosch', 'Fisher & Paykel'],
    neighborhoods: [
      'Corona del Mar',
      'Balboa Island',
      'Balboa Peninsula',
      'Newport Coast',
      'Newport Heights',
      'Eastbluff',
      'Big Canyon',
      'Dover Shores',
      'Lido Isle',
      'Back Bay',
    ],
    driveTime: 'Fifteen to twenty-five minutes from our Irvine base, depending on the bridge.',
    faq: [
      {
        q: 'Do you service Sub-Zero, Wolf and Viking in Newport Beach?',
        a: 'Yes — built-in refrigeration and professional ranges are a large share of the work here. These are not the units to guess at: a Sub-Zero that has stopped making ice can be a dirty condenser or a sealed-system fault, and the difference is the difference between a service call and a major repair. We diagnose before quoting, and you see the finding.',
      },
      {
        q: 'Why do appliances near the water seem to fail differently?',
        a: 'Salt air. It works on the electrical side first — connectors, terminals, board contacts — so units close to the beach often present as intermittent electronic faults while the mechanics are still sound. Keeping condenser coils clear helps more here than it does inland, because a blocked coil holds salt-laden air against the fins.',
      },
      {
        q: 'Can you get a built-in refrigerator out on Balboa Island or the Peninsula?',
        a: 'Usually, but it is worth a conversation first. Some of these kitchens were built around the appliance, and access — not the fault — decides the length of the visit. A photo of the run when you book tells us what we are walking into and whether we need a second technician.',
      },
    ],
  },

  'costa-mesa': {
    housing:
      'Costa Mesa is two cities in appliance terms. Eastside and the Westside are largely fifties and sixties tract homes, many with original kitchen footprints and laundry in the garage. South Coast Metro is newer condos and apartments where the machines are younger, smaller and installed in tighter spaces.',
    conditions:
      'The older stock is where the interesting problems are. Kitchens built before dishwashers were standard often gained one later, and the retrofit is what fails — a drain line teed in without an air gap, a supply run in the wrong place, a circuit shared with too much else. Garages built for a wringer washer now hold a front-loader on a long vent run.',
    brands: ['Whirlpool', 'Maytag', 'GE', 'Kenmore', 'LG', 'Samsung', 'Bosch'],
    neighborhoods: [
      'Mesa Verde',
      'Eastside Costa Mesa',
      'Westside Costa Mesa',
      'South Coast Metro',
      'College Park',
      'Halecrest',
      'Mesa del Mar',
      'Freedom Homes',
    ],
    driveTime: 'Fifteen to twenty minutes from Irvine.',
    faq: [
      {
        q: 'My Costa Mesa house is from the sixties — is the wiring a problem for a new appliance?',
        a: 'Sometimes, and it is worth knowing before you buy rather than after. Kitchens of that era were not wired for a modern induction range or a heat-pump dryer, and a machine that trips a breaker on a heavy cycle is often telling you about the circuit rather than about itself. We say plainly when the fault is the supply, because that is an electrician\'s job and not ours.',
      },
      {
        q: 'The dishwasher is leaking onto the floor. Is that the machine?',
        a: 'Not always. In older Costa Mesa kitchens a dishwasher added long after the house was built is frequently drained through a fitting that was never right, and the water on the floor is coming from the connection rather than the appliance. We check the drain path before condemning anything inside the door.',
      },
      {
        q: 'Do you cover South Coast Metro apartments and condos?',
        a: 'Yes. Those installs are usually stacked or under-counter with limited clearance, so we plan for the unit to come out. If your building requires notice for a contractor or a service elevator, tell us when booking and we will work to the window that gets us in.',
      },
    ],
  },

  'huntington-beach': {
    housing:
      'Huntington Beach spreads from the waterfront homes of Huntington Harbour through downtown bungalows to the larger tracts inland at Seacliff, Bolsa Chica and Edwards Hill. Garage laundry is close to universal, which shapes most of the washer and dryer work in the city.',
    conditions:
      'Two things define the work here. Near the water, salt air corrodes electrical connections the same way it does in Newport. Everywhere, the garage laundry means dryer vents that run the length of a wall and turn before they exit — and a long vent packs with lint, which is the single most common reason a Huntington Beach dryer stops drying while the drum still turns and the heat still comes on.',
    brands: ['Whirlpool', 'LG', 'Samsung', 'GE', 'Maytag', 'Bosch', 'KitchenAid'],
    neighborhoods: [
      'Huntington Harbour',
      'Downtown Huntington Beach',
      'Seacliff',
      'Bolsa Chica',
      'Edwards Hill',
      'Goldenwest',
      'Oldtown',
      'Pacific City',
      'Meredith Gardens',
    ],
    driveTime: 'Twenty-five to thirty-five minutes from Irvine.',
    faq: [
      {
        q: 'My dryer runs but clothes stay damp. What is it, usually?',
        a: 'In this city, most often the vent. A long garage run with two elbows fills with lint, the moist air cannot leave, and the machine keeps cycling against its own exhaust. The dryer is fine; the duct is full. We check the vent before replacing a heating element, because replacing the element first fixes nothing and you pay for the part.',
      },
      {
        q: 'Do you serve Huntington Harbour?',
        a: 'Yes, including the island streets. Waterfront homes here get the same coastal pattern as Newport — corrosion on connections and control boards ahead of mechanical wear — so an intermittent fault on a unit near the water is worth looking at electrically first.',
      },
      {
        q: 'How often should a dryer vent be cleaned here?',
        a: 'With a long garage run, about once a year is sensible, and sooner if drying times have crept up. It is a fire question as well as a performance one — packed lint against a heat source is exactly the condition that starts one. We clean vents as a job in its own right, not only as part of a repair.',
      },
    ],
  },

  anaheim: {
    housing:
      'Anaheim covers more appliance generations than any other city we serve. West Anaheim and the flatlands are largely postwar tracts from the fifties and sixties, many still on original kitchen layouts. Anaheim Hills is newer and larger, mostly eighties onward. The Platinum Triangle and the Colony add apartments and historic homes to the same service area.',
    conditions:
      'North Orange County water is noticeably harder than the coast, and hard water is what a technician finds inside the machines here: scale on dishwasher heating elements, restricted water inlet valves, ice makers that slow down and then stop. It also means a water filter and a valve screen are worth checking before anything is condemned.',
    brands: ['Whirlpool', 'GE', 'Frigidaire', 'Samsung', 'LG', 'Maytag', 'Kenmore'],
    neighborhoods: [
      'Anaheim Hills',
      'West Anaheim',
      'East Anaheim',
      'Platinum Triangle',
      'Anaheim Colony Historic District',
      'Sycamore Canyon',
      'Peralta Hills',
    ],
    driveTime: 'Thirty to forty minutes from Irvine, traffic depending.',
    faq: [
      {
        q: 'Does hard water really affect appliances in Anaheim?',
        a: 'It shows up constantly. Scale builds on a dishwasher heating element until the machine will not dry, it narrows the inlet valve on a washer so fills take longer and longer, and it is the usual reason an ice maker produces less and then nothing. Descaling and a valve screen clean often restores a machine that looked like it needed a part.',
      },
      {
        q: 'Do you handle rental properties and multi-unit buildings in Anaheim?',
        a: 'Yes. We can coordinate with a tenant directly for access and report the finding to the owner or manager, and we photograph the work either way, which settles most questions about what was done and why.',
      },
      {
        q: 'My kitchen is original to a 1960s Anaheim house. Can you still get parts?',
        a: 'Often, yes — for major brands of that era parts availability is better than people expect. Where a part is genuinely gone we tell you straight, along with what a replacement would cost, rather than fitting something approximate and calling it repaired.',
      },
    ],
  },

  'santa-ana': {
    housing:
      'Santa Ana has some of the oldest housing stock in the county alongside some of its densest. Floral Park and French Park are pre-war homes with kitchens that have been remodelled once or twice; much of the rest is mid-century tract housing and multi-family, where machines run more cycles per week than a single-family home puts on them in a month.',
    conditions:
      'High-cycle use is the pattern here. Bearings, belts, pumps and door latches wear out on schedule rather than failing oddly, which makes diagnosis quicker and repair the sensible option far more often than replacement. In the older houses, the constraint is usually the kitchen itself — a modern machine put into a 1930s footprint with the plumbing improvised around it.',
    brands: ['Whirlpool', 'Kenmore', 'GE', 'Frigidaire', 'Maytag', 'LG', 'Samsung'],
    neighborhoods: [
      'Floral Park',
      'French Park',
      'Park Santiago',
      'Willard',
      'Downtown Santa Ana',
      'Washington Square',
      'Morrison Park',
      'South Coast Metro',
    ],
    driveTime: 'Fifteen to twenty-five minutes from Irvine.',
    faq: [
      {
        q: 'Is it worth repairing an older machine, or should I replace it?',
        a: 'We give you the number and let you decide. The honest rule: if the repair costs more than about half of a comparable new unit and the machine is past its usual life, replacement is the better spend, and we will say so even though it means we do not do the job. Plenty of well-built older machines are worth a pump or a belt.',
      },
      {
        q: 'Do you work with landlords and property managers in Santa Ana?',
        a: 'Regularly. We can arrange access with the tenant, document the fault and the fix with photographs, and invoice the owner or manager. For buildings with several units we can group calls into one visit where that suits everyone.',
      },
      {
        q: 'The washer in our building runs constantly. Does that change the repair?',
        a: 'It changes what fails. Machines under heavy use wear their moving parts — pump, bearings, latch, belt — rather than developing the electronic faults you see on a lightly used unit. That is generally good news: worn parts are cheaper and faster to replace than a control board.',
      },
    ],
  },

  orange: {
    housing:
      'Old Towne Orange is one of the largest historic districts in California, and the kitchens reflect it — early-century homes with small footprints, later additions, and appliances fitted into openings that were never designed for them. East of there, Santiago Hills and the newer tracts are conventional modern housing, and Orange Park Acres is larger lots and semi-rural properties.',
    conditions:
      'In Old Towne the recurring problem is fit and supply rather than the appliance. A full-depth refrigerator in a cased opening built for a much smaller box cannot breathe, and a unit that cannot shed heat at the coil runs long, ices up and eventually stops cooling properly. Electrical service in the oldest houses is often the real limit on what can be installed.',
    brands: ['Whirlpool', 'GE', 'KitchenAid', 'Bosch', 'Maytag', 'Samsung', 'Viking'],
    neighborhoods: [
      'Old Towne Orange',
      'Orange Park Acres',
      'Santiago Hills',
      'El Modena',
      'Villa Park border',
      'Serrano Heights',
    ],
    driveTime: 'Twenty-five to thirty-five minutes from Irvine.',
    faq: [
      {
        q: 'My refrigerator sits in a tight built-in opening in an Old Towne house. Is that the problem?',
        a: 'It is worth ruling in or out first. A refrigerator needs clearance at the coil to shed heat; put a modern full-depth unit into an opening sized for a 1950s box and it runs almost continuously, frosts the evaporator and then stops cooling well. That presents exactly like a failing compressor and is not one.',
      },
      {
        q: 'Do you service Orange Park Acres and the properties off the main grid?',
        a: 'Yes. Larger lots sometimes mean a second refrigerator or freezer in a garage or outbuilding, and those are worth mentioning when you book — an unconditioned space changes how a unit behaves, particularly in summer.',
      },
      {
        q: 'Can a historic-district home take a modern appliance at all?',
        a: 'Usually, with the caveat that the opening and the circuit decide it, not the model number. We will tell you what the space and supply will actually carry before you buy, which is cheaper than finding out on delivery day.',
      },
    ],
  },

  tustin: {
    housing:
      'Tustin holds three distinct eras side by side. Old Town is early-century and mid-century homes on the original street grid. Tustin Ranch is eighties and nineties tract housing, now at the age where original kitchen appliances are reaching the end of their service life. Tustin Legacy, built on the former air station, is new construction with current machines still under manufacturer warranty.',
    conditions:
      'Tustin Ranch is where most of the volume sits, and it sits there for a reason: a house built in 1990 is on its second set of appliances, and second-generation machines from the 2000s and 2010s are the ones now failing on control boards, pumps and door latches. Old Town brings the retrofit problems common to older kitchens; Legacy brings warranty questions more than faults.',
    brands: ['Whirlpool', 'KitchenAid', 'LG', 'Samsung', 'Bosch', 'GE', 'Maytag'],
    neighborhoods: [
      'Old Town Tustin',
      'Tustin Ranch',
      'Tustin Legacy',
      'Peppertree',
      'Laurelwood',
      'Columbus Square',
      'Columbus Grove',
    ],
    driveTime: 'Ten to fifteen minutes from Irvine — one of the closest cities we cover.',
    faq: [
      {
        q: 'My Tustin Legacy home is nearly new. Should I call you or the manufacturer?',
        a: 'If the machine is inside its manufacturer warranty, call the manufacturer first — a warranty repair should not cost you anything, and we will tell you so rather than take the job. We are the right call once that has run out, or when the builder warranty has lapsed and the manufacturer will not cover it.',
      },
      {
        q: 'Everything in my Tustin Ranch kitchen is failing at once. Why?',
        a: 'Because it was all installed at once. Appliances fitted together in a tract build tend to reach the end of their life together, so a run of unrelated faults across a kitchen is usually age rather than coincidence. It is worth deciding deliberately what to repair and what to replace instead of doing it one emergency at a time.',
      },
      {
        q: 'How fast can you get to Tustin?',
        a: 'Faster than almost anywhere. We are based in Irvine, minutes away, so same-day appointments in Tustin are usually straightforward even late in the day.',
      },
    ],
  },

  'laguna-beach': {
    housing:
      'Laguna Beach is hillside, and that is the first fact of any job here. Cottages from the twenties and thirties sit on narrow lots reached by narrow streets, often with stairs between the parking and the door. Alongside them are heavily remodelled homes and the gated communities at Emerald Bay and Three Arch Bay, where the kitchens are as high-end as any in the county.',
    conditions:
      'Access shapes the appointment as much as the fault does. A refrigerator that has to come down an exterior staircase is a different job from the same repair on a flat lot, and it is better planned than discovered. On top of that, the whole city gets the coastal pattern — salt air working on connectors and boards before anything mechanical gives out.',
    brands: ['Sub-Zero', 'Wolf', 'Thermador', 'Miele', 'Bosch', 'Viking', 'KitchenAid'],
    neighborhoods: [
      'Downtown Village',
      'North Laguna',
      'South Laguna',
      'Top of the World',
      'Emerald Bay',
      'Three Arch Bay',
      'Arch Beach Heights',
      'Bluebird Canyon',
    ],
    driveTime: 'Twenty-five to thirty-five minutes from Irvine over the canyon.',
    faq: [
      {
        q: 'My house is up a stairway with no direct access. Can you still work on a built-in?',
        a: 'Yes, but tell us when you book. Access decides how long the visit takes and occasionally whether a second technician is needed, and knowing in advance means we arrive able to do the job rather than to reschedule it.',
      },
      {
        q: 'Do you repair high-end brands in Laguna?',
        a: 'Yes — Sub-Zero, Wolf, Thermador and Miele are routine here. These units reward proper diagnosis: the same symptom can be a cheap sensor or a sealed-system fault, and the only way to know which is to test rather than to assume from the fault code.',
      },
      {
        q: 'Does the ocean air really shorten appliance life?',
        a: 'It changes how they fail more than how long they last. Electrical connections corrode first, so coastal units tend to develop intermittent, electronic-looking faults while the mechanical side is still sound. Keeping condenser coils clean matters more here than a few miles inland.',
      },
    ],
  },

  'mission-viejo': {
    housing:
      'Mission Viejo is one of the county\'s original master-planned communities, largely built out from the mid-sixties through the eighties around Lake Mission Viejo. That gives it a consistent housing stock at a consistent age, including established retirement communities at Casta del Sol and Palmia where kitchens are often still close to original.',
    conditions:
      'Age is the theme. A great many kitchens here are on their second generation of appliances, and second-generation machines — roughly 2005 to 2015 — are the ones now failing on electronic controls rather than mechanical wear. In the 55-plus communities we more often find well-maintained original machines where a single part restores a unit that has years left in it.',
    brands: ['Whirlpool', 'GE', 'Kenmore', 'Maytag', 'KitchenAid', 'LG', 'Bosch'],
    neighborhoods: [
      'Lake Mission Viejo',
      'Casta del Sol',
      'Palmia',
      'Mission Viejo North',
      'Alicia',
      'Madrid Fore',
      'Deane Homes',
    ],
    driveTime: 'Twenty to thirty minutes from Irvine.',
    faq: [
      {
        q: 'My appliance is fifteen years old. Is a part still findable?',
        a: 'For major brands, usually yes, and a well-built machine of that age is frequently worth the part. Where a component has genuinely been discontinued we say so rather than fitting an approximation, and we give you the replacement figure so the choice is yours to make on real numbers.',
      },
      {
        q: 'Do you serve Casta del Sol, Palmia and the other gated communities?',
        a: 'Yes. Gate access is simply worth arranging in advance — leave our name at the gate or send the code when you book, and the appointment runs to time instead of being spent at the entrance.',
      },
      {
        q: 'What is the most common repair you see in Mission Viejo?',
        a: 'Control-board and sensor faults on machines from the mid-2000s to mid-2010s, which is the generation most kitchens here are running. Mechanically these units are often still sound, so the repair is usually targeted rather than major.',
      },
    ],
  },

  'lake-forest': {
    housing:
      'Lake Forest pairs its seventies and eighties core — including the two private lakes the city is named for — with substantially newer development at Foothill Ranch, Portola Hills and Baker Ranch. The result is a city where the appliance age gap between two neighbourhoods a few minutes apart is close to thirty years.',
    conditions:
      'That gap decides the work. The older neighbourhoods bring the failures of long-serving machines and of kitchens remodelled around them; the newer ones bring electronic faults, smart-connected units and water-line fittings on refrigerators that were plumbed at build. Diagnosis in Lake Forest starts with knowing which of those two cities you are in.',
    brands: ['Whirlpool', 'LG', 'Samsung', 'GE', 'Bosch', 'KitchenAid', 'Maytag'],
    neighborhoods: [
      'Foothill Ranch',
      'Portola Hills',
      'Baker Ranch',
      'Lake Forest Keys',
      'Serrano Park',
      'Bridgepark',
      'Rancho Serrano',
    ],
    driveTime: 'Fifteen to twenty-five minutes from Irvine.',
    faq: [
      {
        q: 'My new refrigerator is leaking underneath. Is it faulty?',
        a: 'Often it is the water line rather than the appliance, particularly in newer Baker Ranch and Portola Hills homes where the supply was fitted at build and has never been disturbed. We trace the water to its source before opening the unit, because the fix is frequently a fitting and not a part.',
      },
      {
        q: 'Do you work on smart and connected appliances?',
        a: 'Yes. A connected machine reports a fault code, which is a starting point and not a diagnosis — the same code covers several causes, and we test to find which one before quoting. That is the difference between fixing it once and replacing parts until it stops.',
      },
      {
        q: 'How quickly can you reach Foothill Ranch or Portola Hills?',
        a: 'Same day is normally realistic. Those are toward the eastern edge of the city but still an easy run from Irvine, so they get the same appointment windows as the rest of Lake Forest.',
      },
    ],
  },

  fullerton: {
    housing:
      'Fullerton is one of north county\'s older established cities, with substantial pre-war and mid-century housing in Raymond Hills, Sunny Hills and around downtown, plus newer development at Amerige Heights. The university adds a large rental population, and rental kitchens are a distinct kind of work.',
    conditions:
      'Two patterns run through the city. North county water is hard, so scale on heating elements, restricted inlet valves and failing ice makers are routine. And the older housing brings the usual retrofit faults — dishwashers added to kitchens that predate them, laundry moved into spaces built for something smaller, circuits carrying more than they were run for.',
    brands: ['Whirlpool', 'GE', 'Kenmore', 'Maytag', 'Frigidaire', 'LG', 'Bosch'],
    neighborhoods: [
      'Sunny Hills',
      'Raymond Hills',
      'Downtown Fullerton',
      'Amerige Heights',
      'Golden Hill',
      'Fullerton Creek',
      'Coyote Hills',
    ],
    driveTime: 'Thirty-five to forty-five minutes from Irvine.',
    faq: [
      {
        q: 'Why does my dishwasher leave everything wet and cloudy?',
        a: 'In north county that combination usually points at scale. Hard water deposits on the heating element until it can no longer dry a load, and the same mineral leaves the film on the glassware. Descaling and clearing the inlet screen often restores a machine that looked like it needed replacing.',
      },
      {
        q: 'Do you service rental properties near Cal State Fullerton?',
        a: 'Yes, and we can work directly with a tenant for access while reporting to the owner or manager. Everything is photographed, which tends to settle questions about condition and cause without a second visit.',
      },
      {
        q: 'Is a water softener worth it for appliance life?',
        a: 'On this water, it genuinely helps — dishwashers, washing machines and ice makers all last longer and work better without the scale. That said, it is a plumbing decision rather than an appliance one, and we are not going to sell you one. We will tell you what the scale is costing you and leave the rest to a plumber.',
      },
    ],
  },

  'yorba-linda': {
    housing:
      'Yorba Linda is larger lots and lower density than most of the county, with the bulk of its housing built from the eighties onward and continuing through Vista del Verde and Bryant Ranch. Kitchens tend to be bigger, appliances tend to be higher specification, and second refrigerators or freezers in garages are common.',
    conditions:
      'North county hard water again, and here it reaches more machines because there are more of them per house — a main refrigerator with an ice maker, a garage unit, sometimes an outdoor kitchen. Garage and outdoor appliances add their own factor: a refrigerator in an unconditioned garage through an inland summer is working far outside the conditions it was designed for.',
    brands: ['KitchenAid', 'Sub-Zero', 'Thermador', 'Whirlpool', 'LG', 'Samsung', 'Bosch'],
    neighborhoods: [
      'East Lake Village',
      'Vista del Verde',
      'Bryant Ranch',
      'Travis Ranch',
      'Yorba Linda Estates',
      'Kerrigan Ranch',
    ],
    driveTime: 'Forty to fifty minutes from Irvine.',
    faq: [
      {
        q: 'My garage refrigerator stops cooling in summer. Is it broken?',
        a: 'Frequently not. Most refrigerators are rated for a room-temperature range, and an inland garage in August runs well past it — the unit either cycles constantly or the freezer holds while the fresh-food side warms. Some models are built for garage duty and some are not, and we will tell you which yours is before you spend on a repair it does not need.',
      },
      {
        q: 'Does hard water reach Yorba Linda too?',
        a: 'Yes — this is north county water, and scale on dishwasher elements, washer inlet valves and ice makers is routine. Homes here often run more water-fed appliances than average, so it turns up in more places.',
      },
      {
        q: 'Do you work on outdoor kitchens and built-in outdoor refrigeration?',
        a: 'Yes. Outdoor-rated units are built for the exposure but still need their coils kept clear, and a unit installed outdoors that was never rated for it will show heat and moisture faults early. Worth mentioning at booking so we arrive with the right parts.',
      },
    ],
  },

  brea: {
    housing:
      'Brea layers a small older downtown and the hillside neighbourhoods of Olinda Village and Country Hills against substantial recent development at Blackstone and La Floresta. The city is compact, so a technician can be in a 1950s kitchen and a 2015 one within a few minutes of each other.',
    conditions:
      'The hillside neighbourhoods bring access and older infrastructure; the newer tracts bring current, heavily electronic appliances still early in their life, where faults are boards, sensors and fittings rather than wear. North county water applies across all of it — scale is the constant background to the kitchen work here.',
    brands: ['Whirlpool', 'KitchenAid', 'LG', 'Samsung', 'GE', 'Bosch', 'Maytag'],
    neighborhoods: [
      'Blackstone',
      'La Floresta',
      'Olinda Village',
      'Country Hills',
      'Downtown Brea',
      'Brea Hills',
    ],
    driveTime: 'Thirty-five to forty-five minutes from Irvine.',
    faq: [
      {
        q: 'My Blackstone or La Floresta home is new. Why is an appliance failing already?',
        a: 'Early failures are usually electronic or installation-related rather than wear — a sensor, a board, or a water line that was never quite right at build. Check the manufacturer warranty first; if it is still live, that repair should cost you nothing and we will say so.',
      },
      {
        q: 'Do you cover the hillside neighbourhoods?',
        a: 'Yes, Olinda Village and Country Hills included. Narrow access is worth flagging when you book if a large unit has to come out, so we plan the visit around it.',
      },
      {
        q: 'Is the water in Brea hard enough to matter?',
        a: 'It is. Scale on dishwasher heating elements and restricted washer inlet valves are among the most common things we find here, and both are usually correctable without replacing the machine.',
      },
    ],
  },

  placentia: {
    housing:
      'Placentia is a smaller, largely residential city built out through the sixties and seventies, with established family neighbourhoods around Alta Vista and Bradford Place and a compact older centre. Single-family homes dominate, most with garage or indoor laundry and conventional kitchen layouts.',
    conditions:
      'Housing of this era is at the stage where second-generation appliances are ageing out together, so the work is heavily washers, dryers and refrigerators from the 2000s and 2010s. North county water adds the usual scale problems on anything that takes a water supply — dishwashers, washing machines, ice makers.',
    brands: ['Whirlpool', 'GE', 'Kenmore', 'Maytag', 'Frigidaire', 'LG', 'Samsung'],
    neighborhoods: [
      'Alta Vista',
      'Bradford Place',
      'Placentia Heights',
      'Morningside',
      'Old Town Placentia',
      'Tuffree Hills',
    ],
    driveTime: 'Thirty-five to forty-five minutes from Irvine.',
    faq: [
      {
        q: 'Is it worth repairing a washer from around 2010?',
        a: 'Usually yes. Machines of that generation are mechanically solid and their common failures — pump, bearings, door latch, inlet valve — are parts we carry. We give you the repair figure against a replacement figure and you decide; if replacement is the better spend we say so.',
      },
      {
        q: 'My ice maker has slowed down and now makes nothing. What causes that?',
        a: 'On north county water, scale is the first suspect: it restricts the inlet valve and the fill line until production drops off and then stops. That is often correctable without a new ice maker, so it is worth checking before replacing the assembly.',
      },
      {
        q: 'How long does it take you to reach Placentia?',
        a: 'Around forty minutes from our Irvine base depending on the freeway. Same-day appointments are usually available; booking earlier in the day gives the best chance of a tight window.',
      },
    ],
  },
};
