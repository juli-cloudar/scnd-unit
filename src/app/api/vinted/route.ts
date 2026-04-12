// ── GRÖSSE (VERBESSERT) ─────────────────────────────────────────────────
let size = '';

// Versuch 1: JSON-LD mit größerem Zeichenlimit
const sizeJsonMatch = html.match(/"size"[:\s]*"([^"]{1,20})"/i) ||
                     html.match(/"size_name"[:\s]*"([^"]{1,20})"/i) ||
                     html.match(/"size_title"[:\s]*"([^"]{1,20})"/i);
if (sizeJsonMatch) {
  size = sizeJsonMatch[1].trim();
}

// Versuch 2: Vinted spezifische HTML-Struktur
if (!size) {
  const sizePatterns = [
    /data-testid="item-details-size"[^>]*>([^<]{1,20})/i,
    /class="[^"]*item-details[^"]*"[^>]*>[^<]*Größe[^<]*<[^>]*>([^<]{1,20})/i,
    /Größe\s*<\/[^>]+>\s*<[^>]+>\s*([^<]{1,20})/i,
    /Größe[^<]{0,30}<[^>]+>([^<]{1,20})/i,
    /"Größe"[^:]*:[^"]*"([^"]{1,20})"/i,
  ];
  for (const pattern of sizePatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      size = match[1].trim().replace(/[·\/\-]/g, '').trim();
      if (size.length > 0 && size.length < 20) break;
    }
  }
}

// Versuch 3: Breite Suche nach Größe + Wert (auch XXL, 38, 40 usw.)
if (!size) {
  const broadMatch = html.match(/(?:Größe|Grösse|Size)[^\w]{0,10}(XXS|XS|S|M|L|XL|XXL|XXXL|4XL|5XL|One Size|Einheitsgröße|UNI|\d{2,3})/i);
  if (broadMatch) {
    size = broadMatch[1].trim();
  }
}

// Versuch 4: Numerische Größen (z.B. 38, 40, 42)
if (!size) {
  const numericMatch = html.match(/(?:Größe|Size)[^\d]{0,15}(\d{2,3})\b/i);
  if (numericMatch) {
    size = numericMatch[1];
  }
}

// ── ZUSTAND (VERBESSERT) ────────────────────────────────────────────────
const condMap: Record<string, string> = {
  'neu mit etikett': 'Neu mit Etikett',
  'neu ohne etikett': 'Neu ohne Etikett',
  'sehr gut': 'Sehr gut',
  'zufriedenstellend': 'Zufriedenstellend',
  'schlecht': 'Schlecht',
  'gut': 'Gut',
  'neu': 'Neu',
};

let condition = '';

// Versuch 1: Direkte HTML-Tags (zuverlässigste Methode)
const directMatch = html.match(/>(Neu mit Etikett|Neu ohne Etikett|Sehr gut|Zufriedenstellend|Schlecht|Gut|Neu)</i);
if (directMatch) {
  condition = directMatch[1];
}

// Versuch 2: JSON-LD Zustand
if (!condition) {
  const condJsonMatch = html.match(/"condition"[:\s]*"([^"]+)"/i) ||
                       html.match(/"item_condition"[:\s]*"([^"]+)"/i);
  if (condJsonMatch) {
    const raw = condJsonMatch[1].toLowerCase();
    for (const [key, val] of Object.entries(condMap)) {
      if (raw.includes(key)) { condition = val; break; }
    }
  }
}

// Versuch 3: Kontext-Suche (Zustand steht neben dem Wort "Zustand")
if (!condition) {
  const contextMatch = html.match(/Zustand[^<]{0,50}(Neu mit Etikett|Neu ohne Etikett|Sehr gut|Zufriedenstellend|Schlecht|Gut|Neu)/i);
  if (contextMatch) {
    condition = contextMatch[1];
  }
}

// Versuch 4: Breite Suche (Fallback)
if (!condition) {
  const htmlLower = html.toLowerCase();
  // Längere Phrasen zuerst um Fehlmatches zu vermeiden
  const order = ['neu mit etikett', 'neu ohne etikett', 'sehr gut', 'zufriedenstellend', 'schlecht', 'gut'];
  for (const key of order) {
    // Word boundary check - nicht in Wörtern wie "neugierig" oder "gutaussehend"
    const pattern = new RegExp(`[>\\s"']${key}[<\\s"'·]`, 'i');
    if (pattern.test(htmlLower)) {
      condition = condMap[key];
      break;
    }
  }
}
