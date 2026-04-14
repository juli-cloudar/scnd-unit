// src/components/BulkScraper.tsx
'use client'; // Wichtig für Client-Side Komponente

import { useState } from 'react';

interface ScrapeResult {
  success: boolean;
  items?: any[];
  count?: number;
  error?: string;
}

export default function BulkScraper() {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState<Record<string, ScrapeResult> | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Async Funktion für den Button-Click
  const handleScrape = async () => {
    const urlList = urls.split('\n').filter(u => u.trim());
    
    if (urlList.length === 0) {
      alert('Bitte URLs eingeben');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/vinted-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList }),
      });

      const data = await response.json();
      setResults(data.data);
    } catch (error) {
      console.error('Fehler:', error);
      alert('Scraping fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Vinted Bulk Scraper</h1>
      
      <textarea
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder="URLs eingeben (eine pro Zeile)&#10;z.B.: https://www.vinted.de/member/3138250645-scndunit"
        rows={10}
        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
      />
      
      <button 
        onClick={handleScrape}
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          background: loading ? '#ccc' : '#0070f3',
          color: 'white',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Scraping...' : 'Scrapen starten'}
      </button>

      {results && (
        <div style={{ marginTop: '20px' }}>
          <h2>Ergebnisse:</h2>
          {Object.entries(results).map(([url, result]) => (
            <div key={url} style={{ 
              margin: '10px 0', 
              padding: '10px', 
              background: result.success ? '#d4edda' : '#f8d7da',
              borderRadius: '5px'
            }}>
              <strong>{url}</strong><br/>
              {result.success ? (
                <span>✅ {result.count} Items gefunden</span>
              ) : (
                <span>❌ Fehler: {result.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
