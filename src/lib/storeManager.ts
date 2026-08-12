import { Product, OrderDetails, BankAccountDetails, HeroSlide, Category } from '@/types';
import { INITIAL_PRODUCTS, CATEGORIES as DEFAULT_CATEGORIES } from './productsData';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const PRODUCTS_STORAGE_KEY = 'zerolag_products_v2';
const ORDERS_STORAGE_KEY = 'zerolag_orders_v2';
const BANK_STORAGE_KEY = 'zerolag_bank_details_v2';
const SLIDES_STORAGE_KEY = 'zerolag_hero_slides_v1';
const CATEGORIES_STORAGE_KEY = 'zerolag_categories_v1';

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
    featuredProductId: 'prod-1',
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
    featuredProductId: 'prod-4',
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
    featuredProductId: 'prod-7',
    isActive: true
  }
];

export const INITIAL_ORDERS: OrderDetails[] = [
  {
    id: 'ZLAG-982145',
    customerName: 'Sahan Wickramasinghe',
    email: 'sahan@gmail.com',
    phone: '0778912345',
    address: 'No 45, Duplication Road',
    city: 'Colombo 03',
    postalCode: '00300',
    paymentMethod: 'payhere',
    paymentStatus: 'Paid',
    orderStatus: 'Processing',
    items: [
      {
        product: INITIAL_PRODUCTS[0],
        quantity: 1
      }
    ],
    subtotalLkr: 58500,
    discountLkr: 0,
    shippingLkr: 0,
    totalLkr: 58500,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'ZLAG-847291',
    customerName: 'Nimna Fernando',
    email: 'nimna.f@yahoo.com',
    phone: '0714567890',
    address: '12/A, Kandy Road',
    city: 'Kadawatha',
    postalCode: '11830',
    paymentMethod: 'bank-transfer',
    paymentStatus: 'Pending',
    orderStatus: 'Pending',
    items: [
      {
        product: INITIAL_PRODUCTS[3],
        quantity: 1
      }
    ],
    subtotalLkr: 89000,
    discountLkr: 0,
    shippingLkr: 0,
    totalLkr: 89000,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

// Product Store API
export function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRODUCTS;
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

export function addStoredProduct(product: Product): Product[] {
  const products = getStoredProducts();
  const updated = [product, ...products];
  saveProducts(updated);

  if (isSupabaseConfigured()) {
    supabase.from('products').insert([product]).then(({ error }) => {
      if (error) console.warn('Supabase insert product warning:', error);
    });
  }

  return updated;
}

export function updateStoredProduct(updatedProduct: Product): Product[] {
  const products = getStoredProducts();
  const updated = products.map(p => (p.id === updatedProduct.id ? updatedProduct : p));
  saveProducts(updated);

  if (isSupabaseConfigured()) {
    supabase.from('products').update(updatedProduct).eq('id', updatedProduct.id).then(({ error }) => {
      if (error) console.warn('Supabase update product warning:', error);
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
      if (error) console.warn('Supabase delete product warning:', error);
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
    supabase.from('orders').insert([newOrder]).then(({ error }) => {
      if (error) console.warn('Supabase insert order warning:', error);
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
    supabase.from('orders').update({ orderStatus: status }).eq('id', orderId).then(({ error }) => {
      if (error) console.warn('Supabase update order status warning:', error);
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
export function getHeroSlides(): HeroSlide[] {
  if (typeof window === 'undefined') return INITIAL_HERO_SLIDES;
  try {
    const raw = localStorage.getItem(SLIDES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SLIDES_STORAGE_KEY, JSON.stringify(INITIAL_HERO_SLIDES));
      return INITIAL_HERO_SLIDES;
    }
    return JSON.parse(raw);
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

export function addHeroSlide(slide: HeroSlide): HeroSlide[] {
  const slides = getHeroSlides();
  const updated = [slide, ...slides];
  saveHeroSlides(updated);
  return updated;
}

export function updateHeroSlide(slide: HeroSlide): HeroSlide[] {
  const slides = getHeroSlides();
  const updated = slides.map(s => (s.id === slide.id ? slide : s));
  saveHeroSlides(updated);
  return updated;
}

export function deleteHeroSlide(slideId: string): HeroSlide[] {
  const slides = getHeroSlides();
  const updated = slides.filter(s => s.id !== slideId);
  saveHeroSlides(updated);
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
