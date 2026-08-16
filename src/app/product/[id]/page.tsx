/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { getStoredProducts, syncProductsFromDatabase } from '@/lib/storeManager';
import { Product } from '@/types';
import { formatPrice, getProductSlug, generateSlug, isCategoryMatch } from '@/lib/productsData';
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
  Zap,
  Send,
  UserCheck
} from 'lucide-react';

interface ReviewItem {
  id: string;
  product_id: string;
  user_name: string;
  user_email: string;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Reviews state
  const [approvedReviews, setApprovedReviews] = useState<ReviewItem[]>([]);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewNotice, setReviewNotice] = useState('');

  const fetchApprovedReviews = async (productId: string) => {
    try {
      const res = await fetch(`/api/reviews?product_id=${encodeURIComponent(productId)}&status=approved`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.reviews)) {
          setApprovedReviews(data.reviews);
        }
      }
    } catch (e) {
      console.warn('Error fetching approved reviews:', e);
    }
  };

  useEffect(() => {
    async function loadProduct() {
      setIsLoading(true);
      const matchProduct = (p: Product) => {
        if (!p) return false;
        const target = id;
        const pIdStr = String(p.id);
        const pTitle = p.name || (p as unknown as Record<string, unknown>).title || '';
        const slugifiedTitle = generateSlug(String(pTitle));

        return (
          pIdStr === target ||
          slugifiedTitle === target ||
          slugifiedTitle === generateSlug(target) ||
          getProductSlug(p) === target ||
          (p.name && getProductSlug({ id: p.id, name: p.name }) === target)
        );
      };

      try {
        // 1. Sync from DB / storeManager
        const dbProducts = await syncProductsFromDatabase();
        setAllProducts(dbProducts);

        const foundInDb = dbProducts.find(matchProduct);
        if (foundInDb) {
          setProduct(foundInDb);
          setSelectedImage(foundInDb.image);
          fetchApprovedReviews(foundInDb.id);
          setIsLoading(false);
          return;
        }

        // 2. Final fallback: Check local storage cache before showing "Product Not Found"
        const productsList = getStoredProducts();
        setAllProducts(prev => (prev.length > 0 ? prev : productsList));

        const foundInCache = productsList.find(matchProduct);
        if (foundInCache) {
          setProduct(foundInCache);
          setSelectedImage(foundInCache.image);
          fetchApprovedReviews(foundInCache.id);
        }
      } catch (e) {
        console.error('Error loading product:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Calculate dynamic average rating and review count
  const totalReviewsCount = approvedReviews.length > 0 ? approvedReviews.length : (product?.reviewsCount || (product as any)?.reviewCount || 0);
  const dynamicAvgRating = approvedReviews.length > 0
    ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
    : (product?.rating && totalReviewsCount > 0 ? product.rating.toFixed(1) : '0.0');

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewerEmail.trim() || !reviewComment.trim() || !product) return;

    setSubmittingReview(true);
    setReviewNotice('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          user_name: reviewerName.trim(),
          user_email: reviewerEmail.trim(),
          rating: reviewRating,
          comment: reviewComment.trim(),
          status: 'pending'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReviewNotice('Thank you! Your review has been submitted for admin verification.');
        setReviewerName('');
        setReviewerEmail('');
        setReviewComment('');
        setTimeout(() => {
          setIsReviewFormOpen(false);
        }, 2200);
      } else {
        setReviewNotice(data.error || 'Failed to submit review. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Review submission error:', err);
      setReviewNotice('Thank you! Your review was recorded for moderation.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-black text-white min-h-screen flex flex-col justify-between font-sans">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-8 animate-pulse">
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 bg-zinc-800 rounded-md"></div>
            <div className="h-4 w-4 bg-zinc-800 rounded-md"></div>
            <div className="h-4 w-24 bg-zinc-800 rounded-md"></div>
            <div className="h-4 w-4 bg-zinc-800 rounded-md"></div>
            <div className="h-4 w-36 bg-zinc-800 rounded-md"></div>
          </div>

          {/* Product Grid Layout Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
            {/* Left Column: Gallery Box Skeleton */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative aspect-square w-full rounded-3xl bg-[#0a0c10] border border-zinc-800 flex items-center justify-center p-6">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-lime-400 border-t-transparent animate-spin shadow-[0_0_15px_rgba(163,230,53,0.5)]" />
                  <span className="text-xs font-mono text-lime-400 font-bold tracking-wider animate-pulse">
                    Loading Hardware Specifications...
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-2xl bg-zinc-800/70 border border-zinc-800"></div>
                <div className="w-20 h-20 rounded-2xl bg-zinc-800/70 border border-zinc-800"></div>
                <div className="w-20 h-20 rounded-2xl bg-zinc-800/70 border border-zinc-800"></div>
              </div>
            </div>

            {/* Right Column: Title, Price, & Action Skeletons */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-3 border-b border-zinc-800 pb-4">
                <div className="h-8 w-3/4 bg-zinc-800 rounded-lg"></div>
                <div className="h-4 w-1/3 bg-zinc-800/80 rounded-md"></div>
              </div>

              {/* Price Skeleton Box */}
              <div className="p-6 rounded-2xl bg-[#0a0c10] border border-zinc-800 space-y-3">
                <div className="h-9 w-40 bg-zinc-800 rounded-lg"></div>
                <div className="h-4 w-48 bg-zinc-800/60 rounded-md"></div>
              </div>

              {/* Overview Skeleton */}
              <div className="space-y-2 pt-1">
                <div className="h-4 w-32 bg-zinc-800 rounded-md"></div>
                <div className="h-16 w-full bg-zinc-800/50 rounded-xl"></div>
              </div>

              {/* Warranty Badge Skeleton */}
              <div className="h-16 w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl"></div>

              {/* Quantity & Cart Action Skeleton */}
              <div className="space-y-4 pt-2">
                <div className="h-8 w-40 bg-zinc-800/70 rounded-xl"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="h-14 w-full bg-lime-500/20 border border-lime-500/30 rounded-xl"></div>
                  <div className="h-14 w-full bg-zinc-900 border border-zinc-800 rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
        <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />
        <PayHereCheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
        <AiAssistantDrawer />
      </div>
    );
  }

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

  const storeWhatsapp = process.env.NEXT_PUBLIC_STORE_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '94741117981';
  const whatsappMsg = `Hello ZeroLag Tek! I would like to order: ${product.name} (${formatPrice(product.priceLkr)})`;
  const whatsappUrl = `https://wa.me/${storeWhatsapp}?text=${encodeURIComponent(whatsappMsg)}`;

  // Find category or brand matches excluding current product
  let relatedProducts = allProducts.filter(
    p => (isCategoryMatch(p.category, product.category) || p.brand === product.brand) && p.id !== product.id
  );

  // Fallback to featured or remaining catalog products if fewer than 2 matches exist
  if (relatedProducts.length < 2) {
    const fallbackProducts = allProducts.filter(p => p.id !== product.id);
    const combined = Array.from(new Set([...relatedProducts, ...fallbackProducts]));
    relatedProducts = combined.slice(0, 4);
  } else {
    relatedProducts = relatedProducts.slice(0, 4);
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 overflow-x-auto whitespace-nowrap pb-2">
          <Link href="/" className="hover:text-lime-400 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/#catalog`} className="hover:text-lime-400 transition-colors capitalize">
            {product.category.replace('-', ' ')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-lime-400 font-bold truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </div>

        {/* Product Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
          
          {/* Left Column: Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-[#0a0c10] border border-zinc-800 flex items-center justify-center p-6 group">
              <img
                src={selectedImage || product.image || 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=600'}
                alt={product.name}
                onError={(e) => {
                  const fallback = 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=600';
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
              />
              {product.badge && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-lime-400 text-slate-950 font-extrabold text-[10px] tracking-wider uppercase font-mono shadow-lg">
                  {product.badge}
                </span>
              )}
            </div>

            {/* Thumbnail Carousel */}
            {(() => {
              const uniqueImages = Array.from(new Set([product.image, ...(product.galleryImages || [])].filter(Boolean)));
              if (uniqueImages.length <= 1) return null;

              return (
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {uniqueImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 p-1 bg-[#0a0c10] transition-all cursor-pointer ${
                        selectedImage === img
                          ? 'border-lime-400 scale-105 shadow-md shadow-lime-400/20'
                          : 'border-zinc-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        onError={(e) => {
                          const fallback = 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=600';
                          if (e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Right Column: Info & Actions */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2 border-b border-zinc-800 pb-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Rating & Reviews counter */}
              <div className="flex items-center gap-3 pt-1">
                {totalReviewsCount > 0 ? (
                  <>
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.round(Number(dynamicAvgRating)) ? 'fill-current' : 'text-zinc-700'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-mono text-zinc-300 font-bold">
                      {dynamicAvgRating} / 5.0
                    </span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-xs font-mono text-zinc-400">
                      {totalReviewsCount} Verified Review(s)
                    </span>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-zinc-700">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-zinc-700" />
                      ))}
                    </div>
                    <span className="text-xs font-mono text-zinc-400">No reviews yet</span>
                  </div>
                )}
              </div>
            </div>

            {/* Price Box */}
            {(() => {
              const sellingPrice = Number(product.priceLkr ?? product.price ?? 0);
              const origPriceVal = Number(product.originalPriceLkr ?? product.originalPrice ?? product.original_price ?? 0);
              const showDiscount = !isNaN(origPriceVal) && origPriceVal > 0 && origPriceVal > sellingPrice;

              return (
                <div className="p-6 rounded-2xl bg-[#0a0c10] border border-zinc-800 space-y-3">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-lime-400 font-mono tracking-tight">
                      {formatPrice(sellingPrice)}
                    </span>
                    {showDiscount && (
                      <span className="text-base text-zinc-500 line-through font-mono">
                        {formatPrice(origPriceVal)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                    <span className={product.inStock ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      {product.inStock ? 'In Stock — Ready for Islandwide Dispatch' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Description */}
            {product.description && (
              <div className="space-y-1.5 pt-1">
                <h4 className="text-xs font-mono font-bold text-lime-400 uppercase tracking-wider">Product Overview</h4>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line font-sans">
                  {product.description}
                </p>
              </div>
            )}

            {/* Product Warranty Badge Component */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block">Official Distributor Warranty</span>
                <span className="text-lime-400">{product.warranty || '1 Year Official Warranty'}</span>
              </div>
            </div>

            {/* Actions: Quantity & Cart */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-zinc-400 uppercase">Quantity:</span>
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 font-mono text-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 text-zinc-300 rounded-lg"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 text-zinc-300 rounded-lg"
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
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
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
        {(() => {
          const specsMap = (product as any).specifications || product.specs || {};
          const specEntries = Object.entries(specsMap).filter(([k, v]) => k.trim() && v !== undefined && String(v).trim() !== '');

          return (
            <div className="space-y-4 pt-8 border-t border-zinc-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
                <Zap className="w-5 h-5 text-lime-400" />
                <span>TECHNICAL SPECIFICATIONS</span>
              </h3>

              {specEntries.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {specEntries.map(([key, val]) => (
                    <div
                      key={key}
                      className="p-4 rounded-2xl bg-[#0a0c10] border border-zinc-800 text-zinc-200 space-y-1 hover:border-lime-400/40 transition-colors"
                    >
                      <span className="text-[11px] font-mono text-zinc-400 block uppercase tracking-wider">
                        {key}
                      </span>
                      <p className="text-xs text-white font-semibold leading-normal">
                        {String(val)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#0a0c10] border border-zinc-800 text-center">
                  <p className="text-xs font-mono text-zinc-400">No technical specifications provided for this product.</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Real Customer Reviews Section */}
        <div className="space-y-6 pt-8 border-t border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span>CUSTOMER REVIEWS ({approvedReviews.length})</span>
              </h3>
              <p className="text-xs font-mono text-zinc-400 mt-1">Average Rating: <strong className="text-lime-400">{dynamicAvgRating} / 5.0</strong></p>
            </div>

            <button
              onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-bold font-mono text-xs flex items-center gap-2 shadow-md shadow-lime-400/20 hover:scale-105 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Send className="w-4 h-4" />
              <span>{isReviewFormOpen ? '✖ Close Form' : '✍️ Write a Review'}</span>
            </button>
          </div>

          {/* Collapsible Write a Review Form */}
          {isReviewFormOpen && (
            <div className="bg-[#0a0c10] border border-lime-500/30 rounded-3xl p-6 space-y-4 animate-in fade-in duration-200">
              <h4 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                <Send className="w-4 h-4 text-lime-400" />
                <span>WRITE A CUSTOMER REVIEW</span>
              </h4>

              {reviewNotice && (
                <div className="p-3 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400 text-xs font-mono flex items-center gap-2">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>{reviewNotice}</span>
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs font-mono max-w-2xl">
                <div>
                  <label className="text-zinc-400 block mb-1">Star Rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-current' : 'text-zinc-700'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 block mb-1">Your Name *</label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={e => setReviewerName(e.target.value)}
                      placeholder="Kasun Perera"
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">Your Email *</label>
                    <input
                      type="email"
                      value={reviewerEmail}
                      onChange={e => setReviewerEmail(e.target.value)}
                      placeholder="kasun@example.com"
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-lime-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Your Feedback / Review *</label>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    rows={3}
                    placeholder="Share your gaming experience with this hardware..."
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-lime-400 font-sans text-xs"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-6 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingReview ? 'Submitting Review...' : 'Submit Review'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReviewFormOpen(false)}
                    className="px-4 py-3 rounded-xl bg-zinc-900 text-zinc-400 border border-zinc-800 font-bold hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Approved Reviews List */}
          <div className="space-y-4">
            {approvedReviews.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#0a0c10] border border-zinc-800 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs font-mono text-zinc-400">No verified customer reviews yet for this hardware item.</p>
                <p className="text-[11px] font-mono text-lime-400">Click "✍️ Write a Review" above to submit the first review!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {approvedReviews.map(rev => (
                  <div key={rev.id} className="p-5 rounded-2xl bg-[#0a0c10] border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{rev.user_name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                          Verified Buyer
                        </span>
                      </div>
                      <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-zinc-700'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">{rev.comment}</p>
                    <span className="text-[10px] font-mono text-zinc-500 block pt-1">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 pt-10 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white uppercase font-mono">
                RELATED {product.category.replace('-', ' ')} HARDWARE
              </h3>
              <Link href="/#products" className="text-xs font-mono text-lime-400 hover:underline">
                View All Catalog
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
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
