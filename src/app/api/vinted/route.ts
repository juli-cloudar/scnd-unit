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
    // VERBESSERT: Suche nach dem Hauptpreis (nicht Käuferschutz-Preis)
    // Vinted Struktur: Hauptpreis steht oft in spezifischen data-Attributen oder als erster Preis
    let price = '';
    
    // Versuch 1: JSON-LD oder data-Attribute
    const jsonLdMatch = html.match(/"price":\s*"?(\d+[.,]?\d*)"?/i) || 
                        html.match(/"price_amount":\s*"?(\d+[.,]?\d*)"?/i);
    if (jsonLdMatch) {
      price = `€${jsonLdMatch[1].replace('.', ',')}`;
    }
    
    // Versuch 2: Erster Preis im HTML (hauptpreis ist meist der erste)
    if (!price) {
      // Suche nach Preis-Pattern, aber überspringe "mit Käuferschutz" Bereiche
      const priceSection = html.substring(0, html.indexOf('Käuferschutz') > 0 ? html.indexOf('Käuferschutz') : html.length);
      const firstPriceMatch = priceSection.match(/(\d{1,3}(?:[.,]\d{2})?)\s*€/);
      if (firstPriceMatch) {
        price = `€${firstPriceMatch[1].replace('.', ',')}`;
      }
    }
    
    // Versuch 3: Spezifische Vinted-Preis-Klassen oder Struktur
    if (!price) {
      const specificPriceMatch = html.match(/class="[^"]*price[^"]*"[^>]*>(\d[.,\d\s]*€)/i) ||
                                html.match(/>(\d{1,3}[.,]\d{2})\s*€\s*</);
      if (specificPriceMatch) {
        price = `€${specificPriceMatch[1].replace(/[^0-9,]/g, '').replace('.', ',')}`;
      }
    }

    // ── GRÖSSE ──────────────────────────────────────────────────────────────
    const sizePatterns = [
      /"size[^"]*"[:\s]*"([^"]+)"/i,
      /Größe[:\s]*<[^>]+>\s*([^<]+)/i,
      /size[:\s]*<[^>]+>\s*([^<]+)/i,
      /class="[^"]*size[^"]*"[^{]*>\s*([^<]+)/i,
      /\b(XS|S|M|L|XL|XXL|XXXL|One Size|Einheitsgröße)\b/i,
      /(\d{2,3})\s*(?:cm|CM)?\s*[·\/]/,
    ];
    
    let size = '';
    for (const pattern of sizePatterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        size = match[1].trim().replace(/[·\/]/g, '').trim();
        if (size && size.length < 20) break;
      }
    }

    // ── ZUSTAND ─────────────────────────────────────────────────────────────
    // VERBESSERT: Spezifischere Suche mit Word-Boundaries
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
    
    // Suche in strukturierten Bereichen (item-details, condition, etc.)
    const conditionSection = htmlLower.match(/zustand|condition|item-details|details-list/);
    
    for (const [key, val] of Object.entries(condMap)) {
      // Erst: Exakte Übereinstimmung mit Word-Boundaries
      const exactPattern = new RegExp(`\\b${key}\\b`, 'i');
      if (exactPattern.test(htmlLower)) {
        // Prüfe ob es im richtigen Kontext steht (nicht im Titel/Name)
        const contextCheck = htmlLower.indexOf(key);
        const surroundingText = htmlLower.substring(Math.max(0, contextCheck - 50), contextCheck + 50);
        
        // Zustand sollte in Details-Bereich sein, nicht im Produkttitel
        if (surroundingText.includes('zustand') || 
            surroundingText.includes('condition') ||
            surroundingText.includes('details') ||
            surroundingText.includes('·')) {
          condition = val;
          break;
        }
      }
    }
    
    // Fallback: Wenn nichts gefunden, suche nach Vinted-typischen Markern
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
