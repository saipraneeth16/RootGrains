import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../home/Home.css";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const STATUS_STEPS = ["pending", "confirmed", "dispatched", "delivered"];

const STEP_META = {
  pending:    { icon: "1", label: "Order Placed",    desc: "We've received your order" },
  confirmed:  { icon: "2", label: "Confirmed",        desc: "Your order is confirmed" },
  dispatched: { icon: "3", label: "Out for Delivery", desc: "Your order is on the way" },
  delivered:  { icon: "✓", label: "Delivered",        desc: "Order delivered successfully" },
};

const STATUS_COLORS = {
  pending:    { bg: "#fff8e1", color: "#f57f17", label: "Pending" },
  confirmed:  { bg: "#e3f2fd", color: "#1565c0", label: "Confirmed" },
  dispatched: { bg: "#f3e5f5", color: "#6a1b9a", label: "Out for Delivery" },
  delivered:  { bg: "#e8f5e9", color: "#2e7d32", label: "Delivered" },
  cancelled:  { bg: "#ffebee", color: "#c62828", label: "Cancelled" },
};

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);

  // Subscribe to real-time order status from Firestore
  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(doc(db, "orders", orderId), snap => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [orderId]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#aaa" }}>
      <div style={{ width: 40, height: 40, border: "3px solid #e0d8d0", borderTop: "3px solid #3b1f0e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize: 13 }}>Loading order...</span>
    </div>
  );

  if (!order) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 48 }}>📦</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#3b1f0e" }}>Order not found</div>
      <button onClick={() => navigate("/")} style={{ padding: "10px 24px", background: "#3b1f0e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Go Home</button>
    </div>
  );

  const status = order.status || "pending";
  const sc = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const activeIdx = STATUS_STEPS.indexOf(status);
  const isCancelled = status === "cancelled";
  const createdAt = order.createdAt?.toDate?.() || new Date();

  return (
    <div style={{ fontFamily: "var(--font-body)", background: "var(--cream)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#fff", position: "sticky", top: 0, zIndex: 100, boxShadow: "var(--shadow-sm)", borderBottom: "1px solid var(--border)" }}>
        <button className="back-btn" onClick={() => navigate("/profile")}>←</button>
        <span style={{ fontSize: "17px", fontWeight: "700", color: "var(--brown-dark)", fontFamily: "var(--font-display)" }}>Order Details</span>
      </div>

      {/* Order placed success card */}
      <div style={{ background: isCancelled ? "#c62828" : "#2e7d32", margin: "14px", borderRadius: "16px", padding: "20px 18px", color: "#fff" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{isCancelled ? "✕" : "✓"}</div>
        <p style={{ fontSize: "18px", fontWeight: "800", marginBottom: "4px", fontFamily: "var(--font-display)" }}>
          {isCancelled ? "Order Cancelled" : "Order Placed Successfully!"}
        </p>
        <p style={{ fontSize: "13px", opacity: 0.85 }}>
          {isCancelled ? "This order has been cancelled." : "We've received your order and will confirm it shortly."}
        </p>
        <div style={{ display: "flex", gap: "20px", marginTop: "16px", flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: "10px", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.5px" }}>Order ID</p>
            <p style={{ fontSize: "12px", fontWeight: "700" }}>#{orderId?.slice(-8).toUpperCase()}</p>
          </div>
          <div>
            <p style={{ fontSize: "10px", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.5px" }}>Date</p>
            <p style={{ fontSize: "12px", fontWeight: "700" }}>{createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
          </div>
          <div>
            <p style={{ fontSize: "10px", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</p>
            <span style={{ fontSize: "11px", fontWeight: "700", background: "rgba(255,255,255,0.25)", padding: "2px 8px", borderRadius: "20px" }}>{sc.label}</span>
          </div>
        </div>
      </div>

      {/* Status timeline */}
      {!isCancelled && (
        <div style={{ background: "#fff", margin: "0 14px 14px", borderRadius: "14px", padding: "18px 16px", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: "12px", fontWeight: "800", color: "var(--brown-dark)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "18px" }}>Delivery Status</p>
          {STATUS_STEPS.map((step, i) => {
            const meta = STEP_META[step];
            const done = i <= activeIdx;
            const current = i === activeIdx;
            return (
              <div key={step} style={{ display: "flex", gap: "14px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "50%",
                    background: done ? (current ? "#2e7d32" : "#81c784") : "#f0ece8",
                    border: `2px solid ${done ? "#2e7d32" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "16px", flexShrink: 0,
                  }}>
                    {done ? (current ? meta.icon : "✓") : meta.icon}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div style={{ width: "2px", height: "32px", background: i < activeIdx ? "#81c784" : "var(--border)", margin: "2px 0" }} />
                  )}
                </div>
                <div style={{ paddingTop: "6px", paddingBottom: "12px" }}>
                  <p style={{ fontSize: "14px", fontWeight: current ? "800" : "600", color: done ? "var(--brown-dark)" : "var(--text-faint)" }}>{meta.label}</p>
                  <p style={{ fontSize: "11px", color: done ? "#2e7d32" : "var(--text-faint)", marginTop: "2px" }}>{meta.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delivery info */}
      <div style={{ background: "#fff", margin: "0 14px 14px", borderRadius: "14px", padding: "16px", border: "1px solid var(--border)" }}>
        <p style={{ fontSize: "12px", fontWeight: "800", color: "var(--brown-dark)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>Delivery Info</p>
        <p style={{ fontSize: "13px", color: "var(--text)", marginBottom: "4px" }}>{order.address}, {order.city} - {order.pincode}</p>
        <p style={{ fontSize: "13px", color: "var(--text)", marginBottom: "4px" }}>
          {order.deliveryType === "rapid" ? "Rapid Delivery" : "Eco Delivery"}
        </p>
        <p style={{ fontSize: "13px", color: "var(--text)" }}>{order.payment === "cod" ? "Cash on Delivery" : "Online Payment"}</p>
      </div>

      {/* Order items */}
      {order.items && order.items.length > 0 && (
        <div style={{ background: "#fff", margin: "0 14px 14px", borderRadius: "14px", padding: "16px", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: "12px", fontWeight: "800", color: "var(--brown-dark)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "12px" }}>Order Summary</p>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>
              <span>{item.name} {item.weight} × {item.qty}</span>
              <span style={{ fontWeight: "600", color: "var(--text)" }}>₹{item.price * item.qty}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--border)", marginTop: "10px", paddingTop: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
              <span>Subtotal</span>
              <span>₹{order.subtotal || order.total}</span>
            </div>
            {order.deliveryFee !== undefined && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
                <span>{order.deliveryType === "rapid" ? "⚡ Rapid Delivery" : "🌿 Eco Delivery"}</span>
                <span>₹{order.deliveryFee}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "700", color: "var(--brown-dark)", marginTop: "6px" }}>
              <span>Total</span>
              <span>₹{order.total}</span>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp */}
      <div style={{ margin: "0 14px 14px" }}>
        <a href="https://wa.me/919999999999?text=Hi, I need help with my order" target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", background: "#e8f5e9", borderRadius: "14px", border: "1px solid #c8e6c9", textDecoration: "none" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
          <div>
            <p style={{ fontSize: "13px", fontWeight: "700", color: "#1b5e20" }}>Chat on WhatsApp</p>
            <p style={{ fontSize: "11px", color: "#4caf50" }}>For order queries & support</p>
          </div>
        </a>
      </div>

      <div style={{ padding: "0 14px 30px" }}>
        <button onClick={() => navigate("/")} style={{ width: "100%", padding: "14px", background: "var(--brown-dark)", color: "#fff", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "var(--font-body)" }}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
