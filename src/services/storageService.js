import { 
  initialInventory, 
  initialCategories, 
  initialCustomers, 
  initialOrders, 
  initialInquiries,
  initialPayments,
  initialCoupons,
  initialAdminUsers,
  initialNotifications,
  storefrontSettings,
  liveSpotPrices
} from '../data/initialData';

const STORAGE_KEYS = {
  INVENTORY: 'hgs_admin_inventory',
  CATEGORIES: 'hgs_admin_categories',
  CUSTOMERS: 'hgs_admin_customers',
  ORDERS: 'hgs_admin_orders',
  INQUIRIES: 'hgs_admin_inquiries',
  PAYMENTS: 'hgs_admin_payments',
  COUPONS: 'hgs_admin_coupons',
  ADMIN_USERS: 'hgs_admin_users',
  NOTIFICATIONS: 'hgs_admin_notifications',
  SETTINGS: 'hgs_admin_settings',
  SPOT_PRICES: 'hgs_admin_spot_prices',
};

// Safe JSON parse with fallback
function getStoredItem(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error reading localStorage for key ${key}:`, e);
    return defaultValue;
  }
}

// Safe JSON write
function setStoredItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing localStorage for key ${key}:`, e);
  }
}

// Local mock storage operations when Supabase is in dev mode
export const localDB = {
  getInventory: () => {
    const raw = getStoredItem(STORAGE_KEYS.INVENTORY, initialInventory);
    // Auto-heal: sanitize any broken hardcoded domains from existing browser localStorage
    const cleaned = raw.map(item => {
      const cleanImg = (img) => typeof img === 'string' ? img.replace(/^https?:\/\/highlander-gold(?:and|-)?silver\.vercel\.app\//i, '/') : img;
      const featImg = cleanImg(item.featured_image || '/assets/items/lot1_morgan_gold_gem.jpg');
      const addImgs = Array.isArray(item.additional_images) && item.additional_images.length > 0
        ? item.additional_images.map(cleanImg)
        : (Array.isArray(item.images) && item.images.length > 0 ? item.images.map(cleanImg) : [featImg]);
      return {
        ...item,
        featured_image: featImg,
        additional_images: addImgs,
        images: addImgs
      };
    });
    return cleaned;
  },
  setInventory: (items) => setStoredItem(STORAGE_KEYS.INVENTORY, items),

  getCategories: () => getStoredItem(STORAGE_KEYS.CATEGORIES, initialCategories),
  setCategories: (cats) => setStoredItem(STORAGE_KEYS.CATEGORIES, cats),

  getCustomers: () => getStoredItem(STORAGE_KEYS.CUSTOMERS, initialCustomers),
  setCustomers: (custs) => setStoredItem(STORAGE_KEYS.CUSTOMERS, custs),

  getOrders: () => {
    const orders = getStoredItem(STORAGE_KEYS.ORDERS, initialOrders);
    return (orders || []).map(o => o.payment_status === 'Pending Wire' ? { ...o, payment_status: 'Pending' } : o);
  },
  setOrders: (ords) => setStoredItem(STORAGE_KEYS.ORDERS, ords),

  getPayments: () => getStoredItem(STORAGE_KEYS.PAYMENTS, initialPayments),
  setPayments: (txns) => setStoredItem(STORAGE_KEYS.PAYMENTS, txns),

  getCoupons: () => getStoredItem(STORAGE_KEYS.COUPONS, initialCoupons),
  setCoupons: (cpns) => setStoredItem(STORAGE_KEYS.COUPONS, cpns),

  getAdminUsers: () => getStoredItem(STORAGE_KEYS.ADMIN_USERS, initialAdminUsers),
  setAdminUsers: (users) => setStoredItem(STORAGE_KEYS.ADMIN_USERS, users),

  getNotifications: () => getStoredItem(STORAGE_KEYS.NOTIFICATIONS, initialNotifications),
  setNotifications: (notifs) => setStoredItem(STORAGE_KEYS.NOTIFICATIONS, notifs),

  getInquiries: () => getStoredItem(STORAGE_KEYS.INQUIRIES, initialInquiries),
  setInquiries: (inqs) => setStoredItem(STORAGE_KEYS.INQUIRIES, inqs),

  getSettings: () => getStoredItem(STORAGE_KEYS.SETTINGS, storefrontSettings),
  setSettings: (settings) => setStoredItem(STORAGE_KEYS.SETTINGS, settings),

  getSpotPrices: () => getStoredItem(STORAGE_KEYS.SPOT_PRICES, liveSpotPrices),
  setSpotPrices: (spots) => setStoredItem(STORAGE_KEYS.SPOT_PRICES, spots),

  // Reset to original website state
  resetAll: () => {
    localStorage.removeItem(STORAGE_KEYS.INVENTORY);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.COUPONS);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_USERS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.INQUIRIES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.SPOT_PRICES);
  }
};
