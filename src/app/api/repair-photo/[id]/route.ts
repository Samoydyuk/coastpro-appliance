import { NextResponse } from 'next/server';
import { fetchMarketingPhoto } from '@/lib/marketing/client';
import { photoIsPublic, editedPhoto } from '@/lib/marketing/published';

export const runtime = 'nodejs';
/**
 * Cached at the edge for a day. The bytes never change — a photo is replaced
 * by choosing a different one, which is a different id.
 */
export const revalidate = 86400;

/**
 * A photo on a published write-up.
 *
 * Public, unlike its counterpart under /api/admin, and gated on two facts
 * rather than a session: somebody chose this picture for a piece, and that
 * piece is published. A selected photo on an unpublished draft is still
 * private, which is why the check is not just "is it selected".
 *
 * It is proxied for the same reason the console's is — the storage URL serves
 * the original, metadata and all, and this route serves what JobPocket has
 * already stripped.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!(await photoIsPublic(params.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // An edited copy — cropped, or with a mark on it — is the one that goes out.
  // It lives in the database rather than a bucket, so nothing new is reachable
  // from the browser, and it was re-encoded by a canvas so it carries no
  // metadata of its own.
  const edited = await editedPhoto(params.id).catch(() => null);
  if (edited) {
    return new Response(new Uint8Array(edited), {
      headers: {
        'Content-Type': 'image/jpeg',
        // Safe to keep immutable: an edit changes the ?v= in the URL, so this
        // is genuinely a different address for different bytes.
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
      },
    });
  }

  const upstream = await fetchMarketingPhoto(params.id).catch(() => null);
  if (!upstream?.body) {
    return NextResponse.json({ error: 'Photo unavailable' }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
    },
  });
}
