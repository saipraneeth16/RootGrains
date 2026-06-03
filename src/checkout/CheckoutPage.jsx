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
  input: { width: "100%", padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "14px", color: "var(--text)", background: "var(--cream-2)", outline: "none", fontFamily: "var(--font-body)" },
  row: { display: "flex", gap: "10px" },
  slotBtn: (active) => ({ flex: 1, padding: "10px 8px", border: `1.5px solid ${active ? "var(--gold)" : "var(--border)"}`, borderRadius: "var(--radius-sm)", background: active ? "var(--gold-pale)" : "#fff", fontSize: "11px", fontWeight: "600", color: active ? "var(--brown-dark)" : "var(--text-muted)", cursor: "pointer", textAlign: "center" }),
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
  const [slot, setSlot] = useState("morning");
  const [payment, setPayment] = useState("cod");
  const [errors, setErrors] = useState({});

  const slots = [
    { key: "morning", label: t.morning },
    { key: "afternoon", label: t.afternoon },
    { key: "evening", label: t.evening },
  ];

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.mobile.match(/^[6-9]\d{9}$/)) e.mobile = "Enter valid 10-digit number";
    if (!form.address.trim()) e.address = "Required";
    if (!form.pincode.match(/^\d{6}$/)) e.pincode = "Enter valid 6-digit pincode";
    return e;
  };

  const [placing, setPlacing] = useState(false);

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
        payment,
        total: subtotal,
        items: cart.map(i => ({ id: i.id, name: i.name, weight: i.weight, qty: i.qty, price: i.price })),
      };
      const firestoreId = await createOrder(orderPayload);
      // Save/update customer record linked to Firebase uid
      const customerId = user?.uid || form.mobile;
      await saveCustomer(customerId, {
        name: form.name,
        email: user?.email || "",
        phone: form.mobile,
        address: form.address,
        city: form.city,
        pincode: form.pincode,
      });
      logPageView("checkout");
      clearCart();
      navigate(`/order-tracking/${firestoreId}`, { state: { orderId: firestoreId, form, slot, payment, subtotal, items: cart } });
    } catch (err) {
      console.error("Order failed:", err);
      setPlacing(false);
    }
  };

  const inp = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: null }));
  };

  useEffect(() => {
    if (cart.length === 0) navigate("/");
  }, [cart.length]);

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
            <span>{t.deliveryFee}</span>
            <span style={{ color: "var(--olive)", fontWeight: "700" }}>{t.free}</span>
          </div>
          <div style={{ ...s.summaryRow, fontSize: "16px", fontWeight: "700", color: "var(--brown-dark)" }}>
            <span>{t.toPay}</span>
            <span>₹{subtotal}</span>
          </div>
        </div>
        <button style={{ ...s.placeBtn, opacity: placing ? 0.7 : 1, cursor: placing ? "not-allowed" : "pointer" }} onClick={handlePlace} disabled={placing}>{placing ? "Placing Order..." : `${t.placeOrder} · ₹${subtotal}`}</button>
      </div>
    </div>
  );
}
