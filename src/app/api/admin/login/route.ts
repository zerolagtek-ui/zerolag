import { NextResponse } from 'next/server';
import { createAdminToken } from '@/lib/adminAuth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body || {};

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Fail immediately if server-side environment variables are missing
    if (!adminEmail || !adminPassword) {
      console.error('[Admin Auth API] ADMIN_EMAIL or ADMIN_PASSWORD environment variable is not configured.');
      return NextResponse.json(
        { error: 'Admin authentication service is unconfigured.' },
        { status: 401 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const inputEmail = String(email).trim().toLowerCase();
    const targetEmail = adminEmail.trim().toLowerCase();

    const isEmailValid = inputEmail === targetEmail;
    const isPasswordValid = String(password) === adminPassword;

    if (!isEmailValid || !isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid admin credentials.' },
        { status: 401 }
      );
    }

    // Generate HMAC session token
    const token = createAdminToken(inputEmail);

    const response = NextResponse.json({
      success: true,
      user: { email: inputEmail }
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: 'zerolag_admin_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    console.error('[Admin Login Error]:', message);
    return NextResponse.json(
      { error: 'Authentication failed due to server error.' },
      { status: 500 }
    );
  }
}
