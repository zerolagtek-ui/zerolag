'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ProductCard } from './ProductCard';
import { Product, Category } from '@/types';
import { getStoredProducts, getDynamicCategories, syncProductsFromSupabase } from '@/lib/storeManager';
import { getProductsFromSupabase, isCategoryMatch, normalizeCategory } from '@/lib/productsData';
import { Cpu, Search, SlidersHorizontal, Check, RefreshCw, Loader2, PackageCheck, PackageX } from 'lucide-react';

export function ProductGrid({ externalSearchQuery, externalCategory, onSelectCategory, initialProducts }: {
  externalSearchQuery?: string;
  externalCategory?: string;
  onSelectCategory?: (catId: string) => void;
  initialProducts?: Product[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Filtering states
  const [selectedCategory, setSelectedCategory] = useState(externalCategory || 'all');
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Progressive batch loading state (Infinite Scroll)
  const [displayedCount, setDisplayedCount] = useState(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  useEffect(() => {
    async function loadGridProducts() {
      try {
        const fetched = await getProductsFromSupabase();
        if (fetched && fetched.length > 0) {
          setProducts(fetched);
        } else {
          const stored = getStoredProducts();
          if (stored && stored.length > 0) {
            setProducts(stored);
          }
        }
      } catch (err) {
        console.error('[ProductGrid] Error loading products:', err);
        const stored = getStoredProducts();
        if (stored && stored.length > 0) {
          setProducts(stored);
        }
      }
      setCategories(getDynamicCategories());
    }

    loadGridProducts();

    const handleUpdate = () => {
      const stored = getStoredProducts();
      if (stored && stored.length > 0) {
        setProducts(stored);
      }
      setCategories(getDynamicCategories());
    };

    window.addEventListener('zerolag-products-updated', handleUpdate);
    window.addEventListener('zerolag-categories-updated', handleUpdate);
    return () => {
      window.removeEventListener('zerolag-products-updated', handleUpdate);
      window.removeEventListener('zerolag-categories-updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (externalCategory !== undefined) setSelectedCategory(externalCategory);
  }, [externalCategory]);

  useEffect(() => {
    if (externalSearchQuery !== undefined) setSearchQuery(externalSearchQuery);
  }, [externalSearchQuery]);

  // Reset pagination batch when filters change
  useEffect(() => {
    setDisplayedCount(8);
  }, [selectedCategory, searchQuery, sortBy, inStockOnly]);

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    if (onSelectCategory) onSelectCategory(catId);
  };

  // Filter and sort logic with robust category normalization
  const filteredProducts = products.filter((product) => {
    if (selectedCategory !== 'all' && !isCategoryMatch(product.category, selectedCategory)) return false;
    if (inStockOnly && !product.inStock) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = product.name.toLowerCase().includes(q);
      const brandMatch = product.brand.toLowerCase().includes(q);
      const categoryMatch = product.category.toLowerCase().includes(q);
      return nameMatch || brandMatch || categoryMatch;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.priceLkr - b.priceLkr;
    if (sortBy === 'price-desc') return b.priceLkr - a.priceLkr;
    if (sortBy === 'rating') return b.rating - a.rating;
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  const visibleProducts = filteredProducts.slice(0, displayedCount);
  const hasMore = displayedCount < filteredProducts.length;

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayedCount((prev) => prev + 4);
      setIsLoadingMore(false);
    }, 400);
  };

  // IntersectionObserver for seamless Infinite Scroll
  useEffect(() => {
    const target = observerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  const activeNormCategory = normalizeCategory(selectedCategory);

  return (
    <section id="catalog" className="py-12 bg-black text-white transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-6 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-lime-400 font-mono text-xs font-bold uppercase tracking-wider mb-2">
              <Cpu className="w-4 h-4" />
              <span>HARDWARE CATALOG</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              PERFORMANCE STOREFRONT
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
            <span>Showing {visibleProducts.length} of {filteredProducts.length} items</span>
          </div>
        </div>

        {/* Dynamic Category Selector Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
          <button
            onClick={() => handleCategoryClick('all')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all border whitespace-nowrap ${
              activeNormCategory === 'all'
                ? 'bg-lime-400 text-slate-950 border-lime-400 shadow-md shadow-lime-400/20'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
            }`}
          >
            All Categories ({products.length})
          </button>

          {categories.map((cat) => {
            const count = products.filter(p => isCategoryMatch(p.category, cat.id)).length;
            const catNorm = normalizeCategory(cat.id);
            const isSelected = activeNormCategory === catNorm;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all border whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-lime-400 text-slate-950 border-lime-400 shadow-md shadow-lime-400/20'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls Strip */}
        <div className="p-3 sm:p-4 rounded-2xl bg-[#0a0c10] border border-zinc-800 flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 sm:gap-4 text-xs font-mono shadow-sm">
          
          {/* Search Input */}
          <div className="relative w-full sm:flex-1 sm:min-w-[240px]">
            <input
              type="text"
              placeholder="Search products by title or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-lime-400 focus:outline-none"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex w-full sm:w-auto flex-wrap items-center gap-2 sm:gap-3 justify-between sm:justify-start">
            {/* In Stock Toggle */}
            <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer bg-zinc-950 px-2.5 sm:px-3 py-2 rounded-xl border border-zinc-800 text-zinc-300 text-[11px] sm:text-xs">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-lime-400"
              />
              <span>In-Stock Only</span>
            </label>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 sm:px-3 py-2 rounded-xl border border-zinc-800 text-[11px] sm:text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-lime-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[11px] sm:text-xs text-zinc-200 focus:outline-none"
              >
                <option value="featured">Featured Hardware</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

        </div>

        {/* Main Product Cards Grid */}
        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-[#0a0c10] border border-zinc-800 rounded-3xl space-y-4">
            {products.length === 0 ? (
              <>
                <PackageX className="w-12 h-12 text-zinc-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No Products Available</h3>
                <p className="text-xs text-zinc-400 font-mono">
                  The store catalog is currently empty. Check back soon for new inventory!
                </p>
              </>
            ) : (
              <>
                <Cpu className="w-12 h-12 text-zinc-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No products found matching criteria</h3>
                <p className="text-xs text-zinc-400 font-mono">Try adjusting your category filters or search query.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setInStockOnly(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-lime-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Infinite Scroll Sentinel & Load More Trigger */}
        <div ref={observerRef} className="pt-8 text-center space-y-4">
          {isLoadingMore && (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-lime-400 text-xs font-mono font-bold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading Next Batch of Hardware...</span>
            </div>
          )}

          {hasMore && !isLoadingMore && (
            <button
              onClick={handleLoadMore}
              className="px-8 py-3.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-lime-400 text-white font-mono font-bold text-xs hover:text-lime-400 transition-all shadow-lg hover:scale-105"
            >
              LOAD MORE HARDWARE ({filteredProducts.length - displayedCount} REMAINING)
            </button>
          )}

          {!hasMore && filteredProducts.length > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-500 text-xs font-mono">
              <PackageCheck className="w-4 h-4 text-emerald-500" />
              <span>You&apos;ve reached the end of the catalog ({filteredProducts.length} items)</span>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
