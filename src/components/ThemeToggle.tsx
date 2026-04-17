// src/components/ThemeToggle.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const isProcessing = useRef(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDarkMode = savedTheme === 'dark' || (savedTheme === null && true);
    setIsDark(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    // Verhindert doppelte Ausführung
    if (isProcessing.current) return;
    isProcessing.current = true;
    
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    // Entsperrt nach kurzer Zeit
    setTimeout(() => {
      isProcessing.current = false;
    }, 200);
  };

  return (
    <button
      onClick={toggleTheme}
      onTouchStart={(e) => {
        e.preventDefault();
        toggleTheme();
      }}
      className="p-2 rounded-full bg-[var(--bg-secondary)] border border-[#FF4400]/30 text-[var(--text-secondary)] hover:text-[#FF4400] hover:border-[#FF4400] transition-all active:scale-95"
      aria-label="Theme umschalten"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
