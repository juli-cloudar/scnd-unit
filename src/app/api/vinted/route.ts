import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    const html = await response.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const priceMatch = html.match(/(\d+[.,]?\d*)\s*€/);
    const ogImageMatch = html.match(/<meta property="og:image" content="(.*?)"/);
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);

    let data: any = {};
    if (jsonLdMatch) {
      try { data = JSON.parse(jsonLdMatch[1]); } catch {}
    }

    const imageMatches = [...html.matchAll(/https:\/\/images1\.vinted\.net\/t\/[^"'\s)]+/g)];
    const uniqueImages = [...new Set(imageMatches.map(m => m[0]))]
      .map(img => img.replace(/[?&]s=[^&]+/, '').replace(/\/f\d+\//, '/f800/'))
      .slice(0, 5);

    const result = {
      name: data.name || titleMatch?.[1]?.replace(' - Vinted', '').trim() || '',
      price: data.offers?.price ? `€${data.offers.price}` : (priceMatch ? `€${priceMatch[1]}` : ''),
      images: uniqueImages.length > 0 ? uniqueImages : (ogImageMatch ? [ogImageMatch[1]] : []),
      category: guessCategory(data.name || titleMatch?.[1] || ''),
      size: extractSize(html),
      condition: 'Gut'
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Scraping failed' }, { status: 500 });
  }
}

function guessCategory(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('jacke') || lower.includes('jacket')) return 'Jacken';
  if (lower.includes('pullover') || lower.includes('sweater')) return 'Pullover';
  if (lower.includes('sweatshirt') || lower.includes('hoodie')) return 'Sweatshirts';
  if (lower.includes('shirt') || lower.includes('polo')) return 'Tops';
  return 'Sonstiges';
}

function extractSize(html: string): string {
  const patterns = [
    /Größe[:\s]*([SMXL\d]+[\/\dSMXL]*)/i,
    /size[:\s]*([SMXL\d]+[\/\dSMXL]*)/i,
    /"size":"([^"]+)"/,
    /\b([SMXL]{1,3})\b/
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return '';
}
