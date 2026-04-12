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
        images.push(fullUrl);
      }
    }

    // ── NAME ────────────────────────────────────────────────────────────────
    const h1Match = html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/i);
    const titleMatch = html.match(/<title>\s*([^|<]+)/i);
    const name = (h1Match?.[1] || titleMatch?.[1] || '').trim();

    // ── PREIS ───────────────────────────────────────────────────────────────
    let price = '';
    const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
    for (const jsonMatch of jsonLdMatches) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        const findPrice = (obj: any): string | null => {
          if (!obj) return null;
          if (obj.price) {
            return obj.price.toString().replace('.', ',');
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
          price = foundPrice;
          break;
        }
      } catch (e) {}
    }

    if (!price) {
      const priceSection = html.substring(0, html.indexOf('Käuferschutz') > 0 ? html.indexOf('Käuferschutz') : html.length);
      const priceMatch = priceSection.match(/(\d{1,3}(?:[.,]\d{2})?)\s*(€|EUR)/i);
      if (priceMatch) {
        price = priceMatch[1];
      }
    }

    // ── GRÖSSE (VERBESSERT) ─────────────────────────────────────────────────
    let size = '';
    
    // Versuch 1: JSON-LD
    const sizeJsonMatch = html.match(/"size"[:\s]*"([^"]{1,15})"/i) ||
                         html.match(/"size_name"[:\s]*"([^"]{1,15})"/i);
    if (sizeJsonMatch) {
      size = sizeJsonMatch[1].trim();
    }
    
    // Versuch 2: HTML Struktur (Vinted spezifisch)
    if (!size) {
      // Suche nach Größe in verschiedenen HTML-Patterns
      const sizePatterns = [
        /Größe[:\s]*<[^>]+>\s*([^<]{1,15}?)\s*<\/[^>]+>/i,
        /Größe[:\s]*([^<\n]{1,15}?)(?=<|\n|·|\/|$)/i,
        /size[:\s]*<[^>]+>\s*([^<]{1,15}?)\s*<\/[^>]+>/i,
        /class="[^"]*size[^"]*"[^>]*>([^<]{1,15})/i,
        /data-testid="size"[^>]*>([^<]+)/i,
      ];
      
      for (const pattern of sizePatterns) {
        const match = html.match(pattern);
        if (match?.[1]) {
          size = match[1].trim().replace(/[·\/]/g, '').trim();
          if (size && size.length < 20) break;
        }
      }
    }
    
    // Versuch 3: Standard-Größen im Text finden (nach "Größe" oder "Size")
    if (!size) {
      const sizeContextMatch = html.match(/(?:Größe|Size)[^a-zA-Z0-9]{0,5}(XS|S|M|L|XL|XXL|XXXL|One Size|UNI|\d{2,3}\s*(?:cm|CM)?)\b/i);
      if (sizeContextMatch) {
        size = sizeContextMatch[1].trim();
      }
    }

    // ── ZUSTAND (VERBESSERT) ────────────────────────────────────────────────
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
    const htmlLower = html.toLowerCase();
    
    // Suche mit Priorität (längere Phrasen zuerst)
    const sortedConditions = Object.entries(condMap).sort((a, b) => b[0].length - a[0].length);
    
    for (const [key, val] of sortedConditions) {
      // Erst: Exakte Übereinstimmung mit Word-Boundaries
      const exactPattern = new RegExp(`\\b${key}\\b`, 'i');
      if (exactPattern.test(htmlLower)) {
        // Prüfe ob es im richtigen Kontext steht (Zustand/Condition Bereich)
        const contextPatterns = [
          new RegExp(`Zustand[^<]{0,50}${key}`, 'i'),
          new RegExp(`condition[^<]{0,50}${key}`, 'i'),
          new RegExp(`class="[^"]*condition[^"]*"[^>]*>[^<]*${key}`, 'i'),
          new RegExp(`data-testid="condition"[^>]*>[^<]*${key}`, 'i'),
          new RegExp(`>[\\s\\w]*${key}[\\s\\w]*<`, 'i'),
        ];
        
        for (const pattern of contextPatterns) {
          if (pattern.test(html)) {
            condition = val;
            break;
          }
        }
        if (condition) break;
      }
    }
    
    // Fallback: Suche nach Vinted-typischen Markern
    if (!condition) {
      const vintedCondMatch = html.match(/>(Neu mit Etikett|Neu ohne Etikett|Neu|Sehr gut|Gut|Zufriedenstellend|Schlecht)</i);
      if (vintedCondMatch) {
        condition = vintedCondMatch[1];
      }
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
      images: images.slice(0, 10),
    }, { headers: CORS });

  } catch (e) {
    console.error('Scraper Error:', e);
    return NextResponse.json({ message: 'Fehler: ' + String(e) }, { status: 500, headers: CORS });
  }
}
