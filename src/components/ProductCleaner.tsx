// src/components/ProductCleaner.tsx
'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  brand?: string;
  description?: string;
  size?: string;
  price: string;
  vinted_url: string;
  sold: boolean;
}

export interface CleanedProduct extends Product {
  cleaned_name: string;
  extracted_brand: string;
  extracted_description: string;
  extracted_size: string;
}

// Vollständige Markenliste (längere zuerst, damit "Tommy Hilfiger" vor "Hilfiger" erkannt wird)
const KNOWN_BRANDS = [
  'Tommy Hilfiger', 'The North Face', 'Helly Hansen', 'New Balance',
  'U.S. Polo Assn.', 'Reebok x NHL', 'Olympique Marseille', 'La Martina',
  'Bernd Berger', 'Henry Morell', 'L.L.Bean', 'Lee Sport', 'Pitstop Jeans',
  'Ralph Lauren', 'Realtree', 'Atlas for Men', 'Columbia', 'Champion',
  'Napapijri', 'Timberland', 'Lacoste', 'Wrangler', 'Bexleys', 'Starter',
  'Ellesse', 'Pegador', 'Adidas', 'Nike', 'Puma', 'FILA', 'Reebok', 'Lee',
  'NBA', 'NFL', 'LLBean', 'Carhartt', 'Dickies', 'Vans', 'Converse',
  'Supreme', 'Patagonia', 'North Face', 'Hilfiger', 'Polo', 'Tommy',
  'NHL', 'Y2K', 'AT'
].sort((a, b) => b.length - a.length);

// **Nur echte Kleidungsgrößen** – keine "Jahre", kein "Not Available"
const SIZE_PATTERNS = [
  /\b(XXXL|XXL|XL|L|M|S|XS|XXS)\b/i,                     // Buchstabengrößen
  /\b(Einheitsgröße|One Size|OSFM)\b/i,                  // Einheitsgrößen
  /\b([0-9]{2,3})\s*\/\s*[0-9]+\b/,                     // z.B. "36/8" (extrahiert nur die erste Zahl)
  /\b([0-9]{2,3})(?:\s*(cm|mm))?\b/                     // reine Zahlen wie 36, 38, 40 (ohne "Jahre" im Kontext)
];

// Extrahiert die erste gefundene Größe aus einem String
function extractSize(text: string): string {
  for (const pattern of SIZE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      // Bei gematchten Gruppen wie "36/8" nimm die erste Zahl
      let size = match[0];
      if (match[1] && !isNaN(parseInt(match[1]))) {
        size = match[1];
      }
      return size.toUpperCase();
    }
  }
  return '';
}

export function cleanProductName(rawName: string): {
  brand: string;
  description: string;
  size: string;
  cleaned: string;
} {
  if (!rawName) {
    return { brand: '', description: '', size: '', cleaned: '' };
  }

  let remaining = rawName.trim();
  let detectedBrand = '';

  // 1. Marke erkennen (überall im Namen, als ganzes Wort)
  for (const brand of KNOWN_BRANDS) {
    const brandEscaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${brandEscaped}\\b`, 'i');
    if (regex.test(remaining)) {
      detectedBrand = brand;
      remaining = remaining.replace(regex, '').trim();
      break;
    }
  }

  // Fallback: erstes Wort als Marke, wenn nichts gefunden und String nicht leer
  if (!detectedBrand && remaining.length > 0) {
    const words = remaining.split(/\s+/);
    if (words.length > 0) {
      detectedBrand = words[0];
      remaining = remaining.slice(detectedBrand.length).trim();
    } else {
      detectedBrand = remaining;
      remaining = '';
    }
  }

  // 2. Größe extrahieren (aus dem gesamten ursprünglichen Namen, falls in Marke versteckt)
  let detectedSize = extractSize(rawName);
  if (!detectedSize) {
    detectedSize = extractSize(remaining);
  }
  // Größe aus dem verbleibenden Text entfernen (falls vorhanden)
  if (detectedSize) {
    const sizeRegex = new RegExp(`\\b${detectedSize.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    remaining = remaining.replace(sizeRegex, '').trim();
  }

  // 3. Beschreibung: Mehrfachleerzeichen entfernen, keine automatischen Buchstaben!
  let description = remaining.replace(/\s+/g, ' ').trim();
  // Achtung: Hier wird NICHT "schwarz" zu "sschwarz" geändert.
  // Falls du alten Code hattest, der das tat, ist dieser Bug jetzt behoben.

  // 4. Bereinigten Namen zusammensetzen
  let cleaned = `${detectedBrand} ${description}`.trim();
  if (detectedSize) cleaned += ` (${detectedSize})`;

  return {
    brand: detectedBrand,
    description: description,
    size: detectedSize,
    cleaned: cleaned
  };
}

// Component mit Render-Props
export function ProductCleaner({ 
  products, 
  children 
}: { 
  products: Product[];
  children: (cleanedProducts: CleanedProduct[], uniqueBrands: string[]) => React.ReactNode;
}) {
  const [cleanedProducts, setCleanedProducts] = useState<CleanedProduct[]>([]);
  const [uniqueBrands, setUniqueBrands] = useState<string[]>([]);

  useEffect(() => {
    if (!products || products.length === 0) return;

    const cleaned = products.map(product => {
      const cleaned = cleanProductName(product.name);
      return {
        ...product,
        cleaned_name: cleaned.cleaned,
        extracted_brand: cleaned.brand,
        extracted_description: cleaned.description,
        extracted_size: cleaned.size
      };
    });

    setCleanedProducts(cleaned);

    const brands = new Set<string>();
    cleaned.forEach(p => {
      if (p.extracted_brand) brands.add(p.extracted_brand);
    });
    setUniqueBrands(Array.from(brands).sort());
  }, [products]);

  return <>{children(cleanedProducts, uniqueBrands)}</>;
}

// Hook-Variante
export function useProductCleaner(products: Product[]) {
  const [cleanedProducts, setCleanedProducts] = useState<CleanedProduct[]>([]);
  const [uniqueBrands, setUniqueBrands] = useState<string[]>([]);

  useEffect(() => {
    if (!products || products.length === 0) return;

    const cleaned = products.map(product => {
      const cleaned = cleanProductName(product.name);
      return {
        ...product,
        cleaned_name: cleaned.cleaned,
        extracted_brand: cleaned.brand,
        extracted_description: cleaned.description,
        extracted_size: cleaned.size
      };
    });

    setCleanedProducts(cleaned);
    const brands = new Set<string>();
    cleaned.forEach(p => {
      if (p.extracted_brand) brands.add(p.extracted_brand);
    });
    setUniqueBrands(Array.from(brands).sort());
  }, [products]);

  return { cleanedProducts, uniqueBrands };
}
