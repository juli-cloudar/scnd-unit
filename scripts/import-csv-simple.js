const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://vkuwqpgrvwvhvcbmhldk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s'
);

async function importCSV() {
  console.log('📖 Lese CSV Datei...');
  const content = fs.readFileSync('./export_2026-04-14T14-24-04-464Z.csv', 'utf8');
  const lines = content.split('\n');
  
  // Erste Zeile = Header
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  let imported = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.includes('Get Unlimited')) break;
    if (line.includes('##########')) continue;
    
    // CSV Zeile parsen (einfach, weil keine Kommas in Strings)
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
    
    // Item erstellen
    const item = {};
    headers.forEach((h, idx) => {
      let val = values[idx] || '';
      val = val.replace(/^"|"$/g, '').trim();
      item[h] = val;
    });
    
    // Bilder extrahieren
    let images = [];
    const allPhotos = item['All Photos'];
    if (allPhotos && typeof allPhotos === 'string') {
      if (allPhotos.includes(' || ')) {
        images = allPhotos.split(' || ');
      } else {
        images = [allPhotos];
      }
      images = images.filter(url => url.startsWith('http')).map(url => url.split('?')[0]);
    }
    
    if (images.length === 0) continue;
    
    const title = item['Item Title'];
    const url = item['Item URL'];
    const price = item['Item Price'] || '0';
    const brand = item['Item Brand'] || 'Sonstige';
    const size = item['Item Size'] || '–';
    const condition = item['Item Status'] || 'Gut';
    
    if (!title || !url) continue;
    
    process.stdout.write(`📸 ${title.substring(0, 45)}... → ${images.length} Bilder → `);
    
    // Prüfe ob existiert
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('vinted_url', url)
      .maybeSingle();
    
    if (existing) {
      const { error } = await supabase
        .from('products')
        .update({ images: images })
        .eq('id', existing.id);
      
      if (error) {
        console.log(`❌ ${error.message}`);
      } else {
        console.log(`✅ Aktualisiert`);
        imported++;
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert({
          name: title,
          price: price + '€',
          brand: brand,
          size: size,
          condition: condition,
          vinted_url: url,
          images: images,
        });
      
      if (error) {
        console.log(`❌ ${error.message}`);
      } else {
        console.log(`✅ Neu importiert`);
        imported++;
      }
    }
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log(`\n🎉 Fertig! ${imported} Produkte mit Bildern importiert/aktualisiert`);
}

importCSV().catch(console.error);
