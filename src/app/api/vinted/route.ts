import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes('vinted')) {
      return NextResponse.json({ message: 'Ungültige URL' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ message: 'Vinted blockiert Anfrage' }, { status: 403 });
    }

    const html = await response.text();

    const nameMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const name = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    let price = '';
    let currency = '€';

    const jsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        if (jsonData.offers?.price) {
          price = jsonData.offers.price.toString().replace('.', ',');
          currency = jsonData.offers.priceCurrency || '€';
        }
      } catch (e) {}
    }

    if (!price) {
      const pricePatterns = [
        /(\d{1,3}(?:\.\d{3})*,\d{2})\s*([€$])/,
        /(\d+,\d{2})\s*([€$])/,
        /([€$])\s*(\d{1,3}(?:,\d{3})*\.\d{2})/,
      ];
      for (const pattern of pricePatterns) {
        const match = html.match(pattern);
        if (match) {
          if (match[0].startsWith('€') || match[0].startsWith('$')) {
            price = match[2].replace('.', ',');
            currency = match[1];
          } else {
            price = match[1];
            currency = match[2];
          }
          break;
        }
      }
    }

    const imgMatches = [...html.matchAll(/https:\/\/images1\.vinted\.net\/t\/[^"'\s<>]+/g)];
    const images = imgMatches
      .map(m => m[0])
      .map(u => u.replace(/\/f\d+\//, '/f800/'))
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 5)
      .map(imgUrl => `/api/image-proxy?url=${encodeURIComponent(imgUrl)}`);

    const sizeMatch = html.match(/Größe[:\s]+([^<\n,]+)/i);
    const size = sizeMatch ? sizeMatch[1].trim() : '';

    const conditionMatch = html.match(/Zustand[:\s]+([^<\n,]+)/i);
    const condition = conditionMatch ? conditionMatch[1].trim() : 'Gut';

    return NextResponse.json({
      name,
      price,
      size,
      condition,
      images,
      category: guessCategory(name),
    });

  } catch (error) {
    return NextResponse.json({ message: 'Server-Fehler' }, { status: 500 });
  }
}

function guessCategory(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('jacke') || lower.includes('jacket')) return 'Jacken';
  if (lower.includes('pullover') || lower.includes('sweater')) return 'Pullover';
  if (lower.includes('sweatshirt') || lower.includes('crewneck')) return 'Sweatshirts';
  if (lower.includes('shirt') || lower.includes('polo')) return 'Tops';
  return 'Sonstiges';
}