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

  const scrollToGame = () => {
    const gameSection = document.getElementById('game');
    if (gameSection) {
      gameSection.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className={`fixed w-full z-40 transition-all duration-300 ${scrolled ? 'bg-[var(--bg-primary)]/90 backdrop-blur-md py-4' : 'bg-transparent py-6'}`}>
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-tighter">
          <span className="text-[#FF4400]">SCND</span>_UNIT
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#products" className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors">Inventory</a>
          <a href="#about" className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors">About</a>
          <a href="#contact" className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors">Contact</a>
          
          {/* SCND DROP Game Button - Design 4 Neon-Pixel */}
          <button
            onClick={scrollToGame}
            className="group relative px-4 py-2 bg-[var(--bg-secondary)] border-2 border-[#FF4400]/40 rounded-lg hover:border-[#FF4400] hover:shadow-[0_0_15px_#FF4400] transition-all duration-300"
          >
            <div className="flex items-center gap-2">
              {/* Linker Tetris-Block */}
              <div className="flex gap-0.5">
                <div className="w-2 h-2 bg-[#FF4400] rounded-sm group-hover:animate-pulse"></div>
                <div className="w-2 h-2 bg-[#FF4400] rounded-sm"></div>
                <div className="w-2 h-2 bg-[#FF4400] rounded-sm"></div>
                <div className="w-2 h-2 bg-[#FF4400] rounded-sm"></div>
              </div>
              
              {/* SCND_DROP Schriftzug */}
              <span className="font-mono font-bold text-sm tracking-tighter">
                <span className="text-[var(--text-primary)] group-hover:text-[#FF4400] transition-colors">SCND</span>
                <span className="text-[#FF4400]">_</span>
                <span className="text-[var(--text-primary)] group-hover:text-[#FF4400] transition-colors">DROP</span>
              </span>
              
              {/* Rechter Game-Indikator */}
              <div className="flex items-center gap-1">
                <span className="text-sm group-hover:animate-pulse">🎮</span>
                <span className="text-xs text-[#FF4400] group-hover:translate-x-0.5 transition-transform">▶</span>
              </div>
            </div>
            
            {/* Neon-Glow Effekt beim Hover */}
            <div className="absolute inset-0 rounded-lg bg-[#FF4400]/0 group-hover:bg-[#FF4400]/5 transition-all pointer-events-none"></div>
          </button>
          
          <ThemeToggle />
          <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="px-6 py-2 bg-[#FF4400] text-white text-sm uppercase tracking-widest hover:bg-[#FF4400]/80 transition-colors">
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
              <button
                onClick={scrollToGame}
                className="text-lg uppercase tracking-widest text-left hover:text-[#FF4400] transition-colors flex items-center gap-2"
              >
                <span>🎮</span> SCND DROP
              </button>
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
