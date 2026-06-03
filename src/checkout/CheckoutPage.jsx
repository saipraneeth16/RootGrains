import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../home/Home.css";
import { useLang } from "../LanguageContext";
import { useCart } from "../CartContext";
import { createOrder, saveCustomer, logPageView, getUserAddresses } from "../services/firestore";
import { useAuth } from "../auth/AuthContext";

const s = {
  page: { fontFamily: "var(--font-body)", background: "var(--cream)", minHeight: "100vh" },
  header: { display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#fff", position: "sticky", top: 0, zIndex: 100, boxShadow: "var(--shadow-sm)", borderBottom: "1px solid var(--border)" },
  title: { fontSize: "17px", fontWeight: "700", color: "var(--brown-dark)", fontFamily: "var(--font-display)" },
  section: { background: "#fff", margin: "10px 0", padding: "16px 14px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" },
  sectionTitle: { fontSize: "12px", fontWeight: "800", color: "var(--brown-dark)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "14px" },
  label: { fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", display: "block" },
  input: { width: "100%", padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "14px", color: "var(--text)", background: "var(--cream-2)", outline: "none", fontFamily: "var(--font-body)", boxSizing: "border-box" },
  row: { display: "flex", gap: "10px" },
  summaryRow: { display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" },
};

// Swiggy-style order placed popup
function OrderSuccessPopup({ orderId }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @keyframes scaleIn { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes checkDraw { from{stroke-dashoffset:100} to{stroke-dashoffset:0} }
        @keyframes ripple { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.2);opacity:0} }
        @keyframes slideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>
      <div style={{ background: "#fff", borderRadius: 24, padding: "44px 32px 36px", textAlign: "center", width: "85%", maxWidth: 320, animation: "slideUp 0.4s ease-out" }}>
        {/* Animated check circle */}
        <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto 20px" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#e8f5e9", animation: "ripple 1.2s ease-out 0.3s infinite" }} />
          <div style={{ position: "relative", width: 90, height: 90, borderRadius: "50%", background: "#4caf50", display: "flex", alignItems: "center", justifyContent: "center", animation: "scaleIn 0.4s ease-out 0.1s both" }}>
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <polyline points="8,22 18,32 36,14" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="100" strokeDashoffset="100"
                style={{ animation: "checkDraw 0.5s ease-out 0.5s forwards" }} />
            </svg>
          </div>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#2e7d32", fontFamily: "var(--font-display)", marginBottom: 8 }}>Order Placed!</h2>
        <p style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Your order has been placed successfully.</p>
        <p style={{ fontSize: 12, color: "#aaa" }}>Order #{orderId?.slice(-8).toUpperCase()}</p>
        <div style={{ marginTop: 20, height: 3, background: "#e8f5e9", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "#4caf50", borderRadius: 2, animation: "none", width: "100%", transition: "width 2.5s linear", willChange: "width" }} id="progress-bar" />
        </div>
        <p style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>Taking you to order details...</p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLang();
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [mobile, setMobile] = useState("");
  const [delivery, setDelivery] = useState("eco");
  const [payment, setPayment] = useState("cod");
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState(null);

  const deliveryFee = delivery === "eco" ? Math.round(subtotal * 0.10) : Math.round(subtotal * 0.15);
  const total = subtotal + deliveryFee;

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate("/login", { state: { from: "/checkout" } });
  }, [user]);

  // Load saved addresses and auto-fill mobile from first address
  useEffect(() => {
    if (user) {
      getUserAddresses(user.uid).then(addrs => {
        setAddresses(addrs);
        if (addrs.length > 0) {
          setSelectedAddress(addrs[0]);
          if (addrs[0].phone) setMobile(addrs[0].phone);
        }
      });
    }
  }, [user]);

  // Handle address returned from SavedAddressesPage
  useEffect(() => {
    if (location.state?.selectedAddress) {
      setSelectedAddress(location.state.selectedAddress);
    }
  }, [location.state]);

  useEffect(() => {
    if (cart.length === 0 && !successOrderId) navigate("/");
  }, [cart.length]);

  const validate = () => {
    const e = {};
    if (!selectedAddress) e.address = "Please select a delivery address.";
    if (!mobile.match(/^[6-9]\d{9}$/)) e.mobile = "Enter valid 10-digit number";
    return e;
  };

  const handlePlace = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setPlacing(true);
    try {
      const orderPayload = {
        customerId: user.uid,
        customerName: selectedAddress.name,
        customerPhone: mobile,
        customerEmail: user.email || "",
        address: selectedAddress.address,
        city: selectedAddress.city,
        pincode: selectedAddress.pincode,
        deliveryType: delivery,
        deliveryFee,
        payment,
        subtotal,
        total,
        items: cart.map(i => ({ id: i.id, name: i.name, weight: i.weight, qty: i.qty, price: i.price })),
      };
      const firestoreId = await createOrder(orderPayload);
      await saveCustomer(user.uid, {
        name: selectedAddress.name,
        email: user.email || "",
        phone: mobile,
      });
      logPageView("checkout");
      clearCart();
      setSuccessOrderId(firestoreId);
      setTimeout(() => {
        navigate(`/order-tracking/${firestoreId}`, {
          state: { orderId: firestoreId, delivery, deliveryFee, payment, subtotal, total },
        });
      }, 3000);
    } catch (err) {
      console.error("Order failed:", err);
      alert("Order failed: " + err.message);
      setPlacing(false);
    }
  };

  if (!user) return null;

  // Show success popup
  if (successOrderId) return <OrderSuccessPopup orderId={successOrderId} />;

  const deliveryOptionStyle = (active) => ({
    flex: 1, padding: "14px 10px",
    border: `2px solid ${active ? "var(--brown-dark)" : "var(--border)"}`,
    borderRadius: "var(--radius-md)",
    background: active ? "#f5ede4" : "#fff",
    cursor: "pointer", textAlign: "left",
  });

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span style={s.title}>{t.checkout}</span>
      </div>

      {/* Delivery Address */}
      <div style={s.section}>
        <p style={s.sectionTitle}>Delivery Address</p>
        {addresses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>No saved addresses. Add one to continue.</p>
            <button
              onClick={() => navigate("/saved-addresses", { state: { fromCheckout: true } })}
              style={{ padding: "10px 20px", background: "var(--brown-dark)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer" }}
            >
              + Add Delivery Address
            </button>
          </div>
        ) : (
          <div>
            {addresses.map(addr => (
              <div
                key={addr.id}
                onClick={() => { setSelectedAddress(addr); if (addr.phone) setMobile(addr.phone); }}
                style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)", border: `2px solid ${selectedAddress?.id === addr.id ? "var(--brown-dark)" : "var(--border)"}`, background: selectedAddress?.id === addr.id ? "#f5ede4" : "#fff", marginBottom: 8, cursor: "pointer" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--brown-dark)", textTransform: "uppercase" }}>{addr.label}</span>
                  {selectedAddress?.id === addr.id && <span style={{ fontSize: 11, fontWeight: 700, color: "#2e7d32" }}>Selected</span>}
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginTop: 4 }}>{addr.name}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{addr.address}, {addr.city} — {addr.pincode}</p>
              </div>
            ))}
            {errors.address && <p style={{ fontSize: 11, color: "#e55", marginTop: 4 }}>{errors.address}</p>}
            <button
              onClick={() => navigate("/saved-addresses", { state: { fromCheckout: true } })}
              style={{ marginTop: 8, padding: "8px 16px", background: "var(--cream-2)", color: "var(--brown-dark)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-full)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              + Add New Address
            </button>
          </div>
        )}
      </div>

      {/* Mobile Number */}
      <div style={s.section}>
        <p style={s.sectionTitle}>Contact</p>
        <div>
          <label style={s.label}>{t.mobileNumber}</label>
          <input
            style={{ ...s.input, borderColor: errors.mobile ? "#e55" : "var(--border)" }}
            value={mobile} onChange={e => { setMobile(e.target.value); setErrors(er => ({ ...er, mobile: null })); }}
            placeholder="10-digit mobile number" maxLength={10}
          />
          {errors.mobile && <span style={{ fontSize: "11px", color: "#e55" }}>{errors.mobile}</span>}
        </div>
      </div>

      {/* Delivery Type */}
      <div style={s.section}>
        <p style={s.sectionTitle}>Delivery Type</p>
        <div style={s.row}>
          <button onClick={() => setDelivery("eco")} style={deliveryOptionStyle(delivery === "eco")}>
            <div style={{ fontSize: 13, fontWeight: 700, color: delivery === "eco" ? "var(--brown-dark)" : "var(--text)", marginBottom: 2 }}>Eco Delivery</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Standard speed</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--brown-dark)" }}>₹{Math.round(subtotal * 0.10)}</div>
          </button>
          <button onClick={() => setDelivery("rapid")} style={deliveryOptionStyle(delivery === "rapid")}>
            <div style={{ fontSize: 13, fontWeight: 700, color: delivery === "rapid" ? "var(--brown-dark)" : "var(--text)", marginBottom: 2 }}>Rapid Delivery</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Priority speed</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--brown-dark)" }}>₹{Math.round(subtotal * 0.15)}</div>
          </button>
        </div>
      </div>

      {/* Payment */}
      <div style={s.section}>
        <p style={s.sectionTitle}>{t.paymentMethod}</p>
        <div style={s.row}>
          {[{ key: "cod", label: "Cash on Delivery" }, { key: "online", label: "Online Payment" }].map(opt => (
            <button key={opt.key} onClick={() => setPayment(opt.key)}
              style={{ flex: 1, padding: "12px 10px", border: `1.5px solid ${payment === opt.key ? "var(--brown-dark)" : "var(--border)"}`, borderRadius: "var(--radius-md)", background: payment === opt.key ? "#f5ede4" : "#fff", fontSize: 13, fontWeight: 600, color: payment === opt.key ? "var(--brown-dark)" : "var(--text-muted)", cursor: "pointer" }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div style={s.section}>
        <p style={s.sectionTitle}>{t.orderSummary}</p>
        {cart.map(item => (
          <div key={item.id} style={{ ...s.summaryRow, marginBottom: "6px" }}>
            <span>{item.name} {item.weight} × {item.qty}</span>
            <span style={{ fontWeight: "600", color: "var(--text)" }}>₹{item.price * item.qty}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid var(--border)", marginTop: "10px", paddingTop: "10px" }}>
          <div style={s.summaryRow}>
            <span>Subtotal</span>
            <span style={{ fontWeight: 600, color: "var(--text)" }}>₹{subtotal}</span>
          </div>
          <div style={s.summaryRow}>
            <span>{delivery === "eco" ? "Eco Delivery" : "Rapid Delivery"}</span>
            <span style={{ fontWeight: 600, color: "var(--text)" }}>₹{deliveryFee}</span>
          </div>
          <div style={{ ...s.summaryRow, fontSize: "16px", fontWeight: "700", color: "var(--brown-dark)" }}>
            <span>Total</span>
            <span>₹{total}</span>
          </div>
        </div>
        <button
          style={{ width: "100%", padding: "16px", background: placing ? "var(--brown)" : "var(--brown-dark)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "16px", fontWeight: "700", cursor: placing ? "not-allowed" : "pointer", margin: "14px 0", fontFamily: "var(--font-body)", opacity: placing ? 0.7 : 1 }}
          onClick={handlePlace} disabled={placing}
        >
          {placing ? "Placing Order..." : `Place Order · ₹${total}`}
        </button>
      </div>
    </div>
  );
}
