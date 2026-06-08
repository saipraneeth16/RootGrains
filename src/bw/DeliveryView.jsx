// =============================================================
// bw/DeliveryView.jsx  —  BW Delivery tab for Root Grains Admin
// =============================================================
//
// DROP-IN INTEGRATION: Add this as a tab in AdminDashboard.jsx
//
//   import DeliveryView from './bw/DeliveryView';
//   // In nav array:
//   { key: "delivery", icon: "🚚", label: "Delivery" }
//   // In renderContent():
//   case "delivery": return <DeliveryView />;
//
// =============================================================

import { useState } from "react";
import {
  useOrders,
  updateOrderStatus,
  formatEcoDate,
} from "./api";

// ─── THEME ───────────────────────────────────────────────────
const T = {
  bg:     "#f5f0ea",
  card:   "#fff",
  border: "1px solid #e8e0d8",
  shadow: "0 2px 8px rgba(0,0,0,0.06)",
  brown:  "#3b1f0e",
  orange: "#e65100",
  green:  "#2e7d32",
  blue:   "#1565c0",
  purple: "#6a1b9a",
  muted:  "#888",
  faint:  "#f0ece8",
  rapid:  { bg: "#fff3e0", color: "#e65100", border: "1px solid #ffcc80" },
  eco:    { bg: "#e8f5e9", color: "#2e7d32", border: "1px solid #a5d6a7" },
};

// ─── DELIVERY STATUS COLORS ──────────────────────────────────
const DSC = {
  pending:    { bg: "#fff8e1", color: "#f57f17", label: "Pending" },
  assigned:   { bg: "#e3f2fd", color: "#1565c0", label: "Assigned" },
  confirmed:  { bg: "#e3f2fd", color: "#1565c0", label: "Confirmed" },
  picked_up:  { bg: "#f3e5f5", color: "#6a1b9a", label: "Picked Up" },
  in_transit: { bg: "#fff3e0", color: "#e65100", label: "In Transit" },
  dispatched: { bg: "#f3e5f5", color: "#6a1b9a", label: "Dispatched" },
  delivered:  { bg: "#e8f5e9", color: "#2e7d32", label: "Delivered" },
  cancelled:  { bg: "#ffebee", color: "#c62828", label: "Cancelled" },
};

const pill = (s) => {
  const c = DSC[s] || DSC.pending;
  return (
    <span style={{ background: c.bg, color: c.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
      {c.label}
    </span>
  );
};

const typePill = (t) =>
  t === "rapid"
    ? <span style={{ ...T.rapid, padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>⚡ Rapid</span>
    : <span style={{ ...T.eco,   padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>🌿 Eco</span>;

// ─── STAT CARD ───────────────────────────────────────────────
function StatCard({ label, value, sub, color = T.brown }) {
  return (
    <div style={{ background: T.card, borderRadius: 12, padding: "20px 24px", boxShadow: T.shadow, flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#555", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── OVERVIEW ────────────────────────────────────────────────
function OverviewTab({ orders }) {
  const rapid  = orders.filter(o => o.deliveryType === "rapid");
  const eco    = orders.filter(o => o.deliveryType === "eco");
  const active = orders.filter(o => ["assigned","picked_up","in_transit","confirmed","dispatched"].includes(o.status));
  const revenue = orders.reduce((s, o) => s + (o.price || 0), 0);

  const typeCard = (bg, border, color, label, count, rev, total) => (
    <div style={{ background: bg, border, borderRadius: 12, padding: "16px 18px", flex: 1 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{count}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 11, color: T.muted }}>Delivery fees</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.brown }}>₹{rev}</div>
      <div style={{ marginTop: 10, background: "rgba(255,255,255,0.6)", borderRadius: 20, height: 5 }}>
        <div style={{ background: color, height: 5, borderRadius: 20, width: `${total ? (count / total) * 100 : 0}%`, transition: "width 0.5s" }} />
      </div>
      <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{total ? Math.round((count / total) * 100) : 0}% of orders</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <StatCard label="Total Deliveries" value={orders.length}                                             sub="All orders"    color={T.blue}   />
        <StatCard label="Active"           value={active.length}                                             sub="En route now"  color={T.orange} />
        <StatCard label="Delivered"        value={orders.filter(o => o.status === "delivered").length}       sub="Completed"     color={T.green}  />
        <StatCard label="Pending"          value={orders.filter(o => o.status === "pending").length}         sub="Awaiting pickup" color={T.brown} />
      </div>

      {/* Type split */}
      <div style={{ background: T.card, borderRadius: 12, padding: "20px 24px", boxShadow: T.shadow }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.brown, marginBottom: 14 }}>Delivery Type Split</div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {typeCard("#fff3e0", "1px solid #ffcc80", T.orange, "⚡ Rapid", rapid.length, rapid.reduce((s,o) => s+(o.price||0),0), orders.length)}
          {typeCard("#e8f5e9", "1px solid #a5d6a7", T.green,  "🌿 Eco",   eco.length,   eco.reduce((s,o) => s+(o.price||0),0),   orders.length)}
        </div>
      </div>

      {/* Recent deliveries */}
      <div style={{ background: T.card, borderRadius: 12, padding: "20px 24px", boxShadow: T.shadow }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.brown, marginBottom: 14 }}>Recent Deliveries</div>
        {orders.length === 0
          ? <div style={{ textAlign: "center", padding: "24px 0", color: T.muted, fontSize: 13 }}>No deliveries yet. They'll appear here once a customer places an order.</div>
          : orders.slice(0, 8).map(o => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0ece8" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: T.brown }}>{o.trackingId}</span>
                  {typePill(o.deliveryType)}
                </div>
                <div style={{ fontSize: 12, color: T.muted }}>{o.customer} · {o.dropoff}</div>
                {o.driverName && <div style={{ fontSize: 11, color: T.muted }}>Driver: {o.driverName}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: T.brown }}>₹{o.price}</span>
                {pill(o.status)}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── ORDERS TAB ──────────────────────────────────────────────
function OrdersTab({ orders }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  const filtered = orders.filter(o => {
    const tm = typeFilter === "all" || o.deliveryType === typeFilter;
    const sm = statusFilter === "all" || o.status === statusFilter;
    const q  = search.toLowerCase();
    const qm = !q || o.trackingId?.toLowerCase().includes(q) || o.customer?.toLowerCase().includes(q) || o.merchantName?.toLowerCase().includes(q);
    return tm && sm && qm;
  });

  const STATUSES = ["all","pending","assigned","confirmed","in_transit","dispatched","delivered","cancelled"];
  const btn = (active, onClick, children) => (
    <button onClick={onClick} style={{ padding: "6px 14px", borderRadius: 20, border: "none", background: active ? T.brown : T.faint, color: active ? "#fff" : "#555", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
      {children}
    </button>
  );

  const handleStatusAdvance = async (orderId, currentStatus) => {
    const next = { pending: "confirmed", confirmed: "dispatched", dispatched: "delivered" };
    if (next[currentStatus]) await updateOrderStatus(orderId, next[currentStatus]);
  };

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 20, color: T.brown, marginBottom: 16 }}>Delivery Orders</div>

      {/* Filters */}
      <div style={{ background: T.card, borderRadius: 12, padding: 16, marginBottom: 14, boxShadow: T.shadow }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tracking ID, customer, merchant..."
          style={{ width: "100%", padding: "9px 14px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box", marginBottom: 12, outline: "none" }} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {[["all","All Types"],["rapid","⚡ Rapid"],["eco","🌿 Eco"]].map(([v,l]) => btn(typeFilter === v, () => setTypeFilter(v), l))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STATUSES.map(s => btn(statusFilter === s, () => setStatusFilter(s), s === "all" ? "All Status" : DSC[s]?.label || s))}
        </div>
      </div>

      {filtered.length === 0
        ? <div style={{ background: T.card, borderRadius: 12, padding: 40, textAlign: "center", color: T.muted, boxShadow: T.shadow }}>No delivery orders match this filter.</div>
        : filtered.map(o => {
          const isExp = expanded === o.id;
          return (
            <div key={o.id} style={{ background: T.card, borderRadius: 12, marginBottom: 10, boxShadow: T.shadow, overflow: "hidden" }}>
              <div onClick={() => setExpanded(isExp ? null : o.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.brown }}>{o.trackingId}</span>
                    {typePill(o.deliveryType)}
                  </div>
                  <div style={{ fontSize: 12, color: T.muted }}>
                    {o.merchantName} · {o.customer} · {o.customerPhone}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: T.brown }}>₹{o.price}</span>
                  {pill(o.status)}
                  <span style={{ color: "#aaa", fontSize: 12 }}>{isExp ? "▲" : "▼"}</span>
                </div>
              </div>
              {isExp && (
                <div style={{ padding: "0 18px 16px", borderTop: "1px solid #f0ece8", background: "#faf8f5" }}>
                  <div style={{ fontSize: 13, color: "#555", margin: "10px 0 4px" }}>
                    <strong>Pickup:</strong> {o.pickup}
                  </div>
                  <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>
                    <strong>Drop-off:</strong> {o.dropoff}
                  </div>
                  {o.desc && <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}><strong>Package:</strong> {o.type} — {o.desc} ({o.weight}kg)</div>}
                  {o.deliveryType === "eco" && o.scheduledDate && (
                    <div style={{ fontSize: 13, color: T.green, marginBottom: 4, fontWeight: 600 }}>📅 Scheduled: {formatEcoDate(o.scheduledDate)}</div>
                  )}
                  {o.driverName && <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}><strong>Driver:</strong> {o.driverName} ({o.driverVehicle}){o.eta ? ` · ETA: ${o.eta}` : ""}</div>}
                  <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>Created: {o.createdAt} · {o.createdDate}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["pending","confirmed","dispatched"].includes(o.status) && (
                      <button onClick={() => handleStatusAdvance(o.id, o.status)}
                        style={{ padding: "7px 14px", background: T.brown, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                        Advance Status →
                      </button>
                    )}
                    {!["delivered","cancelled"].includes(o.status) && (
                      <button onClick={() => updateOrderStatus(o.id, "cancelled")}
                        style={{ padding: "7px 14px", background: "#ffebee", color: "#c62828", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                        Cancel Delivery
                      </button>
                    )}
                    {o.trackingId && (
                      <a href={`https://bw-app.vercel.app/track/${o.trackingId}`} target="_blank" rel="noreferrer"
                        style={{ padding: "7px 14px", background: "#e3f2fd", color: T.blue, border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
                        🔗 Live Track
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      }
    </div>
  );
}

// ─── DRIVERS TAB (REMOVED) ───────────────────────────────────
// Root Grains admin is a merchant — they don't manage the BW driver fleet.
// Driver info is surfaced per-order inside OrdersTab (assigned driver name/ETA).

// ─── (dead code kept here for reference only) ─────────────────
function DriversTab({ drivers }) {
  const sc = { online: { bg: "#e8f5e9", color: T.green }, busy: { bg: "#fff3e0", color: T.orange }, offline: { bg: "#f0f0f0", color: "#aaa" } };
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 20, color: T.brown, marginBottom: 16 }}>Driver Fleet</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {drivers.map(d => (
          <div key={d.id} style={{ background: T.card, borderRadius: 12, padding: "20px 20px", boxShadow: T.shadow }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: T.brown, color: "#f5e6c8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18 }}>{d.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: T.brown }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{d.phone}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{d.vehicle} · ★{d.rating}</div>
                </div>
              </div>
              <span style={{ background: sc[d.status]?.bg, color: sc[d.status]?.color, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
              </span>
            </div>
            <div style={{ display: "flex", gap: 12, borderTop: "1px solid #f0ece8", paddingTop: 14, textAlign: "center" }}>
              {[["₹" + d.earnings, "Earnings"], [d.ordersToday, "Orders Today"], ["★" + d.rating, "Rating"]].map(([v, l]) => (
                <div key={l} style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 17, color: T.brown }}>{v}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MERCHANT KEYS TAB ───────────────────────────────────────
// In production: these come from Firestore's 'merchantKeys' collection.
// 🔌 FIREBASE: replace DEMO_KEYS with a useEffect + onSnapshot on the merchantKeys collection.
const DEMO_KEYS = [
  { id: "bw_live_m1_demo", merchantId: "m1", merchantName: "Green Leaf Cafe",    pickupAddress: "12, MG Road, Bangalore",        status: "active",  issued: "2026-06-01" },
  { id: "bw_live_m2_demo", merchantId: "m2", merchantName: "Tech Gadgets Store", pickupAddress: "78, Indiranagar, Bangalore",     status: "active",  issued: "2026-06-02" },
  { id: "bw_live_m3_demo", merchantId: "m3", merchantName: "Root Grains",        pickupAddress: "45, Koramangala, Bangalore",     status: "active",  issued: "2026-06-04" },
];

function MerchantKeysTab() {
  const [keys, setKeys] = useState(DEMO_KEYS);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ merchantName: "", pickupAddress: "" });
  const [testKey, setTestKey] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const revoke = (id) => {
    if (!window.confirm("Revoke this key? The merchant will lose access immediately.")) return;
    setKeys(k => k.map(x => x.id === id ? { ...x, status: "revoked" } : x));
    // 🔌 FIREBASE: await updateDoc(doc(db, 'merchantKeys', id), { revoked: true, revokedAt: serverTimestamp() });
  };
  const restore = (id) => {
    setKeys(k => k.map(x => x.id === id ? { ...x, status: "active" } : x));
    // 🔌 FIREBASE: await updateDoc(doc(db, 'merchantKeys', id), { revoked: false });
  };

  const issueKey = () => {
    if (!form.merchantName.trim()) return;
    const newKey = {
      id: "bw_live_" + form.merchantName.toLowerCase().replace(/\s+/g,"_").slice(0,8) + "_" + Date.now().toString(36),
      merchantId: "m" + Date.now(),
      merchantName: form.merchantName,
      pickupAddress: form.pickupAddress,
      status: "active",
      issued: new Date().toISOString().split("T")[0],
    };
    setKeys(k => [newKey, ...k]);
    setForm({ merchantName: "", pickupAddress: "" });
    setShowAdd(false);
    // 🔌 FIREBASE: await addDoc(collection(db, 'merchantKeys'), { ...newKey, createdAt: serverTimestamp() });
  };

  const testValidate = async () => {
    if (!testKey.trim()) return;
    setTesting(true); setTestResult(null);
    const result = await validateMerchantKey(testKey.trim());
    setTestResult(result ? { ok: true, ...result } : { ok: false });
    setTesting(false);
  };

  const inp = { padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: T.brown }}>Merchant API Keys</div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: "9px 18px", background: T.brown, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
          {showAdd ? "✕ Cancel" : "+ Issue Key"}
        </button>
      </div>

      {showAdd && (
        <div style={{ background: T.card, borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: T.shadow }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.brown, marginBottom: 12 }}>Issue New Merchant Key</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Merchant / Business Name *</label>
              <input style={{ ...inp, width: "100%", boxSizing: "border-box" }} value={form.merchantName} onChange={e => setForm(f => ({ ...f, merchantName: e.target.value }))} placeholder="e.g. Sunrise Bakery" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Pickup Address</label>
              <input style={{ ...inp, width: "100%", boxSizing: "border-box" }} value={form.pickupAddress} onChange={e => setForm(f => ({ ...f, pickupAddress: e.target.value }))} placeholder="e.g. 22, MG Road, Bangalore" />
            </div>
          </div>
          <button onClick={issueKey} style={{ marginTop: 12, padding: "9px 20px", background: T.green, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Issue Key</button>
        </div>
      )}

      {/* Key list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {keys.map(k => (
          <div key={k.id} style={{ background: T.card, borderRadius: 12, padding: "16px 20px", boxShadow: T.shadow, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: T.brown }}>{k.merchantName}</span>
                <span style={{ background: k.status === "active" ? "#e8f5e9" : "#ffebee", color: k.status === "active" ? T.green : "#c62828", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                  {k.status === "active" ? "● Active" : "✕ Revoked"}
                </span>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: T.muted, background: T.faint, padding: "4px 8px", borderRadius: 6, display: "inline-block", marginBottom: 4 }}>{k.id}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{k.pickupAddress} · Issued {k.issued}</div>
            </div>
            <div>
              {k.status === "active"
                ? <button onClick={() => revoke(k.id)} style={{ padding: "7px 14px", background: "#ffebee", color: "#c62828", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Revoke</button>
                : <button onClick={() => restore(k.id)} style={{ padding: "7px 14px", background: "#e8f5e9", color: T.green, border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Restore</button>
              }
            </div>
          </div>
        ))}
      </div>

      {/* API Key Tester */}
      <div style={{ background: T.card, borderRadius: 12, padding: "20px 24px", boxShadow: T.shadow }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.brown, marginBottom: 10 }}>🔑 Validate a Key</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={testKey} onChange={e => setTestKey(e.target.value)} placeholder="Paste an API key to test..." style={{ ...inp, flex: 1 }} />
          <button onClick={testValidate} disabled={testing} style={{ padding: "9px 18px", background: T.brown, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
            {testing ? "Testing..." : "Validate"}
          </button>
        </div>
        {testResult && (
          <div style={{ marginTop: 10, padding: "12px 16px", borderRadius: 10, background: testResult.ok ? "#e8f5e9" : "#ffebee", color: testResult.ok ? T.green : "#c62828", fontSize: 13, fontWeight: 600 }}>
            {testResult.ok
              ? `✓ Valid — ${testResult.merchantName} (${testResult.merchantId}) · ${testResult.pickupAddress}`
              : "✕ Invalid or revoked key"
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────
// Only shows deliveries where merchantId === 'root_grains'
// i.e. orders placed through the Root Grains checkout flow.
export default function DeliveryView() {
  const { orders } = useOrders({ merchantId: "root_grains" });
  const [tab, setTab] = useState("overview");

  const TABS = [
    { k: "overview", l: "Overview", icon: "📊" },
    { k: "orders",   l: "Orders",   icon: "📦" },
  ];

  return (
    <div>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: T.brown, margin: 0 }}>Deliveries</h2>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>Powered by BW — Business on Wheels</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.muted }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, display: "inline-block" }} />
          Live
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 2, background: T.faint, borderRadius: 12, padding: 4, marginBottom: 22, width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: tab === t.k ? T.card : "transparent",
            color: tab === t.k ? T.brown : T.muted,
            boxShadow: tab === t.k ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.15s",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {t.icon} {t.l}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "overview" && <OverviewTab orders={orders} />}
      {tab === "orders"   && <OrdersTab  orders={orders} />}
    </div>
  );
}
