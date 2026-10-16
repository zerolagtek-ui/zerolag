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
  AlertCircle,
  Upload,
  Loader2,
  FileText
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

  // Bank Config & Slip Upload State
  const [bankDetails, setBankDetails] = useState<BankAccountDetails>(getStoredBankDetails());
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string>('');
  const [isUploadingSlip, setIsUploadingSlip] = useState<boolean>(false);
  const [slipUploadError, setSlipUploadError] = useState<string>('');

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

  const handleSlipFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSlipUploadError('File size exceeds the 5MB limit. Please select a smaller receipt file.');
      return;
    }

    setIsUploadingSlip(true);
    setSlipUploadError('');
    setPaymentError('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setPaymentSlipUrl(data.url);
        setSlipUploadError('');
      } else {
        throw new Error(data.error || 'Failed to upload deposit slip.');
      }
    } catch (err: unknown) {
      console.error('Slip upload error:', err);
      const msg = err instanceof Error ? err.message : 'Slip upload failed. Please try again.';
      setSlipUploadError(msg);
    } finally {
      setIsUploadingSlip(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (formData.paymentMethod === 'bank-transfer' && !paymentSlipUrl) {
      setPaymentError('Please upload your bank deposit/transfer slip before placing the order.');
      return;
    }

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
      paymentSlipUrl: formData.paymentMethod === 'bank-transfer' ? paymentSlipUrl : undefined,
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
      paymentSlipUrl: formData.paymentMethod === 'bank-transfer' ? paymentSlipUrl : undefined,
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

        // Save pending order first (DO NOT send email yet for online payments)
        addStoredOrder(newOrderPayload);

        const payzyRes = await fetch('/api/payzy/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: grandTotal,
            totalAmount: grandTotal,
            freight: shippingFee,
            shippingFee: shippingFee,
            order_id: generatedOrderId,
            orderId: generatedOrderId,
            first_name: firstName,
            last_name: lastName,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            city: formData.city
          })
        });

        const isFallback = payzyRes.headers.get("X-Payzy-Fallback") === "form-submit" || (payzyRes.headers.get("Content-Type") || "").includes("text/html");
        if (isFallback) {
          const html = await payzyRes.text();
          clearCart();
          document.open();
          document.write(html);
          document.close();
          return;
        }

        const payzyData = await payzyRes.json();
        const targetUrl = payzyData.redirect_url || payzyData.url || payzyData?.data?.url || payzyData?.data?.redirect_url;
        if (payzyRes.ok && payzyData.success !== false && targetUrl) {
          clearCart();
          window.location.href = targetUrl;
          return;
        } else {
          const errMsg = payzyData.message || payzyData.error || (payzyData.error?.message ? payzyData.error.message : 'Payzy payment initialization failed.');
          throw new Error(typeof errMsg === 'string' ? errMsg : 'Payzy payment initialization failed.');
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

        // Save Pending Order first (DO NOT send email yet for online payments)
        addStoredOrder(newOrderPayload);
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
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-h-[92vh] sm:max-h-[90dvh] flex flex-col overflow-hidden my-auto font-mono shadow-2xl z-[95] text-slate-900 dark:text-zinc-100 transition-colors">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm tracking-wide">
            <span className="p-1.5 rounded-lg bg-lime-400/20 text-lime-600 dark:text-lime-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span>QUICK CHECKOUT WIZARD</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-all cursor-pointer"
            aria-label="Close Checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {orderConfirmed ? (
          /* Order Confirmed View */
          <div className="overflow-y-auto flex-1 p-6 text-center space-y-6 pb-8">
            <div className="w-16 h-16 rounded-full bg-lime-500/20 text-lime-600 dark:text-lime-400 border border-lime-500/40 flex items-center justify-center mx-auto shadow-lg shadow-lime-500/20">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">ORDER PLACED SUCCESSFULLY!</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Order Ref: <span className="text-lime-600 dark:text-lime-400 font-bold">#{confirmedOrderId}</span></p>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 font-sans leading-relaxed max-w-md mx-auto">
              Thank you for ordering with ZeroLag Tek Store! An order receipt has been sent to your email.
            </p>

            <div className="pt-2 space-y-3 max-w-sm mx-auto">
              <a
                href={whatsappSlipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-100 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>SEND WHATSAPP RECEIPT (+94741117981)</span>
              </a>

              <button
                onClick={onClose}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Close & Return to Store
              </button>
            </div>
          </div>
        ) : (
          /* Step Wizard View */
          <div className="overflow-y-auto flex-1 p-4 sm:p-6 pb-8 space-y-5">

            {/* Step Indicator Header (Modern Pill Badges) */}
            <div className="grid grid-cols-3 gap-2 border-b border-slate-200 dark:border-zinc-800 pb-4">
              <div
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                  currentStep === 1
                    ? 'border-lime-500 bg-lime-500/15 text-lime-700 dark:text-lime-400 shadow-md shadow-lime-500/10 font-bold ring-1 ring-lime-500/30'
                    : currentStep > 1
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium'
                    : 'border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-950/60 text-slate-400 dark:text-zinc-600'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                  {currentStep > 1 ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep === 1 ? 'bg-lime-500 text-slate-950' : 'bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'}`}>
                      1
                    </span>
                  )}
                  <span>Step 1</span>
                </div>
                <span className="text-[10px] hidden sm:inline font-sans truncate">Contact & Address</span>
              </div>

              <div
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                  currentStep === 2
                    ? 'border-lime-500 bg-lime-500/15 text-lime-700 dark:text-lime-400 shadow-md shadow-lime-500/10 font-bold ring-1 ring-lime-500/30'
                    : currentStep > 2
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium'
                    : 'border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-950/60 text-slate-400 dark:text-zinc-600'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                  {currentStep > 2 ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep === 2 ? 'bg-lime-500 text-slate-950' : 'bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'}`}>
                      2
                    </span>
                  )}
                  <span>Step 2</span>
                </div>
                <span className="text-[10px] hidden sm:inline font-sans truncate">Courier Service</span>
              </div>

              <div
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                  currentStep === 3
                    ? 'border-lime-500 bg-lime-500/15 text-lime-700 dark:text-lime-400 shadow-md shadow-lime-500/10 font-bold ring-1 ring-lime-500/30'
                    : 'border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-950/60 text-slate-400 dark:text-zinc-600'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep === 3 ? 'bg-lime-500 text-slate-950' : 'bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'}`}>
                    3
                  </span>
                  <span>Step 3</span>
                </div>
                <span className="text-[10px] hidden sm:inline font-sans truncate">Payment & Summary</span>
              </div>
            </div>

            {/* STEP 1: Contact & Address */}
            {currentStep === 1 && (
              <form onSubmit={goToStep2} className="space-y-4">
                <div className="flex items-center gap-2 pb-1">
                  <span className="p-1 rounded-md bg-lime-500/20 text-lime-600 dark:text-lime-400">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Customer Contact & Shipping Address
                  </h3>
                </div>

                {step1Error && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{step1Error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 font-semibold block mb-1.5 text-[11px]">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      required
                      value={formData.customerName}
                      onChange={handleInputChange}
                      placeholder="Kasun Perera"
                      className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 rounded-xl p-3 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 font-semibold block mb-1.5 text-[11px]">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="0771234567"
                      className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 rounded-xl p-3 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 font-semibold block mb-1.5 text-[11px]">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="kasun@example.com"
                      className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 rounded-xl p-3 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 font-semibold block mb-1.5 text-[11px]">
                      Secondary Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      name="secondaryPhone"
                      value={formData.secondaryPhone}
                      onChange={handleInputChange}
                      placeholder="0719876543 (Optional)"
                      className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 rounded-xl p-3 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 font-semibold block mb-1.5 text-[11px]">
                      City / Area *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Colombo"
                      className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 rounded-xl p-3 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 font-semibold block mb-1.5 text-[11px]">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="No. 45, Main Street, Colombo 03"
                      className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 rounded-xl p-3 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                  >
                    <span>Continue to Delivery Courier</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Delivery Courier */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1">
                  <span className="p-1 rounded-md bg-lime-500/20 text-lime-600 dark:text-lime-400">
                    <Truck className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Select Delivery Courier Service
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {shippingRates.filter(s => s.enabled).map((option) => {
                    const isSelected = selectedShippingId === option.id;
                    return (
                      <label
                        key={option.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-lime-500 bg-lime-500/10 text-lime-700 dark:text-lime-400 shadow-md shadow-lime-500/10 ring-1 ring-lime-500/30'
                            : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-900/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shippingMethodModal"
                            value={option.id}
                            checked={isSelected}
                            onChange={() => setSelectedShippingId(option.id)}
                            className="w-4 h-4 text-lime-500 focus:ring-lime-500 accent-lime-500 cursor-pointer"
                          />
                          <div>
                            <span className="font-bold block text-slate-900 dark:text-white text-xs">{option.name}</span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5">{option.description}</span>
                          </div>
                        </div>
                        <span className="font-extrabold text-lime-600 dark:text-lime-400 text-xs shrink-0 font-mono">
                          + {formatPrice(option.rate)}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Instant Updated Order Summary Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                    <span>Items Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} items)</span>
                    <span className="text-slate-900 dark:text-white font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Promo Discount</span>
                      <span>-{formatPrice(promoDiscount)}</span>
                    </div>
                  )}
                  {paymentMethodAdjustment < 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>Bank Transfer Discount (3%)</span>
                      <span>-{formatPrice(Math.abs(Math.round(paymentMethodAdjustment)))}</span>
                    </div>
                  )}
                  {paymentMethodAdjustment > 0 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                      <span>Payzy Processing Fee (10%)</span>
                      <span>+{formatPrice(Math.round(paymentMethodAdjustment))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                    <span>Courier ({activeShipping.name})</span>
                    <span className="text-lime-600 dark:text-lime-400 font-bold">{formatPrice(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-zinc-800">
                    <span>Updated Order Total</span>
                    <span className="text-lime-600 dark:text-lime-400">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={goToStep3}
                    className="px-6 py-3.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-lime-400/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                  >
                    <span>Continue to Payment & Summary</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Payment Option & Summary */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div className="flex items-center gap-2 pb-1">
                  <span className="p-1 rounded-md bg-lime-500/20 text-lime-600 dark:text-lime-400">
                    <CreditCard className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Select Payment Method & Final Summary
                  </h3>
                </div>

                {paymentError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Payment Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <label className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${formData.paymentMethod === 'bank-transfer' ? 'border-lime-500 bg-lime-500/10 text-lime-700 dark:text-lime-400 ring-1 ring-lime-500/30' : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'}`}>
                    <input
                      type="radio"
                      name="paymentMethodModal"
                      value="bank-transfer"
                      checked={formData.paymentMethod === 'bank-transfer'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'bank-transfer' })}
                      className="hidden"
                    />
                    <div className="flex items-center justify-between">
                      <span className="font-bold block text-slate-900 dark:text-white">Bank Transfer</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold">3% OFF</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                      Save 3% with Direct Bank Transfer (-{formatPrice(Math.round(subtotal * 0.03))})
                    </span>
                  </label>

                  <label className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${formData.paymentMethod === 'payhere' ? 'border-lime-500 bg-lime-500/10 text-lime-700 dark:text-lime-400 ring-1 ring-lime-500/30' : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'}`}>
                    <input
                      type="radio"
                      name="paymentMethodModal"
                      value="payhere"
                      checked={formData.paymentMethod === 'payhere'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'payhere' })}
                      className="hidden"
                    />
                    <span className="font-bold block text-slate-900 dark:text-white">PayHere Gateway</span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-1">Visa / MasterCard / Genie</span>
                  </label>

                  <label className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${formData.paymentMethod === 'payzy' ? 'border-lime-500 bg-lime-500/10 text-lime-700 dark:text-lime-400 ring-1 ring-lime-500/30' : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'}`}>
                    <input
                      type="radio"
                      name="paymentMethodModal"
                      value="payzy"
                      checked={formData.paymentMethod === 'payzy'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'payzy' })}
                      className="hidden"
                    />
                    <div className="flex items-center justify-between">
                      <span className="font-bold block text-slate-900 dark:text-white">Payzy Gateway</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold">+10% Fee</span>
                    </div>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-1">
                      +10% Installment / Processing Fee (+{formatPrice(Math.round(baseTotal * 0.10))})
                    </span>
                  </label>

                  <label className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-lime-500 bg-lime-500/10 text-lime-700 dark:text-lime-400 ring-1 ring-lime-500/30' : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'}`}>
                    <input
                      type="radio"
                      name="paymentMethodModal"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                      className="hidden"
                    />
                    <span className="font-bold block text-slate-900 dark:text-white">Cash on Delivery</span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-1">Pay Cash directly to Courier</span>
                  </label>
                </div>

                {/* Bank Details Display if Bank Transfer */}
                {formData.paymentMethod === 'bank-transfer' && (
                  <div className="p-4 rounded-2xl bg-lime-50 dark:bg-lime-950/25 border border-lime-300 dark:border-lime-500/30 space-y-2.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-lime-800 dark:text-lime-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-lime-600 dark:text-lime-400" />
                        <span>{bankDetails.bankName}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAcc}
                        className="px-2.5 py-1 rounded-lg bg-lime-500/20 text-lime-800 dark:text-lime-300 hover:bg-lime-500/30 font-mono text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedAcc ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAcc ? 'Copied!' : 'Copy Acc #'}</span>
                      </button>
                    </div>
                    <p className="text-slate-700 dark:text-zinc-300 font-mono text-[11px]">
                      Account Name: <strong className="text-slate-900 dark:text-white">{bankDetails.accountName}</strong>
                    </p>
                    <p className="text-slate-700 dark:text-zinc-300 font-mono text-[11px]">
                      Account Number: <strong className="text-lime-700 dark:text-lime-400 font-bold">{bankDetails.accountNumber}</strong>
                    </p>
                    <p className="text-slate-500 dark:text-zinc-400 text-[10px]">{bankDetails.branch}</p>

                    {/* Mandatory Slip Upload Box */}
                    <div className="pt-2 border-t border-lime-300/50 dark:border-lime-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-lime-700 dark:text-lime-400 font-bold text-xs flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Bank Transfer Receipt / Slip *</span>
                        </label>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400">Max 5MB (JPG, PNG, PDF)</span>
                      </div>

                      {!paymentSlipUrl ? (
                        <div className="relative border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-lime-500 dark:hover:border-lime-400 rounded-xl p-3 bg-white/70 dark:bg-zinc-950/80 text-center transition-all cursor-pointer">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={handleSlipFileUpload}
                            disabled={isUploadingSlip}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                          />
                          {isUploadingSlip ? (
                            <div className="py-2 flex flex-col items-center gap-1 text-lime-600 dark:text-lime-400">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span className="text-[11px] font-bold">Uploading deposit slip...</span>
                            </div>
                          ) : (
                            <div className="py-1 flex flex-col items-center gap-1 text-slate-500 dark:text-zinc-400">
                              <Upload className="w-4 h-4 text-lime-600 dark:text-lime-400" />
                              <p className="text-xs text-slate-800 dark:text-white font-bold">Click or drag bank deposit slip here *</p>
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500">Supports JPG, PNG, WEBP, or PDF up to 5MB</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-lime-500/40 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            {paymentSlipUrl.startsWith('data:application/pdf') || paymentSlipUrl.endsWith('.pdf') ? (
                              <FileText className="w-6 h-6 text-lime-600 dark:text-lime-400 shrink-0" />
                            ) : (
                              <img src={paymentSlipUrl} alt="Deposit Slip Preview" className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-zinc-800 shrink-0" />
                            )}
                            <div className="truncate">
                              <span className="text-xs font-bold text-lime-600 dark:text-lime-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Deposit Slip Uploaded
                              </span>
                              <a href={paymentSlipUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white underline truncate block">
                                Click to view full slip
                              </a>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPaymentSlipUrl('')}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 border border-slate-200 dark:border-zinc-800 transition-colors shrink-0 cursor-pointer"
                            title="Remove slip"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {slipUploadError && (
                        <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[10px] flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{slipUploadError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Final Order Breakdown Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2 text-xs font-mono">
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] border-b border-slate-200 dark:border-zinc-800 pb-2">
                    Final Order Summary
                  </h4>
                  <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                    <span>Items Subtotal</span>
                    <span className="text-slate-900 dark:text-white font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Promo Discount</span>
                      <span>-{formatPrice(promoDiscount)}</span>
                    </div>
                  )}
                  {paymentMethodAdjustment < 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>Bank Transfer Discount (3%)</span>
                      <span>-{formatPrice(Math.abs(Math.round(paymentMethodAdjustment)))}</span>
                    </div>
                  )}
                  {paymentMethodAdjustment > 0 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                      <span>Payzy Processing Fee (10%)</span>
                      <span>+{formatPrice(Math.round(paymentMethodAdjustment))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                    <span>Courier ({activeShipping.name})</span>
                    <span className="text-lime-600 dark:text-lime-400 font-bold">{formatPrice(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-zinc-800">
                    <span>Grand Total</span>
                    <span className="text-lime-600 dark:text-lime-400">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial px-8 py-3.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    <span>{isSubmitting ? 'Processing Order...' : `Proceed to Pay — ${formatPrice(grandTotal)}`}</span>
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
