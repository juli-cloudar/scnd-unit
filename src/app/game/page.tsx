// src/app/game/page.tsx
import { ScndDropGame } from '@/components/ScndDropGame';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'SCND DROP | SCND UNIT',
  description: 'Das offizielle SCND DROP Spiel',
};

export default function GamePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[#FF4400] hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zur Startseite
        </Link>
        <ScndDropGame />
      </div>
    </div>
  );
}
