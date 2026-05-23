// src/app/ProductClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Instagram, MessageCircle, ArrowRight, MapPin,
  Clock, Shield, ExternalLink, Search,
  LayoutGrid, List, Minimize2
} from 'lucide-react';
import { type ViewMode } from '@/components/ViewToggle';
import { ProductView } from '@/components/ProductView';
import { Navigation } from '@/components/Navigation';
import { DataPrivacy, useDataPrivacy } from '@/components/DataPrivacy';

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

interface ProductClientProps {
  initialProducts: any[];
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
  
  const [products, setProducts] = useState<Product[]>([]);
  const [uniqueBrands, setUniqueBrands] = useState<string[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Datenschutz Hook
  const { isOpen: isPrivacyOpen, setIsOpen: setIsPrivacyOpen } = useDataPrivacy();

  useEffect(() => {
    if (!initialProducts || initialProducts.length === 0) return;
    
    const normalized = initialProducts.map((p: any) => ({
      ...p,
      images: p.images || []
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

      {/* ABOUT SECTION */}
      <section id="about" className="py-24 bg-[var(--bg-secondary)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(255,68,0,0.03)_50%,transparent_51%)] bg-[length:20px_20px]" />
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">ABOUT_<span className="text-[#FF4400]">UNIT</span></h2>
              <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
                <p>SCND UNIT ist ein Curated Reselling-Projekt aus Bad Kreuznach. Wir suchen die besten Vintage-Pieces, Streetwear-Klassiker und Y2K-Schnäppchen – und bringen sie zu dir.</p>
                <p>Unser Fokus liegt auf ehrlichen Beschreibungen, schnellem Versand (innerhalb 48h) und einem sorgfältig ausgewählten Inventar. Von Gorpcore-Utility bis zu Vintage-Grails: Jedes Piece wird von uns geprüft und fotografiert.</p>
                <p className="text-[#FF4400] font-bold uppercase tracking-widest text-sm">Kein Fast Fashion – nur Qualität mit Geschichte.</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="aspect-square bg-[var(--bg-primary)] border border-[#FF4400]/20 p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl font-bold text-[#FF4400]/20 mb-4">SCND</div>
                  <div className="grid grid-cols-2 gap-4 text-sm uppercase tracking-widest">
                    <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)]"><span className="block text-2xl font-bold text-[#FF4400]">100%</span><span className="text-[var(--text-secondary)]">Authentic</span></div>
                    <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)]"><span className="block text-2xl font-bold text-[#FF4400]">48h</span><span className="text-[var(--text-secondary)]">Shipping</span></div>
                    <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)]"><span className="block text-2xl font-bold text-[#FF4400]">DE</span><span className="text-[var(--text-secondary)]">Based</span></div>
                    <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)]"><span className="block text-2xl font-bold text-[#FF4400]">{products.length}+</span><span className="text-[var(--text-secondary)]">Items</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">GET_IN_<span className="text-[#FF4400]">TOUCH</span></h2>
            <p className="text-[var(--text-secondary)] mb-12 uppercase tracking-widest">Fragen zu einem Artikel? Schreib uns auf Vinted oder Instagram.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#FF4400] text-white font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 transition-all">
                <MessageCircle className="w-5 h-5" />Nachricht auf Vinted
              </a>
              <a href="https://www.instagram.com/scnd.unit" target="_blank" className="group inline-flex items-center justify-center gap-3 px-8 py-4 border border-[var(--border-color)] hover:border-[#FF4400] hover:text-[#FF4400] transition-all uppercase tracking-widest">
                <Instagram className="w-5 h-5" />@scnd.unit
              </a>
            </div>
            <div className="mt-16 flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)] uppercase tracking-widest">
              <MapPin className="w-4 h-4 text-[#FF4400]" />Bad Kreuznach, Deutschland
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] py-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-bold tracking-tighter">
            <span className="text-[#FF4400]">SCND</span>_UNIT
          </div>
          <div className="flex gap-6 text-sm uppercase tracking-widest text-[var(--text-secondary)]">
            <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="hover:text-[#FF4400] transition-colors">Vinted</a>
            <a href="https://www.instagram.com/scnd.unit" target="_blank" className="hover:text-[#FF4400] transition-colors">Instagram</a>
            <Link href="/impressum" className="hover:text-[#FF4400] transition-colors">Impressum</Link>
            <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-[#FF4400] transition-colors cursor-pointer">
              Datenschutz
            </button>
          </div>
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">© 2025 SCND UNIT • Bad Kreuznach</p>
        </div>
      </footer>

      {/* Datenschutz Modal */}
      <DataPrivacy isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
}

export default ProductClient;
