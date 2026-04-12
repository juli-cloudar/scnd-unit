import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL fehlt' }, { status: 400 });
  }

  // Nur Vinted erlauben
  if (!url.includes('vinted.net')) {
    return NextResponse.json({ error: 'Ungültige Domain' }, { status: 403 });
  }

  try {
    // WICHTIG: Fetch muss ALLE Original-Headers senden
    const imageResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.vinted.de/',
        'Origin': 'https://www.vinted.de',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      // KEINE Umleitungen automatisch folgen lassen
      redirect: 'manual',
    });

    // Falls 302/301 Redirect, manuell folgen
    let finalResponse = imageResponse;
    if (imageResponse.status === 302 || imageResponse.status === 301) {
      const location = imageResponse.headers.get('location');
      if (location) {
        finalResponse = await fetch(location, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/webp,image/*,*/*;q=0.8',
            'Referer': 'https://www.vinted.de/',
          },
        });
      }
    }

    if (!finalResponse.ok) {
      console.error('Vinted Bild Error:', finalResponse.status, url.substring(0, 80));
      return NextResponse.json(
        { error: `Bild nicht erreichbar: ${finalResponse.status}` }, 
        { status: 502 }
      );
    }

    const arrayBuffer = await finalResponse.arrayBuffer();
    
    // Prüfen ob es wirklich ein Bild ist
    if (arrayBuffer.byteLength < 1000) {
      return NextResponse.json({ error: 'Bild zu klein/ungültig' }, { status: 502 });
    }

    const contentType = finalResponse.headers.get('content-type') || 'image/webp';

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=1800', // 30min wegen Signatur
        'Access-Control-Allow-Origin': '*',
        'Vary': 'Accept',
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
