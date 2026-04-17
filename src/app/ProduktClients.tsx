// src/app/ProductClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Instagram, MessageCircle, ArrowRight, MapPin,
  Clock, Shield, ExternalLink, Menu, X, Filter
} from 'lucide-react';
import { ScndDropGame } from '@/components/ScndDropGame';

// ========== ProductCleaner ==========
const KNOWN_BRANDS = [
  'L.L.BEAN', 'ADIDAS', 'NIKE', 'TOMMY HILFIGER', 'CHAMPION',
  'COLUMBIA', 'PUMA', 'FILA', 'NAPAPIJRI', 'HELLY HANSEN',
  'THE NORTH FACE', 'NEW BALANCE', 'STARTER', 'LEE', 'TIMBERLAND',
  'REEBOK', 'LACOSTE', 'WRANGLER', 'BEXLEYS', 'U.S. POLO ASSN',
  'STARTER', 'NBA', 'NFL', 'LEE SPORT'
];

function cleanProductName(rawName: string) {
  if (!rawName) return { brand: '', description: '', size: '', cleaned: '' };
  const upperName = rawName.toUpperCase();
  let brand = '';
  for (const knownBrand of KNOWN_BRANDS) {
    if (upperName.startsWith(knownBrand)) {
      brand = knownBrand;
      break;
    }
  }
  if (!brand) brand = rawName.split(' ')[0];
  let rest = rawName.slice(brand.length).trim();
  const brandRegex = new RegExp(`^${brand}\\s+`, 'i');
  rest = rest.replace(brandRegex, '');
  const sizePatterns = [/\b(XXL|XL|L|M|S|XS|XXXL)\b/i];
  let size = '';
  for (const pattern of sizePatterns) {
    const match = rest.match(pattern);
    if (match) {
      size = match[1].toUpperCase();
      rest = rest.replace(pattern, '').trim();
      break;
    }
  }
  const description = rest.replace(/\s+/g, ' ').trim();
  return { brand, description, size, cleaned: `${brand} ${description}${size ? ` (${size})` : ''}`.trim() };
}

function useProductCleaner(products: Product[]) {
  const [cleanedProducts, setCleanedProducts] = useState<any[]>([]);
  const [uniqueBrands, setUniqueBrands] = useState<string[]>([]);
  useEffect(() => {
    if (!products || products.length === 0) {
      setCleanedProducts([]);
      setUniqueBrands([]);
      return;
    }
    const cleaned = products.map(product => {
      const cleaned = cleanProductName(product.name);
      return { ...product, cleaned_name: cleaned.cleaned, extracted_brand: cleaned.brand, extracted_description: cleaned.description, extracted_size: cleaned.size };
    });
    setCleanedProducts(cleaned);
    const brands = new Map<string, string>();
    cleaned.forEach(product => {
      const brandName = product.extracted_brand;
      if (brandName) {
        const key = brandName.toUpperCase();
        if (!brands.has(key)) brands.set(key, brandName);
      }
    });
    setUniqueBrands(Array.from(brands.values()).sort());
  }, [products]);
  return { cleanedProducts, uniqueBrands };
}
// ========== ENDE ProductCleaner ==========

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  size: string;
  condition: string;
  images: string[] | null;
  vinted_url: string;
  sold: boolean;
}

interface ProductClientProps {
  initialProducts: Product[];
}

const proxyImg = (url: string) => {
  if (!url) return '';
  if (url.startsWith('/api/')) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

const ImageSlider = ({ images, alt, condition }: { images: string[] | null, alt: string, condition: string }) => {
  const [current, setCurrent] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const onPointerDown = (e: React.PointerEvent) => { setDragStart(e.clientX); setDragging(false); };
  const onPointerMove = (e: React.PointerEvent) => { if (dragStart !== null && Math.abs(e.clientX - dragStart) > 8) setDragging(true); };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStart === null) return;
    const diff = dragStart - e.clientX;
    if (Math.abs(diff) > 40) {
      e.preventDefault();
      diff > 0 ? setCurrent(c => (c + 1) % (images ?? []).length) : setCurrent(c => (c - 1 + (images ?? []).length) % (images ?? []).length);
    }
    setDragStart(null);
  };
  const onClick = (e: React.MouseEvent) => { if (dragging) e.preventDefault(); };
  return (
    <div className="aspect-[3/4] md:aspect-[4/5] relative overflow-hidden bg-[#0A0A0A] cursor-grab active:cursor-grabbing select-none touch-pan-y" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onClick={onClick}>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10 pointer-events-none" />
      <img src={proxyImg((images ?? [])[current])} alt={alt} draggable={false} className="w-full h-full object-cover transition-opacity duration-300 pointer-events-none" />
      {condition !== "–" && <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-[#0A0A0A]/80 backdrop-blur text-xs uppercase tracking-widest border border-[#FF4400] text-[#FF4400] pointer-events-none">{condition}</div>}
      {(images ?? []).length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
          {(images ?? []).map((_, i) => (
            <button key={i} onClick={(e) => { e.preventDefault(); setCurrent(i); }} className={`rounded-full transition-all duration-200 ${i === current ? 'bg-[#FF4400] w-5 h-2.5' : 'bg-white/40 hover:bg-white/70 w-2.5 h-2.5'}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export function ProductClient({ initialProducts }: ProductClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Alle");
  const [activeBrand, setActiveBrand] = useState("Alle");
  const { cleanedProducts, uniqueBrands } = useProductCleaner(products);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredProducts = (cleanedProducts.length > 0 ? cleanedProducts : products).filter(product => {
    const matchesCategory = activeCategory === "Alle" || product.category === activeCategory;
    const matchesBrand = activeBrand === "Alle" || product.extracted_brand?.toUpperCase() === activeBrand.toUpperCase();
    return matchesCategory && matchesBrand;
  });

  const allCategories = ["Alle", ...Array.from(new Set(products.map(p => p.category))).sort()];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans selection:bg-[#FF4400] selection:text-white">
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

      {/* Navigation - Volle Breite */}
      <nav className={`fixed w-full z-40 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0A]/90 backdrop-blur-md py-4' : 'bg-transparent py-6'}`}>
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 flex justify-between items-center">
          <div className="text-2xl font-bold tracking-tighter">
            <span className="text-[#FF4400]">SCND</span>_UNIT
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#products" className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors">Inventory</a>
            <a href="#about" className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors">About</a>
            <a href="#contact" className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors">Contact</a>
            <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="px-6 py-2 bg-[#FF4400] text-white text-sm uppercase tracking-widest hover:bg-[#FF4400]/80 transition-colors">Shop Vinted</a>
          </div>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-[#0A0A0A] border-t border-[#1A1A1A]">
              <div className="flex flex-col p-6 gap-4">
                <a href="#products" onClick={() => setIsMenuOpen(false)} className="text-lg uppercase tracking-widest">Inventory</a>
                <a href="#about" onClick={() => setIsMenuOpen(false)} className="text-lg uppercase tracking-widest">About</a>
                <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-lg uppercase tracking-widest">Contact</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(26,26,26,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(26,26,26,0.5)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
        <div className="relative z-10 text-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 w-full">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.p variants={fadeIn} className="text-[#FF4400] text-sm uppercase tracking-[0.3em] mb-4">Bad Kreuznach, DE</motion.p>
            <motion.h1 variants={fadeIn} className="text-6xl md:text-9xl font-bold tracking-tighter mb-6">
              <span className="block">SCND</span>
              <span className="block text-[#1A1A1A] [-webkit-text-stroke:2px_#F5F5F5]">UNIT</span>
            </motion.h1>
            <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-4 text-sm uppercase tracking-widest text-gray-400 mb-8">
              <span>Streetwear</span><span className="text-[#FF4400]">•</span><span>Vintage</span><span className="text-[#FF4400]">•</span><span>Y2K</span><span className="text-[#FF4400]">•</span><span>Gorpcore</span>
            </motion.div>
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="group inline-flex items-center gap-2 px-8 py-4 bg-[#FF4400] text-white font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 transition-all">
                Browse Inventory <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#products" className="inline-flex items-center gap-2 px-8 py-4 border border-[#1A1A1A] hover:border-[#FF4400] hover:text-[#FF4400] transition-all uppercase tracking-widest">View Selection</a>
            </motion.div>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-[#1A1A1A] rounded-full flex justify-center">
            <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1 h-2 bg-[#FF4400] rounded-full mt-2" />
          </div>
        </motion.div>
      </section>

      {/* Info Bar - Volle Breite */}
      <section className="border-y border-[#1A1A1A] bg-[#0A0A0A]">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-gray-400"><Clock className="w-5 h-5 text-[#FF4400]" />Versand innerhalb 48h</div>
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-gray-400"><Shield className="w-5 h-5 text-[#FF4400]" />Ehrliche Beschreibungen</div>
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-gray-400"><MessageCircle className="w-5 h-5 text-[#FF4400]" />Schneller Support</div>
          </div>
        </div>
      </section>

      {/* Products Section - Volle Breite */}
      <section id="products" className="py-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">CURRENT_<span className="text-[#FF4400]">INVENTORY</span></h2>
            <p className="text-gray-400 uppercase tracking-widest text-sm">Alle Artikel auf Vinted verfügbar • Regelmäßig neue Drops</p>
          </motion.div>

          {/* Filter - Volle Breite */}
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4 mb-12">
            <div className="flex items-center gap-3 flex-wrap">
              <Filter className="w-4 h-4 text-[#FF4400]" />
              <span className="text-xs uppercase tracking-widest text-gray-500 mr-2">Kategorie:</span>
              {allCategories.map(cat => (
                <button key={`cat-${cat}`} onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 text-xs uppercase tracking-widest border transition-all ${activeCategory === cat ? 'border-[#FF4400] text-[#FF4400] bg-[#FF4400]/10' : 'border-[#1A1A1A] text-gray-400 hover:border-[#FF4400] hover:text-[#FF4400]'}`}>
                  {cat}
                </button>
              ))}
            </div>
            {uniqueBrands.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-[#1A1A1A]">
                <Filter className="w-4 h-4 text-[#FF4400]" />
                <span className="text-xs uppercase tracking-widest text-gray-500 mr-2">Marke:</span>
                <button onClick={() => setActiveBrand("Alle")}
                  className={`px-4 py-2 text-xs uppercase tracking-widest border transition-all ${activeBrand === "Alle" ? 'border-[#FF4400] text-[#FF4400] bg-[#FF4400]/10' : 'border-[#1A1A1A] text-gray-400 hover:border-[#FF4400] hover:text-[#FF4400]'}`}>
                  Alle
                </button>
                {uniqueBrands.map(brand => (
                  <button key={`brand-${brand}`} onClick={() => setActiveBrand(brand)}
                    className={`px-4 py-2 text-xs uppercase tracking-widest border transition-all ${activeBrand === brand ? 'border-[#FF4400] text-[#FF4400] bg-[#FF4400]/10' : 'border-[#1A1A1A] text-gray-400 hover:border-[#FF4400] hover:text-[#FF4400]'}`}>
                    {brand}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Produkte Grid - Mehr Produkte pro Zeile, gleiche Größe */}
          <AnimatePresence mode="wait">
            <motion.div key={`${activeCategory}-${activeBrand}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredProducts.map((product, index) => (
                <motion.a key={product.id} href={product.vinted_url} target="_blank" rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                  className="group relative bg-[#1A1A1A] overflow-hidden hover:ring-2 hover:ring-[#FF4400] transition-all">
                  <ImageSlider images={product.images ?? []} alt={product.name} condition={product.condition} />
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                          {product.category}
                          {product.extracted_brand && <span className="ml-2 text-[#FF4400]">• {product.extracted_brand}</span>}
                        </p>
                        <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-[#FF4400] transition-colors leading-tight">
                          {product.cleaned_name || product.name}
                        </h3>
                      </div>
                      <span className="text-xl font-bold text-[#FF4400] shrink-0">€{product.price}</span>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#0A0A0A]">
                      <span className="text-sm text-gray-400 uppercase tracking-widest">
                        {product.extracted_size || (product.size !== "–" ? `Size ${product.size}` : "")}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm uppercase tracking-widest text-[#FF4400] group-hover:gap-2 transition-all">View <ExternalLink className="w-4 h-4" /></span>
                    </div>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="mt-16 text-center">
            <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="inline-flex items-center gap-2 px-8 py-4 border border-[#FF4400] text-[#FF4400] hover:bg-[#FF4400] hover:text-white transition-all uppercase tracking-widest">
              Alle Artikel auf Vinted <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-24 bg-[#1A1A1A] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(255,68,0,0.03)_50%,transparent_51%)] bg-[length:20px_20px]" />
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">ABOUT_<span className="text-[#FF4400]">UNIT</span></h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>SCND UNIT ist ein Curated Reselling-Projekt aus Bad Kreuznach. Wir suchen die besten Vintage-Pieces, Streetwear-Klassiker und Y2K-Schnäppchen – und bringen sie zu dir.</p>
                <p>Unser Fokus liegt auf ehrlichen Beschreibungen, schnellem Versand (innerhalb 48h) und einem sorgfältig ausgewählten Inventar. Von Gorpcore-Utility bis zu Vintage-Grails: Jedes Piece wird von uns geprüft und fotografiert.</p>
                <p className="text-[#FF4400] font-bold uppercase tracking-widest text-sm">Kein Fast Fashion – nur Qualität mit Geschichte.</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="aspect-square bg-[#0A0A0A] border border-[#FF4400]/20 p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl font-bold text-[#FF4400]/20 mb-4">SCND</div>
                  <div className="grid grid-cols-2 gap-4 text-sm uppercase tracking-widest">
                    <div className="p-4 bg-[#1A1A1A] border border-[#0A0A0A]"><span className="block text-2xl font-bold text-[#FF4400]">100%</span><span className="text-gray-500">Authentic</span></div>
                    <div className="p-4 bg-[#1A1A1A] border border-[#0A0A0A]"><span className="block text-2xl font-bold text-[#FF4400]">48h</span><span className="text-gray-500">Shipping</span></div>
                    <div className="p-4 bg-[#1A1A1A] border border-[#0A0A0A]"><span className="block text-2xl font-bold text-[#FF4400]">DE</span><span className="text-gray-500">Based</span></div>
                    <div className="p-4 bg-[#1A1A1A] border border-[#0A0A0A]"><span className="block text-2xl font-bold text-[#FF4400]">{products.length}+</span><span className="text-gray-500">Items</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SCND DROP GAME SECTION */}
      <section id="game" className="py-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="max-w-7xl mx-auto">
          <ScndDropGame />
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">GET_IN_<span className="text-[#FF4400]">TOUCH</span></h2>
            <p className="text-gray-400 mb-12 uppercase tracking-widest">Fragen zu einem Artikel? Schreib uns auf Vinted oder Instagram.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#FF4400] text-white font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 transition-all">
                <MessageCircle className="w-5 h-5" />Nachricht auf Vinted
              </a>
              <a href="https://www.instagram.com/scnd.unit" target="_blank" className="group inline-flex items-center justify-center gap-3 px-8 py-4 border border-[#1A1A1A] hover:border-[#FF4400] hover:text-[#FF4400] transition-all uppercase tracking-widest">
                <Instagram className="w-5 h-5" />@scnd.unit
              </a>
            </div>
            <div className="mt-16 flex items-center justify-center gap-2 text-sm text-gray-500 uppercase tracking-widest">
              <MapPin className="w-4 h-4 text-[#FF4400]" />Bad Kreuznach, Deutschland
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Volle Breite */}
      <footer className="border-t border-[#1A1A1A] py-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-bold tracking-tighter"><span className="text-[#FF4400]">SCND</span>_UNIT</div>
          <div className="flex gap-6 text-sm uppercase tracking-widest text-gray-500">
            <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="hover:text-[#FF4400] transition-colors">Vinted</a>
            <a href="https://www.instagram.com/scnd.unit" target="_blank" className="hover:text-[#FF4400] transition-colors">Instagram</a>
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-widest">© 2025 SCND UNIT • Bad Kreuznach</p>
        </div>
      </footer>
    </div>
  );
}
