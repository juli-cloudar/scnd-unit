// src/app/api/vinted-bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SCRAPINGANT_API_KEY = process.env.SCRAPINGANT_API_KEY;

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

// ✅ OPTIONS für CORS Preflight
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
    console.log('[API] Request received');
    console.log('[API] Headers:', Object.fromEntries(request.headers.entries()));

    // ✅ Content-Type prüfen
    const contentType = request.headers.get('content-type');
    console.log('[API] Content-Type:', contentType);

    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: `Invalid Content-Type: ${contentType}. Must be application/json` },
        { status: 400 }
      );
    }

    // ✅ API Key prüfen
    if (!SCRAPINGANT_API_KEY) {
      console.error('[API] SCRAPINGANT_API_KEY not set');
      return NextResponse.json(
        { error: 'Server config error: API key missing' },
        { status: 500 }
      );
    }

    // ✅ Body parsen mit Fehlerbehandlung
    let body;
    try {
      body = await request.json();
      console.log('[API] Body:', body);
    } catch (parseError) {
      console.error('[API] JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { urls } = body;

    // ✅ URLs validieren
    if (!urls) {
      return NextResponse.json(
        { error: 'Missing "urls" field in body' },
        { status: 400 }
      );
    }

    if (!Array.isArray(urls)) {
      return NextResponse.json(
        { error: `"urls" must be an array, got ${typeof urls}` },
        { status: 400 }
      );
    }

    if (urls.length === 0) {
      return NextResponse.json(
        { error: '"urls" array is empty' },
        { status: 400 }
      );
    }

    if (urls.length > 3) {
      return NextResponse.json(
        { error: `Too many URLs: ${urls.length}. Max: 3` },
        { status: 400 }
      );
    }

    const results: Record<string, any> = {};

    for (const urlInput of urls) {
      // ✅ URL muss String sein
      if (typeof urlInput !== 'string') {
        results[String(urlInput)] = { 
          success: false, 
          error: `URL must be string, got ${typeof urlInput}` 
        };
        continue;
      }

      const cleanUrl = urlInput.trim();
      const memberId = extractMemberId(cleanUrl);
      const domain = extractDomain(cleanUrl);

      if (!memberId) {
        results[cleanUrl] = { 
          success: false, 
          error: `Could not extract member ID from: ${cleanUrl}` 
        };
        continue;
      }

      try {
        const targetUrl = `https://www.${domain}/api/v2/users/${memberId}/items?page=1&per_page=48`;
        const encodedTarget = encodeURIComponent(targetUrl);
        
        const proxyUrl = `https://api.scrapingant.com/v2/general?url=${encodedTarget}&x-api-key=${SCRAPINGANT_API_KEY}&browser=false`;

        console.log(`[API] Calling ScrapingAnt for ${cleanUrl}`);

        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`ScrapingAnt error ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        const items = (data.items || []).map((item: any) => ({
          id: item.id,
          title: item.title || 'Unknown',
          price: item.price ? `${item.price.amount} ${item.price.currency}` : 'N/A',
          url: `https://www.${domain}/items/${item.id}`,
          thumbnail: item.photos?.[0]?.url,
        }));

        results[cleanUrl] = {
          success: true,
          items,
          count: items.length,
        };

      } catch (error: any) {
        console.error(`[API] Error for ${cleanUrl}:`, error);
        results[cleanUrl] = { 
          success: false, 
          error: error.message 
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Vinted Bulk Scraper (ScrapingAnt)',
    version: '3.0-debug',
    apiKeyConfigured: !!SCRAPINGANT_API_KEY,
    endpoints: { 
      POST: '/api/vinted-bulk - Body: { urls: string[] }',
      GET: 'Status check'
    },
  });
}
