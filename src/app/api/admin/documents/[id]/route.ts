import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { getDocumentHtml, OperationsApiError } from '@/lib/bookings/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The estimate or invoice, drawn by JobPocket and passed straight through.
 *
 * Served as a whole page rather than embedded in the console's own chrome: it
 * is the document the customer received, and framing it inside another layout
 * would invite the reader to think it is a version of it.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    const html = await getDocumentHtml(params.id);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        // The document holds a customer's name, address and prices; a frame on
        // somebody else's page has no business rendering it.
        'X-Frame-Options': 'SAMEORIGIN',
      },
    });
  } catch (error) {
    if (error instanceof OperationsApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 502 });
    }
    console.error('[Documents] Render failed:', error);
    return NextResponse.json({ error: 'Could not open that document.' }, { status: 500 });
  }
}
