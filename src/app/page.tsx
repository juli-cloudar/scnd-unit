// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, MessageCircle, ArrowRight, MapPin, Clock, Shield, ExternalLink, Menu, X, Filter } from 'lucide-react';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

const products = [
  { id: 1, name: "The North Face Pufferjacke", category: "Jacken", price: "€42", size: "L", condition: "Gut", image: "https://images1.vinted.net/t/01_01a1a_PD6Trf4ARHNYjDcC4aYXdKYm/f800/1772736752.webp?s=636466168eff9afa78b1c32ef10e833a86c8fc9d", vintedUrl: "https://www.vinted.de/items/8322236551" },
  { id: 2, name: "Lacoste Track Jacket Windbreaker", category: "Jacken", price: "€49", size: "M", condition: "Sehr gut", image: "https://images1.vinted.net/t/03_0231e_QGGDXtYBsigJX29VaVt7m9TN/f800/1773579801.webp?s=fc915e5f5a759d5d414adb1d7bab3018951f0cfd", vintedUrl: "https://www.vinted.de/items/8400248375" },
  { id: 3, name: "Adidas Originals Puffer Jacke", category: "Jacken", price: "€22", size: "XL", condition: "Zufriedenstellend", image: "https://images1.vinted.net/t/04_01bf0_D48FsSLrpGGLv7j1HQHuiNg9/f800/1772749815.webp?s=fa82c0bc1c848af67bddee3c53bf7c407a5d1325", vintedUrl: "https://www.vinted.de/items/8323545774" },
  { id: 4, name: "Adidas Originals Track Jacket Rot", category: "Jacken", price: "€26", size: "S", condition: "Sehr gut", image: "https://images1.vinted.net/t/06_001da_kMqrpNgt9CkFx5rm1fFVLj1k/f800/1773951754.webp?s=91233be5e2bf86cf89e5473b18766b27d0a72dd0", vintedUrl: "https://www.vinted.de/items/8436257572" },
  { id: 5, name: "Adidas Fleece Jacke Schwarz", category: "Jacken", price: "€14", size: "XL", condition: "Zufriedenstellend", image: "https://images1.vinted.net/t/05_001b5_rAqzJHjisGiWzahLBgUXmDP3/f800/1773747209.webp?s=585faadb3805d1e5e7cefe12c0b935c9a8190b05", vintedUrl: "https://www.vinted.de/items/8416878208" },
  { id: 6, name: "Reebok NY Rangers Fleecejacke", category: "Jacken", price: "€29.90", size: "M", condition: "Gut", image: "https://images1.vinted.net/t/05_01ab1_3koKJ37q95NxbDyxh9jckewk/f800/1772721377.webp?s=8dd7f1c7f90b5840f06bcbbcaae85e0d3505b766", vintedUrl: "https://www.vinted.de/items/8320129694" },
  { id: 7, name: "La Martina Steppweste", category: "Jacken", price: "€25", size: "S/M", condition: "Sehr gut", image: "https://images1.vinted.net/t/01_00220_4XS4MDyF8v3mLJ467BjVa5v5/f800/1773668985.webp?s=975f93870ea40b24b2cf7efa6eee5952cd91c296", vintedUrl: "https://www.vinted.de/items/8410133047" },
  { id: 8, name: "Tommy Hilfiger Teddy Fleece Hoodie", category: "Pullover", price: "€25", size: "L", condition: "Gut", image: "https://images1.vinted.net/t/06_0163c_ZyVmFPAa4ouSgGTGkGUMWQjZ/f800/1774106471.webp?s=65e4615b32b4005a581015564d8ea60b5cb2d2fd", vintedUrl: "https://www.vinted.de/items/8448746258" },
  { id: 9, name: "Tommy Hilfiger Teddy Fleece Quarter Zip", category: "Pullover", price: "€22", size: "L", condition: "Zufriedenstellend", image: "https://images1.vinted.net/t/04_00377_R6n53bTCW16s9DGUaBQdeASQ/f800/1773749145.webp?s=cb2fb45d8d7fe0ab5d41f04ab4826a88a7bcb90c", vintedUrl: "https://www.vinted.de/items/8417156956" },
  { id: 10, name: "Helly Hansen Fleece Half Zip", category: "Pullover", price: "€25", size: "M", condition: "Gut", image: "https://images1.vinted.net/t/06_01462_7TEANiPZRgaFsLppzoghynVv/f800/1773706461.webp?s=2a329a1d9cc382e35c8450cd672820614e86182b", vintedUrl: "https://www.vinted.de/items/8414805903" },
  { id: 11, name: "Timberland Fleece Quarter Zip", category: "Pullover", price: "€26", size: "XL", condition: "Gut", image: "https://images1.vinted.net/t/06_00040_oyQtkRb6wgNfA18ZkhQKXy2z/f800/1774017964.webp?s=b34f3fb33aed2f2cac2df123b39d41514759cb41", vintedUrl: "https://www.vinted.de/items/8440569340" },
  { id: 12, name: "Nike Cropped Fleece Crewneck", category: "Pullover", price: "€19.90", size: "S", condition: "Gut", image: "https://images1.vinted.net/t/06_017e4_pCyDvQ8B8fsxkJLc8kkcih5c/f800/1774018713.webp?s=344d1d99621ba1a059d4c6c23b40a9a91126a78d", vintedUrl: "https://www.vinted.de/items/8440675699" },
  { id: 13, name: "Lee Sport Wisconsin Badgers Sweatshirt", category: "Sweatshirts", price: "€34", size: "L", condition: "Gut", image: "https://images1.vinted.net/t/06_0084e_Yw7gdPLWQ8m5HQtQzBXhs9xm/f800/1773695157.webp?s=877c1c694927693e82f8b9d6986de17cce967ae9", vintedUrl: "https://www.vinted.de/items/8414236896" },
  { id: 14, name: "Lee Sport Wisconsin Badgers Crewneck", category: "Sweatshirts", price: "€36", size: "L", condition: "Gut", image: "https://images1.vinted.net/t/06_0022a_fHhH2m857kZutLrvY1c8jjed/f800/1773705197.webp?s=1451f3a3c438f0383e10019ec873e8763784b9a0", vintedUrl: "https://www.vinted.de/items/8414786154" },
  { id: 15, name: "Vintage England Strickjacke Union Jack", category: "Sweatshirts", price: "€32", size: "M", condition: "Gut", image: "https://images1.vinted.net/t/05_00a99_3fq7YmVQH7r92JMuAXifxHvC/f800/1774031494.webp?s=3d255c9b1c3ede9d927d363c7a1e9f59d66b6f3a", vintedUrl: "https://www.vinted.de/items/8441012104" },
  { id: 16, name: "Artikel ansehen", category: "Sweatshirts", price: "–", size: "–", condition: "–", image: "/api/placeholder/400/500", vintedUrl: "https://www.vinted.de/items/8329226132" },
  { id: 17, name: "Artikel ansehen", category: "Sweatshirts", price: "–", size: "–", condition: "–", image: "/api/placeholder/400/500", vintedUrl: "https://www.vinted.de/items/8323619467" },
  { id: 18, name: "Artikel ansehen", category: "Pullover", price: "–", size: "–", condition: "–", image: "/api/placeholder/400/500", vintedUrl: "https://www.vinted.de/items/8417078850" },
  { id: 19, name: "Artikel ansehen", category: "Pullover", price: "–", size: "–", condition: "–", image: "/api/placeholder/400/500", vintedUrl: "https://www.vinted.de/items/8396015207" },
  { id: 20, name: "Artikel ansehen", category: "Sweatshirts", price: "–", size: "–", condition: "–", image: "/api/placeholder/400/500", vintedUrl: "https://www.vinted.de/items/8414779381" },
  { id: 21, name: "Artikel ansehen", category: "Sweatshirts", price: "–", size: "–", condition: "–", image: "/api/placeholder/400/500", vintedUrl: "https://www.vinted.de/items/8414803706" },
  { id: 22, name: "Artikel ansehen", category: "Jacken", price: "–", size: "–", condition: "–", image: "/api/placeholder/400/500", vintedUrl: "https://www.vinted.de/items/8448623083" },
  { id: 23, name: "Artikel ansehen", category: "Sweatshirts", price: "–", size: "–", condition: "–", image: "/api/placeholder/400/500", vintedUrl: "https://www.vinted.de/items/8414768409" },
  { id: 24, name: "Artikel ansehen", category: "Pullover", price: "–", size: "–", condition: "–", image: "/api/placeholder/400/500", vintedUrl: "https://www.vinted.de/items/8417120287" },
  { id: 25, name: "Artikel ansehen", category: "Jacken", price: "–", size: "–", condition: "–", image: "/api/placeholder/400/500", vintedUrl: "https://www.vinted.de/items/8448527189" },
  { id: 26, name: "Artikel ansehen", category: "Pullover", price: "–", size: "–", condition: "–", image: "/api/placeholder/400/500", vintedUrl: "https://www.vinted.de/items/8440731520" },
  { id: 27, name: "Artikel ansehen", category: "Sweatshirts", price: "–", size: "–", condition: "–", image: "/api/placeholder/400/500", vintedUrl: "https://www.vinted.de/items/8441002241" },
  { id: 28, name: "Artikel ansehen", category: "Jacken", price: "–", size: "–", condition: "–", image: "/api/placeholder/400/500", vintedUrl: "https://www.vinted.de/items/8395132293" },
  { id: 29, name: "Artikel ansehen", category: "Pullover", price: "–", size: "–", condition: "–", image: "/api/placeholder/400/500", vintedUrl: "https://www.vinted.de/items/8417010800" },
  { id: 30, name: "Artikel ansehen", category: "Jacken", price: "–", size: "–", condition: "–", image: "/api/placeholder/400/500", vintedUrl: "https://www.vinted.de/items/8398245553" },
  { id: 31, name: "Artikel ansehen", category: "Pullover", price: "–", size: "–", condition: "–", image: "/api/placeholder/400/500", vintedUrl: "https://www.vinted.de/items/8440597862" },
  { id: 32, name: "Artikel ansehen", category: "Jacken", price: "–", size: "–", condition: "–", image: "/api/placeholder/400/500", vintedUrl: "https://www.vinted.de/items/8323660018" },
];
