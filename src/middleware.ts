import { NextRequest, NextResponse } from 'next/server';

function verifyTokenBasic(token: string): boolean {
  try {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const payloadJson = atob(parts[0]);
    const payload = JSON.parse(payloadJson);
    if (!payload.email || !payload.exp || !payload.role) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp >= now;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
  const isAdminApi = pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/login');

  if (isAdminPage || isAdminApi) {
    const token = request.cookies.get('zerolag_admin_session')?.value;
    const isValid = token ? verifyTokenBasic(token) : false;

    if (!isValid) {
      if (isAdminApi) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Admin session required' },
          { status: 401 }
        );
      } else {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
