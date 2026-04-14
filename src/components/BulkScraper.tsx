'use client';

import { useState } from 'react';

export default function BulkScraper() {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleScrape = async () => {
    // Einfache Berechnung ohne useMemo
    const urlList = urls.split('\n').map(u => u.trim()).filter(u => u);
    
    if (urlList.length === 0) {
      alert('Bitte URLs eingeben');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/vinted-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profileUrl: urlList[0],
          quick: true 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setResults(data.data);
    } catch (error: any) {
      alert('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Einfache Anzeige
  const count = urls.split('\n').filter(u => u.trim()).length;

  return (
    <div style={{ padding: 20 }}>
      <h1>Vinted Bulk Scraper</h1>
      
      <textarea
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder="URLs hier eingeben..."
        rows={5}
        style={{ width: '100%', marginBottom: 10 }}
      />
      
      <button 
        onClick={handleScrape}
        disabled={loading}
      >
        {loading ? 'Scraping...' : `Start (${count} URLs)`}
      </button>

      {results && Object.entries(results).map(([url, result]: [string, any]) => (
        <div key={url} style={{ marginTop: 10, padding: 10, background: result?.success ? '#d4edda' : '#f8d7da' }}>
          <strong>{url}</strong><br/>
          {result?.success 
            ? `✅ ${result.count || 0} Items` 
            : `❌ ${result?.error || 'Fehler'}`
          }
        </div>
      ))}
    </div>
  );
}
