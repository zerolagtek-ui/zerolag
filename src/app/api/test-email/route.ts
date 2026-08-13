import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey =
      process.env.BREVO_API_KEY ||
      process.env.BREVO_SMTP_KEY ||
      '';

    const isPlaceholder = (val?: string) =>
      !val ||
      val.includes('your_') ||
      val === 'secret';

    if (isPlaceholder(apiKey)) {
      return NextResponse.json(
        {
          status: 'unconfigured',
          error: 'Brevo API key (BREVO_API_KEY / BREVO_SMTP_KEY) is missing or unconfigured in environment.',
        },
        { status: 500 }
      );
    }

    const res = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'accept': 'application/json',
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          status: 'error',
          error: data.message || `Brevo REST API error (Status ${res.status})`,
          code: data.code || 'BREVO_API_ERROR',
        },
        { status: res.status || 500 }
      );
    }

    return NextResponse.json({
      status: 'connected',
      accountEmail: data.email,
      companyName: data.companyName,
      plan: data.plan,
      senderEmail: process.env.BREVO_SENDER_EMAIL || 'zerolagtek@gmail.com',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Brevo REST API check failed';
    console.error('[Brevo REST API Health Check Error]:', message);
    return NextResponse.json({ status: 'error', error: message }, { status: 500 });
  }
}
