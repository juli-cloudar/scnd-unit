// src/lib/productCleaner.ts
// Diese Datei hat KEIN 'use client' und KEINE React Hooks!
// Sie kann überall verwendet werden (API Routes + Client Components)

// Bekannte Marken
const KNOWN_BRANDS = [
  'Tommy Hilfiger', 'Helly Hansen', 'The North Face', 'New Balance',
  'Adidas', 'Nike', 'Puma', 'Champion', 'Columbia', 'FILA', 
  'Napapijri', 'Lee Sport', 'Lee', 'L.L.Bean', 'Timberland',
  'Reebok', 'Lacoste', 'Wrangler', 'Bexleys', 'U.S. Polo Assn',
  'Starter', 'NBA', 'NFL', 'Carhartt', 'Dickies', 'Vans', 'Converse'
];

// Häufige Rechtschreibfehler
const TYPO_FIXES: { [key: string]: string } = {
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
  'hilfiger': 'Hilfiger'
};

// Überflüssige Wörter
const REMOVE_WORDS = ['Pullover', 'Sweatshirt', 'Jacket', 'Vintage', 'Streetwear', 'Crewneck', 'Nike Fit'];

export interface CleanedProduct {
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

/**
 * Bereinigt ein einzelnes Produkt
 */
export function cleanProduct(rawData: any): CleanedProduct {
  let originalName = rawData.name || rawData.title || '';
  
  // 1. Rechtschreibfehler korrigieren
  let cleanedName = originalName;
  for (const [wrong, correct] of Object.entries(TYPO_FIXES)) {
    cleanedName = cleanedName.replace(new RegExp(wrong, 'gi'), correct);
  }
  
  // 2. Marke erkennen und entfernen
  let brand = rawData.brand || '';
  if (!brand) {
    for (const knownBrand of KNOWN_BRANDS) {
      if (cleanedName.match(new RegExp(`^${knownBrand}\\s|\\s${knownBrand}\\s|\\s${knownBrand}$`, 'i'))) {
        brand = knownBrand;
        cleanedName = cleanedName.replace(new RegExp(`^${knownBrand}\\s+|\\s${knownBrand}\\s+|\\s${knownBrand}$`, 'gi'), ' ');
        break;
      }
    }
  }
  
  // 3. Größe extrahieren
  let size = rawData.size || '';
  const sizePattern = /\b(XXL|XL|L|M|S|XS|XXXL|34\/6|36\/8|38\/10|40\/12)\b/i;
  const sizeMatch = cleanedName.match(sizePattern);
  if (sizeMatch && !size) {
    size = sizeMatch[1].toUpperCase();
    cleanedName = cleanedName.replace(sizePattern, '');
  }
  
  // 4. Kategorie bestimmen
  let category = rawData.category || '';
  if (!category) {
    const lowerName = cleanedName.toLowerCase();
    if (lowerName.includes('sweatshirt') || lowerName.includes('crewneck')) category = 'Sweatshirts';
    else if (lowerName.includes('jacke') || lowerName.includes('jacket') || lowerName.includes('fleece')) category = 'Jacken';
    else if (lowerName.includes('polo')) category = 'Polos';
    else if (lowerName.includes('weste')) category = 'Westen';
    else if (lowerName.includes('top') || lowerName.includes('cropped')) category = 'Tops';
    else category = 'Pullover';
  }
  
  // 5. Überflüssige Wörter entfernen
  for (const word of REMOVE_WORDS) {
    cleanedName = cleanedName.replace(new RegExp(`\\s*${word}\\s*`, 'gi'), ' ');
  }
  
  // 6. Preis bereinigen
  let price = rawData.price?.toString() || '0';
  price = price.replace('€', '').replace(',', '.').trim();
  
  // 7. Condition bereinigen
  let condition = rawData.condition || 'Gut';
  const conditionMap: { [key: string]: string } = {
    'neu': 'Neu', 'new': 'Neu', 'sehr gut': 'Sehr gut', 'very good': 'Sehr gut',
    'gut': 'Gut', 'good': 'Gut', 'zufriedenstellend': 'Zufriedenstellend'
  };
  condition = conditionMap[condition.toLowerCase()] || condition;
  
  // 8. Name final bereinigen
  cleanedName = cleanedName.replace(/\s+/g, ' ').trim();
  
  return {
    name: cleanedName || originalName,
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

/**
 * Bereinigt mehrere Produkte
 */
export function cleanMultipleProducts(products: any[]): CleanedProduct[] {
  return products.map(p => cleanProduct(p));
}

/**
 * Extrahiert eindeutige Marken aus Produkten (für Filter)
 * Das ist eine reine Funktion, KEIN React Hook!
 */
export function getUniqueBrands(products: CleanedProduct[]): string[] {
  return [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
}

/**
 * Extrahiert eindeutige Kategorien aus Produkten
 */
export function getUniqueCategories(products: CleanedProduct[]): string[] {
  return [...new Set(products.map(p => p.category).filter(Boolean))].sort();
}
