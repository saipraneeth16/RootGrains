import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../home/Home.css";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inp = {
    width: "100%", padding: "12px 14px",
    border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
    fontSize: "14px", color: "var(--text)", background: "var(--cream-2)",
    outline: "none", fontFamily: "var(--font-body)", boxSizing: "border-box",
  };

  const handleLogin = async () => {
    setError("");
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    if (!password) { setError("Enter your password."); return; }
    setLoading(true);
    try {
      await login(email, password);
      navigate("/profile");
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential")
        setError("Incorrect email or password.");
      else if (err.code === "auth/invalid-email")
        setError("Invalid email address.");
      else
        setError(err.message || "Login failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: "var(--font-body)", background: "var(--cream)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#fff", boxShadow: "var(--shadow-sm)", borderBottom: "1px solid var(--border)" }}>
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span style={{ fontSize: "17px", fontWeight: "700", color: "var(--brown-dark)", fontFamily: "var(--font-display)" }}>Log In</span>
      </div>

      {/* Hero */}
      <div style={{ background: "var(--brown-dark)", padding: "32px 24px 28px", textAlign: "center" }}>
        <img src="/logo.png" alt="Root Grains" style={{ width: "72px", height: "72px", objectFit: "contain", margin: "0 auto 14px", display: "block" }} />
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: "700", color: "#fff", marginBottom: "6px" }}>Welcome Back</h1>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.70)" }}>Log in to track your orders</p>
      </div>

      <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", display: "block" }}>Email Address</label>
          <input style={inp} type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="you@example.com" />
        </div>
        <div>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "5px", display: "block" }}>Password</label>
          <input style={inp} type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} placeholder="Enter your password" onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>

        {error && (
          <div style={{ background: "#fff0f0", border: "1px solid #fcc", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "#c0392b", fontWeight: "500" }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin} disabled={loading}
          style={{ width: "100%", padding: "14px", background: loading ? "var(--brown)" : "var(--brown-dark)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", marginTop: "4px" }}
        >
          {loading ? "Logging in..." : "Log In →"}
        </button>

        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>
          Don't have an account?{" "}
          <span onClick={() => navigate("/signup")} style={{ color: "var(--brown-dark)", fontWeight: "700", cursor: "pointer" }}>
            Sign Up
          </span>
        </p>

        <div style={{ marginTop: "16px", padding: "14px", background: "var(--cream-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
