// src/app/ProductClient.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { 
  Instagram, MessageCircle, ArrowRight, MapPin,
  Clock, Shield, ExternalLink, Search,
  LayoutGrid, List, Minimize2, Sparkles
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

// ========== MAGNETIC BUTTON COMPONENT ==========
function MagneticButton({ children, href, onClick, className }: { 
  children: React.ReactNode; 
  href?: string; 
  onClick?: () => void; 
  className?: string 
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
      setPosition({ x, y });
    }
  };

  const handleMouseLeave = () => setPosition({ x: 0, y: 0 });

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={className}
        onMouseMove={handleMouseMove as any}
        onMouseLeave={handleMouseLeave}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        {children}
      </button>
    );
  }

  return (
    <a
      ref={ref}
      href={href || '#'}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      {children}
    </a>
  );
}

// ========== REVEAL ON SCROLL SETUP ==========
function useRevealOnScroll() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
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

  // Typewriter Effect für Hero Tags
  const [heroTextIndex, setHeroTextIndex] = useState(0);
  const heroWords = ['STREETWEAR', 'VINTAGE', 'Y2K', 'GORPCORE'];

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroTextIndex((prev) => (prev + 1) % heroWords.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Reveal on Scroll aktivieren
  useRevealOnScroll();

  // Parallax scroll values
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

  // Products initialisieren
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

  // Lazy Loading für Produkte
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

  // Scroll State für Navigation
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
    p-2 transition-all duration-200 rounded-full
    ${viewMode === mode ? 'bg-[#FF4400] text-white shadow-lg shadow-[#FF4400]/30' : 'bg-[var(--bg-secondary)] border border-[#FF4400]/30 text-gray-400 hover:text-[#FF4400]'}
  `;

  if (products.length === 0 && initialProducts?.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FF4400] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)] text-sm uppercase tracking-widest animate-pulse">Produkte werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-[var(--text-primary)] font-sans overflow-x-hidden noise">
      
      {/* Floating Background Blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <Navigation scrolled={scrolled} />

      {/* Hero Section mit Parallax */}
      <motion.section 
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 text-center z-10">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            
            <motion.p 
              variants={fadeIn}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[#FF4400] text-sm uppercase tracking-[0.3em] mb-4"
            >
              Bad Kreuznach, DE
            </motion.p>
            
            <motion.h1 variants={fadeIn} className="text-6xl md:text-9xl font-bold tracking-tighter mb-6">
              <span className="block bg-gradient-to-r from-white via-[#FF4400] to-white bg-clip-text text-transparent bg-300% animate-gradient">SCND</span>
              <span className="block text-[var(--bg-secondary)] [-webkit-text-stroke:2px_var(--text-primary)] relative">
                UNIT
                <span className="absolute -inset-1 blur-xl bg-[#FF4400]/20 rounded-full -z-10" />
              </span>
            </motion.h1>
            
            <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-4 text-sm uppercase tracking-widest text-[var(--text-secondary)] mb-8">
              {heroWords.map((word, i) => (
                <motion.span
                  key={word}
                  animate={{
                    color: heroTextIndex === i ? '#FF4400' : 'var(--text-secondary)',
                    scale: heroTextIndex === i ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {word}
                  {i < heroWords.length - 1 && <span className="text-[#FF4400] mx-2">•</span>}
                </motion.span>
              ))}
            </motion.div>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
              <MagneticButton 
                href="https://www.vinted.de/member/3138250645-scndunit" 
                className="group inline-flex items-center gap-2 px-8 py-4 bg-[#FF4400] text-white font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 transition-all rounded-full shadow-lg shadow-[#FF4400]/30 hover:shadow-xl hover:shadow-[#FF4400]/50"
              >
                Browse Inventory <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              </MagneticButton>
              
              <MagneticButton 
                href="#products" 
                className="inline-flex items-center gap-2 px-8 py-4 border border-[var(--border-color)] hover:border-[#FF4400] hover:text-[#FF4400] transition-all uppercase tracking-widest rounded-full backdrop-blur-sm"
              >
                View Selection <ArrowRight className="w-4 h-4" />
              </MagneticButton>
            </motion.div>
            
          </motion.div>
        </div>
      </motion.section>

      {/* Info Bar */}
      <section className="border-y border-[var(--border-color)] bg-[var(--bg-primary)]/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-[var(--text-secondary)]">
              <Clock className="w-5 h-5 text-[#FF4400] animate-pulse" />Versand innerhalb 48h
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
      <section className="py-8 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative z-10">
        <div className="w-full">
          <div className="mb-6 reveal-on-scroll">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 bg-gradient-to-b from-[#FF4400] to-[#FF8844] rounded-full" />
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">Marken</p>
            </div>
            <div className="w-full overflow-x-auto scrollbar-custom">
              <div className="flex gap-2 min-w-max pb-2">
                {allBrands.map(b => (
                  <motion.button 
                    key={b} 
                    onClick={() => setActiveBrand(b)} 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 text-xs whitespace-nowrap uppercase tracking-widest transition-all duration-200 rounded-full ${
                      activeBrand === b 
                        ? 'bg-[#FF4400] text-white shadow-lg shadow-[#FF4400]/50' 
                        : 'bg-[var(--bg-secondary)] border border-[#FF4400]/20 text-[var(--text-secondary)] hover:border-[#FF4400] hover:text-[#FF4400]'
                    }`}
                  >
                    {b}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-4 reveal-on-scroll">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 bg-gradient-to-b from-[#FF4400] to-[#FF8844] rounded-full" />
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">Kategorien</p>
            </div>
            <div className="w-full overflow-x-auto scrollbar-custom">
              <div className="flex gap-2 min-w-max pb-2">
                {allCategories.map(c => (
                  <motion.button 
                    key={c} 
                    onClick={() => setActiveCategory(c)} 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 text-xs whitespace-nowrap uppercase tracking-widest transition-all duration-200 rounded-full ${
                      activeCategory === c 
                        ? 'bg-[#FF4400] text-white shadow-lg shadow-[#FF4400]/50' 
                        : 'bg-[var(--bg-secondary)] border border-[#FF4400]/20 text-[var(--text-secondary)] hover:border-[#FF4400] hover:text-[#FF4400]'
                    }`}
                  >
                    {c}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative z-10">
        <div className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"/>
              <input 
                type="text" 
                placeholder="Suchen..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-10 pr-4 py-2 bg-[var(--bg-secondary)] border border-[#FF4400]/30 text-sm w-64 rounded-full text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[#FF4400] focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-full p-1 border border-[#FF4400]/20">
                <button onClick={() => setViewMode('grid')} className={viewButtonClass('grid')}><LayoutGrid className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('list')} className={viewButtonClass('list')}><List className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('compact')} className={viewButtonClass('compact')}><Minimize2 className="w-4 h-4" /></button>
              </div>
              <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full">
                {filteredProducts.length} von {products.length} Artikeln
              </div>
            </div>
          </div>
          
          <ProductView products={filteredProducts} viewMode={viewMode} />
          
          {isLoadingMore && visibleProducts.length < products.length && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#FF4400] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          <div className="mt-16 text-center reveal-on-scroll">
            <MagneticButton 
              href="https://www.vinted.de/member/3138250645-scndunit" 
              className="inline-flex items-center gap-2 px-8 py-4 border border-[#FF4400] text-[#FF4400] hover:bg-[#FF4400] hover:text-white transition-all uppercase tracking-widest rounded-full"
            >
              Alle Artikel auf Vinted <ExternalLink className="w-4 h-4" />
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-24 bg-[var(--bg-secondary)]/50 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(255,68,0,0.03)_50%,transparent_51%)] bg-[length:20px_20px]" />
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
            
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
                ABOUT_<span className="text-[#FF4400] relative">
                  UNIT
                  <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-[#FF4400] to-transparent" />
                </span>
              </h2>
              <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
                <p>SCND UNIT ist ein Curated Reselling-Projekt aus Bad Kreuznach. Wir suchen die besten Vintage-Pieces, Streetwear-Klassiker und Y2K-Schnäppchen – und bringen sie zu dir.</p>
                <p>Unser Fokus liegt auf ehrlichen Beschreibungen, schnellem Versand (innerhalb 48h) und einem sorgfältig ausgewählten Inventar. Von Gorpcore-Utility bis zu Vintage-Grails: Jedes Piece wird von uns geprüft und fotografiert.</p>
                <p className="text-[#FF4400] font-bold uppercase tracking-widest text-sm">✧ Kein Fast Fashion – nur Qualität mit Geschichte ✧</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1, delayChildren: 0.2 }
                }
              }}
              className="aspect-square bg-[var(--bg-primary)]/30 backdrop-blur-sm border border-[#FF4400]/20 p-8 flex items-center justify-center rounded-2xl"
            >
              <div className="text-center">
                <div className="text-8xl font-bold text-[#FF4400]/20 mb-4 relative">
                  SCND
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -inset-4 bg-[#FF4400]/10 rounded-full blur-xl -z-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm uppercase tracking-widest">
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                    }}
                    className="p-4 bg-[var(--bg-secondary)]/50 backdrop-blur-sm border border-[#FF4400]/20 rounded-xl hover:border-[#FF4400] transition-all"
                  >
                    <span className="block text-2xl font-bold text-[#FF4400]">100%</span>
                    <span className="text-[var(--text-secondary)]">Authentic</span>
                  </motion.div>
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } }
                    }}
                    className="p-4 bg-[var(--bg-secondary)]/50 backdrop-blur-sm border border-[#FF4400]/20 rounded-xl hover:border-[#FF4400] transition-all"
                  >
                    <span className="block text-2xl font-bold text-[#FF4400]">48h</span>
                    <span className="text-[var(--text-secondary)]">Shipping</span>
                  </motion.div>
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } }
                    }}
                    className="p-4 bg-[var(--bg-secondary)]/50 backdrop-blur-sm border border-[#FF4400]/20 rounded-xl hover:border-[#FF4400] transition-all"
                  >
                    <span className="block text-2xl font-bold text-[#FF4400]">DE</span>
                    <span className="text-[var(--text-secondary)]">Based</span>
                  </motion.div>
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.3 } }
                    }}
                    className="p-4 bg-[var(--bg-secondary)]/50 backdrop-blur-sm border border-[#FF4400]/20 rounded-xl hover:border-[#FF4400] transition-all"
                  >
                    <span className="block text-2xl font-bold text-[#FF4400]">{products.length}+</span>
                    <span className="text-[var(--text-secondary)]">Items</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
              GET_IN_<span className="text-[#FF4400] relative">
                TOUCH
                <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-[#FF4400] to-transparent" />
              </span>
            </h2>
            <p className="text-[var(--text-secondary)] mb-12 uppercase tracking-widest">Fragen zu einem Artikel? Schreib uns auf Vinted oder Instagram.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <MagneticButton 
                href="https://www.vinted.de/member/3138250645-scndunit" 
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#FF4400] text-white font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 transition-all rounded-full shadow-lg shadow-[#FF4400]/30"
              >
                <MessageCircle className="w-5 h-5" />Nachricht auf Vinted
              </MagneticButton>
              <MagneticButton 
                href="https://www.instagram.com/scnd.unit" 
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 border border-[var(--border-color)] hover:border-[#FF4400] hover:text-[#FF4400] transition-all uppercase tracking-widest rounded-full backdrop-blur-sm"
              >
                <Instagram className="w-5 h-5" />@scnd.unit
              </MagneticButton>
            </div>
            <div className="mt-16 flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)] uppercase tracking-widest">
              <MapPin className="w-4 h-4 text-[#FF4400] animate-pulse" />Bad Kreuznach, Deutschland
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] py-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 bg-[var(--bg-primary)]/30 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="text-2xl font-bold tracking-tighter"
          >
            <span className="text-[#FF4400]">SCND</span>_UNIT
          </motion.div>
          <div className="flex gap-6 text-sm uppercase tracking-widest text-[var(--text-secondary)]">
            <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF4400] transition-colors relative group">
              Vinted
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FF4400] transition-all group-hover:w-full" />
            </a>
            <a href="https://www.instagram.com/scnd.unit" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF4400] transition-colors relative group">
              Instagram
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FF4400] transition-all group-hover:w-full" />
            </a>
            <Link href="/impressum" className="hover:text-[#FF4400] transition-colors relative group">
              Impressum
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FF4400] transition-all group-hover:w-full" />
            </Link>
            <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-[#FF4400] transition-colors relative group cursor-pointer">
              Datenschutz
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FF4400] transition-all group-hover:w-full" />
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
