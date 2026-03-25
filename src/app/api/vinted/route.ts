import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url || !url.includes('vinted')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.vinted.de/',
        'Origin': 'https://www.vinted.de',
      },
      redirect: 'manual'
    });

    if (response.status === 403 || response.status === 429) {
      return NextResponse.json({ 
        error: 'Blocked by Vinted',
        message: 'Vinted blockiert automatische Anfragen.'
      }, { status: 403 });
    }

    const html = await response.text();
    
    if (html.includes('datadome') || html.includes('captcha')) {
      return NextResponse.json({ 
        error: 'Anti-bot detected',
        message: 'Vinted Anti-Bot erkannt.'
      }, { status: 403 });
    }

    const titleMatch = html.match(/<title[^>]*>([^<]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(' - Vinted', '').trim() : '';
    
    const priceMatch = html.match(/(\d+[.,]?\d*)\s*€/);
    const price = priceMatch ? `€${priceMatch[1]}` : '';

    const imgMatches = [...html.matchAll(/https:\/\/images1\.vinted\.net\/t\/([^"'\s)>]+)/g)];
    const images = [...new Set(imgMatches.map(m => `https://images1.vinted.net/t/${m[1]}`))]
      .map(url => url.replace(/[?&]s=[^&]+/, '').replace(/\/f\d+\//, '/f800/'))
      .slice(0, 5);

    const sizeMatch = html.match(/Größe[:\s]*([SMXL\d]+)/i) || html.match(/"size":"([^"]+)"/i);
    const size = sizeMatch ? sizeMatch[1] : '';

    if (!title && images.length === 0) {
      return NextResponse.json({ 
        error: 'No data',
        message: 'Keine Daten gefunden.'
      }, { status: 422 });
    }

    return NextResponse.json({
      name: title,
      price: price,
      images: images,
      size: size,
      category: 'Sonstiges',
      condition: 'Gut'
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Scraping failed',
      message: 'Technischer Fehler.'
    }, { status: 500 });
  }
}
