'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Home, Grid, ShoppingBag, MessageSquare } from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, setIsCartOpen } = useCart();

  const storeWhatsapp = process.env.NEXT_PUBLIC_STORE_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '94741117981';
  const whatsappUrl = `https://wa.me/${storeWhatsapp}?text=${encodeURIComponent('Hello ZeroLag Tek! I need help with an order.')}`;

  const handleProductsClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      const el = document.getElementById('products');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      router.push('/#products');
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-2 py-2 shadow-[0_-5px_25px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 min-w-[64px] rounded-xl transition-all ${
            pathname === '/'
              ? 'text-lime-400 font-bold bg-lime-400/10 border border-lime-400/30'
              : 'text-zinc-400 hover:text-white active:scale-95'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-mono tracking-tight">Home</span>
        </Link>

        {/* Products / Categories */}
        <a
          href="/#products"
          onClick={handleProductsClick}
          className="flex flex-col items-center justify-center gap-1 py-1.5 px-3 min-w-[64px] rounded-xl text-zinc-400 hover:text-white active:scale-95 transition-all cursor-pointer"
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] font-mono tracking-tight">Products</span>
        </a>

        {/* Cart with Live Floating Badge Counter */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1.5 px-3 min-w-[64px] rounded-xl text-zinc-400 hover:text-lime-400 active:scale-95 transition-all relative cursor-pointer"
          aria-label="Open Cart Drawer"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full font-mono shadow-md animate-pulse">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono tracking-tight">Cart</span>
        </button>

        {/* WhatsApp Support */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 py-1.5 px-3 min-w-[64px] rounded-xl text-emerald-400 hover:text-emerald-300 active:scale-95 transition-all"
          title="WhatsApp Support"
        >
          <MessageSquare className="w-5 h-5 fill-emerald-400/20" />
          <span className="text-[10px] font-mono tracking-tight">Support</span>
        </a>

      </div>
    </nav>
  );
}
