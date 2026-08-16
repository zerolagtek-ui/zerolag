import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoConfigured } from '@/lib/mongodb';
import PromoCodeModel from '@/lib/models/PromoCode';
import { formatPrice } from '@/lib/productsData';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, subtotalLkr } = body || {};

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json(
        { valid: false, message: 'Please enter a promo code' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const orderTotal = Number(subtotalLkr) || 0;

    let promoDoc: any = null;

    if (isMongoConfigured()) {
      const conn = await connectToDatabase();
      if (conn) {
        promoDoc = await PromoCodeModel.findOne({ code: cleanCode }).lean();
      }
    }

    if (!promoDoc) {
      return NextResponse.json({
        valid: false,
        message: `Invalid promo code: '${cleanCode}'. Please check and try again.`
      });
    }

    if (!promoDoc.isActive) {
      return NextResponse.json({
        valid: false,
        message: `Promo code '${cleanCode}' is currently inactive.`
      });
    }

    // Check expiration
    if (promoDoc.expiresAt) {
      const exp = new Date(promoDoc.expiresAt);
      if (exp.getTime() < Date.now()) {
        return NextResponse.json({
          valid: false,
          message: `Promo code '${cleanCode}' has expired.`
        });
      }
    }

    // Check max usage
    if (promoDoc.maxUsage !== undefined && promoDoc.maxUsage !== null && promoDoc.maxUsage > 0) {
      if ((promoDoc.usageCount || 0) >= promoDoc.maxUsage) {
        return NextResponse.json({
          valid: false,
          message: `Promo code '${cleanCode}' usage limit has been reached.`
        });
      }
    }

    // Check min order amount
    const minOrder = Number(promoDoc.minOrderAmount) || 0;
    if (minOrder > 0 && orderTotal < minOrder) {
      return NextResponse.json({
        valid: false,
        message: `Minimum order amount of ${formatPrice(minOrder)} is required for promo code '${cleanCode}'.`
      });
    }

    // Calculate discount amount
    const dType = promoDoc.discountType === 'fixed' ? 'fixed' : 'percentage';
    const dVal = Number(promoDoc.discountValue) || 0;
    const maxCap = promoDoc.maxDiscountAmount ? Number(promoDoc.maxDiscountAmount) : null;

    let discountAmountLkr = 0;

    if (dType === 'percentage') {
      discountAmountLkr = Math.round((orderTotal * dVal) / 100);
      if (maxCap && maxCap > 0 && discountAmountLkr > maxCap) {
        discountAmountLkr = maxCap;
      }
    } else {
      // Fixed LKR discount
      discountAmountLkr = Math.min(dVal, orderTotal);
    }

    discountAmountLkr = Math.max(0, discountAmountLkr);

    const discountSummary = dType === 'percentage' 
      ? `-${dVal}% (${formatPrice(discountAmountLkr)} saved)`
      : `-${formatPrice(discountAmountLkr)} saved`;

    const message = `${cleanCode} applied! ${discountSummary}`;

    return NextResponse.json({
      valid: true,
      message,
      discountAmountLkr,
      promoCode: {
        id: String(promoDoc.id || promoDoc._id),
        code: cleanCode,
        discountType: dType,
        discountValue: dVal,
        minOrderAmount: minOrder,
        maxDiscountAmount: maxCap
      }
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to validate promo code';
    return NextResponse.json({ valid: false, message: msg }, { status: 500 });
  }
}
