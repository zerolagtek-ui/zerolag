'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Shield, Lock, EyeOff, Server, ArrowLeft, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-lime-600 dark:hover:text-lime-400 flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>
          <span>/</span>
          <span className="text-lime-600 dark:text-lime-400 font-bold">Privacy Policy</span>
        </div>

        {/* Header */}
        <div className="space-y-3 border-b border-slate-200 dark:border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-lime-500/10 border border-lime-500/30 text-lime-600 dark:text-lime-400">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-wide">
                Privacy Policy
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-1">
                ZeroLag Tek Data Protection & Privacy Commitment
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-6 text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-sans">
          
          {/* Section 1 */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 space-y-3 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
              <Shield className="w-5 h-5 text-lime-600 dark:text-lime-400" />
              <span>1. Customer Data Collection & Purpose</span>
            </h2>
            <p>
              ZeroLag Tek Store collects customer contact information (Name, Email Address, Phone Number, Delivery Address) exclusively for order verification, dispatch notifications, payment receipts, and customer service fulfillment.
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 space-y-3 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-lime-600 dark:text-lime-400" />
              <span>2. Zero 3rd-Party Data Sharing</span>
            </h2>
            <p>
              We maintain a strict zero-compromise privacy standard. Your personal data is never sold, rented, leased, or disclosed to third-party marketing companies. Data is shared only with verified logistics partners strictly for shipping parcel delivery.
            </p>
          </div>

          {/* Section 3 */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 space-y-3 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
              <Server className="w-5 h-5 text-lime-600 dark:text-lime-400" />
              <span>3. 256-Bit SSL Encryption & Storage</span>
            </h2>
            <p>
              All interactions across ZeroLag Tek are encrypted using industry-standard 256-Bit SSL protection. Administrative access is protected via cryptographically signed HMAC session cookies using <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-200 text-xs font-mono">httpOnly</code> and <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-200 text-xs font-mono">sameSite: strict</code> parameters.
            </p>
          </div>

          {/* Section 4 */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 space-y-3 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
              <Mail className="w-5 h-5 text-lime-600 dark:text-lime-400" />
              <span>4. Data Access & Deletion Requests</span>
            </h2>
            <p>
              Customers have the full right to inspect, update, or request complete removal of their customer account data from our active store databases by contacting our privacy compliance desk at <strong className="text-slate-900 dark:text-white">sales@zerolag.lk</strong>.
            </p>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
