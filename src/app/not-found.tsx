import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <span className="text-6xl font-bold tracking-tighter">
            <span className="text-[#FF4400]">SCND</span>_UNIT
          </span>
        </div>
        
        <div className="bg-[#1A1A1A] border border-[#FF4400]/30 p-8 rounded-sm">
          <div className="text-8xl font-bold text-[#FF4400]/20 mb-4">404</div>
          
          <h2 className="text-xl font-bold uppercase tracking-widest mb-4">
            Seite nicht gefunden
          </h2>
          
          <p className="text-gray-400 text-sm mb-6">
            Die angeforderte Ressource existiert nicht.
          </p>

          <Link
            href="/"
            className="inline-block w-full py-3 bg-[#FF4400] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 transition-colors"
          >
            Zurück zur Startseite
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-600 uppercase tracking-widest">
          localhost:3000 • 404 Not Found
        </p>
      </div>
    </div>
  )
}
