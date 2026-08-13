import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { connectToDatabase, isMongoConfigured } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('zerolag_admin_session')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = verifyAdminToken(token);
    if (!payload || !payload.email) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Safe MongoDB Query checking user status
    if (isMongoConfigured()) {
      try {
        await connectToDatabase();
        const user = await UserModel.findOne({ email: payload.email }).lean();

        if (user) {
          const isAdmin =
            user.role === 'admin' ||
            user.is_admin === true ||
            payload.role === 'admin' ||
            payload.role === 'super_admin';

          const isVerified = user.is_verified !== undefined ? Boolean(user.is_verified) : true;

          if (!isAdmin || !isVerified) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
          }
        }
      } catch (dbError: unknown) {
        const msg = dbError instanceof Error ? dbError.message : String(dbError);
        console.warn('[Admin Verify MongoDB Fallback]:', msg);
        // Fall back gracefully to valid cookie session without crashing
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: { email: payload.email, role: payload.role || 'admin' }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Verification error';
    console.error('[Admin Verify Error]:', message);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
