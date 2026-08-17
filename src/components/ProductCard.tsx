/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { formatPrice, getProductSlug } from '@/lib/productsData';
import Image from 'next/image';
import { Star, ShoppingCart, Eye, ShieldCheck, Check } from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=600';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const productSlug = getProductSlug(product);

  const [imgSrc, setImgSrc] = useState<string>(product.image || FALLBACK_IMAGE);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    setImgSrc(product.image || FALLBACK_IMAGE);
  }, [product.image]);

  const sellingPrice = Number(product.priceLkr ?? product.price ?? 0);
  const origPriceVal = Number(product.originalPriceLkr ?? product.originalPrice ?? product.original_price ?? 0);
  const showDiscount = !isNaN(origPriceVal) && origPriceVal > 0 && origPriceVal > sellingPrice;
  const discountPct = showDiscount ? Math.round(((origPriceVal - sellingPrice) / origPriceVal) * 100) : 0;

  const stockCountNum = Number(product.stockCount ?? 0);
  const isOutOfStock = !product.inStock || stockCountNum <= 0;
  const isLowStock = product.inStock && stockCountNum > 0 && stockCountNum <= 3;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addToCart(product);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1200);
  };

  return (
    <div className="group relative rounded-2xl bg-[#0a0c10] border border-zinc-800 text-white shadow-sm hover:border-lime-500/40 hover:shadow-[0_0_25px_rgba(163,230,53,0.15)] p-2.5 sm:p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">

      {/* Badge Overlay - Discount % or custom badge */}
      {showDiscount && discountPct > 0 ? (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 px-2 py-0.5 sm:py-1 rounded-md bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 text-slate-950 font-black text-[9px] sm:text-[10px] tracking-wider uppercase shadow-lg shadow-rose-500/20 pointer-events-none flex items-center gap-0.5">
          <span>-{discountPct}% OFF</span>
        </div>
      ) : product.badge ? (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 font-extrabold text-[8px] sm:text-[10px] tracking-wider uppercase shadow-md pointer-events-none">
          {product.badge}
        </div>
      ) : null}

      {/* Stock Status Pill */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 pointer-events-none">
        {isOutOfStock ? (
          <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-950/90 backdrop-blur-sm border border-rose-500/50 text-rose-300 text-[8px] sm:text-[10px] font-mono font-bold">
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-950/90 backdrop-blur-sm border border-amber-500/60 text-amber-400 text-[8px] sm:text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Only {stockCountNum} left</span>
          </span>
        ) : (
          <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-emerald-500/40 text-emerald-400 text-[8px] sm:text-[10px] font-mono font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">In Stock ({stockCountNum})</span>
            <span className="sm:hidden">Stock</span>
          </span>
        )}
      </div>

      {/* Image Container */}
      <Link
        href={`/product/${productSlug}`}
        className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#0c0d12] border border-zinc-800/80 p-3 sm:p-4 mb-2 sm:mb-4 flex items-center justify-center cursor-pointer group/img block"
      >
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
          onError={() => {
            if (imgSrc !== FALLBACK_IMAGE) {
              setImgSrc(FALLBACK_IMAGE);
            }
          }}
          className={`object-contain p-3 group-hover/img:scale-105 transition-transform duration-300 ${
            isOutOfStock ? 'grayscale opacity-50' : ''
          }`}
        />

        {/* Desaturated Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <span className="px-3 py-1 rounded-lg bg-zinc-900/90 border border-zinc-700 text-zinc-300 font-mono text-[10px] font-bold uppercase tracking-widest">
              Sold Out
            </span>
          </div>
        )}

        {!isOutOfStock && (
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 sm:group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
            <span className="px-3.5 py-2 rounded-xl bg-slate-900 border border-lime-400/60 text-lime-300 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-lime-400/20">
              <Eye className="w-4 h-4 text-lime-400" />
              <span>View Product</span>
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="space-y-1.5 sm:space-y-2 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Rating */}
          {(() => {
            const revCount = (product as any).reviews?.length || product.reviewsCount || (product as any).reviewCount || 0;
            return (
              <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-zinc-400 font-mono">
                <span className="truncate max-w-[80px] sm:max-w-none">{product.brand}</span>
                {revCount > 0 ? (
                  <div className="flex items-center gap-0.5 sm:gap-1 text-amber-400 font-bold">
                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400" />
                    <span>{product.rating ? product.rating.toFixed(1) : '0.0'}</span>
                    <span className="text-zinc-500 hidden sm:inline">({revCount})</span>
                  </div>
                ) : (
                  <span className="text-zinc-500 text-[9px] sm:text-[10px]">No reviews yet</span>
                )}
              </div>
            );
          })()}

          {/* Product Name */}
          <h3 className="font-semibold text-white text-xs sm:text-sm mt-1 line-clamp-2 hover:text-lime-400 transition-colors leading-snug">
            <Link href={`/product/${productSlug}`}>
              {product.name}
            </Link>
          </h3>

          {/* Specs Highlights */}
          {product.specs && (
            <div className="hidden sm:flex flex-wrap gap-1.5 mt-2.5">
              {Object.entries(product.specs).slice(0, 2).map(([key, val]) => (
                <span key={key} className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono">
                  {val.length > 22 ? `${val.substring(0, 22)}...` : val}
                </span>
              ))}
            </div>
          )}

          {product.warranty && (
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-400 font-mono mt-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>{product.warranty}</span>
            </div>
          )}
        </div>

        {/* Pricing & Actions */}
        <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-zinc-800/80 flex items-center justify-between gap-1">
          <Link href={`/product/${productSlug}`} className="cursor-pointer truncate">
            {showDiscount && (
              <span className="text-[9px] sm:text-[11px] text-zinc-500 line-through block font-mono">
                {formatPrice(origPriceVal)}
              </span>
            )}
            <span className="text-xs sm:text-base font-bold font-mono text-lime-400 truncate block">
              {formatPrice(sellingPrice)}
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <Link
              href={`/product/${productSlug}`}
              className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-all"
              title="View Details"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-extrabold flex items-center gap-1 transition-all transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${
                isAdded
                  ? 'bg-emerald-400 text-slate-950 scale-105 shadow-md shadow-emerald-400/30'
                  : 'bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 hover:shadow-lg hover:shadow-lime-400/25 hover:scale-105'
              }`}
              aria-label={`Add ${product.name} to cart`}
              title={isAdded ? 'Added to Cart!' : 'Add to Cart'}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  <span className="text-[10px] sm:text-xs font-mono hidden xs:inline">Added!</span>
                </>
              ) : (
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
