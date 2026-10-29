-- ==============================================================================
-- HIGHLANDER GOLD & SILVER — PRODUCTION SUPABASE DATABASE SCHEMA
-- Location: 119 Jewel Basin Ct. B3, Bigfork, MT 59911
-- Description: Complete schema for rare coins, certified bullion & wire settlements
-- Project: https://azibnvfxnsrocmobzswt.supabase.co
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CATEGORIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY DEFAULT ('cat-' || substr(gen_random_uuid()::text, 1, 8)),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    metal_type TEXT NOT NULL DEFAULT 'Other' CHECK (metal_type IN ('Gold', 'Silver', 'Platinum', 'Mixed', 'Other')),
    item_count INTEGER NOT NULL DEFAULT 0,
    total_valuation NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. INVENTORY / CATALOG LOTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inventory (
    id TEXT PRIMARY KEY DEFAULT ('item-' || substr(gen_random_uuid()::text, 1, 8)),
    lot_number TEXT NOT NULL UNIQUE,
    sku TEXT UNIQUE,
    title TEXT NOT NULL,
    lead TEXT,
    description TEXT,
    category TEXT REFERENCES public.categories(name) ON UPDATE CASCADE ON DELETE SET NULL,
    category_id TEXT REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
    metal TEXT NOT NULL DEFAULT 'Other' CHECK (metal IN ('Gold', 'Silver', 'Platinum', 'Palladium', 'Copper', 'Other')),
    coin_type TEXT,
    year TEXT,
    country_mint TEXT,
    denomination TEXT,
    weight TEXT,
    weight_troy_oz NUMERIC(10, 4) DEFAULT 0.0000,
    purity TEXT,
    fineness NUMERIC(5, 4) DEFAULT 0.0000,
    grade TEXT,
    cert_company TEXT DEFAULT 'Raw / Uncertified' CHECK (cert_company IN ('NGC', 'PCGS', 'CAC', 'PCI', 'Mint Certified', 'Raw / Uncertified', 'Other')),
    cert_number TEXT,
    special_features TEXT,
    mintage TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    inventory INTEGER NOT NULL DEFAULT 1 CHECK (inventory >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 1 CHECK (stock_quantity >= 0),
    stock_status TEXT NOT NULL DEFAULT 'In Stock' CHECK (stock_status IN ('In Stock', 'Low Stock', 'Out of Stock', 'Pre-Order')),
    storefront_status TEXT NOT NULL DEFAULT 'Active' CHECK (storefront_status IN ('Active', 'Draft', 'Hidden', 'Archived', 'Sold')),
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Reserved', 'Sold', 'Unavailable')),
    show_on_storefront BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    estimate_range TEXT,
    payment_note TEXT,
    featured_image TEXT NOT NULL,
    additional_images JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. CUSTOMERS / USERS DIRECTORY TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY DEFAULT ('cust-' || substr(gen_random_uuid()::text, 1, 8)),
    customer_id TEXT NOT NULL UNIQUE,
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    city TEXT DEFAULT 'Bigfork',
    state TEXT DEFAULT 'MT',
    interest TEXT,
    total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    orders_count INTEGER NOT NULL DEFAULT 0,
    account_status TEXT NOT NULL DEFAULT 'Active' CHECK (account_status IN ('Active', 'Suspended', 'Pending Verification')),
    tier TEXT NOT NULL DEFAULT 'Collector' CHECK (tier IN ('Collector', 'VIP Vault', 'Active', 'Inactive')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. COUPONS & PROMOTIONAL DISCOUNTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY DEFAULT ('cpn-' || substr(gen_random_uuid()::text, 1, 8)),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_value > 0),
    min_spend NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    max_discount NUMERIC(12, 2),
    usage_count INTEGER NOT NULL DEFAULT 0,
    usage_limit INTEGER,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Scheduled', 'Expired', 'Disabled')),
    valid_from DATE,
    valid_until DATE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. ORDERS & WIRE SETTLEMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT ('ord-' || substr(gen_random_uuid()::text, 1, 8)),
    order_number TEXT NOT NULL UNIQUE,
    order_id TEXT,
    customer_id TEXT REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    base_subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    buyers_premium_percent NUMERIC(4, 2) NOT NULL DEFAULT 0.15,
    buyers_premium_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    shipping_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_settlement NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Bank Wire', 'PayPal', 'Vault Pickup', 'Certified Check', 'Other')),
    payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Pending Wire', 'Paid', 'Settled', 'Refunded', 'Cancelled')),
    fulfillment_status TEXT NOT NULL DEFAULT 'Placed' CHECK (fulfillment_status IN ('Placed', 'Processing', 'Vault Dispatch', 'Dispatched', 'Shipped', 'Delivered', 'Cancelled')),
    order_status TEXT DEFAULT 'Processing',
    shipping_address JSONB,
    tracking_number TEXT,
    carrier TEXT DEFAULT 'FedEx Insured Priority',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. NORMALIZED ORDER ITEMS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
    inventory_id TEXT REFERENCES public.inventory(id) ON UPDATE CASCADE ON DELETE SET NULL,
    lot_number TEXT NOT NULL,
    sku TEXT,
    title TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    buyers_premium_rate NUMERIC(4, 2) NOT NULL DEFAULT 0.15,
    buyers_premium_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. PAYMENTS & TRANSACTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY DEFAULT ('pay-' || substr(gen_random_uuid()::text, 1, 8)),
    transaction_id TEXT NOT NULL UNIQUE,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Bank Wire', 'PayPal', 'Vault Cash', 'Certified Check', 'Other')),
    payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Completed', 'Pending', 'Failed', 'Refunded')),
    gateway_reference TEXT,
    settlement_notes TEXT,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 9. ADMIN USERS & STAFF ROLES TABLE (Linked to auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY,
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'Admin' CHECK (role IN ('Super Admin', 'Vault Director', 'Inventory Manager', 'Order Manager', 'Auditor')),
    title TEXT DEFAULT 'Senior Numismatist & Vault Director',
    location TEXT DEFAULT 'Bigfork Storefront & Vault, MT',
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    two_factor_enabled BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 10. INQUIRIES & ACQUISITIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inquiries (
    id TEXT PRIMARY KEY DEFAULT ('inq-' || substr(gen_random_uuid()::text, 1, 8)),
    lot_number TEXT,
    lot_title TEXT,
    inventory_id TEXT REFERENCES public.inventory(id) ON UPDATE CASCADE ON DELETE SET NULL,
    inquirer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    inquiry_type TEXT NOT NULL DEFAULT 'General' CHECK (inquiry_type IN ('Lot Acquisition', 'Condition / Provenance', 'Sell / Appraisal', 'General', 'Product Inquiry', 'Authentication', 'Order / Payment', 'Shipping')),
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Replied', 'Closed')),
    admin_notes TEXT,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 11. NOTIFICATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT ('notif-' || substr(gen_random_uuid()::text, 1, 8)),
    title TEXT NOT NULL,
    detail TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'system' CHECK (category IN ('wire', 'order', 'inquiry', 'inventory', 'system')),
    read BOOLEAN NOT NULL DEFAULT false,
    reference_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 12. STOREFRONT SETTINGS TABLE (Singleton Configuration)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'current' CHECK (id = 'current'),
    business_name TEXT NOT NULL DEFAULT 'Highlander Gold & Silver',
    tagline TEXT DEFAULT 'Rare Coins, Bullion & Precious Metals Marketplace',
    street TEXT NOT NULL DEFAULT '119 Jewel Basin Ct. B3',
    city TEXT NOT NULL DEFAULT 'Bigfork',
    state TEXT NOT NULL DEFAULT 'MT',
    zip TEXT NOT NULL DEFAULT '59911',
    phone TEXT NOT NULL DEFAULT '4064070281',
    phone_formatted TEXT NOT NULL DEFAULT '(406) 407-0281',
    email TEXT NOT NULL DEFAULT 'Stratford1955@icloud.com',
    paypal_url TEXT NOT NULL DEFAULT 'https://paypal.me/HighlanderGoldSilver',
    buyers_premium_percent NUMERIC(4, 2) NOT NULL DEFAULT 0.15 CHECK (buyers_premium_percent BETWEEN 0 AND 1),
    operating_hours TEXT DEFAULT 'Online Storefront 24/7 | Vault By Appointment',
    bank_wire_instructions TEXT DEFAULT 'Bigfork First National Bank | Account: Highlander Gold & Silver LLC | Routing: 092901234',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 13. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_metal ON public.inventory(metal);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory(status, storefront_status);
CREATE INDEX IF NOT EXISTS idx_inventory_lot ON public.inventory(lot_number);
CREATE INDEX IF NOT EXISTS idx_inventory_price ON public.inventory(price);
CREATE INDEX IF NOT EXISTS idx_inventory_created ON public.inventory(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON public.customers(tier);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(payment_status, fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON public.inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read, created_at DESC);

-- ==============================================================================
-- 14. AUTOMATIC SYNCHRONIZATION TRIGGERS
-- ==============================================================================

-- Trigger A: Update category lot count and valuation when inventory changes
CREATE OR REPLACE FUNCTION public.sync_category_metrics()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.categories c
    SET 
        item_count = (
            SELECT COUNT(*)::INTEGER FROM public.inventory i WHERE i.category = c.name
        ),
        total_valuation = (
            SELECT COALESCE(SUM(i.price), 0.00) FROM public.inventory i WHERE i.category = c.name
        ),
        updated_at = timezone('utc'::text, now())
    WHERE c.name = COALESCE(NEW.category, OLD.category);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_category_metrics ON public.inventory;
CREATE TRIGGER trg_sync_category_metrics
AFTER INSERT OR UPDATE OF category, price OR DELETE ON public.inventory
FOR EACH ROW EXECUTE FUNCTION public.sync_category_metrics();

-- Trigger B: Synchronize customer lifetime spend & order counts when orders settle
CREATE OR REPLACE FUNCTION public.sync_customer_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.customer_id IS NOT NULL) THEN
        UPDATE public.customers cust
        SET 
            orders_count = (
                SELECT COUNT(*)::INTEGER FROM public.orders o 
                WHERE o.customer_id = cust.id
            ),
            total_spent = (
                SELECT COALESCE(SUM(o.total_settlement), 0.00) FROM public.orders o 
                WHERE o.customer_id = cust.id 
                  AND o.payment_status IN ('Settled', 'Paid')
            ),
            updated_at = timezone('utc'::text, now())
        WHERE cust.id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_customer_metrics ON public.orders;
CREATE TRIGGER trg_sync_customer_metrics
AFTER INSERT OR UPDATE OF customer_id, total_settlement, payment_status OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.sync_customer_metrics();

-- Trigger C: Automatically set updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_updated ON public.inventory;
CREATE TRIGGER trg_inventory_updated BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated ON public.categories;
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated ON public.orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated ON public.customers;
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_inquiries_updated ON public.inquiries;
CREATE TRIGGER trg_inquiries_updated BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated ON public.payments;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_coupons_updated ON public.coupons;
CREATE TRIGGER trg_coupons_updated BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if active staff admin is signed in
CREATE OR REPLACE FUNCTION public.is_active_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.admin_users
                WHERE (auth_user_id = auth.uid() OR id = auth.uid()::text OR email = auth.jwt()->>'email')
                  AND status = 'Active'
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public Storefront Access Policies
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public Read Inventory" ON public.inventory;
CREATE POLICY "Public Read Inventory" ON public.inventory FOR SELECT USING (storefront_status = 'Active' AND show_on_storefront = true);

DROP POLICY IF EXISTS "Public Read Settings" ON public.store_settings;
CREATE POLICY "Public Read Settings" ON public.store_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Inquiries" ON public.inquiries;
CREATE POLICY "Public Insert Inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert Orders" ON public.orders;
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert Order Items" ON public.order_items;
CREATE POLICY "Public Insert Order Items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Authenticated Staff Admin Operations Policies
DROP POLICY IF EXISTS "Staff Full Categories" ON public.categories;
CREATE POLICY "Staff Full Categories" ON public.categories FOR ALL USING (public.is_active_staff());

DROP POLICY IF EXISTS "Staff Full Inventory" ON public.inventory;
CREATE POLICY "Staff Full Inventory" ON public.inventory FOR ALL USING (public.is_active_staff());

DROP POLICY IF EXISTS "Staff Full Customers" ON public.customers;
CREATE POLICY "Staff Full Customers" ON public.customers FOR ALL USING (public.is_active_staff());

DROP POLICY IF EXISTS "Staff Full Orders" ON public.orders;
CREATE POLICY "Staff Full Orders" ON public.orders FOR ALL USING (public.is_active_staff());

DROP POLICY IF EXISTS "Staff Full Order Items" ON public.order_items;
CREATE POLICY "Staff Full Order Items" ON public.order_items FOR ALL USING (public.is_active_staff());

DROP POLICY IF EXISTS "Staff Full Payments" ON public.payments;
CREATE POLICY "Staff Full Payments" ON public.payments FOR ALL USING (public.is_active_staff());

DROP POLICY IF EXISTS "Staff Full Inquiries" ON public.inquiries;
CREATE POLICY "Staff Full Inquiries" ON public.inquiries FOR ALL USING (public.is_active_staff());

DROP POLICY IF EXISTS "Staff Full Settings" ON public.store_settings;
CREATE POLICY "Staff Full Settings" ON public.store_settings FOR ALL USING (public.is_active_staff());

DROP POLICY IF EXISTS "Staff Full Notifications" ON public.notifications;
CREATE POLICY "Staff Full Notifications" ON public.notifications FOR ALL USING (public.is_active_staff());

DROP POLICY IF EXISTS "Staff Full Admin Users" ON public.admin_users;
CREATE POLICY "Staff Full Admin Users" ON public.admin_users FOR ALL USING (public.is_active_staff());

-- ==============================================================================
-- 16. INITIAL SEEDING: BUSINESS SETTINGS & DEFAULT SUPER ADMIN
-- ==============================================================================

-- Singleton store configuration
INSERT INTO public.store_settings (
    id, business_name, tagline, street, city, state, zip, phone, phone_formatted, 
    email, paypal_url, buyers_premium_percent, operating_hours, bank_wire_instructions
) VALUES (
    'current',
    'Highlander Gold & Silver',
    'Rare Coins, Bullion & Precious Metals Marketplace',
    '119 Jewel Basin Ct. B3',
    'Bigfork',
    'MT',
    '59911',
    '4064070281',
    '(406) 407-0281',
    'Stratford1955@icloud.com',
    'https://paypal.me/HighlanderGoldSilver',
    0.15,
    'Online Storefront 24/7 | Vault By Appointment',
    'Bigfork First National Bank | Account: Highlander Gold & Silver LLC | Routing: 092901234'
) ON CONFLICT (id) DO NOTHING;

-- Default Super Admin staff profile
INSERT INTO public.admin_users (
    id, name, email, role, title, location, status, two_factor_enabled
) VALUES (
    'adm-001',
    'Alexander MacLeod',
    'Stratford1955@icloud.com',
    'Super Admin',
    'Senior Numismatist & Vault Director',
    'Bigfork Storefront & Vault, MT',
    'Active',
    true
) ON CONFLICT (id) DO NOTHING;
