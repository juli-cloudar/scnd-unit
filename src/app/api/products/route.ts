// src/app/api/products/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Query-Parameter auslesen
    const { searchParams } = new URL(request.url)
    const sold = searchParams.get('sold')
    
    // Basis-Query
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Wenn 'sold' Parameter vorhanden ist, filtere danach
    if (sold === 'true') {
      query = query.eq('sold', true)
    } else if (sold === 'false') {
      query = query.eq('sold', false)
    }
    // Wenn kein sold Parameter, werden ALLE Produkte geladen
    
    const { data, error } = await query
    
    if (error) {
      console.error('Supabase Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data || [])
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST zum Hinzufügen eines Produkts
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('products')
      .insert([body])
      .select()
      .maybeSingle();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data, { status: 201 })
    
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
