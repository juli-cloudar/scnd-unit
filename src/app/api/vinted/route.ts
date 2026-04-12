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
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ message: 'Vinted nicht erreichbar' }, { status: 502, headers: CORS });
    }

    const html = await response.text();

    // ── BILDER ──────────────────────────────────────────────────────────────
    // Vollständige URL inkl. ?s= Parameter behalten (nötig für Vinted CDN)
    const imgMatches = [...html.matchAll(/https:\/\/images\d*\.vinted\.net\/[^"'\s<>]+\.webp(?:\?[^"'\s<>]*)?/g)];
    const seen = new Set<string>();
    const images: string[] = [];
    for (const m of imgMatches) {
      const fullUrl = m[0];
      // Nur f800 (hohe Qualität), keine Duplikate
      const base = fullUrl.split('?')[0];
      if (fullUrl.includes('/f800/') && !seen.has(base)) {
        seen.add(base);
        images.push(fullUrl); // Mit ?s= Parameter!
      }
    }

    // ── NAME ────────────────────────────────────────────────────────────────
    const h1Match = html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/);
    const titleMatch = html.match(/<title>\s*([^|<]+)/);
    const name = (h1Match?.[1] || titleMatch?.[1] || '').trim();

    // ── PREIS ───────────────────────────────────────────────────────────────
    // Ersten Preis nehmen (nicht den mit Käuferschutz)
    const priceMatch = html.match(/(\d+[.,]\d+)\s*€\s*<\/[a-z]+>\s*(?![\d])/);
    const priceMatch2 = html.match(/(\d{1,3}[.,]\d{2})\s*€/);
    const rawPrice = priceMatch?.[1] || priceMatch2?.[1] || '';
    const price = rawPrice ? `€${rawPrice}` : '';

    // ── GRÖSSE ──────────────────────────────────────────────────────────────
    // Aus Breadcrumb oder Produktdetails
    const sizeMatch = html.match(/(?:Größe|size)[^:]*:\s*([^\s<,·]+)/i) ||
                      html.match(/\b(XS|S|M|L|XL|XXL|XXXL|One Size|\d{2,3})\b(?=\s*\/|\s*·|\s*<)/);
    const size = sizeMatch?.[1]?.trim() || '';

    // ── ZUSTAND ─────────────────────────────────────────────────────────────
    const condMap: Record<string, string> = {
      'neu': 'Neu',
      'sehr gut': 'Sehr gut',
      'gut': 'Gut',
      'zufriedenstellend': 'Zufriedenstellend',
      'schlecht': 'Schlecht',
    };
    let condition = '';
    for (const [key, val] of Object.entries(condMap)) {
      if (html.toLowerCase().includes(`·${key}·`) || 
          html.toLowerCase().includes(`·${key}<`) ||
          html.toLowerCase().includes(`>${key}<`)) {
        condition = val;
        break;
      }
    }

    // ── KATEGORIE ───────────────────────────────────────────────────────────
    const catMap: Record<string, string> = {
      'jacke': 'Jacken',
      'jacket': 'Jacken',
      'mantel': 'Jacken',
      'coat': 'Jacken',
      'pullover': 'Pullover',
      'hoodie': 'Pullover',
      'strickjacke': 'Pullover',
      'sweatshirt': 'Sweatshirts',
      'sweat': 'Sweatshirts',
      'crewneck': 'Sweatshirts',
      'top': 'Tops',
      'shirt': 'Tops',
      't-shirt': 'Tops',
      'crop': 'Tops',
    };
    let category = 'Sonstiges';
    const nameLower = name.toLowerCase();
    const urlLower = url.toLowerCase();
    for (const [key, val] of Object.entries(catMap)) {
      if (nameLower.includes(key) || urlLower.includes(key)) {
        category = val;
        break;
      }
    }

    return NextResponse.json({
      name,
      price,
      size,
      condition,
      category,
      images: images.slice(0, 10),
    }, { headers: CORS });

  } catch (e) {
    return NextResponse.json({ message: 'Fehler: ' + String(e) }, { status: 500, headers: CORS });
  }
}
