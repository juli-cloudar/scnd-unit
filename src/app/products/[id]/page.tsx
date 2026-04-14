// app/products/[id]/page.tsx
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Facebook, ShoppingBag, Instagram, Share2 } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: string;
  size: string;
  condition: string;
  description?: string;
  images: string[];
  vinted_url: string;
  ebay_url?: string;
  facebook_url?: string;
  sold: boolean;
}

async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabaseServer
    .from('products')
    .select('*')
    .eq('id', parseInt(id))
    .single();
  
  if (error || !data) return null;
  return data;
}

const proxyImg = (url: string) => {
  if (!url) return '';
  if (url.startsWith('/api/')) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  
  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5]">
      {/* Header */}
      <div className="border-b border-[#1A1A1A] sticky top-0 bg-[#0A0A0A]/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#FF4400] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm uppercase tracking-widest">Zurück zur Übersicht</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Bildergalerie */}
          <div>
            <div className="sticky top-24">
              <div className="aspect-[3/4] bg-[#1A1A1A] overflow-hidden rounded-sm">
                {product.images && product.images[0] ? (
                  <img 
                    src={proxyImg(product.images[0])} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                    Kein Bild
                  </div>
                )}
              </div>
              {/* Miniaturbilder */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {product.images.slice(0, 8).map((img, idx) => (
                    <div key={idx} className="w-20 h-20 shrink-0 bg-[#1A1A1A] overflow-hidden rounded-sm cursor-pointer hover:ring-2 hover:ring-[#FF4400] transition-all">
                      <img src={proxyImg(img)} alt={`${product.name} - Bild ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Produktinformationen */}
          <div>
            {/* Status Badge */}
            {product.sold && (
              <div className="inline-block px-3 py-1 bg-red-500 text-white text-xs uppercase tracking-widest mb-4">
                Verkauft
              </div>
            )}
            
            {/* Marke & Kategorie */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs text-gray-500 uppercase tracking-widest">{product.brand || 'Keine Marke'}</span>
              <span className="text-gray-600">•</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest">{product.category || 'Sonstiges'}</span>
            </div>

            {/* Titel */}
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{product.name}</h1>
            
            {/* Preis */}
            <div className="text-4xl font-bold text-[#FF4400] mb-6">{product.price}€</div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-[#1A1A1A] rounded-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Größe</p>
                <p className="font-medium">{product.size !== "–" ? product.size : 'Einheitsgröße'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Zustand</p>
                <p className="font-medium">{product.condition}</p>
              </div>
            </div>

            {/* Marketplaces Links */}
            <div className="space-y-3 mb-8">
              <p className="text-xs text-gray-500 uppercase tracking-widest">Verfügbar auf</p>
              
              {/* Vinted Link */}
              {product.vinted_url && (
                <a 
                  href={product.vinted_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-[#1A1A1A] border border-[#FF4400]/30 hover:border-[#FF4400] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-[#FF4400]" />
                    <div>
                      <p className="font-medium">Auf Vinted kaufen</p>
                      <p className="text-xs text-gray-500">Direkt zum Angebot</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-[#FF4400] transition-colors" />
                </a>
              )}

              {/* Facebook Marketplace (Platzhalter) */}
              {product.facebook_url ? (
                <a 
                  href={product.facebook_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-[#1A1A1A] border border-gray-700 hover:border-[#1877F2] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Facebook className="w-5 h-5 text-[#1877F2]" />
                    <div>
                      <p className="font-medium">Auf Facebook Marketplace</p>
                      <p className="text-xs text-gray-500">Zum Angebot</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-[#1877F2] transition-colors" />
                </a>
              ) : (
                <div className="p-4 bg-[#1A1A1A] border border-dashed border-gray-700 text-center opacity-50">
                  <p className="text-xs text-gray-500">Facebook Marketplace (bald verfügbar)</p>
                </div>
              )}

              {/* eBay (Platzhalter) */}
              {product.ebay_url ? (
                <a 
                  href={product.ebay_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-[#1A1A1A] border border-gray-700 hover:border-[#E53238] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-[#E53238]" />
                    <div>
                      <p className="font-medium">Auf eBay</p>
                      <p className="text-xs text-gray-500">Zum Angebot</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-[#E53238] transition-colors" />
                </a>
              ) : (
                <div className="p-4 bg-[#1A1A1A] border border-dashed border-gray-700 text-center opacity-50">
                  <p className="text-xs text-gray-500">eBay (bald verfügbar)</p>
                </div>
              )}
            </div>

            {/* Teilen Button */}
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link kopiert!');
              }}
              className="w-full py-3 border border-gray-700 text-gray-400 hover:text-[#FF4400] hover:border-[#FF4400] transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
            >
              <Share2 className="w-4 h-4" />
              Produkt teilen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
