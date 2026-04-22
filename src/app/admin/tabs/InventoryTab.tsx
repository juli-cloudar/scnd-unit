import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Trash2, ExternalLink, RefreshCw, ShoppingBag, Edit3, Search, ImageIcon, Save, Package, Archive } from "lucide-react";
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

const PRODUCT_CATEGORIES = [
  'Jacken', 'Pullover', 'Sweatshirts', 'Tops', 'Hemden', 
  'Headwear', 'Polos', 'Taschen', 'Sonstiges'
];

// ============================================================
// KOMPONENTE FÜR VERKAUFTE ARTIKEL
// ============================================================
function SoldProductsView({ user, toast, confirm }: { user: Employee | null, toast: (msg: string, type?: ToastType) => void, confirm: (msg: string, onConfirm: () => void) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBrand, setActiveBrand] = useState('Alle');
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [search, setSearch] = useState('');
  const [showImages, setShowImages] = useState(true);

  const loadSoldProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('sold', true)
      .order('id', { ascending: false });
    if (!error && data) setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadSoldProducts(); }, []);

  const brandList = Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'de'));
  const allBrands = ["Alle", ...brandList];
  const allCategories = ["Alle", ...PRODUCT_CATEGORIES];
  
  const filtered = products.filter(p => {
    if (activeBrand !== "Alle" && p.brand !== activeBrand) return false;
    if (activeCategory !== "Alle" && p.category !== activeCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.price.includes(search)) return false;
    return true;
  });

  const formatPrice = (price: string) => price.replace('.', ',');

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Lade verkaufte Artikel...</div>;
  }

  return (
    <div>
      {/* Header mit Bild-Toggle */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Archive className="w-5 h-5 text-[#FF4400]" />
          <span className="text-sm text-gray-400">{products.length} verkaufte Artikel</span>
        </div>
        <button
          onClick={() => setShowImages(!showImages)}
          className="px-3 py-1 text-xs border border-gray-700 rounded-sm hover:border-[#FF4400] transition-colors"
        >
          {showImages ? 'Bilder ausblenden' : 'Bilder anzeigen'}
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6 space-y-6">
        {/* Marken Filter */}
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
          </div>
        </div>
        
        {/* Kategorien Filter */}
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
          </div>
        </div>
      </div>
      
      {/* Suche */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input type="text" placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-4 py-2 bg-[#1A1A1A] border border-[#FF4400]/30 text-sm w-64"/>
        </div>
        <button onClick={loadSoldProducts} className="p-2 border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10">
          <RefreshCw className="w-4 h-4"/>
        </button>
        <div className="text-xs text-gray-500">{filtered.length} von {products.length} Artikeln</div>
      </div>
      
      {/* Produkt Grid */}
      <div className="max-h-[calc(100vh-380px)] overflow-y-auto pr-2 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Keine verkauften Artikel gefunden</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map(p => (
              <div key={p.id} className="relative border border-red-500/30 bg-red-950/10 hover:border-red-500/50 transition-all">
                <div className="absolute top-2 right-2 z-10">
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 uppercase tracking-widest">Verkauft</span>
                </div>
                {showImages && p.images?.[0] && (
                  <div className="aspect-[3/4] bg-[#1A1A1A] overflow-hidden relative">
                    <img 
                      src={`/api/image-proxy?url=${encodeURIComponent(p.images[0])}`} 
                      alt={p.name} 
                      className="w-full h-full object-cover opacity-70 grayscale-[30%]" 
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} 
                    />
                    {p.images?.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 text-xs font-bold flex items-center gap-1">
                        <ImageIcon className="w-3 h-3"/> {p.images.length}
                      </div>
                    )}
                  </div>
                )}
                <div className="p-2 bg-[#0A0A0A]">
                  <p className="text-xs font-bold truncate">{p.name}</p>
                  <p className="text-xs text-red-400 mt-0.5">{formatPrice(p.price)}€ · {p.size}</p>
                  <div className="flex gap-1 mt-2">
                    {user?.permissions.canEditProducts && (
                      <a href={p.vinted_url} target="_blank" className="flex-1 py-1 text-xs font-bold uppercase flex items-center justify-center gap-1 bg-gray-800 text-gray-400 hover:bg-gray-700">
                        <ExternalLink className="w-3 h-3"/> Vinted
                      </a>
                    )}
                    {user?.permissions.canDeleteProducts && (
                      <button onClick={() => confirm('Produkt wirklich löschen?', () => {
                        supabase.from('products').delete().eq('id', p.id).then(() => {
                          setProducts(prev => prev.filter(x => x.id !== p.id));
                          toast('Produkt gelöscht', 'info');
                        });
                      })} className="px-2 py-1 border border-red-500/30 text-red-400 hover:bg-red-500/10">
                        <Trash2 className="w-3 h-3"/>
                      </button>
                    )}
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

// ============================================================
// HAUPT-KOMPONENTE MIT TABS
// ============================================================
export function InventoryTab({ user, toast, confirm }: { user: Employee | null, toast: (msg: string, type?: ToastType) => void, confirm: (msg: string, onConfirm: () => void) => void }) {
  const [activeTab, setActiveTab] = useState<'available' | 'sold'>('available');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBrand, setActiveBrand] = useState('Alle');
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').eq('sold', false).order('id');
    if (!error && data) setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadProducts(); }, []);

  const brandList = Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'de'));
  const allBrands = ["Alle", ...brandList];
  const allCategories = ["Alle", ...PRODUCT_CATEGORIES];
  
  const filtered = products.filter(p => {
    if (activeBrand !== "Alle" && p.brand !== activeBrand) return false;
    if (activeCategory !== "Alle" && p.category !== activeCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.price.includes(search)) return false;
    return true;
  });

  const markSold = async (id: number, currentSold: boolean) => {
    const { error } = await supabase.from('products').update({ sold: !currentSold }).eq('id', id);
    if (!error) { 
      setProducts(p => p.filter(x => x.id !== id)); // Aus verfügbarer Liste entfernen
      toast('Produkt als verkauft markiert', 'info'); 
      loadProducts(); // Liste neu laden
    }
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
        <div className="grid grid-cols-2 gap-4">
          <input value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3" placeholder="Preis"/>
          <input value={editingProduct.size} onChange={e => setEditingProduct({...editingProduct, size: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3" placeholder="Größe"/>
        </div>
        <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3">
          {PRODUCT_CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
        </select>
        <input value={editingProduct.vinted_url} onChange={e => setEditingProduct({...editingProduct, vinted_url: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3" placeholder="Vinted URL"/>
        <div className="flex gap-2">
          <button onClick={() => { supabase.from('products').update(editingProduct).eq('id', editingProduct.id).then(() => { setEditingProduct(null); toast('Produkt gespeichert'); loadProducts(); }); }} className="flex-1 py-3 bg-[#FF4400] text-white font-bold uppercase"><Save className="w-4 h-4 inline mr-2"/>Speichern</button>
          <button onClick={() => setEditingProduct(null)} className="flex-1 py-3 border border-gray-600 text-gray-400 uppercase">Abbrechen</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* TABS */}
      <div className="flex border-b border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex items-center gap-2 px-6 py-3 text-sm uppercase tracking-widest transition-all ${
            activeTab === 'available' 
              ? 'text-[#FF4400] border-b-2 border-[#FF4400]' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Package className="w-4 h-4" />
          Verfügbar ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('sold')}
          className={`flex items-center gap-2 px-6 py-3 text-sm uppercase tracking-widest transition-all ${
            activeTab === 'sold' 
              ? 'text-[#FF4400] border-b-2 border-[#FF4400]' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Archive className="w-4 h-4" />
          Verkauft
        </button>
      </div>

      {/* VERFÜGBARE ARTIKEL (dein originaler Code) */}
      {activeTab === 'available' && (
        <>
          {/* Filter */}
          <div className="mb-6 space-y-6">
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
              </div>
            </div>
            
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
              </div>
            </div>
          </div>
          
          {/* Suche */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/><input type="text" placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-4 py-2 bg-[#1A1A1A] border border-[#FF4400]/30 text-sm w-64"/></div>
            <button onClick={loadProducts} className="p-2 border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10"><RefreshCw className="w-4 h-4"/></button>
            <div className="text-xs text-gray-500">{filtered.length} von {products.length} Artikeln</div>
          </div>
          
          {/* Produkt Grid */}
          <div className="max-h-[calc(100vh-380px)] overflow-y-auto pr-2 scrollbar-thin">
            {loading ? (
              <div className="text-center py-20 text-gray-500">Lade...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtered.map(p => (
                  <div key={p.id} className="relative border border-[#FF4400]/20 hover:border-[#FF4400]/50 transition-all">
                    <div className="aspect-[3/4] bg-[#1A1A1A] overflow-hidden relative">
                      <img src={p.images?.[0] ? `/api/image-proxy?url=${encodeURIComponent(p.images[0])}` : ''} alt={p.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                      {p.images?.length > 1 && (<div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 text-xs font-bold flex items-center gap-1"><ImageIcon className="w-3 h-3"/> {p.images.length}</div>)}
                    </div>
                    <div className="p-2 bg-[#0A0A0A]">
                      <p className="text-xs font-bold truncate">{p.name}</p>
                      <p className="text-xs text-[#FF4400] mt-0.5">{p.price} · {p.size}</p>
                      <div className="flex gap-1 mt-2">
                        {user?.permissions.canEditProducts && (<button onClick={() => setEditingProduct(p)} className="px-2 py-1 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10"><Edit3 className="w-3 h-3"/></button>)}
                        {user?.permissions.canEditProducts && (<button onClick={() => markSold(p.id, p.sold)} className="flex-1 py-1 text-xs font-bold uppercase flex items-center justify-center gap-1 bg-red-600/20 text-red-400"><ShoppingBag className="w-3 h-3"/>Verkauft</button>)}
                        <a href={p.vinted_url} target="_blank" className="px-2 py-1 border border-[#FF4400]/30 text-[#FF4400]"><ExternalLink className="w-3 h-3"/></a>
                        {user?.permissions.canDeleteProducts && (<button onClick={() => confirm('Produkt wirklich löschen?', () => deleteProduct(p.id))} className="px-2 py-1 border border-red-500/30 text-red-400"><Trash2 className="w-3 h-3"/></button>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* VERKAUFTE ARTIKEL */}
      {activeTab === 'sold' && (
        <SoldProductsView user={user} toast={toast} confirm={confirm} />
      )}
    </div>
  );
}
