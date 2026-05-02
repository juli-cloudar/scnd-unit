import { useState, useEffect, useCallback } from "react";
import { 
  Trash2, ExternalLink, RefreshCw, ShoppingBag, Edit3, Search, 
  ImageIcon, Save, Archive, Package, Tags, X, Check, Edit2, 
  AlertCircle, Plus
} from "lucide-react";
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

// Fallback-Kategorien
const FALLBACK_CATEGORIES = [
  'Jacken', 'Pullover', 'Sweatshirts', 'Tops', 'Hemden', 
  'Headwear', 'Polos', 'Taschen', 'Sonstiges'
];

type FilterType = 'all' | 'available' | 'sold';

// ============================================================
// MARKEN-VERWALTUNGS-COMPONENT
// ============================================================
function BrandManager({ 
  brands, 
  onBrandsUpdated, 
  onClose,
  toast 
}: { 
  brands: string[]; 
  onBrandsUpdated: () => void; 
  onClose: () => void;
  toast: (msg: string, type?: ToastType) => void;
}) {
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const adminKey = typeof window !== 'undefined' ? sessionStorage.getItem('admin_key') : null;

  const handleEdit = async (oldBrand: string) => {
    if (!editValue.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/brands', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey || ''
        },
        body: JSON.stringify({ oldBrand, newBrand: editValue.trim() })
      });
      
      if (!res.ok) throw new Error('Update failed');
      toast(`✅ "${oldBrand}" → "${editValue.trim()}" aktualisiert`, 'success');
      onBrandsUpdated();
      setEditingBrand(null);
      setEditValue('');
    } catch (error) {
      toast('Fehler beim Aktualisieren', 'error');
    }
    setIsProcessing(false);
  };

  const handleMerge = async (sourceBrand: string, targetBrand: string) => {
    if (sourceBrand === targetBrand) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey || ''
        },
        body: JSON.stringify({ action: 'merge', sourceBrand, targetBrand })
      });
      
      if (!res.ok) throw new Error('Merge failed');
      toast(`✅ "${sourceBrand}" wurde mit "${targetBrand}" zusammengeführt`, 'success');
      onBrandsUpdated();
      setMergeTarget(null);
    } catch (error) {
      toast('Fehler beim Zusammenführen', 'error');
    }
    setIsProcessing(false);
  };

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;
    toast(`💡 Neue Marke "${newBrandName.trim()}" kann beim nächsten Produkt verwendet werden`, 'info');
    setNewBrandName('');
    onBrandsUpdated();
  };

  const handleDeleteEmptyBrand = async (brand: string) => {
    const res = await fetch(`/api/admin/brands?brand=${encodeURIComponent(brand)}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey || '' }
    });
    
    if (res.ok) {
      toast(`ℹ️ "${brand}" wurde entfernt`, 'info');
      onBrandsUpdated();
    } else {
      const data = await res.json();
      toast(data.error || 'Kann nicht gelöscht werden', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-[#FF4400]/30 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-[#FF4400]/20">
          <div className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-[#FF4400]" />
            <h3 className="text-lg font-bold uppercase tracking-wider">Marken verwalten</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#FF4400]/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Neue Marke hinzufügen */}
          <div className="bg-[#1A1A1A] rounded-lg p-4">
            <h4 className="text-sm font-bold text-[#FF4400] mb-3">➕ Neue Marke hinzufügen</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="z.B. Supreme, Balenciaga, ..."
                className="flex-1 bg-[#0A0A0A] border border-[#FF4400]/30 rounded px-3 py-2 text-sm"
              />
              <button
                onClick={handleAddBrand}
                className="px-4 py-2 bg-[#FF4400] text-white rounded text-sm font-bold"
              >
                <Plus className="w-4 h-4 inline mr-1" /> Hinzufügen
              </button>
            </div>
          </div>

          {/* Marken bearbeiten / mergen */}
          <div>
            <h4 className="text-sm font-bold text-[#FF4400] mb-3">✏️ Marken bearbeiten & zusammenführen</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {brands.map(brand => (
                <div key={brand} className="bg-[#1A1A1A] rounded-lg p-3">
                  {editingBrand === brand ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 bg-[#0A0A0A] border border-[#FF4400]/30 rounded px-3 py-2 text-sm"
                        autoFocus
                      />
                      <button onClick={() => handleEdit(brand)} disabled={isProcessing} className="px-3 py-2 bg-green-600 text-white rounded">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditingBrand(null); setEditValue(''); }} className="px-3 py-2 bg-gray-700 text-white rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : mergeTarget === brand ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Wähle die Ziel-Marke für <span className="text-[#FF4400]">{brand}</span>:</p>
                      <div className="flex flex-wrap gap-2">
                        {brands.filter(b => b !== brand).map(b => (
                          <button key={b} onClick={() => handleMerge(brand, b)} disabled={isProcessing} className="px-3 py-1 bg-[#FF4400]/20 border border-[#FF4400]/30 rounded text-xs hover:bg-[#FF4400]/30">
                            {b}
                          </button>
                        ))}
                        <button onClick={() => setMergeTarget(null)} className="px-3 py-1 bg-gray-700 rounded text-xs">Abbrechen</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm">{brand}</span>
                        <span className="text-xs text-gray-500">({brand.length} Zeichen)</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingBrand(brand); setEditValue(brand); }} className="p-1.5 hover:bg-blue-600/20 rounded-lg" title="Bearbeiten">
                          <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                        <button onClick={() => setMergeTarget(brand)} className="p-1.5 hover:bg-purple-600/20 rounded-lg" title="Mit anderer Marke zusammenführen">
                          <Tags className="w-3.5 h-3.5 text-purple-400" />
                        </button>
                        <button onClick={() => handleDeleteEmptyBrand(brand)} className="p-1.5 hover:bg-red-600/20 rounded-lg" title="Leere Marke löschen">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div className="text-xs text-gray-400">
                <p className="font-bold text-blue-400 mb-1">Hinweise:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Bearbeiten:</strong> Ändert den Namen der Marke für ALLE betroffenen Produkte</li>
                  <li><strong>Zusammenführen:</strong> Verschiebt alle Produkte von einer Marke zu einer anderen</li>
                  <li><strong>Löschen:</strong> Entfernt nur Marken, die von keinem Produkt verwendet werden</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HAUPT-COMPONENT
// ============================================================
export function InventoryTab({ user, toast, confirm }: { user: Employee | null, toast: (msg: string, type?: ToastType) => void, confirm: (msg: string, onConfirm: () => void) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBrand, setActiveBrand] = useState('Alle');
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('available');
  
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  const [dynamicBrands, setDynamicBrands] = useState<string[]>([]);
  const [showBrandManager, setShowBrandManager] = useState(false);
  
  const adminKey = typeof window !== 'undefined' ? sessionStorage.getItem('admin_key') : null;

  const loadFilterOptions = useCallback(async () => {
    try {
      const [brandsRes, categoriesRes] = await Promise.all([
        fetch('/api/products?action=brands'),
        fetch('/api/products?action=categories')
      ]);
      
      const brands = await brandsRes.json();
      const categories = await categoriesRes.json();
      
      setDynamicBrands(brands);
      setDynamicCategories(categories);
    } catch (error) {
      console.error('Fehler beim Laden der Filteroptionen:', error);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const soldParam = filterType === 'available' ? 'false' : filterType === 'sold' ? 'true' : '';
    const url = `/api/products${soldParam ? `?sold=${soldParam}` : ''}`;
    
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) console.error('Fehler:', data);
    else setProducts(data);
    setLoading(false);
  }, [filterType]);

  useEffect(() => {
    loadProducts();
    loadFilterOptions();
  }, [filterType, loadProducts, loadFilterOptions]);

  const allCategories = ["Alle", ...(dynamicCategories.length > 0 ? dynamicCategories : FALLBACK_CATEGORIES)];
  const allBrands = ["Alle", ...dynamicBrands];
  
  const filtered = products.filter(p => {
    if (activeBrand !== "Alle" && p.brand !== activeBrand) return false;
    if (activeCategory !== "Alle" && p.category !== activeCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.price.includes(search)) return false;
    return true;
  });

  const markSold = async (id: number, currentSold: boolean) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey || ''
      },
      body: JSON.stringify({ action: 'update', data: { id, sold: !currentSold } })
    });
    
    if (res.ok) {
      setProducts(p => p.map(x => x.id === id ? { ...x, sold: !currentSold } : x));
      toast(currentSold ? 'Produkt reaktiviert' : 'Produkt als verkauft markiert', 'info');
    } else {
      toast('Fehler beim Aktualisieren', 'error');
    }
  };

  const deleteProduct = async (id: number) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey || ''
      },
      body: JSON.stringify({ action: 'delete', data: { id } })
    });
    
    if (res.ok) {
      setProducts(p => p.filter(x => x.id !== id));
      toast('Produkt gelöscht', 'info');
      loadFilterOptions();
    } else {
      toast('Fehler beim Löschen', 'error');
    }
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
          {(dynamicCategories.length > 0 ? dynamicCategories : FALLBACK_CATEGORIES).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input value={editingProduct.vinted_url} onChange={e => setEditingProduct({...editingProduct, vinted_url: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3" placeholder="Vinted URL"/>
        <div className="flex gap-2">
          <button onClick={async () => {
            const res = await fetch('/api/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey || '' },
              body: JSON.stringify({ action: 'update', data: editingProduct })
            });
            if (res.ok) {
              setEditingProduct(null);
              toast('Produkt gespeichert', 'success');
              loadProducts();
              loadFilterOptions();
            } else {
              toast('Fehler beim Speichern', 'error');
            }
          }} className="flex-1 py-3 bg-[#FF4400] text-white font-bold uppercase"><Save className="w-4 h-4 inline mr-2"/>Speichern</button>
          <button onClick={() => setEditingProduct(null)} className="flex-1 py-3 border border-gray-600 text-gray-400 uppercase">Abbrechen</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {showBrandManager && (
        <BrandManager
          brands={dynamicBrands}
          onBrandsUpdated={() => {
            loadFilterOptions();
            loadProducts();
          }}
          onClose={() => setShowBrandManager(false)}
          toast={toast}
        />
      )}

      <div className="mb-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-[#FF4400]"></div>
              <p className="text-xs text-gray-400 uppercase tracking-widest">Marken</p>
            </div>
            <button onClick={() => setShowBrandManager(true)} className="flex items-center gap-1 px-2 py-1 text-xs bg-[#FF4400]/20 border border-[#FF4400]/30 text-[#FF4400] rounded hover:bg-[#FF4400]/30">
              <Tags className="w-3 h-3" /> Marken verwalten
            </button>
          </div>
          <div className="relative">
            <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-custom">
              {allBrands.map(b => (
                <button key={b} onClick={() => setActiveBrand(b)} className={`px-4 py-2 text-xs whitespace-nowrap uppercase tracking-widest rounded-sm ${activeBrand === b ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] border border-[#FF4400]/20 text-gray-400 hover:border-[#FF4400] hover:text-[#FF4400]'}`}>
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
                <button key={c} onClick={() => setActiveCategory(c)} className={`px-4 py-2 text-xs whitespace-nowrap uppercase tracking-widest rounded-sm ${activeCategory === c ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] border border-[#FF4400]/20 text-gray-400 hover:border-[#FF4400] hover:text-[#FF4400]'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input type="text" placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-4 py-2 bg-[#1A1A1A] border border-[#FF4400]/30 text-sm w-64"/>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => setFilterType('available')} className={`px-3 py-2 border text-xs uppercase tracking-widest flex items-center gap-1 ${filterType === 'available' ? 'bg-green-600/20 border-green-500 text-green-400' : 'border-[#FF4400]/30 text-gray-400 hover:text-[#FF4400]'}`}>
            <Package className="w-4 h-4"/> Verfügbar
          </button>
          <button onClick={() => setFilterType('sold')} className={`px-3 py-2 border text-xs uppercase tracking-widest flex items-center gap-1 ${filterType === 'sold' ? 'bg-red-600/20 border-red-500 text-red-400' : 'border-[#FF4400]/30 text-gray-400 hover:text-[#FF4400]'}`}>
            <Archive className="w-4 h-4"/> Verkauft
          </button>
          <button onClick={() => setFilterType('all')} className={`px-3 py-2 border text-xs uppercase tracking-widest ${filterType === 'all' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-[#FF4400]/30 text-gray-400 hover:text-[#FF4400]'}`}>
            Alle
          </button>
          <button onClick={() => { loadProducts(); loadFilterOptions(); }} className="p-2 border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10">
            <RefreshCw className="w-4 h-4"/>
          </button>
        </div>
        
        <div className="text-xs text-gray-500">{filtered.length} von {products.length} Artikeln</div>
      </div>
      
      <div className="max-h-[calc(100vh-380px)] overflow-y-auto pr-2 scrollbar-thin">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Lade...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map(p => (
              <div key={p.id} className={`relative border transition-all ${p.sold ? 'border-red-500/50 opacity-50' : 'border-[#FF4400]/20 hover:border-[#FF4400]/50'}`}>
                {p.sold && (<div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rotate-[-15deg] uppercase tracking-widest">Verkauft</span></div>)}
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
