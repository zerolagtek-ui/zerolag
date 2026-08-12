/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { getStoredProducts } from '@/lib/storeManager';
import { Product } from '@/types';
import { formatPrice } from '@/lib/productsData';
import { useCart } from '@/context/CartContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { PayHereCheckoutModal } from '@/components/PayHereCheckoutModal';
import { AiAssistantDrawer } from '@/components/AiAssistantDrawer';
import { ProductCard } from '@/components/ProductCard';
import {
  ChevronRight,
  ShieldCheck,
  Truck,
  ShoppingCart,
  MessageSquare,
  Star,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Share2,
  RotateCcw,
  Zap
} from 'lucide-react';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  useEffect(() => {
    const productsList = getStoredProducts();
    setAllProducts(productsList);

    const found = productsList.find(p => p.id === id);
    if (found) {
      setProduct(found);
      setSelectedImage(found.image);
    }
  }, [id]);

  if (!product) {
    return (
      <div className="bg-black text-white min-h-screen flex flex-col justify-between">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-[#0a0c10] border border-zinc-800 rounded-3xl p-8 space-y-4 shadow-sm">
            <AlertCircle className="w-12 h-12 text-lime-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Product Not Found</h2>
            <p className="text-xs text-zinc-400 font-mono">
              The item you are searching for is unavailable or has been removed from inventory.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime-400 text-slate-950 font-bold text-xs hover:bg-lime-300 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Catalog</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '94741117981';
  const whatsappMsg = `Hello ZeroLag Tek! I would like to order: ${product.name} (${formatPrice(product.priceLkr)})`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMsg)}`;

  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const imagesList = product.galleryImages && product.galleryImages.length > 0
    ? product.galleryImages
    : [product.image];

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col justify-between transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <Link href={`/#catalog`} className="hover:text-white transition-colors capitalize">
            {product.category.replace('-', ' ')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-white font-semibold truncate max-w-xs">{product.name}</span>
        </nav>

        {/* 2-Column Product Showcase Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* Left Column: Multi-Angle Gallery */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-28">
            {/* Main Display Image */}
            <div className="relative h-80 sm:h-96 w-full rounded-3xl overflow-hidden bg-[#0a0c10] border border-zinc-800 flex items-center justify-center group shadow-sm">
              <img
                src={selectedImage || product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {product.badge && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-md bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase shadow-md">
                  {product.badge}
                </div>
              )}

              <button
                onClick={handleShare}
                className="absolute top-4 right-4 p-2.5 rounded-xl bg-zinc-950/80 backdrop-blur-sm border border-zinc-700 text-zinc-300 hover:text-lime-400 transition-colors"
                title="Share link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Selection Bar */}
            {imagesList.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 rounded-xl overflow-hidden bg-[#0a0c10] border-2 transition-all shrink-0 ${
                      selectedImage === img
                        ? 'border-lime-400 scale-105 shadow-md shadow-lime-400/20'
                        : 'border-zinc-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details & Purchase Actions */}
          <div className="lg:col-span-6 space-y-6">

            {/* Brand & Stock Header */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-zinc-900 text-zinc-400 font-mono text-xs font-bold">
                {product.brand}
              </span>

              {product.inStock ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  In Stock ({product.stockCount} available)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs font-bold">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-3xl font-bold text-white leading-tight">
              {product.name}
            </h1>

            {/* Rating & Warranty Tag */}
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{product.rating ? product.rating.toFixed(1) : '4.9'}</span>
                <span className="text-zinc-500">({product.reviewsCount || 48} reviews)</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1 text-zinc-400 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>{product.warranty || '1 Year Authorized Warranty'}</span>
              </div>
            </div>

            {/* Price & Delivery Box */}
            <div className="p-5 rounded-2xl bg-[#0a0c10] border border-zinc-800 text-white space-y-1 shadow-sm">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold font-mono text-lime-400">
                  {formatPrice(product.priceLkr)}
                </span>
                {product.originalPriceLkr && (
                  <span className="text-sm font-mono text-zinc-500 line-through">
                    {formatPrice(product.originalPriceLkr)}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Inclusive of islandwide insured express courier delivery
              </p>
            </div>

            {/* Quantity Stepper & Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-zinc-400">Quantity:</span>
                <div className="flex items-center bg-zinc-900 border border-zinc-700 text-white rounded-xl p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center text-zinc-300 hover:text-white font-bold"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-white text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-zinc-300 hover:text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Add to Cart Button */}
                <button
                  onClick={() => {
                    for (let i = 0; i < quantity; i++) {
                      addToCart(product);
                    }
                  }}
                  disabled={!product.inStock}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>

                {/* WhatsApp Direct Order Button */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                  <span>Order via WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Store Perks */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-800 text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-lime-400 shrink-0" />
                <span>Express Courier</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Genuine</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>7-Day Replacement</span>
              </div>
            </div>

          </div>
        </div>

        {/* Technical Specs Grid Cards */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <div className="space-y-4 pt-8 border-t border-zinc-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-lime-400" />
              <span>TECHNICAL SPECIFICATIONS</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(product.specs).map(([key, val]) => (
                <div
                  key={key}
                  className="p-4 rounded-2xl bg-[#0a0c10] border border-zinc-800 text-zinc-200 space-y-1 hover:border-lime-400/40 transition-colors"
                >
                  <span className="text-[11px] font-mono text-zinc-400 block uppercase tracking-wider">
                    {key}
                  </span>
                  <p className="text-xs text-white font-semibold leading-normal">
                    {val}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 pt-10 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                RELATED {product.category.replace('-', ' ').toUpperCase()} HARDWARE
              </h3>
              <Link href="/#catalog" className="text-xs font-mono text-lime-400 hover:underline">
                View All Catalog
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(relProduct => (
                <ProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </div>
        )}

      </main>

      <Footer />

      {/* Slide-over Drawers & Modals */}
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />
      <PayHereCheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      <AiAssistantDrawer />
    </div>
  );
}
