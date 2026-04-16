// src/app/api/vinted/check/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ status: 'error', exists: false, error: 'Keine ID angegeben' }, { status: 400 });
    }
    
    const vintedUrl = `https://www.vinted.de/api/v2/items/${id}`;
    
    const response = await fetch(vintedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'de-DE,de;q=0.9',
      },
      next: { revalidate: 0 }
    });
    
    if (response.status === 404) {
      return NextResponse.json({ status: 'not_found', exists: false, isSold: false });
    }
    
    if (!response.ok) {
      return NextResponse.json({ status: 'error', exists: false, isSold: false, error: `HTTP ${response.status}` });
    }
    
    const data = await response.json();
    const isSold = data?.item?.status === 'sold' || data?.status === 'sold';
    
    return NextResponse.json({
      status: isSold ? 'sold' : 'available',
      exists: true,
      isSold: isSold,
    });
    
  } catch (error) {
    console.error('Vinted API error:', error);
    return NextResponse.json({ 
      status: 'error', 
      exists: false, 
      isSold: false, 
      error: String(error) 
    });
  }
}
