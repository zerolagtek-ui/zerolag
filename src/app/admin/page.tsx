/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product, OrderDetails, OrderStatus, BankAccountDetails, HeroSlide, Category, ShippingOption } from '@/types';
import { formatPrice, getProductSlug } from '@/lib/productsData';
import {
  getStoredProducts,
  syncProductsFromDatabase,
  saveProducts,
  addStoredProduct,
  updateStoredProduct,
  deleteStoredProduct,
  getStoredOrders,
  saveOrders,
  updateOrderStatus,
  getStoredBankDetails,
  saveBankDetails,
  syncBankDetailsFromDatabase,
  getHeroSlides,
  syncHeroSlidesFromSupabase,
  addHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  getDynamicCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getStoredSiteLogo,
  saveSiteLogo,
  syncSiteLogoFromSupabase,
  cleanLogoUrl,
  parseCleanPrice,
  normalizeImageUrl,
  extractSheetProductImages,
  parseSheetProductRow,
  clearAllStoredProducts,
  parseCSV,
  getStoredShippingRates,
  saveShippingRates,
  syncShippingRatesFromDatabase
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
  Tag,
  Star,
  FileSpreadsheet,
  Truck,
  Menu,
  ChevronRight
} from 'lucide-react';



interface AdminReview {
  id: string;
  product_id: string;
  user_name: string;
  user_email: string;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
}

// Helper function to find a key in header map case-insensitively
function findHeaderValue(row: Record<string, string>, possibleKeys: string[]): string {
  const keys = Object.keys(row);
  for (const pKey of possibleKeys) {
    const match = keys.find(k => {
      const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanPKey = pKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanK === cleanPKey;
    });
    if (match && row[match]) {
      return row[match].trim();
    }
  }
  return '';
}

function cleanImageUrl(rawUrl: string): string {
  const fallback = 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=600';
  return normalizeImageUrl(rawUrl) || fallback;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'slides' | 'categories' | 'reviews' | 'bank' | 'shipping' | 'branding'>('products');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [bankConfig, setBankConfig] = useState<BankAccountDetails>(getStoredBankDetails());
  const [siteLogoInput, setSiteLogoInput] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [bankSavedNotice, setBankSavedNotice] = useState<boolean>(false);
  const [logoNotice, setLogoNotice] = useState<boolean>(false);

  // CSV Import State & Ref
  const [isImportingCSV, setIsImportingCSV] = useState<boolean>(false);
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);

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
    image2: string;
    image3: string;
    image4: string;
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
    image2: '',
    image3: '',
    image4: '',
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
    featuredProductId: '',
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
    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/verify');
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setIsAuthenticated(true);
          sessionStorage.setItem('zerolag_admin_auth', 'true');
        } else {
          setIsAuthenticated(false);
          sessionStorage.removeItem('zerolag_admin_auth');
          router.push('/login');
        }
      } catch {
        setIsAuthenticated(false);
        sessionStorage.removeItem('zerolag_admin_auth');
        router.push('/login');
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkSession();
  }, [router]);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
      }
    } catch (e) {
      console.warn('Error fetching reviews for admin:', e);
    }
  };

  const handleUpdateReviewStatus = async (reviewId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reviewId, status: newStatus })
      });
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error('Failed to update review status:', err);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this customer review?')) return;
    try {
      await fetch(`/api/reviews?id=${encodeURIComponent(reviewId)}`, {
        method: 'DELETE'
      });
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const fetchProducts = async () => {
    const dbProducts = await syncProductsFromDatabase();
    setProducts(dbProducts);
  };

  const fetchSlides = async () => {
    const fetched = await syncHeroSlidesFromSupabase();
    setSlides(fetched);
  };

  const fetchLogo = async () => {
    const logo = await syncSiteLogoFromSupabase();
    const tempLogo = typeof window !== 'undefined' ? localStorage.getItem('temp_uploaded_logo') : '';
    setSiteLogoInput(logo || tempLogo || '');
  };

  const fetchBank = async () => {
    const bank = await syncBankDetailsFromDatabase();
    setBankConfig(bank);
  };

  const [shippingRates, setShippingRates] = useState<ShippingOption[]>(getStoredShippingRates());

  const handleSaveShippingRates = () => {
    saveShippingRates(shippingRates);
    alert('Shipping configuration saved successfully!');
  };

  const fetchShippingRates = async () => {
    const rates = await syncShippingRatesFromDatabase();
    setShippingRates(rates);
  };

  const refreshData = async () => {
    fetchProducts();
    await fetchSlides();
    await fetchLogo();
    await fetchBank();
    await fetchShippingRates();
    setOrders(getStoredOrders());
    setCategories(getDynamicCategories());
    fetchReviews();
  };

  const handleLocalStateSync = () => {
    setProducts(getStoredProducts());
    setOrders(getStoredOrders());
    setCategories(getDynamicCategories());
    setBankConfig(getStoredBankDetails());
    setShippingRates(getStoredShippingRates());
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
      window.addEventListener('zerolag-products-updated', handleLocalStateSync);
      window.addEventListener('zerolag-orders-updated', handleLocalStateSync);
      window.addEventListener('zerolag-categories-updated', handleLocalStateSync);
      window.addEventListener('zerolag-bank-updated', handleLocalStateSync);
      return () => {
        window.removeEventListener('zerolag-products-updated', handleLocalStateSync);
        window.removeEventListener('zerolag-orders-updated', handleLocalStateSync);
        window.removeEventListener('zerolag-categories-updated', handleLocalStateSync);
        window.removeEventListener('zerolag-bank-updated', handleLocalStateSync);
      };
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminUsername,
          password: adminPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('zerolag_admin_auth', 'true');
        setAuthError('');
      } else {
        setAuthError(data.error || 'Authentication failed. Please check your credentials.');
      }
    } catch {
      setAuthError('Unable to connect to authentication server.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      sessionStorage.removeItem('zerolag_admin_auth');
    }
  };

  // Cloudinary Upload Handler (Shared)
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'product' | 'product_image2' | 'product_image3' | 'product_image4' | 'slide' | 'logo'
  ) => {
    if (e) e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.url && data.url.startsWith('http')) {
        const cleanedUrl = cleanLogoUrl(data.url);
        if (target === 'product') {
          setProductForm((prev) => ({ ...prev, image: data.url }));
        } else if (target === 'product_image2') {
          setProductForm((prev) => ({ ...prev, image2: data.url }));
        } else if (target === 'product_image3') {
          setProductForm((prev) => ({ ...prev, image3: data.url }));
        } else if (target === 'product_image4') {
          setProductForm((prev) => ({ ...prev, image4: data.url }));
        } else if (target === 'slide') {
          setSlideForm((prev) => ({ ...prev, customImageUrl: data.url }));
        } else if (target === 'logo') {
          setSiteLogoInput(cleanedUrl);
          if (typeof window !== 'undefined') {
            localStorage.setItem('temp_uploaded_logo', cleanedUrl);
          }
        }
      } else {
        throw new Error(data.error || 'Failed to obtain hosted Cloudinary URL.');
      }
    } catch (err: unknown) {
      console.error('Cloudinary Upload Error:', err);
      const message = err instanceof Error ? err.message : 'Image upload failed. Ensure Cloudinary keys are set.';
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
      originalPriceLkr: 0,
      stockCount: 10,
      inStock: true,
      image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
      image2: '',
      image3: '',
      image4: '',
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
    const gallery = product.galleryImages || [];
    const rawOrig = Number(product.originalPriceLkr ?? (product as any).originalPrice ?? (product as any).original_price ?? 0);
    const origPriceVal = (!isNaN(rawOrig) && rawOrig > product.priceLkr) ? rawOrig : 0;
    setProductForm({
      name: product.name,
      category: product.category,
      brand: product.brand,
      priceLkr: product.priceLkr,
      originalPriceLkr: origPriceVal,
      stockCount: product.stockCount,
      inStock: product.inStock,
      image: product.image,
      image2: gallery[0] || '',
      image3: gallery[1] || '',
      image4: gallery[2] || '',
      badge: product.badge || '',
      warranty: product.warranty || '1 Year Warranty',
      description: product.description,
      specKeys: keys.length > 0 ? keys : ['Feature'],
      specVals: vals.length > 0 ? vals : ['Standard']
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (productForm.image.startsWith('data:image/')) {
      setUploadError('Base64 image strings are not allowed. Please upload a valid image to obtain a Cloudinary hosted URL.');
      return;
    }

    if (!productForm.image || !productForm.image.startsWith('http')) {
      setUploadError('Please provide a valid hosted image URL (e.g. https://res.cloudinary.com/...).');
      return;
    }

    const specsObj: Record<string, string> = {};
    productForm.specKeys.forEach((key, idx) => {
      if (key.trim() && productForm.specVals[idx]) {
        specsObj[key.trim()] = productForm.specVals[idx].trim();
      }
    });

    const productId = editingProduct ? editingProduct.id : `prod-${Date.now()}`;
    const title = productForm.name || '';
    const price = Number(productForm.priceLkr) || 0;
    const origPriceInput = Number(productForm.originalPriceLkr) || 0;
    const originalPriceValue = (!isNaN(origPriceInput) && origPriceInput > price) ? origPriceInput : 0;
    const stock = Number(productForm.stockCount) || 0;
    const imageUrl = productForm.image || 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=600';
    const galleryImages = [productForm.image2, productForm.image3, productForm.image4]
      .map(img => img.trim())
      .filter(img => img.length > 0 && img !== imageUrl);
    const warrantyPeriod = productForm.warranty || '1 Year Official Warranty';
    const priceUsd = Math.round(price / 300);

    const payload: any = {
      id: productId,
      name: title,
      brand: productForm.brand,
      category: productForm.category,
      price: price,
      originalPrice: originalPriceValue,
      original_price: originalPriceValue,
      image: imageUrl,
      images: [imageUrl, ...galleryImages],
      gallery_images: galleryImages,
      image2_url: galleryImages[0] || null,
      image3_url: galleryImages[1] || null,
      image4_url: galleryImages[2] || null,
      description: productForm.description || '',
      features: [productForm.brand, productForm.category],
      specs: specsObj,
      in_stock: stock > 0 && productForm.inStock,
      warranty: warrantyPeriod,
      created_at: new Date().toISOString()
    };

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name: title,
        category: productForm.category,
        brand: productForm.brand,
        priceLkr: price,
        priceUsd: priceUsd,
        originalPriceLkr: originalPriceValue > 0 ? originalPriceValue : undefined,
        originalPrice: originalPriceValue > 0 ? originalPriceValue : undefined,
        stockCount: stock,
        inStock: stock > 0 && productForm.inStock,
        image: imageUrl,
        galleryImages,
        badge: productForm.badge || undefined,
        warranty: warrantyPeriod,
        description: productForm.description,
        specs: specsObj
      };
      setProducts(updateStoredProduct(updated));
      alert('Product updated successfully!');
    } else {
      const newProd: Product = {
        id: productId,
        name: title,
        category: productForm.category,
        brand: productForm.brand,
        priceLkr: price,
        priceUsd: priceUsd,
        originalPriceLkr: originalPriceValue > 0 ? originalPriceValue : undefined,
        originalPrice: originalPriceValue > 0 ? originalPriceValue : undefined,
        rating: 5.0,
        reviewsCount: 1,
        image: imageUrl,
        galleryImages,
        specs: specsObj,
        description: productForm.description,
        tags: [productForm.brand, productForm.category],
        inStock: stock > 0 && productForm.inStock,
        stockCount: stock,
        featured: true,
        badge: productForm.badge || 'NEW',
        warranty: warrantyPeriod
      };
      setProducts(addStoredProduct(newProd));
      alert('Product added successfully!');
    }

    await fetchProducts();
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Delete this product item from inventory?')) {
      setProducts(deleteStoredProduct(productId));
      await fetchProducts();
    }
  };

  const handleClearAllProducts = async () => {
    if (!confirm('Are you sure you want to PURGE AND DELETE ALL PRODUCTS from inventory and database? This action cannot be undone.')) {
      return;
    }

    try {
      setProducts(clearAllStoredProducts());
      await fetch('/api/products?all=true', { method: 'DELETE' });
      await fetchProducts();
      alert('All products purged successfully!');
    } catch (err) {
      console.error('Failed to purge products:', err);
      alert('Failed to purge products.');
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      alert('Please select a valid CSV or JSON file exported from Google Sheets or Excel.');
      return;
    }

    setIsImportingCSV(true);

    try {
      const text = await file.text();
      let rows: Record<string, any>[] = [];

      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(text);
          rows = Array.isArray(parsed) ? parsed : (parsed.products || [parsed]);
        } catch (jsonErr) {
          alert('Invalid JSON file format.');
          setIsImportingCSV(false);
          if (csvFileInputRef.current) csvFileInputRef.current.value = '';
          return;
        }
      } else {
        rows = parseCSV(text);
      }

      if (rows.length === 0) {
        alert('The uploaded file is empty or could not be parsed.');
        setIsImportingCSV(false);
        if (csvFileInputRef.current) csvFileInputRef.current.value = '';
        return;
      }

      const batch = rows
        .map((row, idx) => parseSheetProductRow(row, idx))
        .filter((p): p is NonNullable<ReturnType<typeof parseSheetProductRow>> => p !== null && Boolean(p.name) && p.name.trim().length >= 2);

      if (batch.length === 0) {
        alert('No valid product rows were found in the uploaded file. Please ensure there is a "Name" or "Title" column header.');
        setIsImportingCSV(false);
        if (csvFileInputRef.current) csvFileInputRef.current.value = '';
        return;
      }

      for (const item of batch) {
        try {
          await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });
        } catch (mongoErr) {
          console.error('[CSV Import Error] Product sync error:', mongoErr);
        }
      }

      // Sync local storage & state
      const currentStored = getStoredProducts();
      const newProducts: Product[] = batch.map((item: any) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        priceLkr: item.price,
        priceUsd: Math.round(item.price / 300),
        originalPriceLkr: item.original_price > 0 ? item.original_price : undefined,
        originalPrice: item.original_price > 0 ? item.original_price : undefined,
        rating: 5.0,
        reviewsCount: 1,
        image: item.image,
        galleryImages: item.galleryImages,
        specs: item.specs || {},
        description: item.description,
        tags: item.features || [],
        inStock: item.in_stock,
        stockCount: item.stock || 10,
        featured: true,
        warranty: item.warranty
      }));

      saveProducts([...newProducts, ...currentStored]);
      await fetchProducts();

      alert(`Successfully imported ${batch.length} products!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown sheet parse error';
      console.error('[Sheet Import Error]:', err);
      alert(`Error parsing sheet file: ${msg}`);
    } finally {
      setIsImportingCSV(false);
      if (csvFileInputRef.current) csvFileInputRef.current.value = '';
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
      featuredProductId: products[0]?.id || '',
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

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSlide) {
      updateHeroSlide(slideForm);
    } else {
      addHeroSlide(slideForm);
    }
    await fetchSlides();
    setIsSlideModalOpen(false);
  };

  const handleToggleSlideActive = async (slide: HeroSlide) => {
    const updated = { ...slide, isActive: !slide.isActive };
    updateHeroSlide(updated);
    await fetchSlides();
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (confirm('Delete this hero slide from banner carousel?')) {
      deleteHeroSlide(slideId);
      await fetchSlides();
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

  const handleSaveSiteLogo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = cleanLogoUrl(siteLogoInput);
    setSiteLogoInput(cleaned);
    saveSiteLogo(cleaned);
    if (typeof window !== 'undefined') {
      localStorage.setItem('temp_uploaded_logo', cleaned);
    }
    setLogoNotice(true);
    setTimeout(() => setLogoNotice(false), 3000);
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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
          <p className="text-xs font-mono text-zinc-400 tracking-wider">Verifying Admin Session...</p>
        </div>
      </div>
    );
  }

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
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-sm hover:scale-[1.01] transition-transform shadow-lg shadow-lime-400/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
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
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row transition-colors font-mono">

      {/* Mobile Top Header with Hamburger Toggle (Visible on < md) */}
      <div className="md:hidden sticky top-0 z-40 bg-[#08090d] border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 p-0.5">
            <div className="w-full h-full bg-zinc-950 rounded-[8px] flex items-center justify-center">
              <Shield className="w-4 h-4 text-lime-400" />
            </div>
          </div>
          <span className="font-extrabold text-base text-white tracking-wider">ZeroLag TEK</span>
        </Link>

        <div className="flex items-center gap-2">
          {pendingOrdersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold">
              {pendingOrdersCount} Pending
            </span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-800 hover:text-white"
            aria-label="Toggle Navigation Drawer"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Over Backdrop Drawer Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation (Desktop Fixed/Sticky + Mobile Overlay Drawer) */}
      <aside
        className={`fixed md:sticky top-0 z-50 md:z-30 h-screen w-64 lg:w-72 bg-[#08090d] border-r border-zinc-800/80 flex flex-col justify-between p-5 transition-transform duration-300 ease-in-out shrink-0 overflow-y-auto ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Branding Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 p-0.5 shadow-lg shadow-lime-400/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-zinc-950 rounded-[8px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-lime-400" />
                </div>
              </div>
              <div>
                <span className="font-extrabold text-base text-white tracking-wider block">ZeroLag TEK</span>
                <span className="text-[10px] text-zinc-500 block">ADMIN CONTROL</span>
              </div>
            </Link>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse shrink-0" />
            <span className="text-zinc-300 font-mono text-[11px] truncate">zerolagtek@gmail.com</span>
          </div>

          {/* Navigation Items List */}
          <nav className="space-y-1 text-xs font-mono">
            <button
              onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }}
              className={`w-full px-3.5 py-3 rounded-xl font-bold transition-all flex items-center justify-between group ${
                activeTab === 'products'
                  ? 'bg-gradient-to-r from-lime-400/20 to-emerald-500/20 text-lime-400 border-l-4 border-lime-400 shadow-lg shadow-lime-400/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-lime-400" />
                <span>Products</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 group-hover:border-zinc-700">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
              className={`w-full px-3.5 py-3 rounded-xl font-bold transition-all flex items-center justify-between group ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-lime-400/20 to-emerald-500/20 text-lime-400 border-l-4 border-lime-400 shadow-lg shadow-lime-400/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-lime-400" />
                <span>Orders</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                pendingOrdersCount > 0
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800'
              }`}>
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('slides'); setIsSidebarOpen(false); }}
              className={`w-full px-3.5 py-3 rounded-xl font-bold transition-all flex items-center justify-between group ${
                activeTab === 'slides'
                  ? 'bg-gradient-to-r from-lime-400/20 to-emerald-500/20 text-lime-400 border-l-4 border-lime-400 shadow-lg shadow-lime-400/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-lime-400" />
                <span>Hero Slides</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                {slides.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('categories'); setIsSidebarOpen(false); }}
              className={`w-full px-3.5 py-3 rounded-xl font-bold transition-all flex items-center justify-between group ${
                activeTab === 'categories'
                  ? 'bg-gradient-to-r from-lime-400/20 to-emerald-500/20 text-lime-400 border-l-4 border-lime-400 shadow-lg shadow-lime-400/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-lime-400" />
                <span>Categories</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                {categories.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('reviews'); setIsSidebarOpen(false); }}
              className={`w-full px-3.5 py-3 rounded-xl font-bold transition-all flex items-center justify-between group ${
                activeTab === 'reviews'
                  ? 'bg-gradient-to-r from-lime-400/20 to-emerald-500/20 text-lime-400 border-l-4 border-lime-400 shadow-lg shadow-lime-400/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Reviews</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                {reviews.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('bank'); setIsSidebarOpen(false); }}
              className={`w-full px-3.5 py-3 rounded-xl font-bold transition-all flex items-center justify-between group ${
                activeTab === 'bank'
                  ? 'bg-gradient-to-r from-lime-400/20 to-emerald-500/20 text-lime-400 border-l-4 border-lime-400 shadow-lg shadow-lime-400/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-lime-400" />
                <span>Bank Config</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('shipping'); setIsSidebarOpen(false); }}
              className={`w-full px-3.5 py-3 rounded-xl font-bold transition-all flex items-center justify-between group ${
                activeTab === 'shipping'
                  ? 'bg-gradient-to-r from-lime-400/20 to-emerald-500/20 text-lime-400 border-l-4 border-lime-400 shadow-lg shadow-lime-400/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-lime-400" />
                <span>Shipping Config</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('branding'); setIsSidebarOpen(false); }}
              className={`w-full px-3.5 py-3 rounded-xl font-bold transition-all flex items-center justify-between group ${
                activeTab === 'branding'
                  ? 'bg-gradient-to-r from-lime-400/20 to-emerald-500/20 text-lime-400 border-l-4 border-lime-400 shadow-lg shadow-lime-400/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-lime-400" />
                <span>Logo & Branding</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="pt-6 border-t border-zinc-800/80 space-y-2 text-xs font-mono">
          <Link
            href="/"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-lime-400" />
            <span>View Storefront</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto">

        {/* Main Content Header Strip */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-wider">
              {activeTab === 'products' && '📦 Hardware Products Catalog'}
              {activeTab === 'orders' && '🛒 Store Orders & Fulfillment'}
              {activeTab === 'slides' && '🖼️ Hero Banners & Slider Manager'}
              {activeTab === 'categories' && '🗂️ Hardware Categories Manager'}
              {activeTab === 'reviews' && '⭐ Customer Reviews & Moderation'}
              {activeTab === 'bank' && '🏦 Bank Account Details Configuration'}
              {activeTab === 'shipping' && '🚚 Courier Shipping Rates Configuration'}
              {activeTab === 'branding' && '🎨 Store Logo & Visual Branding'}
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              ZeroLag TEK Administration Dashboard
            </p>
          </div>

          <button
            onClick={refreshData}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white hover:border-lime-400 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Refresh Store Data"
          >
            <RefreshCw className="w-3.5 h-3.5 text-lime-400" />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>

        {/* Dashboard Overview Metrics Cards */}
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

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={csvFileInputRef}
                  accept=".csv,.json"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                <button
                  onClick={() => csvFileInputRef.current?.click()}
                  disabled={isImportingCSV}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-lime-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  title="Import products from Google Sheets / Excel CSV"
                >
                  {isImportingCSV ? (
                    <Loader2 className="w-4 h-4 text-lime-400 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 text-lime-400" />
                  )}
                  <span>{isImportingCSV ? 'Importing...' : 'Import Sheet / CSV'}</span>
                </button>

                <button
                  onClick={handleClearAllProducts}
                  className="px-4 py-2.5 rounded-xl bg-rose-950/60 border border-rose-800/80 hover:bg-rose-900 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Wipe and clear all products from catalog database"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Clear All Products (Purge)</span>
                </button>

                <button
                  onClick={openCreateProductModal}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-lime-400/20 hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product Item</span>
                </button>
              </div>
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
                          <Link href={`/product/${getProductSlug(product)}`} className="font-bold text-white text-xs line-clamp-1 hover:text-lime-400">
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

        {/* TAB 5: REVIEWS MODERATION */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="bg-[#0a0c10] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>CUSTOMER REVIEWS MODERATION</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono">Approve or reject customer submitted hardware reviews</p>
              </div>
              <span className="text-xs font-mono text-lime-400 font-bold">Total Reviews: {reviews.length}</span>
            </div>

            {reviews.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#0a0c10] border border-zinc-800 text-center space-y-2">
                <Star className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs font-mono text-zinc-400">No customer reviews submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(rev => (
                  <div key={rev.id} className="p-5 rounded-2xl bg-[#0a0c10] border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white text-sm">{rev.user_name}</span>
                        <span className="text-zinc-400">({rev.user_email})</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          rev.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : rev.status === 'rejected'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {rev.status}
                        </span>
                      </div>
                      <p className="text-zinc-300 font-sans text-xs pt-1">{rev.comment}</p>
                      <div className="flex items-center gap-4 text-[11px] text-zinc-500 pt-1">
                        <span>Product ID: {rev.product_id}</span>
                        <span>•</span>
                        <div className="flex items-center text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-zinc-700'}`} />
                          ))}
                        </div>
                        <span>•</span>
                        <span>{new Date(rev.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {rev.status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateReviewStatus(rev.id, 'approved')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 font-bold transition-all cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                      {rev.status !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateReviewStatus(rev.id, 'rejected')}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 font-bold transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 font-bold transition-all cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: BANK CONFIGURATION */}
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
                <label className="text-zinc-400 block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankConfig.bankName ?? ''}
                  onChange={(e) => setBankConfig({ ...bankConfig, bankName: e.target.value })}
                  placeholder="Commercial Bank of Ceylon"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-lime-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={bankConfig.accountName ?? ''}
                  onChange={(e) => setBankConfig({ ...bankConfig, accountName: e.target.value })}
                  placeholder="ZeroLag Tek LK (Pvt) Ltd"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-lime-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 block mb-1">Account Number</label>
                  <input
                    type="text"
                    value={bankConfig.accountNumber ?? ''}
                    onChange={(e) => setBankConfig({ ...bankConfig, accountNumber: e.target.value })}
                    placeholder="8004592011"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lime-400 focus:border-lime-400 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={bankConfig.branch ?? ''}
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
                  value={bankConfig.swiftCode ?? ''}
                  onChange={(e) => setBankConfig({ ...bankConfig, swiftCode: e.target.value })}
                  placeholder="CCBYLKLX"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-lime-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">WhatsApp Receipt Instructions</label>
                <textarea
                  rows={3}
                  value={bankConfig.instructions ?? ''}
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

        {/* TAB 7: SHIPPING CONFIGURATION */}
        {activeTab === 'shipping' && (
          <div className="max-w-3xl bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Truck className="w-5 h-5 text-lime-400" />
                <h3>Shipping / Courier Configuration</h3>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-lime-500/20 text-lime-400 border border-lime-400/40">
                LIVE CHECKOUT COURIER RATES
              </span>
            </div>

            <div className="space-y-4">
              {shippingRates.map((rateOption, idx) => (
                <div key={rateOption.id} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-bold text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rateOption.enabled}
                        onChange={(e) => {
                          const updated = [...shippingRates];
                          updated[idx] = { ...updated[idx], enabled: e.target.checked };
                          setShippingRates(updated);
                        }}
                        className="rounded border-zinc-700 text-lime-400 focus:ring-lime-400"
                      />
                      <span>Enable {rateOption.name}</span>
                    </label>
                    <span className="text-[10px] text-zinc-500">ID: {rateOption.id}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="text-zinc-400 block text-[10px] mb-1">Courier Name</label>
                      <input
                        type="text"
                        value={rateOption.name}
                        onChange={(e) => {
                          const updated = [...shippingRates];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setShippingRates(updated);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-lime-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block text-[10px] mb-1">Estimated Delivery Time / Description</label>
                      <input
                        type="text"
                        value={rateOption.description}
                        onChange={(e) => {
                          const updated = [...shippingRates];
                          updated[idx] = { ...updated[idx], description: e.target.value };
                          setShippingRates(updated);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-lime-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block text-[10px] mb-1">Courier Rate (Rs.)</label>
                      <input
                        type="number"
                        value={rateOption.rate}
                        onChange={(e) => {
                          const updated = [...shippingRates];
                          updated[idx] = { ...updated[idx], rate: Number(e.target.value) || 0 };
                          setShippingRates(updated);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-lime-400 font-bold focus:border-lime-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveShippingRates}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 hover:scale-[1.01] transition-all cursor-pointer"
            >
              <span>Save Shipping Rates Configuration</span>
            </button>
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="space-y-6 max-w-2xl bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="p-3 rounded-2xl bg-lime-400/10 border border-lime-400/30 text-lime-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-extrabold text-white text-lg">Site Logo & Branding</h2>
                <p className="text-xs text-zinc-400 font-mono">Upload or link a custom site logo to sync across the Navbar and Footer.</p>
              </div>
            </div>

            {logoNotice && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Site logo updated and synced successfully across Navbar and Footer!</span>
              </div>
            )}

            <form onSubmit={handleSaveSiteLogo} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-bold">Logo Image URL or Google Drive Link</label>
                <input
                  type="text"
                  value={siteLogoInput}
                  onChange={(e) => setSiteLogoInput(e.target.value)}
                  placeholder="https://res.cloudinary.com/... or https://drive.google.com/file/d/..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-lime-400"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Google Drive links (`drive.google.com/file/d/...`) are automatically converted into direct-render image URLs.
                </p>
              </div>

              {/* Cloudinary Image Upload for Logo */}
              <div>
                <label className="block text-zinc-400 mb-1 font-bold">Upload Logo Image</label>
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-lime-400 text-zinc-300 hover:text-white cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-lime-400" />
                  <span>Select Image File (PNG, SVG, WEBP, JPG)</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="hidden" />
                </label>
              </div>

              {/* Live Logo Preview */}
              {siteLogoInput && (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Live Logo Preview</span>
                  <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 p-2 flex items-center justify-center overflow-hidden shadow-md">
                    <img
                      src={cleanLogoUrl(siteLogoInput)}
                      alt="Logo Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 hover:scale-[1.01] transition-transform cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Site Logo</span>
              </button>
            </form>
          </div>
        )}

      </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <label className="text-zinc-400 block mb-1">Selling Price (Rs.) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.priceLkr || ''}
                    onChange={(e) => setProductForm({ ...productForm, priceLkr: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-lime-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Original / Before Discount Price (Rs.) - (Optional)</label>
                  <input
                    type="number"
                    value={productForm.originalPriceLkr || ''}
                    onChange={(e) => setProductForm({ ...productForm, originalPriceLkr: e.target.value ? Number(e.target.value) : 0 })}
                    placeholder="e.g. 35000"
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
                <div>
                  <label className="text-zinc-400 block mb-1">Warranty Term *</label>
                  <select
                    value={productForm.warranty}
                    onChange={(e) => setProductForm({ ...productForm, warranty: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-lime-400 focus:outline-none"
                  >
                    <option value="1 Year Official Warranty">1 Year Official Warranty</option>
                    <option value="2 Years Official Warranty">2 Years Official Warranty</option>
                    <option value="6 Months Warranty">6 Months Warranty</option>
                    <option value="No Warranty">No Warranty</option>
                  </select>
                </div>
              </div>

              {/* Product Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  PRODUCT DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  value={productForm.description || ''}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Enter detailed description of the product features, specs, and warranty..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-lime-500"
                />
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

              {/* Additional Gallery Images (Image 2, Image 3, Image 4) */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <label className="text-zinc-300 block font-bold">Additional Product Gallery Images (Optional)</label>
                
                {[
                  { label: 'Image 2 (Gallery 1)', key: 'image2' as const, target: 'product_image2' as const },
                  { label: 'Image 3 (Gallery 2)', key: 'image3' as const, target: 'product_image3' as const },
                  { label: 'Image 4 (Gallery 3)', key: 'image4' as const, target: 'product_image4' as const }
                ].map(imgField => (
                  <div key={imgField.key} className="space-y-1">
                    <label className="text-zinc-400 text-[11px] block">{imgField.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={productForm[imgField.key]}
                        onChange={(e) => setProductForm({ ...productForm, [imgField.key]: e.target.value })}
                        placeholder="https://... image URL or upload file"
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-lime-400 focus:outline-none text-xs font-mono"
                      />
                      <label className="px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-lime-400 font-bold cursor-pointer flex items-center gap-1 shrink-0 transition-colors">
                        <Upload className="w-4 h-4" />
                        <span className="text-[11px]">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, imgField.target)}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                      {productForm[imgField.key] && (
                        <button
                          type="button"
                          onClick={() => setProductForm({ ...productForm, [imgField.key]: '' })}
                          className="p-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-rose-400 border border-zinc-800"
                          title="Clear image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {productForm[imgField.key] && (
                      <div className="flex items-center gap-2 pt-1">
                        <img src={productForm[imgField.key]} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-zinc-800 shrink-0" />
                        <span className="text-[10px] text-zinc-500 font-mono truncate max-w-xs">{productForm[imgField.key]}</span>
                      </div>
                    )}
                  </div>
                ))}
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
