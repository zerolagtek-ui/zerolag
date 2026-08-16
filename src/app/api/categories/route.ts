import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoConfigured } from '@/lib/mongodb';
import CategoryModel from '@/models/Category';
import { checkAdminAuthorization } from '@/lib/adminAuth';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export async function GET() {
  try {
    if (!isMongoConfigured()) {
      return NextResponse.json({ success: true, categories: [] });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: true, categories: [] });
    }

    const docs = await CategoryModel.find({}).sort({ displayOrder: 1, name: 1 }).lean();

    const formatted = docs.map((doc: any) => ({
      id: doc.slug || String(doc._id),
      _id: String(doc._id),
      name: doc.name,
      slug: doc.slug,
      description: doc.description || '',
      icon: doc.icon || '',
      iconName: doc.icon || '',
      image: doc.image || '',
      displayOrder: doc.displayOrder ?? 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));

    return NextResponse.json({ success: true, categories: formatted });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch categories';
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

    const name = String(body.name || '').trim();
    if (!name) {
      return NextResponse.json({ success: false, error: 'Category name is required' }, { status: 400 });
    }

    const slug = slugify(body.slug || name);
    const description = String(body.description || '');
    const icon = String(body.icon || body.iconName || '');
    const image = String(body.image || '');
    const displayOrder = typeof body.displayOrder === 'number' ? body.displayOrder : 0;

    const payload = {
      name,
      slug,
      description,
      icon,
      image,
      displayOrder
    };

    const doc = await CategoryModel.findOneAndUpdate({ slug }, payload, {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true
    });

    const formatted = {
      id: doc.slug || String(doc._id),
      _id: String(doc._id),
      name: doc.name,
      slug: doc.slug,
      description: doc.description || '',
      icon: doc.icon || '',
      iconName: doc.icon || '',
      image: doc.image || '',
      displayOrder: doc.displayOrder ?? 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };

    return NextResponse.json({ success: true, category: formatted });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create category';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return handleUpdate(request);
}

export async function PATCH(request: Request) {
  return handleUpdate(request);
}

async function handleUpdate(request: Request) {
  try {
    if (!(await checkAdminAuthorization())) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
    }

    if (!isMongoConfigured()) {
      return NextResponse.json({ success: false, error: 'Database unconfigured' }, { status: 400 });
    }

    await connectToDatabase();
    const body = await request.json();

    const id = body._id || body.id || body.slug;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID or slug required' }, { status: 400 });
    }

    const updateFields: Record<string, any> = {};
    if (body.name !== undefined) updateFields.name = String(body.name).trim();
    if (body.slug !== undefined) updateFields.slug = slugify(body.slug);
    if (body.description !== undefined) updateFields.description = String(body.description);
    if (body.icon !== undefined || body.iconName !== undefined) updateFields.icon = String(body.icon || body.iconName || '');
    if (body.image !== undefined) updateFields.image = String(body.image);
    if (body.displayOrder !== undefined) updateFields.displayOrder = Number(body.displayOrder);

    let query: Record<string, any> = { slug: id };
    if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: id };
    }

    const doc = await CategoryModel.findOneAndUpdate(query, updateFields, {
      returnDocument: 'after'
    });

    if (!doc) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    const formatted = {
      id: doc.slug || String(doc._id),
      _id: String(doc._id),
      name: doc.name,
      slug: doc.slug,
      description: doc.description || '',
      icon: doc.icon || '',
      iconName: doc.icon || '',
      image: doc.image || '',
      displayOrder: doc.displayOrder ?? 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };

    return NextResponse.json({ success: true, category: formatted });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update category';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await checkAdminAuthorization())) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id') || searchParams.get('slug');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id || body._id || body.slug;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID or slug required' }, { status: 400 });
    }

    if (isMongoConfigured()) {
      await connectToDatabase();
      let query: Record<string, any> = { slug: id };
      if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
        query = { $or: [{ _id: id }, { slug: id }] };
      }
      await CategoryModel.deleteOne(query);
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete category';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
