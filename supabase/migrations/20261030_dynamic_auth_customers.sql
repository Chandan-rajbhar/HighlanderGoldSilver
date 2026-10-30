-- ==============================================================================
-- HIGHLANDER GOLD & SILVER — DYNAMIC AUTH & CUSTOMER REGISTRATION MIGRATION
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azibnvfxnsrocmobzswt/sql
-- ==============================================================================

-- 1. Ensure all required columns exist on public.customers
ALTER TABLE public.customers
    ADD COLUMN IF NOT EXISTS customer_id TEXT,
    ADD COLUMN IF NOT EXISTS auth_user_id UUID,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Bigfork',
    ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'MT',
    ADD COLUMN IF NOT EXISTS interest TEXT DEFAULT 'Precious Metals & Rare Coins',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Add unique constraints if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'customers_customer_id_key'
    ) THEN
        ALTER TABLE public.customers ADD CONSTRAINT customers_customer_id_key UNIQUE (customer_id);
    END IF;
END $$;

-- 2. Configure Row Level Security (RLS) on public.customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow public and authenticated users to insert new customer registration records
DROP POLICY IF EXISTS "Allow Public Insert Customers" ON public.customers;
CREATE POLICY "Allow Public Insert Customers" ON public.customers
FOR INSERT WITH CHECK (true);

-- Allow active staff to manage all customers, and individual users to view their own profile
DROP POLICY IF EXISTS "Staff Full Customers" ON public.customers;
DROP POLICY IF EXISTS "Allow Read Customers" ON public.customers;
CREATE POLICY "Allow Read Customers" ON public.customers
FOR SELECT USING (
    public.is_active_staff() OR 
    (auth.uid() IS NOT NULL AND auth_user_id = auth.uid()) OR
    (auth.jwt()->>'email' IS NOT NULL AND email = auth.jwt()->>'email')
);

-- Allow active staff and individual users to update customer records
DROP POLICY IF EXISTS "Allow Update Customers" ON public.customers;
CREATE POLICY "Allow Update Customers" ON public.customers
FOR UPDATE USING (
    public.is_active_staff() OR 
    (auth.uid() IS NOT NULL AND auth_user_id = auth.uid())
);

-- Allow active staff to delete customers
DROP POLICY IF EXISTS "Allow Staff Delete Customers" ON public.customers;
CREATE POLICY "Allow Staff Delete Customers" ON public.customers
FOR DELETE USING (
    public.is_active_staff()
);

-- 3. Automatic Database Trigger: on_auth_user_created
-- When a user registers via Supabase Auth, automatically create their row in public.customers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_cust_id TEXT;
    short_id TEXT;
BEGIN
    short_id := substr(NEW.id::text, 1, 8);
    new_cust_id := 'CUST-' || floor(1000 + random() * 9000)::text;

    INSERT INTO public.customers (
        id,
        customer_id,
        auth_user_id,
        full_name,
        email,
        phone,
        city,
        state,
        interest,
        total_spent,
        orders_count,
        account_status,
        tier,
        notes,
        created_at,
        updated_at
    ) VALUES (
        'cust-' || short_id,
        new_cust_id,
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'city', 'Bigfork'),
        COALESCE(NEW.raw_user_meta_data->>'state', 'MT'),
        COALESCE(NEW.raw_user_meta_data->>'interest', 'Precious Metals & Rare Coins'),
        0.00,
        0,
        'Active',
        'Collector',
        'Self-registered via Highlander online portal.',
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    ON CONFLICT (email) DO UPDATE SET
        auth_user_id = EXCLUDED.auth_user_id,
        full_name = CASE 
            WHEN public.customers.full_name IS NULL OR public.customers.full_name = '' 
            THEN EXCLUDED.full_name 
            ELSE public.customers.full_name 
        END,
        phone = COALESCE(NULLIF(public.customers.phone, ''), EXCLUDED.phone),
        city = COALESCE(NULLIF(public.customers.city, ''), EXCLUDED.city),
        state = COALESCE(NULLIF(public.customers.state, ''), EXCLUDED.state),
        interest = COALESCE(NULLIF(public.customers.interest, ''), EXCLUDED.interest),
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
