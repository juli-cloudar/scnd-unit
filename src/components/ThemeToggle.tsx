// src/components/ThemeToggle.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const isToggling = useRef(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDarkMode = savedTheme === 'dark' || (savedTheme === null && true);
    setIsDark(isDarkMode);
    applyTheme(isDarkMode);
  }, []);

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleTheme = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Verhindert doppelte Ausführung
    if (isToggling.current) return;
    isToggling.current = true;
    
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    applyTheme(newIsDark);
    
    setTimeout(() => {
      isToggling.current = false;
    }, 100);
  };

  return (
    <button
      onClick={toggleTheme}
      onTouchStart={toggleTheme}
      onTouchEnd={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="p-2 rounded-full bg-[var(--bg-secondary)] border border-[#FF4400]/30 text-[var(--text-secondary)] hover:text-[#FF4400] hover:border-[#FF4400] transition-all active:scale-95 touch-manipulation"
      aria-label="Theme umschalten"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
