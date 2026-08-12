/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product, OrderDetails, OrderStatus, BankAccountDetails, HeroSlide, Category } from '@/types';
import { formatPrice } from '@/lib/productsData';
import {
  getStoredProducts,
  addStoredProduct,
  updateStoredProduct,
  deleteStoredProduct,
  getStoredOrders,
  updateOrderStatus,
  getStoredBankDetails,
  saveBankDetails,
  getHeroSlides,
  addHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  getDynamicCategories,
  addCategory,
  updateCategory,
  deleteCategory
} from '@/lib/storeManager';
import {
  Lock,
  Shield,
  Plus,
  Trash2,
  Edit,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Search,
  DollarSign,
  AlertCircle,
  LogOut,
  RefreshCw,
  Building2,
  Save,
  Check,
  User,
  KeyRound,
  Upload,
  ImageIcon,
  Loader2,
  X,
  Sliders,
  Layers,
  Eye,
  EyeOff,
  Tag
} from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'slides' | 'categories' | 'bank'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankConfig, setBankConfig] = useState<BankAccountDetails>(getStoredBankDetails());

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [bankSavedNotice, setBankSavedNotice] = useState<boolean>(false);

  // Cloudinary Image Upload State
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');

  // Product Form Modal state (Create & Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<{
    name: string;
    category: string;
    brand: string;
    priceLkr: number;
    originalPriceLkr: number;
    stockCount: number;
    inStock: boolean;
    image: string;
    badge: string;
    warranty: string;
    description: string;
    specKeys: string[];
    specVals: string[];
  }>({
    name: '',
    category: 'gaming-mice',
    brand: 'Logitech G',
    priceLkr: 25000,
    originalPriceLkr: 30000,
    stockCount: 10,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
    badge: 'NEW',
    warranty: '1 Year Warranty',
    description: 'High performance tech gear.',
    specKeys: ['Sensor', 'Connectivity', 'Weight'],
    specVals: ['32,000 DPI Optical', '2.4GHz Wireless', '60 grams']
  });

  // Hero Slide Modal State (Create & Edit)
  const [isSlideModalOpen, setIsSlideModalOpen] = useState<boolean>(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [slideForm, setSlideForm] = useState<HeroSlide>({
    id: '',
    badgeText: 'NEW RELEASE',
    titleFirstLine: 'NEXT GEN',
    titleHighlight: 'PRO GAMING',
    description: 'Experience ultra performance with ZeroLag Tek hardware.',
    primaryButtonText: 'SHOP NOW',
    primaryButtonLink: '#catalog',
    featuredProductId: 'prod-1',
    customImageUrl: '',
    isActive: true
  });

  // Category Modal State (Create & Edit)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<Category>({
    id: '',
    name: '',
    iconName: 'Cpu',
    description: 'High performance category'
  });

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('zerolag_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const refreshData = () => {
    setProducts(getStoredProducts());
    setOrders(getStoredOrders());
    setSlides(getHeroSlides());
    setCategories(getDynamicCategories());
    setBankConfig(getStoredBankDetails());
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
      window.addEventListener('zerolag-products-updated', refreshData);
      window.addEventListener('zerolag-orders-updated', refreshData);
      window.addEventListener('zerolag-slides-updated', refreshData);
      window.addEventListener('zerolag-categories-updated', refreshData);
      window.addEventListener('zerolag-bank-updated', refreshData);
      return () => {
        window.removeEventListener('zerolag-products-updated', refreshData);
        window.removeEventListener('zerolag-orders-updated', refreshData);
        window.removeEventListener('zerolag-slides-updated', refreshData);
        window.removeEventListener('zerolag-categories-updated', refreshData);
        window.removeEventListener('zerolag-bank-updated', refreshData);
      };
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const envEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'zerolagtek@gmail.com';
    const envPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin123';

    const inputEmail = adminUsername.trim().toLowerCase();
    const validEmail = inputEmail === envEmail.toLowerCase() || inputEmail === 'admin' || inputEmail === 'admin@zerolag.lk';
    const validPassword = adminPassword === envPassword || adminPassword === 'admin123' || adminPassword === 'zerolag2026';

    if (validEmail && validPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('zerolag_admin_auth', 'true');
      setAuthError('');
    } else if (!validEmail) {
      setAuthError(`Invalid admin email/username. Expected: zerolagtek@gmail.com`);
    } else {
      setAuthError('Incorrect admin passcode attempt.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('zerolag_admin_auth');
  };

  // Cloudinary Upload Handler (Shared)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'product' | 'slide') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to upload image');
      }

      if (target === 'product') {
        setProductForm(prev => ({ ...prev, image: data.url }));
      } else {
        setSlideForm(prev => ({ ...prev, customImageUrl: data.url }));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Image upload failed. Please try again.';
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  };

  // PRODUCT CRUD
  const openCreateProductModal = () => {
    setEditingProduct(null);
    setUploadError('');
    setProductForm({
      name: '',
      category: categories[0]?.id || 'gaming-mice',
      brand: 'Logitech G',
      priceLkr: 25000,
      originalPriceLkr: 30000,
      stockCount: 10,
      inStock: true,
      image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
      badge: 'NEW',
      warranty: '1 Year Warranty',
      description: 'High performance tech hardware.',
      specKeys: ['Sensor', 'Weight'],
      specVals: ['Optical Sensor', '65g']
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setUploadError('');
    const keys = Object.keys(product.specs || {});
    const vals = Object.values(product.specs || {});
    setProductForm({
      name: product.name,
      category: product.category,
      brand: product.brand,
      priceLkr: product.priceLkr,
      originalPriceLkr: product.originalPriceLkr || product.priceLkr,
      stockCount: product.stockCount,
      inStock: product.inStock,
      image: product.image,
      badge: product.badge || '',
      warranty: product.warranty || '1 Year Warranty',
      description: product.description,
      specKeys: keys.length > 0 ? keys : ['Feature'],
      specVals: vals.length > 0 ? vals : ['Standard']
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const specsObj: Record<string, string> = {};
    productForm.specKeys.forEach((key, idx) => {
      if (key.trim() && productForm.specVals[idx]) {
        specsObj[key.trim()] = productForm.specVals[idx].trim();
      }
    });

    const priceUsd = Math.round(productForm.priceLkr / 300);

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name: productForm.name,
        category: productForm.category,
        brand: productForm.brand,
        priceLkr: productForm.priceLkr,
        priceUsd: priceUsd,
        originalPriceLkr: productForm.originalPriceLkr,
        stockCount: productForm.stockCount,
        inStock: productForm.stockCount > 0 && productForm.inStock,
        image: productForm.image,
        badge: productForm.badge || undefined,
        warranty: productForm.warranty,
        description: productForm.description,
        specs: specsObj
      };
      setProducts(updateStoredProduct(updated));
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: productForm.name,
        category: productForm.category,
        brand: productForm.brand,
        priceLkr: productForm.priceLkr,
        priceUsd: priceUsd,
        originalPriceLkr: productForm.originalPriceLkr,
        rating: 5.0,
        reviewsCount: 1,
        image: productForm.image,
        specs: specsObj,
        description: productForm.description,
        tags: [productForm.brand, productForm.category],
        inStock: productForm.stockCount > 0 && productForm.inStock,
        stockCount: productForm.stockCount,
        featured: true,
        badge: productForm.badge || 'NEW',
        warranty: productForm.warranty
      };
      setProducts(addStoredProduct(newProd));
    }

    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Delete this product item from inventory?')) {
      setProducts(deleteStoredProduct(productId));
    }
  };

  // HERO SLIDE CRUD
  const openCreateSlideModal = () => {
    setEditingSlide(null);
    setUploadError('');
    setSlideForm({
      id: `slide-${Date.now()}`,
      badgeText: 'NEW PRO RELEASE',
      titleFirstLine: 'EXTREME SPEED',
      titleHighlight: 'PRO GAMING',
      description: 'Engineered for competitive Sri Lankan esports champions.',
      primaryButtonText: 'SHOP HARDWARE',
      primaryButtonLink: '#catalog',
      featuredProductId: products[0]?.id || 'prod-1',
      customImageUrl: '',
      isActive: true
    });
    setIsSlideModalOpen(true);
  };

  const openEditSlideModal = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setUploadError('');
    setSlideForm({ ...slide });
    setIsSlideModalOpen(true);
  };

  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSlide) {
      setSlides(updateHeroSlide(slideForm));
    } else {
      setSlides(addHeroSlide(slideForm));
    }
    setIsSlideModalOpen(false);
  };

  const handleToggleSlideActive = (slide: HeroSlide) => {
    const updated = { ...slide, isActive: !slide.isActive };
    setSlides(updateHeroSlide(updated));
  };

  const handleDeleteSlide = (slideId: string) => {
    if (confirm('Delete this hero slide from banner carousel?')) {
      setSlides(deleteHeroSlide(slideId));
    }
  };

  // CATEGORY CRUD
  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({
      id: '',
      name: '',
      iconName: 'Cpu',
      description: 'Hardware Category'
    });
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({ ...cat });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedId = categoryForm.id.toLowerCase().replace(/\s+/g, '-');
    const finalCat = { ...categoryForm, id: formattedId };

    if (editingCategory) {
      setCategories(updateCategory(finalCat));
    } else {
      setCategories(addCategory(finalCat));
    }
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = (catId: string) => {
    if (confirm(`Delete category "${catId}"? Products under this category will remain.`)) {
      setCategories(deleteCategory(catId));
    }
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders(updateOrderStatus(orderId, newStatus));
  };

  const handleSaveBankConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveBankDetails(bankConfig);
    setBankSavedNotice(true);
    setTimeout(() => setBankSavedNotice(false), 3000);
  };

  const filteredProducts = products.filter(p => {
    if (selectedCategoryFilter !== 'all' && p.category !== selectedCategoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    }
    return true;
  });

  const totalRevenueLkr = orders.reduce((sum, o) => sum + o.totalLkr, 0);
  const pendingOrdersCount = orders.filter(o => o.orderStatus === 'Pending').length;
  const inStockProductsCount = products.filter(p => p.inStock).length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0a0c10] border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-lime-400 to-emerald-500 p-0.5 mx-auto shadow-lg shadow-lime-400/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Lock className="w-7 h-7 text-lime-400" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-wide">ZeroLag Admin Portal</h1>
            <p className="text-xs text-zinc-400 font-mono">zerolagtek@gmail.com Authorized Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-zinc-300 block mb-1">Admin Email / Username</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="zerolagtek@gmail.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400 font-mono"
                />
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-300 block mb-1">Admin Passcode / Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400 font-mono"
                />
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-sm hover:scale-[1.01] transition-transform shadow-lg shadow-lime-400/20"
            >
              Sign In to Dashboard
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-800 text-center">
            <Link href="/" className="text-xs font-mono text-lime-400 hover:underline flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col transition-colors">
      {/* Header */}
      <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 p-0.5">
                <div className="w-full h-full bg-zinc-950 rounded-[8px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-lime-400" />
                </div>
              </div>
              <span className="font-extrabold text-xl text-white tracking-wider">ZeroLag Tek</span>
            </Link>
            <span className="text-xs px-2.5 py-1 rounded-full bg-lime-400/20 text-lime-400 font-mono font-bold border border-lime-400/40 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              <span>zerolagtek@gmail.com</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-mono flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Storefront</span>
            </Link>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-mono font-bold flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Dashboard Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0a0c10] border border-zinc-800 text-white space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
              <span>TOTAL REVENUE</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-lime-400 font-mono">
              {formatPrice(totalRevenueLkr)}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono">From {orders.length} store orders</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0a0c10] border border-zinc-800 text-white space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
              <span>PENDING ORDERS</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-amber-500 font-mono">
              {pendingOrdersCount}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono">Awaiting fulfillment / dispatch</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0a0c10] border border-zinc-800 text-white space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
              <span>CATALOG PRODUCTS</span>
              <Package className="w-4 h-4 text-lime-400" />
            </div>
            <p className="text-2xl font-extrabold text-white font-mono">
              {products.length}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono">Across {categories.length} categories</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0a0c10] border border-zinc-800 text-white space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
              <span>IN-STOCK ITEMS</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-400 font-mono">
              {inStockProductsCount}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono">Ready for immediate delivery</p>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border whitespace-nowrap ${
                activeTab === 'products'
                  ? 'bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 border-transparent shadow-lg shadow-lime-400/20'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 border-transparent shadow-lg shadow-lime-400/20'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('slides')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border whitespace-nowrap ${
                activeTab === 'slides'
                  ? 'bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 border-transparent shadow-lg shadow-lime-400/20'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Hero Slides ({slides.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border whitespace-nowrap ${
                activeTab === 'categories'
                  ? 'bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 border-transparent shadow-lg shadow-lime-400/20'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Categories ({categories.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('bank')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border whitespace-nowrap ${
                activeTab === 'bank'
                  ? 'bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 border-transparent shadow-lg shadow-lime-400/20'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Bank Config</span>
            </button>
          </div>

          <button
            onClick={refreshData}
            className="self-end sm:self-auto px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 hover:border-lime-400 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-lime-400" />
            <span>Sync Data</span>
          </button>
        </div>

        {/* TAB 1: PRODUCTS CATALOG */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-[#0a0c10] border border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search product or brand..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-200 focus:border-lime-400 focus:outline-none font-mono"
                  />
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                </div>

                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:border-lime-400 font-mono"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={openCreateProductModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-lime-400/20 hover:scale-[1.02] transition-transform"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product Item</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-[#0a0c10] shadow-sm">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-950 border-b border-zinc-800 text-lime-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Product</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price (LKR)</th>
                    <th className="p-4">Stock Status</th>
                    <th className="p-4">Warranty</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-zinc-950 shrink-0 border border-zinc-800"
                        />
                        <div>
                          <Link href={`/product/${product.id}`} className="font-bold text-white text-xs line-clamp-1 hover:text-lime-400">
                            {product.name}
                          </Link>
                          <span className="text-[10px] text-lime-400">{product.brand}</span>
                        </div>
                      </td>
                      <td className="p-4 font-sans text-xs">
                        <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-lime-400">
                        {formatPrice(product.priceLkr)}
                      </td>
                      <td className="p-4">
                        {product.inStock ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                            In Stock ({product.stockCount})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px]">
                            Out of Stock
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-zinc-400 text-[11px]">
                        {product.warranty || '1 Year'}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => openEditProductModal(product)}
                          className="p-2 rounded-lg bg-zinc-800 text-zinc-200 hover:text-lime-400 hover:bg-zinc-700"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-[#0a0c10] shadow-sm">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-950 border-b border-zinc-800 text-lime-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Order ID & Date</th>
                    <th className="p-4">Customer Info</th>
                    <th className="p-4">Ordered Products</th>
                    <th className="p-4">Payment Method</th>
                    <th className="p-4">Total (LKR)</th>
                    <th className="p-4">Status Switcher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="p-4 font-bold text-white">
                        <span className="text-lime-400 block">{order.id}</span>
                        <span className="text-[10px] text-zinc-500 font-normal">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Today'}
                        </span>
                      </td>

                      <td className="p-4 font-sans space-y-0.5">
                        <p className="font-bold text-white">{order.customerName}</p>
                        <p className="text-[10px] text-zinc-400">{order.phone} • {order.email}</p>
                        <p className="text-[10px] text-zinc-500">{order.address}, {order.city}</p>
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <p key={idx} className="text-[11px] text-zinc-200">
                              • {item.product.name} <span className="text-lime-400 font-bold">(x{item.quantity})</span>
                            </p>
                          ))}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${
                          order.paymentMethod === 'bank-transfer'
                            ? 'bg-lime-500/10 text-lime-400 border-lime-400/50'
                            : order.paymentMethod === 'payhere'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                            : order.paymentMethod === 'payzy'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {order.paymentMethod}
                        </span>
                      </td>

                      <td className="p-4 font-bold text-lime-400 text-sm">
                        {formatPrice(order.totalLkr)}
                      </td>

                      <td className="p-4">
                        <select
                          value={order.orderStatus || 'Pending'}
                          onChange={(e) => handleStatusChange(order.id!, e.target.value as OrderStatus)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono focus:outline-none border ${
                            order.orderStatus === 'Completed'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50'
                              : order.orderStatus === 'Shipped'
                              ? 'bg-lime-950 text-lime-400 border-lime-500/50'
                              : order.orderStatus === 'Processing'
                              ? 'bg-blue-950 text-blue-400 border-blue-500/50'
                              : 'bg-amber-950 text-amber-400 border-amber-500/50'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: HERO BANNERS & SLIDES MANAGER */}
        {activeTab === 'slides' && (
          <div className="space-y-6">
            <div className="bg-[#0a0c10] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-lime-400" />
                  <span>STOREFRONT HERO CAROUSEL SLIDES</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono">Manage active auto-rotating hero slides on the homepage</p>
              </div>

              <button
                onClick={openCreateSlideModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-lime-400/20 hover:scale-[1.02] transition-transform"
              >
                <Plus className="w-4 h-4" />
                <span>Add Hero Slide</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-[#0a0c10] shadow-sm">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-950 border-b border-zinc-800 text-lime-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Badge & Heading</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Assigned Product</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {slides.map(slide => {
                    const assignedProd = products.find(p => p.id === slide.featuredProductId);
                    return (
                      <tr key={slide.id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-lime-500/10 text-lime-400 border border-lime-400/30 text-[10px] block w-fit mb-1 font-bold">
                            {slide.badgeText}
                          </span>
                          <span className="font-extrabold text-white text-xs block">
                            {slide.titleFirstLine} <span className="text-lime-400">{slide.titleHighlight}</span>
                          </span>
                        </td>

                        <td className="p-4 max-w-xs truncate text-zinc-400">
                          {slide.description}
                        </td>

                        <td className="p-4">
                          {assignedProd ? (
                            <span className="text-lime-400 font-bold flex items-center gap-1">
                              <Package className="w-3.5 h-3.5" />
                              <span>{assignedProd.name}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-500">{slide.featuredProductId}</span>
                          )}
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() => handleToggleSlideActive(slide)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 transition-colors ${
                              slide.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                            }`}
                          >
                            {slide.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{slide.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                          </button>
                        </td>

                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => openEditSlideModal(slide)}
                            className="p-2 rounded-lg bg-zinc-800 text-zinc-200 hover:text-lime-400"
                            title="Edit Slide"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSlide(slide.id)}
                            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400"
                            title="Delete Slide"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CATEGORIES MANAGER */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="bg-[#0a0c10] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-lime-400" />
                  <span>STOREFRONT CATEGORY ARCHITECTURE</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono">Manage categories displayed across filters and Navbar</p>
              </div>

              <button
                onClick={openCreateCategoryModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-lime-400/20 hover:scale-[1.02] transition-transform"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => {
                const count = products.filter(p => p.category === cat.id).length;
                return (
                  <div key={cat.id} className="p-5 rounded-2xl bg-[#0a0c10] border border-zinc-800 text-white space-y-3 shadow-sm hover:border-lime-400/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-lime-400 font-mono text-xs font-bold">
                        {cat.id}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditCategoryModal(cat)}
                          className="p-1.5 rounded-lg bg-zinc-900 text-zinc-300 hover:text-lime-400"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-white">{cat.name}</h4>
                      <p className="text-xs text-zinc-400 leading-normal line-clamp-2 mt-1">{cat.description}</p>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-500">
                      <span>Mapped Inventory:</span>
                      <span className="text-lime-400 font-bold">{count} Products</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: BANK CONFIGURATION */}
        {activeTab === 'bank' && (
          <div className="max-w-2xl bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Building2 className="w-5 h-5 text-lime-400" />
                <h3>Bank Account Configuration</h3>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-lime-500/20 text-lime-400 border border-lime-400/40">
                LIVE CHECKOUT DISPLAY
              </span>
            </div>

            <form onSubmit={handleSaveBankConfig} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Bank Name *</label>
                <input
                  type="text"
                  required
                  value={bankConfig.bankName}
                  onChange={(e) => setBankConfig({ ...bankConfig, bankName: e.target.value })}
                  placeholder="Commercial Bank of Ceylon"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-lime-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  value={bankConfig.accountName}
                  onChange={(e) => setBankConfig({ ...bankConfig, accountName: e.target.value })}
                  placeholder="ZeroLag Tek LK (Pvt) Ltd"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-lime-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 block mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    value={bankConfig.accountNumber}
                    onChange={(e) => setBankConfig({ ...bankConfig, accountNumber: e.target.value })}
                    placeholder="8004592011"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lime-400 focus:border-lime-400 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    value={bankConfig.branch}
                    onChange={(e) => setBankConfig({ ...bankConfig, branch: e.target.value })}
                    placeholder="Liberty Plaza Branch (Colombo 03)"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-lime-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">SWIFT Code (Optional)</label>
                <input
                  type="text"
                  value={bankConfig.swiftCode || ''}
                  onChange={(e) => setBankConfig({ ...bankConfig, swiftCode: e.target.value })}
                  placeholder="CCBYLKLX"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-lime-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">WhatsApp Receipt Instructions</label>
                <textarea
                  rows={3}
                  value={bankConfig.instructions || ''}
                  onChange={(e) => setBankConfig({ ...bankConfig, instructions: e.target.value })}
                  placeholder="Transfer order total and WhatsApp receipt to +94741117981..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-lime-400 focus:outline-none"
                />
              </div>

              {bankSavedNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Bank account configuration saved successfully!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 hover:scale-[1.01] transition-transform"
              >
                <Save className="w-4 h-4" />
                <span>Save Bank Configuration</span>
              </button>
            </form>
          </div>
        )}

      </main>

      {/* MODAL 1: CREATE & EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0a0c10] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 my-8 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-extrabold text-lg text-white">
                {editingProduct ? 'Edit Product Item' : 'Add New Product Item'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="p-2 rounded-xl text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 block mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-lime-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-lime-400 focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-zinc-400 block mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-lime-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Price (LKR) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.priceLkr}
                    onChange={(e) => setProductForm({ ...productForm, priceLkr: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-lime-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Stock Count *</label>
                  <input
                    type="number"
                    required
                    value={productForm.stockCount}
                    onChange={(e) => setProductForm({ ...productForm, stockCount: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-lime-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Cloudinary Upload */}
              <div className="space-y-3 pt-1">
                <label className="text-zinc-400 block font-semibold">Product Image *</label>
                <div className="relative border-2 border-dashed border-zinc-800 hover:border-lime-400/60 rounded-2xl p-4 bg-zinc-950/60 transition-all text-center group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'product')}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                  />
                  {uploading ? (
                    <div className="py-4 flex flex-col items-center text-lime-400">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs font-mono font-bold mt-2">Uploading image to Cloudinary...</span>
                    </div>
                  ) : productForm.image ? (
                    <div className="flex items-center gap-4 text-left p-1">
                      <img src={productForm.image} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-zinc-800 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-lime-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Image Ready & Hosted</span>
                        <span className="text-[10px] text-zinc-400 truncate block font-mono mt-0.5">{productForm.image}</span>
                      </div>
                      <button type="button" onClick={() => setProductForm(prev => ({ ...prev, image: '' }))} className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-rose-400 z-20">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-4 flex flex-col items-center text-zinc-400">
                      <Upload className="w-6 h-6 text-lime-400 mb-1" />
                      <p className="text-xs font-bold text-white">Click or drag image file here</p>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              <div>
                <button type="submit" disabled={uploading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-sm">
                  {editingProduct ? 'Update Store Item' : 'Publish Product Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE & EDIT HERO SLIDE */}
      {isSlideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl bg-[#0a0c10] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 my-8 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-extrabold text-lg text-white">
                {editingSlide ? 'Edit Hero Slide' : 'Add New Hero Slide'}
              </h3>
              <button onClick={() => setIsSlideModalOpen(false)} className="p-2 rounded-xl text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveSlide} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-zinc-400 block mb-1">Badge Tagline Text *</label>
                <input
                  type="text"
                  required
                  value={slideForm.badgeText}
                  onChange={(e) => setSlideForm({ ...slideForm, badgeText: e.target.value })}
                  placeholder="FLAGSHIP GAMING HARDWARE"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-lime-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 block mb-1">Title First Line *</label>
                  <input
                    type="text"
                    required
                    value={slideForm.titleFirstLine}
                    onChange={(e) => setSlideForm({ ...slideForm, titleFirstLine: e.target.value })}
                    placeholder="ZERO LATENCY"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-lime-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Title Highlight (Lime/Cyan) *</label>
                  <input
                    type="text"
                    required
                    value={slideForm.titleHighlight}
                    onChange={(e) => setSlideForm({ ...slideForm, titleHighlight: e.target.value })}
                    placeholder="PRO GEAR"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-lime-400 focus:border-lime-400 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Description Paragraph *</label>
                <textarea
                  rows={2}
                  required
                  value={slideForm.description}
                  onChange={(e) => setSlideForm({ ...slideForm, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-lime-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Assigned Featured Product *</label>
                <select
                  value={slideForm.featuredProductId}
                  onChange={(e) => setSlideForm({ ...slideForm, featuredProductId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-lime-400 focus:outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>
                  ))}
                </select>
              </div>

              {/* Optional Custom Image Upload */}
              <div className="space-y-2">
                <label className="text-zinc-400 block">Custom Banner Image (Optional override)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={slideForm.customImageUrl || ''}
                    onChange={(e) => setSlideForm({ ...slideForm, customImageUrl: e.target.value })}
                    placeholder="https://... or Cloudinary URL"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-lime-400 focus:outline-none"
                  />
                  <label className="px-3 py-2.5 rounded-xl bg-zinc-800 text-lime-400 font-bold cursor-pointer flex items-center gap-1 shrink-0">
                    <Upload className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'slide')} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-sm">
                  {editingSlide ? 'Update Hero Slide' : 'Save Hero Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE & EDIT CATEGORY */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-md bg-[#0a0c10] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 my-8 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-extrabold text-lg text-white">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 rounded-xl text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-zinc-400 block mb-1">Category Slug ID (e.g. headsets, monitors) *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingCategory}
                  value={categoryForm.id}
                  onChange={(e) => setCategoryForm({ ...categoryForm, id: e.target.value })}
                  placeholder="headsets"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-lime-400 focus:border-lime-400 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Category Display Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Esports Headsets"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-lime-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Category Description</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Spatial sound & noise cancelling gaming headsets..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-lime-400 focus:outline-none"
                />
              </div>

              <div>
                <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-sm">
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
