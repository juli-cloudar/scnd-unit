// src/components/MergeJsonTool.tsx
'use client';

import { useState, useRef } from 'react';
import { Upload, FileJson, CheckCircle, AlertTriangle, Download, X } from 'lucide-react';

interface MergedItem {
  url: string;
  title?: string;
  price?: string;
  // Weitere Felder, die Sie behalten möchten, können hier ergänzt werden.
  originalData: any; // das gesamte originale Item-Objekt
}

export function MergeJsonTool({ toast }: { toast: (msg: string, type?: 'success' | 'error' | 'info') => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [mergedItems, setMergedItems] = useState<MergedItem[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selected]);
    e.target.value = ''; // reset, damit gleiche Datei erneut gewählt werden kann
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (files.length === 0) {
      toast('Bitte mindestens eine JSON-Datei auswählen', 'error');
      return;
    }
    setProcessing(true);
    const urlMap = new Map<string, MergedItem>();
    let totalItems = 0;

    for (const file of files) {
      try {
        const text = await file.text();
        let data = JSON.parse(text);
        // Normalisierung: wenn data ein Objekt mit items/data ist, tiefer gehen
        if (!Array.isArray(data)) {
          if (data.items && Array.isArray(data.items)) data = data.items;
          else if (data.data && Array.isArray(data.data)) data = data.data;
          else throw new Error('JSON enthält kein Array von Artikeln');
        }
        for (const item of data) {
          const url = item['Item URL'] || item.url;
          if (!url || typeof url !== 'string') continue;
          const cleanUrl = url.split('?')[0]; // Normalisierung
          if (!urlMap.has(cleanUrl)) {
            urlMap.set(cleanUrl, { url: cleanUrl, originalData: item });
          } else {
            // Duplikat – wir zählen es, behalten aber das erste Vorkommen.
          }
        }
        totalItems += data.length;
      } catch (err: any) {
        toast(`Fehler in Datei ${file.name}: ${err.message}`, 'error');
      }
    }

    const uniqueItems = Array.from(urlMap.values());
    const duplicates = totalItems - uniqueItems.length;
    setDuplicateCount(duplicates);
    setMergedItems(uniqueItems);
    setProcessing(false);
    toast(`✅ Verarbeitung abgeschlossen: ${uniqueItems.length} einzigartige Artikel (${duplicates} Duplikate entfernt)`, 'success');
  };

  const downloadMergedJSON = () => {
    if (mergedItems.length === 0) return;
    // Format: gib ein Array der originalData-Objekte zurück (bereinigt)
    const outputData = mergedItems.map(item => item.originalData);
    const blob = new Blob([JSON.stringify(outputData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merged_vinted_export_${new Date().toISOString().slice(0,19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-950/30 to-[#111] border border-blue-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
            <FileJson className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-blue-400">JSON-Merger (Duplikate entfernen)</h3>
            <p className="text-xs text-gray-500">Mehrere JSON-Dateien (z.B. aus Chrome-Scraper) zusammenführen, doppelte URLs eliminieren.</p>
          </div>
        </div>
      </div>

      <div className="bg-[#111] border border-blue-500/30 p-6">
        <div className="border border-dashed border-blue-500/50 p-6 text-center">
          <input ref={fileInputRef} type="file" accept=".json" multiple onChange={handleFileSelect} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-blue-600 text-white text-sm font-bold uppercase mb-4">
            📁 JSON-Dateien auswählen
          </button>
          {files.length > 0 && (
            <div className="mt-4 text-left">
              <p className="text-sm text-gray-300 mb-2">Ausgewählte Dateien:</p>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {files.map((file, idx) => (
                  <li key={idx} className="flex justify-between items-center text-xs bg-[#1A1A1A] p-2 rounded">
                    <span className="truncate">{file.name}</span>
                    <button onClick={() => removeFile(idx)} className="text-red-400 hover:text-red-300 ml-2"><X className="w-4 h-4"/></button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-3 mt-4">
                <button onClick={processFiles} disabled={processing} className="flex-1 py-2 bg-blue-600 text-white text-sm font-bold uppercase flex items-center justify-center gap-2">
                  {processing ? '⏳ Verarbeite...' : '🔄 Zusammenführen & Duplikate entfernen'}
                </button>
                <button onClick={() => { setFiles([]); setMergedItems([]); setDuplicateCount(0); }} className="px-4 py-2 border border-gray-600 text-gray-400 hover:bg-gray-800 text-sm uppercase">
                  Zurücksetzen
                </button>
              </div>
            </div>
          )}
        </div>

        {mergedItems.length > 0 && (
          <div className="mt-6 bg-green-950/20 border border-green-500/30 p-4 space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <p className="text-green-400 font-bold">✅ Einzigartige Artikel: {mergedItems.length}</p>
                <p className="text-xs text-gray-400">Duplikate entfernt: {duplicateCount}</p>
              </div>
              <button onClick={downloadMergedJSON} className="px-4 py-2 bg-green-600 text-white text-sm font-bold uppercase flex items-center gap-2">
                <Download className="w-4 h-4"/> Bereinigte JSON herunterladen
              </button>
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-400">Vorschau (erste 10 URLs)</summary>
              <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                {mergedItems.slice(0, 10).map((item, i) => (
                  <div key={i} className="border-b border-gray-700 py-1 font-mono text-gray-300 truncate">{item.url}</div>
                ))}
                {mergedItems.length > 10 && <div className="text-gray-500">... und {mergedItems.length - 10} weitere</div>}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
