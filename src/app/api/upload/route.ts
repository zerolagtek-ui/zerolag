import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { connectToDatabase, isMongoConfigured } from '@/lib/mongodb';
import SiteSettingsModel from '@/lib/models/SiteSettings';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const target = String(formData.get('target') || formData.get('type') || '').trim().toLowerCase();

    if (!file) {
      console.error('[Upload API Error]: No file provided in request payload.');
      return NextResponse.json({ error: 'No file provided for upload.' }, { status: 400 });
    }

    // 1. File size validation (Max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);
      console.error(`[Upload API Error]: File size (${fileSizeMb}MB) exceeds 5MB limit.`);
      return NextResponse.json(
        { error: `File size (${fileSizeMb}MB) exceeds the 5MB maximum limit. Please select a smaller file.` },
        { status: 400 }
      );
    }

    // 2. MIME type validation
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'image/gif',
      'application/pdf'
    ];
    const isAllowed =
      allowedTypes.includes(file.type) ||
      file.type.startsWith('image/') ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.svg');

    if (!isAllowed) {
      console.error(`[Upload API Error]: Unsupported MIME format: ${file.type}`);
      return NextResponse.json(
        { error: 'Unsupported file format. Supported formats: PNG, JPG, WEBP, SVG, PDF.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png');
    const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;

    let finalUrl = '';

    // 3. Try Cloudinary Upload if configured
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const isMissingOrPlaceholder = (val?: string) =>
      !val ||
      val.includes('your_') ||
      val === 'secret' ||
      val === '123456789012345' ||
      val === 'zerolag-tek';

    if (!isMissingOrPlaceholder(cloudName) && !isMissingOrPlaceholder(apiKey) && !isMissingOrPlaceholder(apiSecret)) {
      try {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
          secure: true,
        });

        const uploadFolder = target === 'logo' ? 'zerolag-branding' : 'zerolag-slips';
        const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
          cloudinary.uploader.upload(
            base64Data,
            { folder: uploadFolder, resource_type: 'auto' },
            (error, result) => {
              if (error || !result) reject(error);
              else resolve(result);
            }
          );
        });

        if (uploadResult?.secure_url && uploadResult.secure_url.startsWith('http')) {
          finalUrl = uploadResult.secure_url;
        }
      } catch (cloudErr) {
        console.warn('[Upload API]: Cloudinary upload failed, falling back to local file storage:', cloudErr);
      }
    }

    // 4. Local File Storage Fallback (stores in public/uploads/)
    if (!finalUrl) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.promises.mkdir(uploadsDir, { recursive: true });

        const ext = path.extname(file.name) || (file.type === 'image/svg+xml' ? '.svg' : file.type === 'image/webp' ? '.webp' : '.png');
        const sanitizedBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${target === 'logo' ? 'logo' : 'upload'}_${Date.now()}_${sanitizedBase}${ext}`;
        const filePath = path.join(uploadsDir, filename);

        await fs.promises.writeFile(filePath, buffer);
        finalUrl = `/uploads/${filename}`;
        console.log(`[Upload API]: File saved locally to ${finalUrl}`);
      } catch (diskErr) {
        console.warn('[Upload API]: Local disk write failed, falling back to Base64 data URL:', diskErr);
        finalUrl = base64Data;
      }
    }

    // 5. Persist logoUrl in MongoDB (SiteSettings schema) if target is 'logo'
    if (target === 'logo' && finalUrl) {
      try {
        if (isMongoConfigured()) {
          await connectToDatabase();
          // Update both 'site_logo_url' and 'logoUrl' keys for total consistency
          await SiteSettingsModel.findOneAndUpdate(
            { key: 'site_logo_url' },
            { key: 'site_logo_url', value: finalUrl, updated_at: new Date() },
            { upsert: true, returnDocument: 'after' }
          );
          await SiteSettingsModel.findOneAndUpdate(
            { key: 'logoUrl' },
            { key: 'logoUrl', value: finalUrl, updated_at: new Date() },
            { upsert: true, returnDocument: 'after' }
          );
          console.log('[Upload API]: Successfully persisted logoUrl to MongoDB SiteSettings');
        }
      } catch (dbErr) {
        console.error('[Upload API Error]: Failed to persist logoUrl in MongoDB:', dbErr);
      }
    }

    return NextResponse.json({
      url: finalUrl,
      logoUrl: finalUrl,
      success: true,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    console.error('[Upload API Fatal Error]:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
