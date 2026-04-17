// src/components/GameButton.tsx
'use client';

interface GameButtonProps {
  onClick: () => void;
}

export function GameButton({ onClick }: GameButtonProps) {
  return (
    <button
      onClick={onClick}
      className="group relative px-5 py-2 bg-gradient-to-r from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A] border border-[#FF4400] rounded-full hover:border-[#FF4400] hover:shadow-[0_0_12px_#FF4400] transition-all duration-300"
    >
      {/* Innerer Glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF4400]/0 via-[#FF4400]/5 to-[#FF4400]/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="relative flex items-center gap-2">
        {/* Kleines Spiel-Symbol links */}
        <div className="flex gap-0.5">
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#FF4400] rounded-sm"></div>
        </div>
        
        {/* SCND_DROP Logo Text */}
        <span className="font-mono font-bold text-base tracking-tighter">
          <span className="text-[#FF4400]">SCND</span>
          <span className="text-[var(--text-primary)]">_</span>
          <span className="text-[#FF4400]">DROP</span>
        </span>
        
        {/* Play Indikator rechts */}
        <span className="text-xs text-[#FF4400] group-hover:translate-x-0.5 transition-transform">▶</span>
      </div>
      
      {/* Subtiler Rahmen-Effekt */}
      <div className="absolute inset-0 rounded-full border border-[#FF4400]/0 group-hover:border-[#FF4400]/30 transition-all pointer-events-none"></div>
    </button>
  );
}
