import { NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ message: 'Vinted nicht erreichbar' }, { status: 502, headers: CORS });
    }

    const html = await response.text();

    // Bilder direkt aus img-Tags extrahieren
    const imgMatches = [...html.matchAll(/https:\/\/images\d*\.vinted\.net\/[^"'\s>]+\.webp[^"'\s>]*/g)];
    const allImgs = imgMatches.map(m => m[0]);
    
    // Duplikate entfernen und nur f800 Bilder (hohe Qualität)
    const seen = new Set<string>();
    const images: string[] = [];
    for (const img of allImgs) {
      // Basis-URL ohne Query-Parameter als Key
      const base = img.split('?')[0];
      if (!seen.has(base) && img.includes('/f800/')) {
        seen.add(base);
        images.push(img.split('?')[0]); // Query-Parameter entfernen
      }
    }

    // Fallback: alle vinted Bilder wenn keine f800 gefunden
    if (images.length === 0) {
      for (const img of allImgs) {
        const base = img.split('?')[0];
        if (!seen.has(base)) {
          seen.add(base);
          images.push(base);
        }
      }
    }

    // Name aus <h1> oder <title>
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const titleMatch = html.match(/<title>([^|<]+)/);
    const name = (h1Match?.[1] || titleMatch?.[1] || '').trim();

    // Preis
    const priceMatch = html.match(/(\d+[.,]\d+)\s*€/) || html.match(/€\s*(\d+[.,]\d+)/);
    const price = priceMatch ? `€${priceMatch[1]}` : '';

    // Größe
    const sizeMatch = html.match(/(?:Größe|Size)[^>]*>\s*([A-Z0-9\/\s]+?)(?:\s*<|\s*·)/i) ||
                      html.match(/(\bXS\b|\bS\b|\bM\b|\bL\b|\bXL\b|\bXXL\b)/);
    const size = sizeMatch ? sizeMatch[1].trim() : '';

    // Zustand
    const condMatch = html.match(/(?:Zustand|Condition)[^>]*>\s*([^<]+?)(?:\s*<)/i) ||
                      html.match(/\b(Neu|Sehr gut|Gut|Zufriedenstellend|Schlecht)\b/i);
    const condition = condMatch ? condMatch[1].trim() : '';

    return NextResponse.json({
      name,
      price,
      size,
      condition,
      images: images.slice(0, 10),
    }, { headers: CORS });

  } catch (e) {
    return NextResponse.json({ message: 'Fehler beim Scrapen: ' + String(e) }, { status: 500, headers: CORS });
  }
}
