-- ZeroLag Tek Store - Supabase SQL Database Schema & RLS Setup

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  "priceLkr" NUMERIC NOT NULL,
  "priceUsd" NUMERIC NOT NULL,
  "originalPriceLkr" NUMERIC,
  rating NUMERIC DEFAULT 5.0,
  "reviewsCount" INT DEFAULT 0,
  image TEXT NOT NULL,
  specs JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  "inStock" BOOLEAN DEFAULT true,
  "stockCount" INT DEFAULT 10,
  featured BOOLEAN DEFAULT false,
  badge TEXT,
  warranty TEXT DEFAULT '1 Year Warranty',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  "customerName" TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  "postalCode" TEXT,
  "paymentMethod" TEXT NOT NULL,
  "paymentStatus" TEXT DEFAULT 'Pending',
  "orderStatus" TEXT DEFAULT 'Pending',
  items JSONB DEFAULT '[]'::jsonb,
  "subtotalLkr" NUMERIC NOT NULL,
  "discountLkr" NUMERIC DEFAULT 0,
  "shippingLkr" NUMERIC DEFAULT 0,
  "totalLkr" NUMERIC NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for Public Access
-- Allow anyone to read products catalog
CREATE POLICY "Allow public read access to products"
  ON public.products FOR SELECT
  USING (true);

-- Allow admins/public to insert products
CREATE POLICY "Allow insert/update/delete on products"
  ON public.products FOR ALL
  USING (true);

-- Allow public to place orders and read orders
CREATE POLICY "Allow public read access to orders"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update/delete on orders"
  ON public.orders FOR ALL
  USING (true);
