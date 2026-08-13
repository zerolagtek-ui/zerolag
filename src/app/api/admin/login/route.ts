import { NextResponse } from 'next/server';
import { createAdminToken, timingSafeMatch } from '@/lib/adminAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { autoMigrateSchema } from '@/lib/autoMigrateSchema';

interface RateLimitInfo {
  count: number;
  firstAttemptAt: number;
}

const failedAttemptsMap = new Map<string, RateLimitInfo>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const info = failedAttemptsMap.get(ip);
  if (!info) return false;

  if (now - info.firstAttemptAt > LOCKOUT_WINDOW_MS) {
    failedAttemptsMap.delete(ip);
    return false;
  }

  return info.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const info = failedAttemptsMap.get(ip);
  if (!info || now - info.firstAttemptAt > LOCKOUT_WINDOW_MS) {
    failedAttemptsMap.set(ip, { count: 1, firstAttemptAt: now });
  } else {
    info.count += 1;
  }
}

function recordSuccessfulLogin(ip: string) {
  failedAttemptsMap.delete(ip);
}

export async function POST(request: Request) {
  try {
    // Run automatic schema initialization & seeding
    await autoMigrateSchema();

    const clientIp = getClientIp(request);

    if (checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many failed login attempts. Please try again after 15 minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { email, password } = body || {};

    if (
      !email ||
      !password ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password.trim()
    ) {
      recordFailedAttempt(clientIp);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      console.error('[Auth API] Supabase database connection is not configured.');
      return NextResponse.json(
        { error: 'Database service is unconfigured.' },
        { status: 500 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query Supabase public.users table strictly for Admin accounts
    const { data: userRecord, error } = await supabase
      .from('users')
      .select('id, email, password_hash, name, role')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error || !userRecord || !userRecord.password_hash) {
      recordFailedAttempt(clientIp);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Compare submitted password against database password_hash in constant time
    const isPasswordValid = timingSafeMatch(password, userRecord.password_hash);

    if (!isPasswordValid) {
      recordFailedAttempt(clientIp);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify role is strictly 'admin'
    if (userRecord.role !== 'admin') {
      recordFailedAttempt(clientIp);
      return NextResponse.json(
        { error: 'Admin access required. Customer logins are disabled.' },
        { status: 401 }
      );
    }

    // Successful Admin Authentication: Clear rate limiter for IP
    recordSuccessfulLogin(clientIp);

    const token = createAdminToken(userRecord.email, 'admin');

    const response = NextResponse.json({
      success: true,
      role: 'admin',
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name || 'ZeroLag Admin',
        role: 'admin'
      }
    });

    // Set secure HTTP-only cookie with strict SameSite policy
    response.cookies.set({
      name: 'zerolag_admin_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    console.error('[Admin Login API Error]:', message);
    return NextResponse.json(
      { error: 'Authentication failed due to server error.' },
      { status: 500 }
    );
  }
}
