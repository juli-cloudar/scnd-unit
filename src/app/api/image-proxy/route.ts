// app/api/image-proxy/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL fehlt' }, { status: 400 });
  }

  // Sicherheit: Nur Vinted erlauben
  if (!url.includes('vinted.net')) {
    return NextResponse.json({ error: 'Ungültige Domain' }, { status: 403 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        'Referer': 'https://www.vinted.de/',
        'Origin': 'https://www.vinted.de',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Bild nicht erreichbar: ${response.status}` }, 
        { status: 502 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // Prüfen ob es ein gültiges Bild ist
    if (arrayBuffer.byteLength < 1000) {
      return NextResponse.json({ error: 'Ungültiges Bild' }, { status: 502 });
    }

    const contentType = response.headers.get('content-type') || 'image/webp';

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Image Proxy Error:', error);
    return NextResponse.json(
      { error: 'Bild konnte nicht geladen werden' }, 
      { status: 500 }
    );
  }
}
