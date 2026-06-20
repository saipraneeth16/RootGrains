import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBanners } from "../services/firestore";

// Auto-derive a shop link from the banner's category/brand filters
function bannerLink(banner) {
  const cat = banner.applyToCategory;
  const brand = banner.applyToBrand;
  if (cat && cat !== "all") return `/category/${cat}`;
  if (brand && brand !== "all") return `/brand/${brand}`;
  // Legacy single applyTo field
  if (banner.applyTo && banner.applyTo !== "all") {
    const cats = ["basmati", "non-basmati", "millets"];
    return cats.includes(banner.applyTo)
      ? `/category/${banner.applyTo}`
      : `/brand/${banner.applyTo}`;
  }
  return "/search";
}

function OfferCard({ banner, navigate }) {
  const bg = banner.bgColor || "#fff8e1";
  const dest = bannerLink(banner);
  const handleClick = () => navigate(dest);

  return (
    <div
      onClick={handleClick}
      style={{
        minWidth: banner.image ? 200 : 180,
        maxWidth: banner.image ? 200 : 220,
        borderRadius: 14,
        background: bg,
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        cursor: "pointer",
        flexShrink: 0,
        border: "1px solid rgba(0,0,0,0.07)",
      }}
    >
      {banner.image && (
        <div style={{ height: 100, overflow: "hidden" }}>
          <img
            src={banner.image}
            alt={banner.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}
      <div style={{ padding: "12px 14px" }}>
        {banner.discountText && (
          <div style={{
            fontSize: 22, fontWeight: 900,
            color: "var(--brown-dark)",
            fontFamily: "var(--font-display)",
            marginBottom: 4, lineHeight: 1.1,
          }}>
            {banner.discountText}
          </div>
        )}
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: "var(--text)", lineHeight: 1.4,
        }}>
          {banner.title}
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 10,
            background: "rgba(0,0,0,0.07)", color: "var(--text-muted)", fontWeight: 600,
          }}>
            {banner.type}
          </span>
          <span style={{ fontSize: 11, color: "var(--brown-dark)", fontWeight: 700 }}>
            Shop →
          </span>
        </div>
      </div>
    </div>
  );
}

export default function OffersSection() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    getBanners()
      .then(all => {
        const active = all.filter(
          b => b.active && (b.type === "Offer" || b.type === "Promotion")
        );
        setBanners(active);
      })
      .catch(() => {});
  }, []);

  if (banners.length === 0) return null;

  return (
    <div style={{ padding: "14px 0 4px" }}>
      <div style={{
        padding: "0 14px 10px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{
          fontSize: 12, fontWeight: 800, color: "var(--brown-dark)",
          textTransform: "uppercase", letterSpacing: "0.8px",
        }}>
          Offers & Promotions
        </span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
          {banners.length} active
        </span>
      </div>
      <div style={{
        display: "flex", gap: 10,
        overflowX: "auto", paddingLeft: 14, paddingRight: 14,
        paddingBottom: 4, scrollbarWidth: "none",
      }}>
        {banners.map(b => (
          <OfferCard key={b.id} banner={b} navigate={navigate} />
        ))}
      </div>
    </div>
  );
}
