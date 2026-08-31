import { NextResponse } from 'next/server';
import { fetchReportPhoto, ReportUnavailableError } from '@/lib/reports/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A photograph on a service report.
 *
 * Proxied rather than linked for the reason every photo route in this codebase
 * is proxied: JobPocket's bucket addresses carry no signature and no expiry, so
 * one that reached a browser would go on working after the report link was
 * withdrawn. The bytes come through here or not at all.
 *
 * ## Why the caching is the opposite of the neighbour's
 *
 * `app/api/repair-photo/[id]` serves the same *kind* of bytes with
 * `public, max-age=86400, immutable`, and that is correct there: those are
 * marketing photographs somebody deliberately published on a website, and
 * caching them hard at the edge is the whole point.
 *
 * These are not those. This is one household's kitchen, behind a bearer token
 * that lives in a URL people forward and screenshot. `public` would let a
 * shared proxy or a CDN keep the image under an address that anyone who once
 * saw the link can go back to; `immutable` would keep it there after the owner
 * revoked the report. So: `private, no-store`, and nothing between us and the
 * customer holds a copy. Do not "fix" this to match the file next door — the
 * difference is the feature.
 *
 * Authorisation is the token, checked upstream. This route deliberately does
 * not look the photo up itself: JobPocket scopes it by photo id *and* report
 * token in one query, and re-implementing that here would be a second copy of
 * the rule, free to drift from the first.
 */
export async function GET(
  _request: Request,
  { params }: { params: { token: string; photoId: string } }
) {
  try {
    const photo = await fetchReportPhoto(params.token, params.photoId);

    return new NextResponse(photo.body, {
      headers: {
        'Content-Type': photo.contentType,
        'Cache-Control': 'private, no-store',
        // The page carrying this image is noindex; an image URL that leaked
        // into a crawler on its own would not be, and it still has the token
        // in it.
        'X-Robots-Tag': 'noindex, nofollow',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (error) {
    // A revoked link and a photo id that was never on this report are the same
    // 410 here, exactly as they are upstream. Not logged: nothing is broken.
    if (error instanceof ReportUnavailableError && error.code === 'gone') {
      return NextResponse.json({ error: 'gone' }, { status: 410 });
    }
    console.error('[Report] Photo failed:', error);
    return NextResponse.json({ error: 'Photo unavailable' }, { status: 502 });
  }
}
