// app/api/vinted/check/[id]/route.ts
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const itemId = params.id;
  
  try {
    // Vinted API-Endpunkt für Item-Details
    const response = await fetch(
      `https://www.vinted.de/api/v2/items/${itemId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        next: { revalidate: 0 } // Kein Caching
      }
    );
    
    // 404 = Item existiert nicht mehr
    if (response.status === 404) {
      return NextResponse.json({ exists: false, status: 'deleted' });
    }
    
    // 403/429 = Rate limited
    if (response.status === 403 || response.status === 429) {
      return NextResponse.json(
        { error: 'Rate limited', exists: true, isSold: false },
        { status: 429 }
      );
    }
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Unknown error', exists: true, isSold: false },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Prüfe ob Artikel verkauft ist
    const isSold = data.item?.status === 'sold' || data.item?.sold === true;
    
    return NextResponse.json({
      exists: true,
      isSold: isSold,
      status: isSold ? 'sold' : 'active',
      title: data.item?.title
    });
    
  } catch (error) {
    console.error('Vinted API error:', error);
    return NextResponse.json(
      { error: 'Network error', exists: true, isSold: false },
      { status: 500 }
    );
  }
}
