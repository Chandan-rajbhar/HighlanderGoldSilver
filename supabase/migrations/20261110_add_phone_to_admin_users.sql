-- ==============================================================================
-- HIGHLANDER GOLD & SILVER — ADD PHONE, CITY & STATE TO PUBLIC.ADMIN_USERS
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azibnvfxnsrocmobzswt/sql
-- ==============================================================================

-- 1. Add contact phone, city, and state columns to public.admin_users
ALTER TABLE public.admin_users
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. Backfill existing admin contact phone if empty (preserves any existing value)
UPDATE public.admin_users
SET
    phone = COALESCE(phone, '(406) 883-2210'),
    city = COALESCE(city, 'Bigfork'),
    state = COALESCE(state, 'MT')
WHERE id = 'adm-001'
  AND (phone IS NULL OR city IS NULL OR state IS NULL);

-- 3. Reload PostgREST schema cache immediately so REST API recognizes new columns
NOTIFY pgrst, 'reload schema';

