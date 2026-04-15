'use client';

export function ResultDisplay({ result }: { result: any }) {
  return (
    <div className="border border-[#FF4400]/20 bg-[#0A0A0A] p-4 space-y-4 mt-2 rounded">
      {result.message && <p className="text-sm text-gray-300 font-medium">{result.message}</p>}
      {result.summary && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <div className="border border-gray-700 p-2 text-center">
            <div className="text-xl font-bold text-blue-400">{result.summary.total || 0}</div>
            <div className="text-xs text-gray-500 uppercase">Geprüft</div>
          </div>
          <div className="border border-green-500/30 p-2 text-center">
            <div className="text-xl font-bold text-green-400">{result.summary.imported || 0}</div>
            <div className="text-xs text-gray-500 uppercase">Importiert</div>
          </div>
          <div className="border border-yellow-500/30 p-2 text-center">
            <div className="text-xl font-bold text-yellow-400">{result.summary.duplicates || 0}</div>
            <div className="text-xs text-gray-500 uppercase">Duplikate</div>
          </div>
          <div className="border border-orange-500/30 p-2 text-center">
            <div className="text-xl font-bold text-orange-400">{result.summary.invalid || 0}</div>
            <div className="text-xs text-gray-500 uppercase">Ungültig</div>
          </div>
          <div className="border border-red-500/30 p-2 text-center">
            <div className="text-xl font-bold text-red-400">{result.summary.failed || 0}</div>
            <div className="text-xs text-gray-500 uppercase">Fehler</div>
          </div>
        </div>
      )}
      {result.soldItems?.length > 0 && (
        <div>
          <h4 className="text-xs uppercase font-bold text-red-400 mb-2">Verkaufte Items ({result.soldItems.length})</h4>
          <div className="bg-red-950/20 border border-red-500/20 p-3 max-h-48 overflow-y-auto space-y-2">
            {result.soldItems.map((item: any, i: number) => (
              <div key={i} className="text-xs border-b border-red-500/10 pb-1">
                <p className="text-gray-300 font-medium">{item.name || 'Unbekannt'}</p>
                <a href={item.url} target="_blank" className="text-gray-600 hover:text-[#FF4400] truncate block">{item.url}</a>
              </div>
            ))}
          </div>
        </div>
      )}
      <details>
        <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-400 uppercase">Rohdaten</summary>
        <pre className="mt-2 bg-black p-3 text-xs text-gray-500 overflow-x-auto max-h-48">{JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  );
}
