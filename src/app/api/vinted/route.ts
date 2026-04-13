// src/app/api/vinted/route.ts
import { NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

// TYPEN
interface StoredItem {
  id: string;
  url: string;
  status?: 'available' | 'sold' | 'reserved';
  lastChecked?: string;
}

interface ScrapeResult {
  itemId: string | null;
  url: string;
  status: 'available' | 'sold' | 'reserved';
  name: string;
  price: string;
  size: string;
  condition: string;
  category: string;
  images: string[];
  lastChecked: string;
  error?: boolean;
  message?: string;
  action?: string;
  warning?: string;
}

// HILFSFUNKTIONEN
function extractItemFromHTML(html: string, url: string): ScrapeResult {
  // ═══════════════════════════════════════════════════════════════════════════════
  // STATUS CHECK - KORRIGIERT
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Prüfe ob Seite existiert
  if (html.includes('404') && html.includes('nicht gefunden')) {
    return { 
      itemId: null, url, status: 'sold', name: '', price: '', size: '', condition: '',
      category: 'Sonstiges', images: [], error: true,
      message: 'Seite nicht gefunden (404)',
      lastChecked: new Date().toISOString(),
    };
  }

  // WICHTIG: Prüfe ob Produkt-DATA vorhanden ist
  const hasProduct = html.includes('item-details') || 
                     html.includes('item-title') ||
                     html.includes('"@type":"Product"') ||
                     html.includes('data-testid="item-page"');

  // Verkauft-Indikatoren (nur wenn wirklich eindeutig)
  const soldPatterns = [
    /Dieser Artikel ist bereits verkauft/i,
    /Dieser Artikel ist nicht mehr verfügbar/i,
    /Artikel wurde verkauft/i,
    /item-not-available/i,
    /"availability":\s*"https:\/\/schema\.org\/OutOfStock"/i,
  ];

  const reservedPatterns = [
    /Dieser Artikel ist reserviert/i,
    /item-reserved/i,
  ];

  let itemStatus: 'available' | 'sold' | 'reserved' = 'available';

  // Prüfe auf "verkauft"
  for (const pattern of soldPatterns) {
    if (pattern.test(html)) {
      itemStatus = 'sold';
      break;
    }
  }

  // Prüfe auf "reserviert"
  if (itemStatus === 'available') {
    for (const pattern of reservedPatterns) {
      if (pattern.test(html)) {
        itemStatus = 'reserved';
        break;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // BILDER
  // ═══════════════════════════════════════════════════════════════════════════════
  const imgMatches = [...html.matchAll(/https:\/\/images\d*\.vinted\.net\/[^"'\s<>]+/g)];
  const seen = new Set<string>();
  const images: string[] = [];
  
  for (const m of imgMatches) {
    let fullUrl = m[0];
    if (!fullUrl.includes('/f800/') && !fullUrl.includes('/t/')) continue;
    fullUrl = fullUrl.replace(/&amp;/g, '&');
    const base = fullUrl.split('?')[0];
    if (!seen.has(base)) {
      seen.add(base);
      images.push(`/api/image-proxy?url=${encodeURIComponent(fullUrl)}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // NAME - JSON-LD priorisiert
  // ═══════════════════════════════════════════════════════════════════════════════
  let name = '';
  
  // JSON-LD suchen
  const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  let jsonData: any = null;
  
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@type'] === 'Product' || data.name) {
        jsonData = data;
        if (data.name) name = data.name;
        break;
      }
    } catch (e) {}
  }

  // Fallback: OG Title
  if (!name) {
    const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
    if (ogTitle) name = ogTitle[1].replace(/\s*\|\s*Vinted$/i, '').trim();
  }

  // Fallback: H1
  if (!name) {
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) name = h1Match[1].trim();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GRÖSSE - VERBESSERT MIT JSON-LD
  // ═══════════════════════════════════════════════════════════════════════════════
  let size = '';

  // Versuch 1: Aus JSON-LD (size Objekt)
  if (jsonData) {
    // Suche nach size in verschachtelten Strukturen
    const findSize = (obj: any, depth = 0): string | null => {
      if (depth > 5 || !obj) return null;
      
      if (obj.size) {
        if (typeof obj.size === 'string') return obj.size;
        if (typeof obj.size === 'object' && obj.size.name) return obj.size.name;
        if (Array.isArray(obj.size) && obj.size.length > 0) return obj.size[0].name || obj.size[0];
      }
      
      if (obj.size_name) return obj.size_name;
      if (obj.sizes && Array.isArray(obj.size) && obj.sizes.length > 0) {
        return obj.sizes[0].name || obj.sizes[0];
      }
      
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          const found = findSize(obj[key], depth + 1);
          if (found) return found;
        }
      }
      return null;
    };
    
    const foundSize = findSize(jsonData);
    if (foundSize) size = foundSize;
  }

  // Versuch 2: Aus HTML-Struktur (neue Vinted UI)
  if (!size) {
    // Suche nach data-testid="item-details-size" oder ähnlich
    const sizeMatch = html.match(/data-testid="[^"]*size[^"]*"[^>]*>\s*([^<]+)/i) ||
                     html.match(/Größe[:\s]*<\/[^>]+>\s*<[^>]+class="[^"]*value[^"]*"[^>]*>\s*([^<]+)/i) ||
                     html.match(/class="[^"]*item-details[^"]*"[^>]*>[\s\S]*?Größe[:\s]*([^<]+)/i);
    if (sizeMatch) size = sizeMatch[1].trim();
  }

  // Versuch 3: Breite Suche nach Größen-Mustern im Text
  if (!size) {
    // Suche im Bereich um "Größe" herum
    const sizeContext = html.match(/Größe[:\s]+([A-Z0-9]{1,5}(?:\/[A-Z0-9]{1,5})?)/i) ||
                       html.match(/Size[:\s]+([A-Z0-9]{1,5})/i) ||
                       html.match(/(?:Größe|Size)[:\s]+(\d{2,3})/i);
    if (sizeContext) size = sizeContext[1];
  }

  // Versuch 4: Gängige Größen im Titel suchen
  if (!size && name) {
    const sizeInTitle = name.match(/\b(XXS|XS|S|M|L|XL|XXL|XXXL|3XL|4XL|5XL|One Size|UNI|\d{2,3})\b/i);
    if (sizeInTitle) size = sizeInTitle[1];
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PREIS
  // ═══════════════════════════════════════════════════════════════════════════════
  let price = '';

  // Aus JSON-LD
  if (jsonData) {
    const findPrice = (obj: any): string | null => {
      if (!obj) return null;
      if (obj.price) {
        const p = typeof obj.price === 'object' ? obj.price.value || obj.price.amount : obj.price;
        return String(p).replace('.', ',');
      }
      if (obj.offers && obj.offers.price) {
        return String(obj.offers.price).replace('.', ',');
      }
      return null;
    };
    const p = findPrice(jsonData);
    if (p) price = p;
  }

  // Aus Meta
  if (!price) {
    const priceMeta = html.match(/<meta property="product:price:amount" content="([^"]+)"/i);
    if (priceMeta) price = priceMeta[1].replace('.', ',');
  }

  // Aus Text (nur erster Treffer)
  if (!price) {
    const priceMatch = html.match(/(\d{1,3}(?:[.,]\d{2})?)\s*€/);
    if (priceMatch) price = priceMatch[1].replace('.', ',');
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ZUSTAND
  // ═══════════════════════════════════════════════════════════════════════════════
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

  // Aus JSON-LD
  if (jsonData && jsonData.itemCondition) {
    const cond = jsonData.itemCondition.toString().toLowerCase();
    if (cond.includes('new')) condition = 'Neu';
    else if (cond.includes('used')) condition = 'Gut';
  }

  // Aus Text (nur ganze Wörter)
  if (!condition) {
    const htmlLower = html.toLowerCase();
    for (const [key, val] of Object.entries(condMap)) {
      // Word boundary mit Lookbehind/lookahead
      const pattern = new RegExp(`(?:^|[\\s>])${key}(?:[\\s<.,]|$)`, 'i');
      if (pattern.test(htmlLower)) {
        condition = val;
        break;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // KATEGORIE
  // ═══════════════════════════════════════════════════════════════════════════════
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
  
  for (const [key, val] of Object.entries(catMap)) {
    if (nameLower.includes(key)) {
      category = val;
      break;
    }
  }

  // ITEM ID
  const itemIdMatch = url.match(/\/items\/(\d+)-/);
  const itemId = itemIdMatch ? itemIdMatch[1] : null;

  return {
    itemId,
    url,
    status: itemStatus,
    name,
    price,
    size,
    condition,
    category,
    images: images.slice(0, 5),
    lastChecked: new Date().toISOString(),
  };
}

async function scrapeSingleItem(url: string): Promise<ScrapeResult> {
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
    if (response.status === 404 || response.status === 410) {
      return { 
        itemId: null, url, status: 'sold', name: '', price: '', size: '', condition: '',
        category: 'Sonstiges', images: [], error: true,
        message: 'Nicht mehr verfügbar (404/410)',
        lastChecked: new Date().toISOString(),
      };
    }
    throw new Error(`Vinted nicht erreichbar: ${response.status}`);
  }

  const html = await response.text();
  return extractItemFromHTML(html, url);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BULK SCRAPE - MIT ACCOUNT LINK (PROFIL-URL)
// ═══════════════════════════════════════════════════════════════════════════════
async function getAllUserItems(profileUrl: string): Promise<string[]> {
  const urls: string[] = [];
  let page = 1;
  const maxPages = 5; // Reduziert für Stabilität
  
  // Extrahiere Username aus verschiedenen URL-Formaten
  let username: string | null = null;
  
  // Format: https://www.vinted.de/member/123456-username oder /u/username
  const memberMatch = profileUrl.match(/\/member\/\d+-([^/?]+)/) || 
                      profileUrl.match(/\/u\/([^/?]+)/) ||
                      profileUrl.match(/\/member\/([^/?]+)/);
  
  if (memberMatch) {
    username = memberMatch[1];
  } else {
    // Direkter Username eingegeben
    username = profileUrl.replace(/^@/, '').trim();
  }

  if (!username) {
    console.error('Kein Username gefunden in:', profileUrl);
    return [];
  }

  console.log('Suche Items für User:', username);

  while (page <= maxPages) {
    // Versuche verschiedene URL-Formate
    const urlsToTry = [
      `https://www.vinted.de/member/${username}?page=${page}`,
      `https://www.vinted.de/u/${username}?page=${page}`,
    ];

    let success = false;
    
    for (const tryUrl of urlsToTry) {
      try {
        console.log('Versuche:', tryUrl);
        
        const response = await fetch(tryUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'de-DE,de;q=0.9',
            'Referer': 'https://www.vinted.de/',
          },
        });

        if (!response.ok) continue;

        const html = await response.text();
        
        // Prüfe ob Profil existiert
        if (html.includes('404') || html.includes('nicht gefunden')) {
          console.log('Profil nicht gefunder:', tryUrl);
          continue;
        }

        // Extrahiere Item-URLs - verschiedene Muster
        const itemMatches = [
          ...html.matchAll(/href="(\/items\/\d+-[^"]+)"/g),
          ...html.matchAll(/href="(\/item\/\d+[^"]*)"/g),
        ];
        
        const pageUrls = itemMatches.map(m => {
          const path = m[1];
          return path.startsWith('http') ? path : `https://www.vinted.de${path}`;
        });

        console.log(`Seite ${page}: ${pageUrls.length} Items gefunden`);

        if (pageUrls.length === 0) {
          success = true;
          break; // Keine Items mehr
        }
        
        urls.push(...pageUrls);
        success = true;
        
        // Prüfe auf weitere Seiten
        const hasNext = html.includes(`page=${page + 1}`) || 
                       html.includes('rel="next"') ||
                       html.includes('pagination__next');
        
        if (!hasNext) {
          page = maxPages + 1; // Beende Schleife
          break;
        }
        
        break; // Erfolg, nächste Seite
        
      } catch (e) {
        console.error('Fehler bei:', tryUrl, e);
      }
    }

    if (!success) break;
    
    page++;
    await new Promise(r => setTimeout(r, 1500)); // Längerer Delay
  }

  const uniqueUrls = [...new Set(urls)];
  console.log('Gesamt einzigartige URLs:', uniqueUrls.length);
  return uniqueUrls;
}

async function bulkScrapeItems(urls: string[], concurrency: number = 2): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];
  const queue = [...urls];
  let activeWorkers = 0;
  
  return new Promise((resolve) => {
    async function worker() {
      activeWorkers++;
      
      while (queue.length > 0) {
        const url = queue.shift();
        if (!url) continue;
        
        try {
          const data = await scrapeSingleItem(url);
          results.push(data);
          await new Promise(r => setTimeout(r, 800)); // Längerer Delay
        } catch (e) {
          console.error(`Fehler bei ${url}:`, e);
          results.push({ 
            itemId: null, url, status: 'sold', name: '', price: '', size: '', condition: '',
            category: 'Sonstiges', images: [], error: true, message: String(e),
            lastChecked: new Date().toISOString(),
          });
        }
      }
      
      activeWorkers--;
      if (activeWorkers === 0) resolve(results);
    }
    
    for (let i = 0; i < Math.min(concurrency, urls.length); i++) {
      worker();
    }
    
    if (urls.length === 0) resolve([]);
  });
}

// API ROUTES
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const url = searchParams.get('url');
    const autoRemove = searchParams.get('autoRemove') === 'true';

    if (mode === 'single' && url) {
      const data = await scrapeSingleItem(url);
      return NextResponse.json({ ...data, action: data.status === 'sold' && autoRemove ? 'remove' : 'keep' }, { headers: CORS });
    }

    return NextResponse.json({ message: 'Verwende ?mode=single&url=...' }, { headers: CORS });

  } catch (e) {
    return NextResponse.json({ message: 'Fehler: ' + String(e) }, { status: 500, headers: CORS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, urls, profileUrl, username, mode = 'single', autoRemove = false } = body;

    // ═══ EINZELNES ITEM ═══
    if (mode === 'single' && url) {
      if (!url.includes('vinted')) {
        return NextResponse.json({ message: 'Ungültige URL' }, { status: 400, headers: CORS });
      }

      const data = await scrapeSingleItem(url);

      if (data.status === 'sold') {
        return NextResponse.json({
          ...data,
          warning: '⚠️ Item ist VERKAUFT',
          action: autoRemove ? 'removed' : 'suggest_remove',
        }, { headers: CORS });
      }

      return NextResponse.json(data, { headers: CORS });
    }

    // ═══ BULK SCRAPE ═══
    if (mode === 'bulk') {
      let urlsToScrape: string[] = [];

      // Option 1: Profil-URL oder Username
      if (profileUrl || username) {
        const identifier = profileUrl || username;
        urlsToScrape = await getAllUserItems(identifier);
        
        if (urlsToScrape.length === 0) {
          return NextResponse.json(
            { message: 'Keine Items gefunden. Tip: Verwende die Profil-URL (z.B. https://www.vinted.de/member/123456-username)' }, 
            { status: 404, headers: CORS }
          );
        }
      } 
      // Option 2: Direkte URLs
      else if (urls && Array.isArray(urls)) {
        urlsToScrape = urls.filter((u: string) => u.includes('vinted'));
      } else {
        return NextResponse.json(
          { message: 'profileUrl, username oder urls Array erforderlich' }, 
          { status: 400, headers: CORS }
        );
      }

      // Quick Mode: Nur URLs zurückgeben
      if (body.quick === true) {
        return NextResponse.json({
          totalItems: urlsToScrape.length,
          itemUrls: urlsToScrape,
          message: `${urlsToScrape.length} URLs gefunden`,
        }, { headers: CORS });
      }

      // Scrape alle Items
      const results = await bulkScrapeItems(urlsToScrape, 2);
      
      const successful = results.filter(r => !r.error && r.status === 'available');
      const sold = results.filter(r => r.status === 'sold');
      const reserved = results.filter(r => r.status === 'reserved');
      const errors = results.filter(r => r.error);

      return NextResponse.json({
        timestamp: new Date().toISOString(),
        summary: {
          total: results.length,
          available: successful.length,
          sold: sold.length,
          reserved: reserved.length,
          errors: errors.length,
        },
        items: {
          added: successful,
          skipped: [...sold, ...reserved],
          failed: errors,
        },
        message: `✅ ${successful.length} verfügbar, ${sold.length} verkauft, ${reserved.length} reserviert`,
      }, { headers: CORS });
    }

    return NextResponse.json(
      { message: 'Ungültiger Modus' }, 
      { status: 400, headers: CORS }
    );

  } catch (e) {
    console.error('Scraper Error:', e);
    return NextResponse.json({ message: 'Fehler: ' + String(e) }, { status: 500, headers: CORS });
  }
}
