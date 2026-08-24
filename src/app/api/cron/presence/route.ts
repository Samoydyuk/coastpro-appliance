import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, requireDb } from '@/lib/db';
import { importGoogleBusinessProfile } from '@/lib/presence/gbp';
import { importMeta } from '@/lib/presence/meta';
import { importSearchConsole } from '@/lib/presence/gsc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Pulls yesterday — and the thirty days behind it — from the listings that
 * have an API.
 *
 * The rolling window is not waste. Google and Meta both restate recent figures
 * for a day or two after the fact, and Google's Performance API can backfill
 * further than that; fetching only yesterday would leave the corrections
 * unclaimed. Re-sent days overwrite, so re-fetching costs a request and nothing
 * else.
 *
 * Daily, because Vercel's Hobby plan runs cron jobs once a day whatever
 * expression is written. That suits listing metrics, which are reported daily
 * anyway — there is no finer grain to miss.
 *
 * Every run is recorded in `import_runs`, including the ones that did nothing.
 * A month with no credentials and a month with a dead token look identical in a
 * chart, and the difference is the whole point of writing the row.
 *
 * By hand:
 *   curl "https://coastpro.us/api/cron/presence?token=$CRON_SECRET"
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorised =
    request.headers.get('authorization') === `Bearer ${secret}` ||
    (secret && request.nextUrl.searchParams.get('token') === secret);

  if (secret && !authorised) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  }

  // Scheduled from the day this shipped, while the database is still being set
  // up. A 500 every morning would train whoever reads the logs to ignore this
  // job, so an unconfigured database is reported as the ordinary state it is.
  if (!isDbConfigured) {
    return NextResponse.json({ ok: false, skipped: 'Database not connected yet' });
  }

  const sql = requireDb();

  const [run] = (await sql`
    insert into import_runs (source) values ('presence_cron') returning id
  `) as unknown as { id: string }[];

  try {
    const gbp = await importGoogleBusinessProfile(sql);
    const meta = await importMeta(sql);
    const search = await importSearchConsole(sql);
    const outcomes = [gbp, ...meta, search];

    const rows = outcomes.reduce((sum, o) => sum + o.rows, 0);
    const failures = outcomes.filter((o) => !o.ok);

    await sql`
      update import_runs
      set finished_at  = now(),
          status       = ${failures.length ? 'failed' : 'ok'},
          rows_written = ${rows},
          reports      = ${sql.json(outcomes as never)},
          error        = ${failures.map((f) => `${f.channel}: ${f.error}`).join('; ') || null}
      where id = ${run.id}
    `;

    return NextResponse.json({ ok: !failures.length, rows, outcomes });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await sql`
      update import_runs
      set finished_at = now(), status = 'failed', error = ${message}
      where id = ${run.id}
    `.catch(() => undefined);
    console.error('Presence cron failed:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
