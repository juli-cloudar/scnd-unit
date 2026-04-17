// src/components/GameButton.tsx
'use client';

export function GameButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative px-3 py-2 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] border-2 border-[#FF4400] rounded-lg shadow-lg hover:shadow-[#FF4400]/40 transition-all duration-300 hover:scale-105"
    >
      {/* Äußerer Glow */}
      <div className="absolute inset-0 rounded-lg bg-[#FF4400]/0 group-hover:bg-[#FF4400]/5 transition-all"></div>
      
      {/* CRT-Rahmen-Effekt */}
      <div className="absolute inset-0 rounded-lg border border-[#FF4400]/30 pointer-events-none"></div>
      
      <div className="relative flex items-center gap-3">
        {/* Linke Tetris-Blöcke (fallend) */}
        <div className="flex flex-col gap-0.5">
          <div className="flex gap-0.5">
            <div className="w-2 h-2 bg-[#FF4400] rounded-sm animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-[#FF4400] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FF4400] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FF4400] rounded-sm"></div>
          </div>
          <div className="flex gap-0.5">
            <div className="w-2 h-2 bg-[#FF4400] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FF4400] rounded-sm animate-bounce" style={{ animationDelay: '0.15s' }}></div>
            <div className="w-2 h-2 bg-[#FF4400] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FF4400] rounded-sm"></div>
          </div>
          <div className="flex gap-0.5">
            <div className="w-2 h-2 bg-[#FF4400] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FF4400] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FF4400] rounded-sm animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            <div className="w-2 h-2 bg-[#FF4400] rounded-sm"></div>
          </div>
        </div>

        {/* Vertikaler Trennstrich (Pixel) */}
        <div className="w-px h-8 bg-gradient-to-b from-[#FF4400] to-transparent"></div>

        {/* Pixel-Art Alien Kopf */}
        <div className="flex flex-col items-center">
          <div className="flex gap-0.5">
            <div className="w-2 h-2 bg-[#00FF00] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#00FF00] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#00FF00] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#00FF00] rounded-sm"></div>
          </div>
          <div className="flex gap-0.5 mt-0.5">
            <div className="w-2 h-2 bg-[#00FF00] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FF4400] rounded-sm animate-pulse"></div>
            <div className="w-2 h-2 bg-[#FF4400] rounded-sm animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-[#00FF00] rounded-sm"></div>
          </div>
          <div className="flex gap-0.5 mt-0.5">
            <div className="w-2 h-2 bg-[#00FF00] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#00FF00] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#00FF00] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#00FF00] rounded-sm"></div>
          </div>
        </div>

        {/* SCND_DROP Text */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-[#FF4400] text-xs">◤</span>
            <span className="font-mono font-bold text-sm tracking-tighter">
              <span className="text-[var(--text-primary)] group-hover:text-[#FF4400] transition-colors">SCND</span>
              <span className="text-[#FF4400]">_</span>
              <span className="text-[var(--text-primary)] group-hover:text-[#FF4400] transition-colors">DROP</span>
            </span>
            <span className="text-[#FF4400] text-xs">◢</span>
          </div>
          <div className="flex gap-0.5 mt-1">
            <div className="w-1 h-1 bg-[#FF4400]/40 rounded-full"></div>
            <div className="w-1 h-1 bg-[#FF4400]/40 rounded-full"></div>
            <div className="w-1 h-1 bg-[#FF4400]/40 rounded-full"></div>
            <div className="w-1 h-1 bg-[#FF4400]/40 rounded-full"></div>
            <div className="w-1 h-1 bg-[#FF4400]/40 rounded-full"></div>
            <div className="w-1 h-1 bg-[#FF4400]/40 rounded-full"></div>
          </div>
        </div>

        {/* Gamepad Icon */}
        <div className="flex flex-col items-center">
          <div className="flex gap-0.5">
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
          </div>
          <div className="flex gap-0.5 mt-0.5">
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
          </div>
          <div className="flex gap-0.5 mt-0.5">
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
          </div>
        </div>

        {/* Play Pfeil */}
        <div className="flex items-center gap-1 ml-1">
          <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-t-transparent border-b-transparent border-l-[#FF4400] group-hover:border-l-[#FF6600] transition-all"></div>
          <div className="w-0 h-0 border-t-3 border-b-3 border-l-4 border-t-transparent border-b-transparent border-l-[#FF4400]/50 group-hover:border-l-[#FF6600]/50 transition-all"></div>
        </div>
      </div>
      
      {/* Retro-Scanlines */}
      <div className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px]"></div>
      </div>
      
      {/* Ecken-Akzente */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#FF4400]/50 rounded-tl-lg"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#FF4400]/50 rounded-tr-lg"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#FF4400]/50 rounded-bl-lg"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#FF4400]/50 rounded-br-lg"></div>
    </button>
  );
}
