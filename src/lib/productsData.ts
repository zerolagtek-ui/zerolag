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

export function generateSlug(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function getProductSlug(product: { id: string; name?: string; title?: string }): string {
  const text = product.name || product.title || '';
  const slug = generateSlug(text);
  return slug || String(product.id || '');
}


export async function getProductsFromSupabase(): Promise<Product[]> {
  try {
    const { syncProductsFromDatabase } = await import('@/lib/storeManager');
    const products = await syncProductsFromDatabase();
    return products;
  } catch (err) {
    console.error('Error fetching products from MongoDB database:', err);
  }
  return [];
}
