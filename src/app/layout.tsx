import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ScrollToTop } from '@/components/ScrollToTop';

export const metadata: Metadata = {
  title: 'ZeroLag Tek | Premier Gaming Hardware & Peripherals Sri Lanka',
  description: 'Buy genuine gaming mice, mechanical keyboards, headsets, routers, webcams & chargers with PayHere, Payzy, and Cash on Delivery with islandwide fast delivery.',
  keywords: ['ZeroLag Tek Store', 'Gaming Mice Sri Lanka', 'Mechanical Keyboards Colombo', 'PayHere E-Commerce', 'Tech Store LK'],
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
