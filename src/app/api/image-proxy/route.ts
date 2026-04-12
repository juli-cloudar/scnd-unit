// Ersetze im Scraper die Bild-Extraktion durch:

const imgMatches = [...html.matchAll(/https:\/\/images\d*\.vinted\.net\/[^"'\s<>]+/g)];
const seen = new Set<string>();
const imagePromises = [];

for (const m of imgMatches) {
  let fullUrl = m[0];
  if (!fullUrl.includes('/f800/')) continue;
  fullUrl = fullUrl.replace(/&amp;/g, '&');
  const base = fullUrl.split('?')[0];
  if (seen.has(base)) continue;
  seen.add(base);
  
  // Bild direkt holen und als Base64 encoden
  imagePromises.push(
    fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0...',
        'Referer': 'https://www.vinted.de/',
        'Accept': 'image/webp,*/*',
      },
    })
    .then(r => r.arrayBuffer())
    .then(buf => {
      const base64 = Buffer.from(buf).toString('base64');
      return `data:image/webp;base64,${base64}`;
    })
    .catch(() => null)
  );
}

const images = (await Promise.all(imagePromises)).filter(Boolean).slice(0, 5);
