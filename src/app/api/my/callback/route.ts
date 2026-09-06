import { NextRequest, NextResponse } from 'next/server';
import { fileWarrantyCallback, VisitsUnavailableError } from '@/lib/customer/client';
import { readCustomerToken } from '@/lib/customer-session';
import { CUSTOMER_COOKIE } from '@/lib/cookies';
import { siteConfig } from '@/data/site-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * "It has broken again."
 *
 * A warranty callback is not a new booking and must not arrive looking like
 * one. It refers to a visit that already happened, it is the strongest signal a
 * repair shop gets that something was missed, and whoever picks it up needs to
 * see which job it came from before they quote anybody anything.
 *
 * This used to file a lead here and push it through the ordinary booking pipe,
 * which was wrong twice over. It credited an advertising channel with a
 * customer already paid for, distorting attribution; and it arrived on the
 * owner's phone as "New Booking Request!" with nothing tying it to the job
 * being complained about, so accepting it made a brand-new job rather than a
 * recall. Both now happen upstream, where the job data is: JobPocket checks the
 * visit really is this customer's, works out whether the warranty was live,
 * sends a push naming the job, and writes a note on the job's own timeline.
 *
 * All this route still owns is the session — proving whose phone this is. The
 * cookie proves a number, never a right to a particular job, so the job id goes
 * up as a claim and is checked there.
 */
export async function POST(request: NextRequest) {
  const claims = await readCustomerToken(request.cookies.get(CUSTOMER_COOKIE)?.value);
  if (!claims) {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const jobId = typeof body?.jobId === 'string' ? body.jobId : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  if (!jobId) {
    return NextResponse.json({ error: 'Which visit is this about?' }, { status: 400 });
  }

  let outcome;
  try {
    outcome = await fileWarrantyCallback(claims.phone, jobId, description.slice(0, 1000));
  } catch (error) {
    if (!(error instanceof VisitsUnavailableError)) throw error;
    // Nothing was recorded anywhere, so this must not read as "we have it".
    return NextResponse.json(
      {
        error: `We could not send that just now. Please call ${siteConfig.contact.phone} — we do not want you waiting on a message that did not arrive.`,
      },
      { status: 503 }
    );
  }

  if (!outcome.ok) {
    // 404 covers both "not your visit" and "dispatcher work", deliberately.
    return NextResponse.json({ error: 'We cannot find that visit.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, warrantyActive: outcome.warrantyActive });
}
