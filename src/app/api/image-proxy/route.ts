// app/api/image-proxy/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }
    
    // ⭐ NICHT die Parameter entfernen! ⭐
    // Die Original-URL mit allen Parametern verwenden
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://www.vinted.de/',
      },
    });
    
    if (!response.ok) {
      return new NextResponse(`Failed: ${response.status}`, { status: response.status });
    }
    
    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
