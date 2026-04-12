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
    // WICHTIG: Nur die f800 URLs extrahieren und aufbereiten
    const imgMatches = [...html.matchAll(/https:\/\/images\d*\.vinted\.net\/[^"'\s<>]+/g)];
    const seen = new Set<string>();
    const images: string[] = [];
    
    for (const m of imgMatches) {
      let fullUrl = m[0];
      
      // Nur Thumbnails mit f800 (hohe Qualität)
      if (!fullUrl.includes('/f800/')) continue;
      
      // URL bereinigen - manchmal sind sie URL-encoded
      fullUrl = fullUrl.replace(/&amp;/g, '&');
      
      // Basis-URL ohne Query-Parameter für Deduplizierung
      const base = fullUrl.split('?')[0];
      
      if (!seen.has(base)) {
        seen.add(base);
        // WICHTIG: Vinted Bilder brauchen manchmal einen gültigen Referer
        // Wir geben die direkte CDN-URL zurück, Client muss ggf. Proxy verwenden
        images.push(fullUrl);
      }
    }

    // ── NAME ────────────────────────────────────────────────────────────────
    const h1Match = html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/i);
    const titleMatch = html.match(/<title>\s*([^|<]+)/i);
    const name = (h1Match?.[1] || titleMatch?.[1] || '').trim();

    // ── PREIS ───────────────────────────────────────────────────────────────
    // Verschiedene Preis-Formate abdecken
    const pricePatterns = [
      /(\d{1,3}(?:[.,]\d{2})?)\s*€/,
      /€\s*(\d{1,3}(?:[.,]\d{2})?)/,
      /(\d{1,3}[.,]\d{2})\s*EUR/i,
    ];
    
    let price = '';
    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match) {
        price = `€${match[1].replace('.', ',')}`;
        break;
      }
    }

    // ── GRÖSSE ──────────────────────────────────────────────────────────────
    // VERBESSERT: Mehr Pattern für Vinted-HTML-Struktur
    const sizePatterns = [
      /"size[^"]*"[:\s]*"([^"]+)"/i,           // JSON-LD oder data-Attribute
      /Größe[:\s]*<[^>]+>\s*([^<]+)/i,         // Direktes HTML
      /size[:\s]*<[^>]+>\s*([^<]+)/i,          // Englisch
      /class="[^"]*size[^"]*"[^{]*>\s*([^<]+)/i, // CSS Klasse
      /\b(XS|S|M|L|XL|XXL|XXXL|One Size|Einheitsgröße)\b/i, // Standardgrößen
      /(\d{2,3})\s*(?:cm|CM)?\s*[·\/]/,        // Numerische Größen mit Trenner
    ];
    
    let size = '';
    for (const pattern of sizePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        size = match[1].trim();
        // Bereinigen
        size = size.replace(/·|\//g, '').trim();
        if (size && size.length < 20) break; // Plausibilitätscheck
      }
    }

    // ── ZUSTAND ─────────────────────────────────────────────────────────────
    const condMap: Record<string, string> = {
      'neu mit etikett': 'Neu mit Etikett',
      'neu': 'Neu',
      'sehr gut': 'Sehr gut',
      'gut': 'Gut',
      'zufriedenstellend': 'Zufriedenstellend',
      'schlecht': 'Schlecht',
    };
    
    let condition = '';
    const htmlLower = html.toLowerCase();
    for (const [key, val] of Object.entries(condMap)) {
      // Suche nach Zustand in verschiedenen Kontexten
      if (htmlLower.includes(key) || 
          htmlLower.includes(`>${key}<`) ||
          htmlLower.includes(`"${key}"`) ||
          htmlLower.includes(`'${key}'`)) {
        condition = val;
        break;
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

    // Debug-Info für Entwicklung
    const debug = {
      imageCount: images.length,
      htmlSnippet: html.substring(0, 500).replace(/\s+/g, ' '),
    };

    return NextResponse.json({
      name,
      price,
      size,
      condition,
      category,
      images: images.slice(0, 10),
      // debug, // Nur zum Testen aktivieren
    }, { headers: CORS });

  } catch (e) {
    console.error('Scraper Error:', e);
    return NextResponse.json({ message: 'Fehler: ' + String(e) }, { status: 500, headers: CORS });
  }
}
