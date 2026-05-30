import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../home/Home.css";
import { useLang } from "../LanguageContext";
import { useCart } from "../CartContext";
import { allProducts } from "../data/products";
import BottomNav from "../home/BottomNav";
import GoToCart from "../components/GoToCart";

const brandMeta = {
  "india-gate": {
    name: "India Gate",
    img: "/Brands/indiagate.png",
    descEN: "India's most trusted basmati rice brand — premium quality since 1993",
    descTE: "భారతదేశంలో అత్యంత విశ్వసనీయమైన బాస్మతి బ్రాండ్",
    categories: ["basmati"],
    color: "#fff8e1",
  },
  "daawat": {
    name: "Daawat",
    img: "/Brands/daawat.png",
    descEN: "Finest aged basmati rice — loved across Indian kitchens",
    descTE: "ఉత్తమ నాణ్యత గల పాత బాస్మతి బియ్యం",
    categories: ["basmati"],
    color: "#fce4ec",
  },
  "kohinoor": {
    name: "Kohinoor",
    img: "/Brands/kohinoor.png",
    descEN: "Premium rice collection — basmati and specialty varieties",
    descTE: "ప్రీమియం బియ్యం సేకరణ — బాస్మతి మరియు ప్రత్యేక రకాలు",
    categories: ["basmati", "non-basmati"],
    color: "#f3e5f5",
  },
  "unity": {
    name: "Unity",
    img: "/Brands/unity.png",
    descEN: "Local Visakhapatnam brand — fresh Sona Masoori & millets direct from farms",
    descTE: "విశాఖపట్నం స్థానిక బ్రాండ్ — తాజా సోనా మసూరి & చిరుధాన్యాలు",
    categories: ["non-basmati", "millets"],
    color: "#f1f8e9",
  },
};

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

export default function BrandPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { totalItems } = useCart();

  const meta = brandMeta[slug];

  // Show brand products — match by categories the brand covers
  const products = meta
    ? allProducts.filter(p => meta.categories.includes(p.category))
    : [];

  if (!meta) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Brand not found.</p>
        <button onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  const desc = lang === "TE" ? meta.descTE : meta.descEN;

  return (
    <div className="mobile" style={{ background: "var(--cream)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#fff", position: "sticky", top: 0, zIndex: 100, boxShadow: "var(--shadow-sm)", borderBottom: "1px solid var(--border)" }}>
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span style={{ fontSize: "17px", fontWeight: "700", color: "var(--brown-dark)", fontFamily: "var(--font-display)" }}>{meta.name}</span>
      </div>

      {/* Brand Hero */}
      <div style={{ background: meta.color, padding: "24px 20px", display: "flex", alignItems: "center", gap: "20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ width: "80px", height: "80px", background: "#fff", borderRadius: "12px", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", flexShrink: 0 }}>
          <img src={meta.img} alt={meta.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--brown-dark)", fontFamily: "var(--font-display)", marginBottom: "6px" }}>{meta.name}</h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</p>
          <p style={{ fontSize: "11px", fontWeight: "700", color: "var(--olive)", marginTop: "8px" }}>{products.length} products available</p>
        </div>
      </div>

      {/* Products Grid */}
      <div style={{ padding: "14px 12px 100px" }}>
        <p style={{ fontSize: "12px", fontWeight: "800", color: "var(--brown-dark)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "12px" }}>
          {meta.name} Products
        </p>
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🌾</div>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No products available for this brand.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {products.map(p => <ProductCard key={p.id} p={p} t={t} />)}
          </div>
        )}
      </div>

      <GoToCart itemCount={totalItems} />
      <BottomNav />
    </div>
  );
}
