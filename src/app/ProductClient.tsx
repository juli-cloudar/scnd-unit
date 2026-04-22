// src/app/ProductClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Instagram, MessageCircle, ArrowRight, MapPin,
  Clock, Shield, ExternalLink, Search,
  LayoutGrid, List, Minimize2
} from 'lucide-react';
import { type ViewMode } from '@/components/ViewToggle';
import { ProductView } from '@/components/ProductView';
import { Navigation } from '@/components/Navigation';
import { ScndDropGame } from '@/components/ScndDropGame';

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: string;
  size: string;
  condition: string;
  images: string[];  // ← KEIN null mehr!
  vinted_url: string;
  sold: boolean;
}

interface ProductClientProps {
  initialProducts: any[];  // ← any für Rohdaten aus Supabase
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export function ProductClient({ initialProducts }: ProductClientProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Alle");
  const [activeBrand, setActiveBrand] = useState("Alle");
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState("");
  
  // Normalisiere die Produkte: null → []
  const [products, setProducts] = useState<Product[]>([]);
  const [uniqueBrands, setUniqueBrands] = useState<string[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Daten normalisieren wenn initialProducts kommen
  useEffect(() => {
    if (!initialProducts || initialProducts.length === 0) return;
    
    // WICHTIG: images null → [] konvertieren
    const normalized = initialProducts.map((p: any) => ({
      ...p,
      images: p.images || []  // ← null wird zu []
    }));
    
    setProducts(normalized);
    
    const brands = [...new Set(normalized.map((p: Product) => p.brand).filter(Boolean))].sort();
    const categories = [...new Set(normalized.map((p: Product) => p.category).filter(Boolean))].sort();
    setUniqueBrands(brands);
    setUniqueCategories(categories);
  }, [initialProducts]);

  useEffect(() => {
    if (products.length === 0) return;
    setVisibleProducts(products.slice(0, 12));
    setIsLoadingMore(true);
    const timer = setTimeout(() => {
      setVisibleProducts(products);
      setIsLoadingMore(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [products]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fixedCategories = ['Jacken', 'Pullover', 'Sweatshirts', 'Tops', 'Sonstiges'];
  const allCategories = uniqueCategories.length > 0 ? ["Alle", ...uniqueCategories] : ["Alle", ...fixedCategories];
  const allBrands = ["Alle", ...uniqueBrands];
  
  const filteredProducts = (visibleProducts.length > 0 ? visibleProducts : products).filter(p => {
    if (activeBrand !== "Alle" && p.brand !== activeBrand) return false;
    if (activeCategory !== "Alle" && p.category !== activeCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brand.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const viewButtonClass = (mode: ViewMode) => `
    p-2 transition-all duration-200 rounded-sm
    ${viewMode === mode ? 'bg-[#FF4400] text-white' : 'bg-[var(--bg-secondary)] border border-[#FF4400]/30 text-gray-400 hover:text-[#FF4400]'}
  `;

  if (products.length === 0 && initialProducts?.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FF4400] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)] text-sm uppercase tracking-widest">Produkte werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      
      <Navigation scrolled={scrolled} />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.p variants={fadeIn} className="text-[#FF4400] text-sm uppercase tracking-[0.3em] mb-4">Bad Kreuznach, DE</motion.p>
            <motion.h1 variants={fadeIn} className="text-6xl md:text-9xl font-bold tracking-tighter mb-6">
              <span className="block">SCND</span>
              <span className="block text-[var(--bg-secondary)] [-webkit-text-stroke:2px_var(--text-primary)]">UNIT</span>
            </motion.h1>
            <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-4 text-sm uppercase tracking-widest text-[var(--text-secondary)] mb-8">
              <span>Streetwear</span><span className="text-[#FF4400]">•</span><span>Vintage</span><span className="text-[#FF4400]">•</span><span>Y2K</span><span className="text-[#FF4400]">•</span><span>Gorpcore</span>
            </motion.div>
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="group inline-flex items-center gap-2 px-8 py-4 bg-[#FF4400] text-white font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 transition-all">
                Browse Inventory <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#products" className="inline-flex items-center gap-2 px-8 py-4 border border-[var(--border-color)] hover:border-[#FF4400] hover:text-[#FF4400] transition-all uppercase tracking-widest">
                View Selection
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Info Bar */}
      <section className="border-y border-[var(--border-color)] bg-[var(--bg-primary)]">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-[var(--text-secondary)]">
              <Clock className="w-5 h-5 text-[#FF4400]" />Versand innerhalb 48h
            </div>
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-[var(--text-secondary)]">
              <Shield className="w-5 h-5 text-[#FF4400]" />Ehrliche Beschreibungen
            </div>
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-[var(--text-secondary)]">
              <MessageCircle className="w-5 h-5 text-[#FF4400]" />Schneller Support
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="w-full">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-[#FF4400]"></div>
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">Marken</p>
            </div>
            <div className="w-full overflow-x-auto scrollbar-custom">
              <div className="flex gap-2 min-w-max pb-2">
                {allBrands.map(b => (
                  <button key={b} onClick={() => setActiveBrand(b)} className={`px-4 py-2 text-xs whitespace-nowrap uppercase tracking-widest transition-all duration-200 rounded-sm ${activeBrand === b ? 'bg-[#FF4400] text-white' : 'bg-[var(--bg-secondary)] border border-[#FF4400]/20 text-[var(--text-secondary)] hover:border-[#FF4400] hover:text-[#FF4400]'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-[#FF4400]"></div>
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">Kategorien</p>
            </div>
            <div className="w-full overflow-x-auto scrollbar-custom">
              <div className="flex gap-2 min-w-max pb-2">
                {allCategories.map(c => (
                  <button key={c} onClick={() => setActiveCategory(c)} className={`px-4 py-2 text-xs whitespace-nowrap uppercase tracking-widest transition-all duration-200 rounded-sm ${activeCategory === c ? 'bg-[#FF4400] text-white' : 'bg-[var(--bg-secondary)] border border-[#FF4400]/20 text-[var(--text-secondary)] hover:border-[#FF4400] hover:text-[#FF4400]'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"/>
              <input type="text" placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-4 py-2 bg-[var(--bg-secondary)] border border-[#FF4400]/30 text-sm w-64 rounded-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"/>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <button onClick={() => setViewMode('grid')} className={viewButtonClass('grid')}><LayoutGrid className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('list')} className={viewButtonClass('list')}><List className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('compact')} className={viewButtonClass('compact')}><Minimize2 className="w-4 h-4" /></button>
              </div>
              <div className="text-xs text-[var(--text-secondary)]">{filteredProducts.length} von {products.length} Artikeln</div>
            </div>
          </div>
          
          <ProductView products={filteredProducts} viewMode={viewMode} />
          
          {isLoadingMore && visibleProducts.length < products.length && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#FF4400] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          <div className="mt-16 text-center">
            <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="inline-flex items-center gap-2 px-8 py-4 border border-[#FF4400] text-[#FF4400] hover:bg-[#FF4400] hover:text-white transition-all uppercase tracking-widest">
              Alle Artikel auf Vinted <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Den Rest (About, Game, Contact, Footer) aus deinem Original hier einfügen */}
      
    </div>
  );
}

export default ProductClient;
