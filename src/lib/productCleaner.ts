// src/lib/productCleaner.ts
'use client';

import { useState, useEffect } from 'react';
import { 
  cleanProduct as coreCleanProduct, 
  cleanMultipleProducts as coreCleanMultiple,
  prepareForSupabase as corePrepareForSupabase,
  type CleanedProduct, 
  type RawProductData 
} from './productCleanerCore';

// Re-exportiere alles für Client Components
export type { CleanedProduct, RawProductData };
export const cleanProduct = coreCleanProduct;
export const cleanMultipleProducts = coreCleanMultiple;
export const prepareForSupabase = corePrepareForSupabase;

/**
 * React Hook für die Verwendung in Komponenten
 */
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

    const cleaned = products.map(p => coreCleanProduct(p));
    setCleanedProducts(cleaned);

    const brands = [...new Set(cleaned.map(p => p.brand).filter(Boolean))];
    setUniqueBrands(brands.sort());

    const categories = [...new Set(cleaned.map(p => p.category).filter(Boolean))];
    setUniqueCategories(categories.sort());

  }, [products]);

  return { cleanedProducts, uniqueBrands, uniqueCategories };
}
