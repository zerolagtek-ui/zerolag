import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ScrollToTop } from '@/components/ScrollToTop';
import { MobileBottomNav } from '@/components/MobileBottomNav';

const PAYHERE_PRELOAD_URL =
  process.env.NEXT_PUBLIC_PAYHERE_JS_URL ||
  (process.env.NEXT_PUBLIC_PAYHERE_MODE === 'live'
    ? 'https://www.payhere.lk/payhere.js'
    : 'https://sandbox.payhere.lk/payhere.js');

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://zerolagtek.app'),
  title: {
    default: 'ZeroLag Tek | Premium Gaming Accessories & Tech Gear Sri Lanka',
    template: '%s | ZeroLag Tek'
  },
  description: 'Shop high-performance gaming peripherals, custom keyboards, mechanical switches, mice, headsets and tech essentials in Sri Lanka with Islandwide Delivery.',
  keywords: ['gaming gear sri lanka', 'mechanical keyboards', 'gaming mouse', 'custom tech accessories', 'zerolag tek'],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'ZeroLag Tek | Premium Tech & Gaming Accessories',
    description: 'High-performance tech and gaming gear with fast Islandwide Delivery in Sri Lanka.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://zerolagtek.app',
    siteName: 'ZeroLag Tek',
    locale: 'en_US',
    type: 'website',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
    other: {
      'facebook-domain-verification': process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION || '',
    }
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="bg-black text-slate-100 min-h-screen max-w-full overflow-x-hidden flex flex-col selection:bg-lime-400 selection:text-slate-950 pb-16 md:pb-0">
        <Script
          id="payhere-sdk"
          src={PAYHERE_PRELOAD_URL}
          strategy="afterInteractive"
        />
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange enableSystem={false}>
          <CartProvider>
            {children}
            <MobileBottomNav />
            <ScrollToTop />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
