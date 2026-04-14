// src/components/BulkScraper.tsx
'use client';

import { useState, useMemo } from 'react';

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
  const [debugInfo, setDebugInfo] = useState<string>('');

  // ✅ urlList als useMemo (immer verfügbar)
  const urlList = useMemo(() => {
    return urls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);
  }, [urls]);

  const handleScrape = async () => {
    console.log('[DEBUG] URLs nach Bereinigung:', urlList);

    if (urlList.length === 0) {
      alert('Bitte URLs eingeben');
      return;
    }

    if (urlList.length > 3) {
      alert('Maximal 3 URLs erlaubt (Vercel Limit)');
      return;
    }

    setLoading(true);
    setDebugInfo('Sende Request...');
    setResults(null);

    try {
      const apiUrl = '/api/vinted-bulk';
      console.log('[DEBUG] API URL:', apiUrl);

      const requestBody = { urls: urlList };
      console.log('[DEBUG] Request Body:', JSON.stringify(requestBody));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[DEBUG] Response Status:', response.status);

      setDebugInfo(`Status: ${response.status}`);

      const responseText = await response.text();
      console.log('[DEBUG] Response Text:', responseText.substring(0, 500));

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText };
        }
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = JSON.parse(responseText);
      console.log('[DEBUG] Parsed Data:', data);

      setResults(data.data);
      setDebugInfo(`Erfolg: ${data.success}, ${Object.keys(data.data).length} URLs verarbeitet`);

    } catch (error: any) {
      console.error('[ERROR] Fetch fehlgeschlagen:', error);
      setDebugInfo(`Fehler: ${error.message}`);
      alert('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Vinted Bulk Scraper</h1>
      
      {debugInfo && (
        <div style={{ 
          padding: '10px', 
          background: '#f0f0f0', 
          marginBottom: '10px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <strong>Debug:</strong> {debugInfo}
        </div>
      )}

      <textarea
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder="Maximal 3 URLs (eine pro Zeile)&#10;z.B.: https://www.vinted.de/member/3138250645-scndunit"
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
        {loading ? 'Scraping...' : `Scrapen starten (${urlList.length} URLs)`}
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
