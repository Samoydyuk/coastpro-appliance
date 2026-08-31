/**
 * Reading one visit's report out of JobPocket.
 *
 * The other JobPocket clients in here all begin by finding a key. This one has
 * none, and that is not an oversight — the token in the URL is the whole
 * credential, so there is nothing else to hold. The asymmetry is deliberate and
 * worth stating out loud so nobody adds a key later out of tidiness: a report
 * token that leaks costs one job — one household's kitchen, one balance owing —
 * where the operations key that `bookings/client.ts` guards would cost the
 * schedule and the entire customer book. Different blast radius, different
 * protection. Bolting the operations key onto this route would give a public,
 * unauthenticated page a reason to hold the crown jewels.
 *
 * The base URL is shared with the operations client on purpose: there is one
 * JobPocket, and two environment variables naming it is two chances to point
 * half the console at staging.
 *
 * The types below are a copy, not an import. `api/src/lib/jobReport.ts` is the
 * original and the two repositories share no package, so this file is a
 * transcription that has to be kept honest by hand. Anything JobPocket adds to
 * the payload simply does not appear here until somebody adds it — which is the
 * failure mode you want, rather than a page that renders a field nobody chose
 * to publish.
 */

const DEFAULT_BASE = 'https://portal.jobpocket.app';

/**
 * Long enough for a JSON read across the country, short enough to fail before
 * the serverless function does. This endpoint does no scraping and no PDF work
 * — it is one indexed lookup and a serialisation.
 */
const REQUEST_TIMEOUT_MS = 10_000;

/** Photos are bytes off a bucket, so they get the same grace the console gives them. */
const PHOTO_TIMEOUT_MS = 15_000;

/**
 * What a token is allowed to look like, checked before it is put in a URL.
 *
 * `newReportToken` is 32 random bytes in base64url, so 43 characters from this
 * alphabet and nothing else. The point is not to guess whether a token is real
 * — only JobPocket can answer that — but to make sure a hostile path segment
 * never reaches the upstream request in the first place. The bound at the top
 * end stops a megabyte of junk in the address bar becoming a megabyte of
 * outbound request.
 */
const REPORT_TOKEN = /^[A-Za-z0-9_-]{20,128}$/;

function reportBase(): string {
  return process.env.JOBPOCKET_API_BASE || DEFAULT_BASE;
}

export interface ReportPhoto {
  id: string;
  category: string;
  caption: string | null;
  takenAt: string | null;
}

export interface ReportLine {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string | null;
  partUrl: string | null;
}

export interface JobReport {
  /** The letterhead, already resolved by JobPocket's brand rules. */
  business: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    logo: string | null;
    license: string | null;
    color: string | null;
  };
  job: {
    number: string | null;
    type: string | null;
    status: string;
    paymentStatus: string;
    address: string | null;
    scheduledAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
    durationMinutes: number | null;
  };
  customerName: string | null;
  technicianName: string | null;
  appliance: {
    name: string | null;
    model: string | null;
    serial: string | null;
  } | null;
  diagnosis: string | null;
  resolution: string | null;
  recallAnalysis: string | null;
  /** Present only when the owner shows notes on their portal too. */
  notes: string | null;
  lines: ReportLine[];
  /** Whole cents, every one of them. Nothing here is a float dollar amount. */
  money: {
    subtotalCents: number;
    taxCents: number;
    taxRate: number;
    totalCents: number;
    paidCents: number;
    balanceCents: number;
  };
  warranty: { partsDays: number | null; laborDays: number | null } | null;
  photos: ReportPhoto[];
  issuedAt: string | null;
  viewedAt: string | null;
}

/**
 * Why there is nothing to show.
 *
 * Two outcomes, and the page draws a different thing for each, which is the
 * whole reason this is a code rather than a message.
 */
export type ReportFailure =
  /**
   * Revoked, never existed, or the job behind it is gone. JobPocket collapses
   * all three into one 410 deliberately, so that a stranger cannot use this
   * page to ask which tokens are real — and we must not undo that by being
   * helpful about which one happened. Not an error: nothing is broken, the
   * link is simply spent. It gets a calm sentence and a phone number, never a
   * stack trace and never a report to the console.
   */
  | 'gone'
  /** JobPocket could not be reached, or answered with something unusable. */
  | 'unreachable';

export class ReportUnavailableError extends Error {
  readonly status: number;
  readonly code: ReportFailure;

  constructor(message: string, status: number, code: ReportFailure) {
    super(message);
    this.name = 'ReportUnavailableError';
    this.status = status;
    this.code = code;
  }
}

function gone(): ReportUnavailableError {
  return new ReportUnavailableError('That report link is no longer available.', 410, 'gone');
}

/**
 * The report behind a token.
 *
 * Never cached. The page is drawn from a live job — a line item corrected this
 * afternoon has to show this afternoon — and a cached copy of somebody's
 * invoice sitting in a shared edge cache is exactly the thing the whole of this
 * feature is careful about.
 */
export async function fetchReport(token: string): Promise<JobReport> {
  if (!REPORT_TOKEN.test(token)) throw gone();

  let response: Response;
  try {
    response = await fetch(`${reportBase()}/r/${encodeURIComponent(token)}/data`, {
      headers: { Accept: 'application/json' },
      // Next patches fetch and caches it by default. See above: never here.
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ReportUnavailableError(`Could not reach JobPocket: ${message}`, 0, 'unreachable');
  }

  if (response.status === 410) throw gone();

  // Note what is *not* folded into `gone`: a 404 means we are pointed at a host
  // that does not serve /r at all — a misconfigured JOBPOCKET_API_BASE — and
  // telling the customer their link is spent would be blaming them for our
  // deploy.
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ReportUnavailableError(
      body?.error ?? `JobPocket answered ${response.status}.`,
      response.status,
      'unreachable'
    );
  }

  const body = (await response.json().catch(() => null)) as { report?: JobReport } | null;
  if (!body?.report) {
    throw new ReportUnavailableError(
      'JobPocket answered without a report.',
      response.status,
      'unreachable'
    );
  }

  return body.report;
}

/**
 * The bytes of one photograph on a report.
 *
 * Returned as bytes rather than a URL for the same reason the console's photo
 * call is: JobPocket's bucket addresses carry no signature and no expiry, so
 * one that reached a browser would keep working long after the report link was
 * withdrawn. The proxy route is the only thing that ever sees them.
 *
 * The token is passed through to JobPocket rather than trusted here. That
 * endpoint scopes the photo by id *and* token in a single query, so a
 * remembered photo id from a link that was revoked last month is a miss, not a
 * picture of a stranger's kitchen.
 */
export async function fetchReportPhoto(
  token: string,
  photoId: string
): Promise<{ body: ArrayBuffer; contentType: string }> {
  if (!REPORT_TOKEN.test(token)) throw gone();

  let response: Response;
  try {
    response = await fetch(
      `${reportBase()}/r/${encodeURIComponent(token)}/p/${encodeURIComponent(photoId)}`,
      { cache: 'no-store', signal: AbortSignal.timeout(PHOTO_TIMEOUT_MS) }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ReportUnavailableError(`Could not reach JobPocket: ${message}`, 0, 'unreachable');
  }

  if (response.status === 410) throw gone();

  if (!response.ok) {
    throw new ReportUnavailableError(
      `JobPocket answered ${response.status} for that photo.`,
      response.status,
      'unreachable'
    );
  }

  return {
    body: await response.arrayBuffer(),
    contentType: response.headers.get('content-type') ?? 'image/jpeg',
  };
}
