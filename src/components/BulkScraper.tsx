'use client';

import { useState } from 'react';

export default function BulkScraper() {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScrape = async () => {
    // URLs parsen
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
          quick: true 
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Ungültige Server-Antwort');
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Server Fehler: ${response.status}`);
      }

      // SICHERE Prüfung der Response
      if (!data || typeof data !== 'object') {
        throw new Error('Ungültige Daten vom Server');
      }

      if (!data.success) {
        throw new Error(data.error || 'Unbekannter Fehler');
      }

      // data.data kann ein Objekt oder Array sein
      const resultData = data.data || {};
      
      setResults(resultData);

    } catch (err: any) {
      console.error('Scrape error:', err);
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  // Anzahl URLs für Button
  const urlCount = urls.split('\n').filter(u => u.trim()).length;

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>Vinted Bulk Scraper</h1>
      
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
        placeholder="URL hier eingeben...&#10;z.B.: https://www.vinted.de/member/3138250645-scndunit"
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

      {/* ERGEBNISSE - mit EXTREMEN Safety-Checks */}
      {results && (
        <div style={{ marginTop: 20 }}>
          <h2>Ergebnisse:</h2>
          
          {/* Falls results ein Objekt ist */}
          {typeof results === 'object' && !Array.isArray(results) && Object.keys(results).length > 0 ? (
            Object.entries(results).map(([url, result]: [string, any]) => {
              // EXTREME Safety für jedes Result
              const isSuccess = result && result.success === true;
              const itemCount = result && typeof result.count === 'number' ? result.count : 0;
              const errorMsg = result && typeof result.error === 'string' ? result.error : 'Unbekannter Fehler';
              
              return (
                <div 
                  key={url} 
                  style={{ 
                    margin: '10px 0', 
                    padding: 15, 
                    background: isSuccess ? '#d4edda' : '#f8d7da',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: isSuccess ? '#c3e6cb' : '#f5c6cb'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: 5, wordBreak: 'break-all' }}>
                    {url}
                  </div>
                  
                  {isSuccess ? (
                    <div>
                      <span style={{ color: '#155724' }}>
                        ✅ {itemCount} Items gefunden
                      </span>
                      
                      {/* Items Liste */}
                      {result.items && Array.isArray(result.items) && result.items.length > 0 && (
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
                    </div>
                  ) : (
                    <div style={{ color: '#721c24' }}>
                      ❌ Fehler: {errorMsg}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ padding: 10, background: '#fff3cd', borderRadius: 4 }}>
              ⚠️ Keine Ergebnisse vorhanden oder ungültiges Format
            </div>
          )}
        </div>
      )}
    </div>
  );
}
