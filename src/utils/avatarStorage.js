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

