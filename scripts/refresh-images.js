const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://vkuwqpgrvwvhvcbmhldk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s'
);

async function refreshImages() {
  // Hole alle Produkte mit Bildern
  const { data: products } = await supabase
    .from('products')
    .select('id, name, vinted_url, images')
    .not('images', 'is', null);
  
  console.log(`📦 ${products?.length || 0} Produkte mit Bildern\n`);
  
  for (const product of products || []) {
    const imageUrl = product.images?.[0];
    if (!imageUrl) continue;
    
    // Prüfe ob Bild noch existiert
    try {
      const res = await fetch(imageUrl, { method: 'HEAD' });
      if (!res.ok) {
        console.log(`❌ Bild defekt: ${product.name.substring(0, 40)} (${res.status})`);
        
        // Optional: Lösche die defekten Bilder
        // await supabase.from('products').update({ images: null }).eq('id', product.id);
      } else {
        console.log(`✅ Bild OK: ${product.name.substring(0, 40)}`);
      }
    } catch (e) {
      console.log(`⚠️ Fehler bei: ${product.name.substring(0, 40)}`);
    }
    
    await new Promise(r => setTimeout(r, 100));
  }
}

refreshImages();
