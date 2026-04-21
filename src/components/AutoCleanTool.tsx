'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle, Clock, Upload, Loader2, FileJson } from 'lucide-react';

interface CleanResult {
  checked: number;
  deleted: number;
  markedSold: number;
  errors: number;
  failedUrls: string[];
  deletedItems: { id: number; name: string; url: string }[];
  soldItems: { id: number; name: string; url: string }[];
}

export function AutoCleanTool({ toast, confirm }: { toast: (msg: string, type?: 'success' | 'error' | 'info') => void; confirm: (msg: string, onConfirm: () => void) => void }) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<CleanResult | null>(null);
  const [autoDelete, setAutoDelete] = useState(true);
  const [delay, setDelay] = useState(500);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========== Hilfsfunktionen ==========
  const checkSingleItem = async (url: string, retry = 0): Promise<{ exists: boolean; isSold: boolean; error?: string }> => {
    try {
      const match = url.match(/\/items\/(\d+)/);
      if (!match) return { exists: false, isSold: false, error: 'Ungültige URL' };
      const proxyUrl = `https://api.allorigins.win/raw?url=https://www.vinted.de/items/${match[1]}`;
      const res = await fetch(proxyUrl);
      if (!res.ok && retry < 2) {
        await new Promise(r => setTimeout(r, 2000 * (retry + 1)));
        return checkSingleItem(url, retry + 1);
      }
      if (!res.ok) return { exists: false, isSold: false, error: `HTTP ${res.status}` };
      const html = await res.text();
      const isSold = html.includes('item__sold-badge') ||
                     html.includes('Artikel ist verkauft') ||
                     html.includes('sold-badge') ||
                     html.includes('Dieser Artikel ist bereits verkauft');
      return { exists: true, isSold };
    } catch {
      if (retry < 2) {
        await new Promise(r => setTimeout(r, 2000));
        return checkSingleItem(url, retry + 1);
      }
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

  // ========== JSON parsen – nur URLs extrahieren ==========
  const extractUrlsFromJSON = async (file: File): Promise<string[]> => {
    const text = await file.text();
    let data = JSON.parse(text);
    if (!Array.isArray(data)) {
      if (data.items && Array.isArray(data.items)) data = data.items;
      else if (data.data && Array.isArray(data.data)) data = data.data;
      else throw new Error('JSON enthält kein Array von Artikeln');
    }

    const urls: string[] = [];
    for (const item of data) {
      const url = item['Item URL'] || item.url;
      if (url && typeof url === 'string' && url.includes('vinted.de/items/')) {
        urls.push(url);
      }
    }
    if (urls.length === 0) throw new Error('Keine gültigen Vinted-URLs gefunden');
    return urls;
  };

  // ========== Hauptlogik ==========
  const runCleanup = async () => {
    if (!uploadedFile) {
      toast('Bitte JSON-Datei auswählen', 'error');
      return;
    }

    let urls: string[];
    try {
      urls = await extractUrlsFromJSON(uploadedFile);
    } catch (err: any) {
      toast(`Fehler beim Parsen: ${err.message}`, 'error');
      return;
    }

    confirm(`🚨 ${urls.length} Produkte aus der Datei werden geprüft. ${autoDelete ? 'Nicht gefundene werden GELÖSCHT!' : 'Nicht gefundene werden als verkauft markiert.'} Fortfahren?`, async () => {
      setIsRunning(true);
      setResult(null);
      setProgress({ current: 0, total: urls.length });

      const { data: existingProducts } = await supabase.from('products').select('id, name, vinted_url, sold');
      const existingMap = new Map(existingProducts?.map(p => [p.vinted_url, p]) || []);

      const results: CleanResult = {
        checked: 0,
        deleted: 0,
        markedSold: 0,
        errors: 0,
        failedUrls: [],
        deletedItems: [],
        soldItems: [],
      };

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        setProgress({ current: i + 1, total: urls.length });

        const existing = existingMap.get(url);
        if (!existing) {
          results.errors++;
          results.failedUrls.push(url);
        } else {
          const check = await checkSingleItem(url);
          if (check.error) {
            results.errors++;
            results.failedUrls.push(url);
          } else if (!check.exists) {
            if (autoDelete) {
              const ok = await deleteProduct(existing.id);
              if (ok) {
                results.deleted++;
                results.deletedItems.push({ id: existing.id, name: existing.name, url });
              } else results.errors++;
            } else {
              const ok = await markAsSold(existing.id);
              if (ok) {
                results.markedSold++;
                results.soldItems.push({ id: existing.id, name: existing.name, url });
              } else results.errors++;
            }
          } else if (check.isSold && !existing.sold) {
            const ok = await markAsSold(existing.id);
            if (ok) {
              results.markedSold++;
              results.soldItems.push({ id: existing.id, name: existing.name, url });
            } else results.errors++;
          }
        }
        results.checked++;
        await new Promise(r => setTimeout(r, delay));
      }

      setResult(results);
      setIsRunning(false);
      toast(`✅ Fertig! ${results.deleted} gelöscht, ${results.markedSold} als verkauft markiert, ${results.errors} Fehler`, 'success');
    });
  };

  // ========== UI mit einem einzigen Tab (Datei‑Cleanup) ==========
  return (
    <div className="space-y-6">
      {/* Tab-Leiste mit nur einem aktiven Tab */}
      <div className="flex gap-2 border-b border-[#FF4400]/30 pb-4">
        <div className="px-4 py-2 text-xs uppercase font-bold bg-red-600 text-white flex items-center gap-2">
          <FileJson className="w-4 h-4" /> Datei-Cleanup
        </div>
      </div>

      {/* Inhalt des Tabs */}
      <div className="bg-[#111] border border-red-500/30 p-6">
        <div className="border border-dashed border-red-500/50 p-6 text-center">
          <input ref={fileInputRef} type="file" accept=".json" onChange={(e) => setUploadedFile(e.target.files?.[0] || null)} className="hidden" />
          {!uploadedFile ? (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm">Wähle die JSON-Datei (Vinted-Export)</p>
              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-red-600 text-white text-sm font-bold uppercase">
                📁 JSON auswählen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-red-400">
                <CheckCircle className="w-6 h-6" />
                <span className="font-mono text-sm">{uploadedFile.name}</span>
                <button onClick={() => { setUploadedFile(null); setResult(null); }} className="text-gray-500 hover:text-red-400">×</button>
              </div>
              <button onClick={runCleanup} disabled={isRunning} className="px-6 py-3 bg-[#FF4400] text-white text-sm font-bold uppercase">
                {isRunning ? <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> : '🔍 Bereinigung starten'}
              </button>
            </div>
          )}
        </div>

        {/* Einstellungen */}
        <div className="mt-6 bg-[#111] border border-gray-700 p-6 space-y-4">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4"/> Einstellungen
          </h4>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={autoDelete} onChange={e => setAutoDelete(e.target.checked)} disabled={isRunning} className="w-5 h-5 accent-red-500"/>
              <div>
                <span className="text-sm font-medium">Auto-Delete Modus</span>
                <p className="text-xs text-gray-500">Nicht gefundene Links werden gelöscht (sonst als verkauft markiert)</p>
              </div>
            </label>
            <div className="flex items-center gap-3">
              <label className="text-sm">Delay (ms):</label>
              <select value={delay} onChange={e => setDelay(Number(e.target.value))} disabled={isRunning} className="bg-[#1A1A1A] border border-gray-600 px-3 py-1 text-sm rounded">
                <option value={200}>200 (schnell)</option>
                <option value={500}>500 (normal)</option>
                <option value={1000}>1000 (langsam)</option>
                <option value={2000}>2000 (sehr langsam)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Fortschritt & Ergebnis */}
        {isRunning && progress.total > 0 && (
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs text-gray-500"><span>Fortschritt</span><span>{progress.current} / {progress.total}</span></div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden"><div className="bg-red-600 h-2 rounded-full transition-all" style={{ width: `${(progress.current / progress.total) * 100}%` }}/></div>
          </div>
        )}

        {result && (
          <div className="bg-[#111] border border-green-500/30 p-6 space-y-4 mt-4">
            <h4 className="text-sm font-bold text-green-400 uppercase tracking-widest flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Bereinigung abgeschlossen</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center"><div className="text-2xl font-bold text-blue-400">{result.checked}</div><div className="text-xs text-gray-500">Geprüft</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-red-400">{result.deleted}</div><div className="text-xs text-gray-500">Gelöscht</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-yellow-400">{result.markedSold}</div><div className="text-xs text-gray-500">Als verkauft markiert</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-orange-400">{result.errors}</div><div className="text-xs text-gray-500">Fehler</div></div>
            </div>
            {result.deletedItems.length > 0 && (
              <details><summary className="cursor-pointer text-xs text-red-400">🗑️ Gelöschte Items ({result.deletedItems.length})</summary>
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  {result.deletedItems.map((item, i) => (
                    <div key={i} className="text-xs border-b border-red-500/20 py-1 flex justify-between">
                      <span className="truncate flex-1">{item.name}</span>
                      <a href={item.url} target="_blank" className="text-gray-500 hover:text-red-400 ml-2">🔗</a>
                    </div>
                  ))}
                </div>
              </details>
            )}
            {result.soldItems.length > 0 && (
              <details><summary className="cursor-pointer text-xs text-yellow-400">💰 Als verkauft markierte Items ({result.soldItems.length})</summary>
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  {result.soldItems.map((item, i) => (
                    <div key={i} className="text-xs border-b border-yellow-500/20 py-1 flex justify-between">
                      <span className="truncate flex-1">{item.name}</span>
                      <a href={item.url} target="_blank" className="text-gray-500 hover:text-yellow-400 ml-2">🔗</a>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
