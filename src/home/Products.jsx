import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../LanguageContext";
import { useCart } from "../CartContext";
import { useProducts } from "../ProductsContext";

function ProductCard({ p, t }) {
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart } = useCart();

  const variants = p.variants?.length
    ? p.variants
    : [{ weight: p.weight, price: p.price, perKgPrice: p.perKgPrice }];

  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = variants[selectedIdx];
  const productName = p.name || t[p.nameKey] || p.nameKey;

  const cartKey = `${p.id}_${selected.weight}`;
  const cartItem = cart.find(i => i.id === cartKey);
  const qty = cartItem?.qty || 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart({ ...p, id: cartKey, name: productName, weight: selected.weight, price: selected.price, perKgPrice: selected.perKgPrice, perKg: `₹${selected.perKgPrice}/kg` });
  };
  const handleRemove = (e) => { e.stopPropagation(); removeFromCart(cartKey); };

  return (
    <div className="product-card" onClick={() => navigate(`/product/${p.id}`)}>
      {/* Add / Qty control */}
      <div className="card-top">
        {qty === 0 ? (
          <button className="add-btn" onClick={handleAdd}>+</button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--brown-dark)", borderRadius: "6px", padding: "2px 8px" }} onClick={e => e.stopPropagation()}>
            <button onClick={handleRemove} style={{ background: "none", border: "none", color: "#fff", fontSize: "16px", cursor: "pointer" }}>−</button>
            <span style={{ color: "#fff", fontWeight: "700", fontSize: "12px" }}>{qty}</span>
            <button onClick={handleAdd} style={{ background: "none", border: "none", color: "#fff", fontSize: "16px", cursor: "pointer" }}>+</button>
          </div>
        )}
      </div>

      {/* Image */}
      <div className="product-img"><img src={p.img} alt={productName} /></div>

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

      <h4>{productName}</h4>
      <p className="price">₹{selected.price}</p>
      <p className="per-kg">₹{selected.perKgPrice}/kg</p>
    </div>
  );
}

function Products() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { products: allProducts, loading } = useProducts();

  const nonBasmati = allProducts.filter(p => p.category === "non-basmati").slice(0, 4);
  const millets = allProducts.filter(p => p.category === "millets").slice(0, 4);

  return (
    <div>
      <div className="products">
        <div className="section-header">
          <h3>{t.nonBasmatiSection}</h3>
          <span onClick={() => navigate("/category/non-basmati")}>{t.seeAllProducts}</span>
        </div>
        <div className="product-list">
          {nonBasmati.map(p => <ProductCard key={p.id} p={p} t={t} />)}
        </div>
        <button className="see-all-btn" onClick={() => navigate("/category/non-basmati")}>{t.seeAllProducts}</button>
      </div>

      <div className="products">
        <div className="section-header">
          <h3>{t.milletsSection}</h3>
          <span onClick={() => navigate("/category/millets")}>{t.seeAllProducts}</span>
        </div>
        <div className="product-list">
          {millets.map(p => <ProductCard key={p.id} p={p} t={t} />)}
        </div>
        <button className="see-all-btn" onClick={() => navigate("/category/millets")}>{t.seeAllProducts}</button>
      </div>
    </div>
  );
}

export default Products;
export { ProductCard };
