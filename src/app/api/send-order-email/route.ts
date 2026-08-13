import { NextResponse } from 'next/server';

interface NormalizedOrderItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface BrevoEmailPayload {
  sender: { name: string; email: string };
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}

async function sendBrevoTransactionalEmail(apiKey: string, emailPayload: BrevoEmailPayload) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify(emailPayload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Brevo REST API returned status ${res.status}`);
  }

  return data;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    // Normalize order payload properties to support both emailPayload and OrderDetails schemas
    const orderId = body.orderId || body.id || `ZLAG-${Date.now()}`;
    const customerName = body.customerName || 'Valued Gamer';
    const customerEmail = body.customerEmail || body.email;
    const customerPhone = body.customerPhone || body.phone || 'N/A';
    
    let shippingAddress = body.shippingAddress;
    if (!shippingAddress) {
      const parts = [body.address, body.city, body.postalCode].filter(Boolean);
      shippingAddress = parts.length > 0 ? parts.join(', ') : 'Standard Shipping Address';
    }

    const paymentMethod = String(body.paymentMethod || 'BANK-TRANSFER').toUpperCase();

    // Extract items safely
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const items: NormalizedOrderItem[] = rawItems.map((item: Record<string, any>) => {
      const name = String(item.name || item.product?.name || 'Pro Hardware Item');
      const quantity = Number(item.quantity || 1);
      const price = Number(item.price ?? item.product?.priceLkr ?? 0);
      const total = Number(item.total ?? (price * quantity));
      return { name, quantity, price, total };
    });

    const subtotal = Number(body.subtotal ?? body.subtotalLkr ?? items.reduce((acc: number, i: NormalizedOrderItem) => acc + i.total, 0));
    const shippingFee = Number(body.shippingFee ?? body.shippingLkr ?? 0);
    const totalAmount = Number(body.totalAmount ?? body.totalLkr ?? subtotal + shippingFee);
    const orderDate = body.orderDate || body.createdAt || new Date().toISOString();

    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email address is required.' }, { status: 400 });
    }

    // Brevo API Key & Email Configuration
    const apiKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY || '';
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'zerolagtek@gmail.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'ZeroLag Tek Store';
    const adminEmail = process.env.ADMIN_EMAIL || 'zerolagtek@gmail.com';

    const isPlaceholder = (val?: string) =>
      !val ||
      val.includes('your_') ||
      val === 'secret' ||
      val === 'your_brevo_login_email@domain.com' ||
      val === 'your_brevo_smtp_master_key_or_api_key';

    if (isPlaceholder(apiKey) || isPlaceholder(senderEmail)) {
      console.error(
        '[Brevo API Configuration Error] Missing required keys in .env.local: BREVO_API_KEY / BREVO_SMTP_KEY or BREVO_SENDER_EMAIL.'
      );
      return NextResponse.json({
        success: false,
        message: 'Brevo REST API key is missing or unconfigured in .env.local.',
        notice: 'Order saved. Populate BREVO_API_KEY / BREVO_SMTP_KEY in .env.local for HTTPS email dispatch.'
      });
    }

    // Formatted items HTML table rows
    const itemsRowsHtml = items.map((item: NormalizedOrderItem, idx: number) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#0a0c10' : '#12151e'}; font-family: monospace;">
        <td style="padding: 12px; border-bottom: 1px solid #27272a; color: #f4f4f5;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #27272a; text-align: center; color: #a3e635; font-weight: bold;">x${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #27272a; text-align: right; color: #d4d4d8;">LKR ${item.price.toLocaleString()}</td>
        <td style="padding: 12px; border-bottom: 1px solid #27272a; text-align: right; color: #a3e635; font-weight: bold;">LKR ${item.total.toLocaleString()}</td>
      </tr>
    `).join('');

    // 1. Customer Order Receipt HTML Template (Cyberpunk Dark UI)
    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { background-color: #000000; color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; }
          .card { max-width: 640px; margin: 0 auto; background-color: #090b0e; border: 1px solid #27272a; border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
          .header { border-bottom: 2px solid #a3e635; padding-bottom: 16px; margin-bottom: 24px; text-align: center; }
          .badge { background: linear-gradient(90deg, #a3e635, #10b981); color: #000000; font-weight: 900; font-family: monospace; padding: 4px 12px; border-radius: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
          .title { font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 12px; font-family: monospace; }
          .info-box { background-color: #0d1117; border: 1px solid #1f2937; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 13px; font-family: monospace; }
          .table-container { margin: 20px 0; border-radius: 12px; overflow: hidden; border: 1px solid #27272a; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background-color: #18181b; color: #a3e635; text-transform: uppercase; font-family: monospace; font-size: 11px; padding: 12px; text-align: left; letter-spacing: 1px; }
          .total-box { background: #111827; border: 1px solid #a3e635; border-radius: 12px; padding: 16px; text-align: right; margin-top: 20px; font-family: monospace; }
          .whatsapp-btn { display: inline-block; background-color: #22c55e; color: #000000; font-family: monospace; font-weight: 900; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 13px; margin-top: 16px; letter-spacing: 0.5px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <span class="badge">Official Order Receipt</span>
            <h1 class="title">ZEROLAG TEK STORE</h1>
            <p style="color: #a1a1aa; font-size: 13px; margin: 4px 0 0 0;">Thank you for your order, <strong>${customerName}</strong>!</p>
          </div>

          <div class="info-box">
            <div style="color: #a3e635; font-weight: bold; margin-bottom: 12px; font-size: 14px;">ORDER SUMMARY</div>
            <p style="margin: 4px 0;"><strong>Order Reference:</strong> <span style="color: #a3e635;">#${orderId}</span></p>
            <p style="margin: 4px 0;"><strong>Order Date:</strong> ${new Date(orderDate).toLocaleString()}</p>
            <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
            <p style="margin: 4px 0;"><strong>Shipping Destination:</strong> ${shippingAddress}</p>
            <p style="margin: 4px 0;"><strong>Phone Contact:</strong> ${customerPhone}</p>
            <p style="margin: 4px 0;"><strong>Estimated Delivery:</strong> <span style="color: #38bdf8;">2 - 3 Business Days Across Sri Lanka</span></p>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
            </table>
          </div>

          <div class="total-box">
            <p style="margin: 2px 0; color: #9ca3af; font-size: 12px;">Subtotal: LKR ${subtotal.toLocaleString()}</p>
            <p style="margin: 2px 0; color: #9ca3af; font-size: 12px;">Delivery Fee: ${shippingFee === 0 ? 'FREE DELIVERY' : `LKR ${shippingFee.toLocaleString()}`}</p>
            <h3 style="margin: 8px 0 0 0; color: #a3e635; font-size: 20px; font-weight: 900;">Total Payable: LKR ${totalAmount.toLocaleString()}</h3>
          </div>

          <div style="text-align: center; margin-top: 28px; border-t: 1px solid #1f2937; padding-top: 20px;">
            <p style="color: #a1a1aa; font-size: 12px; margin-bottom: 8px;">Need order updates or slip submission? WhatsApp our support line directly:</p>
            <a href="https://wa.me/94741117981?text=${encodeURIComponent(`Hello ZeroLag Tek Support! I have a question regarding Order #${orderId}`)}" class="whatsapp-btn">
              💬 WHATSAPP LIVE SUPPORT: +94741117981
            </a>
          </div>
        </div>
      </body>
      </html>
    `;

    // 2. Admin Instant Notification HTML Template (Cyberpunk Alert UI)
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { background-color: #000000; color: #f8fafc; font-family: monospace, sans-serif; margin: 0; padding: 20px; }
          .card { max-width: 640px; margin: 0 auto; background-color: #090b0e; border: 1px solid #00d2ff; border-radius: 20px; padding: 32px; }
          .header { border-bottom: 2px solid #00d2ff; padding-bottom: 14px; margin-bottom: 20px; }
          .alert-title { color: #00d2ff; font-size: 20px; font-weight: 900; margin: 0; }
          .customer-box { background-color: #0d1117; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px; }
          .admin-btn { display: inline-block; background-color: #00d2ff; color: #000000; font-weight: 900; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2 class="alert-title">🚨 NEW STORE ORDER ALERT #${orderId}</h2>
            <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0 0;">Received at: ${new Date(orderDate).toLocaleString()}</p>
          </div>

          <div class="customer-box">
            <p style="margin: 4px 0; color: #00d2ff; font-weight: bold;">CUSTOMER DETAILS</p>
            <p style="margin: 4px 0;"><strong>Name:</strong> ${customerName}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${customerEmail}</p>
            <p style="margin: 4px 0;"><strong>Phone:</strong> ${customerPhone}</p>
            <p style="margin: 4px 0;"><strong>Shipping Address:</strong> ${shippingAddress}</p>
            <p style="margin: 4px 0;"><strong>Payment Option:</strong> ${paymentMethod}</p>
            <p style="margin: 4px 0;"><strong>Total Revenue:</strong> <span style="color: #a3e635; font-weight: bold; font-size: 16px;">LKR ${totalAmount.toLocaleString()}</span></p>
          </div>

          <div style="border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; margin: 16px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background-color: #1e293b; color: #00d2ff;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Unit Price</th>
                  <th style="padding: 10px; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
            </table>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="https://zerolagtek.com/admin" class="admin-btn">
              ⚡ OPEN ADMIN DASHBOARD TO FULFILL ORDER
            </a>
          </div>
        </div>
      </body>
      </html>
    `;

    // Dispatch both emails concurrently over Brevo HTTPS REST API using Promise.allSettled
    const results = await Promise.allSettled([
      sendBrevoTransactionalEmail(apiKey, {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: customerEmail, name: customerName }],
        subject: `ZeroLag Tek Store - Order Confirmation #${orderId}`,
        htmlContent: customerEmailHtml,
      }),
      sendBrevoTransactionalEmail(apiKey, {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: adminEmail, name: 'ZeroLag Admin' }],
        subject: `🚨 New Order Alert #${orderId} - LKR ${totalAmount.toLocaleString()}`,
        htmlContent: adminEmailHtml,
      }),
    ]);

    const customerStatus = results[0].status === 'fulfilled' ? 'sent' : 'failed';
    const adminStatus = results[1].status === 'fulfilled' ? 'sent' : 'failed';

    if (results[0].status === 'rejected') {
      console.error('[Customer Email Dispatch via REST API Failed]:', (results[0] as PromiseRejectedResult).reason);
    }
    if (results[1].status === 'rejected') {
      console.error('[Admin Email Dispatch via REST API Failed]:', (results[1] as PromiseRejectedResult).reason);
    }

    return NextResponse.json({
      success: true,
      message: 'Dual-email dispatch processed via Brevo HTTPS REST API',
      orderId,
      dispatch: {
        customer: customerStatus,
        admin: adminStatus,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to dispatch email via Brevo REST API';
    console.error('[Brevo Dual Email REST API Error]:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
