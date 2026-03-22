// app/page.tsx
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
  Filter
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const products = [
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
    name: "Nike Cropped Fleece Crewneck",
    category: "Pullover",
    price: "€19.90",
    size: "S",
    condition: "Gut",
    image: "https://images1.vinted.net/t/06_017e4_pCyDvQ8B8fsxkJLc8kkcih5c/f800/1774018713.webp?s=344d1d99621ba1a059d4c6c23b40a9a91126a78d",
    vintedUrl: "https://www.vinted.de/items/8440675699"
  },
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
  },
  {
    id: 16,
    name: "Adidas Track Jacket Grau Orange Trefoil Vintage",
    category: "Jacken",
    price: "€19",
    size: "S",
    condition: "Sehr gut",
    image: "https://images1.vinted.net/t/04_00abf_7YbNaZTcMox6pitYXHb1JfVM/f800/1774105278.webp?s=971b72dc6cd41e95a71679d02fcd67253792c4d4",
    vintedUrl: "https://www.vinted.de/items/8448527189"
  },
  {
    id: 17,
    name: "Tommy Hilfiger Athletics Fleece Sweatshirt Weiß Crewneck",
    category: "Sweatshirts",
    price: "€28",
    size: "L",
    condition: "Gut",
    image: "https://images1.vinted.net/t/06_004a4_SGRAKNYTRpMj34v7oF43YDtC/f800/1773748888.webp?s=ac945041e3ffdcf2d32dc6efd0611610e6d3b0dd",
    vintedUrl: "https://www.vinted.de/items/8417120287"
  },
  {
    id: 18,
    name: "Lacoste Polo Shirt Rosé",
    category: "Tops",
    price: "€18",
    size: "S",
    condition: "Gut",
    image: "https://images1.vinted.net/t/05_01390_Pg1hP2GnqgYcH5RRiDoRKiGF/f800/1774019111.webp?s=d37ff629d5afc1027d249258ed4ea4ae0283bca7",
    vintedUrl: "https://www.vinted.de/items/8440731520"
  },
  {
    id: 19,
    name: "Tommy Hilfiger Polo Shirt Grün Navy Streifen",
    category: "Tops",
    price: "€23",
    size: "XL",
    condition: "Gut",
    image: "https://images1.vinted.net/t/06_015ba_p2SHGGF5tRtxVmEBchizMM4K/f800/1774031657.webp?s=fc6b00a093c96077a401ee98bb88cf3e3fdae813",
    vintedUrl: "https://www.vinted.de/items/8441002241"
  },
  {
    id: 20,
    name: "Nike Park Trackjacket Windbreaker Weiß Blau",
    category: "Jacken",
    price: "€45",
    size: "S",
    condition: "Gut",
    image: "https://images1.vinted.net/t/01_0149d_Pi635amLLKJ8G9J8vFgXwmUD/f800/1774110116.webp?s=dbe91471c2dfdb2d26b7762da5049ed31326caad",
    vintedUrl: "https://www.vinted.de/items/8449417132"
  },
  {
    id: 21,
    name: "Helly Hansen Fleece Quarter Zip Grau Orange Outdoor",
    category: "Pullover",
    price: "€25",
    size: "XXL",
    condition: "Sehr gut",
    image: "https://images1.vinted.net/t/05_00f80_irY9g4qnXgHPKNyhKZhBtGKV/f800/1773518023.webp?s=097a875ccde9384360722c3d9e3c5f2ee14fe893",
    vintedUrl: "https://www.vinted.de/items/8395132293"
  },
  {
    id: 22,
    name: "Nike Vintage Sweatshirt Big Swoosh Grün Crewneck",
    category: "Sweatshirts",
    price: "€34",
    size: "XL",
    condition: "Gut",
    image: "https://images1.vinted.net/t/05_01641_LVv5eNLqRADoWxsgH1sh2MVi/f800/1773748132.webp?s=700d6c354687e1173f3442e7d2dbd7a2df52e5a7",
    vintedUrl: "https://www.vinted.de/items/8417010800"
  },
  {
    id: 23,
    name: "Nike Vintage Fleece Jacket Grau Thumbholes Athletic Dept",
    category: "Jacken",
    price: "€22",
    size: "XS",
    condition: "Gut",
    image: "https://images1.vinted.net/t/05_015b6_j3dLkRBcqDkBNqvfCZWqC5Hf/f800/1773571927.webp?s=1c98260b24d469a21ae2ada9e313b498ad7f8536",
    vintedUrl: "https://www.vinted.de/items/8398245553"
  },
  {
    id: 24,
    name: "Vintage Starter Green Bay Packers 96/97 Champs Crewneck",
    category: "Sweatshirts",
    price: "€33",
    size: "XL",
    condition: "Gut",
    image: "https://images1.vinted.net/t/04_0138e_Th8543Q3YYQnnRR1PfXZR3QT/f800/1774018164.webp?s=4eef4ca660ee11d184712b68f34c7d6ea4a3531d",
    vintedUrl: "https://www.vinted.de/items/8440597862"
  },
  {
    id: 26,
    name: "Reebok New York Jets Fleece Jacke Grün NFL Vintage",
    category: "Jacken",
    price: "€25",
    size: "XXL",
    condition: "Gut",
    image: "https://images1.vinted.net/t/03_007ba_6Ex7LXe1ZpJN7RhzMMJ3sZ1N/f800/1773748600.webp?s=fbdfcca8432bd8897e2bb963f8b47fd15f85c268",
    vintedUrl: "https://www.vinted.de/items/8417078850"
  },
  {
    id: 27,
    name: "Nike Puffer Jacke Türkis XS",
    category: "Jacken",
    price: "€25",
    size: "XS",
    condition: "Gut",
    image: "https://images1.vinted.net/t/05_0135f_NGV5Rp1E8o2oVKDyfZrdsPvC/f800/1773062786.webp?s=96bcec68740e0106d8f33a95ca73a282e23d3dc0",
    vintedUrl: "https://www.vinted.de/items/8352298824"
  },
  {
    id: 28,
    name: "Nike Windbreaker Jacke Blau Swoosh Vintage",
    category: "Jacken",
    price: "€38",
    size: "L",
    condition: "Gut",
    image: "https://images1.vinted.net/t/06_01780_iUoK85Pss7d9DfczowRxQRN2/f800/1773706305.webp?s=dcf40dce54cb826d2959e92f24fa0a035a4f885d",
    vintedUrl: "https://www.vinted.de/items/8414803706"
  },
  {
    id: 29,
    name: "Lacoste Fleece Jacke Schwarz Vintage Crocodile",
    category: "Jacken",
    price: "€25",
    size: "L",
    condition: "Zufriedenstellend",
    image: "https://images1.vinted.net/t/06_0031e_g9uWwjTMgjCnyhFmHYUtGdAY/f800/1772751651.webp?s=8a2e8ec6d39d605d6cdb16909eb2de94bab098f9",
    vintedUrl: "https://www.vinted.de/items/8323619467"
  },
  {
    id: 30,
    name: "Helly Hansen Fleece 1/4 Zip Vintage Lila Violett",
    category: "Pullover",
    price: "€19",
    size: "M",
    condition: "Zufriedenstellend",
    image: "https://images1.vinted.net/t/06_01cd1_6qbnSHZGDRYnHj5gaTWwLupR/f800/1773705616.webp?s=36df5cd624355f745cf87b4b846c1f70cac6f14a",
    vintedUrl: "https://www.vinted.de/items/8414793323"
  },
  {
    id: 31,
    name: "Adidas Fleece Pullover Half Zip Grau Rot Vintage",
    category: "Pullover",
    price: "€20",
    size: "XL",
    condition: "Zufriedenstellend",
    image: "https://images1.vinted.net/t/01_02099_LjqYaitr28tJxU1XXV2pWTxw/f800/1772822269.webp?s=bfedb24ac87414a8ac6cbdf48003c1017d3d5d5f",
    vintedUrl: "https://www.vinted.de/items/8329226132"
  },
  {
    id: 32,
    name: "NHL Washington Capitals Fleece Sherpa Vintage",
    category: "Pullover",
    price: "€22",
    size: "M",
    condition: "Gut",
    image: "https://images1.vinted.net/t/06_01994_ZTAGXe1deKUSF8mxBsVj4Gfs/f800/1773499294.webp?s=526701d028e6f005a66174a4c9de1092d25a958e",
    vintedUrl: "https://www.vinted.de/items/8391936347"
  },
  {
    id: 33,
    name: "Nike Vintage Fleece Pullover Rot Swoosh Crewneck",
    category: "Pullover",
    price: "€29",
    size: "L",
    condition: "Gut",
    image: "https://images1.vinted.net/t/05_0128e_Muquhvc4yd3ECMa3jbTzqC8V/f800/1773704829.webp?s=5c2d68463c57c351099b41e5d9bb6dc19eaa70b8",
    vintedUrl: "https://www.vinted.de/items/8414779381"
  },
  {
    id: 34,
    name: "Chaps Ralph Lauren Sweatshirt Vintage Faded Grau",
    category: "Sweatshirts",
    price: "€26",
    size: "L",
    condition: "Gut",
    image: "https://images1.vinted.net/t/05_01bfc_zekkHsmBD43m1SQymkHsGJNY/f800/1774105800.webp?s=b766563db47939331f168ea3b917b73acd3826fe",
    vintedUrl: "https://www.vinted.de/items/8448623083"
  },
  {
    id: 35,
    name: "Helly Hansen Fleece Pullover Vintage Y2K Half Zip",
    category: "Pullover",
    price: "€16",
    size: "XL",
    condition: "Zufriedenstellend",
    image: "https://images1.vinted.net/t/05_01efb_eiqNWQqeTyLPHPNBiLXHDZms/f800/1772753053.webp?s=5aa5b9dfa0de9fc6d8626ab262f74630b64df657",
    vintedUrl: "https://www.vinted.de/items/8323660018"
  },
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
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans selection:bg-[#FF4400] selection:text-white">
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

      <nav className={`fixed w-full z-40 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0A]/90 backdrop-blur-md py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold tracking-tighter">
            <span className="text-[#FF4400]">SCND</span>_UNIT
          </motion.div>
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

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(26,26,26,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(26,26,26,0.5)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
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

      <section className="border-y border-[#1A1A1A] bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-gray-400"><Clock className="w-5 h-5 text-[#FF4400]" />Versand innerhalb 48h</div>
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-gray-400"><Shield className="w-5 h-5 text-[#FF4400]" />Ehrliche Beschreibungen</div>
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-gray-400"><MessageCircle className="w-5 h-5 text-[#FF4400]" />Schneller Support</div>
          </div>
        </div>
      </section>

      <section id="products" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">CURRENT_<span className="text-[#FF4400]">INVENTORY</span></h2>
            <p className="text-gray-400 uppercase tracking-widest text-sm">Alle Artikel auf Vinted verfügbar • Regelmäßig neue Drops</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center gap-3 mb-12 flex-wrap">
            <Filter className="w-4 h-4 text-[#FF4400]" />
            {allCategories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-xs uppercase tracking-widest border transition-all ${activeCategory === cat ? 'border-[#FF4400] text-[#FF4400] bg-[#FF4400]/10' : 'border-[#1A1A1A] text-gray-400 hover:border-[#FF4400] hover:text-[#FF4400]'}`}>
                {cat}
              </button>
            ))}
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.div key={activeCategory} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product, index) => (
                <motion.a key={product.id} href={product.vintedUrl} target="_blank" rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
                  className="group relative bg-[#1A1A1A] overflow-hidden hover:ring-2 hover:ring-[#FF4400] transition-all">
                  <div className="aspect-[4/5] relative overflow-hidden bg-[#0A0A0A]">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10" />
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {product.condition !== "–" && (
                      <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-[#0A0A0A]/80 backdrop-blur text-xs uppercase tracking-widest border border-[#FF4400] text-[#FF4400]">
                        {product.condition}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{product.category}</p>
                        <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-[#FF4400] transition-colors leading-tight">{product.name}</h3>
                      </div>
                      <span className="text-xl font-bold text-[#FF4400] shrink-0">{product.price}</span>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#0A0A0A]">
                      <span className="text-sm text-gray-400 uppercase tracking-widest">{product.size !== "–" ? `Size ${product.size}` : ""}</span>
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

      <section id="about" className="py-24 bg-[#1A1A1A] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(255,68,0,0.03)_50%,transparent_51%)] bg-[length:20px_20px]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
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
                    <div className="p-4 bg-[#1A1A1A] border border-[#0A0A0A]"><span className="block text-2xl font-bold text-[#FF4400]">32+</span><span className="text-gray-500">Items</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-24 px-6">
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

      <footer className="border-t border-[#1A1A1A] py-12 px-6">
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
