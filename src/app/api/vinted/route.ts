// app/api/scrape-vinted/route.ts
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

    // ── BILDER EXTRAKTION (URLs für Proxy) ──────────────────────────────────
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
        // WICHTIG: URL für deinen Proxy encoden
        images.push(`/api/image-proxy?url=${encodeURIComponent(fullUrl)}`);
      }
    }

    // ── NAME ────────────────────────────────────────────────────────────────
    const h1Match = html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/i);
    const titleMatch = html.match(/<title>\s*([^|<]+)/i);
    const name = (h1Match?.[1] || titleMatch?.[1] || '').trim();

  
    // ── GRÖSSE (VERBESSERT) ─────────────────────────────────────────────────
let size = '';

// Versuch 1: JSON-LD mit größerem Zeichenlimit
const sizeJsonMatch = html.match(/"size"[:\s]*"([^"]{1,20})"/i) ||
                     html.match(/"size_name"[:\s]*"([^"]{1,20})"/i) ||
                     html.match(/"size_title"[:\s]*"([^"]{1,20})"/i);
if (sizeJsonMatch) {
  size = sizeJsonMatch[1].trim();
}

// Versuch 2: Vinted spezifische HTML-Struktur
if (!size) {
  const sizePatterns = [
    /data-testid="item-details-size"[^>]*>([^<]{1,20})/i,
    /class="[^"]*item-details[^"]*"[^>]*>[^<]*Größe[^<]*<[^>]*>([^<]{1,20})/i,
    /Größe\s*<\/[^>]+>\s*<[^>]+>\s*([^<]{1,20})/i,
    /Größe[^<]{0,30}<[^>]+>([^<]{1,20})/i,
    /"Größe"[^:]*:[^"]*"([^"]{1,20})"/i,
  ];
  for (const pattern of sizePatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      size = match[1].trim().replace(/[·\/\-]/g, '').trim();
      if (size.length > 0 && size.length < 20) break;
    }
  }
}

// Versuch 3: Breite Suche nach Größe + Wert (auch XXL, 38, 40 usw.)
if (!size) {
  const broadMatch = html.match(/(?:Größe|Grösse|Size)[^\w]{0,10}(XXS|XS|S|M|L|XL|XXL|XXXL|4XL|5XL|One Size|Einheitsgröße|UNI|\d{2,3})/i);
  if (broadMatch) {
    size = broadMatch[1].trim();
  }
}

// Versuch 4: Numerische Größen (z.B. 38, 40, 42)
if (!size) {
  const numericMatch = html.match(/(?:Größe|Size)[^\d]{0,15}(\d{2,3})\b/i);
  if (numericMatch) {
    size = numericMatch[1];
  }
}

// ── PREIS (nur Zahl, kein €-Zeichen) ─────────────────────────────────────
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
      price = foundPrice; // Nur "32", nicht "32€"
      break;
    }
  } catch (e) {}
}

if (!price) {
  const priceSection = html.substring(0, html.indexOf('Käuferschutz') > 0 ? html.indexOf('Käuferschutz') : html.length);
  const priceMatch = priceSection.match(/(\d{1,3}(?:[.,]\d{2})?)\s*(€|EUR)/i);
  if (priceMatch) {
    price = priceMatch[1]; // Nur "32", nicht "32€"
  }
}

   // ── ZUSTAND (VERBESSERT) ────────────────────────────────────────────────
const condMap: Record<string, string> = {
  'neu mit etikett': 'Neu mit Etikett',
  'neu ohne etikett': 'Neu ohne Etikett',
  'sehr gut': 'Sehr gut',
  'zufriedenstellend': 'Zufriedenstellend',
  'schlecht': 'Schlecht',
  'gut': 'Gut',
  'neu': 'Neu',
};

let condition = '';

// Versuch 1: Direkte HTML-Tags (zuverlässigste Methode)
const directMatch = html.match(/>(Neu mit Etikett|Neu ohne Etikett|Sehr gut|Zufriedenstellend|Schlecht|Gut|Neu)</i);
if (directMatch) {
  condition = directMatch[1];
}

// Versuch 2: JSON-LD Zustand
if (!condition) {
  const condJsonMatch = html.match(/"condition"[:\s]*"([^"]+)"/i) ||
                       html.match(/"item_condition"[:\s]*"([^"]+)"/i);
  if (condJsonMatch) {
    const raw = condJsonMatch[1].toLowerCase();
    for (const [key, val] of Object.entries(condMap)) {
      if (raw.includes(key)) { condition = val; break; }
    }
  }
}

// Versuch 3: Kontext-Suche (Zustand steht neben dem Wort "Zustand")
if (!condition) {
  const contextMatch = html.match(/Zustand[^<]{0,50}(Neu mit Etikett|Neu ohne Etikett|Sehr gut|Zufriedenstellend|Schlecht|Gut|Neu)/i);
  if (contextMatch) {
    condition = contextMatch[1];
  }
}

// Versuch 4: Breite Suche (Fallback)
if (!condition) {
  const htmlLower = html.toLowerCase();
  // Längere Phrasen zuerst um Fehlmatches zu vermeiden
  const order = ['neu mit etikett', 'neu ohne etikett', 'sehr gut', 'zufriedenstellend', 'schlecht', 'gut'];
  for (const key of order) {
    // Word boundary check - nicht in Wörtern wie "neugierig" oder "gutaussehend"
    const pattern = new RegExp(`[>\\s"']${key}[<\\s"'·]`, 'i');
    if (pattern.test(htmlLower)) {
      condition = condMap[key];
      break;
    }
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
      images: images.slice(0, 5), // Proxy-URLs
    }, { headers: CORS });

  } catch (e) {
    console.error('Scraper Error:', e);
    return NextResponse.json({ message: 'Fehler: ' + String(e) }, { status: 500, headers: CORS });
  }
}
