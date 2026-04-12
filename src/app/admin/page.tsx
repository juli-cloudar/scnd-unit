'use client';
import { useState, useEffect } from 'react';
import { 
  Trash2, ExternalLink, RefreshCw, ShoppingBag, Plus, Check, X, 
  Wand2, ChevronLeft, ChevronRight, ImageIcon, Lock, Users, 
  Settings, Package, BarChart3, Shield, Eye, EyeOff, Download,
  Clock, LogOut, Edit3, UserPlus, Search, Filter, MoreVertical,
  Key, Save
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// =================== INTERFACES ===================
interface Product {
  id: number; 
  name: string; 
  category: string; 
  price: string;
  size: string; 
  condition: string; 
  images: string[]; 
  vinted_url: string; 
  sold: boolean;
}

interface ScrapedData {
  name?: string; 
  category?: string; 
  price?: string; 
  size?: string; 
  condition?: string; 
  images?: string[];
}

interface Employee {
  id: number; 
  username: string; 
  password: string; 
  role: 'Mitarbeiter' | 'Manager' | 'Admin';
  login_count: number; 
  total_work_hours: number; 
  online: boolean; 
  last_login?: string;
  created_at?: string;
  permissions: {
    canAddProducts: boolean;
    canEditProducts: boolean;
    canDeleteProducts: boolean;
    canViewStats: boolean;
    canManageEmployees: boolean;
  };
}

interface ActivityLog {
  id: number;
  employee_id: number;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

// =================== KONSTANTEN ===================
const ADMIN_PASSWORD = 'mastercontrol01010';

// =================== MAIN COMPONENT ===================
export default function ManagementPanel() {
  const [authed, setAuthed] = useState(false);
  const [authMode, setAuthMode] = useState<'admin' | 'employee' | null>(null);
  const [checking, setChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState('inventory');

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('scnd_auth');
    const savedUser = sessionStorage.getItem('scnd_user');
    if (savedAuth === 'admin') {
      setAuthed(true);
      setAuthMode('admin');
      setCurrentUser({ 
        id: 0, 
        username: 'Julian', 
        role: 'Admin', 
        password: '',
        login_count: 0,
        total_work_hours: 0,
        online: true,
        permissions: {
          canAddProducts: true, 
          canEditProducts: true, 
          canDeleteProducts: true,
          canViewStats: true, 
          canManageEmployees: true
        }
      });
    } else if (savedAuth === 'employee' && savedUser) {
      setAuthed(true);
      setAuthMode('employee');
      setCurrentUser(JSON.parse(savedUser));
    }
    setChecking(false);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('scnd_auth');
    sessionStorage.removeItem('scnd_user');
    setAuthed(false);
    setAuthMode(null);
    setCurrentUser(null);
  };

  if (checking) return null;
  
  if (!authed) {
    return <LoginScreen onLogin={(mode, user) => {
      setAuthed(true);
      setAuthMode(mode);
      setCurrentUser(user);
      sessionStorage.setItem('scnd_auth', mode);
      if (user) sessionStorage.setItem('scnd_user', JSON.stringify(user));
    }} />;
  }

  return (
    <div className="min-h-screen font-sans bg-[#0A0A0A] text-[#F5F5F5]">
      <header className="border-b border-[#FF4400]/30 px-6 py-4 sticky top-0 bg-[#0A0A0A]/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tighter">
              <span className="text-[#FF4400]">SCND</span>_UNIT
              <span className="text-gray-500 text-lg ml-2">/ Management</span>
            </h1>
            {currentUser && (
              <span className={`px-2 py-1 text-xs uppercase font-bold ${
                currentUser.role === 'Admin' ? 'bg-yellow-400 text-black' :
                currentUser.role === 'Manager' ? 'bg-blue-500 text-white' :
                'bg-gray-600 text-white'
              }`}>
                {currentUser.role}: {currentUser.username}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {currentUser?.permissions.canViewStats && (
              <button onClick={()=>setActiveTab('analytics')} 
                className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${
                  activeTab==='analytics'?'bg-[#FF4400] text-white':'border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10'
                }`}>
                <BarChart3 className="w-4 h-4 inline mr-1"/> Analytics
              </button>
            )}
            
            <button onClick={()=>setActiveTab('inventory')} 
              className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${
                activeTab==='inventory'?'bg-[#FF4400] text-white':'border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10'
              }`}>
              <Package className="w-4 h-4 inline mr-1"/> Inventar
            </button>
            
            {currentUser?.permissions.canAddProducts && (
              <button onClick={()=>setActiveTab('add')} 
                className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${
                  activeTab==='add'?'bg-[#FF4400] text-white':'border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10'
                }`}>
                <Plus className="w-4 h-4 inline mr-1"/> Hinzufügen
              </button>
            )}
            
            {currentUser?.permissions.canManageEmployees && (
              <button onClick={()=>setActiveTab('employees')} 
                className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${
                  activeTab==='employees'?'bg-yellow-400 text-black':'border border-yellow-400 text-yellow-400 hover:bg-yellow-400/10'
                }`}>
                <Users className="w-4 h-4 inline mr-1"/> Team
              </button>
            )}
            
            {currentUser?.role === 'Admin' && (
              <button onClick={()=>setActiveTab('logs')} 
                className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${
                  activeTab==='logs'?'bg-purple-500 text-white':'border border-purple-500 text-purple-500 hover:bg-purple-500/10'
                }`}>
                <Clock className="w-4 h-4 inline mr-1"/> Logs
              </button>
            )}
            
            <button onClick={handleLogout} 
              className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 text-xs uppercase font-bold">
              <LogOut className="w-4 h-4 inline mr-1"/> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {activeTab==='inventory' && <InventoryTab user={currentUser} />}
        {activeTab==='add' && <AddTab user={currentUser} />}
        {activeTab==='analytics' && <AnalyticsTab />}
        {activeTab==='employees' && currentUser?.permissions.canManageEmployees && <EmployeesTab currentUser={currentUser} />}
        {activeTab==='logs' && currentUser?.role === 'Admin' && <LogsTab />}
      </main>
    </div>
  );
}

// =================== LOGIN SCREEN ===================
function LoginScreen({ onLogin }: { onLogin: (mode: 'admin' | 'employee', user: Employee | null) => void }) {
  const [input, setInput] = useState(''); 
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const tryLogin = async () => {
    if (!input) return;
    setLoading(true);
    setError('');

    if (input === ADMIN_PASSWORD) {
      onLogin('admin', null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('password', input)
      .single();

    if (data && !error) {
      await supabase.from('employees').update({ 
        online: true, 
        last_login: new Date().toISOString(),
        login_count: (data.login_count || 0) + 1
      }).eq('id', data.id);
      
      onLogin('employee', data);
    } else {
      setError('Ungültiges Passwort');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
      <div className="w-full max-w-md p-8 border border-[#FF4400]/30 bg-[#111]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tighter mb-2">
            <span className="text-[#FF4400]">SCND</span>_UNIT
          </h1>
          <p className="text-gray-500 text-sm uppercase tracking-widest">Management Panel</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'} 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && tryLogin()}
              placeholder="Passwort eingeben" 
              className="w-full p-4 bg-[#1A1A1A] border border-[#FF4400]/30 text-[#F5F5F5] pr-12"
              autoFocus
            />
            <button 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#FF4400]"
            >
              {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button 
            onClick={tryLogin} 
            disabled={loading}
            className="w-full py-4 bg-[#FF4400] text-white font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 disabled:opacity-50"
          >
            {loading ? '...' : 'Einloggen'}
          </button>

          <div className="text-center text-xs text-gray-600 mt-4">
            Admin-Code oder Mitarbeiter-Passwort verwenden
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== INVENTORY TAB ===================
function InventoryTab({ user }: { user: Employee | null }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Alle');
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('id');
    if (!error && data) setProducts(data);
    setLoading(false);
  };

  const markSold = async (id: number, currentSold: boolean) => {
    if (!user?.permissions.canEditProducts) {
      alert('Keine Berechtigung!');
      return;
    }
    const { error } = await supabase.from('products').update({ sold: !currentSold }).eq('id', id);
    if (!error) {
      setProducts(p => p.map(x => x.id === id ? { ...x, sold: !currentSold } : x));
      logActivity(user.id, user.username, 'Produktstatus geändert', `ID: ${id}`);
    }
  };

  const removeProduct = async (id: number) => {
    if (!user?.permissions.canDeleteProducts) {
      alert('Keine Berechtigung!');
      return;
    }
    if (!confirm('Produkt wirklich löschen?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts(p => p.filter(x => x.id !== id));
      logActivity(user.id, user.username, 'Produkt gelöscht', `ID: ${id}`);
    }
  };

  const updateProduct = async (product: Product) => {
    if (!user?.permissions.canEditProducts) {
      alert('Keine Berechtigung!');
      return;
    }
    const { error } = await supabase.from('products').update(product).eq('id', product.id);
    if (!error) {
      setProducts(p => p.map(x => x.id === product.id ? product : x));
      setEditingProduct(null);
      logActivity(user.id, user.username, 'Produkt bearbeitet', product.name);
    }
  };

  const categories = ['Alle', ...Array.from(new Set(products.map(p => p.category))).sort()];
  const filtered = products.filter(p => {
    const matchesCategory = filter === 'Alle' || p.category === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.price.includes(search);
    return matchesCategory && matchesSearch;
  });

  if (editingProduct) {
    return (
      <div className="max-w-2xl mx-auto bg-[#111] border border-[#FF4400]/30 p-6">
        <h3 className="text-lg font-bold text-[#FF4400] mb-4">Produkt bearbeiten</h3>
        <div className="space-y-4">
          <input 
            value={editingProduct.name} 
            onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
            className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3"
            placeholder="Name"
          />
          <div className="grid grid-cols-2 gap-4">
            <input 
              value={editingProduct.price} 
              onChange={e => setEditingProduct({...editingProduct, price: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3"
              placeholder="Preis"
            />
            <input 
              value={editingProduct.size} 
              onChange={e => setEditingProduct({...editingProduct, size: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3"
              placeholder="Größe"
            />
          </div>
          <select 
            value={editingProduct.category}
            onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
            className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3"
          >
            <option>Jacken</option><option>Pullover</option><option>Sweatshirts</option>
            <option>Tops</option><option>Sonstiges</option>
          </select>
          <input 
            value={editingProduct.vinted_url} 
            onChange={e => setEditingProduct({...editingProduct, vinted_url: e.target.value})}
            className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3"
            placeholder="Vinted URL"
          />
          <div className="flex gap-2">
            <button 
              onClick={() => updateProduct(editingProduct)}
              className="flex-1 py-3 bg-[#FF4400] text-white font-bold uppercase"
            >
              <Save className="w-4 h-4 inline mr-2"/> Speichern
            </button>
            <button 
              onClick={() => setEditingProduct(null)}
              className="flex-1 py-3 border border-gray-600 text-gray-400 uppercase"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 text-xs uppercase font-bold transition-colors ${
                filter === cat ? 'bg-[#FF4400] text-white' : 'border border-[#FF4400]/30 text-gray-400 hover:text-[#FF4400]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
            <input 
              type="text" 
              placeholder="Suchen..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#1A1A1A] border border-[#FF4400]/30 text-sm"
            />
          </div>
          <button onClick={loadProducts} className="p-2 border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10">
            <RefreshCw className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Lade...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(p => (
            <div key={p.id} className={`relative border transition-all ${p.sold ? 'border-red-500/50 opacity-50' : 'border-[#FF4400]/20 hover:border-[#FF4400]/50'}`}>
              {p.sold && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rotate-[-15deg] uppercase tracking-widest">Verkauft</span>
                </div>
              )}
              <div className="aspect-[3/4] bg-[#1A1A1A] overflow-hidden relative">
                <img 
                  src={p.images?.[0] ? (p.images[0].startsWith('/api/') ? p.images[0] : `/api/image-proxy?url=${encodeURIComponent(p.images[0])}`) : ''} 
                  alt={p.name} 
                  className="w-full h-full object-cover"
                />
                {p.images?.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 text-xs font-bold flex items-center gap-1">
                    <ImageIcon className="w-3 h-3"/> {p.images.length}
                  </div>
                )}
              </div>
              <div className="p-2 bg-[#0A0A0A]">
                <p className="text-xs font-bold truncate">{p.name}</p>
                <p className="text-xs text-[#FF4400] mt-0.5">€{p.price?.replace(/^€/, '')} · {p.size}</p>
                <div className="flex gap-1 mt-2">
                  {user?.permissions.canEditProducts && (
                    <>
                      <button 
                        onClick={() => setEditingProduct(p)} 
                        className="px-2 py-1 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                      >
                        <Edit3 className="w-3 h-3"/>
                      </button>
                      <button 
                        onClick={() => markSold(p.id, p.sold)} 
                        className={`flex-1 py-1 text-xs font-bold uppercase flex items-center justify-center gap-1 ${
                          p.sold ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                        }`}
                      >
                        <ShoppingBag className="w-3 h-3"/>{p.sold ? 'Reaktiv.' : 'Verkauft'}
                      </button>
                    </>
                  )}
                  <a href={p.vinted_url} target="_blank" className="px-2 py-1 border border-[#FF4400]/30 text-[#FF4400]">
                    <ExternalLink className="w-3 h-3"/>
                  </a>
                  {user?.permissions.canDeleteProducts && (
                    <button onClick={() => removeProduct(p.id)} className="px-2 py-1 border border-red-500/30 text-red-400">
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
  );
}

// =================== ADD TAB ===================
function AddTab({ user }: { user: Employee | null }) {
  const [url, setUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: 'Jacken', price: '', size: '', condition: 'Gut', 
    vinted_url: '', images: [] as string[]
  });
  const [isSaving, setIsSaving] = useState(false);

  const scrapeVinted = async () => {
    if (!url.includes('vinted')) { 
      alert('Bitte gültige Vinted URL'); 
      return; 
    }
    setIsScraping(true);
    try {
      const res = await fetch('/api/vinted', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ url }) 
      });
      const data = await res.json();
      if (res.ok && data) {
        setFormData({
          name: data.name || '',
          category: data.category || 'Jacken',
          price: data.price?.replace(/^€/, '') || '',
          size: data.size || '',
          condition: data.condition || 'Gut',
          vinted_url: url,
          images: data.images || []
        });
      } else {
        alert('Keine Daten gefunden');
      }
    } catch (e) {
      console.error('Scraping Fehler:', e);
      alert('Fehler beim Scraping: ' + e);
    }
    setIsScraping(false);
  };

  // WICHTIG: async Funktion mit try-catch
  const addProduct = async (e: React.MouseEvent) => {
    e.preventDefault(); // Verhindert Form-Submit
    
    if (!formData.name || !formData.price) { 
      alert('Name und Preis sind Pflicht!'); 
      return; 
    }
    if (formData.images.length === 0) { 
      alert('Mindestens 1 Bild!'); 
      return; 
    }
    
    setIsSaving(true);
    
    try {
      const newProduct = {
        name: formData.name,
        category: formData.category,
        price: formData.price.replace(/^€/, ''),
        size: formData.size || '–',
        condition: formData.condition,
        images: formData.images,
        vinted_url: formData.vinted_url,
        sold: false
      };
      
      console.log('Speichere Produkt:', newProduct); // Debug
      
      const { data, error } = await supabase.from('products').insert(newProduct).select();
      
      if (error) {
        console.error('Supabase Fehler:', error);
        alert('Fehler beim Speichern: ' + error.message);
      } else {
        console.log('Gespeichert:', data);
        alert('Produkt gespeichert!');
        // Formular zurücksetzen
        setFormData({ 
          name: '', 
          category: 'Jacken', 
          price: '', 
          size: '', 
          condition: 'Gut', 
          vinted_url: '', 
          images: [] 
        });
        setUrl('');
        // Log erstellen
        await logActivity(user?.id || 0, user?.username || 'Unknown', 'Produkt hinzugefügt', newProduct.name);
      }
    } catch (err) {
      console.error('Fehler:', err);
      alert('Unerwarteter Fehler: ' + err);
    }
    
    setIsSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#111] border border-[#FF4400]/20 p-4">
        <label className="text-xs uppercase text-[#FF4400] block mb-2 flex items-center gap-2">
          <Wand2 className="w-3 h-3"/> Vinted URL
        </label>
        <div className="flex gap-2">
          <input 
            value={url} 
            onChange={e => setUrl(e.target.value)} 
            placeholder="https://www.vinted.de/items/..." 
            className="flex-1 bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"
          />
          <button 
            onClick={scrapeVinted} 
            disabled={isScraping}
            className="px-6 py-3 bg-[#FF4400] text-white text-xs font-bold uppercase disabled:opacity-50"
          >
            {isScraping ? '...' : 'Auto-Fill'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111] border border-[#FF4400]/20 p-4">
          <label className="text-xs uppercase text-[#FF4400] block mb-2">
            Bilder ({formData.images.length})
          </label>
          {formData.images.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {formData.images.map((img, i) => (
                <div key={i} className="relative aspect-square">
                  <img 
                    src={img.startsWith('/api/') ? img : `/api/image-proxy?url=${encodeURIComponent(img)}`} 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={() => setFormData(prev => ({
                      ...prev, 
                      images: prev.images.filter((_, idx) => idx !== i)
                    }))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-[3/4] bg-[#1A1A1A] flex items-center justify-center text-gray-600">
              Keine Bilder
            </div>
          )}
        </div>

        <div className="bg-[#111] border border-[#FF4400]/20 p-4 space-y-4">
          <label className="text-xs uppercase text-[#FF4400] block">Produktdaten</label>
          
          <input 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            placeholder="Name" 
            className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <select 
              value={formData.category} 
              onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"
            >
              <option>Jacken</option>
              <option>Pullover</option>
              <option>Sweatshirts</option>
              <option>Tops</option>
              <option>Sonstiges</option>
            </select>
            <input 
              value={formData.price} 
              onChange={e => setFormData({...formData, price: e.target.value})} 
              placeholder="Preis (z.B. 32)" 
              className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <input 
              value={formData.size} 
              onChange={e => setFormData({...formData, size: e.target.value})} 
              placeholder="Größe" 
              className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"
            />
            <select 
              value={formData.condition} 
              onChange={e => setFormData({...formData, condition: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"
            >
              <option>Neu</option>
              <option>Sehr gut</option>
              <option>Gut</option>
              <option>Zufriedenstellend</option>
            </select>
          </div>
          
          <input 
            value={formData.vinted_url} 
            onChange={e => setFormData({...formData, vinted_url: e.target.value})} 
            placeholder="Vinted URL" 
            className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"
          />
          
          {/* WICHTIG: onClick mit preventDefault */}
          <button 
            onClick={addProduct}
            disabled={isSaving || !formData.name || !formData.price}
            className="w-full py-4 bg-[#FF4400] text-white text-sm font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
// =================== ANALYTICS TAB ===================
function AnalyticsTab() {
  const [stats, setStats] = useState({ total: 0, sold: 0, active: 0, revenue: 0 });
  const [employeeStats, setEmployeeStats] = useState<Employee[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: products } = await supabase.from('products').select('*');
    if (products) {
      const sold = products.filter(p => p.sold).length;
      setStats({
        total: products.length,
        sold: sold,
        active: products.length - sold,
        revenue: products.filter(p => p.sold).reduce((acc, p) => acc + (parseFloat(p.price) || 0), 0)
      });
    }

    const { data: employees } = await supabase.from('employees').select('*').order('login_count', { ascending: false });
    if (employees) setEmployeeStats(employees);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#111] border border-[#FF4400]/20 p-6 text-center">
          <div className="text-4xl font-bold text-[#FF4400] mb-2">{stats.total}</div>
          <div className="text-xs uppercase text-gray-500">Gesamt Produkte</div>
        </div>
        <div className="bg-[#111] border border-green-500/20 p-6 text-center">
          <div className="text-4xl font-bold text-green-500 mb-2">{stats.active}</div>
          <div className="text-xs uppercase text-gray-500">Aktiv</div>
        </div>
        <div className="bg-[#111] border border-red-500/20 p-6 text-center">
          <div className="text-4xl font-bold text-red-500 mb-2">{stats.sold}</div>
          <div className="text-xs uppercase text-gray-500">Verkauft</div>
        </div>
        <div className="bg-[#111] border border-yellow-400/20 p-6 text-center">
          <div className="text-4xl font-bold text-yellow-400 mb-2">€{stats.revenue.toFixed(2)}</div>
          <div className="text-xs uppercase text-gray-500">Geschätzter Umsatz</div>
        </div>
      </div>

      <div className="bg-[#111] border border-[#FF4400]/20 p-6">
        <h3 className="text-lg font-bold text-[#FF4400] mb-4">Mitarbeiter Aktivität</h3>
        <table className="w-full text-sm">
          <thead className="border-b border-[#FF4400]/30">
            <tr>
              <th className="text-left py-2">Username</th>
              <th className="text-left py-2">Rolle</th>
              <th className="text-left py-2">Logins</th>
              <th className="text-left py-2">Arbeitsstunden</th>
              <th className="text-left py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {employeeStats.map(emp => (
              <tr key={emp.id} className="border-b border-[#FF4400]/10">
                <td className="py-3 font-bold">{emp.username}</td>
                <td className="py-3">{emp.role}</td>
                <td className="py-3">{emp.login_count}</td>
                <td className="py-3">{emp.total_work_hours}h</td>
                <td className="py-3">
                  <span className={emp.online ? 'text-green-500' : 'text-gray-500'}>
                    {emp.online ? '● Online' : '○ Offline'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =================== EMPLOYEES TAB ===================
function EmployeesTab({ currentUser }: { currentUser: Employee }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmployee, setNewEmployee] = useState({
    username: '', 
    password: '', 
    role: 'Mitarbeiter' as const,
    permissions: { 
      canAddProducts: false, 
      canEditProducts: false, 
      canDeleteProducts: false, 
      canViewStats: false, 
      canManageEmployees: false 
    }
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => { 
    loadEmployees(); 
  }, []);

  const loadEmployees = async () => {
    const { data, error } = await supabase.from('employees').select('*').order('id');
    if (!error && data) setEmployees(data);
  };

  // WICHTIG: async Funktion mit preventDefault
  const addEmployee = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!newEmployee.username || !newEmployee.password) {
      alert('Username und Passwort sind Pflicht!');
      return;
    }
    
    setIsAdding(true);
    
    try {
      console.log('Erstelle Mitarbeiter:', newEmployee); // Debug
      
      const { data, error } = await supabase.from('employees').insert({
        username: newEmployee.username,
        password: newEmployee.password,
        role: newEmployee.role,
        permissions: newEmployee.permissions,
        login_count: 0,
        total_work_hours: 0,
        online: false
      }).select();
      
      if (error) {
        console.error('Supabase Fehler:', error);
        alert('Fehler: ' + error.message);
      } else {
        console.log('Erstellt:', data);
        alert('Mitarbeiter erstellt!');
        
        // Formular zurücksetzen
        setNewEmployee({
          username: '', 
          password: '', 
          role: 'Mitarbeiter',
          permissions: { 
            canAddProducts: false, 
            canEditProducts: false, 
            canDeleteProducts: false, 
            canViewStats: false, 
            canManageEmployees: false 
          }
        });
        
        loadEmployees();
        await logActivity(currentUser.id, currentUser.username, 'Mitarbeiter erstellt', newEmployee.username);
      }
    } catch (err) {
      console.error('Fehler:', err);
      alert('Unerwarteter Fehler: ' + err);
    }
    
    setIsAdding(false);
  };

  // ... rest des Codes bleibt gleich, aber Button ändern:

  return (
    <div className="space-y-6">
      {/* Neuer Mitarbeiter */}
      <div className="bg-[#111] border border-yellow-400/30 p-6">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5"/> Neuer Mitarbeiter
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input 
            placeholder="Username" 
            value={newEmployee.username}
            onChange={e => setNewEmployee({...newEmployee, username: e.target.value})}
            className="bg-[#1A1A1A] border border-yellow-400/30 px-4 py-3 text-sm"
          />
          <input 
            placeholder="Passwort" 
            type="password"
            value={newEmployee.password}
            onChange={e => setNewEmployee({...newEmployee, password: e.target.value})}
            className="bg-[#1A1A1A] border border-yellow-400/30 px-4 py-3 text-sm"
          />
          <select 
            value={newEmployee.role}
            onChange={e => setNewEmployee({...newEmployee, role: e.target.value as any})}
            className="bg-[#1A1A1A] border border-yellow-400/30 px-4 py-3 text-sm"
          >
            <option>Mitarbeiter</option>
            <option>Manager</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
          {Object.entries(newEmployee.permissions).map(([key, value]) => (
            <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
              <input 
                type="checkbox" 
                checked={value}
                onChange={e => setNewEmployee({
                  ...newEmployee, 
                  permissions: {...newEmployee.permissions, [key]: e.target.checked}
                })}
                className="accent-yellow-400"
              />
              <span className="text-gray-400">
                {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </label>
          ))}
        </div>
        
        {/* WICHTIG: onClick mit preventDefault */}
        <button 
          onClick={addEmployee}
          disabled={isAdding || !newEmployee.username || !newEmployee.password}
          className="px-6 py-3 bg-yellow-400 text-black font-bold uppercase text-xs disabled:opacity-50"
        >
          {isAdding ? 'Hinzufügen...' : 'Hinzufügen'}
        </button>
      </div>

      {/* ... rest der Komponente */}
    </div>
  );
}
// =================== LOGS TAB ===================
function LogsTab() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);
    if (data) setLogs(data);
  };

  return (
    <div className="bg-[#111] border border-purple-500/30 p-6">
      <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5"/> Aktivitäts-Logs
      </h3>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {logs.map(log => (
          <div key={log.id} className="flex items-center gap-4 p-3 bg-[#1A1A1A] border-l-2 border-purple-500">
            <div className="text-xs text-gray-500 w-32">
              {new Date(log.timestamp).toLocaleString('de-DE')}
            </div>
            <div className="text-xs font-bold text-purple-400 w-32">
              {log.username}
            </div>
            <div className="text-sm flex-1">
              <span className="text-gray-300">{log.action}</span>
              {log.details && <span className="text-gray-500 ml-2">({log.details})</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =================== HILFSFUNKTIONEN ===================
async function logActivity(employeeId: number, username: string, action: string, details: string = '') {
  await supabase.from('activity_logs').insert({
    employee_id: employeeId,
    username,
    action,
    details,
    timestamp: new Date().toISOString()
  });
}
