// src/components/Navigation.tsx
'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';

interface NavigationProps {
  scrolled: boolean;
}

export function Navigation({ scrolled }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className={`fixed w-full z-40 transition-all duration-300 ${scrolled ? 'bg-[var(--bg-primary)]/90 backdrop-blur-md py-4' : 'bg-transparent py-6'}`}>
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-tighter">
          <span className="text-[#FF4400]">SCND</span>_UNIT
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#products" className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors">Inventory</a>
          <a href="#about" className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors">About</a>
          <a href="#contact" className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors">Contact</a>
          <ThemeToggle />
          <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="px-6 py-2 bg-[#FF4400] text-white text-sm uppercase tracking-widest hover:bg-[#FF4400]/80 transition-colors">
            Shop Vinted
          </a>
        </div>

        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }} 
            className="md:hidden bg-[var(--bg-primary)] border-t border-[var(--border-color)]"
          >
            <div className="flex flex-col p-6 gap-4">
              <a href="#products" onClick={() => setIsMenuOpen(false)} className="text-lg uppercase tracking-widest text-left hover:text-[#FF4400] transition-colors">
                Inventory
              </a>
              <a href="#about" onClick={() => setIsMenuOpen(false)} className="text-lg uppercase tracking-widest text-left hover:text-[#FF4400] transition-colors">
                About
              </a>
              <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-lg uppercase tracking-widest text-left hover:text-[#FF4400] transition-colors">
                Contact
              </a>
              <div className="pt-2">
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
