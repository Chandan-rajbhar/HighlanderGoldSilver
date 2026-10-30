import { BusinessInfo, NavLink, StoreHighlight, PolicyItemData, ContactCardData } from '../types';
import { settingsService } from '../services/settingsService';

const initialSettings = typeof window !== 'undefined' ? settingsService.getActiveStorefrontContent() : null;

export const BUSINESS_INFO: BusinessInfo = {
  name: initialSettings?.business_name || "Highlander Gold & Silver",
  shortName: "HGS",
  address: initialSettings?.street 
    ? `${initialSettings.street}, ${initialSettings.city || 'Bigfork'}, ${initialSettings.state || 'MT'} ${initialSettings.zip || '59911'}` 
    : "119 Jewel Basin Ct. B3, Bigfork, MT 59911",
  street: initialSettings?.street || "119 Jewel Basin Ct. B3",
  city: initialSettings?.city || "Bigfork",
  state: initialSettings?.state || "MT",
  zip: initialSettings?.zip || "59911",
  phone: initialSettings?.phone || "4064070281",
  phoneFormatted: initialSettings?.phone_formatted || "(406) 407-0281",
  email: initialSettings?.email || "Stratford1955@icloud.com",
  payPalUrl: initialSettings?.paypal_url || "https://paypal.me/HighlanderGoldSilver",
  coordinates: "48°03'47.9\"N 114°04'20.6\"W",
  terms: {
    buyersPremium: `${Math.round((initialSettings?.buyers_premium_percent ?? 0.15) * 100)}%`,
    buyersPremiumPercent: initialSettings?.buyers_premium_percent ?? 0.15,
    shipping: "USPS Priority & Ground, fully insured in-house packaging",
    salesTax: "Montana Tax-Exempt (0% State Sales Tax)",
    closeTrigger: "Direct storefront purchase with instant checkout via PayPal",
    hours: initialSettings?.operating_hours || "Online Storefront Open 24/7"
  }
};

export const PRIMARY_NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '#hero' },
  { label: 'Collection', href: '#collection' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' }
];

export const FOOTER_NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '#hero' },
  { label: 'Collection', href: '#collection' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' }
];

export const INVENTORY_CLASSIFICATIONS: NavLink[] = [
  { label: 'Sovereign Gold Coins', href: '#collection' },
  { label: 'Morgan Silver Dollars', href: '#collection' },
  { label: 'Silver Bullion & Bars', href: '#collection' },
  { label: 'Commemorative Proofs', href: '#collection' },
  { label: 'Ancient Numismatics', href: '#collection' }
];

export const STORE_HIGHLIGHTS: StoreHighlight[] = [
  {
    title: initialSettings?.card1_title || "Direct Storefront Purchase",
    description: initialSettings?.card1_desc || "Browse curated inventory and purchase directly with seamless checkout or inquiry. No bidding wars, timed auction blocks, or waiting for listing clocks to expire.",
    iconName: "clock"
  },
  {
    title: initialSettings?.card2_title || "Sold Value Guarantee",
    description: initialSettings?.card2_desc || "Every coin is hand-picked for authentic eye appeal, luster, and strike. If proof is presented that an acquired coin was overpriced based on market state, HGS refunds the difference or accepts as-sold return.",
    iconName: "shieldCheck"
  },
  {
    title: initialSettings?.card3_title || "In-House Insured Delivery",
    description: initialSettings?.card3_desc || "All packaging and fulfillment is performed in-house from our Bigfork facility. Every parcel ships via USPS Priority or Ground, fully insured with delivery confirmation.",
    iconName: "package"
  },
  {
    title: initialSettings?.card4_title || "Transparent 15% Settlement",
    description: initialSettings?.card4_desc || "Flat 15% settlement fee across inventory with 0% Montana state sales tax. Direct PayPal checkout with instant confirmation, or wire credit on high-value acquisitions.",
    iconName: "creditCard"
  }
];

export const SETTLEMENT_POLICIES: PolicyItemData[] = [
  {
    title: "1. Insured Domestic Shipping",
    description: "All domestic shipments are fulfilled in-house via USPS Priority or Ground. Every parcel includes full insurance and postal tracking. Packages exceeding $500 require a signature upon delivery.",
    iconName: "package"
  },
  {
    title: "2. High-Dollar Wire Transfer Credit",
    description: "For high-value bullion or gold acquisitions that exceed credit card limits, bank wire payment is accepted with an incoming wire fee credit applied directly to your settlement.",
    iconName: "creditCard"
  },
  {
    title: "3. 24-Hour Settlement Window",
    description: "Settlement is requested within 24 hours of invoice issuance. Prompt payments guarantee next-business-day dispatch from our Bigfork facility.",
    iconName: "clock"
  }
];

export const CONTACT_CARDS: ContactCardData[] = [
  {
    label: "Physical Armory",
    title: "Bigfork, Montana",
    text: "119 Jewel Basin Ct. B3\nBigfork, MT 59911",
    subtext: "Flathead County · Private Consultations",
    actionText: "Get Directions",
    actionHref: "https://maps.google.com/?q=119+Jewel+Basin+Ct+B3+Bigfork+MT+59911",
    isExternal: true,
    iconName: "mapPin"
  },
  {
    label: "Direct Telephone",
    title: initialSettings?.phone_formatted || "406-407-0281",
    text: "Monday – Saturday\n9:00 AM – 6:00 PM MT",
    subtext: "Direct voice line for collectors",
    actionText: `Call ${initialSettings?.phone_formatted || '(406) 407-0281'}`,
    actionHref: `tel:${initialSettings?.phone || '4064070281'}`,
    isExternal: false,
    iconName: "phone"
  },
  {
    label: "Electronic Mail",
    title: initialSettings?.email || "Stratford1955@icloud.com",
    text: "Direct storefront inquiries, private treaty acquisitions & provenance questions answered directly.",
    actionText: "Email Us",
    actionHref: `mailto:${initialSettings?.email || 'Stratford1955@icloud.com'}`,
    isExternal: false,
    iconName: "mail"
  },
  {
    label: "Settlement Gateway",
    title: "paypal.me/HighlanderGoldSilver",
    text: "Official verified PayPal self-pay portal with comprehensive buyer protection.",
    actionText: "Visit PayPal",
    actionHref: initialSettings?.paypal_url || "https://paypal.me/HighlanderGoldSilver",
    isExternal: true,
    iconName: "creditCard"
  }
];

// Live client-side listener for instant updates from Supabase/admin settings
if (typeof window !== 'undefined') {
  const syncSettings = (data: any) => {
    if (!data) return;
    if (data.business_name) BUSINESS_INFO.name = data.business_name;
    if (data.street) {
      BUSINESS_INFO.street = data.street;
      BUSINESS_INFO.address = `${data.street}, ${data.city || BUSINESS_INFO.city}, ${data.state || BUSINESS_INFO.state} ${data.zip || BUSINESS_INFO.zip}`;
    }
    if (data.city) BUSINESS_INFO.city = data.city;
    if (data.state) BUSINESS_INFO.state = data.state;
    if (data.zip) BUSINESS_INFO.zip = data.zip;
    if (data.phone) BUSINESS_INFO.phone = data.phone;
    if (data.phone_formatted) {
      BUSINESS_INFO.phoneFormatted = data.phone_formatted;
      CONTACT_CARDS[1].title = data.phone_formatted;
      CONTACT_CARDS[1].actionText = `Call ${data.phone_formatted}`;
    }
    if (data.email) {
      BUSINESS_INFO.email = data.email;
      CONTACT_CARDS[2].title = data.email;
      CONTACT_CARDS[2].actionHref = `mailto:${data.email}`;
    }
    if (data.paypal_url) {
      BUSINESS_INFO.payPalUrl = data.paypal_url;
      CONTACT_CARDS[3].actionHref = data.paypal_url;
    }
    if (data.operating_hours) BUSINESS_INFO.terms.hours = data.operating_hours;
    if (data.buyers_premium_percent !== undefined) {
      BUSINESS_INFO.terms.buyersPremiumPercent = Number(data.buyers_premium_percent);
      BUSINESS_INFO.terms.buyersPremium = `${Math.round(Number(data.buyers_premium_percent) * 100)}%`;
    }

    if (data.card1_title) STORE_HIGHLIGHTS[0].title = data.card1_title;
    if (data.card1_desc) STORE_HIGHLIGHTS[0].description = data.card1_desc;
    if (data.card2_title) STORE_HIGHLIGHTS[1].title = data.card2_title;
    if (data.card2_desc) STORE_HIGHLIGHTS[1].description = data.card2_desc;
    if (data.card3_title) STORE_HIGHLIGHTS[2].title = data.card3_title;
    if (data.card3_desc) STORE_HIGHLIGHTS[2].description = data.card3_desc;
    if (data.card4_title) STORE_HIGHLIGHTS[3].title = data.card4_title;
    if (data.card4_desc) STORE_HIGHLIGHTS[3].description = data.card4_desc;
  };

  window.addEventListener('hgs:settings-updated', ((e: CustomEvent) => {
    syncSettings(e.detail);
  }) as EventListener);

  settingsService.getSettings().then(syncSettings).catch(() => {});
}
