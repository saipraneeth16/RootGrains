import {
  collection, doc, addDoc, updateDoc, getDocs, getDoc,
  query, orderBy, serverTimestamp, setDoc, increment, onSnapshot, deleteDoc
} from "firebase/firestore";
import { db } from "../firebase";

// ─── ORDERS ──────────────────────────────────────────────────────────────────
export async function createOrder(orderData) {
  const ref = await addDoc(collection(db, "orders"), {
    ...orderData,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  await incrementAnalytic("totalOrders");
  await incrementAnalytic("totalRevenue", orderData.total);
  return ref.id;
}

export async function getOrders() {
  const snap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function subscribeOrders(callback) {
  return onSnapshot(
    query(collection(db, "orders"), orderBy("createdAt", "desc")),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export async function updateOrderStatus(orderId, status) {
  await updateDoc(doc(db, "orders", orderId), { status, updatedAt: serverTimestamp() });
}

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
export async function getProducts() {
  const snap = await getDocs(query(collection(db, "products"), orderBy("category")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function subscribeProducts(callback) {
  return onSnapshot(collection(db, "products"), snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export async function addProduct(data) {
  return await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
}

export async function updateProduct(id, data) {
  await updateDoc(doc(db, "products", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, "products", id));
}

export async function seedProductsIfEmpty(products) {
  const snap = await getDocs(collection(db, "products"));
  const existingIds = new Set(snap.docs.map(d => d.id));
  // Seed any local product whose ID doesn't exist in Firestore yet
  for (const p of products) {
    if (!existingIds.has(String(p.id))) {
      await setDoc(doc(db, "products", String(p.id)), { ...p, stock: 100, active: true, createdAt: serverTimestamp() });
    }
  }
}

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────
export async function saveCustomer(uid, data) {
  await setDoc(doc(db, "customers", uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getCustomers() {
  const snap = await getDocs(query(collection(db, "customers"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getCustomer(uid) {
  const snap = await getDoc(doc(db, "customers", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
export async function incrementAnalytic(field, amount = 1) {
  const ref = doc(db, "analytics", "global");
  await setDoc(ref, { [field]: increment(amount) }, { merge: true });
}

export async function getAnalytics() {
  const global = await getDoc(doc(db, "analytics", "global"));
  const views = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const snap = await getDoc(doc(db, "analytics", `pageviews_${dateStr}`));
    views.push({ date: dateStr, data: snap.exists() ? snap.data() : {} });
  }
  return { global: global.exists() ? global.data() : {}, views };
}

// ─── BANNERS ─────────────────────────────────────────────────────────────────
export async function getBanners() {
  const snap = await getDocs(collection(db, "banners"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function toggleBanner(id, active) {
  await updateDoc(doc(db, "banners", id), { active });
}

export async function addBanner(data) {
  return await addDoc(collection(db, "banners"), { ...data, createdAt: serverTimestamp() });
}

export async function deleteBanner(id) {
  await deleteDoc(doc(db, "banners", id));
}

export async function seedBannersIfEmpty() {
  const snap = await getDocs(collection(db, "banners"));
  if (!snap.empty) return;
  const defaults = [
    { title: "Festival Special — Up to 20% Off", active: true, type: "Offer" },
    { title: "New Arrival: Little Millet Now Available", active: true, type: "Announcement" },
    { title: "Free Delivery on Orders Above ₹200", active: false, type: "Promotion" },
  ];
  for (const b of defaults) {
    await addDoc(collection(db, "banners"), { ...b, createdAt: serverTimestamp() });
  }
}

// ─── PAGE VIEWS (used by CheckoutPage and other storefront pages) ─────────────
export async function logPageView(page) {
  const today = new Date().toISOString().split("T")[0];
  const ref = doc(db, "analytics", `pageviews_${today}`);
  await setDoc(ref, { [page]: increment(1), date: today }, { merge: true });
}

// ─── USER CART ───────────────────────────────────────────────────────────────
export async function getFirestoreCart(uid) {
  const snap = await getDoc(doc(db, "carts", uid));
  return snap.exists() ? (snap.data().items || []) : [];
}

export async function saveFirestoreCart(uid, items) {
  await setDoc(doc(db, "carts", uid), { items, updatedAt: serverTimestamp() });
}

// ─── USER ADDRESSES ──────────────────────────────────────────────────────────
export async function getUserAddresses(uid) {
  const snap = await getDoc(doc(db, "customers", uid));
  return snap.exists() ? (snap.data().addresses || []) : [];
}

export async function saveUserAddress(uid, address) {
  const snap = await getDoc(doc(db, "customers", uid));
  const existing = snap.exists() ? (snap.data().addresses || []) : [];
  const updated = [...existing, { ...address, id: Date.now().toString() }];
  await setDoc(doc(db, "customers", uid), { addresses: updated }, { merge: true });
  return updated;
}

export async function deleteUserAddress(uid, addressId) {
  const snap = await getDoc(doc(db, "customers", uid));
  const existing = snap.exists() ? (snap.data().addresses || []) : [];
  const updated = existing.filter(a => a.id !== addressId);
  await setDoc(doc(db, "customers", uid), { addresses: updated }, { merge: true });
  return updated;
}

// ─── GET ORDERS FOR A SPECIFIC USER ──────────────────────────────────────────
export async function getUserOrders(userId) {
  const snap = await getDocs(
    query(collection(db, "orders"), orderBy("createdAt", "desc"))
  );
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(o => o.customerId === userId);
}

// ─── GET SINGLE PRODUCT BY ID ────────────────────────────────────────────────
export async function getProductById(id) {
  const ref = doc(db, "products", id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ─── BRANDS ──────────────────────────────────────────────────────────────────
export function subscribeBrands(callback) {
  return onSnapshot(collection(db, "brands"), snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export async function getBrands() {
  const snap = await getDocs(collection(db, "brands"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addBrand(data) {
  return await addDoc(collection(db, "brands"), { ...data, createdAt: serverTimestamp() });
}

export async function updateBrand(id, data) {
  await updateDoc(doc(db, "brands", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteBrand(id) {
  await deleteDoc(doc(db, "brands", id));
}

export async function seedBrandsIfEmpty() {
  const snap = await getDocs(collection(db, "brands"));
  if (!snap.empty) return;
  const defaults = [
    { name: "India Gate", slug: "india-gate", logo: "/Brands/indiagate.png", descEN: "India's most trusted basmati rice brand — premium quality since 1993", descTE: "భారతదేశంలో అత్యంత విశ్వసనీయమైన బాస్మతి బ్రాండ్", categories: ["basmati"], tag: "Premium Basmati", active: true },
    { name: "Daawat", slug: "daawat", logo: "/Brands/daawat.png", descEN: "Finest aged basmati rice — loved across Indian kitchens", descTE: "ఉత్తమ నాణ్యత గల పాత బాస్మతి బియ్యం", categories: ["basmati"], tag: "Aged Basmati", active: true },
    { name: "Kohinoor", slug: "kohinoor", logo: "/Brands/kohinoor.png", descEN: "Premium rice collection — basmati and specialty varieties", descTE: "ప్రీమియం బియ్యం సేకరణ — బాస్మతి మరియు ప్రత్యేక రకాలు", categories: ["basmati", "non-basmati"], tag: "Multi-variety", active: true },
    { name: "Unity", slug: "unity", logo: "/Brands/unity.png", descEN: "Local Visakhapatnam brand — fresh Sona Masoori & millets direct from farms", descTE: "విశాఖపట్నం స్థానిక బ్రాండ్ — తాజా సోనా మసూరి & చిరుధాన్యాలు", categories: ["non-basmati", "millets"], tag: "Local & Fresh", active: true },
  ];
  for (const b of defaults) {
    await addDoc(collection(db, "brands"), { ...b, createdAt: serverTimestamp() });
  }
}
