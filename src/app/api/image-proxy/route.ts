// src/app/api/image-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cache für 1 Jahr (Bilder ändern sich nie)
const CACHE_MAX_AGE = 31536000; // 1 Jahr in Sekunden

// Cache für wiederholte Anfragen (In-Memory)
const imageCache = new Map<string, { buffer: ArrayBuffer, timestamp: number, contentType: string }>();
const CACHE_DURATION = 3600000; // 1 Stunde in Millisekunden

// Aufräumen des Caches alle 30 Minuten
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of imageCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      imageCache.delete(key);
    }
  }
}, 1800000);

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }
    
    // Sicherheitscheck: Nur Vinted Bilder erlauben
    if (!url.includes('images1.vinted.net') && !url.includes('images.vinted.net')) {
      return new NextResponse('Invalid image domain', { status: 403 });
    }
    
    // Cache-Key erstellen
    const cacheKey = url;
    const cached = imageCache.get(cacheKey);
    
    // Wenn im Cache, direkt zurückgeben (ultraschnell!)
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return new NextResponse(cached.buffer, {
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
          'CDN-Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
          'Vercel-CDN-Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'HIT',
        },
      });
    }
    
    // Bild von Vinted laden
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        'Referer': 'https://www.vinted.de/',
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      return new NextResponse(`Failed to fetch image: ${response.status}`, { status: response.status });
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    
    // Im Cache speichern (als ArrayBuffer, nicht Buffer)
    imageCache.set(cacheKey, {
      buffer,
      timestamp: Date.now(),
      contentType,
    });
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
        'CDN-Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
        'Vercel-CDN-Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'MISS',
      },
    });
    
  } catch (error) {
    console.error('Image proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
