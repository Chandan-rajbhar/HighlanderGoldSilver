-- ==============================================================================
-- Migration: 20261030_allow_public_inquiries.sql
-- Description: Enable public inquiries submission from storefront and full admin visibility
-- ==============================================================================

-- 1. Ensure inquiries table exists with expected structure
CREATE TABLE IF NOT EXISTS public.inquiries (
    id TEXT PRIMARY KEY DEFAULT ('inq-' || substr(gen_random_uuid()::text, 1, 8)),
    lot_number TEXT,
    lot_title TEXT,
    inventory_id TEXT,
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

-- Ensure all columns exist
ALTER TABLE public.inquiries
    ADD COLUMN IF NOT EXISTS lot_number TEXT,
    ADD COLUMN IF NOT EXISTS lot_title TEXT,
    ADD COLUMN IF NOT EXISTS inventory_id TEXT,
    ADD COLUMN IF NOT EXISTS inquirer_name TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS inquiry_type TEXT DEFAULT 'General',
    ADD COLUMN IF NOT EXISTS message TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'New',
    ADD COLUMN IF NOT EXISTS admin_notes TEXT,
    ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. Drop restrictive check constraints so all storefront inquiry categories are accepted
ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_inquiry_type_check;
ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_status_check 
    CHECK (status IN ('New', 'In Progress', 'Replied', 'Closed'));

-- 3. Configure Row Level Security (RLS) policies
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Clean existing policies on inquiries
DROP POLICY IF EXISTS "Public Insert Inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Staff Full Inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Allow Read Inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Allow Update Inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Allow Delete Inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Allow All Inquiries" ON public.inquiries;

-- Allow all operations for anon, authenticated, and service_role
CREATE POLICY "Allow All Inquiries" ON public.inquiries
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Grant explicit table privileges
GRANT ALL ON public.inquiries TO anon, authenticated, service_role;

-- 5. Add to realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'inquiries'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiries;
    END IF;
END $$;
