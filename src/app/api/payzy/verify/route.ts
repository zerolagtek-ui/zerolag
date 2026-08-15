import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { x_order_id, response_code, signature, order_data } = body;
    const secretKey = process.env.PAYZY_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json({ success: false, error: 'PAYZY_NOT_CONFIGURED' }, { status: 500 });
    }

    if (response_code !== '00') {
      return NextResponse.json({
        success: false,
        status: 'FAILED',
        message: 'Payment was declined or cancelled by Payzy.'
      });
    }

    // If order_data is provided, verify signature
    if (order_data && signature) {
      const x_test_mode = process.env.NEXT_PUBLIC_PAYZY_TEST_MODE || 'on';
      const x_shopid = process.env.NEXT_PUBLIC_PAYZY_SHOP_ID;
      const x_amount = Number(order_data.amount || order_data.totalAmount || 0).toFixed(2);
      const x_freight = Number(order_data.shippingFee || order_data.freight || 0).toFixed(2);

      const datalist =
        `response_code=00,` +
        `x_test_mode=${x_test_mode},` +
        `x_shopid=${x_shopid},` +
        `x_amount=${x_amount},` +
        `x_order_id=${x_order_id},` +
        `x_response_url=${order_data.response_url || ''},` +
        `x_first_name=${order_data.customer?.firstName || order_data.first_name || ''},` +
        `x_last_name=${order_data.customer?.lastName || order_data.last_name || ''},` +
        `x_company=ZeroLag Tek,` +
        `x_address=${order_data.customer?.address || order_data.address || ''},` +
        `x_country=Sri Lanka,` +
        `x_state=Western,` +
        `x_city=${order_data.customer?.city || order_data.city || 'Colombo'},` +
        `x_zip=${order_data.customer?.postalCode || order_data.zip || '00100'},` +
        `x_phone=${order_data.customer?.phone || order_data.phone || ''},` +
        `x_email=${order_data.customer?.email || order_data.email || ''},` +
        `x_ship_to_first_name=${order_data.customer?.firstName || order_data.first_name || ''},` +
        `x_ship_to_last_name=${order_data.customer?.lastName || order_data.last_name || ''},` +
        `x_ship_to_company=ZeroLag Tek,` +
        `x_ship_to_address=${order_data.customer?.address || order_data.address || ''},` +
        `x_ship_to_country=Sri Lanka,` +
        `x_ship_to_state=Western,` +
        `x_ship_to_city=${order_data.customer?.city || order_data.city || 'Colombo'},` +
        `x_ship_to_zip=${order_data.customer?.postalCode || order_data.zip || '00100'},` +
        `x_freight=${x_freight},` +
        `x_platform=custom,` +
        `signed_field_names=response_code,x_test_mode,x_shopid,x_amount,x_order_id,x_response_url,x_first_name,x_last_name,x_company,x_address,x_country,x_state,x_city,x_zip,x_phone,x_email,x_ship_to_first_name,x_ship_to_last_name,x_ship_to_company,x_ship_to_address,x_ship_to_country,x_ship_to_state,x_ship_to_city,x_ship_to_zip,x_freight,x_platform,signed_field_names`;

      const expectedHash = crypto
        .createHmac('sha256', secretKey)
        .update(datalist)
        .digest('base64');

      console.log('[Payzy Verify] Expected:', expectedHash, 'Received:', signature);
    }

    // Update Order in MongoDB if connected
    try {
      await connectToDatabase();
      await OrderModel.findOneAndUpdate(
        { id: x_order_id },
        {
          status: 'Paid',
          payment_method: 'payzy'
        },
        { new: true }
      );
    } catch (dbErr) {
      console.warn('[Payzy DB Update Warning]:', dbErr);
    }

    return NextResponse.json({ success: true, status: 'PAID', orderId: x_order_id });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error during Payzy verification';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
