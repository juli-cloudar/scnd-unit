'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle, Clock, Upload, Loader2 } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  vinted_url: string;
  sold: boolean;
}

export function AutoCleanTool({ toast, confirm }: { toast: (msg: string, type?: 'success' | 'error' | 'info') => void; confirm: (msg: string, onConfirm: () => void) => void }) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<{ markedSold: number; errors: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========== JSON parsen – nur URLs extrahieren ==========
  const extractUrlsFromJSON = async (file: File): Promise<Set<string>> => {
    const text = await file.text();
    let data = JSON.parse(text);
    if (!Array.isArray(data)) {
      if (data.items && Array.isArray(data.items)) data = data.items;
      else if (data.data && Array.isArray(data.data)) data = data.data;
      else throw new Error('JSON enthält kein Array von Artikeln');
    }

    const urlSet = new Set<string>();
    for (const item of data) {
      const url = item['Item URL'] || item.url;
      if (url && typeof url === 'string' && url.includes('vinted.de/items/')) {
        // Normierung: Alles vor dem ersten Fragezeichen entfernen (optional)
        const cleanUrl = url.split('?')[0];
        urlSet.add(cleanUrl);
      }
    }
    if (urlSet.size === 0) throw new Error('Keine gültigen Vinted-URLs gefunden');
    return urlSet;
  };

  // ========== Hauptlogik: Markiere Produkte als verkauft, wenn sie NICHT in der JSON vorkommen ==========
  const runCleanup = async () => {
    if (!uploadedFile) {
      toast('Bitte JSON-Datei auswählen', 'error');
      return;
    }

    let jsonUrls: Set<string>;
    try {
      jsonUrls = await extractUrlsFromJSON(uploadedFile);
    } catch (err: any) {
      toast(`Fehler beim Parsen: ${err.message}`, 'error');
      return;
    }

    confirm(`🚨 Es werden alle aktiven Produkte in der Datenbank mit der JSON-Datei abgeglichen. Produkte, die NICHT in der JSON vorkommen, werden als VERKAUFT markiert. Fortfahren?`, async () => {
      setIsRunning(true);
      setResult(null);

      // Alle aktiven Produkte aus der DB holen (sold = false)
      const { data: activeProducts, error } = await supabase
        .from('products')
        .select('id, name, vinted_url')
        .eq('sold', false);

      if (error) throw error;
      if (!activeProducts || activeProducts.length === 0) {
        toast('Keine aktiven Produkte in der Datenbank', 'info');
        setIsRunning(false);
        return;
      }

      setProgress({ current: 0, total: activeProducts.length });

      let markedSold = 0;
      let errors = 0;

      for (let i = 0; i < activeProducts.length; i++) {
        const product = activeProducts[i];
        setProgress({ current: i + 1, total: activeProducts.length });

        // URL normalisieren (ohne Query-Parameter)
        const dbUrl = product.vinted_url.split('?')[0];
        if (!jsonUrls.has(dbUrl)) {
          // Produkt ist nicht in der JSON-Datei → als verkauft markieren
          const { error: updateError } = await supabase
            .from('products')
            .update({ sold: true })
            .eq('id', product.id);
          if (updateError) {
            errors++;
            console.error(`Fehler beim Markieren von ${product.name}:`, updateError);
          } else {
            markedSold++;
          }
        }
        // Kurze Pause, um Rate Limits bei Supabase zu vermeiden (optional)
        await new Promise(r => setTimeout(r, 50));
      }

      setResult({ markedSold, errors });
      setIsRunning(false);
      toast(`✅ Fertig! ${markedSold} Produkte als verkauft markiert, ${errors} Fehler.`, 'success');
    });
  };

  // ========== UI ==========
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-950/30 to-[#111] border border-red-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
            <Upload className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-400">Datei-Cleanup (nur Datenbankabgleich)</h3>
            <p className="text-xs text-gray-500">JSON-Datei hochladen → alle aktiven Produkte, die nicht in der JSON vorkommen, werden als verkauft markiert.</p>
          </div>
        </div>
      </div>

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
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center"><div className="text-2xl font-bold text-yellow-400">{result.markedSold}</div><div className="text-xs text-gray-500">Als verkauft markiert</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-orange-400">{result.errors}</div><div className="text-xs text-gray-500">Fehler</div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
