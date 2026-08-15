'use client';

import { useState } from 'react';
import { US_STATES } from '@/data/us-states';
import { SOCAL_COAST } from '@/data/socal-coast';
import { MAP_HEIGHT, MAP_WIDTH, inFrame, project } from '@/lib/geo/albers';
import { serviceAreas } from '@/data/service-areas';
import { SERIES } from '@/components/admin/palette';

/**
 * Where the visits actually were, at two scales.
 *
 * A ranked list answers "which towns", and this answers the question the list
 * cannot: whether the traffic is a cluster around the van or a scatter across
 * a country nobody can drive to. For a business whose whole constraint is
 * drive time, that shape is the finding.
 *
 * The country view is the one that shows waste. The county view is the one
 * that shows the business — at national scale every town this shop serves is
 * a single dot, so the fifteen of them can only be told apart by going in.
 * The move between the two is animated rather than cut, because a cut leaves
 * you working out where you landed and a zoom does not.
 *
 * Server data, client rendering, no tiles and no key: the outlines are 29 KB
 * of public-domain census geometry in the repo, so this screen makes no
 * request to anyone and cannot tell a third party where the visitors were.
 */

export interface MapPoint {
  city: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  sessions: number;
  conversions: number;
}

const SERVED = new Set(serviceAreas.map((area) => area.name.toLowerCase()));

/** The service area, projected once — it is a constant, not a computation. */
const AREA_MARKS = serviceAreas.map((area) => ({
  name: area.name,
  slug: area.slug,
  xy: project(area.coordinates.lng, area.coordinates.lat),
}));

const OC_VIEW = (() => {
  const xs = AREA_MARKS.map((a) => a.xy[0]);
  const ys = AREA_MARKS.map((a) => a.xy[1]);
  const pad = 4.5;
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad;
  return {
    k: Math.min(MAP_WIDTH / (maxX - minX), MAP_HEIGHT / (maxY - minY)),
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
})();

const US_VIEW = { k: 1, cx: MAP_WIDTH / 2, cy: MAP_HEIGHT / 2 };

/**
 * Area, not radius, carries the count — a circle twice as wide reads as four
 * times as much, and would make one town look like a campaign. Divided by the
 * zoom so a dot is the same size on screen at either scale.
 */
function radius(sessions: number, max: number, k: number): number {
  const smallest = 4;
  const largest = 22;
  const r = max <= 1 ? smallest : smallest + (largest - smallest) * Math.sqrt(sessions / max);
  return r / k;
}

export function UsMap({
  points,
  initialView = 'us',
}: {
  points: MapPoint[];
  /** Which scale to open at, so the county view can be linked to directly. */
  initialView?: 'us' | 'oc';
}) {
  const [zoomed, setZoomed] = useState(initialView === 'oc');
  const view = zoomed ? OC_VIEW : US_VIEW;
  const { k } = view;

  // A visit the edge could not place lands on the geographic centre of the
  // country — a real dot in Kansas for a session that was never in Kansas.
  // Better absent from the map and present in the table below it.
  const located = points.filter((p) => p.city && p.city !== 'Unknown');

  const plotted = located
    .map((p) => ({ ...p, xy: project(p.lng, p.lat) }))
    .filter((p) => p.country === 'US' && inFrame(p.xy))
    .sort((a, b) => b.sessions - a.sessions);

  const offMap = located.filter((p) => p.country !== 'US' || !inFrame(project(p.lng, p.lat)));
  const offMapVisits = offMap.reduce((sum, p) => sum + p.sessions, 0);
  const max = plotted.reduce((m, p) => Math.max(m, p.sessions), 0);

  const home = project(-117.8265, 33.6846);

  // What is actually inside the frame at this zoom, which is what the numbers
  // under the map are about. Anything else would be a caption describing a
  // different picture.
  const halfW = MAP_WIDTH / (2 * k);
  const halfH = MAP_HEIGHT / (2 * k);
  const inView = plotted.filter(
    (p) =>
      Math.abs(p.xy[0] - view.cx) <= halfW && Math.abs(p.xy[1] - view.cy) <= halfH
  );

  // Greedy label placement: busiest first, above the dot, dropped if it would
  // land on one already placed — the towns that matter most are also the ones
  // closest together, so without this they stack into a smear.
  const placed: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const reserve = (x: number, y: number, w: number, h: number) => {
    const box = { x1: x - w / 2, y1: y - h, x2: x + w / 2, y2: y + h / 3 };
    const clash = placed.some(
      (b) => box.x1 < b.x2 && box.x2 > b.x1 && box.y1 < b.y2 && box.y2 > b.y1
    );
    if (clash) return false;
    placed.push(box);
    return true;
  };

  const labelSize = 14 / k;
  const charWidth = 7 / k;

  if (!zoomed) reserve(home[0], home[1] + 34 / k, 24 / k, labelSize);

  // The dots go on the board before the words do, so a name is never written
  // across a bubble. Learnt from the county view, where "Mission Viejo" landed
  // squarely on the fifteen visits from Laguna Hills.
  for (const p of plotted) {
    const r = radius(p.sessions, max, k);
    placed.push({ x1: p.xy[0] - r, y1: p.xy[1] - r, x2: p.xy[0] + r, y2: p.xy[1] + r });
  }

  const townLabels: Array<{ key: string; text: string; x: number; y: number }> = [];
  for (const p of inView.slice(0, 14)) {
    const text = `${p.city} · ${p.sessions}`;
    const y = p.xy[1] - radius(p.sessions, max, k) - 7 / k;
    if (!reserve(p.xy[0], y, text.length * charWidth, labelSize)) continue;
    townLabels.push({ key: `${p.city}-${p.region}`, text, x: p.xy[0], y });
  }

  // In the county view every served town is named, whether anybody came from
  // it or not — a town with no visits is the finding, and it cannot be one if
  // it is not on the map.
  const areaLabels = zoomed
    ? AREA_MARKS.filter((a) =>
        reserve(a.xy[0], a.xy[1] + 11 / k, a.name.length * charWidth, labelSize)
      )
    : [];

  const visitsByTown = new Map(
    located.map((p) => [p.city.toLowerCase(), p] as const)
  );
  const areaRows = serviceAreas
    .map((area) => {
      const hit = visitsByTown.get(area.name.toLowerCase());
      return {
        name: area.name,
        sessions: hit?.sessions ?? 0,
        conversions: hit?.conversions ?? 0,
      };
    })
    .sort((a, b) => b.sessions - a.sessions);

  const inViewVisits = inView.reduce((sum, p) => sum + p.sessions, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setZoomed(!zoomed)}
          className="h-8 rounded-card bg-ink px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-cream"
        >
          {zoomed ? 'Back to the country' : 'Zoom to Orange County'}
        </button>
        <span className="text-xs text-gray-600">
          {zoomed
            ? `${inViewVisits} of ${plotted.reduce((s, p) => s + p.sessions, 0)} located visits are in this frame`
            : 'Every located visit. The service area is one dot at this scale — go in to tell the towns apart.'}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="w-full overflow-hidden rounded-card bg-[#f6f4f0]"
        role="img"
        aria-label={
          zoomed
            ? 'Visits across the Orange County service area'
            : 'Visits by location across the United States'
        }
      >
        <g
          style={{
            transform: `translate(${MAP_WIDTH / 2 - view.cx * k}px, ${MAP_HEIGHT / 2 - view.cy * k}px) scale(${k})`,
            transition: 'transform 850ms cubic-bezier(0.32, 0.08, 0.24, 1)',
          }}
        >
          <g>
            {US_STATES.map((state) => (
              <path
                key={state.name}
                d={state.d}
                fill="#e8e4dc"
                stroke="#fcfcfb"
                // Without this the state borders become inch-thick slabs at
                // thirty times magnification and swallow the county.
                vectorEffect="non-scaling-stroke"
                strokeWidth={1.2}
                strokeLinejoin="round"
              />
            ))}
            {/* Laid over California at county scale: the national outline is
                four points wide across the whole of Orange County, which draws
                a coast that runs through Huntington Beach rather than past it.
                Only rendered when it can be seen, since it is 18 KB of path. */}
            {zoomed && (
              <path d={SOCAL_COAST} fill="#e8e4dc" stroke="#e0dbd1" vectorEffect="non-scaling-stroke" strokeWidth={1} />
            )}
          </g>

          {/* Every town on the service-area list, drawn only when they can be
              told apart. */}
          {zoomed && (
            <g>
              {AREA_MARKS.map((area) => (
                <circle
                  key={area.slug}
                  cx={area.xy[0]}
                  cy={area.xy[1]}
                  r={3 / k}
                  fill="none"
                  stroke="#7d7469"
                  vectorEffect="non-scaling-stroke"
                  strokeWidth={1.5}
                />
              ))}
            </g>
          )}

          <g>
            <circle cx={home[0]} cy={home[1]} r={26 / k} fill={SERIES[0]} opacity={0.1} />
            <circle cx={home[0]} cy={home[1]} r={4 / k} fill="#1a1a1a" />
            {!zoomed && (
              <text
                x={home[0]}
                y={home[1] + 34 / k}
                textAnchor="middle"
                className="font-heading"
                fontSize={13 / k}
                fontWeight={600}
                fill="#1a1a1a"
              >
                HQ
              </text>
            )}
          </g>

          <g>
            {plotted.map((p) => {
              const served = SERVED.has(p.city.toLowerCase());
              const r = radius(p.sessions, max, k);
              return (
                <g key={`${p.city}-${p.region}`}>
                  <circle
                    cx={p.xy[0]}
                    cy={p.xy[1]}
                    r={r}
                    fill={served ? SERIES[0] : '#9a9186'}
                    fillOpacity={0.55}
                    stroke={served ? SERIES[0] : '#7d7469'}
                    vectorEffect="non-scaling-stroke"
                    strokeWidth={1.5}
                  >
                    <title>
                      {p.city}
                      {p.region ? `, ${p.region}` : ''} — {p.sessions}{' '}
                      {p.sessions === 1 ? 'visit' : 'visits'}
                      {p.conversions ? `, ${p.conversions} converted` : ''}
                      {served ? '' : ' (outside the service area)'}
                    </title>
                  </circle>
                  {p.conversions > 0 && (
                    <circle cx={p.xy[0]} cy={p.xy[1]} r={3 / k} fill="#1a1a1a" />
                  )}
                </g>
              );
            })}
          </g>

          <g>
            {areaLabels.map((area) => (
              <text
                key={`area-${area.slug}`}
                x={area.xy[0]}
                y={area.xy[1] + 11 / k}
                textAnchor="middle"
                className="font-heading"
                fontSize={12 / k}
                fill="#7d7469"
              >
                {area.name}
              </text>
            ))}
            {townLabels.map((l) => (
              <text
                key={`label-${l.key}`}
                x={l.x}
                y={l.y}
                textAnchor="middle"
                className="font-heading"
                fontSize={labelSize}
                fontWeight={600}
                fill="#4a453e"
              >
                {l.text}
              </text>
            ))}
          </g>
        </g>
      </svg>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-600">
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: SERIES[0], opacity: 0.6 }}
          />
          In the service area
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: '#9a9186', opacity: 0.6 }}
          />
          Outside it
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-ink" />
          Converted
        </span>
        {zoomed && (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-[#7d7469]" />
            On the service-area list
          </span>
        )}
        {offMapVisits > 0 && !zoomed && (
          <span className="ml-auto">
            {offMapVisits} {offMapVisits === 1 ? 'visit' : 'visits'} from outside the lower 48
            {offMap.length <= 3 ? ` (${offMap.map((p) => p.city).filter(Boolean).join(', ')})` : ''}
          </span>
        )}
      </div>

      {/* The county view's real payload: the towns the business says it covers,
          with what each of them actually sent. A nought here is a finding — it
          is a town on the website that nobody has arrived from. */}
      {zoomed && (
        <div className="mt-5 border-t border-primary-500/15 pt-4">
          <p className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
            Service area, by town
          </p>
          <div className="mt-3 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {areaRows.map((row) => (
              <div
                key={row.name}
                className="flex items-baseline justify-between border-b border-primary-500/10 py-1"
              >
                <span className={row.sessions ? 'text-ink' : 'text-gray-400'}>{row.name}</span>
                <span className="font-heading text-xs tabular-nums text-gray-600">
                  {row.sessions === 0 ? '—' : row.sessions}
                  {row.conversions > 0 && (
                    <span className="ml-2 text-ink">{row.conversions} won</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
