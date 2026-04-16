const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

const supabase = createClient(
  'https://vkuwqpgrvwvhvcbmhldk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s'
);

async function importCSV() {
  const results = [];
  const fileContent = fs.readFileSync('./export_2026-04-14T14-24-04-464Z.csv', 'utf8');
  const lines = fileContent.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  console.log('📖 Lese CSV...\n');
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.includes('Get Unlimited') || line.includes('##########')) continue;
    
    // Parse CSV Zeile
    const values = [];
    let current = '';
    let inQuote = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    
    const item = {};
    headers.forEach((h, idx) => {
      let val = values[idx] || '';
      val = val.replace(/^"|"$/g, '').trim();
      item[h] = val;
    });
    
    // Extrahiere Bilder
    let images = [];
    const allPhotos = item['All Photos'];
    if (allPhotos && allPhotos.includes(' || ')) {
      images = allPhotos.split(' || ').filter(u => u.startsWith('http')).map(u => u.split('?')[0]);
    } else if (allPhotos && allPhotos.startsWith('http')) {
      images = [allPhotos.split('?')[0]];
    }
    
    if (images.length === 0) continue;
    
    const title = item['Item Title'];
    const url = item['Item URL'];
    
    if (!title || !url) continue;
    
    console.log(`📸 ${title.substring(0, 45)}... → ${images.length} Bilder`);
    
    // Update oder Insert
    const { error } = await supabase
      .from('products')
      .update({ images: images })
      .eq('vinted_url', url);
    
    if (error) {
      // Falls nicht gefunden, neu einfügen
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          name: title,
          price: item['Item Price'] + '€',
          brand: item['Item Brand'] || 'Sonstige',
          size: item['Item Size'] || '–',
          condition: item['Item Status'] || 'Gut',
          vinted_url: url,
          images: images,
        });
      
      if (insertError) {
        console.log(`  ❌ Fehler: ${insertError.message}`);
      } else {
        console.log(`  ✅ Neu eingefügt`);
      }
    } else {
      console.log(`  ✅ Aktualisiert`);
    }
    
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log('\n🎉 Import abgeschlossen!');
}

importCSV().catch(console.error);
