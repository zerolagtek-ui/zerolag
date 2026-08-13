-- ZeroLag Tek Store - Supabase Database Schema Initialization
-- Run this script in the Supabase SQL Editor to create tables, indexes, RLS policies, and seed data.

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    image TEXT NOT NULL,
    images JSONB DEFAULT '[]'::jsonb,
    image2_url TEXT,
    image3_url TEXT,
    image4_url TEXT,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    specs JSONB DEFAULT '{}'::jsonb,
    in_stock BOOLEAN DEFAULT true,
    rating NUMERIC DEFAULT 5.0,
    warranty TEXT DEFAULT '1 Year Official Warranty',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Optional: Alter existing products table if columns do not exist
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image2_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image3_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image4_url TEXT;


-- 2. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC NOT NULL,
    shipping_fee NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. USERS TABLE (Consolidated Admins & Customers with Verification)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT DEFAULT 'User',
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    is_verified BOOLEAN DEFAULT false,
    verification_token TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- PERMISSIVE RLS POLICIES
-- Products: Anyone can read, service role / anon can insert/update/delete
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable All Operations Products" ON public.products;
CREATE POLICY "Enable All Operations Products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Orders: Anyone can insert and read orders
DROP POLICY IF EXISTS "Public Read Orders" ON public.orders;
CREATE POLICY "Public Read Orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable All Operations Orders" ON public.orders;
CREATE POLICY "Enable All Operations Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- Users: Anyone can insert/read/update users
DROP POLICY IF EXISTS "Enable All Operations Users" ON public.users;
CREATE POLICY "Enable All Operations Users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- Reviews: Public read approved reviews, public insert pending reviews, admin full operations
DROP POLICY IF EXISTS "Public Read Approved Reviews" ON public.reviews;
CREATE POLICY "Public Read Approved Reviews" ON public.reviews FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Public Insert Pending Reviews" ON public.reviews;
CREATE POLICY "Public Insert Pending Reviews" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable All Operations Reviews" ON public.reviews;
CREATE POLICY "Enable All Operations Reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

-- SEED DATA FOR ADMIN USER (Always Verified)
INSERT INTO public.users (email, password_hash, name, role, is_verified)
VALUES ('zerolagtek@gmail.com', 'admin123', 'ZeroLag Admin', 'admin', true)
ON CONFLICT (email) DO UPDATE SET role = 'admin', is_verified = true;
