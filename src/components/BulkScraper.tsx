'use client';

import { useState } from 'react';

export default function BulkScraper() {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScrape = async () => {
    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
    
    if (urlList.length === 0) {
      setError('Bitte mindestens eine URL eingeben');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/vinted-bulk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          profileUrl: urlList[0],
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Server Fehler: ${response.status}`);
      }

      setResults(data.data);

    } catch (err: any) {
      console.error('Scrape error:', err);
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const urlCount = urls.split('\n').filter(u => u.trim()).length;

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>Vinted Bulk Scraper (Browsable)</h1>
      
      {error && (
        <div style={{ 
          padding: 10, 
          background: '#f8d7da', 
          color: '#721c24',
          marginBottom: 10,
          borderRadius: 4 
        }}>
          ❌ {error}
        </div>
      )}

      <textarea
        value={urls}
        onChange={(e) => {
          setUrls(e.target.value);
          setError('');
        }}
        placeholder="Vinted Profil URL eingeben...&#10;z.B.: https://www.vinted.de/member/3138250645-scndunit"
        rows={3}
        style={{ 
          width: '100%', 
          padding: 10, 
          marginBottom: 10,
          fontFamily: 'inherit'
        }}
      />
      
      <button 
        onClick={handleScrape}
        disabled={loading || urlCount === 0}
        style={{ 
          padding: '10px 20px', 
          background: loading ? '#ccc' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 16
        }}
      >
        {loading ? '⏳ Scraping...' : `🔍 Scrapen starten (${urlCount})`}
      </button>

      {results && (
        <div style={{ marginTop: 20 }}>
          <h2>Ergebnisse:</h2>
          {Object.entries(results).map(([url, result]: [string, any]) => (
            <div 
              key={url} 
              style={{ 
                margin: '10px 0', 
                padding: 15, 
                background: result?.success ? '#d4edda' : '#f8d7da',
                borderRadius: 4,
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: 5, wordBreak: 'break-all' }}>
                {url}
              </div>
              
              {result?.success ? (
                <div>
                  <span style={{ color: '#155724' }}>
                    ✅ {result.count || 0} Items gefunden {result.source && `(via ${result.source})`}
                  </span>
                  
                  {result.items && result.items.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      {result.items.slice(0, 5).map((item: any, idx: number) => (
                        <div 
                          key={idx} 
                          style={{ 
                            padding: 8, 
                            margin: '5px 0',
                            background: 'white',
                            borderRadius: 4,
                            fontSize: 14
                          }}
                        >
                          <div style={{ fontWeight: 'bold' }}>
                            {item?.title || 'Unbekannt'}
                          </div>
                          <div style={{ color: '#666' }}>
                            {item?.price || 'Preis unbekannt'}
                          </div>
                        </div>
                      ))}
                      {result.items.length > 5 && (
                        <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
                          ... und {result.items.length - 5} weitere
                        </div>
                      )}
                    </div>
                  )}
                  
                  {result.items && result.items.length === 0 && (
                    <div style={{ marginTop: 5, color: '#856404' }}>
                      ⚠️ Keine Items gefunden
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: '#721c24' }}>
                  ❌ Fehler: {result?.error || 'Unbekannter Fehler'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
