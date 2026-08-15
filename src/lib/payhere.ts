import { OrderDetails } from '@/types';

export interface PayHereParams {
  sandbox: boolean;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  amount: string;
  currency: 'LKR' | 'USD';
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash?: string;
}

export const PAYHERE_MERCHANT_ID = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '';

export const SCRIPT_URL =
  process.env.NEXT_PUBLIC_PAYHERE_JS_URL ||
  (process.env.NEXT_PUBLIC_PAYHERE_MODE === 'live'
    ? 'https://www.payhere.lk/payhere.js'
    : 'https://sandbox.payhere.lk/payhere.js');

export const loadPayHereSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    if ((window as any).payhere) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('payhere-sdk') as HTMLScriptElement | null;
    if (existingScript) {
      if ((window as any).payhere) {
        resolve();
        return;
      }
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'payhere-sdk';
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (err) => {
      console.error('PayHere SDK Load Error:', err);
      reject(new Error('Failed to load PayHere SDK script from ' + SCRIPT_URL));
    };

    document.head.appendChild(script);
  });
};

export function submitPayHereForm(params: PayHereParams): void {
  if (typeof window === 'undefined') return;

  const isLive = (process.env.NEXT_PUBLIC_PAYHERE_MODE || 'sandbox') === 'live';
  const actionUrl = isLive
    ? 'https://www.payhere.lk/pay/checkout'
    : 'https://sandbox.payhere.lk/pay/checkout';

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = actionUrl;

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    }
  });

  document.body.appendChild(form);
  form.submit();
}

export function preparePayHereForm(orderDetails: OrderDetails, originUrl: string, hash: string = ''): PayHereParams {
  const nameParts = (orderDetails.customerName || 'Customer Valued').trim().split(' ');
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.slice(1).join(' ') || 'Valued';
  const orderId = orderDetails.id || `ZLAG-${Date.now()}`;

  const itemNames = (orderDetails.items || []).map(item => `${item.product.name} (x${item.quantity})`).join(', ');

  const isSandbox = (process.env.NEXT_PUBLIC_PAYHERE_MODE || 'sandbox') !== 'live';

  return {
    sandbox: isSandbox,
    merchant_id: PAYHERE_MERCHANT_ID,
    return_url: `${originUrl}/checkout?order_id=${orderId}`,
    cancel_url: `${originUrl}/checkout`,
    notify_url: `${originUrl}/api/payhere/notify`,
    order_id: orderId,
    items: (itemNames || 'ZeroLag Hardware Order').substring(0, 200),
    amount: (orderDetails.totalLkr || 0).toFixed(2),
    currency: 'LKR',
    hash: hash,
    first_name: firstName,
    last_name: lastName,
    email: orderDetails.email || 'customer@example.com',
    phone: orderDetails.phone || '0771234567',
    address: orderDetails.address || 'Colombo',
    city: orderDetails.city || 'Colombo',
    country: 'Sri Lanka'
  };
}
