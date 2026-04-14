import { NextRequest, NextResponse } from 'next/server';

// Browser-ähnliche Headers für den initialen Cookie-Request
const BROWSER_HEADERS = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'max-age=0',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
};

// API-Headers (XHR-Request)
const API_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'X-Requested-With': 'XMLHttpRequest',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
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

// Schritt 1: Cookie von Vinted Startseite holen
async function getVintedCookies(domain: string): Promise<{ sessionCookie: string; datadomeCookie: string; anonId: string }> {
  try {
    const homeUrl = `https://www.${domain}/`;
    
    console.log(`[Cookie] Hole Cookies von ${homeUrl}...`);
    
    const response = await fetch(homeUrl, {
      method: 'GET',
      headers: BROWSER_HEADERS,
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Fehler beim Holen der Startseite: ${response.status}`);
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

    console.log(`[Cookie] Session: ${sessionCookie ? '✓' : '✗'}, Datadome: ${datadomeCookie ? '✓' : '✗'}`);

    if (!sessionCookie && !datadomeCookie) {
      throw new Error('Keine gültigen Cookies erhalten');
    }

    return { sessionCookie, datadomeCookie, anonId };
  } catch (error) {
    console.error('[Cookie] Fehler:', error);
    throw error;
  }
}

// Schritt 2: API-Request mit Cookies (User Items)
async function fetchUserItems(
  domain: string, 
  userId: string, 
  page: number, 
  cookies: { sessionCookie: string; datadomeCookie: string; anonId: string }
): Promise<{ items: VintedItem[]; totalPages: number }> {
  
  const apiUrl = `https://www.${domain}/api/v2/users/${userId}/items?page=${page}&per_page=96`;
  
  const cookieString = [
    cookies.anonId,
    cookies.sessionCookie,
    cookies.datadomeCookie,
    'ab.optOut=This-cookie-will-expire-in-2024'
  ].filter(Boolean).join('; ');

  const headers = {
    ...API_HEADERS,
    'Cookie': cookieString,
    'Referer': `https://www.${domain}/member/${userId}`
  };

  console.log(`[API] Request: ${apiUrl}`);

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers,
    cache: 'no-store'
  });

  if (response.status === 403) {
    throw new Error('Datadome blockiert (403)');
  }

  if (response.status === 401) {
    throw new Error('Session abgelaufen (401)');
  }

  if (!response.ok) {
    throw new Error(`API Fehler: ${response.status}`);
  }

  const data = await response.json();
  
  const items: VintedItem[] = (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.title || 'Unbekannter Artikel',
    price: item.price ? `${item.price.amount} ${item.price.currency}` : 'Preis unbekannt',
    url: `https://www.${domain}/items/${item.id}`,
    thumbnail: item.photos?.[0]?.url || item.photos?.[0]?.thumbnails?.[0]?.url,
    brand: item.brand?.title,
    size: item.size?.title,
    status: item.status
  }));

  return {
    items,
    totalPages: data.pagination?.total_pages || 1
  };
}

// Fallback: Catalog API
async function fetchUserItemsViaCatalog(
  domain: string,
  userId: string,
  page: number,
  cookies: { sessionCookie: string; datadomeCookie: string; anonId: string }
): Promise<{ items: VintedItem[]; totalPages: number }> {
  
  const apiUrl = `https://www.${domain}/api/v2/catalog/items?user_id=${userId}&page=${page}&per_page=96`;
  
  const cookieString = [
    cookies.anonId,
    cookies.sessionCookie,
    cookies.datadomeCookie
  ].filter(Boolean).join('; ');

  const headers = {
    ...API_HEADERS,
    'Cookie': cookieString,
    'Referer': `https://www.${domain}/member/${userId}`
  };

  console.log(`[Catalog API] Request: ${apiUrl}`);

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers,
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Catalog API Fehler: ${response.status}`);
  }

  const data = await response.json();
  
  const items: VintedItem[] = (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.title || 'Unbekannter Artikel',
    price: item.price ? `${item.price.amount} ${item.price.currency}` : 'Preis unbekannt',
    url: `https://www.${domain}/items/${item.id}`,
    thumbnail: item.photos?.[0]?.url,
    brand: item.brand?.title,
    size: item.size?.title,
    status: item.status
  }));

  return {
    items,
    totalPages: data.pagination?.total_pages || 1
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
  if (/^\d+$/.test(input)) return input;
  
  const match = input.match(/^(\d+)-/);
  if (match) return match[1];
  
  const urlMatch = input.match(/member\/(\d+)/);
  if (urlMatch) return urlMatch[1];
  
  return null;
}

function extractDomain(input: string): string {
  try {
    if (input.includes('vinted.')) {
      const url = new URL(input);
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
    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'Bitte mindestens eine URL angeben' },
        { status: 400 }
      );
    }

    const results: Record<string, any> = {};
    
    for (const urlInput of urls) {
      let attempts = 0;
      const maxAttempts = 3;
      let success = false;

      while (attempts < maxAttempts && !success) {
        attempts++;
        console.log(`\n[Attempt ${attempts}/${maxAttempts}] für ${urlInput}`);

        try {
          const memberId = extractMemberId(urlInput);
          const domain = extractDomain(urlInput);
          
          if (!memberId) {
            results[urlInput] = { success: false, error: 'Konnte Member ID nicht extrahieren' };
            break;
          }

          console.log(`[Info] Member ID: ${memberId}, Domain: ${domain}`);

          // Cookies holen
          const cookies = await getVintedCookies(domain);
          
          if (!cookies.sessionCookie && !cookies.datadomeCookie) {
            throw new Error('Keine Cookies erhalten');
          }

          // Alle Items abrufen
          const allItems: VintedItem[] = [];
          let currentPage = 1;
          let totalPages = 1;
          let useCatalog = false;

          do {
            try {
              let pageResult;
              
              if (!useCatalog) {
                try {
                  pageResult = await fetchUserItems(domain, memberId, currentPage, cookies);
                } catch (error: any) {
                  if (error.message.includes('403') || error.message.includes('401')) {
                    console.log('[Fallback] Wechsle zu Catalog API...');
                    useCatalog = true;
                    pageResult = await fetchUserItemsViaCatalog(domain, memberId, currentPage, cookies);
                  } else {
                    throw error;
                  }
                }
              } else {
                pageResult = await fetchUserItemsViaCatalog(domain, memberId, currentPage, cookies);
              }

              allItems.push(...pageResult.items);
              totalPages = pageResult.totalPages;
              
              console.log(`[Progress] Seite ${currentPage}/${totalPages}: ${pageResult.items.length} Items`);
              
              if (currentPage < totalPages) {
                await sleep(1000 + Math.random() * 1000);
              }
              
              currentPage++;
            } catch (error: any) {
              console.error(`[Error] Seite ${currentPage}:`, error.message);
              break;
            }
          } while (currentPage <= totalPages && currentPage <= 10);

          results[urlInput] = {
            success: true,
            items: allItems,
            count: allItems.length,
            userId: memberId,
            domain: domain,
            attempts: attempts
          };
          
          success = true;

        } catch (error: any) {
          console.error(`[Attempt ${attempts}] Fehler:`, error.message);
          
          if (attempts >= maxAttempts) {
            results[urlInput] = {
              success: false,
              error: `Fehlgeschlagen nach ${maxAttempts} Versuchen: ${error.message}`,
              lastError: error.message
            };
          } else {
            await sleep(2000 * attempts);
          }
        }
      }

      // Pause zwischen Usern
      await sleep(3000);
    }

    return NextResponse.json({
      success: true,
      data: results,
      totalUrls: urls.length,
      successful: Object.values(results).filter((r: any) => r.success).length,
      failed: Object.values(results).filter((r: any) => !r.success).length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[API] Allgemeiner Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', details: error.message },
      { status: 500 }
    );
  }
}

// GET für Status-Check
export async function GET() {
  return NextResponse.json({
    status: 'Vinted Bulk Scraper (Option C - Datadome Cookie Mode)',
    version: '2.0',
    endpoints: {
      POST: '/api/vinted-bulk - Body: { urls: string[] }'
    },
    features: [
      'Automatische Cookie-Extraktion',
      'Retry-Logik (3 Versuche)',
      'User API + Catalog API Fallback',
      'Pagination bis 10 Seiten',
      'Rate Limiting'
    ]
  });
}
