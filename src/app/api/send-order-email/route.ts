import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { OrderDetails } from '@/types';

export async function POST(request: Request) {
  try {
    const order: OrderDetails = await request.json();

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER || 'zerolagtek@gmail.com';
    const smtpPass = process.env.SMTP_PASS || '';
    const adminEmail = process.env.ADMIN_EMAIL || 'zerolagtek@gmail.com';

    const itemsListHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #27272a;">${item.product.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #27272a; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #27272a; text-align: right;">Rs. ${(item.product.priceLkr * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const customerEmailHtml = `
      <div style="background-color: #000000; color: #f8fafc; font-family: monospace, sans-serif; padding: 24px; border-radius: 16px;">
        <h2 style="color: #a3e635; margin-bottom: 8px;">ZEROLAG TEK STORE - ORDER CONFIRMATION</h2>
        <p style="color: #a1a1aa; font-size: 13px;">Thank you for your order, <strong>${order.customerName}</strong>!</p>
        
        <div style="background-color: #0a0c10; border: 1px solid #27272a; padding: 16px; border-radius: 12px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Order ID:</strong> <span style="color: #a3e635;">#${order.id}</span></p>
          <p style="margin: 4px 0;"><strong>Payment Option:</strong> ${order.paymentMethod.toUpperCase()}</p>
          <p style="margin: 4px 0;"><strong>Delivery Address:</strong> ${order.address}, ${order.city}</p>
          <p style="margin: 4px 0;"><strong>Phone:</strong> ${order.phone}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
          <thead>
            <tr style="background-color: #18181b; color: #a3e635;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsListHtml}
          </tbody>
        </table>

        <div style="text-align: right; font-size: 16px; font-weight: bold; color: #a3e635; margin-top: 12px;">
          Total Payable Amount: Rs. ${order.totalLkr.toLocaleString()}
        </div>

        <div style="margin-top: 24px; padding-top: 16px; border-t: 1px solid #27272a; font-size: 12px; color: #a1a1aa;">
          <p>Questions about your shipment? Chat with us directly on WhatsApp:</p>
          <a href="https://wa.me/94741117981?text=Order%20Help%20%23${order.id}" style="display: inline-block; background-color: #22c55e; color: #000000; font-weight: bold; padding: 10px 18px; border-radius: 8px; text-decoration: none; margin-top: 8px;">WhatsApp Support: +94741117981</a>
        </div>
      </div>
    `;

    const adminEmailHtml = `
      <div style="background-color: #000000; color: #f8fafc; font-family: monospace, sans-serif; padding: 24px; border-radius: 16px;">
        <h2 style="color: #00d2ff; margin-bottom: 8px;">🚨 NEW ORDER RECEIVED #${order.id}</h2>
        <p style="color: #a1a1aa; font-size: 13px;">Customer: <strong>${order.customerName}</strong> (${order.email} / ${order.phone})</p>
        
        <div style="background-color: #0a0c10; border: 1px solid #27272a; padding: 16px; border-radius: 12px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
          <p style="margin: 4px 0;"><strong>Total Amount:</strong> Rs. ${order.totalLkr.toLocaleString()}</p>
          <p style="margin: 4px 0;"><strong>Shipping Destination:</strong> ${order.address}, ${order.city}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
          <thead>
            <tr style="background-color: #18181b; color: #00d2ff;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsListHtml}
          </tbody>
        </table>
      </div>
    `;

    if (smtpPass && smtpPass !== 'your_email_app_password') {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      // Dispatch Customer Email
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"ZeroLag Tek" <${smtpUser}>`,
        to: order.email,
        subject: `ZeroLag Tek Store Order Receipt #${order.id}`,
        html: customerEmailHtml
      });

      // Dispatch Admin Notification Email
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"ZeroLag Tek" <${smtpUser}>`,
        to: adminEmail,
        subject: `🚨 New Order Alert #${order.id} - ${order.customerName}`,
        html: adminEmailHtml
      });

      return NextResponse.json({ success: true, message: 'Emails dispatched successfully' });
    }

    console.log(`[Email Dispatch Log] Order #${order.id} for ${order.email} (SMTP unconfigured mock mode)`);
    return NextResponse.json({
      success: true,
      notice: 'Order recorded. SMTP transport pending active passkey configuration.'
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to dispatch email';
    console.error('Send Order Email Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
