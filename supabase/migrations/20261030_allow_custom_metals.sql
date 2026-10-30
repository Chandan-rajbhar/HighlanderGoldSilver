-- Migration: Allow custom metal names for categories and inventory lots
-- Removes the hardcoded CHECK constraints restricting metal types.

-- 1. Drop standard named constraints
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_metal_type_check;
ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_metal_check;

-- 2. Dynamic cleanup: Drop any other check constraint referencing metal columns on public.categories or public.inventory
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT c.conname, t.relname
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND t.relname IN ('categories', 'inventory')
          AND c.contype = 'c'
          AND pg_get_constraintdef(c.oid) LIKE '%metal%'
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I;', r.relname, r.conname);
    END LOOP;
END $$;
