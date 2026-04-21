// AutoCleanTool.tsx – erweiterte Version
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Play, Loader2, Search, Upload, FileJson } from 'lucide-react';

// ... (bestehende Interfaces: Product, CleanResult)

export function AutoCleanTool({ toast, confirm }: { toast: (msg: string, type?: 'success' | 'error' | 'info') => void, confirm: (msg: string, onConfirm: () => void) => void }) {
  // ... bestehende States (products, loading, isRunning, progress, result, autoDelete, delay, status)

  // NEU: States für Datei-Cleanup
  const [activeMode, setActiveMode] = useState<'db' | 'file'>('db');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileItems, setFileItems] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ... loadProducts, checkSingleItem, deleteProduct, markAsSold (bleiben unverändert)

  // NEU: JSON-Datei parsen (wie im VintedToolsTab)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setFileItems([]);
      setResult(null);
    }
  };

  const parseJSONFile = async (): Promise<any[]> => {
    if (!uploadedFile) throw new Error('Keine Datei ausgewählt');
    const text = await uploadedFile.text();
    let items = JSON.parse(text);
    if (!Array.isArray(items)) {
      if (items.items && Array.isArray(items.items)) items = items.items;
      else if (items.data && Array.isArray(items.data)) items = items.data;
      else throw new Error('Ungültiges JSON-Format');
    }
    // Filtere gültige Einträge (wie im VintedToolsTab)
    const validItems = items.filter((item: any) => {
      const url = item['Item URL'] || item.url || '';
      return url && typeof url === 'string' && url.includes('vinted.de/items/');
    });
    if (validItems.length === 0) throw new Error('Keine gültigen Vinted-URLs in der Datei');
    return validItems;
  };

  // NEU: Bereinigung basierend auf JSON-Datei
  const runFileCleanup = async () => {
    if (!uploadedFile) {
      toast('Bitte JSON-Datei auswählen', 'error');
      return;
    }

    let items: any[];
    try {
      items = await parseJSONFile();
    } catch (err: any) {
      toast(`Fehler beim Parsen: ${err.message}`, 'error');
      return;
    }

    confirm(`🚨 ${items.length} Produkte aus der Datei werden geprüft. ${autoDelete ? 'Nicht gefundene werden GELÖSCHT!' : 'Nicht gefundene werden als verkauft markiert.'} Fortfahren?`, async () => {
      setIsRunning(true);
      setStatus('checking');
      setResult(null);

      // Lade alle existierenden Produkte aus der DB (für schnellen Abgleich)
      const { data: existingProducts } = await supabase.from('products').select('id, name, vinted_url, sold, price');
      const existingMap = new Map(existingProducts?.map(p => [p.vinted_url, p]) || []);

      const results: CleanResult = {
        checked: 0,
        deleted: 0,
        markedSold: 0,
        errors: 0,
        failedUrls: [],
        deletedItems: [],
        soldItems: []
      };

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const url = item['Item URL'] || item.url || '';
        setProgress({ current: i + 1, total: items.length });

        // Existiert der Artikel in der DB?
        const existing = existingMap.get(url);

        if (!existing) {
          // Nicht in DB → neu? Oder ignorieren? Hier behandeln wir als "nicht existiert"
          if (autoDelete) {
            // Löschen ist nicht sinnvoll, weil nicht vorhanden – also überspringen oder als Fehler?
            // Besser: Als "nicht in DB" notieren, aber nicht löschen.
            results.errors++;
            results.failedUrls.push(url);
          } else {
            // Als verkauft markieren? Auch nicht sinnvoll, weil nicht in DB.
            results.errors++;
            results.failedUrls.push(url);
          }
        } else {
          // Artikel in DB – jetzt prüfen, ob er noch auf Vinted existiert
          const check = await checkSingleItem(url);
          if (check.error) {
            results.errors++;
            results.failedUrls.push(url);
          } else if (!check.exists) {
            if (autoDelete) {
              const deleted = await deleteProduct(existing.id);
              if (deleted) {
                results.deleted++;
                results.deletedItems.push({ id: existing.id, name: existing.name, url });
              } else results.errors++;
            } else {
              const marked = await markAsSold(existing.id);
              if (marked) {
                results.markedSold++;
                results.soldItems.push({ id: existing.id, name: existing.name, url });
              } else results.errors++;
            }
          } else if (check.isSold && !existing.sold) {
            const marked = await markAsSold(existing.id);
            if (marked) {
              results.markedSold++;
              results.soldItems.push({ id: existing.id, name: existing.name, url });
            } else results.errors++;
          }
        }

        results.checked++;
        await new Promise(r => setTimeout(r, delay));
      }

      setResult(results);
      setStatus('complete');
      setIsRunning(false);
      await loadProducts(); // Aktualisiere die Produktliste (falls DB geändert)

      toast(`✅ Fertig! ${results.deleted} gelöscht, ${results.markedSold} als verkauft markiert, ${results.errors} Fehler`, 'success');
    });
  };

  return (
    <div className="space-y-6">
      {/* Modus-Umschalter (Datenbank / Datei) */}
      <div className="flex gap-2 border-b border-[#FF4400]/30 pb-4">
        <button
          onClick={() => setActiveMode('db')}
          className={`px-4 py-2 text-xs uppercase font-bold ${activeMode === 'db' ? 'bg-red-600 text-white' : 'border border-red-600/30 text-red-500'}`}
        >
          <Database className="w-4 h-4 inline mr-1"/> DB-Cleanup
        </button>
        <button
          onClick={() => setActiveMode('file')}
          className={`px-4 py-2 text-xs uppercase font-bold ${activeMode === 'file' ? 'bg-red-600 text-white' : 'border border-red-600/30 text-red-500'}`}
        >
          <FileJson className="w-4 h-4 inline mr-1"/> Datei-Cleanup
        </button>
      </div>

      {/* Bestehender DB-Modus */}
      {activeMode === 'db' && (
        <>
          {/* Hier den bisherigen Inhalt des AutoCleanTool einfügen (die gesamte UI) */}
          {/* Achtung: Doppelte Elemente vermeiden – am besten den alten Return-Inhalt hier einbetten */}
        </>
      )}

      {/* Neuer Datei-Modus */}
      {activeMode === 'file' && (
        <div className="space-y-6">
          <div className="bg-[#111] border border-red-500/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-400">Datei-Cleanup</h3>
                <p className="text-xs text-gray-500">JSON-Datei aus Vinted-Export hochladen und mit Datenbank abgleichen</p>
              </div>
            </div>

            <div className="border border-dashed border-red-500/50 p-6 text-center">
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              {!uploadedFile ? (
                <div className="space-y-3">
                  <p className="text-gray-400 text-sm">Exportiere die JSON-Datei mit der Chrome Extension</p>
                  <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-red-600 text-white text-sm font-bold uppercase">
                    📁 JSON-Datei auswählen
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-red-400">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-mono text-sm">{uploadedFile.name}</span>
                    <button onClick={() => { setUploadedFile(null); setResult(null); }} className="text-gray-500 hover:text-red-400">×</button>
                  </div>
                  <button
                    onClick={runFileCleanup}
                    disabled={isRunning}
                    className="px-6 py-3 bg-[#FF4400] text-white text-sm font-bold uppercase"
                  >
                    {isRunning ? 'Prüfe...' : 'Datei bereinigen starten'}
                  </button>
                </div>
              )}
            </div>

            {/* Einstellungen (autoDelete, delay) – gleiche wie im DB-Modus */}
            <div className="mt-6 bg-[#111] border border-gray-700 p-6 space-y-4">
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
            </div>

            {/* Fortschritt & Ergebnis (identisch zu DB-Modus) */}
            {isRunning && progress.total > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500"><span>Fortschritt</span><span>{progress.current} / {progress.total}</span></div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden"><div className="bg-red-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }}/></div>
              </div>
            )}

            {result && (
              <div className="bg-[#111] border border-green-500/30 p-6 space-y-4">
                <h4 className="text-sm font-bold text-green-400 uppercase tracking-widest flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Bereinigung abgeschlossen</h4>
                {/* Gleiche Ergebnisanzeige wie im DB-Modus */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center"><div className="text-2xl font-bold text-blue-400">{result.checked}</div><div className="text-xs text-gray-500">Geprüft</div></div>
                  <div className="text-center"><div className="text-2xl font-bold text-red-400">{result.deleted}</div><div className="text-xs text-gray-500">Gelöscht</div></div>
                  <div className="text-center"><div className="text-2xl font-bold text-yellow-400">{result.markedSold}</div><div className="text-xs text-gray-500">Als verkauft markiert</div></div>
                  <div className="text-center"><div className="text-2xl font-bold text-orange-400">{result.errors}</div><div className="text-xs text-gray-500">Fehler</div></div>
                </div>
                {result.deletedItems.length > 0 && (<details className="mt-4"><summary className="cursor-pointer text-xs text-red-400">🗑️ Gelöschte Items ({result.deletedItems.length})</summary>... gleiche Darstellung ...</details>)}
                {result.soldItems.length > 0 && (<details className="mt-2"><summary className="cursor-pointer text-xs text-yellow-400">💰 Als verkauft markierte Items ({result.soldItems.length})</summary>... gleiche Darstellung ...</details>)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
