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

interface CleanedProduct extends Product {
  cleaned_name: string;
  extracted_brand: string;
  extracted_description: string;
  extracted_size: string;
}

// Bekannte Marken
const KNOWN_BRANDS = [
  'L.L.BEAN', 'ADIDAS', 'NIKE', 'TOMMY HILFIGER', 'CHAMPION',
  'COLUMBIA', 'PUMA', 'FILA', 'NAPAPIJRI', 'HELLY HANSEN',
  'THE NORTH FACE', 'NEW BALANCE', 'STARTER', 'LEE', 'TIMBERLAND',
  'REEBOK', 'LACOSTE', 'WRANGLER', 'BEXLEYS', 'U.S. POLO ASSN',
  'STARTER', 'NBA', 'NFL', 'LEE SPORT', 'COLUMBIA'
];

// Funktion zum Bereinigen von Produktnamen
function cleanProductName(rawName: string): {
  brand: string;
  description: string;
  size: string;
  cleaned: string;
} {
  if (!rawName) {
    return { brand: '', description: '', size: '', cleaned: '' };
  }

  const upperName = rawName.toUpperCase();
  let brand = '';

  // Marke erkennen
  for (const knownBrand of KNOWN_BRANDS) {
    if (upperName.startsWith(knownBrand)) {
      brand = knownBrand;
      break;
    }
  }

  // Wenn keine Marke gefunden, nimm das erste Wort
  if (!brand) {
    const firstWord = rawName.split(' ')[0];
    brand = firstWord;
  }

  // Rest nach der Marke
  let rest = rawName.slice(brand.length).trim();

  // Entferne doppelte Marke (z.B. "ADIDAS ADIDAS Fleece")
  const brandRegex = new RegExp(`^${brand}\\s+`, 'i');
  rest = rest.replace(brandRegex, '');

  // Größen erkennen
  const sizePatterns = [
    /\b(XXL|XL|L|M|S|XS|XXXL)\b/i,
    /\b(34\/6|36\/8|38\/10|40\/12|42\/14)\b/i,
    /\b(\d+ JAHRE|\d+ \/ \d+)\b/i,
    /\b(ONE SIZE|OSFM)\b/i
  ];

  let size = '';
  for (const pattern of sizePatterns) {
    const match = rest.match(pattern);
    if (match) {
      size = match[1].toUpperCase();
      rest = rest.replace(pattern, '').trim();
      break;
    }
  }

  // Mehrfache Leerzeichen entfernen
  const description = rest.replace(/\s+/g, ' ').trim();

  return {
    brand: brand,
    description: description,
    size: size,
    cleaned: `${brand} ${description}${size ? ` (${size})` : ''}`.trim()
  };
}

// Hauptcomponent
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

    // Bereinige alle Produkte
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

    // Extrahiere eindeutige Marken (ohne Duplikate)
    const brands = new Map<string, string>();
    
    cleaned.forEach(product => {
      const brandName = product.extracted_brand;
      if (brandName) {
        const key = brandName.toUpperCase();
        if (!brands.has(key)) {
          brands.set(key, brandName);
        }
      }
    });

    const sortedBrands = Array.from(brands.values()).sort();
    setUniqueBrands(sortedBrands);
    
  }, [products]);

  return <>{children(cleanedProducts, uniqueBrands)}</>;
}

// Hook für einfachere Nutzung
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

    const brands = new Map<string, string>();
    cleaned.forEach(product => {
      const brandName = product.extracted_brand;
      if (brandName) {
        const key = brandName.toUpperCase();
        if (!brands.has(key)) {
          brands.set(key, brandName);
        }
      }
    });

    setUniqueBrands(Array.from(brands.values()).sort());
  }, [products]);

  return { cleanedProducts, uniqueBrands };
}
