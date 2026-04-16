'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Play, Loader2, Search } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  vinted_url: string;
  sold: boolean;
  price: string;
}

interface CleanResult {
  checked: number;
  deleted: number;
  markedSold: number;
  errors: number;
  failedUrls: string[];
  deletedItems: { id: number; name: string; url: string }[];
  soldItems: { id: number; name: string; url: string }[];
}

export function AutoCleanTool({ toast, confirm }: { toast: (msg: string, type?: 'success' | 'error' | 'info') => void, confirm: (msg: string, onConfirm: () => void) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<CleanResult | null>(null);
  const [autoDelete, setAutoDelete] = useState(true);
  const [delay, setDelay] = useState(500);
  const [status, setStatus] = useState<'idle' | 'checking' | 'complete'>('idle');

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, vinted_url, sold, price')
      .order('id');
    
    if (!error && data) {
      setProducts(data);
      toast(`${data.length} Produkte geladen`, 'info');
    } else {
      toast('Fehler beim Laden der Produkte', 'error');
    }
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, []);


// Ersetze sie mit der verbesserten Version:
const checkSingleItem = async (url: string, retryCount = 0): Promise<{ exists: boolean; isSold: boolean; error?: string }> => {
  try {
    const itemMatch = url.match(/\/items\/(\d+)/);
    if (!itemMatch) return { exists: false, isSold: false, error: 'Ungültige URL' };
    
    const itemId = itemMatch[1];
    const res = await fetch(`/api/vinted/check/${itemId}`);
    
    // Rate limiting - warten und wiederholen
    if (res.status === 429 && retryCount < 3) {
      const waitTime = 2000 * (retryCount + 1);
      console.log(`Rate Limited! Warte ${waitTime}ms und wiederhole...`);
      await new Promise(r => setTimeout(r, waitTime));
      return checkSingleItem(url, retryCount + 1);
    }
    
    if (res.status === 404) {
      return { exists: false, isSold: false };
    }
    
    const data = await res.json();
    
    if (data.status === 'sold') {
      return { exists: true, isSold: true };
    }
    
    return { exists: true, isSold: false };
  } catch (error) {
    return { exists: true, isSold: false, error: 'Netzwerkfehler' };
  }
};

    const deleteProduct = async (id: number) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    return !error;
  };

  const markAsSold = async (id: number) => {
    const { error } = await supabase.from('products').update({ sold: true }).eq('id', id);
    return !error;
  };

  const runCleanup = async () => {
    if (products.length === 0) {
      toast('Keine Produkte zum Prüfen', 'error');
      return;
    }

    confirm(`🚨 Achtung! ${products.length} Produkte werden geprüft. ${autoDelete ? 'Nicht gefundene werden GELÖSCHT!' : 'Nicht gefundene werden als verkauft markiert.'} Fortfahren?`, async () => {
      setIsRunning(true);
      setStatus('checking');
      setResult(null);
      
      const results: CleanResult = {
        checked: 0,
        deleted: 0,
        markedSold: 0,
        errors: 0,
        failedUrls: [],
        deletedItems: [],
        soldItems: []
      };
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        setProgress({ current: i + 1, total: products.length });
        
        if (product.sold) {
          results.checked++;
          continue;
        }
        
        const check = await checkSingleItem(product.vinted_url);
        
        if (check.error) {
          results.errors++;
          results.failedUrls.push(product.vinted_url);
        } else if (!check.exists) {
          if (autoDelete) {
            const deleted = await deleteProduct(product.id);
            if (deleted) {
              results.deleted++;
              results.deletedItems.push({ id: product.id, name: product.name, url: product.vinted_url });
            } else {
              results.errors++;
            }
          } else {
            const marked = await markAsSold(product.id);
            if (marked) {
              results.markedSold++;
              results.soldItems.push({ id: product.id, name: product.name, url: product.vinted_url });
            } else {
              results.errors++;
            }
          }
        } else if (check.isSold) {
          const marked = await markAsSold(product.id);
          if (marked) {
            results.markedSold++;
            results.soldItems.push({ id: product.id, name: product.name, url: product.vinted_url });
          } else {
            results.errors++;
          }
        }
        
        results.checked++;
        await new Promise(r => setTimeout(r, delay));
      }
      
      setResult(results);
      setStatus('complete');
      setIsRunning(false);
      await loadProducts();
      
      toast(`✅ Fertig! ${results.deleted} gelöscht, ${results.markedSold} als verkauft markiert, ${results.errors} Fehler`, 'success');
    });
  };

  const checkOnlyOrphans = async () => {
    if (products.length === 0) {
      toast('Keine Produkte zum Prüfen', 'error');
      return;
    }

    setIsRunning(true);
    setStatus('checking');
    
    const orphans: Product[] = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      setProgress({ current: i + 1, total: products.length });
      
      if (product.sold) continue;
      
      const check = await checkSingleItem(product.vinted_url);
      
      if (!check.exists) {
        orphans.push(product);
      }
      
      await new Promise(r => setTimeout(r, delay));
    }
    
    setStatus('complete');
    setIsRunning(false);
    
    if (orphans.length === 0) {
      toast('Keine verwaisten Links gefunden!', 'success');
    } else {
      toast(`${orphans.length} verwaiste Links gefunden`, 'info');
    }
    
    setProgress({ current: 0, total: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-950/30 to-[#111] border border-red-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-400">Auto Clean Tool</h3>
            <p className="text-xs text-gray-500">Prüft alle Produkt-Links und bereinigt automatisch nicht mehr existierende Artikel</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111] border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-[#FF4400]">{products.length}</div>
          <div className="text-xs text-gray-500 uppercase">Gesamt</div>
        </div>
        <div className="bg-[#111] border border-green-500/30 p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{products.filter(p => !p.sold).length}</div>
          <div className="text-xs text-gray-500 uppercase">Aktiv</div>
        </div>
        <div className="bg-[#111] border border-red-500/30 p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{products.filter(p => p.sold).length}</div>
          <div className="text-xs text-gray-500 uppercase">Verkauft</div>
        </div>
        <div className="bg-[#111] border border-yellow-500/30 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-500">{result?.deleted || 0}</div>
          <div className="text-xs text-gray-500 uppercase">Gelöscht</div>
        </div>
      </div>

      <div className="bg-[#111] border border-gray-700 p-6 space-y-4">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Clock className="w-4 h-4"/> Einstellungen
        </h4>
        
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={autoDelete} onChange={e => setAutoDelete(e.target.checked)} disabled={isRunning} className="w-5 h-5 accent-red-500"/>
            <div>
              <span className="text-sm font-medium">Auto-Delete Modus</span>
              <p className="text-xs text-gray-500">Nicht gefundene Links werden automatisch gelöscht</p>
            </div>
          </label>
          
          <div className="flex items-center gap-3">
            <label className="text-sm">Delay (ms):</label>
            <select value={delay} onChange={e => setDelay(Number(e.target.value))} disabled={isRunning} className="bg-[#1A1A1A] border border-gray-600 px-3 py-1 text-sm rounded">
              <option value={200}>200 ms (schnell)</option>
              <option value={500}>500 ms (normal)</option>
              <option value={1000}>1000 ms (langsam)</option>
              <option value={2000}>2000 ms (sehr langsam)</option>
            </select>
          </div>
        </div>
        
        {autoDelete && (
          <div className="bg-red-950/30 border border-red-500/30 p-3 text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4"/>
            <span>Achtung: Im Auto-Delete Modus werden nicht mehr existierende Produkte unwiderruflich gelöscht!</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <button onClick={runCleanup} disabled={isRunning || loading} className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2">
          {isRunning ? (<><Loader2 className="w-5 h-5 animate-spin"/>{status === 'checking' ? `Prüfe... ${progress.current}/${progress.total}` : 'Verarbeite...'}</>) : (<><Play className="w-5 h-5"/> Vollständige Bereinigung starten</>)}
        </button>
        
        <button onClick={checkOnlyOrphans} disabled={isRunning || loading} className="px-6 py-4 border border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 font-bold uppercase tracking-widest text-sm disabled:opacity-50 transition-all flex items-center gap-2">
          <Search className="w-4 h-4"/> Nur verwaiste Links suchen
        </button>
        
        <button onClick={loadProducts} disabled={isRunning || loading} className="px-6 py-4 border border-gray-600 text-gray-400 hover:bg-gray-800 font-bold uppercase tracking-widest text-sm disabled:opacity-50 transition-all flex items-center gap-2">
          <RefreshCw className="w-4 h-4"/> Neu laden
        </button>
      </div>

      {isRunning && progress.total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500"><span>Fortschritt</span><span>{progress.current} / {progress.total}</span></div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden"><div className="bg-red-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }}/></div>
        </div>
      )}

      {result && (
        <div className="bg-[#111] border border-green-500/30 p-6 space-y-4">
          <h4 className="text-sm font-bold text-green-400 uppercase tracking-widest flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Bereinigung abgeschlossen</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center"><div className="text-2xl font-bold text-blue-400">{result.checked}</div><div className="text-xs text-gray-500">Geprüft</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-red-400">{result.deleted}</div><div className="text-xs text-gray-500">Gelöscht</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-yellow-400">{result.markedSold}</div><div className="text-xs text-gray-500">Als verkauft markiert</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-orange-400">{result.errors}</div><div className="text-xs text-gray-500">Fehler</div></div>
          </div>
          
          {result.deletedItems.length > 0 && (<details className="mt-4"><summary className="cursor-pointer text-xs text-red-400 hover:text-red-300">🗑️ Gelöschte Items ({result.deletedItems.length})</summary><div className="mt-2 max-h-48 overflow-y-auto space-y-1">{result.deletedItems.map((item, i) => (<div key={i} className="text-xs border-b border-red-500/20 py-1 flex justify-between"><span className="truncate flex-1">{item.name}</span><a href={item.url} target="_blank" className="text-gray-500 hover:text-red-400 ml-2">🔗</a></div>))}</div></details>)}
          
          {result.soldItems.length > 0 && (<details className="mt-2"><summary className="cursor-pointer text-xs text-yellow-400 hover:text-yellow-300">💰 Als verkauft markierte Items ({result.soldItems.length})</summary><div className="mt-2 max-h-48 overflow-y-auto space-y-1">{result.soldItems.map((item, i) => (<div key={i} className="text-xs border-b border-yellow-500/20 py-1 flex justify-between"><span className="truncate flex-1">{item.name}</span><a href={item.url} target="_blank" className="text-gray-500 hover:text-yellow-400 ml-2">🔗</a></div>))}</div></details>)}
        </div>
      )}
    </div>
  );
}
