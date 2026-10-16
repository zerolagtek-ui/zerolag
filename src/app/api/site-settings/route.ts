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
      return NextResponse.json({ success: true, key, value: '', logoUrl: '' });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: true, key, value: '', logoUrl: '' });
    }

    // Support both 'site_logo_url' and 'logoUrl' aliases
    const query = (key === 'site_logo_url' || key === 'logoUrl')
      ? { key: { $in: ['site_logo_url', 'logoUrl'] } }
      : { key };

    const doc = await SiteSettingsModel.findOne(query).sort({ updated_at: -1 }).lean();
    const val = doc?.value || '';

    return NextResponse.json({
      success: true,
      key,
      value: val,
      logoUrl: (key === 'site_logo_url' || key === 'logoUrl') ? val : undefined,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch site setting';
    console.error('[SiteSettings GET Error]:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await checkAdminAuthorization())) {
      console.warn('[SiteSettings POST Warning]: Unauthorized admin attempt.');
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
    }

    if (!isMongoConfigured()) {
      console.error('[SiteSettings POST Error]: MongoDB is not configured.');
      return NextResponse.json({ success: false, error: 'Database unconfigured' }, { status: 400 });
    }

    await connectToDatabase();
    const body = await request.json();

    // Allow payload to specify key/value OR direct logoUrl
    let key = String(body.key || '').trim();
    let value = body.value;

    if (!key && body.logoUrl !== undefined) {
      key = 'site_logo_url';
      value = body.logoUrl;
    }

    if (!key) {
      console.error('[SiteSettings POST Error]: Key is missing in payload.');
      return NextResponse.json({ success: false, error: 'Setting key is required' }, { status: 400 });
    }

    const stringVal = typeof value === 'object' ? JSON.stringify(value) : String(value || '');

    // If saving logo, keep both aliases updated
    if (key === 'site_logo_url' || key === 'logoUrl') {
      const doc1 = await SiteSettingsModel.findOneAndUpdate(
        { key: 'site_logo_url' },
        { key: 'site_logo_url', value: stringVal, updated_at: new Date() },
        { returnDocument: 'after', upsert: true }
      );
      await SiteSettingsModel.findOneAndUpdate(
        { key: 'logoUrl' },
        { key: 'logoUrl', value: stringVal, updated_at: new Date() },
        { upsert: true }
      );
      console.log('[SiteSettings POST]: Successfully updated site logo in database.');
      return NextResponse.json({ success: true, setting: doc1, logoUrl: stringVal });
    }

    const doc = await SiteSettingsModel.findOneAndUpdate(
      { key },
      { key, value: stringVal, updated_at: new Date() },
      { returnDocument: 'after', upsert: true }
    );

    return NextResponse.json({ success: true, setting: doc });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to save site setting';
    console.error('[SiteSettings POST Fatal Error]:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
