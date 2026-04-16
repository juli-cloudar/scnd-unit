// src/components/Navigation.tsx
'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavigationProps {
  scrolled: boolean;
}

export function Navigation({ scrolled }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className={`fixed w-full z-40 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0A]/90 backdrop-blur-md py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-tighter">
          <span className="text-[#FF4400]">SCND</span>_UNIT
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => scrollToSection('products')}
            className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors cursor-pointer"
          >
            Inventory
          </button>
          <button 
            onClick={() => scrollToSection('about')}
            className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors cursor-pointer"
          >
            About
          </button>
          <button 
            onClick={() => scrollToSection('contact')}
            className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors cursor-pointer"
          >
            Contact
          </button>
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

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }} 
            className="md:hidden bg-[#0A0A0A] border-t border-[#1A1A1A]"
          >
            <div className="flex flex-col p-6 gap-4">
              <button 
                onClick={() => scrollToSection('products')}
                className="text-lg uppercase tracking-widest text-left hover:text-[#FF4400] transition-colors"
              >
                Inventory
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="text-lg uppercase tracking-widest text-left hover:text-[#FF4400] transition-colors"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-lg uppercase tracking-widest text-left hover:text-[#FF4400] transition-colors"
              >
                Contact
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
