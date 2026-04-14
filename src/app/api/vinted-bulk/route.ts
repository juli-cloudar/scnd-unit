import { NextRequest, NextResponse } from 'next/server';

const BROWSER_HEADERS = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Cache-Control': 'max-age=0',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

const API_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'X-Requested-With': 'XMLHttpRequest',
};

interface VintedItem {
  id: number;
  title: string;
  price: string;
  url: string;
  thumbnail?: string;
  brand?: string;
  size?: string;
  status?: string;
}

// ✅ OPTIONS Handler für CORS Preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

async function getVintedCookies(domain: string) {
  const homeUrl = `https://www.${domain}/`;
  
  const response = await fetch(homeUrl, {
    method: 'GET',
    headers: BROWSER_HEADERS,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Startseite Fehler: ${response.status}`);
  }

  const setCookieHeader = response.headers.get('set-cookie') || '';
  const cookies = setCookieHeader.split(',').map(c => c.trim());
  
  let sessionCookie = '';
  let datadomeCookie = '';
  let anonId = '';

  for (const cookie of cookies) {
    if (cookie.includes('_vinted_fr_session=')) {
      sessionCookie = cookie.match(/(_vinted_fr_session=[^;]+)/)?.[1] || '';
    }
    if (cookie.includes('datadome=')) {
      datadomeCookie = cookie.match(/(datadome=[^;]+)/)?.[1] || '';
    }
    if (cookie.includes('anon_id=')) {
      anonId = cookie.match(/(anon_id=[^;]+)/)?.[1] || '';
    }
  }

  if (!anonId) {
    anonId = `anon_id=${generateUUID()}`;
  }

  return { sessionCookie, datadomeCookie, anonId };
}

async function fetchUserItems(domain: string, userId: string, page: number, cookies: any) {
  const apiUrl = `https://www.${domain}/api/v2/users/${userId}/items?page=${page}&per_page=48`;
  
  const cookieString = [
    cookies.anonId,
    cookies.sessionCookie,
    cookies.datadomeCookie,
  ].filter(Boolean).join('; ');

  const headers = {
    ...API_HEADERS,
    'Cookie': cookieString,
    'Referer': `https://www.${domain}/member/${userId}`,
  };

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API Fehler: ${response.status}`);
  }

  const data = await response.json();
  
  const items = (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.title || 'Unbekannter Artikel',
    price: item.price ? `${item.price.amount} ${item.price.currency}` : 'Preis unbekannt',
    url: `https://www.${domain}/items/${item.id}`,
    thumbnail: item.photos?.[0]?.url || item.photos?.[0]?.thumbnails?.[0]?.url,
    brand: item.brand?.title,
    size: item.size?.title,
    status: item.status,
  }));

  return {
    items,
    totalPages: data.pagination?.total_pages || 1,
  };
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function extractMemberId(input: string): string | null {
  const clean = input.trim();
  
  if (/^\d+$/.test(clean)) return clean;
  
  const match = clean.match(/^(\d+)-/);
  if (match) return match[1];
  
  const urlMatch = clean.match(/member\/(\d+)/);
  if (urlMatch) return urlMatch[1];
  
  return null;
}

function extractDomain(input: string): string {
  try {
    if (input.includes('vinted.')) {
      const url = new URL(input.trim());
      return url.hostname.replace('www.', '');
    }
  } catch {
    // Keine URL
  }
  return 'vinted.de';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    // ✅ Content-Type prüfen
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type muss application/json sein' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'Bitte mindestens eine URL angeben' },
        { status: 400 }
      );
    }

    // ✅ Max 5 URLs (Vercel Timeout)
    if (urls.length > 5) {
      return NextResponse.json(
        { error: 'Maximal 5 URLs pro Request erlaubt' },
        { status: 400 }
      );
    }

    const results: Record<string, any> = {};
    
    for (const urlInput of urls) {
      const cleanUrl = urlInput.trim();
      
      const memberId = extractMemberId(cleanUrl);
      const domain = extractDomain(cleanUrl);
      
      if (!memberId) {
        results[cleanUrl] = { success: false, error: 'Konnte Member ID nicht extrahieren' };
        continue;
      }

      try {
        const cookies = await getVintedCookies(domain);
        
        // ✅ Nur erste Seite (Vercel Timeout)
        const pageResult = await fetchUserItems(domain, memberId, 1, cookies);
        
        results[cleanUrl] = {
          success: true,
          items: pageResult.items,
          count: pageResult.items.length,
          userId: memberId,
          domain: domain,
          hasMore: pageResult.totalPages > 1,
        };

      } catch (error: any) {
        results[cleanUrl] = {
          success: false,
          error: error.message || 'Unbekannter Fehler',
        };
      }

      await sleep(1000);
    }

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[API] Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Vinted Bulk Scraper API',
    version: '2.1',
    endpoints: {
      POST: '/api/vinted-bulk - Body: { urls: string[] } (max 5 URLs)',
    },
  });
}
