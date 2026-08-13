'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Category } from '@/types';
import { getDynamicCategories, syncSiteLogoFromSupabase } from '@/lib/storeManager';
import { ShoppingBag, Bot, Shield, Search, Menu, X, MessageSquare, User, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';

export function Navbar({ onSearchChange, searchQuery, onSelectCategory, selectedCategory }: {
  onSearchChange?: (q: string) => void;
  searchQuery?: string;
  onSelectCategory?: (catId: string) => void;
  selectedCategory?: string;
}) {
  const { itemCount, setIsCartOpen, setIsAiOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [siteLogo, setSiteLogo] = useState<string>('');
  const [logoError, setLogoError] = useState<boolean>(false);

  const loadLogo = async () => {
    const logo = await syncSiteLogoFromSupabase();
    setSiteLogo(logo);
    setLogoError(false);
  };

  const syncCategories = () => {
    setCategories(getDynamicCategories());
  };

  const checkAdminAuth = () => {
    fetch('/api/admin/verify')
      .then(res => res.json())
      .then(data => {
        setIsAdminLoggedIn(!!data.authenticated);
      })
      .catch(() => {
        setIsAdminLoggedIn(false);
      });
  };

  const handleAdminSignOut = async () => {
    setAdminDropdownOpen(false);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout error:', e);
    }
    sessionStorage.removeItem('zerolag_admin_auth');
    setIsAdminLoggedIn(false);
    window.dispatchEvent(new Event('zerolag-admin-auth-changed'));
  };

  useEffect(() => {
    checkAdminAuth();
    syncCategories();
    loadLogo();

    window.addEventListener('zerolag-categories-updated', syncCategories);
    window.addEventListener('zerolag-admin-auth-changed', checkAdminAuth);
    window.addEventListener('zerolag-logo-updated', loadLogo);
    window.addEventListener('site_logo_updated', loadLogo);
    return () => {
      window.removeEventListener('zerolag-categories-updated', syncCategories);
      window.removeEventListener('zerolag-admin-auth-changed', checkAdminAuth);
      window.removeEventListener('zerolag-logo-updated', loadLogo);
      window.removeEventListener('site_logo_updated', loadLogo);
    };
  }, []);

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '94741117981';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello ZeroLag Tek! I would like to place an order.')}`;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-black/90 text-white border-b border-zinc-800 transition-colors shadow-sm">
      
      {/* Top Banner Notice & Direct WhatsApp CTA */}
      <div className="bg-gradient-to-r from-lime-400 via-emerald-400 to-lime-400 text-[10px] sm:text-xs font-bold py-1 px-3 sm:px-4 text-slate-950 tracking-wider flex items-center justify-between overflow-hidden">
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
          <span className="truncate">WhatsApp Order: +{whatsappNumber}</span>
        </a>
      </div>

      {/* Main Header Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 w-full gap-2">

          {/* Compact Logo Section */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            {siteLogo && !logoError ? (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                <img
                  src={siteLogo}
                  alt="ZeroLag Tek Logo"
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 p-0.5 shadow-lg shadow-lime-400/30 group-hover:shadow-lime-400/50 transition-all duration-300">
                <div className="w-full h-full bg-[#090a0f] rounded-[10px] flex items-center justify-center">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-lime-400 fill-lime-400/20 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-lg sm:text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-lime-200 to-lime-400">
                  ZeroLag
                </span>
                <span className="text-[9px] sm:text-xs px-1.5 py-0.5 rounded-full bg-lime-400/20 text-lime-400 border border-lime-500/30 font-mono font-bold">
                  TEK
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-zinc-400 font-mono tracking-widest uppercase hidden md:block">
                Zero Latency Store
              </p>
            </div>
          </Link>

          {/* Search Bar - Desktop Only */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-6 relative">
            <input
              type="text"
              placeholder="Search mice, mechanical keyboards, routers..."
              value={searchQuery || ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-full py-2.5 pl-11 pr-4 text-xs lg:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/50 transition-all font-mono"
            />
            <Search className="w-4 h-4 text-lime-400 absolute left-4 top-3.5" />
          </div>

          {/* Right Action Icons Group */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            
            {/* Search Button for Mobile Screens */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
              aria-label="Toggle Mobile Search & Menu"
              title="Search Products"
            >
              <Search className="w-4 h-4 text-lime-400" />
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={() => setIsAiOpen(true)}
              className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-semibold tracking-wide transition-all group"
              title="TekBot AI Specialist"
            >
              <div className="w-2 h-2 rounded-full bg-lime-400 animate-ping absolute -top-0.5 -right-0.5" />
              <Bot className="w-4 h-4 text-lime-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden lg:inline font-mono">TekBot AI</span>
            </button>

            {/* Account / Sign In Icon Button */}
            {isAdminLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-white transition-all cursor-pointer"
                  title="Admin Account"
                >
                  <User className="w-4 h-4 text-lime-400" />
                  <span className="hidden sm:inline font-bold">Account</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:inline" />
                </button>

                {adminDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#0a0c10] border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 font-mono text-xs space-y-1">
                    <Link
                      href="/admin"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-lime-400/10 text-lime-400 font-bold transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>

                    <button
                      onClick={handleAdminSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-400 text-left transition-colors cursor-pointer"
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
                className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-lime-400 font-bold text-xs font-mono transition-all"
                title="Sign In"
              >
                <User className="w-4 h-4 text-lime-400" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-all cursor-pointer"
              aria-label="Shopping Cart"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-lg shadow-lime-400/50">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors cursor-pointer"
              aria-label="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Category Shortcuts Sub-Nav - Desktop */}
        <div className="hidden lg:flex items-center gap-2 py-2 overflow-x-auto bg-[#07080b]/95 border-t border-b border-zinc-800/80 text-xs font-mono scrollbar-none px-2 rounded-xl mb-1">
          <span className="text-zinc-400 text-[11px] mr-2">Categories:</span>
          <button
            onClick={() => onSelectCategory && onSelectCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${
              !selectedCategory || selectedCategory === 'all'
                ? 'bg-lime-400 text-slate-950 font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory && onSelectCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-lime-400 text-slate-950 font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

      </div>

      {/* Mobile Navigation Drawer / Menu Modal */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950 border-t border-b border-zinc-800 px-4 py-4 space-y-4 shadow-2xl animate-fade-in">
          {/* Mobile Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search hardware, mice, keyboards..."
              value={searchQuery || ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400 font-mono"
            />
            <Search className="w-4 h-4 text-lime-400 absolute left-3.5 top-3" />
          </div>

          {/* Categories Section */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-lime-400 uppercase font-bold tracking-wider">
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
                    ? 'bg-lime-400/10 border-lime-400/40 text-lime-400 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
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
                      ? 'bg-lime-400/10 border-lime-400/40 text-lime-400 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Account Link in Drawer */}
          <div className="pt-3 border-t border-zinc-800 font-mono">
            <Link
              href={isAdminLoggedIn ? "/admin" : "/login"}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-zinc-200 border border-zinc-800 text-xs font-bold w-full justify-center hover:text-lime-400 transition-colors"
            >
              <User className="w-4 h-4 text-lime-400" />
              <span>{isAdminLoggedIn ? 'Admin Dashboard' : 'Sign In to Account'}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
