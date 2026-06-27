import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../home/Home.css";
import { useLang } from "../LanguageContext";
import { useCart } from "../CartContext";
import { createOrder, saveCustomer, logPageView, getUserAddresses } from "../services/firestore";
import { useAuth } from "../auth/AuthContext";

// ── Replace with your Razorpay Key ID from razorpay.com/dashboard → API Keys ──
// Use rzp_test_... for testing, rzp_live_... for production
const RAZORPAY_KEY_ID = "rzp_test_YOUR_KEY_HERE";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

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

function OrderSuccessPopup({ orderId, paid }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @keyframes scaleIn { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes checkDraw { from{stroke-dashoffset:100} to{stroke-dashoffset:0} }
        @keyframes ripple { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.2);opacity:0} }
        @keyframes slideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>
      <div style={{ background: "#fff", borderRadius: 24, padding: "44px 32px 36px", textAlign: "center", width: "85%", maxWidth: 320, animation: "slideUp 0.4s ease-out" }}>
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
        {paid && (
          <div style={{ background: "#e8f5e9", borderRadius: 8, padding: "6px 12px", display: "inline-block", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2e7d32" }}>✓ Payment Received</span>
          </div>
        )}
        <p style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Your order has been placed successfully.</p>
        <p style={{ fontSize: 12, color: "#aaa" }}>Order #{orderId?.slice(-8).toUpperCase()}</p>
        <div style={{ marginTop: 20, height: 3, background: "#e8f5e9", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "#4caf50", borderRadius: 2, width: "100%" }} />
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
  const [paidOnline, setPaidOnline] = useState(false);

  const deliveryFee = delivery === "eco" ? Math.round(subtotal * 0.10) : Math.round(subtotal * 0.15);
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (!user) navigate("/login", { state: { from: "/checkout" } });
  }, [user]);

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

  useEffect(() => {
    if (location.state?.selectedAddress) setSelectedAddress(location.state.selectedAddress);
  }, [location.state]);

  useEffect(() => {
    if (cart.length === 0 && !successOrderId) navigate("/");
  }, [cart.length]);

  // Pre-load Razorpay script when user selects Online Payment
  useEffect(() => {
    if (payment === "online") loadRazorpayScript();
  }, [payment]);

  const validate = () => {
    const e = {};
    if (!selectedAddress) e.address = "Please select a delivery address.";
    if (!mobile.match(/^[6-9]\d{9}$/)) e.mobile = "Enter valid 10-digit number";
    return e;
  };

  // ── Save order to Firestore ────────────────────────────────────────────────
  const finaliseOrder = async ({ paymentId = null, paymentStatus = "pending" } = {}) => {
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
      paymentStatus,   // "pending" for COD, "paid" for online
      paymentId,       // Razorpay payment ID (null for COD)
      subtotal,
      total,
      items: cart.map(i => ({ id: i.id, name: i.name, weight: i.weight, qty: i.qty, price: i.price })),
    };
    const firestoreId = await createOrder(orderPayload);
    await saveCustomer(user.uid, { name: selectedAddress.name, email: user.email || "", phone: mobile });
    logPageView("checkout");
    clearCart();
    return firestoreId;
  };

  // ── Online: open Razorpay checkout modal ───────────────────────────────────
  const openRazorpay = async () => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert("Could not load payment gateway. Check your internet connection.");
      setPlacing(false);
      return;
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: total * 100,           // Razorpay expects paise
      currency: "INR",
      name: "Root Grains",
      description: `Order — ${cart.length} item(s)`,
      image: "/logo.png",
      prefill: {
        name: selectedAddress?.name || "",
        contact: "+91" + mobile,
        email: user?.email || "",
      },
      notes: {
        address: selectedAddress?.address || "",
        delivery: delivery,
      },
      theme: { color: "#3b1f0e" },

      // ── Payment success handler ────────────────────────────────────────────
      handler: async function (response) {
        try {
          const orderId = await finaliseOrder({
            paymentId: response.razorpay_payment_id,
            paymentStatus: "paid",
          });
          setPaidOnline(true);
          setSuccessOrderId(orderId);
          setTimeout(() => {
            navigate(`/order-tracking/${orderId}`, {
              state: { orderId, delivery, deliveryFee, payment, subtotal, total, from: "checkout" },
            });
          }, 3000);
        } catch (err) {
          alert(
            "Payment succeeded but order could not be saved.\n" +
            "Payment ID: " + response.razorpay_payment_id + "\n" +
            "Please contact support with this ID."
          );
          setPlacing(false);
        }
      },

      modal: {
        ondismiss: () => setPlacing(false),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => {
      alert("Payment failed: " + (response.error?.description || "Please try again."));
      setPlacing(false);
    });
    rzp.open();
  };

  // ── Place order handler ────────────────────────────────────────────────────
  const handlePlace = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setPlacing(true);

    if (payment === "online") {
      await openRazorpay(); // finaliseOrder called inside handler on success
      return;
    }

    // COD flow
    try {
      const orderId = await finaliseOrder({ paymentStatus: "pending" });
      setSuccessOrderId(orderId);
      setTimeout(() => {
        navigate(`/order-tracking/${orderId}`, {
          state: { orderId, delivery, deliveryFee, payment, subtotal, total, from: "checkout" },
        });
      }, 3000);
    } catch (err) {
      alert("Order failed: " + err.message);
      setPlacing(false);
    }
  };

  if (!user) return null;
  if (successOrderId) return <OrderSuccessPopup orderId={successOrderId} paid={paidOnline} />;

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
            <button onClick={() => navigate("/saved-addresses", { state: { fromCheckout: true } })}
              style={{ padding: "10px 20px", background: "var(--brown-dark)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer" }}>
              + Add Delivery Address
            </button>
          </div>
        ) : (
          <div>
            {addresses.map(addr => (
              <div key={addr.id} onClick={() => { setSelectedAddress(addr); if (addr.phone) setMobile(addr.phone); }}
                style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)", border: `2px solid ${selectedAddress?.id === addr.id ? "var(--brown-dark)" : "var(--border)"}`, background: selectedAddress?.id === addr.id ? "#f5ede4" : "#fff", marginBottom: 8, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--brown-dark)", textTransform: "uppercase" }}>{addr.label}</span>
                  {selectedAddress?.id === addr.id && <span style={{ fontSize: 11, fontWeight: 700, color: "#2e7d32" }}>Selected</span>}
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginTop: 4 }}>{addr.name}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{addr.address}, {addr.city} — {addr.pincode}</p>
              </div>
            ))}
            {errors.address && <p style={{ fontSize: 11, color: "#e55", marginTop: 4 }}>{errors.address}</p>}
            <button onClick={() => navigate("/saved-addresses", { state: { fromCheckout: true } })}
              style={{ marginTop: 8, padding: "8px 16px", background: "var(--cream-2)", color: "var(--brown-dark)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-full)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              + Add New Address
            </button>
          </div>
        )}
      </div>

      {/* Contact */}
      <div style={s.section}>
        <p style={s.sectionTitle}>Contact</p>
        <label style={s.label}>{t.mobileNumber}</label>
        <input style={{ ...s.input, borderColor: errors.mobile ? "#e55" : "var(--border)" }}
          value={mobile} onChange={e => { setMobile(e.target.value); setErrors(er => ({ ...er, mobile: null })); }}
          placeholder="10-digit mobile number" maxLength={10} />
        {errors.mobile && <span style={{ fontSize: "11px", color: "#e55" }}>{errors.mobile}</span>}
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

      {/* Payment Method */}
      <div style={s.section}>
        <p style={s.sectionTitle}>{t.paymentMethod}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* COD */}
          <button onClick={() => setPayment("cod")}
            style={{ padding: "14px", border: `2px solid ${payment === "cod" ? "var(--brown-dark)" : "var(--border)"}`, borderRadius: "var(--radius-md)", background: payment === "cod" ? "#f5ede4" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
            <span style={{ fontSize: 22 }}>💵</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: payment === "cod" ? "var(--brown-dark)" : "var(--text)" }}>Cash on Delivery</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Pay when your order arrives</div>
            </div>
            {payment === "cod" && <span style={{ marginLeft: "auto", color: "#2e7d32", fontWeight: 800, fontSize: 16 }}>✓</span>}
          </button>

          {/* Online Payment */}
          <button onClick={() => setPayment("online")}
            style={{ padding: "14px", border: `2px solid ${payment === "online" ? "var(--brown-dark)" : "var(--border)"}`, borderRadius: "var(--radius-md)", background: payment === "online" ? "#f5ede4" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
            <span style={{ fontSize: 22 }}>📱</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: payment === "online" ? "var(--brown-dark)" : "var(--text)" }}>Online Payment</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>UPI · PhonePe · GPay · Cards · Netbanking</div>
            </div>
            {payment === "online" && <span style={{ marginLeft: "auto", color: "#2e7d32", fontWeight: 800, fontSize: 16 }}>✓</span>}
          </button>
        </div>

        {payment === "online" && (
          <div style={{ marginTop: 10, padding: "10px 12px", background: "#e8f5e9", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>🔒</span>
            <span style={{ fontSize: 11, color: "#2e7d32", fontWeight: 600 }}>Secured by Razorpay · 256-bit encryption</span>
          </div>
        )}
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
          style={{ width: "100%", padding: "16px", background: placing ? "var(--brown)" : "var(--brown-dark)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "16px", fontWeight: "700", cursor: placing ? "not-allowed" : "pointer", margin: "14px 0 0", fontFamily: "var(--font-body)", opacity: placing ? 0.7 : 1 }}
          onClick={handlePlace} disabled={placing}>
          {placing
            ? (payment === "online" ? "Opening Payment..." : "Placing Order...")
            : payment === "online"
              ? `Pay ₹${total} →`
              : `Place Order · ₹${total}`}
        </button>
      </div>
    </div>
  );
}
