import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { RefreshCw, AlertTriangle, CheckCircle, Upload, Search, Merge, Download, X } from "lucide-react";
import { ResultDisplay } from "../components/ResultDisplay";
import { AutoCleanTool } from "@/components/AutoCleanTool";
import { ToastType } from "../hooks/useToast";

interface Employee {
  id: number; username: string;
  permissions: { canAddProducts: boolean; };
}

export function VintedToolsTab({ user, toast, confirm }: { user: Employee | null, toast: (msg: string, type?: ToastType) => void, confirm: (msg: string, onConfirm: () => void) => void }) {
  const [activeSubTab, setActiveSubTab] = useState<'import' | 'status' | 'merge' | 'clean'>('import');
  
  // JSON Import States
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [singleUrl, setSingleUrl] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // JSON Merge States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mergedResult, setMergedResult] = useState<{ totalItems: number; uniqueItems: number; duplicates: number; mergedFile?: any } | null>(null);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);

  // ========== JSON IMPORT ==========
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

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

      const validItems = items.filter((item: any) => {
        const id = item?.id ? String(item.id) : '';
        if (id === 'Get Unlimited to see more than 10 rows.') return false;
        if (id && typeof id === 'string' && id.includes('#')) return false;
        const title = item['Item Title'] || item.title || '';
        if (!title || typeof title !== 'string') return false;
        if (title.includes('#') || title.length < 5) return false;
        const url = item['Item URL'] || item.url || '';
        if (!url || typeof url !== 'string') return false;
        if (!url.includes('vinted.de/items/')) return false;
        const price = item['Item Price'] || item.price || '';
        if (!price || price === '####') return false;
        return true;
      });

      const invalidCount = items.length - validItems.length;
      if (invalidCount > 0) toast(`${invalidCount} ungültige Einträge wurden übersprungen`, 'info');
      toast(`${validItems.length} gültige Artikel in JSON gefunden`, 'info');

      const { data: existingProducts } = await supabase.from('products').select('vinted_url');
      const existingUrls = new Set(existingProducts?.map((p: any) => p.vinted_url) || []);

      let success = 0, failed = 0, duplicates = 0;

      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        const title = item['Item Title'] || item.title || item.name;
        const url = item['Item URL'] || item.url || item.link || '';

        if (existingUrls.has(url)) {
          duplicates++;
        } else {
          let brand = item['Item Brand'] || '';
          if (!brand && title) {
            const brandMatch = title.match(/^(Nike|Adidas|Puma|Champion|Tommy Hilfiger|Lacoste|Helly Hansen|The North Face|Columbia|Lee|Wrangler|Fila|Napapijri|Starter|New Balance|Timberland|Reebok|Bernd Berger|La Martina|Bexleys|U\.S\. Polo Assn)/i);
            brand = brandMatch ? brandMatch[1] : 'Sonstige';
          }

          const priceRaw = item['Item Price'] || item.price || item.amount;
          let priceNumber = String(priceRaw).replace(/[^0-9,.-]/g, '').replace(',', '.');
          let priceValue = parseFloat(priceNumber);
          const price = isNaN(priceValue) ? '0€' : `${Math.round(priceValue)}€`;
          const size = item['Item Size'] || item.size || '–';
          const condition = item['Item Status'] || item.condition || 'Gut';

          let category = 'Sonstiges';
          const titleLower = title.toLowerCase();
          if (titleLower.includes('hemd') || titleLower.includes('bluse')) category = 'Hemden';
          else if (titleLower.includes('cap') || titleLower.includes('hat') || titleLower.includes('mütze') || titleLower.includes('kopf') || titleLower.includes('headwear')) category = 'Headwear';
          else if (titleLower.includes('tasche') || titleLower.includes('bag') || titleLower.includes('rucksack') || titleLower.includes('tote')) category = 'Taschen';
          else if (titleLower.includes('jacke') || titleLower.includes('jacket') || titleLower.includes('weste')) category = 'Jacken';
          else if (titleLower.includes('pullover') || titleLower.includes('sweater') || titleLower.includes('fleece')) category = 'Pullover';
          else if (titleLower.includes('sweatshirt') || titleLower.includes('crewneck') || titleLower.includes('hoodie')) category = 'Sweatshirts';
          else if (titleLower.includes('top') || titleLower.includes('shirt') || titleLower.includes('polo')) category = 'Tops';

          let photoUrls: string[] = [];
          const allPhotos = item['All Photos'] || item['all_photos'] || '';
          if (allPhotos && typeof allPhotos === 'string') {
            if (allPhotos.includes(' || ')) {
              photoUrls = allPhotos.split(' || ').filter((p: string) => p.startsWith('http'));
            } else if (allPhotos.startsWith('http')) {
              photoUrls = [allPhotos];
            }
          }
          if (photoUrls.length === 0) {
            for (let p = 1; p <= 10; p++) {
              const photo = item[`Item Photo ${p}`];
              if (photo && typeof photo === 'string' && photo.startsWith('http') && photo !== 'Not Available') {
                photoUrls.push(photo);
              }
            }
          }

          const newProduct = { name: title.substring(0, 100), brand, category, price, size, condition, images: photoUrls, vinted_url: url, sold: false };
          const { error } = await supabase.from('products').insert(newProduct);
          if (error) { failed++; } else { success++; existingUrls.add(url); }
        }

        setImportResult((prev: any) => ({ ...prev, current: i + 1, total: validItems.length, success, failed, duplicates }));
        await new Promise(r => setTimeout(r, 50));
      }

      const finalResult = { summary: { total: validItems.length, imported: success, duplicates, failed, invalid: invalidCount }, message: `✅ Fertig: ${success} importiert, ${duplicates} Duplikate, ${invalidCount} ungültige, ${failed} Fehler` };
      setImportResult(finalResult);
      toast(finalResult.message, 'success');
      if (success > 0) setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast('Fehler: ' + error.message, 'error');
      setImportResult({ message: 'Fehler: ' + error.message, summary: { total: 0, imported: 0, duplicates: 0, failed: 1, invalid: 0 } });
    } finally { setImportLoading(false); }
  };

  // ========== STATUS CHECK (nur Einzelprüfung) ==========
  const checkSingleItem = async () => {
    if (!singleUrl) { toast('Bitte URL eingeben', 'error'); return; }
    setStatusLoading(true);
    try {
      const res = await fetch('/api/vinted', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'single', url: singleUrl }) });
      const data = await res.json();
      setSingleResult(data);
      if (data.status === 'sold') toast('Item ist VERKAUFT!', 'error');
      else if (data.status === 'available') toast('Item ist verfügbar', 'success');
    } catch (e) { toast('Fehler', 'error'); }
    finally { setStatusLoading(false); }
  };

  // ========== JSON MERGE ==========
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
          uniqueItems.push(item);
        }
      }

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

  // ========== RENDER ==========
  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-[#FF4400]/30 pb-4">
        <button onClick={() => setActiveSubTab('import')} className={`px-4 py-2 text-xs uppercase font-bold ${activeSubTab === 'import' ? 'bg-green-600 text-white' : 'border border-green-600/30 text-green-500'}`}><Upload className="w-4 h-4 inline mr-1"/>JSON Import</button>
        <button onClick={() => setActiveSubTab('status')} className={`px-4 py-2 text-xs uppercase font-bold ${activeSubTab === 'status' ? 'bg-blue-600 text-white' : 'border border-blue-600/30 text-blue-500'}`}><Search className="w-4 h-4 inline mr-1"/>Status Check</button>
        <button onClick={() => setActiveSubTab('merge')} className={`px-4 py-2 text-xs uppercase font-bold ${activeSubTab === 'merge' ? 'bg-purple-600 text-white' : 'border border-purple-600/30 text-purple-500'}`}><Merge className="w-4 h-4 inline mr-1"/>JSON Merge</button>
        <button onClick={() => setActiveSubTab('clean')} className={`px-4 py-2 text-xs uppercase font-bold ${activeSubTab === 'clean' ? 'bg-red-600 text-white' : 'border border-red-600/30 text-red-500'}`}><AlertTriangle className="w-4 h-4 inline mr-1"/>Auto Clean</button>
      </div>

      {/* Auto-Remove Modus wurde entfernt, da nicht mehr benötigt */}

      {/* JSON IMPORT TAB */}
      {activeSubTab === 'import' && (
        <div className="bg-[#111] border border-green-500/30 p-6 space-y-4">
          <h3 className="text-lg font-bold text-green-400 flex items-center gap-2"><Upload className="w-5 h-5"/>JSON Import (Vinted Extension)</h3>
          <div className="border border-dashed border-green-500/50 p-6 text-center">
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden"/>
            {!uploadedFile ? (<div className="space-y-3"><p className="text-gray-400 text-sm">Exportiere die JSON-Datei mit der Chrome Extension</p><button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-green-600 text-white text-sm font-bold uppercase">📁 JSON-Datei auswählen</button></div>) : (<div className="space-y-3"><div className="flex items-center justify-center gap-2 text-green-400"><CheckCircle className="w-6 h-6"/><span className="font-mono text-sm">{uploadedFile.name}</span><button onClick={() => { setUploadedFile(null); setImportResult(null); }} className="text-gray-500 hover:text-red-400">×</button></div><button onClick={processImport} disabled={importLoading} className="px-6 py-3 bg-[#FF4400] text-white text-sm font-bold uppercase">{importLoading ? '⏳ Importiere...' : '📥 In Datenbank importieren'}</button></div>)}
          </div>
          {importLoading && importResult && importResult.current !== undefined && (<div className="space-y-2"><div className="w-full bg-gray-800 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${(importResult.current / importResult.total) * 100}%` }}/></div><p className="text-xs text-gray-600 text-center">{importResult.current} / {importResult.total} · ✅ {importResult.success || 0} · ⏭️ {importResult.duplicates || 0} · ❌ {importResult.failed || 0}</p></div>)}
          {importResult && importResult.summary && <ResultDisplay result={importResult} />}
        </div>
      )}

      {/* STATUS CHECK TAB (nur Einzelprüfung) */}
      {activeSubTab === 'status' && (
        <div className="bg-[#111] border border-blue-500/30 p-6 space-y-3">
          <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2"><Search className="w-5 h-5"/>Einzelnes Item prüfen</h3>
          <div className="flex gap-2">
            <input type="text" placeholder="https://www.vinted.de/items/..." value={singleUrl} onChange={e => setSingleUrl(e.target.value)} className="flex-1 bg-[#1A1A1A] border border-blue-500/30 px-4 py-3 text-sm"/>
            <button onClick={checkSingleItem} disabled={statusLoading} className="px-5 py-3 bg-blue-600 text-white text-xs font-bold uppercase">🔍 Check</button>
          </div>
          {singleResult && (
            <div className={`p-4 border text-sm rounded ${singleResult.status === 'available' ? 'border-green-500/50 bg-green-950/20' : 'border-red-500/50 bg-red-950/20'}`}>
              <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-green-500 text-white">{singleResult.status}</span>
              {singleResult.name && <span className="ml-2">{singleResult.name}</span>}
            </div>
          )}
        </div>
      )}

      {/* JSON MERGE TAB */}
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

      {/* AUTO CLEAN TAB */}
      {activeSubTab === 'clean' && <AutoCleanTool toast={toast} confirm={confirm} />}
    </div>
  );
}
