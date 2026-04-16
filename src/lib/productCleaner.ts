// src/lib/productCleaner.ts
// KEIN 'use client' - reine Logik für API und Frontend

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

const KNOWN_BRANDS = [
  'Tommy Hilfiger', 'Helly Hansen', 'The North Face', 'New Balance',
  'Adidas', 'Nike', 'Puma', 'Champion', 'Columbia', 'FILA', 
  'Napapijri', 'Lee Sport', 'Lee', 'L.L.Bean', 'Timberland',
  'Reebok', 'Lacoste', 'Wrangler', 'Bexleys', 'U.S. Polo Assn',
  'Starter', 'NBA', 'NFL', 'Carhartt', 'Dickies', 'Vans', 'Converse',
  'Olympique Marseille'
];

const TYPO_FIXES: Record<string, string> = {
  'chwarz': 'Schwarz', 'woosh': 'Swoosh', 'weater': 'Sweater',
  'weatshirt': 'Sweatshirt', 'weather': 'Sweater', 'port': 'Sport',
  'adidas': 'Adidas', 'nike': 'Nike', 'puma': 'Puma', 'tommy': 'Tommy',
  'hilfiger': 'Hilfiger', 'treewear': 'Streetwear', 'ogro': 'Logo',
  'tripe': 'Stripe'
};

const REMOVE_WORDS = ['Vintage', 'Streetwear', 'Clean', 'Oversize', 'Essential', 'Basic', 'Pullover', 'Sweatshirt', 'Jacket'];

export function cleanProduct(rawData: any): CleanedProduct {
  const originalId = rawData.id;
  let name = rawData.name || rawData.title || '';
  
  // 1. Rechtschreibung korrigieren
  for (const [wrong, correct] of Object.entries(TYPO_FIXES)) {
    name = name.replace(new RegExp(wrong, 'gi'), correct);
  }
  
  // 2. Marke erkennen
  let brand = rawData.brand || '';
  if (!brand) {
    for (const knownBrand of KNOWN_BRANDS) {
      if (name.match(new RegExp(`^${knownBrand}\\s|\\s${knownBrand}\\s`, 'i'))) {
        brand = knownBrand;
        name = name.replace(new RegExp(`^${knownBrand}\\s+|\\s${knownBrand}\\s+`, 'gi'), ' ');
        break;
      }
    }
  }
  if (!brand) {
    brand = name.split(' ')[0];
    name = name.replace(new RegExp(`^${brand}\\s+`, 'i'), '');
  }
  
  // 3. Größe extrahieren
  let size = rawData.size || '';
  const sizeMatch = name.match(/\b(XXL|XL|L|M|S|XS)\b/i);
  if (sizeMatch && !size) {
    size = sizeMatch[1].toUpperCase();
    name = name.replace(new RegExp(`\\b${size}\\b`, 'i'), '');
  }
  
  // 4. Kategorie bestimmen
  let category = rawData.category || '';
  if (!category) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('sweatshirt') || lowerName.includes('crewneck')) category = 'Sweatshirts';
    else if (lowerName.includes('jacke') || lowerName.includes('jacket') || lowerName.includes('fleece') || lowerName.includes('track')) category = 'Jacken';
    else if (lowerName.includes('polo')) category = 'Polos';
    else if (lowerName.includes('top') || lowerName.includes('cropped')) category = 'Tops';
    else category = 'Pullover';
  }
  
  // 5. Überflüssige Wörter entfernen
  for (const word of REMOVE_WORDS) {
    name = name.replace(new RegExp(`\\s*${word}\\s*`, 'gi'), ' ');
  }
  
  // 6. Preis bereinigen
  let price = rawData.price?.toString() || '0';
  price = price.replace('€', '').replace(',', '.').trim();
  
  // 7. Condition bereinigen
  let condition = rawData.condition || 'Gut';
  const conditionMap: Record<string, string> = {
    'neu': 'Neu', 'new': 'Neu', 'sehr gut': 'Sehr gut', 'very good': 'Sehr gut',
    'gut': 'Gut', 'good': 'Gut', 'zufriedenstellend': 'Zufriedenstellend'
  };
  condition = conditionMap[condition.toLowerCase()] || condition;
  
  // 8. Finale Bereinigung
  name = name.replace(/\s+/g, ' ').trim();
  if (!name) name = 'Unbenanntes Produkt';
  
  return {
    id: originalId,
    name,
    brand,
    category,
    price,
    size,
    condition,
    vinted_url: rawData.vinted_url || '',
    images: rawData.images || null,
    sold: rawData.sold || false
  };
}

export function cleanMultipleProducts(products: any[]): CleanedProduct[] {
  return products.map(p => cleanProduct(p));
}

export function getUniqueBrands(products: CleanedProduct[]): string[] {
  return [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
}

export function getUniqueCategories(products: CleanedProduct[]): string[] {
  return [...new Set(products.map(p => p.category).filter(Boolean))].sort();
}
