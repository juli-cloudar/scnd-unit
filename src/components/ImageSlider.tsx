'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const proxyImg = (url: string) => {
  if (!url) return '';
  if (url.startsWith('/api/')) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

export function ImageSlider({ images, alt, condition }: { images: string[], alt: string, condition: string }) {
  const [current, setCurrent] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loaded, setLoaded] = useState<boolean[]>(() => new Array(images.length).fill(false));

  // ========== VORLADEN der nächsten Bilder (Client-seitig) ==========
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Nächstes Bild vorladen
    const nextIndex = (current + 1) % images.length;
    if (!loaded[nextIndex]) {
      const img = new window.Image();
      img.src = proxyImg(images[nextIndex]);
      img.onload = () => {
        setLoaded(prev => {
          const newLoaded = [...prev];
          newLoaded[nextIndex] = true;
          return newLoaded;
        });
      };
    }
    
    // Übernächstes Bild vorladen
    const nextNextIndex = (current + 2) % images.length;
    if (!loaded[nextNextIndex]) {
      const img2 = new window.Image();
      img2.src = proxyImg(images[nextNextIndex]);
      img2.onload = () => {
        setLoaded(prev => {
          const newLoaded = [...prev];
          newLoaded[nextNextIndex] = true;
          return newLoaded;
        });
      };
    }
  }, [current, images, loaded]);

  // ========== MOBILE: Touch-Swipe ==========
  const onPointerDown = (e: React.PointerEvent) => { 
    setDragStart(e.clientX); 
    setDragging(false); 
  };
  
  const onPointerMove = (e: React.PointerEvent) => { 
    if (dragStart !== null && Math.abs(e.clientX - dragStart) > 8) setDragging(true); 
  };
  
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStart === null) return;
    const diff = dragStart - e.clientX;
    if (Math.abs(diff) > 40) {
      e.preventDefault();
      const newIndex = diff > 0 
        ? (current + 1) % images.length 
        : (current - 1 + images.length) % images.length;
      setCurrent(newIndex);
    }
    setDragStart(null);
  };
  
  const onClick = (e: React.MouseEvent) => { 
    if (dragging) e.preventDefault(); 
  };

  // ========== PC: Hover-Buttons ==========
  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newIndex = (current + 1) % images.length;
    setCurrent(newIndex);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newIndex = (current - 1 + images.length) % images.length;
    setCurrent(newIndex);
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[3/4] md:aspect-[4/5] bg-[#1A1A1A] flex items-center justify-center text-gray-500">
        Kein Bild
      </div>
    );
  }

  const isCurrentLoaded = loaded[current];
  const currentImageUrl = proxyImg(images[current]);

  return (
    <div 
      className="aspect-[3/4] md:aspect-[4/5] relative overflow-hidden bg-[#1A1A1A] cursor-grab active:cursor-grabbing select-none touch-pan-y group"
      onPointerDown={onPointerDown} 
      onPointerMove={onPointerMove} 
      onPointerUp={onPointerUp} 
      onClick={onClick}
    >
      {/* Loading Spinner - nur wenn Bild noch nicht geladen */}
      {!isCurrentLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-[#FF4400] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Bild */}
      <img 
        src={currentImageUrl}
        alt={alt} 
        draggable={false} 
        className={`w-full h-full object-cover transition-opacity duration-300 pointer-events-none ${
          isCurrentLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => {
          setLoaded(prev => {
            const newLoaded = [...prev];
            newLoaded[current] = true;
            return newLoaded;
          });
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10 pointer-events-none" />
      
      {/* Condition Badge */}
      {condition && condition !== "–" && (
        <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-[#0A0A0A]/80 backdrop-blur text-xs uppercase tracking-widest border border-[#FF4400] text-[#FF4400] pointer-events-none">
          {condition}
        </div>
      )}
      
      {/* ========== PC: Hover-Buttons (nur auf Desktop sichtbar) ========== */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-[#FF4400] text-white p-2 rounded-full transition-all duration-200 z-30 cursor-pointer opacity-0 group-hover:opacity-100 md:flex hidden items-center justify-center"
            aria-label="Vorheriges Bild"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={nextImage}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-[#FF4400] text-white p-2 rounded-full transition-all duration-200 z-30 cursor-pointer opacity-0 group-hover:opacity-100 md:flex hidden items-center justify-center"
            aria-label="Nächstes Bild"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
      
      {/* ========== MOBILE: Dots (immer sichtbar) ========== */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
          {images.map((_, i) => (
            <button 
              key={i} 
              onClick={(e) => { 
                e.preventDefault(); 
                setCurrent(i);
              }}
              className={`rounded-full transition-all duration-200 ${i === current ? 'bg-[#FF4400] w-5 h-2.5' : 'bg-white/40 hover:bg-white/70 w-2.5 h-2.5'}`} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
