/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Truck, CreditCard, Clock, Phone, Mail, Award } from 'lucide-react';
import { CATEGORIES } from '@/lib/productsData';
import { getStoredSiteLogo, syncSiteLogoFromSupabase, cleanLogoUrl } from '@/lib/storeManager';

export function Footer() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '94741117981';
  const [siteLogo, setSiteLogo] = useState<string>(() => cleanLogoUrl(getStoredSiteLogo()));
  const [logoError, setLogoError] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const loadLogo = async () => {
    const cached = cleanLogoUrl(getStoredSiteLogo());
    if (cached) {
      setSiteLogo(cached);
      setLogoError(false);
    }

    const remoteLogo = await syncSiteLogoFromSupabase();
    const finalLogo = cleanLogoUrl(remoteLogo || cached);
    if (finalLogo) {
      setSiteLogo(finalLogo);
      setLogoError(false);
    }
  };

  // Initial logo sync on mount & event listeners setup
  useEffect(() => {
    setMounted(true);
    loadLogo();
    window.addEventListener('zerolag-logo-updated', loadLogo);
    window.addEventListener('site_logo_updated', loadLogo);
    return () => {
      window.removeEventListener('zerolag-logo-updated', loadLogo);
      window.removeEventListener('site_logo_updated', loadLogo);
    };
  }, []);

  return (
    <footer className="bg-slate-100 dark:bg-[#050608] border-t border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors">
      
      {/* Top Value Proposition Grid */}
      <div className="border-b border-slate-200 dark:border-zinc-800/80">
        <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
            
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 flex items-center gap-3 shadow-sm">
              <Shield className="w-6 h-6 text-lime-600 dark:text-lime-400 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">100% Genuine Warranty</h4>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">Official Distributor Guarantee</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 flex items-center gap-3 shadow-sm">
              <Truck className="w-6 h-6 text-lime-600 dark:text-lime-400 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Islandwide Fast Delivery</h4>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">Courier to Doorstep in 1-2 Days</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 flex items-center gap-3 shadow-sm">
              <CreditCard className="w-6 h-6 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">PayHere, Payzy & Bank Transfer</h4>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">Secure Gateway Options</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 flex items-center gap-3 shadow-sm">
              <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Zero Latency Support</h4>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">TekBot AI & WhatsApp Helpline</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              {mounted && !logoError ? (
                <img
                  src={siteLogo || "/logo.png"}
                  alt="ZeroLag TEK"
                  className="h-12 w-12 md:h-14 md:w-14 object-contain shrink-0"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-lime-400 p-0.5 shrink-0">
                  <div className="w-full h-full bg-slate-900 dark:bg-zinc-950 rounded-[8px] flex items-center justify-center">
                    <Shield className="w-7 h-7 md:w-8 md:h-8 text-lime-400" />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-2xl">
                <span className="text-slate-900 dark:text-white transition-colors">
                  ZeroLag
                </span>
                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider font-mono">
                  TEK
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed max-w-sm">
              Sri Lanka&apos;s premier store for esports gaming mice, mechanical keyboards, spatial audio, 4K webcams, WiFi 7 routers, GaN chargers, and high-speed NVMe storage.
            </p>

            <div className="space-y-2 text-xs font-mono">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-lime-600 dark:text-lime-400 shrink-0" />
                <span className="text-slate-700 dark:text-zinc-300">Hotline: +{whatsappNumber}</span>
              </p>
              <a href="mailto:hello@zerolagtek.app" className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-lime-600 dark:text-lime-400 shrink-0" />
                <span>hello@zerolagtek.app</span>
              </a>
            </div>

            {/* Social Media Link Badges */}
            <div className="pt-2">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-2">
                Follow Us
              </span>
              <div className="flex items-center gap-2">
                {/* Facebook */}
                <a
                  href="https://www.facebook.com/zerolaglkk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:text-lime-500 dark:hover:text-lime-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all duration-200"
                  aria-label="ZeroLag Tek Facebook"
                  title="Facebook: @zerolaglkk"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* TikTok */}
                <a
                  href="https://www.tiktok.com/@zerolaglk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:text-lime-500 dark:hover:text-lime-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all duration-200"
                  aria-label="ZeroLag Tek TikTok"
                  title="TikTok: @zerolaglk"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/zerolaglk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:text-lime-500 dark:hover:text-lime-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all duration-200"
                  aria-label="ZeroLag Tek Instagram"
                  title="Instagram: @zerolaglk"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Categories Column */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider font-mono">
              Categories
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              {CATEGORIES.filter(c => c.id !== 'all').slice(0, 6).map(c => (
                <li key={c.id}>
                  <Link href={`/#catalog`} className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider font-mono">
              Store Quick Links
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li><Link href="/" className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white">Store Home</Link></li>
              <li><Link href="/#catalog" className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white">All Products</Link></li>
              <li><Link href="/return-policy" className="text-lime-600 dark:text-lime-400 hover:underline font-medium">Return & Refund Policy</Link></li>
              <li><Link href="/privacy-policy" className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white">Terms & Conditions</Link></li>
              <li><Link href="/admin" className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white">Admin Portal Login</Link></li>
              <li><a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white">WhatsApp Order Line</a></li>
            </ul>
          </div>

          {/* Store Hours & Security */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider font-mono">
              Operating Hours
            </h4>
            <div className="space-y-1.5 text-xs font-mono">
              <p className="text-slate-900 dark:text-white font-semibold">Monday - Saturday:</p>
              <p className="text-slate-600 dark:text-zinc-400">9:00 AM - 7:30 PM</p>
              <p className="text-slate-900 dark:text-white font-semibold pt-1">Sunday & Poya Days:</p>
              <p className="text-slate-600 dark:text-zinc-400">10:00 AM - 5:00 PM</p>
            </div>

            <div className="pt-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold flex items-center gap-1 w-fit">
                <Award className="w-3.5 h-3.5" />
                <span>SSL Encrypted Checkout</span>
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Rights Strip */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs font-mono gap-4 text-slate-500 dark:text-zinc-400">
          <p>© 2026 ZeroLag Tek Store. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs">
            <Link className="hover:text-lime-600 dark:hover:text-lime-400 transition-colors" href="/return-policy">Return & Refund Policy</Link>
            <span className="hidden sm:inline text-slate-300 dark:text-zinc-700">•</span>
            <Link className="hover:text-lime-600 dark:hover:text-lime-400 transition-colors" href="/privacy-policy">Privacy Policy</Link>
            <span className="hidden sm:inline text-slate-300 dark:text-zinc-700">•</span>
            <Link className="hover:text-lime-600 dark:hover:text-lime-400 transition-colors" href="/terms">Terms & Conditions</Link>
          </div>
        </div>

      </div>

    </footer>
  );
}
