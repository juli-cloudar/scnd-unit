// src/app/admin/page.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ExternalLink, Trash2, Plus, RefreshCw, Download, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  size: string;
  condition: string;
  image: string;
  vintedUrl: string;
  lastUpdated: string;
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Partial<Product> | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const extractFromVinted = async (url: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    const idMatch = url.match(/items\/(\d+)/);
    const possibleId = idMatch ? idMatch[1] : Date.now().toString();
    setPreviewProduct({
      id: possibleId,
      vintedUrl: url,
      name: '',
      price: '',
      category: 'Jacken',
      condition: 'Gut',
      size: 'M',
      image: `/api/placeholder/400/500`,
      lastUpdated: new Date().toLocaleDateString('de-DE')
    });
    setIsLoading(false);
  };

  const addProduct = () => {
    if (!previewProduct?.name || !previewProduct?.price) {
      alert('Bitte Name und Preis eingeben!');
      return;
    }
    const newProduct: Product = {
      id: previewProduct.id || Date.now().toString(),
      name: previewProduct.name,
      category: previewProduct.category || 'Jacken',
      price: previewProduct.price,
      size: previewProduct.size || 'M',
      condition: previewProduct.condition || 'Gut',
      image: previewProduct.image || '/api/placeholder/400/500',
      vintedUrl: previewProduct.vintedUrl || '',
      lastUpdated: new Date().toLocaleDateString('de-DE')
    };
    setProducts([...products, newProduct]);
    setPreviewProduct(null);
    setNewUrl('');
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const generateWebsiteCode = () => {
    const code = `const products = ${JSON.stringify(products.map((p, i) => ({...p, id: i + 1})), null, 2)};`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportToJson = () => {
    const dataStr = JSON.stringify(products, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `scnd-unit-${new Date().toISOString().split('T')[0]}.json`);
    link.click();
  };

  const categories = ['Jacken', 'Pullover', 'Sweatshirts', 'Tops', 'Bottoms', 'Accessories'];
  const conditions = ['Sehr gut', 'Gut', 'Zufriedenstellend', 'Neuwertig'];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] p-6 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8 border-b border-[#FF4400]/30 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-1">
              <span className="text-[#FF4400]">SCND</span>_UNIT <span className="text-gray-500 text-2xl">| Admin</span>
            </h1>
            <p className="text-gray-400 text-sm uppercase tracking-widest">Produkt-Verwaltung</p>
          </div>
          <a href="/" className="px-4 py-2 border border-[#FF4400]/30 text-[#FF4400] text-sm uppercase tracking-widest hover:bg-[#FF4400]/10 transition-colors">
            ← Website
          </a>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* Linke Spalte: Neues Produkt */}
          <div className="space-y-6">
            <div className="bg-[#1A1A1A] border border-[#FF4400]/20 p-6">
              <h2 className="text-lg font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#FF4400]" />
                Neues Produkt hinzufügen
              </h2>

              <div className="mb-4">
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">1. Vinted URL einfügen</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://www.vinted.de/items/123456789-..."
                    className="flex-1 bg-[#0A0A0A] border border-[#FF4400]/20 px-4 py-3 text-sm focus:border-[#FF4400] focus:outline-none"
                  />
                  <button
                    onClick={() => extractFromVinted(newUrl)}
                    disabled={!newUrl.includes('vinted') || isLoading}
                    className="px-4 py-3 bg-[#FF4400] text-white font-bold uppercase tracking-widest text-sm hover:bg-[#FF4400]/80 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Laden'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Titel & Preis von Vinted manuell übertragen
                </p>
              </div>

              <AnimatePresence>
                {previewProduct && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-[#FF4400]/20 pt-4 space-y-3 overflow-hidden"
                  >
                    <h3 className="text-xs uppercase tracking-widest text-[#FF4400]">2. Daten eingeben</h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Name *</label>
                        <input type="text" value={previewProduct.name} onChange={(e) => setPreviewProduct({...previewProduct, name: e.target.value})}
                          placeholder="z.B. Vintage Carhartt Jacket"
                          className="w-full bg-[#0A0A0A] border border-[#FF4400]/20 px-3 py-2 text-sm focus:border-[#FF4400] focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Preis *</label>
                        <input type="text" value={previewProduct.price} onChange={(e) => setPreviewProduct({...previewProduct, price: e.target.value})}
                          placeholder="€45"
                          className="w-full bg-[#0A0A0A] border border-[#FF4400]/20 px-3 py-2 text-sm focus:border-[#FF4400] focus:outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Kategorie</label>
                        <select value={previewProduct.category} onChange={(e) => setPreviewProduct({...previewProduct, category: e.target.value})}
                          className="w-full bg-[#0A0A0A] border border-[#FF4400]/20 px-3 py-2 text-sm focus:border-[#FF4400] focus:outline-none">
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Größe</label>
                        <input type="text" value={previewProduct.size} onChange={(e) => setPreviewProduct({...previewProduct, size: e.target.value})}
                          placeholder="L, M, XL..."
                          className="w-full bg-[#0A0A0A] border border-[#FF4400]/20 px-3 py-2 text-sm focus:border-[#FF4400] focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Zustand</label>
                        <select value={previewProduct.condition} onChange={(e) => setPreviewProduct({...previewProduct, condition: e.target.value})}
                          className="w-full bg-[#0A0A0A] border border-[#FF4400]/20 px-3 py-2 text-sm focus:border-[#FF4400] focus:outline-none">
                          {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Bild-URL (von Vinted kopieren)</label>
                      <input type="text" value={previewProduct.image} onChange={(e) => setPreviewProduct({...previewProduct, image: e.target.value})}
                        placeholder="https://images1.vinted.net/..."
                        className="w-full bg-[#0A0A0A] border border-[#FF4400]/20 px-3 py-2 text-sm focus:border-[#FF4400] focus:outline-none" />
                    </div>

                    <button onClick={addProduct}
                      className="w-full py-3 bg-[#FF4400] text-white font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 transition-colors flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Zur Inventarliste hinzufügen
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Guide */}
            <div className="bg-[#1A1A1A]/50 border border-[#FF4400]/10 p-4">
              <h3 className="text-xs uppercase tracking-widest text-[#FF4400] mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Workflow
              </h3>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Vinted-URL einfügen & "Laden" klicken</li>
                <li>Titel & Preis von Vinted kopieren</li>
                <li>Bild-URL: Rechtsklick auf Foto → "Bildadresse kopieren"</li>
                <li>"Hinzufügen" klicken</li>
                <li>Wenn fertig: "Code generieren" → in page.tsx einfügen</li>
              </ol>
            </div>
          </div>

          {/* Rechte Spalte: Inventar */}
          <div className="space-y-6">
            <div className="bg-[#1A1A1A] border border-[#FF4400]/20 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold uppercase tracking-widest">
                  Inventar <span className="text-[#FF4400]">({products.length})</span>
                </h2>
                <div className="flex gap-2">
                  <button onClick={() => setShowJson(!showJson)}
                    className="px-3 py-1 text-xs uppercase tracking-widest border border-[#FF4400]/30 hover:border-[#FF4400] text-[#FF4400] transition-colors">
                    JSON
                  </button>
                  <button onClick={exportToJson}
                    className="px-3 py-1 text-xs uppercase tracking-widest border border-[#FF4400]/30 hover:border-[#FF4400] text-[#FF4400] transition-colors flex items-center gap-1">
                    <Download className="w-3 h-3" />Backup
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {products.length === 0 ? (
                  <p className="text-gray-500 text-center py-12 text-sm italic">Noch keine Produkte...</p>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-[#0A0A0A] border border-[#FF4400]/10 hover:border-[#FF4400]/30 transition-colors group">
                      <div className="flex items-center gap-3">
                        <img src={product.image} alt={product.name} className="w-10 h-10 object-cover bg-[#1A1A1A]" onError={(e) => (e.currentTarget.src = '/api/placeholder/40/40')} />
                        <div>
                          <p className="font-bold text-sm truncate max-w-[180px]">{product.name}</p>
                          <p className="text-xs text-[#FF4400]">{product.price} • Size {product.size} • {product.condition}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={product.vintedUrl} target="_blank" className="p-2 text-gray-500 hover:text-[#FF4400] transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button onClick={() => deleteProduct(product.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {products.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[#FF4400]/20">
                  <button onClick={generateWebsiteCode}
                    className="w-full py-4 bg-[#FF4400] text-white font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 transition-colors flex items-center justify-center gap-2">
                    {copied ? <><Check className="w-5 h-5" />Kopiert!</> : <><Copy className="w-5 h-5" />Code generieren & kopieren</>}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">Füge den Code in src/app/page.tsx ein</p>
                </div>
              )}
            </div>

            <AnimatePresence>
              {showJson && products.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="bg-[#1A1A1A] border border-[#FF4400]/20 p-4 overflow-hidden">
                  <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-2">JSON Output</h3>
                  <pre className="text-xs text-[#FF4400] overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {JSON.stringify(products, null, 2)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
