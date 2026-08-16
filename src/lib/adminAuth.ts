import crypto from 'crypto';

const SECRET_KEY =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_PASSWORD ||
  'zerolag_internal_auth_secret_key_2026_fallback';

export interface AdminSessionPayload {
  email: string;
  role: string;
  iat: number; // Unix timestamp in seconds
  exp: number; // Unix timestamp in seconds
}

/**
 * Performs side-channel timing attack safe comparison of two strings using SHA-256 hashing.
 */
export function timingSafeMatch(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Creates an HMAC-signed session token for the admin.
 */
export function createAdminToken(email: string, role = 'super_admin'): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 24 * 7; // 7 days validity
  const payload: AdminSessionPayload = { email, role, iat: now, exp };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

/**
 * Creates an HMAC-signed session token for the admin.
 */
export function createAdminSessionToken(
  email: string = process.env.ADMIN_EMAIL || 'zerolagtek@gmail.com',
  role: string = 'super_admin'
): string {
  return createAdminToken(email, role);
}

/**
 * Verifies an admin token's HMAC signature and expiration.
 */
export function verifyAdminToken(token: string): AdminSessionPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(payloadBase64)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const payload: AdminSessionPayload = JSON.parse(payloadJson);

    if (!payload.email || !payload.exp || !payload.role) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null; // Expired token
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Server-side helper to check if current request has a valid admin session cookie.
 */
export async function checkAdminAuthorization(): Promise<boolean> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('zerolag_admin_session')?.value;
    if (!token) return false;
    const payload = verifyAdminToken(token);
    return Boolean(payload && payload.email);
  } catch {
    return false;
  }
}

