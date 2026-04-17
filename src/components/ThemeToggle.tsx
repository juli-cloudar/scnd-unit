// src/components/ThemeToggle.tsx
'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

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
    // Debug-Ausgabe in der Konsole
    console.log('Theme changed to:', dark ? 'dark' : 'light');
    console.log('HTML classes:', document.documentElement.classList);
  };

  const toggleTheme = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    applyTheme(newIsDark);
  };

  return (
    <button
      onClick={toggleTheme}
      onTouchEnd={toggleTheme}
      className="p-2 rounded-full bg-[var(--bg-secondary)] border border-[#FF4400]/30 text-[var(--text-secondary)] hover:text-[#FF4400] hover:border-[#FF4400] transition-all active:scale-95"
      aria-label="Theme umschalten"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
