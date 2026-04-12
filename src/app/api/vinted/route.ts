import { NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ═══════════════════════════════════════════════════════════════════════════
// OPTIONS Handler (CORS Preflight)
// ═══════════════════════════════════════════════════════════════════════════
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

// ═══════════════════════════════════════════════════════════════════════════
// GET Handler - Image Proxy
// ═══════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════
// POST Handler - Vinted Scraper
// ═══════════════════════════════════════════════════════════════════════════
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
        'Referer': 'https://www.vinted.de/',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ message: 'Vinted nicht erreichbar' }, { status: 502, headers: CORS });
    }

    const html = await response.text();

    // ── BILDER ──────────────────────────────────────────────────────────────
    const imgMatches = [...html.matchAll(/https:\/\/images\d*\.vinted\.net\/[^"'\s<>]+/g)];
    const seen = new Set<string>();
    const images: string[] = [];
    
    for (const m of imgMatches) {
      let fullUrl = m[0];
      if (!fullUrl.includes('/f800/')) continue;
      fullUrl = fullUrl.replace(/&amp;/g, '&');
      const base = fullUrl.split('?')[0];
      if (!seen.has(base)) {
        seen.add(base);
        images.push(`/api/vinted?url=${encodeURIComponent(fullUrl)}`);
      }
    }

    // ── NAME ────────────────────────────────────────────────────────────────
    const h1Match = html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/i);
    const titleMatch = html.match(/<title>\s*([^|<]+)/i);
    const name = (h1Match?.[1] || titleMatch?.[1] || '').trim();

    // ── PREIS (korrigiert: 32€ statt 32 EUR) ────────────────────────────────
    let price = '';
    const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
    for (const jsonMatch of jsonLdMatches) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        const findPrice = (obj: any): { price: string; currency: string } | null => {
          if (!obj) return null;
          if (obj.price && obj.priceCurrency) {
            return { 
              price: obj.price.toString().replace('.', ','), 
              currency: obj.priceCurrency 
            };
          }
          if (typeof obj === 'object') {
            for (const key in obj) {
              const found = findPrice(obj[key]);
              if (found) return found;
            }
          }
          return null;
        };
        const foundPrice = findPrice(jsonData);
        if (foundPrice) {
          price = `${foundPrice.price}${foundPrice.currency === 'EUR' ? '€' : foundPrice.currency}`;
          break;
        }
      } catch (e) {}
    }

    if (!price) {
      const priceSection = html.substring(0, html.indexOf('Käuferschutz') > 0 ? html.indexOf('Käuferschutz') : html.length);
      const priceMatch = priceSection.match(/(\d{1,3}(?:[.,]\d{2})?)\s*(€|EUR)/i);
      if (priceMatch) {
        price = `${priceMatch[1]}€`;
      }
    }

    // ── GRÖSSE ──────────────────────────────────────────────────────────────
    let size = '';
    const sizeJsonMatch = html.match(/"size"[:\s]*"([^"]{1,10})"/i) ||
                         html.match(/"size_name"[:\s]*"([^"]{1,10})"/i);
    if (sizeJsonMatch) {
      size = sizeJsonMatch[1].trim();
    }
    if (!size) {
      const sizeSectionMatch = html.match(/Größe[:\s]*([^<\n]{1,15}?)(?=<|\n|·|\/|$)/i) ||
                              html.match(/Size[:\s]*([^<\n]{1,15}?)(?=<|\n|·|\/|$)/i);
      if (sizeSectionMatch) {
        size = sizeSectionMatch[1].trim().replace(/[·\/]/g, '').trim();
      }
    }
    if (!size) {
      const standardSizeMatch = html.match(/\b(XS|S|M|L|XL|XXL|XXXL|One Size|Einheitsgröße|UNI)\b/i);
      if (standardSizeMatch) {
        size = standardSizeMatch[1];
      }
    }

    // ── ZUSTAND ─────────────────────────────────────────────────────────────
    const condMap: Record<string, string> = {
      'neu mit etikett': 'Neu mit Etikett',
      'neu ohne etikett': 'Neu ohne Etikett',
      'neu': 'Neu',
      'sehr gut': 'Sehr gut',
      'gut': 'Gut',
      'zufriedenstellend': 'Zufriedenstellend',
      'schlecht': 'Schlecht',
    };
    
    let condition = '';
    const sortedConditions = Object.entries(condMap).sort((a, b) => b[0].length - a[0].length);
    
    for (const [key, val] of sortedConditions) {
      const patterns = [
        new RegExp(`[>·\\s]${key}[<·\\s]`, 'i'),
        new RegExp(`Zustand[^<]*${key}`, 'i'),
        new RegExp(`condition[^<]*${key}`, 'i'),
        new RegExp(`"${key}"`, 'i'),
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(html)) {
          condition = val;
          break;
        }
      }
      if (condition) break;
    }

    // ── KATEGORIE ───────────────────────────────────────────────────────────
    const catMap: Record<string, string> = {
      'jacke': 'Jacken', 'jacket': 'Jacken', 'mantel': 'Jacken', 'coat': 'Jacken',
      'pullover': 'Pullover', 'hoodie': 'Pullover', 'strickjacke': 'Pullover', 'sweater': 'Pullover',
      'sweatshirt': 'Sweatshirts', 'sweat': 'Sweatshirts', 'crewneck': 'Sweatshirts',
      'top': 'Tops', 'shirt': 'Tops', 't-shirt': 'Tops', 'tshirt': 'Tops', 'crop': 'Tops',
      'kleid': 'Kleider', 'dress': 'Kleider',
      'rock': 'Röcke', 'skirt': 'Röcke',
      'hose': 'Hosen', 'pants': 'Hosen', 'jeans': 'Hosen',
      'schuhe': 'Schuhe', 'shoes': 'Schuhe', 'sneaker': 'Schuhe',
      'tasche': 'Taschen', 'bag': 'Taschen',
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
      images: images.slice(0, 5),
    }, { headers: CORS });

  } catch (e) {
    console.error('Scraper Error:', e);
    return NextResponse.json({ message: 'Fehler: ' + String(e) }, { status: 500, headers: CORS });
  }
}
