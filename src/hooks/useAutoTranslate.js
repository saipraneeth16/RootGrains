import { useState, useEffect } from "react";
import { useLang } from "../LanguageContext";
import { translateText, getCached } from "../services/translate";

// Hook for auto-translating dynamic content (product names, descriptions, etc.)
// Usage: const translatedName = useAutoTranslate(product.name);
export function useAutoTranslate(text) {
  const { lang } = useLang();

  const [translated, setTranslated] = useState(() => {
    if (!text || lang !== "TE") return text;
    return getCached(text, "te") || text; // use cache if available, else show English
  });

  useEffect(() => {
    if (!text) { setTranslated(text); return; }
    if (lang !== "TE") { setTranslated(text); return; }

    const cached = getCached(text, "te");
    if (cached) { setTranslated(cached); return; }

    // Not cached — fetch translation
    let cancelled = false;
    translateText(text, "te").then(result => {
      if (!cancelled) setTranslated(result);
    });
    return () => { cancelled = true; };
  }, [text, lang]);

  return translated || text;
}
