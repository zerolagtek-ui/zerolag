import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided for upload.' }, { status: 400 });
    }

    // 1. File size validation (Max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 5MB maximum limit. Please select a smaller file.' },
        { status: 400 }
      );
    }

    // 2. MIME type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    const isAllowed = allowedTypes.includes(file.type) || file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.pdf');
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Unsupported file format. Supported formats: JPEG, PNG, WEBP, PDF.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
    const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;

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

        const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
          cloudinary.uploader.upload(
            base64Data,
            { folder: 'zerolag-slips', resource_type: 'auto' },
            (error, result) => {
              if (error || !result) reject(error);
              else resolve(result);
            }
          );
        });

        if (uploadResult?.secure_url && uploadResult.secure_url.startsWith('http')) {
          return NextResponse.json({ url: uploadResult.secure_url, success: true });
        }
      } catch (cloudErr) {
        console.warn('Cloudinary upload warning (falling back to Data URL):', cloudErr);
      }
    }

    // Fallback: Return Base64 Data URL so bank slip upload never blocks the user
    return NextResponse.json({ url: base64Data, success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
