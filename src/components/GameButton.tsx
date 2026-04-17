// src/components/GameButton.tsx
'use client';

interface GameButtonProps {
  onClick: () => void;
}

export function GameButton({ onClick }: GameButtonProps) {
  return (
    <button
      onClick={onClick}
      className="group relative px-4 py-2 bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A] border-2 border-[#FF4400] rounded-xl shadow-lg hover:shadow-[0_0_20px_#FF4400] transition-all duration-300 hover:scale-105"
    >
      {/* Neon Glow Hintergrund */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FF4400]/0 via-[#FF4400]/10 to-[#FF4400]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* CRT Scanlines */}
      <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px]"></div>
      </div>

      <div className="relative flex items-center gap-4">
        {/* Linker Tetris-Block Turm */}
        <div className="flex flex-col gap-0.5">
          <div className="flex gap-0.5">
            <div className="w-2.5 h-2.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-2.5 h-2.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-2.5 h-2.5 bg-[#FF4400] rounded-sm"></div>
          </div>
          <div className="flex gap-0.5">
            <div className="w-2.5 h-2.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-2.5 h-2.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-2.5 h-2.5 bg-[#FF4400] rounded-sm"></div>
          </div>
          <div className="flex gap-0.5">
            <div className="w-2.5 h-2.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-2.5 h-2.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-2.5 h-2.5 bg-[#FF4400] rounded-sm"></div>
          </div>
        </div>

        {/* Logo Container mit Rahmen */}
        <div className="relative px-4 py-1.5 bg-gradient-to-r from-[#FF4400]/10 via-[#FF4400]/5 to-[#FF4400]/10 rounded-lg border border-[#FF4400]/30">
          {/* Pixel-Ecken */}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#FF4400] rounded-sm"></div>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF4400] rounded-sm"></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#FF4400] rounded-sm"></div>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#FF4400] rounded-sm"></div>
          
          {/* Hauptlogo Text */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              {/* Pixel-Art "S" */}
              <div className="flex flex-col">
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
                </div>
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
                </div>
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
                </div>
              </div>
              
              <span className="font-mono font-black text-xl tracking-tighter">
                <span className="text-[#FF4400]">SCND</span>
                <span className="text-[var(--text-primary)]">_</span>
                <span className="text-[#FF4400]">DROP</span>
              </span>
              
              {/* Pixel-Art "P" */}
              <div className="flex flex-col">
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-1.5 bg-[#00FF00] rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-[#00FF00] rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-[#00FF00] rounded-sm"></div>
                </div>
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-1.5 bg-[#00FF00] rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-[#00FF00] rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-[#00FF00] rounded-sm"></div>
                </div>
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-1.5 bg-[#00FF00] rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-[#00FF00] rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-[#00FF00] rounded-sm"></div>
                </div>
              </div>
            </div>
            
            {/* Untertitel */}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-4 h-px bg-gradient-to-r from-transparent to-[#FF4400]"></div>
              <span className="text-[8px] font-mono text-[var(--text-secondary)] uppercase tracking-[0.2em] group-hover:text-[#FF4400] transition-colors">
                BAUHAUS EDITION
              </span>
              <div className="w-4 h-px bg-gradient-to-l from-transparent to-[#FF4400]"></div>
            </div>
          </div>
        </div>

        {/* Rechter Alien/Kontrolleur */}
        <div className="flex flex-col items-center">
          <div className="flex gap-0.5">
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
          </div>
          <div className="flex gap-0.5 mt-0.5">
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FF4400] rounded-sm animate-pulse"></div>
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
          </div>
          <div className="flex gap-0.5 mt-0.5">
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
            <div className="w-2 h-2 bg-[#FFD700] rounded-sm"></div>
          </div>
        </div>

        {/* Play Arrow */}
        <div className="flex items-center">
          <div className="relative">
            <div className="w-0 h-0 border-t-6 border-b-6 border-l-8 border-t-transparent border-b-transparent border-l-[#FF4400] group-hover:border-l-[#FF6600] transition-all"></div>
            <div className="absolute -top-3 -left-1 w-4 h-4">
              <div className="w-1 h-1 bg-[#FF4400] rounded-full animate-ping"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Ecken-Akzente */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#FF4400] rounded-tl-xl"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#FF4400] rounded-tr-xl"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#FF4400] rounded-bl-xl"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#FF4400] rounded-br-xl"></div>
    </button>
  );
}
