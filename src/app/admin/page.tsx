// src/app/admin/page.tsx 
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Trash2, ExternalLink, RefreshCw, ShoppingBag, Plus,
  Wand2, ImageIcon, Users, Package, BarChart3, Eye, EyeOff,
  Clock, LogOut, Edit3, UserPlus, Search, Key, Save, Download,
  Globe, AlertTriangle, CheckCircle, XCircle, Upload
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AutoCleanTool } from '@/components/AutoCleanTool';
// =================== INTERFACES ===================
interface Product {
  id: number
  name: string
  brand: string      // ⭐ NEU: Marke hinzufügen
  category: string
  price: string
  size: string
  condition: string
  images: string[]
  vinted_url: string
  sold: boolean
}
interface Employee {
  id: number; username: string; password: string; role: 'Mitarbeiter' | 'Manager' | 'Admin';
  login_count: number; total_work_hours: number; online: boolean; last_login?: string;
  permissions: {
    canAddProducts: boolean; canEditProducts: boolean; canDeleteProducts: boolean;
    canViewStats: boolean; canManageEmployees: boolean;
  };
}
interface ActivityLog {
  id: number; employee_id: number; username: string; action: string; details: string; timestamp: string;
}

// =================== TOAST SYSTEM ===================
type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; message: string; type: ToastType; }

function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[], onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map(toast => (
        <div key={toast.id} className={`flex items-center gap-3 px-5 py-4 min-w-[280px] max-w-[400px] border font-mono text-sm uppercase tracking-wide shadow-lg
          ${toast.type === 'success' ? 'bg-[#0A0A0A] border-[#FF4400] text-[#F5F5F5]' : ''}
          ${toast.type === 'error'   ? 'bg-[#0A0A0A] border-red-500 text-red-400' : ''}
          ${toast.type === 'info'    ? 'bg-[#0A0A0A] border-gray-600 text-gray-300' : ''}
        `}>
          <div className={`w-1 h-8 shrink-0 
            ${toast.type === 'success' ? 'bg-[#FF4400]' : ''}
            ${toast.type === 'error'   ? 'bg-red-500' : ''}
            ${toast.type === 'info'    ? 'bg-gray-500' : ''}
          `}/>
          <span className="text-base shrink-0">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error'   && '✗'}
            {toast.type === 'info'    && '·'}
          </span>
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="text-gray-600 hover:text-white ml-2 shrink-0">×</button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));
  return { toasts, addToast, removeToast };
}

// =================== CONFIRM DIALOG ===================
interface ConfirmOptions { message: string; onConfirm: () => void; }

function ConfirmDialog({ options, onClose }: { options: ConfirmOptions, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0A0A0A] border border-[#FF4400]/50 p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-1 h-12 bg-[#FF4400] shrink-0 mt-0.5"/>
          <p className="text-sm uppercase tracking-wide text-[#F5F5F5] font-mono leading-relaxed">{options.message}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { options.onConfirm(); onClose(); }}
            className="flex-1 py-3 bg-[#FF4400] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#FF4400]/80">
            Bestätigen
          </button>
          <button type="button" onClick={onClose}
            className="flex-1 py-3 border border-gray-600 text-gray-400 text-xs font-bold uppercase tracking-widest hover:border-gray-400">
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

function useConfirm() {
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const showConfirm = (message: string, onConfirm: () => void) => setConfirmOptions({ message, onConfirm });
  const closeConfirm = () => setConfirmOptions(null);
  return { confirmOptions, showConfirm, closeConfirm };
}

// =================== ACTIVITY LOGGER ===================
async function logActivity(employeeId: number, username: string, action: string, details: string = '') {
  const { error } = await supabase.from('activity_logs').insert({
    employee_id: employeeId || null,
    username,
    action,
    details,
    timestamp: new Date().toISOString()
  });
  if (error) console.error('Log Fehler:', error);
}

// =================== KONSTANTEN ===================

// =================== RESULT DISPLAY KOMPONENTE ===================
function ResultDisplay({ result }: { result: any }) {
  return (
    <div className="border border-[#FF4400]/20 bg-[#0A0A0A] p-4 space-y-4 mt-2 rounded">
      {result.message && <p className="text-sm text-gray-300 font-medium">{result.message}</p>}
      {result.summary && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <div className="border border-gray-700 p-2 text-center">
            <div className="text-xl font-bold text-blue-400">{result.summary.total || 0}</div>
            <div className="text-xs text-gray-500 uppercase">Geprüft</div>
          </div>
          <div className="border border-green-500/30 p-2 text-center">
            <div className="text-xl font-bold text-green-400">{result.summary.imported || 0}</div>
            <div className="text-xs text-gray-500 uppercase">Importiert</div>
          </div>
          <div className="border border-yellow-500/30 p-2 text-center">
            <div className="text-xl font-bold text-yellow-400">{result.summary.duplicates || 0}</div>
            <div className="text-xs text-gray-500 uppercase">Duplikate</div>
          </div>
          <div className="border border-orange-500/30 p-2 text-center">
            <div className="text-xl font-bold text-orange-400">{result.summary.invalid || 0}</div>
            <div className="text-xs text-gray-500 uppercase">Ungültig</div>
          </div>
          <div className="border border-red-500/30 p-2 text-center">
            <div className="text-xl font-bold text-red-400">{result.summary.failed || 0}</div>
            <div className="text-xs text-gray-500 uppercase">Fehler</div>
          </div>
        </div>
      )}
      {result.soldItems?.length > 0 && (
        <div>
          <h4 className="text-xs uppercase font-bold text-red-400 mb-2">Verkaufte Items ({result.soldItems.length})</h4>
          <div className="bg-red-950/20 border border-red-500/20 p-3 max-h-48 overflow-y-auto space-y-2">
            {result.soldItems.map((item: any, i: number) => (
              <div key={i} className="text-xs border-b border-red-500/10 pb-1">
                <p className="text-gray-300 font-medium">{item.name || 'Unbekannt'}</p>
                <a href={item.url} target="_blank" className="text-gray-600 hover:text-[#FF4400] truncate block">{item.url}</a>
              </div>
            ))}
          </div>
        </div>
      )}
      <details>
        <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-400 uppercase">Rohdaten</summary>
        <pre className="mt-2 bg-black p-3 text-xs text-gray-500 overflow-x-auto max-h-48">{JSON.stringify(result, null, 2)}</pre>
      </details>
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
    setLoading(true); setError('');
    
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: input })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        if (data.mode === 'admin') {
          sessionStorage.setItem('scnd_auth', 'admin');
          onLogin('admin', null);
        } else if (data.mode === 'employee' && data.user) {
          sessionStorage.setItem('scnd_auth', 'employee');
          sessionStorage.setItem('scnd_user', JSON.stringify(data.user));
          onLogin('employee', data.user);
        }
      } else {
        setError('Ungültiges Passwort');
        setInput('');
        setTimeout(() => setError(''), 2000);
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
      <div className="w-full max-w-md p-8 border border-[#FF4400]/30 bg-[#111]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tighter mb-2"><span className="text-[#FF4400]">SCND</span>_UNIT</h1>
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
          {error && <div className="bg-red-500/10 border border-red-500/30 p-3 text-red-400 text-sm text-center">{error}</div>}
          <button 
            onClick={tryLogin} 
            disabled={loading} 
            className="w-full py-4 bg-[#FF4400] text-white font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 disabled:opacity-50"
          >
            {loading ? '...' : 'Einloggen'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =================== VINTED TOOLS TAB ===================
function VintedToolsTab({ user, toast, confirm }: {
  user: Employee | null,
  toast: (msg: string, type?: ToastType) => void,
  confirm: (msg: string, onConfirm: () => void) => void
}) {
const [activeSubTab, setActiveSubTab] = useState<'import' | 'status' | 'clean'>('import');
const [autoRemove, setAutoRemove] = useState(false);
const [uploadedFile, setUploadedFile] = useState<File | null>(null);
const [importLoading, setImportLoading] = useState(false);
const [importResult, setImportResult] = useState<any>(null);
const [singleUrl, setSingleUrl] = useState('');
const [statusLoading, setStatusLoading] = useState(false);
const [statusProgress, setStatusProgress] = useState({ current: 0, total: 0 });
const [statusResult, setStatusResult] = useState<any>(null);
const [singleResult, setSingleResult] = useState<any>(null);
const fileInputRef = useRef<HTMLInputElement>(null);

  // ⭐⭐⭐ JSON IMPORT - Datei-Upload Handler ⭐⭐⭐
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setImportResult(null);
  };

  // ⭐⭐⭐ JSON IMPORT (ersetzt den Bulk Import) ⭐⭐⭐
  const processImport = async () => {
    if (!uploadedFile) { toast('Bitte Datei auswählen', 'error'); return; }
    setImportLoading(true);
    setImportResult(null);
    try {
      const text = await uploadedFile.text();
      let items = JSON.parse(text);
      if (!Array.isArray(items)) {
        if (items.items && Array.isArray(items.items)) { items = items.items; }
        else if (items.data && Array.isArray(items.data)) { items = items.data; }
        else { throw new Error('Ungültiges JSON-Format'); }
      }

      // 🔍 Filtere ungültige Einträge heraus
      // 🔍 Filtere ungültige Einträge heraus
      const validItems = items.filter(item => {
        // Prüfe ob die ID gültig ist
        const id = item?.id ? String(item.id) : '';
        
        // Überspringe den "Get Unlimited" Eintrag
        if (id === 'Get Unlimited to see more than 10 rows.') return false;
        
        // Prüfe ob die ID #-Zeichen enthält (nur wenn id ein String ist)
        if (id && typeof id === 'string' && id.includes('#')) return false;
        
        // Prüfe ob der Titel gültig ist
        const title = item['Item Title'] || item.title || '';
        if (!title || typeof title !== 'string') return false;
        if (title.includes('#') || title.length < 5) return false;
        
        // Prüfe ob die URL gültig ist
        const url = item['Item URL'] || item.url || '';
        if (!url || typeof url !== 'string') return false;
        if (!url.includes('vinted.de/items/')) return false;
        
        // Prüfe ob der Preis gültig ist
        const price = item['Item Price'] || item.price || '';
        if (!price || price === '####') return false;
        
        return true;
      });
      const invalidCount = items.length - validItems.length;
      if (invalidCount > 0) {
        toast(`${invalidCount} ungültige Einträge wurden übersprungen`, 'info');
      }

      toast(`${validItems.length} gültige Artikel in JSON gefunden`, 'info');

      // 🔍 Hole alle existierenden URLs aus der Datenbank
      const { data: existingProducts } = await supabase
        .from('products')
        .select('vinted_url');

      const existingUrls = new Set(existingProducts?.map(p => p.vinted_url) || []);

      let success = 0;
      let failed = 0;
      let duplicates = 0;

      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        const title = item['Item Title'] || item.title || item.name;
        const url = item['Item URL'] || item.url || item.link || '';
        
        // Extrahiere Marke aus Titel
        let brand = item['Item Brand'] || '';
        if (!brand && title) {
          const brandMatch = title.match(/^(Nike|Adidas|Puma|Champion|Tommy Hilfiger|Lacoste|Helly Hansen|The North Face|Columbia|Lee|Wrangler|Fila|Napapijri|Starter|New Balance|Timberland|Reebok|Bernd Berger|La Martina|Bexleys|U\.S\. Polo Assn)/i);
          if (brandMatch) {
            brand = brandMatch[1];
          } else {
            brand = 'Sonstige';
          }
        }

        if (existingUrls.has(url)) {
          duplicates++;
        } else {
          const priceRaw = item['Item Price'] || item.price || item.amount;
          let priceNumber = String(priceRaw).replace(/[^0-9,.-]/g, '').replace(',', '.');
          let priceValue = parseFloat(priceNumber);
          const price = isNaN(priceValue) ? '0€' : `${Math.round(priceValue)}€`;
          
          const size = item['Item Size'] || item.size || '–';
          const condition = item['Item Status'] || item.condition || 'Gut';

          // Kategorie aus Titel ableiten
          let category = 'Sonstiges';
          const titleLower = title.toLowerCase();
          if (titleLower.includes('jacke') || titleLower.includes('jacket') || titleLower.includes('weste')) category = 'Jacken';
          else if (titleLower.includes('pullover') || titleLower.includes('sweater') || titleLower.includes('fleece')) category = 'Pullover';
          else if (titleLower.includes('sweatshirt') || titleLower.includes('crewneck') || titleLower.includes('hoodie')) category = 'Sweatshirts';
          else if (titleLower.includes('top') || titleLower.includes('shirt') || titleLower.includes('polo')) category = 'Tops';

          // Fotos sammeln
          let photoUrls = [];
          const allPhotos = item['All Photos'] || '';
          if (allPhotos && allPhotos.includes(' || ')) {
            photoUrls = allPhotos.split(' || ').filter(p => p.startsWith('http'));
          } else if (item.photos && Array.isArray(item.photos)) {
            photoUrls = item.photos;
          }

          const newProduct = {
            name: title.substring(0, 100),
            brand: brand || 'Sonstige',
            category: category,
            price: price,
            size: size || '–',
            condition: condition,
            images: photoUrls,
            vinted_url: url,
            sold: false
          };

          const { error } = await supabase.from('products').insert(newProduct);
          if (error) {
            failed++;
            console.error('Insert Fehler:', error);
          } else {
            success++;
            existingUrls.add(url);
          }
        }

        setImportResult((prev: any) => ({
          ...prev,
          current: i + 1,
          total: validItems.length,
          success,
          failed,
          duplicates
        }));

        await new Promise(r => setTimeout(r, 50));
      }

      const finalResult = {
        summary: {
          total: validItems.length,
          imported: success,
          duplicates: duplicates,
          failed: failed,
          invalid: invalidCount
        },
        message: `✅ Fertig: ${success} importiert, ${duplicates} Duplikate, ${invalidCount} ungültige übersprungen, ${failed} Fehler`
      };
      setImportResult(finalResult);
      toast(finalResult.message, 'success');

      if (success > 0) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Import Fehler:', error);
      toast('Fehler: ' + error.message, 'error');
      setImportResult({
        message: 'Fehler: ' + error.message,
        summary: { total: 0, imported: 0, duplicates: 0, failed: 1, invalid: 0 }
      });
    } finally {
      setImportLoading(false);
    }
  };

  // ⭐⭐⭐ SINGLE ITEM CHECK ⭐⭐⭐
  const checkSingleItem = async () => {
    if (!singleUrl) { toast('Bitte URL eingeben', 'error'); return; }
    setStatusLoading(true);
    setSingleResult(null);
    try {
      const res = await fetch('/api/vinted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'single', url: singleUrl, autoRemove }),
      });
      const data = await res.json();
      setSingleResult(data);
      if (data.status === 'sold') {
        toast('⚠️ Item ist VERKAUFT!', 'error');
        if (autoRemove) {
          const { data: products } = await supabase.from('products').select('*').ilike('vinted_url', `%${singleUrl}%`);
          if (products && products.length > 0) {
            await supabase.from('products').update({ sold: true }).eq('id', products[0].id);
            toast('Produkt als verkauft markiert', 'success');
          }
        }
      } else if (data.status === 'reserved') {
        toast('ℹ️ Item ist reserviert', 'info');
      } else {
        toast('✅ Item ist verfügbar', 'success');
      }
    } catch (e) {
      toast('Fehler: ' + String(e), 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  // ⭐⭐⭐ ALLE PRODUKTE PRÜFEN ⭐⭐⭐
  const checkAllStatus = async () => {
    setStatusLoading(true);
    setStatusResult(null);
    try {
      const { data: products, error } = await supabase.from('products').select('*').eq('sold', false);
      if (error || !products || products.length === 0) { toast('Keine aktiven Produkte', 'info'); setStatusLoading(false); return; }

      setStatusProgress({ current: 0, total: products.length });
      toast(`Prüfe ${products.length} Produkte…`, 'info');

      const soldItems: any[] = [];
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        try {
          const res = await fetch('/api/vinted', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'single', url: product.vinted_url }),
          });
          const data = await res.json();
          if (data.status === 'sold') {
            soldItems.push(product);
            if (autoRemove) await supabase.from('products').update({ sold: true }).eq('id', product.id);
          }
        } catch (err) {}
        setStatusProgress(prev => ({ ...prev, current: i + 1 }));
        await new Promise(r => setTimeout(r, 500));
      }

      const result = {
        summary: { total: products.length, available: products.length - soldItems.length, sold: soldItems.length, reserved: 0, errors: 0 },
        soldItems: soldItems.map(s => ({ id: s.id, name: s.name, url: s.vinted_url })),
        message: `✅ ${products.length} geprüft – ${soldItems.length} verkauft`,
      };
      setStatusResult(result);
      toast(result.message, 'success');
    } catch (e) {
      toast('Fehler: ' + String(e), 'error');
    } finally {
      setStatusLoading(false);
      setStatusProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-[#FF4400]/30 pb-4">
        <button onClick={() => setActiveSubTab('import')} className={`px-4 py-2 text-xs uppercase font-bold ${activeSubTab === 'import' ? 'bg-green-600 text-white' : 'border border-green-600/30 text-green-500'}`}>
          <Upload className="w-4 h-4 inline mr-1"/>JSON Import
        </button>
        <button onClick={() => setActiveSubTab('status')} className={`px-4 py-2 text-xs uppercase font-bold ${activeSubTab === 'status' ? 'bg-blue-600 text-white' : 'border border-blue-600/30 text-blue-500'}`}>
          <RefreshCw className="w-4 h-4 inline mr-1"/>Status Check
        </button>
        <button onClick={() => setActiveSubTab('clean')} className={`px-4 py-2 text-xs uppercase font-bold ${activeSubTab === 'clean' ? 'bg-red-600 text-white' : 'border border-red-600/30 text-red-500'}`}>
          <AlertTriangle className="w-4 h-4 inline mr-1"/>Auto Clean
        </button>
      </div>
      <div className="bg-[#111] border border-red-500/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500"/>
          <div><p className="text-sm font-bold text-red-400">Auto-Remove Modus</p><p className="text-xs text-gray-500">Verkaufte Items automatisch als verkauft markieren</p></div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={autoRemove} onChange={e => setAutoRemove(e.target.checked)} className="sr-only peer"/>
          <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"/>
        </label>
      </div>

      {activeSubTab === 'import' && (
        <div className="bg-[#111] border border-green-500/30 p-6 space-y-4">
          <h3 className="text-lg font-bold text-green-400 flex items-center gap-2"><Upload className="w-5 h-5"/>JSON Import (Vinted Extension)</h3>
          
          <div className="border border-dashed border-green-500/50 p-6 text-center">
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json" 
              onChange={handleFileUpload}
              className="hidden"
            />
            {!uploadedFile ? (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm">Exportiere die JSON-Datei mit der Chrome Extension</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-green-600 text-white text-sm font-bold uppercase"
                >
                  📁 JSON-Datei auswählen
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <CheckCircle className="w-6 h-6"/>
                  <span className="font-mono text-sm">{uploadedFile.name}</span>
                  <button onClick={() => { setUploadedFile(null); setImportResult(null); }} className="text-gray-500 hover:text-red-400">×</button>
                </div>
                <button 
                  onClick={processImport} 
                  disabled={importLoading}
                  className="px-6 py-3 bg-[#FF4400] text-white text-sm font-bold uppercase disabled:opacity-50"
                >
                  {importLoading ? '⏳ Importiere...' : '📥 In Datenbank importieren'}
                </button>
              </div>
            )}
          </div>

          {/* Fortschrittsanzeige */}
          {importLoading && importResult && importResult.current !== undefined && (
            <div className="space-y-2">
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${(importResult.current / importResult.total) * 100}%` }}/>
              </div>
              <p className="text-xs text-gray-600 text-center">
                {importResult.current} / {importResult.total} · 
                ✅ {importResult.success || 0} · 
                ⏭️ {importResult.skipped || 0} · 
                ❌ {importResult.failed || 0}
              </p>
            </div>
          )}

          {importResult && importResult.summary && (
            <ResultDisplay result={importResult} />
          )}

          <div className="mt-4 p-3 bg-green-950/20 border border-green-500/20 text-xs text-gray-400">
            <p className="font-bold text-green-400 mb-2">📋 Anleitung:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Installiere die <span className="text-green-400">"Vinted Scraper - One-Click Data Export"</span> Extension in Chrome</li>
              <li>Gehe zu <span className="text-green-400">https://www.vinted.de/member/3138250645-scndunit</span></li>
              <li>Klicke auf das Extension-Icon → <span className="text-green-400">"Export" → Format: JSON</span></li>
              <li>Lade die heruntergeladene JSON-Datei hier hoch</li>
              <li>Klicke auf <span className="text-green-400">"In Datenbank importieren"</span></li>
            </ol>
          </div>
        </div>
      )}

      {activeSubTab === 'status' && (
        <div className="space-y-4">
          <div className="bg-[#111] border border-blue-500/30 p-6 space-y-3">
            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2"><Search className="w-5 h-5"/>Einzelnes Item prüfen</h3>
            <div className="flex gap-2">
              <input type="text" placeholder="https://www.vinted.de/items/..." value={singleUrl} onChange={e => setSingleUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkSingleItem()} className="flex-1 bg-[#1A1A1A] border border-blue-500/30 px-4 py-3 text-sm"/>
              <button onClick={checkSingleItem} disabled={statusLoading} className="px-5 py-3 bg-blue-600 text-white text-xs font-bold uppercase">{statusLoading ? '…' : '🔍 Check'}</button>
            </div>
            {singleResult && (
              <div className={`p-4 border text-sm rounded ${singleResult.status === 'available' ? 'border-green-500/50 bg-green-950/20' : singleResult.status === 'sold' ? 'border-red-500/50 bg-red-950/20' : 'border-yellow-500/50 bg-yellow-950/20'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${singleResult.status === 'available' ? 'bg-green-500 text-white' : singleResult.status === 'sold' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}`}>{singleResult.status}</span>
                  {singleResult.name && <span className="font-bold truncate">{singleResult.name}</span>}
                </div>
                {singleResult.price && <p className="text-xs text-gray-400">{singleResult.price} · {singleResult.size}</p>}
              </div>
            )}
          </div>
          <div className="bg-[#111] border border-blue-500/30 p-6 space-y-3">
            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2"><RefreshCw className="w-5 h-5"/>Alle Produkte prüfen</h3>
            <button onClick={checkAllStatus} disabled={statusLoading} className="w-full py-4 bg-blue-600 text-white text-sm font-bold uppercase flex items-center justify-center gap-2">
              <RefreshCw className={`w-5 h-5 ${statusLoading && statusProgress.total ? 'animate-spin' : ''}`}/>
              {statusLoading && statusProgress.total ? `Prüfe… ${statusProgress.current}/${statusProgress.total}` : '🔄 Alle Produkte checken'}
            </button>
            {statusLoading && statusProgress.total > 0 && (<div className="w-full bg-gray-800 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${(statusProgress.current / statusProgress.total) * 100}%` }}/></div>)}
            {statusResult && <ResultDisplay result={statusResult} />}
          </div>
        </div>
      )}
         {activeSubTab === 'clean' && (
        <AutoCleanTool toast={toast} confirm={confirm} />
      )}
 </div>
  );
}

// =================== INVENTORY TAB ===================
function InventoryTab({ user, toast, confirm }: { user: Employee | null, toast: (msg: string, type?: ToastType) => void, confirm: (msg: string, onConfirm: () => void) => void }) {
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

  useEffect(() => { loadProducts(); const channel = supabase.channel('products-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => loadProducts()).subscribe(); return () => { supabase.removeChannel(channel); }; }, [loadProducts]);

  // Marken sortieren, "Alle" immer an erster Stelle
  const brandList = Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'de'));
  const allBrands = ["Alle", ...brandList];
  
  // Feste Kategorien
  const fixedCategories = ['Jacken', 'Pullover', 'Sweatshirts', 'Tops', 'Sonstiges'];
  const allCategories = ["Alle", ...fixedCategories];

  // Gefilterte Produkte
  const filtered = products.filter(p => {
    if (activeBrand !== "Alle" && p.brand !== activeBrand) return false;
    if (activeCategory !== "Alle" && p.category !== activeCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.price.includes(search)) return false;
    return true;
  });

  if (editingProduct) return (
    <div className="max-w-2xl mx-auto bg-[#111] border border-[#FF4400]/30 p-6">
      <h3 className="text-lg font-bold text-[#FF4400] mb-4">Produkt bearbeiten</h3>
      <div className="space-y-4">
        <input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3" placeholder="Name"/>
        <div className="grid grid-cols-2 gap-4"><input value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3" placeholder="Preis"/><input value={editingProduct.size} onChange={e => setEditingProduct({...editingProduct, size: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3" placeholder="Größe"/></div>
        <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3"><option>Jacken</option><option>Pullover</option><option>Sweatshirts</option><option>Tops</option><option>Sonstiges</option></select>
        <input value={editingProduct.vinted_url} onChange={e => setEditingProduct({...editingProduct, vinted_url: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3" placeholder="Vinted URL"/>
        <div className="flex gap-2"><button onClick={() => { if (user?.permissions.canEditProducts) { supabase.from('products').update(editingProduct).eq('id', editingProduct.id).then(() => { setEditingProduct(null); toast('Produkt gespeichert'); loadProducts(); }); } else { toast('Keine Berechtigung!', 'error'); } }} className="flex-1 py-3 bg-[#FF4400] text-white font-bold uppercase"><Save className="w-4 h-4 inline mr-2"/>Speichern</button><button onClick={() => setEditingProduct(null)} className="flex-1 py-3 border border-gray-600 text-gray-400 uppercase">Abbrechen</button></div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Verbesserte Filter mit horizontalem Scroll */}
      <div className="mb-6 space-y-6">
        {/* Marken Filter mit horizontalem Scroll */}
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
        
        {/* Kategorien Filter mit horizontalem Scroll */}
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
      
      {/* Suchleiste und Refresh Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
            <input type="text" placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-4 py-2 bg-[#1A1A1A] border border-[#FF4400]/30 text-sm w-64"/>
          </div>
          <button onClick={loadProducts} className="p-2 border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10">
            <RefreshCw className="w-4 h-4"/>
          </button>
        </div>
        <div className="text-xs text-gray-500">
          {filtered.length} von {products.length} Artikeln
        </div>
      </div>
      
      {/* Produkt Grid */}
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
                <img src={p.images?.[0] ? (p.images[0].startsWith('/api/') ? p.images[0] : `/api/image-proxy?url=${encodeURIComponent(p.images[0])}`) : ''} alt={p.name} className="w-full h-full object-cover"/>
                {p.images?.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 text-xs font-bold flex items-center gap-1">
                    <ImageIcon className="w-3 h-3"/> {p.images.length}
                  </div>
                )}
              </div>
              <div className="p-2 bg-[#0A0A0A]">
                <p className="text-xs font-bold truncate">{p.name}</p>
                <p className="text-xs text-[#FF4400] mt-0.5">{p.price} · {p.size}</p>
                <div className="flex gap-1 mt-2">
                  {user?.permissions.canEditProducts && (
                    <button onClick={() => setEditingProduct(p)} className="px-2 py-1 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                      <Edit3 className="w-3 h-3"/>
                    </button>
                  )}
                  {user?.permissions.canEditProducts && (
                    <button onClick={() => { if (user?.permissions.canEditProducts) { supabase.from('products').update({ sold: !p.sold }).eq('id', p.id).then(() => { toast(p.sold ? 'Produkt reaktiviert' : 'Produkt als verkauft markiert', 'info'); loadProducts(); }); } else { toast('Keine Berechtigung!', 'error'); } }} 
                      className={`flex-1 py-1 text-xs font-bold uppercase flex items-center justify-center gap-1 ${p.sold ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                      <ShoppingBag className="w-3 h-3"/>{p.sold ? 'Reaktiv.' : 'Verkauft'}
                    </button>
                  )}
                  <a href={p.vinted_url} target="_blank" className="px-2 py-1 border border-[#FF4400]/30 text-[#FF4400]">
                    <ExternalLink className="w-3 h-3"/>
                  </a>
                  {user?.permissions.canDeleteProducts && (
                    <button onClick={() => { if (user?.permissions.canDeleteProducts) { confirm('Produkt wirklich löschen?', () => { supabase.from('products').delete().eq('id', p.id).then(() => { toast('Produkt gelöscht', 'info'); loadProducts(); }); }); } else { toast('Keine Berechtigung!', 'error'); } }} 
                      className="px-2 py-1 border border-red-500/30 text-red-400">
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
function AddTab({ user, toast, onProductAdded }: { user: Employee | null, toast: (msg: string, type?: ToastType) => void, onProductAdded: () => void }) {
  const [url, setUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: 'Jacken', price: '', size: '', condition: 'Gut', vinted_url: '', images: [] as string[] });

  const scrapeVinted = async () => {
    if (!url.includes('vinted')) { toast('Bitte gültige Vinted URL', 'error'); return; }
    setIsScraping(true);
    try {
      const res = await fetch('/api/vinted', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'single', url }) });
      const data = await res.json();
      if (res.ok && data) { setFormData({ name: data.name || '', category: data.category || 'Jacken', price: (data.price || '').replace(/^€/, ''), size: data.size || '', condition: data.condition || 'Gut', vinted_url: url, images: data.images || [] }); toast('Daten geladen'); }
      else { toast('Keine Daten gefunden', 'error'); }
    } catch (e) { toast('Scraping Fehler', 'error'); }
    setIsScraping(false);
  };

  const handleSave = () => {
    if (!formData.name) { toast('Name fehlt!', 'error'); return; }
    if (!formData.price) { toast('Preis fehlt!', 'error'); return; }
    if (formData.images.length === 0) { toast('Mindestens 1 Bild!', 'error'); return; }
    const newProduct = { name: formData.name, category: formData.category, price: `${formData.price.replace(/€/g, '').trim()} €`, size: formData.size || '–', condition: formData.condition, images: formData.images, vinted_url: formData.vinted_url, sold: false };
    supabase.from('products').insert(newProduct).then(({ error }) => { if (error) { toast('Fehler: ' + error.message, 'error'); } else { toast('Produkt gespeichert!'); logActivity(user?.id || 0, user?.username || 'Admin', 'Produkt hinzugefügt', `"${newProduct.name}"`); setFormData({ name: '', category: 'Jacken', price: '', size: '', condition: 'Gut', vinted_url: '', images: [] }); setUrl(''); onProductAdded(); } });
  };

  return (<div className="max-w-4xl mx-auto space-y-6"><div className="bg-[#111] border border-[#FF4400]/20 p-4"><label className="text-xs uppercase text-[#FF4400] block mb-2">Vinted URL</label><div className="flex gap-2"><input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.vinted.de/items/..." className="flex-1 bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"/><button onClick={scrapeVinted} disabled={isScraping} className="px-6 py-3 bg-[#FF4400] text-white text-xs font-bold uppercase">{isScraping ? '...' : 'Auto-Fill'}</button></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-[#111] border border-[#FF4400]/20 p-4"><label className="text-xs uppercase text-[#FF4400] block mb-2">Bilder ({formData.images.length})</label>{formData.images.length > 0 ? (<div className="grid grid-cols-4 gap-2">{formData.images.map((img, i) => (<div key={i} className="relative aspect-square"><img src={img.startsWith('/api/') ? img : `/api/image-proxy?url=${encodeURIComponent(img)}`} className="w-full h-full object-cover"/><button onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, idx) => idx !== i)}))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs">×</button></div>))}</div>) : <div className="aspect-[3/4] bg-[#1A1A1A] flex items-center justify-center text-gray-600">Keine Bilder</div>}</div><div className="bg-[#111] border border-[#FF4400]/20 p-4 space-y-4"><label className="text-xs uppercase text-[#FF4400] block">Produktdaten</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Name" className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"/><div className="grid grid-cols-2 gap-4"><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"><option>Jacken</option><option>Pullover</option><option>Sweatshirts</option><option>Tops</option><option>Sonstiges</option></select><input value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Preis" className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"/></div><div className="grid grid-cols-2 gap-4"><input value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} placeholder="Größe" className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"/><select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"><option>Neu</option><option>Sehr gut</option><option>Gut</option><option>Zufriedenstellend</option></select></div><input value={formData.vinted_url} onChange={e => setFormData({...formData, vinted_url: e.target.value})} placeholder="Vinted URL" className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"/><button onClick={handleSave} className="w-full py-4 bg-[#FF4400] text-white text-sm font-bold uppercase">Speichern</button></div></div></div>);
}

// =================== ANALYTICS TAB ===================
function AnalyticsTab() {
  const [stats, setStats] = useState({ total: 0, sold: 0, active: 0, revenue: 0 });
  const [employeeStats, setEmployeeStats] = useState<Employee[]>([]);
  useEffect(() => { const loadStats = async () => { const { data: products } = await supabase.from('products').select('*'); if (products) { const sold = products.filter(p => p.sold).length; setStats({ total: products.length, sold, active: products.length - sold, revenue: products.filter(p => p.sold).reduce((acc, p) => acc + (parseFloat(p.price) || 0), 0) }); } const { data: employees } = await supabase.from('employees').select('*').order('login_count', { ascending: false }); if (employees) setEmployeeStats(employees); }; loadStats(); }, []);
  return (<div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-4 gap-6">{[{ label: 'Gesamt', value: stats.total, color: 'text-[#FF4400]' }, { label: 'Aktiv', value: stats.active, color: 'text-green-500' }, { label: 'Verkauft', value: stats.sold, color: 'text-red-500' }, { label: 'Umsatz', value: `€${stats.revenue.toFixed(2)}`, color: 'text-yellow-400' }].map(s => (<div key={s.label} className="bg-[#111] border border-[#FF4400]/20 p-6 text-center"><div className={`text-4xl font-bold ${s.color} mb-2`}>{s.value}</div><div className="text-xs uppercase text-gray-500">{s.label}</div></div>))}</div><div className="bg-[#111] border border-[#FF4400]/20 p-6"><h3 className="text-lg font-bold text-[#FF4400] mb-4">Mitarbeiter Aktivität</h3><table className="w-full text-sm"><thead className="border-b border-[#FF4400]/30"><tr><th className="text-left py-2 px-2">Username</th><th className="text-left py-2 px-2">Rolle</th><th className="text-left py-2 px-2">Logins</th><th className="text-left py-2 px-2">Letzter Login</th><th className="text-left py-2 px-2">Status</th></tr></thead><tbody>{employeeStats.map(emp => (<tr key={emp.id} className="border-b border-[#FF4400]/10"><td className="py-3 px-2 font-bold">{emp.username}</td><td className="py-3 px-2">{emp.role}</td><td className="py-3 px-2">{emp.login_count}×</td><td className="py-3 px-2 text-gray-500 text-xs">{emp.last_login ? new Date(emp.last_login).toLocaleString('de-DE') : 'Nie'}</td><td className="py-3 px-2"><span className={emp.online ? 'text-green-500' : 'text-gray-500'}>{emp.online ? '● Online' : '○ Offline'}</span></td></tr>))}</tbody></table></div></div>);
}

// =================== EMPLOYEES TAB ===================
function EmployeesTab({ currentUser, toast, confirm }: { currentUser: Employee, toast: (msg: string, type?: ToastType) => void, confirm: (msg: string, onConfirm: () => void) => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newEmployee, setNewEmployee] = useState({ username: '', password: '', role: 'Mitarbeiter' as const, permissions: { canAddProducts: false, canEditProducts: false, canDeleteProducts: false, canViewStats: false, canManageEmployees: false } });
  useEffect(() => { const loadEmployees = async () => { const { data } = await supabase.from('employees').select('*').order('id'); if (data) setEmployees(data); }; loadEmployees(); }, []);
  const handleAddEmployee = () => { if (!newEmployee.username || !newEmployee.password) { toast('Username und Passwort sind Pflicht!', 'error'); return; } setIsAdding(true); supabase.from('employees').insert({ username: newEmployee.username, password: newEmployee.password, role: newEmployee.role, permissions: newEmployee.permissions, login_count: 0, total_work_hours: 0, online: false }).then(({ error }) => { if (error) { toast('Fehler: ' + error.message, 'error'); } else { toast('Mitarbeiter erstellt!'); logActivity(currentUser.id, currentUser.username, 'Mitarbeiter erstellt', `"${newEmployee.username}"`); setNewEmployee({ username: '', password: '', role: 'Mitarbeiter', permissions: { canAddProducts: false, canEditProducts: false, canDeleteProducts: false, canViewStats: false, canManageEmployees: false } }); const loadEmployees = async () => { const { data } = await supabase.from('employees').select('*').order('id'); if (data) setEmployees(data); }; loadEmployees(); } setIsAdding(false); }); };
  return (<div className="space-y-6"><div className="bg-[#111] border border-yellow-400/30 p-6"><h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5"/> Neuer Mitarbeiter</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"><input placeholder="Username" value={newEmployee.username} onChange={e => setNewEmployee({...newEmployee, username: e.target.value})} className="bg-[#1A1A1A] border border-yellow-400/30 px-4 py-3 text-sm"/><input placeholder="Passwort" type="password" value={newEmployee.password} onChange={e => setNewEmployee({...newEmployee, password: e.target.value})} className="bg-[#1A1A1A] border border-yellow-400/30 px-4 py-3 text-sm"/><select value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value as any})} className="bg-[#1A1A1A] border border-yellow-400/30 px-4 py-3 text-sm"><option>Mitarbeiter</option><option>Manager</option></select></div><div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">{Object.entries(newEmployee.permissions).map(([key, value]) => (<label key={key} className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={value} onChange={e => setNewEmployee({...newEmployee, permissions: {...newEmployee.permissions, [key]: e.target.checked}})} className="accent-yellow-400"/><span className="text-gray-400">{key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}</span></label>))}</div><button onClick={handleAddEmployee} disabled={isAdding} className="px-6 py-3 bg-yellow-400 text-black font-bold uppercase text-xs disabled:opacity-50">{isAdding ? 'Wird erstellt...' : 'Hinzufügen'}</button></div>{editingEmployee && (<div className="bg-[#111] border border-blue-500/30 p-6"><h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2"><Key className="w-5 h-5"/> Passwort ändern für {editingEmployee.username}</h3><div className="flex gap-2"><input type="password" placeholder="Neues Passwort" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="flex-1 bg-[#1A1A1A] border border-blue-500/30 px-4 py-3 text-sm"/><button onClick={() => { if (!newPassword) { toast('Bitte neues Passwort eingeben', 'error'); return; } supabase.from('employees').update({ password: newPassword }).eq('id', editingEmployee.id).then(() => { toast('Passwort geändert'); logActivity(currentUser.id, currentUser.username, 'Passwort geändert', `für "${editingEmployee.username}"`); setNewPassword(''); setEditingEmployee(null); const loadEmployees = async () => { const { data } = await supabase.from('employees').select('*').order('id'); if (data) setEmployees(data); }; loadEmployees(); }); }} className="px-6 py-3 bg-blue-500 text-white font-bold uppercase text-xs">Speichern</button><button onClick={() => { setEditingEmployee(null); setNewPassword(''); }} className="px-6 py-3 border border-gray-600 text-gray-400 uppercase text-xs">Abbrechen</button></div></div>)}<div className="bg-[#111] border border-[#FF4400]/20 overflow-hidden"><table className="w-full text-sm"><thead className="bg-[#FF4400] text-white"><tr><th className="px-4 py-3 text-left">Username</th><th className="px-4 py-3 text-left">Rolle</th><th className="px-4 py-3 text-left">Logins</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Letzter Login</th><th className="px-4 py-3 text-left">Aktionen</th></tr></thead><tbody>{employees.map(emp => (<tr key={emp.id} className="border-t border-[#FF4400]/10"><td className="px-4 py-3 font-bold">{emp.username}</td><td className="px-4 py-3"><span className={`px-2 py-1 text-xs ${emp.role === 'Manager' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-600/20 text-gray-400'}`}>{emp.role}</span></td><td className="px-4 py-3">{emp.login_count}×</td><td className="px-4 py-3"><span className={`flex items-center gap-1 ${emp.online ? 'text-green-500' : 'text-gray-500'}`}><div className={`w-2 h-2 rounded-full ${emp.online ? 'bg-green-500' : 'bg-gray-500'}`}/>{emp.online ? 'Online' : 'Offline'}</span></td><td className="px-4 py-3 text-gray-500 text-xs">{emp.last_login ? new Date(emp.last_login).toLocaleString('de-DE') : 'Nie'}</td><td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => setEditingEmployee(emp)} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs"><Key className="w-3 h-3"/></button><button onClick={() => confirm(`${emp.username} wirklich löschen?`, () => { supabase.from('employees').delete().eq('id', emp.id).then(() => { toast('Mitarbeiter gelöscht', 'info'); logActivity(currentUser.id, currentUser.username, 'Mitarbeiter gelöscht', `"${emp.username}"`); const loadEmployees = async () => { const { data } = await supabase.from('employees').select('*').order('id'); if (data) setEmployees(data); }; loadEmployees(); }); })} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs"><Trash2 className="w-3 h-3"/></button></div></td></tr>))}</tbody></table></div></div>);
}

// =================== LOGS TAB ===================
function LogsTab({ toast, confirm }: { toast: (msg: string, type?: ToastType) => void, confirm: (msg: string, onConfirm: () => void) => void }) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState('Alle');
  const [autoDeleteDays, setAutoDeleteDays] = useState(3);
  const loadLogs = useCallback(async () => { const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - autoDeleteDays); await supabase.from('activity_logs').delete().lt('timestamp', cutoff.toISOString()); const { data } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(500); if (data) setLogs(data); }, [autoDeleteDays]);
  useEffect(() => { loadLogs(); const channel = supabase.channel('logs-realtime').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => loadLogs()).subscribe(); return () => { supabase.removeChannel(channel); }; }, [loadLogs]);
  const actionColors: Record<string, string> = { 'Eingeloggt': 'border-green-500 text-green-400', 'Ausgeloggt': 'border-gray-500 text-gray-400', 'Produkt hinzugefügt': 'border-[#FF4400] text-[#FF4400]', 'Produkt bearbeitet': 'border-blue-500 text-blue-400', 'Produkt gelöscht': 'border-red-500 text-red-400', 'Produkt verkauft': 'border-yellow-400 text-yellow-400', 'Bulk Import': 'border-green-500 text-green-400', 'Status Check': 'border-blue-500 text-blue-400' };
  const allActions = ['Alle', ...Object.keys(actionColors)];
  const filteredLogs = filter === 'Alle' ? logs : logs.filter(l => l.action === filter);
  return (<div className="bg-[#111] border border-purple-500/30 p-6 space-y-4"><div className="flex items-center justify-between"><h3 className="text-lg font-bold text-purple-400 flex items-center gap-2"><Clock className="w-5 h-5"/> Aktivitäts-Logs <span className="text-gray-500 text-sm font-normal">({filteredLogs.length} Einträge)</span></h3><div className="flex items-center gap-2"><button onClick={loadLogs} className="p-2 border border-purple-500/30 text-purple-400 hover:bg-purple-500/10"><RefreshCw className="w-4 h-4"/></button><button onClick={() => { const csv = ['Zeitpunkt,Mitarbeiter,Aktion,Details', ...(filter === 'Alle' ? logs : logs.filter(l => l.action === filter)).map(l => `"${new Date(l.timestamp).toLocaleString('de-DE')}","${l.username}","${l.action}","${l.details}"`)].join('\n'); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url); toast('Logs heruntergeladen'); }} className="px-3 py-2 border border-green-500/30 text-green-400 hover:bg-green-500/10 text-xs uppercase font-bold flex items-center gap-1"><Download className="w-3 h-3"/> CSV</button><button onClick={() => confirm('Alle Logs wirklich löschen?', async () => { const { error } = await supabase.from('activity_logs').delete().neq('id', 0); if (error) { toast('Fehler: ' + error.message, 'error'); return; } setLogs([]); toast('Alle Logs gelöscht', 'info'); })} className="px-3 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs uppercase font-bold flex items-center gap-1"><Trash2 className="w-3 h-3"/> Leeren</button></div></div><div className="flex items-center gap-3 bg-[#1A1A1A] border border-purple-500/20 px-4 py-3"><span className="text-xs uppercase text-gray-500">Auto-Löschen nach</span>{[1, 3, 7, 14, 30].map(days => (<button key={days} onClick={() => setAutoDeleteDays(days)} className={`px-2 py-1 text-xs font-bold uppercase ${autoDeleteDays === days ? 'bg-purple-500 text-white' : 'border border-purple-500/30 text-gray-500 hover:text-purple-400'}`}>{days}d</button>))}</div><div className="flex flex-wrap gap-2">{allActions.map(action => (<button key={action} onClick={() => setFilter(action)} className={`px-2 py-1 text-xs uppercase font-bold transition-colors ${filter === action ? 'bg-purple-500 text-white' : 'border border-purple-500/30 text-gray-500 hover:text-purple-400'}`}>{action}</button>))}</div><div className="space-y-1 max-h-[500px] overflow-y-auto">{filteredLogs.map(log => { const colorClass = actionColors[log.action] || 'border-gray-600 text-gray-400'; return (<div key={log.id} className={`flex items-start gap-3 p-3 bg-[#0A0A0A] border-l-2 ${colorClass.split(' ')[0]}`}><div className="text-xs text-gray-600 w-36 shrink-0 pt-0.5">{new Date(log.timestamp).toLocaleString('de-DE')}</div><div className={`text-xs font-bold w-24 shrink-0 pt-0.5 ${colorClass.split(' ')[1]}`}>{log.username}</div><div className="text-xs flex-1"><span className="text-[#F5F5F5] font-bold">{log.action}</span>{log.details && <span className="text-gray-500 ml-2">{log.details}</span>}</div></div>); })}</div></div>);
}

// ⭐⭐⭐ DEFAULT EXPORT ⭐⭐⭐
export default function ManagementPanel() {
  const [authed, setAuthed] = useState(false);
  const [authMode, setAuthMode] = useState<'admin' | 'employee' | null>(null);
  const [checking, setChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState('inventory');
  const { toasts, addToast, removeToast } = useToast();
  const { confirmOptions, showConfirm, closeConfirm } = useConfirm();

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('scnd_auth');
    const savedUser = sessionStorage.getItem('scnd_user');
    if (savedAuth === 'admin') {
      setAuthed(true); setAuthMode('admin');
      setCurrentUser({ id: 0, username: 'Mastercontrol', role: 'Admin', password: '', login_count: 0, total_work_hours: 0, online: true, permissions: { canAddProducts: true, canEditProducts: true, canDeleteProducts: true, canViewStats: true, canManageEmployees: true } });
    } else if (savedAuth === 'employee' && savedUser) {
      setAuthed(true); setAuthMode('employee');
      setCurrentUser(JSON.parse(savedUser));
    }
    setChecking(false);
  }, []);

  const handleLogout = () => {
    if (currentUser && currentUser.id !== 0) { supabase.from('employees').update({ online: false }).eq('id', currentUser.id); logActivity(currentUser.id, currentUser.username, 'Ausgeloggt', ''); }
    sessionStorage.removeItem('scnd_auth'); sessionStorage.removeItem('scnd_user');
    setAuthed(false); setAuthMode(null); setCurrentUser(null);
  };

  if (checking) return null;
  if (!authed) return <LoginScreen onLogin={(mode, user) => { setAuthed(true); setAuthMode(mode); setCurrentUser(user); sessionStorage.setItem('scnd_auth', mode); if (user) sessionStorage.setItem('scnd_user', JSON.stringify(user)); }} />;

  return (
    <div className="min-h-screen font-sans bg-[#0A0A0A] text-[#F5F5F5]">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {confirmOptions && <ConfirmDialog options={confirmOptions} onClose={closeConfirm} />}
      <header className="border-b border-[#FF4400]/30 px-6 py-4 sticky top-0 bg-[#0A0A0A]/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4"><h1 className="text-2xl font-bold tracking-tighter"><span className="text-[#FF4400]">SCND</span>_UNIT<span className="text-gray-500 text-lg ml-2">/ Management</span></h1>{currentUser && (<span className={`px-2 py-1 text-xs uppercase font-bold ${currentUser.role === 'Admin' ? 'bg-yellow-400 text-black' : currentUser.role === 'Manager' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-white'}`}>{currentUser.role}: {currentUser.username}</span>)}</div>
          <div className="flex items-center gap-2 flex-wrap">
            {currentUser?.permissions.canViewStats && (<button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${activeTab === 'analytics' ? 'bg-[#FF4400] text-white' : 'border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10'}`}><BarChart3 className="w-4 h-4 inline mr-1"/>Analytics</button>)}
            <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${activeTab === 'inventory' ? 'bg-[#FF4400] text-white' : 'border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10'}`}><Package className="w-4 h-4 inline mr-1"/>Inventar</button>
            {currentUser?.permissions.canAddProducts && (<button onClick={() => setActiveTab('add')} className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${activeTab === 'add' ? 'bg-[#FF4400] text-white' : 'border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10'}`}><Plus className="w-4 h-4 inline mr-1"/>Hinzufügen</button>)}
            {currentUser?.permissions.canAddProducts && (<button onClick={() => setActiveTab('vinted-tools')} className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${activeTab === 'vinted-tools' ? 'bg-green-600 text-white' : 'border border-green-600/30 text-green-500 hover:bg-green-600/10'}`}><Globe className="w-4 h-4 inline mr-1"/>Vinted Tools</button>)}
            {currentUser?.permissions.canManageEmployees && (<button onClick={() => setActiveTab('employees')} className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${activeTab === 'employees' ? 'bg-yellow-400 text-black' : 'border border-yellow-400 text-yellow-400 hover:bg-yellow-400/10'}`}><Users className="w-4 h-4 inline mr-1"/>Team</button>)}
            {currentUser?.role === 'Admin' && (<button onClick={() => setActiveTab('logs')} className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${activeTab === 'logs' ? 'bg-purple-500 text-white' : 'border border-purple-500 text-purple-500 hover:bg-purple-500/10'}`}><Clock className="w-4 h-4 inline mr-1"/>Logs</button>)}
            <button onClick={handleLogout} className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 text-xs uppercase font-bold"><LogOut className="w-4 h-4 inline mr-1"/>Logout</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'inventory' && <InventoryTab user={currentUser} toast={addToast} confirm={showConfirm} />}
        {activeTab === 'add' && <AddTab user={currentUser} toast={addToast} onProductAdded={() => {}} />}
        {activeTab === 'vinted-tools' && currentUser?.permissions.canAddProducts && <VintedToolsTab user={currentUser} toast={addToast} confirm={showConfirm} />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'employees' && currentUser?.permissions.canManageEmployees && <EmployeesTab currentUser={currentUser} toast={addToast} confirm={showConfirm} />}
        {activeTab === 'logs' && currentUser?.role === 'Admin' && <LogsTab toast={addToast} confirm={showConfirm} />}
      </main>
    </div>
  );
}
