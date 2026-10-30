-- ==============================================================================
-- Migration: 20261030_inventory_storage_bucket.sql
-- Description: Create public 'inventory' storage bucket and update images to links
-- ==============================================================================

-- 1. Create the 'inventory' bucket in Supabase storage if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'inventory',
    'inventory',
    true,
    15728640, -- 15MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage RLS policies for 'inventory' bucket
DROP POLICY IF EXISTS "Public Read Inventory Images" ON storage.objects;
CREATE POLICY "Public Read Inventory Images" ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'inventory');

DROP POLICY IF EXISTS "Allow Upload Inventory Images" ON storage.objects;
CREATE POLICY "Allow Upload Inventory Images" ON storage.objects
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'inventory');

DROP POLICY IF EXISTS "Allow Update Inventory Images" ON storage.objects;
CREATE POLICY "Allow Update Inventory Images" ON storage.objects
    FOR UPDATE
    TO anon, authenticated
    USING (bucket_id = 'inventory');

DROP POLICY IF EXISTS "Allow Delete Inventory Images" ON storage.objects;
CREATE POLICY "Allow Delete Inventory Images" ON storage.objects
    FOR DELETE
    TO anon, authenticated
    USING (bucket_id = 'inventory');

-- 3. Convert existing /assets/items/ local paths in public.inventory to full public links
UPDATE public.inventory
SET 
    featured_image = REPLACE(featured_image, '/assets/items/', 'https://azibnvfxnsrocmobzswt.supabase.co/storage/v1/object/public/inventory/items/'),
    additional_images = (
        SELECT jsonb_agg(
            CASE 
                WHEN elem::text LIKE '"/assets/items/%"' 
                THEN to_jsonb(REPLACE(elem #>> '{}', '/assets/items/', 'https://azibnvfxnsrocmobzswt.supabase.co/storage/v1/object/public/inventory/items/'))
                ELSE elem 
            END
        )
        FROM jsonb_array_elements(additional_images) AS elem
    )
WHERE 
    featured_image LIKE '/assets/items/%' 
    OR additional_images::text LIKE '%/assets/items/%';

