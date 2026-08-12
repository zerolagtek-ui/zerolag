export type ProductCategory = string;

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  brand: string;
  priceLkr: number;
  priceUsd: number;
  originalPriceLkr?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  galleryImages?: string[];
  specs: Record<string, string>;
  description: string;
  tags: string[];
  inStock: boolean;
  stockCount: number;
  featured?: boolean;
  badge?: string;
  warranty?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  iconName?: string;
  count?: number;
  description: string;
}

export interface HeroSlide {
  id: string;
  badgeText: string;
  titleFirstLine: string;
  titleHighlight: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  featuredProductId: string;
  customImageUrl?: string;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendedProducts?: Product[];
  timestamp: string;
}

export type PaymentMethod = 'payhere' | 'payzy' | 'cod' | 'bank-transfer';
export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Completed';
export type PaymentStatus = 'Pending' | 'Paid';

export interface BankAccountDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  swiftCode?: string;
  instructions?: string;
}

export interface OrderDetails {
  id?: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  orderStatus?: OrderStatus;
  items: CartItem[];
  subtotalLkr: number;
  discountLkr: number;
  shippingLkr: number;
  totalLkr: number;
  createdAt?: string;
}
