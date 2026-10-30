-- ==============================================================================
-- HIGHLANDER GOLD & SILVER — SUPABASE DATABASE SCHEMA
-- Business: Rare Coins, Bullion & Precious Metals (Bigfork, Montana)
-- Website: https://highlander-goldandsilver.vercel.app/
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    metal_type TEXT DEFAULT 'Other',
    item_count INTEGER DEFAULT 0,
    total_valuation NUMERIC(12, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. INVENTORY / PRODUCT CATALOG TABLE
CREATE TABLE IF NOT EXISTS public.inventory (
    id TEXT PRIMARY KEY,
    lot_number TEXT NOT NULL UNIQUE,
    sku TEXT UNIQUE,
    title TEXT NOT NULL,
    lead TEXT,
    description TEXT,
    category TEXT REFERENCES public.categories(name) ON UPDATE CASCADE ON DELETE SET NULL,
    metal TEXT NOT NULL DEFAULT 'Other',
    coin_type TEXT,
    year TEXT,
    country_mint TEXT,
    denomination TEXT,
    weight TEXT,
    purity TEXT,
    grade TEXT,
    cert_company TEXT,
    cert_number TEXT,
    special_features TEXT,
    mintage TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stock_quantity INTEGER DEFAULT 1,
    stock_status TEXT DEFAULT 'In Stock' CHECK (stock_status IN ('In Stock', 'Low Stock', 'Out of Stock', 'Pre-Order')),
    storefront_status TEXT DEFAULT 'Active' CHECK (storefront_status IN ('Active', 'Draft', 'Hidden', 'Archived')),
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Reserved', 'Sold', 'Unavailable')),
    show_on_storefront BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    estimate_range TEXT,
    payment_note TEXT,
    featured_image TEXT,
    additional_images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CUSTOMERS / USERS TABLE (Storefront Public Buyers)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    customer_id TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    city TEXT,
    state TEXT,
    interest TEXT,
    total_spent NUMERIC(12, 2) DEFAULT 0.00,
    orders_count INTEGER DEFAULT 0,
    account_status TEXT DEFAULT 'Active' CHECK (account_status IN ('Active', 'Suspended', 'Pending Verification')),
    tier TEXT DEFAULT 'Collector' CHECK (tier IN ('Collector', 'VIP Vault', 'Active', 'Inactive')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ORDERS & SETTLEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    base_subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    buyers_premium_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_settlement NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Bank Wire', 'PayPal', 'Vault Pickup', 'Check', 'Other')),
    payment_status TEXT NOT NULL DEFAULT 'Pending Wire' CHECK (payment_status IN ('Pending Wire', 'Settled', 'Refunded', 'Cancelled')),
    fulfillment_status TEXT NOT NULL DEFAULT 'Awaiting Payment' CHECK (fulfillment_status IN ('Awaiting Payment', 'Vault Dispatch', 'Dispatched', 'Delivered', 'Cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. PAYMENTS & TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL UNIQUE,
    order_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Bank Wire', 'PayPal', 'Vault Cash', 'Certified Check', 'Other')),
    payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Completed', 'Pending', 'Failed', 'Refunded')),
    gateway_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. COUPONS & DISCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    min_spend NUMERIC(12, 2) DEFAULT 0.00,
    max_discount NUMERIC(12, 2),
    usage_count INTEGER DEFAULT 0,
    usage_limit INTEGER,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Scheduled', 'Expired', 'Disabled')),
    valid_from DATE,
    valid_until DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. ADMIN USERS & STAFF ROLES TABLE (Distinct from Storefront Customers)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('Super Admin', 'Vault Director', 'Inventory Manager', 'Order Manager', 'Auditor')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    two_factor_enabled BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. INQUIRIES & ACQUISITIONS TABLE
CREATE TABLE IF NOT EXISTS public.inquiries (
    id TEXT PRIMARY KEY,
    lot_number TEXT,
    lot_title TEXT,
    inquirer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('Lot Acquisition', 'Condition / Provenance', 'Sell / Appraisal', 'General')),
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Replied', 'Closed')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. SYSTEM NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    detail TEXT NOT NULL,
    category TEXT CHECK (category IN ('wire', 'order', 'inquiry', 'inventory', 'system')),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. STOREFRONT SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'current',
    business_name TEXT NOT NULL DEFAULT 'Highlander Gold & Silver',
    tagline TEXT DEFAULT 'Rare Coins, Bullion & Precious Metals Marketplace',
    street TEXT DEFAULT '119 Jewel Basin Ct. B3',
    city TEXT DEFAULT 'Bigfork',
    state TEXT DEFAULT 'MT',
    zip TEXT DEFAULT '59911',
    phone TEXT DEFAULT '4064070281',
    phone_formatted TEXT DEFAULT '(406) 407-0281',
    email TEXT DEFAULT 'Stratford1955@icloud.com',
    paypal_url TEXT DEFAULT 'https://paypal.me/HighlanderGoldSilver',
    buyers_premium_percent NUMERIC(4, 2) DEFAULT 0.15,
    operating_hours TEXT DEFAULT 'Online Storefront 24/7 | Vault By Appointment',
    bank_wire_instructions TEXT DEFAULT 'Bigfork First National Bank | Account: Highlander Gold & Silver LLC | Routing: 092901234',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- INDEXES FOR EGRESS OPTIMIZATION & PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_inventory_lot_number ON public.inventory(lot_number);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON public.inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_storefront_status ON public.inventory(storefront_status);
CREATE INDEX IF NOT EXISTS idx_inventory_price ON public.inventory(price);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON public.customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for public storefront & admin client)
CREATE POLICY "Public Read Inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Settings" ON public.store_settings FOR SELECT USING (true);

-- Allow authenticated/admin operations
CREATE POLICY "Allow All on Inventory" ON public.inventory FOR ALL USING (true);
CREATE POLICY "Allow All on Categories" ON public.categories FOR ALL USING (true);
CREATE POLICY "Allow All on Customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Allow All on Orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow All on Payments" ON public.payments FOR ALL USING (true);
CREATE POLICY "Allow All on Coupons" ON public.coupons FOR ALL USING (true);
CREATE POLICY "Allow All on Admin Users" ON public.admin_users FOR ALL USING (true);
CREATE POLICY "Allow All on Inquiries" ON public.inquiries FOR ALL USING (true);
CREATE POLICY "Allow All on Notifications" ON public.notifications FOR ALL USING (true);
CREATE POLICY "Allow All on Settings" ON public.store_settings FOR ALL USING (true);
