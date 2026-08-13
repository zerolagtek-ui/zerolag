/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { HeroSlide, Product } from '@/types';
import { getHeroSlides, getStoredProducts, syncHeroSlidesFromSupabase, formatSlideImageUrl } from '@/lib/storeManager';
import { formatPrice, getProductSlug } from '@/lib/productsData';
import { ArrowRight, ShieldCheck, Zap, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export function HeroBanner() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const syncData = async () => {
    const fetchedSlides = await syncHeroSlidesFromSupabase();
    const active = fetchedSlides.filter(s => s.isActive !== false);
    setSlides(active.length > 0 ? active : fetchedSlides);
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
    }, 6000);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex % slides.length];
  const featuredProduct = products.find(p => p.id === currentSlide?.featuredProductId) || products[0];

  // Resolve title
  const rawTitle = currentSlide?.title || (currentSlide?.titleFirstLine ? `${currentSlide.titleFirstLine} ${currentSlide.titleHighlight || ''}`.trim() : '');
  const slideTitle = rawTitle || 'PREMIER GAMING HARDWARE STORE';

  // Resolve badge/tagline
  const slideBadge = currentSlide?.badge || currentSlide?.badgeText || 'ZERO LAG STORE';

  // Resolve subtitle/description
  const slideSubtitle = currentSlide?.subtitle || currentSlide?.description || 'High performance gear, zero-latency mice, mechanical keyboards & gaming accessories with islandwide delivery.';

  // Resolve image URL
  const rawImage = currentSlide?.customImageUrl || (featuredProduct ? featuredProduct.image : '');
  const slideImgSrc = formatSlideImageUrl(rawImage);
  const isImageBroken = imageErrors[currentSlide?.id] || !slideImgSrc;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative w-full rounded-3xl overflow-hidden bg-zinc-950/90 border border-white/10 shadow-2xl"
      >
        {/* Background Ambient Glows & Grid */}
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-lime-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

        {/* Responsive Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center min-h-[420px] lg:min-h-[480px] p-6 sm:p-8 lg:p-12 gap-8">
          
          {/* Left Content Column */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-4 z-10">
            
            {/* Badge / Tagline */}
            <div>
              <span className="text-xs font-bold tracking-widest text-lime-400 uppercase bg-lime-500/10 border border-lime-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>{slideBadge}</span>
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-xl">
              {slideTitle}
            </h1>

            {/* Subtitle / Description */}
            <p className="text-sm md:text-base text-gray-400 max-w-lg line-clamp-2 md:line-clamp-3 leading-relaxed">
              {slideSubtitle}
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={currentSlide?.primaryButtonLink || '#catalog'}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-lime-400/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span>{currentSlide?.primaryButtonText || 'EXPLORE CATALOG'}</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              {featuredProduct && (
                <Link
                  href={`/product/${getProductSlug(featuredProduct)}`}
                  className="px-5 py-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-white/10 font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-lime-400" />
                  <span>VIEW SPECS & PRICING</span>
                </Link>
              )}
            </div>

            {/* Trust Badges Bar */}
            <div className="pt-4 border-t border-white/10 w-full max-w-lg grid grid-cols-3 gap-2 text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                <span className="truncate">Official Warranty</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Islandwide Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">PayHere & Payzy</span>
              </div>
            </div>

          </div>

          {/* Right Image Column */}
          <div className="lg:col-span-5 flex items-center justify-center relative w-full h-[260px] sm:h-[320px] lg:h-full z-10">
            <div className="relative w-full max-w-md h-full flex items-center justify-center">
              {!isImageBroken ? (
                <img
                  src={slideImgSrc}
                  alt={slideTitle}
                  className="w-full h-full object-contain max-h-[350px] drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] rounded-xl transition-all duration-500 hover:scale-105"
                  onError={() => {
                    if (currentSlide?.id) {
                      setImageErrors(prev => ({ ...prev, [currentSlide.id]: true }));
                    }
                  }}
                />
              ) : (
                <div className="w-full h-64 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-slate-900 border border-white/10 p-6 flex flex-col items-center justify-center text-center shadow-xl">
                  <div className="w-12 h-12 rounded-2xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 mb-3 shadow-lg shadow-lime-400/10">
                    <Zap className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="font-extrabold text-white text-base max-w-xs line-clamp-2 mb-1">
                    {featuredProduct ? featuredProduct.name : slideTitle}
                  </h3>
                  <p className="text-xs font-mono text-lime-400">
                    {featuredProduct ? `${featuredProduct.brand} • ${formatPrice(featuredProduct.priceLkr)}` : 'ZeroLag Gaming Hardware'}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Carousel Controls (Bottom Center Dots & Bottom Right Arrows) */}
        {slides.length > 1 && (
          <>
            {/* Bottom Center Indicator Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx
                      ? 'w-6 bg-lime-400'
                      : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Bottom Right Arrow Controls */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center space-x-2 bg-black/60 backdrop-blur-md border border-white/10 p-1.5 rounded-xl shadow-lg">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono text-zinc-400 px-1">
                {currentIndex + 1}/{slides.length}
              </span>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
