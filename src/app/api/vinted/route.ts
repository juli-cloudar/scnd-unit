// src/app/api/vinted/route.ts
import { NextResponse } from 'next/server';

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
  action?: string;
  warning?: string;
}

// ─────────────────────────────────────────────
// FETCH MIT TIMEOUT
// ─────────────────────────────────────────────
async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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

// ─────────────────────────────────────────────
// HTML PARSER
// ─────────────────────────────────────────────
function extractItemFromHTML(html: string, url: string): ScrapeResult {
  const soldPatterns = [
    /Dieser Artikel ist bereits verkauft/i,
    /Artikel nicht verfügbar/i,
    /nicht mehr verfügbar/i,
    /data-testid="item-sold"/i,
    /class="[^"]*item-sold[^"]*"/i,
    /item[_-]sold/i,
    /bereits verkauft/i,
  ];
  const reservedPatterns = [
    /Dieser Artikel ist reserviert/i,
    /reserviert/i,
    /reserved/i,
    /vorübergehend nicht verfügbar/i,
  ];

  let itemStatus: 'available' | 'sold' | 'reserved' = 'available';
  for (const p of soldPatterns) { if (p.test(html)) { itemStatus = 'sold'; break; } }
  if (itemStatus === 'available') {
    for (const p of reservedPatterns) { if (p.test(html)) { itemStatus = 'reserved'; break; } }
  }

  // BILDER
  const seen = new Set<string>();
  const images: string[] = [];
  for (const m of html.matchAll(/https:\/\/images\d*\.vinted\.net\/[^"'\s<>]+/g)) {
    let fullUrl = m[0];
    if (!fullUrl.includes('/f800/')) continue;
    fullUrl = fullUrl.replace(/&amp;/g, '&');
    const base = fullUrl.split('?')[0];
    if (!seen.has(base)) { seen.add(base); images.push(`/api/image-proxy?url=${encodeURIComponent(fullUrl)}`); }
  }

  // NAME
  const h1Match = html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/i);
  const titleMatch = html.match(/<title>\s*([^|<]+)/i);
  const name = (h1Match?.[1] || titleMatch?.[1] || '').trim();

  // GRÖSSE
  let size = '';
  const sizeJsonMatch = html.match(/"size"[:\s]*"([^"]{1,20})"/i) || html.match(/"size_name"[:\s]*"([^"]{1,20})"/i) || html.match(/"size_title"[:\s]*"([^"]{1,20})"/i);
  if (sizeJsonMatch) size = sizeJsonMatch[1].trim();
  if (!size) {
    for (const p of [/data-testid="item-details-size"[^>]*>([^<]{1,20})/i, /Größe\s*<\/[^>]+>\s*<[^>]+>\s*([^<]{1,20})/i]) {
      const m = html.match(p);
      if (m?.[1]) { size = m[1].trim().replace(/[·\/\-]/g, '').trim(); if (size.length < 20) break; }
    }
  }
  if (!size) {
    const m = html.match(/(?:Größe|Grösse|Size)[^\w]{0,10}(XXS|XS|S|M|L|XL|XXL|XXXL|4XL|5XL|One Size|Einheitsgröße|UNI|\d{2,3})/i);
    if (m) size = m[1].trim();
  }

  // PREIS
  let price = '';
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      const findPrice = (obj: any): string | null => {
        if (!obj) return null;
        if (obj.price) return obj.price.toString().replace('.', ',');
        if (typeof obj === 'object') { for (const k in obj) { const f = findPrice(obj[k]); if (f) return f; } }
        return null;
      };
      const f = findPrice(JSON.parse(m[1]));
      if (f) { price = f; break; }
    } catch {}
  }
  if (!price) {
    const section = html.substring(0, html.indexOf('Käuferschutz') > 0 ? html.indexOf('Käuferschutz') : html.length);
    const m = section.match(/(\d{1,3}(?:[.,]\d{2})?)\s*(€|EUR)/i);
    if (m) price = m[1];
  }

  // ZUSTAND
  const condMap: Record<string, string> = {
    'neu mit etikett': 'Neu mit Etikett', 'neu ohne etikett': 'Neu ohne Etikett',
    'sehr gut': 'Sehr gut', 'zufriedenstellend': 'Zufriedenstellend',
    'schlecht': 'Schlecht', 'gut': 'Gut', 'neu': 'Neu',
  };
  let condition = '';
  const dm = html.match(/>(Neu mit Etikett|Neu ohne Etikett|Sehr gut|Zufriedenstellend|Schlecht|Gut|Neu)</i);
  if (dm) condition = dm[1];
  if (!condition) {
    const cm = html.match(/"condition"[:\s]*"([^"]+)"/i) || html.match(/"item_condition"[:\s]*"([^"]+)"/i);
    if (cm) { const raw = cm[1].toLowerCase(); for (const [k, v] of Object.entries(condMap)) { if (raw.includes(k)) { condition = v; break; } } }
  }
  if (!condition) {
    const hl = html.toLowerCase();
    for (const k of ['neu mit etikett', 'neu ohne etikett', 'sehr gut', 'zufriedenstellend', 'schlecht', 'gut']) {
      if (new RegExp(`[>\\s"']${k}[<\\s"'·]`, 'i').test(hl)) { condition = condMap[k]; break; }
    }
  }

  // KATEGORIE
  const catMap: Record<string, string> = {
    'jacke': 'Jacken', 'jacket': 'Jacken', 'mantel': 'Jacken', 'coat': 'Jacken',
    'pullover': 'Pullover', 'hoodie': 'Pullover', 'strickjacke': 'Pullover', 'sweater': 'Pullover',
    'sweatshirt': 'Sweatshirts', 'sweat': 'Sweatshirts', 'crewneck': 'Sweatshirts',
    'top': 'Tops', 'shirt': 'Tops', 't-shirt': 'Tops', 'tshirt': 'Tops', 'crop': 'Tops',
    'kleid': 'Kleider', 'dress': 'Kleider', 'rock': 'Röcke', 'skirt': 'Röcke',
    'hose': 'Hosen', 'pants': 'Hosen', 'jeans': 'Hosen',
    'schuhe': 'Schuhe', 'shoes': 'Schuhe', 'sneaker': 'Schuhe',
    'tasche': 'Taschen', 'bag': 'Taschen',
  };
  let category = 'Sonstiges';
  const nl = name.toLowerCase(), ul = url.toLowerCase();
  for (const [k, v] of Object.entries(catMap)) { if (nl.includes(k) || ul.includes(k)) { category = v; break; } }

  const itemIdMatch = url.match(/\/items\/(\d+)-/) || url.match(/item_id=(\d+)/);
  return { itemId: itemIdMatch?.[1] ?? null, url, status: itemStatus, name, price, size, condition, category, images: images.slice(0, 5), lastChecked: new Date().toISOString() };
}

async function scrapeSingleItem(url: string): Promise<ScrapeResult> {
  let response: Response;
  try {
    response = await fetchWithTimeout(url);
  } catch (e) {
    return { itemId: null, url, status: 'sold', name: '', price: '', size: '', condition: '', category: 'Sonstiges', images: [], error: true, message: 'Timeout', lastChecked: new Date().toISOString() };
  }
  if (!response.ok) {
    if (response.status === 404 || response.status === 410) {
      return { itemId: null, url, status: 'sold', name: '', price: '', size: '', condition: '', category: 'Sonstiges', images: [], error: true, message: `Nicht verfügbar (${response.status})`, lastChecked: new Date().toISOString() };
    }
    throw new Error(`HTTP ${response.status}`);
  }
  return extractItemFromHTML(await response.text(), url);
}

// ─────────────────────────────────────────────
// MEMBER PATH EXTRAKTION
// ─────────────────────────────────────────────
function extractMemberPath(input: string): string {
  const cleaned = input.trim().replace(/\/$/, '');
  const urlMatch = cleaned.match(/vinted\.[a-z]+\/member\/([^?&#\s]+)/i);
  if (urlMatch) return urlMatch[1];
  if (/^\d+-/.test(cleaned)) return cleaned;
  return cleaned.replace(/^@/, '');
}

// ─────────────────────────────────────────────
// ALLE ITEM-URLS EINES ACCOUNTS HOLEN
// ─────────────────────────────────────────────
async function getAllUserItems(memberInput: string): Promise<string[]> {
  const urls: string[] = [];
  let page = 1;
  const maxPages = 20;
  const memberPath = extractMemberPath(memberInput);
  console.log(`[Vinted] member: ${memberPath}`);

  while (page <= maxPages) {
    const profileUrl = `https://www.vinted.de/member/${memberPath}?page=${page}`;
    let response: Response;
    try { response = await fetchWithTimeout(profileUrl, 10000); }
    catch { console.log(`[Vinted] Timeout Seite ${page}`); break; }

    if (!response.ok) { console.log(`[Vinted] HTTP ${response.status} Seite ${page}`); break; }

    const html = await response.text();
    const pageUrls: string[] = [];

    for (const m of html.matchAll(/href="(\/items\/\d+[^"?#]*)(?:[?#][^"]*)?"[^>]*>/g)) {
      const u = `https://www.vinted.de${m[1]}`;
      if (!pageUrls.includes(u)) pageUrls.push(u);
    }
    for (const m of html.matchAll(/"url"\s*:\s*"(\/items\/\d+[^"]*)"/g)) {
      const u = `https://www.vinted.de${m[1].split('?')[0]}`;
      if (!pageUrls.includes(u)) pageUrls.push(u);
    }
    for (const m of html.matchAll(/data-testid="[^"]*item[^"]*"[^>]*href="(\/items\/\d+[^"?#]*)"/g)) {
      const u = `https://www.vinted.de${m[1]}`;
      if (!pageUrls.includes(u)) pageUrls.push(u);
    }

    const valid = pageUrls.filter(u => /\/items\/\d+/.test(u));
    if (valid.length === 0) { console.log(`[Vinted] Seite ${page} leer – stoppe`); break; }

    urls.push(...valid);
    console.log(`[Vinted] Seite ${page}: ${valid.length} Items`);

    const hasNext = html.includes(`page=${page + 1}`) || html.includes('rel="next"') || html.includes('>Weiter<') || valid.length >= 20;
    if (!hasNext) break;
    page++;
    await new Promise(r => setTimeout(r, 1000));
  }

  const unique = [...new Set(urls)].filter(u => /\/items\/\d+/.test(u));
  console.log(`[Vinted] Gesamt: ${unique.length} unique Items`);
  return unique;
}

// ─────────────────────────────────────────────
// BULK SCRAPER
// ─────────────────────────────────────────────
async function bulkScrapeItems(urls: string[], concurrency = 2): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];
  const queue = [...urls];
  let active = 0;
  return new Promise((resolve) => {
    async function worker() {
      active++;
      while (queue.length > 0) {
        const url = queue.shift();
        if (!url) continue;
        try { results.push(await scrapeSingleItem(url)); }
        catch (e) { results.push({ itemId: null, url, status: 'sold', name: '', price: '', size: '', condition: '', category: 'Sonstiges', images: [], error: true, message: String(e), lastChecked: new Date().toISOString() }); }
        await new Promise(r => setTimeout(r, 400));
      }
      active--;
      if (active === 0) resolve(results);
    }
    const w = Math.min(concurrency, urls.length);
    for (let i = 0; i < w; i++) worker();
    if (urls.length === 0) resolve([]);
  });
}

// ─────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────
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
    const { url, username, userId, profileUrl, mode = 'single', autoRemove = false, quick = false, offset = 0 } = body;

    // ── SINGLE ──
    if (mode === 'single' && url) {
      if (!url.includes('vinted')) return NextResponse.json({ message: 'Ungültige URL' }, { status: 400, headers: CORS });
      const data = await scrapeSingleItem(url);
      if (data.status === 'sold') {
        return NextResponse.json({ ...data, warning: '⚠️ Item ist VERKAUFT', action: autoRemove ? 'removed' : 'suggest_remove' }, { headers: CORS });
      }
      return NextResponse.json(data, { headers: CORS });
    }

    // ── BULK ──
    if (mode === 'bulk') {
      const identifier = username || userId || profileUrl;
      if (!identifier) return NextResponse.json({ message: 'profileUrl erforderlich' }, { status: 400, headers: CORS });

      const allUrls = await getAllUserItems(identifier);
      if (allUrls.length === 0) return NextResponse.json({ message: 'Keine Items gefunden für: ' + identifier }, { status: 404, headers: CORS });

      // Quick: nur Anzahl
      if (quick === true) {
        return NextResponse.json({ totalItems: allUrls.length, itemUrls: allUrls, message: `${allUrls.length} Items gefunden.` }, { headers: CORS });
      }

      // Batch: 5 Items pro Request → kein Vercel-Timeout
      const batchSize = 5;
      const batch = allUrls.slice(offset, offset + batchSize);
      const isLastBatch = offset + batchSize >= allUrls.length;

      const results = await bulkScrapeItems(batch, 2);
      const successful = results.filter(r => !r.error && r.status === 'available');
      const sold       = results.filter(r => r.status === 'sold');
      const reserved   = results.filter(r => r.status === 'reserved');
      const errors     = results.filter(r => r.error);

      return NextResponse.json({
        timestamp: new Date().toISOString(),
        pagination: {
          offset,
          batchSize,
          batchCount: batch.length,
          totalItems: allUrls.length,
          nextOffset: isLastBatch ? null : offset + batchSize,
          isLastBatch,
        },
        summary: { total: batch.length, available: successful.length, sold: sold.length, reserved: reserved.length, errors: errors.length },
        items: { added: successful, skipped: sold, reserved, failed: errors },
        message: isLastBatch
          ? `✅ Fertig: ${successful.length} verfügbar, ${sold.length} verkauft übersprungen`
          : `⏳ Batch ${Math.floor(offset / batchSize) + 1} von ${Math.ceil(allUrls.length / batchSize)}: ${successful.length} gefunden`,
      }, { headers: CORS });
    }

    return NextResponse.json({ message: 'Ungültiger Modus' }, { status: 400, headers: CORS });
  } catch (e) {
    console.error('[Vinted API] Error:', e);
    return NextResponse.json({ message: 'Fehler: ' + String(e) }, { status: 500, headers: CORS });
  }
}
