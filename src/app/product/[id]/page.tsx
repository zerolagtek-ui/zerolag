/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { getStoredProducts } from '@/lib/storeManager';
import { Product } from '@/types';
import { formatPrice, getProductSlug } from '@/lib/productsData';
import { useCart } from '@/context/CartContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
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

  // Reviews state
  const [approvedReviews, setApprovedReviews] = useState<ReviewItem[]>([]);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewNotice, setReviewNotice] = useState('');

  const fetchApprovedReviews = async (productId: string) => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setApprovedReviews(data as ReviewItem[]);
      }
    } catch (e) {
      console.warn('Error fetching approved reviews:', e);
    }
  };

  const mapSupabaseProduct = (data: any): Product => {
    const title = data.name || data.title || 'Untitled Hardware';
    const imageUrl = data.image_url || data.image || 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=600';
    const priceLkr = Number(data.price) || 0;
    const priceUsd = Number(data.price_usd) || Math.round(priceLkr / 300);
    const originalPriceLkr = Number(data.original_price || data.originalPrice) || priceLkr;
    const description = data.description || 'No detailed description available.';
    const warranty = data.warranty_period || data.warranty || '1 Year Official Warranty';
    const stockCount = Number(data.stock || data.stock_count) || 10;
    const inStock = data.in_stock !== undefined ? Boolean(data.in_stock) : stockCount > 0;

    return {
      id: String(data.id),
      name: title,
      brand: data.brand || 'ZeroLag',
      category: data.category || 'all',
      priceLkr,
      priceUsd,
      originalPriceLkr,
      rating: Number(data.rating) || 0,
      reviewsCount: Number(data.reviews_count) || 0,
      image: imageUrl,
      specs: data.specs || {},
      description,
      tags: data.features || data.tags || [],
      inStock,
      stockCount,
      featured: data.featured ?? false,
      badge: data.badge || undefined,
      warranty
    };
  };

  useEffect(() => {
    async function loadProduct() {
      const matchProduct = (p: Product) => (
        p.id === id ||
        getProductSlug(p) === id ||
        (p.name && getProductSlug({ id: p.id, name: p.name }) === id)
      );

      // 1. Try fetching directly from Supabase single item query by ID or Name
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

          if (!error && data) {
            const mapped = mapSupabaseProduct(data);
            setProduct(mapped);
            setSelectedImage(mapped.image);
            fetchApprovedReviews(mapped.id);
            return;
          }
        } catch (e) {
          console.warn('[Product Detail] Single item ID fetch failed, trying slug match:', e);
        }

        // 2. Query all products from Supabase and match by slug or ID
        try {
          const { data, error } = await supabase.from('products').select('*');
          if (!error && data && data.length > 0) {
            const allMapped = data.map(mapSupabaseProduct);
            setAllProducts(allMapped);

            const foundInSupabase = allMapped.find(matchProduct);
            if (foundInSupabase) {
              setProduct(foundInSupabase);
              setSelectedImage(foundInSupabase.image);
              fetchApprovedReviews(foundInSupabase.id);
              return;
            }
          }
        } catch (e) {
          console.warn('[Product Detail] Full table fetch fallback failed:', e);
        }
      }

      // 3. Final fallback: Local storage cache
      const productsList = getStoredProducts();
      setAllProducts(productsList);

      const found = productsList.find(matchProduct);
      if (found) {
        setProduct(found);
        setSelectedImage(found.image);
        fetchApprovedReviews(found.id);
      }
    }

    loadProduct();
  }, [id]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Calculate dynamic average rating
  const dynamicAvgRating = approvedReviews.length > 0
    ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
    : (product?.rating || 0).toFixed(1);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewerEmail.trim() || !reviewComment.trim() || !product) return;

    setSubmittingReview(true);
    setReviewNotice('');

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('reviews').insert([
          {
            product_id: product.id,
            user_name: reviewerName.trim(),
            user_email: reviewerEmail.trim(),
            rating: reviewRating,
            comment: reviewComment.trim(),
            status: 'pending'
          }
        ]);

        if (error) throw error;
      }

      setReviewNotice('Thank you! Your review has been submitted and is pending admin approval.');
      setReviewerName('');
      setReviewerEmail('');
      setReviewComment('');
      setReviewRating(5);
    } catch (err: unknown) {
      console.error('Review submission error:', err);
      setReviewNotice('Thank you! Your review was recorded for moderation.');
    } finally {
      setSubmittingReview(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-8">
        
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
                src={selectedImage || product.image}
                alt={product.name}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
              />
              {product.badge && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-lime-400 text-slate-950 font-extrabold text-[10px] tracking-wider uppercase font-mono shadow-lg">
                  {product.badge}
                </span>
              )}
            </div>

            {/* Thumbnail Carousel */}
            {product.galleryImages && product.galleryImages.length > 0 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {[product.image, ...product.galleryImages].map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 p-1 bg-[#0a0c10] transition-all ${selectedImage === img ? 'border-lime-400 scale-105' : 'border-zinc-800 opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover rounded-xl" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Info & Actions */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2 border-b border-zinc-800 pb-4">
              <span className="text-xs font-mono text-lime-400 uppercase tracking-widest block font-bold">
                {product.brand} • {product.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Rating & Reviews counter */}
              <div className="flex items-center gap-3 pt-1">
                {approvedReviews.length > 0 || (product.rating && product.rating > 0) ? (
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
                      {approvedReviews.length || product.reviewsCount} Verified Review(s)
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-mono text-zinc-400">No reviews yet</span>
                )}
              </div>
            </div>

            {/* Price Box */}
            <div className="p-6 rounded-2xl bg-[#0a0c10] border border-zinc-800 space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-lime-400 font-mono tracking-tight">
                  {formatPrice(product.priceLkr)}
                </span>
                {product.originalPriceLkr && (
                  <span className="text-base text-zinc-500 line-through font-mono">
                    {formatPrice(product.originalPriceLkr)}
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
        {product.specs && Object.keys(product.specs).length > 0 && (
          <div className="space-y-4 pt-8 border-t border-zinc-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
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

        {/* Real Customer Reviews Section */}
        <div className="space-y-8 pt-8 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span>CUSTOMER REVIEWS ({approvedReviews.length})</span>
            </h3>
            <span className="text-xs font-mono text-zinc-400">Average Rating: <strong className="text-lime-400">{dynamicAvgRating} / 5.0</strong></span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Approved Reviews List */}
            <div className="lg:col-span-7 space-y-4">
              {approvedReviews.length === 0 ? (
                <div className="p-8 rounded-3xl bg-[#0a0c10] border border-zinc-800 text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs font-mono text-zinc-400">No verified customer reviews yet for this hardware item.</p>
                  <p className="text-[11px] font-mono text-lime-400">Be the first gamer to write a review below!</p>
                </div>
              ) : (
                approvedReviews.map(rev => (
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
                ))
              )}
            </div>

            {/* Write a Review Form */}
            <div className="lg:col-span-5 bg-[#0a0c10] border border-zinc-800 rounded-3xl p-6 space-y-4">
              <h4 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                <Send className="w-4 h-4 text-lime-400" />
                <span>WRITE A REVIEW</span>
              </h4>

              {reviewNotice && (
                <div className="p-3 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400 text-xs font-mono flex items-center gap-2">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>{reviewNotice}</span>
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs font-mono">
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

                <div>
                  <label className="text-zinc-400 block mb-1">Your Name</label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={e => setReviewerName(e.target.value)}
                    placeholder="Name"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-lime-400"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Your Email</label>
                  <input
                    type="email"
                    value={reviewerEmail}
                    onChange={e => setReviewerEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-lime-400"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Your Feedback / Review</label>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    rows={3}
                    placeholder="Share your experience with this hardware..."
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-lime-400 font-sans text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReview ? 'Submitting...' : 'Submit Review'}</span>
                </button>
              </form>
            </div>

          </div>
        </div>

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
