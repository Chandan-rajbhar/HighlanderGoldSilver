import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, SUPABASE_CONFIG } from '../lib/supabaseClient';

export const INVENTORY_STORAGE_BUCKET = 'inventory';

const MIME_MAP = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jfif: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  svg: 'image/svg+xml',
};

let _statelessStorageClient = null;
const getStatelessStorageClient = () => {
  if (_statelessStorageClient) return _statelessStorageClient;
  const supabaseUrl = (import.meta?.env?.VITE_SUPABASE_URL || SUPABASE_CONFIG.url || '').trim();
  const supabaseAnonKey = (import.meta?.env?.VITE_SUPABASE_ANON_KEY || SUPABASE_CONFIG.anonKey || '').trim();
  if (!supabaseUrl || !supabaseAnonKey) return null;

  _statelessStorageClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'hgs-stateless-storage-auth',
    },
  });
  return _statelessStorageClient;
};

const getNormalizedMimeType = (file, fileExt) => {
  const rawType = String(file?.type || '').toLowerCase().trim();
  if (rawType === 'image/jfif' || rawType === 'image/pjpeg' || rawType === 'image/jpg') {
    return 'image/jpeg';
  }
  if (rawType.startsWith('image/')) {
    return rawType;
  }
  return MIME_MAP[fileExt] || 'image/jpeg';
};

/**
 * Resolves any stored image path (relative Supabase bucket paths like "inventory/items/...",
 * "items/...", legacy deployed URLs, local static "/assets/...", data URLs, or full HTTPS URLs)
 * into a clean displayable & saveable URL without overwriting valid local assets.
 */
export const resolveInventoryImageUrl = (imgPath) => {
  if (!imgPath || typeof imgPath !== 'string') return '';
  let trimmed = imgPath.trim();
  if (!trimmed) return '';

  // Normalize legacy Vercel absolute paths back to root-relative paths
  trimmed = trimmed.replace(/^https?:\/\/highlander-gold(?:and|-)?silver\.vercel\.app\//i, '/');

  // Already a full web URL or inline URI
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Normalize Windows backslashes cleanly
  const forwardPath = trimmed.replace(/\\/g, '/');

  // Keep valid local static public assets untouched (/assets/items/..., /assets/products/...)
  if (forwardPath.startsWith('/assets/') || forwardPath.startsWith('assets/')) {
    return forwardPath.startsWith('/') ? forwardPath : `/${forwardPath}`;
  }

  // Strip leading slashes or storage path prefixes so bucket paths resolve reliably
  let rel = forwardPath.replace(/^\/+/, '');
  const publicPrefix = `storage/v1/object/public/${INVENTORY_STORAGE_BUCKET}/`;
  if (rel.startsWith(publicPrefix)) {
    rel = rel.slice(publicPrefix.length);
  }
  if (rel.toLowerCase().startsWith(`${INVENTORY_STORAGE_BUCKET}/`)) {
    rel = rel.slice(INVENTORY_STORAGE_BUCKET.length + 1);
  }

  // If bare filename without subfolder, default to items/
  const bucketKey = rel.includes('/') ? rel : `items/${rel}`;
  const supabaseBase = (import.meta?.env?.VITE_SUPABASE_URL || SUPABASE_CONFIG.url || '').replace(/\/+$/, '');
  if (supabaseBase) {
    return `${supabaseBase}/storage/v1/object/public/${INVENTORY_STORAGE_BUCKET}/${bucketKey}`;
  }

  return trimmed;
};

/**
 * Backward-compatible alias used across forms and services.
 */
export const normalizeImageToLink = resolveInventoryImageUrl;

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

  const rawExt = (file.name ? file.name.split('.').pop() : 'jpg').toLowerCase();
  const safeExt = rawExt === 'jfif' ? 'jpg' : rawExt;
  const safeBaseName = (file.name ? file.name.replace(/\.[^/.]+$/, '') : 'img')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 30);
  const uniqueKey = Math.random().toString(36).substring(2, 8);
  const fileName = `${Date.now()}_${safeBaseName}_${uniqueKey}.${safeExt}`;
  const filePath = `${prefix}/${fileName}`;
  const contentType = getNormalizedMimeType(file, rawExt);

  // If Supabase is configured, upload to storage bucket
  if (isSupabaseConfigured() && supabase) {
    const uploadOptions = {
      cacheControl: '31536000', // 1 year cache
      upsert: true,
      contentType,
    };

    // Guard against oversized user session JWTs (>4KB from base64 user_metadata avatars) triggering nginx 400 Bad Request
    let usePrimaryClient = true;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const tokenLen = sessionData?.session?.access_token?.length || 0;
      if (tokenLen > 4096) {
        usePrimaryClient = false;
      }
    } catch {
      // ignore session inspection errors
    }

    let lastError = null;
    if (usePrimaryClient) {
      try {
        const { error } = await supabase.storage
          .from(INVENTORY_STORAGE_BUCKET)
          .upload(filePath, file, uploadOptions);
        if (!error) {
          const { data: urlData } = supabase.storage
            .from(INVENTORY_STORAGE_BUCKET)
            .getPublicUrl(filePath);
          if (urlData?.publicUrl) return urlData.publicUrl;
        } else {
          lastError = error;
          console.warn('Primary storage upload note, retrying with stateless storage client:', error.message || error);
        }
      } catch (err) {
        lastError = err;
      }
    }

    const statelessClient = getStatelessStorageClient();
    if (statelessClient) {
      const { error } = await statelessClient.storage
        .from(INVENTORY_STORAGE_BUCKET)
        .upload(filePath, file, uploadOptions);
      if (error) {
        throw new Error(error.message || 'Failed to upload image to Supabase Storage.');
      }
      const { data: urlData } = statelessClient.storage
        .from(INVENTORY_STORAGE_BUCKET)
        .getPublicUrl(filePath);
      if (urlData?.publicUrl) {
        return urlData.publicUrl;
      }
    }

    if (lastError) {
      throw new Error(lastError.message || 'Failed to upload image to Supabase Storage.');
    }
    throw new Error('Failed to upload image to cloud storage.');
  }

  // Graceful fallback to Data URL only when Supabase is offline/unconfigured
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

/**
 * Uploads a settings or brand image to the 'settings' directory in Supabase storage
 * and returns the permanent public HTTPS link.
 */
export const uploadSettingsImage = async (file) => {
  return uploadInventoryImage(file, 'settings');
};


