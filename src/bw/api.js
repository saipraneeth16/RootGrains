// =============================================================
// bw/api.js  —  Data layer for BW Logistics
// =============================================================
//
// HOW TO INTEGRATE WITH YOUR FIREBASE APP
// ─────────────────────────────────────────
// 1. At the top of this file, uncomment and adjust the Firebase import:
//      import { db } from '../firebase';   // your existing config
//      import { collection, doc, addDoc, updateDoc,
//               onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
//
// 2. Replace every function body marked  // 🔌 FIREBASE:  with the
//    real Firebase call shown in the comment. Function signatures
//    never change, so your components need zero edits.
//
// FIRESTORE COLLECTIONS NEEDED
// ─────────────────────────────
//   deliveryOrders   (one doc per delivery)
//   deliveryDrivers  (one doc per driver — can mirror your users collection)
//
// ORDER SCHEMA (both collections)
// ─────────────────────────────────
//   See MOCK_ORDERS below for the full field list.
//   Key field: deliveryType: 'rapid' | 'eco'
//     rapid → same-day, live tracking, higher price
//     eco   → 2-day scheduled, no live tracking, cheaper
// =============================================================

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection, doc, addDoc, updateDoc,
  onSnapshot, query, where, serverTimestamp,
} from 'firebase/firestore';

// ─── MOCK DATA ──────────────────────────────────────────────

export const MOCK_ORDERS = [
  {
    id: 'o1', trackingId: 'BW-8821',
    existingOrderId: null,          // ← link to YOUR app's order ID after integration
    merchantId: 'm1', merchantName: 'Green Leaf Cafe',
    pickup: '12, MG Road, Bangalore',
    dropoff: '45, Koramangala 4th Block',
    customer: 'Rahul Sharma', customerPhone: '9876543210',
    deliveryType: 'rapid',
    weight: '2', type: 'Food', desc: 'Box of pastries',
    status: 'delivered',
    driverId: 'd1', driverName: 'Amit Kumar', driverVehicle: 'Bike',
    eta: null, scheduledDate: null,
    price: 95, createdAt: '10:30 AM', createdDate: '2026-06-04', distance: '4.2',
  },
  {
    id: 'o2', trackingId: 'BW-4432',
    existingOrderId: null,
    merchantId: 'm1', merchantName: 'Green Leaf Cafe',
    pickup: '12, MG Road, Bangalore',
    dropoff: '23, HSR Layout Sector 3',
    customer: 'Priya Nair', customerPhone: '9876543211',
    deliveryType: 'rapid',
    weight: '1', type: 'Food', desc: 'Lunch box x2',
    status: 'in_transit',
    driverId: 'd2', driverName: 'Ravi Singh', driverVehicle: 'Scooter',
    eta: '8 min', scheduledDate: null,
    price: 78, createdAt: '12:15 PM', createdDate: '2026-06-04', distance: '5.8',
  },
  {
    id: 'o3', trackingId: 'BW-7790',
    existingOrderId: null,
    merchantId: 'm1', merchantName: 'Green Leaf Cafe',
    pickup: '12, MG Road, Bangalore',
    dropoff: '67, Whitefield Main Road',
    customer: 'Sunita Patel', customerPhone: '9876543212',
    deliveryType: 'eco',
    weight: '3', type: 'Grocery', desc: 'Weekly groceries',
    status: 'confirmed',
    driverId: null, driverName: null, driverVehicle: null,
    eta: null, scheduledDate: '2026-06-06',
    price: 58, createdAt: '1:05 PM', createdDate: '2026-06-04', distance: '9.1',
  },
  {
    id: 'o4', trackingId: 'BW-3317',
    existingOrderId: null,
    merchantId: 'm1', merchantName: 'Green Leaf Cafe',
    pickup: '12, MG Road, Bangalore',
    dropoff: '89, Jayanagar 4th Block',
    customer: 'Vikram Reddy', customerPhone: '9876543213',
    deliveryType: 'eco',
    weight: '2', type: 'Food', desc: 'Birthday cake',
    status: 'pending',
    driverId: null, driverName: null, driverVehicle: null,
    eta: null, scheduledDate: '2026-06-06',
    price: 52, createdAt: '1:30 PM', createdDate: '2026-06-04', distance: '6.4',
  },
  {
    id: 'o5', trackingId: 'BW-9921',
    existingOrderId: null,
    merchantId: 'm2', merchantName: 'Tech Gadgets Store',
    pickup: '78, Indiranagar, Bangalore',
    dropoff: '34, Bellandur, Bangalore',
    customer: 'Arjun Mehta', customerPhone: '9876543214',
    deliveryType: 'rapid',
    weight: '1', type: 'Electronics', desc: 'Phone case',
    status: 'pending',
    driverId: null, driverName: null, driverVehicle: null,
    eta: null, scheduledDate: null,
    price: 80, createdAt: '2:00 PM', createdDate: '2026-06-04', distance: '3.8',
  },
];

export const MOCK_DRIVERS = [
  { id:'d1', name:'Amit Kumar',   phone:'9812340001', vehicle:'Bike',    status:'online',  ordersToday:8, earnings:680, rating:4.9 },
  { id:'d2', name:'Ravi Singh',   phone:'9812340002', vehicle:'Scooter', status:'busy',    ordersToday:6, earnings:510, rating:4.7 },
  { id:'d3', name:'Deepak Verma', phone:'9812340003', vehicle:'Bike',    status:'busy',    ordersToday:5, earnings:425, rating:4.8 },
  { id:'d4', name:'Suresh Yadav', phone:'9812340004', vehicle:'Van',     status:'online',  ordersToday:3, earnings:255, rating:4.6 },
  { id:'d5', name:'Manoj Kumar',  phone:'9812340005', vehicle:'Bike',    status:'offline', ordersToday:0, earnings:0,   rating:4.5 },
];

// ─── IN-MEMORY STATE (mock only — Firestore replaces this) ───

let _orders  = [...MOCK_ORDERS];
let _drivers = [...MOCK_DRIVERS];
const _subs  = new Set();
const _emit  = () => _subs.forEach(fn => fn());

// ─── HOOKS ──────────────────────────────────────────────────

/**
 * Subscribe to delivery orders with optional filters.
 *
 * @param {{ merchantId?:string, driverId?:string, deliveryType?:'rapid'|'eco', status?:string }} filters
 *
 * 🔌 FIREBASE:
 *   let q = collection(db, 'deliveryOrders');
 *   if (filters.merchantId)   q = query(q, where('merchantId',   '==', filters.merchantId));
 *   if (filters.deliveryType) q = query(q, where('deliveryType', '==', filters.deliveryType));
 *   return onSnapshot(q, snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
 */
export function useOrders(filters = {}) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = collection(db, 'deliveryOrders');
    if (filters.merchantId)   q = query(q, where('merchantId',   '==', filters.merchantId));
    if (filters.driverId)     q = query(q, where('driverId',     '==', filters.driverId));
    if (filters.deliveryType) q = query(q, where('deliveryType', '==', filters.deliveryType));
    if (filters.status)       q = query(q, where('status',       '==', filters.status));
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  return { orders, loading };
}

/**
 * Subscribe to a single order by its ID or trackingId.
 *
 * 🔌 FIREBASE:
 *   return onSnapshot(doc(db, 'deliveryOrders', orderId),
 *     snap => snap.exists() && setOrder({ id: snap.id, ...snap.data() }));
 */
export function useOrderById(orderId) {
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    // Try by doc ID first, fall back to querying trackingId
    const unsub = onSnapshot(doc(db, 'deliveryOrders', orderId), snap => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() });
        setLoading(false);
      } else {
        // orderId might be a trackingId
        const q = query(collection(db, 'deliveryOrders'), where('trackingId', '==', orderId));
        onSnapshot(q, qsnap => {
          setOrder(qsnap.empty ? null : { id: qsnap.docs[0].id, ...qsnap.docs[0].data() });
          setLoading(false);
        });
      }
    });
    return unsub;
  }, [orderId]);

  return { order, loading };
}

/**
 * Subscribe to all drivers.
 *
 * 🔌 FIREBASE:
 *   return onSnapshot(collection(db, 'deliveryDrivers'),
 *     snap => setDrivers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
 */
export function useDrivers() {
  const [drivers, setDrivers] = useState([..._drivers]);

  useEffect(() => {
    const refresh = () => setDrivers([..._drivers]);
    _subs.add(refresh);
    return () => _subs.delete(refresh);
  }, []);

  return { drivers, loading: false };
}

// ─── MUTATIONS ──────────────────────────────────────────────

/**
 * Create a new delivery order.
 *
 * Pass existingOrderId to link this delivery to your app's existing order:
 *   placeOrder({ existingOrderId: myAppOrder.id, ...rest })
 *
 * @returns {Promise<{ id:string, trackingId:string }>}
 *
 * 🔌 FIREBASE:
 *   const ref = await addDoc(collection(db, 'deliveryOrders'), {
 *     ...orderData,
 *     status: 'pending',
 *     scheduledDate: orderData.deliveryType === 'eco' ? ecoDate() : null,
 *     createdAt: serverTimestamp(),
 *   });
 *   return { id: ref.id, trackingId: orderData.trackingId };
 */
export async function placeOrder(orderData) {
  const trackingId = _trkId();
  const ref = await addDoc(collection(db, 'deliveryOrders'), {
    trackingId,
    existingOrderId: orderData.existingOrderId ?? null,
    merchantId:      orderData.merchantId,
    merchantName:    orderData.merchantName,
    pickup:          orderData.pickup,
    dropoff:         orderData.dropoff,
    customer:        orderData.customer,
    customerPhone:   orderData.customerPhone,
    deliveryType:    orderData.deliveryType,
    weight:          orderData.weight,
    type:            orderData.type,
    desc:            orderData.desc ?? '',
    status:          'pending',
    driverId: null, driverName: null, driverVehicle: null,
    eta:          null,
    scheduledDate: orderData.deliveryType === 'eco' ? ecoDate() : null,
    price:        orderData.price,
    createdAt:    new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
    createdDate:  new Date().toISOString().split('T')[0],
    distance:     orderData.distance,
    createdAtTimestamp: serverTimestamp(),
  });
  return { id: ref.id, trackingId };
}

/**
 * Update an order's status (and optional extra fields).
 *
 * 🔌 FIREBASE:
 *   await updateDoc(doc(db, 'deliveryOrders', orderId), { status, ...extra, updatedAt: serverTimestamp() });
 */
export async function updateOrderStatus(orderId, status, extra = {}) {
  await updateDoc(doc(db, 'deliveryOrders', orderId), {
    status, ...extra, updatedAt: serverTimestamp(),
  });
}

/**
 * Driver accepts a rapid order.
 *
 * 🔌 FIREBASE:
 *   await updateDoc(doc(db, 'deliveryOrders', orderId), {
 *     status: 'assigned',
 *     driverId: driver.id, driverName: driver.name, driverVehicle: driver.vehicle,
 *     eta: estimateEta(order.distance),
 *     assignedAt: serverTimestamp(),
 *   });
 */
export async function acceptOrder(orderId, driver) {
  const order = _orders.find(o => o.id === orderId);
  _orders = _orders.map(o => o.id === orderId ? {
    ...o,
    status:       'assigned',
    driverId:     driver.id,
    driverName:   driver.name,
    driverVehicle:driver.vehicle,
    eta:          estimateEta(o.distance),
  } : o);
  _emit();
}

// ─── HELPERS (exported so components can use them) ──────────

export const calcRapidPrice = (dist, wt) =>
  Math.round(50 + parseFloat(dist || 0) * 10 + parseFloat(wt || 0) * 5);

export const calcEcoPrice = (dist, wt) =>
  Math.round(25 + parseFloat(dist || 0) * 5 + parseFloat(wt || 0) * 3);

export const estimateEta = (distance) => {
  const mins = Math.round((parseFloat(distance) / 20) * 60);
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

export const ecoDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split('T')[0];
};

export const formatEcoDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'short' });
};

// ─── MERCHANT API KEY AUTH ───────────────────────────────────
//
// Maps an API key → merchant profile.
// In production replace with a Firestore lookup or Cloud Function call:
//
// 🔌 FIREBASE:
//   const snap = await getDoc(doc(db, 'merchantKeys', apiKey));
//   if (!snap.exists() || snap.data().revoked) return null;
//   return snap.data(); // { merchantId, merchantName, pickupAddress, ... }

const MOCK_MERCHANT_KEYS = {
  'bw_live_m1_demo': { merchantId:'m1', merchantName:'Green Leaf Cafe',    pickupAddress:'12, MG Road, Bangalore' },
  'bw_live_m2_demo': { merchantId:'m2', merchantName:'Tech Gadgets Store', pickupAddress:'78, Indiranagar, Bangalore' },
};

/**
 * Validate a merchant API key and return the merchant profile.
 * Returns null if the key is invalid or revoked.
 *
 * 🔌 FIREBASE: replace body with a real Firestore/Cloud Function call.
 */
export async function validateMerchantKey(apiKey) {
  // Simulate network latency
  await new Promise(r => setTimeout(r, 600));
  return MOCK_MERCHANT_KEYS[apiKey] ?? null;
}

// ─── PRIVATE ────────────────────────────────────────────────

const _uid   = () => Math.random().toString(36).substr(2, 9);
const _trkId = () => 'BW-' + Math.floor(1000 + Math.random() * 9000);

function _filter(orders, f) {
  return orders.filter(o =>
    (!f.merchantId   || o.merchantId   === f.merchantId)   &&
    (!f.driverId     || o.driverId     === f.driverId)     &&
    (!f.deliveryType || o.deliveryType === f.deliveryType) &&
    (!f.status       || o.status       === f.status)
  );
}
