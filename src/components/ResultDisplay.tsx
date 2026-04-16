'use client';

export function ResultDisplay({ result }: { result: any }) {
  return (
    <div className="mt-4 p-4 bg-gray-800 rounded">
      <pre className="text-xs text-gray-300 whitespace-pre-wrap">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
