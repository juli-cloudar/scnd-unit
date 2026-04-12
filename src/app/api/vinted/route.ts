import { NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': 'https://juli-cloudar.github.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || !url.includes('vinted')) {
      return NextResponse.json({ message: 'Ungültige URL' }, { status: 400, headers: CORS });
    }
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ message: 'Vinted nicht erreichbar' }, { status: 502, headers: CORS });
    }

    const html = await response.text();

    // Name
    const nameMatch = html.match(/"title"\s*:\s*"([^"]+)"/);
    const name = nameMatch ? nameMatch[1] : '';

    // Preis
    const priceMatch = html.match(/"price"\s*:\s*"?([0-9.,]+)"?/);
    const price = priceMatch ? `€${priceMatch[1]}` : '';

    // Größe
    const sizeMatch = html.match(/"size_title"\s*:\s*"([^"]+)"/);
    const size = sizeMatch ? sizeMatch[1] : '';

    // Zustand
    const condMatch = html.match(/"condition"\s*:\s*"([^"]+)"/);
    const condition = condMatch ? condMatch[1] : '';

    // Bilder
    const imgMatches = [...html.matchAll(/"url"\s*:\s*"(https:\/\/images\.vinted\.net[^"]+)"/g)];
    const images = [...new Set(imgMatches.map(m => m[1]))].slice(0, 10);

    return NextResponse.json({ name, price, size, condition, images }, { headers: CORS });

  } catch (e) {
    return NextResponse.json({ message: 'Fehler beim Scrapen' }, { status: 500, headers: CORS });
  }
}
