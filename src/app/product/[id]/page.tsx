import { Metadata } from 'next';
import { ProductDetails } from '@/components/ProductDetails';
import { connectToDatabase, isMongoConfigured } from '@/lib/mongodb';
import ProductModel from '@/lib/models/Product';
import { generateSlug, getProductSlug } from '@/lib/productsData';
import { Product } from '@/types';

async function getProduct(id: string): Promise<Product | null> {
  const target = id;
  const matchDoc = (doc: any) => {
    if (!doc) return false;
    const pIdStr = String(doc.id || doc._id || '');
    const pTitle = doc.name || doc.title || '';
    const slugifiedTitle = generateSlug(String(pTitle));
    const docSlug = doc.slug || '';
    return (
      pIdStr === target ||
      docSlug === target ||
      slugifiedTitle === target ||
      slugifiedTitle === generateSlug(target) ||
      getProductSlug({ id: pIdStr, name: pTitle }) === target
    );
  };

  try {
    if (isMongoConfigured()) {
      await connectToDatabase();
      let doc = await ProductModel.findOne({
        $or: [{ id: target }, { slug: target }]
      }).lean();

      if (!doc) {
        const allDocs = await ProductModel.find({}).lean();
        doc = allDocs.find(matchDoc) || null;
      }

      if (doc) {
        const priceLkr = Number(doc.price || (doc as any).priceLkr) || 0;
        const rawOrig = (doc as any).originalPrice !== undefined
          ? (doc as any).originalPrice
          : ((doc as any).original_price !== undefined ? (doc as any).original_price : (doc as any).originalPriceLkr);
        const origNum = Number(rawOrig);
        const originalPriceLkr = (!isNaN(origNum) && origNum > priceLkr) ? origNum : undefined;

        return {
          id: String(doc.id || doc._id),
          name: (doc.name || doc.title || 'Untitled Hardware') as string,
          brand: (doc.brand || 'ZeroLag') as string,
          category: (doc.category || 'all') as string,
          priceLkr,
          price: priceLkr,
          sellingPrice: priceLkr,
          priceUsd: Number((doc as any).price_usd) || Math.round(priceLkr / 300),
          originalPriceLkr,
          rating: Number(doc.rating) || 0,
          reviewsCount: Number(doc.reviews_count || (doc as any).reviewsCount) || 0,
          image: (doc.image || (doc as any).image_url || 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=600') as string,
          galleryImages: Array.isArray(doc.gallery_images) ? doc.gallery_images : (Array.isArray((doc as any).galleryImages) ? (doc as any).galleryImages : []),
          specs: (doc.specs || {}) as Record<string, string>,
          description: (doc.description || '') as string,
          tags: (doc.features || doc.tags || [doc.brand || 'ZeroLag', doc.category || 'all']) as string[],
          inStock: doc.in_stock !== undefined ? Boolean(doc.in_stock) : ((doc.stock ?? 1) > 0),
          stockCount: Number(doc.stock || (doc as any).stock_count) || 10,
          featured: Boolean(doc.featured || doc.is_featured),
          badge: doc.badge ? String(doc.badge) : undefined,
          warranty: (doc.warranty || '1 Year Official Warranty') as string,
          slug: doc.slug || generateSlug(doc.name || doc.title || String(doc.id))
        };
      }
    }
  } catch (err) {
    console.error('Error fetching product for SSR metadata:', err);
  }

  return null;
}

function getCanonicalSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/$/, '');
  }
  return 'https://www.zerolagtek.app';
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  const siteUrl = getCanonicalSiteUrl();

  if (!product) {
    return {
      title: 'Product Details | ZeroLag Tek',
      other: {
        'product:price:currency': 'LKR',
      }
    };
  }

  const sellingPrice = product.sellingPrice ?? product.priceLkr ?? product.price ?? 0;
  const slug = getProductSlug(product) || id;
  const productUrl = `${siteUrl}/product/${slug}`;

  return {
    title: `${product.name} | ZeroLag Tek`,
    description: product.description || `Buy ${product.name} at ZeroLag Tek Sri Lanka with official warranty and fast islandwide delivery.`,
    openGraph: {
      title: product.name,
      description: product.description || `Buy ${product.name} at ZeroLag Tek Sri Lanka.`,
      url: productUrl,
      images: product.image ? [{ url: product.image, alt: product.name }] : [],
      type: 'website',
    },
    other: {
      'product:price:amount': String(product.sellingPrice ?? sellingPrice),
      'product:price:currency': 'LKR',
    }
  };
}

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const product = await getProduct(id);
  const siteUrl = getCanonicalSiteUrl();

  const sellingPrice = product ? (product.sellingPrice ?? product.priceLkr ?? product.price ?? 0) : 0;
  const productSlug = product ? (getProductSlug(product) || id) : id;
  const productUrl = `${siteUrl}/product/${productSlug}`;

  const jsonLd = product
    ? {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        image: product.image,
        description: product.description || product.name,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'LKR',
          price: String(sellingPrice),
          availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: productUrl,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetails id={id} initialProduct={product} />
    </>
  );
}
