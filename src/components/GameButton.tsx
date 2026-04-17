// src/components/GameButton.tsx
'use client';

import Image from 'next/image';

interface GameButtonProps {
  onClick: () => void;
}

export function GameButton({ onClick }: GameButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none"
      aria-label="SCND DROP Spiel starten"
    >
      <Image
        src="/scnd-drop-logo.png"
        alt="SCND DROP"
        width={100}
        height={40}
        className="object-contain"
        priority
      />
    </button>
  );
}
