// src/app/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { ProductClient } from './ProductClient';
import { supabaseServer } from '@/lib/supabase-server';

export default async function Page() {
  // Daten sicher über den Server-Client laden
  const { data: products, error } = await supabaseServer
    .from('products')
    .select('*')
    .eq('sold', false)
    .order('id', { ascending: false });

  if (error) {
    console.error('Supabase Fehler:', error);
    return <div className="text-center py-20 text-red-500">Fehler beim Laden der Produkte</div>;
  }

  return <ProductClient initialProducts={products || []} />;
}
