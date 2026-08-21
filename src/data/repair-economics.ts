/**
 * What a repair costs, and whether it is worth doing.
 *
 * Two questions the site could not answer and that people ask before they ask
 * anything else. They belong together in one file because the second is the
 * first with a replacement price beside it.
 *
 * WHERE THE NUMBERS COME FROM, and the rule that governs this file: the repair
 * figures are the ranges already published on the service pages, not new ones
 * invented for a cost page. Nothing here quotes a job it has not seen. What is
 * added is judgement — which end of a published range a fault lands at, and how
 * that compares to buying a new machine — and judgement is labelled as such.
 *
 * Replacement figures are deliberately given as wide brackets. What a machine
 * costs to replace depends on what somebody chooses to replace it with, and a
 * precise number there would be a fiction dressed as a fact.
 *
 * The service-life figures are industry norms, and they are used the way a
 * technician uses them: as the point where the arithmetic changes, not as an
 * expiry date. A twenty-year-old Sub-Zero is often worth repairing and a
 * six-year-old bargain machine with a sealed-system fault often is not.
 */

export interface RepairEconomics {
  /** Must match a slug in `services.ts` — repair range comes from there. */
  serviceSlug: string;
  /** Typical service life in years, as the trade uses it. */
  lifeYears: string;
  /** What a like-for-like replacement runs, as a bracket. */
  replacementRange: string;
  /** The faults that sit at the cheap end of the published range. */
  cheapEnd: string;
  /** The faults that sit at the top of it, or past it. */
  expensiveEnd: string;
  /** When we would say replace, in plain terms. */
  replaceWhen: string;
}

export const repairEconomics: RepairEconomics[] = [
  {
    serviceSlug: 'refrigerator',
    lifeYears: '10–13 years, and 20+ on built-in',
    replacementRange: '$900–2,500 freestanding · $7,000+ built-in',
    cheapEnd:
      'Water inlet valve, door gasket, thermostat, defrost sensor, a blocked drain, a condenser clean. Several of these end at the service call.',
    expensiveEnd:
      'Compressor, evaporator, anything inside the sealed system. This is refrigerant work, it requires EPA certification to touch, and it is the one refrigerator repair where the replacement figure has to be looked at first.',
    replaceWhen:
      'A sealed-system fault on a freestanding machine past about eight years. The repair approaches the price of a new one and the new one comes with a warranty. On a built-in the answer usually flips the other way — replacement means cabinetry work, so a sealed-system repair on a Sub-Zero is often still the sensible spend.',
  },
  {
    serviceSlug: 'washer',
    lifeYears: '10–11 years, more on a Miele or Speed Queen',
    replacementRange: '$700–1,600',
    cheapEnd:
      'Drain pump, door latch, shift actuator, inlet valve, shock absorbers, levelling. The actuator in particular is routinely quoted as a transmission and is a fraction of one.',
    expensiveEnd:
      'Tub bearing, and on a front-loader that means the drum coming apart. The part is not the cost; the hours are.',
    replaceWhen:
      'A tub bearing on a machine past seven or eight years, unless it is a Miele or a commercial-grade Speed Queen where the rest of the machine has years left. Below that age a bearing is usually still worth doing.',
  },
  {
    serviceSlug: 'dryer',
    lifeYears: '10–13 years',
    replacementRange: '$600–1,400',
    cheapEnd:
      'Thermal fuse, thermostat, heating element, igniter, belt, rollers, idler. Almost every common dryer fault sits here, which is why dryers are the appliance we most often talk somebody out of replacing.',
    expensiveEnd:
      'Main control board, and on a heat-pump machine the sealed refrigeration circuit.',
    replaceWhen:
      'Rarely, honestly. A dryer is a motor, a drum, a heater and a duct, and all four are cheap to put right. The case for replacing is a control board on a machine already past twelve years — and even then, check the vent first, because a restricted duct is what killed the last three parts.',
  },
  {
    serviceSlug: 'dishwasher',
    lifeYears: '9–10 years',
    replacementRange: '$600–1,800 · more for panel-ready',
    cheapEnd:
      'Drain pump, door latch, float switch, filter, inlet valve, and the disposal knockout plug that costs nothing at all.',
    expensiveEnd: 'Circulation pump or wash motor, and the control board on a premium machine.',
    replaceWhen:
      'A wash motor on a mainstream machine past eight years. On a Bosch, Miele or panel-ready unit the sum changes — the replacement has to be fitted into an existing cabinet opening and matched to an existing panel, which is not a like-for-like price.',
  },
  {
    serviceSlug: 'oven-range',
    lifeYears: '13–15 years, and longer on professional ranges',
    replacementRange: '$800–2,500 · $8,000+ professional',
    cheapEnd:
      'Igniter, bake element, temperature sensor, door hinges, spark module, touch membrane. The membrane is the one worth insisting on testing, because it looks exactly like the board and costs a fraction.',
    expensiveEnd: 'Control board, and on older wall ovens the question of whether one is still made.',
    replaceWhen:
      'A control board that is no longer available. That is genuinely the deciding factor on ovens rather than age — the cavity, the elements and the burners outlast the electronics by a decade, and a professional range is worth repairing well past the point where a mainstream one is not.',
  },
  {
    serviceSlug: 'freezer',
    lifeYears: '10–15 years',
    replacementRange: '$500–1,500 · more for a column',
    cheapEnd: 'Defrost heater, sensor, thermostat, door gasket, a blocked drain.',
    expensiveEnd: 'Compressor or sealed system, same as any refrigeration.',
    replaceWhen:
      'A sealed-system fault on a chest or upright freezer that was inexpensive to begin with. On a built-in column the calculation is the same as a Sub-Zero refrigerator column — replacement means cabinetry, so the repair usually wins.',
  },
  {
    serviceSlug: 'microwave',
    lifeYears: '7–10 years',
    replacementRange: '$150–400 countertop · $400–1,200 over-range',
    cheapEnd: 'Door switch, fuse, turntable motor, control panel on some models.',
    expensiveEnd: 'Magnetron or high-voltage components.',
    replaceWhen:
      'A magnetron on a countertop machine, almost always — the part and the labour exceed a new one. On a built-in or over-range unit fitted into cabinetry the answer is often the opposite, because replacing means matching a size and a trim kit.',
  },
  {
    serviceSlug: 'garbage-disposal',
    lifeYears: '8–12 years',
    replacementRange: '$150–500 installed',
    cheapEnd: 'A jam cleared, the reset, the splash guard, a leaking connection at the sink flange.',
    expensiveEnd: 'The motor — at which point it is a replacement rather than a repair.',
    replaceWhen:
      'When the motor has gone or the body is leaking. These are not built to be rebuilt, and we will say so rather than charge for opening one up.',
  },
];

export function economicsFor(serviceSlug: string) {
  return repairEconomics.find((entry) => entry.serviceSlug === serviceSlug);
}

/**
 * The rule of thumb people arrive with, and what is wrong with it.
 *
 * Worth stating rather than repeating, because taken literally it sends people
 * to replace machines that had a decade left.
 */
export const FIFTY_PERCENT_RULE =
  'The rule people arrive with is that a repair costing more than half the price of a new machine is not worth doing. It is a reasonable starting point and it goes wrong in two directions. It sends people to replace a built-in that would cost eight thousand and cabinetry work to swap, and it sends them to repair a bargain machine whose next fault is already forming. What matters more than the percentage is which part failed, how old the machine is, and whether the rest of it has years left.';
