import { useNavigate } from "react-router-dom";
import { useLang } from "../LanguageContext";
import { useCart } from "../CartContext";
import { allProducts } from "../data/products";

function ProductCard({ p, t }) {
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart } = useCart();
  const cartItem = cart.find(i => i.id === p.id);
  const qty = cartItem ? cartItem.qty : 0;
  const productName = t[p.nameKey] || p.nameKey;

  return (
    <div className="product-card" onClick={() => navigate(`/product/${p.id}`)}>
      <div className="card-top">
        {qty === 0 ? (
          <button className="add-btn" onClick={e => {
            e.stopPropagation();
            addToCart({ ...p, name: productName, perKg: `₹${p.perKgPrice}/kg` });
          }}>+</button>
        ) : (
          <div
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--brown-dark)", borderRadius: "6px", padding: "2px 8px" }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={e => { e.stopPropagation(); removeFromCart(p.id); }} style={{ background: "none", border: "none", color: "#fff", fontSize: "16px", cursor: "pointer" }}>−</button>
            <span style={{ color: "#fff", fontWeight: "700", fontSize: "12px" }}>{qty}</span>
            <button onClick={e => { e.stopPropagation(); addToCart({ ...p, name: productName, perKg: `₹${p.perKgPrice}/kg` }); }} style={{ background: "none", border: "none", color: "#fff", fontSize: "16px", cursor: "pointer" }}>+</button>
          </div>
        )}
      </div>
      <div className="product-img"><img src={p.img} alt={productName} /></div>
      <span className="weight-badge">{p.weight}</span>
      <h4>{productName}</h4>
      <p className="price">₹{p.price}</p>
      <p className="per-kg">₹{p.perKgPrice}/kg</p>
    </div>
  );
}

function Products() {
  const { t } = useLang();
  const navigate = useNavigate();

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
