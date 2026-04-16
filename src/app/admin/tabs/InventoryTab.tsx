import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Trash2, ExternalLink, RefreshCw, ShoppingBag, Edit3, Search, ImageIcon, Save } from "lucide-react";
import { proxyImg } from "../utils/helpers";
import { ToastType } from "../hooks/useToast";

interface Product {
  id: number; name: string; brand: string; category: string; price: string;
  size: string; condition: string; images: string[]; vinted_url: string; sold: boolean;
}
interface Employee {
  id: number; username: string; role: string;
  permissions: { canAddProducts: boolean; canEditProducts: boolean; canDeleteProducts: boolean; canViewStats: boolean; canManageEmployees: boolean; };
}

export function InventoryTab({ user, toast, confirm }: { user: Employee | null, toast: (msg: string, type?: ToastType) => void, confirm: (msg: string, onConfirm: () => void) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBrand, setActiveBrand] = useState('Alle');
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('id');
    if (!error && data) setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadProducts(); }, []);

  const brandList = Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'de'));
  const allBrands = ["Alle", ...brandList];
  const fixedCategories = ['Jacken', 'Pullover', 'Sweatshirts', 'Tops', 'Sonstiges'];
  const allCategories = ["Alle", ...fixedCategories];
  
  const filtered = products.filter(p => {
    if (activeBrand !== "Alle" && p.brand !== activeBrand) return false;
    if (activeCategory !== "Alle" && p.category !== activeCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.price.includes(search)) return false;
    return true;
  });

  const markSold = async (id: number, currentSold: boolean) => {
    const { error } = await supabase.from('products').update({ sold: !currentSold }).eq('id', id);
    if (!error) { setProducts(p => p.map(x => x.id === id ? { ...x, sold: !currentSold } : x)); toast(currentSold ? 'Produkt reaktiviert' : 'Produkt als verkauft markiert', 'info'); }
  };

  const deleteProduct = async (id: number) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) { setProducts(p => p.filter(x => x.id !== id)); toast('Produkt gelöscht', 'info'); }
  };

  if (editingProduct) return (
    <div className="max-w-2xl mx-auto bg-[#111] border border-[#FF4400]/30 p-6">
      <h3 className="text-lg font-bold text-[#FF4400] mb-4">Produkt bearbeiten</h3>
      <div className="space-y-4">
        <input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3" placeholder="Name"/>
        <div className="grid grid-cols-2 gap-4"><input value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3" placeholder="Preis"/><input value={editingProduct.size} onChange={e => setEditingProduct({...editingProduct, size: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3" placeholder="Größe"/></div>
        <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3"><option>Jacken</option><option>Pullover</option><option>Sweatshirts</option><option>Tops</option><option>Sonstiges</option></select>
        <input value={editingProduct.vinted_url} onChange={e => setEditingProduct({...editingProduct, vinted_url: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3" placeholder="Vinted URL"/>
        <div className="flex gap-2"><button onClick={() => { supabase.from('products').update(editingProduct).eq('id', editingProduct.id).then(() => { setEditingProduct(null); toast('Produkt gespeichert'); loadProducts(); }); }} className="flex-1 py-3 bg-[#FF4400] text-white font-bold uppercase"><Save className="w-4 h-4 inline mr-2"/>Speichern</button><button onClick={() => setEditingProduct(null)} className="flex-1 py-3 border border-gray-600 text-gray-400 uppercase">Abbrechen</button></div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Filter mit horizontalem Scroll - wie im Shop */}
      <div className="mb-6 space-y-6">
        
        {/* Marken Filter - horizontal scrollbar */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-[#FF4400]"></div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Marken</p>
          </div>
          <div className="relative">
            <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-custom">
              {allBrands.map(b => (
                <button key={b} onClick={() => setActiveBrand(b)}
                  className={`px-4 py-2 text-xs whitespace-nowrap uppercase tracking-widest transition-all duration-200 rounded-sm ${
                    activeBrand === b 
                      ? 'bg-[#FF4400] text-white' 
                      : 'bg-[#1A1A1A] border border-[#FF4400]/20 text-gray-400 hover:border-[#FF4400] hover:text-[#FF4400]'
                  }`}>
                  {b}
                </button>
              ))}
            </div>
            {/* Gradient für Scroll-Indikator */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0A0A0A] to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0A0A0A] to-transparent pointer-events-none"></div>
          </div>
        </div>
        
        {/* Kategorien Filter - horizontal scrollbar */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-[#FF4400]"></div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Kategorien</p>
          </div>
          <div className="relative">
            <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-custom">
              {allCategories.map(c => (
                <button key={c} onClick={() => setActiveCategory(c)}
                  className={`px-4 py-2 text-xs whitespace-nowrap uppercase tracking-widest transition-all duration-200 rounded-sm ${
                    activeCategory === c 
                      ? 'bg-[#FF4400] text-white' 
                      : 'bg-[#1A1A1A] border border-[#FF4400]/20 text-gray-400 hover:border-[#FF4400] hover:text-[#FF4400]'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0A0A0A] to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0A0A0A] to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>
      
      {/* Suche */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/><input type="text" placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-4 py-2 bg-[#1A1A1A] border border-[#FF4400]/30 text-sm w-64"/></div>
        <button onClick={loadProducts} className="p-2 border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10"><RefreshCw className="w-4 h-4"/></button>
        <div className="text-xs text-gray-500">{filtered.length} von {products.length} Artikeln</div>
      </div>
      
      {/* Produkt Grid mit Scrollbarkeit */}
      <div className="max-h-[calc(100vh-380px)] overflow-y-auto pr-2 scrollbar-thin">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Lade...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map(p => (
              <div key={p.id} className={`relative border transition-all ${p.sold ? 'border-red-500/50 opacity-50' : 'border-[#FF4400]/20 hover:border-[#FF4400]/50'}`}>
                {p.sold && (<div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"><span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rotate-[-15deg] uppercase tracking-widest">Verkauft</span></div>)}
                <div className="aspect-[3/4] bg-[#1A1A1A] overflow-hidden relative">
                  <img src={p.images?.[0] ? `/api/image-proxy?url=${encodeURIComponent(p.images[0])}` : ''} alt={p.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                  {p.images?.length > 1 && (<div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 text-xs font-bold flex items-center gap-1"><ImageIcon className="w-3 h-3"/> {p.images.length}</div>)}
                </div>
                <div className="p-2 bg-[#0A0A0A]">
                  <p className="text-xs font-bold truncate">{p.name}</p>
                  <p className="text-xs text-[#FF4400] mt-0.5">{p.price} · {p.size}</p>
                  <div className="flex gap-1 mt-2">
                    {user?.permissions.canEditProducts && (<button onClick={() => setEditingProduct(p)} className="px-2 py-1 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10"><Edit3 className="w-3 h-3"/></button>)}
                    {user?.permissions.canEditProducts && (<button onClick={() => markSold(p.id, p.sold)} className={`flex-1 py-1 text-xs font-bold uppercase flex items-center justify-center gap-1 ${p.sold ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}><ShoppingBag className="w-3 h-3"/>{p.sold ? 'Reaktiv.' : 'Verkauft'}</button>)}
                    <a href={p.vinted_url} target="_blank" className="px-2 py-1 border border-[#FF4400]/30 text-[#FF4400]"><ExternalLink className="w-3 h-3"/></a>
                    {user?.permissions.canDeleteProducts && (<button onClick={() => confirm('Produkt wirklich löschen?', () => deleteProduct(p.id))} className="px-2 py-1 border border-red-500/30 text-red-400"><Trash2 className="w-3 h-3"/></button>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
