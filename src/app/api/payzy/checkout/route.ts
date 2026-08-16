import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('--- [PAYZY INCOMING BODY] ---', body);

    const x_shopid = String(process.env.NEXT_PUBLIC_PAYZY_SHOP_ID || process.env.PAYZY_SHOP_ID || '2').trim();
    const secretKey = String(process.env.PAYZY_SECRET_KEY || process.env.PAYZY_APP_SECRET || '').trim();
    const x_version = '1.0';
    const x_platform = 'custom';

    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: 'MISSING_SECRET_KEY', message: 'PAYZY_SECRET_KEY is missing in environment variables.' },
        { status: 500 }
      );
    }

    const rawAmount = body.amount ?? body.totalAmount ?? body.finalPayable ?? body.total;
    const rawFreight = body.freight ?? body.shippingFee ?? body.deliveryFee ?? 0;
    
    const parsedAmount = Math.max(1, Number(rawAmount) || 0);
    const parsedFreight = Math.max(0, Number(rawFreight) || 0);

    const x_amount = parsedAmount.toFixed(2);
    const x_freight = parsedFreight.toFixed(2);
    const x_order_id = String(body.order_id || body.orderId || `ZLAG-${Date.now()}`).trim();
    
    // Always live domain for response_url
    const x_response_url = 'https://zerolagtek.app/api/payzy/verify';

    const x_first_name = String(body.first_name || 'Customer').trim();
    const x_last_name = String(body.last_name || 'Valued').trim();
    const x_company = String(body.company || 'ZeroLag Tek').trim();
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

    // Common shared fields string
    const commonFields = 
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
      `x_freight=${x_freight}`;

    // Test combinations: test_mode ("on" vs "On"), exact doc typo vs standard, and Base64 vs Hex
    const testModes = ['on', 'On', 'off', 'Off'];
    let finalRedirectUrl = '';
    let lastResponseData: unknown = null;

    const variants: { name: string; list: string; signed_fields: string; test_mode: string }[] = [];

    for (const tm of testModes) {
      // V1: Exact Step 01 JavaScript sample in Docs (with `,x_version1.0`)
      variants.push({
        name: `Doc Exact Typo (mode: ${tm})`,
        test_mode: tm,
        signed_fields: 'x_test_mode,x_shopid,x_amount,x_order_id,x_response_url,x_first_name,x_last_name,x_company,x_address,x_country,x_state,x_city,x_zip,x_phone,x_email,x_ship_to_first_name,x_ship_to_last_name,x_ship_to_company,x_ship_to_address,x_ship_to_country,x_ship_to_state,x_ship_to_city,x_ship_to_zip,x_freight,x_platform,x_version,signed_field_names',
        list: `x_test_mode=${tm},x_shopid=${x_shopid},x_amount=${x_amount},x_order_id=${x_order_id},x_response_url=${x_response_url},${commonFields},x_platform=${x_platform},x_version${x_version},signed_field_names=x_test_mode,x_shopid,x_amount,x_order_id,x_response_url,x_first_name,x_last_name,x_company,x_address,x_country,x_state,x_city,x_zip,x_phone,x_email,x_ship_to_first_name,x_ship_to_last_name,x_ship_to_company,x_ship_to_address,x_ship_to_country,x_ship_to_state,x_ship_to_city,x_ship_to_zip,x_freight,x_platform,x_version,signed_field_names`
      });

      // V2: Standard Step 01 (with `,x_version=1.0`)
      variants.push({
        name: `Standard Step 01 (mode: ${tm})`,
        test_mode: tm,
        signed_fields: 'x_test_mode,x_shopid,x_amount,x_order_id,x_response_url,x_first_name,x_last_name,x_company,x_address,x_country,x_state,x_city,x_zip,x_phone,x_email,x_ship_to_first_name,x_ship_to_last_name,x_ship_to_company,x_ship_to_address,x_ship_to_country,x_ship_to_state,x_ship_to_city,x_ship_to_zip,x_freight,x_platform,x_version,signed_field_names',
        list: `x_test_mode=${tm},x_shopid=${x_shopid},x_amount=${x_amount},x_order_id=${x_order_id},x_response_url=${x_response_url},${commonFields},x_platform=${x_platform},x_version=${x_version},signed_field_names=x_test_mode,x_shopid,x_amount,x_order_id,x_response_url,x_first_name,x_last_name,x_company,x_address,x_country,x_state,x_city,x_zip,x_phone,x_email,x_ship_to_first_name,x_ship_to_last_name,x_ship_to_company,x_ship_to_address,x_ship_to_country,x_ship_to_state,x_ship_to_city,x_ship_to_zip,x_freight,x_platform,x_version,signed_field_names`
      });

      // V3: JSON Schema Step 03 (x_version 2nd)
      variants.push({
        name: `Schema Step 03 (mode: ${tm})`,
        test_mode: tm,
        signed_fields: 'x_test_mode,x_version,x_shopid,x_amount,x_order_id,x_response_url,x_first_name,x_last_name,x_company,x_address,x_country,x_state,x_city,x_zip,x_phone,x_email,x_ship_to_first_name,x_ship_to_last_name,x_ship_to_company,x_ship_to_address,x_ship_to_country,x_ship_to_state,x_ship_to_city,x_ship_to_zip,x_freight,x_platform,signed_field_names',
        list: `x_test_mode=${tm},x_version=${x_version},x_shopid=${x_shopid},x_amount=${x_amount},x_order_id=${x_order_id},x_response_url=${x_response_url},${commonFields},x_platform=${x_platform},signed_field_names=x_test_mode,x_version,x_shopid,x_amount,x_order_id,x_response_url,x_first_name,x_last_name,x_company,x_address,x_country,x_state,x_city,x_zip,x_phone,x_email,x_ship_to_first_name,x_ship_to_last_name,x_ship_to_company,x_ship_to_address,x_ship_to_country,x_ship_to_state,x_ship_to_city,x_ship_to_zip,x_freight,x_platform,signed_field_names`
      });
    }

    const payzyApiUrl = process.env.PAYZY_API_URL || 'https://api.payzypay.xyz/checkout/custom-checkout';

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const sigBase64 = crypto.createHmac('sha256', secretKey).update(v.list).digest('base64');

      const payzyPayload = {
        x_test_mode: v.test_mode,
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
        signed_field_names: v.signed_fields,
        signature: sigBase64,
        x_signature: sigBase64
      };

      const payzyRes = await fetch(payzyApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payzyPayload)
      });

      const data = await payzyRes.json().catch(() => ({}));
      const url = data?.data?.url || data?.url;
      lastResponseData = data;

      if (url && !url.includes('/fromwordpress/e1')) {
        finalRedirectUrl = url;
        console.log(`\n========================================`);
        console.log(`🎯 PAYZY HASH ACCEPTED ON: [${v.name}]`);
        console.log(`🎯 REDIRECT URL:`, finalRedirectUrl);
        console.log(`========================================\n`);
        break;
      }
    }

    if (!finalRedirectUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'PAYZY_REJECTED', 
          message: 'All signature permutations were rejected. Please verify PAYZY_SECRET_KEY and SHOP_ID.',
          data: lastResponseData
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, redirect_url: finalRedirectUrl, url: finalRedirectUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Payzy checkout exception';
    console.error('Payzy checkout exception:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
