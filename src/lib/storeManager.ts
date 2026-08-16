import { Product, OrderDetails, BankAccountDetails, HeroSlide, Category, ShippingOption } from '@/types';
import { CATEGORIES as DEFAULT_CATEGORIES } from './productsData';

const PRODUCTS_STORAGE_KEY = 'zerolag_products_v2';
const ORDERS_STORAGE_KEY = 'zerolag_orders_v2';
const BANK_STORAGE_KEY = 'zerolag_bank_details_v2';
const SLIDES_STORAGE_KEY = 'zerolag_hero_slides_v1';
const CATEGORIES_STORAGE_KEY = 'zerolag_categories_v1';
const LOGO_STORAGE_KEY = 'zerolag_site_logo_url_v1';
const SHIPPING_STORAGE_KEY = 'zerolag_shipping_rates_v1';

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

export function saveProducts(products: Product[], skipEvent = false): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    if (!skipEvent) {
      window.dispatchEvent(new Event('zerolag-products-updated'));
    }
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
        saveProducts(data.products, true);
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

export function clearAllStoredProducts(): Product[] {
  saveProducts([]);

  if (typeof window !== 'undefined') {
    fetch('/api/products?all=true', {
      method: 'DELETE'
    }).catch(err => console.error('[Products API Purge Error]:', err));
  }

  return [];
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

  fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newOrder)
  }).catch(() => {});

  return updated;
}

export function updateOrderStatus(
  orderId: string,
  status: OrderDetails['orderStatus'],
  courier?: string,
  trackingNumber?: string
): OrderDetails[] {
  const orders = getStoredOrders();
  const updated = orders.map(o => {
    if (o.id === orderId) {
      const updatedOrder: OrderDetails = {
        ...o,
        orderStatus: status,
        paymentStatus: status === 'Completed' ? ('Paid' as const) : o.paymentStatus,
        courier: courier !== undefined ? courier : o.courier,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : o.trackingNumber
      };

      fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          status,
          paymentStatus: updatedOrder.paymentStatus,
          courier: updatedOrder.courier,
          trackingNumber: updatedOrder.trackingNumber
        })
      }).catch(() => {});

      return updatedOrder;
    }
    return o;
  });
  saveOrders(updated);
  return updated;
}

export function updateOrderPaymentStatus(orderId: string, paymentStatus: OrderDetails['paymentStatus']): OrderDetails[] {
  const orders = getStoredOrders();
  const updated = orders.map(o => {
    if (o.id === orderId) {
      return {
        ...o,
        paymentStatus
      };
    }
    return o;
  });
  saveOrders(updated);
  return updated;
}

// Bank Account Store API
let activeBankPromise: Promise<BankAccountDetails> | null = null;

export function getStoredBankDetails(): BankAccountDetails {
  if (typeof window === 'undefined') return DEFAULT_BANK_DETAILS;
  try {
    const raw = localStorage.getItem(BANK_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_BANK_DETAILS;
    }
    const parsed = JSON.parse(raw);
    return {
      bankName: parsed.bankName ?? '',
      accountName: parsed.accountName ?? '',
      accountNumber: parsed.accountNumber ?? '',
      branch: parsed.branch ?? '',
      swiftCode: parsed.swiftCode ?? '',
      instructions: parsed.instructions ?? ''
    };
  } catch {
    return DEFAULT_BANK_DETAILS;
  }
}

export function saveBankDetails(details: BankAccountDetails): void {
  if (typeof window === 'undefined') return;
  const payload: BankAccountDetails = {
    bankName: details.bankName ?? '',
    accountName: details.accountName ?? '',
    accountNumber: details.accountNumber ?? '',
    branch: details.branch ?? '',
    swiftCode: details.swiftCode ?? '',
    instructions: details.instructions ?? ''
  };

  try {
    localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event('zerolag-bank-updated'));
  } catch (e) {
    console.error('Error saving bank details to localStorage:', e);
  }

  fetch('/api/site-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'bank_details', value: JSON.stringify(payload) })
  }).catch(() => {});
}

export async function syncBankDetailsFromDatabase(): Promise<BankAccountDetails> {
  const localDetails = getStoredBankDetails();
  if (typeof window === 'undefined') return localDetails;

  if (activeBankPromise) return activeBankPromise;

  activeBankPromise = (async () => {
    try {
      const res = await fetch('/api/site-settings?key=bank_details');
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.success && data.value) {
          const parsed = JSON.parse(data.value);
          const payload: BankAccountDetails = {
            bankName: parsed.bankName ?? '',
            accountName: parsed.accountName ?? '',
            accountNumber: parsed.accountNumber ?? '',
            branch: parsed.branch ?? '',
            swiftCode: parsed.swiftCode ?? '',
            instructions: parsed.instructions ?? ''
          };
          localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(payload));
          window.dispatchEvent(new Event('zerolag-bank-updated'));
          return payload;
        }
      }
    } catch {
      // Silently catch fetch or JSON parse errors
    } finally {
      activeBankPromise = null;
    }
    return localDetails;
  })();

  return activeBankPromise;
}

export const syncBankDetailsFromSupabase = syncBankDetailsFromDatabase;

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
let activeCategoryPromise: Promise<Category[]> | null = null;

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

export async function syncCategoriesFromDatabase(): Promise<Category[]> {
  const localCategories = getDynamicCategories();
  if (typeof window === 'undefined') return localCategories;

  if (activeCategoryPromise) return activeCategoryPromise;

  activeCategoryPromise = (async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
          saveCategories(data.categories);
          return data.categories;
        }
      }
    } catch (err) {
      console.warn('[Category API Sync Warning]:', err);
    } finally {
      activeCategoryPromise = null;
    }
    return localCategories;
  })();

  return activeCategoryPromise;
}

export function addCategory(category: Category): Category[] {
  const categories = getDynamicCategories();
  const updated = [...categories, category];
  saveCategories(updated);

  if (typeof window !== 'undefined') {
    fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    }).catch(err => console.error('[Category API Insert Error]:', err));
  }

  return updated;
}

export function updateCategory(category: Category): Category[] {
  const categories = getDynamicCategories();
  const updated = categories.map(c => (c.id === category.id ? category : c));
  saveCategories(updated);

  if (typeof window !== 'undefined') {
    fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    }).catch(err => console.error('[Category API Update Error]:', err));
  }

  return updated;
}

export function deleteCategory(categoryId: string): Category[] {
  const categories = getDynamicCategories();
  const updated = categories.filter(c => c.id !== categoryId);
  saveCategories(updated);

  if (typeof window !== 'undefined') {
    fetch(`/api/categories?id=${encodeURIComponent(categoryId)}`, {
      method: 'DELETE'
    }).catch(err => console.error('[Category API Delete Error]:', err));
  }

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

let activeLogoPromise: Promise<string> | null = null;
let inMemoryLogoCache: { value: string; timestamp: number } | null = null;

export function saveSiteLogo(logoUrl: string): void {
  if (typeof window === 'undefined') return;
  const cleaned = cleanLogoUrl(logoUrl);
  inMemoryLogoCache = { value: cleaned, timestamp: Date.now() };

  try {
    localStorage.setItem(LOGO_STORAGE_KEY, cleaned);
    localStorage.setItem('site_logo_url', cleaned);
    window.dispatchEvent(new Event('zerolag-logo-updated'));
    window.dispatchEvent(new Event('site_logo_updated'));
  } catch (e) {
    console.error('Error saving site logo to localStorage:', e);
  }

  fetch('/api/site-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'site_logo_url', value: cleaned })
  }).catch(() => {
    // Silently ignore offline network save failures
  });
}

export async function syncSiteLogoFromDatabase(): Promise<string> {
  const localLogo = getStoredSiteLogo();
  if (typeof window === 'undefined') return localLogo;

  const now = Date.now();
  if (inMemoryLogoCache && now - inMemoryLogoCache.timestamp < 300000) {
    return inMemoryLogoCache.value || localLogo;
  }

  if (activeLogoPromise) {
    return activeLogoPromise;
  }

  activeLogoPromise = (async () => {
    try {
      const res = await fetch('/api/site-settings?key=site_logo_url');
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.success && data.value) {
          const cleaned = cleanLogoUrl(data.value);
          inMemoryLogoCache = { value: cleaned, timestamp: Date.now() };

          const currentLocal = localStorage.getItem('site_logo_url') || '';
          if (currentLocal !== cleaned) {
            localStorage.setItem(LOGO_STORAGE_KEY, cleaned);
            localStorage.setItem('site_logo_url', cleaned);
            window.dispatchEvent(new Event('zerolag-logo-updated'));
            window.dispatchEvent(new Event('site_logo_updated'));
          }
          return cleaned;
        }
      }
    } catch {
      // Silently catch fetch errors (offline / dev server restart) without logging warning traces to console
    } finally {
      activeLogoPromise = null;
    }
    return localLogo;
  })();

  return activeLogoPromise;
}

export const syncSiteLogoFromSupabase = syncSiteLogoFromDatabase;

/**
 * RFC-4180 compliant multi-line CSV parser.
 * Correctly handles embedded newlines (\n, \r\n), commas, and double quotes ("") inside quoted fields.
 */
export function parseCSV(text: string): Record<string, string>[] {
  if (!text || typeof text !== 'string') return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n after \r
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];

  const rawHeaders = rows[0];
  const headers = rawHeaders.map(h =>
    h.replace(/^\uFEFF/, '').replace(/^["']+|["']+$|^=/g, '').trim()
  );

  const results: Record<string, string>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const rowValues = rows[i];
    if (!rowValues || rowValues.length === 0) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (header) {
        rowObj[header] = rowValues[idx] || '';
      }
    });
    results.push(rowObj);
  }

  return results;
}

/**
 * Robustly parse price numbers from sheet/JSON rows or strings.
 * Removes commas, currency symbols, and extra spaces before converting to float.
 */
export function parseCleanPrice(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = val.toString().replace(/,/g, '').replace(/[^\d.]/g, '');
  const parsed = parseFloat(str || '0');
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Flexibly extract and normalize direct image URLs from sheet rows.
 * Handles objects ({ url, src, link }), Google Drive links, formulas (=IMAGE("url")), and raw web URLs via bulletproof regex.
 */
export function normalizeImageUrl(rawUrl?: any): string {
  if (!rawUrl) return '';

  let str = '';
  if (typeof rawUrl === 'object') {
    str = rawUrl.url || rawUrl.src || rawUrl.link || rawUrl.href || rawUrl.image || '';
  } else {
    str = String(rawUrl);
  }

  str = str.trim();
  if (!str) return '';

  // 1. Direct Regex match for any web URL (handles =IMAGE("url"), =IMAGE("""url"""), or raw links)
  const urlMatch = str.match(/https?:\/\/[^\s"'<>\)]+/i);
  if (urlMatch && urlMatch[0]) {
    let extracted = urlMatch[0].trim();

    // Handle Google Drive links
    if (extracted.includes('drive.google.com')) {
      const idMatch = extracted.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || extracted.match(/\/d\/([a-zA-Z0-9_-]+)/) || extracted.match(/id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
      }
    }
    return extracted;
  }

  if (str.startsWith('/') || str.startsWith('data:image/')) {
    return str;
  }

  return '';
}

/**
 * Helper to extract main image and gallery images from sheet columns flexibly.
 * Gives top priority to Thumbnail, ThumbnailLink, Image1, etc.
 */
export function extractSheetProductImages(row: Record<string, any>): { image: string; galleryImages: string[]; images: string[] } {
  const fallback = 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=600';

  const findVal = (possibleKeys: string[]): any => {
    const keys = Object.keys(row);
    for (const pKey of possibleKeys) {
      const match = keys.find(k => {
        const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanPKey = pKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanK === cleanPKey;
      });
      if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== '') {
        return row[match];
      }
    }
    return null;
  };

  // Look specifically for Thumbnail, ThumbnailLink, Image1, image columns with top priority
  const rawThumbnail =
    row['thumbnail'] ||
    row['Thumbnail'] ||
    row['thumbnaillink'] ||
    row['ThumbnailLink'] ||
    row['image1'] ||
    row['Image1'] ||
    row['image'] ||
    row['Image'] ||
    findVal(['thumbnail', 'thumbnaillink', 'image1', 'image 1', 'image', 'photo', 'picture', 'img', 'download link', 'download_link', 'link', 'image_url', 'image url']);

  const extractedMainImage = normalizeImageUrl(rawThumbnail);

  const galleryKeys = [
    'image2', 'image 2', 'image3', 'image 3', 'image4', 'image 4',
    'images', 'gallery_images', 'galleryimages', 'gallery images', 'gallery'
  ];

  const extractedUrls: string[] = [];
  if (extractedMainImage) {
    extractedUrls.push(extractedMainImage);
  }

  for (const key of galleryKeys) {
    const val = findVal([key]);
    if (val) {
      if (Array.isArray(val)) {
        val.forEach(item => {
          const norm = normalizeImageUrl(item);
          if (norm) extractedUrls.push(norm);
        });
      } else if (typeof val === 'string') {
        const parts = val.split(/[\n,;|]+/).map(s => s.trim()).filter(Boolean);
        parts.forEach(p => {
          const norm = normalizeImageUrl(p);
          if (norm) extractedUrls.push(norm);
        });
      } else if (typeof val === 'object') {
        const norm = normalizeImageUrl(val);
        if (norm) extractedUrls.push(norm);
      }
    }
  }

  const uniqueUrls = Array.from(new Set(extractedUrls.filter(Boolean)));

  const mainImage = extractedMainImage || (uniqueUrls.length > 0 ? uniqueUrls[0] : fallback);
  const galleryImages = uniqueUrls.filter(url => url !== mainImage);
  const allImages = Array.from(new Set([mainImage, ...galleryImages]));

  return {
    image: mainImage,
    galleryImages,
    images: allImages
  };
}

/**
 * Parses a sheet/JSON row into a standardized Product object.
 * Returns null for empty or garbage rows where product name is missing or less than 2 chars.
 */
export function parseSheetProductRow(row: Record<string, any>, idx: number = 0) {
  const findStr = (possibleKeys: string[], defaultVal: string = ''): string => {
    const keys = Object.keys(row);
    for (const pKey of possibleKeys) {
      const match = keys.find(k => {
        const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanPKey = pKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanK === cleanPKey;
      });
      if (match && row[match] !== undefined && row[match] !== null) {
        const str = String(row[match]).trim();
        if (str) return str;
      }
    }
    return defaultVal;
  };

  const title = findStr(['name', 'product name', 'product_name', 'title', 'item name', 'item'], '');

  // Skip empty or garbage rows where product name is empty or less than 2 characters
  if (!title || title.trim().length < 2) {
    return null;
  }

  const category = findStr(['category', 'cat', 'product category', 'type'], 'all');
  const brand = findStr(['brand', 'manufacturer', 'make'], 'ZeroLag');

  const priceVal = findStr(['price', 'selling_price', 'price (lkr)', 'selling price', 'unit price', 'cost', 'lkr price']);
  const cleanPrice = parseCleanPrice(priceVal || row.price);

  const origPriceVal = findStr(['original_price', 'originalprice', 'original price', 'regular price', 'regular_price', 'mrp', 'old price', 'before discount price']);
  const cleanOrigPrice = parseCleanPrice(origPriceVal || row.original_price || row.originalPrice);
  const origPriceNum = (cleanOrigPrice > cleanPrice) ? cleanOrigPrice : 0;

  const stockVal = findStr(['stock', 'quantity', 'qty', 'stock count', 'stock_count']);
  const stockNum = stockVal ? parseInt(stockVal.replace(/[^\d]/g, ''), 10) || 0 : 10;

  const desc = findStr(['description', 'desc', 'details', 'product description']);
  const availRaw = findStr(['availability', 'in_stock', 'status', 'stock_status']).toLowerCase();
  const inStock = availRaw ? (availRaw.includes('show') || availRaw.includes('in stock') || availRaw.includes('available') || availRaw.includes('true') || stockNum > 0) : stockNum > 0;
  const warranty = findStr(['warranty', 'warranty_period', 'warranty term'], '1 Year Official Warranty');

  const { image, galleryImages, images } = extractSheetProductImages(row);

  const id = findStr(['id', 'product_id', 'item_id']) || `prod-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;

  return {
    id,
    name: title,
    brand,
    category,
    price: cleanPrice,
    priceLkr: cleanPrice,
    original_price: origPriceNum,
    originalPrice: origPriceNum,
    originalPriceLkr: origPriceNum > 0 ? origPriceNum : undefined,
    image,
    images,
    galleryImages,
    description: desc,
    features: [brand, category],
    specs: {} as Record<string, string>,
    in_stock: inStock,
    stock: stockNum,
    warranty,
    created_at: new Date().toISOString()
  };
}

export const DEFAULT_SHIPPING_RATES: ShippingOption[] = [
  {
    id: 'trans-express',
    name: 'Trans Express',
    description: 'Fast Islandwide Courier (1-2 Days)',
    rate: 475,
    enabled: true,
  },
  {
    id: 'citypak',
    name: 'CityPak',
    description: 'Standard Express Courier (2-3 Days)',
    rate: 400,
    enabled: true,
  },
  {
    id: 'post-office',
    name: 'Post Office / Speed Post',
    description: 'Register Post / Speed Post (3-5 Days)',
    rate: 390,
    enabled: true,
  },
];

export function getStoredShippingRates(): ShippingOption[] {
  if (typeof window === 'undefined') return DEFAULT_SHIPPING_RATES;
  try {
    const data = localStorage.getItem(SHIPPING_STORAGE_KEY);
    if (!data) return DEFAULT_SHIPPING_RATES;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SHIPPING_RATES;
  } catch (e) {
    console.error('Error loading shipping rates:', e);
    return DEFAULT_SHIPPING_RATES;
  }
}

export function saveShippingRates(rates: ShippingOption[], skipEvent = false): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(rates));
    if (!skipEvent) {
      window.dispatchEvent(new Event('zerolag-shipping-updated'));
    }
  } catch (e) {
    console.error('Error saving shipping rates:', e);
  }

  fetch('/api/site-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'shipping_rates', value: JSON.stringify(rates) }),
  }).catch(() => {});
}

export async function syncShippingRatesFromDatabase(): Promise<ShippingOption[]> {
  const cached = getStoredShippingRates();
  if (typeof window === 'undefined') return cached;

  try {
    const res = await fetch('/api/site-settings?key=shipping_rates');
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.success && data.value) {
        const parsed = JSON.parse(data.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          saveShippingRates(parsed, true);
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[Shipping Rates API Sync Warning]:', err);
  }
  return cached;
}
