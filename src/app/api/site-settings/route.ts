import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoConfigured } from '@/lib/mongodb';
import SiteSettingsModel from '@/lib/models/SiteSettings';
import { checkAdminAuthorization } from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyParam = searchParams.get('key');
    const key = keyParam ? String(keyParam).trim() : 'site_logo_url';

    if (!isMongoConfigured()) {
      return NextResponse.json({ success: true, value: '' });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: true, value: '' });
    }

    const doc = await SiteSettingsModel.findOne({ key }).lean();
    return NextResponse.json({ success: true, key, value: doc?.value || '' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch site setting';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await checkAdminAuthorization())) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
    }

    if (!isMongoConfigured()) {
      return NextResponse.json({ success: false, error: 'Database unconfigured' }, { status: 400 });
    }

    await connectToDatabase();
    const body = await request.json();
    const key = String(body.key || '').trim();
    const value = body.value;

    if (!key) {
      return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 });
    }

    const doc = await SiteSettingsModel.findOneAndUpdate(
      { key },
      { key, value: typeof value === 'object' ? JSON.stringify(value) : String(value || ''), updated_at: new Date() },
      { returnDocument: 'after', upsert: true }
    );

    return NextResponse.json({ success: true, setting: doc });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to save site setting';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
