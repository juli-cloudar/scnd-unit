import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const vintedUrl = `https://www.vinted.de/api/v2/items/${id}`;
    
    const response = await fetch(vintedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });
    
    if (response.status === 404) {
      return NextResponse.json({ status: 'not_found', exists: false }, { status: 200 });
    }
    
    if (!response.ok) {
      return NextResponse.json({ status: 'error', exists: false }, { status: 200 });
    }
    
    const data = await response.json();
    const isSold = data?.item?.status === 'sold' || data?.status === 'sold';
    
    return NextResponse.json({
      status: isSold ? 'sold' : 'available',
      exists: true,
    });
  } catch (error) {
    console.error('Vinted API error:', error);
    return NextResponse.json({ status: 'error', exists: false, error: String(error) }, { status: 200 });
  }
}
