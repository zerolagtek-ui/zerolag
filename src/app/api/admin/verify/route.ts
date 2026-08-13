import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('zerolag_admin_session')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: { email: payload.email, role: payload.role || 'super_admin' }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Verification error';
    console.error('[Admin Verify Error]:', message);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

