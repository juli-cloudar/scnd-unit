cat > ~/scnd-unit/src/app/admin/tabs/MultiChannelTab.tsx << 'EOF'
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Share2, Facebook, ShoppingBag, Copy, Check, 
  AlertTriangle, Image, FileText, Search, Filter,
  ExternalLink, Package
} from 'lucide-react';
import { ToastType } from '../hooks/useToast';

interface Product {
  id: number;
  name: string;
  brand: string;
  price: string;
  size: string;
  condition: string;
  images: string[];
  vinted_url: string;
  sold: boolean;
}

interface Employee {
  id: number; username: string;
  permissions: { canAddProducts: boolean; canEditProducts: boolean; };
}

export function MultiChannelTab({ user, toast }: { user: Employee | null, toast: (msg: string, type?: ToastType) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeBrand, setActiveBrand] = useState('Alle');
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Copy states
  const [copiedEbay, setCopiedEbay] = useState(false);
  const [copiedFacebook, setCopiedFacebook] = useState(false);
  const [copiedGroup, setCopiedGroup] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  // Produkte laden
  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('sold', false)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setProducts(data);
      
      // Extrahiere Marken und Kategorien
      const uniqueBrands = [...new Set(data.map(p => p.brand).filter(Boolean))].sort();
      const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))].sort();
      setBrands(uniqueBrands);
      setCategories(uniqueCategories);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Gefilterte Produkte
  const filteredProducts = products.filter(p => {
    if (activeBrand !== 'Alle' && p.brand !== activeBrand) return false;
    if (activeCategory !== 'Alle' && p.category !== activeCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brand.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Text-Generierung
  const generateEbayTitle = (product: Product) => {
    return `${product.brand} ${product.name} - Groesse ${product.size} - ${product.condition}`;
  };

  const generateEbayDescription = (product: Product) => {
    return `SCND UNIT - Vintage Streetwear

Artikel: ${product.name}
Marke: ${product.brand}
Groesse: ${product.size}
Zustand: ${product.condition}
Preis: ${product.price}

Versand innerhalb 48 Stunden.
100 Prozent Authentic - Keine Fakes.

Original Vinted Listing: ${product.vinted_url}

Bei Fragen einfach melden.`;
  };

  const generateFacebookDescription = (product: Product) => {
    return `${product.brand} ${product.name}
Groesse: ${product.size}
Zustand: ${product.condition}
Preis: ${product.price}

Versand moeglich oder Abholung in Bad Kreuznach.

Bei Interesse bitte melden.`;
  };

  const generateFacebookPost = (product: Product) => {
    return `ZUM VERKAUF

${product.brand} - ${product.name}
Groesse: ${product.size}
Zustand: ${product.condition}
Preis: ${product.price}

Versand moeglich
Abholung in Bad Kreuznach

Bei Interesse bitte melden.`;
  };

  const copyToClipboard = async (text: string, type: 'ebay' | 'facebook' | 'group' | 'image') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'ebay') {
        setCopiedEbay(true);
        setTimeout(() => setCopiedEbay(false), 2000);
        toast('eBay Beschreibung kopiert', 'success');
      } else if (type === 'facebook') {
        setCopiedFacebook(true);
        setTimeout(() => setCopiedFacebook(false), 2000);
        toast('Facebook Marketplace Beschreibung kopiert', 'success');
      } else if (type === 'group') {
        setCopiedGroup(true);
        setTimeout(() => setCopiedGroup(false), 2000);
        toast('Facebook Gruppen Text kopiert', 'success');
      } else if (type === 'image') {
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2000);
        toast('Bild-URL kopiert', 'success');
      }
    } catch (err) {
      toast('Konnte nicht kopieren', 'error');
    }
  };

  const allBrands = ['Alle', ...brands];
  const allCategories = ['Alle', ...categories];

  return (
    <div>
      {/* Kopfbereich */}
      <div className="flex items-center gap-3 mb-6">
        <Share2 className="w-6 h-6 text-[#FF4400]" />
        <h2 className="text-xl font-bold uppercase tracking-tighter">
          MULTI-CHANNEL <span className="text-[#FF4400]">PUBLISHER</span>
        </h2>
      </div>

      {/* Filterbereich */}
      <div className="mb-6 space-y-4">
        {/* Suche */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input 
            type="text" 
            placeholder="Produkt suchen..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 bg-[#1A1A1A] border border-[#FF4400]/30 text-sm rounded-sm text-white"
          />
        </div>

        {/* Filterzeile */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={activeBrand}
              onChange={(e) => setActiveBrand(e.target.value)}
              className="bg-[#1A1A1A] border border-[#FF4400]/30 rounded-sm px-3 py-1.5 text-xs"
            >
              {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-500" />
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="bg-[#1A1A1A] border border-[#FF4400]/30 rounded-sm px-3 py-1.5 text-xs"
            >
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="text-xs text-gray-500 ml-auto">
            {filteredProducts.length} Produkte verfuegbar
          </div>
        </div>
      </div>

      {/* Produktliste */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Lade Produkte...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Keine Produkte gefunden</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-[#111] border border-[#FF4400]/20 rounded-lg overflow-hidden">
              {/* Produktkopf */}
              <div className="flex gap-4 p-4 border-b border-gray-800">
                <div className="w-20 h-20 bg-[#1A1A1A] rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={product.images?.[0] ? `/api/image-proxy?url=${encodeURIComponent(product.images[0])}` : ''} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">{product.brand}</p>
                  <p className="text-sm font-bold truncate">{product.name}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    <span>Preis: {product.price}</span>
                    <span>Groesse: {product.size}</span>
                    <span>Zustand: {product.condition}</span>
                  </div>
                  <a href={product.vinted_url} target="_blank" className="text-xs text-[#FF4400] hover:underline inline-flex items-center gap-1 mt-1">
                    Vinted ansehen <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Copy Buttons */}
              <div className="p-4 space-y-2">
                {/* eBay */}
                <div className="flex items-center justify-between p-2 bg-[#1A1A1A] rounded-lg">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-bold">eBay</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(generateEbayDescription(product), 'ebay')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600/20 border border-yellow-600/30 text-yellow-500 text-xs rounded hover:bg-yellow-600/30 transition-colors"
                  >
                    {copiedEbay ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedEbay ? 'Kopiert' : 'Beschreibung kopieren'}
                  </button>
                </div>

                {/* Facebook Marketplace */}
                <div className="flex items-center justify-between p-2 bg-[#1A1A1A] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-bold">Facebook Marketplace</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(generateFacebookDescription(product), 'facebook')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 border border-blue-600/30 text-blue-500 text-xs rounded hover:bg-blue-600/30 transition-colors"
                  >
                    {copiedFacebook ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedFacebook ? 'Kopiert' : 'Beschreibung kopieren'}
                  </button>
                </div>

                {/* Facebook Gruppe */}
                <div className="flex items-center justify-between p-2 bg-[#1A1A1A] rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-bold">Facebook Gruppe Beitrag</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(generateFacebookPost(product), 'group')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 border border-green-600/30 text-green-500 text-xs rounded hover:bg-green-600/30 transition-colors"
                  >
                    {copiedGroup ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedGroup ? 'Kopiert' : 'Text kopieren'}
                  </button>
                </div>

                {/* Bild-URL */}
                {product.images && product.images[0] && (
                  <div className="flex items-center justify-between p-2 bg-[#1A1A1A] rounded-lg">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-bold">Bild-URL</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(product.images[0], 'image')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 border border-purple-600/30 text-purple-500 text-xs rounded hover:bg-purple-600/30 transition-colors"
                    >
                      {copiedImage ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedImage ? 'Kopiert' : 'URL kopieren'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
EOF

echo "✅ MultiChannelTab.tsx wurde erstellt"
