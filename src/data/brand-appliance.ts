/**
 * One brand, one machine — the search that converts hardest.
 *
 * "Samsung refrigerator repair Irvine" is made by somebody who knows what they
 * own and what has failed. It is a narrower search than the brand page answers
 * and a narrower one than the service page answers, and until now it had no
 * page of its own on this site while the biggest competitor in the county had
 * a matrix of them.
 *
 * THE CANNIBALISATION RULE, and it is the reason this file exists rather than
 * more sections on the brand pages. /brands/kenmore and /error-codes/kenmore
 * were written about the same thing, and Google picked one and buried the
 * other — we watched it happen. So the split here is by job, not by topic:
 *
 *   /brands/{brand}          — what the badge is, where it turns up in this
 *                              county, parts, warranty. An overview and a hub.
 *   /brands/{brand}/{thing}  — what goes wrong with *this machine from this
 *                              maker*, in the detail a technician would use.
 *
 * A fault belongs on exactly one of them. When something here would repeat the
 * brand page, it gets cut rather than reworded.
 *
 * PAIRS ARE REAL OR ABSENT. Sub-Zero does not make washing machines and
 * Speed Queen does not make refrigerators. The full grid of every brand
 * against every appliance is 135 pages, most of them describing a machine that
 * does not exist, and generating it is the doorway-page mistake the niche
 * analysis warned about. What is here is what these makers actually build and
 * we actually open.
 */

export interface BrandAppliance {
  /** Must match a slug in `brands.ts`. */
  brandSlug: string;
  /** Must match a slug in `services.ts` — the price range comes from there. */
  serviceSlug: string;
  /** How the pair reads in a heading: "French-door refrigerators". */
  name: string;
  /** One line for the brand page's list of children. */
  summary: string;
  /** What this maker's version of this machine is, and how that shapes a repair. */
  positioning: string;
  /** Model lines a customer can read off their own machine. */
  lines: string[];
  /** Faults peculiar to this pairing. Not the brand's faults in general. */
  faults: Array<{ symptom: string; cause: string }>;
  /** Availability and cost of the parts this machine actually needs. */
  partsNote: string;
  faq: Array<{ q: string; a: string }>;
  seo: { title: string; description: string };
}

export const brandAppliances: BrandAppliance[] = [
  // -------------------------------------------------------------------------
  // Samsung
  // -------------------------------------------------------------------------
  {
    brandSlug: 'samsung',
    serviceSlug: 'refrigerator',
    name: 'French-door refrigerators',
    summary: 'The ice maker, and the duct work that actually fixes it.',
    positioning:
      'Samsung sells more French-door refrigerators than anyone, and one fault accounts for more of our calls on them than every other cause combined. The ice compartment sits inside the fresh-food cabinet rather than in the freezer, which is what makes the doors look the way they do and what puts warm humid air within reach of the auger. Almost everything below follows from that single design decision.',
    lines: ['RF23 / RF24 Counter Depth', 'RF26 / RF28 French Door', 'RF29 4-Door Flex', 'Bespoke', 'Family Hub'],
    faults: [
      {
        symptom: 'The ice maker frosts into a solid block every few weeks',
        cause:
          'Warm air reaching the compartment and condensing on the cold parts. Melting it out is not a repair — the air path is still open. The lasting fix is the duct, the shroud and the gasket work around the compartment, plus a revised ice maker assembly on some model years. Ask anyone quoting you which of those they are doing.',
      },
      {
        symptom: 'Fresh food warming while the freezer stays cold, often with a ticking noise',
        cause:
          'Ice on the evaporator behind the rear panel until the fan blade strikes it. The noise is the useful part of the complaint — it says where to go before anything comes apart. Behind it is a defrost heater, sensor or control.',
      },
      {
        symptom: 'Water at the dispenser has slowed or stopped',
        cause:
          'The filter first — it is the cheapest thing it can be and overdue on most units we open. Then the fill tube frozen in the door, then the inlet valve.',
      },
      {
        symptom: 'Nothing cold anywhere and the compressor silent or short-cycling',
        cause:
          'The digital inverter compressor or its board. Read the warranty note on the brand page before letting anybody open the sealed system — Samsung covers that compressor for ten years and only through their own network.',
      },
    ],
    partsNote:
      'Ice maker assemblies, duct kits, defrost heaters and inlet valves are all common enough to carry, which is why most of these finish on the first visit rather than in two.',
    faq: [
      {
        q: 'I have had the ice maker replaced already and it froze again.',
        a: 'Then the air path was never closed. A new ice maker in the same compartment meets the same warm air and does the same thing. The parts that matter are the duct and the seal around it, and they are the ones most often skipped.',
      },
      {
        q: 'Is a Samsung French-door worth repairing at seven years?',
        a: 'For the ice maker, the defrost circuit or a fan, comfortably yes — those are modest parts on a cabinet with years left. The answer changes at the sealed system, and that is a warranty conversation before it is a repair one.',
      },
    ],
    seo: {
      title: 'Samsung Refrigerator Repair Orange County | Ice Makers',
      description:
        'Samsung French-door refrigerator repair across Orange County — ice maker freeze-ups fixed at the duct, evaporator frost, defrost and dispenser faults. Call (949) 749-0006.',
    },
  },
  {
    brandSlug: 'samsung',
    serviceSlug: 'washer',
    name: 'Front-load washers',
    summary: 'Two of the three most common faults you can clear yourself.',
    positioning:
      'Samsung front-loaders are mechanically ordinary and fail in ordinary ways, which is good news: the two complaints we hear most are an obstruction and a load, and neither needs a technician. What is worth knowing is which symptom is the cheap one and which is the tub bearing, because they arrive sounding similar.',
    lines: ['WF45 / WF50 front-load', 'FlexWash', 'Bespoke AI Laundry', 'WA top-load (VRT)'],
    faults: [
      {
        symptom: 'Stops mid-cycle with water still in the drum',
        cause:
          'The drain pump filter, behind the small hatch at the bottom front. Coins, hair clips and underwire collect there. This is one of the few we will talk somebody through on the phone rather than charge for.',
      },
      {
        symptom: 'Will not spin, and reports an unbalanced load on every attempt',
        cause:
          'A genuinely uneven load first — one duvet, one bath mat. Then a machine that is not level. Where the load is fine and the feet are set, it is the suspension rods, and past seven or eight years it can be the tub bearing, which is where the repair figure and a replacement figure need looking at together.',
      },
      {
        symptom: 'Smell that returns however often it is cleaned',
        cause:
          'Biofilm in the door bellows and the detergent drawer, not a fault. It is the consequence of a watertight door and cool washes. Cleaning the fold properly fixes it; a new machine gets back there in eighteen months.',
      },
      {
        symptom: 'Water on the floor at the front',
        cause:
          'The bellows, usually worn through at the bottom fold where grit sits. Contained repair, and worth doing promptly — water running down the front finds the electronics eventually.',
      },
    ],
    partsNote:
      'Drain pumps, bellows and suspension rods are inexpensive and stocked. A tub bearing on a machine past seven years is the one case where we will put replacement next to the repair rather than just quoting it.',
    faq: [
      {
        q: 'The machine says UB or UE every single cycle. Is it broken?',
        a: 'Not necessarily. Redistribute the load and run a spin on its own, then push each top corner — if the machine rocks, the feet want adjusting. If it still refuses with a level machine and a mixed load, it is the suspension.',
      },
      {
        q: 'Can I clean the pump filter myself?',
        a: 'Yes, and you should. Towel and a shallow tray down first because water comes out, small hatch bottom front, unscrew the filter, clear it, refit it firmly. That is the whole repair on a large share of the calls we get for this.',
      },
    ],
    seo: {
      title: 'Samsung Washer Repair Orange County | Same-Day',
      description:
        'Samsung front-load washer repair across Orange County — drain faults, unbalanced spin, suspension rods, door bellows and leaks. Same-day service. Call (949) 749-0006.',
    },
  },
  {
    brandSlug: 'samsung',
    serviceSlug: 'dryer',
    name: 'Dryers',
    summary: 'A heat fault that is usually the duct, not the dryer.',
    positioning:
      'A Samsung dryer that has stopped heating is more often a venting problem than a broken machine, and the machine is designed to protect itself when the exhaust cannot get out. That protection is what people mistake for the failure. Establishing which one you have takes minutes and changes the bill entirely.',
    lines: ['DVE45 / DVE50 electric', 'DVG gas', 'FlexDry', 'Bespoke AI Laundry'],
    faults: [
      {
        symptom: 'Tumbles without heating, and reports a heat error',
        cause:
          'The heating element or a thermostat on an electric machine, the igniter or flame sensor on a gas one. On both, a restricted vent is frequently what took the part out — replacing it without clearing the duct buys a fortnight.',
      },
      {
        symptom: 'Everything takes two cycles to dry',
        cause:
          'Airflow, almost always: lint in the run, a crushed hose behind the machine, or a blocked wall cap. Then the moisture sensor bars inside the drum, which coat with fabric softener and stop reading wet laundry as wet.',
      },
      {
        symptom: 'Squealing or rumbling that rises with the drum',
        cause:
          'Drum rollers or the idler pulley. Caught early it is a small job; left long enough the belt goes with it.',
      },
    ],
    partsNote:
      'Elements, thermostats, rollers and belts are cheap and stocked. Where the duct is the real fault we say so and quote the vent clean rather than fitting a part into a blocked run.',
    faq: [
      {
        q: 'The dryer heated fine last week and now nothing. What changed?',
        a: 'Usually nothing sudden — the duct filled up gradually and the machine finally overheated and cut its own heat. That is why we look at the vent run before quoting a part, and why a part fitted without that check tends to fail again.',
      },
      {
        q: 'Do you clean dryer vents as well?',
        a: 'Yes, and it is often the whole repair. The published minimum covers the first six feet, which is the entire run for most dryers in this county.',
      },
    ],
    seo: {
      title: 'Samsung Dryer Repair Orange County | Heat & Airflow',
      description:
        'Samsung dryer repair across Orange County — no heat, long drying times, moisture sensors, drum rollers and vent restriction. Same-day service. Call (949) 749-0006.',
    },
  },

  // -------------------------------------------------------------------------
  // LG
  // -------------------------------------------------------------------------
  {
    brandSlug: 'lg',
    serviceSlug: 'refrigerator',
    name: 'French-door refrigerators',
    summary: 'The linear compressor question, answered before anything is opened.',
    positioning:
      'Every LG refrigerator conversation starts in the same place, and it should. The linear compressor is the most litigated component in the industry — a class-action settlement in 2020 covered certain 2014–2017 units after a wave of failures, and LG warrants it for ten years through their own network. So the first job on an LG that has stopped cooling is not diagnosis, it is establishing whose repair this is.',
    lines: ['LFXS / LMXS French Door', 'InstaView Door-in-Door', 'Craft Ice', 'LG Studio', 'LRFVS 4-Door'],
    faults: [
      {
        symptom: 'Nothing cold in either compartment',
        cause:
          'The linear compressor or the inverter board that drives it. They present identically and are very different repairs — the board is not sealed-system work and is far smaller. Call LG before anyone independent, ourselves included: an independent repair to the sealed system ends coverage you may still have.',
      },
      {
        symptom: 'One compartment drifting warm with a fan fault reported',
        cause:
          'Ice around a fan blade, which puts the real fault in the defrost circuit rather than the fan. The code says which fan, which is genuinely useful — it narrows the job before the back panel comes off.',
      },
      {
        symptom: 'Craft Ice producing nothing while the regular ice maker works',
        cause:
          'The round-ice mould has its own assembly and its own failure mode. Establishing which of the two ice systems is out matters before any part is ordered.',
      },
      {
        symptom: 'Ice maker output falling off slowly',
        cause:
          'The fill tube icing shut, or the ice maker fan. On door-mounted systems the supply runs a long way through a cold path, and that path is usually where this lives.',
      },
    ],
    partsNote:
      'Everything outside the sealed system is well supplied — inverter boards, fans, ice maker assemblies, gaskets. Compressors are usually a warranty conversation rather than a parts one.',
    faq: [
      {
        q: 'My LG stopped cooling. Is it the compressor everyone talks about?',
        a: 'It might be, and it might be the inverter board, which costs a fraction. Establish the warranty position first: ten years on the compressor through LG, and certain 2014–2017 models had extended terms on top. Get their answer, then come to us if there is a bill worth a second opinion.',
      },
      {
        q: 'Is it worth repairing an LG refrigerator out of warranty?',
        a: 'Outside the sealed system, yes — these are well built and the parts are available. Inside it, on a unit past eight years, we put the repair figure next to a replacement figure and say which we would spend.',
      },
    ],
    seo: {
      title: 'LG Refrigerator Repair Orange County | Compressor & Ice',
      description:
        'LG French-door refrigerator repair across Orange County — linear compressor and inverter board faults, ER fan codes, Craft Ice and dispenser problems. Call (949) 749-0006.',
    },
  },
  {
    brandSlug: 'lg',
    serviceSlug: 'washer',
    name: 'Direct Drive washers',
    summary: 'No belt, no pulley — and a sensor that gets quoted as a motor.',
    positioning:
      'LG put the motor straight onto the drum with no belt and no transmission, which removed the most common laundry failure from the machine entirely and is why these run as long as they do. It also changed what goes wrong. The fault people are quoted most expensively for is a sensor bolted to the stator, not the motor it sits on, and knowing that is worth a second opinion.',
    lines: ['WM3600 / WM4000 front-load', 'WashTower', 'WT top-load Direct Drive', 'LG Studio', 'TurboWash 360'],
    faults: [
      {
        symptom: 'Stops before spinning and reports a locked motor',
        cause:
          'The rotor position sensor on the Direct Drive stator, most often — a modest part and an accessible one. Then an overloaded drum, then something wedged between drum and tub. The motor itself is rarely the answer, which matters because it is the expensive one.',
      },
      {
        symptom: 'Will not drain, water sitting in the drum',
        cause:
          'The pump filter behind the lower access panel, reachable without tools beyond a towel. Where the filter is clear it is the pump or the pressure sensor.',
      },
      {
        symptom: 'Unbalanced on every cycle',
        cause:
          'Load distribution first and it genuinely is the answer more often than not. Then levelling, then the shock absorbers. Direct Drive makes the bearing more accessible than a belt machine of the same age, which improves the economics if it comes to that.',
      },
      {
        symptom: 'Water where it should not be, machine halted',
        cause:
          'A hose, the bellows, or the pump seal. The machine stopping is the leak detection working rather than a second fault.',
      },
    ],
    partsNote:
      'Rotor sensors, drain pumps, bellows and shock absorbers are all obtainable quickly and priced sensibly. A motor quote on this platform deserves a second opinion, and we are happy to be it.',
    faq: [
      {
        q: 'I have been quoted a new motor for an LE error. Is that right?',
        a: 'Usually not. On Direct Drive machines that message most often comes from the rotor position sensor on the stator — a small part behind a few bolts. Ask to be shown the sensor test before agreeing to a motor.',
      },
      {
        q: 'Is Direct Drive actually better, or is it marketing?',
        a: 'Genuinely better for longevity: no belt to perish and no pulley to wear. It is not maintenance-free — bearings and shock absorbers still age — but the most common failure on a conventional washer simply is not present.',
      },
    ],
    seo: {
      title: 'LG Washer Repair Orange County | Direct Drive',
      description:
        'LG Direct Drive washer repair across Orange County — rotor sensor and LE faults, OE drain problems, UE balance, bellows and leaks. Same-day service. Call (949) 749-0006.',
    },
  },
  {
    brandSlug: 'lg',
    serviceSlug: 'dryer',
    name: 'Dryers',
    summary: 'It measures your duct and tells you the number.',
    positioning:
      'LG dryers do something no other brand does: they measure how restricted the exhaust is and report it as a percentage on the display. Most owners read D80 or D90 as an error code and call for a repair. It is not a fault at all — it is the machine telling you the duct is nearly shut, and the repair is the vent run rather than the dryer.',
    lines: ['DLEX / DLGX', 'WashTower', 'Heat-pump (DLHC)', 'LG Studio'],
    faults: [
      {
        symptom: 'D80, D90 or D95 on the display',
        cause:
          'Exhaust restriction, at 80, 90 or 95 per cent blocked. Not an error. Clear the run — the whole run, not the first three feet — and the reading falls and the cycle times come back.',
      },
      {
        symptom: 'Runs cool, or heats then stops',
        cause:
          'A thermistor or a heating element on the vented machines. On a heat-pump model it is a different animal: the condenser fouls with lint and drying times stretch out long before anything is reported.',
      },
      {
        symptom: 'Everything takes far longer than it used to, with no code at all',
        cause:
          'Airflow again, or the moisture sensor. Fabric softener films the sensor bars until wet laundry reads as dry and the cycle ends early.',
      },
    ],
    partsNote:
      'Thermistors, elements and rollers are readily available. On heat-pump models the condenser is a maintenance item rather than a part, and cleaning it usually restores the original performance.',
    faq: [
      {
        q: 'What part does D90 need?',
        a: 'None. That is a measurement, not a fault: the exhaust duct is about ninety per cent restricted. Pull the machine out and check the flexible hose is not crushed against the wall, then have the full run cleared. The number drops on its own.',
      },
      {
        q: 'Do heat-pump dryers need different servicing?',
        a: 'Yes, and it is mostly the condenser. It fouls with lint, drying times creep up, and no error is ever shown. It wants cleaning on a schedule rather than when something goes wrong.',
      },
    ],
    seo: {
      title: 'LG Dryer Repair Orange County | D80 & D90 Explained',
      description:
        'LG dryer repair across Orange County — what D80, D90 and D95 actually mean, no-heat faults, thermistors and heat-pump condensers. Call (949) 749-0006.',
    },
  },

  // -------------------------------------------------------------------------
  // Whirlpool
  // -------------------------------------------------------------------------
  {
    brandSlug: 'whirlpool',
    serviceSlug: 'washer',
    name: 'Top-load and front-load washers',
    summary: 'The cheap part that keeps getting quoted as a transmission.',
    positioning:
      'The direct-drive top-load platform Whirlpool has built since about 2010 has one dominant failure, and it is a small plastic-and-copper part that engages the drive. It produces exactly the symptoms of a dead gearcase, it is misdiagnosed constantly, and the difference between the two quotes is most of the price of the machine.',
    lines: ['Cabrio', 'VMW direct-drive top-load', 'Duet front-load', 'WTW / WFW series'],
    faults: [
      {
        symptom: 'Fills and drains normally, drum never turns',
        cause:
          'The shift actuator. Small, cheap, and behind a large share of the "the washer is dead" calls on this platform. Anybody quoting a transmission for this should be asked to show you the actuator test first.',
      },
      {
        symptom: 'Stops with water in the drum and a drain fault',
        cause:
          'The pump or what is caught in it. On front-loaders the coin trap is reachable; on the top-load platform the pump usually has to come off. The pump itself is rarely faulty — something got into it.',
      },
      {
        symptom: 'Will not start, lid or door lock clicking',
        cause:
          'The lock assembly, a known wear item across the platform. The machine refusing to run is by design rather than a second fault.',
      },
      {
        symptom: 'Walks across the floor on spin',
        cause:
          'Suspension rods, which wear as a set. Replacing one is false economy, so we quote the set.',
      },
    ],
    partsNote:
      'The best parts situation of any brand we work on. Actuators, lid locks, pumps and suspension rods are cheap, universally stocked and ride on the van, which is why these repairs are among the most economical we quote.',
    faq: [
      {
        q: 'Fills, drains, will not agitate. How bad is this?',
        a: 'Probably far less bad than you are bracing for. That exact set of symptoms points at the shift actuator, which is a modest part and a contained job. If it genuinely is the gearcase we will show you why.',
      },
      {
        q: 'Is a ten-year-old Whirlpool washer worth fixing?',
        a: 'Usually yes. These were built simply and are still fully supported, and the common failures are inexpensive. The line moves at a tub bearing, and then we put both figures in front of you.',
      },
    ],
    seo: {
      title: 'Whirlpool Washer Repair Orange County | Shift Actuators',
      description:
        'Whirlpool washer repair across Orange County — shift actuators misquoted as transmissions, F21 drain faults, lid locks and suspension rods. Call (949) 749-0006.',
    },
  },
  {
    brandSlug: 'whirlpool',
    serviceSlug: 'dryer',
    name: 'Dryers',
    summary: 'The fuse is the symptom. The duct is the fault.',
    positioning:
      'A Whirlpool dryer that turns without heating has almost always blown a thermal fuse, and the fuse is a safety device doing its job rather than a component that failed. It opened because the machine overheated, and the machine overheated because the exhaust could not get out. Fitting a fuse and leaving is the most common bad repair in this trade.',
    lines: ['WED / WGD series', 'Cabrio', 'Duet', 'Whirlpool stacked laundry'],
    faults: [
      {
        symptom: 'Drum turns, no heat at all',
        cause:
          'A blown thermal fuse, and behind it a restricted duct — a crushed flexible hose, a long roof run, or a bird nesting in the wall cap. We check the run as part of the repair, because otherwise you are calling again shortly.',
      },
      {
        symptom: 'Reports restricted airflow',
        cause:
          'The same story, caught earlier. This is the warning before the fuse goes, and acting on it is much cheaper than not.',
      },
      {
        symptom: 'Rumbling or thumping that tracks the drum',
        cause: 'Drum rollers, the idler pulley, or the belt. Usually all three are due together at that age.',
      },
      {
        symptom: 'Dead, with no display and no response',
        cause: 'The main control board, or a connector on it that has overheated at a terminal.',
      },
    ],
    partsNote:
      'Fuses, thermostats, rollers, belts and idlers are all inexpensive and stocked. Boards on older machines are the only item worth checking availability on before starting.',
    faq: [
      {
        q: 'This is the second thermal fuse in a year.',
        a: 'Then the vent was never the part of the job anyone did. The fuse opens when the machine overheats and the machine overheats when the exhaust is blocked. Clear the full run and the fuse stops being a consumable.',
      },
      {
        q: 'How do I know if my vent is the problem?',
        a: 'Pull the machine out and look at the flexible hose first — crushing it against the wall accounts for a surprising share of these. Beyond that it takes measuring airflow at the outside cap, which we do on the visit.',
      },
    ],
    seo: {
      title: 'Whirlpool Dryer Repair Orange County | No Heat',
      description:
        'Whirlpool dryer repair across Orange County — thermal fuses and the vent restriction behind them, drum rollers, belts and control boards. Call (949) 749-0006.',
    },
  },
  {
    brandSlug: 'whirlpool',
    serviceSlug: 'refrigerator',
    name: 'Refrigerators',
    summary: 'A warm fridge with a cold freezer is usually a flap, not a compressor.',
    positioning:
      'The complaint we hear most on Whirlpool refrigeration sounds alarming and is usually not: the fresh-food side drifts warm while the freezer stays perfectly cold. On the side-by-sides that frequently comes down to a damper — a motorised flap that meters cold air between the two compartments — which is a far smaller repair than the symptom suggests.',
    lines: ['WRS side-by-side', 'WRF French Door', 'WRT top-freezer', 'Whirlpool in-door ice'],
    faults: [
      {
        symptom: 'Fresh food warm, freezer cold',
        cause:
          'The damper control that meters air between compartments, or the evaporator fan. Both are small; neither is the compressor everybody fears.',
      },
      {
        symptom: 'Frost building at the back of the freezer',
        cause:
          'The defrost heater, sensor or control. Left alone the ice eventually reaches the fan blade and adds a noise to the complaint.',
      },
      {
        symptom: 'In-door ice maker producing little or nothing',
        cause:
          'The fill tube icing shut, or the assembly itself. The in-door design runs its supply a long way through cold space, which is where this usually lives.',
      },
      {
        symptom: 'Water pooling under the crisper drawers',
        cause:
          'The defrost drain frozen shut, so meltwater backs up instead of running away. Clearing it is straightforward and it recurs if the heater is weak.',
      },
    ],
    partsNote:
      'Dampers, fans, defrost heaters and ice maker assemblies are cheap and stocked. Even machines well past ten years are usually fully supported, which keeps repair the sensible answer for longer than on most brands.',
    faq: [
      {
        q: 'The freezer is fine but the fridge is warm. Is the compressor going?',
        a: 'Almost certainly not — a failing compressor takes both compartments with it. One warm side and one cold side points at how air is being moved or metered between them, which is a much smaller job.',
      },
      {
        q: 'There is water under the crisper drawers.',
        a: 'The defrost drain has frozen and meltwater is backing up. Clearing it is quick. If it returns, the drain heater is weak and that is the actual repair.',
      },
    ],
    seo: {
      title: 'Whirlpool Refrigerator Repair Orange County | Same-Day',
      description:
        'Whirlpool refrigerator repair across Orange County — warm fresh food with a cold freezer, defrost faults, in-door ice makers and blocked drains. Call (949) 749-0006.',
    },
  },

  // -------------------------------------------------------------------------
  // GE
  // -------------------------------------------------------------------------
  {
    brandSlug: 'ge',
    serviceSlug: 'refrigerator',
    name: 'Refrigerators',
    summary: 'The inlet valve, and the filter that gets blamed for it.',
    positioning:
      'GE refrigeration turns up in more Orange County kitchens than any other badge and across a wider span of years, so the age of the machine shapes the diagnosis more than the model does. What does not change is the part that fails most: the water inlet valve, by a distance, with the filter behind it as the cheaper thing to rule out first.',
    lines: ['GE', 'Profile', 'Café', 'Monogram', 'GNE / GFE French Door'],
    faults: [
      {
        symptom: 'No water or ice at the door',
        cause:
          'The filter, then the inlet valve, then a supply line frozen where it passes through unheated space. A unit in a garage in January is a different diagnosis from the same unit in a kitchen.',
      },
      {
        symptom: 'Bottom-freezer ice maker slow or stopped',
        cause:
          'The fill tube frozen shut. On the bottom-freezer designs the tube runs a long way and a small heater keeps it clear; when that heater goes, production tails off rather than stopping, which is why it gets left for months.',
      },
      {
        symptom: 'Running constantly with frost at the back of the freezer',
        cause:
          'Defrost heater, sensor or control. GE\'s older adaptive defrost boards fail in a way that mimics a heater fault, so both get tested rather than one guessed at.',
      },
      {
        symptom: 'No code, no obvious fault, just not cold enough',
        cause:
          'Worth saying plainly: GE refrigerators mostly do not display codes, and a technician reads them through a service mode instead. Nothing on the panel is normal for this brand, not a sign the board has died.',
      },
    ],
    partsNote:
      'Inlet valves, sensors, fans and ice maker modules are readily available, including for older units. The genuine scarcity is control boards on 1990s machines, and we check before starting rather than after.',
    faq: [
      {
        q: 'The water stopped. Should I just change the filter?',
        a: 'Yes, first — it is the cheapest thing it can be and it is overdue on most units we see. If a fresh filter changes nothing, the inlet valve is next and that is a contained repair.',
      },
      {
        q: 'Is a Café or Profile different to repair from a base GE?',
        a: 'Yes, and mostly for the better: more capable components and more electronics. Diagnosis leans further towards testing and further from swapping, and parts sit above the base line without approaching built-in money.',
      },
    ],
    seo: {
      title: 'GE Refrigerator Repair Orange County | Same-Day',
      description:
        'GE, Profile and Café refrigerator repair across Orange County — water inlet valves, ice maker fill tubes, defrost faults and dispenser problems. Call (949) 749-0006.',
    },
  },
  {
    brandSlug: 'ge',
    serviceSlug: 'oven-range',
    name: 'Wall ovens and ranges',
    summary: 'Board or membrane — they look identical and cost differently.',
    positioning:
      'A dead GE oven is one of two things and they present the same way from the front: the control board behind the panel, or the touch membrane on it. One is several times the price of the other, and telling them apart is a test rather than a guess. Most of the value of a visit on this pairing is in that distinction.',
    lines: ['GE', 'Profile', 'Café', 'Monogram', 'JT / JB wall ovens and ranges'],
    faults: [
      {
        symptom: 'Display dead or unresponsive',
        cause:
          'The control board or the touch membrane in front of it. Identical from the outside, very different in cost. F7 or a stuck key after a power cycle points at the membrane.',
      },
      {
        symptom: 'Will not hold the set temperature',
        cause:
          'The temperature sensor or the bake element. The sensor is a two-minute resistance check that rules out the more expensive answer, and we do it before quoting.',
      },
      {
        symptom: 'Shut down with an over-temperature fault',
        cause:
          'Either the sensor reading low so the control keeps heating, or a relay on the board welded closed. Testing the probe separates them.',
      },
      {
        symptom: 'Door locked after a self-clean cycle',
        cause:
          'The lock motor or its switch. Common enough after self-clean that we ask whether one was run before anything else.',
      },
    ],
    partsNote:
      'Sensors, elements and lock motors are readily available. Boards for wall ovens from the early 1990s are the genuine scarcity, and where one has gone we say so on the phone rather than after taking the oven apart.',
    faq: [
      {
        q: 'My wall oven is completely dead. Is it finished?',
        a: 'Usually not. A dead GE wall oven is most often the board or the membrane, both replaceable, and the cavity and elements behind them are typically fine. The real question is age — on boards from the early nineties availability is genuinely thin.',
      },
      {
        q: 'Anyone can quote a control board. How do I know it is right?',
        a: 'Ask whether a stuck-key test was done. F7 and similar point at the membrane, which is much the cheaper part, and a board quoted without that test is a guess made with your money.',
      },
    ],
    seo: {
      title: 'GE Oven & Range Repair Orange County | Control Boards',
      description:
        'GE wall oven and range repair across Orange County — dead displays, board versus membrane, temperature sensors, F2 and F7 codes. Call (949) 749-0006.',
    },
  },
  {
    brandSlug: 'ge',
    serviceSlug: 'dishwasher',
    name: 'Dishwashers',
    summary: 'The free fix nobody checks: the disposal knockout plug.',
    positioning:
      'Before anything is quoted on a GE dishwasher that will not drain, one thing gets ruled out because it costs nothing and it is the answer more often than people expect. When a dishwasher and a garbage disposal are fitted at the same time, the disposal ships with a plug in its dishwasher inlet, and if the installer left it there the machine has nowhere to drain to.',
    lines: ['GDT / GDF series', 'Profile', 'Café', 'Monogram', 'Adora'],
    faults: [
      {
        symptom: 'Standing water after every cycle',
        cause:
          'The disposal knockout plug still in place from installation, the air gap at the sink, the drain hose loop, or the pump. In that order, because that is the order of cost.',
      },
      {
        symptom: 'Blinking cycle lights and no display',
        cause:
          'That pattern is a code on models without an alphanumeric panel. Count the flashes and the pause between groups — it separates a drain problem from a heater fault from the control, which are three different repairs.',
      },
      {
        symptom: 'Dishes coming out gritty',
        cause: 'The filter or the wash arm feed. On older units with a hard-food disposer, the chopper.',
      },
      {
        symptom: 'Will not start, or starts and stops',
        cause: 'The door latch and its switch, then the control.',
      },
    ],
    partsNote:
      'Drain pumps, latches and wash motors are available and sensibly priced. A large share of these calls need no part at all, which is the point of the checks above.',
    faq: [
      {
        q: 'The dishwasher was fitted with a new disposal and has never drained properly.',
        a: 'Then it is almost certainly the knockout plug, still sitting in the disposal inlet. It costs nothing to remove and it is one of the most common misses in a kitchen fit-out.',
      },
      {
        q: 'The lights are blinking in a pattern. Does that mean anything?',
        a: 'It means quite a lot — it is a fault code expressed as blinks. Count the flashes and the gaps, or film ten seconds on your phone. It genuinely decides what comes on the van.',
      },
    ],
    seo: {
      title: 'GE Dishwasher Repair Orange County | Drain Faults',
      description:
        'GE dishwasher repair across Orange County — standing water, disposal knockout plugs, blinking light codes, latches and wash pumps. Call (949) 749-0006.',
    },
  },

  // -------------------------------------------------------------------------
  // Maytag
  // -------------------------------------------------------------------------
  {
    brandSlug: 'maytag',
    serviceSlug: 'washer',
    name: 'Washers',
    summary: 'Whirlpool underneath, with one code worth knowing.',
    positioning:
      'Maytag washers have been built by Whirlpool since 2006 and share the platform, which is good news at repair time: the parts are cheap, stocked and interchangeable. The Bravos top-loaders keep a short code set of their own, and one of them — F51 — is routinely quoted as a motor when it is a sensor.',
    lines: ['Bravos', 'Centennial', 'MVW top-load', 'MHW front-load', 'Maytag Commercial Technology'],
    faults: [
      {
        symptom: 'F51 or a rotor position fault',
        cause:
          'The rotor position sensor or its harness, and occasionally the rotor bolt having worked loose. Not the motor, which is what this gets quoted as.',
      },
      {
        symptom: 'Fills and drains but will not agitate',
        cause: 'The shift actuator, shared with the Whirlpool platform. Small part, contained job.',
      },
      {
        symptom: 'Rocks hard on spin, or reports imbalance repeatedly',
        cause:
          'Suspension rods, quoted as a set because they wear as one. On commercial-technology models the suspension is heavier and this shows up much later in life.',
      },
      {
        symptom: 'Older Neptune front-loader with a control or door fault',
        cause:
          'Pre-2006 Neptunes predate the Whirlpool platform entirely and some parts have genuinely gone. We will look, and we say at diagnosis rather than after ordering if sourcing ends the conversation.',
      },
    ],
    partsNote:
      'Excellent, because they are Whirlpool parts. The exception is the pre-2006 Neptune line, where some components are no longer made.',
    faq: [
      {
        q: 'Is a modern Maytag still built like the old ones?',
        a: 'No, and it is fairer to say the whole market moved than that Maytag declined. Whirlpool has built them since 2006. The upside is real: parts are cheap, available and interchangeable, so repairs are among the most economical we quote.',
      },
      {
        q: 'What is Maytag Commercial Technology actually?',
        a: 'A heavier motor, heavier suspension and a longer component warranty on the models carrying the badge. A genuine specification difference rather than a sticker, and it shows in how late suspension work starts appearing.',
      },
    ],
    seo: {
      title: 'Maytag Washer Repair Orange County | F51 & Actuators',
      description:
        'Maytag washer repair across Orange County — F51 rotor sensors misquoted as motors, shift actuators, suspension rods, Bravos and Neptune. Call (949) 749-0006.',
    },
  },
  {
    brandSlug: 'maytag',
    serviceSlug: 'dryer',
    name: 'Dryers',
    summary: 'The same vent story, on a heavier machine.',
    positioning:
      'Maytag dryers share the Whirlpool platform and the Whirlpool failure pattern: a machine that turns without heating has protected itself against a blocked exhaust rather than broken. Where the commercial-technology badge appears, the motor and bearings are specified heavier and the machine simply reaches these faults later.',
    lines: ['MED / MGD series', 'Bravos', 'Centennial', 'Maytag Commercial Technology'],
    faults: [
      {
        symptom: 'Turns without heating',
        cause:
          'A thermal fuse opened by a restricted duct. The fuse is the symptom; the vent is the fault. Fitting one without clearing the other is a return visit.',
      },
      {
        symptom: 'Drying takes two cycles',
        cause: 'Airflow first, then the moisture sensor bars filmed with fabric softener.',
      },
      {
        symptom: 'Rumbling that rises with the drum',
        cause: 'Rollers, idler and belt, usually all due at the same age.',
      },
    ],
    partsNote:
      'Whirlpool parts throughout — fuses, thermostats, rollers, belts. Cheap, stocked, and mostly on the van.',
    faq: [
      {
        q: 'Does the commercial badge mean it lasts longer?',
        a: 'It means a heavier motor and heavier bearings, so yes, in the parts that wear. It does not change the vent story: a blocked duct will stop a commercial-technology dryer heating exactly as fast as any other.',
      },
    ],
    seo: {
      title: 'Maytag Dryer Repair Orange County | No Heat',
      description:
        'Maytag dryer repair across Orange County — thermal fuses and the vent restriction behind them, moisture sensors, rollers and belts. Call (949) 749-0006.',
    },
  },

  // -------------------------------------------------------------------------
  // KitchenAid
  // -------------------------------------------------------------------------
  {
    brandSlug: 'kitchenaid',
    serviceSlug: 'dishwasher',
    name: 'Dishwashers',
    summary: 'The upgrade dishwasher in half the newer kitchens here.',
    positioning:
      'This is the machine we open most under the KitchenAid badge, and the standard step up from a builder-grade dishwasher across the newer Irvine and Tustin kitchens. Underneath it is a Whirlpool, which is why fixing one costs far less than the badge suggests. One thing genuinely differs from the Bosch it is usually cross-shopped against: it dries with a heating element, so wet dishes here really are a fault.',
    lines: ['KDTM / KDPM', 'Architect Series II', 'Superba', 'KDFE series'],
    faults: [
      {
        symptom: 'Stops part-way with the clean light blinking a pattern',
        cause:
          'The pattern is a code and worth counting before anything is opened. Most often it points at the flow meter, the drain path or the heater circuit — three quite different repairs behind one symptom.',
      },
      {
        symptom: 'Standing water in the base',
        cause:
          'The drain pump, the check valve, or the disposal knockout plug left in at installation. We rule out the free one first.',
      },
      {
        symptom: 'Nothing dries any more',
        cause:
          'The heating element or its relay. Worth separating from the Bosch complaint people compare it to: KitchenAid does use an element, so this is a real fault rather than a design characteristic.',
      },
      {
        symptom: 'Dishes coming out gritty',
        cause:
          'The filter in the base, which needs pulling and rinsing every few weeks on models since about 2013 and almost nobody is told that at the point of sale.',
      },
    ],
    partsNote:
      'Very good, because the parts bin is Whirlpool\'s. Drain pumps, flow meters, elements, latches and racks are all readily available and sensibly priced — which is the practical argument for repairing rather than replacing one of these.',
    faq: [
      {
        q: 'My dishes come out wet. Is that normal like on a Bosch?',
        a: 'No, and that is a useful distinction. Bosch dries by condensation and damp plastics are expected. KitchenAid uses a heating element, so if nothing dries something has failed — usually the element or its relay, and both are repairable.',
      },
      {
        q: 'Is it worth repairing a ten-year-old KitchenAid dishwasher?',
        a: 'Usually. The common failures are inexpensive parts on a machine with a stainless tub that has not aged. Where the wash motor has gone on a unit that old, we put both figures in front of you.',
      },
    ],
    seo: {
      title: 'KitchenAid Dishwasher Repair Orange County | Same-Day',
      description:
        'KitchenAid dishwasher repair across Orange County — clean-light blink codes, flow meters, drain faults, heating elements and filters. Call (949) 749-0006.',
    },
  },
  {
    brandSlug: 'kitchenaid',
    serviceSlug: 'oven-range',
    name: 'Ovens and ranges',
    summary: 'Commercial-style burners, and a board that fails like GE\'s.',
    positioning:
      'KitchenAid cooking sits between the mainstream and the professional brands, and it fails in ways borrowed from both. The commercial-style ranges bring heavy burners and their igniters; the wall ovens bring the same board-or-membrane question a GE does, with the same rule that testing beats guessing.',
    lines: ['KOSE / KODE wall ovens', 'Commercial-Style ranges', 'KFDC dual-fuel', 'Architect Series II'],
    faults: [
      {
        symptom: 'Burner clicks and will not light, or lights slowly',
        cause:
          'The igniter or a fouled burner port. Spilled liquid around the igniter is a frequent trigger and cleaning is often the whole repair.',
      },
      {
        symptom: 'Oven display dead or erratic',
        cause:
          'Control board or touch membrane. The same pairing as GE, the same rule: a stuck-key test separates them and the cost gap is large.',
      },
      {
        symptom: 'Temperature drifting against the dial',
        cause: 'The temperature sensor or the bake element. Sensor first, because it is a two-minute check.',
      },
    ],
    partsNote:
      'Igniters, sensors and elements are readily available through the Whirlpool catalogue. Boards on the commercial-style ranges cost more than the mainstream equivalents and are worth testing carefully before ordering.',
    faq: [
      {
        q: 'One burner clicks constantly even after it lights.',
        a: 'The igniter is fouled or wet, or the spark module is failing. Gas is still being controlled properly, so it is not usually dangerous — but use the other burners until it is looked at.',
      },
      {
        q: 'Is a KitchenAid range the same as a Whirlpool underneath?',
        a: 'It shares the catalogue and a good deal of the engineering, which works in your favour on parts. The commercial-style burners and the heavier build are genuinely different, and they are where the price difference actually went.',
      },
    ],
    seo: {
      title: 'KitchenAid Oven & Range Repair Orange County',
      description:
        'KitchenAid range and wall oven repair across Orange County — igniters, control boards versus membranes, temperature sensors and bake elements. Call (949) 749-0006.',
    },
  },
];

export function getBrandAppliance(brandSlug: string, serviceSlug: string) {
  return brandAppliances.find(
    (entry) => entry.brandSlug === brandSlug && entry.serviceSlug === serviceSlug
  );
}

/** The machines we have a page for under one badge. */
export function appliancesForBrand(brandSlug: string) {
  return brandAppliances.filter((entry) => entry.brandSlug === brandSlug);
}

/** The badges we have a page for under one machine. */
export function brandsForAppliance(serviceSlug: string) {
  return brandAppliances.filter((entry) => entry.serviceSlug === serviceSlug);
}
