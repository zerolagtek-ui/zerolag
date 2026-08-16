'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Shield, Lock, EyeOff, Server, ArrowLeft, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Link href="/" className="hover:text-lime-400 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>
          <span>/</span>
          <span className="text-lime-400 font-bold">Privacy Policy</span>
        </div>

        {/* Header */}
        <div className="space-y-3 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-lime-400/10 border border-lime-400/30 text-lime-400">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                Privacy Policy
              </h1>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                ZeroLag Tek Data Protection & Privacy Commitment
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed font-sans">
          
          {/* Section 1 */}
          <div className="bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-3">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Shield className="w-5 h-5 text-lime-400" />
              <span>1. Customer Data Collection & Purpose</span>
            </h2>
            <p>
              ZeroLag Tek Store collects customer contact information (Name, Email Address, Phone Number, Delivery Address) exclusively for order verification, dispatch notifications, payment receipts, and customer service fulfillment.
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-3">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-lime-400" />
              <span>2. Zero 3rd-Party Data Sharing</span>
            </h2>
            <p>
              We maintain a strict zero-compromise privacy standard. Your personal data is never sold, rented, leased, or disclosed to third-party marketing companies. Data is shared only with verified logistics partners strictly for shipping parcel delivery.
            </p>
          </div>

          {/* Section 3 */}
          <div className="bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-3">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Server className="w-5 h-5 text-lime-400" />
              <span>3. 256-Bit SSL Encryption & Storage</span>
            </h2>
            <p>
              All interactions across ZeroLag Tek are encrypted using industry-standard 256-Bit SSL protection. Administrative access is protected via cryptographically signed HMAC session cookies using `httpOnly` and `sameSite: strict` parameters.
            </p>
          </div>

          {/* Section 4 */}
          <div className="bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-3">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Mail className="w-5 h-5 text-lime-400" />
              <span>4. Data Access & Deletion Requests</span>
            </h2>
            <p>
              Customers have the full right to inspect, update, or request complete removal of their customer account data from our active store databases by contacting our privacy compliance desk at <strong>sales@zerolag.lk</strong>.
            </p>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
