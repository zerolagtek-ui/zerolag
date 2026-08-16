import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const secretKey = process.env.PAYZY_SECRET_KEY;
    const shopId = process.env.NEXT_PUBLIC_PAYZY_SHOP_ID;
    const testMode = process.env.NEXT_PUBLIC_PAYZY_TEST_MODE || 'on';

    if (!secretKey || !shopId) {
      return NextResponse.json(
        { error: 'PAYZY_NOT_CONFIGURED', message: 'Payzy Shop ID or Secret Key missing.' },
        { status: 400 }
      );
    }

    const {
      order_id,
      amount,
      freight,
      first_name,
      last_name,
      phone,
      email,
      address,
      city,
      state = 'Western',
      zip = '00100',
      country = 'Sri Lanka',
      company = 'ZeroLag Tek',
      response_url
    } = body;

    const parsedAmount = Math.max(0, Number(amount) || 0);
    const parsedFreight = Math.max(0, Number(freight) || 0);

    if (parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'INVALID_AMOUNT', message: 'Order amount must be greater than 0.' },
        { status: 400 }
      );
    }

    const x_amount = parsedAmount.toFixed(2);
    const x_freight = parsedFreight.toFixed(2);
    const x_test_mode = process.env.NEXT_PUBLIC_PAYZY_TEST_MODE || 'on';
    const x_shopid = String(process.env.NEXT_PUBLIC_PAYZY_SHOP_ID || '').trim();
    const x_order_id = String(order_id || `ZLAG-${Date.now()}`).trim();

    const x_response_url = String(response_url || `${req.nextUrl.origin}/checkout?order_id=${x_order_id}`).trim();
    const x_first_name = String(first_name || 'Customer').trim();
    const x_last_name = String(last_name || '').trim();
    const x_company = String(company || 'ZeroLag Tek').trim();
    const x_address = String(address || 'N/A').trim();
    const x_country = String(country || 'Sri Lanka').trim();
    const x_state = String(state || 'Western').trim();
    const x_city = String(city || 'Colombo').trim();
    const x_zip = String(zip || '00100').trim();
    const x_phone = String(phone || '').trim();
    const x_email = String(email || '').trim();
    const x_ship_to_first_name = x_first_name;
    const x_ship_to_last_name = x_last_name;
    const x_ship_to_company = x_company;
    const x_ship_to_address = x_address;
    const x_ship_to_country = x_country;
    const x_ship_to_state = x_state;
    const x_ship_to_city = x_city;
    const x_ship_to_zip = x_zip;

    const signed_field_names =
      'x_test_mode,x_shopid,x_amount,x_order_id,x_response_url,x_first_name,x_last_name,x_company,x_address,x_country,x_state,x_city,x_zip,x_phone,x_email,x_ship_to_first_name,x_ship_to_last_name,x_ship_to_company,x_ship_to_address,x_ship_to_country,x_ship_to_state,x_ship_to_city,x_ship_to_zip,x_freight,x_platform,x_version,signed_field_names';

    const list =
      `x_test_mode=${x_test_mode},` +
      `x_shopid=${x_shopid},` +
      `x_amount=${x_amount},` +
      `x_order_id=${x_order_id},` +
      `x_response_url=${x_response_url},` +
      `x_first_name=${x_first_name},` +
      `x_last_name=${x_last_name},` +
      `x_company=${x_company},` +
      `x_address=${x_address},` +
      `x_country=${x_country},` +
      `x_state=${x_state},` +
      `x_city=${x_city},` +
      `x_zip=${x_zip},` +
      `x_phone=${x_phone},` +
      `x_email=${x_email},` +
      `x_ship_to_first_name=${x_ship_to_first_name},` +
      `x_ship_to_last_name=${x_ship_to_last_name},` +
      `x_ship_to_company=${x_ship_to_company},` +
      `x_ship_to_address=${x_ship_to_address},` +
      `x_ship_to_country=${x_ship_to_country},` +
      `x_ship_to_state=${x_ship_to_state},` +
      `x_ship_to_city=${x_ship_to_city},` +
      `x_ship_to_zip=${x_ship_to_zip},` +
      `x_freight=${x_freight},` +
      `x_platform=custom,` +
      `x_version=1.0,` +
      `signed_field_names=${signed_field_names}`;

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(list)
      .digest('base64');

    const payload = {
      x_test_mode,
      x_version: '1.0',
      x_shopid,
      x_amount,
      amount: parsedAmount,
      x_freight,
      freight: parsedFreight,
      x_order_id,
      order_id: x_order_id,
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
      x_platform: 'custom',
      signed_field_names,
      signature
    };

    const payzyRes = await fetch('https://api.payzypay.xyz/checkout/custom-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await payzyRes.json();
    if (result?.data?.url || result?.url) {
      return NextResponse.json({ success: true, redirectUrl: result?.data?.url || result?.url });
    }

    return NextResponse.json({ success: false, error: result }, { status: 400 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error during Payzy checkout';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
