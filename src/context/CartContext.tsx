'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '@/types';

interface AppliedPromoDetails {
  id?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isAiOpen: boolean;
  setIsAiOpen: (open: boolean) => void;
  itemCount: number;
  totalPriceLkr: number;
  appliedPromo: string | null;
  discountAmountLkr: number;
  applyPromoCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removePromoCode: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [appliedPromoDetails, setAppliedPromoDetails] = useState<AppliedPromoDetails | null>(null);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('zerolag_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('zerolag_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromo(null);
    setAppliedPromoDetails(null);
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setAppliedPromoDetails(null);
  };

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalLkr = cart.reduce((sum, item) => sum + item.product.priceLkr * item.quantity, 0);

  const applyPromoCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      return { success: false, message: 'Please enter a promo code' };
    }

    try {
      const res = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: clean, subtotalLkr })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedPromo(data.promoCode.code);
        setAppliedPromoDetails(data.promoCode);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Invalid promo code' };
      }
    } catch (err: unknown) {
      console.error('Failed to validate promo code:', err);
      return { success: false, message: 'Failed to validate promo code. Please try again.' };
    }
  };

  // Dynamically calculate discount amount based on current cart subtotal and active promo rule
  let calculatedDiscount = 0;
  if (appliedPromoDetails && subtotalLkr > 0) {
    const minOrder = Number(appliedPromoDetails.minOrderAmount) || 0;
    if (minOrder <= 0 || subtotalLkr >= minOrder) {
      if (appliedPromoDetails.discountType === 'percentage') {
        calculatedDiscount = Math.round((subtotalLkr * appliedPromoDetails.discountValue) / 100);
        if (appliedPromoDetails.maxDiscountAmount && calculatedDiscount > appliedPromoDetails.maxDiscountAmount) {
          calculatedDiscount = appliedPromoDetails.maxDiscountAmount;
        }
      } else {
        calculatedDiscount = Math.min(appliedPromoDetails.discountValue, subtotalLkr);
      }
    }
  }

  const discountAmountLkr = Math.max(0, calculatedDiscount);
  const totalPriceLkr = Math.max(0, subtotalLkr - discountAmountLkr);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        isAiOpen,
        setIsAiOpen,
        itemCount,
        totalPriceLkr,
        appliedPromo,
        discountAmountLkr,
        applyPromoCode,
        removePromoCode
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
