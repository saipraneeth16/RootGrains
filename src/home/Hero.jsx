import { useNavigate } from "react-router-dom";
import { useLang } from "../LanguageContext";
import { useState, useEffect } from "react";
import { getBanners } from "../services/firestore";

// Default static slides — always shown
const DEFAULT_SLIDES = [
  { img: "/hero.png",   label: "Pure Grains",  type: "default" },
  { img: "/hero1.webp", label: "Farm Fresh",   type: "default" },
  { img: "/hero2.webp", label: "Daily Staple", type: "default" },
];

function Hero() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Load admin banner slides from Firestore
  useEffect(() => {
    getBanners()
      .then(all => {
        const bannerSlides = all
          .filter(b => b.active && b.image)
          .map(b => {
            // Auto-derive shop link from category/brand filters
            const cat = b.applyToCategory;
            const brand = b.applyToBrand;
            const cats = ["basmati", "non-basmati", "millets"];
            let link = "/search";
            if (cat && cat !== "all") link = `/category/${cat}`;
            else if (brand && brand !== "all") link = `/brand/${brand}`;
            else if (b.applyTo && b.applyTo !== "all")
              link = cats.includes(b.applyTo) ? `/category/${b.applyTo}` : `/brand/${b.applyTo}`;
            return {
              img: b.image,
              label: b.title,
              discountText: b.discountText || "",
              link,
              type: "banner",
            };
          });
        // Interleave banner slides after the first default slide
        if (bannerSlides.length > 0) {
          setSlides([DEFAULT_SLIDES[0], ...bannerSlides, ...DEFAULT_SLIDES.slice(1)]);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent(c => (c + 1) % slides.length);
        setAnimating(false);
      }, 400);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goTo = (i) => {
    if (i === current) return;
    setAnimating(true);
    setTimeout(() => { setCurrent(i); setAnimating(false); }, 300);
  };

  const slide = slides[current];
  const [titleLine1, titleLine2] = t.heroTitle.split("\n");
  const paraLines = t.heroPara.split("\n");

  return (
    <div
      className="hero"
      style={{
        backgroundImage: `url('${slide.img}')`,
        opacity: animating ? 0.6 : 1,
        transition: "opacity 0.4s ease-in-out",
      }}
    >
      {/* Overlay gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(90deg, rgba(253,248,240,0.93) 38%, rgba(253,248,240,0.15) 100%)",
        zIndex: 1,
      }} />

      {/* Content — switches based on slide type */}
      <div style={{ position: "relative", zIndex: 2 }}>
        {slide.type === "default" ? (
          // Default hero content
          <>
            <h2 style={{ fontFamily: "var(--font-display,'Zodiak',Georgia,serif)", fontSize: 16, fontWeight: 700, color: "var(--brown-dark,#3d1f0a)", lineHeight: 1.25, marginBottom: 6, letterSpacing: 0.1 }}>
              {titleLine1}<br />{titleLine2}
            </h2>
            <p style={{ fontSize: 10, color: "var(--text-muted,#7a6050)", lineHeight: 1.5, marginBottom: 12 }}>
              {paraLines[0]}<br />{paraLines[1]}<br />{paraLines[2]}
            </p>
            <button className="primary" onClick={() => navigate("/search")} style={{ alignSelf: "flex-start" }}>
              {t.shopNow}
            </button>
          </>
        ) : (
          // Admin banner slide content
          <>
            {slide.discountText && (
              <div style={{ fontSize: 28, fontWeight: 900, color: "var(--brown-dark)", fontFamily: "var(--font-display)", lineHeight: 1, marginBottom: 6 }}>
                {slide.discountText}
              </div>
            )}
            <h2 style={{ fontFamily: "var(--font-display,'Zodiak',Georgia,serif)", fontSize: 15, fontWeight: 700, color: "var(--brown-dark,#3d1f0a)", lineHeight: 1.3, marginBottom: 10, maxWidth: "55%" }}>
              {slide.label}
            </h2>
            <button
              className="primary"
              onClick={() => navigate(slide.link || "/search")}
              style={{ alignSelf: "flex-start" }}
            >
              Shop Now
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      <div style={{ position: "absolute", bottom: 8, right: 10, zIndex: 2, display: "flex", gap: 5 }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: i === current ? 18 : 6,
              height: 6,
              borderRadius: 3,
              background: i === current ? "var(--brown-dark,#3b1f0e)" : "rgba(59,31,14,0.3)",
              border: "none", cursor: "pointer", padding: 0,
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default Hero;
