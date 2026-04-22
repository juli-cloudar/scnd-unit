'use client';

import { useState, useEffect } from 'react';
import { Search, ExternalLink, Package, DollarSign, Calendar, Eye, EyeOff } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: string;
  size: string;
  condition: string;
  images: string[] | null;
  vinted_url: string;
  sold: boolean;
  created_at: string;
}

export function SoldProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [selectedBrand, setSelectedBrand] = useState('Alle');
  const [showImages, setShowImages] = useState(false);

  // Verkaufte Produkte laden
  useEffect(() => {
    async function fetchSoldProducts() {
      try {
        const response = await fetch('/api/products?sold=true');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Fehler beim Laden:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSoldProducts();
  }, []);

  // Eindeutige Kategorien und Marken
  const categories = ['Alle', ...new Set(products.map(p => p.category).filter(Boolean))];
  const brands = ['Alle', ...new Set(products.map(p => p.brand).filter(Boolean))];

  // Filterung
  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'Alle' && p.category !== selectedCategory) return false;
    if (selectedBrand !== 'Alle' && p.brand !== selectedBrand) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && 
        !p.brand.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Formatierung
  const formatPrice = (price: string) => {
    return price.replace('.', ',');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FF4400] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verkaufte Artikel werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tighter">
                <span className="text-[#FF4400]">VERKAUFT</span>_ARCHIV
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {products.length} verkaufte Artikel insgesamt
              </p>
            </div>
            
            <button
              onClick={() => setShowImages(!showImages)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 rounded-sm hover:border-[#FF4400] transition-all text-sm"
            >
              {showImages ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showImages ? 'Bilder ausblenden' : 'Bilder anzeigen'}
            </button>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="sticky top-[88px] z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4">
            {/* Suche */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Suchen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF4400] transition-colors"
                />
              </div>
            </div>

            {/* Kategorie Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-sm text-white focus:outline-none focus:border-[#FF4400]"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Marken Filter */}
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-sm text-white focus:outline-none focus:border-[#FF4400]"
            >
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Produktliste */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Keine verkauften Artikel gefunden</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-gray-900/50 border border-gray-800 rounded-sm hover:border-gray-700 transition-all overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Bild (optional) */}
                    {showImages && product.images && product.images[0] && (
                      <div className="w-20 h-20 shrink-0 bg-gray-800 rounded-sm overflow-hidden">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-400 uppercase tracking-wider">
                              {product.brand}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-800 rounded-sm text-gray-400">
                              {product.category}
                            </span>
                            {product.size && (
                              <span className="text-xs px-2 py-0.5 bg-gray-800 rounded-sm text-gray-400">
                                Größe {product.size}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold mt-1 group-hover:text-[#FF4400] transition-colors">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-[#FF4400]" />
                              {formatPrice(product.price)}€
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(product.created_at)}
                            </span>
                            <span className="px-2 py-0.5 bg-red-900/50 text-red-400 text-xs rounded-sm">
                              VERKAUFT
                            </span>
                          </div>
                        </div>
                        
                        {/* Vinted Link */}
                        {product.vinted_url && (
                          <a
                            href={product.vinted_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm transition-all text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Auf Vinted ansehen
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
