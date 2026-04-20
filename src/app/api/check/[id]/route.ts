import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: itemId } = await params;
  const url = `https://www.vinted.de/items/${itemId}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        'Referer': 'https://www.vinted.de/',
        'Cache-Control': 'no-cache',
      },
    });

    // 404 = Artikel existiert nicht mehr
    if (response.status === 404 || response.status === 410) {
      return NextResponse.json({ exists: false, status: 'deleted' });
    }

    // Bei anderen Fehlern (403, 500 etc.) nehmen wir an, dass das Item existiert
    if (!response.ok) {
      return NextResponse.json(
        { exists: true, isSold: false, error: `HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    const isSold = html.includes('item__sold-badge') ||
                   html.includes('Artikel ist verkauft') ||
                   html.includes('sold-badge') ||
                   html.includes('Dieser Artikel ist bereits verkauft');

    return NextResponse.json({
      exists: true,
      isSold: isSold,
      status: isSold ? 'sold' : 'active',
    });
  } catch (error) {
    console.error('[Check-API] Fehler:', error);
    return NextResponse.json(
      { exists: true, isSold: false, error: 'Network error' },
      { status: 500 }
    );
  }
}
