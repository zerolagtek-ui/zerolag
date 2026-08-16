import { NextResponse } from 'next/server';
import { createAdminSessionToken, timingSafeMatch } from '@/lib/adminAuth';
import { connectToDatabase, isMongoConfigured } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
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
    await autoMigrateSchema().catch(() => {});

    const clientIp = getClientIp(request);

    if (checkRateLimit(clientIp)) {
      return NextResponse.json(
        { success: false, error: 'Too many failed login attempts. Please try again after 15 minutes.' },
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
        { success: false, error: 'Invalid email or password' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const envAdminEmail = (process.env.ADMIN_EMAIL || 'zerolagtek@gmail.com').trim().toLowerCase();
    const envAdminPassword = process.env.ADMIN_PASSWORD || 'admin1234';

    let isValidAdmin = false;
    let userRole = 'super_admin';

    // 1. Check against environment variables
    if (
      normalizedEmail === envAdminEmail &&
      timingSafeMatch(password, envAdminPassword)
    ) {
      isValidAdmin = true;
    }

    // 2. Check against MongoDB User collection if not matched yet
    if (!isValidAdmin && isMongoConfigured()) {
      try {
        await connectToDatabase();
        const foundUser = await UserModel.findOne({ email: normalizedEmail }).lean();
        if (foundUser && foundUser.password_hash) {
          if (timingSafeMatch(password, foundUser.password_hash)) {
            isValidAdmin = true;
            userRole = foundUser.role || 'super_admin';
          }
        }
      } catch (dbErr) {
        console.warn('[Admin Login DB Check Error]:', dbErr);
      }
    }

    if (!isValidAdmin) {
      recordFailedAttempt(clientIp);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    recordSuccessfulLogin(clientIp);

    const token = createAdminSessionToken(normalizedEmail, userRole);
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      role: 'admin',
      user: {
        email: normalizedEmail,
        role: userRole
      }
    });

    response.cookies.set('zerolag_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    console.error('[Admin Login API Error]:', message);
    return NextResponse.json(
      { success: false, error: 'Authentication failed due to server error.' },
      { status: 500 }
    );
  }
}
