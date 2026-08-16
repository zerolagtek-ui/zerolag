import crypto from 'crypto';

/**
 * PayZY Configuration Constants (from process.env)
 */
export const PAYZY_API_KEY = (process.env.PAYZY_API_KEY || "").trim();
const envSecret = (process.env.PAYZY_SECRET_KEY || process.env.PAYZY_API_SECRET || "").trim();
export const PAYZY_API_SECRET = (envSecret.includes("$2b$12$") ? envSecret : "$2b$12$82C876HIXARFRAF8iQB6JO2C5Zc9NeEZqCwcLY2eJe2klTw.EGvWy").trim();

const _base = (process.env.PAYZY_BASE_URL || "https://api.payzypay.xyz").trim().replace(/\/+$/, "");
export const PAYZY_BASE_URL = _base;
export const PAYZY_HANDSHAKE_URL = `${_base}/checkout/custom-checkout`;

export const PAYZY_SHOP_ID = (
  process.env.PAYZY_SHOP_ID ||
  process.env.NEXT_PUBLIC_PAYZY_SHOP_ID ||
  "2"
).trim();

export const PAYZY_TEST_MODE = (
  process.env.PAYZY_TEST_MODE ||
  process.env.NEXT_PUBLIC_PAYZY_TEST_MODE ||
  "on"
).trim();

/**
 * Generates an HMAC-SHA256 signature for PayZY API strictly matching the Official Example Plugin script.js.
 */
export function generatePayzySignature(data: Record<string, any>, secret: string) {
  if (!secret) {
    console.warn("PayZY API Secret is not defined");
    return { signature: "", signed_field_names: "" };
  }

  const signed_field_names =
    "x_test_mode,x_shopid,x_amount,x_order_id,x_response_url,x_first_name,x_last_name,x_company,x_address,x_country,x_state,x_city,x_zip,x_phone,x_email,x_ship_to_first_name,x_ship_to_last_name,x_ship_to_company,x_ship_to_address,x_ship_to_country,x_ship_to_state,x_ship_to_city,x_ship_to_zip,x_freight,x_platform,x_version,signed_field_names";

  const list =
    "x_test_mode=" + (data.x_test_mode || "") +
    ",x_shopid=" + (data.x_shopid || "") +
    ",x_amount=" + (data.x_amount || "") +
    ",x_order_id=" + (data.x_order_id || "") +
    ",x_response_url=" + (data.x_response_url || "") +
    ",x_first_name=" + (data.x_first_name || "") +
    ",x_last_name=" + (data.x_last_name || "") +
    ",x_company=" + (data.x_company || "") +
    ",x_address=" + (data.x_address || "") +
    ",x_country=" + (data.x_country || "") +
    ",x_state=" + (data.x_state || "") +
    ",x_city=" + (data.x_city || "") +
    ",x_zip=" + (data.x_zip || "") +
    ",x_phone=" + (data.x_phone || "") +
    ",x_email=" + (data.x_email || "") +
    ",x_ship_to_first_name=" + (data.x_ship_to_first_name || "") +
    ",x_ship_to_last_name=" + (data.x_ship_to_last_name || "") +
    ",x_ship_to_company=" + (data.x_ship_to_company || "") +
    ",x_ship_to_address=" + (data.x_ship_to_address || "") +
    ",x_ship_to_country=" + (data.x_ship_to_country || "") +
    ",x_ship_to_state=" + (data.x_ship_to_state || "") +
    ",x_ship_to_city=" + (data.x_ship_to_city || "") +
    ",x_ship_to_zip=" + (data.x_ship_to_zip || "") +
    ",x_freight=" + (data.x_freight || "") +
    ",x_platform=" + (data.x_platform || "") +
    ",x_version" + (data.x_version || "") +
    ",signed_field_names=" + signed_field_names;

  console.log("--- [RAW HASH INPUT STRING (OFFICIAL PLUGIN SPEC)] ---", list);

  const sig = crypto
    .createHmac('sha256', secret)
    .update(list)
    .digest('base64');

  console.log("--- [GENERATED SIGNATURE] ---", sig);
  return { signature: sig, signed_field_names };
}
