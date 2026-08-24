/**
 * What the machine is trying to tell you.
 *
 * A code on a display is the most specific thing a customer can hand us before
 * we arrive, and it is currently the thing they are least able to look up
 * without landing on a forum. So: one page per brand, every common code, and
 * for each of them the honest three-part answer — what it reports, what causes
 * it, and whether it actually needs someone with a van.
 *
 * THREE RULES, because this is the file where being wrong costs the most.
 *
 * 1. A code is a symptom, not a diagnosis. E15 says water reached the base pan;
 *    it says nothing about which seal let it there. Every entry here separates
 *    what the machine detected from what caused it, and where several causes
 *    share one code the entry says so rather than picking the likeliest and
 *    presenting it as fact.
 *
 * 2. Codes drift between model years. The same three characters can mean
 *    different things on a 2012 and a 2022 machine, and a page that states one
 *    meaning flatly will be confidently wrong for somebody. Every entry carries
 *    `appliesTo`, and it is not decoration — if you cannot say which series an
 *    entry is true for, the entry does not go in.
 *
 * 3. Say when it is not a fault. `CL` is a child lock. `OF OF` is showroom
 *    mode. `D80` is a measurement of duct restriction. People pay for call-outs
 *    on all three, and a page that quietly lets them is worth less than no page.
 *    That is what the `not-a-fault` verdict exists for, and it is used freely.
 *
 * Kenmore is the odd one and gets `crossReference` instead of a code list,
 * because the badge never built a machine and the codes belong to whoever did.
 */

/** What the owner should actually do about it. */
export type CodeVerdict =
  /** Working as designed. No repair, and no call-out. */
  | 'not-a-fault'
  /** Reasonably fixable without tools or risk. */
  | 'diy'
  /** Needs testing, parts, or somewhere it is not safe to go alone. */
  | 'tech';

export interface ErrorCode {
  /** As it appears on the display, spacing and all. */
  code: string;
  /** URL fragment. Lower case, hyphenated, stable — these get linked to. */
  anchor: string;
  /** Which machine shows it. */
  appliance: string;
  /** What the machine has detected. One sentence, no speculation. */
  means: string;
  /** What puts it there, likeliest first. */
  causes: string;
  /** Safe to try before calling anyone. Omitted where there genuinely is nothing. */
  selfCheck?: string;
  verdict: CodeVerdict;
  /** Which models and years this entry is true for. Required, and it is load-bearing. */
  appliesTo: string;
  /**
   * Where in the published range for this appliance the fault usually lands.
   *
   * Not a quote and not a number invented for this page. The figures come from
   * `services.ts` — the ranges already printed on the service pages — and this
   * says which end of one a given fault sits at, which is a technical
   * judgement rather than a price. `varies` is used where the honest answer is
   * that the same code covers a five-minute fix and a sealed-system job.
   */
  costBand?: 'low' | 'mid' | 'high' | 'varies';
  /**
   * A photograph of this fault, from `public/images/work/`.
   *
   * Only where the picture genuinely shows *this* — a lint-packed duct against
   * a restricted-airflow code, a latch against a door fault. A stock kitchen
   * against an error number is decoration, and the site does not do decoration.
   * Most codes have none, and the page renders without a gap.
   */
  photo?: string;
}

export interface BrandErrorCodes {
  /**
   * Must match a slug in `brands.ts`. Nothing enforces it — a mismatch gives a
   * codes page with no brand page behind it, which builds cleanly and reads as
   * a dead end. Check the slug against `brands.ts` when adding one.
   */
  brandSlug: string;
  name: string;
  /** How this manufacturer's code system is put together. */
  intro: string;
  /** Where the code shows up, and how to get at it when it does not. */
  howToRead: string;
  codes: ErrorCode[];
  /** For badges that never manufactured: whose code set applies. */
  crossReference?: Array<{ prefix: string; builder: string; brandSlug?: string; note: string }>;
  seo: { title: string; description: string };
}

/**
 * Said once, at the top of every page, rather than hedged into each entry.
 * The model plate is the arbiter and the customer is the one who can read it.
 */
export const CODE_CAVEAT =
  'Codes are not standardised between manufacturers, and they move between model years within one. Everything below is what these codes mean on the series named beside them — if your model is older or newer, treat this as a strong hint rather than a verdict, and send us a photo of the model plate when you book. That plate settles it, and it takes ten seconds.';

/**
 * The same commitment, compressed, for the ten brand pages.
 *
 * The full version above ran identically on every one of them, and it was not
 * alone: a verdict legend and a block about what a visit involves repeated word
 * for word across all ten as well. Measured, those pages shared 44% of their
 * vocabulary with each other and 59% at the closest pair — GE and Frigidaire,
 * two makers with nothing in common, resembling each other because so much of
 * each page was the same paragraph.
 *
 * Boilerplate is not free on a set of pages whose whole argument is that they
 * are specific. So the brand pages carry one sentence and the index carries the
 * full explanation, which is where somebody reading about codes in general
 * actually is.
 */
export const CODE_CAVEAT_SHORT =
  'These are what the codes mean on the series named beside them. Model years differ — send a photo of the model plate when you book and that settles it.';

export const brandErrorCodes: BrandErrorCodes[] = [
  {
    brandSlug: 'samsung',
    name: 'Samsung',
    intro:
      'Samsung is more forthcoming than most about what has gone wrong, and the codes are worth reading rather than clearing. Two of the displays people call about most are not faults at all — one is a shop-floor demo mode and the other is a power-surge reset — and between them they account for a meaningful number of call-outs that need not have happened. The refrigerator codes are the useful ones: they name the circuit, which narrows a diagnosis to one part of the machine before anybody opens it.',
    howToRead:
      'Refrigerators display the code on the front panel, usually alternating with the temperature. Washers and dryers show it where the cycle time normally sits. If the display has gone dark but the machine is misbehaving, cutting power for five minutes and restoring it will bring back a live code — and on a few faults it clears them for good.',
    codes: [
      {
        code: '22 E / 22 C',
        anchor: '22e',
        costBand: 'mid',
        appliance: 'Refrigerator',
        means: 'The fresh-food evaporator fan is not turning, or the control cannot confirm that it is.',
        causes:
          'Ice built up around the fan blade is the usual answer, which puts the real fault in the defrost circuit rather than the fan. Failing that, the fan motor itself or its wiring. A fan physically blocked by a bag of frozen food happens more often than you would think.',
        selfCheck:
          'Empty the freezer, unplug the unit and leave it open for a few hours. If the code goes and stays gone for a fortnight, the fan is fine and the defrost circuit is the problem.',
        verdict: 'tech',
        appliesTo: 'RF French-door and RS side-by-side, roughly 2010 onward.',
      },
      {
        code: '5 E / 5 C',
        anchor: '5e-fridge',
        costBand: 'low',
        appliance: 'Refrigerator',
        means: 'The fresh-food defrost sensor is reading out of range — open circuit or short.',
        causes:
          'The sensor itself, or the connector behind the rear panel corroding. On coastal units the connector is the more common of the two.',
        verdict: 'tech',
        appliesTo: 'RF and RS series.',
      },
      {
        code: '88 88 / 8 8',
        anchor: '8888',
        costBand: 'low',
        appliance: 'Refrigerator',
        means: 'The control board took a power event and has not come back cleanly.',
        causes:
          'A surge, a brownout, or a generator changeover. Not a mechanical fault, and usually not a board failure either.',
        selfCheck:
          'Unplug the refrigerator — from the wall, not the switch — wait five full minutes and plug it back in. This clears it outright in most cases. If it returns within days, the board is genuinely failing and that is a different conversation.',
        verdict: 'diy',
        appliesTo: 'Most Samsung refrigerators with a front display.',
      },
      {
        code: 'OF OF / O FF',
        anchor: 'of-of',
        appliance: 'Refrigerator',
        means: 'Cooling is switched off. The machine is in demo mode.',
        causes:
          'It is the mode showrooms use to light the display without running the compressor, and it survives delivery more often than anyone at the store realises. The fridge is working perfectly and refusing to cool on purpose.',
        selfCheck:
          'Hold Energy Saver and Fridge together for several seconds — on some models it is Power Freeze and Fridge — until it chimes. The combination is printed in the manual for your model. Nothing else needs doing.',
        verdict: 'not-a-fault',
        appliesTo:
          'Most Samsung refrigerators. Worth checking first on any unit that has never cooled since the day it arrived.',
      },
      {
        code: 'PC ER / PC CH',
        anchor: 'pc-er',
        costBand: 'mid',
        appliance: 'Refrigerator',
        means: 'The display panel and the main board have stopped talking to each other.',
        causes: 'The ribbon connector at the door hinge, most often — it flexes every time the door opens.',
        verdict: 'tech',
        appliesTo: 'French-door models with a door-mounted panel.',
      },
      {
        code: '4C / 4E',
        anchor: '4c',
        costBand: 'low',
        appliance: 'Washer',
        means: 'The machine did not receive the water it asked for within the expected time.',
        causes:
          'A closed tap, a kinked hose, or blocked inlet screens at the back of the machine. The inlet valve itself is third on that list, not first.',
        selfCheck:
          'Check both taps are fully open, then unscrew the fill hoses at the machine end and look at the small mesh screens in the inlets. They clog with grit and they rinse clean.',
        verdict: 'diy',
        appliesTo: 'WF front-load and WA top-load, 2013 onward.',
      },
      {
        code: '5C / 5E',
        anchor: '5c',
        costBand: 'low',
        appliance: 'Washer',
        means: 'The machine could not empty within the expected time.',
        causes:
          'The pump filter, and it is an obstruction rather than a failure almost every time — coins, hair clips, underwire. Then the pump, then the drain hose or the standpipe it goes into.',
        selfCheck:
          'Small hatch, bottom front. Put a towel and a shallow tray down first because there will be water. Unscrew the filter, clear it, refit it firmly.',
        verdict: 'diy',
        appliesTo: 'WF front-load washers.',
      },
      {
        code: 'dC / DC',
        anchor: 'dc',
        costBand: 'low',
        appliance: 'Washer',
        means: 'The door is not registering as closed.',
        causes:
          'Laundry caught in the seal, or the door latch. If the door shuts firmly and the code stands, it is the latch or its switch.',
        selfCheck: 'Open it, clear the seal, close it deliberately.',
        verdict: 'diy',
        appliesTo: 'Front-load washers.',
      },
      {
        code: 'UB / UE / Ub',
        anchor: 'ub',
        costBand: 'varies',
        appliance: 'Washer',
        means: 'The load will not balance well enough to spin safely.',
        causes:
          'A genuinely uneven load first — one towel, one duvet, one bath mat. Then a machine that is not level on its feet. Then the suspension rods, and on older machines the tub bearing.',
        selfCheck:
          'Redistribute the load and run a spin on its own. Then check the machine does not rock when you push a corner — the feet adjust.',
        verdict: 'diy',
        appliesTo: 'Front-load and top-load washers.',
      },
      {
        code: 'LC / LE / 1C',
        anchor: 'lc',
        costBand: 'varies',
        appliance: 'Washer',
        means: 'Water has been detected where it should not be, and the machine has stopped.',
        causes: 'A leak at a hose, the bellows, or the pump seal. Occasionally the sensor itself has got damp and is over-reporting.',
        verdict: 'tech',
        appliesTo: 'Front-load washers with leak detection.',
      },
      {
        code: '3E / 3C',
        anchor: '3e',
        costBand: 'mid',
        appliance: 'Washer',
        means: 'The motor hall sensor is not reporting drum speed correctly.',
        causes:
          'The sensor or its connector, rather than the motor. A drum that has been jammed by an object wedged between drum and tub will also produce it.',
        verdict: 'tech',
        appliesTo: 'Direct-drive washers.',
      },
      {
        code: 'HE / HC / hE',
        anchor: 'he',
        costBand: 'high',
        appliance: 'Washer / Dryer',
        means: 'The heater circuit is not behaving — no heat, or heat that will not stop.',
        causes:
          'On a dryer, the heating element or a thermostat, and on a gas machine the igniter or flame sensor. On a washer, the element or its thermistor. On dryers a restricted vent frequently sits behind it.',
        verdict: 'tech',
        appliesTo: 'Samsung laundry with a heating circuit.',
      },
    ],
    seo: {
      title: 'Samsung Error Codes Explained | Orange County Repair',
      description:
        'What Samsung refrigerator, washer and dryer error codes actually mean — 22E, 5E, 88 88, OF OF, 4C, 5C, dC, UB. What you can fix yourself and what needs a technician.',
    },
  },

  {
    brandSlug: 'lg',
    name: 'LG',
    intro:
      'LG uses a two-letter system that is genuinely logical once you have seen it: the letter pair names the circuit, and the refrigerator codes prefix everything with ER. It is also the brand where reading the code most often saves a call-out entirely, because three of the most alarming displays are the machine working correctly — a child lock, a vent measurement and a self-test. Worth checking those before anything else.',
    howToRead:
      'Laundry shows the code where the remaining time normally sits. Refrigerators show it on the front panel, and some models only surface it after the door has been shut for a minute. If a washer display is showing nothing but the machine will not run, check whether the control panel is simply locked before assuming it is dead.',
    codes: [
      {
        code: 'CL',
        anchor: 'cl',
        appliance: 'Washer / Dryer',
        means: 'The child lock is on. The machine is fine.',
        causes: 'Somebody held the lock button, frequently by accident while loading.',
        selfCheck:
          'Hold the Child Lock button — usually marked with a padlock, often shared with another function — for three to five seconds until it clears.',
        verdict: 'not-a-fault',
        appliesTo: 'All LG laundry with a lock function.',
      },
      {
        code: 'D80 / D90 / D95',
        anchor: 'd80',
        costBand: 'low',
        photo: '03-dryer-lint.jpg',
        appliance: 'Dryer',
        means: 'The exhaust duct is 80, 90 or 95 per cent restricted. This is a measurement, not a fault.',
        causes:
          'Lint in the duct run, a crushed flexible hose behind the machine, or a blocked wall cap. Long runs and roof terminations reach these numbers faster.',
        selfCheck:
          'Pull the machine out and check the flexible hose is not crushed against the wall — that alone accounts for a lot of D80s. The rest of the run needs doing properly.',
        verdict: 'diy',
        appliesTo: 'LG dryers with flow sensing, roughly 2012 onward.',
      },
      {
        code: 'OE',
        anchor: 'oe',
        costBand: 'low',
        appliance: 'Washer',
        means: 'The machine could not drain within the expected time.',
        causes:
          'The pump filter first, then the pump, then the drain hose — including how high it rises and whether the standpipe is partly blocked.',
        selfCheck:
          'Lower access panel, bottom front. Towel down, small drain hose out first, then the filter. Expect water.',
        verdict: 'diy',
        appliesTo: 'LG front-load washers.',
      },
      {
        code: 'IE / 1E',
        anchor: 'ie',
        costBand: 'low',
        appliance: 'Washer',
        means: 'The machine did not fill in the expected time.',
        causes: 'Taps, hoses, or the inlet screens. The valve itself is a distant fourth.',
        selfCheck: 'Both taps fully open, hoses unkinked, then unscrew at the machine end and rinse the mesh screens.',
        verdict: 'diy',
        appliesTo: 'LG washers.',
      },
      {
        code: 'UE / uE',
        anchor: 'ue',
        costBand: 'varies',
        appliance: 'Washer',
        means: 'The load will not balance for a spin.',
        causes:
          'Load distribution, then levelling, then shock absorbers, then the bearing. A machine that has never balanced since installation is usually sitting on its shipping bolts or on an uneven floor.',
        selfCheck:
          'Redistribute and re-spin. Then push each top corner — if it rocks, adjust the feet and re-check.',
        verdict: 'diy',
        appliesTo: 'LG washers.',
      },
      {
        code: 'LE',
        anchor: 'le',
        costBand: 'mid',
        appliance: 'Washer',
        means: 'The motor is reporting a locked rotor — it was told to turn and did not.',
        causes:
          'The rotor position sensor on the Direct Drive stator, most often. Then an overloaded drum, then something jammed between drum and tub. The motor itself is rarely the answer, which matters because it is the expensive one.',
        verdict: 'tech',
        appliesTo: 'Direct Drive washers.',
      },
      {
        code: 'dE / dE1 / dE2',
        anchor: 'de',
        costBand: 'low',
        appliance: 'Washer',
        means: 'The door lock is not confirming closed.',
        causes: 'Laundry in the seal, then the latch assembly or its switch.',
        selfCheck: 'Clear the seal and close the door firmly.',
        verdict: 'diy',
        appliesTo: 'Front-load washers.',
      },
      {
        code: 'FE',
        anchor: 'fe',
        costBand: 'mid',
        appliance: 'Washer',
        means: 'Water level has gone past where it should — an overfill.',
        causes: 'The inlet valve not closing fully, or the pressure sensor misreading.',
        verdict: 'tech',
        appliesTo: 'LG washers.',
      },
      {
        code: 'PE / 1E',
        anchor: 'pe',
        costBand: 'mid',
        appliance: 'Washer',
        means: 'The water level sensor is out of range.',
        causes: 'The pressure switch or its air hose, which can perish or come off the port.',
        verdict: 'tech',
        appliesTo: 'LG washers.',
      },
      {
        code: 'tE / tE1 / tE2',
        anchor: 'te',
        costBand: 'mid',
        appliance: 'Washer / Dryer',
        means: 'A temperature sensor is reading out of range.',
        causes: 'The thermistor or its connector. On dryers, a restricted vent can push readings far enough to trip it.',
        verdict: 'tech',
        appliesTo: 'LG laundry.',
      },
      {
        code: 'ER RF / ER FF / ER IF',
        anchor: 'er-rf',
        costBand: 'mid',
        appliance: 'Refrigerator',
        means:
          'A fan is not confirming rotation — RF the fridge fan, FF the freezer fan, IF the ice maker fan.',
        causes:
          'Ice around the blade, which puts the real fault in the defrost circuit. Then the fan motor or its connector.',
        verdict: 'tech',
        appliesTo: 'LG French-door and side-by-side refrigerators.',
      },
      {
        code: 'ER dH',
        anchor: 'er-dh',
        costBand: 'mid',
        appliance: 'Refrigerator',
        means: 'The defrost cycle ran and the evaporator did not reach the temperature it should have.',
        causes: 'Defrost heater, defrost sensor, or the control driving them.',
        verdict: 'tech',
        appliesTo: 'LG refrigerators.',
      },
      {
        code: 'ER CO / ER IS',
        anchor: 'er-co',
        costBand: 'mid',
        appliance: 'Refrigerator',
        means: 'Communication between the display and the main board has failed.',
        causes: 'The harness through the door hinge, or a connector that has worked loose.',
        verdict: 'tech',
        appliesTo: 'LG refrigerators with a door display.',
      },
      {
        code: 'No code, no cooling',
        anchor: 'no-cooling',
        costBand: 'high',
        appliance: 'Refrigerator',
        means:
          'Nothing on the display, both compartments warm. Listed here because it is the LG fault people search hardest for and it does not announce itself.',
        causes:
          'The linear compressor or the inverter board that drives it. They present identically and are very different repairs.',
        selfCheck:
          'Establish the warranty position before anything else. LG covers the compressor for ten years through their own network, and certain 2014–2017 models carried extended terms under a class-action settlement. Call LG first — an independent repair to the sealed system ends that coverage.',
        verdict: 'tech',
        appliesTo: 'Linear-compressor refrigerators, roughly 2014 onward.',
      },
    ],
    seo: {
      title: 'LG Error Codes Explained | Orange County Repair',
      description:
        'What LG washer, dryer and refrigerator codes mean — OE, UE, LE, IE, dE, CL, D80/D90, ER RF, ER dH. Which are faults, which are not, and what each one needs.',
    },
  },

  {
    brandSlug: 'whirlpool',
    name: 'Whirlpool',
    intro:
      'Whirlpool moved from two-digit F-codes to an F-and-E pairing — F for the system, E for the specific fault within it — which is more precise than what came before and less widely understood. The same codes appear on Maytag, KitchenAid and Amana machines, because they are the same platforms underneath. Older machines with no display say the same things by blinking, and those patterns are worth counting rather than ignoring.',
    howToRead:
      'Machines with a display show the code directly. On models without one, the status lights blink a pattern — count the flashes, note the pause, and tell us both. On many top-loaders you can enter the diagnostic mode by turning the dial through a specific sequence; the sequence is model-specific and printed in the tech sheet, which lives in a plastic pouch under the console or behind the kick panel.',
    codes: [
      {
        code: 'F21 / F02',
        anchor: 'f21',
        costBand: 'low',
        appliance: 'Washer',
        means: 'The machine took too long to drain.',
        causes:
          'The coin trap or drain pump obstructed, almost always. Then the pump itself, then a drain hose pushed too far into the standpipe so it siphons.',
        selfCheck:
          'On front-loaders the trap is behind the lower panel — towel down first. Clear it and run a rinse-and-spin to test.',
        verdict: 'diy',
        appliesTo: 'Duet and other front-load platforms.',
      },
      {
        code: 'F5 E3',
        anchor: 'f5e3',
        costBand: 'low',
        photo: '02-washer-door-latch.jpg',
        appliance: 'Washer',
        means: 'The door or lid lock will not release.',
        causes: 'The lock assembly, which is a known wear item across the top-load platform. Occasionally the control driving it.',
        selfCheck:
          'Cut power at the breaker for a minute — the lock releases on some models and lets you retrieve the load. That is a rescue, not a repair; the code will return.',
        verdict: 'tech',
        appliesTo: 'Top-load and front-load washers with an electronic lock.',
      },
      {
        code: 'F7 E1',
        anchor: 'f7e1',
        costBand: 'mid',
        appliance: 'Washer',
        means: 'The motor did not reach the speed it was asked for.',
        causes:
          'On the top-load platform this is very often the shift actuator failing to engage rather than the motor. Then an overloaded drum, then the motor control.',
        verdict: 'tech',
        appliesTo: 'VMW top-load platform.',
      },
      {
        code: 'F8 E1 / LF / LO FL',
        anchor: 'f8e1',
        costBand: 'low',
        appliance: 'Washer / Dishwasher',
        means: 'Long fill — the machine did not get the water it asked for in time.',
        causes: 'Taps, hoses, inlet screens. Then the valve. On dishwashers, the float or the flow meter.',
        selfCheck: 'Taps fully open, hoses unkinked, screens rinsed at the machine end.',
        verdict: 'diy',
        appliesTo: 'Whirlpool laundry and dishwashers.',
      },
      {
        code: 'F8 E4',
        anchor: 'f8e4',
        costBand: 'mid',
        appliance: 'Dishwasher',
        means: 'The flow meter is reporting water the machine did not expect — usually an overfill.',
        causes:
          'The flow meter itself, the inlet valve failing to close, or the float switch. Shared with KitchenAid, which uses the same platform.',
        verdict: 'tech',
        appliesTo: 'Whirlpool and KitchenAid dishwashers with a flow meter.',
      },
      {
        code: 'Sud / SD / SUdS',
        anchor: 'sud',
        appliance: 'Washer',
        means: 'Too much foam. The machine has paused to let it collapse.',
        causes:
          'Ordinary detergent in a high-efficiency machine, or too much HE detergent. Genuinely not a fault the first time it happens.',
        selfCheck:
          'Run a rinse-and-spin with nothing in the drum and no detergent. Then use HE detergent and less than you think — the dose on the bottle assumes a full, dirty load.',
        verdict: 'not-a-fault',
        appliesTo: 'HE top-load and front-load washers.',
      },
      {
        code: 'dr / dET',
        anchor: 'dr',
        costBand: 'low',
        appliance: 'Washer',
        means: 'The detergent dispensing system is reporting a fault or needs setting up.',
        causes: 'On load-and-go models, an empty reservoir or a dispenser that has not been primed. Then the dispenser motor.',
        verdict: 'diy',
        appliesTo: 'Washers with a bulk detergent reservoir.',
      },
      {
        code: 'F01',
        anchor: 'f01',
        costBand: 'high',
        appliance: 'Dryer',
        means: 'A main control board fault.',
        causes: 'The board itself, or a connector on it that has overheated at a terminal.',
        verdict: 'tech',
        appliesTo: 'Whirlpool electronic dryers.',
      },
      {
        code: 'AF',
        anchor: 'af',
        costBand: 'low',
        photo: '03-dryer-lint.jpg',
        appliance: 'Dryer',
        means: 'Restricted airflow. The machine is not exhausting properly.',
        causes:
          'Lint in the duct run, a crushed flexible hose, or a blocked wall cap. Left alone this is what eventually opens the thermal fuse and takes the heat out altogether.',
        selfCheck: 'Check the flexible hose behind the machine is not crushed, then have the full run cleared.',
        verdict: 'diy',
        appliesTo: 'Whirlpool dryers with airflow sensing.',
      },
      {
        code: 'PF',
        anchor: 'pf',
        appliance: 'Washer / Dryer',
        means: 'Power failure — the machine lost supply mid-cycle.',
        causes: 'A trip, a brownout, or a loose plug. Not a fault in the machine unless it recurs.',
        selfCheck: 'Press Start to resume. If it keeps happening on one circuit, the outlet or breaker wants looking at.',
        verdict: 'not-a-fault',
        appliesTo: 'Whirlpool laundry.',
      },
      {
        code: 'F9 E1',
        anchor: 'f9e1',
        costBand: 'low',
        appliance: 'Washer',
        means: 'Long drain — water is leaving, but far too slowly.',
        causes: 'A partially blocked pump or filter, or a drain hose kinked behind the machine.',
        selfCheck: 'Clear the coin trap and check the hose behind the machine has not been crushed against the wall.',
        verdict: 'diy',
        appliesTo: 'Whirlpool washers.',
      },
    ],
    seo: {
      title: 'Whirlpool Error Codes Explained | Orange County Repair',
      description:
        'What Whirlpool washer, dryer and dishwasher codes mean — F21, F5 E3, F7 E1, F8 E1, F8 E4, Sud, AF, PF. Which you can clear yourself and which need a technician.',
    },
  },

  {
    brandSlug: 'ge',
    name: 'GE',
    intro:
      'GE is the least consistent of the mainstream brands about codes, and saying so is more useful than pretending otherwise. Ranges and wall ovens use a clear F-series that has held steady for decades. Refrigerators and laundry mostly do not display codes at all — they blink, or they simply misbehave — and on those the diagnosis comes from what the machine is doing rather than from what it says. The oven codes below are the ones worth knowing, because they separate a cheap repair from an expensive one before anything is ordered.',
    howToRead:
      'Ranges and wall ovens show the code on the clock display. Dishwashers on newer models show it on the panel; older ones blink the cycle lights. Refrigerators generally have no user-facing code — a technician reads them through a service mode instead. If your GE fridge is misbehaving without a display, that is normal for the brand and not a sign the board has failed.',
    codes: [
      {
        code: 'F2 / F20',
        anchor: 'f2',
        costBand: 'varies',
        appliance: 'Oven / Range',
        means: 'The oven exceeded its safe temperature and shut down.',
        causes:
          'The temperature sensor reading low so the control keeps heating, or a relay on the control board that has welded closed. Those two are very different bills and a sensor test separates them in minutes.',
        verdict: 'tech',
        appliesTo: 'GE ranges and wall ovens with an electronic control.',
      },
      {
        code: 'F3 / F4',
        anchor: 'f3',
        costBand: 'mid',
        appliance: 'Oven / Range',
        means: 'The oven temperature sensor circuit is open (F3) or shorted (F4).',
        causes: 'The sensor probe itself, or its harness where it passes through the oven wall.',
        verdict: 'tech',
        appliesTo: 'GE ranges and wall ovens.',
      },
      {
        code: 'F7',
        anchor: 'f7',
        costBand: 'mid',
        appliance: 'Oven / Range',
        means: 'A key on the touch panel is registering as permanently pressed.',
        causes:
          'The membrane rather than the board behind it — and this is the distinction that matters, because the membrane is much the cheaper part and the two present identically as a dead or erratic panel.',
        selfCheck:
          'Cut power for five minutes and restore it. If F7 returns immediately with nothing touched, the membrane is the suspect.',
        verdict: 'tech',
        appliesTo: 'GE ranges and wall ovens with a touch panel.',
      },
      {
        code: 'F9 / F9 E0',
        anchor: 'f9',
        costBand: 'mid',
        appliance: 'Oven / Range',
        means: 'The door lock motor or its switch is not reporting the position it should.',
        causes: 'The lock motor, the switch, or something obstructing the latch. Most often noticed after a self-clean cycle.',
        verdict: 'tech',
        appliesTo: 'GE ovens with a motorised self-clean lock.',
      },
      {
        code: 'F0',
        anchor: 'f0',
        costBand: 'low',
        appliance: 'Oven / Range',
        means: 'A stuck key or a control that is not clearing.',
        causes: 'The membrane, as with F7. Sometimes clears with a power cycle and stays clear.',
        selfCheck: 'Cut power at the breaker for five minutes.',
        verdict: 'diy',
        appliesTo: 'GE ranges with an electronic clock.',
      },
      {
        code: 'Blinking cycle lights',
        anchor: 'blinking-lights',
        costBand: 'varies',
        appliance: 'Dishwasher',
        means: 'A fault code, expressed as a blink pattern rather than a number.',
        causes:
          'The pattern is what identifies it. Count the flashes and the length of the pause between groups, and tell us both — it points at the drain, the heater or the control, which are three quite different repairs.',
        verdict: 'tech',
        appliesTo: 'GE dishwashers without an alphanumeric display.',
      },
      {
        code: 'No display, no water at the door',
        anchor: 'no-water',
        costBand: 'low',
        appliance: 'Refrigerator',
        means:
          'Listed because GE refrigerators mostly do not announce faults, and this is the most common one.',
        causes:
          'The water filter overdue, then the inlet valve, then a supply line frozen where it passes through an unheated space.',
        selfCheck:
          'Change the filter first — it is the cheapest thing it can be and it is overdue on most units we see. If a fresh filter changes nothing, the valve is next.',
        verdict: 'diy',
        appliesTo: 'GE refrigerators with a dispenser.',
      },
    ],
    seo: {
      title: 'GE Error Codes Explained | Orange County Repair',
      description:
        'What GE oven, range and dishwasher codes mean — F2, F3, F4, F7, F9, blinking dishwasher lights. Why GE refrigerators show no code, and what to check instead.',
    },
  },

  {
    brandSlug: 'maytag',
    name: 'Maytag',
    intro:
      'Maytag has been built by Whirlpool since 2006, and the codes are Whirlpool codes — the same F-and-E pairing, on the same platforms. The Bravos top-loaders are the exception worth knowing: they use their own short set, mostly two characters, and F51 in particular gets misread as a motor failure when it is a sensor. Pre-2006 Neptune machines predate all of this and follow no system listed here.',
    howToRead:
      'Machines with a display show the code where the cycle time sits. Bravos models show a short code on the estimated-time display. On anything without a display, count the blink pattern. The tech sheet in the plastic pouch under the console gives the diagnostic entry sequence for your exact model.',
    codes: [
      {
        code: 'F51 / rPS',
        anchor: 'f51',
        costBand: 'mid',
        appliance: 'Washer',
        means: 'The rotor position sensor is not reporting drum position correctly.',
        causes:
          'The sensor or its harness, and occasionally the bolt holding the rotor having worked loose. Not the motor — which is what this frequently gets quoted as.',
        verdict: 'tech',
        appliesTo: 'Bravos top-load washers.',
      },
      {
        code: 'uL / UL',
        anchor: 'ul',
        costBand: 'low',
        appliance: 'Washer',
        means: 'The load is unbalanced and the machine will not spin at full speed.',
        causes: 'Load distribution, then levelling, then suspension rods.',
        selfCheck: 'Redistribute and re-spin. Check the machine does not rock when pushed at a corner.',
        verdict: 'diy',
        appliesTo: 'Bravos and other Maytag top-loaders.',
      },
      {
        code: 'Ld',
        anchor: 'ld',
        costBand: 'low',
        appliance: 'Washer',
        means: 'Long drain — the water is leaving too slowly.',
        causes: 'The pump or an obstruction in it, then the drain hose.',
        verdict: 'diy',
        appliesTo: 'Bravos platform.',
      },
      {
        code: 'oL',
        anchor: 'ol',
        appliance: 'Washer',
        means: 'The drum is overloaded for the cycle selected.',
        causes: 'Too much in it, or one very heavy item. Genuinely not a fault.',
        selfCheck: 'Take some out and restart.',
        verdict: 'not-a-fault',
        appliesTo: 'Maytag top-loaders.',
      },
      {
        code: 'Sd / Sud',
        anchor: 'sd',
        appliance: 'Washer',
        means: 'Excess suds. The machine has paused to let the foam collapse.',
        causes: 'Non-HE detergent, or too much of the HE kind.',
        selfCheck: 'Rinse-and-spin with an empty drum and no detergent, then use less next time.',
        verdict: 'not-a-fault',
        appliesTo: 'HE Maytag washers.',
      },
      {
        code: 'F5 E3',
        anchor: 'maytag-f5e3',
        costBand: 'low',
        photo: '02-washer-door-latch.jpg',
        appliance: 'Washer',
        means: 'The lid lock will not release.',
        causes: 'The lock assembly — a wear item across the shared Whirlpool platform.',
        verdict: 'tech',
        appliesTo: 'Maytag washers on the Whirlpool top-load platform.',
      },
      {
        code: 'F8 E1 / LF',
        anchor: 'maytag-f8e1',
        costBand: 'low',
        appliance: 'Washer',
        means: 'Long fill — the water did not arrive in time.',
        causes: 'Taps, hoses, inlet screens, then the valve.',
        selfCheck: 'Taps fully open, hoses unkinked, screens rinsed.',
        verdict: 'diy',
        appliesTo: 'Maytag washers.',
      },
      {
        code: 'PF',
        anchor: 'maytag-pf',
        appliance: 'Washer / Dryer',
        means: 'Power was lost mid-cycle.',
        causes: 'A trip or a loose plug. Not a machine fault unless it repeats.',
        selfCheck: 'Press Start to resume.',
        verdict: 'not-a-fault',
        appliesTo: 'Maytag laundry.',
      },
    ],
    seo: {
      title: 'Maytag Error Codes Explained | Orange County Repair',
      description:
        'What Maytag washer and dryer codes mean — F51, uL, Ld, oL, Sd, F5 E3, F8 E1. Why F51 is a sensor and not a motor, and which codes are not faults at all.',
    },
  },

  {
    brandSlug: 'kitchenaid',
    name: 'KitchenAid',
    intro:
      'KitchenAid dishwashers are the reason this page exists — they are the most common machine in the county wearing this badge, and they report faults two ways depending on age. Newer models show an F-and-E code on the display. Older ones blink the clean light in a pattern, and that pattern is a code even though it does not look like one. Counting it properly is the difference between us arriving with the right part and arriving to look.',
    howToRead:
      'On models with a display, the code appears when the cycle aborts. On models without, watch the clean light: it flashes in groups separated by a pause, and the number of flashes in the first and second group is the code. Count both and tell us, or film ten seconds of it on your phone — that is genuinely as useful as the number.',
    codes: [
      {
        code: 'F8 E4',
        anchor: 'ka-f8e4',
        costBand: 'mid',
        appliance: 'Dishwasher',
        means: 'The flow meter is reporting more water than the cycle asked for.',
        causes: 'The flow meter, the inlet valve failing to shut fully, or the float switch. Shared with the Whirlpool platform.',
        verdict: 'tech',
        appliesTo: 'KitchenAid dishwashers with a flow meter.',
      },
      {
        code: 'F6 E4',
        anchor: 'ka-f6e4',
        costBand: 'low',
        appliance: 'Dishwasher',
        means: 'The float or its switch is reporting a level the control does not expect.',
        causes: 'A stuck float, debris under it, or the switch itself.',
        selfCheck: 'Look in the base of the tub for the small float dome and check it moves freely when lifted.',
        verdict: 'diy',
        appliesTo: 'KitchenAid dishwashers.',
      },
      {
        code: 'F7 E1',
        anchor: 'ka-f7e1',
        costBand: 'mid',
        appliance: 'Dishwasher',
        means: 'The wash motor is not reaching the speed it was asked for.',
        causes: 'The circulation pump, or something jammed in the impeller — glass fragments are a frequent culprit.',
        verdict: 'tech',
        appliesTo: 'KitchenAid dishwashers.',
      },
      {
        code: 'F9 E1',
        anchor: 'ka-f9e1',
        costBand: 'low',
        appliance: 'Dishwasher',
        means: 'The machine is draining too slowly.',
        causes:
          'The drain pump, the check valve, the air gap at the sink, or the disposal knockout plug still in place from installation. That last one is free to fix and worth ruling out first.',
        selfCheck:
          'If the dishwasher was fitted at the same time as a new garbage disposal, ask whether the knockout plug was removed. It is a very common miss.',
        verdict: 'diy',
        appliesTo: 'KitchenAid dishwashers.',
      },
      {
        code: 'F2 E2',
        anchor: 'ka-f2e2',
        costBand: 'mid',
        appliance: 'Dishwasher',
        means: 'A user-interface fault — the control panel is not communicating properly.',
        causes: 'The touch panel or the ribbon between it and the main board.',
        verdict: 'tech',
        appliesTo: 'KitchenAid dishwashers with an electronic panel.',
      },
      {
        code: 'Clean light blinking 7 times',
        anchor: 'ka-blink-7',
        costBand: 'mid',
        appliance: 'Dishwasher',
        means: 'A heater circuit fault on models that report by blink pattern.',
        causes: 'The heating element or its relay on the control. This is the fault behind "nothing dries any more".',
        selfCheck: 'Count the flashes and the pause before calling — a different count is a different repair entirely.',
        verdict: 'tech',
        appliesTo: 'Older KitchenAid dishwashers without an alphanumeric display.',
      },
      {
        code: 'Clean light blinking, other patterns',
        anchor: 'ka-blink-other',
        costBand: 'varies',
        appliance: 'Dishwasher',
        means: 'A code — the pattern names which system, and the manual for your model lists the set.',
        causes:
          'Most commonly drain, heater or control. We would rather you counted it than guessed: it decides what comes on the van.',
        verdict: 'tech',
        appliesTo: 'Older KitchenAid dishwashers.',
      },
    ],
    seo: {
      title: 'KitchenAid Error Codes Explained | Orange County Repair',
      description:
        'What KitchenAid dishwasher codes and clean-light blink patterns mean — F8 E4, F6 E4, F7 E1, F9 E1, F2 E2. How to count a blink code and what each one needs.',
    },
  },

  {
    brandSlug: 'frigidaire',
    name: 'Frigidaire',
    intro:
      'Frigidaire has one of the more useful code sets in the mainstream market, and the refrigerator codes in particular name the circuit outright — SY EF says the evaporator fan, and that is a diagnosis rather than a hint. The oven control codes are equally direct and matter more than most, because they separate a cheap membrane from an expensive control board before anything is ordered. The same set applies to Electrolux, which shares the platform.',
    howToRead:
      'Refrigerators alternate the code with the temperature on the front display. Ovens show it on the clock. On laundry, the code appears where the cycle time sits, and on some models only after the door is opened and closed once.',
    codes: [
      {
        code: 'SY EF',
        anchor: 'sy-ef',
        costBand: 'mid',
        appliance: 'Refrigerator',
        means: 'The evaporator fan circuit has failed to report correctly.',
        causes: 'Ice around the blade — which points at the defrost circuit — then the fan motor, then its wiring.',
        verdict: 'tech',
        appliesTo: 'Frigidaire French-door and side-by-side refrigerators.',
      },
      {
        code: 'SY CE',
        anchor: 'sy-ce',
        costBand: 'low',
        appliance: 'Refrigerator',
        means: 'The control boards have lost communication with each other.',
        causes: 'A harness or connector, frequently at the hinge where it flexes. Sometimes clears with a power cycle.',
        selfCheck: 'Unplug at the wall for five minutes and restore. If it returns, it is a connector rather than a glitch.',
        verdict: 'diy',
        appliesTo: 'Frigidaire refrigerators with a front display.',
      },
      {
        code: 'dF / df',
        anchor: 'df',
        costBand: 'mid',
        appliance: 'Refrigerator',
        means: 'A defrost fault — the cycle ran and did not achieve what it should.',
        causes: 'Defrost heater, defrost thermostat, or the adaptive defrost control.',
        verdict: 'tech',
        appliesTo: 'Frigidaire refrigerators.',
      },
      {
        code: 'OP / SH',
        anchor: 'op-sh',
        costBand: 'low',
        appliance: 'Refrigerator',
        means: 'A temperature sensor is reading open (OP) or shorted (SH).',
        causes: 'The sensor itself or its connector. Which compartment it names tells us where to go.',
        verdict: 'tech',
        appliesTo: 'Frigidaire refrigerators.',
      },
      {
        code: 'F10',
        anchor: 'f10',
        costBand: 'varies',
        appliance: 'Oven / Range',
        means: 'Runaway temperature — the oven got hotter than commanded and shut down.',
        causes:
          'The temperature probe reading low, or a relay on the electronic oven control welded closed. Testing the probe separates them, and the difference in cost is large.',
        verdict: 'tech',
        appliesTo: 'Frigidaire ranges and wall ovens with an EOC.',
      },
      {
        code: 'F11',
        anchor: 'f11',
        costBand: 'mid',
        appliance: 'Oven / Range',
        means: 'A key on the touch panel is registering as stuck.',
        causes:
          'The membrane, most often — and this is the entry worth reading before agreeing to a control board. Both faults present as a dead or erratic panel and only one of them is expensive.',
        selfCheck: 'Cut power for five minutes. If F11 returns with nothing touched, the membrane is the suspect.',
        verdict: 'tech',
        appliesTo: 'Frigidaire ranges with a touch panel.',
      },
      {
        code: 'F30 / F31',
        anchor: 'f30',
        costBand: 'mid',
        appliance: 'Oven / Range',
        means: 'The oven temperature probe circuit is open (F30) or shorted (F31).',
        causes: 'The probe or its harness at the oven wall.',
        verdict: 'tech',
        appliesTo: 'Frigidaire ovens.',
      },
      {
        code: 'F90',
        anchor: 'f90',
        costBand: 'mid',
        appliance: 'Oven / Range',
        means: 'The self-clean door lock motor is not reaching its position.',
        causes: 'The lock motor, its switch, or an obstruction at the latch.',
        verdict: 'tech',
        appliesTo: 'Frigidaire ovens with motorised self-clean lock.',
      },
      {
        code: 'E10 / E11',
        anchor: 'e10',
        costBand: 'low',
        appliance: 'Washer',
        means: 'The machine did not fill in time.',
        causes: 'Taps, hoses, inlet screens, then the valve.',
        selfCheck: 'Taps fully open, hoses unkinked, screens rinsed at the machine end.',
        verdict: 'diy',
        appliesTo: 'Frigidaire front-load washers.',
      },
      {
        code: 'E20 / E21',
        anchor: 'e20',
        costBand: 'low',
        appliance: 'Washer',
        means: 'The machine could not drain in time.',
        causes: 'The pump filter or an obstruction in it, then the pump, then the drain hose.',
        selfCheck: 'Lower access panel, towel down, clear the filter.',
        verdict: 'diy',
        appliesTo: 'Frigidaire front-load washers.',
      },
    ],
    seo: {
      title: 'Frigidaire Error Codes Explained | Orange County Repair',
      description:
        'What Frigidaire refrigerator, oven and washer codes mean — SY EF, SY CE, dF, F10, F11, F30, F90, E20. Why F11 is usually the keypad and not the control board.',
    },
  },

  {
    brandSlug: 'electrolux',
    name: 'Electrolux',
    intro:
      'Electrolux and Frigidaire share a parent and much of a platform, and the codes reflect it — the refrigeration set is effectively the same, and the laundry uses an E-numbered system where the first digit names the system and the second the specific fault. That structure is worth knowing: everything in the E1x family is water arriving, everything in E2x is water leaving. It narrows a diagnosis before anybody opens a panel.',
    howToRead:
      'Laundry shows the code where the cycle time sits. Refrigerators use the front display and the same SY-prefixed set as Frigidaire. On some laundry models the last few codes can be recalled through a diagnostic mode, which is useful when a fault is intermittent and has cleared by the time we arrive.',
    codes: [
      {
        code: 'E11 / E13',
        anchor: 'e11',
        costBand: 'varies',
        appliance: 'Washer',
        means: 'A fill fault — water did not arrive as expected (E11), or was detected where it should not be (E13).',
        causes:
          'For E11: taps, hoses, inlet screens, then the valve. For E13: a leak inside the cabinet, which wants looking at rather than resetting.',
        selfCheck: 'On E11, check the taps and rinse the inlet screens. On E13, stop using the machine until it has been looked at.',
        verdict: 'tech',
        appliesTo: 'Electrolux front-load washers.',
      },
      {
        code: 'E20 / E21',
        anchor: 'elux-e20',
        costBand: 'low',
        appliance: 'Washer',
        means: 'The machine could not drain in time.',
        causes: 'The pump filter, then the pump, then the drain hose or standpipe.',
        selfCheck: 'Lower access door, towel down, small drain hose first, then the filter.',
        verdict: 'diy',
        appliesTo: 'Electrolux front-load washers.',
      },
      {
        code: 'E23 / E24',
        anchor: 'e23',
        costBand: 'mid',
        appliance: 'Washer',
        means: 'The drain pump circuit or its control is reporting a fault.',
        causes: 'The pump motor or the triac on the control that drives it.',
        verdict: 'tech',
        appliesTo: 'Electrolux washers.',
      },
      {
        code: 'E5E / E57 / E58',
        anchor: 'e5e',
        costBand: 'high',
        appliance: 'Washer',
        means: 'A motor circuit fault — current or speed outside the expected range.',
        causes: 'The motor, the control, or a drum physically obstructed.',
        verdict: 'tech',
        appliesTo: 'Electrolux washers.',
      },
      {
        code: 'E64',
        anchor: 'e64',
        costBand: 'mid',
        appliance: 'Dryer',
        means: 'The heating element circuit is out of range.',
        causes: 'The element or a thermostat. A restricted vent is often what took the element out in the first place.',
        verdict: 'tech',
        appliesTo: 'Electrolux dryers.',
      },
      {
        code: 'E68',
        anchor: 'e68',
        costBand: 'mid',
        appliance: 'Dryer',
        means: 'A key on the panel is registering as stuck.',
        causes: 'The membrane or the control panel behind it.',
        selfCheck: 'Cut power for five minutes and restore.',
        verdict: 'tech',
        appliesTo: 'Electrolux dryers with a touch panel.',
      },
      {
        code: 'No steam on a steam cycle',
        anchor: 'no-steam',
        costBand: 'mid',
        appliance: 'Dryer',
        means:
          'Listed without a code because it often has none — the cycle simply fails or completes without steaming.',
        causes:
          'The steam inlet valve. It is a distinctly Electrolux call, because steam is standard across this laundry line rather than an upgrade, and a valve that stops feeding it takes those cycles down while everything else keeps working.',
        verdict: 'tech',
        appliesTo: 'Electrolux steam dryers.',
      },
      {
        code: 'SY EF / SY CE',
        anchor: 'elux-sy-ef',
        costBand: 'mid',
        appliance: 'Refrigerator',
        means: 'Evaporator fan circuit (SY EF) or a communication fault between boards (SY CE).',
        causes: 'The same as on Frigidaire, because it is the same platform — ice at the fan blade, or a connector at the hinge.',
        selfCheck: 'On SY CE, unplug for five minutes and restore before assuming the worst.',
        verdict: 'tech',
        appliesTo: 'Electrolux French-door refrigerators.',
      },
    ],
    seo: {
      title: 'Electrolux Error Codes Explained | Orange County Repair',
      description:
        'What Electrolux washer, dryer and refrigerator codes mean — E11, E20, E23, E5E, E64, E68, SY EF. Why the E1x family is fill and E2x is drain.',
    },
  },

  {
    brandSlug: 'bosch',
    name: 'Bosch',
    intro:
      'Bosch uses a short E-numbered set and it is unusually honest about what it knows: the codes report what was detected and make no claim about the cause. E15 is the one everybody meets, and it is the clearest example — it says water reached the base pan, and it says nothing whatsoever about which seal, hose or pump let it there. Clearing the pan clears the code and fixes nothing, which is why that entry is written the way it is.',
    howToRead:
      'Dishwashers show the code on the display when the cycle aborts; on models without a display the fault shows as a specific light staying lit. Laundry shows the code where the time remaining sits. Bosch dishwashers with no display can be put into a service mode with a button combination that is model-specific — the manual lists it.',
    codes: [
      {
        code: 'E15',
        anchor: 'e15',
        costBand: 'varies',
        appliance: 'Dishwasher',
        means: 'Water has reached the base pan and the float has cut the machine off.',
        causes:
          'A door seal, a hose, a pump seal, or the sump. The code is accurate about the symptom and silent about the source — finding the water is the actual repair.',
        selfCheck:
          'Tipping the machine back to drain the pan will clear the code, and the fault will return, because the leak is still there. Worth knowing so you are not surprised when it does.',
        verdict: 'tech',
        appliesTo: 'Bosch dishwashers across the 100–800 and Benchmark series.',
      },
      {
        code: 'E24 / E25',
        anchor: 'bosch-e24',
        costBand: 'low',
        appliance: 'Dishwasher',
        means: 'The machine could not drain — blocked (E24) or the pump is not performing (E25).',
        causes:
          'The filter in the base of the tub, then the drain hose loop, then the pump. Bosch relies on a correctly installed high loop or air gap, and in a retrofitted kitchen that is frequently where the problem lives.',
        selfCheck:
          'Lift out the filter assembly in the tub floor and rinse it — it twists out by hand. Check nothing is standing in the sump.',
        verdict: 'diy',
        appliesTo: 'Bosch dishwashers.',
      },
      {
        code: 'E09',
        anchor: 'e09',
        costBand: 'high',
        appliance: 'Dishwasher',
        means: 'The heating circuit is not performing.',
        causes: 'The flow-through heater or the control that drives it. Presents as cold washes and nothing drying.',
        verdict: 'tech',
        appliesTo: 'Bosch dishwashers with a flow-through heater.',
      },
      {
        code: 'E22',
        anchor: 'e22',
        costBand: 'low',
        appliance: 'Dishwasher',
        means: 'The filter is blocked enough to restrict circulation.',
        causes: 'The filter assembly in the tub floor, which needs rinsing every few weeks and rarely gets it.',
        selfCheck: 'Twist out the filter, rinse under the tap, refit and turn until it seats.',
        verdict: 'diy',
        appliesTo: 'Bosch dishwashers.',
      },
      {
        code: 'E01 / E02',
        anchor: 'e01',
        costBand: 'high',
        appliance: 'Dishwasher',
        means: 'A control or motor circuit fault.',
        causes: 'The main control board, or the wash motor it drives.',
        verdict: 'tech',
        appliesTo: 'Bosch dishwashers.',
      },
      {
        code: 'E18',
        anchor: 'e18',
        costBand: 'low',
        appliance: 'Washer',
        means: 'The washing machine could not drain.',
        causes: 'The pump filter behind the lower flap, then the pump, then the hose.',
        selfCheck: 'Lower flap at the front, towel down, unscrew the filter and clear it.',
        verdict: 'diy',
        appliesTo: 'Bosch front-load washers.',
      },
      {
        code: 'Dishes wet at the end of the cycle',
        anchor: 'wet-dishes',
        appliance: 'Dishwasher',
        means: 'Listed here because it produces more calls than any code, and it is usually not a fault.',
        causes:
          'Bosch dries by condensation rather than with a heating element, so plastics staying damp is the design working as intended. Where drying has genuinely got worse over time, scale from hard water on the sensor or an empty rinse-aid reservoir is the more likely cause.',
        selfCheck: 'Fill the rinse aid, and open the door once the cycle finishes rather than leaving it shut.',
        verdict: 'not-a-fault',
        appliesTo: 'All Bosch dishwashers using condensation drying.',
      },
    ],
    seo: {
      title: 'Bosch Error Codes Explained | Orange County Repair',
      description:
        'What Bosch dishwasher and washer codes mean — E15, E24, E25, E09, E22, E18. Why draining the base pan does not fix E15, and why wet dishes are not a fault.',
    },
  },

  {
    brandSlug: 'kenmore',
    name: 'Kenmore',
    intro:
      'There is no Kenmore code set, because there was never a Kenmore factory. Sears sold machines built by Whirlpool, LG, Frigidaire and GE under one badge, and each of them kept its own codes. So the useful page here is not a list of codes — it is the map from your model number to whose list applies. The first three digits do it, and once you have them the right page is one click away.',
    howToRead:
      'Find the model and serial plate: inside the refrigerator on the left wall, on the washer under the lid or on the back panel, on the dishwasher door edge, on the range behind the storage drawer. The number begins with three digits and a full stop — those three are the builder. Everything after identifies the platform, so photograph the whole plate rather than just the prefix.',
    codes: [
      {
        code: 'Dryer runs, no heat',
        anchor: 'kenmore-no-heat',
        costBand: 'low',
        photo: '03-dryer-lint.jpg',
        appliance: 'Dryer',
        means: 'Listed separately because it is true across every Kenmore dryer regardless of who built it.',
        causes:
          'A thermal fuse opened by a restricted vent. The fuse is the symptom; the duct is the cause. Fitting a fuse into a blocked run gets you a fortnight.',
        selfCheck: 'Check the flexible hose behind the machine is not crushed, and have the full run cleared.',
        verdict: 'tech',
        appliesTo: 'All Kenmore dryers.',
      },
      {
        code: 'No code at all',
        anchor: 'kenmore-no-code',
        appliance: 'Any Kenmore',
        means: 'Common on older Kenmore, which mostly predates alphanumeric displays.',
        causes:
          'Nothing — these machines report by blink pattern or not at all. Diagnosis comes from behaviour rather than display, and the model plate is what tells us where to start.',
        verdict: 'tech',
        appliesTo: 'Kenmore appliances without a digital display.',
      },
    ],
    crossReference: [
      {
        prefix: '110 / 106',
        builder: 'Whirlpool',
        brandSlug: 'whirlpool',
        note: 'Washers, dryers and refrigerators. Uses the Whirlpool F-and-E codes and the Whirlpool parts catalogue.',
      },
      {
        prefix: '665 / 587',
        builder: 'Whirlpool',
        brandSlug: 'whirlpool',
        note: 'Dishwashers. Same platform, same codes, same drain and float faults.',
      },
      {
        prefix: '795',
        builder: 'LG',
        brandSlug: 'lg',
        note: 'Refrigerators. Uses the LG ER-prefixed set — and the LG compressor warranty may still apply under the Kenmore badge.',
      },
      {
        prefix: '796',
        builder: 'LG',
        brandSlug: 'lg',
        note: 'Laundry. Direct Drive underneath, so OE, UE, LE and dE read exactly as they do on an LG.',
      },
      {
        prefix: '253 / 417',
        builder: 'Frigidaire',
        brandSlug: 'frigidaire',
        note: 'Refrigerators and laundry. Uses the Frigidaire SY and E-numbered codes.',
      },
      {
        prefix: '363',
        builder: 'GE',
        brandSlug: 'ge',
        note: 'Refrigerators and ranges. GE codes, which on refrigeration means largely no user-facing code at all.',
      },
    ],
    seo: {
      title: 'Kenmore Error Codes by Model Number | Orange County Repair',
      description:
        'Kenmore never built a machine — the first three digits of the model number name the real manufacturer. 110 Whirlpool, 795 LG, 253 Frigidaire, 363 GE, and which code set applies to each.',
    },
  },
];

/**
 * Which service page's published range applies to a code's appliance.
 *
 * The `appliance` strings are written for a reader, not for a lookup, so the
 * mapping is explicit rather than inferred — a fuzzy match here would quietly
 * print refrigerator money against a dryer fault.
 */
const APPLIANCE_TO_SERVICE: Record<string, string> = {
  Refrigerator: 'refrigerator',
  Washer: 'washer',
  Dryer: 'dryer',
  'Washer / Dryer': 'washer',
  Dishwasher: 'dishwasher',
  'Oven / Range': 'oven-range',
};

export function serviceSlugForAppliance(appliance: string): string | undefined {
  return APPLIANCE_TO_SERVICE[appliance];
}

/**
 * How each band reads once the range has been stated.
 *
 * Written as a clause that follows the figures rather than precedes them —
 * "at the bottom of that range" in front of the range points at nothing.
 */
export const COST_BAND_COPY: Record<NonNullable<ErrorCode['costBand']>, string> = {
  low: 'sits at the bottom of that range, and plenty of these end at the visit',
  mid: 'sits around the middle of it',
  high: 'sits at the top of it, and past it on a built-in',
  varies: 'lands anywhere in it — the same code covers a rinse-out and a part',
};

export function getErrorCodesForBrand(brandSlug: string) {
  return brandErrorCodes.find((entry) => entry.brandSlug === brandSlug);
}

/** True where a brand has a codes page worth linking to from its own page. */
export function hasErrorCodes(brandSlug: string) {
  return brandErrorCodes.some((entry) => entry.brandSlug === brandSlug);
}

/** How the three verdicts are labelled and explained, in one place. */
export const VERDICT_COPY: Record<CodeVerdict, { label: string; meaning: string }> = {
  'not-a-fault': {
    label: 'Not a fault',
    meaning: 'The machine is working as designed. No part, no visit.',
  },
  diy: {
    label: 'Try this first',
    meaning: 'Safe to check yourself, and often the whole answer.',
  },
  tech: {
    label: 'Needs a technician',
    meaning: 'Testing, parts, or somewhere it is not safe to go alone.',
  },
};
