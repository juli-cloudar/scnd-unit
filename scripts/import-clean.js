const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://vkuwqpgrvwvhvcbmhldk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s'
);

async function importClean() {
  // Lese die JSON mit Einzelbildern
  const data = JSON.parse(fs.readFileSync('./export_1776188494113.json', 'utf8'));
  
  console.log(`📦 ${data.length} Produkte in JSON\n`);
  
  for (const item of data) {
    // Sammle Bilder aus Item Photo 1-5
    const images = [];
    for (let i = 1; i <= 5; i++) {
      const photo = item[`Item Photo ${i}`];
      if (photo && photo.startsWith('http')) {
        images.push(photo.split('?')[0]);
      }
    }
    
    if (images.length === 0) continue;
    
    // Prüfe ob Produkt existiert
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('vinted_url', item['Item URL'])
      .maybeSingle();
    
    if (existing) {
      // Update existierendes Produkt
      const { error } = await supabase
        .from('products')
        .update({ images: images })
        .eq('id', existing.id);
      
      if (!error) console.log('✅ Updated:', item['Item Title'].substring(0, 40));
    } else {
      // Neues Produkt einfügen
      const { error } = await supabase
        .from('products')
        .insert({
          name: item['Item Title'],
          price: item['Item Price'],
          brand: item['Item Brand'],
          size: item['Item Size'],
          condition: item['Item Status'],
          vinted_url: item['Item URL'],
          images: images,
        });
      
      if (!error) console.log('✅ Inserted:', item['Item Title'].substring(0, 40));
    }
    
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log('\n🎉 Import abgeschlossen!');
}

importClean();
