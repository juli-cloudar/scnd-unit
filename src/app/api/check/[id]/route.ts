// app/api/vinted/check/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: itemId } = await params;
  
  try {
    // Statt JSON-API wird die normale HTML-Produktseite abgerufen
    const response = await fetch(`https://www.vinted.de/items/${itemId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        'Referer': 'https://www.vinted.de/',
        'Origin': 'https://www.vinted.de',
      },
    });

    // 404 = Artikel existiert nicht mehr
    if (response.status === 404) {
      return NextResponse.json({ exists: false, status: 'deleted' });
    }

    // 403/429 – auch hier möglich, dann zurück mit Fehler
    if (response.status === 403 || response.status === 429) {
      return NextResponse.json(
        { error: 'Rate limited', exists: true, isSold: false },
        { status: 429 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Unknown error', exists: true, isSold: false },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Prüfe, ob der Artikel verkauft ist (anhand von Badge-Texten)
    const isSold = html.includes('item__sold-badge') || 
                   html.includes('Artikel ist verkauft') ||
                   html.includes('sold-badge') ||
                   html.includes('Dieser Artikel ist bereits verkauft');

    // Optional: Versuche, den Titel aus dem HTML zu extrahieren (für Logging)
    let title = '';
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    if (titleMatch) title = titleMatch[1].replace(' | Vinted', '');

    return NextResponse.json({
      exists: true,
      isSold: isSold,
      status: isSold ? 'sold' : 'active',
      title: title,
    });

  } catch (error) {
    console.error('Vinted HTML fetch error:', error);
    return NextResponse.json(
      { error: 'Network error', exists: true, isSold: false },
      { status: 500 }
    );
  }
}
