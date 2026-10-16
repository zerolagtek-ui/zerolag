/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice, getProductSlug } from '@/lib/productsData';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, CheckCircle2, AlertCircle, Truck } from 'lucide-react';

export function CartDrawer({ onProceedToCheckout }: { onProceedToCheckout?: () => void }) {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    totalPriceLkr,
    appliedPromo,
    discountAmountLkr,
    applyPromoCode,
    removePromoCode
  } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const [promoMsg, setPromoMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  if (!isCartOpen) return null;

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    setIsApplyingPromo(true);
    setPromoMsg(null);

    const res = await applyPromoCode(promoInput);
    setIsApplyingPromo(false);

    if (res.success) {
      setPromoMsg({ text: res.message, error: false });
      setPromoInput('');
    } else {
      setPromoMsg({ text: res.message, error: true });
    }
  };

  const handleRemovePromo = () => {
    removePromoCode();
    setPromoMsg(null);
  };

  const subtotalLkr = cart.reduce((sum, item) => sum + item.product.priceLkr * item.quantity, 0);
  const deliveryFee = 400;
  const estimatedTotal = (totalPriceLkr || subtotalLkr - discountAmountLkr) + deliveryFee;

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden">
      
      {/* Dark Backdrop Overlay with Desktop Outside Click Dismissal */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 cursor-pointer animate-fade-in"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      {/* Sliding Drawer Container */}
      <div className="absolute inset-y-0 right-0 w-full sm:max-w-md flex z-[85]">
        
        <div
          className="w-full sm:max-w-md h-full max-h-[100dvh] bg-white dark:bg-[#0c0e14] text-slate-900 dark:text-white border-l border-slate-200 dark:border-zinc-800 flex flex-col shadow-2xl transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950 shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-lime-600 dark:text-lime-400" />
              <h2 className="font-extrabold text-base sm:text-lg tracking-wide text-slate-900 dark:text-white">YOUR SHOPPING CART</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Listing */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800">
            {cart.length > 0 ? (
              cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all overflow-hidden"
                >
                  <Link href={`/product/${getProductSlug(product)}`} onClick={() => setIsCartOpen(false)} className="shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 shrink-0 aspect-square rounded-lg bg-white dark:bg-zinc-900 p-1 object-contain border border-slate-200 dark:border-zinc-800"
                    />
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <Link
                        href={`/product/${getProductSlug(product)}`}
                        onClick={() => setIsCartOpen(false)}
                        className="font-bold text-xs text-slate-900 dark:text-white truncate block hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
                      >
                        {product.name}
                      </Link>
                      <p className="text-[10px] text-lime-600 dark:text-lime-400 font-mono mt-0.5 truncate">{product.brand}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2">
                      <div className="flex items-center bg-white dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800 p-0.5 shrink-0">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="w-6 h-6 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-mono font-bold text-slate-900 dark:text-white">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="w-6 h-6 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center font-bold text-xs"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono font-bold text-lime-600 dark:text-lime-400 whitespace-nowrap">
                          {formatPrice(product.priceLkr * quantity)}
                        </span>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-slate-400 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-slate-400 dark:text-zinc-500 space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-zinc-700 mx-auto" />
                <p className="text-sm font-mono text-slate-600 dark:text-zinc-400">Your shopping cart is empty</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-lime-600 dark:text-lime-400 hover:border-lime-500 cursor-pointer"
                >
                  Explore Tech Hardware
                </button>
              </div>
            )}
          </div>

          {/* Sticky Footer Summary & Checkout CTA */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md space-y-4 shrink-0 shadow-lg">
              
              {/* Promo Code Input or Active Promo Badge */}
              {appliedPromo ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold block">{appliedPromo} APPLIED</span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400">-{formatPrice(discountAmountLkr)} off subtotal</span>
                    </div>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePromoSubmit} className="space-y-1.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-4 h-4 text-slate-400 dark:text-zinc-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Promo Code (e.g. ZEROLAG10)"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs font-mono text-slate-900 dark:text-zinc-200 uppercase focus:border-lime-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isApplyingPromo}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-mono font-bold text-lime-700 dark:text-lime-400 border border-slate-300 dark:border-zinc-700 disabled:opacity-50"
                    >
                      {isApplyingPromo ? '...' : 'Apply'}
                    </button>
                  </div>
                  {promoMsg && (
                    <p className={`text-[11px] font-mono flex items-center gap-1 ${promoMsg.error ? 'text-rose-600 dark:text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {promoMsg.error ? <AlertCircle className="w-3 h-3 shrink-0" /> : <CheckCircle2 className="w-3 h-3 shrink-0" />}
                      <span>{promoMsg.text}</span>
                    </p>
                  )}
                </form>
              )}

              {/* Price Calculation Breakdown */}
              <div className="space-y-2 font-mono text-xs text-slate-600 dark:text-zinc-400 pt-2 border-t border-slate-200 dark:border-zinc-800/80">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-slate-900 dark:text-zinc-200 font-semibold">{formatPrice(subtotalLkr)}</span>
                </div>
                {discountAmountLkr > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Discount ({appliedPromo}):</span>
                    <span>-{formatPrice(discountAmountLkr)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
                    <span>Islandwide Delivery:</span>
                  </span>
                  <span className="text-slate-900 dark:text-zinc-200 font-bold">{formatPrice(400)}</span>
                </div>
                <div className="flex justify-between items-baseline text-sm sm:text-base font-extrabold text-slate-900 dark:text-white pt-2.5 border-t border-slate-200 dark:border-zinc-800">
                  <span>Estimated Total:</span>
                  <span className="text-lime-600 dark:text-lime-400 font-mono text-base sm:text-lg">{formatPrice(estimatedTotal)}</span>
                </div>
              </div>

              {/* High-Contrast Sticky Checkout Action CTA */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  if (onProceedToCheckout) onProceedToCheckout();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-lime-400 via-lime-500 to-emerald-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-between shadow-xl shadow-lime-500/25 hover:shadow-lime-500/40 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer border border-lime-300/40"
              >
                <span>Proceed to Checkout</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold">{formatPrice(estimatedTotal)}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
