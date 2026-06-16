import { createContext, useContext, useState, useCallback } from "react";
import { translateBatch, getCached } from "./services/translate";

export const LanguageContext = createContext();

// ── English strings — only maintain this one list from now on ─────────────────
// Any new text you add here auto-translates to Telugu on language switch.
export const EN = {
  profile: "Profile",
  reorder: "Reorder",
  notice: "⚠️  Caution: We currently deliver only within Visakhapatnam.",
  heroTitle: "Pure Grains.\nRooted in Tradition.",
  heroPara: "From our farms to your table,\ngiving you trust, taste,\nand wholesome nutrition.",
  shopNow: "SHOP NOW",
  topBrands: "TOP BRANDS",
  seeAll: "See All →",
  shopByCategory: "SHOP BY CATEGORY",
  basmati: "BASMATI RICE",
  nonBasmati: "NON BASMATI RICE",
  millets: "MILLETS",
  nonBasmatiSection: "NON BASMATI",
  basmatiSection: "BASMATI RICE",
  milletsSection: "MILLETS",
  seeAllProducts: "See All",
  sonaRaw: "Sona Masoorie Raw Rice",
  sonaSteam: "Sona Masoorie Steam Rice",
  basmatiPremium: "Premium Basmati Rice",
  basmatiAged: "Aged Basmati Rice",
  foxtailMillet: "Foxtail Millet (Korra)",
  pearlMillet: "Pearl Millet (Sajja)",
  fingerMillet: "Finger Millet (Ragi)",
  littleMillet: "Little Millet (Samalu)",
  productDetails: "Product Details",
  addToCart: "Add to Cart",
  aboutProduct: "About this product",
  aboutDesc: "Sona Masoori is a medium grain rice known for its soft texture, light aroma and great taste. Perfect for daily cooking.",
  premiumQuality: "Premium Quality",
  naturallyAged: "Naturally Aged",
  pureHygienic: "Pure & Hygienic",
  type: "Type", variety: "Variety", weight: "Weight",
  shelfLife: "Shelf Life", storageInstructions: "Storage Instructions",
  storageValue: "Store in a cool, dry place",
  shelfLifeValue: "12 Months",
  rawRice: "Raw Rice", steamRice: "Steam Rice", sonaVariety: "Sona Masoori",
  basmatiRice: "Basmati Rice", basmatiVariety: "1121 Basmati", basmatiAgedVariety: "Aged 2 Years",
  milletType: "Millet", foxtailVariety: "Native Variety", pearlVariety: "Native Variety",
  fingerVariety: "Ragi Variety", littleVariety: "Native Variety",
  productNotFound: "Product not found", goHome: "Go Home",
  myCart: "My Cart", items: "items", item: "item",
  cartEmpty: "Your cart is empty", shopNowBtn: "Shop Now",
  subtotal: "Subtotal", deliveryFee: "Delivery Fee",
  free: "FREE", toPay: "To Pay", proceedCheckout: "Proceed to Checkout",
  searchPlaceholder: "Search for products...",
  recentSearches: "Recent Searches", popularSearches: "Popular Searches",
  resultsFor: "Results for", sorry: "Sorry!", notAvailable: "This item is currently not available.",
  tryAlternatives: "You can try these alternatives",
  home: "Home", cart: "Cart", searchNav: "Search products...",
  added: "added", goToCart: "Go to Cart →",
  checkout: "Checkout",
  deliveryDetails: "Delivery Details",
  fullName: "Full Name",
  mobileNumber: "Mobile Number",
  address: "Delivery Address",
  city: "City",
  pincode: "Pincode",
  deliverySlot: "Choose Delivery Slot",
  paymentMethod: "Payment Method",
  cod: "Cash on Delivery",
  online: "Online Payment",
  placeOrder: "Place Order",
  orderSummary: "Order Summary",
  morning: "Morning (8 AM – 12 PM)",
  afternoon: "Afternoon (12 PM – 4 PM)",
  evening: "Evening (4 PM – 8 PM)",
  orderPlaced: "Order Placed",
  confirmed: "Confirmed",
  dispatched: "Dispatched",
  outForDelivery: "Out for Delivery",
  delivered: "Delivered",
  trackOrder: "Track Order",
  estimatedDelivery: "Estimated Delivery",
  orderId: "Order ID",
  orderDate: "Order Date",
  loginTitle: "Login / Sign Up",
  enterMobile: "Enter your mobile number",
  sendOtp: "Send OTP",
  enterOtp: "Enter OTP",
  verifyOtp: "Verify OTP",
  otpSent: "OTP sent to",
  resendOtp: "Resend OTP",
  loginWelcome: "Welcome to Root Grains",
  loginSubtitle: "Login to track orders & save addresses",
  myProfile: "My Profile",
  myOrders: "My Orders",
  savedAddresses: "Saved Addresses",
  settings: "Settings",
  logout: "Logout",
  language: "Language",
  notifications: "Notifications",
  helpSupport: "Help & Support",
  whatsapp: "Chat on WhatsApp",
  noOrders: "No orders yet",
  viewOrder: "View Order",
  adminDashboard: "Admin Dashboard",
  totalOrders: "Total Orders",
  totalRevenue: "Total Revenue",
  totalProducts: "Total Products",
  totalCustomers: "Total Customers",
  recentOrders: "Recent Orders",
  manageProducts: "Manage Products",
  manageOrders: "Manage Orders",
  manageCustomers: "Manage Customers",
  manageBanners: "Manage Banners",
  addProduct: "Add Product",
  updateStatus: "Update Status",
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  allOrders: "All Orders",
};

// Build a translated `t` object by mapping each EN value → Telugu translation
function buildTeluguT(teMap) {
  return Object.fromEntries(
    Object.entries(EN).map(([key, val]) => [
      key,
      typeof val === "string" ? (teMap[val] || val) : val,
    ])
  );
}

// Pre-load already-cached Telugu strings so first render is instant
function loadCachedTeMap() {
  const map = {};
  for (const [, val] of Object.entries(EN)) {
    if (typeof val !== "string") continue;
    const cached = getCached(val, "te");
    if (cached) map[val] = cached;
  }
  return map;
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("EN");
  const [teMap, setTeMap] = useState(loadCachedTeMap);
  const [translating, setTranslating] = useState(false);

  const toggleLang = useCallback(async () => {
    if (lang === "TE") {
      setLang("EN");
      return;
    }

    // Switch to Telugu — translate any strings not yet cached
    setLang("TE");

    const enValues = Object.values(EN).filter(v => typeof v === "string");
    const uncached = enValues.filter(v => !getCached(v, "te"));

    if (uncached.length === 0) return; // all already cached, instant switch

    setTranslating(true);
    try {
      await translateBatch(uncached, "te");
      setTeMap(loadCachedTeMap()); // refresh from updated cache
    } catch {}
    setTranslating(false);
  }, [lang]);

  const t = lang === "EN" ? EN : buildTeluguT(teMap);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, translating }}>
      {translating && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 99999,
          background: "var(--brown-dark)", color: "#f5e6c8",
          padding: "8px 16px", fontSize: "12px", fontWeight: 600,
          textAlign: "center", letterSpacing: "0.5px",
        }}>
          Translating to Telugu...
        </div>
      )}
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() { return useContext(LanguageContext); }

// Kept for backward compatibility — any import of `translations` still works
export const translations = { EN };
