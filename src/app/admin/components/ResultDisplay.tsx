'use client';

export function ResultDisplay({ result }: { result: any }) {
  return (
    <div className="border border-[#FF4400]/20 bg-[#0A0A0A] p-4 space-y-4 mt-2 rounded">
      {result.message && <p className="text-sm text-gray-300 font-medium">{result.message}</p>}
      {result.summary && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: 'Gesamt', value: result.summary.total, color: 'text-blue-400', border: 'border-blue-500/30' },
            { label: 'Neu', value: result.summary.available, color: 'text-green-400', border: 'border-green-500/30' },
            { label: 'Verkauft', value: result.summary.sold, color: 'text-red-400', border: 'border-red-500/30' },
            { label: 'Reserviert', value: result.summary.reserved ?? 0, color: 'text-yellow-400', border: 'border-yellow-500/30' },
            { label: 'Duplikate', value: result.summary.dupes ?? 0, color: 'text-gray-400', border: 'border-gray-600/30' },
            { label: 'Fehler', value: result.summary.errors ?? 0, color: 'text-orange-400', border: 'border-orange-600/30' },
          ].map(s => (
            <div key={s.label} className={`border ${s.border} p-2 text-center`}>
              <div className={`text-xl font-bold ${s.color}`}>{s.value ?? 0}</div>
              <div className="text-xs text-gray-500 uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      )}
      <details>
        <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-400 uppercase">Rohdaten</summary>
        <pre className="mt-2 bg-black p-3 text-xs text-gray-500 overflow-x-auto max-h-48">{JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  );
}
