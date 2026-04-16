// src/components/ProductGrid.tsx
'use client';

import { ProductView } from '@/components/ProductView';
import type { ViewMode } from '@/components/ViewToggle';

interface ProductGridProps {
  products: any[];
  viewMode: ViewMode;
}

export function ProductGrid({ products, viewMode }: ProductGridProps) {
  const getGridClasses = () => {
    switch (viewMode) {
      case 'grid':
        return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6';
      case 'list':
        return 'grid grid-cols-1 gap-4';
      case 'compact':
        return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4';
      default:
        return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6';
    }
  };

  return (
    <div className={getGridClasses()}>
      <ProductView products={products} viewMode={viewMode} />
    </div>
  );
}
