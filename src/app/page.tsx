'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroBanner } from '@/components/HeroBanner';
import { ProductGrid } from '@/components/ProductGrid';
import { CartDrawer } from '@/components/CartDrawer';
import { PayHereCheckoutModal } from '@/components/PayHereCheckoutModal';
import { AiAssistantDrawer } from '@/components/AiAssistantDrawer';
import { Footer } from '@/components/Footer';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-black text-white">
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
