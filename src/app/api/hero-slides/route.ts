import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoConfigured } from '@/lib/mongodb';
import HeroSlideModel from '@/lib/models/HeroSlide';

export async function GET() {
  try {
    if (!isMongoConfigured()) {
      return NextResponse.json({ success: true, slides: [] });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: true, slides: [] });
    }

    const docs = await HeroSlideModel.find({}).sort({ display_order: 1, created_at: -1 }).lean();
    const formatted = docs.map((item: any) => {
      const fullTitle = (item.title || item.name || `${item.titleFirstLine || ''} ${item.titleHighlight || ''}`.trim() || 'ZERO LAG HARDWARE') as string;
      const titleParts = fullTitle.split(' ');
      const firstLine = titleParts.slice(0, Math.max(1, titleParts.length - 1)).join(' ');
      const highlight = titleParts.length > 1 ? titleParts[titleParts.length - 1] : '';

      return {
        id: String(item.id || item._id),
        badgeText: (item.badge || item.badgeText || 'FLAGSHIP') as string,
        badge: (item.badge || item.badgeText || 'FLAGSHIP') as string,
        titleFirstLine: (item.titleFirstLine || firstLine) as string,
        titleHighlight: (item.titleHighlight || highlight) as string,
        title: fullTitle,
        description: (item.description || item.subtitle || '') as string,
        subtitle: (item.subtitle || item.description || '') as string,
        primaryButtonText: (item.primary_button_text || item.primaryButtonText || 'EXPLORE CATALOG') as string,
        primaryButtonLink: (item.primary_button_link || item.primaryButtonLink || '#catalog') as string,
        featuredProductId: (item.featured_product_id || item.featuredProductId || '') as string,
        customImageUrl: (item.custom_image_url || item.customImageUrl || item.image || item.image_url || '') as string,
        isActive: item.is_active !== undefined ? Boolean(item.is_active) : (item.isActive !== undefined ? Boolean(item.isActive) : true)
      };
    });

    return NextResponse.json({ success: true, slides: formatted });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch hero slides';
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
    const slideId = String(body.id || `slide-${Date.now()}`);

    const payload = {
      id: slideId,
      badgeText: body.badgeText || body.badge || 'FLAGSHIP',
      badge: body.badgeText || body.badge || 'FLAGSHIP',
      titleFirstLine: body.titleFirstLine || '',
      titleHighlight: body.titleHighlight || '',
      title: body.title || `${body.titleFirstLine || ''} ${body.titleHighlight || ''}`.trim(),
      description: body.description || body.subtitle || '',
      subtitle: body.description || body.subtitle || '',
      primary_button_text: body.primaryButtonText || body.primary_button_text || 'EXPLORE CATALOG',
      primaryButtonText: body.primaryButtonText || body.primary_button_text || 'EXPLORE CATALOG',
      primary_button_link: body.primaryButtonLink || body.primary_button_link || '#catalog',
      primaryButtonLink: body.primaryButtonLink || body.primary_button_link || '#catalog',
      featured_product_id: body.featuredProductId || body.featured_product_id || '',
      featuredProductId: body.featuredProductId || body.featured_product_id || '',
      custom_image_url: body.customImageUrl || body.custom_image_url || '',
      customImageUrl: body.customImageUrl || body.custom_image_url || '',
      is_active: body.isActive !== undefined ? Boolean(body.isActive) : true,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    };

    const doc = await HeroSlideModel.findOneAndUpdate({ id: slideId }, payload, { upsert: true, new: true });

    return NextResponse.json({ success: true, slide: doc });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to save hero slide';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Slide ID required' }, { status: 400 });
    }

    if (isMongoConfigured()) {
      await connectToDatabase();
      await HeroSlideModel.deleteOne({ id });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete hero slide';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
