'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CheckCircle2, XCircle, ShoppingBag, ArrowLeft, Copy, Check, Printer, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('orderId') || searchParams.get('x_order_id') || '';
  const statusParam = searchParams.get('status') || searchParams.get('error') || 'success';
  const isSuccess = statusParam === 'success' || searchParams.get('response_code') === '00';

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 }
      });
    }
  }, [isSuccess]);

  const copyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex flex-col items-center justify-center">
        {isSuccess ? (
          <div className="w-full bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-6 md:p-10 shadow-2xl backdrop-blur-md text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 mb-6 animate-pulse">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
              Order Confirmed!
            </h1>
            <p className="text-slate-400 text-base md:text-lg mb-8 max-w-lg mx-auto">
              Thank you for your purchase with <span className="text-emerald-400 font-semibold">Payzy</span>. Your payment was processed successfully and your order is being prepared.
            </p>

            {orderId && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 md:p-6 mb-8 max-w-md mx-auto flex flex-col items-center">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-1">
                  Order Reference Number
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl font-mono font-bold text-lime-400 tracking-wider">
                    {orderId}
                  </span>
                  <button
                    onClick={copyOrderId}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Copy Order ID"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copied && <span className="text-xs text-emerald-400 mt-1">Copied to clipboard!</span>}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto mb-8 text-left bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 text-sm">
              <div>
                <span className="text-slate-500 text-xs block">Payment Status</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium mt-0.5">
                  <ShieldCheck className="w-4 h-4" /> Paid (Payzy Online)
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Fulfillment</span>
                <span className="text-slate-200 font-medium mt-0.5 block">Express Courier Processing</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-black font-semibold transition-all shadow-lg shadow-lime-500/20"
              >
                <ShoppingBag className="w-4 h-4" /> Continue Shopping
              </Link>

              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition-all"
              >
                <Printer className="w-4 h-4" /> Print Confirmation
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full bg-slate-900/80 border border-rose-500/30 rounded-2xl p-6 md:p-10 shadow-2xl backdrop-blur-md text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/40 text-rose-400 mb-6">
              <XCircle className="w-12 h-12" />
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
              Payment Not Completed
            </h1>
            <p className="text-slate-400 text-base md:text-lg mb-8 max-w-lg mx-auto">
              We were unable to process your payment via Payzy. Your order was not charged.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/checkout"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Checkout
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-lime-400"></div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
