const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://vkuwqpgrvwvhvcbmhldk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s'
);

async function importJSON() {
  const files = [
    './export_1776338569963.json',
    './export_1776338472687.json'
  ];
  
  let totalImported = 0;
  let totalUpdated = 0;
  
  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.log(`❌ ${file} nicht gefunden`);
      continue;
    }
    
    console.log(`\n📖 Lese ${file}...`);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(`📦 ${data.length} Artikel in Datei`);
    
    for (const item of data) {
      // Sammle Bilder aus Item Photo 1-5
      const images = [];
      for (let i = 1; i <= 5; i++) {
        const photo = item[`Item Photo ${i}`];
        if (photo && photo !== 'Not Available' && typeof photo === 'string' && photo.startsWith('http')) {
          images.push(photo.split('?')[0]);
        }
      }
      
      if (images.length === 0) {
        console.log(`⚠️ Keine Bilder für: ${item['Item Title']?.substring(0, 40)}`);
        continue;
      }
      
      const title = item['Item Title'];
      const url = item['Item URL'];
      let price = String(item['Item Price'] || '0');
      price = price.replace(' EUR', '').replace(',', '.');
      const brand = item['Item Brand'] || 'Sonstige';
      const size = item['Item Size'] || '–';
      const condition = item['Item Status'] || 'Gut';
      
      if (!url || !title) continue;
      
      // Prüfe ob Produkt existiert
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('vinted_url', url)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('products')
          .update({ 
            name: title.substring(0, 100),
            price: price + '€',
            brand: brand,
            size: size,
            condition: condition,
            images: images
          })
          .eq('id', existing.id);
        
        if (error) {
          console.log(`❌ Update Fehler: ${title.substring(0, 40)} - ${error.message}`);
        } else {
          console.log(`✅ Updated: ${title.substring(0, 45)} → ${images.length} Bilder`);
          totalUpdated++;
        }
      } else {
        const { error } = await supabase
          .from('products')
          .insert({
            name: title.substring(0, 100),
            price: price + '€',
            brand: brand,
            size: size,
            condition: condition,
            vinted_url: url,
            images: images
          });
        
        if (error) {
          console.log(`❌ Insert Fehler: ${title.substring(0, 40)} - ${error.message}`);
        } else {
          console.log(`✅ Imported: ${title.substring(0, 45)} → ${images.length} Bilder`);
          totalImported++;
        }
      }
      
      // Kleine Pause
      await new Promise(r => setTimeout(r, 30));
    }
  }
  
  console.log(`\n🎉 Fertig! ${totalImported} neu importiert, ${totalUpdated} aktualisiert`);
}

importJSON().catch(console.error);
