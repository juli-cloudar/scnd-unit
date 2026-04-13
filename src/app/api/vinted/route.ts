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
}

async function fetchWithTimeout(url: string, timeoutMs = 7000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Referer': 'https://www.vinted.de/',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function extractItemFromHTML(html: string, url: string): ScrapeResult {
  const isSold = /Dieser Artikel ist bereits verkauft|Artikel nicht verfügbar|bereits verkauft/i.test(html);
  const isReserved = /Dieser Artikel ist reserviert|reserviert/i.test(html);
  
  let status: 'available' | 'sold' | 'reserved' = 'available';
  if (isSold) status = 'sold';
  else if (isReserved) status = 'reserved';

  const images: string[] = [];
  const imgMatches = html.matchAll(/https:\/\/images\d*\.vinted\.net\/[^"'\s<>]+/g);
  for (const m of imgMatches) {
    let imgUrl = m[0];
    if (imgUrl.includes('/f800/')) {
      imgUrl = imgUrl.split('?')[0];
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imgUrl)}`;
      if (!images.includes(proxyUrl)) images.push(proxyUrl);
    }
  }

  const titleMatch = html.match(/<title>([^<]+)/i);
  const name = titleMatch ? titleMatch[1].replace(' | Vinted', '').trim() : '';

  let price = '';
  const priceMatch = html.match(/(\d{1,3}(?:[.,]\d{2})?)\s*€/);
  if (priceMatch) price = priceMatch[1].replace(',', '.');

  let size = '';
  const sizeMatch = html.match(/Größe<\/dt>\s*<dd[^>]*>([^<]+)/i) || 
                    html.match(/"size"[:\s]*"([^"]+)"/i);
  if (sizeMatch) size = sizeMatch[1].trim();

  let condition = '';
  const conditionMatch = html.match(/Zustand<\/dt>\s*<dd[^>]*>([^<]+)/i);
  if (conditionMatch) condition = conditionMatch[1].trim();

  let category = 'Sonstiges';
  const nameLower = name.toLowerCase();
  if (nameLower.includes('jacke') || nameLower.includes('jacket')) category = 'Jacken';
  else if (nameLower.includes('pullover') || nameLower.includes('hoodie')) category = 'Pullover';
  else if (nameLower.includes('sweat')) category = 'Sweatshirts';
  else if (nameLower.includes('shirt') || nameLower.includes('top')) category = 'Tops';
  else if (nameLower.includes('kleid')) category = 'Kleider';
  else if (nameLower.includes('hose') || nameLower.includes('jeans')) category = 'Hosen';
  else if (nameLower.includes('schuh') || nameLower.includes('sneaker')) category = 'Schuhe';

  const itemIdMatch = url.match(/\/items\/(\d+)/);
  return {
    itemId: itemIdMatch?.[1] ?? null,
    url,
    status,
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
  console.log(`[Scrape] Fetching: ${url}`);
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      console.log(`[Scrape] HTTP ${response.status} for ${url}`);
      return { 
        itemId: null, url, status: 'sold', name: '', price: '', size: '', 
        condition: '', category: 'Sonstiges', images: [], 
        lastChecked: new Date().toISOString(), error: true, 
        message: `HTTP ${response.status}` 
      };
    }
    const html = await response.text();
    const result = extractItemFromHTML(html, url);
    console.log(`[Scrape] Success: ${result.name} - ${result.status}`);
    return result;
  } catch (error) {
    console.error(`[Scrape] Error for ${url}:`, error);
    return { 
      itemId: null, url, status: 'sold', name: '', price: '', size: '', 
      condition: '', category: 'Sonstiges', images: [], 
      lastChecked: new Date().toISOString(), error: true, 
      message: String(error) 
    };
  }
}

// ⭐⭐⭐ VERBESSERTE getAllUserItems - unterstützt verschiedene Eingabeformate ⭐⭐⭐
async function getAllUserItems(memberInput: string): Promise<string[]> {
  const urls: string[] = [];
  
  // Extrahiere die numerische Member-ID aus verschiedenen Formaten
  let memberId = '';
  
  // Entferne Leerzeichen
  memberInput = memberInput.trim();
  
  // Fall 1: Nur eine Zahl
  if (/^\d+$/.test(memberInput)) {
    memberId = memberInput;
  }
  // Fall 2: URL mit /member/Zahl-Name
  else {
    const match = memberInput.match(/\/member\/(\d+)/);
    if (match) {
      memberId = match[1];
    } else {
      // Fall 3: Nur die Zahl mit eventuellem Text dahinter (z.B. "3138250645-scndunit")
      const numMatch = memberInput.match(/^(\d+)/);
      if (numMatch) {
        memberId = numMatch[1];
      }
    }
  }
  
  if (!memberId) {
    console.error('[Vinted] Could not extract member ID from:', memberInput);
    return [];
  }
  
  console.log(`[Vinted] Member ID: ${memberId}`);
  
  let page = 1;
  const maxPages = 20;
  
  while (page <= maxPages) {
    const profileUrl = `https://www.vinted.de/member/${memberId}?page=${page}`;
    console.log(`[Vinted] Fetching page ${page}: ${profileUrl}`);
    
    try {
      const response = await fetchWithTimeout(profileUrl, 10000);
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
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`[Vinted] Error fetching page ${page}:`, err);
      break;
    }
  }
  
  console.log(`[Vinted] Total unique items found: ${urls.length}`);
  return urls;
}

// ⭐⭐⭐ POST - Unterstützt Single und Bulk ⭐⭐⭐
export async function POST(request: Request) {
  console.log('[API] POST received');
  
  try {
    const body = await request.json();
    console.log('[API] Body:', JSON.stringify(body, null, 2));
    
    const { mode, profileUrl, url, quick = false } = body;

    // ── SINGLE MODE (Item-URL) ──
    if (mode === 'single' && url) {
      console.log('[API] Single mode for:', url);
      const data = await scrapeSingleItem(url);
      return NextResponse.json(data, { headers: CORS });
    }

    // ── BULK MODE (Member-URL oder Member-ID) ──
    if (mode === 'bulk' && profileUrl) {
      console.log('[API] Bulk mode for:', profileUrl);
      
      const allUrls = await getAllUserItems(profileUrl);
      console.log(`[API] Found ${allUrls.length} total items`);
      
      if (quick === true) {
        return NextResponse.json({
          totalItems: allUrls.length,
          itemUrls: allUrls,
          message: `${allUrls.length} Items gefunden.`
        }, { headers: CORS });
      }
      
      // Bulk mit Scraping
      const results: ScrapeResult[] = [];
      for (let i = 0; i < allUrls.length; i++) {
        console.log(`[API] Scraping ${i + 1}/${allUrls.length}`);
        const result = await scrapeSingleItem(allUrls[i]);
        results.push(result);
        await new Promise(r => setTimeout(r, 300));
      }
      
      const available = results.filter(r => r.status === 'available' && !r.error);
      
      return NextResponse.json({
        summary: {
          total: results.length,
          available: available.length,
          sold: results.filter(r => r.status === 'sold').length,
          reserved: results.filter(r => r.status === 'reserved').length,
          errors: results.filter(r => r.error).length
        },
        items: available,
        message: `${available.length} verfügbare Items gefunden`
      }, { headers: CORS });
    }

    return NextResponse.json({ 
      message: 'Ungültiger Modus. Nutze: mode="single" mit url ODER mode="bulk" mit profileUrl' 
    }, { status: 400, headers: CORS });
    
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ 
      message: 'Fehler: ' + String(error) 
    }, { status: 500, headers: CORS });
  }
}

export async function GET(request: Request) {
  return NextResponse.json({ 
    message: 'Verwende POST für API-Zugriff. Beispiele: { "mode": "single", "url": "..." } oder { "mode": "bulk", "profileUrl": "...", "quick": true }' 
  }, { headers: CORS });
}
