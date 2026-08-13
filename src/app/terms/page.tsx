'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FileText, DollarSign, XCircle, Award, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Link href="/" className="hover:text-lime-400 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>
          <span>/</span>
          <span className="text-lime-400 font-bold">Terms & Conditions</span>
        </div>

        {/* Header */}
        <div className="space-y-3 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-lime-400/10 border border-lime-400/30 text-lime-400">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                Terms & Conditions
              </h1>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Storefront Usage, Order Placement & Warranty Service Terms
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed font-sans">
          
          {/* Section 1 */}
          <div className="bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-3">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <FileText className="w-5 h-5 text-lime-400" />
              <span>1. Store Usage & Acceptable Use</span>
            </h2>
            <p>
              By accessing ZeroLag Tek Store or submitting an order, you agree to comply with all store operating terms, local commercial laws of Sri Lanka, and accurate customer information submission.
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-3">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-lime-400" />
              <span>2. Pricing Accuracy & Stock Availability</span>
            </h2>
            <p>
              All prices displayed on ZeroLag Tek are listed in Sri Lankan Rupees (LKR). While we strive for absolute real-time accuracy, ZeroLag Tek reserves the right to correct accidental pricing errors before order dispatch.
            </p>
          </div>

          {/* Section 3 */}
          <div className="bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-3">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <XCircle className="w-5 h-5 text-lime-400" />
              <span>3. Order Cancellation & Verification Rights</span>
            </h2>
            <p>
              ZeroLag Tek reserves the right to cancel or place on hold any order containing unverified contact details, suspected fraudulent payment attempts, or unfulfilled bank deposit receipts after 48 hours.
            </p>
          </div>

          {/* Section 4 */}
          <div className="bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-3">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Award className="w-5 h-5 text-lime-400" />
              <span>4. Warranty Scope & Limitations</span>
            </h2>
            <p>
              Hardware items carry a 1-year official warranty unless specified otherwise. Warranty covers inherent manufacturing hardware faults. Warranty does <strong>NOT</strong> cover user-inflicted physical damage, liquid spills, power surge burn marks, or altered product serial numbers.
            </p>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
