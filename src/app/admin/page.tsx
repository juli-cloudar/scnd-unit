'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ExternalLink, Copy, Check, RefreshCw, Download } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  size: string;
  condition: string;
  images: string[];
  vintedUrl: string;
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<Partial<Product> | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const fetchProduct = async () => {
    if (!url.includes('vinted.de')) { setError('Keine gültige Vinted URL'); return; }
    setIsLoading(true);
    setError('');
    setPreview(null);
    try {
      const res = await fetch('/api/vinted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setPreview({ ...data, id: Date.now() });
    } catch {
      setError('Verbindungsfehler');
    }
    setIsLoading(false);
  };

  const addProduct = () => {
    if (!preview) return;
    setProducts(p => [...p, preview as Product]);
    setPreview(null);
    setUrl('');
  };

  const deleteProduct = (id: number) => setProducts(p => p.filter(x => x.id !== id));

  const copyCode = () => {
    navigator.clipboard.writeText(JSON.stringify(products, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'inventory.json';
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 pb-6 border-b border-[#FF4400]/30">
          <h1 className="text-4xl font-bold tracking-tighter mb-1">
            <span className="text-[#FF4400]">SCND</span>_UNIT
            <span className="text-gray-500 text-2xl ml-3">/ Admin</span>
          </h1>
          <p className="text-gray-500 uppercase tracking-widest text-xs mt-1">Produkt-Verwaltung</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-[#1A1A1A] border border-[#FF4400]/20 p-6">
              <h2 className="text-xs uppercase tracking-widest text-[#FF4400] mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Vinted Link einfügen
              </h2>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchProduct()}
                  placeholder="https://www.vinted.de/items/..."
                  className="flex-1 bg-[#0A0A0A] border border-[#FF4400]/20 px-4 py-3 text-sm focus:border-[#FF4400] focus:outline-none"
                />
                <button
                  onClick={fetchProduct}
                  disabled={isLoading}
                  className="px-5 py-3 bg-[#FF4400] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#FF4400]/80 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Laden'}
                </button>
              </div>
              {preview && (
                <div className="space-y-3 mt-4 border-t border-[#FF4400]/20 pt-4">
                  <p className="text-xs text-[#FF4400] uppercase tracking-widest">Daten bearbeiten</p>
                  {[
                    { label: 'Preis', key: 'price', placeholder: 'z.B. 34' },
                    { label: 'Groesse', key: 'size', placeholder: 'L, M, XL...' },
                    { label: 'Zustand', key: 'condition', placeholder: 'Gut / Sehr gut' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key} className="bg-[#0A0A0A] p-3 border border-[#FF4400]/20">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">{label}</p>
                      <input
                        type="text"
                        value={(preview as any)[key] ?? ''}
                        onChange={e => setPreview(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="bg-transparent text-sm font-bold focus:outline-none w-full placeholder-gray-600"
                      />
                    </div>
                  ))}
                </div>
              )}
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

              <AnimatePresence>
                {preview && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 border-t border-[#FF4400]/20 pt-6 space-y-4">
                    <h3 className="text-xs uppercase tracking-widest text-[#FF4400]">Automatisch extrahiert ✓</h3>
                    {preview.images && preview.images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {preview.images.map((img, i) => (
                          <img key={i} src={img} className="w-16 h-20 object-cover border border-[#FF4400]/20 shrink-0" alt="" />
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-[#0A0A0A] p-3 border border-[#FF4400]/10">
                        <p className="text-xs text-gray-500 mb-1">NAME</p>
                        <p className="font-bold truncate">{preview.name}</p>
                      </div>
                      <div className="bg-[#0A0A0A] p-3 border border-[#FF4400]/10">
                        <p className="text-xs text-gray-500 mb-1">PREIS</p>
                        <p className="font-bold text-[#FF4400]">{preview.price}</p>
                      </div>
                      <div className="bg-[#0A0A0A] p-3 border border-[#FF4400]/10">
                        <p className="text-xs text-gray-500 mb-1">GRÖSSE</p>
                        <p className="font-bold">{preview.size || 'nicht gefunden'}</p>
                      </div>
                      <div className="bg-[#0A0A0A] p-3 border border-[#FF4400]/10">
                        <p className="text-xs text-gray-500 mb-1">ZUSTAND</p>
                        <p className="font-bold">{preview.condition || 'nicht gefunden'}</p>
                      </div>
                      <div className="bg-[#0A0A0A] p-3 border border-[#FF4400]/10 col-span-2">
                        <p className="text-xs text-gray-500 mb-1">KATEGORIE</p>
                        <select
                          value={preview.category ?? 'Sonstiges'}
                          onChange={e => setPreview(p => ({ ...p, category: e.target.value }))}
                          className="bg-transparent text-sm font-bold focus:outline-none w-full"
                        >
                          {['Jacken', 'Pullover', 'Sweatshirts', 'Hosen', 'Sonstiges'].map(c => (
                            <option key={c} value={c} className="bg-[#0A0A0A]">{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button onClick={addProduct} className="w-full py-3 bg-[#FF4400] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#FF4400]/80 transition-colors flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" /> Zur Liste hinzufügen
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#FF4400]/20 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs uppercase tracking-widest text-[#FF4400]">Inventar ({products.length})</h2>
              <div className="flex gap-2">
                <button onClick={exportJson} className="px-3 py-1.5 text-xs border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10 transition-colors flex items-center gap-1">
                  <Download className="w-3 h-3" /> JSON
                </button>
                <button onClick={copyCode} className="px-3 py-1.5 text-xs bg-[#FF4400] text-white hover:bg-[#FF4400]/80 transition-colors flex items-center gap-1">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Kopiert!' : 'Code kopieren'}
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {products.length === 0 ? (
                <p className="text-gray-600 text-center py-16 text-sm italic">Noch keine Produkte...</p>
              ) : (
                products.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-[#0A0A0A] border border-[#FF4400]/10 hover:border-[#FF4400]/30 transition-colors group">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} className="w-12 h-14 object-cover shrink-0" alt="" />
                    ) : (
                      <div className="w-12 h-14 bg-[#1A1A1A] shrink-0 flex items-center justify-center text-xs text-gray-600">IMG</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{p.name}</p>
                      <p className="text-xs text-[#FF4400]">{p.price} · {p.size} · {p.category}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={p.vintedUrl} target="_blank" className="p-1.5 text-gray-500 hover:text-[#FF4400]"><ExternalLink className="w-3.5 h-3.5" /></a>
                      <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-gray-500 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {products.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#FF4400]/20">
                <p className="text-xs text-gray-500 text-center">JSON exportieren → in <code className="text-[#FF4400]">page.tsx</code> einfügen</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
