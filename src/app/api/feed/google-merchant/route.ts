import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoConfigured } from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://zerolagtek.app').replace(/\/$/, '');

  try {
    let products: any[] = [];
    if (isMongoConfigured()) {
      await connectToDatabase();
      products = await Product.find({}).lean();
    }

    const escapeXml = (unsafe: string = '') =>
      unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });

    const itemsXml = products.map((p: any) => {
      const id = String(p.sku || p.id || p._id);
      const title = escapeXml(p.name || p.title || '');
      const description = escapeXml(p.description || p.name || p.title || '');
      const link = `${baseUrl}/product/${p.slug || p.id || p._id}`;
      const imageLink = p.images?.[0] || p.image || '';
      const price = `${Number(p.priceLkr || p.price || 0).toFixed(2)} LKR`;
      const availability = ((p.stock ?? 1) > 0 || p.in_stock) ? 'in_stock' : 'out_of_stock';
      const brand = escapeXml(p.brand || 'ZeroLag Tek');
      const condition = 'new';

      return `
    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:brand>${brand}</g:brand>
      <g:condition>${condition}</g:condition>
    </item>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>ZeroLag Tek Products Feed</title>
    <link>${baseUrl}</link>
    <description>ZeroLag Tek Product Catalog Feed for Google Merchant and Meta Ads</description>
    ${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating Merchant Feed:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
