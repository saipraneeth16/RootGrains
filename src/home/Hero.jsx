import { useNavigate } from "react-router-dom";
import { useLang } from "../LanguageContext";
import { useState, useEffect } from "react";

// Add your hero images here. Replace hero1.jpg / hero2.jpg with your actual filenames.
// Save your photos to the /public folder as hero1.jpg and hero2.jpg
const SLIDES = [
  { img: "/hero.png",    label: "Pure Grains" },
  { img: "/hero1.webp",   label: "Farm Fresh" },
  { img: "/hero2.webp",   label: "Daily Staple" },
];

function Hero() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Auto-slide every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent(c => (c + 1) % SLIDES.length);
        setAnimating(false);
      }, 400);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (i) => {
    if (i === current) return;
    setAnimating(true);
    setTimeout(() => { setCurrent(i); setAnimating(false); }, 300);
  };

  const [titleLine1, titleLine2] = t.heroTitle.split("\n");
  const paraLines = t.heroPara.split("\n");

  return (
    <div className="hero" style={{ backgroundImage: `url('${SLIDES[current].img}')`, opacity: animating ? 0.6 : 1, transition: "opacity 0.4s ease-in-out" }}>
      {/* Overlay gradient */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(253,248,240,0.93) 38%, rgba(253,248,240,0.15) 100%)", zIndex: 1 }} />

      {/* Text — always on top, never slides */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <h2 style={{ fontFamily: "var(--font-display,'Zodiak',Georgia,serif)", fontSize: 16, fontWeight: 700, color: "var(--brown-dark,#3d1f0a)", lineHeight: 1.25, marginBottom: 6, letterSpacing: 0.1 }}>
          {titleLine1}<br />{titleLine2}
        </h2>
        <p style={{ fontSize: 10, color: "var(--text-muted,#7a6050)", lineHeight: 1.5, marginBottom: 12 }}>
          {paraLines[0]}<br />{paraLines[1]}<br />{paraLines[2]}
        </p>
        <button
          className="primary"
          onClick={() => navigate("/search")}
          style={{ alignSelf: "flex-start" }}
        >
          {t.shopNow}
        </button>
      </div>

      {/* Dot indicators */}
      <div style={{ position: "absolute", bottom: 8, right: 10, zIndex: 2, display: "flex", gap: 5 }}>
        {SLIDES.map((_, i) => (
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
