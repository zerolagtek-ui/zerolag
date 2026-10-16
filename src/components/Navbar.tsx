'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useCart } from '@/context/CartContext';
import { Category, Product } from '@/types';
import {
  getDynamicCategories,
  getStoredSiteLogo,
  syncSiteLogoFromSupabase,
  cleanLogoUrl,
  getStoredProducts
} from '@/lib/storeManager';
import { formatPrice, getProductSlug } from '@/lib/productsData';
import {
  ShoppingBag,
  Bot,
  Shield,
  Search,
  Menu,
  X,
  MessageSquare,
  User,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Package,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';

export function Navbar({ onSearchChange, searchQuery, onSelectCategory, selectedCategory }: {
  onSearchChange?: (q: string) => void;
  searchQuery?: string;
  onSelectCategory?: (catId: string) => void;
  selectedCategory?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, setIsCartOpen, setIsAiOpen } = useCart();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const currentTheme = resolvedTheme || theme;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [siteLogo, setSiteLogo] = useState<string>(() => cleanLogoUrl(getStoredSiteLogo()) || '/logo.png');
  const [logoError, setLogoError] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [mountedTheme, setMountedTheme] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMountedTheme(true);
  }, []);

  // Search autocomplete state
  const [inputVal, setInputVal] = useState<string>(searchQuery || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery !== undefined) {
      setInputVal(searchQuery);
    }
  }, [searchQuery]);

  const loadProducts = () => {
    setProducts(getStoredProducts());
  };

  const loadLogo = async () => {
    const cached = cleanLogoUrl(getStoredSiteLogo());
    if (cached) {
      setSiteLogo(cached);
      setLogoError(false);
    } else {
      setSiteLogo('/logo.png');
      setLogoError(false);
    }

    try {
      const remoteLogo = await syncSiteLogoFromSupabase();
      const finalLogo = cleanLogoUrl(remoteLogo || cached) || '/logo.png';
      if (finalLogo) {
        setSiteLogo(finalLogo);
        setLogoError(false);
      }
    } catch {
      // fallback preserved
    }
  };

  const syncCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const apiCategories = Array.isArray(data) ? data : data.categories || [];
        if (apiCategories.length > 0) {
          const formatted: Category[] = apiCategories.map((c: any) => ({
            id: c.slug || c.id || String(c._id || c.name.toLowerCase().replace(/\s+/g, '-')),
            name: c.name,
            iconName: c.icon || c.iconName || '',
            description: c.description || ''
          }));
          setCategories(formatted);
          return;
        }
      }
    } catch (err) {
      console.warn('[Navbar Category Sync Error]:', err);
    }
    setCategories(getDynamicCategories());
  };

  const checkAdminAuth = async (forceFetch = false) => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;

    const hasLocalAuthFlag = sessionStorage.getItem('zerolag_admin_auth') === 'true';

    if (!hasLocalAuthFlag && (!pathname || !pathname.startsWith('/admin')) && !forceFetch) {
      setIsAdminLoggedIn(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/verify');
      const data = await res.json().catch(() => ({ authenticated: false }));

      if (res.ok && data.authenticated) {
        setIsAdminLoggedIn(true);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('zerolag_admin_auth', 'true');
        }
      } else {
        setIsAdminLoggedIn(false);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('zerolag_admin_auth');
        }
      }
    } catch {
      setIsAdminLoggedIn(false);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('zerolag_admin_auth');
      }
    }
  };

  const handleAdminSignOut = async () => {
    setAdminDropdownOpen(false);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout error:', e);
    }
    if (typeof window !== 'undefined') {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('zerolag_admin_auth');
      }
      setIsAdminLoggedIn(false);
      window.dispatchEvent(new Event('zerolag-admin-auth-changed'));
    }
  };

  // Sync categories on route changes
  useEffect(() => {
    syncCategories();
  }, [pathname]);

  // Initial Auth check, Logo fetch, Products load & event listeners
  useEffect(() => {
    loadLogo();
    loadProducts();
    checkAdminAuth();

    const handleAuthChanged = () => checkAdminAuth(true);

    if (typeof window !== 'undefined') {
      window.addEventListener('zerolag-categories-updated', syncCategories);
      window.addEventListener('zerolag-products-updated', loadProducts);
      window.addEventListener('zerolag-admin-auth-changed', handleAuthChanged);
      window.addEventListener('zerolag-logo-updated', loadLogo);
      window.addEventListener('site_logo_updated', loadLogo);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('zerolag-categories-updated', syncCategories);
        window.removeEventListener('zerolag-products-updated', loadProducts);
        window.removeEventListener('zerolag-admin-auth-changed', handleAuthChanged);
        window.removeEventListener('zerolag-logo-updated', loadLogo);
        window.removeEventListener('site_logo_updated', loadLogo);
      }
    };
  }, []);

  // Close autocomplete on click outside or Escape key
  useEffect(() => {
    if (typeof document === 'undefined') return;

    function handleClickOutside(event: MouseEvent) {
      if (
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(event.target as Node) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Live matching search results when typing 2+ characters
  const matchingProducts = inputVal.trim().length >= 2
    ? products.filter((p) => {
        const q = inputVal.toLowerCase().trim();
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const brandMatch = (p.brand || '').toLowerCase().includes(q);
        const categoryMatch = (p.category || '').toLowerCase().includes(q);
        const descMatch = (p.description || '').toLowerCase().includes(q);
        return nameMatch || brandMatch || categoryMatch || descMatch;
      })
    : [];

  const handleInputChange = (val: string) => {
    setInputVal(val);
    if (onSearchChange) onSearchChange(val);
    setIsDropdownOpen(val.trim().length >= 2);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDropdownOpen(false);

    if (onSearchChange) {
      onSearchChange(inputVal);
    }

    if (pathname === '/') {
      const element = document.getElementById('products');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      router.push(`/?search=${encodeURIComponent(inputVal)}#products`);
    }
  };

  const storeWhatsapp = process.env.NEXT_PUBLIC_STORE_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '94741117981';
  const whatsappUrl = `https://wa.me/${storeWhatsapp}?text=${encodeURIComponent('Hello ZeroLag Tek! I would like to place an order.')}`;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-black/90 text-slate-900 dark:text-white border-b border-slate-200 dark:border-zinc-800 transition-colors shadow-sm">
      
      {/* Top Banner Notice & Direct WhatsApp CTA */}
      <div className="bg-lime-400 text-[10px] sm:text-xs font-bold py-1 px-3 sm:px-4 text-black tracking-wider flex items-center justify-between w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
        <div className="hidden md:flex items-center gap-2 mx-auto uppercase truncate">
          <Shield className="w-3.5 h-3.5 fill-current shrink-0" />
          <span className="truncate">ZEROLAG TEK: ISLANDWIDE EXPRESS DELIVERY | PAYHERE, PAYZY & COD AVAILABLE</span>
          <Shield className="w-3.5 h-3.5 fill-current shrink-0" />
        </div>

        {/* WhatsApp Direct Header Link */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto md:mx-0 flex items-center gap-1 sm:gap-1.5 bg-slate-950 text-lime-400 px-2.5 sm:px-3 py-0.5 rounded-full font-mono text-[10px] sm:text-[11px] hover:bg-slate-900 border border-lime-400/40 transition-all font-bold truncate"
        >
          <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-lime-400 fill-lime-400/20 shrink-0" />
          <span className="truncate">WhatsApp Order: +{storeWhatsapp}</span>
        </a>
      </div>

      {/* Main Header Container */}
      <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 w-full gap-2">

          {/* Hybrid Logo Section (Icon Image + Adaptive Theme HTML Text) */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0" suppressHydrationWarning>
            {!logoError && (
              <img
                src={siteLogo || "/logo.png"}
                alt="ZeroLag TEK"
                className="h-11 w-11 md:h-12 md:w-12 object-contain transition-transform duration-200 group-hover:scale-105 shrink-0"
                onError={() => setLogoError(true)}
              />
            )}
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-xl">
              <span className="text-slate-900 dark:text-white transition-colors">
                ZeroLag
              </span>
              <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider font-mono">
                TEK
              </span>
            </div>
          </Link>

          {/* Search Bar with Instant Autocomplete Dropdown - Desktop */}
          <div ref={desktopSearchRef} className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-6 relative">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                placeholder="Search mice, mechanical keyboards, routers..."
                value={inputVal}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setIsDropdownOpen(inputVal.trim().length >= 2)}
                className="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700/80 rounded-full py-2.5 pl-11 pr-10 text-xs lg:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-lime-500 dark:focus:border-lime-400 focus:ring-1 focus:ring-lime-400/50 transition-all font-mono"
              />
              <button
                type="submit"
                className="absolute left-3.5 top-3 text-lime-400 hover:scale-110 transition-transform cursor-pointer"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
              {inputVal && (
                <button
                  type="button"
                  onClick={() => handleInputChange('')}
                  className="absolute right-3.5 top-3 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Desktop Instant Search Dropdown */}
            {isDropdownOpen && inputVal.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 font-mono text-xs animate-in fade-in duration-150">
                <div className="p-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-950/80 flex items-center justify-between text-[11px]">
                  <span className="text-lime-600 dark:text-lime-400 font-bold uppercase tracking-wider">
                    Matching Products ({matchingProducts.length})
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">ESC to close</span>
                </div>

                {matchingProducts.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/40">
                    {matchingProducts.slice(0, 5).map((prod) => {
                      const slug = getProductSlug(prod);
                      return (
                        <Link
                          key={prod.id}
                          href={`/product/${slug}`}
                          onClick={() => {
                            setIsDropdownOpen(false);
                            if (onSearchChange) onSearchChange('');
                            setInputVal('');
                          }}
                          className="p-3 flex items-center gap-3 hover:bg-lime-400/10 transition-colors group cursor-pointer"
                        >
                          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1 flex items-center justify-center shrink-0 overflow-hidden relative">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="w-full h-full object-contain" />
                            ) : (
                              <Package className="w-5 h-5 text-zinc-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-slate-900 dark:text-white font-bold block truncate group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                              {prod.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                              {prod.brand && <span className="text-slate-400 dark:text-zinc-400">{prod.brand}</span>}
                              {prod.inStock ? (
                                <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  In Stock
                                </span>
                              ) : (
                                <span className="text-rose-500 dark:text-rose-400 flex items-center gap-1 font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Out of Stock
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-lime-600 dark:text-lime-400 font-bold font-mono text-xs shrink-0">
                            {formatPrice(prod.priceLkr)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-5 text-center text-slate-400 dark:text-zinc-500 text-xs">
                    No hardware products matching "{inputVal}"
                  </div>
                )}

                <button
                  onClick={handleSearchSubmit}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 text-lime-600 dark:text-lime-400 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Search all results for "{inputVal}"</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Action Icons Group */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            
            {/* Search Button for Mobile Screens */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 transition-colors"
              aria-label="Toggle Mobile Search & Menu"
              title="Search Products"
            >
              <Search className="w-4 h-4 text-lime-500 dark:text-lime-400" />
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={() => setIsAiOpen(true)}
              className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 text-xs font-semibold tracking-wide transition-all group"
              title="TekBot AI Specialist"
            >
              <div className="w-2 h-2 rounded-full bg-lime-400 animate-ping absolute -top-0.5 -right-0.5" />
              <Bot className="w-4 h-4 text-lime-500 dark:text-lime-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden lg:inline font-mono">TekBot AI</span>
            </button>

            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 transition-all cursor-pointer flex items-center justify-center shadow-sm"
              title={mountedTheme ? `Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode` : 'Toggle Theme'}
              aria-label="Toggle Theme"
            >
              {mountedTheme && resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500 dark:text-indigo-400 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Account / Sign In Icon Button */}
            {isAdminLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-xs font-mono text-slate-900 dark:text-white transition-all cursor-pointer"
                  title="Admin Account"
                >
                  <User className="w-4 h-4 text-lime-500 dark:text-lime-400" />
                  <span className="hidden sm:inline font-bold">Account</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:inline" />
                </button>

                {adminDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 font-mono text-xs space-y-1">
                    <Link
                      href="/admin"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-lime-400/10 text-lime-600 dark:text-lime-400 font-bold transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>

                    <button
                      onClick={handleAdminSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-500 text-left transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-xs font-mono text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-all"
                title="Admin Sign In"
              >
                <User className="w-4 h-4 text-lime-500 dark:text-lime-400" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            {/* Cart Button with Counter Badge */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 sm:px-3.5 sm:py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-lime-400/20 hover:scale-105 transition-all cursor-pointer"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="bg-slate-950 text-lime-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-lime-400/40">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 transition-colors"
              aria-label="Toggle Navigation Drawer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Menu Modal */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-zinc-950 border-t border-b border-slate-200 dark:border-zinc-800 px-4 py-4 space-y-4 shadow-2xl animate-fade-in">
          
          {/* Mobile Search Input with Autocomplete */}
          <div ref={mobileSearchRef} className="relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search hardware, mice, keyboards..."
                value={inputVal}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setIsDropdownOpen(inputVal.trim().length >= 2)}
                className="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 rounded-xl py-2.5 pl-10 pr-8 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-lime-500 font-mono"
              />
              <Search className="w-4 h-4 text-lime-600 dark:text-lime-400 absolute left-3.5 top-3" />
              {inputVal && (
                <button
                  type="button"
                  onClick={() => handleInputChange('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Mobile Autocomplete Dropdown */}
            {isDropdownOpen && inputVal.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 font-mono text-xs">
                <div className="p-3 border-b border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-950/80 flex items-center justify-between text-[11px]">
                  <span className="text-lime-600 dark:text-lime-400 font-bold uppercase tracking-wider">
                    Matching Products ({matchingProducts.length})
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-500">ESC to close</span>
                </div>

                {matchingProducts.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/40">
                    {matchingProducts.slice(0, 5).map((prod) => {
                      const slug = getProductSlug(prod);
                      return (
                        <Link
                          key={prod.id}
                          href={`/product/${slug}`}
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setMobileMenuOpen(false);
                            if (onSearchChange) onSearchChange('');
                            setInputVal('');
                          }}
                          className="p-3 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-lime-400/10 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1 flex items-center justify-center shrink-0 overflow-hidden relative">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="w-full h-full object-contain" />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400 dark:text-zinc-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-slate-900 dark:text-white font-bold block truncate text-xs">
                              {prod.name}
                            </span>
                            <div className="flex items-center gap-2 text-[9px] mt-0.5">
                              {prod.brand && <span className="text-slate-500 dark:text-zinc-400">{prod.brand}</span>}
                              {prod.inStock ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">In Stock</span>
                              ) : (
                                <span className="text-rose-600 dark:text-rose-400 font-semibold">Out of Stock</span>
                              )}
                            </div>
                          </div>
                          <span className="text-lime-600 dark:text-lime-400 font-bold text-xs shrink-0 font-mono">
                            {formatPrice(prod.priceLkr)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-500 dark:text-zinc-500 text-xs">
                    No hardware matching "{inputVal}"
                  </div>
                )}

                <button
                  onClick={(e) => {
                    handleSearchSubmit(e);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 text-lime-600 dark:text-lime-400 font-bold text-[11px] flex items-center justify-center gap-1.5"
                >
                  <span>View all results for "{inputVal}"</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Categories Section */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-lime-600 dark:text-lime-400 uppercase font-bold tracking-wider">
              Hardware Categories
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
              <button
                onClick={() => {
                  if (onSelectCategory) onSelectCategory('all');
                  setMobileMenuOpen(false);
                }}
                className={`text-left text-xs p-2 rounded-lg border transition-colors ${
                  !selectedCategory || selectedCategory === 'all'
                    ? 'bg-lime-400/20 border-lime-500 text-lime-700 dark:text-lime-400 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (onSelectCategory) onSelectCategory(cat.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left text-xs p-2 rounded-lg border transition-colors truncate ${
                    selectedCategory === cat.id
                      ? 'bg-lime-400/20 border-lime-500 text-lime-700 dark:text-lime-400 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Switcher & Account Links in Drawer */}
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 font-mono space-y-2">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <span className="text-xs text-slate-700 dark:text-zinc-300 font-semibold flex items-center gap-2">
                {mountedTheme && (currentTheme === 'dark' ? <Moon className="w-4 h-4 text-lime-400" /> : <Sun className="w-4 h-4 text-amber-500" />)}
                Theme Mode
              </span>
              <div className="flex items-center gap-1 bg-white dark:bg-zinc-950 p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                    mountedTheme && currentTheme === 'light'
                      ? 'bg-lime-400 text-slate-950 font-bold'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                    mountedTheme && currentTheme === 'dark'
                      ? 'bg-lime-400 text-slate-950 font-bold'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>

            <Link
              href={isAdminLoggedIn ? "/admin" : "/login"}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 text-xs font-bold w-full justify-center hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
            >
              <User className="w-4 h-4 text-lime-600 dark:text-lime-400" />
              <span>{isAdminLoggedIn ? "Admin Dashboard" : "Admin Sign In"}</span>
            </Link>
          </div>

        </div>
      )}

    </header>
  );
}
