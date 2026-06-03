import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../home/Home.css";
import { useAuth } from "./AuthContext";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inp = {
    width: "100%", padding: "12px 14px",
    border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
    fontSize: "14px", color: "var(--text)", background: "var(--cream-2)",
    outline: "none", fontFamily: "var(--font-body)", boxSizing: "border-box",
  };

  const handleSignup = async () => {
    setError("");
    if (!form.name.trim()) { setError("Please enter your name."); return; }
    if (!form.email.includes("@")) { setError("Enter a valid email address."); return; }
    if (form.phone && !form.phone.match(/^[6-9]\d{9}$/)) { setError("Enter a valid 10-digit phone number."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.phone);
      navigate("/profile");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") setError("This email is already registered. Please log in.");
      else if (err.code === "auth/invalid-email") setError("Invalid email address.");
      else setError(err.message || "Sign up failed. Please try again.");
    }
    setLoading(false);
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div style={{ fontFamily: "var(--font-body)", background: "var(--cream)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#fff", boxShadow: "var(--shadow-sm)", borderBottom: "1px solid var(--border)" }}>
        <button className="back-btn" onClick={() => navigate("/login")}>←</button>
        <span style={{ fontSize: "17px", fontWeight: "700", color: "var(--brown-dark)", fontFamily: "var(--font-display)" }}>Create Account</span>
      </div>

      {/* Hero */}
      <div style={{ background: "var(--brown-dark)", padding: "28px 24px 24px", textAlign: "center" }}>
        <img src="/logo.png" alt="Root Grains" style={{ width: "64px", height: "64px", objectFit: "contain", margin: "0 auto 12px", display: "block" }} />
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: "700", color: "#fff", marginBottom: "4px" }}>Join Root Grains</h1>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>Fresh rice & grains delivered to your door</p>
      </div>

      <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", display: "block" }}>Full Name *</label>
          <input style={inp} value={form.name} onChange={set("name")} placeholder="Enter your full name" />
        </div>
        <div>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", display: "block" }}>Email Address *</label>
          <input style={inp} type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
        </div>
        <div>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", display: "block" }}>Phone Number</label>
          <input style={inp} type="tel" maxLength={10} value={form.phone} onChange={set("phone")} placeholder="10-digit mobile number (optional)" />
        </div>
        <div>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", display: "block" }}>Password *</label>
          <input style={inp} type="password" value={form.password} onChange={set("password")} placeholder="At least 6 characters" />
        </div>
        <div>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", display: "block" }}>Confirm Password *</label>
          <input style={inp} type="password" value={form.confirm} onChange={set("confirm")} placeholder="Re-enter your password" onKeyDown={e => e.key === "Enter" && handleSignup()} />
        </div>

        {error && (
          <div style={{ background: "#fff0f0", border: "1px solid #fcc", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "#c0392b", fontWeight: "500" }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSignup} disabled={loading}
          style={{ width: "100%", padding: "14px", background: loading ? "var(--brown)" : "var(--brown-dark)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", marginTop: "4px" }}
        >
          {loading ? "Creating account..." : "Create Account →"}
        </button>

        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>
          Already have an account?{" "}
          <span onClick={() => navigate("/login")} style={{ color: "var(--brown-dark)", fontWeight: "700", cursor: "pointer" }}>
            Log In
          </span>
        </p>
      </div>
    </div>
  );
}
