import { MetadataRoute } from 'next';
import { connectToDatabase, isMongoConfigured } from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';

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
      const products = await Product.find({}, 'slug updatedAt id _id').lean();
      const productRoutes: MetadataRoute.Sitemap = products.map((p: any) => ({
        url: `${baseUrl}/product/${p.slug || p.id || p._id}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

      const categories = await Category.find({}, 'slug updatedAt').lean();
      const categoryRoutes: MetadataRoute.Sitemap = categories.map((c: any) => ({
        url: `${baseUrl}/products?category=${c.slug}`,
        lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));

      return [...staticRoutes, ...categoryRoutes, ...productRoutes];
    }
    return staticRoutes;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticRoutes;
  }
}
