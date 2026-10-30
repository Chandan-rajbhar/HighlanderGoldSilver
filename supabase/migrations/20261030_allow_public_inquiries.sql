-- ==============================================================================
-- Migration: 20261030_allow_public_inquiries.sql
-- Description: Enable public inquiries submission from storefront and full admin visibility
-- ==============================================================================

-- 1. Ensure inquiries table exists with expected structure
CREATE TABLE IF NOT EXISTS public.inquiries (
    id TEXT PRIMARY KEY DEFAULT ('inq-' || substr(gen_random_uuid()::text, 1, 8)),
    lot_number TEXT,
    lot_title TEXT,
    inventory_id TEXT REFERENCES public.inventory(id) ON UPDATE CASCADE ON DELETE SET NULL,
    inquirer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    inquiry_type TEXT NOT NULL DEFAULT 'General',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New',
    admin_notes TEXT,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Drop restrictive check constraints so all storefront inquiry categories are accepted
ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_inquiry_type_check;

-- Ensure status constraint is clean
ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_status_check 
    CHECK (status IN ('New', 'In Progress', 'Replied', 'Closed'));

-- 3. Ensure updated_at trigger is active
DROP TRIGGER IF EXISTS trg_inquiries_updated ON public.inquiries;
CREATE TRIGGER trg_inquiries_updated
    BEFORE UPDATE ON public.inquiries
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 4. Configure Row Level Security (RLS) policies
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Clean existing policies on inquiries
DROP POLICY IF EXISTS "Public Insert Inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Staff Full Inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Allow Read Inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Allow Update Inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Allow Delete Inquiries" ON public.inquiries;

-- Policy A: Anyone (public anonymous visitors + logged in users) can submit an inquiry from storefront
CREATE POLICY "Public Insert Inquiries" ON public.inquiries
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Policy B: Allow reading inquiries (so admin dashboard & staff can view and count inquiries)
CREATE POLICY "Allow Read Inquiries" ON public.inquiries
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Policy C: Allow updating inquiry status (e.g. changing to Replied, In Progress, Closed)
CREATE POLICY "Allow Update Inquiries" ON public.inquiries
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Policy D: Allow deleting inquiries
CREATE POLICY "Allow Delete Inquiries" ON public.inquiries
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- 5. Grant explicit table privileges
GRANT ALL ON public.inquiries TO anon;
GRANT ALL ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
