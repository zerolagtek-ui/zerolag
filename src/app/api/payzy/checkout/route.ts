import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('--- [PAYZY INCOMING BODY] ---', body);

    const secretKey = String(process.env.PAYZY_SECRET_KEY || process.env.PAYZY_APP_SECRET || '').trim();
    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: 'MISSING_SECRET_KEY', message: 'PAYZY_SECRET_KEY is missing in environment variables.' },
        { status: 500 }
      );
    }

    const x_shopid = String(process.env.NEXT_PUBLIC_PAYZY_SHOP_ID || process.env.PAYZY_SHOP_ID || '2').trim();
    const rawTestMode = (process.env.NEXT_PUBLIC_PAYZY_TEST_MODE || 'on').trim();
    const x_test_mode = rawTestMode.toLowerCase() === 'off' ? 'off' : 'on';
    const x_version = '1.0';
    const x_platform = 'custom';

    const rawAmount = body.amount ?? body.totalAmount ?? body.finalPayable ?? body.total ?? 0;
    const rawFreight = body.freight ?? body.shippingFee ?? body.deliveryFee ?? 0;

    const x_amount = String(Number(rawAmount) || 0);
    const x_freight = String(Number(rawFreight) || 0);
    const x_order_id = String(body.order_id || body.orderId || `ZLAG-${Date.now()}`).trim();
    const x_response_url = 'https://zerolagtek.app/api/payzy/verify';

    const x_first_name = String(body.first_name || 'Customer').trim();
    const x_last_name = String(body.last_name || 'Valued').trim();
    const x_company = String(body.company || 'ZeroLag Customer').trim();
    const x_address = String(body.address || 'Colombo').trim();
    const x_country = 'Sri Lanka';
    const x_state = String(body.state || 'Western').trim();
    const x_city = String(body.city || 'Colombo').trim();
    const x_zip = String(body.zip || '00100').trim();
    const x_phone = String(body.phone || '0771234567').trim();
    const x_email = String(body.email || 'customer@zerolagtek.app').trim();

    const x_ship_to_first_name = x_first_name;
    const x_ship_to_last_name = x_last_name;
    const x_ship_to_company = x_company;
    const x_ship_to_address = x_address;
    const x_ship_to_country = x_country;
    const x_ship_to_state = x_state;
    const x_ship_to_city = x_city;
    const x_ship_to_zip = x_zip;

    // Step 01 Hash string from Doc:
    const list =
      "x_test_mode=" + x_test_mode +
      ",x_shopid=" + x_shopid +
      ",x_amount=" + x_amount +
      ",x_order_id=" + x_order_id +
      ",x_response_url=" + x_response_url +
      ",x_first_name=" + x_first_name +
      ",x_last_name=" + x_last_name +
      ",x_company=" + x_company +
      ",x_address=" + x_address +
      ",x_country=" + x_country +
      ",x_state=" + x_state +
      ",x_city=" + x_city +
      ",x_zip=" + x_zip +
      ",x_phone=" + x_phone +
      ",x_email=" + x_email +
      ",x_ship_to_first_name=" + x_ship_to_first_name +
      ",x_ship_to_last_name=" + x_ship_to_last_name +
      ",x_ship_to_company=" + x_ship_to_company +
      ",x_ship_to_address=" + x_ship_to_address +
      ",x_ship_to_country=" + x_ship_to_country +
      ",x_ship_to_state=" + x_ship_to_state +
      ",x_ship_to_city=" + x_ship_to_city +
      ",x_ship_to_zip=" + x_ship_to_zip +
      ",x_freight=" + x_freight +
      ",x_platform=" + x_platform +
      ",x_version" + x_version +
      ",signed_field_names=" +
      "x_test_mode,x_shopid,x_amount,x_order_id,x_response_url,x_first_name,x_last_name,x_company,x_address,x_country,x_state,x_city,x_zip,x_phone,x_email,x_ship_to_first_name,x_ship_to_last_name,x_ship_to_company,x_ship_to_address,x_ship_to_country,x_ship_to_state,x_ship_to_city,x_ship_to_zip,x_freight,x_platform,x_version,signed_field_names";

    const hashInBase64 = crypto.createHmac('sha256', secretKey).update(list).digest('base64');

    // Step 03 Exact JSON Structure from Doc:
    const payzyPayload: Record<string, unknown> = {
      x_test_mode,
      x_version,
      x_shopid,
      x_amount,
      x_order_id,
      x_response_url,
      x_first_name,
      x_last_name,
      x_company,
      x_address,
      x_country,
      x_state,
      x_city,
      x_zip,
      x_phone,
      x_email,
      x_ship_to_first_name,
      x_ship_to_last_name,
      x_ship_to_company,
      x_ship_to_address,
      x_ship_to_country,
      x_ship_to_state,
      x_ship_to_city,
      x_ship_to_zip,
      x_freight,
      x_platform,
      signed_field_names:
        "x_test_mode,x_version,x_shopid,x_amount,x_order_id,x_response_url,x_first_name,x_last_name,x_company,x_address,x_country,x_state,x_city,x_zip,x_phone,x_email,x_ship_to_first_name,x_ship_to_last_name,x_ship_to_company,x_ship_to_address,x_ship_to_country,x_ship_to_state,x_ship_to_city,x_ship_to_zip,x_freight,x_platform,signed_field_names",
      signature: hashInBase64
    };

    console.log('--- [DISPATCHING TO PAYZY] ---', payzyPayload);

    const payzyRes = await fetch('https://api.payzypay.xyz/checkout/custom-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payzyPayload)
    });

    const data = await payzyRes.json().catch(() => ({}));
    console.log('--- [PAYZY RESPONSE] ---', data);

    const redirectUrl = data?.data?.url || data?.url;

    if (!redirectUrl || redirectUrl.includes('/fromwordpress/e1')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'PAYZY_REJECTED', 
          message: 'Payzy signature verification failed. Please verify PAYZY_SECRET_KEY and SHOP_ID in .env match your Payzy Portal credentials.',
          data 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, redirect_url: redirectUrl, url: redirectUrl, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Payzy checkout exception';
    console.error('Payzy checkout exception:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
