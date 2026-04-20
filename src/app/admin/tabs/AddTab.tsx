import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Wand2 } from "lucide-react";
import { proxyImg, logActivity } from "../utils/helpers";
import { ToastType } from "../hooks/useToast";

interface Employee {
  id: number; username: string;
  permissions: { canAddProducts: boolean; };
}

export function AddTab({ user, toast, onProductAdded }: { user: Employee | null, toast: (msg: string, type?: ToastType) => void, onProductAdded: () => void }) {
  const [url, setUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [formData, setFormData] = useState({ name: '', brand: '', category: 'Jacken', price: '', size: '', condition: 'Gut', vinted_url: '', images: [] as string[] });

  const scrapeVinted = async () => {
    if (!url.includes('vinted')) { toast('Bitte gültige Vinted URL', 'error'); return; }
    setIsScraping(true);
    try {
      const { data: existing } = await supabase.from('products').select('id, name').eq('vinted_url', url).maybeSingle();
      if (existing) { toast(`⚠️ Artikel existiert bereits: "${existing.name}" (ID: ${existing.id})`, 'error'); setIsScraping(false); return; }
      
      const res = await fetch('/api/vinted', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'single', url }) });
      const data = await res.json();
      if (res.ok && data) { 
        setFormData({ 
          name: data.name || '', 
          brand: data.brand || '',
          category: data.category || 'Jacken', 
          price: (data.price || '').replace(/^€/, ''), 
          size: data.size || '', 
          condition: data.condition || 'Gut', 
          vinted_url: url, 
          images: data.images || [] 
        }); 
        toast('✅ Daten geladen'); 
      } else { 
        toast('Keine Daten gefunden', 'error'); 
      }
    } catch (e) { 
      toast('Scraping Fehler', 'error'); 
    }
    setIsScraping(false);
  };

  const handleSave = async () => {
    if (!formData.name) { toast('Name fehlt!', 'error'); return; }
    if (!formData.price) { toast('Preis fehlt!', 'error'); return; }
    if (formData.images.length === 0) { toast('Mindestens 1 Bild!', 'error'); return; }
    if (!formData.vinted_url) { toast('Vinted URL fehlt!', 'error'); return; }
    
    const { data: existing } = await supabase.from('products').select('id, name').eq('vinted_url', formData.vinted_url).maybeSingle();
    if (existing) { toast(`❌ Artikel existiert bereits! (ID: ${existing.id})`, 'error'); return; }
    
    const newProduct = { 
      name: formData.name, 
      brand: formData.brand || 'Sonstige',
      category: formData.category, 
      price: `${formData.price.replace(/€/g, '').trim()} €`, 
      size: formData.size || '–', 
      condition: formData.condition, 
      images: formData.images, 
      vinted_url: formData.vinted_url, 
      sold: false 
    };
    
    const { error } = await supabase.from('products').insert(newProduct);
    if (error) { 
      toast('Fehler: ' + error.message, 'error'); 
    } else { 
      toast('✅ Produkt gespeichert!'); 
      logActivity(user?.id || 0, user?.username || 'Admin', 'Produkt hinzugefügt', `"${newProduct.name}"`); 
      setFormData({ name: '', brand: '', category: 'Jacken', price: '', size: '', condition: 'Gut', vinted_url: '', images: [] }); 
      setUrl(''); 
      onProductAdded(); 
    } 
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#111] border border-[#FF4400]/20 p-4">
        <label className="text-xs uppercase text-[#FF4400] block mb-2">Vinted URL</label>
        <div className="flex gap-2">
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.vinted.de/items/..." className="flex-1 bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"/>
          <button onClick={scrapeVinted} disabled={isScraping} className="px-6 py-3 bg-[#FF4400] text-white text-xs font-bold uppercase">{isScraping ? '...' : 'Auto-Fill'}</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111] border border-[#FF4400]/20 p-4">
          <label className="text-xs uppercase text-[#FF4400] block mb-2">Bilder ({formData.images.length})</label>
          {formData.images.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {formData.images.map((img, i) => (
                <div key={i} className="relative aspect-square">
                  <img src={proxyImg(img)} className="w-full h-full object-cover"/>
                  <button onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, idx) => idx !== i)}))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs">×</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-[3/4] bg-[#1A1A1A] flex items-center justify-center text-gray-600">Keine Bilder</div>
          )}
        </div>
        <div className="bg-[#111] border border-[#FF4400]/20 p-4 space-y-4">
          <label className="text-xs uppercase text-[#FF4400] block">Produktdaten</label>
          <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Name" className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"/>
          <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="Marke" className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"/>
          <div className="grid grid-cols-2 gap-4">
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm">
              <option>Jacken</option><option>Pullover</option><option>Sweatshirts</option><option>Tops</option><option>Hemden</option><option>Headwear</option><option>Taschen</option><option>Sonstiges</option>
            </select>
            <input value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Preis" className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} placeholder="Größe" className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"/>
            <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm">
              <option>Neu</option><option>Sehr gut</option><option>Gut</option><option>Zufriedenstellend</option>
            </select>
          </div>
          <input value={formData.vinted_url} onChange={e => setFormData({...formData, vinted_url: e.target.value})} placeholder="Vinted URL" className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm"/>
          <button onClick={handleSave} className="w-full py-4 bg-[#FF4400] text-white text-sm font-bold uppercase">Speichern</button>
        </div>
      </div>
    </div>
  );
}
