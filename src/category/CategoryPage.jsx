import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

import "../home/Home.css";
import { useLang } from "../LanguageContext";
import { useCart } from "../CartContext";
import { useProducts } from "../ProductsContext";
import BottomNav from "../home/BottomNav";
import GoToCart from "../components/GoToCart";

const categoryMeta = {
  "basmati": {
    titleKey: "basmatiSection",
    descEN: "Long grain, aromatic rice — perfect for biryanis & pulaos",
    descTE: "సుగంధభరిత బాస్మతి బియ్యం — బిర్యానీ & పులావ్ కోసం అనువైనది",
    img: "/categories/basmati.png",
    color: "#fff8e1",
    accent: "#f57f17",
  },
  "non-basmati": {
    titleKey: "nonBasmatiSection",
    descEN: "Fresh rice — the daily staple of every Telugu home",
    descTE: "తాజా బియ్యం — ప్రతి తెలుగు ఇంటి నిత్య అవసరం",
    img: "/categories/nonbasmati.png",
    color: "#fbe9e7",
    accent: "#bf360c",
  },
  "millets": {
    titleKey: "milletsSection",
    descEN: "Nutritious native millets — foxtail, pearl, finger & little millet",
    descTE: "పోషకాలతో నిండిన స్థానిక చిరుధాన్యాలు — కొర్రలు, సజ్జలు, రాగులు & సామలు",
    img: "/categories/millets.png",
    color: "#f1f8e9",
    accent: "#558b2f",
  },
};

const NON_BASMATI_SUBCATS = [
  { key: "all",           labelEN: "All",           labelTE: "అన్నీ" },
  { key: "sona-masoorie", labelEN: "Sona Masoorie", labelTE: "సోనా మసూరి" },
  { key: "steam-rice",    labelEN: "Steam Rice",    labelTE: "స్టీమ్ రైస్" },
  { key: "raw-rice",      labelEN: "Raw Rice",      labelTE: "రా రైస్" },
  { key: "half-boiled",   labelEN: "Half Boiled",   labelTE: "హాఫ్ బాయిల్డ్" },
];

function ProductCard({ p, t }) {
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart } = useCart();
  const [selectedIdx, setSelectedIdx] = useState(0);

  const variants = p.variants?.length
    ? p.variants
    : [{ weight: p.weight, price: p.price, perKgPrice: p.perKgPrice }];

  const selected = variants[selectedIdx];
  const name = t[p.nameKey] || p.nameKey;
  const cartKey = `${p.id}_${selected.weight}`;
  const cartItem = cart.find(i => i.id === cartKey);
  const qty = cartItem?.qty || 0;

  const handleAdd = (e) => { e.stopPropagation(); addToCart({ ...p, id: cartKey, name, weight: selected.weight, price: selected.price, perKgPrice: selected.perKgPrice, perKg: `₹${selected.perKgPrice}/kg` }); };
  const handleRemove = (e) => { e.stopPropagation(); removeFromCart(cartKey); };

  return (
    <div className="product-card" onClick={() => navigate(`/product/${p.id}`)} style={{ position: "relative" }}>
      <div className="card-top">
        {qty === 0 ? (
          <button className="add-btn" onClick={handleAdd}>+</button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--brown-dark)", borderRadius: "6px", padding: "2px 10px" }} onClick={e => e.stopPropagation()}>
            <button onClick={handleRemove} style={{ background: "none", border: "none", color: "#fff", fontSize: "16px", cursor: "pointer" }}>−</button>
            <span style={{ color: "#fff", fontWeight: "700", fontSize: "13px" }}>{qty}</span>
            <button onClick={handleAdd} style={{ background: "none", border: "none", color: "#fff", fontSize: "16px", cursor: "pointer" }}>+</button>
          </div>
        )}
      </div>
      <div className="product-img"><img src={p.img} alt={name} /></div>

      {/* Weight dropdown */}
      <div onClick={e => e.stopPropagation()} style={{ margin: "6px 6px 2px", position: "relative" }}>
        <select
          value={selectedIdx}
          onChange={e => { e.stopPropagation(); setSelectedIdx(Number(e.target.value)); }}
          style={{ width: "100%", padding: "5px 20px 5px 8px", border: "1.5px solid var(--border)", borderRadius: "20px", fontSize: "11px", fontWeight: "600", color: "var(--brown-dark)", background: "#fff", cursor: "pointer", appearance: "none", WebkitAppearance: "none", fontFamily: "var(--font-body)" }}
        >
          {variants.map((v, i) => (
            <option key={i} value={i}>{v.weight}  (₹{v.perKgPrice}/kg)</option>
          ))}
        </select>
        <span style={{ position: "absolute", right: "7px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "9px", color: "var(--brown-dark)" }}>▾</span>
      </div>

      <h4>{name}</h4>
      <p className="price">₹{selected.price}</p>
      <p className="per-kg">₹{selected.perKgPrice}/kg</p>
    </div>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { totalItems } = useCart();
  const [activeSub, setActiveSub] = useState("all");

  const { products: allProducts } = useProducts();
  const meta = categoryMeta[slug];
  const isNonBasmati = slug === "non-basmati";

  if (!meta) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Category not found.</p>
        <button onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  const allCatProducts = allProducts.filter(p => p.category === slug && p.active !== false);
  const filteredProducts = isNonBasmati && activeSub !== "all"
    ? allCatProducts.filter(p => p.subCategory === activeSub)
    : allCatProducts;

  const title = t[meta.titleKey] || meta.titleKey;
  const desc = lang === "TE" ? meta.descTE : meta.descEN;

  return (
    <div className="mobile" style={{ background: "var(--cream)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#fff", position: "sticky", top: 0, zIndex: 100, boxShadow: "var(--shadow-sm)", borderBottom: "1px solid var(--border)" }}>
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span style={{ fontSize: "17px", fontWeight: "700", color: "var(--brown-dark)", fontFamily: "var(--font-display)" }}>{title}</span>
      </div>

      {/* Category Hero Banner */}
      <div style={{ background: meta.color, padding: "18px 16px 14px", display: "flex", alignItems: "center", gap: "16px", borderBottom: `2px solid ${meta.accent}22` }}>
        <img src={meta.img} alt={title} style={{ width: "64px", height: "64px", objectFit: "contain", flexShrink: 0 }} />
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "var(--brown-dark)", fontFamily: "var(--font-display)", marginBottom: "4px" }}>{title}</h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</p>
          <p style={{ fontSize: "11px", fontWeight: "700", color: meta.accent, marginTop: "6px" }}>{allCatProducts.length} products available</p>
        </div>
      </div>

      {/* Sub-category tabs (non-basmati only) */}
      {isNonBasmati && (
        <div style={{ background: "#fff", borderBottom: "1px solid var(--border)", overflowX: "auto", display: "flex", padding: "0 4px" }}>
          {NON_BASMATI_SUBCATS.map(sub => {
            const label = lang === "TE" ? sub.labelTE : sub.labelEN;
            const isActive = activeSub === sub.key;
            return (
              <button
                key={sub.key}
                onClick={() => setActiveSub(sub.key)}
                style={{
                  flexShrink: 0, padding: "12px 14px", border: "none", background: "none",
                  fontSize: "13px", fontWeight: isActive ? "800" : "500",
                  color: isActive ? "var(--brown-dark)" : "var(--text-muted)",
                  borderBottom: isActive ? "2px solid var(--brown-dark)" : "2px solid transparent",
                  cursor: "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Products Grid */}
      <div style={{ padding: "14px 12px 120px" }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🌾</div>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No products found.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {filteredProducts.map(p => (
              <ProductCard key={p.id} p={p} t={t} />
            ))}
          </div>
        )}
      </div>

      <GoToCart itemCount={totalItems} />
      <BottomNav />
    </div>
  );
}
