import { MetadataRoute } from 'next';
import { connectToDatabase, isMongoConfigured } from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';

function formatUrlSlug(value: string): string {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace spaces and special characters with hyphens
    .replace(/^-+|-+$/g, '');     // Trim leading and trailing hyphens
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://zerolagtek.app').replace(/\/$/, '');

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/shipping-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/warranty-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    if (isMongoConfigured()) {
      await connectToDatabase();
      const products = await Product.find({}, 'name slug updatedAt id _id').lean();
      const productRoutes: MetadataRoute.Sitemap = products
        .map((p: any) => {
          // 1. Prefer existing valid slug if it is not an ID
          let rawSlug = p.slug;

          // 2. If slug is missing or is just a prod-ID, generate it from the product name
          if (!rawSlug || rawSlug.startsWith('prod-') || rawSlug.includes('17867')) {
            rawSlug = p.name || p.title || p.id || String(p._id);
          }

          const safeSlug = formatUrlSlug(rawSlug);
          if (!safeSlug) return null;

          return {
            url: `${baseUrl}/product/${safeSlug}`,
            lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          };
        })
        .filter(Boolean) as MetadataRoute.Sitemap;

      const categories = await Category.find({}, 'slug name updatedAt').lean();
      const categoryRoutes: MetadataRoute.Sitemap = categories
        .map((c: any) => {
          const safeCategorySlug = formatUrlSlug(c.slug || c.name);
          if (!safeCategorySlug) return null;

          return {
            url: `${baseUrl}/products?category=${safeCategorySlug}`,
            lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
          };
        })
        .filter(Boolean) as MetadataRoute.Sitemap;

      return [...staticRoutes, ...categoryRoutes, ...productRoutes];
    }
    return staticRoutes;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticRoutes;
  }
}
