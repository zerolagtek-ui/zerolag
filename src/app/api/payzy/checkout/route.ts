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
      amount, // Total amount including subtotal, delivery, and +10% surcharge
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

    const x_test_mode = testMode;
    const x_shopid = String(shopId);
    const x_amount = Number(amount).toFixed(2);
    const x_order_id = String(order_id);
    const x_response_url = response_url || `${req.nextUrl.origin}/checkout?order_id=${order_id}`;
    const x_first_name = String(first_name || 'Customer');
    const x_last_name = String(last_name || '');
    const x_company = String(company);
    const x_address = String(address || 'N/A');
    const x_country = String(country);
    const x_state = String(state);
    const x_city = String(city || 'Colombo');
    const x_zip = String(zip);
    const x_phone = String(phone);
    const x_email = String(email);
    const x_ship_to_first_name = x_first_name;
    const x_ship_to_last_name = x_last_name;
    const x_ship_to_company = x_company;
    const x_ship_to_address = x_address;
    const x_ship_to_country = x_country;
    const x_ship_to_state = x_state;
    const x_ship_to_city = x_city;
    const x_ship_to_zip = x_zip;
    const x_freight = Number(freight || 0).toFixed(2);
    const x_platform = 'custom';
    const x_version = '1.0';

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
      `x_platform=${x_platform},` +
      `x_version=${x_version},` +
      `signed_field_names=${signed_field_names}`;

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(list)
      .digest('base64');

    const payload = {
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
