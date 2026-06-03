import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../home/Home.css";
import { useLang } from "../LanguageContext";
import { useCart } from "../CartContext";
import { createOrder, saveCustomer, logPageView } from "../services/firestore";
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
  payBtn: (active) => ({ flex: 1, padding: "12px 10px", border: `1.5px solid ${active ? "var(--olive)" : "var(--border)"}`, borderRadius: "var(--radius-md)", background: active ? "#f0f5e0" : "#fff", fontSize: "13px", fontWeight: "600", color: active ? "var(--olive)" : "var(--text-muted)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }),
  summaryRow: { display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" },
  placeBtn: { width: "100%", padding: "16px", background: "var(--brown-dark)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "16px", fontWeight: "700", cursor: "pointer", margin: "14px 0", fontFamily: "var(--font-body)" },
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: user?.displayName || "",
    mobile: "",
    address: "",
    city: "Visakhapatnam",
    pincode: "",
  });
  const [delivery, setDelivery] = useState("eco");
  const [payment, setPayment] = useState("cod");
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Redirect to login if not signed in
  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
    }
  }, [user]);

  useEffect(() => {
    if (cart.length === 0) navigate("/");
  }, [cart.length]);

  const deliveryFee = delivery === "eco"
    ? Math.round(subtotal * 0.10)
    : Math.round(subtotal * 0.15);
  const total = subtotal + deliveryFee;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.mobile.match(/^[6-9]\d{9}$/)) e.mobile = "Enter valid 10-digit number";
    if (!form.address.trim()) e.address = "Required";
    if (!form.pincode.match(/^\d{6}$/)) e.pincode = "Enter valid 6-digit pincode";
    return e;
  };

  const handlePlace = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setPlacing(true);
    try {
      const orderPayload = {
        customerId: user?.uid || "guest",
        customerName: form.name,
        customerPhone: form.mobile,
        customerEmail: user?.email || "",
        address: form.address,
        city: form.city,
        pincode: form.pincode,
        deliveryType: delivery,
        deliveryFee,
        payment,
        subtotal,
        total,
        items: cart.map(i => ({ id: i.id, name: i.name, weight: i.weight, qty: i.qty, price: i.price })),
      };
      const firestoreId = await createOrder(orderPayload);
      await saveCustomer(user?.uid || form.mobile, {
        name: form.name,
        email: user?.email || "",
        phone: form.mobile,
        address: form.address,
        city: form.city,
        pincode: form.pincode,
      });
      logPageView("checkout");
      clearCart();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate(`/order-tracking/${firestoreId}`, {
          state: { orderId: firestoreId, form, delivery, deliveryFee, payment, subtotal, total, items: cart },
        });
      }, 2500);
    } catch (err) {
      console.error("Order failed:", err);
      alert("Order failed: " + err.message);
      setPlacing(false);
    }
  };

  const inp = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: null }));
  };

  if (!user) return null;

  // Celebration popup
  if (showSuccess) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <style>{`
        @keyframes popIn { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes confettiFall { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(120px) rotate(720deg);opacity:0} }
        .confetti-piece { position:absolute; width:10px; height:10px; border-radius:2px; animation:confettiFall 1.8s ease-in forwards; }
      `}</style>
      {/* Confetti */}
      {["#f5c518","#3b1f0e","#5a8a3c","#e65100","#1565c0","#6a1b9a","#c62828","#f57f17"].map((color, i) => (
        <div key={i} className="confetti-piece" style={{ background: color, left: `${10 + i * 11}%`, top: "10%", animationDelay: `${i * 0.15}s` }} />
      ))}
      {[..."🎉🌾✨🎊💚"].map((e, i) => (
        <div key={"e"+i} className="confetti-piece" style={{ fontSize: 16, background: "transparent", left: `${5 + i * 18}%`, top: "15%", animationDelay: `${0.3 + i * 0.2}s` }}>{e}</div>
      ))}
      {/* Card */}
      <div style={{ background: "#fff", borderRadius: 24, padding: "40px 32px", textAlign: "center", animation: "popIn 0.5s ease-out", maxWidth: 300, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#2e7d32", fontFamily: "var(--font-display)", marginBottom: 8 }}>Order Placed!</h2>
        <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>Your order has been placed successfully. We'll confirm it shortly!</p>
        <div style={{ marginTop: 20, padding: "10px 16px", background: "#f1f8e9", borderRadius: 10 }}>
          <p style={{ fontSize: 12, color: "#33691e", fontWeight: 600 }}>Taking you to order tracking...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span style={s.title}>{t.checkout}</span>
      </div>

      {/* Delivery Details */}
      <div style={s.section}>
        <p style={s.sectionTitle}>{t.deliveryDetails}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={s.label}>{t.fullName}</label>
            <input style={{ ...s.input, borderColor: errors.name ? "#e55" : "var(--border)" }} value={form.name} onChange={inp("name")} placeholder="Enter your full name" />
            {errors.name && <span style={{ fontSize: "11px", color: "#e55" }}>{errors.name}</span>}
          </div>
          <div>
            <label style={s.label}>{t.mobileNumber}</label>
            <input style={{ ...s.input, borderColor: errors.mobile ? "#e55" : "var(--border)" }} value={form.mobile} onChange={inp("mobile")} placeholder="10-digit mobile number" maxLength={10} />
            {errors.mobile && <span style={{ fontSize: "11px", color: "#e55" }}>{errors.mobile}</span>}
          </div>
          <div>
            <label style={s.label}>{t.address}</label>
            <textarea style={{ ...s.input, height: "70px", resize: "none", borderColor: errors.address ? "#e55" : "var(--border)" }} value={form.address} onChange={inp("address")} placeholder="House no., Street, Area" />
            {errors.address && <span style={{ fontSize: "11px", color: "#e55" }}>{errors.address}</span>}
          </div>
          <div style={s.row}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>{t.city}</label>
              <input style={{ ...s.input, background: "var(--cream-3)", color: "var(--text-muted)" }} value={form.city} readOnly />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>{t.pincode}</label>
              <input style={{ ...s.input, borderColor: errors.pincode ? "#e55" : "var(--border)" }} value={form.pincode} onChange={inp("pincode")} placeholder="530001" maxLength={6} />
              {errors.pincode && <span style={{ fontSize: "11px", color: "#e55" }}>{errors.pincode}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Type */}
      <div style={s.section}>
        <p style={s.sectionTitle}>Delivery Type</p>
        <div style={s.row}>
          <button
            onClick={() => setDelivery("eco")}
            style={{ flex: 1, padding: "14px 10px", border: `2px solid ${delivery === "eco" ? "#2e7d32" : "var(--border)"}`, borderRadius: "var(--radius-md)", background: delivery === "eco" ? "#f1f8e9" : "#fff", cursor: "pointer", textAlign: "left" }}
          >
            <div style={{ fontSize: "22px", marginBottom: "4px" }}>🌿</div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: delivery === "eco" ? "#2e7d32" : "var(--text)" }}>Eco Delivery</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Standard speed</div>
            <div style={{ fontSize: "13px", fontWeight: "800", color: "#2e7d32", marginTop: "4px" }}>₹{Math.round(subtotal * 0.10)} (10%)</div>
          </button>
          <button
            onClick={() => setDelivery("rapid")}
            style={{ flex: 1, padding: "14px 10px", border: `2px solid ${delivery === "rapid" ? "#e65100" : "var(--border)"}`, borderRadius: "var(--radius-md)", background: delivery === "rapid" ? "#fff3e0" : "#fff", cursor: "pointer", textAlign: "left" }}
          >
            <div style={{ fontSize: "22px", marginBottom: "4px" }}>⚡</div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: delivery === "rapid" ? "#e65100" : "var(--text)" }}>Rapid Delivery</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Priority speed</div>
            <div style={{ fontSize: "13px", fontWeight: "800", color: "#e65100", marginTop: "4px" }}>₹{Math.round(subtotal * 0.15)} (15%)</div>
          </button>
        </div>
      </div>

      {/* Payment */}
      <div style={s.section}>
        <p style={s.sectionTitle}>{t.paymentMethod}</p>
        <div style={s.row}>
          <button style={s.payBtn(payment === "cod")} onClick={() => setPayment("cod")}>
            <span style={{ fontSize: "22px" }}>💵</span>
            <span>{t.cod}</span>
          </button>
          <button style={s.payBtn(payment === "online")} onClick={() => setPayment("online")}>
            <span style={{ fontSize: "22px" }}>📱</span>
            <span>{t.online}</span>
          </button>
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
            <span style={{ fontWeight: "600", color: "var(--text)" }}>₹{subtotal}</span>
          </div>
          <div style={s.summaryRow}>
            <span>{delivery === "eco" ? "🌿 Eco Delivery (10%)" : "⚡ Rapid Delivery (15%)"}</span>
            <span style={{ fontWeight: "600", color: "var(--text)" }}>₹{deliveryFee}</span>
          </div>
          <div style={{ ...s.summaryRow, fontSize: "16px", fontWeight: "700", color: "var(--brown-dark)" }}>
            <span>{t.toPay}</span>
            <span>₹{total}</span>
          </div>
        </div>
        <button
          style={{ ...s.placeBtn, opacity: placing ? 0.7 : 1, cursor: placing ? "not-allowed" : "pointer" }}
          onClick={handlePlace}
          disabled={placing}
        >
          {placing ? "Placing Order..." : `${t.placeOrder} · ₹${total}`}
        </button>
      </div>
    </div>
  );
}
