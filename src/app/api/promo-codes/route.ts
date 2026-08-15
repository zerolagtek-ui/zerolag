import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoConfigured } from '@/lib/mongodb';
import PromoCodeModel from '@/lib/models/PromoCode';

export interface PromoCodeType {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
  expiresAt?: string | null;
  created_at?: string;
}

// In-memory fallback cache when MongoDB is not connected
const defaultSeedPromo: PromoCodeType = {
  id: 'promo-zerolag10',
  code: 'ZEROLAG10',
  discountType: 'percentage',
  discountValue: 10,
  minOrderAmount: 0,
  isActive: true,
  usageCount: 0,
  created_at: new Date().toISOString()
};

let inMemoryPromos: PromoCodeType[] = [defaultSeedPromo];

function formatPromoDoc(doc: any): PromoCodeType {
  return {
    id: String(doc.id || doc._id),
    code: String(doc.code).toUpperCase().trim(),
    discountType: doc.discountType === 'fixed' ? 'fixed' : 'percentage',
    discountValue: Number(doc.discountValue) || 0,
    minOrderAmount: Number(doc.minOrderAmount) || 0,
    maxDiscountAmount: doc.maxDiscountAmount !== undefined && doc.maxDiscountAmount !== null ? Number(doc.maxDiscountAmount) : undefined,
    isActive: doc.isActive !== undefined ? Boolean(doc.isActive) : true,
    usageCount: Number(doc.usageCount) || 0,
    maxUsage: doc.maxUsage !== undefined && doc.maxUsage !== null ? Number(doc.maxUsage) : undefined,
    expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString() : null,
    created_at: doc.created_at ? new Date(doc.created_at).toISOString() : new Date().toISOString()
  };
}

export async function GET() {
  try {
    if (isMongoConfigured()) {
      const conn = await connectToDatabase();
      if (conn) {
        let docs = await PromoCodeModel.find({}).sort({ created_at: -1 }).lean();
        
        // Seed default code ZEROLAG10 if no promo codes exist
        if (docs.length === 0) {
          const created = await PromoCodeModel.create({
            id: 'promo-zerolag10',
            code: 'ZEROLAG10',
            discountType: 'percentage',
            discountValue: 10,
            minOrderAmount: 0,
            isActive: true,
            usageCount: 0
          });
          docs = [created.toObject()];
        }
        
        const formatted = docs.map(formatPromoDoc);
        return NextResponse.json({ success: true, promoCodes: formatted });
      }
    }

    // Fallback to in-memory store
    if (inMemoryPromos.length === 0) {
      inMemoryPromos = [defaultSeedPromo];
    }

    return NextResponse.json({ success: true, promoCodes: inMemoryPromos });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch promo codes';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, maxUsage, expiresAt, isActive } = body || {};

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ success: false, error: 'Promo code is required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const val = Number(discountValue);

    if (isNaN(val) || val <= 0) {
      return NextResponse.json({ success: false, error: 'Valid discount value is required' }, { status: 400 });
    }

    if (discountType === 'percentage' && val > 100) {
      return NextResponse.json({ success: false, error: 'Percentage discount cannot exceed 100%' }, { status: 400 });
    }

    const dType: 'percentage' | 'fixed' = discountType === 'fixed' ? 'fixed' : 'percentage';

    const promoData = {
      id: `promo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code: cleanCode,
      discountType: dType,
      discountValue: val,
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: maxDiscountAmount !== undefined && maxDiscountAmount !== null && maxDiscountAmount !== '' ? Number(maxDiscountAmount) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      usageCount: 0,
      maxUsage: maxUsage !== undefined && maxUsage !== null && maxUsage !== '' ? Number(maxUsage) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      created_at: new Date()
    };

    if (isMongoConfigured()) {
      const conn = await connectToDatabase();
      if (conn) {
        const existing = await PromoCodeModel.findOne({ code: cleanCode });
        if (existing) {
          return NextResponse.json({ success: false, error: `Promo code '${cleanCode}' already exists` }, { status: 400 });
        }

        const doc = await PromoCodeModel.create(promoData);
        return NextResponse.json({ success: true, promoCode: formatPromoDoc(doc) });
      }
    }

    // In-memory fallback
    const existingIndex = inMemoryPromos.findIndex(p => p.code === cleanCode);
    if (existingIndex !== -1) {
      return NextResponse.json({ success: false, error: `Promo code '${cleanCode}' already exists` }, { status: 400 });
    }

    const formattedInMemory: PromoCodeType = {
      ...promoData,
      expiresAt: promoData.expiresAt ? promoData.expiresAt.toISOString() : null,
      created_at: promoData.created_at.toISOString()
    };

    inMemoryPromos.unshift(formattedInMemory);
    return NextResponse.json({ success: true, promoCode: formattedInMemory });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create promo code';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, code, discountType, discountValue, minOrderAmount, maxDiscountAmount, maxUsage, expiresAt, isActive } = body || {};

    if (!id) {
      return NextResponse.json({ success: false, error: 'Promo code ID is required' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (code) updatePayload.code = String(code).trim().toUpperCase();
    if (discountType) updatePayload.discountType = discountType === 'fixed' ? 'fixed' : 'percentage';
    if (discountValue !== undefined) updatePayload.discountValue = Number(discountValue);
    if (minOrderAmount !== undefined) updatePayload.minOrderAmount = Number(minOrderAmount);
    if (maxDiscountAmount !== undefined) updatePayload.maxDiscountAmount = maxDiscountAmount ? Number(maxDiscountAmount) : null;
    if (maxUsage !== undefined) updatePayload.maxUsage = maxUsage ? Number(maxUsage) : null;
    if (expiresAt !== undefined) updatePayload.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) updatePayload.isActive = Boolean(isActive);

    if (isMongoConfigured()) {
      const conn = await connectToDatabase();
      if (conn) {
        const doc = await PromoCodeModel.findOneAndUpdate(
          { $or: [{ id }, { _id: id }] },
          updatePayload,
          { returnDocument: 'after' }
        );

        if (!doc) {
          return NextResponse.json({ success: false, error: 'Promo code not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, promoCode: formatPromoDoc(doc) });
      }
    }

    // In-memory fallback
    const idx = inMemoryPromos.findIndex(p => p.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'Promo code not found' }, { status: 404 });
    }

    inMemoryPromos[idx] = {
      ...inMemoryPromos[idx],
      ...(updatePayload as any),
      expiresAt: updatePayload.expiresAt ? (updatePayload.expiresAt as Date).toISOString() : inMemoryPromos[idx].expiresAt
    };

    return NextResponse.json({ success: true, promoCode: inMemoryPromos[idx] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update promo code';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Promo code ID is required' }, { status: 400 });
    }

    if (isMongoConfigured()) {
      const conn = await connectToDatabase();
      if (conn) {
        await PromoCodeModel.deleteOne({ $or: [{ id }, { _id: id }] });
      }
    }

    inMemoryPromos = inMemoryPromos.filter(p => p.id !== id);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete promo code';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
