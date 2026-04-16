'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, ExternalLink, ShoppingBag, Share2, 
  Facebook, ChevronLeft, ChevronRight
} from 'lucide-react';

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
}

const proxyImg = (url: string) => {
  if (!url) return '';
  if (url.startsWith('/api/')) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const id = parseInt(params.id as string);
        if (isNaN(id)) {
          setProduct(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setProduct(data);
      } catch (err) {
        console.error('Fehler:', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchProduct();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FF4400] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm uppercase tracking-widest">Lade...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-8xl font-bold text-[#FF4400]/20 mb-4">404</div>
          <h2 className="text-xl font-bold uppercase tracking-widest mb-4">Nicht gefunden</h2>
          <Link href="/" className="inline-block px-6 py-3 bg-[#FF4400] text-white text-sm uppercase tracking-widest">Zurück</Link>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const hasMultipleImages = images.length > 1;
  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5]">
      {/* Header - mobile optimiert */}
      <div className="border-b border-[#1A1A1A] sticky top-0 bg-[#0A0A0A]/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#FF4400] transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm uppercase tracking-widest">Zurück</span>
          </Link>
        </div>
      </div>

      {/* Main Content - mobile optimiert */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
        <div className="grid md:grid-cols-2 gap-6 md:gap-12">
          
          {/* Bildergalerie - mobile optimiert */}
          <div>
            <div className="sticky top-0 md:top-24">
              <div className="relative aspect-[3/4] bg-[#1A1A1A] overflow-hidden rounded-sm group">
                {images[currentImage] && (
                  <img src={proxyImg(images[currentImage])} alt={product.name} className="w-full h-full object-cover" />
                )}
                {hasMultipleImages && (
                  <>
                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 hover:bg-[#FF4400] transition-opacity">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 hover:bg-[#FF4400] transition-opacity">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full text-xs">
                      {currentImage + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
              {/* Thumbnails - mobile kleiner */}
              {hasMultipleImages && (
                <div className="flex gap-2 mt-3 md:mt-4 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setCurrentImage(idx)} 
                      className={`w-14 h-14 md:w-20 md:h-20 shrink-0 bg-[#1A1A1A] overflow-hidden rounded-sm transition-all ${
                        currentImage === idx ? 'ring-2 ring-[#FF4400]' : 'opacity-50 hover:opacity-100'
                      }`}
                    >
                      <img src={proxyImg(img)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Infos - mobile optimiert */}
          <div className="flex flex-col h-full px-0 md:px-0">
            
            {/* Sold Badge */}
            {product.sold && (
              <div className="inline-block px-3 py-1 bg-red-500 text-white text-xs uppercase tracking-widest mb-4 w-fit">
                Verkauft
              </div>
            )}
            
            {/* Brand & Category */}
            <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4">
              <span className="text-xs text-gray-500 uppercase tracking-widest">{product.brand || 'Keine Marke'}</span>
              <span className="text-gray-600">•</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest">{product.category || 'Sonstiges'}</span>
            </div>
            
            {/* Title - mobile kleiner */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-3 md:mb-4">
              {product.name}
            </h1>
            
            {/* Price - MIT EURO-ZEICHEN & mobile kleiner */}
            <div className="text-3xl md:text-4xl font-bold text-[#FF4400] mb-4 md:mb-6">
              {product.price}€
            </div>
            
            {/* Size & Condition - mobile weniger Padding */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8 p-3 md:p-4 bg-[#1A1A1A] rounded-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Größe</p>
                <p className="font-medium text-sm md:text-base">{product.size !== "–" ? product.size : 'Einheitsgröße'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Zustand</p>
                <p className="font-medium text-sm md:text-base">{product.condition}</p>
              </div>
            </div>

            {/* Platform Links */}
            <div className="space-y-3 mb-6 md:mb-8">
              <p className="text-xs text-gray-500 uppercase tracking-widest">Verfügbar auf</p>
              
              {/* Vinted Link */}
              <a href={product.vinted_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 md:p-4 bg-[#1A1A1A] border border-[#FF4400]/30 hover:border-[#FF4400] transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#FF4400]/10 rounded-full flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4 text-[#FF4400]" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Auf Vinted kaufen</p>
                    <p className="text-xs text-gray-500">Direkt zum Angebot</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-[#FF4400] shrink-0" />
              </a>
              
              {/* eBay - bald verfügbar */}
              <div className="flex items-center justify-between p-3 md:p-4 bg-[#1A1A1A] border border-dashed border-gray-700 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#E53238]/10 rounded-full shrink-0">
                    <ShoppingBag className="w-4 h-4 text-[#E53238] mx-auto mt-2" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Auf eBay kaufen</p>
                    <p className="text-xs text-gray-500">Bald verfügbar</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-500 shrink-0" />
              </div>
              
              {/* Facebook - bald verfügbar */}
              <div className="flex items-center justify-between p-3 md:p-4 bg-[#1A1A1A] border border-dashed border-gray-700 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1877F2]/10 rounded-full shrink-0">
                    <Facebook className="w-4 h-4 text-[#1877F2] mx-auto mt-2" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Auf Facebook Marketplace</p>
                    <p className="text-xs text-gray-500">Bald verfügbar</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-500 shrink-0" />
              </div>
            </div>

            {/* Share Button */}
            <button 
              onClick={() => { 
                navigator.clipboard.writeText(window.location.href); 
                alert('Link kopiert!'); 
              }} 
              className="w-full py-3 border border-gray-700 text-gray-400 hover:text-[#FF4400] hover:border-[#FF4400] transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest mt-auto"
            >
              <Share2 className="w-4 h-4" /> Teilen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
