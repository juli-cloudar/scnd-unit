const fs = require('fs');

// Lese die JSON-Datei
const data = JSON.parse(fs.readFileSync('./export_1776188494113.json', 'utf8'));
const firstItem = data[0];

console.log('=== Teste ersten Artikel ===');
console.log('Title:', firstItem['Item Title']);
console.log('URL:', firstItem['Item URL']);
console.log('Item Photo 1:', firstItem['Item Photo 1']);
console.log('Item Photo 2:', firstItem['Item Photo 2']);
console.log('Item Photo 3:', firstItem['Item Photo 3']);
console.log('Item Photo 4:', firstItem['Item Photo 4']);
console.log('Item Photo 5:', firstItem['Item Photo 5']);

// Prüfe alle Keys die "Photo" enthalten
const photoKeys = Object.keys(firstItem).filter(k => k.includes('Photo'));
console.log('\nAlle Photo-Keys:', photoKeys);
