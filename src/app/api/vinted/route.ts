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
  // STATUS CHECK - VERBESSERT 2024
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Zuerst prüfen ob die Seite überhaupt ein Produkt enthält
  const hasProductData = html.includes('item-details') || 
                         html.includes('item-header') ||
                         html.includes('data-testid="item-page"') ||
                         html.includes('application/ld+json') ||
                         /"@type"\s*:\s*"Product"/i.test(html);

  // Wenn keine Produktdaten gefunden, ist es wahrscheinlich ein Fehler/404
  if (!hasProductData && (html.includes('404') || html.includes('nicht gefunden'))) {
    return { 
      itemId: null,
      url, 
      status: 'sold', 
      name: '',
      price: '',
      size: '',
      condition: '',
      category: 'Sonstiges',
      images: [],
      error: true,
      message: 'Seite nicht gefunden (404)',
      lastChecked: new Date().toISOString(),
    };
  }

  // Verkauft/Reserviert Indikatoren - NUR zuverlässige Signale
  const soldIndicators = [
    // Starke Indikatoren (Seite existiert aber Item nicht verfügbar)
    /<h1[^>]*>[^<]*nicht verfügbar/i,
    /Dieser Artikel ist (bereits )?verkauft/i,
    /Artikel wurde (bereits )?verkauft/i,
    /Dieser Artikel ist nicht mehr verfügbar/i,
    /Item not available/i,
    /This item has been sold/i,
    /data-testid="item-not-available"/i,
    /class="[^"]*item-sold-out[^"]*"/i,
    // HTTP Status im HTML
    /"statusCode":\s*404/,
    /"availability":\s*"https:\/\/schema\.org\/OutOfStock"/i,
  ];

  const reservedIndicators = [
    /Dieser Artikel ist reserviert/i,
    /This item is reserved/i,
    /Reserviert für/i,
    /data-testid="item-reserved"/i,
    /"availability":\s*"https:\/\/schema\.org\/PreOrder"/i,
  ];

  let itemStatus: 'available' | 'sold' | 'reserved' = 'available';

  // Prüfe auf "verkauft" - aber nur wenn wirklich sicher
  for (const pattern of soldIndicators) {
    if (pattern.test(html)) {
      itemStatus = 'sold';
      break;
    }
  }

  // Prüfe auf "reserviert" nur wenn nicht bereits verkauft
  if (itemStatus === 'available') {
    for (const pattern of reservedIndicators) {
      if (pattern.test(html)) {
        itemStatus = 'reserved';
        break;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // BILDER - VERBESSERT
  // ═══════════════════════════════════════════════════════════════════════════════
  const imgMatches = [...html.matchAll(/https:\/\/images\d*\.vinted\.net\/[^"'\s<>]+/g)];
  const seen = new Set<string>();
  const images: string[] = [];
  
  for (const m of imgMatches) {
    let fullUrl = m[0];
    // Nur hochauflösende Bilder (f800 oder ähnlich)
    if (!fullUrl.includes('/f800/') && !fullUrl.includes('/t/')) continue;
    fullUrl = fullUrl.replace(/&amp;/g, '&');
    const base = fullUrl.split('?')[0];
    if (!seen.has(base)) {
      seen.add(base);
      images.push(`/api/image-proxy?url=${encodeURIComponent(fullUrl)}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // NAME - VERBESSERT
  // ═══════════════════════════════════════════════════════════════════════════════
  let name = '';
  
  // Versuch 1: JSON-LD Product name
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const jsonData = JSON.parse(jsonLdMatch[1]);
      if (jsonData.name && typeof jsonData.name === 'string') {
        name = jsonData.name.trim();
      }
    } catch (e) {}
  }

  // Versuch 2: Meta title
  if (!name) {
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) ||
                      html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      name = titleMatch[1].replace(/\s*\|\s*Vinted$/i, '').trim();
    }
  }

  // Versuch 3: H1
  if (!name) {
    const h1Match = html.match(/<h1[^>]*data-testid="item-title"[^>]*>([^<]+)<\/h1>/i) ||
                   html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) name = h1Match[1].trim();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GRÖSSE - VERBESSERT 2024
  // ═══════════════════════════════════════════════════════════════════════════════
  let size = '';

  // Versuch 1: JSON-LD Größe (neuere Vinted Version)
  if (jsonLdMatch) {
    try {
      const jsonData = JSON.parse(jsonLdMatch[1]);
      // Suche in verschachtelten Objekten nach size
      const findSize = (obj: any): string | null => {
        if (!obj) return null;
        if (obj.size && typeof obj.size === 'string') return obj.size;
        if (obj.size_name && typeof obj.size_name === 'string') return obj.size_name;
        if (obj.sizes && Array.isArray(obj.sizes)) return obj.sizes[0];
        for (const key in obj) {
          if (typeof obj[key] === 'object') {
            const found = findSize(obj[key]);
            if (found) return found;
          }
        }
        return null;
      };
      const foundSize = findSize(jsonData);
      if (foundSize) size = foundSize;
    } catch (e) {}
  }

  // Versuch 2: Neue Vinted UI Struktur (data-testid)
  if (!size) {
    const sizeMatch = html.match(/data-testid="item-details-size"[^>]*>\s*([^<]+)/i) ||
                     html.match(/data-testid="size"[^>]*>\s*([^<]+)/i) ||
                     html.match(/Größe[:\s]*<\/[^>]+>\s*<[^>]+>\s*([^<]{1,15})/i);
    if (sizeMatch) {
      size = sizeMatch[1].trim();
    }
  }

  // Versuch 3: Item Details Section
  if (!size) {
    // Suche nach "Größe" gefolgt von Wert in der Nähe
    const detailSection = html.match(/item-details|item-description|product-details/i);
    if (detailSection) {
      const sizeInContext = html.match(/(?:Größe|Size)[\s:]*([A-Z0-9]{1,4}(?:\/[A-Z0-9]{1,4})?)/i) ||
                           html.match(/(?:Größe|Size)[\s:]*(\d{2,3})/i);
      if (sizeInContext) size = sizeInContext[1].trim();
    }
  }

  // Versuch 4: Breite Suche nach gängigen Größenmustern
  if (!size) {
    const commonSizes = [
      /(?:Größe|Size|Taille)[\s:]*((?:XXS|XS|S|M|L|XL|XXL|XXXL|3XL|4XL|5XL))/i,
      /(?:Größe|Size)[\s:]*(\d{2,3}\s*(?:cm)?)/i,
      /(?:Größe|Size)[\s:]*(One Size|Einheitsgröße|UNI)/i,
      /Gr\.\s*([A-Z0-9]{1,4})/i,
    ];
    for (const pattern of commonSizes) {
      const match = html.match(pattern);
      if (match) {
        size = match[1].trim();
        break;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PREIS - VERBESSERT
  // ═══════════════════════════════════════════════════════════════════════════════
  let price = '';

  // Versuch 1: JSON-LD
  if (jsonLdMatch) {
    try {
      const jsonData = JSON.parse(jsonLdMatch[1]);
      const findPrice = (obj: any): string | null => {
        if (!obj) return null;
        if (obj.price && (typeof obj.price === 'string' || typeof obj.price === 'number')) {
          return String(obj.price).replace('.', ',');
        }
        if (obj.offers && obj.offers.price) {
          return String(obj.offers.price).replace('.', ',');
        }
        for (const key in obj) {
          if (typeof obj[key] === 'object') {
            const found = findPrice(obj[key]);
            if (found) return found;
          }
        }
        return null;
      };
      const foundPrice = findPrice(jsonData);
      if (foundPrice) price = foundPrice;
    } catch (e) {}
  }

  // Versuch 2: Meta tags
  if (!price) {
    const priceMeta = html.match(/<meta property="product:price:amount" content="([^"]+)"/i) ||
                     html.match(/"price":\s*"?(\d+[.,]?\d*)/i);
    if (priceMeta) price = priceMeta[1].replace('.', ',');
  }

  // Versuch 3: Im Text suchen (nur wenn nicht zu weit unten)
  if (!price) {
    const priceSection = html.substring(0, 50000); // Nur erster Teil
    const priceMatch = priceSection.match(/(\d{1,3}(?:[.,]\d{2})?)\s*(?:€|EUR|€)/i);
    if (priceMatch) price = priceMatch[1].replace('.', ',');
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ZUSTAND - VERBESSERT
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

  // Versuch 1: JSON-LD
  if (jsonLdMatch) {
    try {
      const jsonData = JSON.parse(jsonLdMatch[1]);
      const itemCondition = jsonData.itemCondition || 
                           (jsonData.offers && jsonData.offers.itemCondition);
      if (itemCondition) {
        const conditionUrl = itemCondition.toString().toLowerCase();
        if (conditionUrl.includes('newcondition')) condition = 'Neu';
        else if (conditionUrl.includes('usedcondition')) condition = 'Gut';
      }
    } catch (e) {}
  }

  // Versuch 2: Direkte Text-Suche (nur ganze Wörter)
  if (!condition) {
    const htmlLower = html.toLowerCase();
    // Sortiert nach Länge (längere zuerst)
    const conditions = ['neu mit etikett', 'neu ohne etikett', 'sehr gut', 'zufriedenstellend', 'schlecht', 'gut', 'neu'];
    for (const key of conditions) {
      // Word boundary check
      const pattern = new RegExp(`(?:^|[\\s>"])${key}(?:[\\s<".,]|$)`, 'i');
      if (pattern.test(htmlLower)) {
        condition = condMap[key];
        break;
      }
    }
  }

  // Versuch 3: In der Nähe von "Zustand"
  if (!condition) {
    const contextMatch = html.match(/Zustand[:\s]*([^<.,]{3,30})/i);
    if (contextMatch) {
      const raw = contextMatch[1].toLowerCase().trim();
      for (const [key, val] of Object.entries(condMap)) {
        if (raw.includes(key)) { condition = val; break; }
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
  const urlLower = url.toLowerCase();
  
  for (const [key, val] of Object.entries(catMap)) {
    if (nameLower.includes(key) || urlLower.includes(key)) {
      category = val;
      break;
    }
  }

  // ITEM ID
  const itemIdMatch = url.match(/\/items\/(\d+)-/) || url.match(/item_id=(\d+)/);
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
        itemId: null,
        url, 
        status: 'sold', 
        name: '',
        price: '',
        size: '',
        condition: '',
        category: 'Sonstiges',
        images: [],
        error: true,
        message: 'Nicht mehr verfügbar (404/410)',
        lastChecked: new Date().toISOString(),
      };
    }
    throw new Error(`Vinted nicht erreichbar: ${response.status}`);
  }

  const html = await response.text();
  return extractItemFromHTML(html, url);
}

async function getAllUserItems(usernameOrId: string): Promise<string[]> {
  const urls: string[] = [];
  let page = 1;
  const maxPages = 10;
  
  while (page <= maxPages) {
    const profileUrl = `https://www.vinted.de/member/${usernameOrId}?page=${page}`;
    
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9',
        'Referer': 'https://www.vinted.de/',
      },
    });

    if (!response.ok) break;

    const html = await response.text();
    
    const itemMatches = [...html.matchAll(/href="(\/items\/\d+-[^"]+)"/g)];
    const pageUrls = itemMatches.map(m => `https://www.vinted.de${m[1]}`);
    
    if (pageUrls.length === 0) break;
    
    urls.push(...pageUrls);
    
    const hasNextPage = html.includes(`page=${page + 1}`) || 
                       html.includes('pagination') ||
                       html.includes('rel="next"');
    
    if (!hasNextPage) break;
    
    page++;
    await new Promise(r => setTimeout(r, 1000));
  }

  return [...new Set(urls)];
}

async function bulkScrapeItems(urls: string[], concurrency: number = 3): Promise<ScrapeResult[]> {
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
          await new Promise(r => setTimeout(r, 500));
        } catch (e) {
          console.error(`Fehler bei ${url}:`, e);
          results.push({ 
            itemId: null,
            url, 
            status: 'sold',
            name: '',
            price: '',
            size: '',
            condition: '',
            category: 'Sonstiges',
            images: [],
            error: true, 
            message: String(e),
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
      
      return NextResponse.json({
        ...data,
        action: data.status === 'sold' && autoRemove ? 'remove' : 'keep',
      }, { headers: CORS });
    }

    if (mode === 'status-check') {
      const mockItems: StoredItem[] = [];

      const results = {
        checked: 0,
        sold: [] as ScrapeResult[],
        reserved: [] as ScrapeResult[],
        available: [] as ScrapeResult[],
        removed: [] as string[],
        errors: [] as { id: string; error: string }[],
      };

      for (const item of mockItems) {
        try {
          const data = await scrapeSingleItem(item.url);
          results.checked++;

          if (data.status === 'sold') {
            results.sold.push(data);
            if (autoRemove) {
              results.removed.push(item.id);
            }
          } else if (data.status === 'reserved') {
            results.reserved.push(data);
          } else {
            results.available.push(data);
          }
          
          await new Promise(r => setTimeout(r, 500));
        } catch (e) {
          results.errors.push({ id: item.id, error: String(e) });
        }
      }

      return NextResponse.json({
        timestamp: new Date().toISOString(),
        ...results,
        message: autoRemove && results.removed.length > 0 
          ? `${results.removed.length} verkaufte Items entfernt`
          : `${results.sold.length} Items als verkauft markiert`,
      }, { headers: CORS });
    }

    return NextResponse.json({ 
      message: 'Verwende ?mode=single&url=... oder ?mode=status-check' 
    }, { headers: CORS });

  } catch (e) {
    return NextResponse.json({ message: 'Fehler: ' + String(e) }, { status: 500, headers: CORS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      url,
      urls,
      username,
      userId,
      mode = 'single',
      autoRemove = false,
    } = body;

    if (mode === 'single' && url) {
      if (!url.includes('vinted')) {
        return NextResponse.json({ message: 'Ungültige URL' }, { status: 400, headers: CORS });
      }

      const data = await scrapeSingleItem(url);

      if (data.status === 'sold' && autoRemove) {
        return NextResponse.json({
          ...data,
          action: 'removed',
          message: '⚠️ Item ist VERKAUFT und wurde aus der Datenbank entfernt',
        }, { headers: CORS });
      }

      if (data.status === 'sold') {
        return NextResponse.json({
          ...data,
          warning: '⚠️ Item ist VERKAUFT - soll aus der Datenbank entfernt werden?',
          action: 'suggest_remove',
        }, { headers: CORS });
      }

      return NextResponse.json(data, { headers: CORS });
    }

    if (mode === 'bulk') {
      let urlsToScrape: string[] = [];

      if (username || userId) {
        const identifier = username || userId;
        urlsToScrape = await getAllUserItems(identifier);
        
        if (urlsToScrape.length === 0) {
          return NextResponse.json(
            { message: 'Keine Items gefunden für: ' + identifier }, 
            { status: 404, headers: CORS }
          );
        }
      } else if (urls && Array.isArray(urls)) {
        urlsToScrape = urls.filter((u: string) => u.includes('vinted'));
      } else {
        return NextResponse.json(
          { message: 'username, userId oder urls Array erforderlich' }, 
          { status: 400, headers: CORS }
        );
      }

      if (body.quick === true) {
        return NextResponse.json({
          totalItems: urlsToScrape.length,
          itemUrls: urlsToScrape,
          message: 'URLs gefunden. Setze quick: false zum Scrapen.',
        }, { headers: CORS });
      }

      const results = await bulkScrapeItems(urlsToScrape, 3);
      
      const successful = results.filter(r => !r.error && r.status !== 'sold');
      const sold = results.filter(r => r.status === 'sold');
      const reserved = results.filter(r => r.status === 'reserved');
      const errors = results.filter(r => r.error);

      let removed: string[] = [];
      if (autoRemove && sold.length > 0) {
        removed = sold.map(s => s.itemId || s.url).filter((id): id is string => id !== null);
      }

      return NextResponse.json({
        timestamp: new Date().toISOString(),
        summary: {
          total: results.length,
          available: successful.length,
          sold: sold.length,
          reserved: reserved.length,
          errors: errors.length,
          autoRemoved: removed.length,
        },
        items: {
          added: successful,
          skipped: sold,
          reserved: reserved,
          failed: errors,
        },
        soldItems: sold.map(s => ({
          itemId: s.itemId,
          url: s.url,
          name: s.name,
          reason: 'Verkauft/Reserviert',
        })),
        message: autoRemove && removed.length > 0
          ? `✅ ${successful.length} Items hinzugefügt, ${removed.length} verkaufte entfernt`
          : `✅ ${successful.length} Items hinzugefügt, ${sold.length} verkaufte übersprungen`,
      }, { headers: CORS });
    }

    return NextResponse.json(
      { message: 'Ungültiger Modus. Verwende mode: "single" oder "bulk"' }, 
      { status: 400, headers: CORS }
    );

  } catch (e) {
    console.error('Scraper Error:', e);
    return NextResponse.json(
      { message: 'Fehler: ' + String(e) }, 
      { status: 500, headers: CORS }
    );
  }
}
