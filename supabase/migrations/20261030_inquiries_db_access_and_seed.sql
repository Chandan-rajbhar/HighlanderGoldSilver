-- ==============================================================================
-- HIGHLANDER GOLD & SILVER — CUSTOMER INQUIRIES DATABASE & REALTIME MIGRATION
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azibnvfxnsrocmobzswt/sql
-- ==============================================================================

-- 1. Ensure inquiries table exists with complete enterprise columns
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

-- Ensure all columns are present if the table was created previously with fewer columns
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

-- 2. Drop restrictive constraints to ensure smooth storefront submissions
ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_inquiry_type_check;
ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_status_check 
    CHECK (status IN ('New', 'In Progress', 'Replied', 'Closed'));

-- 3. Configure Row Level Security (RLS) policies
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Clean legacy or restrictive policies
DROP POLICY IF EXISTS "Public Insert Inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Staff Full Inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Allow Read Inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Allow Update Inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Allow Delete Inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Allow All Inquiries" ON public.inquiries;

-- Enable full read/write access for storefront submissions & admin dashboard management
CREATE POLICY "Allow All Inquiries" ON public.inquiries
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Grant explicit table privileges
GRANT ALL ON public.inquiries TO anon, authenticated, service_role;

-- 5. Enable Supabase Realtime publication so changes sync to admin dashboard instantly
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

-- 6. Seed initial numismatic customer inquiries into the database
INSERT INTO public.inquiries (id, lot_number, lot_title, inquirer_name, email, phone, inquiry_type, message, status, created_at)
VALUES
    (
        'inq-001',
        '1',
        '1876 George T. Morgan Proposed $100 Gold Union™',
        'Col. Harrison Bradley',
        'hbradley.ret@montanaweb.com',
        '(406) 837-5120',
        'Lot Acquisition',
        'Inquiring if Lot #1 is still available for private view at your Jewel Basin Court storefront. Would like to arrange bank wire settlement.',
        'In Progress',
        '2026-10-25T09:30:00Z'
    ),
    (
        'inq-002',
        '153',
        '1897 Morgan Silver Dollar MS-65 PL',
        'Sarah Lindquist',
        'slindquist@numisguild.org',
        '(208) 664-8890',
        'Condition / Provenance',
        'Could you send a high resolution close-up of the reverse eagle denticles and certification number verification?',
        'Replied',
        '2026-10-26T14:20:00Z'
    ),
    (
        'inq-003',
        NULL,
        'Precious Metals Liquidation / Buyback',
        'David K. Campbell',
        'dcampbell@flatheadholdings.com',
        '(406) 261-3344',
        'Sell / Appraisal',
        'I have 50 oz of silver rounds and three $20 Liberty gold double eagles from an estate. Are you currently buying at Bigfork vault?',
        'New',
        '2026-10-27T10:15:00Z'
    ),
    (
        'inq-004',
        '9',
        '1921 Pilgrim Tercentenary 50¢ Silver Commemorative MS-65',
        'Arthur Pendleton',
        'a.pendleton@pacificnorthwest.org',
        '(406) 755-9012',
        'Lot Acquisition',
        'Interested in securing Lot #9 Pilgrim Tercentenary. Is direct PayPal settlement eligible for immediate vault dispatch?',
        'New',
        '2026-10-28T11:45:00Z'
    ),
    (
        'inq-005',
        '170',
        '10 oz Scottsdale Silver Stacker® Bar .999 Fine',
        'Evelyn Cross',
        'cross.evelyn@bigskycapital.com',
        '(406) 862-4411',
        'Product Inquiry',
        'Looking to purchase 5 units of the 10 oz Scottsdale stackers if you have additional inventory incoming to Bigfork vault.',
        'In Progress',
        '2026-10-29T08:15:00Z'
    ),
    (
        'inq-006',
        NULL,
        'Private Vault Appointment & Numismatic Appraisal',
        'Franklin Vance',
        'f.vance@yellowstoneestates.com',
        '(406) 587-3320',
        'General Inquiry',
        'Requesting an in-person appointment at your 119 Jewel Basin Ct location for physical inspection of high-grade Saint-Gaudens double eagles.',
        'Replied',
        '2026-10-29T16:00:00Z'
    )
ON CONFLICT (id) DO UPDATE SET
    lot_number = EXCLUDED.lot_number,
    lot_title = EXCLUDED.lot_title,
    inquirer_name = EXCLUDED.inquirer_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    inquiry_type = EXCLUDED.inquiry_type,
    message = EXCLUDED.message,
    status = EXCLUDED.status;

