const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://vkuwqpgrvwvhvcbmhldk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s'
);

async function fixAndImport() {
  console.log('📖 Lese Datei...');
  let content = fs.readFileSync('./export_full_15411324', 'utf8');
  
  // Entferne nicht-printable Zeichen
  content = content.replace(/[^\x20-\x7E\n\r\t]/g, '');
  
  // Versuche zu parsen
  let data;
  try {
    data = JSON.parse(content);
  } catch(e) {
    console.log('⚠️ JSON Fehler, versuche zu reparieren...');
    
    // Entferne alles nach dem letzten vollständigen Objekt
    const lastValid = content.lastIndexOf('}');
    if (lastValid > 0) {
      const truncated = content.substring(0, lastValid + 1) + ']';
      try {
        data = JSON.parse(truncated);
        console.log('✅ Repariert durch Abschneiden');
      } catch(e2) {
        console.log('❌ Konnte nicht repariert werden');
        return;
      }
    }
  }
  
  if (!data || !Array.isArray(data)) {
    console.log('❌ Kein gültiges Array gefunden');
    return;
  }
  
  const validItems = data.filter(item => item.id && !String(item.id).includes('#'));
  console.log(`📦 ${validItems.length} gültige Artikel\n`);
  
  let imported = 0;
  let updated = 0;
  
  for (const item of validItems) {
    // Bilder aus Item Photo 1-5
    let images = [];
    for (let i = 1; i <= 5; i++) {
      const photo = item[`Item Photo ${i}`];
      if (photo && typeof photo === 'string' && photo.startsWith('http')) {
        images.push(photo.split('?')[0]);
      }
    }
    
    const title = item['Item Title'] || '';
    const url = item['Item URL'] || '';
    const price = String(item['Item Price'] || '0').replace(' EUR', '');
    const brand = item['Item Brand'] || 'Sonstige';
    const size = item['Item Size'] || '–';
    const condition = item['Item Status'] || 'Gut';
    
    if (!url || !title) continue;
    
    console.log(`📸 ${title.substring(0, 45)} → ${images.length} Bilder`);
    
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('vinted_url', url)
      .maybeSingle();
    
    if (existing) {
      await supabase.from('products').update({ images }).eq('id', existing.id);
      updated++;
    } else {
      await supabase.from('products').insert({
        name: title,
        price: price + '€',
        brand, size, condition,
        vinted_url: url,
        images
      });
      imported++;
    }
    
    await new Promise(r => setTimeout(r, 30));
  }
  
  console.log(`\n🎉 ${imported} neu, ${updated} aktualisiert`);
}

fixAndImport();
