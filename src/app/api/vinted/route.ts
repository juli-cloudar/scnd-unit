import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url?.includes('vinted.de')) return NextResponse.json({ error: 'Ungültige URL' }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'de-DE,de;q=0.9',
      }
    });
    const html = await res.text();

    const nameMatch = html.match(/<title>([^|<]+)/);
    const name = nameMatch?.[1]?.trim() ?? '';

    const priceMatch = html.match(/(\d+),\d+\s*€/) || html.match(/"price":(\d+\.?\d*)/);
    const price = priceMatch ? `€${priceMatch[1]}` : '';

    const sizeMatch = html.match(/"size_title":"([^"]+)"/) || html.match(/"sizeName":"([^"]+)"/);
    const size = sizeMatch?.[1]?.trim() ?? '';

    let condition = '';
    if (html.includes('Neu mit Etikett')) condition = 'Neu mit Etikett';
    else if (html.includes('Neu ohne Etikett')) condition = 'Neu ohne Etikett';
    else if (html.includes('Sehr gut')) condition = 'Sehr gut';
    else if (html.includes('Zufriedenstellend')) condition = 'Zufriedenstellend';
    else if (html.includes('>Gut<')) condition = 'Gut';

    const imageMatches = [...html.matchAll(/https:\/\/images\d+\.vinted\.net\/[^"'\s]+\.webp/g)];
    const images = [...new Set(imageMatches.map(m => m[0]))].filter(img => img.includes('/f800/')).slice(0, 5);

    const lower = (url + ' ' + name).toLowerCase();
    const category =
      lower.includes('jacke') || lower.includes('jacket') || lower.includes('puffer') || lower.includes('weste') ? 'Jacken' :
      lower.includes('fleece') || lower.includes('pullover') || lower.includes('troyer') ? 'Pullover' :
      lower.includes('sweatshirt') || lower.includes('hoodie') || lower.includes('sweater') ? 'Sweatshirts' :
      lower.includes('hose') || lower.includes('pants') || lower.includes('jeans') ? 'Hosen' : 'Sonstiges';

    return NextResponse.json({ name, price, size, condition, images, category, vintedUrl: url });
  } catch {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
  }
}
