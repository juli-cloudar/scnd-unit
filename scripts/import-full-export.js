const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://vkuwqpgrvwvhvcbmhldk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s'
);

async function importFull() {
  console.log('📖 Lese export_full_15411324...');
  const content = fs.readFileSync('./export_full_15411324', 'utf8');
  
  // Prüfe ob es JSON oder CSV ist
  let items = [];
  
  if (content.trim().startsWith('[')) {
    // JSON Format
    const data = JSON.parse(content);
    items = data.filter(item => item.id && !String(item.id).includes('#'));
    console.log(`📦 JSON: ${items.length} Artikel gefunden`);
  } else {
    // CSV Format
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim() || line.includes('Get Unlimited') || line.includes('##########')) continue;
      
      const values = [];
      let current = '';
      let inQuote = false;
      for (let j = 0; j < line.length; j++) {
        const c = line[j];
        if (c === '"') inQuote = !inQuote;
        else if (c === ',' && !inQuote) { values.push(current); current = ''; }
        else current += c;
      }
      values.push(current);
      
      const item = {};
      headers.forEach((h, idx) => {
        let val = values[idx] || '';
        val = val.replace(/^"|"$/g, '').trim();
        item[h] = val;
      });
      items.push(item);
    }
    console.log(`📦 CSV: ${items.length} Artikel gefunden`);
  }
  
  let imported = 0;
  let updated = 0;
  
  for (const item of items) {
    // Bilder extrahieren
    let images = [];
    const allPhotos = item['All Photos'] || item['all_photos'];
    if (allPhotos && typeof allPhotos === 'string') {
      if (allPhotos.includes(' || ')) {
        images = allPhotos.split(' || ');
      } else {
        images = [allPhotos];
      }
      images = images.filter(url => url.startsWith('http')).map(url => url.split('?')[0]);
    }
    
    // Fallback: Einzelbilder
    if (images.length === 0) {
      for (let p = 1; p <= 10; p++) {
        const photo = item[`Item Photo ${p}`];
        if (photo && photo.startsWith('http')) images.push(photo.split('?')[0]);
      }
    }
    
    const title = item['Item Title'] || item['title'] || '';
    const url = item['Item URL'] || item['url'] || '';
    const price = String(item['Item Price'] || item['price'] || '0').replace(/[^0-9,.-]/g, '').replace(',', '.');
    const brand = item['Item Brand'] || item['brand'] || 'Sonstige';
    const size = item['Item Size'] || item['size'] || '–';
    const condition = item['Item Status'] || item['condition'] || 'Gut';
    
    if (!url || !title) continue;
    
    // Prüfe ob existiert
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
    };
    
    if (existing) {
      const { error } = await supabase.from('products').update(productData).eq('id', existing.id);
      if (!error) {
        console.log(`✅ Updated: ${title.substring(0, 45)} → ${images.length} Bilder`);
        updated++;
      }
    } else {
      const { error } = await supabase.from('products').insert(productData);
      if (!error) {
        console.log(`✅ Imported: ${title.substring(0, 45)} → ${images.length} Bilder`);
        imported++;
      }
    }
    
    await new Promise(r => setTimeout(r, 30));
  }
  
  console.log(`\n🎉 Fertig! ${imported} neu, ${updated} aktualisiert`);
}

importFull().catch(console.error);
