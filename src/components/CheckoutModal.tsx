'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/productsData';
import { preparePayHereForm, submitPayHereForm } from '@/lib/payhere';
import {
  addStoredOrder,
  getStoredBankDetails,
  syncBankDetailsFromDatabase,
  getStoredShippingRates,
  syncShippingRatesFromDatabase
} from '@/lib/storeManager';
import { PaymentMethod, BankAccountDetails, ShippingOption, OrderDetails } from '@/types';
import {
  X,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  ArrowRight,
  Wallet,
  Building2,
  Copy,
  Check,
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function CheckoutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { cart, totalPriceLkr, discountAmountLkr, clearCart } = useCart();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    secondaryPhone: '',
    address: '',
    city: 'Colombo',
    postalCode: '00100',
    paymentMethod: 'bank-transfer' as PaymentMethod,
  });

  const [step1Error, setStep1Error] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Shipping Rates State
  const [shippingRates, setShippingRates] = useState<ShippingOption[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string>('trans-express');

  // Bank Config State
  const [bankDetails, setBankDetails] = useState<BankAccountDetails>(getStoredBankDetails());
  const [copiedAcc, setCopiedAcc] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');

  useEffect(() => {
    async function loadData() {
      // Bank
      const bDetails = await syncBankDetailsFromDatabase();
      setBankDetails(bDetails);

      // Shipping
      const cachedShipping = getStoredShippingRates();
      const activeCached = cachedShipping.filter(s => s.enabled);
      setShippingRates(activeCached.length > 0 ? activeCached : cachedShipping);
      if (activeCached.length > 0) {
        setSelectedShippingId(activeCached[0].id);
      }

      const syncedShipping = await syncShippingRatesFromDatabase();
      const activeSynced = syncedShipping.filter(s => s.enabled);
      if (activeSynced.length > 0) {
        setShippingRates(activeSynced);
        if (!activeSynced.some(s => s.id === selectedShippingId)) {
          setSelectedShippingId(activeSynced[0].id);
        }
      }
    }

    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeShipping = shippingRates.find(s => s.id === selectedShippingId) || shippingRates[0] || {
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

  // Payment Method Adjustment (-3% for Bank Transfer, +10% on baseTotal for Payzy)
  let paymentMethodAdjustment = 0;
  if (formData.paymentMethod === 'bank-transfer') {
    paymentMethodAdjustment = -(subtotal * 0.03);
  } else if (formData.paymentMethod === 'payzy') {
    paymentMethodAdjustment = +(baseTotal * 0.10);
  }

  const grandTotal = Math.max(0, Math.round(baseTotal + paymentMethodAdjustment));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (step1Error) setStep1Error('');
    if (paymentError) setPaymentError('');
  };

  const handleCopyAcc = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(bankDetails.accountNumber);
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    }
  };

  const goToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setStep1Error('Please fill in all required contact and shipping address fields.');
      return;
    }
    setStep1Error('');
    setCurrentStep(2);
  };

  const goToStep3 = () => {
    setCurrentStep(3);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmitting(true);
    setPaymentError('');
    const generatedOrderId = `ZLAG-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrderPayload: OrderDetails = {
      id: generatedOrderId,
      customerName: formData.customerName,
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
      totalLkr: grandTotal,
      createdAt: new Date().toISOString()
    };

    const emailPayload = {
      orderId: generatedOrderId,
      customerName: formData.customerName,
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
        total: item.product.priceLkr * item.quantity
      })),
      subtotal: subtotal,
      shippingFee: shippingFee,
      totalAmount: grandTotal,
      orderDate: new Date().toISOString()
    };

    // Payzy Gateway Integration (Direct Server Signing & Redirection)
    if (formData.paymentMethod === 'payzy') {
      try {
        const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const nameParts = formData.customerName.trim().split(' ');
        const firstName = nameParts[0] || 'Customer';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Save order & email first
        addStoredOrder(newOrderPayload);
        fetch('/api/send-order-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        }).catch(() => {});

        const payzyRes = await fetch('/api/payzy/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: generatedOrderId,
            amount: grandTotal,
            freight: shippingFee,
            first_name: firstName,
            last_name: lastName,
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

    // PayHere Gateway Integration (Direct Form POST Submission)
    if (formData.paymentMethod === 'payhere') {
      try {
        const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

        const hashRes = await fetch('/api/payhere/hash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: generatedOrderId,
            amount: grandTotal,
            currency: 'LKR'
          })
        });

        const hashData = await hashRes.json();
        if (!hashRes.ok || !hashData.hash) {
          const errorMessage = hashData.message || hashData.error || 'Failed to generate PayHere payment hash';
          throw new Error(errorMessage);
        }

        // 1. Create/Save Pending Order first
        addStoredOrder(newOrderPayload);
        fetch('/api/send-order-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        }).catch(() => {});
        clearCart();

        // 2 & 3. Prepare standard PayHere POST parameters
        const payhereParams = preparePayHereForm(newOrderPayload, originUrl, hashData.hash);

        // 4. Immediately execute direct HTML Form POST submission
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
      body: JSON.stringify(emailPayload)
    }).catch(err => console.error('Background email dispatch failed:', err));

    setTimeout(() => {
      setIsSubmitting(false);
      setConfirmedOrderId(generatedOrderId);
      setOrderConfirmed(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 }
      });
      clearCart();
    }, 1200);
  };

  const storeWhatsapp = process.env.NEXT_PUBLIC_STORE_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '94741117981';
  const whatsappSlipUrl = `https://wa.me/${storeWhatsapp}?text=${encodeURIComponent(
    `Hello ZeroLag Tek! Here is my payment receipt for Order #${confirmedOrderId} (${activeShipping.name} - ${formatPrice(shippingFee)})`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0a0c10] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden font-mono my-8">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-950/60">
          <div className="flex items-center gap-2 text-white font-extrabold text-sm tracking-wide">
            <ShieldCheck className="w-5 h-5 text-lime-400" />
            <span>QUICK CHECKOUT WIZARD</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {orderConfirmed ? (
          /* Order Confirmed View */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-lime-400/20 text-lime-400 border border-lime-400/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">ORDER PLACED SUCCESSFULLY!</h2>
              <p className="text-xs text-zinc-400 mt-1">Order Ref: <span className="text-lime-400 font-bold">#{confirmedOrderId}</span></p>
            </div>
            <p className="text-xs text-zinc-300 font-sans leading-relaxed max-w-md mx-auto">
              Thank you for ordering with ZeroLag Tek Store! An order receipt has been sent to your email.
            </p>

            <div className="pt-2 space-y-3 max-w-sm mx-auto">
              <a
                href={whatsappSlipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>SEND WHATSAPP RECEIPT (+94741117981)</span>
              </a>

              <button
                onClick={onClose}
                className="w-full py-3.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs hover:text-white transition-colors cursor-pointer"
              >
                Close & Return to Store
              </button>
            </div>
          </div>
        ) : (
          /* Step Wizard View */
          <div className="p-5 sm:p-6 space-y-6">

            {/* Step Indicator Header */}
            <div className="grid grid-cols-3 gap-2 border-b border-zinc-800/80 pb-4">
              <div
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${
                  currentStep === 1
                    ? 'border-lime-400 bg-lime-500/10 text-lime-400 shadow-md shadow-lime-400/10'
                    : currentStep > 1
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-600'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  {currentStep > 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <User className="w-3.5 h-3.5" />}
                  <span>Step 1</span>
                </div>
                <span className="text-[10px] hidden sm:inline">Contact & Address</span>
              </div>

              <div
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${
                  currentStep === 2
                    ? 'border-lime-400 bg-lime-500/10 text-lime-400 shadow-md shadow-lime-400/10'
                    : currentStep > 2
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-600'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  {currentStep > 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Truck className="w-3.5 h-3.5" />}
                  <span>Step 2</span>
                </div>
                <span className="text-[10px] hidden sm:inline">Delivery Courier</span>
              </div>

              <div
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${
                  currentStep === 3
                    ? 'border-lime-400 bg-lime-500/10 text-lime-400 shadow-md shadow-lime-400/10'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-600'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Step 3</span>
                </div>
                <span className="text-[10px] hidden sm:inline">Payment & Summary</span>
              </div>
            </div>

            {/* STEP 1: Contact & Address */}
            {currentStep === 1 && (
              <form onSubmit={goToStep2} className="space-y-4">
                <h3 className="text-xs font-bold text-lime-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>Step 1: Customer Contact & Shipping Address</span>
                </h3>

                {step1Error && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono">
                    {step1Error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-zinc-400 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="customerName"
                      required
                      value={formData.customerName}
                      onChange={handleInputChange}
                      placeholder="Kasun Perera"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-lime-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="0771234567"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-lime-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-zinc-400 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="kasun@example.com"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-lime-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Secondary Phone / WhatsApp (Optional)</label>
                    <input
                      type="tel"
                      name="secondaryPhone"
                      value={formData.secondaryPhone}
                      onChange={handleInputChange}
                      placeholder="0719876543 (Optional)"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-lime-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-zinc-400 block mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Colombo"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-lime-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Street Address *</label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="No. 45, Main Street, Colombo 03"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-lime-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-lime-400/20 hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    <span>Continue to Delivery Courier</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Delivery Courier */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <h3 className="text-xs font-bold text-lime-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  <span>Step 2: Select Delivery Courier Service</span>
                </h3>

                <div className="space-y-3">
                  {shippingRates.filter(s => s.enabled).map((option) => (
                    <label
                      key={option.id}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        selectedShippingId === option.id
                          ? 'border-lime-400 bg-lime-500/10 text-lime-400 shadow-md shadow-lime-400/10'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shippingMethodModal"
                          value={option.id}
                          checked={selectedShippingId === option.id}
                          onChange={() => setSelectedShippingId(option.id)}
                          className="text-lime-400 focus:ring-lime-400"
                        />
                        <div>
                          <span className="font-bold block text-white text-xs">{option.name}</span>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">{option.description}</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-lime-400 text-xs">
                        + {formatPrice(option.rate)}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Instant Updated Order Summary Box */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Items Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} items)</span>
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
                  <div className="flex justify-between text-zinc-400">
                    <span>Courier ({activeShipping.name})</span>
                    <span className="text-lime-400 font-bold">{formatPrice(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-zinc-800">
                    <span>Updated Order Total</span>
                    <span className="text-lime-400">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs flex items-center gap-1.5 hover:text-white transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={goToStep3}
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-lime-400/20 hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    <span>Continue to Payment & Summary</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Payment Option & Summary */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmitOrder} className="space-y-5">
                <h3 className="text-xs font-bold text-lime-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  <span>Step 3: Select Payment Method & Final Summary</span>
                </h3>

                {paymentError && (
                  <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Payment Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className={`p-3.5 rounded-xl border cursor-pointer transition-all ${formData.paymentMethod === 'bank-transfer' ? 'border-lime-400 bg-lime-500/10 text-lime-400' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}>
                    <input
                      type="radio"
                      name="paymentMethodModal"
                      value="bank-transfer"
                      checked={formData.paymentMethod === 'bank-transfer'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'bank-transfer' })}
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

                  <label className={`p-3.5 rounded-xl border cursor-pointer transition-all ${formData.paymentMethod === 'payhere' ? 'border-lime-400 bg-lime-500/10 text-lime-400' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}>
                    <input
                      type="radio"
                      name="paymentMethodModal"
                      value="payhere"
                      checked={formData.paymentMethod === 'payhere'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'payhere' })}
                      className="hidden"
                    />
                    <span className="font-bold block text-white">PayHere Gateway</span>
                    <span className="text-[10px]">Visa / MasterCard / Genie</span>
                  </label>

                  <label className={`p-3.5 rounded-xl border cursor-pointer transition-all ${formData.paymentMethod === 'payzy' ? 'border-lime-400 bg-lime-500/10 text-lime-400' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}>
                    <input
                      type="radio"
                      name="paymentMethodModal"
                      value="payzy"
                      checked={formData.paymentMethod === 'payzy'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'payzy' })}
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

                  <label className={`p-3.5 rounded-xl border cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-lime-400 bg-lime-500/10 text-lime-400' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}>
                    <input
                      type="radio"
                      name="paymentMethodModal"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                      className="hidden"
                    />
                    <span className="font-bold block text-white">Cash on Delivery</span>
                    <span className="text-[10px]">Pay Cash to Courier</span>
                  </label>
                </div>

                {/* Bank Details Display if Bank Transfer */}
                {formData.paymentMethod === 'bank-transfer' && (
                  <div className="p-4 rounded-2xl bg-lime-950/30 border border-lime-500/30 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-lime-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-lime-400" />
                        <span>{bankDetails.bankName}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAcc}
                        className="px-2.5 py-1 rounded-lg bg-lime-500/20 text-lime-300 hover:bg-lime-500/30 font-mono text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedAcc ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAcc ? 'Copied!' : 'Copy Acc #'}</span>
                      </button>
                    </div>
                    <p className="text-zinc-300 font-mono text-[11px]">Account Name: <strong className="text-white">{bankDetails.accountName}</strong></p>
                    <p className="text-zinc-300 font-mono text-[11px]">Account Number: <strong className="text-lime-400 font-bold">{bankDetails.accountNumber}</strong></p>
                    <p className="text-zinc-400 text-[10px]">{bankDetails.branch}</p>
                  </div>
                )}

                {/* Final Order Breakdown Box */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                  <h4 className="font-bold text-white uppercase text-[11px] border-b border-zinc-800 pb-2">Final Order Summary</h4>
                  <div className="flex justify-between text-zinc-400">
                    <span>Items Subtotal</span>
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
                  <div className="flex justify-between text-zinc-400">
                    <span>Courier ({activeShipping.name})</span>
                    <span className="text-lime-400 font-bold">{formatPrice(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-zinc-800">
                    <span>Grand Total</span>
                    <span className="text-lime-400">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs flex items-center gap-1.5 hover:text-white transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-lime-400/20 hover:scale-[1.02] transition-all disabled:opacity-60 cursor-pointer"
                  >
                    <span>{isSubmitting ? 'Processing Order...' : 'CONFIRM & PLACE ORDER NOW'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export const PayHereCheckoutModal = CheckoutModal;
