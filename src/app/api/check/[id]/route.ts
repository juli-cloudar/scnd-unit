import { NextRequest, NextResponse } from 'next/server';

// Liste realistischer User‑Agent Strings (Rotation)
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Verkaufs‑Indikatoren (exakt wie im AddTab‑Scraper)
const SOLD_PATTERNS = [
  /Dieser Artikel ist bereits verkauft/i,
  /Artikel nicht verfügbar/i,
  /reserviert/i,
  /sold/i,
  /verkauft/i,
  /nicht mehr verfügbar/i,
  /data-testid="item-sold"/i,
  /class="[^"]*item-sold[^"]*"/i,
  /Dieser Artikel ist reserviert/i,
];

function isItemSold(html: string): boolean {
  for (const pattern of SOLD_PATTERNS) {
    if (pattern.test(html)) return true;
  }
  return false;
}

async function fetchWithRetry(url: string, retries = 2): Promise<{ status: number; html: string } | null> {
  for (let i = 0; i <= retries; i++) {
    const userAgent = getRandomUserAgent();
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
          'Referer': 'https://www.vinted.de/',
          'Cache-Control': 'no-cache',
        },
      });

      if (response.status === 404 || response.status === 410) {
        return { status: 404, html: '' };
      }
      if (response.status === 403 || response.status === 429) {
        // Warte kurz und versuche es mit anderem User‑Agent
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      if (!response.ok) {
        return { status: response.status, html: '' };
      }
      const html = await response.text();
      return { status: response.status, html };
    } catch (err) {
      // Netzwerkfehler – nochmal versuchen
      if (i === retries) return null;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: itemId } = await params;
  const url = `https://www.vinted.de/items/${itemId}`;

  const result = await fetchWithRetry(url, 2);

  // Fallback: Wenn gar nichts geht, nehmen wir an, dass das Item existiert (kein falscher Alarm)
  if (!result) {
    return NextResponse.json(
      { error: 'Network error', exists: true, isSold: false },
      { status: 500 }
    );
  }

  // 404 / 410 = Artikel existiert nicht mehr
  if (result.status === 404 || result.status === 410) {
    return NextResponse.json({ exists: false, status: 'deleted' });
  }

  // Andere HTTP-Fehler (z.B. 500) – existiert laut Annahme noch
  if (result.status !== 200) {
    return NextResponse.json(
      { error: `HTTP ${result.status}`, exists: true, isSold: false },
      { status: result.status }
    );
  }

  // HTML auswerten
  const html = result.html;
  const sold = isItemSold(html);

  // Optional: Titel extrahieren (für Logging)
  let title = '';
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  if (titleMatch) title = titleMatch[1].replace(' | Vinted', '');

  return NextResponse.json({
    exists: true,
    isSold: sold,
    status: sold ? 'sold' : 'active',
    title,
  });
}
