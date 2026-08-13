import { Product, Category } from '@/types';

export const CATEGORIES: Category[] = [
  {
    id: 'all',
    name: 'All Categories',
    iconName: 'LayoutGrid',
    count: 10,
    description: 'Browse complete hardware inventory'
  },
  {
    id: 'gaming-mice',
    name: 'Gaming Mice',
    iconName: 'Mouse',
    count: 1,
    description: 'Ultra-lightweight wireless esports mice'
  },
  {
    id: 'keyboards',
    name: 'Keyboards',
    iconName: 'Keyboard',
    count: 1,
    description: 'Analog optical & custom mechanical keyboards'
  },
  {
    id: 'controllers',
    name: 'Controllers',
    iconName: 'Gamepad2',
    count: 1,
    description: 'Competitive pro controllers with hall effect sticks'
  },
  {
    id: 'audio',
    name: 'Headsets & Spatial Audio',
    iconName: 'Headphones',
    count: 1,
    description: 'High-resolution spatial audio & ANC headsets'
  },
  {
    id: 'speakers',
    name: 'Desktop Speakers',
    iconName: 'Volume2',
    count: 1,
    description: 'Hi-Fi RGB desktop sound systems'
  },
  {
    id: 'webcams',
    name: '4K Webcams & Streaming',
    iconName: 'Camera',
    count: 1,
    description: '4K 60FPS streaming webcams & studio mic rigs'
  },
  {
    id: 'networking',
    name: 'WiFi 7 Routers & Networking',
    iconName: 'Wifi',
    count: 1,
    description: 'Zero-lag ultra-low latency mesh WiFi 7 routers'
  },
  {
    id: 'hubs-adapters',
    name: 'USB-C Hubs & Adapters',
    iconName: 'Cpu',
    count: 1,
    description: 'Multi-port Thunderbolt 4 hubs & high speed docks'
  },
  {
    id: 'power-charging',
    name: 'Fast Chargers & Power Banks',
    iconName: 'Zap',
    count: 1,
    description: 'GaN III fast chargers & magnetic battery packs'
  },
  {
    id: 'storage',
    name: 'NVMe SSDs & External Storage',
    iconName: 'HardDrive',
    count: 1,
    description: 'PCIe 5.0 high speed NVMe M.2 drives'
  }
];

export const INITIAL_PRODUCTS: Product[] = [];

export function formatPrice(priceLkr: number): string {
  return `Rs. ${priceLkr.toLocaleString()}`;
}

export function getProductSlug(product: { id: string; name?: string; title?: string }): string {
  const text = product.name || product.title || product.id || '';
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return slug || product.id;
}

export async function getProductsFromSupabase(): Promise<any[]> {
  try {
    const { supabase, isSupabaseConfigured } = await import('@/lib/supabase');
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase.from('products').select('*');
    if (!error && data) {
      return data.map((row: any) => ({
        id: row.id,
        name: row.name || row.title || 'Untitled Hardware',
        title: row.name || row.title || 'Untitled Hardware',
        brand: row.brand || 'ZeroLag',
        category: row.category || 'all',
        price: Number(row.price) || 0,
        priceLkr: Number(row.price) || 0,
        priceUsd: Number(row.price_usd) || Math.round((Number(row.price) || 0) / 300),
        originalPrice: Number(row.original_price || row.originalPrice) || Number(row.price) || 0,
        originalPriceLkr: Number(row.original_price || row.originalPrice) || Number(row.price) || 0,
        rating: Number(row.rating) || 0,
        reviewsCount: Number(row.reviews_count) || 0,
        image: row.image_url || row.image || 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=600',
        imageUrl: row.image_url || row.image || 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=600',
        stock: Number(row.stock || row.stock_count) || 10,
        stockCount: Number(row.stock || row.stock_count) || 10,
        inStock: row.in_stock !== undefined ? Boolean(row.in_stock) : true,
        description: row.description || '',
        warranty: row.warranty_period || row.warranty || '1 Year Official Warranty',
        specs: row.specs || {},
        tags: row.features || row.tags || []
      }));
    }
  } catch (err) {
    console.error('Error fetching products from Supabase:', err);
  }
  return [];
}
