const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://vkuwqpgrvwvhvcbmhldk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s'
);

async function importImages() {
  console.log('📖 Lade JSON Datei...');
  const data = JSON.parse(fs.readFileSync('./export_1776188494113.json', 'utf8'));
  
  // Filtere gültige Einträge
  const validItems = data.filter(item => item.id && typeof item.id === 'number');
  
  console.log(`📦 ${validItems.length} Artikel in JSON gefunden\n`);
  
  let updated = 0;
  
  for (const item of validItems) {
    // Sammle Bilder aus Item Photo 1-5
    const images = [];
    for (let i = 1; i <= 5; i++) {
      const photo = item[`Item Photo ${i}`];
      if (photo && typeof photo === 'string' && photo.startsWith('http')) {
        // Entferne Query Parameter für saubere URL
        images.push(photo.split('?')[0]);
      }
    }
    
    if (images.length === 0) {
      console.log(`⚠️ Keine Bilder für: ${item['Item Title']?.substring(0, 40)}`);
      continue;
    }
    
    const url = item['Item URL'];
    if (!url) continue;
    
    // Update die Bilder in der Datenbank
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

importImages().catch(console.error);
