import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoConfigured } from '@/lib/mongodb';
import ProductModel from '@/lib/models/Product';

export async function GET() {
  try {
    if (!isMongoConfigured()) {
      return NextResponse.json({ success: true, products: [] });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: true, products: [] });
    }

    const rawDocs = await ProductModel.find({}).sort({ created_at: -1 }).lean();
    const formatted = rawDocs.map((item: any) => {
      const priceLkr = Number(item.price || item.priceLkr) || 0;
      const rawOrig = item.originalPrice !== undefined ? item.originalPrice : (item.original_price !== undefined ? item.original_price : item.originalPriceLkr);
      const origNum = Number(rawOrig);
      const originalPriceLkr = (!isNaN(origNum) && origNum > priceLkr) ? origNum : undefined;

      return {
        id: String(item.id || item._id),
        name: (item.name || item.title || 'Untitled Hardware') as string,
        brand: (item.brand || 'ZeroLag') as string,
        category: (item.category || 'all') as string,
        priceLkr,
        priceUsd: Number(item.price_usd) || Math.round(priceLkr / 300),
        originalPriceLkr,
        rating: Number(item.rating) || 0,
        reviewsCount: Number(item.reviews_count || item.reviewsCount) || 0,
        image: (item.image_url || item.image || 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=600') as string,
        galleryImages: Array.isArray(item.gallery_images) ? item.gallery_images : (Array.isArray(item.galleryImages) ? item.galleryImages : []),
        specs: (item.specs || {}) as Record<string, string>,
        description: (item.description || '') as string,
        tags: (item.features || item.tags || [item.brand || 'ZeroLag', item.category || 'all']) as string[],
        inStock: item.in_stock !== undefined ? Boolean(item.in_stock) : true,
        stockCount: Number(item.stock || item.stock_count) || 10,
        featured: Boolean(item.featured || item.is_featured),
        badge: (item.badge as string) || undefined,
        warranty: (item.warranty || '1 Year Official Warranty') as string
      };
    });

    return NextResponse.json({ success: true, products: formatted });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch products';
    console.error('[API /api/products GET Error]:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isMongoConfigured()) {
      return NextResponse.json({ success: false, error: 'Database unconfigured' }, { status: 400 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
    }

    const body = await request.json();
    const productId = String(body.id || `prod-${Date.now()}`);

    const priceNum = Number(body.priceLkr || body.price) || 0;
    const rawOrig = body.originalPriceLkr !== undefined ? body.originalPriceLkr : (body.originalPrice !== undefined ? body.originalPrice : body.original_price);
    const origNum = Number(rawOrig);
    const originalPriceVal = (!isNaN(origNum) && origNum > priceNum) ? origNum : 0;

    const payload = {
      id: productId,
      name: body.name || body.title || 'Untitled Hardware',
      brand: body.brand || 'ZeroLag',
      category: body.category || 'all',
      price: priceNum,
      originalPrice: originalPriceVal,
      original_price: originalPriceVal,
      image: body.image || 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=600',
      gallery_images: body.galleryImages || [],
      specs: body.specs || {},
      description: body.description || '',
      features: body.tags || [],
      tags: body.tags || [],
      stock: Number(body.stockCount || body.stock) || 10,
      in_stock: body.inStock !== undefined ? Boolean(body.inStock) : true,
      rating: Number(body.rating) || 0,
      reviews_count: Number(body.reviewsCount) || 0,
      featured: Boolean(body.featured),
      is_featured: Boolean(body.featured),
      badge: body.badge || undefined,
      warranty: body.warranty || '1 Year Official Warranty'
    };

    const doc = await ProductModel.findOneAndUpdate({ id: productId }, payload, { returnDocument: 'after', upsert: true });

    return NextResponse.json({ success: true, product: doc });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to save product';
    console.error('[API /api/products POST Error]:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const purgeAll = url.searchParams.get('all') === 'true';
    const id = url.searchParams.get('id');

    if (!purgeAll && !id) {
      return NextResponse.json({ success: false, error: 'Product ID or all=true required' }, { status: 400 });
    }

    if (isMongoConfigured()) {
      await connectToDatabase();
      if (purgeAll) {
        await ProductModel.deleteMany({});
        return NextResponse.json({ success: true, message: 'All products purged' });
      } else if (id) {
        await ProductModel.deleteOne({ id });
        return NextResponse.json({ success: true, deletedId: id });
      }
    }

    return NextResponse.json({ success: true, message: 'Operation completed' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete product(s)';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
