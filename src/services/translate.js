// Auto-translation service using MyMemory API (free, no key needed)
// Caches all translations in localStorage so they're instant on repeated use

const CACHE_KEY = "rg_te_translations";
let memCache = {};

// Load existing cache from localStorage on startup
try {
  memCache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
} catch {}

function saveCache() {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(memCache)); } catch {}
}

// Translate a single string EN → target language
export async function translateText(text, targetLang = "te") {
  if (!text || typeof text !== "string" || text.trim().length === 0) return text;

  // Strip emojis/symbols for translation, then reattach
  const cacheKey = `${targetLang}:${text}`;
  if (memCache[cacheKey]) return memCache[cacheKey];

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}&de=spogiri@gmail.com`
    );
    const data = await res.json();
    if (data.responseStatus === 200) {
      const result = data.responseData.translatedText;
      memCache[cacheKey] = result;
      saveCache();
      return result;
    }
  } catch {}

  return text; // fallback to original on error
}

// Translate an array of strings in parallel (batched to avoid rate limits)
export async function translateBatch(texts, targetLang = "te") {
  const unique = [...new Set(
    texts.filter(t => t && typeof t === "string" && t.trim().length > 0)
  )];

  // Split into chunks of 5 to avoid hitting rate limits
  const chunkSize = 5;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    await Promise.all(chunk.map(t => translateText(t, targetLang)));
    // Small delay between chunks
    if (i + chunkSize < unique.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // Return mapped results
  return texts.map(t => memCache[`${targetLang}:${t}`] || t);
}

// Check if a string is already cached
export function getCached(text, targetLang = "te") {
  return memCache[`${targetLang}:${text}`] || null;
}

// Clear the translation cache (useful if translations look wrong)
export function clearTranslationCache() {
  memCache = {};
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}
