'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ShieldCheck, RotateCcw, Video, PackageCheck, AlertCircle, ArrowLeft, MessageSquare } from 'lucide-react';

export default function ReturnPolicyPage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '94741117981';

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
          <span className="text-lime-400 font-bold">Return & Refund Policy</span>
        </div>

        {/* Header */}
        <div className="space-y-3 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-lime-400/10 border border-lime-400/30 text-lime-400">
              <RotateCcw className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                Return & Refund Policy
              </h1>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                ZeroLag Tek Store Official Replacement & Guarantee Terms
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed font-sans">
          
          {/* Section 1 */}
          <div className="bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-3">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-lime-400" />
              <span>1. 7-Day Replacement Policy</span>
            </h2>
            <p>
              We stand behind every item shipped from ZeroLag Tek. If your product experiences a verified manufacturing defect or hardware malfunction within <strong>7 days of delivery</strong>, you are eligible for a direct unit replacement or store exchange.
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-3">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Video className="w-5 h-5 text-lime-400" />
              <span>2. Mandatory Unboxing Video Requirement</span>
            </h2>
            <p>
              To protect against courier transit damages or missing components, customers must record an uninterrupted <strong>unboxing video</strong> from parcel opening until the product is powered on.
            </p>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>Claims for physical transit damage or missing in-box accessories submitted without unboxing video proof will not be accepted.</p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-3">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-lime-400" />
              <span>3. Return Packaging Requirements</span>
            </h2>
            <p>For return eligibility, the item must meet the following criteria:</p>
            <ul className="list-disc list-inside space-y-1 text-xs font-mono text-zinc-400 pl-2">
              <li>Original intact outer packaging and internal protective padding.</li>
              <li>Undamaged serial number sticker and manufacturer seals.</li>
              <li>All bundled accessories, manuals, dongles, and cables included.</li>
              <li>No signs of physical damage, water exposure, or unauthorized disassembly.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-4">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-lime-400" />
              <span>4. How to Submit a Claim</span>
            </h2>
            <p>
              To initiate a replacement claim, send your order reference ID along with photos and your unboxing video directly to our support team:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs pt-2">
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-3"
              >
                <MessageSquare className="w-6 h-6 shrink-0" />
                <div>
                  <span className="font-bold block text-white">WhatsApp Support</span>
                  <span>+{whatsappNumber}</span>
                </div>
              </a>

              <a
                href="mailto:sales@zerolag.lk"
                className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors flex items-center gap-3"
              >
                <ShieldCheck className="w-6 h-6 shrink-0" />
                <div>
                  <span className="font-bold block text-white">Email Warranty Desk</span>
                  <span>sales@zerolag.lk</span>
                </div>
              </a>
            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
