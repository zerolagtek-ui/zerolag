import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request: Request) {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const isMissingOrPlaceholder = (val?: string) =>
      !val ||
      val.includes('your_') ||
      val === 'secret' ||
      val === '123456789012345' ||
      val === 'zerolag-tek';

    if (isMissingOrPlaceholder(cloudName) || isMissingOrPlaceholder(apiKey) || isMissingOrPlaceholder(apiSecret)) {
      return NextResponse.json(
        { error: 'Cloudinary environment variables are missing or unconfigured. Hosted image upload unavailable.' },
        { status: 500 }
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided for upload.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

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

    if (!uploadResult?.secure_url || !uploadResult.secure_url.startsWith('http')) {
      return NextResponse.json(
        { error: 'Failed to obtain valid hosted Cloudinary URL.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: uploadResult.secure_url, success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

