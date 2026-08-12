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

export const PAYHERE_MERCHANT_ID = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '1223456'; // Default sandbox merchant id

export function preparePayHereForm(orderDetails: OrderDetails, originUrl: string): PayHereParams {
  const nameParts = orderDetails.customerName.trim().split(' ');
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.slice(1).join(' ') || 'Valued';
  const orderId = `ZLAG-${Date.now()}`;

  const itemNames = orderDetails.items.map(item => `${item.product.name} (x${item.quantity})`).join(', ');

  return {
    sandbox: true,
    merchant_id: PAYHERE_MERCHANT_ID,
    return_url: `${originUrl}/checkout/success?order_id=${orderId}`,
    cancel_url: `${originUrl}/checkout`,
    notify_url: `${originUrl}/api/payhere/notify`,
    order_id: orderId,
    items: itemNames.substring(0, 200),
    amount: orderDetails.totalLkr.toFixed(2),
    currency: 'LKR',
    first_name: firstName,
    last_name: lastName,
    email: orderDetails.email,
    phone: orderDetails.phone,
    address: orderDetails.address,
    city: orderDetails.city,
    country: 'Sri Lanka'
  };
}
