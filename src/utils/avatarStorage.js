/**
 * Highlander User & Collector Avatar Storage Engine
 * Provides persistent local caching, cross-tab synchronization,
 * and seamless fallback so photos never disappear on page refresh.
 */

const AVATAR_CACHE_KEY = 'hgs_user_avatars';

/**
 * Retrieve all cached avatars from localStorage
 * @returns {Record<string, string>} Mapping of userId/email to image data URL
 */
export const getAvatarCache = () => {
  try {
    const raw = localStorage.getItem(AVATAR_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
};

/**
 * Get cached avatar for a user by id or email
 * @param {string} [id] - User or customer ID
 * @param {string} [email] - User or customer email address
 * @returns {string} - Base64 Data URL or empty string
 */
export const getCachedAvatar = (id, email) => {
  const cache = getAvatarCache();
  if (id && cache[id]) return cache[id];
  if (email && cache[email.toLowerCase().trim()]) {
    return cache[email.toLowerCase().trim()];
  }
  return '';
};

/**
 * Persistently save an avatar data URL for an admin or customer
 * @param {string} [id] - User or customer ID
 * @param {string} dataUrl - Compressed Base64 image data URL
 * @param {string} [email] - User or customer email address
 */
export const saveCachedAvatar = (id, dataUrl, email) => {
  if (!dataUrl) return;
  try {
    const cache = getAvatarCache();
    if (id) cache[id] = dataUrl;
    if (email) cache[email.toLowerCase().trim()] = dataUrl;
    localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache));

    // Broadcast update across all tabs and windows
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('hgs_avatar_sync');
        bc.postMessage({ type: 'AVATAR_UPDATED', id, email, avatar_url: dataUrl });
        setTimeout(() => bc.close(), 100);
      }
    } catch (_) {}
  } catch (err) {
    console.warn('Avatar cache storage error:', err);
  }
};

/**
 * Remove an avatar from local cache
 * @param {string} [id]
 * @param {string} [email]
 */
export const removeCachedAvatar = (id, email) => {
  try {
    const cache = getAvatarCache();
    if (id) delete cache[id];
    if (email) delete cache[email.toLowerCase().trim()];
    localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache));

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('hgs_avatar_sync');
        bc.postMessage({ type: 'AVATAR_REMOVED', id, email });
        setTimeout(() => bc.close(), 100);
      }
    } catch (_) {}
  } catch (err) {
    console.warn('Avatar cache remove error:', err);
  }
};

/**
 * Extract avatar URL from any user or customer object.
 * Checks item.avatar_url, item.notes (if JSON encoded by storefront),
 * auth user_metadata, and fallback local cache.
 * Automatically persists to local cache if found.
 */
export const extractAvatarUrl = (item) => {
  if (!item) return '';

  let url = '';
  if (item.avatar_url && typeof item.avatar_url === 'string' && item.avatar_url.trim()) {
    url = item.avatar_url.trim();
  }

  // Check if storefront stored avatar_url inside notes JSON (e.g. {"avatar_url":"https://..."})
  if (!url && item.notes && typeof item.notes === 'string' && item.notes.includes('avatar_url')) {
    try {
      const parsed = JSON.parse(item.notes);
      if (parsed?.avatar_url && typeof parsed.avatar_url === 'string') {
        url = parsed.avatar_url.trim();
      }
    } catch (_) {
      const match = item.notes.match(/"avatar_url"\s*:\s*"([^"]+)"/);
      if (match && match[1]) {
        url = match[1].trim();
      }
    }
  }

  // Check user_metadata
  if (!url && item.user_metadata?.avatar_url) {
    url = item.user_metadata.avatar_url;
  }

  // Fallback to local cache by id or email
  if (!url) {
    url = getCachedAvatar(item.id || item.customer_id, item.email);
  }

  // If found, ensure it is cached in local cache
  if (url && (item.id || item.customer_id || item.email)) {
    saveCachedAvatar(item.id || item.customer_id, url, item.email);
  }

  return url;
};

