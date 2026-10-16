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
              {mounted && siteLogo && !logoError ? (
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                  <img
                    src={siteLogo}
                    alt="ZeroLag Tek Logo"
                    className="w-full h-full object-contain"
                    onError={() => setLogoError(true)}
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 p-0.5">
                  <div className="w-full h-full bg-slate-900 dark:bg-zinc-950 rounded-[8px] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-lime-400" />
                  </div>
                </div>
              )}
              <span className="font-extrabold text-2xl text-slate-900 dark:text-white tracking-wider">ZeroLag Tek</span>
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
