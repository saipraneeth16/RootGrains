import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../home/Home.css";
import { useLang } from "../LanguageContext";
import { useCart } from "../CartContext";
import { getProductById } from "../services/firestore";

function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const { cart, addToCart, removeFromCart, totalItems } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always load from Firestore — local data has placeholder prices
    getProductById(id)
      .then(p => { setProduct(p || null); setLoading(false); })
      .catch(() => { setProduct(null); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#aaa" }}>
      <div style={{ width: 40, height: 40, border: "3px solid #e0d8d0", borderTop: "3px solid #3b1f0e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize: 13 }}>Loading product...</span>
    </div>
  );

  if (!product) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 48 }}>🌾</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#3b1f0e" }}>Product not found</div>
      <button onClick={() => navigate("/")} style={{ padding: "10px 24px", background: "#3b1f0e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>← Back to Home</button>
    </div>
  );

  // Use variants array if available, else fall back to base product as single variant
  const variants = product.variants?.length
    ? product.variants
    : [{ weight: product.weight, price: product.price, perKgPrice: product.perKgPrice }];

  const selected = variants[selectedVariantIdx] || variants[0];

  // Cart key: product id + weight so each weight is tracked separately
  const cartKey = `${product.id}_${selected.weight}`;
  const cartItem = cart.find(i => i.id === cartKey);
  const qty = cartItem?.qty || 0;

  const productName = t[product.nameKey] || product.name || product.nameKey;
  const productType = product.category === "basmati" ? "Basmati Rice"
    : product.category === "millets" ? "Millet"
    : "Non-Basmati Rice";

  const handleAdd = () => addToCart({
    ...product,
    id: cartKey,
    name: productName,
    weight: selected.weight,
    price: selected.price,
    perKgPrice: selected.perKgPrice,
    perKg: `₹${selected.perKgPrice}/kg`,
  });

  const handleRemove = () => removeFromCart(cartKey);

  return (
    <div className="app-container" style={{ background: "#faf8f5", minHeight: "100vh" }}>

      {/* Back button */}
      <div style={{ padding: "16px 16px 0" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#3b1f0e" }}>←</button>
      </div>

      {/* Product Image */}
      <div style={{ margin: "12px 16px", borderRadius: 16, overflow: "hidden", background: "#f0ece8", height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {(product.imageUrl || product.image || product.img) ? (
          <img src={product.imageUrl || product.image || product.img} alt={productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ fontSize: 64 }}>🌾</div>
        )}
      </div>

      {/* Product Info */}
      <div style={{ padding: "0 16px 180px" }}>
        <div style={{ fontSize: 11, color: "#888", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{productType}</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#3b1f0e", marginBottom: 14, lineHeight: 1.2 }}>{productName}</h1>

        {/* Weight dropdown */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6 }}>Select Weight</p>
          <div style={{ position: "relative" }}>
            <select
              value={selectedVariantIdx}
              onChange={e => setSelectedVariantIdx(Number(e.target.value))}
              style={{
                width: "100%", padding: "11px 36px 11px 14px",
                border: "1.5px solid #d0c8c0", borderRadius: 24,
                fontSize: 14, fontWeight: 700, color: "#3b1f0e",
                background: "#fff", cursor: "pointer",
                appearance: "none", WebkitAppearance: "none",
                fontFamily: "var(--font-body)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              }}
            >
              {variants.map((v, i) => (
                <option key={i} value={i}>
                  {v.weight}  —  ₹{v.price}  (₹{v.perKgPrice}/kg)
                </option>
              ))}
            </select>
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 14, color: "#3b1f0e" }}>▾</span>
          </div>
        </div>

        {/* Price */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#e65100" }}>₹{selected.price}</span>
          {selected.perKgPrice && <span style={{ fontSize: 13, color: "#aaa" }}>₹{selected.perKgPrice}/kg</span>}
        </div>

        {product.description && (
          <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 16px", background: "#fff", padding: 14, borderRadius: 10 }}>{product.description}</p>
        )}

        {/* Product details table */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#3b1f0e", marginBottom: 10 }}>Product Details</div>
          {[
            [t.type || "Type", productType],
            ["Selected Weight", selected.weight],
            ["Price per kg", `₹${selected.perKgPrice}/kg`],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f5f0ea", fontSize: 13 }}>
              <span style={{ color: "#888" }}>{label}</span>
              <span style={{ fontWeight: 600, color: "#333" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Storage note */}
        <div style={{ background: "#f1f8e9", border: "1px solid #c8e6c9", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18 }}>ℹ️</span>
          <p style={{ fontSize: 12, color: "#33691e", lineHeight: 1.6 }}>
            <strong>Shelf life</strong> depends upon storage conditions. For best quality, store in a <strong>cool and dry place</strong>.
          </p>
        </div>

        {/* WhatsApp */}
        <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, background: "#e8f5e9", borderRadius: 10, padding: "12px 16px", textDecoration: "none", marginBottom: 16 }}>
          <span style={{ fontSize: 22 }}>💬</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2e7d32" }}>{t.whatsapp || "Chat on WhatsApp"}</div>
            <div style={{ fontSize: 11, color: "#888" }}>Quick response guaranteed</div>
          </div>
        </a>
      </div>

      {/* Floating Add to Cart */}
      <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 448, zIndex: 100, display: "flex", flexDirection: "column", gap: "8px", pointerEvents: "none" }}>
        {qty === 0 ? (
          <button onClick={handleAdd} style={{ pointerEvents: "auto", width: "100%", padding: "14px", background: "#3b1f0e", color: "#fff", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 18px rgba(61,31,10,0.35)" }}>
            Add to Cart — ₹{selected.price}
          </button>
        ) : (
          <>
            <div style={{ pointerEvents: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#3b1f0e", borderRadius: 14, padding: "8px 8px 8px 16px", boxShadow: "0 4px 18px rgba(61,31,10,0.35)" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>₹{selected.price * qty} · {qty} in cart</span>
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <button onClick={handleRemove} style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, minWidth: 28, textAlign: "center" }}>{qty}</span>
                <button onClick={handleAdd} style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "#fff", color: "#3b1f0e", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
            </div>
            <button onClick={() => navigate("/cart")} style={{ pointerEvents: "auto", width: "100%", padding: "13px", background: "#5a8a3c", color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 18px rgba(90,138,60,0.4)" }}>
              View Cart ({totalItems} {totalItems === 1 ? "item" : "items"}) →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ProductPage;
