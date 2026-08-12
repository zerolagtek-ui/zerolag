'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '@/types';

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
  applyPromoCode: (code: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

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
    setDiscountPercent(0);
  };

  const applyPromoCode = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === 'ZEROLAG10' || clean === 'GAMER10') {
      setAppliedPromo(clean);
      setDiscountPercent(10);
      return true;
    }
    if (clean === 'VIP20' || clean === 'PRO20') {
      setAppliedPromo(clean);
      setDiscountPercent(20);
      return true;
    }
    return false;
  };

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalLkr = cart.reduce((sum, item) => sum + item.product.priceLkr * item.quantity, 0);

  const discountAmountLkr = Math.round((subtotalLkr * discountPercent) / 100);
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
        applyPromoCode
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
