// app/admin/vinted/page.tsx oder src/app/admin/vinted/page.tsx
'use client';

import { useState } from 'react';

export default function VintedAdminPage() {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRemove, setAutoRemove] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════════
  // FUNKTIONEN
  // ═══════════════════════════════════════════════════════════════════════════════

  // Einzelnes Item scrapen
  async function scrapeSingle() {
    if (!url) {
      setError('Bitte URL eingeben');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/scrape-vinted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mode: 'single', 
          url,
          autoRemove 
        }),
      });

      const data = await res.json();
      setResult(data);

      if (data.status === 'sold') {
        setError(`⚠️ VERKAUFT: ${data.name || 'Unbekanntes Item'}`);
      }
    } catch (e) {
      setError('Fehler beim Scrapen: ' + String(e));
    } finally {
      setLoading(false);
    }
  }

  // Bulk Scrape - ganzer Account
  async function scrapeBulk() {
    if (!username) {
      setError('Bitte Username eingeben');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/scrape-vinted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mode: 'bulk', 
          username,
          autoRemove 
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError('Fehler beim Bulk-Scrapen: ' + String(e));
    } finally {
      setLoading(false);
    }
  }

  // Status aller Items prüfen
  async function checkAllStatus() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/scrape-vinted?mode=status-check&autoRemove=${autoRemove}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError('Fehler beim Status-Check: ' + String(e));
    } finally {
      setLoading(false);
    }
  }

  // Schnell-Check (nur URLs holen)
  async function quickCheck() {
    if (!username) {
      setError('Bitte Username eingeben');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/scrape-vinted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mode: 'bulk', 
          username,
          quick: true 
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError('Fehler: ' + String(e));
    } finally {
      setLoading(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">🛍️ Vinted Admin</h1>

        {/* Auto-Remove Toggle */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRemove}
              onChange={(e) => setAutoRemove(e.target.checked)}
              className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
            />
            <span className="text-gray-700 font-medium">
              Auto-Remove: Verkaufte Items automatisch entfernen
            </span>
          </label>
          {autoRemove && (
            <p className="text-red-500 text-sm mt-2">
              ⚠️ Achtung: Verkaufte Items werden sofort gelöscht!
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* ═══ EINZELNES ITEM ═══ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">Einzelnes Item</h2>
            
            <input
              type="text"
              placeholder="Vinted URL einfügen..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
            />
            
            <button
              onClick={scrapeSingle}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? '⏳ Scrapen...' : '🔍 Item scrapen'}
            </button>
          </div>

          {/* ═══ BULK SCRAPE ═══ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-600">Ganzer Account</h2>
            
            <input
              type="text"
              placeholder="Vinted Username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-green-500"
            />
            
            <div className="space-y-2">
              <button
                onClick={scrapeBulk}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? '⏳ Scrapen...' : '📦 Alle Items scrapen'}
              </button>
              
              <button
                onClick={quickCheck}
                disabled={loading}
                className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
              >
                ⚡ Nur URLs checken (schnell)
              </button>
            </div>
          </div>

          {/* ═══ STATUS CHECK ═══ */}
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-purple-600">Status Überwachung</h2>
            <p className="text-gray-600 mb-4">
              Prüft alle gespeicherten Items auf Verfügbarkeit. Verkaufte Items werden markiert oder entfernt.
            </p>
            
            <button
              onClick={checkAllStatus}
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? '⏳ Prüfe Status...' : '🔄 Alle Items checken'}
            </button>
          </div>
        </div>

        {/* ═══ FEHLER ═══ */}
        {error && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* ═══ ERGEBNIS ═══ */}
        {result && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Ergebnis</h3>
            
            {/* Zusammenfassung */}
            {result.summary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.summary.total}</div>
                  <div className="text-xs text-gray-600">Gesamt</div>
                </div>
                <div className="bg-green-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-green-600">{result.summary.available}</div>
                  <div className="text-xs text-gray-600">Verfügbar</div>
                </div>
                <div className="bg-red-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-red-600">{result.summary.sold}</div>
                  <div className="text-xs text-gray-600">Verkauft</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-yellow-600">{result.summary.reserved}</div>
                  <div className="text-xs text-gray-600">Reserviert</div>
                </div>
                <div className="bg-gray-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-gray-600">{result.summary.errors}</div>
                  <div className="text-xs text-gray-600">Fehler</div>
                </div>
              </div>
            )}

            {/* Status Badges */}
            <div className="flex gap-2 mb-4">
              {result.status && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  result.status === 'available' ? 'bg-green-100 text-green-800' :
                  result.status === 'sold' ? 'bg-red-100 text-red-800' :
                  result.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  Status: {result.status}
                </span>
              )}
              {result.action && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  result.action === 'removed' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  Aktion: {result.action}
                </span>
              )}
            </div>

            {/* Nachricht */}
            {result.message && (
              <p className="text-gray-700 mb-4 font-medium">{result.message}</p>
            )}
            {result.warning && (
              <p className="text-yellow-600 mb-4 font-medium">{result.warning}</p>
            )}

            {/* Item Details */}
            {result.name && (
              <div className="border rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-lg">{result.name}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                  <p>💰 Preis: {result.price || '-'} €</p>
                  <p>📏 Größe: {result.size || '-'}</p>
                  <p>🔖 Zustand: {result.condition || '-'}</p>
                  <p>📂 Kategorie: {result.category || '-'}</p>
                </div>
                {result.images && result.images.length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto">
                    {result.images.map((img: string, i: number) => (
                      <img key={i} src={img} alt="" className="w-20 h-20 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Verkaufte Items Liste */}
            {result.soldItems && result.soldItems.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-red-600 mb-2">
                  🚨 Verkaufte/Reservierte Items ({result.soldItems.length})
                </h4>
                <div className="bg-red-50 rounded-lg p-3 max-h-60 overflow-y-auto">
                  {result.soldItems.map((item: any, i: number) => (
                    <div key={i} className="text-sm border-b border-red-200 py-2 last:border-0">
                      <p className="font-medium">{item.name || 'Unbekannt'}</p>
                      <p className="text-gray-600 text-xs">{item.url}</p>
                      <p className="text-red-600 text-xs">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* JSON Debug (optional) */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Rohdaten anzeigen
              </summary>
              <pre className="mt-2 bg-gray-100 p-4 rounded text-xs overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
