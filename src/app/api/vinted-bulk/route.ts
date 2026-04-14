// src/app/api/vinted-bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BROWSABLE_API_KEY = process.env.BROWSABLE_API_KEY;

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
    if (!BROWSABLE_API_KEY) {
      return NextResponse.json(
        { error: 'BROWSABLE_API_KEY nicht konfiguriert' },
        { status: 500 }
      );
    }

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
        // Browsable API mit richtigem Header
        const apiUrl = `https://api.browsable.app/v1/vinted/member/items?member_url=${encodeURIComponent(cleanUrl)}&pages=1&per_page=48`;

        console.log(`[Browsable] Request: ${apiUrl}`);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'x-api-key': BROWSABLE_API_KEY,  // ✅ Richtiger Header!
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Browsable API Fehler ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log(`[Browsable] Response:`, data);

        // Browsable gibt items in data.items zurück
        const items = data.items || data.data?.items || [];

        results[cleanUrl] = {
          success: true,
          items: items.map((item: any) => ({
            id: item.id || item.item_id,
            title: item.title || 'Unbekannt',
            price: item.price ? `${item.price} ${item.currency || 'EUR'}` : 'Preis unbekannt',
            url: item.url || `https://www.${domain}/items/${item.id}`,
            thumbnail: item.photo?.url || item.thumbnail || item.image,
            brand: item.brand,
            size: item.size,
          })),
          count: items.length,
          source: 'browsable',
        };

      } catch (error: any) {
        console.error(`[Browsable] Fehler für ${cleanUrl}:`, error);
        results[cleanUrl] = {
          success: false,
          error: error.message,
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
    status: 'Vinted Bulk Scraper (Browsable API)',
    version: '4.3',
    apiKeyConfigured: !!BROWSABLE_API_KEY,
    endpoints: {
      POST: '/api/vinted-bulk - Body: { profileUrl: string }',
    },
  });
}
