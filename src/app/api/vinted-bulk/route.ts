import { NextRequest, NextResponse } from 'next/server';

interface VintedItem {
  id: number;
  title: string;
  price: string;
  url: string;
  thumbnail?: string;
}

// Vereinfachte Headers (weniger "bot-like")
const SIMPLE_HEADERS = {
  'Accept': 'application/json',
  'Accept-Language': 'de-DE,de;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

// OPTIONS für CORS
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

    if (urls.length > 3) {
      return NextResponse.json(
        { error: 'Maximal 3 URLs erlaubt' },
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
        // Direkter API-Call OHNE Cookie-Hack (funktioniert oft bei Vinted)
        const apiUrl = `https://www.${domain}/api/v2/users/${memberId}/items?page=1&per_page=48`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: SIMPLE_HEADERS,
          cache: 'no-store',
        });

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
        }));

        results[cleanUrl] = {
          success: true,
          items: items,
          count: items.length,
          userId: memberId,
        };

      } catch (error: any) {
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
      { error: 'Interner Serverfehler', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Vinted Bulk Scraper API',
    version: '2.2 (Vereinfacht)',
  });
}
