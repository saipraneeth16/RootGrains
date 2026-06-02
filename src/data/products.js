// Local product definitions — used only as reference for the admin panel.
// The store reads exclusively from Firebase Firestore.

export const allProducts = [
  // ── NON-BASMATI → SONA MASOORIE RAW ────────────────────────────────────
  {
    id: "1", category: "non-basmati", subCategory: "sona-masoorie",
    nameKey: "sonaRaw", img: "/products/raw1kg.png",
    weight: "5 kg", price: 0, perKgPrice: 0,
    variants: [
      { weight: "5 kg",  price: 0, perKgPrice: 0 },
      { weight: "10 kg", price: 0, perKgPrice: 0 },
      { weight: "25 kg", price: 0, perKgPrice: 0 },
    ],
  },
  // ── NON-BASMATI → SONA MASOORIE STEAM ──────────────────────────────────
  {
    id: "3", category: "non-basmati", subCategory: "steam-rice",
    nameKey: "sonaSteam", img: "/products/steam2kg1.png",
    weight: "5 kg", price: 0, perKgPrice: 0,
    variants: [
      { weight: "5 kg",  price: 0, perKgPrice: 0 },
      { weight: "10 kg", price: 0, perKgPrice: 0 },
      { weight: "25 kg", price: 0, perKgPrice: 0 },
    ],
  },
  // ── NON-BASMATI → RAW RICE ──────────────────────────────────────────────
  {
    id: "r1", category: "non-basmati", subCategory: "raw-rice",
    nameKey: "rawRiceShort", img: "/products/raw2kg.png",
    weight: "5 kg", price: 0, perKgPrice: 0,
    variants: [
      { weight: "5 kg",  price: 0, perKgPrice: 0 },
      { weight: "10 kg", price: 0, perKgPrice: 0 },
      { weight: "25 kg", price: 0, perKgPrice: 0 },
    ],
  },
  // ── NON-BASMATI → HALF BOILED ───────────────────────────────────────────
  {
    id: "h1", category: "non-basmati", subCategory: "half-boiled",
    nameKey: "halfBoiledRice", img: "/products/steam2kg2.png",
    weight: "5 kg", price: 0, perKgPrice: 0,
    variants: [
      { weight: "5 kg",  price: 0, perKgPrice: 0 },
      { weight: "10 kg", price: 0, perKgPrice: 0 },
      { weight: "25 kg", price: 0, perKgPrice: 0 },
    ],
  },
  // ── BASMATI → PREMIUM ───────────────────────────────────────────────────
  {
    id: "9", category: "basmati",
    nameKey: "basmatiPremium", img: "/products/raw1kg.png",
    weight: "5 kg", price: 0, perKgPrice: 0,
    variants: [
      { weight: "5 kg",  price: 0, perKgPrice: 0 },
      { weight: "10 kg", price: 0, perKgPrice: 0 },
      { weight: "25 kg", price: 0, perKgPrice: 0 },
    ],
  },
  // ── BASMATI → AGED ──────────────────────────────────────────────────────
  {
    id: "12", category: "basmati",
    nameKey: "basmatiAged", img: "/products/steam2kg2.png",
    weight: "5 kg", price: 0, perKgPrice: 0,
    variants: [
      { weight: "5 kg",  price: 0, perKgPrice: 0 },
      { weight: "10 kg", price: 0, perKgPrice: 0 },
      { weight: "25 kg", price: 0, perKgPrice: 0 },
    ],
  },
  // ── MILLETS ──────────────────────────────────────────────────────────────
  {
    id: "13", category: "millets", nameKey: "foxtailMillet", img: "/categories/millets.png",
    weight: "500 g", price: 0, perKgPrice: 0,
    variants: [
      { weight: "500 g", price: 0, perKgPrice: 0 },
      { weight: "1 kg",  price: 0, perKgPrice: 0 },
    ],
  },
  {
    id: "15", category: "millets", nameKey: "pearlMillet", img: "/categories/millets.png",
    weight: "500 g", price: 0, perKgPrice: 0,
    variants: [
      { weight: "500 g", price: 0, perKgPrice: 0 },
      { weight: "1 kg",  price: 0, perKgPrice: 0 },
    ],
  },
  {
    id: "17", category: "millets", nameKey: "fingerMillet", img: "/categories/millets.png",
    weight: "500 g", price: 0, perKgPrice: 0,
    variants: [
      { weight: "500 g", price: 0, perKgPrice: 0 },
      { weight: "1 kg",  price: 0, perKgPrice: 0 },
    ],
  },
  {
    id: "19", category: "millets", nameKey: "littleMillet", img: "/categories/millets.png",
    weight: "500 g", price: 0, perKgPrice: 0,
    variants: [
      { weight: "500 g", price: 0, perKgPrice: 0 },
      { weight: "1 kg",  price: 0, perKgPrice: 0 },
    ],
  },
];

export const productTranslations = {
  EN: {
    sonaRaw: "Sona Masoorie Raw Rice",
    sonaSteam: "Sona Masoorie Steam Rice",
    rawRiceShort: "Raw Rice",
    halfBoiledRice: "Half Boiled Rice",
    basmatiPremium: "Premium Basmati Rice",
    basmatiAged: "Aged Basmati Rice",
    foxtailMillet: "Foxtail Millet (Korra)",
    pearlMillet: "Pearl Millet (Sajja)",
    fingerMillet: "Finger Millet (Ragi)",
    littleMillet: "Little Millet (Samalu)",
  },
  TE: {
    sonaRaw: "సోనా మసూరి రా రైస్",
    sonaSteam: "సోనా మసూరి స్టీమ్ రైస్",
    rawRiceShort: "రా రైస్",
    halfBoiledRice: "హాఫ్ బాయిల్డ్ రైస్",
    basmatiPremium: "ప్రీమియం బాస్మతి బియ్యం",
    basmatiAged: "పాత బాస్మతి బియ్యం",
    foxtailMillet: "కొర్రలు",
    pearlMillet: "సజ్జలు",
    fingerMillet: "రాగులు",
    littleMillet: "సామలు",
  },
};
