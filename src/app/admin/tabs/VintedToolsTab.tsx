import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { RefreshCw, AlertTriangle, CheckCircle, Upload, Search } from "lucide-react";
import { ResultDisplay } from "../components/ResultDisplay";
import { AutoCleanTool } from "@/components/AutoCleanTool";
import { ToastType } from "../hooks/useToast";

interface Employee {
  id: number; username: string;
  permissions: { canAddProducts: boolean; };
}

export function VintedToolsTab({ user, toast, confirm }: { user: Employee | null, toast: (msg: string, type?: ToastType) => void, confirm: (msg: string, onConfirm: () => void) => void }) {
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
          else if (titleLower.includes('cap') || titleLower.includes('hat') || titleLower.includes('mütze') || titleLower.includes('kopf') || titleLower.includes('headwear'))  category = 'Headwear';
          else if (titleLower.includes('tasche') || titleLower.includes('bag') || titleLower.includes('rucksack') || titleLower.includes('tote'))  category = 'Taschen';
          else if (titleLower.includes('jacke') || titleLower.includes('jacket') || titleLower.includes('weste')) category = 'Jacken';
          else if (titleLower.includes('pullover') || titleLower.includes('sweater') || titleLower.includes('fleece')) category = 'Pullover';
          else if (titleLower.includes('sweatshirt') || titleLower.includes('crewneck') || titleLower.includes('hoodie')) category = 'Sweatshirts';
          else if (titleLower.includes('top') || titleLower.includes('shirt') || titleLower.includes('polo')) category = 'Tops';

          let photoUrls: string[] = [];
          
          // 1. Versuche "All Photos"
          const allPhotos = item['All Photos'] || item['all_photos'] || '';
          if (allPhotos && typeof allPhotos === 'string') {
            if (allPhotos.includes(' || ')) {
              photoUrls = allPhotos.split(' || ').filter((p: string) => p.startsWith('http'));
            } else if (allPhotos.startsWith('http')) {
              photoUrls = [allPhotos];
            }
          }
          
          // 2. Fallback: Item Photo 1-5
          if (photoUrls.length === 0) {
            for (let p = 1; p <= 10; p++) {
              const photo = item[`Item Photo ${p}`];
              if (photo && typeof photo === 'string' && photo.startsWith('http') && photo !== 'Not Available') {
                photoUrls.push(photo);
              }
            }
          }
          
          // ⭐⭐⭐ WICHTIG: Entferne Query-Parameter (?s=...) ⭐⭐⭐

          
          // Debug
          if (photoUrls.length === 0) {
            console.log(`⚠️ KEINE BILDER für: ${title.substring(0, 40)}`);
          } else {
            console.log(`📸 ${title.substring(0, 40)} → ${photoUrls.length} Bilder`);
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

  const checkAllStatus = async () => {
    setStatusLoading(true);
    try {
      const { data: products } = await supabase.from('products').select('*').eq('sold', false);
      if (!products || products.length === 0) { toast('Keine aktiven Produkte', 'info'); setStatusLoading(false); return; }
      setStatusProgress({ current: 0, total: products.length });
      const soldItems: any[] = [];
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        try {
          const res = await fetch('/api/vinted', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'single', url: product.vinted_url }) });
          const data = await res.json();
          if (data.status === 'sold') { soldItems.push(product); if (autoRemove) await supabase.from('products').update({ sold: true }).eq('id', product.id); }
        } catch (err) {}
        setStatusProgress(prev => ({ ...prev, current: i + 1 }));
        await new Promise(r => setTimeout(r, 500));
      }
      setStatusResult({ summary: { total: products.length, available: products.length - soldItems.length, sold: soldItems.length }, soldItems: soldItems.map(s => ({ name: s.name, url: s.vinted_url })) });
      toast(`Fertig: ${soldItems.length} verkauft`, 'success');
    } catch (e) { toast('Fehler', 'error'); }
    finally { setStatusLoading(false); setStatusProgress({ current: 0, total: 0 }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-[#FF4400]/30 pb-4">
        <button onClick={() => setActiveSubTab('import')} className={`px-4 py-2 text-xs uppercase font-bold ${activeSubTab === 'import' ? 'bg-green-600 text-white' : 'border border-green-600/30 text-green-500'}`}><Upload className="w-4 h-4 inline mr-1"/>JSON Import</button>
        <button onClick={() => setActiveSubTab('status')} className={`px-4 py-2 text-xs uppercase font-bold ${activeSubTab === 'status' ? 'bg-blue-600 text-white' : 'border border-blue-600/30 text-blue-500'}`}><RefreshCw className="w-4 h-4 inline mr-1"/>Status Check</button>
        <button onClick={() => setActiveSubTab('clean')} className={`px-4 py-2 text-xs uppercase font-bold ${activeSubTab === 'clean' ? 'bg-red-600 text-white' : 'border border-red-600/30 text-red-500'}`}><AlertTriangle className="w-4 h-4 inline mr-1"/>Auto Clean</button>
      </div>
      <div className="bg-[#111] border border-red-500/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-red-500"/><div><p className="text-sm font-bold text-red-400">Auto-Remove Modus</p><p className="text-xs text-gray-500">Verkaufte Items automatisch als verkauft markieren</p></div></div>
        <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={autoRemove} onChange={e => setAutoRemove(e.target.checked)} className="sr-only peer"/><div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"/></label>
      </div>
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
      {activeSubTab === 'status' && (
        <div className="space-y-4">
          <div className="bg-[#111] border border-blue-500/30 p-6 space-y-3">
            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2"><Search className="w-5 h-5"/>Einzelnes Item prüfen</h3>
            <div className="flex gap-2"><input type="text" placeholder="https://www.vinted.de/items/..." value={singleUrl} onChange={e => setSingleUrl(e.target.value)} className="flex-1 bg-[#1A1A1A] border border-blue-500/30 px-4 py-3 text-sm"/><button onClick={checkSingleItem} disabled={statusLoading} className="px-5 py-3 bg-blue-600 text-white text-xs font-bold uppercase">🔍 Check</button></div>
            {singleResult && (<div className={`p-4 border text-sm rounded ${singleResult.status === 'available' ? 'border-green-500/50 bg-green-950/20' : 'border-red-500/50 bg-red-950/20'}`}><span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-green-500 text-white">{singleResult.status}</span>{singleResult.name && <span className="ml-2">{singleResult.name}</span>}</div>)}
          </div>
          <div className="bg-[#111] border border-blue-500/30 p-6 space-y-3">
            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2"><RefreshCw className="w-5 h-5"/>Alle Produkte prüfen</h3>
            <button onClick={checkAllStatus} disabled={statusLoading} className="w-full py-4 bg-blue-600 text-white text-sm font-bold uppercase flex items-center justify-center gap-2"><RefreshCw className={`w-5 h-5 ${statusLoading && statusProgress.total ? 'animate-spin' : ''}`}/>{statusLoading && statusProgress.total ? `Prüfe ${statusProgress.current}/${statusProgress.total}` : 'Alle Produkte checken'}</button>
            {statusLoading && statusProgress.total > 0 && (<div className="w-full bg-gray-800 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${(statusProgress.current / statusProgress.total) * 100}%` }}/></div>)}
            {statusResult && <ResultDisplay result={statusResult} />}
          </div>
        </div>
      )}
      {activeSubTab === 'clean' && <AutoCleanTool toast={toast} confirm={confirm} />}
    </div>
  );
}
