import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { getJobPhoto, OperationsApiError } from '@/lib/bookings/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A photo, served by this site rather than linked from JobPocket's bucket.
 *
 * Two reasons for the extra hop. The plugin key never reaches a page, so it
 * cannot be read out of the HTML. And the bucket's own URLs carry no signature
 * and no expiry — one that escaped into a browser cache or a screenshot would
 * keep working for good.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string; photoId: string } }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    const photo = await getJobPhoto(params.jobId, params.photoId);

    return new NextResponse(photo.body, {
      headers: {
        'Content-Type': photo.contentType,
        // Private, so a shared proxy never holds a customer's photograph, and
        // short, so a deleted photo stops being visible within the hour.
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    if (error instanceof OperationsApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 502 });
    }
    console.error('[Jobs] Photo failed:', error);
    return NextResponse.json({ error: 'Could not load that photo.' }, { status: 500 });
  }
}
