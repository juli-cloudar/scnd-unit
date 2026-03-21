// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Instagram, 
  Package, 
  MessageCircle, 
  ArrowRight, 
  MapPin,
  Clock,
  Shield,
  ExternalLink,
  Menu,
  X
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

// Product data - replace with your actual Vinted items
const products = [
  {
    id: 1,
    name: "Vintage Carhartt Jacket",
    category: "Outerwear",
    price: "€45",
    size: "L",
    condition: "9/10",
    image: "/api/placeholder/400/500",
    vintedUrl: "https://www.vinted.de/member/3138250645-scndunit"
  },
  {
    id: 2,
    name: "Y2K Cargo Pants",
    category: "Bottoms",
    price: "€32",
    size: "M",
    condition: "8/10",
    image: "/api/placeholder/400/500",
    vintedUrl: "https://www.vinted.de/member/3138250645-scndunit"
  },
  {
    id: 3,
    name: "Gorpcore Fleece",
    category: "Outerwear",
    price: "€28",
    size: "XL",
    condition: "10/10",
    image: "/api/placeholder/400/500",
    vintedUrl: "https://www.vinted.de/member/3138250645-scndunit"
  },
  {
    id: 4,
    name: "Streetwear Hoodie",
    category: "Tops",
    price: "€38",
    size: "L",
    condition: "9/10",
    image: "/api/placeholder/400/500",
    vintedUrl: "https://www.vinted.de/member/3138250645-scndunit"
  },
  {
    id: 5,
    name: "Vintage Tee",
    category: "Tops",
    price: "€22",
    size: "M",
    condition: "8/10",
    image: "/api/placeholder/400/500",
    vintedUrl: "https://www.vinted.de/member/3138250645-scndunit"
  },
  {
    id: 6,
    name: "Utility Vest",
    category: "Outerwear",
    price: "€35",
    size: "S",
    condition: "9/10",
    image: "/api/placeholder/400/500",
    vintedUrl: "https://www.vinted.de/member/3138250645-scndunit"
  }
];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans selection:bg-[#FF4400] selection:text-white">
      {/* Scanline Overlay Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
      
      {/* Navigation */}
      <nav className={`fixed w-full z-40 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0A]/90 backdrop-blur-md py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold tracking-tighter"
          >
            <span className="text-[#FF4400]">SCND</span>_UNIT
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#products" className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors">Inventory</a>
            <a href="#about" className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors">About</a>
            <a href="#contact" className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors">Contact</a>
            <a 
              href="https://www.vinted.de/member/3138250645-scndunit" 
              target="_blank"
              className="px-6 py-2 bg-[#FF4400] text-white text-sm uppercase tracking-widest hover:bg-[#FF4400]/80 transition-colors"
            >
              Shop Vinted
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#0A0A0A] border-t border-[#1A1A1A]"
            >
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
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(26,26,26,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(26,26,26,0.5)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
        
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.p variants={fadeIn} className="text-[#FF4400] text-sm uppercase tracking-[0.3em] mb-4">
              Bad Kreuznach, DE
            </motion.p>
            
            <motion.h1 variants={fadeIn} className="text-6xl md:text-9xl font-bold tracking-tighter mb-6">
              <span className="block">SCND</span>
              <span className="block text-[#1A1A1A] [-webkit-text-stroke:2px_#F5F5F5]">UNIT</span>
            </motion.h1>
            
            <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-4 text-sm uppercase tracking-widest text-gray-400 mb-8">
              <span>Streetwear</span>
              <span className="text-[#FF4400]">•</span>
              <span>Vintage</span>
              <span className="text-[#FF4400]">•</span>
              <span>Y2K</span>
              <span className="text-[#FF4400]">•</span>
              <span>Gorpcore</span>
            </motion.div>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://www.vinted.de/member/3138250645-scndunit"
                target="_blank"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-[#FF4400] text-white font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 transition-all"
              >
                Browse Inventory
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a 
                href="#products"
                className="inline-flex items-center gap-2 px-8 py-4 border border-[#1A1A1A] hover:border-[#FF4400] hover:text-[#FF4400] transition-all uppercase tracking-widest"
              >
                View Selection
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
          <div className="w-6 h-10 border-2 border-[#1A1A1A] rounded-full flex justify-center">
            <motion.div 
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 bg-[#FF4400] rounded-full mt-2"
            />
          </div>
        </motion.div>
      </section>

      {/* Trust Badges */}
      <section className="border-y border-[#1A1A1A] bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-gray-400">
              <Clock className="w-5 h-5 text-[#FF4400]" />
              Versand innerhalb 48h
            </div>
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-gray-400">
              <Shield className="w-5 h-5 text-[#FF4400]" />
              Ehrliche Beschreibungen
            </div>
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-gray-400">
              <MessageCircle className="w-5 h-5 text-[#FF4400]" />
              Schneller Support
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
            className="mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
              CURRENT_<span className="text-[#FF4400]">INVENTORY</span>
            </h2>
            <p className="text-gray-400 uppercase tracking-widest text-sm">
              Alle Artikel auf Vinted verfügbar • Regelmäßig neue Drops
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <motion.a
                key={product.id}
                href={product.vintedUrl}
                target="_blank"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-[#1A1A1A] overflow-hidden hover:ring-2 hover:ring-[#FF4400] transition-all"
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
                  <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-[#0A0A0A]/80 backdrop-blur text-xs uppercase tracking-widest border border-[#FF4400] text-[#FF4400]">
                    {product.condition}
                  </div>
                </div>

                {/* Info */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{product.category}</p>
                      <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-[#FF4400] transition-colors">
                        {product.name}
                      </h3>
                    </div>
                    <span className="text-xl font-bold text-[#FF4400]">{product.price}</span>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#0A0A0A]">
                    <span className="text-sm text-gray-400 uppercase tracking-widest">Size {product.size}</span>
                    <span className="inline-flex items-center gap-1 text-sm uppercase tracking-widest text-[#FF4400] group-hover:gap-2 transition-all">
                      View <ExternalLink className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>

          <div className="mt-16 text-center">
            <a 
              href="https://www.vinted.de/member/3138250645-scndunit"
              target="_blank"
              className="inline-flex items-center gap-2 px-8 py-4 border border-[#FF4400] text-[#FF4400] hover:bg-[#FF4400] hover:text-white transition-all uppercase tracking-widest"
            >
              Alle Artikel auf Vinted <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-[#1A1A1A] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(255,68,0,0.03)_50%,transparent_51%)] bg-[length:20px_20px]" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
                ABOUT_<span className="text-[#FF4400]">UNIT</span>
              </h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  SCND UNIT ist ein Curated Reselling-Projekt aus Bad Kreuznach. Wir suchen die besten Vintage-Pieces, Streetwear-Klassiker und Y2K-Schnäppchen – und bringen sie zu dir.
                </p>
                <p>
                  Unser Fokus liegt auf ehrlichen Beschreibungen, schnellem Versand (innerhalb 48h) und einem sorgfältig ausgewählten Inventar. Von Gorpcore-Utility bis zu Vintage-Grails: Jedes Piece wird von uns geprüft und fotografiert.
                </p>
                <p className="text-[#FF4400] font-bold uppercase tracking-widest text-sm">
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
              <div className="aspect-square bg-[#0A0A0A] border border-[#FF4400]/20 p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl font-bold text-[#FF4400]/20 mb-4">SCND</div>
                  <div className="grid grid-cols-2 gap-4 text-sm uppercase tracking-widest">
                    <div className="p-4 bg-[#1A1A1A] border border-[#0A0A0A]">
                      <span className="block text-2xl font-bold text-[#FF4400]">100%</span>
                      <span className="text-gray-500">Authentic</span>
                    </div>
                    <div className="p-4 bg-[#1A1A1A] border border-[#0A0A0A]">
                      <span className="block text-2xl font-bold text-[#FF4400]">48h</span>
                      <span className="text-gray-500">Shipping</span>
                    </div>
                    <div className="p-4 bg-[#1A1A1A] border border-[#0A0A0A]">
                      <span className="block text-2xl font-bold text-[#FF4400]">DE</span>
                      <span className="text-gray-500">Based</span>
                    </div>
                    <div className="p-4 bg-[#1A1A1A] border border-[#0A0A0A]">
                      <span className="block text-2xl font-bold text-[#FF4400]">Y2K</span>
                      <span className="text-gray-500">Era</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
              GET_IN_<span className="text-[#FF4400]">TOUCH</span>
            </h2>
            <p className="text-gray-400 mb-12 uppercase tracking-widest">
              Fragen zu einem Artikel? Schreib uns auf Vinted oder Instagram.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://www.vinted.de/member/3138250645-scndunit"
                target="_blank"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#FF4400] text-white font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                Nachricht auf Vinted
              </a>
              <a 
                href="https://www.instagram.com/scnd.unit"
                target="_blank"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 border border-[#1A1A1A] hover:border-[#FF4400] hover:text-[#FF4400] transition-all uppercase tracking-widest"
              >
                <Instagram className="w-5 h-5" />
                @scnd.unit
              </a>
            </div>

            <div className="mt-16 flex items-center justify-center gap-2 text-sm text-gray-500 uppercase tracking-widest">
              <MapPin className="w-4 h-4 text-[#FF4400]" />
              Bad Kreuznach, Deutschland
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1A1A1A] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-bold tracking-tighter">
            <span className="text-[#FF4400]">SCND</span>_UNIT
          </div>
          
          <div className="flex gap-6 text-sm uppercase tracking-widest text-gray-500">
            <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="hover:text-[#FF4400] transition-colors">Vinted</a>
            <a href="https://www.instagram.com/scnd.unit" target="_blank" className="hover:text-[#FF4400] transition-colors">Instagram</a>
          </div>

          <p className="text-xs text-gray-600 uppercase tracking-widest">
            © 2024 SCND UNIT • Bad Kreuznach
          </p>
        </div>
      </footer>
    </div>
  );
}
