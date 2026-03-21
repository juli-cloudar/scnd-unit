'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Instagram, 
  MessageCircle, 
  ArrowRight, 
  MapPin,
  Clock,
  Shield,
  ExternalLink,
  Menu,
  X,
  Filter,
  CreditCard,
  Sparkles
} from 'lucide-react';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// Deine echten Vinted-Produkte
const products = [
  // ── JACKEN ──
  {
    id: 1,
    name: "The North Face Pufferjacke",
    category: "Jacken",
    price: "€42",
    size: "L",
    condition: "Gut",
    image: "https://images1.vinted.net/t/01_01a1a_PD6Trf4ARHNYjDcC4aYXdKYm/f800/1772736752.webp?s=636466168eff9afa78b1c32ef10e833a86c8fc9d",
    vintedUrl: "https://www.vinted.de/items/8322236551"
  },
  {
    id: 2,
    name: "Lacoste Track Jacket Windbreaker",
    category: "Jacken",
    price: "€49",
    size: "M",
    condition: "Sehr gut",
    image: "https://images1.vinted.net/t/03_0231e_QGGDXtYBsigJX29VaVt7m9TN/f800/1773579801.webp?s=fc915e5f5a759d5d414adb1d7bab3018951f0cfd",
    vintedUrl: "https://www.vinted.de/items/8400248375"
  },
  {
    id: 3,
    name: "Adidas Originals Puffer Jacke Blau",
    category: "Jacken",
    price: "€22",
    size: "XL",
    condition: "Zufriedenstellend",
    image: "https://images1.vinted.net/t/04_01bf0_D48FsSLrpGGLv7j1HQHuiNg9/f800/1772749815.webp?s=fa82c0bc1c848af67bddee3c53bf7c407a5d1325",
    vintedUrl: "https://www.vinted.de/items/8323545774"
  },
  {
    id: 4,
    name: "Adidas Originals Track Jacket Rot",
    category: "Jacken",
    price: "€26",
    size: "S",
    condition: "Sehr gut",
    image: "https://images1.vinted.net/t/06_001da_kMqrpNgt9CkFx5rm1fFVLj1k/f800/1773951754.webp?s=91233be5e2bf86cf89e5473b18766b27d0a72dd0",
    vintedUrl: "https://www.vinted.de/items/8436257572"
  },
  {
    id: 5,
    name: "Adidas Fleece Jacke Schwarz",
    category: "Jacken",
    price: "€14",
    size: "XL",
    condition: "Zufriedenstellend",
    image: "https://images1.vinted.net/t/05_001b5_rAqzJHjisGiWzahLBgUXmDP3/f800/1773747209.webp?s=585faadb3805d1e5e7cefe12c0b935c9a8190b05",
    vintedUrl: "https://www.vinted.de/items/8416878208"
  },
  {
    id: 6,
    name: "Reebok NY Rangers Fleecejacke",
    category: "Jacken",
    price: "€29.90",
    size: "M",
    condition: "Gut",
    image: "https://images1.vinted.net/t/05_01ab1_3koKJ37q95NxbDyxh9jckewk/f800/1772721377.webp?s=8dd7f1c7f90b5840f06bcbbcaae85e0d3505b766",
    vintedUrl: "https://www.vinted.de/items/8320129694"
  },
  {
    id: 7,
    name: "La Martina Steppweste Schwarz Rot",
    category: "Jacken",
    price: "€25",
    size: "S/M",
    condition: "Sehr gut",
    image: "https://images1.vinted.net/t/01_00220_4XS4MDyF8v3mLJ467BjVa5v5/f800/1773668985.webp?s=975f93870ea40b24b2cf7efa6eee5952cd91c296",
    vintedUrl: "https://www.vinted.de/items/8410133047"
  },

  // ── PULLOVER / FLEECE ──
  {
    id: 8,
    name: "Tommy Hilfiger Teddy Fleece Hoodie",
    category: "Pullover",
    price: "€25",
    size: "L",
    condition: "Gut",
    image: "https://images1.vinted.net/t/06_0163c_ZyVmFPAa4ouSgGTGkGUMWQjZ/f800/1774106471.webp?s=65e4615b32b4005a581015564d8ea60b5cb2d2fd",
    vintedUrl: "https://www.vinted.de/items/8448746258"
  },
  {
    id: 9,
    name: "Tommy Hilfiger Teddy Fleece Quarter Zip",
    category: "Pullover",
    price: "€22",
    size: "L",
    condition: "Zufriedenstellend",
    image: "https://images1.vinted.net/t/04_00377_R6n53bTCW16s9DGUaBQdeASQ/f800/1773749145.webp?s=cb2fb45d8d7fe0ab5d41f04ab4826a88a7bcb90c",
    vintedUrl: "https://www.vinted.de/items/8417156956"
  },
  {
    id: 10,
    name: "Helly Hansen Fleece Half Zip",
    category: "Pullover",
    price: "€25",
    size: "M",
    condition: "Gut",
    image: "https://images1.vinted.net/t/06_01462_7TEANiPZRgaFsLppzoghynVv/f800/1773706461.webp?s=2a329a1d9cc382e35c8450cd672820614e86182b",
    vintedUrl: "https://www.vinted.de/items/8414805903"
  },
  {
    id: 11,
    name: "Timberland Fleece Quarter Zip",
    category: "Pullover",
    price: "€26",
    size: "XL",
    condition: "Gut",
    image: "https://images1.vinted.net/t/06_00040_oyQtkRb6wgNfA18ZkhQKXy2z/f800/1774017964.webp?s=b34f3fb33aed2f2cac2df123b39d41514759cb41",
    vintedUrl: "https://www.vinted.de/items/8440569340"
  },
  {
    id: 12,
    name: "Nike Cropped Fleece Crewneck Beige",
    category: "Pullover",
    price: "€19.90",
    size: "S",
    condition: "Gut",
    image: "https://images1.vinted.net/t/06_017e4_pCyDvQ8B8fsxkJLc8kkcih5c/f800/1774018713.webp?s=344d1d99621ba1a059d4c6c23b40a9a91126a78d",
    vintedUrl: "https://www.vinted.de/items/8440675699"
  },

  // ── SWEATSHIRTS ──
  {
    id: 13,
    name: "Lee Sport Wisconsin Badgers Sweatshirt",
    category: "Sweatshirts",
    price: "€34",
    size: "L",
    condition: "Gut",
    image: "https://images1.vinted.net/t/06_0084e_Yw7gdPLWQ8m5HQtQzBXhs9xm/f800/1773695157.webp?s=877c1c694927693e82f8b9d6986de17cce967ae9",
    vintedUrl: "https://www.vinted.de/items/8414236896"
  },
  {
    id: 14,
    name: "Lee Sport Wisconsin Badgers Crewneck",
    category: "Sweatshirts",
    price: "€36",
    size: "L",
    condition: "Gut",
    image: "https://images1.vinted.net/t/06_0022a_fHhH2m857kZutLrvY1c8jjed/f800/1773705197.webp?s=1451f3a3c438f0383e10019ec873e8763784b9a0",
    vintedUrl: "https://www.vinted.de/items/8414786154"
  },
  {
    id: 15,
    name: "Vintage England Strickjacke Union Jack",
    category: "Sweatshirts",
    price: "€32",
    size: "M",
    condition: "Gut",
    image: "https://images1.vinted.net/t/05_00a99_3fq7YmVQH7r92JMuAXifxHvC/f800/1774031494.webp?s=3d255c9b1c3ede9d927d363c7a1e9f59d66b6f3a",
    vintedUrl: "https://www.vinted.de/items/8441012104"
  }
];

const allCategories = ["Alle", ...Array.from(new Set(products.map(p => p.category)))];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Alle");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredProducts = activeCategory === "Alle"
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Gold-Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] opacity-5" />
      
      {/* Navigation */}
      <nav className={`fixed w-full z-40 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0A]/95 backdrop-blur-md py-4 border-b border-[#D4AF37]/20' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            {/* Logo */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B7355] flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-[#D4AF37]/20">
              S
            </div>
            <span className="text-2xl font-bold tracking-tighter">
              <span className="text-[#D4AF37]">SCND</span>_UNIT
            </span>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#products" className="text-sm uppercase tracking-widest hover:text-[#D4AF37] transition-colors">Inventory</a>
            <a href="#about" className="text-sm uppercase tracking-widest hover:text-[#D4AF37] transition-colors">About</a>
            <a href="#contact" className="text-sm uppercase tracking-widest hover:text-[#D4AF37] transition-colors">Contact</a>
            <a 
              href="https://www.vinted.de/member/3138250645-scndunit" 
              target="_blank"
              className="px-6 py-2 bg-[#D4AF37] text-black text-sm uppercase tracking-widest hover:bg-[#D4AF37]/80 transition-colors font-bold"
            >
              Shop Vinted
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="text-[#D4AF37]" /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#0A0A0A] border-t border-[#D4AF37]/20"
            >
              <div className="flex flex-col p-6 gap-4">
                <a href="#products" onClick={() => setIsMenuOpen(false)} className="text-lg uppercase tracking-widest hover:text-[#D4AF37]">Inventory</a>
                <a href="#about" onClick={() => setIsMenuOpen(false)} className="text-lg uppercase tracking-widest hover:text-[#D4AF37]">About</a>
                <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-lg uppercase tracking-widest hover:text-[#D4AF37]">Contact</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:100px_100px]" />
        
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.p variants={fadeIn} className="text-[#D4AF37] text-sm uppercase tracking-[0.3em] mb-4">
              Bad Kreuznach, DE
            </motion.p>
            
            <motion.h1 variants={fadeIn} className="text-6xl md:text-9xl font-bold tracking-tighter mb-6">
              <span className="block">SCND</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-b from-[#D4AF37] to-[#8B7355]">UNIT</span>
            </motion.h1>
            
            <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-4 text-sm uppercase tracking-widest text-gray-400 mb-8">
              <span>Streetwear</span>
              <span className="text-[#D4AF37]">•</span>
              <span>Vintage</span>
              <span className="text-[#D4AF37]">•</span>
              <span>Y2K</span>
              <span className="text-[#D4AF37]">•</span>
              <span>Gorpcore</span>
            </motion.div>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://www.vinted.de/member/3138250645-scndunit"
                target="_blank"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-[#D4AF37]/80 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Direkt auf Vinted shoppen
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a 
                href="#products"
                className="inline-flex items-center gap-2 px-8 py-4 border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all uppercase tracking-widest"
              >
                Kollektion ansehen
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-[#D4AF37]/30 rounded-full flex justify-center">
            <motion.div 
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 bg-[#D4AF37] rounded-full mt-2"
            />
          </div>
        </motion.div>
      </section>

      {/* Trust Badges */}
      <section className="border-y border-[#D4AF37]/20 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-gray-400">
              <Clock className="w-5 h-5 text-[#D4AF37]" />
              Versand innerhalb 48h
            </div>
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-gray-400">
              <Shield className="w-5 h-5 text-[#D4AF37]" />
              Ehrliche Beschreibungen
            </div>
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-gray-400">
              <CreditCard className="w-5 h-5 text-[#D4AF37]" />
              Sicher bezahlen via Vinted
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section id="products" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
              CURRENT_<span className="text-[#D4AF37]">INVENTORY</span>
            </h2>
            <p className="text-gray-400 uppercase tracking-widest text-sm">
              Alle Artikel verfügbar auf Vinted • Klick für Details & Kauf
            </p>
          </motion.div>

          {/* Filter */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            className="flex items-center gap-3 mb-12 flex-wrap"
          >
            <Filter className="w-4 h-4 text-[#D4AF37]" />
            {allCategories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-xs uppercase tracking-widest border transition-all ${
                  activeCategory === cat 
                    ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' 
                    : 'border-[#1A1A1A] text-gray-400 hover:border-[#D4AF37] hover:text-[#D4AF37]'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {/* Product Cards */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeCategory} 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.2 }} 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredProducts.map((product, index) => (
                <motion.a
                  key={product.id}
                  href={product.vintedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="group relative bg-[#1A1A1A] overflow-hidden hover:ring-2 hover:ring-[#D4AF37] transition-all"
                >
                  {/* Image Container */}
                  <div className="aspect-[4/5] relative overflow-hidden bg-[#0A0A0A]">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10" />
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Condition Badge */}
                    <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-[#0A0A0A]/80 backdrop-blur text-xs uppercase tracking-widest border border-[#D4AF37] text-[#D4AF37]">
                      {product.condition}
                    </div>
                    {/* Price Tag */}
                    <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-[#D4AF37] text-black font-bold text-sm">
                      {product.price}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <div className="mb-3">
                      <p className="text-xs text-[#D4AF37] uppercase tracking-widest mb-1">{product.category}</p>
                      <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-[#D4AF37] transition-colors">
                        {product.name}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#0A0A0A]">
                      <span className="text-sm text-gray-400 uppercase tracking-widest">Size {product.size}</span>
                      <span className="inline-flex items-center gap-1 text-sm uppercase tracking-widest text-[#D4AF37] group-hover:gap-2 transition-all">
                        Auf Vinted kaufen <ExternalLink className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="mt-16 text-center">
            <a 
              href="https://www.vinted.de/member/3138250645-scndunit"
              target="_blank"
              className="inline-flex items-center gap-2 px-8 py-4 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all uppercase tracking-widest"
            >
              Alle Artikel auf Vinted sehen <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-[#1A1A1A] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(212,175,55,0.02)_50%,transparent_51%)] bg-[length:20px_20px]" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
                ABOUT_<span className="text-[#D4AF37]">UNIT</span>
              </h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  SCND UNIT ist ein Curated Reselling-Projekt aus Bad Kreuznach. Wir suchen die besten Vintage-Pieces, Streetwear-Klassiker und Y2K-Schnäppchen – und bringen sie zu dir.
                </p>
                <p>
                  Unser Fokus liegt auf <span className="text-[#D4AF37]">ehrlichen Beschreibungen</span>, <span className="text-[#D4AF37]">schnellem Versand</span> (innerhalb 48h) und einem sorgfältig ausgewählten Inventar. 
                </p>
                <p>
                  Jeder Kauf läuft über <span className="text-[#D4AF37] font-bold">Vinted</span> – das bedeutet Käuferschutz, sichere Zahlung und verifizierte Transaktionen für dich.
                </p>
                <p className="text-[#D4AF37] font-bold uppercase tracking-widest text-sm border-l-2 border-[#D4AF37] pl-4">
                  Kein Fast Fashion – nur Qualität mit Geschichte.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square bg-[#0A0A0A] border border-[#D4AF37]/20 p-8 flex items-center justify-center relative overflow-hidden">
                {/* Gold-Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent" />
                
                <div className="text-center relative z-10">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B7355] flex items-center justify-center text-black font-bold text-4xl shadow-2xl shadow-[#D4AF37]/20">
                    S
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm uppercase tracking-widest">
                    <div className="p-4 bg-[#1A1A1A] border border-[#0A0A0A] hover:border-[#D4AF37]/50 transition-colors">
                      <span className="block text-2xl font-bold text-[#D4AF37]">100%</span>
                      <span className="text-gray-500">Authentic</span>
                    </div>
                    <div className="p-4 bg-[#1A1A1A] border border-[#0A0A0A] hover:border-[#D4AF37]/50 transition-colors">
                      <span className="block text-2xl font-bold text-[#D4AF37]">48h</span>
                      <span className="text-gray-500">Shipping</span>
                    </div>
                    <div className="p-4 bg-[#1A1A1A] border border-[#0A0A0A] hover:border-[#D4AF37]/50 transition-colors">
                      <span className="block text-2xl font-bold text-[#D4AF37]">DE</span>
                      <span className="text-gray-500">Based</span>
                    </div>
                    <div className="p-4 bg-[#1A1A1A] border border-[#0A0A0A] hover:border-[#D4AF37]/50 transition-colors">
                      <span className="block text-2xl font-bold text-[#D4AF37]">15</span>
                      <span className="text-gray-500">Items</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How to Buy Section */}
      <section className="py-24 px-6 border-y border-[#D4AF37]/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
              SO FUNKTIONIERT'S
            </h2>
            <p className="text-gray-400 mb-12 uppercase tracking-widest text-sm">
              Sicher kaufen über Vinted
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-colors">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#D4AF37] text-black flex items-center justify-center font-bold text-xl">1</div>
                <h3 className="text-lg font-bold uppercase tracking-widest mb-2">Artikel wählen</h3>
                <p className="text-gray-400 text-sm">Durchstöbere unsere Kollektion und klick auf "Auf Vinted kaufen"</p>
              </div>
              <div className="p-6 border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-colors">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#D4AF37] text-black flex items-center justify-center font-bold text-xl">2</div>
                <h3 className="text-lg font-bold uppercase tracking-widest mb-2">Auf Vinted kaufen</h3>
                <p className="text-gray-400 text-sm">Du wirst direkt zum Vinted-Produkt weitergeleitet und kannst sicher bezahlen</p>
              </div>
              <div className="p-6 border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-colors">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#D4AF37] text-black flex items-center justify-center font-bold text-xl">3</div>
                <h3 className="text-lg font-bold uppercase tracking-widest mb-2">Versand</h3>
                <p className="text-gray-400 text-sm">Wir versenden innerhalb von 48h. Tracking erhältst du über Vinted</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
              GET_IN_<span className="text-[#D4AF37]">TOUCH</span>
            </h2>
            <p className="text-gray-400 mb-12 uppercase tracking-widest">
              Fragen? Schreib uns auf Vinted oder Instagram
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://www.vinted.de/member/3138250645-scndunit"
                target="_blank"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-[#D4AF37]/80 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                Nachricht auf Vinted
              </a>
              <a 
                href="https://www.instagram.com/scnd.unit"
                target="_blank"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all uppercase tracking-widest"
              >
                <Instagram className="w-5 h-5" />
                @scnd.unit
              </a>
            </div>

            <div className="mt-16 flex items-center justify-center gap-2 text-sm text-gray-500 uppercase tracking-widest">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              Bad Kreuznach, Deutschland
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D4AF37]/20 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B7355] flex items-center justify-center text-black font-bold text-sm">
              S
            </div>
            <span className="text-xl font-bold tracking-tighter">
              <span className="text-[#D4AF37]">SCND</span>_UNIT
            </span>
          </div>
          
          <div className="flex gap-6 text-sm uppercase tracking-widest text-gray-500">
            <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="hover:text-[#D4AF37] transition-colors">Vinted</a>
            <a href="https://www.instagram.com/scnd.unit" target="_blank" className="hover:text-[#D4AF37] transition-colors">Instagram</a>
          </div>

          <p className="text-xs text-gray-600 uppercase tracking-widest">
            © 2025 SCND UNIT • Bad Kreuznach
          </p>
        </div>
      </footer>
    </div>
  );
}
