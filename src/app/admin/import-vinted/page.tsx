// app/admin/import-vinted/page.tsx
'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ImportVintedPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const supabase = createClientComponentClient();

  const handleImport = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // Lade die JSON-Datei aus dem public-Ordner
      const response = await fetch('/vinted-items.json');
      if (!response.ok) throw new Error('Keine vinted-items.json Datei gefunden. Bitte zuerst mit der Extension exportieren.');
      
      const items = await response.json();
      
      let success = 0;
      let failed = 0;
      const errors: string[] = [];
      
      // Importiere jeden Artikel in Supabase
      for (const item of items) {
        // Extrahiere die erste Foto-URL
        const photoUrl = item.photo || (item.photos && item.photos[0]) || '';
        
        const { error } = await supabase
          .from('products')
          .upsert({
            id: item.id, // Vinted ID als eigene ID verwenden
            name: item.title,
            price: item.price,
            size: item.size || '',
            condition: item.status || item.condition || 'Gut',
            images: [photoUrl],
            vinted_url: item.url,
            category: item.brand || 'Vintage',
            sold: false,
          }, { onConflict: 'id' });
        
        if (error) {
          failed++;
          errors.push(`${item.title}: ${error.message}`);
        } else {
          success++;
        }
      }
      
      setResult({ success, failed, errors });
    } catch (error: any) {
      setResult({ success: 0, failed: 0, errors: [error.message] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Vinted Import</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-2">📋 So funktioniert's:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Öffne Chrome und gehe zu <code className="bg-gray-100 px-1">https://www.vinted.de/member/3138250645-scndunit</code></li>
          <li>Klicke auf die "Vinted Scraper - One-Click Data Export" Extension</li>
          <li>Wähle "Export" → Format: <strong>JSON</strong></li>
          <li>Die Datei landet automatisch im <code className="bg-gray-100 px-1">/public</code> Ordner</li>
          <li>Klicke unten auf <strong>"Jetzt importieren"</strong></li>
        </ol>
      </div>
      
      <button
        onClick={handleImport}
        disabled={loading}
        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
      >
        {loading ? 'Importiere...' : '📥 Jetzt importieren'}
      </button>
      
      {result && (
        <div className="mt-6 p-4 rounded-lg bg-gray-100">
          <h3 className="font-semibold mb-2">Ergebnis:</h3>
          <p>✅ Erfolgreich: {result.success}</p>
          <p>❌ Fehlgeschlagen: {result.failed}</p>
          {result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-red-600">Fehler anzeigen ({result.errors.length})</summary>
              <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto max-h-60">
                {result.errors.join('\n')}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
