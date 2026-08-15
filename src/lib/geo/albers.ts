/**
 * Albers equal-area conic, set up for the United States.
 *
 * The projection every US map you have ever read uses, and the reason is that
 * it preserves area: a bubble over Ohio and a bubble over Nevada mean the same
 * thing. Web Mercator, the alternative that costs nothing to implement, makes
 * the northern states look a third larger than they are, which is a lie the
 * eye believes before the numbers get a chance.
 *
 * The standard parallels and origin are the conventional US ones. Alaska and
 * Hawaii are not inset — the real map libraries move them into boxes off
 * Mexico, which is a great deal of code for two states this business does not
 * serve. They project honestly, off the edge, and the component drops anything
 * outside the frame and says how many it dropped.
 *
 * Written once, in TypeScript, so the outlines and the dots cannot drift: the
 * script that generates the state paths imports this same function.
 */

const RAD = Math.PI / 180;

// Conventional US Albers: parallels 29.5°N and 45.5°N, origin 96°W 37.5°N.
const PHI_1 = 29.5 * RAD;
const PHI_2 = 45.5 * RAD;
const LON_0 = -96 * RAD;
const PHI_0 = 37.5 * RAD;

const N = 0.5 * (Math.sin(PHI_1) + Math.sin(PHI_2));
const C = Math.cos(PHI_1) ** 2 + 2 * N * Math.sin(PHI_1);
const RHO_0 = Math.sqrt(C - 2 * N * Math.sin(PHI_0)) / N;

/**
 * Raw projected units.
 *
 * The textbook formula gives y increasing northward; SVG counts downward, so
 * the sign is flipped here rather than at each call site. Get this wrong and
 * the map still looks like a map — an upside-down one, with Miami at the top,
 * which is exactly the kind of error that survives a glance.
 */
export function albersRaw(lon: number, lat: number): [number, number] {
  const theta = N * (lon * RAD - LON_0);
  const rho = Math.sqrt(C - 2 * N * Math.sin(lat * RAD)) / N;
  return [rho * Math.sin(theta), rho * Math.cos(theta) - RHO_0];
}

/**
 * The box the lower 48 occupy in raw units, measured from the state outlines
 * themselves rather than guessed, so the map fills its frame exactly.
 */
export const RAW_BOUNDS = {
  minX: -0.3689,
  maxX: 0.3532,
  minY: -0.2447,
  maxY: 0.2031,
};

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = Math.round(
  (MAP_WIDTH * (RAW_BOUNDS.maxY - RAW_BOUNDS.minY)) / (RAW_BOUNDS.maxX - RAW_BOUNDS.minX)
);

const SCALE = MAP_WIDTH / (RAW_BOUNDS.maxX - RAW_BOUNDS.minX);

/** Longitude and latitude to a point in the map's own viewBox. */
export function project(lon: number, lat: number): [number, number] {
  const [x, y] = albersRaw(lon, lat);
  return [(x - RAW_BOUNDS.minX) * SCALE, (y - RAW_BOUNDS.minY) * SCALE];
}

/** Whether a projected point is inside the frame, with a little tolerance. */
export function inFrame([x, y]: [number, number]): boolean {
  const pad = 12;
  return x >= -pad && x <= MAP_WIDTH + pad && y >= -pad && y <= MAP_HEIGHT + pad;
}
