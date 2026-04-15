#!/bin/bash
cd ~/scnd-unit

# Backup erstellen
cp src/app/ProductClient.tsx src/app/ProductClient.tsx.backup

# Ersetze die ImageSlider Funktion mit der korrigierten Version
sed -i '/const ImageSlider = ({ images, alt, condition }/,/^  }$/c\
const ImageSlider = ({ images, alt, condition }: { images: string[] | null | undefined, alt: string, condition: string }) => {\
  const [current, setCurrent] = useState(0)\
  const [dragStart, setDragStart] = useState<number | null>(null)\
  const [dragging, setDragging] = useState(false)\
\
  // Sicherheitscheck: Wenn keine Bilder vorhanden\
  if (!images || images.length === 0) {\
    return (\
      <div className="aspect-[3/4] md:aspect-[4/5] relative overflow-hidden bg-[#0A0A0A] flex items-center justify-center">\
        <div className="text-gray-600 text-xs">Kein Bild verfügbar</div>\
      </div>\
    )\
  }\
\
  // Stelle sicher dass current gültig ist\
  const safeIndex = current >= images.length ? 0 : current\
  const imageUrl = images[safeIndex]\
\
  // Wenn die URL leer ist\
  if (!imageUrl || imageUrl === "") {\
    return (\
      <div className="aspect-[3/4] md:aspect-[4/5] relative overflow-hidden bg-[#0A0A0A] flex items-center justify-center">\
        <div className="text-gray-600 text-xs">Bild fehlt</div>\
      </div>\
    )\
  }\
\
  const onPointerDown = (e: React.PointerEvent) => { setDragStart(e.clientX); setDragging(false) }\
  const onPointerMove = (e: React.PointerEvent) => { if (dragStart !== null && Math.abs(e.clientX - dragStart) > 8) setDragging(true) }\
  const onPointerUp = (e: React.PointerEvent) => {\
    if (dragStart === null) return\
    const diff = dragStart - e.clientX\
    if (Math.abs(diff) > 40) {\
      e.preventDefault()\
      diff > 0 ? setCurrent(c => (c + 1) % images.length) : setCurrent(c => (c - 1 + images.length) % images.length)\
    }\
    setDragStart(null)\
  }\
  const onClick = (e: React.MouseEvent) => { if (dragging) e.preventDefault() }\
\
  return (\
    <div \
      className="aspect-[3/4] md:aspect-[4/5] relative overflow-hidden bg-[#0A0A0A] cursor-grab active:cursor-grabbing select-none touch-pan-y"\
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onClick={onClick}\
    >\
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10 pointer-events-none" />\
      <img \
        src={imageUrl ? `/api/image-proxy?url=${encodeURIComponent(imageUrl)}` : ""} \
        alt={alt} \
        draggable={false} \
        className="w-full h-full object-cover transition-opacity duration-300 pointer-events-none" \
        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-image.jpg" }}\
      />\
      {condition && condition !== "–" && (\
        <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-[#0A0A0A]/80 backdrop-blur text-xs uppercase tracking-widest border border-[#FF4400] text-[#FF4400] pointer-events-none">\
          {condition}\
        </div>\
      )}\
      {images.length > 1 && (\
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">\
          {images.map((_, i) => (\
            <button \
              key={i} \
              onClick={(e) => { e.preventDefault(); setCurrent(i) }}\
              className={`rounded-full transition-all duration-200 ${i === safeIndex ? "bg-[#FF4400] w-5 h-2.5" : "bg-white/40 hover:bg-white/70 w-2.5 h-2.5"}`} \
            />\
          ))}\
        </div>\
      )}\
    </div>\
  )\
}' src/app/ProductClient.tsx
