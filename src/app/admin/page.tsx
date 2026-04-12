'use client';
import { useState, useEffect } from 'react';
import { 
  Trash2, ExternalLink, RefreshCw, ShoppingBag, Plus,
  Wand2, ImageIcon, Users, Package, BarChart3, Eye, EyeOff,
  Clock, LogOut, Edit3, UserPlus, Search, Key, Save, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// =================== INTERFACES ===================
interface Product {
  id: number; name: string; category: string; price: string;
  size: string; condition: string; images: string[]; vinted_url: string; sold: boolean;
}
interface Employee {
  id: number; username: string; password: string; role: 'Mitarbeiter' | 'Manager' | 'Admin';
  login_count: number; total_work_hours: number; online: boolean; last_login?: string;
  permissions: {
    canAddProducts: boolean; canEditProducts: boolean; canDeleteProducts: boolean;
    canViewStats: boolean; canManageEmployees: boolean;
  };
}

// =================== TOAST SYSTEM ===================
type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; message: string; type: ToastType; }

function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[], onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map(toast => (
        <div key={toast.id} className={`flex items-center gap-3 px-5 py-4 min-w-[280px] border font-mono text-sm uppercase tracking-wide shadow-lg
          ${toast.type === 'success' ? 'bg-[#0A0A0A] border-[#FF4400] text-[#F5F5F5]' : ''}
          ${toast.type === 'error'   ? 'bg-[#0A0A0A] border-red-500 text-red-400' : ''}
          ${toast.type === 'info'    ? 'bg-[#0A0A0A] border-gray-600 text-gray-300' : ''}
        `}>
          <div className={`w-1 h-8 shrink-0 ${toast.type === 'success' ? 'bg-[#FF4400]' : toast.type === 'error' ? 'bg-red-500' : 'bg-gray-500'}`}/>
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="text-gray-600 hover:text-white ml-2">×</button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));
  return { toasts, addToast, removeToast };
}

// =================== MAIN COMPONENT ===================
const ADMIN_PASSWORD = 'mastercontrol01010';

export default function ManagementPanel() {
  const [authed, setAuthed] = useState(false);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState('inventory');
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('scnd_auth');
    const savedUser = sessionStorage.getItem('scnd_user');
    if (savedAuth === 'admin') {
      setAuthed(true);
      setCurrentUser({ id: 0, username: 'Admin', role: 'Admin', password: '', login_count: 0, total_work_hours: 0, online: true,
        permissions: { canAddProducts: true, canEditProducts: true, canDeleteProducts: true, canViewStats: true, canManageEmployees: true }
      });
    } else if (savedAuth === 'employee' && savedUser) {
      setAuthed(true);
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('scnd_auth');
    sessionStorage.removeItem('scnd_user');
    setAuthed(false); setCurrentUser(null);
  };

  if (!authed) return <LoginScreen onLogin={(mode, user) => {
    setAuthed(true);
    setCurrentUser(user || { id: 0, username: 'Admin', role: 'Admin', password: '', login_count: 0, total_work_hours: 0, online: true,
      permissions: { canAddProducts: true, canEditProducts: true, canDeleteProducts: true, canViewStats: true, canManageEmployees: true }
    });
    sessionStorage.setItem('scnd_auth', mode);
    if (user) sessionStorage.setItem('scnd_user', JSON.stringify(user));
  }} />;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <header className="border-b border-[#FF4400]/30 px-6 py-4 sticky top-0 bg-[#0A0A0A]/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold tracking-tighter">
            <span className="text-[#FF4400]">SCND</span>_UNIT <span className="text-gray-500 text-lg">/ Management</span>
          </h1>
          
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 text-xs font-bold uppercase border transition-all ${activeTab==='inventory' ? 'bg-[#FF4400] border-[#FF4400]' : 'border-white/10 hover:border-[#FF4400]/50'}`}>
              <Package className="w-4 h-4 inline mr-2"/>Inventar
            </button>
            {currentUser?.permissions.canAddProducts && (
              <button onClick={() => setActiveTab('add')} className={`px-4 py-2 text-xs font-bold uppercase border transition-all ${activeTab==='add' ? 'bg-[#FF4400] border-[#FF4400]' : 'border-white/10 hover:border-[#FF4400]/50'}`}>
                <Plus className="w-4 h-4 inline mr-2"/>Add
              </button>
            )}
            {currentUser?.permissions.canManageEmployees && (
              <button onClick={() => setActiveTab('employees')} className={`px-4 py-2 text-xs font-bold uppercase border transition-all ${activeTab==='employees' ? 'bg-yellow-500 text-black border-yellow-500' : 'border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10'}`}>
                <Users className="w-4 h-4 inline mr-2"/>Team
              </button>
            )}
            <button onClick={handleLogout} className="px-4 py-2 border border-red-500/50 text-red-500 text-xs font-bold uppercase hover:bg-red-500/10">
              <LogOut className="w-4 h-4 inline mr-2"/>Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'inventory' && <InventoryTab user={currentUser} toast={addToast} />}
        {activeTab === 'add' && <AddTab toast={addToast} />}
        {activeTab === 'employees' && <EmployeesTab toast={addToast} />}
      </main>
    </div>
  );
}

// =================== LOGIN SCREEN ===================
function LoginScreen({ onLogin }: { onLogin: (mode: 'admin' | 'employee', user: Employee | null) => void }) {
  const [input, setInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const tryLogin = async () => {
    if (input === ADMIN_PASSWORD) return onLogin('admin', null);
    const { data } = await supabase.from('employees').select('*').eq('password', input).single();
    if (data) onLogin('employee', data);
    else alert('Zugriff verweigert');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-4">
      <div className="w-full max-w-sm border border-[#FF4400]/30 bg-[#111] p-8">
        <h2 className="text-2xl font-bold mb-6 text-center tracking-tighter">LOGIN</h2>
        <div className="relative mb-4">
          <input 
            type={showPassword ? 'text' : 'password'} 
            value={input} 
            onChange={e => setInput(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-white/10 p-4 text-white focus:border-[#FF4400] outline-none transition-all"
            placeholder="Passwort eingeben..."
            onKeyDown={e => e.key === 'Enter' && tryLogin()}
          />
          <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
          </button>
        </div>
        <button onClick={tryLogin} className="w-full bg-[#FF4400] py-4 font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 transition-all">Unlock</button>
      </div>
    </div>
  );
}

// =================== INVENTORY TAB ===================
function InventoryTab({ user, toast }: { user: Employee | null, toast: any }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('id', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleSold = async (p: Product) => {
    if (!user?.permissions.canEditProducts) return toast('Keine Rechte', 'error');
    const { error } = await supabase.from('products').update({ sold: !p.sold }).eq('id', p.id);
    if (!error) {
      setProducts(prev => prev.map(item => item.id === p.id ? { ...item, sold: !p.sold } : item));
      toast(p.sold ? 'Wieder verfügbar' : 'Verkauft markiert');
    }
  };

  const deleteProd = async (id: number) => {
    if (!user?.permissions.canDeleteProducts) return toast('Keine Rechte', 'error');
    if (!confirm('Löschen?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id));
      toast('Produkt entfernt', 'info');
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {loading ? <div className="col-span-full text-center py-20 opacity-50 font-mono">LOADING_DATABASE...</div> : 
        products.map(p => (
          <div key={p.id} className={`border border-white/10 bg-[#111] overflow-hidden group ${p.sold ? 'opacity-40' : ''}`}>
            <div className="aspect-[3/4] relative overflow-hidden bg-black">
              <img src={p.images[0]} alt="" className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" />
              {p.sold && <div className="absolute inset-0 flex items-center justify-center bg-black/60 font-bold text-red-500 border-2 border-red-500 m-4 rotate-12">SOLD</div>}
            </div>
            <div className="p-3">
              <h3 className="text-xs font-bold truncate uppercase">{p.name}</h3>
              <p className="text-[#FF4400] font-mono text-sm mt-1">€{p.price}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => toggleSold(p)} className="flex-1 bg-white/5 hover:bg-white/10 p-2 border border-white/10">
                  <ShoppingBag size={14} className="mx-auto" />
                </button>
                <button onClick={() => deleteProd(p.id)} className="flex-1 bg-red-500/5 hover:bg-red-500/20 p-2 border border-red-500/20 text-red-500">
                  <Trash2 size={14} className="mx-auto" />
                </button>
              </div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

// =================== ADD TAB (Simplified) ===================
function AddTab({ toast }: { toast: any }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScrape = async () => {
    setLoading(true);
    // Hier käme dein API Call zu /api/vinted
    toast('Scraper würde jetzt starten...', 'info');
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto border border-[#FF4400]/20 bg-[#111] p-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Wand2 className="text-[#FF4400]"/> NEUES PRODUKT IMPORTIEREN
      </h2>
      <div className="flex gap-2">
        <input 
          className="flex-1 bg-black border border-white/10 p-3 outline-none focus:border-[#FF4400]" 
          placeholder="Vinted URL einfügen..."
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <button 
          onClick={handleScrape}
          disabled={loading}
          className="bg-[#FF4400] px-6 font-bold uppercase text-sm disabled:opacity-50"
        >
          {loading ? '...' : 'Import'}
        </button>
      </div>
    </div>
  );
}

// =================== EMPLOYEES TAB (Fixed) ===================
function EmployeesTab({ toast }: { toast: any }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('employees').select('*');
    if (data) setEmployees(data);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tighter">TEAM_VERWALTUNG</h2>
        <button onClick={() => setShowAdd(true)} className="bg-yellow-500 text-black px-4 py-2 text-xs font-bold uppercase flex items-center gap-2">
          <UserPlus size={16}/> Mitarbeiter anlegen
        </button>
      </div>

      <div className="grid gap-2">
        {employees.map(emp => (
          <div key={emp.id} className="bg-[#111] border border-white/5 p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${emp.online ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`}></span>
                <span className="font-bold uppercase text-sm">{emp.username}</span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 text-gray-400">{emp.role}</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-1 font-mono uppercase">
                Logins: {emp.login_count} | Letzter Login: {emp.last_login ? new Date(emp.last_login).toLocaleString() : 'Nie'}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 border border-white/10 hover:bg-white/5 text-gray-400"><Key size={14}/></button>
              <button className="p-2 border border-red-500/20 hover:bg-red-500/10 text-red-500"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
