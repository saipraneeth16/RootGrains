// Each product group has a unique set of weight variants with its own prices.
// variants[] is the source of truth for the weight dropdown on the product detail page.
// Admin panel can override these via Firestore.

export const allProducts = [
  // ── NON-BASMATI → SONA MASOORIE RAW ────────────────────────────────────
  {
    id: "1", category: "non-basmati", subCategory: "sona-masoorie",
    nameKey: "sonaRaw", img: "/products/raw1kg.png",
    weight: "1 kg", price: 60, perKgPrice: 60,
    variants: [
      { weight: "1 kg",  price: 60,   perKgPrice: 60  },
      { weight: "2 kg",  price: 115,  perKgPrice: 57  },
      { weight: "5 kg",  price: 275,  perKgPrice: 55  },
      { weight: "10 kg", price: 520,  perKgPrice: 52  },
      { weight: "25 kg", price: 1200, perKgPrice: 48  },
    ],
  },

  // ── NON-BASMATI → SONA MASOORIE STEAM ──────────────────────────────────
  {
    id: "3", category: "non-basmati", subCategory: "steam-rice",
    nameKey: "sonaSteam", img: "/products/steam2kg1.png",
    weight: "2 kg", price: 135, perKgPrice: 67,
    variants: [
      { weight: "2 kg",  price: 135,  perKgPrice: 67  },
      { weight: "5 kg",  price: 320,  perKgPrice: 64  },
      { weight: "10 kg", price: 600,  perKgPrice: 60  },
      { weight: "25 kg", price: 1400, perKgPrice: 56  },
    ],
  },

  // ── NON-BASMATI → RAW RICE ──────────────────────────────────────────────
  {
    id: "r1", category: "non-basmati", subCategory: "raw-rice",
    nameKey: "rawRiceShort", img: "/products/raw2kg.png",
    weight: "1 kg", price: 52, perKgPrice: 52,
    variants: [
      { weight: "1 kg",  price: 52,   perKgPrice: 52  },
      { weight: "2 kg",  price: 98,   perKgPrice: 49  },
      { weight: "5 kg",  price: 230,  perKgPrice: 46  },
      { weight: "10 kg", price: 440,  perKgPrice: 44  },
      { weight: "25 kg", price: 1025, perKgPrice: 41  },
    ],
  },

  // ── NON-BASMATI → HALF BOILED ───────────────────────────────────────────
  {
    id: "h1", category: "non-basmati", subCategory: "half-boiled",
    nameKey: "halfBoiledRice", img: "/products/steam2kg2.png",
    weight: "1 kg", price: 58, perKgPrice: 58,
    variants: [
      { weight: "1 kg",  price: 58,   perKgPrice: 58  },
      { weight: "2 kg",  price: 110,  perKgPrice: 55  },
      { weight: "5 kg",  price: 265,  perKgPrice: 53  },
      { weight: "10 kg", price: 510,  perKgPrice: 51  },
      { weight: "25 kg", price: 1200, perKgPrice: 48  },
    ],
  },

  // ── BASMATI → PREMIUM ───────────────────────────────────────────────────
  {
    id: "9", category: "basmati",
    nameKey: "basmatiPremium", img: "/products/raw1kg.png",
    weight: "1 kg", price: 120, perKgPrice: 120,
    variants: [
      { weight: "1 kg",  price: 120,  perKgPrice: 120 },
      { weight: "2 kg",  price: 230,  perKgPrice: 115 },
      { weight: "5 kg",  price: 550,  perKgPrice: 110 },
      { weight: "10 kg", price: 1050, perKgPrice: 105 },
    ],
  },

  // ── BASMATI → AGED ──────────────────────────────────────────────────────
  {
    id: "12", category: "basmati",
    nameKey: "basmatiAged", img: "/products/steam2kg2.png",
    weight: "1 kg", price: 150, perKgPrice: 150,
    variants: [
      { weight: "1 kg",  price: 150,  perKgPrice: 150 },
      { weight: "5 kg",  price: 700,  perKgPrice: 140 },
      { weight: "10 kg", price: 1350, perKgPrice: 135 },
    ],
  },

  // ── MILLETS → FOXTAIL ───────────────────────────────────────────────────
  {
    id: "13", category: "millets",
    nameKey: "foxtailMillet", img: "/categories/millets.png",
    weight: "500 g", price: 45, perKgPrice: 90,
    variants: [
      { weight: "500 g", price: 45,  perKgPrice: 90  },
      { weight: "1 kg",  price: 85,  perKgPrice: 85  },
      { weight: "2 kg",  price: 165, perKgPrice: 82  },
    ],
  },

  // ── MILLETS → PEARL ─────────────────────────────────────────────────────
  {
    id: "15", category: "millets",
    nameKey: "pearlMillet", img: "/categories/millets.png",
    weight: "500 g", price: 40, perKgPrice: 80,
    variants: [
      { weight: "500 g", price: 40,  perKgPrice: 80  },
      { weight: "1 kg",  price: 75,  perKgPrice: 75  },
      { weight: "2 kg",  price: 145, perKgPrice: 72  },
    ],
  },

  // ── MILLETS → FINGER (RAGI) ─────────────────────────────────────────────
  {
    id: "17", category: "millets",
    nameKey: "fingerMillet", img: "/categories/millets.png",
    weight: "500 g", price: 50, perKgPrice: 100,
    variants: [
      { weight: "500 g", price: 50,  perKgPrice: 100 },
      { weight: "1 kg",  price: 95,  perKgPrice: 95  },
      { weight: "2 kg",  price: 185, perKgPrice: 92  },
    ],
  },

  // ── MILLETS → LITTLE ────────────────────────────────────────────────────
  {
    id: "19", category: "millets",
    nameKey: "littleMillet", img: "/categories/millets.png",
    weight: "500 g", price: 55, perKgPrice: 110,
    variants: [
      { weight: "500 g", price: 55,  perKgPrice: 110 },
      { weight: "1 kg",  price: 105, perKgPrice: 105 },
      { weight: "2 kg",  price: 205, perKgPrice: 102 },
    ],
  },
];

export const productTranslations = {
  EN: {
    sonaRaw:       "Sona Masoorie Raw Rice",
    sonaSteam:     "Sona Masoorie Steam Rice",
    rawRiceShort:  "Raw Rice",
    halfBoiledRice:"Half Boiled Rice",
    rawRice:       "Raw Rice",
    steamRice:     "Steam Rice",
    sonaVariety:   "Sona Masoorie",
    basmatiPremium:"Premium Basmati Rice",
    basmatiAged:   "Aged Basmati Rice",
    basmatiRice:   "Basmati Rice",
    basmatiVariety:"1121 Basmati",
    basmatiAgedVariety: "Aged 2 Years",
    foxtailMillet: "Foxtail Millet (Korra)",
    pearlMillet:   "Pearl Millet (Sajja)",
    fingerMillet:  "Finger Millet (Ragi)",
    littleMillet:  "Little Millet (Samalu)",
    milletType:    "Millet",
    foxtailVariety:"Native Variety",
    pearlVariety:  "Native Variety",
    fingerVariety: "Ragi Variety",
    littleVariety: "Native Variety",
  },
  TE: {
    sonaRaw:       "సోనా మసూరి రా రైస్",
    sonaSteam:     "సోనా మసూరి స్టీమ్ రైస్",
    rawRiceShort:  "రా రైస్",
    halfBoiledRice:"హాఫ్ బాయిల్డ్ రైస్",
    rawRice:       "రా రైస్",
    steamRice:     "స్టీమ్ రైస్",
    sonaVariety:   "సోనా మసూరి",
    basmatiPremium:"ప్రీమియం బాస్మతి బియ్యం",
    basmatiAged:   "పాత బాస్మతి బియ్యం",
    basmatiRice:   "బాస్మతి బియ్యం",
    basmatiVariety:"1121 బాస్మతి",
    basmatiAgedVariety: "2 సంవత్సరాల పాత",
    foxtailMillet: "కొర్రలు",
    pearlMillet:   "సజ్జలు",
    fingerMillet:  "రాగులు",
    littleMillet:  "సామలు",
    milletType:    "చిరుధాన్యం",
    foxtailVariety:"స్థానిక రకం",
    pearlVariety:  "స్థానిక రకం",
    fingerVariety: "రాగి రకం",
    littleVariety: "స్థానిక రకం",
  },
};
