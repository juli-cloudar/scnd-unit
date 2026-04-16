const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://vkuwqpgrvwvhvcbmhldk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s'
);

async function fixImages() {
  console.log('📖 Lese CSV Datei...');
  const content = fs.readFileSync('./export_2026-04-14T14-24-04-464Z.csv', 'utf8');
  const lines = content.split('\n');
  
  let updated = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.includes('Get Unlimited') || line.includes('##########')) continue;
    
    // Parse CSV
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
    
    const title = values[1]?.replace(/^"|"$/g, '');
    const url = values[9]?.replace(/^"|"$/g, '');
    const allPhotos = values[10]?.replace(/^"|"$/g, '');
    
    if (!url || !allPhotos) continue;
    
    // Bilder extrahieren
    let images = [];
    if (allPhotos.includes(' || ')) {
      images = allPhotos.split(' || ');
    } else {
      images = [allPhotos];
    }
    images = images.filter(img => img.startsWith('http')).map(img => img.split('?')[0]);
    
    if (images.length === 0) continue;
    
    // Update in Supabase
    const { error } = await supabase
      .from('products')
      .update({ images: images })
      .eq('vinted_url', url);
    
    if (error) {
      console.log(`❌ ${title?.substring(0, 30)}: ${error.message}`);
    } else {
      console.log(`✅ ${title?.substring(0, 40)} → ${images.length} Bilder`);
      updated++;
    }
    
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log(`\n🎉 ${updated} Produkte mit Bildern aktualisiert!`);
}

fixImages();
