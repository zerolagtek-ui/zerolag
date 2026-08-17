/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/productsData';
import { Product } from '@/types';
import { X, Star, ShoppingCart, Shield, Truck, Cpu, Layers } from 'lucide-react';

export function ProductSpecsModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { addToCart } = useCart();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const images = product.galleryImages || [product.image];

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-lime-500/30 rounded-3xl overflow-hidden shadow-2xl my-8 text-slate-900 dark:text-white z-[95]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">

          {/* Gallery View */}
          <div className="space-y-4">
            <div className="relative h-72 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <img
                src={images[activeImageIndex] || product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-all"
              />
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 border border-lime-400/40 font-mono text-[10px] text-lime-400 font-bold">
                {product.brand} ORIGINAL
              </div>
            </div>

            {/* Thumbnail selector */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIndex === idx ? 'border-lime-400 shadow-md shadow-lime-400/20' : 'border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Guarantees Box */}
            <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-lime-600 dark:text-lime-400 shrink-0" />
                <span>100% Genuine Warranty</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Fast Express Courier</span>
              </div>
            </div>
          </div>

          {/* Details & Specifications */}
          <div className="space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-lime-700 dark:text-lime-400 mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span className="uppercase">{product.category}</span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                {product.name}
              </h2>

              {/* Rating */}
              {(() => {
                const revCount = (product as any).reviews?.length || product.reviewsCount || (product as any).reviewCount || 0;
                return revCount > 0 ? (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating || 0) ? 'fill-amber-400' : 'text-slate-400 dark:text-slate-700'}`} />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                      {product.rating ? product.rating.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">({revCount} customer reviews)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex text-slate-400 dark:text-slate-700">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-slate-400 dark:text-slate-700" />
                      ))}
                    </div>
                    <span>No reviews yet</span>
                  </div>
                );
              })()}

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                {product.description}
              </p>

              {/* Hardware Specs Table */}
              <div className="mt-5 space-y-2">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-lime-600 dark:text-lime-400" />
                  <span>TECHNICAL SPECIFICATIONS</span>
                </h4>
                <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 max-h-48 overflow-y-auto space-y-2 scrollbar-thin">
                  {(() => {
                    const specsMap = (product as any).specifications || product.specs || {};
                    const entries = Object.entries(specsMap).filter(([k, v]) => k.trim() && v !== undefined && String(v).trim() !== '');

                    if (entries.length === 0) {
                      return (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono text-center py-2">
                          No technical specifications provided for this product.
                        </p>
                      );
                    }

                    return entries.map(([specKey, specVal]) => (
                      <div key={specKey} className="flex items-start justify-between text-xs py-1 border-b border-slate-200 dark:border-slate-900 last:border-0">
                        <span className="text-slate-500 dark:text-slate-400 font-medium w-1/3">{specKey}</span>
                        <span className="text-slate-900 dark:text-slate-100 font-mono font-semibold w-2/3 text-right">{String(specVal)}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Price & Quantity & Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block">Store Unit Price:</span>
                  <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-lime-400">
                    {formatPrice(product.priceLkr)}
                  </span>
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  {product.inStock ? `In Stock (${product.stockCount})` : 'Out of Stock'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-xs font-mono font-bold text-slate-900 dark:text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => {
                    for (let i = 0; i < quantity; i++) {
                      addToCart(product);
                    }
                    onClose();
                  }}
                  disabled={!product.inStock}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
