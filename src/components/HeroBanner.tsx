/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { HeroSlide, Product } from '@/types';
import { getHeroSlides, getStoredProducts } from '@/lib/storeManager';
import { formatPrice } from '@/lib/productsData';
import { ArrowRight, ShieldCheck, Zap, ChevronLeft, ChevronRight, Pause, Play, Eye } from 'lucide-react';

export function HeroBanner() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const syncData = () => {
    const allSlides = getHeroSlides();
    const active = allSlides.filter(s => s.isActive);
    setSlides(active.length > 0 ? active : allSlides);
    setProducts(getStoredProducts());
  };

  useEffect(() => {
    syncData();
    window.addEventListener('zerolag-slides-updated', syncData);
    window.addEventListener('zerolag-products-updated', syncData);
    return () => {
      window.removeEventListener('zerolag-slides-updated', syncData);
      window.removeEventListener('zerolag-products-updated', syncData);
    };
  }, []);

  // Auto-slide timer
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex % slides.length];
  const featuredProduct = products.find(p => p.id === currentSlide.featuredProductId) || products[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative bg-black text-white py-12 md:py-20 border-b border-zinc-800 overflow-hidden transition-colors"
    >
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-lime-500/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-left animate-fade-in key={currentSlide.id}">
            
            {/* Top Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-500/10 border border-lime-400/30 text-lime-400 font-mono text-xs font-bold tracking-wider">
              <Zap className="w-4 h-4 text-lime-400 fill-lime-400/20" />
              <span>{currentSlide.badgeText}</span>
            </div>

            {/* Main Cyber Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              {currentSlide.titleFirstLine}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400">
                {currentSlide.titleHighlight}
              </span>
            </h1>

            {/* Paragraph Description */}
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-xl">
              {currentSlide.description}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={currentSlide.primaryButtonLink || '#catalog'}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-lime-400/20 hover:scale-105 active:scale-95 transition-all"
              >
                <span>{currentSlide.primaryButtonText || 'EXPLORE CATALOG'}</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              {featuredProduct && (
                <Link
                  href={`/product/${featuredProduct.id}`}
                  className="px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <Eye className="w-4 h-4 text-lime-400" />
                  <span>VIEW SPECS & PRICING</span>
                </Link>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-zinc-800 max-w-lg text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-lime-400 shrink-0" />
                <span>Genuine Warranty</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Express Courier</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>PayHere & Payzy</span>
              </div>
            </div>

          </div>

          {/* Right Preview Showcase Column */}
          <div className="lg:col-span-5 relative flex justify-center">
            {featuredProduct && (
              <div className="w-full max-w-md bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative group hover:border-lime-400/40 transition-colors">
                
                {/* Badge Overlay */}
                <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-lime-400 text-slate-950 text-[10px] font-mono font-extrabold">
                  {featuredProduct.badge || 'FLAGSHIP'}
                </div>

                {/* Product Featured Image */}
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-950 mb-4 border border-zinc-800">
                  <img
                    src={currentSlide.customImageUrl || featuredProduct.image}
                    alt={featuredProduct.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Info Card */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-lime-400 uppercase tracking-widest block">
                    {featuredProduct.brand} • {featuredProduct.category}
                  </span>
                  <Link href={`/product/${featuredProduct.id}`} className="font-extrabold text-white text-base block hover:text-lime-400 transition-colors truncate">
                    {featuredProduct.name}
                  </Link>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xs text-zinc-500 font-mono block">Special Price</span>
                      <span className="text-xl font-extrabold text-lime-400 font-mono">
                        {formatPrice(featuredProduct.priceLkr)}
                      </span>
                    </div>

                    <Link
                      href={`/product/${featuredProduct.id}`}
                      className="px-4 py-2 rounded-xl bg-lime-400 text-slate-950 font-bold text-xs hover:bg-lime-300 transition-all flex items-center gap-1"
                    >
                      <span>Buy Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Carousel Navigation Bar & Slide Dot Indicators */}
        {slides.length > 1 && (
          <div className="mt-8 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    currentIndex === idx
                      ? 'w-8 bg-lime-400'
                      : 'w-2 bg-zinc-800 hover:bg-zinc-700'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-400 mr-2 hidden sm:inline-flex items-center gap-1">
                {isPaused ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-lime-400" />}
                <span>{isPaused ? 'Paused on Hover' : 'Auto-Rotating Slide'}</span>
              </span>

              <button
                onClick={handlePrev}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-lime-400 transition-colors"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleNext}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-lime-400 transition-colors"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
