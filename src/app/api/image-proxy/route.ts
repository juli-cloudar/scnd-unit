import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL fehlt' }, { status: 400 });
  }

  // Sicherheit: Nur Vinted-URLs erlauben
  if (!url.includes('vinted.net') && !url.includes('vinted.de')) {
    return NextResponse.json({ error: 'Ungültige Domain' }, { status: 403 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://www.vinted.de/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9',
      },
      // WICHTIG: Weiterleiten von Cookies nicht erlauben (Sicherheit)
      credentials: 'omit',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Bild nicht erreichbar' }, 
        { status: response.status }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/webp';

    // Sicherheit: Content-Type validieren
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Ungültiger Content-Type' }, { status: 400 });
    }

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
        // Performance: Content-Length setzen
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Bild-Proxy Error:', error);
    return NextResponse.json(
      { error: 'Bild konnte nicht geladen werden' }, 
      { status: 500 }
    );
  }
}
