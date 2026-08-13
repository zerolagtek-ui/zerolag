import { Product, OrderDetails, BankAccountDetails, HeroSlide, Category } from '@/types';
import { CATEGORIES as DEFAULT_CATEGORIES } from './productsData';

const PRODUCTS_STORAGE_KEY = 'zerolag_products_v2';
const ORDERS_STORAGE_KEY = 'zerolag_orders_v2';
const BANK_STORAGE_KEY = 'zerolag_bank_details_v2';
const SLIDES_STORAGE_KEY = 'zerolag_hero_slides_v1';
const CATEGORIES_STORAGE_KEY = 'zerolag_categories_v1';
const LOGO_STORAGE_KEY = 'zerolag_site_logo_url_v1';

export const DEFAULT_BANK_DETAILS: BankAccountDetails = {
  bankName: 'Commercial Bank of Ceylon',
  accountName: 'ZeroLag Tek LK (Pvt) Ltd',
  accountNumber: '8004592011',
  branch: 'Liberty Plaza Branch (Colombo 03)',
  swiftCode: 'CCBYLKLX',
  instructions: 'Please transfer the total order amount to the bank account above and send a photo/screenshot of the bank payment receipt via WhatsApp to +94741117981 along with your Order ID.'
};

export const INITIAL_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    badgeText: 'FLAGSHIP GAMING HARDWARE',
    titleFirstLine: 'ZERO LATENCY',
    titleHighlight: 'PRO GEAR',
    description: 'Engineered for esports champions. Experience instant response, rapid trigger optical switches, sub-1ms wireless tech, and 4K ultra precision.',
    primaryButtonText: 'EXPLORE CATALOG',
    primaryButtonLink: '#catalog',
    featuredProductId: '',
    isActive: true
  },
  {
    id: 'slide-2',
    badgeText: 'RAPID TRIGGER OPTICAL KEYBOARDS',
    titleFirstLine: 'DOMINATE WITH',
    titleHighlight: 'PRECISION',
    description: 'Custom hall-effect switches with 0.1mm actuation sensitivity, magnetic switches, and ultra-fast 8000Hz polling rate.',
    primaryButtonText: 'SHOP KEYBOARDS',
    primaryButtonLink: '#catalog',
    featuredProductId: '',
    isActive: true
  },
  {
    id: 'slide-3',
    badgeText: 'NEXT-GEN WI-FI 7 SPEED',
    titleFirstLine: 'ZERO LAG',
    titleHighlight: 'NETWORKING',
    description: 'Multi-Gigabit tri-band routers designed to eliminate ping spikes and optimize online competitive gaming connections.',
    primaryButtonText: 'VIEW NETWORKING',
    primaryButtonLink: '#catalog',
    featuredProductId: '',
    isActive: true
  }
];

export const INITIAL_ORDERS: OrderDetails[] = [];

// Product Store API
export function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed: Product[] = JSON.parse(raw);
    const containsDemo = Array.isArray(parsed) && parsed.some(p =>
      p.id === 'prod-1' || p.id === 'prod-2' || p.id === 'prod-3' ||
      p.id === 'gpro-x-superlight-2' || p.id === 'wooting-60he' ||
      p.id === 'dualsense-edge' || p.id === 'steelseries-arctis-nova-pro'
    );
    if (containsDemo) {
      localStorage.removeItem(PRODUCTS_STORAGE_KEY);
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

export function saveProducts(products: Product[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event('zerolag-products-updated'));
  } catch (e) {
    console.error('Error saving products:', e);
  }
}

export async function syncProductsFromDatabase(): Promise<Product[]> {
  const cached = getStoredProducts();
  if (typeof window === 'undefined') return cached;

  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.products) && data.products.length > 0) {
        saveProducts(data.products);
        return data.products;
      }
    }
  } catch (err) {
    console.warn('[Products API Sync Warning]:', err);
  }
  return cached;
}

export const syncProductsFromSupabase = syncProductsFromDatabase;

export function addStoredProduct(product: Product): Product[] {
  const products = getStoredProducts();
  const updated = [product, ...products];
  saveProducts(updated);

  if (typeof window !== 'undefined') {
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    }).catch(err => console.error('[Products API Insert Error]:', err));
  }

  return updated;
}

export function updateStoredProduct(updatedProduct: Product): Product[] {
  const products = getStoredProducts();
  const updated = products.map(p => (p.id === updatedProduct.id ? updatedProduct : p));
  saveProducts(updated);

  if (typeof window !== 'undefined') {
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct)
    }).catch(err => console.error('[Products API Update Error]:', err));
  }

  return updated;
}

export function deleteStoredProduct(productId: string): Product[] {
  const products = getStoredProducts();
  const updated = products.filter(p => p.id !== productId);
  saveProducts(updated);

  if (typeof window !== 'undefined') {
    fetch(`/api/products?id=${encodeURIComponent(productId)}`, {
      method: 'DELETE'
    }).catch(err => console.error('[Products API Delete Error]:', err));
  }

  return updated;
}

// Order Store API
export function getStoredOrders(): OrderDetails[] {
  if (typeof window === 'undefined') return INITIAL_ORDERS;
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveOrders(orders: OrderDetails[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event('zerolag-orders-updated'));
  } catch (e) {
    console.error('Error saving orders:', e);
  }
}

export function addStoredOrder(order: OrderDetails): OrderDetails[] {
  const orders = getStoredOrders();
  const newOrder: OrderDetails = {
    ...order,
    id: order.id || `ZLAG-${Math.floor(100000 + Math.random() * 900000)}`,
    orderStatus: order.orderStatus || 'Pending',
    paymentStatus: order.paymentStatus || (order.paymentMethod === 'cod' || order.paymentMethod === 'bank-transfer' ? 'Pending' : 'Paid'),
    createdAt: order.createdAt || new Date().toISOString()
  };

  const updated = [newOrder, ...orders];
  saveOrders(updated);
  return updated;
}

export function updateOrderStatus(orderId: string, status: OrderDetails['orderStatus']): OrderDetails[] {
  const orders = getStoredOrders();
  const updated = orders.map(o => {
    if (o.id === orderId) {
      return {
        ...o,
        orderStatus: status,
        paymentStatus: status === 'Completed' ? ('Paid' as const) : o.paymentStatus
      };
    }
    return o;
  });
  saveOrders(updated);
  return updated;
}

// Bank Account Store API
export function getStoredBankDetails(): BankAccountDetails {
  if (typeof window === 'undefined') return DEFAULT_BANK_DETAILS;
  try {
    const raw = localStorage.getItem(BANK_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(DEFAULT_BANK_DETAILS));
      return DEFAULT_BANK_DETAILS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_BANK_DETAILS;
  }
}

export function saveBankDetails(details: BankAccountDetails): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(details));
    window.dispatchEvent(new Event('zerolag-bank-updated'));
  } catch (e) {
    console.error('Error saving bank details:', e);
  }
}

// Hero Slides Store API
export function formatSlideImageUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.includes('drive.google.com')) {
    const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }
  return trimmed;
}

export function getHeroSlides(): HeroSlide[] {
  if (typeof window === 'undefined') return INITIAL_HERO_SLIDES;
  try {
    const raw = localStorage.getItem(SLIDES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SLIDES_STORAGE_KEY, JSON.stringify(INITIAL_HERO_SLIDES));
      return INITIAL_HERO_SLIDES;
    }
    const parsed: HeroSlide[] = JSON.parse(raw);
    return parsed.map(s => ({
      ...s,
      customImageUrl: formatSlideImageUrl(s.customImageUrl)
    }));
  } catch {
    return INITIAL_HERO_SLIDES;
  }
}

export function saveHeroSlides(slides: HeroSlide[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SLIDES_STORAGE_KEY, JSON.stringify(slides));
    window.dispatchEvent(new Event('zerolag-slides-updated'));
  } catch (e) {
    console.error('Error saving hero slides:', e);
  }
}

export async function syncHeroSlidesFromDatabase(): Promise<HeroSlide[]> {
  const cached = getHeroSlides();
  if (typeof window === 'undefined') return cached;

  try {
    const res = await fetch('/api/hero-slides');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.slides) && data.slides.length > 0) {
        saveHeroSlides(data.slides);
        return data.slides;
      }
    }
  } catch (err) {
    console.warn('[Hero Slides API Sync Warning]:', err);
  }
  return cached;
}

export const syncHeroSlidesFromSupabase = syncHeroSlidesFromDatabase;

export function addHeroSlide(slide: HeroSlide): HeroSlide[] {
  const slides = getHeroSlides();
  const formattedSlide: HeroSlide = {
    ...slide,
    customImageUrl: formatSlideImageUrl(slide.customImageUrl)
  };
  const updated = [formattedSlide, ...slides];
  saveHeroSlides(updated);

  if (typeof window !== 'undefined') {
    fetch('/api/hero-slides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedSlide)
    }).catch(err => console.error('[Hero Slides API Insert Error]:', err));
  }

  return updated;
}

export function updateHeroSlide(slide: HeroSlide): HeroSlide[] {
  const slides = getHeroSlides();
  const formattedSlide: HeroSlide = {
    ...slide,
    customImageUrl: formatSlideImageUrl(slide.customImageUrl)
  };
  const updated = slides.map(s => (s.id === slide.id ? formattedSlide : s));
  saveHeroSlides(updated);

  if (typeof window !== 'undefined') {
    fetch('/api/hero-slides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedSlide)
    }).catch(err => console.error('[Hero Slides API Update Error]:', err));
  }

  return updated;
}

export function deleteHeroSlide(slideId: string): HeroSlide[] {
  const slides = getHeroSlides();
  const updated = slides.filter(s => s.id !== slideId);
  saveHeroSlides(updated);

  if (typeof window !== 'undefined') {
    fetch(`/api/hero-slides?id=${encodeURIComponent(slideId)}`, {
      method: 'DELETE'
    }).catch(err => console.error('[Hero Slides API Delete Error]:', err));
  }

  return updated;
}

// Dynamic Categories Store API
export function getDynamicCategories(): Category[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: Category[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('zerolag-categories-updated'));
  } catch (e) {
    console.error('Error saving categories:', e);
  }
}

export function addCategory(category: Category): Category[] {
  const categories = getDynamicCategories();
  const updated = [...categories, category];
  saveCategories(updated);
  return updated;
}

export function updateCategory(category: Category): Category[] {
  const categories = getDynamicCategories();
  const updated = categories.map(c => (c.id === category.id ? category : c));
  saveCategories(updated);
  return updated;
}

export function deleteCategory(categoryId: string): Category[] {
  const categories = getDynamicCategories();
  const updated = categories.filter(c => c.id !== categoryId);
  saveCategories(updated);
  return updated;
}

// Site Branding / Logo Store API
export function cleanLogoUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.includes('drive.google.com')) {
    const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/') && !trimmed.startsWith('data:')) {
    return `/${trimmed}`;
  }

  return trimmed;
}

export function getStoredSiteLogo(): string {
  if (typeof window === 'undefined') return '';
  try {
    const logo = localStorage.getItem('site_logo_url') ||
      localStorage.getItem(LOGO_STORAGE_KEY) ||
      localStorage.getItem('zerolag_site_logo_url_v1') ||
      localStorage.getItem('temp_uploaded_logo') ||
      '';
    return cleanLogoUrl(logo);
  } catch {
    return '';
  }
}

export function saveSiteLogo(logoUrl: string): void {
  if (typeof window === 'undefined') return;
  const cleaned = cleanLogoUrl(logoUrl);
  try {
    localStorage.setItem(LOGO_STORAGE_KEY, cleaned);
    localStorage.setItem('site_logo_url', cleaned);
    window.dispatchEvent(new Event('zerolag-logo-updated'));
    window.dispatchEvent(new Event('site_logo_updated'));
  } catch (e) {
    console.error('Error saving site logo to localStorage:', e);
  }

  if (typeof window !== 'undefined') {
    fetch('/api/site-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'site_logo_url', value: cleaned })
    }).catch(err => console.error('[Site Logo API Save Error]:', err));
  }
}

export async function syncSiteLogoFromDatabase(): Promise<string> {
  const localLogo = getStoredSiteLogo();
  if (typeof window === 'undefined') return localLogo;

  try {
    const res = await fetch('/api/site-settings?key=site_logo_url');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.value) {
        const cleaned = cleanLogoUrl(data.value);
        localStorage.setItem(LOGO_STORAGE_KEY, cleaned);
        localStorage.setItem('site_logo_url', cleaned);
        window.dispatchEvent(new Event('zerolag-logo-updated'));
        window.dispatchEvent(new Event('site_logo_updated'));
        return cleaned;
      }
    }
  } catch (err) {
    console.warn('[Site Logo API Sync Warning]:', err);
  }
  return localLogo;
}

export const syncSiteLogoFromSupabase = syncSiteLogoFromDatabase;
