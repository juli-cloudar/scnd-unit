'use client';

import { useState } from 'react';

interface ScrapeResult {
  success: boolean;
  items?: any[];
  count?: number;
  error?: string;
  hasMore?: boolean;
}

export default function BulkScraper() {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState<Record<string, ScrapeResult> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScrape = async () => {
    // ✅ URLs bereinigen (Leerzeichen entfernen)
    const urlList = urls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (urlList.length === 0) {
      alert('Bitte URLs eingeben');
      return;
    }

    if (urlList.length > 5) {
      alert('Maximal 5 URLs erlaubt');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/vinted-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResults(data.data);
    } catch (error: any) {
      console.error('Fehler:', error);
      alert('Fehler: ' + error.message);
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
        placeholder="Maximal 5 URLs (eine pro Zeile)&#10;z.B.: https://www.vinted.de/member/3138250645-scndunit"
        rows={5}
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
        {loading ? 'Scraping...' : `Scrapen starten (${urls.split('\n').filter(u => u.trim()).length} URLs)`}
      </button>

      {results && (
        <div style={{ marginTop: '20px' }}>
          <h2>Ergebnisse:</h2>
          {Object.entries(results).map(([url, result]: [string, any]) => (
            <div key={url} style={{ 
              margin: '10px 0', 
              padding: '10px', 
              background: result.success ? '#d4edda' : '#f8d7da',
              borderRadius: '5px'
            }}>
              <strong>{url}</strong><br/>
              {result.success ? (
                <span>
                  ✅ {result.count} Items gefunden 
                  {result.hasMore && ' (mehr verfügbar)'}
                </span>
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
