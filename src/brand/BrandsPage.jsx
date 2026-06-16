import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../home/Home.css";
import { useLang } from "../LanguageContext";
import { useProducts } from "../ProductsContext";
import { getBrands } from "../services/firestore";
import BottomNav from "../home/BottomNav";

export default function BrandsPage() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { products } = useProducts();
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);

  useEffect(() => {
    getBrands()
      .then(bs => setBrands(bs.filter(b => b.active !== false).sort((a, z) => a.name.localeCompare(z.name))))
      .catch(() => {})
      .finally(() => setLoadingBrands(false));
  }, []);

  // Count how many Firestore products have this brand slug assigned
  const productCount = (slug) => products.filter(p => p.brand === slug && p.active !== false).length;

  return (
    <div className="mobile" style={{ background: "var(--cream)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "10px 14px", background: "#fff",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "var(--shadow-sm)", borderBottom: "1px solid var(--border)"
      }}>
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span style={{ fontSize: "17px", fontWeight: "700", color: "var(--brown-dark)", fontFamily: "var(--font-display)" }}>
          All Brands
        </span>
        <span style={{
          marginLeft: "auto", fontSize: "11px", fontWeight: "600",
          color: "var(--text-muted)", background: "var(--cream-2)",
          padding: "3px 10px", borderRadius: "var(--radius-full)",
          border: "1px solid var(--border)"
        }}>
          {brands.length} Brands
        </span>
      </div>

      {/* Subtitle */}
      <div style={{ padding: "14px 16px 6px" }}>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          Browse our trusted brand partners — tap any brand to explore their full range.
        </p>
      </div>

      {/* Brand Cards */}
      <div style={{ padding: "6px 12px 100px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {loadingBrands ? (
          [1, 2, 3].map(i => (
            <div key={i} style={{ height: 110, borderRadius: 14, background: "linear-gradient(90deg,#f0ece8 25%,#e6e0d8 50%,#f0ece8 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s ease-in-out infinite" }} />
          ))
        ) : brands.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)", fontSize: 14 }}>No brands available yet.</div>
        ) : brands.map((brand) => {
          const count = productCount(brand.slug);
          const desc = lang === "TE" ? brand.descTE : brand.descEN;
          const accent = brand.accent || "var(--olive)";
          const color = brand.color || "var(--cream-2)";
          const categories = brand.categories || [];

          return (
            <div
              key={brand.id}
              onClick={() => navigate(`/brand/${brand.slug}`)}
              style={{
                background: "#fff",
                borderRadius: "14px",
                border: "1px solid var(--border)",
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(61,31,10,0.06)",
              }}
            >
              {/* Coloured top strip */}
              <div style={{
                background: color,
                padding: "18px 16px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                borderBottom: `2px solid ${accent}22`,
              }}>
                {/* Logo box */}
                <div style={{
                  width: "70px", height: "70px", flexShrink: 0,
                  background: "#fff", borderRadius: "12px",
                  padding: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {brand.logo
                    ? <img src={brand.logo} alt={brand.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    : <span style={{ fontSize: 30 }}>🏷️</span>
                  }
                </div>

                {/* Brand info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: "17px", fontWeight: "800", color: "var(--brown-dark)", fontFamily: "var(--font-display)" }}>
                      {brand.name}
                    </h3>
                    {brand.tag && (
                      <span style={{
                        fontSize: "9px", fontWeight: "700", color: accent,
                        background: `${accent}18`, padding: "2px 8px",
                        borderRadius: "var(--radius-full)", border: `1px solid ${accent}44`,
                        textTransform: "uppercase", letterSpacing: "0.5px",
                      }}>
                        {brand.tag}
                      </span>
                    )}
                  </div>
                  {desc && (
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "8px" }}>
                      {desc}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: accent }}>
                      {count} product{count !== 1 ? "s" : ""}
                    </span>
                    {categories.length > 0 && (
                      <span style={{ fontSize: "10px", color: "var(--text-faint)" }}>
                        {categories.map(c =>
                          c === "basmati" ? "Basmati" : c === "non-basmati" ? "Non-Basmati" : "Millets"
                        ).join(" · ")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>

              {/* Bottom strip — category tags */}
              {categories.length > 0 && (
                <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {categories.map(c => (
                      <span key={c} style={{
                        fontSize: "10px", fontWeight: "600", color: "var(--text-muted)",
                        background: "var(--cream-2)", padding: "3px 10px",
                        borderRadius: "var(--radius-full)", border: "1px solid var(--border)",
                      }}>
                        {c === "basmati" ? "Basmati" : c === "non-basmati" ? "Non-Basmati" : "Millets"}
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: "11px", color: accent, fontWeight: "700" }}>Shop →</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      <BottomNav />
    </div>
  );
}
