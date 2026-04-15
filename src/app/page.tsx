// src/app/page.tsx
export const revalidate = 0; // Deaktiviert Cache für Echtzeit-Updates
export const dynamic = 'force-dynamic';

import { ProductClient } from './ProductClient';

async function getProducts() {
  const supabaseUrl = 'https://vkuwqpgrvwvhvcbmhldk.supabase.co/rest/v1/products?select=*&sold=eq.false&order=id.desc';
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s';

  try {
    const res = await fetch(supabaseUrl, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error("Supabase Fetch fehlgeschlagen:", res.statusText);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error("Server-Side Fetch Error:", error);
    return [];
  }
}

export default async function Page() {
  // 1. Daten auf dem Server laden
  const products = await getProducts();

  // 2. Daten an die 'use client' Komponente übergeben
  // Dein ProductClient übernimmt dann das Design und Filtern
  return <ProductClient initialProducts={products} />;
}
