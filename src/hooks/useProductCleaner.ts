// src/hooks/useProductCleaner.ts
'use client';

import { useState, useEffect } from 'react';
import { 
  cleanMultipleProducts, 
  getUniqueBrands, 
  getUniqueCategories,
  type CleanedProduct 
} from '@/lib/productCleaner';

export function useProductCleaner(products: any[]) {
  const [cleanedProducts, setCleanedProducts] = useState<CleanedProduct[]>([]);
  const [uniqueBrands, setUniqueBrands] = useState<string[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!products || products.length === 0) {
      setCleanedProducts([]);
      setUniqueBrands([]);
      setUniqueCategories([]);
      setLoading(false);
      return;
    }

    // Bereinigen
    const cleaned = cleanMultipleProducts(products);
    setCleanedProducts(cleaned);
    
    // Eindeutige Werte extrahieren (KEINE DUPLIKATE!)
    setUniqueBrands(getUniqueBrands(cleaned));
    setUniqueCategories(getUniqueCategories(cleaned));
    setLoading(false);
    
  }, [products]);

  return { cleanedProducts, uniqueBrands, uniqueCategories, loading };
}
