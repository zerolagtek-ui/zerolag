/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/productsData';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, CheckCircle2, AlertCircle } from 'lucide-react';

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
    applyPromoCode
  } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const [promoMsg, setPromoMsg] = useState<{ text: string; error: boolean } | null>(null);

  if (!isCartOpen) return null;

  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput) return;
    const success = applyPromoCode(promoInput);
    if (success) {
      setPromoMsg({ text: `Promo code applied! Saved on order`, error: false });
    } else {
      setPromoMsg({ text: 'Invalid promo code. Try ZEROLAG10', error: true });
    }
  };

  const subtotalLkr = cart.reduce((sum, item) => sum + item.product.priceLkr * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        
        <div className="w-screen max-w-md bg-[#0c0e14] text-white border-l border-zinc-800 flex flex-col shadow-2xl transition-colors">
          
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-lime-400" />
              <h2 className="font-extrabold text-lg tracking-wide text-white">YOUR SHOPPING CART</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Listing */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
            {cart.length > 0 ? (
              cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-4 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all"
                >
                  <Link href={`/product/${product.id}`} onClick={() => setIsCartOpen(false)}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 rounded-xl object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                    />
                  </Link>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <Link
                        href={`/product/${product.id}`}
                        onClick={() => setIsCartOpen(false)}
                        className="font-bold text-xs text-white line-clamp-1 hover:text-lime-400 transition-colors"
                      >
                        {product.name}
                      </Link>
                      <p className="text-[10px] text-lime-400 font-mono mt-0.5">{product.brand}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center bg-zinc-950 rounded-lg border border-zinc-800 p-0.5">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="w-6 h-6 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-mono font-bold text-white">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="w-6 h-6 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-xs"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-lime-400">
                          {formatPrice(product.priceLkr * quantity)}
                        </span>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-zinc-400 hover:text-rose-500 transition-colors p-1"
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
              <div className="text-center py-20 text-zinc-500 space-y-3">
                <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto" />
                <p className="text-sm font-mono text-zinc-400">Your shopping cart is empty</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-lime-400 hover:border-lime-400"
                >
                  Explore Tech Hardware
                </button>
              </div>
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-zinc-800 bg-zinc-950 space-y-4">
              
              {/* Promo Code Input */}
              <form onSubmit={handlePromoSubmit} className="space-y-1.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Promo Code (e.g. ZEROLAG10)"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs font-mono text-zinc-200 uppercase focus:border-lime-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold text-lime-400 border border-zinc-700"
                  >
                    Apply
                  </button>
                </div>
                {promoMsg && (
                  <p className={`text-[11px] font-mono flex items-center gap-1 ${promoMsg.error ? 'text-rose-500' : 'text-emerald-400'}`}>
                    {promoMsg.error ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    <span>{promoMsg.text}</span>
                  </p>
                )}
              </form>

              {/* Price Calculation */}
              <div className="space-y-1.5 font-mono text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-zinc-200">{formatPrice(subtotalLkr)}</span>
                </div>
                {discountAmountLkr > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Discount ({appliedPromo}):</span>
                    <span>-{formatPrice(discountAmountLkr)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Islandwide Delivery:</span>
                  <span className="text-emerald-400 font-semibold">FREE</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-zinc-800">
                  <span>Total:</span>
                  <span className="text-lime-400 font-mono">{formatPrice(totalPriceLkr)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  if (onProceedToCheckout) onProceedToCheckout();
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-lime-400/25 hover:scale-[1.01] active:scale-95 transition-all"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
