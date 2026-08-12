import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/cookies';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clear(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = '';
  const response = NextResponse.redirect(url);
  response.cookies.set(ADMIN_COOKIE, '', { maxAge: 0, path: '/' });
  return response;
}

export const GET = clear;
export const POST = clear;
