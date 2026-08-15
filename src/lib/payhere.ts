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

export const PAYHERE_MERCHANT_ID = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '1211149';
export const PAYHERE_JS_URL = process.env.NEXT_PUBLIC_PAYHERE_JS_URL || 'https://sandbox.payhere.lk/payhere.js';

let payhereScriptPromise: Promise<void> | null = null;

export function loadPayHereSDK(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not defined'));
  if ((window as any).payhere) return Promise.resolve();

  if (!payhereScriptPromise) {
    payhereScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById('payhere-sdk-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', (err) => reject(err));
        return;
      }

      const script = document.createElement('script');
      script.id = 'payhere-sdk-script';
      script.src = PAYHERE_JS_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load PayHere SDK script'));
      document.body.appendChild(script);
    });
  }

  return payhereScriptPromise;
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
