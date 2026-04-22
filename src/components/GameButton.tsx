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
      className="transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none"
      aria-label="SCND DROP Spiel starten"
    >
      <Image
        src="/scnd-drop-logo.jpg"
        alt="SCND DROP"
        width={300}
        height={150}
        className="object-contain"
        priority
      />
    </button>
  );
}
