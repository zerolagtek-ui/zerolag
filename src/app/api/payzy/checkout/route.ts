import { NextResponse } from "next/server";
import crypto from "crypto";
import { PAYZY_HANDSHAKE_URL } from "@/lib/payzy";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Direct final total (do not add freight again since body.amount / body.totalAmount already includes it)
    const rawFreight = Number(body.freight ?? body.shippingFee ?? 0);
    const finalAmount = Number(body.totalAmount ?? body.amount ?? 0);

    // 2. Ensure NO empty string fields are sent (use sensible fallback defaults if blank)
    const firstName = String(body.first_name || 'Customer').trim() || 'Customer';
    const lastName = String(body.last_name || '').trim() || 'Customer';
    const company = String(body.company || '').trim() || 'N/A';
    const address = String(body.address || '').trim() || 'Colombo';
    const city = String(body.city || '').trim() || 'Colombo';
    const state = String(body.state || '').trim() || 'Western';
    const zip = String(body.zip || '').trim() || '00100';
    const phone = String(body.phone || '').trim() || '0771234567';
    const email = String(body.email || '').trim() || 'customer@example.com';
    const country = String(body.country || '').trim() || 'Sri Lanka';

    const reqHost = req.headers.get('host') || 'localhost:3000';
    const reqProtocol = req.headers.get('x-forwarded-proto') || 'http';
    const dynamicOrigin = `${reqProtocol}://${reqHost}`;
    const responseUrl = body.response_url || body.responseUrl || `${dynamicOrigin}/api/payzy/verify`;

    const payloadData: Record<string, string> = {
      x_test_mode: (process.env.PAYZY_TEST_MODE || 'on').trim(),
      x_shopid: (process.env.PAYZY_SHOP_ID || '2').trim(),
      x_amount: finalAmount.toFixed(2),
      x_order_id: String(body.order_id || body.orderId || `${Date.now()}`),
      x_response_url: responseUrl,
      x_first_name: firstName,
      x_last_name: lastName,
      x_company: company,
      x_address: address,
      x_country: country,
      x_state: state,
      x_city: city,
      x_zip: zip,
      x_phone: phone,
      x_email: email,
      x_ship_to_first_name: firstName,
      x_ship_to_last_name: lastName,
      x_ship_to_company: company,
      x_ship_to_address: address,
      x_ship_to_country: country,
      x_ship_to_state: state,
      x_ship_to_city: city,
      x_ship_to_zip: zip,
      x_freight: rawFreight.toFixed(2),
      x_platform: "custom",
      x_version: "1.0",
      signed_field_names: "x_test_mode,x_shopid,x_amount,x_order_id,x_response_url,x_first_name,x_last_name,x_company,x_address,x_country,x_state,x_city,x_zip,x_phone,x_email,x_ship_to_first_name,x_ship_to_last_name,x_ship_to_company,x_ship_to_address,x_ship_to_country,x_ship_to_state,x_ship_to_city,x_ship_to_zip,x_freight,x_platform,x_version,signed_field_names"
    };

    const list =
      "x_test_mode=" + payloadData.x_test_mode +
      ",x_shopid=" + payloadData.x_shopid +
      ",x_amount=" + payloadData.x_amount +
      ",x_order_id=" + payloadData.x_order_id +
      ",x_response_url=" + payloadData.x_response_url +
      ",x_first_name=" + payloadData.x_first_name +
      ",x_last_name=" + payloadData.x_last_name +
      ",x_company=" + payloadData.x_company +
      ",x_address=" + payloadData.x_address +
      ",x_country=" + payloadData.x_country +
      ",x_state=" + payloadData.x_state +
      ",x_city=" + payloadData.x_city +
      ",x_zip=" + payloadData.x_zip +
      ",x_phone=" + payloadData.x_phone +
      ",x_email=" + payloadData.x_email +
      ",x_ship_to_first_name=" + payloadData.x_ship_to_first_name +
      ",x_ship_to_last_name=" + payloadData.x_ship_to_last_name +
      ",x_ship_to_company=" + payloadData.x_ship_to_company +
      ",x_ship_to_address=" + payloadData.x_ship_to_address +
      ",x_ship_to_country=" + payloadData.x_ship_to_country +
      ",x_ship_to_state=" + payloadData.x_ship_to_state +
      ",x_ship_to_city=" + payloadData.x_ship_to_city +
      ",x_ship_to_zip=" + payloadData.x_ship_to_zip +
      ",x_freight=" + payloadData.x_freight +
      ",x_platform=" + payloadData.x_platform +
      ",x_version" + payloadData.x_version +
      ",signed_field_names=" + payloadData.signed_field_names;

    const secretKeyEnv = (process.env.PAYZY_SECRET_KEY || '').trim();
    const secretKey = (secretKeyEnv.includes('$2b$12$') ? secretKeyEnv : '$2b$12$82C876HIXARFRAF8iQB6JO2C5Zc9NeEZqCwcLY2eJe2klTw.EGvWy').trim();
    const signature = crypto.createHmac('sha256', secretKey).update(list).digest('base64');
    payloadData.signature = signature;

    const fullPayload = payloadData;

    // Official example plugin uses JSON POST (express.json() & axios.post)
    const response = await fetch(PAYZY_HANDSHAKE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(fullPayload),
    });

    // ── 405 Fallback: Gateway rejects server-side POST → return auto-submit form ──
    if (response.status === 405) {
      console.warn("[Payzy] 405 received on server-side POST — returning client-side form auto-submit fallback.");
      const formFields = Object.entries(fullPayload)
        .map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v).replace(/"/g, '&quot;')}" />`)
        .join("\n");
      const html = `<!DOCTYPE html><html><body>
<form id="pf" method="POST" action="${PAYZY_HANDSHAKE_URL}">
${formFields}
</form>
<script>document.getElementById('pf').submit();</script>
</body></html>`;
      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", "X-Payzy-Fallback": "form-submit" },
      });
    }

    const payzyData = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("PayZY Gateway Error Body:", JSON.stringify(payzyData, null, 2));
      return NextResponse.json(
        { 
          success: false,
          error: payzyData.message || `PayZY initiation failed: ${response.statusText}`,
          data: payzyData 
        },
        { status: response.status }
      );
    }

    const redirectUrl = payzyData?.url || payzyData?.payment_url || payzyData?.data?.url || payzyData?.data?.redirect_url;

    if (redirectUrl) {
      return NextResponse.json({
        success: true,
        url: redirectUrl,
        redirect_url: redirectUrl,
        data: payzyData
      });
    }

    return NextResponse.json({ success: false, error: "Invalid response from PayZY API", data: payzyData }, { status: 502 });

  } catch (error: any) {
    console.error("PayZY Checkout Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
