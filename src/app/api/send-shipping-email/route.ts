import { NextResponse } from 'next/server';

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

    const orderId = body.orderId || body.id || `ZLAG-${Date.now()}`;
    const customerName = body.customerName || body.customer_name || 'Valued Gamer';
    const customerEmail = body.customerEmail || body.customer_email || body.email;
    const customerPhone = body.customerPhone || body.customer_phone || body.phone || 'N/A';
    
    let shippingAddress = body.shippingAddress || body.shipping_address;
    if (!shippingAddress) {
      const parts = [body.address, body.city, body.postalCode].filter(Boolean);
      shippingAddress = parts.length > 0 ? parts.join(', ') : 'Standard Shipping Address';
    }

    const courierName = body.courierName || body.courier || 'Trans Express';
    const trackingNumber = body.trackingNumber || body.tracking_number || body.waybill || 'Dispatched via Direct Express';

    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email address is required.' }, { status: 400 });
    }

    const apiKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY || '';
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'zerolagtek@gmail.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'ZeroLag Tek Store';

    const isPlaceholder = (val?: string) =>
      !val ||
      val.includes('your_') ||
      val === 'secret' ||
      val === 'your_brevo_login_email@domain.com' ||
      val === 'your_brevo_smtp_master_key_or_api_key';

    if (isPlaceholder(apiKey) || isPlaceholder(senderEmail)) {
      console.error(
        '[Brevo API Configuration Error] Missing required keys in .env.local: BREVO_API_KEY or BREVO_SENDER_EMAIL.'
      );
      return NextResponse.json({
        success: false,
        message: 'Brevo API key missing or unconfigured in .env.local for shipping emails.',
      });
    }

    // Customer Shipping Notification HTML Template
    const shippingEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="background-color: #050608; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 16px;">
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #12131a; border: 1px solid #27272a; border-radius: 16px; padding: 24px; box-sizing: border-box;">
          
          <!-- Header -->
          <div style="border-bottom: 2px solid #22c55e; padding-bottom: 16px; margin-bottom: 24px; text-align: center;">
            <span style="background-color: #22c55e; color: #000000; font-weight: 800; padding: 4px 12px; border-radius: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Order Dispatched</span>
            <h1 style="font-size: 22px; font-weight: 800; color: #ffffff; margin: 12px 0 4px 0; letter-spacing: 1px;">🚚 YOUR ORDER IS ON THE WAY!</h1>
            <p style="color: #a1a1aa; font-size: 14px; margin: 4px 0 0 0;">Hi <strong style="color: #ffffff;">${customerName}</strong>, your package has been handed over to the courier!</p>
          </div>

          <!-- Shipping Details Box -->
          <div style="background-color: #181924; border: 1px solid #27272a; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 13px; line-height: 1.6;">
            <div style="color: #22c55e; font-weight: 800; margin-bottom: 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Dispatch Details</div>
            <p style="margin: 6px 0;"><span style="color: #a1a1aa;">Order Reference:</span> <strong style="color: #22c55e; font-size: 14px;">#${orderId}</strong></p>
            <p style="margin: 6px 0;"><span style="color: #a1a1aa;">Courier Partner:</span> <strong style="color: #ffffff; font-size: 14px;">${courierName}</strong></p>
            <p style="margin: 6px 0;"><span style="color: #a1a1aa;">Tracking / Waybill ID:</span> <strong style="color: #38bdf8; font-size: 14px;">${trackingNumber}</strong></p>
            <p style="margin: 6px 0;"><span style="color: #a1a1aa;">Delivery Address:</span> <span style="color: #f4f4f5; font-weight: 500;">${shippingAddress}</span></p>
            <p style="margin: 6px 0;"><span style="color: #a1a1aa;">Estimated Delivery:</span> <span style="color: #22c55e; font-weight: 600;">1 - 2 Business Days Across Sri Lanka</span></p>
          </div>

          <!-- Notice Box -->
          <div style="background-color: #0d1117; border: 1px solid #1f2937; border-radius: 12px; padding: 14px 18px; margin: 20px 0; font-size: 12px; color: #a1a1aa; line-height: 1.5;">
            <p style="margin: 0;">💡 <strong style="color: #ffffff;">Please Note:</strong> Our courier rider will contact you on <strong style="color: #ffffff;">${customerPhone}</strong> prior to delivery. Please ensure your contact line remains available.</p>
          </div>

          <!-- WhatsApp Tracking Support CTA -->
          <div style="text-align: center; margin-top: 28px; border-top: 1px solid #27272a; padding-top: 20px;">
            <p style="color: #a1a1aa; font-size: 13px; margin-bottom: 12px;">Track your package status directly via WhatsApp Live Support:</p>
            <a href="https://wa.me/94741117981?text=${encodeURIComponent(`Hello ZeroLag Tek Support! I have a delivery inquiry for Order #${orderId} (Tracking ID: ${trackingNumber})`)}" style="display: inline-block; background-color: #22c55e; color: #000000; font-weight: 800; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 13px; letter-spacing: 0.5px;">
              💬 TRACK ORDER ON WHATSAPP (+94741117981)
            </a>
          </div>

        </div>
      </body>
      </html>
    `;

    const result = await sendBrevoTransactionalEmail(apiKey, {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: customerEmail, name: customerName }],
      subject: `🚚 Your ZeroLag Order #${orderId} has been Dispatched!`,
      htmlContent: shippingEmailHtml,
    });

    return NextResponse.json({
      success: true,
      message: 'Shipping notification email dispatched successfully',
      orderId,
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to dispatch shipping email';
    console.error('[Shipping Email Error]:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
