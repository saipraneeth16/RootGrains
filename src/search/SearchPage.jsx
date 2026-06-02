import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoToCart from "../components/GoToCart";
import "../home/Home.css";
import { useLang } from "../LanguageContext";
import { useCart } from "../CartContext";
import { useProducts } from "../ProductsContext";

const recentSearches = ["sona masoori rice", "basmati rice", "ragi", "brown rice", "korra"];
const popularSearches = ["Basmati Rice", "Foxtail Millet", "Sona Masoori", "Ragi", "Pearl Millet"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { t } = useLang();
  const { cart, addToCart, removeFromCart, totalItems } = useCart();
  const { products: allProducts } = useProducts();

  const getProductName = (p) => p.name || t[p.nameKey] || p.nameKey || "";

  const searched = query.trim().length > 0;
  const results = searched
    ? allProducts.filter(p => {
        const name = getProductName(p).toLowerCase();
        const q = query.trim().toLowerCase();
        return name.includes(q) || p.category?.includes(q);
      })
    : [];

  const QtyControl = ({ p }) => {
    const name = getProductName(p);
    const variants = p.variants?.length
      ? p.variants
      : [{ weight: p.weight, price: p.price, perKgPrice: p.perKgPrice }];
    const selected = variants[0];
    const cartKey = `${p.id}_${selected.weight}`;
    const cartItem = cart.find(i => i.id === cartKey);
    const qty = cartItem ? cartItem.qty : 0;

    const handleAdd = (e) => {
      e.stopPropagation();
      addToCart({ ...p, id: cartKey, name, weight: selected.weight, price: selected.price, perKgPrice: selected.perKgPrice });
    };
    const handleRemove = (e) => { e.stopPropagation(); removeFromCart(cartKey); };

    if (qty === 0) return (
      <button className="add-btn" onClick={handleAdd}>+</button>
    );
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--brown-dark)", borderRadius: "var(--radius-sm)", padding: "4px 12px" }} onClick={e => e.stopPropagation()}>
        <button onClick={handleRemove} style={{ background: "none", border: "none", color: "#fff", fontSize: "16px", cursor: "pointer" }}>−</button>
        <span style={{ color: "#fff", fontWeight: "700", fontSize: "13px" }}>{qty}</span>
        <button onClick={handleAdd} style={{ background: "none", border: "none", color: "#fff", fontSize: "16px", cursor: "pointer" }}>+</button>
      </div>
    );
  };

  return (
    <div className="mobile">
      <div className="search-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <div className="search-box active">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder={t.searchPlaceholder} value={query} onChange={e => setQuery(e.target.value)} autoFocus />
          {query && <span onClick={() => setQuery("")} style={{ cursor: "pointer", color: "var(--text-faint)", fontSize: "16px" }}>✕</span>}
        </div>
      </div>

      {!searched && (
        <div className="search-suggestions">
          <h4>{t.recentSearches}</h4>
          <div className="tag-list">
            {recentSearches.map((s, i) => <span key={i} className="tag" onClick={() => setQuery(s)}>🕐 {s}</span>)}
          </div>
          <h4>{t.popularSearches}</h4>
          <div className="tag-list">
            {popularSearches.map((s, i) => <span key={i} className="tag" onClick={() => setQuery(s)}>🔥 {s}</span>)}
          </div>
        </div>
      )}

      {searched && results.length > 0 && (
        <div className="search-results">
          <p className="results-count">{results.length} {t.resultsFor} "{query}"</p>
          {results.map(p => {
            const name = getProductName(p);
            const variants = p.variants?.length ? p.variants : [{ weight: p.weight, price: p.price }];
            return (
              <div key={p.id} className="result-card" onClick={() => navigate(`/product/${p.id}`)}>
                <img src={p.imageUrl || p.img || p.image} alt={name} />
                <div className="result-info">
                  <h4>{name} — {variants[0]?.weight || p.weight}</h4>
                  <p className="price" style={{ color: "var(--brown-dark)" }}>₹{variants[0]?.price || p.price}</p>
                  <p className="per-kg">₹{variants[0]?.perKgPrice || p.perKgPrice}/kg</p>
                </div>
                <QtyControl p={p} />
              </div>
            );
          })}
        </div>
      )}

      {searched && results.length === 0 && (
        <div className="not-available">
          <div style={{ fontSize: "60px", marginBottom: "12px" }}>🌾</div>
          <h3>{t.sorry}</h3>
          <p>{t.notAvailable}</p>
          <h4>{t.tryAlternatives}</h4>
          <div className="alt-list">
            {allProducts.slice(0, 3).map(p => {
              const name = getProductName(p);
              const variants = p.variants?.length ? p.variants : [{ weight: p.weight, price: p.price }];
              return (
                <div key={p.id} className="alt-card" onClick={() => navigate(`/product/${p.id}`)}>
                  <img src={p.imageUrl || p.img || p.image} alt={name} />
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: "600", color: "var(--text)" }}>{name} {variants[0]?.weight}</p>
                    <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--brown-dark)" }}>₹{variants[0]?.price}</p>
                  </div>
                  <QtyControl p={p} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <GoToCart itemCount={totalItems} />
    </div>
  );
}
