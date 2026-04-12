// src/app/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import ProductClient from './ProductClient'; // Achte darauf, dass der Import-Name stimmt

async function getProducts() {
  try {
    const res = await fetch(
      'https://vkuwqpgrvwvhvcbmhldk.supabase.co/rest/v1/products?select=*&sold=eq.false&order=id.desc',
      {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s',
        },
        cache: 'no-store',
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

export default async function Page() {
  const products = await getProducts();
  return <ProductClient initialProducts={products} />;
}
