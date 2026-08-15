import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, amount, currency = 'LKR' } = body;

    if (!orderId || amount === undefined || amount === null) {
      return NextResponse.json(
        { success: false, error: 'Missing orderId or amount' },
        { status: 400 }
      );
    }

    const merchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '1211149';
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || '4MTQ2MzQ5OTIyNTI2MDUxMzA5MjIxMTU3NjY0NDkxMTY3NDEzMTg1';
    const isSandbox = (process.env.NEXT_PUBLIC_PAYHERE_MODE || 'sandbox') !== 'live';

    const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount));
    const formattedAmount = numAmount.toFixed(2);

    // PayHere Hash Formula:
    // hash = strtoupper(md5(merchant_id + order_id + formatted_amount + currency + strtoupper(md5(merchant_secret))))
    const hashedSecret = crypto
      .createHash('md5')
      .update(merchantSecret)
      .digest('hex')
      .toUpperCase();

    const rawString = `${merchantId}${orderId}${formattedAmount}${currency}${hashedSecret}`;

    const hash = crypto
      .createHash('md5')
      .update(rawString)
      .digest('hex')
      .toUpperCase();

    return NextResponse.json({
      success: true,
      hash,
      merchantId,
      amount: formattedAmount,
      currency,
      isSandbox
    });
  } catch (error: any) {
    console.error('[PayHere Hash API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
