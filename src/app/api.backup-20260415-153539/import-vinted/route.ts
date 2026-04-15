// app/api/import-vinted/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Keine gültigen Items erhalten' }, { status: 400 });
    }
    
    let success = 0;
    let failed = 0;
    
    for (const item of items) {
      const photoUrl = item.photo || (item.photos && item.photos[0]) || '';
      
      const { error } = await supabaseServer
        .from('products')
        .upsert({
          id: item.id,
          name: item.title,
          price: item.price,
          size: item.size || '',
          condition: item.status || item.condition || 'Gut',
          images: [photoUrl],
          vinted_url: item.url,
          category: item.brand || 'Vintage',
          sold: false,
        }, { onConflict: 'id' });
      
      if (error) {
        failed++;
        console.error(`Fehler bei ${item.title}:`, error);
      } else {
        success++;
      }
    }
    
    return NextResponse.json({ success, failed });
    
  } catch (error: any) {
    console.error('Import Fehler:', error);
    return NextResponse.json({ success: 0, failed: 0, error: error.message }, { status: 500 });
  }
}
