'use client';

import { ExternalLink } from 'lucide-react';
import { ImageSlider } from './ImageSlider';
import type { ViewMode } from './ViewToggle';

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: string;
  size: string;
  condition: string;
  images: string[];
  vinted_url: string;
  sold: boolean;
}

interface ProductViewProps {
  products: Product[];
  viewMode: ViewMode;
}

export function ProductView({ products, viewMode }: ProductViewProps) {
  const formatPrice = (price: string) => {
    const numericPrice = price.replace(/[^0-9,.-]/g, '');
    return numericPrice;
  };

  // Grid Ansicht - Volle Breite mit mehr Spalten
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {products.map((product) => (
          <div 
            key={product.id} 
            onClick={() => window.location.href = `/products/${product.id}`}
            className="group relative bg-[#1A1A1A] overflow-hidden hover:ring-2 hover:ring-[#FF4400] transition-all cursor-pointer"
          >
            <ImageSlider images={product.images} alt={product.name} condition={product.condition} />
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div className="min-w-0 pr-2">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{product.brand || product.category}</p>
                  <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-[#FF4400] transition-colors leading-tight">{product.name}</h3>
                </div>
                <span className="text-xl font-bold text-[#FF4400] shrink-0">{formatPrice(product.price)}€</span>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#0A0A0A]">
                <span className="text-sm text-gray-400 uppercase tracking-widest">{product.size !== "–" ? `Size ${product.size}` : ""}</span>
                <span className="inline-flex items-center gap-1 text-sm uppercase tracking-widest text-[#FF4400] group-hover:gap-2 transition-all">
                  Details <ExternalLink className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Listen Ansicht
  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {products.map((product) => (
          <div 
            key={product.id} 
            onClick={() => window.location.href = `/products/${product.id}`}
            className="flex gap-4 bg-[#1A1A1A] p-4 hover:ring-1 hover:ring-[#FF4400] transition-all cursor-pointer group"
          >
            <div className="w-24 h-24 shrink-0 bg-[#0A0A0A] overflow-hidden">
              <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-widest">{product.brand || product.category}</p>
              <h3 className="font-bold truncate group-hover:text-[#FF4400] transition-colors">{product.name}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="text-[#FF4400] font-bold">{formatPrice(product.price)}€</span>
                <span className="text-xs text-gray-500">{product.size !== "–" && `Size ${product.size}`}</span>
              </div>
            </div>
            <div className="shrink-0 p-2 border border-[#FF4400]/30 text-[#FF4400] group-hover:bg-[#FF4400]/10 transition-all">
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Kompakt Ansicht - Volle Breite mit mehr Spalten
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
      {products.map((product) => (
        <div 
          key={product.id} 
          onClick={() => window.location.href = `/products/${product.id}`}
          className="bg-[#1A1A1A] p-2 hover:ring-1 hover:ring-[#FF4400] transition-all text-center cursor-pointer group"
        >
          <div className="aspect-square bg-[#0A0A0A] overflow-hidden mb-1">
            <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <p className="text-xs font-bold truncate group-hover:text-[#FF4400] transition-colors">{product.name}</p>
          <p className="text-xs text-[#FF4400]">{formatPrice(product.price)}€</p>
        </div>
      ))}
    </div>
  );
}
