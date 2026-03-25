'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <span className="text-6xl font-bold tracking-tighter">
              <span className="text-[#FF4400]">SCND</span>_UNIT
            </span>
          </div>
          
          <div className="bg-[#1A1A1A] border border-[#FF4400]/30 p-8 rounded-sm">
            <h2 className="text-xl font-bold uppercase tracking-widest mb-4 text-[#FF4400]">
              Systemfehler
            </h2>
            
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Ein unerwarteter Fehler ist aufgetreten. 
              Die Anwendung wird neu gestartet.
            </p>

            {error.message && (
              <div className="bg-[#0A0A0A] border border-red-500/30 p-4 mb-6 text-left">
                <p className="text-xs text-red-400 uppercase tracking-widest mb-2">Fehlerdetails</p>
                <code className="text-xs text-gray-500 break-all font-mono">
                  {error.message.slice(0, 200)}
                </code>
              </div>
            )}

            <button
              onClick={reset}
              className="w-full py-3 bg-[#FF4400] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 transition-colors"
            >
              Neu laden
            </button>
          </div>

          <p className="mt-6 text-xs text-gray-600 uppercase tracking-widest">
            localhost:3000 • Development Mode
          </p>
        </div>
      </body>
    </html>
  )
}
