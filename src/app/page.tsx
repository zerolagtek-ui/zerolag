'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { HeroBanner } from '@/components/HeroBanner';
import { ProductGrid } from '@/components/ProductGrid';
import { CartDrawer } from '@/components/CartDrawer';
import { PayHereCheckoutModal } from '@/components/PayHereCheckoutModal';
import { AiAssistantDrawer } from '@/components/AiAssistantDrawer';
import { Footer } from '@/components/Footer';
import { getProductsFromSupabase } from '@/lib/productsData';
import { syncHeroSlidesFromSupabase, getStoredProducts } from '@/lib/storeManager';
import { Product } from '@/types';

function HomeContent() {
  const [hasMounted, setHasMounted] = useState(false);
  const searchParams = useSearchParams();
  const initialSearchParam = searchParams ? (searchParams.get('search') || '') : '';

  const [searchQuery, setSearchQuery] = useState(initialSearchParam);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts() || []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!searchParams) return;
    const q = searchParams.get('search');
    if (q !== null) {
      setSearchQuery(q);
      setTimeout(() => {
        const el = document.getElementById('products');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      const stored = getStoredProducts();
      if (stored && stored.length > 0) {
        setProducts(stored);
      }
      try {
        await syncHeroSlidesFromSupabase();
        const fetched = await getProductsFromSupabase();
        if (fetched && fetched.length > 0) {
          setProducts(fetched);
        }
      } catch (err) {
        console.error('[Home Page] Failed to fetch data:', err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-black text-white overflow-x-hidden">
      {/* Navigation Header */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <main className="flex-1">
        {/* Main Hero Section */}
        <HeroBanner />

        {/* Product Catalog Grid & Multi-Filters */}
        <ProductGrid
          externalSearchQuery={searchQuery}
          externalCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          initialProducts={products}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Modals & Slide-over Drawers */}
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />
      <PayHereCheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      <AiAssistantDrawer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col justify-between bg-black text-white overflow-x-hidden">
        <Navbar />
        <main className="flex-1">
          <HeroBanner />
          <ProductGrid />
        </main>
        <Footer />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
