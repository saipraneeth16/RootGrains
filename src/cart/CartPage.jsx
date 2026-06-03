import { useNavigate } from "react-router-dom";
import "../home/Home.css";
import { useLang } from "../LanguageContext";
import { useCart } from "../CartContext";
import { useAuth } from "../auth/AuthContext";
import BottomNav from "../home/BottomNav";

function CartPage() {
  const { cart, addToCart, removeFromCart, deleteFromCart, subtotal } = useCart();
  const navigate = useNavigate();
  const { t } = useLang();
  const { user } = useAuth();

  const handleCheckout = () => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
    } else {
      navigate("/checkout");
    }
  };

  return (
    <div className="mobile">
      <div className="cart-header">
        <button className="back-btn" onClick={() => navigate("/")}>←</button>
        <div>
          <h2 className="cart-title">{t.myCart}</h2>
          <p className="cart-count">{cart.reduce((s, i) => s + i.qty, 0)} {t.items}</p>
        </div>
      </div>

      {cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "70px 20px" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🛒</div>
          <h3 style={{ color: "var(--brown-dark)", fontFamily: "var(--font-display)", fontSize: "20px", marginBottom: "8px" }}>{t.cartEmpty}</h3>
          <button onClick={() => navigate("/")} style={{ marginTop: "16px", padding: "12px 28px", background: "var(--brown-dark)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontWeight: "700", fontSize: "14px", fontFamily: "var(--font-body)" }}>
            {t.shopNowBtn}
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.imageUrl || item.img || item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <p className="cart-item-name">{item.name} {item.weight}</p>
                  <p className="cart-item-price">₹{item.price * item.qty}</p>
                  <p className="cart-item-perkg">₹{item.price} × {item.qty}</p>
                  <div className="cart-qty-row">
                    <button onClick={() => removeFromCart(item.id)}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => addToCart(item)}>+</button>
                  </div>
                </div>
                <button className="cart-delete-btn" onClick={() => deleteFromCart(item.id)}>🗑</button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-summary-row">
              <span>{t.subtotal} ({cart.reduce((s, i) => s + i.qty, 0)} {t.items})</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="cart-summary-row">
              <span>Delivery fee</span>
              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Calculated at checkout</span>
            </div>
            <div className="cart-summary-divider" />
            <div className="cart-summary-row total">
              <span>{t.toPay}</span>
              <span>₹{subtotal}</span>
            </div>
          </div>

          <div className="cart-checkout">
            <button className="checkout-btn" onClick={handleCheckout}>
              {user ? t.proceedCheckout : "Login to Checkout"}
            </button>
          </div>
        </>
      )}
      <BottomNav />
    </div>
  );
}
export default CartPage;
