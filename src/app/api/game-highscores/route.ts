import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data, error } = await supabase
    .from('highscores')
    .select('player_name, score')
    .order('score', { ascending: false })
    .limit(3);
  
  if (error) return NextResponse.json([]);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { playerName, score } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data, error } = await supabase
    .from('highscores')
    .insert([{ player_name: playerName, score }]);
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
