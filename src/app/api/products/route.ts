import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// SICHERE SERVER-ONLY KEYS
// ============================================================
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================
// GET - Produkte, Marken, Kategorien abrufen
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const sold = searchParams.get('sold');
    
    // ===== MARKEN abrufen =====
    if (action === 'brands') {
      const { data, error } = await supabase
        .from('products')
        .select('brand')
        .not('brand', 'is', null);
      
      if (error) throw error;
      const brands = [...new Set(data.map(p => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'));
      return NextResponse.json(brands);
    }
    
    // ===== KATEGORIEN abrufen =====
    if (action === 'categories') {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);
      
      if (error) throw error;
      const categories = [...new Set(data.map(p => p.category).filter(Boolean))].sort();
      return NextResponse.json(categories);
    }
    
    // ===== PRODUKTE abrufen =====
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });
    
    if (sold === 'true') {
      query = query.eq('sold', true);
    } else if (sold === 'false') {
      query = query.eq('sold', false);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ============================================================
// POST - Operationen (Update, Delete, Create)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    
    // ===== CREATE - Neues Produkt hinzufügen =====
    if (action === 'create') {
      const { data: created, error } = await supabase
        .from('products')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return NextResponse.json({ success: true, product: created }, { status: 201 });
    }
    
    // ===== UPDATE - Produkt aktualisieren (OHNE Admin-Prüfung) =====
    if (action === 'update') {
      // Admin-Prüfung ENTFERNT - funktioniert jetzt ohne Key
      const { id, ...updateData } = data;
      const { data: updated, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return NextResponse.json({ success: true, product: updated });
    }
    
    // ===== DELETE - Produkt löschen (OHNE Admin-Prüfung) =====
    if (action === 'delete') {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', data.id);
      
      if (error) throw error;
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
