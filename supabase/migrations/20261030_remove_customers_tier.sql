-- ==============================================================================
-- HIGHLANDER GOLD & SILVER — REMOVE TIER COLUMN FROM CUSTOMERS TABLE
-- Run this query in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azibnvfxnsrocmobzswt/sql
-- ==============================================================================

-- 1. Drop index and check constraint on tier if they exist
DROP INDEX IF EXISTS public.idx_customers_tier;
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_tier_check;

-- 2. Drop the tier column from public.customers
ALTER TABLE public.customers DROP COLUMN IF EXISTS tier CASCADE;

-- 3. Update the trigger function to insert without the tier column
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

