'use client';
import { useState, useEffect } from 'react';
import { Trash2, ExternalLink, RefreshCw, ShoppingBag, Plus, Check, X, Edit3, Wand2, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useConfirm } from '@/components/ConfirmDialog';
interface Product {
  id: number; name: string; category: string; price: string;
  size: string; condition: string; images: string[]; vinted_url: string; sold: boolean;
}

interface ScrapedData {
  name?: string; category?: string; price?: string; size?: string; condition?: string; images?: string[];
}

const proxyImg = (url: string) => {
  if (!url) return '';
  if (url.startsWith('/api/')) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Alle');
  const [activeTab, setActiveTab] = useState<'inventory' | 'add'>('inventory');
  const [successMsg, setSuccessMsg] = useState('');
  const confirm = useConfirm();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [url, setUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);

  const [formData, setFormData] = useState({
    name: '', category: 'Jacken', price: '', size: '', condition: 'Gut', vinted_url: '', images: [] as string[]
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('id');
    if (!error && data) setProducts(data);
    setLoading(false);
  };

  const openProductImages = (product: Product) => {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
  };

  const closeProductImages = () => { setSelectedProduct(null); setSelectedImageIndex(0); };

  const nextProductImage = () => {
    if (!selectedProduct) return;
    setSelectedImageIndex((prev) => (prev + 1) % selectedProduct.images.length);
  };

  const prevProductImage = () => {
    if (!selectedProduct) return;
    setSelectedImageIndex((prev) => (prev - 1 + selectedProduct.images.length) % selectedProduct.images.length);
  };

  const scrapeVinted = async () => {
    if (!url.includes('vinted.de') && !url.includes('vinted.com')) { 
      alert('Bitte gültige Vinted URL eingeben'); 
      return; 
    }
    setIsScraping(true); setScrapedData(null); setCurrentImageIndex(0);
    try {
      const res = await fetch('/api/vinted', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ url }) 
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`${data.message || 'Vinted blockiert automatische Anfragen.'}\n\nWechsle zum manuellen Modus...`);
        setFormData(prev => ({ 
          ...prev, 
          vinted_url: url,
          name: '',
          price: '',
          size: '',
          images: []
        }));
        setIsScraping(false);
        return;
      }
      if (data.images && data.images.length > 0) {
        const cleanedImages = data.images.map((img: string) => cleanImageUrl(img));
        setScrapedData({ ...data, images: cleanedImages });
        fillFormWithData({ ...data, images: cleanedImages }, url);
        showSuccess(`${data.images.length} Bilder geladen!`);
      } else if (data.name || data.price) {
        setScrapedData(data);
        fillFormWithData(data, url);
        alert('Nur Teil-Daten gefunden. Bitte Bilder manuell hinzufügen.');
      } else {
        alert('Keine Daten gefunden. Bitte manuell eingeben.');
      }
    } catch {
      alert('Netzwerkfehler. Bitte manuell eingeben.');
      setFormData(prev => ({ ...prev, vinted_url: url }));
    } finally { 
      setIsScraping(false); 
    }
  };

  const pasteImageFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.includes('vinted.net')) {
        const cleaned = cleanImageUrl(text.trim());
        setFormData(prev => ({ ...prev, images: [...prev.images, cleaned] }));
        setCurrentImageIndex(formData.images.length);
        showSuccess('Bild aus Zwischenablage eingefügt!');
      } else {
        alert('Keine gültige Vinted-URL in Zwischenablage.');
      }
    } catch {
      alert('Zugriff auf Zwischenablage verweigert.');
    }
  };

  const pasteMultipleImages = () => {
    const input = prompt('Füge Bild-URLs ein (eine pro Zeile):');
    if (!input) return;
    const urls = input.split('\n').map(u => u.trim()).filter(u => u.includes('vinted.net'));
    const cleaned = urls.map(cleanImageUrl).slice(0, 10);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...cleaned] }));
    showSuccess(`${cleaned.length} Bilder hinzugefügt!`);
  };

  const extractFromUrlManual = () => {
    const match = url.match(/items\/(\d+)-/);
    if (match) {
      window.open(`https://www.vinted.de/items/${match[1]}`, '_blank');
      alert('Artikel geöffnet. Kopiere Bild-URLs manuell.');
    } else {
      window.open(url, '_blank');
    }
  };

  const cleanImageUrl = (url: string): string => {
    return url.replace(/[?&]s=[^&]+/, '').replace(/\/f\d+\//, '/f800/').replace(/\\/g, '').trim();
  };

  const guessCategory = (title: string): string => {
    const lower = title.toLowerCase();
    if (lower.includes('jacke') || lower.includes('jacket')) return 'Jacken';
    if (lower.includes('pullover') || lower.includes('sweater')) return 'Pullover';
    if (lower.includes('sweatshirt') || lower.includes('crewneck')) return 'Sweatshirts';
    if (lower.includes('shirt') || lower.includes('polo')) return 'Tops';
    return 'Sonstiges';
  };

  const fillFormWithData = (data: ScrapedData, url: string) => {
    setFormData({
      name: data.name || '', category: data.category || 'Jacken', price: data.price || '',
      size: data.size || '', condition: data.condition || 'Gut', vinted_url: url,
      images: data.images || []
    });
  };

  const addImageUrl = () => {
    const newUrl = prompt('Vollständige Bild-URL eingeben:');
    if (newUrl && newUrl.includes('vinted.net')) {
      const cleaned = cleanImageUrl(newUrl);
      setFormData(prev => ({ ...prev, images: [...prev.images, cleaned] }));
      setCurrentImageIndex(formData.images.length);
    } else if (newUrl) { alert('URL muss von vinted.net sein!'); }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    if (currentImageIndex >= index && currentImageIndex > 0) setCurrentImageIndex(currentImageIndex - 1);
  };

  const addProduct = async () => {
    if (!formData.name || !formData.price || !formData.vinted_url) { 
      alert('Name, Preis und Vinted URL sind Pflicht!'); 
      return; 
    }
    if (formData.images.length === 0) { 
      alert('Mindestens 1 Bild benötigt!'); 
      return; 
    }
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    const newProduct = {
      id: newId, name: formData.name, category: formData.category,
      price: formData.price.startsWith('€') ? formData.price : `€${formData.price}`,
      size: formData.size || '–', condition: formData.condition,
      images: formData.images, vinted_url: formData.vinted_url, sold: false
    };
    const { error } = await supabase.from('products').insert(newProduct);
    if (!error) {
      setProducts(p => [...p, newProduct]);
      setFormData({ name: '', category: 'Jacken', price: '', size: '', condition: 'Gut', vinted_url: '', images: [] });
      setUrl(''); setScrapedData(null); setCurrentImageIndex(0); setActiveTab('inventory');
      showSuccess(`${formData.images.length} Bilder hinzugefügt!`);
    } else { alert('Fehler: ' + error.message); }
  };

  const markSold = async (id: number, currentSold: boolean) => {
    const { error } = await supabase.from('products').update({ sold: !currentSold }).eq('id', id);
    if (!error) { 
      setProducts(p => p.map(x => x.id === id ? { ...x, sold: !currentSold } : x)); 
      showSuccess(!currentSold ? 'Als verkauft markiert!' : 'Wieder aktiv!'); 
    }
  };

  const removeProduct = async (id: number) => {
    const confirmed = await confirm({
      title: 'Produkt löschen',
      message: 'Möchtest du dieses Produkt wirklich unwiderruflich löschen?',
      confirmText: 'Löschen',
      cancelText: 'Abbrechen',
      type: 'danger',
    });
    if (!confirmed) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) { setProducts(p => p.filter(x => x.id !== id)); showSuccess('Produkt gelöscht!'); }
  };

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };
  const categories = ['Alle', ...Array.from(new Set(products.map(p => p.category))).sort()];
  const filtered = filter === 'Alle' ? products : products.filter(p => p.category === filter);
  const updateField = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans">
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={closeProductImages}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={closeProductImages} className="absolute -top-10 right-0 text-white hover:text-[#FF4400]"><X className="w-6 h-6" /></button>
            <div className="relative aspect-[3/4] max-h-[80vh] bg-[#1A1A1A]">
              <img src={proxyImg(selectedProduct.images[selectedImageIndex])} alt={`Bild ${selectedImageIndex + 1}`} className="w-full h-full object-contain" />
              {selectedProduct.images.length > 1 && (
                <>
                  <button onClick={prevProductImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-[#FF4400] text-white transition-colors"><ChevronLeft className="w-6 h-6" /></button>
                  <button onClick={nextProductImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-[#FF4400] text-white transition-colors"><ChevronRight className="w-6 h-6" /></button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {selectedProduct.images.map((_, i) => (
                      <button key={i} onClick={() => setSelectedImageIndex(i)} className={`w-3 h-3 rounded-full transition-colors ${i === selectedImageIndex ? 'bg-[#FF4400]' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 text-center"><p className="font-bold">{selectedProduct.name}</p><p className="text-sm text-[#FF4400]">{selectedProduct.price}</p></div>
          </div>
        </div>
      )}

      <div className="border-b border-[#FF4400]/30 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0A0A0A] z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter"><span className="text-[#FF4400]">SCND</span>_UNIT <span className="text-gray-500 text-lg ml-2">/ Admin</span></h1>
          <p className="text-xs text-gray-500 mt-0.5">{products.filter(p=>!p.sold).length} aktiv · {products.filter(p=>p.sold).length} verkauft <span className="ml-2 text-green-500">● Live</span></p>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={loadProducts} className="p-2 border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 text-xs uppercase tracking-widest font-bold transition-colors ${activeTab==='inventory'?'bg-[#FF4400] text-white':'border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10'}`}>Inventar</button>
          <button onClick={() => setActiveTab('add')} className={`px-4 py-2 text-xs uppercase tracking-widest font-bold transition-colors ${activeTab==='add'?'bg-[#FF4400] text-white':'border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10'}`}>+ Hinzufügen</button>
        </div>
      </div>

      {successMsg && <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-4 py-2 text-sm font-bold flex items-center gap-2"><Check className="w-4 h-4" />{successMsg}</div>}

      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'inventory' && (
          <div>
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div className="flex gap-2 flex-wrap">{categories.map(cat => (
                <button key={cat} onClick={() => setFilter(cat)} className={`px-3 py-1.5 text-xs uppercase tracking-widest font-bold transition-colors ${filter===cat?'bg-[#FF4400] text-white':'border border-[#FF4400]/30 text-gray-400 hover:text-[#FF4400]'}`}>{cat}</button>
              ))}</div>
              <p className="text-xs text-green-500">✓ Änderungen sofort live</p>
            </div>
            {loading ? <div className="text-center py-20 text-gray-500">Lade...</div> : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtered.map(p => (
                  <div key={p.id} className={`relative border transition-all ${p.sold?'border-red-500/50 opacity-50':'border-[#FF4400]/20 hover:border-[#FF4400]/50'}`}>
                    {p.sold && <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"><span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rotate-[-15deg] uppercase tracking-widest">Verkauft</span></div>}
                    <div className="aspect-[3/4] bg-[#1A1A1A] overflow-hidden relative group cursor-pointer" onClick={() => openProductImages(p)}>
                      <img src={proxyImg(p.images?.[0])} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      {p.images && p.images.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 text-xs flex items-center gap-1 font-bold">
                          <ImageIcon className="w-3 h-3" /> {p.images.length}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="bg-[#FF4400] text-white text-xs px-3 py-1 font-bold uppercase tracking-widest">Bilder ansehen</span>
                      </div>
                    </div>
                    <div className="p-2 bg-[#0A0A0A]">
                      <p className="text-xs font-bold truncate">{p.name}</p>
                      <p className="text-xs text-[#FF4400] mt-0.5">{p.price} · {p.size}</p>
                      <p className="text-xs text-gray-500">{p.category}</p>
                      <div className="flex gap-1 mt-2">
                        <button onClick={() => markSold(p.id, p.sold)} className={`flex-1 py-1 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1 ${p.sold?'bg-green-600/20 text-green-400 hover:bg-green-600/30':'bg-red-600/20 text-red-400 hover:bg-red-600/30'}`}>
                          <ShoppingBag className="w-3 h-3" />{p.sold?'Reaktiv.':'Verkauft'}
                        </button>
                        <a href={p.vinted_url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10"><ExternalLink className="w-3 h-3" /></a>
                        <button onClick={() => removeProduct(p.id)} className="px-2 py-1 border border-red-500/30 text-red-400 hover:bg-red-500/10"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold uppercase tracking-tight mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#FF4400]" /> Neues Produkt
            </h2>
            
            <div className="bg-red-950/30 border border-red-500/30 p-4 mb-4 rounded">
              <div className="flex items-start gap-3">
                <div className="text-red-500 mt-0.5 text-lg">⚠️</div>
                <div>
                  <h3 className="text-red-400 font-bold text-sm uppercase tracking-wider mb-1">
                    Automatisches Scraping eingeschränkt
                  </h3>
                  <p className="text-red-200/70 text-xs">
                    Vinted blockiert automatische Anfragen. Nutze die Alternativen unten.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#111] border border-[#FF4400]/20 p-4 mb-4">
              <label className="text-xs uppercase tracking-widest text-[#FF4400] block mb-2 flex items-center gap-2">
                <Wand2 className="w-3 h-3" /> Schritt 1: Vinted URL (Auto-Scraping)
              </label>
              <div className="flex gap-2">
                <input 
                  value={url} 
                  onChange={e => setUrl(e.target.value)} 
                  placeholder="https://www.vinted.de/items/..." 
                  className="flex-1 bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm text-[#F5F5F5]" 
                />
                <button 
                  onClick={scrapeVinted} 
                  disabled={isScraping || !url} 
                  className="px-6 py-3 bg-[#FF4400] text-white text-xs font-bold uppercase disabled:opacity-50"
                >
                  {isScraping ? '...' : 'Auto-Fill'}
                </button>
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-gray-700/50 p-4 mb-6">
              <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-3">Alternativen</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button onClick={pasteImageFromClipboard} className="p-3 bg-[#252525] border border-gray-700 hover:border-[#FF4400]/50 text-left">
                  <div className="text-[#FF4400] text-xs font-bold">📋 Aus Zwischenablage</div>
                </button>
                <button onClick={pasteMultipleImages} className="p-3 bg-[#252525] border border-gray-700 hover:border-[#FF4400]/50 text-left">
                  <div className="text-[#FF4400] text-xs font-bold">🖼️ Mehrere Bilder</div>
                </button>
                <button onClick={() => addImageUrl()} className="p-3 bg-[#252525] border border-gray-700 hover:border-[#FF4400]/50 text-left">
                  <div className="text-[#FF4400] text-xs font-bold">➕ Einzelnes Bild</div>
                </button>
                <button onClick={extractFromUrlManual} className="p-3 bg-[#252525] border border-gray-700 hover:border-[#FF4400]/50 text-left">
                  <div className="text-[#FF4400] text-xs font-bold">🔗 Vinted öffnen</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#111] border border-[#FF4400]/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs uppercase tracking-widest text-[#FF4400]">
                    Bilder ({formData.images.length})
                  </label>
                  <div className="flex gap-2">
                    <button onClick={pasteImageFromClipboard} className="text-xs px-2 py-1 bg-[#252525] text-gray-300">Paste</button>
                    <button onClick={() => addImageUrl()} className="text-xs px-3 py-1 border border-[#FF4400]/30 text-[#FF4400]">+ URL</button>
                  </div>
                </div>
                {formData.images.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {formData.images.map((img, i) => (
                      <div key={i} className="relative aspect-square">
                        <img src={proxyImg(img)} className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-[3/4] bg-[#1A1A1A] flex items-center justify-center text-gray-600">Keine Bilder</div>
                )}
              </div>

              <div className="bg-[#111] border border-[#FF4400]/20 p-4 space-y-4">
                <label className="text-xs uppercase tracking-widest text-[#FF4400]">Schritt 2: Daten</label>
                <input value={formData.name} onChange={e => updateField('name', e.target.value)} placeholder="Name" className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm" />
                <div className="grid grid-cols-2 gap-4">
                  <select value={formData.category} onChange={e => updateField('category', e.target.value)} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm">
                    <option>Jacken</option>
                    <option>Pullover</option>
                    <option>Sweatshirts</option>
                    <option>Tops</option>
                    <option>Sonstiges</option>
                  </select>
                  <input value={formData.price} onChange={e => updateField('price', e.target.value)} placeholder="Preis" className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input value={formData.size} onChange={e => updateField('size', e.target.value)} placeholder="Größe" className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm" />
                  <select value={formData.condition} onChange={e => updateField('condition', e.target.value)} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm">
                    <option>Neu</option>
                    <option>Sehr gut</option>
                    <option>Gut</option>
                    <option>Zufriedenstellend</option>
                  </select>
                </div>
                <input value={formData.vinted_url} onChange={e => updateField('vinted_url', e.target.value)} placeholder="Vinted URL" className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm" />
                <button onClick={addProduct} disabled={!formData.name || !formData.price || formData.images.length === 0} className="w-full py-4 bg-[#FF4400] text-white text-sm font-bold uppercase disabled:opacity-50">
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
