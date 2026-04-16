// src/app/api/products/[id]/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id, 10)
    
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle()  // ← Wichtig: maybeSingle() statt single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 })
    }
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
