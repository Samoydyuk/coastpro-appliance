'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BASELINE, GRIDLINE, INK, INK_MUTED, SURFACE, sequentialColor } from './palette';
import { useT } from '@/components/admin/LanguageProvider';
import { count, percent } from '@/lib/admin/format';
import { numberLocale, type Lang, type TranslationKey, type Translator } from '@/lib/i18n';

/**
 * A small chart kit, hand-built in SVG.
 *
 * No chart library: the whole panel needs five shapes, and a dependency that
 * ships a hundred would cost more to load than it saves to write. The rules it
 * follows are the ones that matter — one scale per chart (never two y-axes),
 * thin marks, recessive grid, a legend whenever more than one series is drawn,
 * and a hover read-out on everything.
 */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    setWidth(element.clientWidth);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const scaled = value / magnitude;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return step * magnitude;
}

/**
 * Charts are client components, and every admin screen is a server component,
 * so a formatter cannot be handed over as a function — React has nothing to
 * serialise. The format is named instead and resolved on this side.
 */
export type ValueFormat = 'number' | 'money';

/**
 * Grouping and the decimal mark follow the reader; the dollar sign does not.
 * The business bills in USD, so a Ukrainian axis reads "$1 200" — translating
 * the currency would be inventing a number nobody was ever charged.
 */
function formatterFor(format: ValueFormat, lang: Lang) {
  const locale = numberLocale(lang);
  if (format === 'money') {
    return (value: number) => `$${Math.round(value).toLocaleString(locale)}`;
  }
  return (value: number) =>
    Number.isInteger(value)
      ? value.toLocaleString(locale)
      : value.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export interface SeriesSpec {
  key: string;
  label: string;
  color: string;
}

export interface TimePoint {
  label: string;
  values: Record<string, number>;
}

/**
 * Lines over time. Every series shares one scale by design — two scales on one
 * chart make any pair of lines cross wherever the author wants them to.
 */
export function TimeSeries({
  points,
  series,
  height = 220,
  format = 'number',
}: {
  points: TimePoint[];
  series: SeriesSpec[];
  height?: number;
  format?: ValueFormat;
}) {
  const t = useT();
  const formatValue = formatterFor(format, t.lang);
  const { ref, width } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const padding = { top: 12, right: 12, bottom: 24, left: 44 };
  const plotWidth = Math.max(0, width - padding.left - padding.right);
  const plotHeight = height - padding.top - padding.bottom;

  const max = useMemo(() => {
    const highest = Math.max(
      0,
      ...points.flatMap((point) => series.map((entry) => point.values[entry.key] ?? 0))
    );
    return niceCeil(highest || 1);
  }, [points, series]);

  const x = useCallback(
    (index: number) => (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth),
    [plotWidth, points.length]
  );
  const y = useCallback((value: number) => plotHeight - (value / max) * plotHeight, [plotHeight, max]);

  const onMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - bounds.left - padding.left;
    if (offset < -10 || offset > plotWidth + 10) return setHover(null);
    const index = Math.round((offset / Math.max(1, plotWidth)) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, index)));
  };

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => fraction * max);

  return (
    <div ref={ref} className="relative">
      {series.length > 1 && <Legend series={series} />}
      {width > 0 && (
        <svg
          width={width}
          height={height}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={t('shared.chart.overTime', {
            series: series.map((entry) => entry.label).join(', '),
          })}
        >
          <g transform={`translate(${padding.left},${padding.top})`}>
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={0} x2={plotWidth} y1={y(tick)} y2={y(tick)} stroke={GRIDLINE} strokeWidth={1} />
                <text x={-8} y={y(tick) + 4} textAnchor="end" fontSize={10} fill={INK_MUTED} className="tabular-nums">
                  {formatValue(tick)}
                </text>
              </g>
            ))}
            <line x1={0} x2={plotWidth} y1={plotHeight} y2={plotHeight} stroke={BASELINE} strokeWidth={1} />

            {series.map((entry) => {
              const path = points
                .map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.values[entry.key] ?? 0)}`)
                .join(' ');
              return (
                <path
                  key={entry.key}
                  d={path}
                  fill="none"
                  stroke={entry.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              );
            })}

            {hover !== null && (
              <>
                <line x1={x(hover)} x2={x(hover)} y1={0} y2={plotHeight} stroke={BASELINE} strokeWidth={1} />
                {series.map((entry) => (
                  <circle
                    key={entry.key}
                    cx={x(hover)}
                    cy={y(points[hover]?.values[entry.key] ?? 0)}
                    r={4.5}
                    fill={entry.color}
                    stroke={SURFACE}
                    strokeWidth={2}
                  />
                ))}
              </>
            )}

            {points.map((point, index) =>
              index === 0 || index === points.length - 1 || index === Math.floor(points.length / 2) ? (
                <text
                  key={point.label}
                  x={x(index)}
                  y={plotHeight + 16}
                  textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
                  fontSize={10}
                  fill={INK_MUTED}
                >
                  {point.label}
                </text>
              ) : null
            )}
          </g>
        </svg>
      )}

      {hover !== null && points[hover] && (
        <div
          className="pointer-events-none absolute top-2 rounded-card border border-primary-500/25 bg-[#fcfcfb] px-3 py-2 text-xs shadow-sm"
          style={{
            left: Math.min(Math.max(0, x(hover) + padding.left - 60), Math.max(0, width - 150)),
          }}
        >
          <p className="font-semibold" style={{ color: INK }}>
            {points[hover]!.label}
          </p>
          {series.map((entry) => (
            <p key={entry.key} className="mt-0.5 flex items-center gap-2 whitespace-nowrap">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.label}</span>
              <span className="ml-auto font-semibold tabular-nums" style={{ color: INK }}>
                {formatValue(points[hover]!.values[entry.key] ?? 0)}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function Legend({ series }: { series: SeriesSpec[] }) {
  return (
    <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1">
      {series.map((entry) => (
        <li key={entry.key} className="flex items-center gap-2 text-xs text-gray-600">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.label}
        </li>
      ))}
    </ul>
  );
}

export interface RankedItem {
  label: string;
  value: number;
  color?: string;
  note?: string;
}

/** Ranked categories. Horizontal, because category names are words. */
export function RankedBars({
  items,
  format = 'number',
  max: providedMax,
}: {
  items: RankedItem[];
  format?: ValueFormat;
  max?: number;
}) {
  const t = useT();
  const formatValue = formatterFor(format, t.lang);
  const max = providedMax ?? Math.max(1, ...items.map((item) => item.value));
  if (!items.length)
    return <p className="py-6 text-center text-sm text-gray-500">{t('shared.chart.noData')}</p>;

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="group">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-gray-700" title={item.label}>
              {item.label}
            </span>
            <span className="shrink-0 font-semibold tabular-nums" style={{ color: INK }}>
              {formatValue(item.value)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: '#eceae6' }}>
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${Math.max(1, (item.value / max) * 100)}%`,
                  backgroundColor: item.color ?? '#2a78d6',
                }}
              />
            </div>
            {item.note && <span className="w-24 shrink-0 text-right text-xs text-gray-500">{item.note}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The funnel: each stage as a share of the first, with the step loss named. */
export function Funnel({
  stages,
}: {
  stages: { key: string; label: string; value: number; note: string }[];
}) {
  const t = useT();
  const top = Math.max(1, stages[0]?.value ?? 1);
  return (
    <ol className="space-y-3">
      {stages.map((stage, index) => {
        const previous = index === 0 ? null : stages[index - 1]!.value;
        const stepRate = previous ? stage.value / previous : null;
        const share = stage.value / top;
        return (
          <li key={stage.key}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-gray-800">{stage.label}</span>
              <span className="font-heading text-sm font-bold tabular-nums" style={{ color: INK }}>
                {count(stage.value, t.lang)}
                <span className="ml-2 text-xs font-normal text-gray-500">
                  {t('shared.chart.ofVisits', {
                    pct: percent(share, share < 1 ? 1 : 0, t.lang),
                  })}
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-7 w-full rounded-card" style={{ backgroundColor: '#eceae6' }}>
              <div
                className="flex h-7 items-center rounded-card px-2"
                style={{
                  width: `${Math.max(2, share * 100)}%`,
                  backgroundColor: sequentialColor(0.35 + (1 - index / stages.length) * 0.5),
                }}
              />
            </div>
            <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span>{stage.note}</span>
              {stepRate !== null && (
                <span className="ml-auto tabular-nums">
                  {t('shared.chart.carriedOver', { pct: percent(stepRate, 0, t.lang) })}
                  {stepRate < 1 && (
                    <span className="ml-1 text-[#8f2323]">
                      (−{count(previous! - stage.value, t.lang)})
                    </span>
                  )}
                </span>
              )}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Weekdays in the order `Date.getDay()` counts them, so the index in this
 * array is the number the query returns. The rows are keyed by that number and
 * never by the label — a translated label as a React key would rebuild the
 * whole grid the moment the language changed, and would collapse two rows
 * outright in any language where two days abbreviate the same way.
 */
const DAY_KEYS: TranslationKey[] = [
  'shared.day.0',
  'shared.day.1',
  'shared.day.2',
  'shared.day.3',
  'shared.day.4',
  'shared.day.5',
  'shared.day.6',
];

const dayName = (t: Translator, dow: number) => t(DAY_KEYS[dow] ?? 'shared.day.0');

/** Weekday × hour grid. Magnitude, so a single hue light→dark. */
export function Heatmap({ cells }: { cells: { dow: number; hour: number; total: number }[] }) {
  const t = useT();
  const [hover, setHover] = useState<{ dow: number; hour: number; total: number } | null>(null);
  const lookup = useMemo(() => {
    const map = new Map<string, number>();
    cells.forEach((cell) => map.set(`${cell.dow}-${cell.hour}`, cell.total));
    return map;
  }, [cells]);
  const max = Math.max(1, ...cells.map((cell) => cell.total));

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="border-separate" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th />
              {Array.from({ length: 24 }, (_, hour) => (
                <th key={hour} className="pb-1 text-[9px] font-normal" style={{ color: INK_MUTED }}>
                  {hour % 3 === 0 ? hour : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAY_KEYS.map((_key, dow) => (
              <tr key={dow}>
                <th className="pr-2 text-right text-[10px] font-normal" style={{ color: INK_MUTED }}>
                  {dayName(t, dow)}
                </th>
                {Array.from({ length: 24 }, (_, hour) => {
                  const total = lookup.get(`${dow}-${hour}`) ?? 0;
                  return (
                    <td key={hour}>
                      <div
                        className="h-5 w-5 rounded-[2px]"
                        style={{ backgroundColor: sequentialColor(total / max) }}
                        onMouseEnter={() => setHover({ dow, hour, total })}
                        onMouseLeave={() => setHover(null)}
                        title={t('shared.chart.cellTitle', {
                          day: dayName(t, dow),
                          hour,
                          total: count(total, t.lang),
                        })}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs" style={{ color: INK_MUTED }}>
        {hover
          ? t('shared.chart.heatmapHover', {
              day: dayName(t, hover.dow),
              hour: hover.hour,
              requests: t.plural(hover.total, 'shared.request'),
            })
          : t('shared.chart.heatmapLegend', {
              requests: t.plural(max, 'shared.request'),
            })}
      </p>
    </div>
  );
}

/** A tiny trend line for stat tiles. No axes, no labels — shape only. */
export function Sparkline({ values, color = '#2a78d6' }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const width = 88;
  const height = 24;
  const path = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - (value / max) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} aria-hidden>
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
