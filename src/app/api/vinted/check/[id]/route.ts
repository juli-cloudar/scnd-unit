import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: itemId } = await params;
  const RENDER_API_URL = process.env.RENDER_API_URL;

  if (!RENDER_API_URL) {
    console.error('RENDER_API_URL ist nicht gesetzt!');
    return NextResponse.json(
      { error: 'Serverkonfigurationsfehler' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${RENDER_API_URL}/check/${itemId}`);
    if (!response.ok) {
      throw new Error(`Render API error: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Fehler beim Aufruf der Render API:', error);
    return NextResponse.json(
      { exists: true, isSold: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
