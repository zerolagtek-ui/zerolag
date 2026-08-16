import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('x_order_id') || searchParams.get('order_id');
    const responseCode = searchParams.get('response_code');

    const isSuccess = responseCode === '00';
    const origin = request.nextUrl.origin || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (isSuccess && orderId) {
      let dbOrder = null;
      try {
        await connectToDatabase();
        dbOrder = await OrderModel.findOneAndUpdate(
          { id: orderId },
          {
            status: 'Paid',
            payment_method: 'payzy'
          },
          { new: true }
        );
      } catch (dbErr) {
        console.warn('[Payzy GET DB Update Warning]:', dbErr);
      }

      if (dbOrder) {
        try {
          fetch(`${origin}/api/send-order-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: dbOrder.id,
              customerName: dbOrder.customer_name,
              customerEmail: dbOrder.customer_email,
              customerPhone: dbOrder.customer_phone,
              shippingAddress: dbOrder.shipping_address,
              paymentMethod: dbOrder.payment_method || 'payzy',
              shippingMethod: dbOrder.shipping_method || 'Trans Express',
              items: dbOrder.items || [],
              subtotal: dbOrder.subtotal,
              shippingFee: dbOrder.shipping_fee,
              totalAmount: dbOrder.total_amount,
              orderDate: dbOrder.created_at || new Date().toISOString()
            })
          }).catch(err => console.error('[Payzy Verify Email Dispatch Error]:', err));
        } catch (emailErr) {
          console.error('[Payzy Verify Email Error]:', emailErr);
        }
      }

      return NextResponse.redirect(`${origin}/order-confirmation?orderId=${encodeURIComponent(orderId)}&status=success`);
    } else {
      return NextResponse.redirect(`${origin}/checkout?error=payment_failed&orderId=${encodeURIComponent(orderId || '')}`);
    }
  } catch (error) {
    console.error('Payzy GET verification error:', error);
    return NextResponse.redirect(new URL('/checkout?error=server_error', request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderId = body.x_order_id || body.order_id || body.orderId;
    const responseCode = body.response_code || body.x_response_code;

    if (orderId && responseCode === '00') {
      let dbOrder = null;
      try {
        await connectToDatabase();
        dbOrder = await OrderModel.findOneAndUpdate(
          { id: orderId },
          {
            status: 'Paid',
            payment_method: 'payzy'
          },
          { new: true }
        );
      } catch (dbErr) {
        console.warn('[Payzy POST DB Update Warning]:', dbErr);
      }

      if (dbOrder) {
        try {
          const originUrl = request.nextUrl.origin;
          fetch(`${originUrl}/api/send-order-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: dbOrder.id,
              customerName: dbOrder.customer_name,
              customerEmail: dbOrder.customer_email,
              customerPhone: dbOrder.customer_phone,
              shippingAddress: dbOrder.shipping_address,
              paymentMethod: dbOrder.payment_method || 'payzy',
              shippingMethod: dbOrder.shipping_method || 'Trans Express',
              items: dbOrder.items || [],
              subtotal: dbOrder.subtotal,
              shippingFee: dbOrder.shipping_fee,
              totalAmount: dbOrder.total_amount,
              orderDate: dbOrder.created_at || new Date().toISOString()
            })
          }).catch(err => console.error('[Payzy Verify Email Dispatch Error]:', err));
        } catch (emailErr) {
          console.error('[Payzy Verify Email Error]:', emailErr);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Verified' });
  } catch (error) {
    console.error('Payzy POST webhook error:', error);
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
