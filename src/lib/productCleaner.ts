// src/lib/productCleaner.ts

// Bekannte Marken (für Erkennung)
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

// Überflüssige Wörter die entfernt werden sollen
const REMOVE_WORDS = [
  'Pullover', 'Sweatshirt', 'Jacket', 'Vintage', 
  'Streetwear', 'Crewneck', 'Nike Fit', 'Sweater Oversize'
];

interface CleanedProduct {
  name: string;           // Nur Produktname (ohne Marke)
  brand: string;          // Nur die Marke
  category: string;       // Kategorie
  price: string;          // Preis ohne €
  size: string;           // Größe
  condition: string;      // Zustand
  vinted_url: string;     // Vinted URL
  images: string[] | null; // Bilder
  sold: boolean;          // Verkauft status
}

interface RawProductData {
  name?: string;
  title?: string;
  brand?: string;
  category?: string;
  price?: string | number;
  size?: string;
  condition?: string;
  vinted_url?: string;
  images?: string[] | null;
  sold?: boolean;
}

/**
 * Hauptfunktion: Bereinigt ein einzelnes Produkt
 */
export function cleanProduct(rawData: RawProductData): CleanedProduct {
  // 1. Original Name holen
  let originalName = rawData.name || rawData.title || '';
  
  // 2. Rechtschreibfehler korrigieren
  let cleanedName = originalName;
  for (const [wrong, correct] of Object.entries(TYPO_FIXES)) {
    cleanedName = cleanedName.replace(new RegExp(wrong, 'gi'), correct);
  }
  
  // 3. Marke erkennen und entfernen
  let brand = rawData.brand || '';
  
  // Wenn keine Marke angegeben, versuche sie aus dem Namen zu extrahieren
  if (!brand) {
    for (const knownBrand of KNOWN_BRANDS) {
      if (cleanedName.match(new RegExp(`^${knownBrand}\\s|\\s${knownBrand}\\s|\\s${knownBrand}$`, 'i'))) {
        brand = knownBrand;
        // Entferne Marke aus dem Namen
        cleanedName = cleanedName.replace(new RegExp(`^${knownBrand}\\s+|\\s${knownBrand}\\s+|\\s${knownBrand}$`, 'gi'), ' ');
        break;
      }
    }
  }
  
  // 4. Größe extrahieren
  let size = rawData.size || '';
  const sizePattern = /\b(XXL|XL|L|M|S|XS|XXXL|34\/6|36\/8|38\/10|40\/12)\b/i;
  const sizeMatch = cleanedName.match(sizePattern);
  if (sizeMatch && !size) {
    size = sizeMatch[1].toUpperCase();
    cleanedName = cleanedName.replace(sizePattern, '');
  }
  
  // 5. Kategorie bestimmen
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
  
  // 6. Überflüssige Wörter entfernen
  for (const word of REMOVE_WORDS) {
    cleanedName = cleanedName.replace(new RegExp(`\\s*${word}\\s*`, 'gi'), ' ');
  }
  
  // 7. Preis bereinigen
  let price = rawData.price?.toString() || '0';
  price = price.replace('€', '').replace(',', '.').trim();
  
  // 8. Condition bereinigen
  let condition = rawData.condition || 'Gut';
  const conditionMap: { [key: string]: string } = {
    'neu': 'Neu',
    'new': 'Neu',
    'sehr gut': 'Sehr gut',
    'very good': 'Sehr gut',
    'gut': 'Gut',
    'good': 'Gut',
    'zufriedenstellend': 'Zufriedenstellend'
  };
  const lowerCondition = condition.toLowerCase();
  condition = conditionMap[lowerCondition] || condition;
  
  // 9. Name final bereinigen (doppelte Leerzeichen entfernen, trimmen)
  cleanedName = cleanedName.replace(/\s+/g, ' ').trim();
  
  return {
    name: cleanedName,
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
 * Bereinigt mehrere Produkte auf einmal
 */
export function cleanMultipleProducts(products: RawProductData[]): CleanedProduct[] {
  return products.map(product => cleanProduct(product));
}

/**
 * Bereinigt und bereitet Produkte für Supabase vor (entfernt leere Felder)
 */
export function prepareForSupabase(cleaned: CleanedProduct): any {
  const result: any = {};
  
  // Nur Felder mit Werten übernehmen
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

/**
 * React Hook für die Verwendung in Komponenten
 */
import { useState, useEffect } from 'react';
export function useProductCleaner(products: RawProductData[]) {
  const [cleanedProducts, setCleanedProducts] = useState<CleanedProduct[]>([]);
  const [uniqueBrands, setUniqueBrands] = useState<string[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!products || products.length === 0) {
      setCleanedProducts([]);
      setUniqueBrands([]);
      setUniqueCategories([]);
      return;
    }

    const cleaned = products.map(p => cleanProduct(p));
    setCleanedProducts(cleaned);

    // Eindeutige Marken extrahieren
    const brands = [...new Set(cleaned.map(p => p.brand).filter(Boolean))];
    setUniqueBrands(brands.sort());

    // Eindeutige Kategorien extrahieren
    const categories = [...new Set(cleaned.map(p => p.category).filter(Boolean))];
    setUniqueCategories(categories.sort());

  }, [products]);

  return { cleanedProducts, uniqueBrands, uniqueCategories };
}
