import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoConfigured } from '@/lib/mongodb';
import ReviewModel from '@/lib/models/Review';
import { checkAdminAuthorization } from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const prodIdParam = searchParams.get('product_id');
    const statusParam = searchParams.get('status');
    const productId = prodIdParam ? String(prodIdParam).trim() : null;
    const status = statusParam ? String(statusParam).trim() : null;

    if (!isMongoConfigured()) {
      return NextResponse.json({ success: true, reviews: [] });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: true, reviews: [] });
    }

    const filter: Record<string, unknown> = {};
    if (productId) filter.product_id = productId;
    if (status) filter.status = status;

    const docs = await ReviewModel.find(filter).sort({ created_at: -1 }).lean();
    const formatted = docs.map((d: any) => ({
      id: String(d._id),
      product_id: String(d.product_id),
      user_name: String(d.user_name),
      user_email: String(d.user_email),
      rating: Number(d.rating) || 5,
      comment: String(d.comment),
      status: String(d.status || 'pending'),
      created_at: d.created_at ? new Date(d.created_at as Date).toISOString() : new Date().toISOString()
    }));

    return NextResponse.json({ success: true, reviews: formatted });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch reviews';
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
    const { product_id, user_name, user_email, rating, comment } = body || {};

    if (!product_id || !user_name || !comment) {
      return NextResponse.json({ success: false, error: 'Missing required review fields' }, { status: 400 });
    }

    const doc = await ReviewModel.create({
      product_id: String(product_id),
      user_name: String(user_name).trim(),
      user_email: String(user_email || '').trim(),
      rating: Number(rating) || 5,
      comment: String(comment).trim(),
      status: 'pending'
    });

    return NextResponse.json({ success: true, review: doc });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create review';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await checkAdminAuthorization())) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
    }

    if (!isMongoConfigured()) {
      return NextResponse.json({ success: false, error: 'Database unconfigured' }, { status: 400 });
    }

    await connectToDatabase();
    const body = await request.json();
    const id = body?.id ? String(body.id).trim() : null;
    const status = body?.status ? String(body.status).trim() : null;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'ID and status required' }, { status: 400 });
    }

    const doc = await ReviewModel.findByIdAndUpdate(id, { status }, { returnDocument: 'after' });
    return NextResponse.json({ success: true, review: doc });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update review';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await checkAdminAuthorization())) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const id = idParam ? String(idParam).trim() : null;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Review ID required' }, { status: 400 });
    }

    if (isMongoConfigured()) {
      await connectToDatabase();
      await ReviewModel.findByIdAndDelete(id);
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete review';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
