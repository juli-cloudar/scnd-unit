const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vkuwqpgrvwvhvcbmhldk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s'
);

async function removeEuro() {
  const { data } = await supabase.from('products').select('id, price');
  console.log(`📦 ${data?.length || 0} Produkte gefunden\n`);
  
  let updated = 0;
  for (const p of data || []) {
    const cleanPrice = p.price.replace(/€/g, '').trim();
    if (cleanPrice !== p.price) {
      const { error } = await supabase.from('products').update({ price: cleanPrice }).eq('id', p.id);
      if (!error) {
        console.log(`✅ ${p.id}: ${p.price} → ${cleanPrice}`);
        updated++;
      } else {
        console.log(`❌ ${p.id}: ${error.message}`);
      }
    }
  }
  console.log(`\n🎉 ${updated} Preise aktualisiert`);
}

removeEuro();
