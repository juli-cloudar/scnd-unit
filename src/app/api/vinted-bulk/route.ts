// src/app/api/vinted-bulk/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  console.log('[API] Bulk POST received');
  
  try {
    const body = await request.json();
    const { profileUrl, quick = false } = body;
    
    let identifier = profileUrl;
    
    // Extrahiere Member-ID
    let memberId = '';
    if (/^\d+$/.test(identifier)) {
      memberId = identifier;
    } else if (identifier.includes('/member/')) {
      const match = identifier.match(/\/member\/(\d+)/);
      if (match) memberId = match[1];
    } else {
      const numMatch = identifier.match(/^(\d+)/);
      if (numMatch) memberId = numMatch[1];
    }
    
    if (!memberId) {
      return NextResponse.json({ message: 'Keine gültige Member-ID gefunden' }, { status: 400, headers: CORS });
    }
    
    console.log(`[API] Member ID: ${memberId}`);
    
    // Simuliere 50 Items für den Test
    const mockUrls = Array.from({ length: 50 }, (_, i) => 
      `https://www.vinted.de/items/${1000000 + i}-test-item`
    );
    
    if (quick === true) {
      return NextResponse.json({
        totalItems: 50,
        itemUrls: mockUrls,
        message: '50 Items gefunden'
      }, { headers: CORS });
    }
    
    return NextResponse.json({
      summary: { total: 50, available: 30, sold: 20 },
      message: 'Test erfolgreich'
    }, { headers: CORS });
    
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ message: 'Fehler: ' + String(error) }, { status: 500, headers: CORS });
  }
}
