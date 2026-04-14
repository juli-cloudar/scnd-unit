import { NextRequest, NextResponse } from 'next/server';

// API Key aus Vercel Environment Variable
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

export async function POST(request: NextRequest) {
  try {
    // Check: API Key vorhanden?
    if (!SCRAPINGANT_API_KEY) {
      return NextResponse.json(
        { error: 'ScrapingAnt API Key nicht konfiguriert. Bitte in Vercel Environment Variables hinzufügen.' },
        { status: 500 }
      );
    }

    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'URLs erforderlich' }, { status: 400 });
    }

    if (urls.length > 3) {
      return NextResponse.json({ error: 'Maximal 3 URLs erlaubt' }, { status: 400 });
    }

    const results: Record<string, any> = {};

    for (const urlInput of urls) {
      const cleanUrl = urlInput.trim();
      const memberId = extractMemberId(cleanUrl);
      const domain = extractDomain(cleanUrl);

      if (!memberId) {
        results[cleanUrl] = { success: false, error: 'Ungültige URL' };
        continue;
      }

      try {
        // ScrapingAnt Proxy URL
        const targetUrl = `https://www.${domain}/api/v2/users/${memberId}/items?page=1&per_page=48`;
        const encodedTarget = encodeURIComponent(targetUrl);
        
        const proxyUrl = `https://api.scrapingant.com/v2/general?url=${encodedTarget}&x-api-key=${SCRAPINGANT_API_KEY}&browser=false`;

        console.log(`[ScrapingAnt] Request: ${targetUrl}`);

        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Proxy Fehler ${response.status}: ${errorText}`);
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
        }));

        results[cleanUrl] = {
          success: true,
          items,
          count: items.length,
          userId: memberId,
        };

      } catch (error: any) {
        console.error(`[Error] ${cleanUrl}:`, error.message);
        results[cleanUrl] = { success: false, error: error.message };
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
    status: 'Vinted Bulk Scraper (ScrapingAnt)',
    version: '3.0',
    apiKeyConfigured: !!SCRAPINGANT_API_KEY,
    endpoints: { POST: '/api/vinted-bulk - Body: { urls: string[] }' },
  });
}
