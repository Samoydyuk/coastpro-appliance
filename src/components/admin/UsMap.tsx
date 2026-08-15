import { US_STATES } from '@/data/us-states';
import { MAP_HEIGHT, MAP_WIDTH, inFrame, project } from '@/lib/geo/albers';
import { serviceAreas } from '@/data/service-areas';
import { SERIES } from '@/components/admin/palette';

/**
 * Where the visits actually were.
 *
 * A ranked list answers "which towns", and this answers the question the list
 * cannot: whether the traffic is a cluster around the van or a scatter across
 * a country nobody can drive to. For a business whose whole constraint is
 * drive time, that shape is the finding — and it is one sentence in a picture
 * and four paragraphs in a table.
 *
 * Server-rendered SVG, no map tiles and no key: the outlines are 29 KB of
 * public-domain census geometry committed to the repo, so this screen makes no
 * request to anyone and cannot leak a visitor's location to a third party
 * while showing it to the owner.
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

/** Area, not radius, carries the count — a circle twice as wide reads as four
 *  times as much, and would make one town look like a campaign. */
function radius(sessions: number, max: number): number {
  const smallest = 4;
  const largest = 22;
  if (max <= 1) return smallest;
  return smallest + (largest - smallest) * Math.sqrt(sessions / max);
}

export function UsMap({ points }: { points: MapPoint[] }) {
  // A visit the edge could not place lands on the geographic centre of the
  // country — a real dot in Kansas for a session that was never in Kansas.
  // Better absent from the map and present in the table below it.
  const located = points.filter((p) => p.city && p.city !== 'Unknown');

  const plotted = located
    .map((p) => ({ ...p, xy: project(p.lng, p.lat) }))
    .filter((p) => p.country === 'US' && inFrame(p.xy))
    .sort((a, b) => b.sessions - a.sessions);

  const offMap = located.filter(
    (p) => p.country !== 'US' || !inFrame(project(p.lng, p.lat))
  );
  const offMapVisits = offMap.reduce((sum, p) => sum + p.sessions, 0);
  const max = plotted.reduce((m, p) => Math.max(m, p.sessions), 0);

  // The home mark: where the vans start from, so distance is readable at a
  // glance rather than worked out from state shapes.
  const home = project(-117.8265, 33.6846);

  // Greedy label placement: busiest first, above the dot, dropped if it would
  // land on one already placed. Roughly 7px per character at this size, which
  // is close enough for a box test.
  const placed: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const reserve = (x: number, y: number, w: number) => {
    const box = { x1: x - w / 2, y1: y - 13, x2: x + w / 2, y2: y + 4 };
    const clash = placed.some(
      (b) => box.x1 < b.x2 && box.x2 > b.x1 && box.y1 < b.y2 && box.y2 > b.y1
    );
    if (clash) return false;
    placed.push(box);
    return true;
  };
  // The HQ mark's own label is placed first, so a town never lands on it.
  reserve(home[0], home[1] + 34, 24);

  const labelled: Array<{ city: string; region: string; text: string; x: number; y: number }> = [];
  for (const p of plotted.slice(0, 12)) {
    const text = `${p.city} · ${p.sessions}`;
    const y = p.xy[1] - radius(p.sessions, max) - 7;
    if (!reserve(p.xy[0], y, text.length * 7)) continue;
    labelled.push({ city: p.city, region: p.region, text, x: p.xy[0], y });
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Visits by location across the United States"
      >
        <g>
          {US_STATES.map((state) => (
            <path
              key={state.name}
              d={state.d}
              fill="#e8e4dc"
              stroke="#fcfcfb"
              strokeWidth={1.2}
              strokeLinejoin="round"
            />
          ))}
        </g>

        {/* The shop, under everything else so a busy town can sit on top of it. */}
        <g>
          <circle cx={home[0]} cy={home[1]} r={26} fill={SERIES[0]} opacity={0.1} />
          <circle cx={home[0]} cy={home[1]} r={4} fill="#1a1a1a" />
          <text
            x={home[0]}
            y={home[1] + 34}
            textAnchor="middle"
            className="font-heading"
            fontSize={13}
            fontWeight={600}
            fill="#1a1a1a"
            letterSpacing={1}
          >
            HQ
          </text>
        </g>

        <g>
          {plotted.map((p) => {
            const served = SERVED.has(p.city.toLowerCase());
            const r = radius(p.sessions, max);
            return (
              <g key={`${p.city}-${p.region}`}>
                <circle
                  cx={p.xy[0]}
                  cy={p.xy[1]}
                  r={r}
                  fill={served ? SERIES[0] : '#9a9186'}
                  fillOpacity={0.55}
                  stroke={served ? SERIES[0] : '#7d7469'}
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
                  <circle cx={p.xy[0]} cy={p.xy[1]} r={3} fill="#1a1a1a" />
                )}
              </g>
            );
          })}
        </g>

        {/* Labelled busiest-first, and a label is dropped rather than drawn on
            top of one already placed. The whole point of this business is that
            its traffic clusters, so the busiest towns are also the closest
            together — three names in one place is worse than one name and two
            dots you can hover. */}
        <g>
          {labelled.map((p) => (
            <text
              key={`label-${p.city}-${p.region}`}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              className="font-heading"
              fontSize={14}
              fontWeight={600}
              fill="#4a453e"
            >
              {p.text}
            </text>
          ))}
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
        {offMapVisits > 0 && (
          <span className="ml-auto">
            {offMapVisits} {offMapVisits === 1 ? 'visit' : 'visits'} from outside the lower 48
            {offMap.length <= 3
              ? ` (${offMap.map((p) => p.city).filter(Boolean).join(', ')})`
              : ''}
          </span>
        )}
      </div>
    </div>
  );
}
