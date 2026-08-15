import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ScrollToTop } from '@/components/ScrollToTop';

const PAYHERE_PRELOAD_URL =
  process.env.NEXT_PUBLIC_PAYHERE_JS_URL ||
  (process.env.NEXT_PUBLIC_PAYHERE_MODE === 'live'
    ? 'https://www.payhere.lk/payhere.js'
    : 'https://sandbox.payhere.lk/payhere.js');

export const metadata: Metadata = {
  title: 'ZeroLag Tek | Premier Gaming Hardware & Peripherals Sri Lanka',
  description: 'Buy genuine gaming mice, mechanical keyboards, headsets, routers, webcams & chargers with PayHere, Payzy, and Cash on Delivery with islandwide fast delivery.',
  keywords: ['ZeroLag Tek Store', 'Gaming Mice Sri Lanka', 'Mechanical Keyboards Colombo', 'PayHere E-Commerce', 'Tech Store LK'],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'ZeroLag Tek | Premier Gaming Hardware & Peripherals',
    description: 'Islandwide Delivery • Genuine Products • PayHere & Payzy Gateway Approved',
    type: 'website'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-black text-slate-100 min-h-screen flex flex-col selection:bg-lime-400 selection:text-slate-950">
        <Script
          id="payhere-sdk"
          src={PAYHERE_PRELOAD_URL}
          strategy="lazyOnload"
        />
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange enableSystem={false}>
          <CartProvider>
            {children}
            <ScrollToTop />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
