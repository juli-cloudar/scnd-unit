// src/app/admin/tabs/AnalyticsMarketingTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, Tag, Calendar, Package, DollarSign, 
  BarChart3, PieChart, Download, Copy, Check,
  Instagram, Facebook, Twitter, Hash, Sparkles,
  Zap, TrendingDown, Award, Clock, ShoppingBag
} from 'lucide-react';
import { ToastType } from '../hooks/useToast';

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: string;
  size: string;
  condition: string;
  images: string[];
  vinted_url: string;
  sold: boolean;
  created_at: string;
}

interface Employee {
  id: number;
  username: string;
  permissions: { canViewStats: boolean; };
}

// ============================================================
// SUB-COMPONENT: Profit Dashboard
// ============================================================
function ProfitDashboard({ products, toast }: { products: Product[]; toast: (msg: string, type?: ToastType) => void }) {
  const [purchasePrices, setPurchasePrices] = useState<Record<number, number>>({});
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadPurchasePrices();
  }, []);

  const loadPurchasePrices = async () => {
    const { data } = await supabase.from('product_purchase_prices').select('product_id, purchase_price');
    if (data) {
      const prices: Record<number, number> = {};
      data.forEach((p: any) => { prices[p.product_id] = p.purchase_price; });
      setPurchasePrices(prices);
    }
  };

  const savePurchasePrice = async (productId: number, price: number) => {
    const { error } = await supabase.from('product_purchase_prices').upsert({
      product_id: productId,
      purchase_price: price,
      updated_at: new Date().toISOString()
    });
    if (!error) {
      setPurchasePrices({ ...purchasePrices, [productId]: price });
      toast('Einkaufspreis gespeichert', 'success');
    }
  };

  const soldProducts = products.filter(p => p.sold === true);
  
  const totalRevenue = soldProducts.reduce((sum, p) => sum + parseFloat(p.price.replace('€', '').trim()), 0);
  const totalCost = soldProducts.reduce((sum, p) => sum + (purchasePrices[p.id] || 0), 0);
  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  
  const profitByBrand: Record<string, { revenue: number; cost: number; profit: number }> = {};
  soldProducts.forEach(p => {
    const brand = p.brand || 'Unbekannt';
    const revenue = parseFloat(p.price.replace('€', '').trim());
    const cost = purchasePrices[p.id] || 0;
    if (!profitByBrand[brand]) profitByBrand[brand] = { revenue: 0, cost: 0, profit: 0 };
    profitByBrand[brand].revenue += revenue;
    profitByBrand[brand].cost += cost;
    profitByBrand[brand].profit = profitByBrand[brand].revenue - profitByBrand[brand].cost;
  });

  const topBrands = Object.entries(profitByBrand)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 text-sm">Umsatz</div>
          <div className="text-2xl font-bold text-green-500">{totalRevenue.toFixed(2)}€</div>
        </div>
        <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 text-sm">Einkauf</div>
          <div className="text-2xl font-bold text-red-500">{totalCost.toFixed(2)}€</div>
        </div>
        <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 text-sm">Gewinn</div>
          <div className="text-2xl font-bold text-[#FF4400]">{totalProfit.toFixed(2)}€</div>
        </div>
        <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 text-sm">Marge</div>
          <div className="text-2xl font-bold text-blue-400">{profitMargin.toFixed(1)}%</div>
        </div>
      </div>

      <div className="bg-[#1A1A1A] rounded-lg border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 font-bold">Profit nach Marke</div>
        <div className="divide-y divide-gray-800">
          {topBrands.map(brand => (
            <div key={brand.name} className="p-4 flex justify-between items-center">
              <span className="font-medium">{brand.name}</span>
              <div className="flex gap-6">
                <span className="text-gray-400">Umsatz: {brand.revenue.toFixed(2)}€</span>
                <span className="text-red-400">Einkauf: {brand.cost.toFixed(2)}€</span>
                <span className="text-[#FF4400] font-bold">+{brand.profit.toFixed(2)}€</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#1A1A1A] rounded-lg border border-gray-800">
        <div className="p-4 border-b border-gray-800 font-bold">Einkaufspreise eingeben</div>
        <div className="divide-y divide-gray-800 max-h-80 overflow-y-auto">
          {soldProducts.slice(0, 20).map(product => (
            <div key={product.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium truncate max-w-md">{product.name}</p>
                <p className="text-sm text-gray-400">Verkauf: {product.price}</p>
              </div>
              <div className="flex gap-2">
                {editingProduct === product.id ? (
                  <>
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-24 bg-[#0A0A0A] border border-gray-700 rounded px-2 py-1 text-sm"
                      placeholder="Einkauf"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        const price = parseFloat(editValue);
                        if (!isNaN(price)) {
                          savePurchasePrice(product.id, price);
                        }
                        setEditingProduct(null);
                        setEditValue('');
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={() => setEditingProduct(null)}
                      className="px-3 py-1 bg-gray-700 rounded text-sm"
                    >
                      Abbrechen
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-gray-400">
                      Einkauf: {purchasePrices[product.id] ? `${purchasePrices[product.id]}€` : '—'}
                    </span>
                    <button
                      onClick={() => {
                        setEditingProduct(product.id);
                        setEditValue(purchasePrices[product.id]?.toString() || '');
                      }}
                      className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
                    >
                      Bearbeiten
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: Social Media Content Generator
// ============================================================
function SocialMediaGenerator({ products, toast }: { products: Product[]; toast: (msg: string, type?: ToastType) => void }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'facebook' | 'tiktok'>('instagram');

  const availableProducts = products.filter(p => !p.sold);

  const generateCaption = (product: Product) => {
    const hashtags = [
      `#${product.brand.replace(/\s/g, '')}`,
      '#Vintage', '#Streetwear', '#Y2K', '#Gorpcore',
      '#VintageFashion', '#SecondHand', '#SustainableFashion',
      '#SCNDUNIT', '#BadKreuznach'
    ].join(' ');

    const captions = {
      instagram: `🔥 NEU IM SHOP 🔥\n\n${product.brand} - ${product.name}\n📏 Größe: ${product.size}\n💚 Zustand: ${product.condition}\n💰 Preis: ${product.price}\n\n👉 Jetzt shoppen: scnd-unit.vercel.app\n\n${hashtags}`,
      facebook: `NEUER ARTIKEL\n\nMarke: ${product.brand}\nName: ${product.name}\nGröße: ${product.size}\nZustand: ${product.condition}\nPreis: ${product.price}\n\nMehr auf scnd-unit.vercel.app`,
      tiktok: `POV: Vintage Fund in Bad Kreuznach 🔥\n\n${product.brand} ${product.name}\nSize ${product.size}\n${product.price}€\n\n#scndunit #vintage #streetwear`
    };
    return captions[selectedPlatform];
  };

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast(`${type} kopiert`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1A1A1A] rounded-lg border border-gray-800 p-4">
        <label className="block text-sm font-bold mb-2">Produkt auswählen</label>
        <select
          className="w-full bg-[#0A0A0A] border border-gray-700 rounded-lg px-4 py-2"
          value={selectedProduct?.id || ''}
          onChange={(e) => {
            const product = availableProducts.find(p => p.id === parseInt(e.target.value));
            setSelectedProduct(product || null);
          }}
        >
          <option value="">-- Produkt auswählen --</option>
          {availableProducts.map(p => (
            <option key={p.id} value={p.id}>{p.brand} {p.name} - {p.price}</option>
          ))}
        </select>
      </div>

      {selectedProduct && (
        <>
          <div className="flex gap-2">
            {(['instagram', 'facebook', 'tiktok'] as const).map(platform => (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`px-4 py-2 rounded-lg text-sm font-bold uppercase flex items-center gap-2 ${
                  selectedPlatform === platform 
                    ? 'bg-[#FF4400] text-white' 
                    : 'bg-[#1A1A1A] border border-gray-700 text-gray-400'
                }`}
              >
                {platform === 'instagram' && <Instagram className="w-4 h-4" />}
                {platform === 'facebook' && <Facebook className="w-4 h-4" />}
                {platform === 'tiktok' && <TrendingUp className="w-4 h-4" />}
                {platform}
              </button>
            ))}
          </div>

          <div className="bg-[#1A1A1A] rounded-lg border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800 font-bold flex items-center justify-between">
              <span>Vorschau</span>
              <button
                onClick={() => copyToClipboard(generateCaption(selectedProduct), 'Text')}
                className="px-3 py-1 bg-[#FF4400] rounded text-sm flex items-center gap-1"
              >
                {copied === 'Text' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                Kopieren
              </button>
            </div>
            <div className="p-4 whitespace-pre-wrap font-mono text-sm">
              {generateCaption(selectedProduct)}
            </div>
          </div>

          <div className="bg-[#1A1A1A] rounded-lg border border-gray-800 p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold">Hashtags</span>
              <button
                onClick={() => copyToClipboard('#Vintage #Streetwear #Y2K #SCNDUNIT', 'Hashtags')}
                className="px-3 py-1 bg-gray-700 rounded text-sm flex items-center gap-1"
              >
                {copied === 'Hashtags' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                Alle kopieren
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {['#Vintage', '#Streetwear', '#Y2K', '#Gorpcore', '#SCNDUNIT', '#BadKreuznach', '#VintageFashion'].map(h => (
                <span key={h} className="px-2 py-1 bg-[#0A0A0A] rounded text-sm text-[#FF4400]">{h}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: Brand Analytics (früher Analytics)
// ============================================================
function BrandAnalytics({ products }: { products: Product[] }) {
  const soldProducts = products.filter(p => p.sold === true);
  const availableProducts = products.filter(p => !p.sold);

  const sizeStats: Record<string, { sold: number; available: number }> = {};
  products.forEach(p => {
    const size = p.size || 'Unknown';
    if (!sizeStats[size]) sizeStats[size] = { sold: 0, available: 0 };
    if (p.sold) sizeStats[size].sold++;
    else sizeStats[size].available++;
  });

  const priceRanges = [
    { min: 0, max: 20, name: '0-20€', sold: 0, available: 0 },
    { min: 20, max: 40, name: '20-40€', sold: 0, available: 0 },
    { min: 40, max: 60, name: '40-60€', sold: 0, available: 0 },
    { min: 60, max: 100, name: '60-100€', sold: 0, available: 0 },
    { min: 100, max: 999, name: '100€+', sold: 0, available: 0 },
  ];

  products.forEach(p => {
    const price = parseFloat(p.price.replace('€', '').trim());
    const range = priceRanges.find(r => price >= r.min && price < r.max);
    if (range) {
      if (p.sold) range.sold++;
      else range.available++;
    }
  });

  const categoryStats: Record<string, { sold: number; available: number }> = {};
  products.forEach(p => {
    const cat = p.category || 'Sonstiges';
    if (!categoryStats[cat]) categoryStats[cat] = { sold: 0, available: 0 };
    if (p.sold) categoryStats[cat].sold++;
    else categoryStats[cat].available++;
  });

  const brandStats = Object.entries(
    products.reduce((acc, p) => {
      const brand = p.brand || 'Unbekannt';
      if (!acc[brand]) acc[brand] = { total: 0, sold: 0 };
      acc[brand].total++;
      if (p.sold) acc[brand].sold++;
      return acc;
    }, {} as Record<string, { total: number; sold: number }>)
  ).map(([brand, data]) => ({
    brand,
    total: data.total,
    sold: data.sold,
    sellThroughRate: (data.sold / data.total) * 100
  })).sort((a, b) => b.sellThroughRate - a.sellThroughRate).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
          <div className="text-gray-400 text-sm">Verfügbar</div>
          <div className="text-2xl font-bold text-green-500">{availableProducts.length}</div>
        </div>
        <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
          <div className="text-gray-400 text-sm">Verkauft</div>
          <div className="text-2xl font-bold text-[#FF4400]">{soldProducts.length}</div>
        </div>
        <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
          <div className="text-gray-400 text-sm">Verkaufsquote</div>
          <div className="text-2xl font-bold text-blue-400">
            {products.length > 0 ? ((soldProducts.length / products.length) * 100).toFixed(1) : 0}%
          </div>
        </div>
        <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
          <div className="text-gray-400 text-sm">Gesamt</div>
          <div className="text-2xl font-bold">{products.length}</div>
        </div>
      </div>

      <div className="bg-[#1A1A1A] rounded-lg border border-gray-800">
        <div className="p-4 border-b border-gray-800 font-bold">Beste Marken (Verkaufsquote)</div>
        <div className="divide-y divide-gray-800">
          {brandStats.map(brand => (
            <div key={brand.brand} className="p-4 flex justify-between items-center">
              <span className="font-medium">{brand.brand}</span>
              <div className="flex gap-6 text-sm">
                <span className="text-gray-400">{brand.sold}/{brand.total}</span>
                <span className="text-[#FF4400] font-bold">{brand.sellThroughRate.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1A1A1A] rounded-lg border border-gray-800">
          <div className="p-4 border-b border-gray-800 font-bold">Größen Performance</div>
          <div className="divide-y divide-gray-800">
            {Object.entries(sizeStats).map(([size, stats]) => (
              <div key={size} className="p-4 flex justify-between items-center">
                <span className="font-medium">Größe {size}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-500">{stats.available} verfügbar</span>
                  <span className="text-[#FF4400]">{stats.sold} verkauft</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1A1A1A] rounded-lg border border-gray-800">
          <div className="p-4 border-b border-gray-800 font-bold">Preisspannen Performance</div>
          <div className="divide-y divide-gray-800">
            {priceRanges.map(range => (
              <div key={range.name} className="p-4 flex justify-between items-center">
                <span className="font-medium">{range.name}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-500">{range.available} verfügbar</span>
                  <span className="text-[#FF4400]">{range.sold} verkauft</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#1A1A1A] rounded-lg border border-gray-800">
        <div className="p-4 border-b border-gray-800 font-bold">Kategorien Performance</div>
        <div className="divide-y divide-gray-800">
          {Object.entries(categoryStats).map(([cat, stats]) => (
            <div key={cat} className="p-4 flex justify-between items-center">
              <span className="font-medium">{cat}</span>
              <div className="flex gap-4 text-sm">
                <span className="text-green-500">{stats.available} verfügbar</span>
                <span className="text-[#FF4400]">{stats.sold} verkauft</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HAUPT-COMPONENT
// ============================================================
export function AnalyticsMarketingTab({ user, toast }: { user: Employee | null, toast: (msg: string, type?: ToastType) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'profit' | 'social' | 'brand'>('profit');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) setProducts(data);
    setLoading(false);
  };

  if (!user?.permissions.canViewStats) {
    return <div className="text-center py-20 text-gray-500">Keine Berechtigung für diese Ansicht.</div>;
  }

  return (
    <div>
      {/* Sub-Tabs */}
      <div className="flex gap-2 border-b border-gray-800 mb-6">
        <button
          onClick={() => setSubTab('profit')}
          className={`px-4 py-2 text-sm font-bold uppercase flex items-center gap-2 ${
            subTab === 'profit' ? 'text-[#FF4400] border-b-2 border-[#FF4400]' : 'text-gray-500'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Profit Dashboard
        </button>
        <button
          onClick={() => setSubTab('social')}
          className={`px-4 py-2 text-sm font-bold uppercase flex items-center gap-2 ${
            subTab === 'social' ? 'text-[#FF4400] border-b-2 border-[#FF4400]' : 'text-gray-500'
          }`}
        >
          <Instagram className="w-4 h-4" /> Social Media
        </button>
        <button
          onClick={() => setSubTab('brand')}
          className={`px-4 py-2 text-sm font-bold uppercase flex items-center gap-2 ${
            subTab === 'brand' ? 'text-[#FF4400] border-b-2 border-[#FF4400]' : 'text-gray-500'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Brand Analytics
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Lade Daten...</div>
      ) : (
        <>
          {subTab === 'profit' && <ProfitDashboard products={products} toast={toast} />}
          {subTab === 'social' && <SocialMediaGenerator products={products} toast={toast} />}
          {subTab === 'brand' && <BrandAnalytics products={products} />}
        </>
      )}
    </div>
  );
}
