import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Save, ImagePlus, Trash2, Package, X } from "lucide-react";
import { logActivity } from "../utils/helpers";
import { ToastType } from "../hooks/useToast";

interface Employee {
  id: number; username: string;
  permissions: { canAddProducts: boolean; };
}

const PRODUCT_CATEGORIES = [
  'Jacken', 'Pullover', 'Sweatshirts', 'Tops', 'Hemden',
  'Headwear', 'Polos', 'Taschen', 'Sonstiges'
];

const CONDITIONS = [
  'Neu mit Etikett',
  'Neu ohne Etikett',
  'Sehr gut',
  'Gut',
  'Zufriedenstellend',
  'Schlecht'
];

export function AddTab({ user, toast, onProductAdded }: { user: Employee | null, toast: (msg: string, type?: ToastType) => void, onProductAdded: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'Sweatshirts',
    price: '',
    size: '',
    condition: 'Gut',
    vinted_url: '',
    images: [] as string[]
  });
  const [newImageUrl, setNewImageUrl] = useState('');

  const addImage = () => {
    if (newImageUrl.trim() && !formData.images.includes(newImageUrl.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()]
      }));
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { toast('Bitte gib einen Produktnamen ein', 'error'); return; }
    if (!formData.price) { toast('Bitte gib einen Preis ein', 'error'); return; }
    if (formData.images.length === 0) { toast('Bitte füge mindestens ein Bild hinzu', 'error'); return; }
    
    // Prüfen ob URL bereits existiert (wenn eingegeben)
    if (formData.vinted_url) {
      const { data: existing } = await supabase.from('products').select('id, name').eq('vinted_url', formData.vinted_url).maybeSingle();
      if (existing) { toast(`❌ Artikel existiert bereits! (ID: ${existing.id})`, 'error'); return; }
    }
    
    const newProduct = { 
      name: formData.name.trim(), 
      brand: formData.brand.trim() || 'Unbekannt',
      category: formData.category, 
      price: `${formData.price.replace(/€/g, '').replace(',', '.').trim()} €`, 
      size: formData.size.trim() || '–', 
      condition: formData.condition, 
      images: formData.images, 
      vinted_url: formData.vinted_url.trim(), 
      sold: false,
      created_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from('products').insert(newProduct);
    if (error) { 
      toast('Fehler: ' + error.message, 'error'); 
    } else { 
      toast('✅ Produkt gespeichert!'); 
      logActivity(user?.id || 0, user?.username || 'Admin', 'Produkt hinzugefügt', `"${newProduct.name}"`); 
      // Formular zurücksetzen
      setFormData({ 
        name: '', brand: '', category: 'Sweatshirts', price: '', 
        size: '', condition: 'Gut', vinted_url: '', images: [] 
      }); 
      onProductAdded(); 
    } 
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Package className="w-5 h-5 text-[#FF4400]" />
        <h2 className="text-xl font-bold uppercase tracking-tighter">
          NEUES <span className="text-[#FF4400]">PRODUKT</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Linke Spalte: Bilder */}
        <div className="bg-[#111] border border-[#FF4400]/20 p-4">
          <label className="text-xs uppercase text-[#FF4400] block mb-2">
            BILDER ({formData.images.length})
          </label>
          
          {/* Bild-Übersicht */}
          {formData.images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {formData.images.map((img, i) => (
                <div key={i} className="relative aspect-square bg-[#1A1A1A] rounded-sm overflow-hidden group">
                  <img 
                    src={img.includes('vinted') ? `/api/image-proxy?url=${encodeURIComponent(img)}` : img} 
                    alt={`Bild ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-[3/4] bg-[#1A1A1A] flex items-center justify-center text-gray-600 rounded-sm mb-4">
              Keine Bilder
            </div>
          )}

          {/* Bild hinzufügen */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Vinted Bild-URL einfügen"
              className="flex-1 bg-[#1A1A1A] border border-[#FF4400]/30 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#FF4400]"
            />
            <button
              onClick={addImage}
              className="px-4 py-2 bg-[#FF4400]/20 border border-[#FF4400]/30 text-[#FF4400] text-sm font-bold uppercase rounded-sm hover:bg-[#FF4400]/30 transition-colors"
            >
              <ImagePlus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tipp: Klicke auf ein Vinted-Bild → Rechtsklick → Bildadresse kopieren
          </p>
        </div>

        {/* Rechte Spalte: Produktdaten */}
        <div className="bg-[#111] border border-[#FF4400]/20 p-4">
          <label className="text-xs uppercase text-[#FF4400] block mb-4">
            PRODUKTDATEN
          </label>
          
          <div className="space-y-4">
            <input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Produktname *"
              className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-[#FF4400]"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <input
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
                placeholder="Marke"
                className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm rounded-sm"
              />
              <input
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="Preis in € *"
                className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm rounded-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm rounded-sm"
              >
                {PRODUCT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <input
                value={formData.size}
                onChange={(e) => setFormData({...formData, size: e.target.value})}
                placeholder="Größe (z.B. M, L, 36/8)"
                className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm rounded-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <select
                value={formData.condition}
                onChange={(e) => setFormData({...formData, condition: e.target.value})}
                className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm rounded-sm"
              >
                {CONDITIONS.map(cond => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
              
              <input
                value={formData.vinted_url}
                onChange={(e) => setFormData({...formData, vinted_url: e.target.value})}
                placeholder="Vinted URL (optional)"
                className="w-full bg-[#1A1A1A] border border-[#FF4400]/30 px-4 py-3 text-sm rounded-sm"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full py-4 bg-[#FF4400] text-white text-sm font-bold uppercase rounded-sm hover:bg-[#FF4400]/80 transition-colors mt-4"
            >
              <Save className="w-4 h-4 inline mr-2" />
              PRODUKT SPEICHERN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
