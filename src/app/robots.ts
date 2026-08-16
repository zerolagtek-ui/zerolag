import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://zerolagtek.app').replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/api/payzy/', '/checkout/', '/order-confirmation'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
