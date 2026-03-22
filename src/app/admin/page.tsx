'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ExternalLink, Copy, Check, RefreshCw, ShoppingBag } from 'lucide-react';
interface Product {
  id: number; name: string; category: string; price: string;
  size: string; condition: string; image: string; vintedUrl: string;
}
const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: "The North Face Pufferjacke", category: "Jacken", price: "€42", size: "L", condition: "Gut", image: "https://images1.vinted.net/t/01_01a1a_PD6Trf4ARHNYjDcC4aYXdKYm/f800/1772736752.webp?s=636466168eff9afa78b1c32ef10e833a86c8fc9d", vintedUrl: "https://www.vinted.de/items/8322236551" },
  { id: 2, name: "Lacoste Track Jacket Windbreaker", category: "Jacken", price: "€49", size: "M", condition: "Sehr gut", image: "https://images1.vinted.net/t/03_0231e_QGGDXtYBsigJX29VaVt7m9TN/f800/1773579801.webp?s=fc915e5f5a759d5d414adb1d7bab3018951f0cfd", vintedUrl: "https://www.vinted.de/items/8400248375" },
  { id: 3, name: "Adidas Originals Puffer Jacke Blau", category: "Jacken", price: "€22", size: "XL", condition: "Zufriedenstellend", image: "https://images1.vinted.net/t/04_01bf0_D48FsSLrpGGLv7j1HQHuiNg9/f800/1772749815.webp?s=fa82c0bc1c848af67bddee3c53bf7c407a5d1325", vintedUrl: "https://www.vinted.de/items/8323545774" },
  { id: 4, name: "Adidas Originals Track Jacket Rot", category: "Jacken", price: "€26", size: "S", condition: "Sehr gut", image: "https://images1.vinted.net/t/06_001da_kMqrpNgt9CkFx5rm1fFVLj1k/f800/1773951754.webp?s=91233be5e2bf86cf89e5473b18766b27d0a72dd0", vintedUrl: "https://www.vinted.de/items/8436257572" },
  { id: 5, name: "Adidas Fleece Jacke Schwarz", category: "Jacken", price: "€14", size: "XL", condition: "Zufriedenstellend", image: "https://images1.vinted.net/t/05_001b5_rAqzJHjisGiWzahLBgUXmDP3/f800/1773747209.webp?s=585faadb3805d1e5e7cefe12c0b935c9a8190b05", vintedUrl: "https://www.vinted.de/items/8416878208" },
  { id: 6, name: "Reebok NY Rangers Fleecejacke", category: "Jacken", price: "€29.90", size: "M", condition: "Gut", image: "https://images1.vinted.net/t/05_01ab1_3koKJ37q95NxbDyxh9jckewk/f800/1772721377.webp?s=8dd7f1c7f90b5840f06bcbbcaae85e0d3505b766", vintedUrl: "https://www.vinted.de/items/8320129694" },
  { id: 7, name: "La Martina Steppweste Schwarz Rot", category: "Jacken", price: "€25", size: "S/M", condition: "Sehr gut", image: "https://images1.vinted.net/t/01_00220_4XS4MDyF8v3mLJ467BjVa5v5/f800/1773668985.webp?s=975f93870ea40b24b2cf7efa6eee5952cd91c296", vintedUrl: "https://www.vinted.de/items/8410133047" },
  { id: 8, name: "Tommy Hilfiger Teddy Fleece Hoodie", category: "Pullover", price: "€25", size: "L", condition: "Gut", image: "https://images1.vinted.net/t/06_0163c_ZyVmFPAa4ouSgGTGkGUMWQjZ/f800/1774106471.webp?s=65e4615b32b4005a581015564d8ea60b5cb2d2fd", vintedUrl: "https://www.vinted.de/items/8448746258" },
  { id: 9, name: "Tommy Hilfiger Teddy Fleece Quarter Zip", category: "Pullover", price: "€22", size: "L", condition: "Zufriedenstellend", image: "https://images1.vinted.net/t/04_00377_R6n53bTCW16s9DGUaBQdeASQ/f800/1773749145.webp?s=cb2fb45d8d7fe0ab5d41f04ab4826a88a7bcb90c", vintedUrl: "https://www.vinted.de/items/8417156956" },
  { id: 10, name: "Helly Hansen Fleece Half Zip", category: "Pullover", price: "€25", size: "M", condition: "Gut", image: "https://images1.vinted.net/t/06_01462_7TEANiPZRgaFsLppzoghynVv/f800/1773706461.webp?s=2a329a1d9cc382e35c8450cd672820614e86182b", vintedUrl: "https://www.vinted.de/items/8414805903" },
  { id: 11, name: "Timberland Fleece Quarter Zip", category: "Pullover", price: "€26", size: "XL", condition: "Gut", image: "https://images1.vinted.net/t/06_00040_oyQtkRb6wgNfA18ZkhQKXy2z/f800/1774017964.webp?s=b34f3fb33aed2f2cac2df123b39d41514759cb41", vintedUrl: "https://www.vinted.de/items/8440569340" },
  { id: 12, name: "Nike Cropped Fleece Crewneck", category: "Pullover", price: "€19.90", size: "S", condition: "Gut", image: "https://images1.vinted.net/t/06_017e4_pCyDvQ8B8fsxkJLc8kkcih5c/f800/1774018713.webp?s=344d1d99621ba1a059d4c6c23b40a9a91126a78d", vintedUrl: "https://www.vinted.de/items/8440675699" },
  { id: 13, name: "Lee Sport Wisconsin Badgers Sweatshirt", category: "Sweatshirts", price: "€34", size: "L", condition: "Gut", image: "https://images1.vinted.net/t/06_0084e_Yw7gdPLWQ8m5HQtQzBXhs9xm/f800/1773695157.webp?s=877c1c694927693e82f8b9d6986de17cce967ae9", vintedUrl: "https://www.vinted.de/items/8414236896" },
  { id: 14, name: "Lee Sport Wisconsin Badgers Crewneck", category: "Sweatshirts", price: "€36", size: "L", condition: "Gut", image: "https://images1.vinted.net/t/06_0022a_fHhH2m857kZutLrvY1c8jjed/f800/1773705197.webp?s=1451f3a3c438f0383e10019ec873e8763784b9a0", vintedUrl: "https://www.vinted.de/items/8414786154" },
  { id: 15, name: "Vintage England Strickjacke Union Jack", category: "Sweatshirts", price: "€32", size: "M", condition: "Gut", image: "https://images1.vinted.net/t/05_00a99_3fq7YmVQH7r92JMuAXifxHvC/f800/1774031494.webp?s=3d255c9b1c3ede9d927d363c7a1e9f59d66b6f3a", vintedUrl: "https://www.vinted.de/items/8441012104" },
  { id: 16, name: "Adidas Track Jacket Grau Orange Trefoil", category: "Jacken", price: "€19", size: "S", condition: "Sehr gut", image: "https://images1.vinted.net/t/04_00abf_7YbNaZTcMox6pitYXHb1JfVM/f800/1774105278.webp?s=971b72dc6cd41e95a71679d02fcd67253792c4d4", vintedUrl: "https://www.vinted.de/items/8448527189" },
  { id: 17, name: "Tommy Hilfiger Athletics Fleece Sweatshirt", category: "Sweatshirts", price: "€28", size: "L", condition: "Gut", image: "https://images1.vinted.net/t/06_004a4_SGRAKNYTRpMj34v7oF43YDtC/f800/1773748888.webp?s=ac945041e3ffdcf2d32dc6efd0611610e6d3b0dd", vintedUrl: "https://www.vinted.de/items/8417120287" },
  { id: 18, name: "Lacoste Polo Shirt Rose", category: "Tops", price: "€18", size: "S", condition: "Gut", image: "https://images1.vinted.net/t/05_01390_Pg1hP2GnqgYcH5RRiDoRKiGF/f800/1774019111.webp?s=d37ff629d5afc1027d249258ed4ea4ae0283bca7", vintedUrl: "https://www.vinted.de/items/8440731520" },
  { id: 19, name: "Tommy Hilfiger Polo Shirt Gruen Navy", category: "Tops", price: "€23", size: "XL", condition: "Gut", image: "https://images1.vinted.net/t/06_015ba_p2SHGGF5tRtxVmEBchizMM4K/f800/1774031657.webp?s=fc6b00a093c96077a401ee98bb88cf3e3fdae813", vintedUrl: "https://www.vinted.de/items/8441002241" },
  { id: 20, name: "Nike Park Trackjacket Windbreaker", category: "Jacken", price: "€45", size: "S", condition: "Gut", image: "https://images1.vinted.net/t/01_0149d_Pi635amLLKJ8G9J8vFgXwmUD/f800/1774110116.webp?s=dbe91471c2dfdb2d26b7762da5049ed31326caad", vintedUrl: "https://www.vinted.de/items/8449417132" },
  { id: 21, name: "Helly Hansen Fleece Quarter Zip Grau Orange", category: "Pullover", price: "€25", size: "XXL", condition: "Sehr gut", image: "https://images1.vinted.net/t/05_00f80_irY9g4qnXgHPKNyhKZhBtGKV/f800/1773518023.webp?s=097a875ccde9384360722c3d9e3c5f2ee14fe893", vintedUrl: "https://www.vinted.de/items/8395132293" },
  { id: 22, name: "Nike Vintage Sweatshirt Big Swoosh Gruen", category: "Sweatshirts", price: "€34", size: "XL", condition: "Gut", image: "https://images1.vinted.net/t/05_01641_LVv5eNLqRADoWxsgH1sh2MVi/f800/1773748132.webp?s=700d6c354687e1173f3442e7d2dbd7a2df52e5a7", vintedUrl: "https://www.vinted.de/items/8417010800" },
  { id: 23, name: "Nike Vintage Fleece Jacket Grau Athletic Dept", category: "Jacken", price: "€22", size: "XS", condition: "Gut", image: "https://images1.vinted.net/t/05_015b6_j3dLkRBcqDkBNqvfCZWqC5Hf/f800/1773571927.webp?s=1c98260b24d469a21ae2ada9e313b498ad7f8536", vintedUrl: "https://www.vinted.de/items/8398245553" },
  { id: 24, name: "Vintage Starter Green Bay Packers Crewneck", category: "Sweatshirts", price: "€33", size: "XL", condition: "Gut", image: "https://images1.vinted.net/t/04_0138e_Th8543Q3YYQnnRR1PfXZR3QT/f800/1774018164.webp?s=4eef4ca660ee11d184712b68f34c7d6ea4a3531d", vintedUrl: "https://www.vinted.de/items/8440597862" },
  { id: 25, name: "Helly Hansen Fleece Y2K Half Zip", category: "Pullover", price: "€16", size: "XL", condition: "Zufriedenstellend", image: "https://images1.vinted.net/t/05_01efb_eiqNWQqeTyLPHPNBiLXHDZms/f800/1772753053.webp?s=5aa5b9dfa0de9fc6d8626ab262f74630b64df657", vintedUrl: "https://www.vinted.de/items/8323660018" },
  { id: 26, name: "Reebok New York Jets Fleece Jacke", category: "Jacken", price: "€25", size: "XXL", condition: "Gut", image: "https://images1.vinted.net/t/03_007ba_6Ex7LXe1ZpJN7RhzMMJ3sZ1N/f800/1773748600.webp?s=fbdfcca8432bd8897e2bb963f8b47fd15f85c268", vintedUrl: "https://www.vinted.de/items/8417078850" },
  { id: 27, name: "Nike Puffer Jacke Tuerkis XS", category: "Jacken", price: "€25", size: "XS", condition: "Gut", image: "https://images1.vinted.net/t/05_0135f_NGV5Rp1E8o2oVKDyfZrdsPvC/f800/1773062786.webp?s=96bcec68740e0106d8f33a95ca73a282e23d3dc0", vintedUrl: "https://www.vinted.de/items/8352298824" },
  { id: 28, name: "Nike Windbreaker Jacke Blau Swoosh", category: "Jacken", price: "€38", size: "L", condition: "Gut", image: "https://images1.vinted.net/t/06_01780_iUoK85Pss7d9DfczowRxQRN2/f800/1773706305.webp?s=dcf40dce54cb826d2959e92f24fa0a035a4f885d", vintedUrl: "https://www.vinted.de/items/8414803706" },
  { id: 29, name: "Lacoste Fleece Jacke Schwarz Vintage", category: "Jacken", price: "€25", size: "L", condition: "Zufriedenstellend", image: "https://images1.vinted.net/t/06_0031e_g9uWwjTMgjCnyhFmHYUtGdAY/f800/1772751651.webp?s=8a2e8ec6d39d605d6cdb16909eb2de94bab098f9", vintedUrl: "https://www.vinted.de/items/8323619467" },
  { id: 30, name: "Helly Hansen Fleece 1/4 Zip Lila", category: "Pullover", price: "€19", size: "M", condition: "Zufriedenstellend", image: "https://images1.vinted.net/t/06_01cd1_6qbnSHZGDRYnHj5gaTWwLupR/f800/1773705616.webp?s=36df5cd624355f745cf87b4b846c1f70cac6f14a", vintedUrl: "https://www.vinted.de/items/8414793323" },
  { id: 31, name: "Adidas Fleece Pullover Half Zip Grau Rot", category: "Pullover", price: "€20", size: "XL", condition: "Zufriedenstellend", image: "https://images1.vinted.net/t/01_02099_LjqYaitr28tJxU1XXV2pWTxw/f800/1772822269.webp?s=bfedb24ac87414a8ac6cbdf48003c1017d3d5d5f", vintedUrl: "https://www.vinted.de/items/8329226132" },
  { id: 32, name: "NHL Washington Capitals Fleece Sherpa", category: "Pullover", price: "€22", size: "M", condition: "Gut", image: "https://images1.vinted.net/t/06_01994_ZTAGXe1deKUSF8mxBsVj4Gfs/f800/1773499294.webp?s=526701d028e6f005a66174a4c9de1092d25a958e", vintedUrl: "https://www.vinted.de/items/8391936347" },
  { id: 33, name: "Nike Vintage Fleece Pullover Rot Swoosh", category: "Pullover", price: "€29", size: "L", condition: "Gut", image: "https://images1.vinted.net/t/05_0128e_Muquhvc4yd3ECMa3jbTzqC8V/f800/1773704829.webp?s=5c2d68463c57c351099b41e5d9bb6dc19eaa70b8", vintedUrl: "https://www.vinted.de/items/8414779381" },
  { id: 34, name: "Chaps Ralph Lauren Sweatshirt Vintage", category: "Sweatshirts", price: "€26", size: "L", condition: "Gut", image: "https://images1.vinted.net/t/05_01bfc_zekkHsmBD43m1SQymkHsGJNY/f800/1774105800.webp?s=b766563db47939331f168ea3b917b73acd3826fe", vintedUrl: "https://www.vinted.de/items/8448623083" },
];
export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [sold, setSold] = useState<number[]>([]);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<Partial<Product> | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'add'>('inventory');
  const [filter, setFilter] = useState('Alle');
  const fetchProduct = async () => {
    if (!url.includes('vinted.de')) { setError('Keine gueltige Vinted URL'); return; }
    setIsLoading(true); setError(''); setPreview(null);
    try {
      const res = await fetch('/api/vinted', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setPreview({ ...data, id: Date.now() });
    } catch { setError('Verbindungsfehler'); }
    setIsLoading(false);
  };
  const addProduct = () => {
    if (!preview) return;
    setProducts(p => [...p, { ...preview, id: Date.now() } as Product]);
    setPreview(null); setUrl(''); setActiveTab('inventory');
  };
  const markSold = (id: number) => setSold(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const removeProduct = (id: number) => { setProducts(p => p.filter(x => x.id !== id)); setSold(s => s.filter(x => x !== id)); };
  const activeProducts = products.filter(p => !sold.includes(p.id));
  const generateCode = () => {
    const code = activeProducts.map((p, i) => `  {\n    id: ${i+1},\n    name: "${p.name}",\n    category: "${p.category}",\n    price: "${p.price}",\n    size: "${p.size}",\n    condition: "${p.condition}",\n    image: "${p.image}",\n    vintedUrl: "${p.vintedUrl}"\n  }`).join(',\n');
    return `const products = [\n${code}\n];`;
  };
  const copyCode = () => { navigator.clipboard.writeText(generateCode()); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); };
  const categories = ['Alle', ...Array.from(new Set(products.map(p => p.category))).sort()];
  const filtered = filter === 'Alle' ? products : products.filter(p => p.category === filter);
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans">
      <div className="border-b border-[#FF4400]/30 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0A0A0A] z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter"><span className="text-[#FF4400]">SCND</span>_UNIT <span className="text-gray-500 text-lg ml-2">/ Admin</span></h1>
          <p className="text-xs text-gray-500 mt-0.5">{activeProducts.length} aktiv · {sold.length} verkauft · {products.length} gesamt</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 text-xs uppercase tracking-widest font-bold transition-colors ${activeTab === 'inventory' ? 'bg-[#FF4400] text-white' : 'border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10'}`}>Inventar</button>
          <button onClick={() => setActiveTab('add')} className={`px-4 py-2 text-xs uppercase tracking-widest font-bold transition-colors ${activeTab === 'add' ? 'bg-[#FF4400] text-white' : 'border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10'}`}>+ Hinzufuegen</button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'inventory' && (
          <div>
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div className="flex gap-2 flex-wrap">
                {categories.map(cat => (<button key={cat} onClick={() => setFilter(cat)} className={`px-3 py-1.5 text-xs uppercase tracking-widest font-bold transition-colors ${filter === cat ? 'bg-[#FF4400] text-white' : 'border border-[#FF4400]/30 text-gray-400 hover:text-[#FF4400]'}`}>{cat}</button>))}
              </div>
              <button onClick={copyCode} className="px-4 py-2 text-xs uppercase tracking-widest font-bold bg-[#FF4400] text-white hover:bg-[#FF4400]/80 transition-colors flex items-center gap-2">
                {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{codeCopied ? 'Kopiert!' : 'Code kopieren'}
              </button>
            </div>
            {sold.length > 0 && (
              <div className="mb-4 p-3 border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs flex items-center justify-between">
                <span>{sold.length} Produkt(e) als verkauft markiert - Code kopieren und in page.tsx einfuegen!</span>
                <button onClick={() => setSold([])} className="underline ml-4">Zuruecksetzen</button>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map(p => {
                const isSold = sold.includes(p.id);
                return (
                  <div key={p.id} className={`relative border transition-all ${isSold ? 'border-red-500/50 opacity-50' : 'border-[#FF4400]/20 hover:border-[#FF4400]/50'}`}>
                    {isSold && <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"><span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rotate-[-15deg] uppercase tracking-widest">Verkauft</span></div>}
                    <div className="aspect-[3/4] bg-[#1A1A1A] overflow-hidden"><img src={p.image} alt={p.name} className="w-full h-full object-cover" /></div>
                    <div className="p-2 bg-[#0A0A0A]">
                      <p className="text-xs font-bold truncate">{p.name}</p>
                      <p className="text-xs text-[#FF4400] mt-0.5">{p.price} · {p.size}</p>
                      <p className="text-xs text-gray-500">{p.category}</p>
                    </div>
                    <div className="flex border-t border-[#FF4400]/10">
                      <button onClick={() => markSold(p.id)} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1 ${isSold ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'}`}>
                        <ShoppingBag className="w-3 h-3" />{isSold ? 'Zurueck' : 'Verkauft'}
                      </button>
                      <div className="w-px bg-[#FF4400]/10" />
                      <a href={p.vintedUrl} target="_blank" className="px-3 py-2 text-gray-500 hover:text-[#FF4400] transition-colors flex items-center"><ExternalLink className="w-3 h-3" /></a>
                      <div className="w-px bg-[#FF4400]/10" />
                      <button onClick={() => removeProduct(p.id)} className="px-3 py-2 text-gray-500 hover:text-red-500 transition-colors flex items-center"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {activeTab === 'add' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-[#1A1A1A] border border-[#FF4400]/20 p-6">
              <h2 className="text-xs uppercase tracking-widest text-[#FF4400] mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Vinted Link einfuegen</h2>
              <div className="flex gap-2 mb-2">
                <input type="text" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchProduct()} placeholder="https://www.vinted.de/items/..." className="flex-1 bg-[#0A0A0A] border border-[#FF4400]/20 px-4 py-3 text-sm focus:border-[#FF4400] focus:outline-none" />
                <button onClick={fetchProduct} disabled={isLoading} className="px-5 py-3 bg-[#FF4400] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#FF4400]/80 disabled:opacity-50 transition-colors">
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Laden'}
                </button>
              </div>
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
              <AnimatePresence>
                {preview && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 border-t border-[#FF4400]/20 pt-6 space-y-4">
                    {preview.image && <img src={preview.image} className="w-full h-48 object-cover border border-[#FF4400]/20" alt="" />}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[{label:'Name',key:'name'},{label:'Preis',key:'price'},{label:'Groesse',key:'size'},{label:'Zustand',key:'condition'}].map(({label,key}) => (
                        <div key={key} className="bg-[#0A0A0A] p-3 border border-[#FF4400]/10">
                          <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">{label}</p>
                          <input type="text" value={(preview as any)[key] ?? ''} onChange={e => setPreview(p => ({...p,[key]:e.target.value}))} className="bg-transparent text-sm font-bold focus:outline-none w-full" />
                        </div>
                      ))}
                      <div className="bg-[#0A0A0A] p-3 border border-[#FF4400]/10 col-span-2">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">Kategorie</p>
                        <select value={preview.category ?? 'Jacken'} onChange={e => setPreview(p => ({...p,category:e.target.value}))} className="bg-transparent text-sm font-bold focus:outline-none w-full">
                          {['Jacken','Pullover','Sweatshirts','Tops'].map(c => <option key={c} value={c} className="bg-[#0A0A0A]">{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <button onClick={addProduct} className="w-full py-3 bg-[#FF4400] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#FF4400]/80 transition-colors flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" /> Zum Inventar hinzufuegen
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
