// src/app/api/vinted/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

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
  // STATUS CHECK
  const statusIndicators = {
    sold: [
      /Dieser Artikel ist bereits verkauft/i,
      /Artikel nicht verfügbar/i,
      /sold/i,
      /verkauft/i,
      /nicht mehr verfügbar/i,
      /data-testid="item-sold"/i,
      /class="[^"]*item-sold[^"]*"/i,
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

  // BILDER
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

  // NAME
  const h1Match = html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/i);
  const titleMatch = html.match(/<title>\s*([^|<]+)/i);
  const name = (h1Match?.[1] || titleMatch?.[1] || '').trim();

  // GRÖSSE
  let size = '';
  const sizeJsonMatch = html.match(/"size"[:\s]*"([^"]{1,20})"/i) ||
                       html.match(/"size_name"[:\s]*"([^"]{1,20})"/i) ||
                       html.match(/"size_title"[:\s]*"([^"]{1,20})"/i);
  if (sizeJsonMatch) size = sizeJsonMatch[1].trim();

  if (!size) {
    const sizePatterns = [
      /data-testid="item-details-size"[^>]*>([^<]{1,20})/i,
      /Größe\s*<\/[^>]+>\s*<[^>]+>\s*([^<]{1,20})/i,
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

  // PREIS
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

  // ZUSTAND
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

  // KATEGORIE
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
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
  } finally {
    clearTimeout(timeout);
  }
}

// ⭐⭐⭐ VERBESSERTE getAllUserItems FUNKTION ⭐⭐⭐
async function getAllUserItems(memberInput: string): Promise<string[]> {
  const urls: string[] = [];
  let page = 1;
  const maxPages = 20;
  
  // Extrahiere die numerische Member-ID aus verschiedenen Formaten
  let memberId = '';
  
  // Entferne Leerzeichen
  memberInput = memberInput.trim();
  
  // Fall 1: Nur eine Zahl
  if (/^\d+$/.test(memberInput)) {
    memberId = memberInput;
  }
  // Fall 2: URL mit /member/Zahl-Name oder /member/Zahl
  else if (memberInput.includes('vinted.de')) {
    const match = memberInput.match(/\/member\/(\d+)/);
    if (match) {
      memberId = match[1];
    }
  }
  // Fall 3: Nur die Zahl mit eventuellem Text dahinter (z.B. "3138250645-scndunit")
  else {
    const numMatch = memberInput.match(/^(\d+)/);
    if (numMatch) {
      memberId = numMatch[1];
    }
  }
  
  if (!memberId) {
    console.error('[Vinted] Could not extract member ID from:', memberInput);
    return [];
  }
  
  console.log(`[Vinted] Member ID: ${memberId}`);
  
  while (page <= maxPages) {
    const profileUrl = `https://www.vinted.de/member/${memberId}?page=${page}`;
    console.log(`[Vinted] Fetching page ${page}: ${profileUrl}`);
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(profileUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Referer': 'https://www.vinted.de/',
        },
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        console.log(`[Vinted] HTTP ${response.status} on page ${page}`);
        break;
      }
      
      const html = await response.text();
      
      // Finde alle Item-Links mit verschiedenen Patterns
      const itemMatches = html.matchAll(/href="(\/items\/\d+[^"?#]*)"/g);
      let found = 0;
      for (const match of itemMatches) {
        const fullUrl = `https://www.vinted.de${match[1]}`;
        if (!urls.includes(fullUrl)) {
          urls.push(fullUrl);
          found++;
        }
      }
      
      console.log(`[Vinted] Page ${page}: found ${found} items (total: ${urls.length})`);
      
      // Prüfe auf nächste Seite
      const hasNext = html.includes(`page=${page + 1}`) || 
                      html.includes('rel="next"') ||
                      html.includes('>Weiter<');
      
      if (!hasNext || found === 0) {
        console.log(`[Vinted] No more pages`);
        break;
      }
      
      page++;
      await new Promise(r => setTimeout(r, 800));
    } catch (err) {
      console.error(`[Vinted] Error fetching page ${page}:`, err);
      break;
    }
  }
  
  console.log(`[Vinted] Total unique items found: ${urls.length}`);
  return urls;
}

async function bulkScrapeItems(urls: string[], concurrency: number = 2): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      console.log(`[Bulk] Scraping ${i + 1}/${urls.length}: ${url}`);
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
  
  return results;
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

    return NextResponse.json({ 
      message: 'Verwende POST für API-Zugriff. Beispiele: { "mode": "single", "url": "..." } oder { "mode": "bulk", "profileUrl": "...", "quick": true }' 
    }, { headers: CORS });

  } catch (e) {
    return NextResponse.json({ message: 'Fehler: ' + String(e) }, { status: 500, headers: CORS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[API] POST received:', JSON.stringify(body, null, 2));
    
    const { 
      url,
      mode = 'single',
      autoRemove = false,
      quick = false,
      profileUrl,
      username,
    } = body;

    // ── SINGLE MODE ──
    if (mode === 'single' && url) {
      if (!url.includes('vinted')) {
        return NextResponse.json({ message: 'Ungültige URL' }, { status: 400, headers: CORS });
      }

      const data = await scrapeSingleItem(url);

      if (data.status === 'sold' && autoRemove) {
        return NextResponse.json({
          ...data,
          action: 'removed',
          message: '⚠️ Item ist VERKAUFT',
        }, { headers: CORS });
      }

      if (data.status === 'sold') {
        return NextResponse.json({
          ...data,
          warning: '⚠️ Item ist VERKAUFT',
          action: 'suggest_remove',
        }, { headers: CORS });
      }

      return NextResponse.json(data, { headers: CORS });
    }

    // ── BULK MODE ──
    if (mode === 'bulk') {
      const identifier = profileUrl || username;
      
      if (!identifier) {
        return NextResponse.json(
          { message: 'profileUrl oder username erforderlich' }, 
          { status: 400, headers: CORS }
        );
      }

      console.log(`[API] Bulk mode for: ${identifier}`);
      const allUrls = await getAllUserItems(identifier);
      
      if (allUrls.length === 0) {
        return NextResponse.json(
          { message: 'Keine Items gefunden für: ' + identifier }, 
          { status: 404, headers: CORS }
        );
      }

      // Quick Mode: Nur URLs zurückgeben
      if (quick === true) {
        return NextResponse.json({
          totalItems: allUrls.length,
          itemUrls: allUrls,
          message: `${allUrls.length} Items gefunden.`,
        }, { headers: CORS });
      }

      // Vollständiger Import
      const results = await bulkScrapeItems(allUrls, 2);
      
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
          skipped: sold,
          reserved: reserved,
          failed: errors,
        },
        message: `✅ ${successful.length} verfügbare Items, ${sold.length} verkauft, ${reserved.length} reserviert`,
      }, { headers: CORS });
    }

    return NextResponse.json(
      { message: 'Ungültiger Modus. Verwende mode: "single" mit url ODER mode: "bulk" mit profileUrl' }, 
      { status: 400, headers: CORS }
    );

  } catch (e) {
    console.error('[API] Scraper Error:', e);
    return NextResponse.json(
      { message: 'Fehler: ' + String(e) }, 
      { status: 500, headers: CORS }
    );
  }
}
