'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/productsData';
import {
  addStoredOrder,
  getStoredOrders,
  updateOrderPaymentStatus,
  getStoredShippingRates,
  syncShippingRatesFromDatabase
} from '@/lib/storeManager';
import { preparePayHereForm, submitPayHereForm } from '@/lib/payhere';
import { OrderDetails, PaymentMethod, ShippingOption } from '@/types';
import { ShieldCheck, Truck, Lock, ArrowLeft, CheckCircle2, ShoppingBag, AlertCircle, Printer } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckoutPage() {
  const { cart, totalPriceLkr, discountAmountLkr, clearCart } = useCart();

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string>('trans-express');
  const [paymentError, setPaymentError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [confirmedOrderDetails, setConfirmedOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    async function initCheckoutPage() {
      // 1. Check for Payzy / PayHere return query parameters
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const xOrderId = urlParams.get('x_order_id') || urlParams.get('order_id');
        const responseCode = urlParams.get('response_code');
        const signature = urlParams.get('signature');

        if (xOrderId && responseCode) {
          if (responseCode === '00') {
            // Verify with Payzy server endpoint
            fetch('/api/payzy/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                x_order_id: xOrderId,
                response_code: responseCode,
                signature
              })
            }).catch(err => console.error('Payzy verification error:', err));

            clearCart();
            setConfirmedOrderId(xOrderId);

            let matchedOrder = getStoredOrders().find(o => o.id === xOrderId);
            if (matchedOrder) {
              matchedOrder.paymentStatus = 'Paid';
              updateOrderPaymentStatus(xOrderId, 'Paid');
              setConfirmedOrderDetails(matchedOrder);

              fetch('/api/send-order-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: matchedOrder.id,
                  customerName: matchedOrder.customerName,
                  customerEmail: matchedOrder.email,
                  customerPhone: matchedOrder.phone,
                  secondaryPhone: matchedOrder.secondaryPhone || '',
                  shippingAddress: `${matchedOrder.address}, ${matchedOrder.city}, ${matchedOrder.postalCode}`,
                  paymentMethod: matchedOrder.paymentMethod,
                  shippingMethod: matchedOrder.shippingMethod,
                  items: matchedOrder.items.map(item => ({
                    name: item.product.name,
                    quantity: item.quantity,
                    price: item.product.priceLkr,
                    total: item.product.priceLkr * item.quantity,
                  })),
                  subtotal: matchedOrder.subtotalLkr,
                  shippingFee: matchedOrder.shippingLkr,
                  totalAmount: matchedOrder.totalLkr,
                  orderDate: matchedOrder.createdAt,
                }),
              }).catch(err => console.error('Email dispatch error:', err));
            }

            setOrderConfirmed(true);
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.5 },
            });
          } else {
            setPaymentError('Payzy Transaction Failed or Cancelled. Please try again or choose another payment method.');
          }
        } else if (xOrderId && !responseCode) {
          clearCart();
          setConfirmedOrderId(xOrderId);

          let matchedOrder = getStoredOrders().find(o => o.id === xOrderId);
          if (!matchedOrder) {
            try {
              const res = await fetch(`/api/orders?order_id=${encodeURIComponent(xOrderId)}`);
              if (res.ok) {
                const data = await res.json();
                if (data.order) {
                  matchedOrder = {
                    id: data.order.id,
                    customerName: data.order.customer_name,
                    email: data.order.customer_email,
                    phone: data.order.customer_phone,
                    address: data.order.shipping_address,
                    city: 'Colombo',
                    postalCode: '',
                    paymentMethod: data.order.payment_method || 'payhere',
                    shippingMethod: data.order.shipping_method || 'Trans Express',
                    shippingFee: data.order.shipping_fee || 0,
                    paymentStatus: 'Paid',
                    orderStatus: data.order.status || 'Pending',
                    items: data.order.items || [],
                    subtotalLkr: data.order.subtotal || 0,
                    discountLkr: 0,
                    shippingLkr: data.order.shipping_fee || 0,
                    totalLkr: data.order.total_amount || 0,
                    createdAt: data.order.created_at || new Date().toISOString()
                  };
                }
              }
            } catch (err) {
              console.error('Failed to fetch order details:', err);
            }
          }

          if (matchedOrder) {
            matchedOrder.paymentStatus = 'Paid';
            updateOrderPaymentStatus(xOrderId, 'Paid');
            setConfirmedOrderDetails(matchedOrder);

            fetch('/api/send-order-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: matchedOrder.id,
                customerName: matchedOrder.customerName,
                customerEmail: matchedOrder.email,
                customerPhone: matchedOrder.phone,
                secondaryPhone: matchedOrder.secondaryPhone || '',
                shippingAddress: `${matchedOrder.address}, ${matchedOrder.city}, ${matchedOrder.postalCode}`,
                paymentMethod: matchedOrder.paymentMethod,
                shippingMethod: matchedOrder.shippingMethod,
                items: matchedOrder.items.map(item => ({
                  name: item.product.name,
                  quantity: item.quantity,
                  price: item.product.priceLkr,
                  total: item.product.priceLkr * item.quantity,
                })),
                subtotal: matchedOrder.subtotalLkr,
                shippingFee: matchedOrder.shippingLkr,
                totalAmount: matchedOrder.totalLkr,
                orderDate: matchedOrder.createdAt,
              }),
            }).catch(err => console.error('Email dispatch error:', err));
          }

          setOrderConfirmed(true);
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.5 },
          });
        }
      }

      // 2. Load Shipping Rates
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

    initCheckoutPage();
  }, []);

  const activeShipping = shippingOptions.find(s => s.id === selectedShippingId) || shippingOptions[0] || {
    id: 'trans-express',
    name: 'Trans Express',
    description: 'Fast Islandwide Courier (1-2 Days)',
    rate: 475,
    enabled: true
  };

  const shippingFee = Number(activeShipping.rate || 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.priceLkr * item.quantity, 0);
  const promoDiscount = discountAmountLkr || 0;
  const baseTotal = subtotal - promoDiscount + shippingFee;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    secondaryPhone: '',
    address: '',
    city: 'Colombo',
    postalCode: '00100',
    paymentMethod: 'bank-transfer' as PaymentMethod,
  });

  // Payment Method Adjustment (-3% for Bank Transfer, +10% on baseTotal for Payzy)
  let paymentMethodAdjustment = 0;
  if (formData.paymentMethod === 'bank-transfer') {
    paymentMethodAdjustment = -(subtotal * 0.03);
  } else if (formData.paymentMethod === 'payzy') {
    paymentMethodAdjustment = +(baseTotal * 0.10);
  }

  const totalAmount = Math.max(0, Math.round(baseTotal + paymentMethodAdjustment));

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

    const newOrderPayload: OrderDetails = {
      id: generatedOrderId,
      customerName: fullName,
      email: formData.email,
      phone: formData.phone,
      secondaryPhone: formData.secondaryPhone || undefined,
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
      discountLkr: promoDiscount,
      shippingLkr: shippingFee,
      totalLkr: totalAmount,
      createdAt: new Date().toISOString(),
    };

    const emailPayload = {
      orderId: generatedOrderId,
      customerName: fullName,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      secondaryPhone: formData.secondaryPhone || '',
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

    // Payzy Gateway Integration (Direct Server Signing & Redirection)
    if (formData.paymentMethod === 'payzy') {
      try {
        const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

        // Save order (DO NOT send email yet for online payments)
        addStoredOrder(newOrderPayload);

        const payzyRes = await fetch('/api/payzy/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: generatedOrderId,
            amount: totalAmount,
            freight: shippingFee,
            first_name: formData.firstName || 'Customer',
            last_name: formData.lastName || '',
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            city: formData.city,
            response_url: `${originUrl}/checkout?order_id=${generatedOrderId}`
          })
        });

        const payzyData = await payzyRes.json();
        if (payzyRes.ok && payzyData.success && payzyData.redirectUrl) {
          clearCart();
          window.location.href = payzyData.redirectUrl;
          return;
        } else {
          const errMsg = payzyData.message || (payzyData.error?.message ? payzyData.error.message : (typeof payzyData.error === 'string' ? payzyData.error : 'Payzy payment initialization failed.'));
          throw new Error(errMsg);
        }
      } catch (err: any) {
        console.error('Payzy execution error:', err);
        setPaymentError(err.message || 'Payzy payment initialization failed.');
        setIsSubmitting(false);
        return;
      }
    }

    // PayHere Gateway Integration (Direct HTML Form POST Submission)
    if (formData.paymentMethod === 'payhere') {
      try {
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
        if (!hashRes.ok || !hashData.hash) {
          throw new Error(hashData.message || hashData.error || 'Failed to generate PayHere payment hash');
        }

        // Save Order (DO NOT send email yet for online payments)
        addStoredOrder(newOrderPayload);
        clearCart();

        const payhereParams = preparePayHereForm(newOrderPayload, originUrl, hashData.hash);
        submitPayHereForm(payhereParams);
        return;
      } catch (err: any) {
        console.error('PayHere execution error:', err);
        setPaymentError(err.message || 'PayHere payment initialization failed.');
        setIsSubmitting(false);
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
      setConfirmedOrderDetails(newOrderPayload);
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
    `Hello ZeroLag Tek! Here is my payment receipt for Order #${confirmedOrderId} (${confirmedOrderDetails?.shippingMethod || activeShipping.name} - ${formatPrice(confirmedOrderDetails?.shippingLkr || shippingFee)})`
  )}`;

  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="max-w-xl w-full bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-lime-400/20 text-lime-400 border border-lime-400/40 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-white">ORDER CONFIRMED!</h1>
            <p className="text-xs font-mono text-zinc-400 mt-1">Order Reference: <span className="text-lime-400 font-bold">#{confirmedOrderId}</span></p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PAID VIA PAYHERE GATEWAY</span>
            </div>
          </div>

          <p className="text-xs text-zinc-300 font-sans text-center leading-relaxed">
            Thank you for shopping with ZeroLag Tek Store! Your order has been placed and payment confirmed. An order receipt has been sent to your email.
          </p>

          {/* Receipt Breakdown */}
          {confirmedOrderDetails && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4 text-xs font-mono">
              <h3 className="font-bold text-white uppercase text-xs border-b border-zinc-800 pb-2 flex items-center justify-between">
                <span>Receipt Breakdown</span>
                <span className="text-zinc-500 font-normal">{new Date(confirmedOrderDetails.createdAt || Date.now()).toLocaleDateString()}</span>
              </h3>

              {/* Items List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {confirmedOrderDetails.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-zinc-300 text-[11px]">
                    <span className="truncate pr-2">{item.product.name} (x{item.quantity})</span>
                    <span className="text-lime-400 font-bold shrink-0">{formatPrice(item.product.priceLkr * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-3 border-t border-zinc-800 space-y-1.5 text-zinc-400 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">{formatPrice(confirmedOrderDetails.subtotalLkr)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping ({confirmedOrderDetails.shippingMethod})</span>
                  <span className="text-lime-400 font-bold">{formatPrice(confirmedOrderDetails.shippingLkr)}</span>
                </div>
                <div className="flex justify-between text-xs text-white font-extrabold pt-2 border-t border-zinc-800">
                  <span>Total Amount Paid</span>
                  <span className="text-lime-400">{formatPrice(confirmedOrderDetails.totalLkr)}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <p><span className="text-zinc-500">Customer:</span> {confirmedOrderDetails.customerName}</p>
                <p><span className="text-zinc-500">Deliver To:</span> {confirmedOrderDetails.address}, {confirmedOrderDetails.city}</p>
                {confirmedOrderDetails.phone && <p><span className="text-zinc-500">Phone:</span> {confirmedOrderDetails.phone}</p>}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 space-y-3">
            <a
              href={whatsappSlipUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors font-mono"
            >
              <span>SEND WHATSAPP RECEIPT (+94741117981)</span>
            </a>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => typeof window !== 'undefined' && window.print()}
                className="py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 hover:text-lime-400 transition-colors font-mono cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PRINT RECEIPT</span>
              </button>

              <Link
                href="/"
                className="py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 hover:text-lime-400 transition-colors font-mono block text-center"
              >
                <span>STOREFRONT</span>
              </Link>
            </div>
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
                      <label className="text-xs font-mono text-zinc-400 block mb-1">Primary Phone Number *</label>
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

                  <div className="mt-4">
                    <label className="text-xs font-mono text-zinc-400 block mb-1">Secondary Phone / WhatsApp (Optional)</label>
                    <input
                      type="tel"
                      name="secondaryPhone"
                      value={formData.secondaryPhone}
                      onChange={handleInputChange}
                      placeholder="0719876543 (Optional)"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-lime-400 focus:outline-none font-mono"
                    />
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
                      <div className="flex items-center justify-between">
                        <span className="font-bold block text-white">Bank Transfer</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">3% OFF</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                        Save 3% with Direct Bank Transfer (-{formatPrice(Math.round(subtotal * 0.03))})
                      </span>
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
                      <div className="flex items-center justify-between">
                        <span className="font-bold block text-white">Payzy Gateway</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">+10% Fee</span>
                      </div>
                      <span className="text-[10px] text-amber-400 font-bold block mt-1">
                        +10% Payzy Installment / Processing Fee (+{formatPrice(Math.round(baseTotal * 0.10))})
                      </span>
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
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Promo Discount</span>
                      <span>-{formatPrice(promoDiscount)}</span>
                    </div>
                  )}
                  {paymentMethodAdjustment < 0 && (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Bank Transfer Discount (3%)</span>
                      <span>-{formatPrice(Math.abs(Math.round(paymentMethodAdjustment)))}</span>
                    </div>
                  )}
                  {paymentMethodAdjustment > 0 && (
                    <div className="flex justify-between text-amber-400 font-bold">
                      <span>Payzy Processing Fee (10%)</span>
                      <span>+{formatPrice(Math.round(paymentMethodAdjustment))}</span>
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
