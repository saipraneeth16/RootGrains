import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../home/Home.css";
import { useLang } from "../LanguageContext";
import { useAuth } from "../auth/AuthContext";
import { getUserOrders } from "../services/firestore";
import BottomNav from "../home/BottomNav";

const statusColors = {
  pending:    { bg: "#fff8e1", color: "#f57f17" },
  confirmed:  { bg: "#e3f2fd", color: "#1565c0" },
  dispatched: { bg: "#f3e5f5", color: "#6a1b9a" },
  delivered:  { bg: "#e8f5e9", color: "#2e7d32" },
  cancelled:  { bg: "#ffebee", color: "#c62828" },
};

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", cursor: "pointer", borderBottom: "1px solid var(--cream-3)" }}>
      {icon && <span style={{ fontSize: "16px", width: "24px", textAlign: "center", color: danger ? "#c0392b" : "var(--brown-dark)", fontWeight: 700 }}>{icon}</span>}
      <span style={{ flex: 1, fontSize: "14px", fontWeight: "500", color: danger ? "#c0392b" : "var(--text)" }}>{label}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  );
}

export default function ProfilePage() {
  const { t, lang, toggleLang } = useLang();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user) {
      getUserOrders(user.uid).then(setOrders).catch(() => {});
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="mobile">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#fff", position: "sticky", top: 0, zIndex: 100, boxShadow: "var(--shadow-sm)", borderBottom: "1px solid var(--border)" }}>
        <button className="back-btn" onClick={() => navigate("/")}>←</button>
        <span style={{ fontSize: "17px", fontWeight: "700", color: "var(--brown-dark)", fontFamily: "var(--font-display)" }}>{t.myProfile}</span>
      </div>

      {/* Profile card */}
      <div style={{ background: "var(--brown-dark)", padding: "24px 16px", display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 800, color: "var(--brown-dark)", flexShrink: 0 }}>{user ? (user.displayName?.[0] || user.email?.[0] || "U").toUpperCase() : "G"}</div>
        <div>
          {user ? (
            <>
              <p style={{ fontSize: "17px", fontWeight: "700", color: "#fff", marginBottom: "2px", fontFamily: "var(--font-display)" }}>{user.displayName || "User"}</p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>{user.email}</p>
            </>
          ) : (
            <>
              <p style={{ fontSize: "17px", fontWeight: "700", color: "#fff", marginBottom: "4px", fontFamily: "var(--font-display)" }}>Guest User</p>
              <button onClick={() => navigate("/login")} style={{ padding: "6px 14px", background: "var(--gold)", color: "var(--brown-dark)", border: "none", borderRadius: "var(--radius-full)", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                Login / Sign Up
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", background: "var(--cream-2)", borderBottom: "1px solid var(--border)" }}>
        {[
          { label: "Orders", value: orders.length },
          { label: "Delivered", value: orders.filter(o => o.status === "delivered").length },
          { label: "Pending", value: orders.filter(o => ["pending","confirmed","dispatched"].includes(o.status)).length },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", padding: "14px 0", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
            <p style={{ fontSize: "20px", fontWeight: "700", color: "var(--brown-dark)", fontFamily: "var(--font-display)" }}>{s.value}</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* My Orders */}
      <div style={{ background: "#fff", marginTop: "10px" }}>
        <p style={{ fontSize: "12px", fontWeight: "800", color: "var(--brown-dark)", textTransform: "uppercase", letterSpacing: "0.8px", padding: "14px 16px 10px" }}>{t.myOrders}</p>
        {orders.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--text-faint)", padding: "0 16px 16px" }}>
            {user ? "No orders yet. Start shopping!" : "Log in to see your orders."}
          </p>
        ) : (
          orders.slice(0, 5).map(order => {
            const sc = statusColors[order.status] || statusColors.pending;
            const createdAt = order.createdAt?.toDate?.() || new Date();
            return (
              <div key={order.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--cream-3)", cursor: "pointer" }}
                onClick={() => navigate(`/order-tracking/${order.id}`)}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--brown-dark)" }}>#{order.id.slice(-8).toUpperCase()}</span>
                  <span style={{ fontSize: "11px", padding: "2px 8px", background: sc.bg, color: sc.color, borderRadius: "var(--radius-full)", fontWeight: "600", textTransform: "capitalize" }}>{order.status}</span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "3px" }}>
                  {order.items?.map(i => `${i.name} ${i.weight} ×${i.qty}`).join(", ")}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>{createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--brown-dark)" }}>₹{order.total}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Menu */}
      <div style={{ background: "#fff", marginTop: "10px" }}>
        <MenuItem label={t.savedAddresses} onClick={() => navigate("/saved-addresses")} />
        <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", cursor: "pointer", borderBottom: "1px solid var(--cream-3)" }} onClick={toggleLang}>
          <span style={{ fontSize: "13px", width: "24px", textAlign: "center", fontWeight: 800, color: "var(--brown-dark)" }}></span>
          <span style={{ flex: 1, fontSize: "14px", fontWeight: "500", color: "var(--text)" }}>{t.language}</span>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--gold)", background: "var(--gold-pale)", padding: "3px 10px", borderRadius: "var(--radius-full)" }}>
            {lang === "EN" ? "English" : "తెలుగు"}
          </span>
        </div>
        <MenuItem label={t.notifications} onClick={() => navigate("/notifications")} />
        <MenuItem icon="?" label={t.helpSupport} onClick={() => window.open("https://wa.me/919999999999?text=Hi, I need help with my Root Grains order", "_blank")} />
        {user && <MenuItem icon="←" label="Log Out" onClick={handleLogout} danger />}
      </div>

      {/* WhatsApp */}
      <div style={{ margin: "10px 14px" }}>
        <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", background: "#e8f5e9", borderRadius: "var(--radius-md)", border: "1px solid #c8e6c9", textDecoration: "none" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
          <div>
            <p style={{ fontSize: "13px", fontWeight: "700", color: "#1b5e20" }}>{t.whatsapp}</p>
            <p style={{ fontSize: "11px", color: "#4caf50" }}>Mon–Sat, 9 AM – 8 PM</p>
          </div>
        </a>
      </div>

      <p style={{ textAlign: "center", fontSize: "11px", color: "var(--text-faint)", padding: "16px 0 8px" }}>Root Grains v1.0 · Visakhapatnam</p>
      <BottomNav />
    </div>
  );
}
