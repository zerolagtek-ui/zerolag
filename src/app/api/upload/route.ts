import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'zerolag-tek',
  api_key: process.env.CLOUDINARY_API_KEY || '123456789012345',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'secret'
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Attempt Cloudinary upload if API secret is configured
    if (process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_SECRET !== 'your_cloudinary_api_secret' && process.env.CLOUDINARY_API_SECRET !== 'secret') {
      const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader.upload(
          base64Image,
          { folder: 'zerolag-products' },
          (error, result) => {
            if (error || !result) reject(error);
            else resolve(result);
          }
        );
      });

      return NextResponse.json({ url: uploadResult.secure_url, success: true });
    }

    // Fallback: Return base64 URL for seamless live preview & local persistence when Cloudinary keys are unconfigured
    return NextResponse.json({
      url: base64Image,
      success: true,
      notice: 'Stored image via local data stream fallback'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
