/**
 * One machine, one city — the intersection and nothing else.
 *
 * "Refrigerator repair Irvine" is the largest untouched cluster in this niche
 * and the site answered it with two halves: `/services/refrigerator` matched
 * the machine, `/service-areas/irvine` matched the place, and neither won
 * because the signal was split between them.
 *
 * THE DISCIPLINE, and it is the same one that governs brand × appliance. These
 * pages carry the intersection only:
 *
 *   /services/{machine}            — what goes wrong with this machine
 *   /service-areas/{city}          — what this city's housing does to appliances
 *   /service-areas/{city}/{thing}  — what this city does to *this machine*
 *
 * Nothing here restates a fault list already on the service page or a housing
 * paragraph already on the city page. Where the intersection is thin, the entry
 * is short — a padded page is how twenty-four of these become the doorway set
 * `city-local.ts` was written to escape. That file measured the last attempt at
 * 78–82% shared text and named it as the reason none of the fifteen ranked.
 *
 * The angles are real and they came from the technician's own notes in
 * `city-local`: Irvine laundry lives in a hallway closet with a vent that turns
 * twice, north county water scales a dishwasher element, Costa Mesa dishwashers
 * were teed into a drain without an air gap by whoever retrofitted the kitchen,
 * and Newport salt reaches a condenser coil years before anything mechanical
 * wears. Those are four different repairs, not one repair with four city names.
 */

export interface ServiceCity {
  /** Must match a slug in `services.ts`. */
  serviceSlug: string;
  /** Must match a slug in `service-areas.ts`. */
  citySlug: string;
  /** One line for the city page's list. */
  summary: string;
  /** Why this machine fails differently here. The whole reason the page exists. */
  angle: string;
  /** Faults shaped by this city, not the machine's general fault list. */
  faults: Array<{ symptom: string; cause: string }>;
  faq: Array<{ q: string; a: string }>;
  seo: { title: string; description: string };
}

export const serviceCities: ServiceCity[] = [
  // ===========================================================================
  // Irvine — attached housing, laundry in a hallway closet
  // ===========================================================================
  {
    serviceSlug: 'dryer',
    citySlug: 'irvine',
    summary: 'A vent that turns twice before it reaches a wall.',
    angle:
      'More Irvine laundry sits in a hallway closet than in a garage, and that closet is the whole story. The exhaust leaves the machine, turns, runs the length of an interior wall and turns again before it finds the outside — three times the duct of a garage install and every foot of it collecting lint. A dryer that has stopped heating in Irvine is a vent problem until proven otherwise.',
    faults: [
      {
        symptom: 'No heat, and a thermal fuse that has gone before',
        cause:
          'The long closet run. The fuse opens because the machine overheated, and it will do it again in a month if only the fuse is replaced. On these installs we measure airflow at the exterior cap rather than guessing from the back of the machine.',
      },
      {
        symptom: 'Two cycles to dry, no fault reported',
        cause:
          'The same duct, earlier. Cycle times creep up for months before anything trips, which is why this gets reported as "it has always been slow" rather than as a fault.',
      },
      {
        symptom: 'The machine has to come out before it can be opened',
        cause:
          'Not a fault, but it is why a closet job takes an hour where a garage job takes twenty minutes. Worth knowing when comparing quotes.',
      },
    ],
    faq: [
      {
        q: 'My dryer is in a closet. Can the vent even be cleaned?',
        a: 'Yes, and it is usually the repair rather than an extra. The run is longer and has more turns than a garage install, so it needs doing more often — but it is the same job and it is what restores the drying times.',
      },
    ],
    seo: {
      title: 'Dryer Repair Irvine, CA | Closet Vents & No Heat',
      description:
        'Dryer repair in Irvine — long closet vent runs, thermal fuses that keep blowing, and drying times that crept up. Same-day appointments. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'washer',
    citySlug: 'irvine',
    summary: 'Stacked in a closet, and it comes out before it opens.',
    angle:
      'The same hallway closet that shapes Irvine dryers shapes the washers beside them. Machines are stacked, drain hoses sit at heights the manufacturer never intended, and almost nothing can be reached without pulling the pair forward first.',
    faults: [
      {
        symptom: 'Will not drain, filter is clear',
        cause:
          'The drain hose height. A closet standpipe is often higher than the machine expects, or the hose has been pushed too far in and siphons. Both look like a pump fault from the front.',
      },
      {
        symptom: 'Walks or bangs in a stacked install',
        cause:
          'Levelling on a floor that is not a garage slab, and the stacking kit itself. A stacked pair amplifies what a standalone machine would absorb.',
      },
    ],
    faq: [
      {
        q: 'Do you work on stacked machines in a closet?',
        a: 'Routinely — it is most of the Irvine laundry we see. Tell us it is a stacked closet install when you book so we arrive expecting to bring the pair forward.',
      },
    ],
    seo: {
      title: 'Washer Repair Irvine, CA | Closet & Stacked Laundry',
      description:
        'Washer repair in Irvine — stacked closet installs, drain hose height problems, levelling and vibration. Same-day appointments. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'refrigerator',
    citySlug: 'irvine',
    summary: 'Built into a surround with less air than the coil wanted.',
    angle:
      'Irvine kitchens are newer than most of the county and a great many were specified with the refrigerator built into a cabinet surround. It looks right and it gives the condenser less air than the machine was designed around — which is why running-constantly complaints here start at clearance rather than at the compressor.',
    faults: [
      {
        symptom: 'Runs constantly in a built-in surround',
        cause: 'Clearance at the coil. The cabinet was built to the fridge, not to the airflow the fridge needs.',
      },
      {
        symptom: 'A newer machine already failing',
        cause:
          'Worth checking the manufacturer warranty before booking anyone including us. In the eastern villages a great deal of this equipment is young enough to still be covered.',
      },
    ],
    faq: [
      {
        q: 'It is built into the cabinetry. Does that complicate the repair?',
        a: 'It changes the access, not the diagnosis. Tell us at booking so we come prepared to bring it forward — a panelled or tightly surrounded unit takes longer to get at than to fix.',
      },
    ],
    seo: {
      title: 'Refrigerator Repair Irvine, CA | Same-Day',
      description:
        'Refrigerator repair in Irvine — built-in surrounds starved of airflow, cooling faults and newer machines still under warranty. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'dishwasher',
    citySlug: 'irvine',
    summary: 'Newer kitchens, and mostly the machine the builder upgraded.',
    angle:
      'Irvine dishwashers skew newer and skew Bosch and KitchenAid, because those are the standard builder upgrades in the eastern villages. That changes the call: less retrofit trouble than the older parts of the county, more machines still inside a manufacturer warranty, and two brands whose common faults are well mapped.',
    faults: [
      {
        symptom: 'Bosch reporting E15',
        cause: 'Water in the base pan. The code says it escaped and nothing about where from — finding it is the repair.',
      },
      {
        symptom: 'Dishes not drying on a Bosch',
        cause: 'Condensation drying, working as designed. Damp plastics are normal on these and not a fault.',
      },
    ],
    faq: [
      {
        q: 'Mine came with the house. Is it still under warranty?',
        a: 'Quite possibly, in the newer villages. Check before booking anyone — if it is covered, that repair should not cost you anything.',
      },
    ],
    seo: {
      title: 'Dishwasher Repair Irvine, CA | Bosch & KitchenAid',
      description:
        'Dishwasher repair in Irvine — Bosch E15 leak faults, drying complaints that are not faults, KitchenAid drain problems. Call (949) 749-0006.',
    },
  },

  // ===========================================================================
  // Anaheim — north county hard water
  // ===========================================================================
  {
    serviceSlug: 'dishwasher',
    citySlug: 'anaheim',
    summary: 'Scale on the element, and a machine that stops drying.',
    angle:
      'North Orange County water is noticeably harder than the coast, and a dishwasher is where that shows first. Scale builds on the heating element until the machine will not dry, then coats the sensors, then narrows the inlet. Most Anaheim dishwashers we are called to do not need a part — they need descaling and a valve screen cleaned.',
    faults: [
      {
        symptom: 'Stopped drying, everything else fine',
        cause: 'Scale on the heating element. Descaling often restores a machine that looked like it needed an element.',
      },
      {
        symptom: 'Long fills, or fills that time out',
        cause: 'The inlet valve screen narrowed by scale. A clean rather than a valve, in most cases.',
      },
      {
        symptom: 'White film on glassware',
        cause:
          'Hard water rather than the machine. Rinse aid and the right detergent dose fix more of these than any repair does.',
      },
    ],
    faq: [
      {
        q: 'Would a water softener help?',
        a: 'On this water it genuinely does — dishwashers, washing machines and refrigerators all last longer without the scale. That said, it is a plumbing decision rather than an appliance one, and we are not going to sell you one. We will tell you what the scale is costing you and leave the rest to a plumber.',
      },
    ],
    seo: {
      title: 'Dishwasher Repair Anaheim, CA | Hard Water & Scale',
      description:
        'Dishwasher repair in Anaheim — scale on heating elements, narrowed inlet valves, film on glassware from north county hard water. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'refrigerator',
    citySlug: 'anaheim',
    summary: 'The water side fails first on this supply.',
    angle:
      'On north county water it is the water-fed half of a refrigerator that gives trouble: inlet valves narrowing, fill tubes furring, ice production tailing off month by month until it stops. The cooling side of the same machine is often perfectly healthy, which is why the complaint arrives as "the ice maker died" rather than as a refrigerator fault.',
    faults: [
      {
        symptom: 'Ice production slowing over months',
        cause: 'Scale restricting the inlet valve and the fill line. Often correctable without replacing the assembly.',
      },
      {
        symptom: 'No water at the dispenser',
        cause: 'The filter, overdue on most units we open here, then the valve.',
      },
    ],
    faq: [
      {
        q: 'The ice maker slowed down and now makes nothing.',
        a: 'On this water, scale is the first suspect — it restricts the inlet valve and the fill line until production drops off and then stops. That is often correctable without a new ice maker, so it is worth checking before replacing the assembly.',
      },
    ],
    seo: {
      title: 'Refrigerator Repair Anaheim, CA | Same-Day',
      description:
        'Refrigerator repair in Anaheim — inlet valves and fill lines narrowed by north county hard water, dispenser faults, cooling problems. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'washer',
    citySlug: 'anaheim',
    summary: 'Fills that take longer every month.',
    angle:
      'A washer on hard water fails slowly and in one direction: the inlet screens narrow, fills take longer, and eventually the machine times out and reports a fault that sounds like a valve. The valve is usually fine. This is the Anaheim washer call, and it is a clean rather than a part more often than not.',
    faults: [
      {
        symptom: 'Fill taking longer and longer, then a fault',
        cause: 'Scale on the inlet screens at the back of the machine. They unscrew and rinse clean.',
      },
      {
        symptom: 'Residue on dark laundry',
        cause: 'Water hardness and detergent dose rather than the machine.',
      },
    ],
    faq: [
      {
        q: 'Can I clean the inlet screens myself?',
        a: 'Yes. Turn off both taps, unscrew the fill hoses at the machine end, and rinse the small mesh screens in the inlets. On this water they need it more often than the manual suggests.',
      },
    ],
    seo: {
      title: 'Washer Repair Anaheim, CA | Hard Water Fills',
      description:
        'Washer repair in Anaheim — slow fills and timeouts from scaled inlet screens, drain faults and spin problems. Same-day service. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'dryer',
    citySlug: 'anaheim',
    summary: 'Garage runs, and the fuse that keeps going.',
    angle:
      'Anaheim laundry is mostly in the garage, which means the duct runs the length of a wall before it exits. Hard water does nothing to a dryer — this is the one appliance the local supply leaves alone — so the story here is the same one as everywhere with a long run: lint, restriction, and a thermal fuse doing its job.',
    faults: [
      {
        symptom: 'Turns without heating',
        cause: 'A thermal fuse opened by a restricted duct. Fitting the fuse without clearing the run is a return visit.',
      },
      {
        symptom: 'Rumbling that rises with the drum',
        cause: 'Rollers, idler and belt — usually all due together at the age most of this housing stock is.',
      },
    ],
    faq: [
      {
        q: 'This is the second fuse this year.',
        a: 'Then the duct was never cleared. The fuse opens because the machine overheats and it overheats because the exhaust cannot get out. Clearing the full run stops the fuse being a consumable.',
      },
    ],
    seo: {
      title: 'Dryer Repair Anaheim, CA | No Heat & Vents',
      description:
        'Dryer repair in Anaheim — thermal fuses and the garage vent runs behind them, rollers, belts and long drying times. Call (949) 749-0006.',
    },
  },

  // ===========================================================================
  // Santa Ana — high-cycle use, older kitchen footprints
  // ===========================================================================
  {
    serviceSlug: 'washer',
    citySlug: 'santa-ana',
    summary: 'Parts wear out on schedule, which makes repair the easy answer.',
    angle:
      'Santa Ana machines work harder than most in the county — bigger households, more loads, more hours on every bearing. That sounds like bad news and mostly is not: high-cycle wear is predictable. Bearings, belts, pumps and door latches fail on schedule rather than oddly, diagnosis is quick, and repair beats replacement far more often than it does on a machine that failed for no obvious reason.',
    faults: [
      {
        symptom: 'Growing noise on spin',
        cause: 'The tub bearing, reached in the ordinary way. On a high-cycle machine this arrives earlier than the manual would suggest and it is not a defect.',
      },
      {
        symptom: 'Door latch failing repeatedly',
        cause: 'Cycle count. A latch rated for a certain number of operations reaches it sooner in a house doing ten loads a week.',
      },
      {
        symptom: 'Pump obstructed again',
        cause: 'More loads, more coins and hair clips. The filter wants clearing more often here than the manual assumes.',
      },
    ],
    faq: [
      {
        q: 'The machine is only six years old and the bearing has gone.',
        a: 'Age is the wrong measure — cycles are. A machine doing ten loads a week reaches a bearing failure years before one doing three, and it is wear rather than a fault in the machine.',
      },
    ],
    seo: {
      title: 'Washer Repair Santa Ana, CA | Same-Day',
      description:
        'Washer repair in Santa Ana — bearings, latches and pumps worn by high-cycle use, drain faults and spin problems. Same-day service. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'dryer',
    citySlug: 'santa-ana',
    summary: 'Rollers and belts, earlier than the manual expects.',
    angle:
      'The same high-cycle pattern as the washers standing beside them. Drum rollers, idler pulleys and belts are the wear items, and in a household doing double the average number of loads they arrive years early. Nothing exotic — just sooner, and usually all three at once.',
    faults: [
      {
        symptom: 'Rumbling or squealing',
        cause: 'Rollers and the idler, with the belt usually due at the same time. Replacing one and leaving the others is a false economy on a machine this busy.',
      },
      {
        symptom: 'No heat',
        cause: 'The thermal fuse and the duct behind it, as everywhere — but reached faster here because the machine runs more.',
      },
    ],
    faq: [
      {
        q: 'Is it worth replacing rollers on an older dryer?',
        a: 'Usually yes. Rollers, idler and belt together are an inexpensive job on a machine whose motor and drum are fine, and on a high-cycle household it buys years rather than months.',
      },
    ],
    seo: {
      title: 'Dryer Repair Santa Ana, CA | Rollers & Belts',
      description:
        'Dryer repair in Santa Ana — drum rollers, idlers and belts worn early by high-cycle use, no-heat faults and vent restriction. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'refrigerator',
    citySlug: 'santa-ana',
    summary: 'A modern machine in a kitchen built before it.',
    angle:
      'In the older Santa Ana houses the constraint is the kitchen rather than the appliance. A current refrigerator put into a 1930s or 1950s footprint sits closer to a wall than it should, vents into less space than it needs, and runs hotter for it — which shortens the life of everything inside it.',
    faults: [
      {
        symptom: 'Running constantly in a tight alcove',
        cause: 'Clearance. The machine was designed around airflow the kitchen cannot give it.',
      },
      {
        symptom: 'Condenser packing quickly',
        cause: 'A tight space collects more dust at the coil and sheds less heat. It wants cleaning more often here than a machine standing free.',
      },
    ],
    faq: [
      {
        q: 'The fridge barely fits the space. Is that hurting it?',
        a: 'It can be. A machine with too little clearance runs longer and hotter, and the coil packs faster. It is often correctable without moving cabinetry — sometimes an inch and a coil clean is the whole repair.',
      },
    ],
    seo: {
      title: 'Refrigerator Repair Santa Ana, CA | Same-Day',
      description:
        'Refrigerator repair in Santa Ana — tight alcoves starving the condenser, cooling faults and high-cycle wear. Same-day service. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'dishwasher',
    citySlug: 'santa-ana',
    summary: 'Retrofitted into kitchens that never planned for one.',
    angle:
      'A great many Santa Ana kitchens gained a dishwasher long after they were built, and the retrofit is what fails rather than the machine. Drain lines teed in without an air gap, supply runs taken from the nearest convenient point, and a cabinet opening cut to fit rather than to specification.',
    faults: [
      {
        symptom: 'Standing water, or water backing up from the sink',
        cause: 'The drain arrangement rather than the pump — no air gap, no high loop, or a tee in the wrong place.',
      },
      {
        symptom: 'Machine moves when the door opens',
        cause: 'Never anchored properly into a cut opening. Cheap to correct and it prevents a lot else.',
      },
    ],
    faq: [
      {
        q: 'Water comes back up into the sink when it drains.',
        a: 'That is the drain arrangement, not the dishwasher. It usually means there is no air gap or high loop, so the machine is emptying into a line that pushes back. Correcting it is straightforward and it stops the machine being blamed.',
      },
    ],
    seo: {
      title: 'Dishwasher Repair Santa Ana, CA | Retrofit Faults',
      description:
        'Dishwasher repair in Santa Ana — drain lines teed without an air gap, backing up into the sink, machines never anchored properly. Call (949) 749-0006.',
    },
  },

  // ===========================================================================
  // Huntington Beach — salt air near the water, garage laundry everywhere
  // ===========================================================================
  {
    serviceSlug: 'dryer',
    citySlug: 'huntington-beach',
    summary: 'A vent the length of a wall, and the single most common HB call.',
    angle:
      'Garage laundry is close to universal here, and a garage dryer vents the length of a wall before it turns and exits. That run packs with lint, and it is the single most common reason a Huntington Beach dryer stops heating — ahead of every component in the machine.',
    faults: [
      {
        symptom: 'No heat, repeatedly',
        cause: 'The wall-length duct. The part that failed is a symptom of it, and replacing the part without clearing the run just resets the clock.',
      },
      {
        symptom: 'Drying times creeping up',
        cause: 'The same run earlier in its life. This is the stage where clearing it is cheap and nothing has failed yet.',
      },
    ],
    faq: [
      {
        q: 'How often should a garage vent be cleared here?',
        a: 'On a wall-length run, about once a year. Sooner if the laundry is heavy or if the exterior cap is where a bird can reach it — nesting in the wall cap is not unusual near the water.',
      },
    ],
    seo: {
      title: 'Dryer Repair Huntington Beach, CA | Garage Vents',
      description:
        'Dryer repair in Huntington Beach — wall-length garage vent runs behind most no-heat calls, thermal fuses, rollers and long drying times. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'refrigerator',
    citySlug: 'huntington-beach',
    summary: 'Salt near the water, and a second fridge in the garage.',
    angle:
      'Two things shape refrigeration here. Near the sand, salt air reaches terminals and connectors and corrodes the electrical side long before anything mechanical wears. And a very large share of these houses run a second refrigerator in an unconditioned garage, which through an inland summer is working well outside what it was built for.',
    faults: [
      {
        symptom: 'Intermittent electrical faults on a coastal unit',
        cause: 'Corrosion at connectors rather than a failed component. Cleaning and protecting the terminals fixes more of these than parts do.',
      },
      {
        symptom: 'Garage unit struggling in summer, fine in winter',
        cause:
          'Ambient temperature. Many refrigerators are not rated for the range an Orange County garage reaches, and this is a specification problem rather than a fault.',
      },
    ],
    faq: [
      {
        q: 'Does living near the beach really shorten appliance life?',
        a: 'On the electrical side, yes and measurably. Salt reaches connectors and boards and corrodes them years before anything mechanical wears out. It is why a coastal unit often fails in a way that looks random.',
      },
    ],
    seo: {
      title: 'Refrigerator Repair Huntington Beach, CA | Coastal',
      description:
        'Refrigerator repair in Huntington Beach — salt-air corrosion at connectors, garage units working outside their rating, cooling faults. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'washer',
    citySlug: 'huntington-beach',
    summary: 'Garage installs, and a slab that amplifies vibration.',
    angle:
      'A garage washer stands on a concrete slab with nothing around it, which is better for access and worse for noise: there is no cabinetry to absorb a spin cycle and nothing to stop a machine walking. Levelling matters more here than almost anywhere in the county.',
    faults: [
      {
        symptom: 'Walking across the slab on spin',
        cause: 'Levelling first, then the suspension. A slab is unforgiving of both.',
      },
      {
        symptom: 'Corroded connections on a coastal install',
        cause: 'Salt reaching the electrical side, as it does the refrigeration. More common within a few blocks of the water.',
      },
    ],
    faq: [
      {
        q: 'The washer moves across the garage floor.',
        a: 'Start with the feet — a slab shows up a machine that is barely out of level in a way a wooden floor would hide. If it is level and still walking, the suspension is next.',
      },
    ],
    seo: {
      title: 'Washer Repair Huntington Beach, CA | Same-Day',
      description:
        'Washer repair in Huntington Beach — machines walking on garage slabs, levelling and suspension, salt-air corrosion on coastal installs. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'dishwasher',
    citySlug: 'huntington-beach',
    summary: 'A mixed stock, and a straightforward fault list.',
    angle:
      'Huntington Beach dishwashers span the mid-century tracts and the newer coastal rebuilds, so there is no single local story the way there is with the dryers. What the two ends share is water: this is not the hardest supply in the county, and the machines here fail mechanically rather than through scale.',
    faults: [
      {
        symptom: 'Standing water after a cycle',
        cause: 'The drain pump, the check valve, or a disposal knockout plug left in at installation.',
      },
      {
        symptom: 'Not cleaning properly',
        cause: 'The filter on newer machines, the chopper or wash pump on older ones.',
      },
    ],
    faq: [
      {
        q: 'Is the water here hard enough to damage a dishwasher?',
        a: 'Less so than in north county. Scale is not the usual answer on this side of the county — a Huntington Beach dishwasher is more likely to have a mechanical fault than a chemical one.',
      },
    ],
    seo: {
      title: 'Dishwasher Repair Huntington Beach, CA | Same-Day',
      description:
        'Dishwasher repair in Huntington Beach — drain faults, disposal knockout plugs, filters and wash pumps. Same-day appointments. Call (949) 749-0006.',
    },
  },

  // ===========================================================================
  // Costa Mesa — older stock, and retrofits that fail
  // ===========================================================================
  {
    serviceSlug: 'dishwasher',
    citySlug: 'costa-mesa',
    summary: 'The retrofit fails, not the machine.',
    angle:
      'Costa Mesa kitchens built before dishwashers were standard often gained one later, and it is the retrofit that gives trouble rather than the appliance. A drain line teed into the waste without an air gap, a supply taken from wherever was convenient, a circuit already carrying more than it should. Three of the most common calls here need no dishwasher part at all.',
    faults: [
      {
        symptom: 'Sink backs up when the dishwasher drains',
        cause: 'No air gap and no high loop. The machine is emptying into a line that pushes back, and the dishwasher gets blamed.',
      },
      {
        symptom: 'Standing water from day one',
        cause: 'The disposal knockout plug still in place. Free to fix, and one of the most common misses in a kitchen fit-out.',
      },
      {
        symptom: 'Machine trips the circuit',
        cause: 'A shared circuit carrying a modern heating element it was never run for. That is an electrician rather than us, and we say so.',
      },
    ],
    faq: [
      {
        q: 'The dishwasher was added years after the kitchen was built. Does that matter?',
        a: 'It is usually the whole story. Retrofitted drains, supplies and circuits are where these faults live, and the machine itself is often fine. It also means several of the fixes cost very little.',
      },
    ],
    seo: {
      title: 'Dishwasher Repair Costa Mesa, CA | Retrofit Faults',
      description:
        'Dishwasher repair in Costa Mesa — drains teed without an air gap, knockout plugs left in, retrofitted supplies and circuits. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'washer',
    citySlug: 'costa-mesa',
    summary: 'A front-loader in a garage built for a wringer.',
    angle:
      'Garages here were built for a washer that weighed a fraction of a modern front-loader and spun at a fraction of the speed. The slab, the drain and the standpipe all date from that era, and a high-speed machine put onto them behaves in ways that look like a fault and are not.',
    faults: [
      {
        symptom: 'Violent movement on spin',
        cause: 'An old slab that is out of level, and a machine spinning three times faster than the one it replaced. Levelling first, always.',
      },
      {
        symptom: 'Standpipe overflowing',
        cause: 'A drain sized for a slower, lower-volume machine. The washer is emptying faster than the pipe can take it.',
      },
    ],
    faq: [
      {
        q: 'Water comes out of the standpipe when it drains.',
        a: 'The pipe is likely older and narrower than a modern pump expects, so the machine empties faster than the drain can take it. It is a plumbing fix rather than an appliance one, and we will tell you that rather than sell you a pump.',
      },
    ],
    seo: {
      title: 'Washer Repair Costa Mesa, CA | Older Garages',
      description:
        'Washer repair in Costa Mesa — modern front-loaders on older slabs and standpipes, vibration, levelling and drain overflow. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'dryer',
    citySlug: 'costa-mesa',
    summary: 'Venting added later, and rarely added well.',
    angle:
      'Where the laundry moved into a space that was not built for it, the vent was added afterwards — and an afterthought duct is longer, has more turns and uses more flexible hose than a planned one. That is the Costa Mesa dryer story: not a worn machine, a duct that was never right.',
    faults: [
      {
        symptom: 'No heat on a machine that is not old',
        cause: 'The retrofitted duct. Flexible hose crushed behind the machine or run further than it should be.',
      },
      {
        symptom: 'Lint escaping into the room',
        cause: 'Joints in an afterthought run that were taped rather than clamped.',
      },
    ],
    faq: [
      {
        q: 'The dryer was moved to a different room years ago.',
        a: 'Then the vent is worth looking at before anything else. Ducts added after the fact tend to be longer, turn more and use more flexible hose than a planned run — and that is what takes the heat out of a dryer.',
      },
    ],
    seo: {
      title: 'Dryer Repair Costa Mesa, CA | Retrofit Venting',
      description:
        'Dryer repair in Costa Mesa — vents added after the laundry moved, crushed flexible hose, no heat and lint escaping. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'refrigerator',
    citySlug: 'costa-mesa',
    summary: 'A water line run by whoever had the shortest route.',
    angle:
      'Refrigerators in older Costa Mesa kitchens usually gained their water supply as an addition, and the line took whatever route was easiest at the time. Under a floor, through an unconditioned space, or in a length of tubing that has been kinked behind the machine ever since. Dispenser and ice complaints here start at the line rather than at the valve.',
    faults: [
      {
        symptom: 'No water or ice, valve tests fine',
        cause: 'The supply line — kinked behind the machine, or frozen where it passes through cold space.',
      },
      {
        symptom: 'Water under the machine',
        cause: 'A saddle valve on an old retrofit line. They fail slowly and they are the first thing we look for on an older install.',
      },
    ],
    faq: [
      {
        q: 'There is water under the fridge but the fridge seems fine.',
        a: 'On an older retrofit the saddle valve on the supply line is the usual culprit. It fails slowly and the puddle gets blamed on the refrigerator, which is often in perfect health.',
      },
    ],
    seo: {
      title: 'Refrigerator Repair Costa Mesa, CA | Same-Day',
      description:
        'Refrigerator repair in Costa Mesa — retrofitted water lines, failing saddle valves, dispenser and ice faults, cooling problems. Call (949) 749-0006.',
    },
  },

  // ===========================================================================
  // Newport Beach — the coast, and built-in refrigeration
  // ===========================================================================
  {
    serviceSlug: 'refrigerator',
    citySlug: 'newport-beach',
    summary: 'Salt reaches the coil years before anything wears out.',
    angle:
      'Salt air is the constant here, and built-in refrigeration suffers most from it. A coil that cannot breathe holds the salt against itself, corrosion reaches terminals and boards, and the machine develops faults that look random because they are electrical rather than mechanical. On units within a few blocks of the water this arrives long before anything has worn out.',
    faults: [
      {
        symptom: 'Intermittent faults with no pattern',
        cause: 'Corrosion at connectors and on boards. The randomness is the diagnosis — mechanical wear does not behave this way.',
      },
      {
        symptom: 'Built-in running constantly',
        cause: 'The condenser, packed and salted. On a built-in the coil is behind a grille and out of sight, and it wants cleaning more often here than anywhere inland.',
      },
      {
        symptom: 'Panelled unit awkward to reach',
        cause:
          'Not a fault, but it changes the visit. An integrated column may need the panel off before the machine can come forward, and knowing that at booking saves a second trip.',
      },
    ],
    faq: [
      {
        q: 'How often should a coastal built-in have its condenser cleaned?',
        a: 'Closer to every six months than every twelve. Salt and dust together do more than dust alone, and on a built-in the coil is out of sight so nobody notices until the machine is running constantly.',
      },
    ],
    seo: {
      title: 'Refrigerator Repair Newport Beach, CA | Built-In',
      description:
        'Refrigerator repair in Newport Beach — salt-air corrosion on coastal built-ins, condensers needing more frequent cleaning, panelled columns. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'dishwasher',
    citySlug: 'newport-beach',
    summary: 'Panel-ready machines, and access that decides the visit.',
    angle:
      'Newport dishwashers are overwhelmingly panel-ready and built flush into a cabinetry run — Bosch, Thermador, Miele. The faults are ordinary; what is not ordinary is getting to them. A custom panel and a tight surround turn a routine drain pump into a job that needs planning before anyone arrives.',
    faults: [
      {
        symptom: 'Will not drain',
        cause: 'The pump or the check valve, as anywhere. The panel is what makes it a longer visit.',
      },
      {
        symptom: 'Water in the base pan and the machine cut off',
        cause: 'The leak float doing its job on a Bosch, Thermador or Miele. It says water escaped, not where from.',
      },
    ],
    faq: [
      {
        q: 'It has a custom cabinet panel. Will that be a problem?',
        a: 'Not a problem, but tell us at booking. A panelled machine often needs the door front off before it will come forward, and arriving prepared for that is the difference between finishing and rescheduling.',
      },
    ],
    seo: {
      title: 'Dishwasher Repair Newport Beach, CA | Panel-Ready',
      description:
        'Dishwasher repair in Newport Beach — panel-ready Bosch, Thermador and Miele machines, drain faults and leak floats. Same-day service. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'washer',
    citySlug: 'newport-beach',
    summary: 'Fewer machines, better machines, salt on the electrics.',
    angle:
      'Laundry volume here is lower than inland and the machines are further up the range — Miele, Bosch, the better LG and Samsung. Mechanically they last, so what fails first on a coastal install is the electrical side, exactly as it is with the refrigeration.',
    faults: [
      {
        symptom: 'Electrical faults on a machine that is mechanically sound',
        cause: 'Salt at the connectors. More common the closer to the water the laundry sits.',
      },
      {
        symptom: 'Premium machine with a long parts wait',
        cause:
          'Not a fault, but worth saying: some Miele components come on longer lead times. We give the real timeline before ordering rather than after.',
      },
    ],
    faq: [
      {
        q: 'Is a Miele worth repairing here?',
        a: 'Usually yes — they are built to a twenty-year life and reach it. The thing to plan for is the parts timeline rather than the parts price, and we quote both before ordering.',
      },
    ],
    seo: {
      title: 'Washer Repair Newport Beach, CA | Premium Laundry',
      description:
        'Washer repair in Newport Beach — coastal corrosion on electrics, Miele and Bosch machines, honest parts timelines. Same-day service. Call (949) 749-0006.',
    },
  },
  {
    serviceSlug: 'dryer',
    citySlug: 'newport-beach',
    summary: 'Condensing machines where a duct was never possible.',
    angle:
      'A good share of Newport laundry sits in a condominium or a rebuild where venting to the outside was never an option, which means condensing and heat-pump dryers rather than vented ones. Those fail in a way that produces no error at all: the condenser fouls, cycle times stretch out over a season, and nobody reports it until it has doubled.',
    faults: [
      {
        symptom: 'Cycles getting steadily longer, no fault shown',
        cause: 'A fouled condenser on a heat-pump or condensing machine. Cleaning it usually restores the original performance.',
      },
      {
        symptom: 'Vented machine with a long run to the outside',
        cause: 'The same duct story as everywhere, in a building where the run had to go a long way to reach air.',
      },
    ],
    faq: [
      {
        q: 'My dryer has no vent. What maintenance does it need?',
        a: 'The condenser, on a schedule. It does the job a duct would do and it fouls the way a duct does — the difference is that no error is ever shown, so it wants cleaning before anybody notices a problem.',
      },
    ],
    seo: {
      title: 'Dryer Repair Newport Beach, CA | Condensing & Vented',
      description:
        'Dryer repair in Newport Beach — heat-pump and condensing machines with fouled condensers, long vented runs in rebuilds and condominiums. Call (949) 749-0006.',
    },
  },
];

export function getServiceCity(citySlug: string, serviceSlug: string) {
  return serviceCities.find(
    (entry) => entry.citySlug === citySlug && entry.serviceSlug === serviceSlug
  );
}

/** The machines we have a page for in one city. */
export function servicesForCity(citySlug: string) {
  return serviceCities.filter((entry) => entry.citySlug === citySlug);
}

/** The cities we have a page for on one machine. */
export function citiesForService(serviceSlug: string) {
  return serviceCities.filter((entry) => entry.serviceSlug === serviceSlug);
}
