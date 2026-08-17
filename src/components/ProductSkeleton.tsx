'use client';

import React from 'react';

export function ProductSkeleton() {
  return (
    <div className="rounded-2xl bg-[#0a0c10] border border-zinc-800/80 p-2.5 sm:p-4 flex flex-col justify-between space-y-3 animate-pulse">
      {/* Image Skeleton Box */}
      <div className="relative aspect-square w-full rounded-xl bg-zinc-900/80 border border-zinc-800/60 p-4 flex items-center justify-center overflow-hidden">
        <div className="w-16 h-16 rounded-xl bg-zinc-800/60" />
      </div>

      {/* Content Skeleton Lines */}
      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Brand & Stock Pill Skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 bg-zinc-800/80 rounded" />
            <div className="h-3 w-12 bg-zinc-800/60 rounded" />
          </div>

          {/* Title Lines Skeleton */}
          <div className="h-4 w-full bg-zinc-800/90 rounded" />
          <div className="h-4 w-2/3 bg-zinc-800/70 rounded" />

          {/* Specs Pill Skeleton */}
          <div className="hidden sm:flex gap-1.5 pt-1">
            <div className="h-4 w-14 bg-zinc-900 rounded" />
            <div className="h-4 w-14 bg-zinc-900 rounded" />
          </div>
        </div>

        {/* Pricing & Button Skeleton */}
        <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="h-2.5 w-12 bg-zinc-800/50 rounded" />
            <div className="h-5 w-20 bg-lime-500/20 rounded" />
          </div>
          <div className="flex gap-1">
            <div className="w-8 h-8 rounded-lg bg-zinc-900" />
            <div className="w-8 h-8 rounded-lg bg-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductSkeleton key={idx} />
      ))}
    </div>
  );
}
