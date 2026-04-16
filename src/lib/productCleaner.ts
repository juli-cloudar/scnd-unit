// src/lib/productCleaner.ts
// KEIN 'use client' - reine Logik für API und Frontend
// Ultra ausführlicher Cleaner für alle Produktdaten

// ============================================================
// 1. BEKANNTE MARKEN (für Erkennung und Extraktion)
// ============================================================
const KNOWN_BRANDS = [
  // Premium Marken
  'Tommy Hilfiger', 'Helly Hansen', 'The North Face', 'New Balance',
  'L.L.Bean', 'L.L. Bean', 'L.L.Bean',
  // Sportmarken
  'Adidas', 'Nike', 'Puma', 'Reebok', 'Champion', 'Under Armour',
  // Outdoor Marken
  'Columbia', 'Napapijri', 'Timberland', 'Carhartt', 'Patagonia', 'Jack Wolfskin',
  // Streetwear
  'Supreme', 'Starter', 'FILA', 'Vans', 'Converse', 'Dickies',
  // Polomarken
  'Lacoste', 'U.S. Polo Assn', 'US Polo Assn', 'Fred Perry',
  // Denim Marken
  'Lee', 'Lee Sport', 'Wrangler', 'Levis', 'Levi\'s',
  // Sport Teams
  'NBA', 'NFL', 'NHL', 'MLB',
  // Auto Marken
  'Audi', 'Mercedes', 'BMW', 'Porsche',
  // Französische Marken
  'Olympique Marseille', 'Paris Saint-Germain', 'OM',
  // Weitere
  'Bexleys', 'LA MARTINA', 'La Martina', 'Pitstop Jeans', 'Bernd Berger'
];

// ============================================================
// 2. RECHTSCHREIBFEHLER KORREKTUREN
// ============================================================
const TYPO_FIXES: { [key: string]: string } = {
  // Doppelte Buchstaben
  'SSCHWARZ': 'SCHWARZ',
  'SSchwarz': 'Schwarz',
  'sschwarz': 'schwarz',
  'SSPORT': 'SPORT',
  'SSport': 'Sport',
  'SSTRIPE': 'STRIPE',
  'SStripe': 'Stripe',
  'SSWEATER': 'SWEATER',
  'SSweater': 'Sweater',
  'TTREETWEAR': 'STREETWEAR',
  'TTreetwear': 'Streetwear',
  
  // Häufige Fehler
  'chwarz': 'Schwarz',
  'woosh': 'Swoosh',
  'weater': 'Sweater',
  'weatshirt': 'Sweatshirt',
  'weather': 'Sweater',
  'port': 'Sport',
  'adidas': 'Adidas',
  'nike': 'Nike',
  'puma': 'Puma',
  'tommy': 'Tommy',
  'hilfiger': 'Hilfiger',
  'treewear': 'Streetwear',
  'ogro': 'Logo',
  'tripe': 'Stripe',
  'hirt': 'Shirt',
  'inal': 'Minimal',
  'cript': 'Script',
  'treifen': 'Streifen',
  'ommer': 'Sommer',
  'tall': 'Tall',
  'crewnck': 'Crewneck',
  'crewneckk': 'Crewneck',
  'fleecee': 'Fleece',
  'jackee': 'Jacke',
  'pulloverr': 'Pullover',
  'sweatshirtk': 'Sweatshirt',
  
  // L.L.Bean spezifisch
  'L.L.L.Bean': 'L.L.Bean',
  'L.L. Bean': 'L.L.Bean',
  'LL.BEAN': 'L.L.Bean',
  'LLBEAN': 'L.L.Bean',
  'LiL. BEAN': 'L.L.Bean',
  'LIL. BEAN': 'L.L.Bean',
  'LL. BEAN': 'L.L.Bean',
  '..Bean': 'L.L.Bean',
  '.Bean': 'L.L.Bean',
  
  // Marken Korrekturen
  'NAPAPLIRI': 'Napapijri',
  'LA M': 'LA MARTINA',
  'U.S. POLO ASSN.': 'U.S. Polo Assn',
  'US POLO ASSN': 'U.S. Polo Assn',
  'MARSEILLE': 'Olympique Marseille'
};

// ============================================================
// 3. ZU ENTFERNENDE WÖRTER (aus dem Namen)
// ============================================================
const REMOVE_WORDS = [
  'Vintage', 'Streetwear', 'Clean', 'Oversize', 'Oversized',
  'Essential', 'Basic', 'Pullover', 'Sweatshirt', 'Jacket',
  'Classic', 'Original', 'Authentic', 'Retro', 'Limited',
  'Collection', 'Edition', 'Special', 'Premium'
];

// ============================================================
// 4. GRÖSSEN (für Erkennung)
// ============================================================
const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '3XL', '4XL', '5XL'];
const SIZE_PATTERN = /\b(XXS|XS|S|M|L|XL|XXL|XXXL|3XL|4XL|5XL|34\/6|36\/8|38\/10|40\/12|42\/14)\b/i;

// ============================================================
// 5. KATEGORIEN (für Erkennung)
// ============================================================
const CATEGORY_PATTERNS: { pattern: RegExp; category: string }[] = [
  { pattern: /sweatshirt|crewneck|sweater/i, category: 'Sweatshirts' },
  { pattern: /jacke|jacket|fleece|track|windbreaker|bomber|parka|mantel|coat/i, category: 'Jacken' },
  { pattern: /polo|poloshirt|poloshirt/i, category: 'Polos' },
  { pattern: /weste|vest|gilet/i, category: 'Westen' },
  { pattern: /top|cropped|tanktop|shirt|t-shirt|tshirt|bluse|hemd/i, category: 'Tops' },
  { pattern: /hose|pants|jeans|chino|jogger|shorts/i, category: 'Hosen' },
  { pattern: /schuhe|sneaker|shoes|boots|sandal/i, category: 'Schuhe' },
  { pattern: /tasche|bag|rucksack|backpack|tote/i, category: 'Taschen' }
];

// ============================================================
// 6. ZUSTÄNDE (für Normalisierung)
// ============================================================
const CONDITION_MAP: { [key: string]: string } = {
  'neu': 'Neu',
  'new': 'Neu',
  'new with tags': 'Neu mit Etikett',
  'neu mit etikett': 'Neu mit Etikett',
  'neu ohne etikett': 'Neu ohne Etikett',
  'sehr gut': 'Sehr gut',
  'very good': 'Sehr gut',
  'gut': 'Gut',
  'good': 'Gut',
  'zufriedenstellend': 'Zufriedenstellend',
  'satisfactory': 'Zufriedenstellend',
  'schlecht': 'Schlecht',
  'poor': 'Schlecht'
};

// ============================================================
// 7. INTERFACE
// ============================================================
export interface CleanedProduct {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: string;
  size: string;
  condition: string;
  vinted_url: string;
  images: string[] | null;
  sold: boolean;
}

// ============================================================
// 8. HAUPTFUNKTION: cleanProduct
// ============================================================
export function cleanProduct(rawData: any): CleanedProduct {
  // Original ID sichern (wichtig für Links!)
  const originalId = rawData.id;
  
  // Original Namen holen
  let originalName = rawData.name || rawData.title || '';
  let name = originalName;
  
  // ===== SCHRITT 1: Rechtschreibfehler korrigieren =====
  for (const [wrong, correct] of Object.entries(TYPO_FIXES)) {
    name = name.replace(new RegExp(wrong, 'gi'), correct);
  }
  
  // ===== SCHRITT 2: Marke erkennen und extrahieren =====
  let brand = rawData.brand || '';
  
  if (!brand) {
    // Zuerst bekannte Marken suchen
    for (const knownBrand of KNOWN_BRANDS) {
      const brandRegex = new RegExp(`^${knownBrand}\\s|\\s${knownBrand}\\s|\\s${knownBrand}$`, 'i');
      if (brandRegex.test(name)) {
        brand = knownBrand;
        name = name.replace(new RegExp(`^${knownBrand}\\s+|\\s${knownBrand}\\s+|\\s${knownBrand}$`, 'gi'), ' ');
        break;
      }
    }
  }
  
  // Fallback: erste zwei Wörter als Marke
  if (!brand) {
    const words = name.split(' ');
    if (words.length >= 2) {
      brand = `${words[0]} ${words[1]}`;
      name = name.replace(new RegExp(`^${brand}\\s+`, 'i'), '');
    } else if (words.length >= 1) {
      brand = words[0];
      name = name.replace(new RegExp(`^${brand}\\s+`, 'i'), '');
    }
  }
  
  // Marke korrekt schreiben (ersten Buchstaben groß, rest klein)
    brand = brand.split(' ').map((word: string) => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
  
  // Spezialfälle für Marken
  if (brand.toLowerCase() === 'L.L.Bean') brand = 'L.L.Bean';
  if (brand.toLowerCase() === 'tommy hilfiger') brand = 'Tommy Hilfiger';
  if (brand.toLowerCase() === 'helly hansen') brand = 'Helly Hansen';
  if (brand.toLowerCase() === 'the north face') brand = 'The North Face';
  if (brand.toLowerCase() === 'new balance') brand = 'New Balance';
  
  // ===== SCHRITT 3: Größe extrahieren =====
  let size = rawData.size || '';
  const sizeMatch = name.match(SIZE_PATTERN);
  if (sizeMatch && !size) {
    size = sizeMatch[1].toUpperCase();
    name = name.replace(SIZE_PATTERN, '');
  }
  
  // Größe normalisieren
  if (size === 'XS' || size === 'X/S') size = 'XS';
  if (size === 'S') size = 'S';
  if (size === 'M') size = 'M';
  if (size === 'L') size = 'L';
  if (size === 'XL') size = 'XL';
  if (size === 'XXL') size = 'XXL';
  
  // ===== SCHRITT 4: Kategorie bestimmen =====
  let category = rawData.category || '';
  if (!category) {
    for (const { pattern, category: cat } of CATEGORY_PATTERNS) {
      if (pattern.test(name)) {
        category = cat;
        break;
      }
    }
  }
  if (!category) category = 'Pullover';
  
  // ===== SCHRITT 5: Überflüssige Wörter entfernen =====
  for (const word of REMOVE_WORDS) {
    name = name.replace(new RegExp(`\\s*${word}\\s*`, 'gi'), ' ');
  }
  
  // ===== SCHRITT 6: Preis bereinigen =====
  let price = rawData.price?.toString() || '0';
  price = price.replace(/€/g, '');
  price = price.replace(/,/g, '.');
  price = price.trim();
  
  // Sicherstellen dass price eine gültige Zahl ist
  if (isNaN(parseFloat(price))) price = '0';
  
  // ===== SCHRITT 7: Zustand bereinigen =====
  let condition = rawData.condition || 'Gut';
  const lowerCondition = condition.toLowerCase();
  condition = CONDITION_MAP[lowerCondition] || condition;
  
  // ===== SCHRITT 8: Finale Namensbereinigung =====
  // Marke aus Name entfernen (falls noch vorhanden)
  if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) {
    name = name.slice(brand.length).trim();
  }
  
  // Größe aus Name entfernen (falls noch vorhanden)
  for (const s of SIZES) {
    name = name.replace(new RegExp(`\\b${s}\\b`, 'gi'), '');
  }
  
  // Kategorie aus Name entfernen (falls noch vorhanden)
  name = name.replace(new RegExp(category, 'gi'), '');
  
  // Doppelte Leerzeichen entfernen
  name = name.replace(/\s+/g, ' ').trim();
  
  // Leeren Namen verhindern
  if (!name || name.length === 0) {
    name = 'Unbenanntes Produkt';
  }
  
  // ===== SCHRITT 9: Rückgabe =====
  return {
    id: originalId,           // ← WICHTIG: ID bleibt erhalten!
    name: name,
    brand: brand,
    category: category,
    price: price,
    size: size,
    condition: condition,
    vinted_url: rawData.vinted_url || '',
    images: rawData.images || null,
    sold: rawData.sold || false
  };
}

// ============================================================
// 9. MEHRERE PRODUKTE BEREINIGEN
// ============================================================
export function cleanMultipleProducts(products: any[]): CleanedProduct[] {
  if (!products || products.length === 0) return [];
  return products.map(p => cleanProduct(p));
}

// ============================================================
// 10. EINDEUTIGE MARKEN EXTRAHIEREN (für Filter)
// ============================================================
export function getUniqueBrands(products: CleanedProduct[]): string[] {
  if (!products || products.length === 0) return [];
  const brands = [...new Set(products.map(p => p.brand).filter(b => b && b !== ''))];
  return brands.sort((a, b) => a.localeCompare(b, 'de'));
}

// ============================================================
// 11. EINDEUTIGE KATEGORIEN EXTRAHIEREN (für Filter)
// ============================================================
export function getUniqueCategories(products: CleanedProduct[]): string[] {
  if (!products || products.length === 0) return [];
  const categories = [...new Set(products.map(p => p.category).filter(c => c && c !== ''))];
  return categories.sort();
}

// ============================================================
// 12. PREIS SORTIERUNG (Hilfsfunktion)
// ============================================================
export function sortByPrice(products: CleanedProduct[], ascending: boolean = true): CleanedProduct[] {
  return [...products].sort((a, b) => {
    const priceA = parseFloat(a.price) || 0;
    const priceB = parseFloat(b.price) || 0;
    return ascending ? priceA - priceB : priceB - priceA;
  });
}

// ============================================================
// 13. FILTER NACH SUCHBEGRIFF (Hilfsfunktion)
// ============================================================
export function filterBySearch(products: CleanedProduct[], searchTerm: string): CleanedProduct[] {
  if (!searchTerm || searchTerm.length < 2) return products;
  const term = searchTerm.toLowerCase();
  return products.filter(p => 
    p.name.toLowerCase().includes(term) ||
    p.brand.toLowerCase().includes(term) ||
    p.category.toLowerCase().includes(term)
  );
}

// ============================================================
// 14. PRODUKT FÜR SUAPBASE VORBEREITEN
// ============================================================
export function prepareForSupabase(cleaned: CleanedProduct): any {
  const result: any = {};
  if (cleaned.id) result.id = cleaned.id;
  if (cleaned.name) result.name = cleaned.name;
  if (cleaned.brand) result.brand = cleaned.brand;
  if (cleaned.category) result.category = cleaned.category;
  if (cleaned.price) result.price = cleaned.price;
  if (cleaned.size) result.size = cleaned.size;
  if (cleaned.condition) result.condition = cleaned.condition;
  if (cleaned.vinted_url) result.vinted_url = cleaned.vinted_url;
  if (cleaned.images) result.images = cleaned.images;
  if (cleaned.sold !== undefined) result.sold = cleaned.sold;
  return result;
}
