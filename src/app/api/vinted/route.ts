// app/api/scrape-vinted/route.ts
import { NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPEN
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// HILFSFUNKTIONEN
// ═══════════════════════════════════════════════════════════════════════════════

function extractItemFromHTML(html: string, url: string): ScrapeResult {
  // ── STATUS CHECK ─────────────────────────────────────────────────────────────
  const statusIndicators = {
    sold: [
      /Dieser Artikel ist bereits verkauft/i,
      /Artikel nicht verfügbar/i,
      /reserviert/i,
      /sold/i,
      /verkauft/i,
      /nicht mehr verfügbar/i,
      /data-testid="item-sold"/i,
      /class="[^"]*item-sold[^"]*"/i,
      /Dieser Artikel ist reserviert/i,
    ],
    reserved: [
      /reserviert/i,
      /reserved/i,
      /vorübergehend nicht verfügbar/i,
      /Dieser Artikel ist reserviert/i,
    ]
  };

  let itemStatus: 'available' | 'sold' | 'reserved' = 'available';
  
  for (const pattern of statusIndicators.sold) {
    if (pattern.test(html)) {
      itemStatus = 'sold';
      break;
    }
  }
  
  if (itemStatus === 'available') {
    for (const pattern of statusIndicators.reserved) {
      if (pattern.test(html)) {
        itemStatus = 'reserved';
        break;
      }
    }
  }

  // ── BILDER ───────────────────────────────────────────────────────────────────
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
      images.push(`/api/image-proxy?url=${encodeURIComponent(fullUrl)}`);
    }
  }

  // ── NAME ─────────────────────────────────────────────────────────────────────
  const h1Match = html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/i);
  const titleMatch = html.match(/<title>\s*([^|<]+)/i);
  const name = (h1Match?.[1] || titleMatch?.[1] || '').trim();

  // ── GRÖSSE ───────────────────────────────────────────────────────────────────
  let size = '';
  const sizeJsonMatch = html.match(/"size"[:\s]*"([^"]{1,20})"/i) ||
                       html.match(/"size_name"[:\s]*"([^"]{1,20})"/i) ||
                       html.match(/"size_title"[:\s]*"([^"]{1,20})"/i);
  if (sizeJsonMatch) size = sizeJsonMatch[1].trim();

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

  if (!size) {
    const broadMatch = html.match(/(?:Größe|Grösse|Size)[^\w]{0,10}(XXS|XS|S|M|L|XL|XXL|XXXL|4XL|5XL|One Size|Einheitsgröße|UNI|\d{2,3})/i);
    if (broadMatch) size = broadMatch[1].trim();
  }

  if (!size) {
    const numericMatch = html.match(/(?:Größe|Size)[^\d]{0,15}(\d{2,3})\b/i);
    if (numericMatch) size = numericMatch[1];
  }

  // ── PREIS ────────────────────────────────────────────────────────────────────
  let price = '';
  const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  for (const jsonMatch of jsonLdMatches) {
    try {
      const jsonData = JSON.parse(jsonMatch[1]);
      const findPrice = (obj: any): string | null => {
        if (!obj) return null;
        if (obj.price) return obj.price.toString().replace('.', ',');
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
    if (priceMatch) price = priceMatch[1];
  }

  // ── ZUSTAND ──────────────────────────────────────────────────────────────────
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
  const directMatch = html.match(/>(Neu mit Etikett|Neu ohne Etikett|Sehr gut|Zufriedenstellend|Schlecht|Gut|Neu)</i);
  if (directMatch) condition = directMatch[1];

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

  if (!condition) {
    const contextMatch = html.match(/Zustand[^<]{0,50}(Neu mit Etikett|Neu ohne Etikett|Sehr gut|Zufriedenstellend|Schlecht|Gut|Neu)/i);
    if (contextMatch) condition = contextMatch[1];
  }

  if (!condition) {
    const htmlLower = html.toLowerCase();
    const order = ['neu mit etikett', 'neu ohne etikett', 'sehr gut', 'zufriedenstellend', 'schlecht', 'gut'];
    for (const key of order) {
      const pattern = new RegExp(`[>\\s"']${key}[<\\s"'·]`, 'i');
      if (pattern.test(htmlLower)) {
        condition = condMap[key];
        break;
      }
    }
  }

  // ── KATEGORIE ────────────────────────────────────────────────────────────────
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

  // ── ITEM ID ──────────────────────────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

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
      // Expliziter Typ für mockItems
      const mockItems: StoredItem[] = [
        // { id: '1', url: 'https://www.vinted.de/items/...' }
      ];

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
