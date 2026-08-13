import { Product, OrderDetails, BankAccountDetails, HeroSlide, Category } from '@/types';
import { INITIAL_PRODUCTS, CATEGORIES as DEFAULT_CATEGORIES } from './productsData';
import { supabase, isSupabaseConfigured } from './supabaseClient';

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

// Supabase Column Formatting Helpers
function formatSupabaseProduct(p: Product) {
  const gallery = p.galleryImages || [];
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.priceLkr,
    original_price: p.originalPriceLkr || p.priceLkr,
    image: p.image,
    images: [p.image, ...gallery],
    gallery_images: gallery,
    image2_url: gallery[0] || null,
    image3_url: gallery[1] || null,
    image4_url: gallery[2] || null,
    description: p.description,
    features: p.tags || [],
    specs: p.specs || {},
    in_stock: p.inStock,
    rating: p.rating || 5.0,
    warranty: p.warranty || '1 Year Official Warranty'
  };
}

function formatSupabaseOrder(o: OrderDetails) {
  return {
    id: o.id || `ZLAG-${Math.floor(100000 + Math.random() * 900000)}`,
    customer_name: o.customerName,
    customer_email: o.email,
    customer_phone: o.phone,
    shipping_address: `${o.address}, ${o.city}, ${o.postalCode}`,
    payment_method: o.paymentMethod,
    items: o.items,
    subtotal: o.subtotalLkr,
    shipping_fee: o.shippingLkr || 0,
    total_amount: o.totalLkr,
    status: o.orderStatus || 'Pending',
    created_at: o.createdAt || new Date().toISOString()
  };
}

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

export async function syncProductsFromSupabase(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return getStoredProducts();

  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.warn('[Supabase Sync Warning]:', error.message);
      return getStoredProducts();
    }

    if (data) {
      const formatted: Product[] = data.map((item: any) => {
        const imageUrl = item.image_url || item.image || 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=600';
        const galleryCols = [
          item.image2_url || item.image2,
          item.image3_url || item.image3,
          item.image4_url || item.image4
        ].filter(Boolean);

        let galleryArr: string[] = [];
        if (Array.isArray(item.gallery_images)) galleryArr = item.gallery_images;
        else if (Array.isArray(item.galleryImages)) galleryArr = item.galleryImages;
        else if (Array.isArray(item.images)) galleryArr = item.images;
        else if (typeof item.gallery_images === 'string') {
          try { galleryArr = JSON.parse(item.gallery_images); } catch {}
        } else if (typeof item.images === 'string') {
          try { galleryArr = JSON.parse(item.images); } catch {}
        }

        const galleryImages = Array.from(new Set([...galleryArr, ...galleryCols]))
          .filter((img): img is string => typeof img === 'string' && img.trim().length > 0 && img !== imageUrl);

        return {
          id: String(item.id),
          name: item.name || item.title || 'Untitled Hardware',
          brand: item.brand || 'ZeroLag',
          category: item.category || 'all',
          priceLkr: Number(item.price) || 0,
          priceUsd: Number(item.price_usd) || Math.round((Number(item.price) || 0) / 300),
          originalPriceLkr: Number(item.original_price || item.originalPrice) || Number(item.price) || undefined,
          rating: Number(item.rating) || 0,
          reviewsCount: Number(item.reviews_count) || 0,
          image: imageUrl,
          galleryImages,
          specs: item.specs || {},
          description: item.description || '',
          tags: item.features || item.tags || [item.brand || 'ZeroLag', item.category || 'all'],
          inStock: item.in_stock !== undefined ? Boolean(item.in_stock) : true,
          stockCount: Number(item.stock || item.stock_count) || 10,
          featured: item.featured ?? false,
          badge: item.badge || undefined,
          warranty: item.warranty_period || item.warranty || '1 Year Official Warranty'
        };
      });

      saveProducts(formatted);
      return formatted;
    }
  } catch (err) {
    console.warn('[Supabase Sync Error]:', err);
  }
  return getStoredProducts();
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

export function addStoredProduct(product: Product): Product[] {
  const products = getStoredProducts();
  const updated = [product, ...products];
  saveProducts(updated);

  if (isSupabaseConfigured()) {
    const supabasePayload = formatSupabaseProduct(product);
    supabase.from('products').upsert([supabasePayload]).then(({ error }) => {
      if (error) console.error('[Supabase Error] Failed to insert product:', error.message, error.details);
    });
  }

  return updated;
}

export function updateStoredProduct(updatedProduct: Product): Product[] {
  const products = getStoredProducts();
  const updated = products.map(p => (p.id === updatedProduct.id ? updatedProduct : p));
  saveProducts(updated);

  if (isSupabaseConfigured()) {
    const supabasePayload = formatSupabaseProduct(updatedProduct);
    supabase.from('products').update(supabasePayload).eq('id', updatedProduct.id).then(({ error }) => {
      if (error) console.error('[Supabase Error] Failed to update product:', error.message, error.details);
    });
  }

  return updated;
}

export function deleteStoredProduct(productId: string): Product[] {
  const products = getStoredProducts();
  const updated = products.filter(p => p.id !== productId);
  saveProducts(updated);

  if (isSupabaseConfigured()) {
    supabase.from('products').delete().eq('id', productId).then(({ error }) => {
      if (error) console.error('[Supabase Error] Failed to delete product:', error.message, error.details);
    });
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

  if (isSupabaseConfigured()) {
    const supabasePayload = formatSupabaseOrder(newOrder);
    supabase.from('orders').upsert([supabasePayload]).then(({ error }) => {
      if (error) console.error('[Supabase Error] Failed to insert order:', error.message, error.details);
    });
  }

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

  if (isSupabaseConfigured()) {
    supabase.from('orders').update({ status: status }).eq('id', orderId).then(({ error }) => {
      if (error) console.error('[Supabase Error] Failed to update order status:', error.message, error.details);
    });
  }

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

export async function syncHeroSlidesFromSupabase(): Promise<HeroSlide[]> {
  try {
    if (!isSupabaseConfigured()) {
      return getHeroSlides();
    }

    const { data, error } = await supabase.from('hero_slides').select('*');
    if (!error && data && data.length > 0) {
      const formatted: HeroSlide[] = data.map((item: any) => {
        const fullTitle = item.title || item.name || `${item.titleFirstLine || ''} ${item.titleHighlight || ''}`.trim() || 'ZERO LAG HARDWARE';
        const titleParts = fullTitle.split(' ');
        const firstLine = titleParts.slice(0, Math.max(1, titleParts.length - 1)).join(' ');
        const highlight = titleParts.length > 1 ? titleParts[titleParts.length - 1] : '';

        return {
          id: String(item.id),
          badgeText: item.badge || item.badgeText || 'FLAGSHIP',
          badge: item.badge || item.badgeText || 'FLAGSHIP',
          titleFirstLine: item.titleFirstLine || firstLine,
          titleHighlight: item.titleHighlight || highlight,
          title: fullTitle,
          description: item.description || item.subtitle || '',
          subtitle: item.subtitle || item.description || '',
          primaryButtonText: item.primary_button_text || item.primaryButtonText || 'EXPLORE CATALOG',
          primaryButtonLink: item.primary_button_link || item.primaryButtonLink || '#catalog',
          featuredProductId: item.featured_product_id || item.featuredProductId || '',
          customImageUrl: formatSlideImageUrl(item.custom_image_url || item.customImageUrl || item.image || item.image_url),
          isActive: item.is_active !== undefined ? Boolean(item.is_active) : (item.isActive ?? true)
        };
      });

      saveHeroSlides(formatted);
      return formatted;
    }
  } catch (err) {
    console.warn('[Hero Slides Supabase Sync Error]:', err);
  }

  return getHeroSlides();
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

export function addHeroSlide(slide: HeroSlide): HeroSlide[] {
  const slides = getHeroSlides();
  const formattedSlide: HeroSlide = {
    ...slide,
    customImageUrl: formatSlideImageUrl(slide.customImageUrl)
  };
  const updated = [formattedSlide, ...slides];
  saveHeroSlides(updated);

  if (isSupabaseConfigured()) {
    (async () => {
      try {
        const { error } = await supabase.from('hero_slides').upsert([{
          id: formattedSlide.id,
          title: formattedSlide.title || `${formattedSlide.titleFirstLine || ''} ${formattedSlide.titleHighlight || ''}`.trim(),
          subtitle: formattedSlide.description || formattedSlide.subtitle || '',
          badge: formattedSlide.badgeText || formattedSlide.badge || '',
          primary_button_text: formattedSlide.primaryButtonText,
          primary_button_link: formattedSlide.primaryButtonLink,
          featured_product_id: formattedSlide.featuredProductId,
          custom_image_url: formattedSlide.customImageUrl,
          is_active: formattedSlide.isActive ?? true
        }]);
        if (error) console.warn('[Supabase Warning] Failed to insert hero slide:', error.message);
      } catch (err: unknown) {
        console.warn('[Supabase Warning] Hero slide insert exception:', err);
      }
    })();
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

  if (isSupabaseConfigured()) {
    (async () => {
      try {
        const { error } = await supabase.from('hero_slides').upsert([{
          id: formattedSlide.id,
          title: formattedSlide.title || `${formattedSlide.titleFirstLine || ''} ${formattedSlide.titleHighlight || ''}`.trim(),
          subtitle: formattedSlide.description || formattedSlide.subtitle || '',
          badge: formattedSlide.badgeText || formattedSlide.badge || '',
          primary_button_text: formattedSlide.primaryButtonText,
          primary_button_link: formattedSlide.primaryButtonLink,
          featured_product_id: formattedSlide.featuredProductId,
          custom_image_url: formattedSlide.customImageUrl,
          is_active: formattedSlide.isActive ?? true
        }]);
        if (error) console.warn('[Supabase Warning] Failed to update hero slide:', error.message);
      } catch (err: unknown) {
        console.warn('[Supabase Warning] Hero slide update exception:', err);
      }
    })();
  }

  return updated;
}

export function deleteHeroSlide(slideId: string): HeroSlide[] {
  const slides = getHeroSlides();
  const updated = slides.filter(s => s.id !== slideId);
  saveHeroSlides(updated);

  if (isSupabaseConfigured()) {
    (async () => {
      try {
        const { error } = await supabase.from('hero_slides').delete().eq('id', slideId);
        if (error) console.warn('[Supabase Warning] Failed to delete hero slide:', error.message);
      } catch (err: unknown) {
        console.warn('[Supabase Warning] Hero slide delete exception:', err);
      }
    })();
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
  return trimmed;
}

export function getStoredSiteLogo(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(LOGO_STORAGE_KEY) || localStorage.getItem('site_logo_url') || '';
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

  if (isSupabaseConfigured()) {
    (async () => {
      try {
        const { error } = await supabase.from('site_settings').upsert([{ key: 'site_logo_url', value: cleaned }]);
        if (error) {
          console.warn('[Supabase Warning] Failed to update site_settings table:', error.message);
        }
      } catch (err: unknown) {
        console.warn('[Supabase Warning] Exception in site_settings upsert:', err);
      }
    })();
  }
}

export async function syncSiteLogoFromSupabase(): Promise<string> {
  try {
    if (!isSupabaseConfigured()) return getStoredSiteLogo();

    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'site_logo_url')
      .maybeSingle();

    if (!error && data?.value) {
      const cleaned = cleanLogoUrl(data.value);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOGO_STORAGE_KEY, cleaned);
        localStorage.setItem('site_logo_url', cleaned);
        window.dispatchEvent(new Event('zerolag-logo-updated'));
        window.dispatchEvent(new Event('site_logo_updated'));
      }
      return cleaned;
    }
  } catch (err) {
    console.warn('[Site Logo Supabase Sync Warning]:', err);
  }
  return getStoredSiteLogo();
}
