import { NextResponse } from 'next/server';
import { fetchMarketingPhoto } from '@/lib/marketing/client';
import { marketingPhotoExists } from '@/lib/marketing/queries';
import { requireAdmin } from '@/lib/admin-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A job photo, for the console's gallery.
 *
 * It goes through here rather than straight to the bucket for two reasons. The
 * key must not reach the browser — an <img src> is a URL anyone can copy. And
 * the JobPocket endpoint strips the EXIF on the way out, coordinates included,
 * which the bucket URL does not: a picture taken in someone's kitchen carries
 * the location of that kitchen.
 *
 * Everything under /api/admin is behind the console sign-in already, in the
 * middleware, so there is no auth check to repeat here.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  // Only a photo we have already been told about, so this cannot be used to
  // walk the id space of an API the console is otherwise a narrow window onto.
  if (!(await marketingPhotoExists(params.id).catch(() => false))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const upstream = await fetchMarketingPhoto(params.id).catch(() => null);
  if (!upstream?.body) {
    return NextResponse.json({ error: 'Photo unavailable' }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
      // Private: this is a customer's appliance in a customer's home, and the
      // console is one signed-in person. Nothing in front of us may keep it.
      'Cache-Control': 'private, max-age=600',
    },
  });
}
