const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://vkuwqpgrvwvhvcbmhldk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s'
);

async function importAll() {
  // Lese beide JSON-Dateien
  const files = [
    './export_2026-04-14T14-24-46-445Z.json',
    './export_1776188494113.json'
  ];
  
  let allItems = [];
  
  for (const file of files) {
    if (fs.existsSync(file)) {
      console.log(`📖 Lade ${file}...`);
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const valid = data.filter(item => 
        item.id && 
        item.id !== 'Get Unlimited to see more than 10 rows.' &&
        !String(item.id).includes('#')
      );
      allItems.push(...valid);
      console.log(`   → ${valid.length} gültige Artikel`);
    }
  }
  
  console.log(`\n📦 Insgesamt ${allItems.length} Artikel gefunden\n`);
  
  let imported = 0;
  let updated = 0;
  
  for (const item of allItems) {
    // Extrahiere Bilder
    let images = [];
    
    // Versuche "All Photos" Feld
    const allPhotos = item['All Photos'];
    if (allPhotos && typeof allPhotos === 'string') {
      if (allPhotos.includes(' || ')) {
        images = allPhotos.split(' || ');
      } else {
        images = [allPhotos];
      }
    }
    
    // Versuche "Item Photo 1-5" Felder
    if (images.length === 0) {
      for (let i = 1; i <= 5; i++) {
        const photo = item[`Item Photo ${i}`];
        if (photo && typeof photo === 'string' && photo.startsWith('http')) {
          images.push(photo);
        }
      }
    }
    
    // Bereinige URLs
    images = images
      .filter(url => url.startsWith('http') && url.includes('vinted.net'))
      .map(url => url.split('?')[0]);
    
    if (images.length === 0) continue;
    
    const title = item['Item Title'] || item['title'] || '';
    const url = item['Item URL'] || item['url'] || '';
    const price = String(item['Item Price'] || item['price'] || '0').replace(/[^0-9,.-]/g, '').replace(',', '.');
    const brand = item['Item Brand'] || item['brand'] || 'Sonstige';
    const size = item['Item Size'] || item['size'] || '–';
    const condition = item['Item Status'] || item['condition'] || 'Gut';
    
    if (!url) continue;
    
    // Prüfe ob Produkt existiert
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('vinted_url', url)
      .maybeSingle();
    
    const productData = {
      name: title.substring(0, 100),
      price: price + '€',
      brand: brand,
      size: size,
      condition: condition,
      vinted_url: url,
      images: images,
      category: 'Sonstiges'
    };
    
    if (existing) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', existing.id);
      if (!error) {
        console.log(`✅ Updated: ${title.substring(0, 40)}... (${images.length} Bilder)`);
        updated++;
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert(productData);
      if (!error) {
        console.log(`✅ Imported: ${title.substring(0, 40)}... (${images.length} Bilder)`);
        imported++;
      }
    }
    
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log(`\n🎉 Fertig! ${imported} neu importiert, ${updated} aktualisiert`);
}

importAll().catch(console.error);
