import { NextRequest, NextResponse } from 'next/server';

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
    return 'vinted.de';
  }
  return 'vinted.de';
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileUrl, urls } = body;

    let targetUrls: string[] = [];
    if (profileUrl && typeof profileUrl === 'string') {
      targetUrls = [profileUrl];
    } else if (urls && Array.isArray(urls)) {
      targetUrls = urls;
    } else {
      return NextResponse.json(
        { error: 'profileUrl oder urls erforderlich' },
        { status: 400 }
      );
    }

    const results: Record<string, any> = {};

    for (const url of targetUrls) {
      const cleanUrl = url.trim();
      const memberId = extractMemberId(cleanUrl);
      const domain = extractDomain(cleanUrl);

      if (!memberId) {
        results[cleanUrl] = { success: false, error: 'Konnte Member ID nicht extrahieren' };
        continue;
      }

      try {
        // AllOrigins Proxy - 100% kostenlos
        const targetUrl = `https://www.${domain}/api/v2/users/${memberId}/items?page=1&per_page=48`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

        console.log(`[AllOrigins] Fetching: ${targetUrl}`);

        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: { 
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Extrahiere Items aus der Response
        const items = data.items || [];
        
        console.log(`[AllOrigins] Gefunden: ${items.length} Items`);

        results[cleanUrl] = {
          success: true,
          items: items.map((item: any) => ({
            id: item.id,
            title: item.title || 'Unbekannter Artikel',
            price: item.price ? `${item.price.amount} ${item.price.currency}` : 'Preis unbekannt',
            url: `https://www.${domain}/items/${item.id}`,
            thumbnail: item.photos?.[0]?.url || item.photos?.[0]?.thumbnails?.[0]?.url,
            brand: item.brand?.title,
            size: item.size?.title,
            status: item.status,
          })),
          count: items.length,
          userId: memberId,
          source: 'allorigins',
        };

      } catch (error: any) {
        console.error(`[AllOrigins] Fehler für ${cleanUrl}:`, error);
        results[cleanUrl] = {
          success: false,
          error: error.message || 'Unbekannter Fehler',
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[API] Fehler:', error);
    return NextResponse.json(
      { error: 'Server Fehler', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Vinted Bulk Scraper (AllOrigins - kostenlos)',
    version: '4.4',
    endpoints: {
      POST: '/api/vinted-bulk - Body: { profileUrl: string }',
    },
  });
}
