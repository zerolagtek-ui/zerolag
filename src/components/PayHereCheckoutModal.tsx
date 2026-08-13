'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/productsData';
import { preparePayHereForm } from '@/lib/payhere';
import { addStoredOrder, getStoredBankDetails } from '@/lib/storeManager';
import { PaymentMethod, BankAccountDetails } from '@/types';
import { X, CreditCard, ShieldCheck, Truck, CheckCircle2, Lock, ArrowLeft, Wallet, Building2, Copy, Check, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';

export function PayHereCheckoutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { cart, totalPriceLkr, discountAmountLkr, clearCart } = useCart();

  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Colombo',
    postalCode: '00100',
    paymentMethod: 'payhere' as PaymentMethod
  });

  const [bankDetails, setBankDetails] = useState<BankAccountDetails>(getStoredBankDetails());
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');

  useEffect(() => {
    const syncBank = () => setBankDetails(getStoredBankDetails());
    syncBank();
    window.addEventListener('zerolag-bank-updated', syncBank);
    return () => window.removeEventListener('zerolag-bank-updated', syncBank);
  }, []);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCopyAcc = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(bankDetails.accountNumber);
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const generatedOrderId = `ZLAG-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrderPayload = {
      id: generatedOrderId,
      customerName: formData.customerName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentMethod === 'cod' || formData.paymentMethod === 'bank-transfer' ? ('Pending' as const) : ('Paid' as const),
      orderStatus: 'Pending' as const,
      items: cart,
      subtotalLkr: totalPriceLkr + discountAmountLkr,
      discountLkr: discountAmountLkr,
      shippingLkr: 0,
      totalLkr: totalPriceLkr,
      createdAt: new Date().toISOString()
    };

    if (formData.paymentMethod === 'payhere') {
      const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const payhereParams = preparePayHereForm(newOrderPayload, originUrl);
      console.log('Initiating PayHere Gateway payload:', payhereParams);
    } else if (formData.paymentMethod === 'payzy') {
      console.log('Initiating Payzy Gateway payload for order:', generatedOrderId);
    }

    addStoredOrder(newOrderPayload);

    // Asynchronous background email dispatch (non-blocking)
    const emailPayload = {
      orderId: generatedOrderId,
      customerName: formData.customerName,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      shippingAddress: `${formData.address}, ${formData.city}, ${formData.postalCode}`,
      paymentMethod: formData.paymentMethod,
      items: cart.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.priceLkr,
        total: item.product.priceLkr * item.quantity
      })),
      subtotal: totalPriceLkr + discountAmountLkr,
      shippingFee: 0,
      totalAmount: totalPriceLkr,
      orderDate: new Date().toISOString()
    };

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
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 }
      });
      clearCart();
    }, 1400);
  };

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '94741117981';
  const whatsappSlipUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello ZeroLag Tek! Here is my bank payment receipt for Order #${confirmedOrderId}`)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      
      <div className="relative w-full max-w-2xl bg-[#0c0e14] text-white border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-lime-400" />
            <h2 className="font-extrabold text-lg tracking-wide text-white">SECURE CHECKOUT</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!orderConfirmed ? (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">

            {/* Step 1: Customer Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold text-lime-400 tracking-wider uppercase">
                1. Shipping & Contact Info
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="Kasun Perera"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs text-zinc-200 focus:border-lime-400 focus:outline-none font-mono"
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
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs text-zinc-200 focus:border-lime-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="kasun@example.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs text-zinc-200 focus:border-lime-400 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-mono text-zinc-400 block mb-1">Delivery Address *</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="No. 45, Galle Road"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs text-zinc-200 focus:border-lime-400 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Colombo"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs text-zinc-200 focus:border-lime-400 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method Selection */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-xs font-mono font-bold text-lime-400 tracking-wider uppercase">
                2. Select Payment Option
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* PayHere Option */}
                <label
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    formData.paymentMethod === 'payhere'
                      ? 'bg-lime-500/10 border-lime-400 text-white shadow-sm'
                      : 'bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="payhere"
                        checked={formData.paymentMethod === 'payhere'}
                        onChange={handleInputChange}
                        className="accent-lime-400"
                      />
                      <span className="font-bold text-xs text-white">PayHere Gateway</span>
                    </div>
                    <CreditCard className="w-4 h-4 text-lime-400" />
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Visa, MasterCard, Amex & eZ Cash via PayHere LK.
                  </p>
                </label>

                {/* Direct Bank Transfer Option */}
                <label
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    formData.paymentMethod === 'bank-transfer'
                      ? 'bg-lime-500/10 border-lime-400 text-white shadow-sm'
                      : 'bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank-transfer"
                        checked={formData.paymentMethod === 'bank-transfer'}
                        onChange={handleInputChange}
                        className="accent-lime-400"
                      />
                      <span className="font-bold text-xs text-white">Direct Bank Transfer</span>
                    </div>
                    <Building2 className="w-4 h-4 text-lime-400" />
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Transfer directly to our Commercial Bank account.
                  </p>
                </label>

                {/* Payzy Option */}
                <label
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    formData.paymentMethod === 'payzy'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm'
                      : 'bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="payzy"
                        checked={formData.paymentMethod === 'payzy'}
                        onChange={handleInputChange}
                        className="accent-emerald-400"
                      />
                      <span className="font-bold text-xs text-white">Payzy Wallet</span>
                    </div>
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Instant mobile wallet pay & 1-click Payzy checkout.
                  </p>
                </label>

                {/* COD Option */}
                <label
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    formData.paymentMethod === 'cod'
                      ? 'bg-lime-500/10 border-lime-400 text-white shadow-sm'
                      : 'bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={handleInputChange}
                        className="accent-lime-400"
                      />
                      <span className="font-bold text-xs text-white">Cash on Delivery</span>
                    </div>
                    <Truck className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Pay cash upon doorstep courier delivery.
                  </p>
                </label>

              </div>

              {/* Dynamic Bank Account Details Box */}
              {formData.paymentMethod === 'bank-transfer' && (
                <div className="p-4 rounded-2xl bg-lime-950/20 border border-lime-500/30 text-zinc-200 space-y-2 font-mono text-xs animate-fade-in">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="font-extrabold text-lime-400 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      <span>{bankDetails.bankName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAcc}
                      className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 hover:text-lime-400 flex items-center gap-1"
                    >
                      {copiedAcc ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedAcc ? 'Copied' : 'Copy Number'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-zinc-500 block">Account Holder:</span>
                      <span className="text-white font-bold">{bankDetails.accountName}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Account Number:</span>
                      <span className="text-lime-400 font-bold">{bankDetails.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Branch Name:</span>
                      <span className="text-zinc-200">{bankDetails.branch}</span>
                    </div>
                    {bankDetails.swiftCode && (
                      <div>
                        <span className="text-zinc-500 block">SWIFT Code:</span>
                        <span className="text-zinc-200">{bankDetails.swiftCode}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-amber-300 pt-2 border-t border-zinc-800/80 leading-relaxed">
                    💡 {bankDetails.instructions || 'Transfer order total to this account and WhatsApp receipt to +94741117981.'}
                  </p>
                </div>
              )}

            </div>

            {/* Order Total & Submit */}
            <div className="pt-4 border-t border-zinc-800 space-y-4">
              <div className="flex justify-between items-baseline font-mono">
                <span className="text-xs text-zinc-400">Total Payable Amount:</span>
                <span className="text-xl font-bold text-lime-400">
                  {formatPrice(totalPriceLkr)}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-lime-400/25 hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>
                      {formData.paymentMethod === 'payhere' && 'Pay via PayHere Gateway'}
                      {formData.paymentMethod === 'bank-transfer' && 'Confirm Bank Transfer Order'}
                      {formData.paymentMethod === 'payzy' && 'Pay via Payzy Gateway'}
                      {formData.paymentMethod === 'cod' && 'Confirm Cash on Delivery Order'}
                    </span>
                  </>
                )}
              </button>
            </div>

          </form>
        ) : (
          /* Success Screen */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-white">ORDER CONFIRMED!</h3>
              <p className="text-xs font-mono text-lime-400">Order ID: #{confirmedOrderId}</p>
              <p className="text-sm text-zinc-300 max-w-md mx-auto">
                Thank you for your order at ZeroLag Tek! Confirmation receipt dispatched to <span className="text-white font-semibold">{formData.email}</span>.
              </p>
            </div>

            {formData.paymentMethod === 'bank-transfer' ? (
              <div className="p-4 rounded-2xl bg-zinc-950 border border-lime-400/40 font-mono text-xs text-left space-y-2">
                <p className="font-bold text-lime-400 text-sm">Direct Bank Deposit Details:</p>
                <p><span className="text-zinc-500">Bank:</span> {bankDetails.bankName}</p>
                <p><span className="text-zinc-500">Account Name:</span> {bankDetails.accountName}</p>
                <p><span className="text-zinc-500">Account Number:</span> <span className="text-lime-400 font-bold">{bankDetails.accountNumber}</span></p>
                <p><span className="text-zinc-500">Branch:</span> {bankDetails.branch}</p>
                
                <div className="pt-2 border-t border-zinc-800">
                  <a
                    href={whatsappSlipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 fill-slate-950" />
                    <span>WhatsApp Bank Transfer Slip</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-400 space-y-1">
                <p>Delivery Address: {formData.address}, {formData.city}</p>
                <p>Payment Mode: <span className="text-lime-400 font-bold uppercase">{formData.paymentMethod}</span></p>
                <p>Estimated Delivery: 1 - 2 Business Days (Express Courier)</p>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-lime-400 text-slate-950 font-bold text-xs hover:bg-lime-300 transition-all inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
