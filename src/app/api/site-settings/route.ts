import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoConfigured } from '@/lib/mongodb';
import SiteSettingsModel from '@/lib/models/SiteSettings';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'site_logo_url';

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
    if (!isMongoConfigured()) {
      return NextResponse.json({ success: false, error: 'Database unconfigured' }, { status: 400 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { key, value } = body || {};

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 });
    }

    const doc = await SiteSettingsModel.findOneAndUpdate(
      { key },
      { key, value: String(value || ''), updated_at: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, setting: doc });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to save site setting';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
