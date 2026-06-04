import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "./AdminAuthContext";
import AdminLoginPage from "./AdminLoginPage";
import {
  subscribeOrders, updateOrderStatus,
  subscribeProducts, addProduct, updateProduct, deleteProduct, seedProductsIfEmpty,
  getCustomers, getBanners, toggleBanner, seedBannersIfEmpty, addBanner, deleteBanner,
} from "../services/firestore";
import { allProducts } from "../data/products";

const statusColors = {
  pending:    { bg: "#fff8e1", color: "#f57f17", label: "Pending" },
  confirmed:  { bg: "#e3f2fd", color: "#1565c0", label: "Confirmed" },
  dispatched: { bg: "#f3e5f5", color: "#6a1b9a", label: "Dispatched" },
  delivered:  { bg: "#e8f5e9", color: "#2e7d32", label: "Delivered" },
  cancelled:  { bg: "#ffebee", color: "#c62828", label: "Cancelled" },
};
const nextStatus = { pending: "confirmed", confirmed: "dispatched", dispatched: "delivered" };
const categoryColor = { "non-basmati": "#1565c0", basmati: "#e65100", millets: "#2e7d32" };

function Sidebar({ active, setActive, onLogout }) {
  const navigate = useNavigate();
  const { isBBAdmin } = useAdminAuth();
  const nav = [
    { key: "dashboard", icon: "📊", label: "Dashboard" },
    { key: "orders",    icon: "📦", label: "Orders" },
    { key: "products",  icon: "🌾", label: "Products" },
    { key: "customers", icon: "👥", label: "Customers" },
    { key: "banners",   icon: "🖼️",  label: "Banners" },
  ];
  return (
    <aside style={{ width: 200, minHeight: "100vh", background: "#3b1f0e", color: "#fff", display: "flex", flexDirection: "column", padding: "0 0 24px 0", flexShrink: 0 }}>
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: "#f5e6c8" }}>Root Grains</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 2, marginTop: 2 }}>ADMIN PANEL</div>
      </div>
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {nav.map(({ key, icon, label }) => (
          <button key={key} onClick={() => setActive(key)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 20px", background: active === key ? "rgba(255,255,255,0.12)" : "none", border: "none", color: active === key ? "#f5e6c8" : "rgba(255,255,255,0.65)", fontSize: 14, cursor: "pointer", textAlign: "left", borderLeft: active === key ? "3px solid #d4a855" : "3px solid transparent" }}>
            <span>{icon}</span>{label}
          </button>
        ))}
        {isBBAdmin && (
          <button onClick={() => navigate("/#/bb-admin")} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 20px", background: "none", border: "none", color: "rgba(255,215,0,0.7)", fontSize: 14, cursor: "pointer", borderLeft: "3px solid transparent" }}>
            <span>⭐</span>BB Super Admin
          </button>
        )}
      </nav>
      <div style={{ padding: "0 12px 8px" }}>
        <button onClick={() => navigate("/")} style={{ width: "100%", padding: "9px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer", marginBottom: 8 }}>← Back to Store</button>
        <button onClick={onLogout} style={{ width: "100%", padding: "9px", background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>Sign Out</button>
      </div>
    </aside>
  );
}

function StatCard({ label, value, sub, color = "#3b1f0e" }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#555", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function DashboardView({ orders, products, customers }) {
  const todayOrders = orders.filter(o => { const d = o.createdAt?.toDate?.(); return d && d.toDateString() === new Date().toDateString(); });
  const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.total || 0), 0);
  const activeOrders = orders.filter(o => ["pending","confirmed","dispatched"].includes(o.status));
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: "#3b1f0e" }}>Dashboard</h2>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Today's Orders" value={todayOrders.length} sub="Orders placed today" color="#1565c0" />
        <StatCard label="Active Orders" value={activeOrders.length} sub="Pending + Dispatched" color="#e65100" />
        <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} sub="From delivered orders" color="#2e7d32" />
        <StatCard label="Customers" value={customers.length} sub="Registered users" color="#6a1b9a" />
        <StatCard label="Products" value={products.length} sub="In catalog" color="#3b1f0e" />
      </div>
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#3b1f0e" }}>Recent Orders</h3>
        {orders.length === 0 ? <p style={{ color: "#aaa", fontSize: 13 }}>No orders yet.</p> : orders.slice(0, 5).map(o => {
          const sc = statusColors[o.status] || statusColors.pending;
          return (
            <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0ece8" }}>
              <div><div style={{ fontSize: 14, fontWeight: 600 }}>{o.customerName || "Customer"}</div><div style={{ fontSize: 12, color: "#888" }}>#{o.id.slice(-8).toUpperCase()}</div></div>
              <div style={{ fontWeight: 700 }}>₹{o.total}</div>
              <span style={{ background: sc.bg, color: sc.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{sc.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrdersView({ orders, onStatusUpdate }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [dateMode, setDateMode] = useState("all"); // "all" | "day" | "range" | "month"
  const [selectedDates, setSelectedDates] = useState([]); // array of "YYYY-MM-DD" strings
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  // Toggle a single date in/out of selectedDates
  const toggleDate = (d) => {
    setSelectedDates(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  // Filter orders by date selection
  const dateFiltered = orders.filter(o => {
    if (dateMode === "all") return true;
    const d = o.createdAt?.toDate?.();
    if (!d) return false;
    const dateStr = d.toISOString().split("T")[0];
    if (dateMode === "day") return selectedDates.includes(dateStr);
    if (dateMode === "range") {
      if (!rangeFrom || !rangeTo) return true;
      return dateStr >= rangeFrom && dateStr <= rangeTo;
    }
    if (dateMode === "month") {
      if (!selectedMonth) return true;
      return dateStr.startsWith(selectedMonth);
    }
    return true;
  });

  const filtered = dateFiltered.filter(o =>
    (filter === "all" || o.status === filter) &&
    (!search || o.customerName?.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search))
  );

  const periodRevenue = dateFiltered.filter(o => o.status === "delivered").reduce((s, o) => s + (o.total || 0), 0);
  const periodOrders = dateFiltered.length;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: "#3b1f0e" }}>Orders</h2>

      {/* Date Filter */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {[["all","All Orders"],["day","By Date"],["range","Date Range"],["month","By Month"]].map(([key,label]) => (
            <button key={key} onClick={() => { setDateMode(key); setSelectedDates([]); }}
              style={{ padding: "6px 14px", borderRadius: 20, border: "none", background: dateMode === key ? "#3b1f0e" : "#f0ece8", color: dateMode === key ? "#fff" : "#555", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              {label}
            </button>
          ))}
        </div>

        {dateMode === "day" && (
          <div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Click dates to select/deselect. Multiple dates can be selected.</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input type="date" max={today}
                onChange={e => e.target.value && toggleDate(e.target.value)}
                style={{ padding: "7px 10px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13, cursor: "pointer" }} />
              {selectedDates.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {selectedDates.sort().map(d => (
                    <span key={d} style={{ background: "#3b1f0e", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      {new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      <button onClick={() => toggleDate(d)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                    </span>
                  ))}
                  <button onClick={() => setSelectedDates([])} style={{ padding: "4px 10px", background: "#ffebee", color: "#c62828", border: "none", borderRadius: 20, fontSize: 12, cursor: "pointer" }}>Clear</button>
                </div>
              )}
            </div>
          </div>
        )}

        {dateMode === "range" && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div><label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>From</label>
              <input type="date" value={rangeFrom} max={today} onChange={e => setRangeFrom(e.target.value)}
                style={{ padding: "7px 10px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13 }} /></div>
            <div style={{ marginTop: 16, color: "#888" }}>→</div>
            <div><label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>To</label>
              <input type="date" value={rangeTo} min={rangeFrom} max={today} onChange={e => setRangeTo(e.target.value)}
                style={{ padding: "7px 10px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13 }} /></div>
            {(rangeFrom || rangeTo) && <button onClick={() => { setRangeFrom(""); setRangeTo(""); }} style={{ marginTop: 16, padding: "7px 14px", background: "#ffebee", color: "#c62828", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>Clear</button>}
          </div>
        )}

        {dateMode === "month" && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input type="month" value={selectedMonth} max={today.slice(0, 7)} onChange={e => setSelectedMonth(e.target.value)}
              style={{ padding: "7px 10px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13 }} />
            {selectedMonth && <button onClick={() => setSelectedMonth("")} style={{ padding: "7px 14px", background: "#ffebee", color: "#c62828", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>Clear</button>}
          </div>
        )}

        {/* Period Summary */}
        {dateMode !== "all" && (
          <div style={{ display: "flex", gap: 14, marginTop: 14, padding: 12, background: "#f9f6f2", borderRadius: 10 }}>
            <div><div style={{ fontSize: 20, fontWeight: 800, color: "#3b1f0e" }}>{periodOrders}</div><div style={{ fontSize: 11, color: "#888" }}>Orders in period</div></div>
            <div style={{ width: 1, background: "#e0d8d0" }} />
            <div><div style={{ fontSize: 20, fontWeight: 800, color: "#2e7d32" }}>₹{periodRevenue.toLocaleString("en-IN")}</div><div style={{ fontSize: 11, color: "#888" }}>Revenue (delivered)</div></div>
          </div>
        )}
      </div>

      {/* Status + Search */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..."
          style={{ flex: 1, minWidth: 180, padding: "9px 14px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13 }} />
        {["all","pending","confirmed","dispatched","delivered","cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: "7px 14px", borderRadius: 20, border: "none", background: filter === s ? "#3b1f0e" : "#f0ece8", color: filter === s ? "#fff" : "#555", fontSize: 12, cursor: "pointer", fontWeight: 600, textTransform: "capitalize" }}>
            {s === "all" ? "All" : statusColors[s]?.label}
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <div style={{ background: "#fff", borderRadius: 12, padding: 40, textAlign: "center", color: "#aaa" }}>No orders found.</div>
        : filtered.map(o => {
          const sc = statusColors[o.status] || statusColors.pending;
          const createdAt = o.createdAt?.toDate?.() || new Date();
          const isExpanded = expandedId === o.id;
          return (
            <div key={o.id} style={{ background: "#fff", borderRadius: 12, marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", overflow: "hidden" }}>
              <div onClick={() => setExpandedId(isExpanded ? null : o.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", cursor: "pointer", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{o.customerName || "Customer"} <span style={{ color: "#888", fontWeight: 400, fontSize: 12 }}>· {o.customerPhone}</span></div>
                  <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>#{o.id.slice(-8).toUpperCase()} · {createdAt.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#3b1f0e" }}>₹{o.total}</div>
                <span style={{ background: sc.bg, color: sc.color, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{sc.label}</span>
                <span style={{ fontSize: 12, color: "#aaa" }}>{isExpanded ? "▲" : "▼"}</span>
              </div>
              {isExpanded && (
                <div style={{ padding: "0 18px 16px", borderTop: "1px solid #f0ece8", background: "#faf8f5" }}>
                  <div style={{ fontSize: 13, color: "#555", margin: "10px 0 4px" }}><strong>Items:</strong> {o.items?.map(i => `${i.name} ${i.weight || ""} ×${i.qty}`).join(", ")}</div>
                  <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>{o.address}, {o.city} - {o.pincode}</div>
                  <div style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>{o.deliveryType === "rapid" ? "Rapid Delivery" : "Eco Delivery"} · {o.payment?.toUpperCase()}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {nextStatus[o.status] && <button onClick={() => onStatusUpdate(o.id, nextStatus[o.status])} style={{ padding: "8px 16px", background: "#3b1f0e", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Mark as {statusColors[nextStatus[o.status]]?.label} →</button>}
                    {o.status !== "cancelled" && o.status !== "delivered" && <button onClick={() => onStatusUpdate(o.id, "cancelled")} style={{ padding: "8px 16px", background: "#ffebee", color: "#c62828", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Cancel Order</button>}
                    {o.status === "dispatched" && <button onClick={() => window.open(`https://www.google.com/maps?q=${encodeURIComponent((o.address || "") + " " + (o.city || ""))}`, "_blank")} style={{ padding: "8px 16px", background: "#e3f2fd", color: "#1565c0", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>View on Map</button>}
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

// Fixed weight options per category
const CATEGORY_WEIGHTS = {
  "non-basmati": ["5 kg", "10 kg", "26 kg"],
  "basmati":     ["5 kg", "10 kg", "26 kg", "30 kg"],
  "millets":     ["500 g", "1 kg", "2 kg"],
};

const NON_BASMATI_SUBCATS = [
  { key: "sona-masoorie", label: "Sona Masoorie" },
  { key: "steam-rice",    label: "Steam Rice" },
  { key: "raw-rice",      label: "Raw Rice" },
  { key: "half-boiled",   label: "Half Boiled" },
];

// Parse weight string to kg value for per-kg calculation
function weightToKg(w) {
  if (!w) return 1;
  if (w.includes("g") && !w.toLowerCase().includes("kg")) return parseFloat(w) / 1000;
  return parseFloat(w) || 1;
}

function calcPerKg(price, weight) {
  const kg = weightToKg(weight);
  return kg > 0 ? Math.round(price / kg) : 0;
}

// Build default variant rows for a category (all weights, price empty)
function defaultVariants(category) {
  return (CATEGORY_WEIGHTS[category] || CATEGORY_WEIGHTS["non-basmati"]).map(w => ({
    weight: w, price: "", enabled: true,
  }));
}

// Resize image via canvas and return base64
function resizeImage(file, maxDim = 900, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
          else { w = Math.round(w * maxDim / h); h = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function ProductsView({ products, onAdd, onDelete, onUpdate }) {
  const emptyForm = { name: "", category: "non-basmati", subCategories: [], stock: "", description: "", imageUrl: "", active: true };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [variants, setVariants] = useState(defaultVariants("non-basmati"));
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState("");
  const inp = { width: "100%", padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const lbl = { fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4, display: "block" };

  const resetForm = () => { setForm(emptyForm); setVariants(defaultVariants("non-basmati")); setPreview(""); setEditId(null); };

  const handleCategoryChange = (cat) => {
    setForm(f => ({ ...f, category: cat, subCategories: [] }));
    setVariants(defaultVariants(cat));
  };

  const toggleSubCat = (key) => {
    setForm(f => ({
      ...f,
      subCategories: f.subCategories.includes(key)
        ? f.subCategories.filter(s => s !== key)
        : [...f.subCategories, key],
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const base64 = await resizeImage(file);
    setPreview(base64);
    setForm(f => ({ ...f, imageUrl: base64 }));
  };

  const updatePrice = (i, price) => {
    setVariants(v => v.map((row, idx) => idx === i ? { ...row, price } : row));
  };
  const toggleVariant = (i) => {
    setVariants(v => v.map((row, idx) => idx === i ? { ...row, enabled: !row.enabled } : row));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert("Product name is required.");
    const enabled = variants.filter(v => v.enabled && v.price);
    if (enabled.length === 0) return alert("Enable at least one weight and enter its price.");
    setSaving(true);
    const cleanVariants = enabled.map(v => ({
      weight: v.weight,
      price: Number(v.price),
      perKgPrice: calcPerKg(Number(v.price), v.weight),
    }));
    const data = {
      name: form.name,
      category: form.category,
      subCategories: form.subCategories,
      // backward compat: keep subCategory as first item
      subCategory: form.subCategories[0] || "",
      stock: Number(form.stock) || 0,
      description: form.description || "",
      imageUrl: form.imageUrl || "",
      active: form.active,
      weight: cleanVariants[0].weight,
      price: cleanVariants[0].price,
      perKgPrice: cleanVariants[0].perKgPrice,
      variants: cleanVariants,
    };
    try {
      if (editId) { await onUpdate(editId, data); } else { await onAdd(data); }
      resetForm(); setShowForm(false);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Error saving: " + err.message);
    }
    setSaving(false);
  };

  const startEdit = (p) => {
    const cat = p.category || "non-basmati";
    const fixedWeights = CATEGORY_WEIGHTS[cat] || CATEGORY_WEIGHTS["non-basmati"];
    // Map existing variants onto fixed weight slots
    const editVariants = fixedWeights.map(w => {
      const existing = p.variants?.find(v => v.weight === w);
      return { weight: w, price: existing ? String(existing.price) : "", enabled: !!existing };
    });
    setForm({
      name: p.name || p.nameKey || "",
      category: cat,
      subCategories: p.subCategories || (p.subCategory ? [p.subCategory] : []),
      stock: p.stock || "",
      description: p.description || "",
      imageUrl: p.imageUrl || p.image || p.img || "",
      active: p.active !== false,
    });
    setVariants(editVariants);
    setPreview(p.imageUrl || p.image || p.img || "");
    setEditId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#3b1f0e" }}>Products</h2>
        <button onClick={() => { if (showForm) { resetForm(); } setShowForm(!showForm); }} style={{ padding: "9px 18px", background: "#3b1f0e", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>{showForm ? "✕ Cancel" : "+ Add Product"}</button>
      </div>

      {showForm && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#3b1f0e" }}>{editId ? "Edit Product" : "Add New Product"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            {/* Name */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>Product Name *</label>
              <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sona Masoorie Raw Rice" />
            </div>

            {/* Category */}
            <div>
              <label style={lbl}>Category</label>
              <select style={inp} value={form.category} onChange={e => handleCategoryChange(e.target.value)}>
                <option value="non-basmati">Non-Basmati Rice</option>
                <option value="basmati">Basmati Rice</option>
                <option value="millets">Millets</option>
              </select>
            </div>


            {/* Sub-categories (non-basmati only, multi-select) */}
            {form.category === "non-basmati" && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>Sub-Categories (select all that apply)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {NON_BASMATI_SUBCATS.map(sc => {
                    const active = form.subCategories.includes(sc.key);
                    return (
                      <button key={sc.key} onClick={() => toggleSubCat(sc.key)}
                        style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${active ? "#3b1f0e" : "#ddd"}`, background: active ? "#3b1f0e" : "#fff", color: active ? "#fff" : "#555", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        {active ? "✓ " : ""}{sc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock & Active */}
            <div>
              <label style={lbl}>Stock Quantity</label>
              <input style={inp} type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="e.g. 100" />
            </div>
            <div>
              <label style={lbl}>Visible on Store</label>
              <select style={inp} value={form.active ? "true" : "false"} onChange={e => setForm(f => ({ ...f, active: e.target.value === "true" }))}>
                <option value="true">Yes — Show on store</option>
                <option value="false">No — Hidden</option>
              </select>
            </div>

            {/* Image upload */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>Product Image</label>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <input style={inp} value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
                    onChange={e => { setForm(f => ({ ...f, imageUrl: e.target.value })); setPreview(e.target.value); }}
                    placeholder="Paste image URL (https://...)" />
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>or upload from device ↓</div>
                </div>
                <label style={{ padding: "9px 16px", background: "#e8f5e9", color: "#2e7d32", border: "1.5px dashed #a5d6a7", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  📷 Upload Photo
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                </label>
              </div>
              {preview && (
                <div style={{ marginTop: 8, position: "relative", display: "inline-block" }}>
                  <img src={preview} alt="preview" style={{ height: 100, borderRadius: 8, objectFit: "cover" }} onError={() => setPreview("")} />
                  <button onClick={() => { setPreview(""); setForm(f => ({ ...f, imageUrl: "" })); }}
                    style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", background: "#c62828", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>Description <span style={{ fontWeight: 400, color: "#aaa" }}>(optional)</span></label>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 70 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the product — origin, quality, usage..." />
            </div>

            {/* Weight & Price variants */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>Weight Categories & Prices *</label>
              <div style={{ background: "#f9f6f2", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "40px 120px 1fr 120px", gap: 8 }}>
                  {["", "Weight", "Price (₹)", "Per kg (auto)"].map((h, i) => (
                    <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
                  ))}
                </div>
                {variants.map((v, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 120px 1fr 120px", gap: 8, alignItems: "center", opacity: v.enabled ? 1 : 0.4 }}>
                    <input type="checkbox" checked={v.enabled} onChange={() => toggleVariant(i)}
                      style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#3b1f0e" }} />
                    <div style={{ padding: "8px 10px", background: "#fff", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#3b1f0e" }}>{v.weight}</div>
                    <input style={{ ...inp, padding: "8px 10px" }} type="number" value={v.price}
                      onChange={e => updatePrice(i, e.target.value)}
                      disabled={!v.enabled} placeholder="Enter price" />
                    <div style={{ padding: "8px 10px", background: "#f0ece8", border: "1.5px solid #e0d8d0", borderRadius: 8, fontSize: 13, color: "#666" }}>
                      {v.price ? `₹${calcPerKg(Number(v.price), v.weight)}/kg` : "—"}
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: "#aaa" }}>Check the weights this product is available in and enter the price for each.</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={handleSubmit} disabled={saving} style={{ padding: "10px 24px", background: "#3b1f0e", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 700 }}>
              {saving ? "Saving..." : editId ? "Update Product" : "Add Product"}
            </button>
            <button onClick={() => { resetForm(); setShowForm(false); }} style={{ padding: "10px 18px", background: "#f0ece8", color: "#555", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {products.map(p => (
          <div key={p.id} style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", opacity: p.active === false ? 0.6 : 1 }}>
            <div style={{ height: 130, background: "#f0ece8", overflow: "hidden" }}>
              {(p.imageUrl || p.image) ? <img src={p.imageUrl || p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🌾</div>}
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#3b1f0e", marginBottom: 2 }}>{p.name || p.nameKey}</div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{p.weight} · Stock: {p.stock ?? "—"}</div>
              {p.description && <div style={{ fontSize: 11, color: "#999", marginBottom: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.description}</div>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#e65100" }}>₹{p.price}</div>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: (categoryColor[p.category] || "#888") + "20", color: categoryColor[p.category] || "#888", fontWeight: 600 }}>{p.category}</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button onClick={() => startEdit(p)} style={{ flex: 1, padding: "6px", background: "#e3f2fd", color: "#1565c0", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>✏️ Edit</button>
                <button onClick={() => { if (window.confirm("Delete this product?")) onDelete(p.id); }} style={{ flex: 1, padding: "6px", background: "#ffebee", color: "#c62828", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>🗑 Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerDetail({ customer, orders, onBack }) {
  const customerOrders = orders.filter(o => o.customerId === customer.id).sort((a, b) => {
    const ta = a.createdAt?.toDate?.()?.getTime() || 0;
    const tb = b.createdAt?.toDate?.()?.getTime() || 0;
    return tb - ta;
  });
  const totalSpend = customerOrders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.total || 0), 0);

  const deliveryTime = (order) => {
    if (order.status !== "delivered") return null;
    const created = order.createdAt?.toDate?.()?.getTime();
    const updated = order.updatedAt?.toDate?.()?.getTime();
    if (!created || !updated) return null;
    const mins = Math.round((updated - created) / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  };

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: 16, padding: "8px 16px", background: "#f0ece8", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>← Back to Customers</button>

      {/* Customer Card */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f0ece8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#3b1f0e", flexShrink: 0 }}>
            {(customer.name || customer.email || "?")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#3b1f0e" }}>{customer.name || "—"}</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{customer.email}</div>
            <div style={{ fontSize: 13, color: "#888" }}>{customer.phone || "—"}</div>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ textAlign: "center", background: "#f9f6f2", borderRadius: 10, padding: "12px 20px" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#3b1f0e" }}>{customerOrders.length}</div>
              <div style={{ fontSize: 11, color: "#888" }}>Total Orders</div>
            </div>
            <div style={{ textAlign: "center", background: "#f9f6f2", borderRadius: 10, padding: "12px 20px" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#2e7d32" }}>₹{totalSpend.toLocaleString("en-IN")}</div>
              <div style={{ fontSize: 11, color: "#888" }}>Total Spend</div>
            </div>
            <div style={{ textAlign: "center", background: "#f9f6f2", borderRadius: 10, padding: "12px 20px" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#1565c0" }}>{customerOrders.filter(o => o.status === "delivered").length}</div>
              <div style={{ fontSize: 11, color: "#888" }}>Delivered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Order History */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#3b1f0e", marginBottom: 12 }}>Order History</h3>
      {customerOrders.length === 0
        ? <div style={{ background: "#fff", borderRadius: 12, padding: 30, textAlign: "center", color: "#aaa" }}>No orders from this customer yet.</div>
        : customerOrders.map((o, idx) => {
          const sc = statusColors[o.status] || statusColors.pending;
          const createdAt = o.createdAt?.toDate?.();
          const dt = deliveryTime(o);
          return (
            <div key={o.id} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", marginBottom: 10, boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#3b1f0e" }}>Order #{o.id.slice(-8).toUpperCase()}</div>
                  <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                    {createdAt ? createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ background: sc.bg, color: sc.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{sc.label}</span>
                  <span style={{ fontWeight: 800, fontSize: 15, color: "#3b1f0e" }}>₹{o.total}</span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
                <strong>Items:</strong> {o.items?.map(i => `${i.name} ${i.weight || ""} ×${i.qty}`).join(", ") || "—"}
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#888" }}>Subtotal: ₹{o.subtotal || o.total}</span>
                <span style={{ fontSize: 12, color: "#888" }}>Delivery: ₹{o.deliveryFee || 0} ({o.deliveryType || "eco"})</span>
                <span style={{ fontSize: 12, color: "#888" }}>Payment: {o.payment?.toUpperCase()}</span>
                {dt && <span style={{ fontSize: 12, fontWeight: 700, color: "#2e7d32" }}>Delivered in: {dt}</span>}
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

function CustomersView({ customers, orders }) {
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const orderCountMap = {};
  const spendMap = {};
  orders.forEach(o => { if (o.customerId) orderCountMap[o.customerId] = (orderCountMap[o.customerId] || 0) + 1; });
  orders.filter(o => o.status === "delivered").forEach(o => { if (o.customerId) spendMap[o.customerId] = (spendMap[o.customerId] || 0) + (o.total || 0); });

  if (selectedCustomer) {
    return <CustomerDetail customer={selectedCustomer} orders={orders} onBack={() => setSelectedCustomer(null)} />;
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: "#3b1f0e" }}>Customers</h2>
      {customers.length === 0
        ? <div style={{ background: "#fff", borderRadius: 12, padding: 40, textAlign: "center", color: "#aaa" }}>No customers yet. They'll appear here after first orders.</div>
        : (
          <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9f6f2" }}>
                  {["Customer","Phone","Orders","Total Spend","Joined",""].map(h => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#777", borderBottom: "1px solid #eee" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f0ece8", cursor: "pointer" }} onClick={() => setSelectedCustomer(c)}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name || c.displayName || "—"}</div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>{c.email}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#555" }}>{c.phone || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: "#e3f2fd", color: "#1565c0", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{orderCountMap[c.id] || 0}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#2e7d32" }}>₹{(spendMap[c.id] || 0).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#aaa" }}>{c.createdAt?.toDate?.().toLocaleDateString("en-IN") || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 12, color: "#1565c0", fontWeight: 600 }}>View →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}

function BannersView({ banners, onToggle, onAdd, onDelete }) {
  const [form, setForm] = useState({ title: "", type: "Offer" });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const inp = { width: "100%", padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" };
  const handleAdd = async () => { if (!form.title) return; setSaving(true); await onAdd({ ...form, active: true }); setForm({ title: "", type: "Offer" }); setShowForm(false); setSaving(false); };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#3b1f0e" }}>Banners & Offers</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: "9px 18px", background: "#3b1f0e", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>{showForm ? "✕ Cancel" : "+ Add Banner"}</button>
      </div>
      {showForm && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4, display: "block" }}>Banner Text</label><input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Festival Sale — 20% Off" /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4, display: "block" }}>Type</label><select style={{ ...inp, width: "auto" }} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option>Offer</option><option>Announcement</option><option>Promotion</option></select></div>
          </div>
          <button onClick={handleAdd} disabled={saving} style={{ marginTop: 12, padding: "9px 20px", background: "#3b1f0e", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>{saving ? "Saving..." : "Add Banner"}</button>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {banners.map(b => (
          <div key={b.id} style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", boxShadow: "0 2px 6px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{b.title}</div><span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#f0ece8", color: "#3b1f0e", fontWeight: 600, marginTop: 4, display: "inline-block" }}>{b.type}</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: b.active ? "#2e7d32" : "#aaa", fontWeight: 600 }}>{b.active ? "● Live" : "○ Off"}</span>
              <button onClick={() => onToggle(b.id, !b.active)} style={{ padding: "6px 14px", background: b.active ? "#ffebee" : "#e8f5e9", color: b.active ? "#c62828" : "#2e7d32", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>{b.active ? "Turn Off" : "Turn On"}</button>
              <button onClick={() => { if (window.confirm("Delete banner?")) onDelete(b.id); }} style={{ padding: "6px 12px", background: "#fff0f0", color: "#c62828", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SKELETON ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ padding: "32px 28px" }}>
      <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
        {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: 90, borderRadius: 12, background: "linear-gradient(90deg,#f0ece8 25%,#e6e0d8 50%,#f0ece8 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s ease-in-out infinite" }} />)}
      </div>
      <div style={{ height: 300, borderRadius: 12, background: "linear-gradient(90deg,#f0ece8 25%,#e6e0d8 50%,#f0ece8 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s ease-in-out infinite" }} />
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, logout, loading, isKBRAdmin } = useAdminAuth();
  const [active, setActive] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [banners, setBanners] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Load customers + banners in parallel immediately
    getCustomers().then(setCustomers).catch(() => {});
    getBanners().then(async b => {
      if (b.length === 0) { await seedBannersIfEmpty(); getBanners().then(setBanners); }
      else setBanners(b);
    }).catch(() => {});
    // Subscribe to real-time orders
    const unsub1 = subscribeOrders(setOrders);
    // Subscribe to products — seed only if empty
    const unsub2 = subscribeProducts(async prods => {
      if (prods.length === 0) {
        await seedProductsIfEmpty(allProducts);
      } else {
        setProducts(prods);
        setDataLoading(false);
      }
    });
    return () => { unsub1(); unsub2(); };
  }, [user]);

  // Safety timeout — if still loading after 4s, stop spinner
  useEffect(() => {
    const t = setTimeout(() => setDataLoading(false), 4000);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: 14, color: "#aaa" }}>Loading...</div>;
  if (!isKBRAdmin) return <AdminLoginPage />;

  const renderContent = () => {
    if (dataLoading) return <Skeleton />;
    switch (active) {
      case "dashboard": return <DashboardView orders={orders} products={products} customers={customers} />;
      case "orders":    return <OrdersView orders={orders} onStatusUpdate={updateOrderStatus} />;
      case "products":  return <ProductsView products={products} onAdd={addProduct} onDelete={deleteProduct} onUpdate={updateProduct} />;
      case "customers": return <CustomersView customers={customers} orders={orders} />;
      case "banners":   return <BannersView banners={banners} onToggle={toggleBanner} onAdd={addBanner} onDelete={deleteBanner} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f0ea", fontFamily: "var(--font-body,'Inter',sans-serif)" }}>
      <Sidebar active={active} setActive={setActive} onLogout={logout} />
      <main style={{ flex: 1, padding: "32px 28px", overflowY: "auto", maxWidth: 1100 }}>
        {renderContent()}
      </main>
    </div>
  );
}
