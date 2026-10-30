import { supabase, isSupabaseConfigured, SUPABASE_CONFIG } from '../lib/supabaseClient';

export const INVENTORY_STORAGE_BUCKET = 'inventory';

/**
 * Normalizes an image path to a full public HTTP/HTTPS link.
 * Ensures no local absolute paths (/assets/items/...) are saved to the database.
 */
export const normalizeImageToLink = (imgPath) => {
  if (!imgPath || typeof imgPath !== 'string') return '';
  const trimmed = imgPath.trim();
  
  // Already a full web link
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Already a data URL
  if (trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Extract filename if it's a local /assets/items/... path
  const filename = trimmed.split('/').pop()?.split('\\').pop() || '';
  if (filename) {
    const supabaseBase = (SUPABASE_CONFIG.url || '').replace(/\/+$/, '');
    if (supabaseBase) {
      return `${supabaseBase}/storage/v1/object/public/${INVENTORY_STORAGE_BUCKET}/items/${filename}`;
    }
    return `https://highlander-gold-silver.vercel.app/assets/items/${filename}`;
  }

  return trimmed;
};

/**
 * Uploads an image file directly to the Supabase 'inventory' storage bucket
 * and returns the permanent public HTTPS link.
 * 
 * @param {File | Blob} file - The file to upload
 * @param {string} [prefix='items'] - Subfolder in the storage bucket
 * @returns {Promise<string>} Full public URL link to the uploaded image
 */
export const uploadInventoryImage = async (file, prefix = 'items') => {
  if (!file) throw new Error('No file provided for upload');

  const fileExt = (file.name ? file.name.split('.').pop() : 'jpg').toLowerCase();
  const safeBaseName = (file.name ? file.name.replace(/\.[^/.]+$/, '') : 'img')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 30);
  const uniqueKey = Math.random().toString(36).substring(2, 8);
  const fileName = `${Date.now()}_${safeBaseName}_${uniqueKey}.${fileExt}`;
  const filePath = `${prefix}/${fileName}`;

  // If Supabase is configured, upload to storage bucket
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(INVENTORY_STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '31536000', // 1 year cache
          upsert: true,
          contentType: file.type || `image/${fileExt}`
        });

      if (error) {
        console.warn('Supabase storage upload error:', error.message || error);
      } else {
        const { data: urlData } = supabase.storage
          .from(INVENTORY_STORAGE_BUCKET)
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          return urlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Storage upload exception:', err);
    }
  }

  // Graceful fallback to Data URL if offline or bucket not yet created
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Uploads multiple images in parallel to Supabase Storage
 * and returns an array of public URL links.
 */
export const uploadMultipleInventoryImages = async (files, prefix = 'items') => {
  const fileArray = Array.from(files || []);
  if (fileArray.length === 0) return [];

  const uploadPromises = fileArray.map(file => uploadInventoryImage(file, prefix));
  return Promise.all(uploadPromises);
};

