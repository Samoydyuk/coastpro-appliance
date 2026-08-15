/**
 * The premium brands, one page each.
 *
 * Why these six and not the twenty on the service pages: "Sub-Zero repair
 * Newport Beach" is a different search from "appliance repair Newport Beach".
 * It is made by someone who already knows what they own, it converts far
 * better, and it is contested by a fraction of the competition — the generic
 * term is fought over by every shop in the county, this one by the few that
 * actually open these machines.
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
 */

export interface ApplianceBrand {
  slug: string;
  name: string;
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
    summary: 'Built-in refrigeration, and the coil that decides most of it.',
    positioning:
      'Sub-Zero builds built-in refrigeration and very little else, which is why the units last as long as they do and why they fail in a narrow set of ways. Most models run dual refrigeration — separate sealed systems for the fresh-food and freezer compartments — so one side can be perfectly cold while the other slowly warms. That single fact rules out half of what a technician would otherwise suspect, and it is the first thing we check.',
    categories: ['Built-in refrigerators', 'Freezer columns', 'Wine storage', 'Ice makers'],
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
    summary: 'Professional ranges — and the spark module behind most call-outs.',
    positioning:
      'Wolf shares a parent company with Sub-Zero and the same design philosophy: heavy, serviceable, built to be repaired rather than replaced. The ranges are genuinely commercial in construction, which means the burners and grates will outlast the house — and that almost everything that actually goes wrong is electrical rather than mechanical.',
    categories: ['Gas ranges', 'Dual-fuel ranges', 'Rangetops', 'Wall ovens', 'Steam ovens'],
    lines: ['Gas Range (GR)', 'Dual Fuel (DF)', 'Sealed Burner Rangetop (SRT)', 'M Series ovens', 'Convection Steam'],
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
    summary: 'Professional ranges, and a reliability story that split in 2013.',
    positioning:
      'Viking effectively created the residential professional range, and the build quality of the metalwork has never been in question. The service history is more complicated than that, and it is worth knowing which side of it your range falls on: units built before the Middleby acquisition in 2013 earned a genuine reputation for electrical and igniter trouble, and the generations since are materially better. The model and age tell us a great deal before we open anything.',
    categories: ['Professional ranges', 'Rangetops', 'Wall ovens', 'Built-in refrigeration', 'Dishwashers'],
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
    summary: 'Star burners, Freedom induction, and column refrigeration.',
    positioning:
      'Thermador sits inside the BSH group alongside Bosch, which matters practically: the engineering and the parts supply are shared in places, and a technician who knows one has a head start on the other. The distinctive pieces are the patented star burner, the Freedom induction cooktop, and the built-in refrigeration columns — and each fails in its own way.',
    categories: ['Ranges & rangetops', 'Induction cooktops', 'Wall ovens', 'Column refrigeration', 'Dishwashers'],
    lines: ['Professional Harmony', 'Masterpiece', 'Freedom Induction', 'Sapphire dishwashers', 'Liberty columns'],
    faults: [
      {
        symptom: 'Star burner will not light or the flame pattern is uneven',
        cause:
          'The igniter or a blocked burner port. The star geometry spreads flame more evenly than a round burner, which is the point of it — but it also means a partially blocked port shows up as a visibly lopsided flame rather than a weak one.',
      },
      {
        symptom: 'Freedom induction cooktop drops out or will not recognise a pan',
        cause:
          'Usually the control board or a coil sensor rather than the pan. These cooktops read the vessel across the whole surface, so a fault reads as "it works over here and not over there" — which is diagnostic in itself.',
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
        q: 'My induction cooktop works on some zones but not others. Is the whole thing failing?',
        a: 'Not necessarily, and that pattern is genuinely useful. Zone-specific behaviour points at a coil or its sensor rather than at the main board, which is a much smaller repair. We test each zone before quoting anything.',
      },
      {
        q: 'Is Thermador the same as Bosch for repair purposes?',
        a: 'Related, not identical. They share a parent and some engineering, which helps with parts and with diagnosis on the dishwashers particularly. The cooking products are their own design, and the star burner and Freedom induction have no Bosch equivalent.',
      },
    ],
    seo: {
      title: 'Thermador Repair Orange County | Same-Day',
      description:
        'Thermador repair across Orange County — star burners, Freedom induction, column refrigeration and Sapphire dishwashers. Same-day service. Call (949) 749-0006.',
    },
  },

  {
    slug: 'miele',
    name: 'Miele',
    summary: 'Built to run twenty years — and to tell you when water escapes.',
    positioning:
      'Miele designs to a stated twenty-year service life and largely achieves it, which changes the economics of every repair conversation. A fifteen-year-old Miele dishwasher with a failed pump is usually worth fixing, where the same age on a mainstream machine would not be. The trade-off is parts that cost more and occasionally take longer, and a machine that is genuinely unlike its competitors inside.',
    categories: ['Dishwashers', 'Washing machines', 'Heat-pump dryers', 'Built-in ovens', 'Coffee systems'],
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
];

export function getBrandBySlug(slug: string) {
  return brands.find((brand) => brand.slug === slug);
}
