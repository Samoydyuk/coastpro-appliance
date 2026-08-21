/**
 * The brands worth a page each.
 *
 * Why a page per brand and not one list: "Sub-Zero repair Newport Beach" is a
 * different search from "appliance repair Newport Beach". It is made by someone
 * who already knows what they own, it converts far better, and it is contested
 * by a fraction of the competition — the generic term is fought over by every
 * shop in the county, this one by the few that actually open these machines.
 *
 * Two tiers, and they are not the same job. `premium` is built-in refrigeration
 * and professional cooking: small numbers, large tickets, faults peculiar to
 * the engineering. `mainstream` is the volume end — three brands alone account
 * for roughly three in five branded service calls in this trade — where the
 * customer's problem is usually that four hundred shops look identical and none
 * of them says anything specific. Saying something specific is the whole play.
 *
 * The content standard is the same as the city pages: say what is true of this
 * brand and awkward to say about another. A page that swaps the name into
 * boilerplate is worth nothing here, because the person reading it can tell.
 *
 * ON AUTHORISATION — read before editing. Several of these manufacturers run
 * factory-certified service networks. Nothing in this file claims membership of
 * one, and nothing added to it should, unless CoastPro has actually been
 * certified and can show it. "Factory authorised" and "certified" are terms
 * with a specific meaning; using them loosely is a false statement to a
 * customer about who is standing in their kitchen, and for a warranty repair it
 * is the difference between a claim that pays and one that does not. Where the
 * honest answer is "call the manufacturer", each page says so.
 *
 * This matters more on the mainstream tier, not less. Samsung and LG both run
 * ten-year sealed-system warranties that pay for the part and only through
 * their own network — a customer who lets us fit a compressor has thrown that
 * away without being told. Every page here that has such a warranty says so
 * before it says anything about booking.
 */

export interface ApplianceBrand {
  slug: string;
  name: string;
  /**
   * Which shelf this sits on. Drives the grouping on /brands and nothing else —
   * both tiers get the same depth of page.
   */
  tier: 'premium' | 'mainstream';
  /** One line for cards and lists. */
  summary: string;
  /** What the brand is in the trade, and what that means for a repair. */
  positioning: string;
  /** Appliance categories we take on for this brand. */
  categories: string[];
  /** Model lines a customer might read off their own machine. */
  lines: string[];
  /** Faults characteristic of this brand's engineering, not generic ones. */
  faults: Array<{ symptom: string; cause: string }>;
  /** Where in Orange County this brand concentrates, and why. */
  whereFound: string;
  /** Parts availability, stated honestly. */
  partsNote: string;
  /** When to call the manufacturer instead of us. */
  authorisedNote: string;
  faq: Array<{ q: string; a: string }>;
  seo: { title: string; description: string };
}

export const brands: ApplianceBrand[] = [
  {
    slug: 'sub-zero',
    name: 'Sub-Zero',
    tier: 'premium',
    summary: 'Built-in refrigeration, and the coil that decides most of it.',
    positioning:
      'Sub-Zero builds built-in refrigeration and very little else, which is why the units last as long as they do and why they fail in a narrow set of ways. Most models run dual refrigeration — separate sealed systems for the fresh-food and freezer compartments — so one side can be perfectly cold while the other slowly warms. That single fact rules out half of what a technician would otherwise suspect, and it is the first thing we check.',
    categories: ['Built-in refrigerators', 'Freezer columns'],
    lines: ['Built-In (BI)', 'Integrated (IT)', 'PRO', 'Designer', 'Classic', '500 & 600 Series'],
    faults: [
      {
        symptom: 'Ice production drops off, then stops',
        cause:
          'Nine times in ten this is the condenser, not the ice maker. The coil sits behind the upper grille and packs with dust and pet hair; once it cannot shed heat the unit runs almost continuously and ice is the first thing to go. Cleaning it restores production on a machine that looked like it needed a part.',
      },
      {
        symptom: 'Fresh food warm, freezer still cold',
        cause:
          'The signature dual-refrigeration fault. Two sealed systems means one can fail alone — usually the fresh-food evaporator fan or its defrost circuit rather than the compressor everyone fears.',
      },
      {
        symptom: 'Unit runs constantly and the compartment never reaches temperature',
        cause:
          'Either airflow at the coil, or a door gasket that has lost its magnet. On units past ten years the gasket is a genuinely common answer and a cheap one.',
      },
      {
        symptom: 'Vacuum condenser or sealed-system fault',
        cause:
          'The expensive end. This is refrigerant work, requires EPA certification to touch, and is the one case where the repair figure and a replacement figure need to be looked at side by side before anyone commits.',
      },
    ],
    whereFound:
      'Concentrated along the coast and in the newer inland estates — Newport Coast, Corona del Mar, Emerald Bay and Three Arch Bay in Laguna, Shady Canyon and Turtle Rock in Irvine, and the larger Yorba Linda lots. Coastal units carry the extra problem of salt air working on the electrical connections before anything mechanical wears.',
    partsNote:
      'Current BI, IT and Designer parts are readily available. The 500 and 600 series are old enough that some components are getting scarce; where a part has genuinely gone we say so and give you the replacement figure rather than fitting an approximation.',
    authorisedNote:
      'Sub-Zero runs a factory-certified service network, and we are not part of it. If your unit is inside its manufacturer warranty, call Sub-Zero — that repair should cost you nothing, and we would only be charging you to find that out. We are the right call once the warranty has run, or when you want a second opinion on a quote.',
    faq: [
      {
        q: 'How often does a Sub-Zero condenser need cleaning?',
        a: 'Every six to twelve months, and closer to six if you have pets or live near the beach. It is the single highest-value piece of maintenance on these units — a blocked coil is behind most of the "it stopped making ice" and "it runs all the time" calls we take.',
      },
      {
        q: 'My Sub-Zero is over twenty years old. Is it worth repairing?',
        a: 'Often yes, and more often than with any other brand. These were built to be serviced, and a fan motor or a gasket on a twenty-year-old unit is money well spent. The line we draw is the sealed system: on a unit that age, refrigerant work usually costs enough that replacement deserves a serious look, and we will put both numbers in front of you.',
      },
      {
        q: 'Can you work on an integrated unit that is panelled into the cabinetry?',
        a: 'Yes, though it is worth telling us at booking. An integrated column built into a run of cabinets may need the panel off before the unit can come forward, and knowing in advance is the difference between finishing the job and rescheduling it.',
      },
    ],
    seo: {
      title: 'Sub-Zero Repair Orange County | Same-Day',
      description:
        'Sub-Zero refrigerator repair across Orange County — ice production, dual refrigeration faults, condenser and gasket work. Same-day appointments. Call (949) 749-0006.',
    },
  },

  {
    slug: 'wolf',
    name: 'Wolf',
    tier: 'premium',
    summary: 'Professional ranges — and the spark module behind most call-outs.',
    positioning:
      'Wolf shares a parent company with Sub-Zero and the same design philosophy: heavy, serviceable, built to be repaired rather than replaced. The ranges are genuinely commercial in construction, which means the burners and grates will outlast the house — and that almost everything that actually goes wrong is electrical rather than mechanical.',
    categories: ['Gas ranges', 'Dual-fuel ranges', 'Wall ovens'],
    lines: ['Gas Range (GR)', 'Dual Fuel (DF)', 'M Series ovens'],
    faults: [
      {
        symptom: 'A burner clicks and will not stop, even once it is lit',
        cause:
          'The spark ignition module or a fouled igniter. This is the most common Wolf call by a wide margin, and it is usually a clean or a single part rather than anything structural. Spilled liquid around the igniter is a frequent trigger.',
      },
      {
        symptom: 'Oven runs hot or cold against the dial',
        cause:
          'Thermostat drift or a failing temperature sensor, and much more noticeable on dual-fuel models where the electric oven is expected to hold a tight temperature. Often a calibration rather than a replacement.',
      },
      {
        symptom: 'Infrared broiler will not light or heats unevenly',
        cause:
          'The broiler element or its igniter. Wolf infrared broilers run very hot and the element is a wear part on a range that sees heavy use.',
      },
      {
        symptom: 'Griddle or charbroiler will not hold temperature',
        cause:
          'The dedicated thermostat for that module. These are separate circuits from the main burners, so a fault here says nothing about the rest of the range.',
      },
    ],
    whereFound:
      'Wherever the kitchen was designed around the cooking — Newport Coast, Corona del Mar, Laguna, Shady Canyon and the Yorba Linda estates. Frequently paired with a Sub-Zero, and often both come up in the same visit.',
    partsNote:
      'Current-generation parts are well supplied. Igniters, spark modules and thermostats are the fast-moving items and the ones worth having on the van.',
    authorisedNote:
      'Wolf, like Sub-Zero, has a factory-certified network we do not belong to. Inside the manufacturer warranty, call Wolf first — you should not be paying for that repair, and we will tell you so rather than take the job.',
    faq: [
      {
        q: 'My Wolf burner clicks constantly. Is it dangerous?',
        a: 'It is not usually dangerous, but it should not be left. Continuous sparking normally means the igniter is fouled or wet, or the spark module is failing — gas is still being controlled properly. Turn that burner off and use the others until it is looked at.',
      },
      {
        q: 'Is a dual-fuel Wolf harder to repair than the all-gas version?',
        a: 'Not harder, but it fails differently. The electric oven brings a control board and a temperature sensor that the all-gas model does not have, so oven complaints on a dual-fuel are usually electronic while the same complaint on an all-gas range is usually the thermostat or the igniter.',
      },
      {
        q: 'Can you match the red knobs if one is broken?',
        a: 'Yes — knobs and trim are orderable, and the coloured knob sets are a standard Wolf accessory. Tell us the model number off the plate and we will get the right ones rather than something close.',
      },
    ],
    seo: {
      title: 'Wolf Range Repair Orange County | Same-Day',
      description:
        'Wolf range and oven repair across Orange County — igniter and spark module faults, oven temperature, infrared broilers. Same-day service. Call (949) 749-0006.',
    },
  },

  {
    slug: 'viking',
    name: 'Viking',
    tier: 'premium',
    summary: 'Professional ranges, and a reliability story that split in 2013.',
    positioning:
      'Viking effectively created the residential professional range, and the build quality of the metalwork has never been in question. The service history is more complicated than that, and it is worth knowing which side of it your range falls on: units built before the Middleby acquisition in 2013 earned a genuine reputation for electrical and igniter trouble, and the generations since are materially better. The model and age tell us a great deal before we open anything.',
    categories: ['Professional ranges', 'Wall ovens', 'Built-in refrigeration', 'Dishwashers'],
    lines: ['Professional 5 Series', 'Professional 7 Series', 'Tuscany', 'Virtuoso', 'Designer'],
    faults: [
      {
        symptom: 'Burner will not light or lights slowly',
        cause:
          'The igniter, which on older Viking ranges is the single most replaced part in the machine. On pre-2013 units it is close to a maintenance item rather than a failure.',
      },
      {
        symptom: 'Oven door sags or will not seal',
        cause:
          'Door hinges. These are heavy doors and the hinges carry real load; a sagging door also throws oven temperature off, so the two complaints often arrive together.',
      },
      {
        symptom: 'Convection fan noisy or oven heating unevenly',
        cause:
          'The convection blower motor or its bearing. Noise usually precedes the uneven heating by a while, which makes it one of the few faults you can get ahead of.',
      },
      {
        symptom: 'Control board faults on older units',
        cause:
          'Pre-2013 electronics are the weak point of that generation. Where a board is still available this is a straightforward repair; where it is not, the honest conversation is about the range as a whole.',
      },
    ],
    whereFound:
      'Widely spread across the county rather than concentrated on the coast — Viking was the professional range of choice through the nineties and 2000s, so it turns up in Anaheim Hills, Yorba Linda and Mission Viejo remodels as often as in Newport.',
    partsNote:
      'Current-generation parts are fine. For pre-2013 units, igniters and hinges are still readily available; control boards for some of those model years are getting hard to source, and we will tell you before starting rather than after.',
    authorisedNote:
      'If your Viking is inside its manufacturer warranty, go to Viking first — the repair should be covered and we would only be adding a bill to it. Out of warranty, and particularly on older units, we are usually the more sensible call.',
    faq: [
      {
        q: 'How do I tell which generation my Viking range is?',
        a: 'The model and serial plate, usually behind the kick panel or on the door frame. Send us a photo of it when you book and we will know before arriving whether we are looking at the older electronics or the post-2013 design — which changes what we bring.',
      },
      {
        q: 'My Viking igniter has been replaced before. Why again?',
        a: 'On the older ranges, igniters are a genuine wear part, and a second replacement is not a sign the first repair was wrong. What is worth checking is whether liquid is reaching it during cooking, because that shortens the life of the new one the same way it did the old.',
      },
      {
        q: 'Is an older Viking worth keeping?',
        a: 'The chassis and burners almost always are — they are built far beyond what a mainstream range gets. The question is always the electronics. If the board is available it is usually worth it; if it is not, we will say that plainly instead of chasing parts at your expense.',
      },
    ],
    seo: {
      title: 'Viking Range Repair Orange County | Same-Day',
      description:
        'Viking range, oven and refrigeration repair across Orange County — igniters, door hinges, convection and control boards. Same-day service. Call (949) 749-0006.',
    },
  },

  {
    slug: 'thermador',
    name: 'Thermador',
    tier: 'premium',
    summary: 'Star burners, column refrigeration, and Sapphire dishwashers.',
    positioning:
      'Thermador sits inside the BSH group alongside Bosch, which matters practically: the engineering and the parts supply are shared in places, and a technician who knows one has a head start on the other. The distinctive pieces are the patented star burner, the built-in refrigeration columns and the Sapphire dishwashers — and each fails in its own way.',
    categories: ['Ranges', 'Wall ovens', 'Column refrigeration', 'Dishwashers'],
    lines: ['Professional Harmony', 'Masterpiece', 'Sapphire dishwashers', 'Liberty columns'],
    faults: [
      {
        symptom: 'Star burner will not light or the flame pattern is uneven',
        cause:
          'The igniter or a blocked burner port. The star geometry spreads flame more evenly than a round burner, which is the point of it — but it also means a partially blocked port shows up as a visibly lopsided flame rather than a weak one.',
      },
      {
        symptom: 'Column refrigerator or freezer not holding temperature',
        cause:
          'Condenser airflow first, exactly as with any built-in. Columns are frequently installed in a tight run of cabinetry, and clearance at the coil is the most common cause we find.',
      },
      {
        symptom: 'Sapphire dishwasher not draining or not cleaning',
        cause:
          'Drain pump or wash motor. Shares a good deal of design language with Bosch dishwashers, which makes parts and diagnosis more straightforward than the badge suggests.',
      },
    ],
    whereFound:
      'Common in Irvine and Tustin new-build kitchens — Orchard Hills, Stonegate, Portola Springs, Tustin Legacy — where it is a frequent builder upgrade, and in Newport and Laguna remodels. This means many local Thermador units are still young enough to be in warranty.',
    partsNote:
      'Good availability across the range, helped by the shared BSH supply chain. Igniters, drain pumps and control boards are all obtainable without long waits.',
    authorisedNote:
      'A lot of Thermador in this county went into homes built in the last few years, so check the manufacturer warranty before booking anyone — including us. If it is still live, Thermador should be covering the repair.',
    faq: [
      {
        q: 'Why is my star burner flame uneven?',
        a: 'Almost always a partially blocked port rather than a gas supply problem. The star shape makes it obvious in a way a round burner would hide. It usually cleans up; if it does not, the burner cap or igniter is the next thing to look at.',
      },
      {
        q: 'Is Thermador the same as Bosch for repair purposes?',
        a: 'Related, not identical. They share a parent and some engineering, which helps with parts and with diagnosis on the dishwashers particularly. The cooking products are their own design, and the star burner has no Bosch equivalent.',
      },
    ],
    seo: {
      title: 'Thermador Repair Orange County | Same-Day',
      description:
        'Thermador repair across Orange County — star burners, wall ovens, column refrigeration and Sapphire dishwashers. Same-day service. Call (949) 749-0006.',
    },
  },

  {
    slug: 'miele',
    name: 'Miele',
    tier: 'premium',
    summary: 'Built to run twenty years — and to tell you when water escapes.',
    positioning:
      'Miele designs to a stated twenty-year service life and largely achieves it, which changes the economics of every repair conversation. A fifteen-year-old Miele dishwasher with a failed pump is usually worth fixing, where the same age on a mainstream machine would not be. The trade-off is parts that cost more and occasionally take longer, and a machine that is genuinely unlike its competitors inside.',
    categories: ['Dishwashers', 'Washing machines', 'Heat-pump dryers', 'Built-in ovens'],
    lines: ['G Series dishwashers', 'W1 washers', 'T1 dryers', 'Generation 7000', 'DGC steam combi'],
    faults: [
      {
        symptom: 'Machine stops and reports a water fault',
        cause:
          'The Waterproof System doing its job. Miele fits a float in the base pan that shuts off the supply when it detects water, so the machine halts before there is a flood. Worth understanding: the fault is real, but the water is often coming from a hose or a seal rather than from anything catastrophic.',
      },
      {
        symptom: 'Dishwasher will not drain',
        cause:
          'Drain pump or a blocked non-return valve. Straightforward work on these machines, and the design assumes it will be done — access is far better than on most.',
      },
      {
        symptom: 'Door will not lock, or the cycle will not start',
        cause:
          'The door interlock. A common wear item across the G series and a contained repair.',
      },
      {
        symptom: 'Heat-pump dryer taking far longer than it used to',
        cause:
          'The condenser unit fouling with lint. T1 dryers need that heat exchanger kept clean; when it clogs, drying times stretch out long before any error appears.',
      },
    ],
    whereFound:
      'Miele skews toward considered remodels rather than builder packages — Newport Heights, Corona del Mar, North Laguna, Old Towne Orange and the more design-led Irvine remodels. Owners tend to know exactly what they have, which makes for short, useful phone calls.',
    partsNote:
      'Availability is good but pricing runs above mainstream brands, and some components come on longer lead times. We quote the real figure and the real timeline before ordering, because a cheap-sounding estimate that turns into a three-week wait helps nobody.',
    authorisedNote:
      'Miele warranties run longer than most, so check yours before booking any independent repair — including ours. If it is still covered, Miele should be doing the work.',
    faq: [
      {
        q: 'My Miele has shut off and says there is water in the base. Is it flooding?',
        a: 'It is doing the opposite — the Waterproof System has detected water and cut the supply so it cannot flood. Turn off the tap, leave the machine, and get it looked at. The leak is frequently a hose or a seal rather than the machine itself.',
      },
      {
        q: 'Is it worth repairing a fifteen-year-old Miele?',
        a: 'Usually, and this is the brand where that answer is most often yes. They are designed to a twenty-year life and built to be serviced. We still put the repair figure next to a replacement figure — but on a Miele the repair wins far more often than it does elsewhere.',
      },
      {
        q: 'Why does my heat-pump dryer take so long now?',
        a: 'The condenser is almost certainly fouled with lint. It is a maintenance item on T1 dryers and gets missed because there is no error and no obvious symptom other than creeping cycle times. Cleaning it usually restores the original performance.',
      },
    ],
    seo: {
      title: 'Miele Repair Orange County | Same-Day',
      description:
        'Miele repair across Orange County — dishwashers, W1 washers, T1 heat-pump dryers and built-in ovens. Same-day service, 90-day warranty. Call (949) 749-0006.',
    },
  },

  {
    slug: 'bosch',
    name: 'Bosch',
    tier: 'premium',
    summary: 'The county\'s most common premium dishwasher, and its error codes.',
    positioning:
      'Bosch is the volume brand at the top of the mainstream market, and in Orange County that shows up overwhelmingly as dishwashers — it is the standard upgrade in newer Irvine, Tustin and Lake Forest kitchens. The machines are quiet and reliable, they report faults as numbered codes, and a code is a starting point rather than a diagnosis: the same number covers several causes and testing is what separates them.',
    categories: ['Dishwashers', 'Washing machines', 'Heat-pump dryers', 'Wall ovens', 'Refrigerators'],
    lines: ['100 / 300 / 500 / 800 Series', 'Benchmark', 'Ascenta', '500 Series laundry'],
    faults: [
      {
        symptom: 'E15 and the machine will not run',
        cause:
          'Water in the base pan has tripped the leak sensor. The code is accurate about the symptom and silent about the source — which may be a door seal, a hose, a pump seal or the sump. Draining the pan clears the code and tells you nothing; finding the water is the actual job.',
      },
      {
        symptom: 'Standing water in the bottom after a cycle',
        cause:
          'Drain pump, check valve or the drain hose loop. Bosch relies on a correctly installed high loop or air gap, and in a retrofitted kitchen that is frequently where the problem lives rather than in the machine.',
      },
      {
        symptom: 'Door will not latch or the cycle will not start',
        cause:
          'Door latch and interlock assembly — a known wear item across the series and a contained, inexpensive repair.',
      },
      {
        symptom: 'Dishes coming out wet',
        cause:
          'Usually not a fault at all. Bosch uses condensation drying rather than a heating element, so plastics stay damp by design. Where it has genuinely got worse, hard water scale on the sensor or a rinse-aid setting is the more likely cause.',
      },
    ],
    whereFound:
      'Everywhere, and heavily in newer construction — Irvine\'s eastern villages, Tustin Legacy, Baker Ranch and Portola Hills in Lake Forest, Blackstone and La Floresta in Brea. In north-county homes the hard water shortens the interval between descaling noticeably.',
    partsNote:
      'Excellent availability and sensible pricing. Drain pumps, latches and seals are common enough to ride on the van, so a large share of Bosch dishwasher calls finish on the first visit.',
    authorisedNote:
      'New-build kitchens in this county are full of Bosch that is still inside its manufacturer warranty. Check before booking us — if it is covered, that repair should not cost you anything.',
    faq: [
      {
        q: 'What does E15 actually mean on my Bosch dishwasher?',
        a: 'Water has reached the base pan and the float has cut the machine off to stop a leak becoming a flood. It tells you water escaped, not where from. Tipping the machine to drain the pan will clear the code and the fault will return, because the leak is still there — the repair is finding it.',
      },
      {
        q: 'Why are my dishes still wet at the end of a cycle?',
        a: 'Bosch dries by condensation rather than with a heating element, so plastics staying damp is normal and not a fault. Use rinse aid, and open the door once the cycle ends. If drying has genuinely got worse over time, scale from hard water is the usual culprit.',
      },
      {
        q: 'Is a Bosch dishwasher worth repairing, or should I replace it?',
        a: 'Repair, in most cases. The common failures — drain pump, latch, seals — are inexpensive parts on a machine that otherwise has years left. We give you the figure against a replacement and say plainly when replacement is the better spend.',
      },
    ],
    seo: {
      title: 'Bosch Repair Orange County | Same-Day',
      description:
        'Bosch dishwasher, laundry and oven repair across Orange County — E15 faults, drain pumps, door latches. Same-day service, 90-day warranty. Call (949) 749-0006.',
    },
  },

  // ---------------------------------------------------------------------------
  // Mainstream. The volume end of the trade: Samsung, Whirlpool and GE together
  // account for roughly three in five branded service calls nationally, and
  // nothing above this line is what most of Orange County actually owns.
  // ---------------------------------------------------------------------------

  {
    slug: 'samsung',
    name: 'Samsung',
    tier: 'mainstream',
    summary: 'The most-called brand in the trade, and the ice maker behind it.',
    positioning:
      'Samsung takes more service calls than any other brand in the country — a little over a fifth of everything with a badge on it — and that is a function of how many were sold rather than of how badly they are built. What it means practically is that the failures are extremely well mapped. On the French-door refrigerators one fault dominates everything else, and a technician who has not seen it a hundred times will chase the wrong part for an afternoon.',
    categories: ['French-door refrigerators', 'Front-load washers', 'Dryers', 'Ranges', 'Dishwashers', 'Over-range microwaves'],
    lines: ['RF French Door', 'RS Side-by-Side', 'Bespoke', 'Family Hub', 'WF / WA laundry', 'FlexWash'],
    faults: [
      {
        symptom: 'Ice maker frosts into a solid block, then stops',
        cause:
          'The defining Samsung fault, and the single most common reason we are called to this brand. On the RF French-door refrigerators the ice compartment is inside the fresh-food cabinet, warm humid air reaches the auger and the whole assembly ices over. Melting it out buys a few weeks and no more — the repair is the duct and seal work that stops the air getting there, and on some model years a revised ice maker assembly.',
      },
      {
        symptom: 'Fridge side warm, freezer fine, and a ticking or fluttering noise',
        cause:
          'Ice has built up on the evaporator behind the back panel until the fan blade is striking it. Behind that is usually a defrost heater, defrost sensor or control fault. The noise is the useful part of the complaint: it tells us where to go before anything comes apart.',
      },
      {
        symptom: 'Front-load washer stops mid-cycle with water still in the drum',
        cause:
          'The drain pump filter, nine times out of ten, and it is behind the small hatch at the bottom front. Coins, hair clips and underwire collect there. It is one of the few repairs we will walk a customer through on the phone rather than charge for.',
      },
      {
        symptom: 'Washer will not spin and reports an unbalanced load on every cycle',
        cause:
          'Genuine imbalance first — a single heavy item, or a machine that is not level. Where the load is fine, it is the suspension rods or the tub bearing, and on a machine past seven or eight years that is the point where the repair figure and a replacement figure need looking at together.',
      },
      {
        symptom: 'Persistent smell from a front-load washer',
        cause:
          'Biofilm in the door bellows and the detergent drawer, not a fault in the machine. It is a design consequence of a watertight door and low-temperature washing. Cleaning it properly fixes it; a new machine gets there in eighteen months.',
      },
      {
        symptom: 'Refrigerator not cooling at all and the compressor is silent or short-cycling',
        cause:
          'The digital inverter compressor or its board. Read the warranty note below before anyone touches this — Samsung covers the compressor for ten years, and letting the wrong person open the sealed system ends that.',
      },
    ],
    whereFound:
      'Everywhere in the county and disproportionately in anything built or refitted in the last decade — the eastern Irvine villages, Tustin Legacy, Baker Ranch, and almost every apartment and rental package in Santa Ana, Anaheim and Costa Mesa. It is also the brand we most often find still inside a manufacturer warranty nobody has checked.',
    partsNote:
      'Availability is excellent and pricing is reasonable. Ice maker assemblies, drain pumps, defrost heaters and door bellows are all common enough to carry, which is why a large share of Samsung calls finish on the first visit rather than in two.',
    authorisedNote:
      'Samsung warrants the digital inverter compressor for ten years on most refrigerators — but the part only, and only through their own service network. If your fridge has stopped cooling and the compressor is the suspect, call Samsung before you call anyone independent, ourselves included. We will tell you that on the phone rather than take the job, because a compressor we fit is a warranty you no longer have. Everything outside the sealed system — ice makers, fans, heaters, boards, laundry — we handle normally.',
    faq: [
      {
        q: 'My Samsung ice maker keeps freezing up. Is there a permanent fix?',
        a: 'There is, and it is not another defrost. Steaming the ice out clears it for a few weeks because the warm air that caused it is still getting in. The lasting repair is sealing that path — the duct, the shroud and the gasket work around the compartment, plus a revised ice maker on some model years. Ask whoever quotes you which of those they are doing; if the answer is only "defrost and replace the ice maker", you will be calling again.',
      },
      {
        q: 'Samsung says my compressor is covered for ten years. Can you do it?',
        a: 'We can, and you should not let us. That warranty pays for the part and only through Samsung\'s own network — an independent repair voids what is left of it. Call Samsung first. If they tell you the unit is out of coverage or the labour quote is unreasonable, come back to us and we will give you a straight second figure.',
      },
      {
        q: 'Is a Samsung worth repairing, or should I just replace it?',
        a: 'For the common faults — ice maker, drain pump, defrost heater, bellows — repair, comfortably. These are inexpensive parts on machines with years left. The line moves when it is the sealed system or a tub bearing on a machine past seven years; then we put both numbers in front of you and say which we would spend.',
      },
      {
        q: 'What does the code on my display mean?',
        a: 'Enough that it is worth its own page — Samsung is more informative than most about what has gone wrong, and two of the most common displays are not faults at all. See our Samsung error codes.',
      },
    ],
    seo: {
      title: 'Samsung Appliance Repair Orange County | Same-Day',
      description:
        'Samsung refrigerator, washer and dryer repair across Orange County — ice maker freeze-ups, drain faults, defrost and error codes. Same-day service. Call (949) 749-0006.',
    },
  },

  {
    slug: 'whirlpool',
    name: 'Whirlpool',
    tier: 'mainstream',
    summary: 'Four badges, one parts bin — and the most repairable machines sold.',
    positioning:
      'Whirlpool builds Whirlpool, Maytag, KitchenAid and Amana, and much of what wears the Kenmore name as well. That single fact does more for a repair than anything about the brand itself: platforms, parts and diagnostic routines carry across, so a fault on a Maytag top-loader and the same fault on a Whirlpool are the same job with a different sticker. These are also, straightforwardly, the easiest mainstream machines in the country to get parts for — which is why the repair-or-replace answer here leans towards repair more often than it does anywhere else at this price.',
    categories: ['Top-load washers', 'Front-load washers', 'Dryers', 'Refrigerators', 'Dishwashers', 'Ranges'],
    lines: ['Cabrio', 'Duet', 'VMW top-load platform', 'WRF / WRS refrigerators', 'Gold Series'],
    faults: [
      {
        symptom: 'Top-load washer fills, drains, but the drum never turns',
        cause:
          'The shift actuator on the direct-drive top-load platform. It is a small, cheap part and it is behind a large share of "the washer is dead" calls on machines built since about 2010. Frequently misdiagnosed as a motor or a transmission, which is a very different bill.',
      },
      {
        symptom: 'Cycle stalls with water in the drum and reports a drain fault',
        cause:
          'The drain pump or what is caught in it. On front-loaders the coin trap is reachable; on the top-load platform it usually means the pump comes off. Either way the pump is rarely faulty in itself — something got into it.',
      },
      {
        symptom: 'Machine will not start and the lid or door lock clicks repeatedly',
        cause:
          'The lid lock assembly. A known wear item across the top-load platform, contained and inexpensive, and the machine is designed to refuse to run rather than spin with the lid unsecured.',
      },
      {
        symptom: 'Dryer runs, drum turns, no heat',
        cause:
          'A blown thermal fuse — and that is the symptom, not the cause. The fuse opens because the machine overheated, and the machine overheated because the vent is restricted. Replacing the fuse without clearing the duct gets you a working dryer for about a fortnight. We check the run before we fit the part.',
      },
      {
        symptom: 'Dishwasher leaving grit on everything',
        cause:
          'The filter. Whirlpool dropped the hard-food chopper from most models in favour of a manual filter, which is quieter and needs cleaning every few weeks — and almost nobody is told that at the point of sale. A genuine fault here is the chopper or the wash pump on older units.',
      },
      {
        symptom: 'Refrigerator warm on the fresh-food side, freezer still cold',
        cause:
          'The evaporator fan or the defrost circuit. On the side-by-sides it is often the damper control that has stuck rather than anything electrical, which is a smaller repair than the symptom suggests.',
      },
    ],
    whereFound:
      'Concentrated in the county\'s older housing stock and in anything bought on price — north county especially, so Fullerton, Anaheim, Buena Park, La Habra, Garden Grove and Westminster, and heavily through Santa Ana. Also the default in rental and property-managed units across the whole county, where the deciding factor is parts availability rather than badge.',
    partsNote:
      'The best parts situation of any brand we work on, by a distance. Actuators, lid locks, drain pumps, thermal fuses and door gaskets are cheap, universally stocked and ride on the van. Even machines fifteen years old are usually still fully supported.',
    authorisedNote:
      'Whirlpool\'s standard warranty is one year on most products, so the great majority of what we see is out of coverage and ours to work on normally. If yours is newer than that, or you bought an extended plan through the retailer, check it first — that repair should not be costing you anything.',
    faq: [
      {
        q: 'My Whirlpool washer fills and drains but will not agitate. Is that the transmission?',
        a: 'Almost never, and this is the diagnosis worth getting right. On the direct-drive top-load platform that exact set of symptoms points at the shift actuator — a part that costs a fraction of what a transmission does. Anyone quoting you a gearcase for it should be asked to show you the actuator test first.',
      },
      {
        q: 'The dryer keeps blowing its thermal fuse. Why does it keep happening?',
        a: 'Because the fuse is doing its job. It opens when the machine overheats, and the machine overheats when the exhaust cannot get out — a crushed duct, a long roof run, or a bird\'s nest in the wall cap. Fitting a new fuse without clearing the vent means fitting another one shortly after. We clear the run as part of the repair, and if it needs a proper clean we say so.',
      },
      {
        q: 'Is Maytag the same as Whirlpool now?',
        a: 'Built by the same company since 2006, and on the laundry side sharing much of the same platform. It matters in your favour: parts are interchangeable in places and there is no scarcity problem hiding behind the badge.',
      },
      {
        q: 'My dishwasher is not getting things clean. Is it worth fixing?',
        a: 'Check the filter in the base first — most models since about 2013 have one that needs pulling out and rinsing, and a clogged filter produces exactly this complaint. If it is clean and the problem stands, it is the wash pump or the spray arm feed, and on a Whirlpool that is a repair worth doing rather than a reason to replace the machine.',
      },
    ],
    seo: {
      title: 'Whirlpool Appliance Repair Orange County | Same-Day',
      description:
        'Whirlpool washer, dryer, refrigerator and dishwasher repair across Orange County — shift actuators, drain pumps, lid locks, F21 and Sud codes. Call (949) 749-0006.',
    },
  },

  {
    slug: 'ge',
    name: 'GE',
    tier: 'mainstream',
    summary: 'In more Orange County kitchens than anything else, across forty years of them.',
    positioning:
      'GE has been the default American kitchen since long before most of this county was built, which means we open a wider spread of ages on this badge than on any other — a 1990s wall oven in an Orange tract home and a current Café range in an Irvine remodel are both GE and share almost nothing. The company was sold to Haier in 2016; the practical effect has been better parts supply rather than worse, and the Profile, Café and Monogram tiers above the base line are genuinely different machines rather than trim levels.',
    categories: ['Refrigerators', 'Wall ovens', 'Ranges', 'Dishwashers', 'Washers & dryers', 'Over-range microwaves'],
    lines: ['GE', 'Profile', 'Café', 'Monogram', 'Adora', 'GTW / GFW laundry'],
    faults: [
      {
        symptom: 'No water or ice at the door, and no obvious leak',
        cause:
          'The water inlet valve, which is the highest-turnover part on GE refrigeration by some margin. Cold garages and cold laundry rooms make it worse — a partially frozen supply line reads exactly the same way from the front of the machine.',
      },
      {
        symptom: 'Bottom-freezer French door not making ice, or making it slowly',
        cause:
          'The ice maker module or its fill tube frozen shut. On the bottom-freezer designs the fill tube runs a long way and a small heater keeps it clear; when that heater goes, ice production tails off rather than stopping outright, which is why it is often left for months.',
      },
      {
        symptom: 'Wall oven dead, or the display lit but unresponsive',
        cause:
          'The control board — specifically the relays on it — or the touch membrane in front of it. On GE wall ovens these two produce almost identical complaints and are wildly different in cost, so testing before ordering is the whole job.',
      },
      {
        symptom: 'Oven will not hold the set temperature',
        cause:
          'The temperature sensor or the bake element. The sensor is a resistance check that takes two minutes and rules out the more expensive answer, and we do it before quoting anything.',
      },
      {
        symptom: 'Dishwasher will not drain, or drains into the sink and back',
        cause:
          'The drain pump, or the air gap and disposal knockout plug. On a dishwasher fitted during a kitchen remodel the knockout plug left in the disposal is a genuinely common cause and costs nothing to fix — worth ruling out before anybody buys a pump.',
      },
      {
        symptom: 'Fridge running constantly with frost building at the back of the freezer',
        cause:
          'The defrost heater, sensor or control. Standard refrigeration diagnosis, but GE\'s older adaptive defrost boards fail in a way that mimics a heater fault, so both get tested.',
      },
    ],
    whereFound:
      'The county\'s broadest footprint, weighted to its older neighbourhoods — Orange, Santa Ana, Garden Grove, Westminster, Fullerton, Costa Mesa and the mid-century tracts of Huntington Beach, where the original kitchens were GE and many still are. Café and Monogram turn up in the newer Irvine and Newport remodels instead.',
    partsNote:
      'Good across the current range and better than expected on older units — inlet valves, sensors, elements and ice maker modules are all readily available. Control boards for wall ovens from the 1990s are the genuine scarcity, and where one has gone we say so before starting rather than after.',
    authorisedNote:
      'Most GE products carry a one-year manufacturer warranty and Monogram carries longer, with sealed-system coverage beyond that on some refrigeration. If yours is recent, or is a Monogram, check the coverage before booking anyone including us.',
    faq: [
      {
        q: 'My GE fridge stopped dispensing water. Is it the filter?',
        a: 'Change the filter first — it is the cheapest thing it can be and it is overdue on most machines we see. If a fresh filter changes nothing, it is the inlet valve or a frozen supply line, and which of those it is depends on where the fridge sits. A unit in an unheated garage in January is a different diagnosis from one in the kitchen.',
      },
      {
        q: 'My wall oven is completely dead. Is the whole thing finished?',
        a: 'Usually not. A dead GE wall oven is most often the control board or the touch membrane, both replaceable, and the cavity and elements behind them are typically fine. The real question is age: on boards from the early 1990s availability is genuinely thin, and we will tell you that on the phone rather than after taking it apart.',
      },
      {
        q: 'Is a GE Café or Profile different to repair from a base GE?',
        a: 'Yes, and mostly for the better. The upper tiers use more capable components and more electronics — dual-fuel ranges, more sensors, more board. Diagnosis leans further towards testing and further from swapping, and parts pricing sits above the base line without approaching the built-in brands.',
      },
      {
        q: 'How do I know which GE I actually have?',
        a: 'The model and serial plate — inside the fridge on the left wall, on the oven door frame, or on the dishwasher door edge. Photograph it and send it with the booking. On a brand with forty years of designs in service that one photo often decides what we bring on the van.',
      },
    ],
    seo: {
      title: 'GE Appliance Repair Orange County | Same-Day',
      description:
        'GE, Profile, Café and Monogram repair across Orange County — refrigerator inlet valves, ice makers, wall oven control boards and dishwashers. Call (949) 749-0006.',
    },
  },

  {
    slug: 'lg',
    name: 'LG',
    tier: 'mainstream',
    summary: 'Direct Drive and the linear compressor — the good half and the notorious one.',
    positioning:
      'LG built two things nobody else did, and they have gone in opposite directions. Direct Drive put the motor straight onto the drum with no belt and no pulley, which took the most common laundry failure out of the machine entirely and is the reason these washers run as long as they do. The linear compressor did the same trick for refrigeration and became the most litigated component in the industry — a class-action settlement in 2020 covered certain 2014–2017 refrigerators after a wave of failures. Knowing which of those two stories your machine belongs to is the first thing worth establishing.',
    categories: ['French-door refrigerators', 'Front-load washers', 'Top-load washers', 'Dryers', 'Ranges', 'Dishwashers'],
    lines: ['Direct Drive laundry', 'TurboWash', 'WashTower', 'InstaView', 'Craft Ice', 'Studio'],
    faults: [
      {
        symptom: 'Refrigerator stops cooling entirely, freezer and fridge both warm',
        cause:
          'The linear compressor or its inverter board, and this is the fault that made the brand\'s reputation in the wrong direction. Read the warranty note below before letting anybody open it — LG covers the compressor for ten years and only through their own network. The inverter board, which produces the identical symptom, is not sealed-system work and is a far smaller repair.',
      },
      {
        symptom: 'Washer stops mid-cycle with an unbalanced-load message on every attempt',
        cause:
          'Load distribution first, and it is genuinely the answer more often than not — a single bath mat will do it. Where the load is fine it is the shock absorbers or the tub bearing, and Direct Drive makes the bearing more accessible than on a belt machine of the same age.',
      },
      {
        symptom: 'Washer will not drain and stops with water in the drum',
        cause:
          'The drain pump filter behind the lower access panel, and a customer can usually reach it themselves. Where the filter is clear it is the pump or the pressure sensor.',
      },
      {
        symptom: 'Washer stops before spinning and reports a locked motor',
        cause:
          'The rotor position sensor on the Direct Drive stator, not the motor itself. This is the fault that most often gets quoted as a motor replacement when it is a sensor and a set of bolts.',
      },
      {
        symptom: 'Dryer showing a flow figure — D80, D90 or D95 — and taking two cycles to dry',
        cause:
          'Not an error at all. LG dryers measure exhaust restriction and report it as a percentage blocked, and a D95 is the machine telling you the duct is nearly shut. The repair is the vent run, not the dryer, and clearing it usually restores the original cycle time completely.',
      },
      {
        symptom: 'Ice maker producing little or nothing on a French-door unit',
        cause:
          'The fill tube, the ice maker fan or the assembly itself depending on model. On Craft Ice units the round-ice mould has its own failure mode and its own part, so identifying which system is out matters before ordering anything.',
      },
    ],
    whereFound:
      'Heavily in newer construction and in anything refitted in the last decade — the eastern Irvine villages, Baker Ranch, Tustin Legacy, Rancho Mission Viejo — and very widely in apartments and condos across Costa Mesa, Anaheim and Santa Ana, where the stacked and WashTower laundry fits where nothing else does.',
    partsNote:
      'Good availability on everything outside the sealed system: drain pumps, rotor sensors, door gaskets, ice maker assemblies and inverter boards are all obtainable without a wait. Compressors are a different matter and are usually a warranty conversation rather than a parts one.',
    authorisedNote:
      'LG warrants the linear compressor for ten years on most refrigerators — the part, through their own service network. If your fridge has stopped cooling, call LG before you call us. Certain 2014–2017 models were also covered by a class-action settlement with extended terms; if yours is that vintage it is worth checking whether you are inside it. We will not fit a compressor into a machine that still has coverage on it, and we will say so on the phone rather than after arriving.',
    faq: [
      {
        q: 'My LG fridge stopped cooling. Is it the linear compressor everyone talks about?',
        a: 'It might be, and it might equally be the inverter board that drives it — they produce the same symptom and are very different repairs. Establish the compressor warranty position first: LG covers it for ten years through their own network, and certain 2014–2017 models had extended coverage on top of that. Call LG, get their answer, and then come to us if there is a bill worth a second opinion.',
      },
      {
        q: 'My dryer says D90. What part does it need?',
        a: 'None. That is LG telling you the exhaust duct is about ninety per cent restricted, and it is a measurement rather than a fault. Clear the vent run — from the machine to the wall cap, not just the first few feet — and the reading drops and the drying times come back. If the duct is genuinely long or has a roof termination, it is worth having done properly.',
      },
      {
        q: 'The washer says the motor is locked. Do I need a new motor?',
        a: 'Usually not. On Direct Drive machines that message most often comes from the rotor position sensor on the stator, which is a modest part and an accessible one. A motor quote for this fault deserves a second opinion, and we are happy to be it.',
      },
      {
        q: 'What do the letters on my LG display mean?',
        a: 'They are a reasonably logical system once you know it, and two of the most alarming ones are not faults — CL is a child lock and D80 upwards is a vent measurement. We have written them all out on our LG error codes page.',
      },
    ],
    seo: {
      title: 'LG Appliance Repair Orange County | Same-Day',
      description:
        'LG refrigerator, washer and dryer repair across Orange County — Direct Drive faults, drain and rotor sensors, D80/D90 vent restriction, OE and UE codes. Call (949) 749-0006.',
    },
  },

  {
    slug: 'maytag',
    name: 'Maytag',
    tier: 'mainstream',
    summary: 'Whirlpool-built since 2006 — and the older ones are a different machine.',
    positioning:
      'Maytag earned its reputation on machines it no longer builds. Whirlpool acquired the company in 2006 and the current products sit on Whirlpool platforms, sharing parts and diagnostic routines with the badge above them. This is not a criticism — it is the reason parts are cheap and available — but it does mean the answer to "are these still the ones that last forever" is honestly no, they are good mainstream machines. What genuinely does carry over is the heavy-duty commercial-grade laundry line, which is built to a different standard from the rest of the range.',
    categories: ['Top-load washers', 'Front-load washers', 'Dryers', 'Refrigerators', 'Dishwashers', 'Ranges'],
    lines: ['Bravos', 'Centennial', 'Maytag Commercial Technology', 'Neptune (pre-2006)', 'MVW / MED laundry'],
    faults: [
      {
        symptom: 'Washer fills and drains but the drum will not move',
        cause:
          'The shift actuator, shared with the Whirlpool top-load platform. Small part, common failure, and routinely misquoted as a transmission. The test that separates them takes minutes.',
      },
      {
        symptom: 'Machine stops with a drain fault and water in the tub',
        cause:
          'The drain pump or an obstruction in it. On the Bravos platform the pump is reachable without pulling the machine apart, which keeps this a short visit.',
      },
      {
        symptom: 'Lid will not lock, or locks and the cycle never begins',
        cause:
          'The lid lock assembly — a wear item across the platform and an inexpensive one. The machine refusing to run is by design rather than a secondary fault.',
      },
      {
        symptom: 'Spin cycle rocks the machine hard, or reports imbalance repeatedly',
        cause:
          'Suspension rods. They wear as a set and replacing one is false economy, so we quote the set. On commercial-technology models the suspension is heavier and this shows up much later in the machine\'s life.',
      },
      {
        symptom: 'Dryer turns without heating',
        cause:
          'Thermal fuse, and as on every Whirlpool-built dryer it opened because the exhaust is restricted. The duct gets checked as part of the repair — a fuse fitted into a blocked vent is a return visit waiting to happen.',
      },
      {
        symptom: 'Older Neptune front-loader with a control or door fault',
        cause:
          'Pre-2006 Neptune machines are their own thing and predate the Whirlpool platform entirely. Some parts are genuinely scarce now. We will look, but we say honestly at the outset that this is the one Maytag family where sourcing can end the conversation.',
      },
    ],
    whereFound:
      'Strong through north and central county — Fullerton, Anaheim, Buena Park, Orange, Garden Grove — and in laundry rooms rather than kitchens, since the laundry is where the brand still sells hardest. The commercial-technology washers turn up in small apartment buildings and in homes where the last machine was worn out rather than replaced on style.',
    partsNote:
      'Excellent, because they are Whirlpool parts. Actuators, lid locks, pumps, suspension rods and fuses are all cheap and stocked. The exception is the pre-2006 Neptune line, where some components have genuinely gone.',
    authorisedNote:
      'Standard coverage is one year, with longer limited terms on some commercial-technology laundry components. Most of what we see is well outside it. If yours is new or you hold a retailer plan, use it first.',
    faq: [
      {
        q: 'Is a modern Maytag still built like the old ones?',
        a: 'No, and it is fairer to say the whole market moved than that Maytag declined. Whirlpool has built them since 2006 on shared platforms. The upside is real: parts are cheap, available and interchangeable, so repairs on these machines are among the most economical we quote.',
      },
      {
        q: 'What is Maytag Commercial Technology actually?',
        a: 'A heavier motor, heavier suspension and a longer component warranty on the models that carry the badge. It is a genuine specification difference rather than a sticker, and it shows in how late in life we start seeing suspension and bearing work on those machines.',
      },
      {
        q: 'My Maytag washer will not agitate. How much is this going to be?',
        a: 'Probably far less than you are bracing for. That symptom on the top-load platform points at the shift actuator, which is a modest part and a contained job. We test it before quoting, and if it genuinely is the gearcase we will show you why.',
      },
      {
        q: 'Do you work on old Neptune washers?',
        a: 'We will look at them, with one caveat we give upfront: these predate the Whirlpool platform and some parts are no longer made. If yours needs one of those we will tell you at diagnosis rather than after ordering, and you will not be paying us to discover it slowly.',
      },
    ],
    seo: {
      title: 'Maytag Repair Orange County | Washers & Dryers',
      description:
        'Maytag washer, dryer and refrigerator repair across Orange County — shift actuators, lid locks, suspension rods, thermal fuses. Same-day service. Call (949) 749-0006.',
    },
  },

  {
    slug: 'kitchenaid',
    name: 'KitchenAid',
    tier: 'mainstream',
    summary: 'Whirlpool\'s kitchen badge — and the county\'s most common upgrade dishwasher.',
    positioning:
      'KitchenAid is where Whirlpool puts its better kitchen engineering, and in Orange County that shows up overwhelmingly as dishwashers: it is the standard step-up from a builder-grade machine in Irvine, Tustin and Lake Forest kitchens, one tier below where Bosch and Thermador sit. The stainless tub, the third rack and the quieter wash system are genuine differences rather than trim. The advantage at repair time is that underneath it is a Whirlpool, so the parts situation is far better than the badge would suggest.',
    categories: ['Dishwashers', 'Wall ovens', 'Ranges', 'Built-in refrigeration'],
    lines: ['KDTM / KDPM dishwashers', 'Architect Series II', 'Superba', 'KOSE wall ovens', 'Commercial-Style ranges'],
    faults: [
      {
        symptom: 'Dishwasher stops part-way and the clean light blinks a pattern',
        cause:
          'The blink pattern is a code and worth reading before anything is opened. Most commonly it points at the flow meter, the drain path or the heater circuit, and those are three quite different repairs behind one symptom.',
      },
      {
        symptom: 'Standing water in the base after every cycle',
        cause:
          'The drain pump, the check valve, or the disposal knockout plug left in place at installation. On a dishwasher fitted during a remodel we check the plug first — it costs nothing and it is the answer more often than people expect.',
      },
      {
        symptom: 'Dishes coming out dirty despite a full cycle',
        cause:
          'The chopper or the wash pump on older units, the filter on newer ones. Like Whirlpool, KitchenAid moved to a manual filter that needs rinsing every few weeks, and almost nobody is told at the point of sale.',
      },
      {
        symptom: 'Nothing dries, or the heat-dry option does nothing',
        cause:
          'The heating element or its relay on the control board. Worth separating from the Bosch complaint people compare it to: KitchenAid does use an element, so wet dishes here genuinely are a fault rather than the design.',
      },
      {
        symptom: 'Wall oven control unresponsive or the display dead',
        cause:
          'The control board or the touch membrane, the same pairing as on GE wall ovens and with the same rule — test before ordering, because the cost gap between them is large.',
      },
      {
        symptom: 'Built-in refrigerator not holding temperature',
        cause:
          'Condenser airflow first. The Architect built-ins are installed tight into cabinetry and the coil clearance is the most common cause we find, exactly as on the premium built-ins.',
      },
    ],
    whereFound:
      'The builder upgrade across newer Irvine and Tustin kitchens — Orchard Hills, Stonegate, Portola Springs, Tustin Legacy — plus Baker Ranch and Portola Hills in Lake Forest, and a great many Mission Viejo and Laguna Niguel remodels. A lot of it is young enough to still be in warranty, which is worth checking before booking anyone.',
    partsNote:
      'Very good, because the parts bin is Whirlpool\'s. Drain pumps, flow meters, heating elements, latches and racks are all readily available and sensibly priced — which is the practical argument for repairing rather than replacing one of these.',
    authorisedNote:
      'KitchenAid carries a one-year manufacturer warranty with longer limited terms on some components, and a lot of what we see in the newer Irvine villages is still inside it. Check before booking us; if it is covered, that repair should cost you nothing.',
    faq: [
      {
        q: 'The clean light on my KitchenAid dishwasher is blinking. What does that mean?',
        a: 'It is a code rather than a general complaint, and the pattern matters — it separates a flow meter fault from a drain problem from a heater circuit, which are three different bills. Count the blinks and the pauses before calling, or send us a short video; it genuinely shortens the visit. Our KitchenAid error codes page lists what the common ones point at.',
      },
      {
        q: 'Is a KitchenAid dishwasher just a Whirlpool in a nicer case?',
        a: 'It shares a great deal of the platform, and that works in your favour at repair time. The differences that matter — the stainless tub, the third rack, the sound insulation and a more capable wash system — are real, but the parts underneath are Whirlpool parts, which is why fixing one is far cheaper than the badge implies.',
      },
      {
        q: 'My dishes are coming out wet. Is that normal like it is on a Bosch?',
        a: 'No, and that is a useful distinction. Bosch dries by condensation and damp plastics are expected; KitchenAid uses a heating element, so if nothing is drying, something has failed — usually the element or its relay. It is a repairable fault, not a design characteristic.',
      },
      {
        q: 'Is it worth repairing a ten-year-old KitchenAid dishwasher?',
        a: 'Usually yes. The common failures are inexpensive parts on a machine with a stainless tub that has not aged, and we would rather fit a drain pump than sell you the idea of a new machine. Where the wash motor has gone on a unit that old, we will put both figures in front of you and say which we would spend.',
      },
    ],
    seo: {
      title: 'KitchenAid Repair Orange County | Dishwashers & Ovens',
      description:
        'KitchenAid dishwasher, wall oven and built-in refrigerator repair across Orange County — drain pumps, flow meters, heating elements, blink codes. Call (949) 749-0006.',
    },
  },

  {
    slug: 'frigidaire',
    name: 'Frigidaire',
    tier: 'mainstream',
    summary: 'The county\'s rental and builder-package default, and cheap to keep running.',
    positioning:
      'Frigidaire is Electrolux\'s volume badge, and in Orange County it is overwhelmingly what came with the apartment. Builder packages, rental units and investor remodels are full of it, which shapes every repair conversation on this brand: the machines are inexpensive, the parts are inexpensive, and the deciding question is almost always how fast rather than how much. That suits us — most Frigidaire faults are common, well documented and finishable on the first visit.',
    categories: ['Refrigerators', 'Ranges', 'Dishwashers', 'Washers & dryers', 'Over-range microwaves', 'Window and wall AC'],
    lines: ['Gallery', 'Professional', 'Frigidaire (base)', 'FGHB / FFHB refrigerators', 'Affinity laundry'],
    faults: [
      {
        symptom: 'Fridge not cold enough with the freezer working normally',
        cause:
          'The evaporator fan or the damper. Frigidaire French-door units report an evaporator fan fault directly on the display on many models, which makes this one of the faster diagnoses in the trade when the code is read rather than ignored.',
      },
      {
        symptom: 'Ice maker not filling, or water at the door has stopped',
        cause:
          'The water inlet valve, and it is the highest-turnover part on this brand\'s refrigeration. Cheap, quick, and usually the whole visit.',
      },
      {
        symptom: 'Oven runs wildly hot, or shuts down with a temperature fault',
        cause:
          'The electronic oven control board or the temperature probe. Frigidaire\'s control board is a known failure point across the range and the codes it throws are specific enough to separate a runaway temperature from a shorted keypad before anything is ordered.',
      },
      {
        symptom: 'Oven keypad unresponsive or a button appears stuck',
        cause:
          'The membrane rather than the board behind it — a much smaller repair, and one that gets misdiagnosed in the other direction routinely because both faults present as a dead panel.',
      },
      {
        symptom: 'Front-load washer stops mid-cycle with a drain or fill fault',
        cause:
          'The drain pump filter or the inlet screens. On the Affinity platform both are accessible and both are usually obstruction rather than failure.',
      },
      {
        symptom: 'Dishwasher not draining or not cleaning',
        cause:
          'The drain pump or the wash impeller. Straightforward parts on this brand, and rarely worth replacing the machine over.',
      },
    ],
    whereFound:
      'Wherever the appliance package came with the unit — the apartment stock across Santa Ana, Anaheim, Costa Mesa, Buena Park, Stanton and Garden Grove, and a large share of the county\'s managed rental property. Also common in second kitchens and garage refrigerators throughout the county.',
    partsNote:
      'Inexpensive and widely stocked. Inlet valves, evaporator fans, control boards, membranes and drain pumps are all easy to source, which is the reason a Frigidaire repair usually makes financial sense even on a machine that was cheap to begin with.',
    authorisedNote:
      'One-year manufacturer coverage on most products. If the appliance came with a new build or a new apartment fit-out it may still be inside it, and in a rental the landlord or management company may hold a service contract that covers the call entirely — worth one phone call before you pay for anything yourself.',
    faq: [
      {
        q: 'My Frigidaire fridge is showing SY EF. What is that?',
        a: 'The evaporator fan circuit, and it is a genuinely helpful code — it tells us where to go before anything comes apart. The fan itself, its wiring or the control are the candidates, and it is a contained repair rather than a sealed-system problem. Our Frigidaire error codes page lists the rest of the set.',
      },
      {
        q: 'The oven display is dead. Board or keypad?',
        a: 'They look identical from the front and cost very differently, which is exactly why we test rather than guess. A stuck-key fault points at the membrane; a temperature or EEPROM fault points at the board. Anyone quoting a control board without having tested for a stuck key is guessing with your money.',
      },
      {
        q: 'It is a rental. Who pays for this?',
        a: 'Often not you. Appliances that came with the unit are usually the landlord\'s responsibility, and many management companies hold service contracts. Ask before booking — and if they would rather we invoiced them directly, we do that regularly and it is no trouble.',
      },
      {
        q: 'Is a cheap Frigidaire worth repairing at all?',
        a: 'More often than people assume, because the parts are as inexpensive as the machine. An inlet valve or an evaporator fan on a five-year-old fridge is comfortably worth doing. Where it stops being worth it is a sealed-system fault on a base-model unit, and we will say that plainly instead of quoting you a repair that approaches the price of a new one.',
      },
    ],
    seo: {
      title: 'Frigidaire Repair Orange County | Same-Day',
      description:
        'Frigidaire refrigerator, oven, dishwasher and laundry repair across Orange County — inlet valves, evaporator fans, oven control boards, SY EF and F10 codes. Call (949) 749-0006.',
    },
  },

  {
    slug: 'electrolux',
    name: 'Electrolux',
    tier: 'mainstream',
    summary: 'Frigidaire\'s engineering, moved upmarket — and a laundry pair that rewards it.',
    positioning:
      'Electrolux and Frigidaire come from the same company and share more than either markets, which is genuinely useful at repair time: platforms, control architecture and a good deal of the parts catalogue carry across, so a technician who knows one is not starting from nothing on the other. Where they diverge is specification. The Electrolux badge goes on the better laundry and the French-door refrigeration, and the machines are built to a standard that puts them between the mainstream and the built-in brands rather than squarely in either.',
    categories: ['French-door refrigerators', 'Front-load washers', 'Dryers', 'Wall ovens', 'Dishwashers'],
    lines: ['ICON', 'Perfect Steam laundry', 'EI / ELFW washers', 'EW French-door refrigeration', '500 / 700 Series'],
    faults: [
      {
        symptom: 'Steam dryer not producing steam, or a cycle that calls for it fails',
        cause:
          'The inlet water valve on the steam circuit. This is a distinctly Electrolux call because the steam function is standard across the laundry line where competitors treat it as an upgrade — and a valve that has stopped feeding it takes the cycle down with it.',
      },
      {
        symptom: 'Front-load washer stops with water in the drum',
        cause:
          'The drain pump or its filter, and on this platform the filter is behind the lower access door and reachable. Where the filter is clean, the pump or the pressure sensor is next.',
      },
      {
        symptom: 'Water on the floor under a front-loader',
        cause:
          'The door bellows, usually at the bottom fold where debris collects and works a hole through it. A contained repair, and a preventable one — the fold wants wiping out occasionally.',
      },
      {
        symptom: 'French-door fridge cooling unevenly or reporting a fan fault',
        cause:
          'The evaporator fan or the defrost circuit, and the fault codes are the Frigidaire set — SY EF and its relatives — so diagnosis is direct rather than exploratory.',
      },
      {
        symptom: 'Ice maker in the door producing little or nothing',
        cause:
          'The fill tube icing shut or the ice maker assembly. Door-mounted ice makers run their supply a long way through a cold path, and that path is where this fault usually lives.',
      },
      {
        symptom: 'Wall oven temperature drifting or the display showing a sensor fault',
        cause:
          'The temperature probe or the control. A resistance check on the probe separates the two in a couple of minutes and saves ordering the wrong thing.',
      },
    ],
    whereFound:
      'Considered remodels rather than builder packages — Costa Mesa, Newport Heights, Old Towne Orange, Tustin, and the mid-range Irvine and Mission Viejo refits where the buyer wanted better than the base package without going to Miele money. The laundry pairs turn up far more often than the kitchen products do.',
    partsNote:
      'Good, and helped considerably by the shared Frigidaire catalogue — inlet valves, drain pumps, bellows and fans are all obtainable quickly. Some ICON-specific trim and panel parts run longer, and we quote the real timeline before ordering rather than after.',
    authorisedNote:
      'One-year manufacturer coverage as standard with longer limited terms on some components. Check yours before booking anyone including us — and if the machines went in with a recent remodel, the installer\'s warranty may still be live on top of it.',
    faq: [
      {
        q: 'My Electrolux dryer has stopped making steam. Is that worth fixing?',
        a: 'Yes, and it is usually a single valve. The steam circuit has its own inlet valve, and when it fails the cycles that depend on it fail with it while everything else keeps working. It is a contained part on an accessible assembly — a short visit rather than a project.',
      },
      {
        q: 'Is Electrolux the same as Frigidaire underneath?',
        a: 'Related, not identical, and the relation helps you. They share a parent, a good deal of control architecture and much of the parts catalogue, which is why diagnosis is quick and parts arrive fast. The specification is genuinely higher — better laundry, better refrigeration — so it is a step up rather than a rebadge.',
      },
      {
        q: 'Water is leaking from the front of my washer. How bad is it?',
        a: 'Usually the door bellows, and usually at the bottom of the fold where grit collects and eventually wears through. It is a contained repair and not a machine-ending one. Worth doing promptly — water that runs down the front finds the base and the electronics eventually.',
      },
      {
        q: 'Repair or replace on an eight-year-old Electrolux pair?',
        a: 'Repair, in most of the cases we see. These were built above the mainstream line and the common faults — valves, pumps, bellows — are modest parts. Where it changes is a tub bearing or a control board on both machines at once, and then we put the numbers side by side rather than deciding for you.',
      },
    ],
    seo: {
      title: 'Electrolux Repair Orange County | Same-Day',
      description:
        'Electrolux washer, dryer and refrigerator repair across Orange County — steam inlet valves, drain pumps, door bellows, evaporator fans. Same-day service. Call (949) 749-0006.',
    },
  },

  {
    slug: 'kenmore',
    name: 'Kenmore',
    tier: 'mainstream',
    summary: 'A badge, not a factory — and the model number tells you who really built it.',
    positioning:
      'Kenmore never manufactured anything. Sears sold machines built by Whirlpool, LG, Frigidaire, GE and others under one name, which is why two Kenmore washers of the same age can share nothing but the logo. The practical consequence is the single most useful thing on this page: the first three digits of the model number identify the actual manufacturer, and once we know that, we know the platform, the fault set, the diagnostic routine and the parts. Sears is largely gone; the machines are not, and they remain perfectly repairable — through the builder\'s parts rather than the badge\'s.',
    categories: ['Washers & dryers', 'Refrigerators', 'Dishwashers', 'Ranges', 'Freezers'],
    lines: [
      '110 / 106 — built by Whirlpool',
      '665 / 587 — Whirlpool dishwashers',
      '795 / 796 — built by LG',
      '253 / 417 — built by Frigidaire',
      '363 — built by GE',
      'Kenmore Elite / Pro',
    ],
    faults: [
      {
        symptom: 'Model number starts 110 or 106 and the washer will not agitate',
        cause:
          'It is a Whirlpool, and this is the shift actuator on the direct-drive top-load platform. Same part, same test, same modest bill as it would be with a Whirlpool badge on it.',
      },
      {
        symptom: 'Model number starts 795 and the refrigerator has stopped cooling',
        cause:
          'It is an LG, which means the linear compressor and its warranty position are the first thing to establish — not the last. See the note below before anybody opens the sealed system.',
      },
      {
        symptom: 'Model number starts 253 or 417 and the oven or fridge shows a control fault',
        cause:
          'Frigidaire underneath, so it uses the Frigidaire code set and the Frigidaire boards. The codes read exactly as they would on that badge.',
      },
      {
        symptom: 'Dryer runs without heating',
        cause:
          'A thermal fuse opened by a restricted vent, on essentially every Kenmore dryer regardless of who built it. Fitting the fuse without clearing the duct is a return visit.',
      },
      {
        symptom: 'Dishwasher not draining, model number starting 665',
        cause:
          'Whirlpool dishwasher platform — drain pump, check valve, or the disposal knockout plug still in place from installation.',
      },
      {
        symptom: '"Nobody will work on it because Sears closed"',
        cause:
          'Not true, and worth saying plainly. Sears\' retail collapse changed where the parts are bought, not whether they exist. We cross-reference to the original manufacturer\'s part number and order from the same suppliers as for any other machine.',
      },
    ],
    whereFound:
      'The county\'s long-established housing, and in enormous numbers — Fullerton, Anaheim, Orange, Garden Grove, Westminster, Santa Ana and the older Huntington Beach tracts, where a Kenmore pair bought from the Sears at the mall is often still in the garage and still working. Frequently the second refrigerator rather than the first.',
    partsNote:
      'Better than owners expect. Once the builder is identified from the model number, parts come from that manufacturer\'s catalogue and availability matches theirs — excellent on the Whirlpool-built machines, good on LG and Frigidaire. The genuinely scarce cases are Sears-specific trim and some 1990s control boards.',
    authorisedNote:
      'Old Kenmore warranties went with Sears and are not worth chasing. The one live exception matters: where the machine was built by LG or Samsung, the manufacturer\'s ten-year sealed-system coverage can still apply to the compressor even under a Kenmore badge. If your model number starts 795 or 796 and the fridge has stopped cooling, it is worth a call to LG before it is worth a call to us.',
    faq: [
      {
        q: 'How do I find out who actually made my Kenmore?',
        a: 'The first three digits of the model number, on the plate inside the door or on the frame. 110 and 106 are Whirlpool, 665 and 587 are Whirlpool dishwashers, 795 and 796 are LG, 253 and 417 are Frigidaire, 363 is GE. Send us a photo of the whole plate when you book — those three digits decide what we bring, and the rest of the number pins the exact platform.',
      },
      {
        q: 'Sears is gone. Can anyone still get parts?',
        a: 'Yes, and it is routine. The parts were never Sears parts — they were Whirlpool, LG, Frigidaire and GE parts with a Kenmore number printed on the bag. We cross-reference to the original and order from the same suppliers we use daily. The exceptions are Sears-specific trim and a few very old control boards, and we flag those at diagnosis rather than after.',
      },
      {
        q: 'Is a twenty-year-old Kenmore worth repairing?',
        a: 'Frequently yes, particularly the Whirlpool-built laundry, which was built simply and is still fully supported. A pump or a lid lock on a machine that age is money well spent. Where we would hesitate is a sealed-system fault or a discontinued board, and we will say which of those you are looking at before you have committed to anything.',
      },
      {
        q: 'Which error codes apply to my Kenmore?',
        a: 'The builder\'s, not the badge\'s. A 110 machine reads with the Whirlpool set, a 795 with the LG set, a 253 with the Frigidaire set. Our Kenmore error codes page maps the prefixes to the right list so you do not have to guess.',
      },
    ],
    seo: {
      title: 'Kenmore Repair Orange County | All Model Prefixes',
      description:
        'Kenmore washer, dryer, refrigerator and dishwasher repair across Orange County. We identify the real builder from the model number — 110 Whirlpool, 795 LG, 253 Frigidaire. Call (949) 749-0006.',
    },
  },
];

/** Built-in refrigeration and professional cooking. */
export const premiumBrands = brands.filter((brand) => brand.tier === 'premium');

/** The volume end — what most Orange County kitchens actually contain. */
export const mainstreamBrands = brands.filter((brand) => brand.tier === 'mainstream');

export function getBrandBySlug(slug: string) {
  return brands.find((brand) => brand.slug === slug);
}
