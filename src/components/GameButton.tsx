// src/components/GameButton.tsx
'use client';

interface GameButtonProps {
  onClick: () => void;
}

export function GameButton({ onClick }: GameButtonProps) {
  return (
    <button
      onClick={onClick}
      className="group relative px-3 py-2 bg-[var(--bg-secondary)] border-2 border-[#FF4400] rounded-lg hover:border-[#FF4400] hover:shadow-[0_0_15px_#FF4400] transition-all duration-300"
    >
      <div className="relative flex items-center gap-2">
        
        {/* ===== TETRIS BLOCK ICON (8x8 Pixel) ===== */}
        <div className="grid grid-cols-4 gap-0.5">
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
        </div>

        {/* ===== SCND DROP PIXEL SCHRIFT (Buchstaben als Pixel) ===== */}
        <div className="flex items-center gap-1">
          
          {/* Buchstabe S - 5x5 Pixel */}
          <div className="grid grid-cols-5 gap-0.5">
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          </div>

          {/* C - 5x5 Pixel */}
          <div className="grid grid-cols-5 gap-0.5">
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          </div>

          {/* N - 5x5 Pixel */}
          <div className="grid grid-cols-5 gap-0.5">
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          </div>

          {/* D - 5x5 Pixel */}
          <div className="grid grid-cols-5 gap-0.5">
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[var(--bg-primary)] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          </div>
        </div>

        {/* Unterstrich Pixel */}
        <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
        <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>

        {/* DROP - einfacher als Text (weil Pixel sonst zu klein) */}
        <span className="font-mono font-bold text-sm tracking-tighter">
          <span className="text-[#FF4400]">DROP</span>
        </span>

        {/* Play Pfeil Pixel-Art */}
        <div className="flex items-center">
          <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-t-transparent border-b-transparent border-l-[#FF4400] group-hover:border-l-[#FF6600] transition-all"></div>
        </div>
      </div>
    </button>
  );
}
