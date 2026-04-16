const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://vkuwqpgrvwvhvcbmhldk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s'
);

async function importCSV() {
  console.log('📖 Lese CSV Datei...');
  const csv = fs.readFileSync('./export_2026-04-14T14-24-04-464Z.csv', 'utf8');
  const lines = csv.split('\n');
  const headers = lines[0].split(',');
  
  let updated = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.includes('Get Unlimited')) continue;
    
    // Parse CSV Zeile (einfach, da keine Kommas in Strings)
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
      item[h.trim()] = values[idx]?.replace(/^"|"$/g, '');
    });
    
    // Extrahiere Bilder aus "All Photos"
    let images = [];
    const allPhotos = item['All Photos'];
    
    if (allPhotos && typeof allPhotos === 'string') {
      if (allPhotos.includes(' || ')) {
        images = allPhotos.split(' || ');
      } else {
        images = [allPhotos];
      }
      images = images.filter(url => url.startsWith('http') && url.includes('vinted.net'));
      images = images.map(url => url.split('?')[0]);
    }
    
    if (images.length === 0) continue;
    
    const url = item['Item URL'];
    if (!url) continue;
    
    // Update die Bilder
    const { error } = await supabase
      .from('products')
      .update({ images: images })
      .eq('vinted_url', url);
    
    if (error) {
      console.log(`❌ ${item['Item Title']?.substring(0, 30)}: ${error.message}`);
    } else {
      console.log(`✅ ${item['Item Title']?.substring(0, 40)}... ${images.length} Bilder`);
      updated++;
    }
    
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log(`\n🎉 ${updated} Artikel mit Bildern aktualisiert!`);
}

importCSV().catch(console.error);
