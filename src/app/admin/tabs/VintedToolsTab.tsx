import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { RefreshCw, AlertTriangle, CheckCircle, Upload, Search, Merge, Download, FileJson, X } from "lucide-react";
import { ResultDisplay } from "../components/ResultDisplay";
import { AutoCleanTool } from "@/components/AutoCleanTool";
import { ToastType } from "../hooks/useToast";

interface Employee {
  id: number; username: string;
  permissions: { canAddProducts: boolean; };
}

export function VintedToolsTab({ user, toast, confirm }: { user: Employee | null, toast: (msg: string, type?: ToastType) => void, confirm: (msg: string, onConfirm: () => void) => void }) {
  const [activeSubTab, setActiveSubTab] = useState<'import' | 'status' | 'merge' | 'clean'>('import');
  const [autoRemove, setAutoRemove] = useState(false);
  
  // === JSON Import States (unverändert) ===
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [singleUrl, setSingleUrl] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusProgress, setStatusProgress] = useState({ current: 0, total: 0 });
  const [statusResult, setStatusResult] = useState<any>(null);
  const [singleResult, setSingleResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // === NEU: JSON Merge States ===
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mergedResult, setMergedResult] = useState<{ totalItems: number; uniqueItems: number; duplicates: number; mergedFile?: any } | null>(null);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);

  // ========== JSON Import (unverändert, nur der Vollständigkeit halber) ==========
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const processImport = async () => { /* ... unverändert ... */ };

  const checkSingleItem = async () => { /* ... unverändert ... */ };

  const checkAllStatus = async () => { /* ... unverändert ... */ };

  // ========== NEU: JSON Merge Funktionen ==========
  const handleMergeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeMergeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setMergedResult(null);
  };

  const mergeJSONFiles = async () => {
    if (selectedFiles.length === 0) {
      toast('Bitte mindestens eine JSON-Datei auswählen', 'error');
      return;
    }

    setImportLoading(true);
    setMergedResult(null);

    try {
      const allItems: any[] = [];
      const urlSet = new Set<string>();

      for (const file of selectedFiles) {
        const text = await file.text();
        let data = JSON.parse(text);
        if (!Array.isArray(data)) {
          if (data.items && Array.isArray(data.items)) data = data.items;
          else if (data.data && Array.isArray(data.data)) data = data.data;
          else throw new Error(`Ungültiges Format in ${file.name}`);
        }
        allItems.push(...data);
      }

      // Duplikate entfernen (basierend auf "Item URL")
      const uniqueItems: any[] = [];
      let duplicates = 0;

      for (const item of allItems) {
        const url = item['Item URL'] || item.url;
        if (url && typeof url === 'string') {
          const normalizedUrl = url.split('?')[0];
          if (!urlSet.has(normalizedUrl)) {
            urlSet.add(normalizedUrl);
            uniqueItems.push(item);
          } else {
            duplicates++;
          }
        } else {
          // Items ohne URL behalten wir trotzdem, aber sie werden als "ohne URL" gezählt
          uniqueItems.push(item);
        }
      }

      // Ergebnis vorbereiten
      const mergedData = {
        sourceFiles: selectedFiles.map(f => f.name),
        totalOriginalItems: allItems.length,
        uniqueItems: uniqueItems.length,
        duplicatesRemoved: duplicates,
        items: uniqueItems
      };

      setMergedResult({
        totalItems: allItems.length,
        uniqueItems: uniqueItems.length,
        duplicates,
        mergedFile: mergedData
      });

      toast(`✅ ${uniqueItems.length} einzigartige Artikel (${duplicates} Duplikate entfernt)`, 'success');
    } catch (err: any) {
      toast(`Fehler beim Mergen: ${err.message}`, 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const downloadMergedJSON = () => {
    if (!mergedResult?.mergedFile) return;
    const dataStr = JSON.stringify(mergedResult.mergedFile, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merged_vinted_${new Date().toISOString().slice(0,19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('JSON heruntergeladen', 'success');
  };

  // ========== Render ==========
  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-[#FF4400]/30 pb-4">
        <button onClick={() => setActiveSubTab('import')} className={`px-4 py-2 text-xs uppercase font-bold ${activeSubTab === 'import' ? 'bg-green-600 text-white' : 'border border-green-600/30 text-green-500'}`}><Upload className="w-4 h-4 inline mr-1"/>JSON Import</button>
        <button onClick={() => setActiveSubTab('status')} className={`px-4 py-2 text-xs uppercase font-bold ${activeSubTab === 'status' ? 'bg-blue-600 text-white' : 'border border-blue-600/30 text-blue-500'}`}><RefreshCw className="w-4 h-4 inline mr-1"/>Status Check</button>
        <button onClick={() => setActiveSubTab('merge')} className={`px-4 py-2 text-xs uppercase font-bold ${activeSubTab === 'merge' ? 'bg-purple-600 text-white' : 'border border-purple-600/30 text-purple-500'}`}><Merge className="w-4 h-4 inline mr-1"/>JSON Merge</button>
        <button onClick={() => setActiveSubTab('clean')} className={`px-4 py-2 text-xs uppercase font-bold ${activeSubTab === 'clean' ? 'bg-red-600 text-white' : 'border border-red-600/30 text-red-500'}`}><AlertTriangle className="w-4 h-4 inline mr-1"/>Auto Clean</button>
      </div>

      {/* Auto-Remove Modus – bleibt für alle Tabs sichtbar, wie gehabt */}
      <div className="bg-[#111] border border-red-500/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-red-500"/><div><p className="text-sm font-bold text-red-400">Auto-Remove Modus</p><p className="text-xs text-gray-500">Verkaufte Items automatisch als verkauft markieren</p></div></div>
        <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={autoRemove} onChange={e => setAutoRemove(e.target.checked)} className="sr-only peer"/><div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"/></label>
      </div>

      {/* JSON IMPORT TAB (unverändert) */}
      {activeSubTab === 'import' && ( /* ... Ihr bestehender Code ... */ )}

      {/* STATUS CHECK TAB (unverändert) */}
      {activeSubTab === 'status' && ( /* ... Ihr bestehender Code ... */ )}

      {/* NEU: JSON MERGE TAB */}
      {activeSubTab === 'merge' && (
        <div className="bg-[#111] border border-purple-500/30 p-6 space-y-4">
          <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2"><Merge className="w-5 h-5"/>Mehrere JSON-Dateien zusammenführen</h3>
          <p className="text-sm text-gray-400">Wähle mehrere JSON-Exporte (z.B. von verschiedenen Scraping-Sitzungen) aus. Das Tool entfernt Duplikate basierend auf der <code className="bg-gray-800 px-1">Item URL</code> und erstellt eine einzige bereinigte JSON-Datei.</p>

          <div className="border border-dashed border-purple-500/50 p-6 text-center">
            <input ref={mergeFileInputRef} type="file" accept=".json" multiple onChange={handleMergeFileSelect} className="hidden" />
            <button onClick={() => mergeFileInputRef.current?.click()} className="px-6 py-3 bg-purple-600 text-white text-sm font-bold uppercase">
              📁 JSON-Dateien auswählen
            </button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-300">{selectedFiles.length} Datei(en) ausgewählt:</span>
                <button onClick={() => { setSelectedFiles([]); setMergedResult(null); }} className="text-xs text-red-400 hover:text-red-300">Alle entfernen</button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-700 p-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-gray-800/50 px-2 py-1 rounded">
                    <span className="truncate">{file.name}</span>
                    <button onClick={() => removeMergeFile(idx)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4"/></button>
                  </div>
                ))}
              </div>
              <button onClick={mergeJSONFiles} disabled={importLoading} className="w-full py-3 bg-purple-600 text-white text-sm font-bold uppercase flex items-center justify-center gap-2">
                {importLoading ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Merge className="w-5 h-5"/>} Dateien zusammenführen
              </button>
            </div>
          )}

          {mergedResult && (
            <div className="bg-purple-950/20 border border-purple-500/30 p-4 space-y-3">
              <h4 className="text-sm font-bold text-purple-400 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Zusammenführung abgeschlossen</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><div className="text-2xl font-bold text-blue-400">{mergedResult.totalItems}</div><div className="text-xs text-gray-500">Originale Artikel</div></div>
                <div><div className="text-2xl font-bold text-green-400">{mergedResult.uniqueItems}</div><div className="text-xs text-gray-500">Einzigartige</div></div>
                <div><div className="text-2xl font-bold text-yellow-400">{mergedResult.duplicates}</div><div className="text-xs text-gray-500">Duplikate</div></div>
              </div>
              <button onClick={downloadMergedJSON} className="w-full py-2 bg-purple-600 text-white text-sm font-bold uppercase flex items-center justify-center gap-2">
                <Download className="w-4 h-4"/> Merged JSON herunterladen
              </button>
            </div>
          )}
        </div>
      )}

      {/* AUTO CLEAN TAB (bleibt wie gehabt) */}
      {activeSubTab === 'clean' && <AutoCleanTool toast={toast} confirm={confirm} />}
    </div>
  );
}
