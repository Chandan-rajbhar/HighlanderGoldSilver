-- ==============================================================================
-- HIGHLANDER GOLD & SILVER — NULLABLE CITY/STATE & DYNAMIC PROFILE UPDATE SYNC
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azibnvfxnsrocmobzswt/sql
-- ==============================================================================

-- 1. Remove hardcoded defaults so city & state are blank if not provided by user
ALTER TABLE public.customers ALTER COLUMN city DROP DEFAULT;
ALTER TABLE public.customers ALTER COLUMN state DROP DEFAULT;

-- 2. Clear defaulted 'Bigfork' / 'MT' for self-registered users who didn't enter one
UPDATE public.customers
SET city = NULL, state = NULL
WHERE (city = 'Bigfork' OR state = 'MT') AND notes LIKE '%Self-registered%';

-- 3. Update registration trigger to save NULL if city/state is not entered
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
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'city'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'state'), ''),
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'interest'), ''), 'Precious Metals & Rare Coins'),
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
        city = COALESCE(EXCLUDED.city, public.customers.city),
        state = COALESCE(EXCLUDED.state, public.customers.state),
        interest = COALESCE(NULLIF(public.customers.interest, ''), EXCLUDED.interest),
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Dynamic Profile Update Sync Trigger
-- When user updates city, state, name, or phone from their profile, automatically update public.customers in real-time
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.customers
    SET
        full_name = COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), public.customers.full_name),
        phone = COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''), public.customers.phone),
        city = NULLIF(TRIM(NEW.raw_user_meta_data->>'city'), ''),
        state = NULLIF(TRIM(NEW.raw_user_meta_data->>'state'), ''),
        updated_at = timezone('utc'::text, now())
    WHERE auth_user_id = NEW.id OR email = NEW.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- 5. Ensure RLS allows user to update their customer record directly
DROP POLICY IF EXISTS "Allow Update Customers" ON public.customers;
CREATE POLICY "Allow Update Customers" ON public.customers
FOR UPDATE USING (
    public.is_active_staff() OR 
    (auth.uid() IS NOT NULL AND auth_user_id = auth.uid()) OR
    (auth.jwt()->>'email' IS NOT NULL AND email = auth.jwt()->>'email')
) WITH CHECK (
    public.is_active_staff() OR 
    (auth.uid() IS NOT NULL AND auth_user_id = auth.uid()) OR
    (auth.jwt()->>'email' IS NOT NULL AND email = auth.jwt()->>'email')
);
