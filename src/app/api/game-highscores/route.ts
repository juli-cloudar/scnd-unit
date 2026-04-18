// src/app/api/game-highscores/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase-Client mit Service-Role-Key (nur serverseitig!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Lädt die TOP 3 Highscores
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('highscores')
      .select('player_name, score')
      .order('score', { ascending: false })  // höchste Punktzahl zuerst
      .limit(3);                             // nur die besten 3

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Fehler beim Laden der Highscores:', error);
    return NextResponse.json([]);
  }
}

// POST: Speichert einen neuen Highscore
export async function POST(request: Request) {
  try {
    const { playerName, score } = await request.json();

    // Validierung
    if (!playerName || typeof score !== 'number') {
      return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 });
    }

    const { error } = await supabase
      .from('highscores')
      .insert([{ player_name: playerName, score }]);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Speichern des Highscores:', error);
    return NextResponse.json({ error: 'Speichern fehlgeschlagen' }, { status: 500 });
  }
}
