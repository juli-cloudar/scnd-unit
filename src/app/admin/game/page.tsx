import { ScndDropGame } from '@/components/ScndDropGame';

export const metadata = { title: 'SCND DROP | Admin' };

export default function AdminGamePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">SCND DROP – Admin Game</h1>
      <ScndDropGame />
    </div>
  );
}
