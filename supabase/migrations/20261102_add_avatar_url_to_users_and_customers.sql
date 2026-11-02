-- ==============================================================================
-- HIGHLANDER GOLD & SILVER — PROFILE PHOTO (AVATAR) COLUMN MIGRATION
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azibnvfxnsrocmobzswt/sql
-- ==============================================================================

-- 1. Add avatar_url column to public.admin_users
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Add avatar_url column to public.customers
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';

