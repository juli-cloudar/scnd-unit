const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://vkuwqpgrvwvhvcbmhldk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s'
);

async function restoreImages() {
  console.log('📖 Lade JSON Datei...');
  const data = JSON.parse(fs.readFileSync('./export_2026-04-14T14-24-46-445Z.json', 'utf8'));
  
  const validItems = data.filter(item => 
    item.id && 
    item.id !== 'Get Unlimited to see more than 10 rows.' &&
    !item.id.includes('#')
  );
  
  console.log(`📦 ${validItems.length} Artikel in JSON gefunden\n`);
  
  let updated = 0;
  
  for (const item of validItems) {
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
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log(`\n🎉 Fertig! ${updated} Artikel mit Bildern aktualisiert`);
}

restoreImages().catch(console.error);
