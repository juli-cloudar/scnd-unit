// src/app/api/vinted-bulk/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

// ──────────────────────────────────────────────
// Gemeinsame Headers (Browser-Imitation)
// ──────────────────────────────────────────────
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache',
  Referer: 'https://www.vinted.de/',
};

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        ...BROWSER_HEADERS,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

// ──────────────────────────────────────────────
// Member-ID zuverlässig extrahieren
// Unterstützt:
//   "3138250645"
//   "3138250645-scndunit"
//   "https://www.vinted.de/member/3138250645-scndunit"
//   "https://www.vinted.de/member/3138250645"
// ──────────────────────────────────────────────
function extractMemberId(input: string): string | null {
  const s = input.trim();

  // Vollständige URL oder Pfad mit /member/
  const fromUrl = s.match(/\/member\/(\d+)/);
  if (fromUrl) return fromUrl[1];

  // Nur Zahlen (pure ID)
  if (/^\d+$/.test(s)) return s;

  // "12345-username" Format
  const fromSlug = s.match(/^(\d+)-/);
  if (fromSlug) return fromSlug[1];

  return null;
}

// ──────────────────────────────────────────────
// HTML-Item-Extraktion (für Einzel-Scraping)
// ──────────────────────────────────────────────
function extractItemFromHTML(html: string, url: string): ScrapeResult {
  const isSold =
    /Dieser Artikel ist bereits verkauft|Artikel nicht verfügbar|bereits verkauft/i.test(html);
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
  const sizeMatch =
    html.match(/Größe<\/dt>\s*<dd[^>]*>([^<]+)/i) ||
    html.match(/"size"[:\s]*"([^"]+)"/i);
  if (sizeMatch) size = sizeMatch[1].trim();

  let condition = '';
  const conditionMatch = html.match(/Zustand<\/dt>\s*<dd[^>]*>([^<]+)/i);
  if (conditionMatch) condition = conditionMatch[1].trim();

  const category = inferCategory(name);
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

function inferCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('jacke') || n.includes('jacket') || n.includes('coat')) return 'Jacken';
  if (n.includes('pullover') || n.includes('hoodie') || n.includes('knit')) return 'Pullover';
  if (n.includes('sweat')) return 'Sweatshirts';
  if (n.includes('shirt') || n.includes('top') || n.includes('tee')) return 'Tops';
  if (n.includes('kleid') || n.includes('dress')) return 'Kleider';
  if (n.includes('hose') || n.includes('jeans') || n.includes('pants')) return 'Hosen';
  if (n.includes('schuh') || n.includes('sneaker') || n.includes('boot')) return 'Schuhe';
  return 'Sonstiges';
}

// ──────────────────────────────────────────────
// Einzelnes Item scrapen
// ──────────────────────────────────────────────
async function scrapeSingleItem(url: string): Promise<ScrapeResult> {
  console.log(`[Scrape] Fetching: ${url}`);
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      return {
        itemId: null, url, status: 'sold', name: '', price: '', size: '',
        condition: '', category: 'Sonstiges', images: [],
        lastChecked: new Date().toISOString(), error: true,
        message: `HTTP ${response.status}`,
      };
    }
    const html = await response.text();
    const result = extractItemFromHTML(html, url);
    console.log(`[Scrape] OK: "${result.name}" → ${result.status}`);
    return result;
  } catch (error) {
    console.error(`[Scrape] Error for ${url}:`, error);
    return {
      itemId: null, url, status: 'sold', name: '', price: '', size: '',
      condition: '', category: 'Sonstiges', images: [],
      lastChecked: new Date().toISOString(), error: true,
      message: String(error),
    };
  }
}

// ──────────────────────────────────────────────
// ⭐ HAUPT-FIX: Alle Item-URLs eines Users holen
//
// Vinted ist eine Next.js-SPA → das Profil-HTML
// enthält KEINE Item-Links. Einziger verlässlicher
// Weg: die interne JSON-API.
//
// Endpunkte (ohne Auth, öffentlich):
//   /api/v2/users/{id}/items?page=N&per_page=96
//
// Falls die API blockiert: wir parsen das
// eingebettete __NEXT_DATA__ JSON aus dem HTML.
// ──────────────────────────────────────────────
async function getAllUserItems(memberInput: string): Promise<string[]> {
  const memberId = extractMemberId(memberInput);
  if (!memberId) {
    console.error('[Vinted] Konnte Member-ID nicht extrahieren aus:', memberInput);
    return [];
  }
  console.log(`[Vinted] Member-ID: ${memberId}`);

  // ── Versuch 1: Öffentliche JSON-API (/api/v2/users/{id}/items) ──
  try {
    const urls = await fetchViaJsonApi(memberId);
    if (urls.length > 0) return urls;
  } catch (err) {
    console.warn('[Vinted] JSON-API fehlgeschlagen:', err);
  }

  // ── Versuch 2: __NEXT_DATA__ aus Profil-HTML parsen ──
  try {
    const urls = await fetchViaNextData(memberId);
    if (urls.length > 0) return urls;
  } catch (err) {
    console.warn('[Vinted] __NEXT_DATA__ fehlgeschlagen:', err);
  }

  console.error('[Vinted] Alle Methoden fehlgeschlagen. 0 Items gefunden.');
  return [];
}

// ── Methode 1: Öffentliche Vinted JSON-API ──────────────────────
async function fetchViaJsonApi(memberId: string): Promise<string[]> {
  const urls: string[] = [];
  let page = 1;
  const perPage = 96;

  while (true) {
    // Vinted nutzt /api/v2/users/{id}/items (nicht /members/)
    const apiUrl =
      `https://www.vinted.de/api/v2/users/${memberId}/items` +
      `?page=${page}&per_page=${perPage}&order=newest_first`;

    console.log(`[API] GET ${apiUrl}`);

    const res = await fetch(apiUrl, {
      headers: {
        ...BROWSER_HEADERS,
        Accept: 'application/json, text/plain, */*',
        // X-Requested-With hilft manchmal, den JSON-Zweig zu triggern
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!res.ok) {
      console.warn(`[API] Status ${res.status} auf Seite ${page}`);
      // 401/403 → kein Auth-Token → Methode abbrechen
      break;
    }

    const data = await res.json();
    const items: any[] = data?.items ?? data?.data?.items ?? [];

    if (items.length === 0) break;

    for (const item of items) {
      const rawUrl: string = item.url ?? item.path ?? '';
      if (!rawUrl) continue;
      const fullUrl = rawUrl.startsWith('http')
        ? rawUrl
        : `https://www.vinted.de${rawUrl}`;
      if (!urls.includes(fullUrl)) urls.push(fullUrl);
    }

    console.log(`[API] Seite ${page}: ${items.length} Items (gesamt: ${urls.length})`);

    const pagination = data?.pagination ?? data?.meta ?? {};
    const totalPages: number =
      pagination.total_pages ??
      Math.ceil((pagination.total_count ?? 0) / perPage) ??
      1;

    if (page >= totalPages || items.length < perPage) break;
    page++;
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`[API] Insgesamt ${urls.length} URLs gefunden`);
  return urls;
}

// ── Methode 2: __NEXT_DATA__ aus dem Profil-HTML ─────────────────
// Vinted bettet manchmal initiale Items als JSON in die Seite ein.
async function fetchViaNextData(memberId: string): Promise<string[]> {
  const profileUrl = `https://www.vinted.de/member/${memberId}`;
  console.log(`[NextData] GET ${profileUrl}`);

  const res = await fetchWithTimeout(profileUrl, 10000);
  if (!res.ok) {
    console.warn(`[NextData] Status ${res.status}`);
    return [];
  }

  const html = await res.text();

  // __NEXT_DATA__ Script-Tag extrahieren
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!nextDataMatch) {
    console.warn('[NextData] Kein __NEXT_DATA__ gefunden');
    return [];
  }

  let nextData: any;
  try {
    nextData = JSON.parse(nextDataMatch[1]);
  } catch {
    console.warn('[NextData] JSON parse fehlgeschlagen');
    return [];
  }

  // Items tief im Objekt suchen
  const urls: string[] = [];
  const itemsArray = findItemsArray(nextData);

  for (const item of itemsArray) {
    const rawUrl: string = item.url ?? item.path ?? '';
    if (!rawUrl) continue;
    const fullUrl = rawUrl.startsWith('http')
      ? rawUrl
      : `https://www.vinted.de${rawUrl}`;
    if (!urls.includes(fullUrl)) urls.push(fullUrl);
  }

  console.log(`[NextData] ${urls.length} Items aus __NEXT_DATA__ extrahiert`);
  return urls;
}

// Rekursiv nach einem Array suchen, das nach Items aussieht
function findItemsArray(obj: any, depth = 0): any[] {
  if (depth > 10 || !obj || typeof obj !== 'object') return [];
  if (Array.isArray(obj)) {
    // Prüfen ob es ein Items-Array ist (Elemente haben .url oder .id + .price)
    if (obj.length > 0 && obj[0] && (obj[0].url || (obj[0].id && obj[0].price))) {
      return obj;
    }
    for (const el of obj) {
      const found = findItemsArray(el, depth + 1);
      if (found.length > 0) return found;
    }
    return [];
  }
  for (const key of Object.keys(obj)) {
    if (['items', 'listings', 'products'].includes(key) && Array.isArray(obj[key])) {
      return obj[key];
    }
  }
  for (const val of Object.values(obj)) {
    const found = findItemsArray(val, depth + 1);
    if (found.length > 0) return found;
  }
  return [];
}

// ──────────────────────────────────────────────
// POST Handler
// ──────────────────────────────────────────────
export async function POST(request: Request) {
  console.log('[Bulk API] POST received');

  try {
    const body = await request.json();
    const { profileUrl, quick = false } = body;

    if (!profileUrl) {
      return NextResponse.json(
        { message: 'Fehlender Parameter: profileUrl' },
        { status: 400, headers: CORS }
      );
    }

    console.log(`[Bulk API] Lade Items für: ${profileUrl}`);
    const allUrls = await getAllUserItems(profileUrl);

    if (allUrls.length === 0) {
      return NextResponse.json(
        {
          totalItems: 0,
          itemUrls: [],
          message:
            'Keine Items gefunden. Mögliche Ursachen: privates Profil, ' +
            'falsche Member-ID, oder Vinted blockiert den Zugriff.',
        },
        { headers: CORS }
      );
    }

    console.log(`[Bulk API] ${allUrls.length} URLs gefunden`);

    if (quick === true) {
      return NextResponse.json(
        {
          totalItems: allUrls.length,
          itemUrls: allUrls,
          message: `${allUrls.length} Items gefunden.`,
        },
        { headers: CORS }
      );
    }

    // Vollständiges Scraping
    const results: ScrapeResult[] = [];
    for (let i = 0; i < allUrls.length; i++) {
      console.log(`[Bulk API] Scraping ${i + 1}/${allUrls.length}: ${allUrls[i]}`);
      const result = await scrapeSingleItem(allUrls[i]);
      results.push(result);
      await new Promise((r) => setTimeout(r, 300));
    }

    const available = results.filter((r) => r.status === 'available' && !r.error);
    const sold = results.filter((r) => r.status === 'sold');
    const reserved = results.filter((r) => r.status === 'reserved');
    const errors = results.filter((r) => r.error);

    return NextResponse.json(
      {
        summary: {
          total: results.length,
          available: available.length,
          sold: sold.length,
          reserved: reserved.length,
          errors: errors.length,
        },
        items: {
          added: available,
          skipped: sold,
          reserved: reserved,
          failed: errors,
        },
        message: `${available.length} verfügbar, ${sold.length} verkauft, ${reserved.length} reserviert`,
      },
      { headers: CORS }
    );
  } catch (error) {
    console.error('[Bulk API] Unerwarteter Fehler:', error);
    return NextResponse.json(
      { message: 'Serverfehler: ' + String(error) },
      { status: 500, headers: CORS }
    );
  }
}
