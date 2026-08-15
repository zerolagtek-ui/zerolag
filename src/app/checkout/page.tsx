'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/productsData';
import { addStoredOrder, getStoredShippingRates, syncShippingRatesFromDatabase } from '@/lib/storeManager';
import { preparePayHereForm, loadPayHereSDK } from '@/lib/payhere';
import { PaymentMethod, ShippingOption } from '@/types';
import { ShieldCheck, Truck, Lock, ArrowLeft, CheckCircle2, ShoppingBag, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckoutPage() {
  const { cart, totalPriceLkr, discountAmountLkr, clearCart } = useCart();

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string>('trans-express');
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    async function loadShippingRates() {
      const cached = getStoredShippingRates();
      const activeCached = cached.filter(s => s.enabled);
      setShippingOptions(activeCached.length > 0 ? activeCached : cached);
      if (activeCached.length > 0) {
        setSelectedShippingId(activeCached[0].id);
      }

      const synced = await syncShippingRatesFromDatabase();
      const activeSynced = synced.filter(s => s.enabled);
      if (activeSynced.length > 0) {
        setShippingOptions(activeSynced);
        if (!activeSynced.some(s => s.id === selectedShippingId)) {
          setSelectedShippingId(activeSynced[0].id);
        }
      }
    }
    loadShippingRates();
    loadPayHereSDK().catch(() => {});
  }, []);

  const activeShipping = shippingOptions.find(s => s.id === selectedShippingId) || shippingOptions[0] || {
    id: 'trans-express',
    name: 'Trans Express',
    description: 'Fast Islandwide Courier (1-2 Days)',
    rate: 475,
    enabled: true
  };

  const shippingFee = Number(activeShipping.rate || 0);
  const subtotal = totalPriceLkr + discountAmountLkr;
  const totalAmount = totalPriceLkr + shippingFee;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Colombo',
    postalCode: '00100',
    paymentMethod: 'bank-transfer' as PaymentMethod,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (paymentError) setPaymentError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmitting(true);
    setPaymentError('');
    const generatedOrderId = `ZLAG-${Math.floor(100000 + Math.random() * 900000)}`;
    const fullName = `${formData.firstName} ${formData.lastName}`.trim() || 'Valued Customer';

    const newOrderPayload = {
      id: generatedOrderId,
      customerName: fullName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      paymentMethod: formData.paymentMethod,
      shippingMethod: activeShipping.name,
      shippingFee: shippingFee,
      paymentStatus: formData.paymentMethod === 'cod' || formData.paymentMethod === 'bank-transfer' ? ('Pending' as const) : ('Paid' as const),
      orderStatus: 'Pending' as const,
      items: cart,
      subtotalLkr: subtotal,
      discountLkr: discountAmountLkr,
      shippingLkr: shippingFee,
      totalLkr: totalAmount,
      createdAt: new Date().toISOString(),
    };

    const emailPayload = {
      orderId: generatedOrderId,
      customerName: fullName,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      shippingAddress: `${formData.address}, ${formData.city}, ${formData.postalCode}`,
      paymentMethod: formData.paymentMethod,
      shippingMethod: activeShipping.name,
      items: cart.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.priceLkr,
        total: item.product.priceLkr * item.quantity,
      })),
      subtotal: subtotal,
      shippingFee: shippingFee,
      totalAmount: totalAmount,
      orderDate: new Date().toISOString(),
    };

    // PayHere Gateway Sandbox Integration
    if (formData.paymentMethod === 'payhere') {
      try {
        await loadPayHereSDK();
        const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

        const hashRes = await fetch('/api/payhere/hash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: generatedOrderId,
            amount: totalAmount,
            currency: 'LKR'
          })
        });

        const hashData = await hashRes.json();
        if (!hashRes.ok || !hashData.success) {
          throw new Error(hashData.error || 'Failed to generate PayHere payment hash');
        }

        const payhereParams = preparePayHereForm(newOrderPayload, originUrl, hashData.hash);

        const winAny = window as any;
        if (winAny.payhere) {
          winAny.payhere.onCompleted = function onCompleted(orderId: string) {
            const completedPayload = {
              ...newOrderPayload,
              paymentStatus: 'Paid' as const,
              paymentMethod: 'payhere' as const
            };
            addStoredOrder(completedPayload);
            fetch('/api/send-order-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(emailPayload)
            }).catch(() => {});

            setConfirmedOrderId(orderId || generatedOrderId);
            setOrderConfirmed(true);
            setIsSubmitting(false);
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
            clearCart();
          };

          winAny.payhere.onDismissed = function onDismissed() {
            setIsSubmitting(false);
            setPaymentError('PayHere payment window was closed before completion. Please try again or select another payment option.');
          };

          winAny.payhere.onError = function onError(error: string) {
            console.error('PayHere Gateway Error:', error);
            setIsSubmitting(false);
            setPaymentError(`PayHere Payment Error: ${error || 'Transaction failed'}. Please try again.`);
          };

          winAny.payhere.startPayment(payhereParams);
          return;
        } else {
          throw new Error('PayHere SDK is not loaded properly.');
        }
      } catch (err: any) {
        console.error('PayHere init failed:', err);
        setIsSubmitting(false);
        setPaymentError(err.message || 'Failed to initialize PayHere Checkout.');
        return;
      }
    }

    addStoredOrder(newOrderPayload);

    fetch('/api/send-order-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailPayload),
    }).catch(err => console.error('Background email dispatch failed:', err));

    setTimeout(() => {
      setIsSubmitting(false);
      setConfirmedOrderId(generatedOrderId);
      setOrderConfirmed(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
      });
      clearCart();
    }, 1200);
  };

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '94741117981';
  const whatsappSlipUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hello ZeroLag Tek! Here is my payment receipt for Order #${confirmedOrderId} (${activeShipping.name} - ${formatPrice(shippingFee)})`
  )}`;

  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0a0c10] border border-zinc-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-lime-400/20 text-lime-400 border border-lime-400/40 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">ORDER CONFIRMED!</h1>
            <p className="text-xs font-mono text-zinc-400 mt-1">Order Reference: <span className="text-lime-400 font-bold">#{confirmedOrderId}</span></p>
          </div>
          <p className="text-xs text-zinc-300 font-sans leading-relaxed">
            Thank you for shopping with ZeroLag Tek Store! An order confirmation receipt has been sent to your email.
          </p>

          <div className="pt-2 space-y-3">
            <a
              href={whatsappSlipUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors font-mono"
            >
              <span>SEND WHATSAPP RECEIPT (+94741117981)</span>
            </a>

            <Link
              href="/"
              className="w-full py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 hover:text-lime-400 transition-colors font-mono block"
            >
              <span>RETURN TO STOREFRONT</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 sm:py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 text-xs font-mono">
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-lime-400">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Storefront</span>
          </Link>
          <div className="flex items-center gap-1.5 text-lime-400 font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">256-BIT ENCRYPTED CHECKOUT</span>
            <span className="sm:hidden">ENCRYPTED</span>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="bg-[#0a0c10] border border-zinc-800 rounded-3xl p-8 sm:p-12 text-center space-y-4">
            <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto" />
            <h2 className="text-lg font-bold">Your Cart is Currently Empty</h2>
            <p className="text-xs text-zinc-400">Add high performance gaming gear before proceeding to checkout.</p>
            <Link href="/" className="inline-block px-6 py-3 rounded-xl bg-lime-400 text-black font-bold text-xs font-mono">
              BROWSE CATALOG
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            
            {/* Form Column */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-[#0a0c10] border border-zinc-800 rounded-3xl p-4 sm:p-6 md:p-8 space-y-6">
                
                <div>
                  <h2 className="text-sm font-mono font-bold text-lime-400 uppercase tracking-wider mb-4">
                    1. Customer Information
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-mono text-zinc-400 block mb-1">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Kasun"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-lime-400 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-zinc-400 block mb-1">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Perera"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-lime-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-xs font-mono text-zinc-400 block mb-1">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="kasun@example.com"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-lime-400 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-zinc-400 block mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="0771234567"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-lime-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <h2 className="text-sm font-mono font-bold text-lime-400 uppercase tracking-wider mb-4">
                    2. Shipping Address
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-mono text-zinc-400 block mb-1">Street Address *</label>
                      <input
                        type="text"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="No. 45, Main Street"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-lime-400 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-zinc-400 block mb-1">City *</label>
                        <input
                          type="text"
                          name="city"
                          required
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-lime-400 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono text-zinc-400 block mb-1">Postal Code *</label>
                        <input
                          type="text"
                          name="postalCode"
                          required
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-lime-400 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Method Selector */}
                <div className="pt-4 border-t border-zinc-800">
                  <h2 className="text-sm font-mono font-bold text-lime-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                    <span>3. Select Delivery Method</span>
                    <Truck className="w-4 h-4 text-lime-400" />
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                    {shippingOptions.filter(s => s.enabled).map((option) => (
                      <label
                        key={option.id}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          selectedShippingId === option.id
                            ? 'border-lime-400 bg-lime-500/10 text-lime-400 shadow-md shadow-lime-400/10'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={option.id}
                          checked={selectedShippingId === option.id}
                          onChange={() => setSelectedShippingId(option.id)}
                          className="hidden"
                        />
                        <div>
                          <span className="font-bold block text-white text-xs mb-0.5">{option.name}</span>
                          <span className="text-[10px] text-zinc-400 block leading-tight">{option.description}</span>
                        </div>
                        <span className="mt-3 font-extrabold text-lime-400 text-xs block">
                          + {formatPrice(option.rate)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <h2 className="text-sm font-mono font-bold text-lime-400 uppercase tracking-wider mb-4">
                    4. Payment Method
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                    <label className={`p-4 rounded-xl border cursor-pointer transition-colors ${formData.paymentMethod === 'bank-transfer' ? 'border-lime-400 bg-lime-500/10 text-lime-400' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank-transfer"
                        checked={formData.paymentMethod === 'bank-transfer'}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className="font-bold block text-white">Bank Transfer</span>
                      <span className="text-[10px]">Commercial Bank Online Deposit</span>
                    </label>

                    <label className={`p-4 rounded-xl border cursor-pointer transition-colors ${formData.paymentMethod === 'payhere' ? 'border-lime-400 bg-lime-500/10 text-lime-400' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="payhere"
                        checked={formData.paymentMethod === 'payhere'}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className="font-bold block text-white">PayHere Gateway</span>
                      <span className="text-[10px]">Visa / MasterCard / Genie</span>
                    </label>

                    <label className={`p-4 rounded-xl border cursor-pointer transition-colors ${formData.paymentMethod === 'payzy' ? 'border-lime-400 bg-lime-500/10 text-lime-400' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="payzy"
                        checked={formData.paymentMethod === 'payzy'}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className="font-bold block text-white">Payzy Gateway</span>
                      <span className="text-[10px]">Direct Digital Checkout</span>
                    </label>

                    <label className={`p-4 rounded-xl border cursor-pointer transition-colors ${formData.paymentMethod === 'cod' ? 'border-lime-400 bg-lime-500/10 text-lime-400' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className="font-bold block text-white">Cash on Delivery</span>
                      <span className="text-[10px]">Pay Cash to Courier</span>
                    </label>
                  </div>
                </div>

              </div>
            </div>

            {/* Order Summary Column */}
            <div className="space-y-6">
              <div className="bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
                <h3 className="font-bold text-white uppercase text-sm border-b border-zinc-800 pb-3">Order Summary</h3>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-zinc-300 text-xs">
                      <div>
                        <p className="font-bold text-white line-clamp-1">{item.product.name}</p>
                        <p className="text-[10px] text-zinc-500">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-lime-400 font-bold">{formatPrice(item.product.priceLkr * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-zinc-800 space-y-2 text-zinc-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-white">{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmountLkr > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount</span>
                      <span>-{formatPrice(discountAmountLkr)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping Fee ({activeShipping.name})</span>
                    <span className="text-lime-400 font-bold">{formatPrice(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-white font-extrabold pt-2 border-t border-zinc-800">
                    <span>Total Amount</span>
                    <span className="text-lime-400">{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                {paymentError && (
                  <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-extrabold text-sm shadow-lg shadow-lime-400/20 hover:scale-[1.01] transition-transform disabled:opacity-60 mt-4 cursor-pointer"
                >
                  {isSubmitting ? 'Processing Order...' : 'PLACE ORDER NOW'}
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
