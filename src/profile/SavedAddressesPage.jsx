import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../home/Home.css";
import { useAuth } from "../auth/AuthContext";
import { getUserAddresses, saveUserAddress, deleteUserAddress } from "../services/firestore";

export default function SavedAddressesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: "Home", name: "", address: "", city: "Visakhapatnam", pincode: "", phone: "" });

  // If coming from checkout, we'll redirect back after selecting
  const fromCheckout = location.state?.fromCheckout;

  useEffect(() => {
    if (user) {
      getUserAddresses(user.uid).then(a => { setAddresses(a); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [user]);

  const inp = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleAdd = async () => {
    if (!form.name || !form.address || !form.pincode) return alert("Please fill name, address and pincode.");
    setSaving(true);
    const updated = await saveUserAddress(user.uid, form);
    setAddresses(updated);
    setShowForm(false);
    setForm({ label: "Home", name: "", address: "", city: "Visakhapatnam", pincode: "", phone: "" });
    setSaving(false);
    // If came from checkout, go back with the new address selected
    if (fromCheckout) {
      navigate("/checkout", { state: { selectedAddress: updated[updated.length - 1] } });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    const updated = await deleteUserAddress(user.uid, id);
    setAddresses(updated);
  };

  const handleSelect = (addr) => {
    if (fromCheckout) {
      navigate("/checkout", { state: { selectedAddress: addr } });
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", border: "1.5px solid var(--border)",
    borderRadius: "var(--radius-sm)", fontSize: "14px", color: "var(--text)",
    background: "var(--cream-2)", outline: "none", fontFamily: "var(--font-body)", boxSizing: "border-box",
  };
  const labelStyle = { fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", display: "block" };

  return (
    <div style={{ fontFamily: "var(--font-body)", background: "var(--cream)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#fff", position: "sticky", top: 0, zIndex: 100, boxShadow: "var(--shadow-sm)", borderBottom: "1px solid var(--border)" }}>
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span style={{ fontSize: "17px", fontWeight: "700", color: "var(--brown-dark)", fontFamily: "var(--font-display)", flex: 1 }}>
          {fromCheckout ? "Select Delivery Address" : "Saved Addresses"}
        </span>
        <button onClick={() => setShowForm(true)} style={{ padding: "6px 14px", background: "var(--brown-dark)", color: "#fff", border: "none", borderRadius: "var(--radius-full)", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
          + Add
        </button>
      </div>

      {fromCheckout && (
        <div style={{ background: "#f0f4ff", padding: "10px 14px", fontSize: "13px", color: "#1565c0", fontWeight: "600" }}>
          Select an address to deliver to
        </div>
      )}

      <div style={{ padding: "14px 14px 30px" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>Loading...</p>
        ) : addresses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px", color: "#ccc" }}>—</div>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: 16 }}>No saved addresses yet.</p>
            <button onClick={() => setShowForm(true)} style={{ padding: "10px 24px", background: "var(--brown-dark)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer" }}>
              Add Address
            </button>
          </div>
        ) : (
          addresses.map(addr => (
            <div
              key={addr.id}
              onClick={() => handleSelect(addr)}
              style={{ background: "#fff", borderRadius: "var(--radius-md)", padding: "16px", marginBottom: "12px", border: "1.5px solid var(--border)", cursor: fromCheckout ? "pointer" : "default", transition: "border-color 0.2s" }}
              onMouseEnter={e => fromCheckout && (e.currentTarget.style.borderColor = "var(--brown-dark)")}
              onMouseLeave={e => fromCheckout && (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--brown-dark)", textTransform: "uppercase", letterSpacing: "0.5px", background: "var(--cream-2)", padding: "2px 10px", borderRadius: "var(--radius-full)" }}>{addr.label}</span>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(addr.id); }}
                  style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: "16px", padding: "2px 6px" }}
                >🗑</button>
              </div>
              <p style={{ fontSize: "14px", color: "var(--text)", fontWeight: "600", marginBottom: "3px" }}>{addr.name}</p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>{addr.address}, {addr.city} — {addr.pincode}</p>
              {addr.phone && <p style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: "4px" }}>{addr.phone}</p>}
              {fromCheckout && (
                <div style={{ marginTop: 10, padding: "6px 12px", background: "var(--brown-dark)", color: "#fff", borderRadius: "var(--radius-full)", fontSize: 12, fontWeight: 700, display: "inline-block" }}>
                  Deliver here →
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Address Form */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
          <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 16px 36px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--brown-dark)", fontFamily: "var(--font-display)" }}>Add New Address</span>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-faint)" }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
              {["Home", "Work", "Other"].map(lbl => (
                <button key={lbl} onClick={() => setForm(f => ({ ...f, label: lbl }))}
                  style={{ padding: "6px 16px", border: `1.5px solid ${form.label === lbl ? "var(--brown-dark)" : "var(--border)"}`, borderRadius: "var(--radius-full)", background: form.label === lbl ? "var(--brown-dark)" : "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer", color: form.label === lbl ? "#fff" : "var(--text)" }}>
                  {lbl}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div><label style={labelStyle}>Full Name *</label><input style={inputStyle} value={form.name} onChange={inp("name")} placeholder="Full name" /></div>
              <div><label style={labelStyle}>Phone</label><input style={inputStyle} type="tel" maxLength={10} value={form.phone} onChange={inp("phone")} placeholder="10-digit mobile" /></div>
              <div><label style={labelStyle}>Address *</label><textarea style={{ ...inputStyle, height: "70px", resize: "none" }} value={form.address} onChange={inp("address")} placeholder="House no., Street, Area" /></div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>City</label><input style={{ ...inputStyle, background: "var(--cream-3)", color: "var(--text-muted)" }} value={form.city} readOnly /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>Pincode *</label><input style={inputStyle} value={form.pincode} onChange={inp("pincode")} placeholder="530001" maxLength={6} /></div>
              </div>
            </div>
            <button onClick={handleAdd} disabled={saving} style={{ width: "100%", padding: "14px", background: "var(--brown-dark)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "15px", fontWeight: "700", cursor: "pointer", marginTop: "16px", fontFamily: "var(--font-body)", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : "Save Address"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
