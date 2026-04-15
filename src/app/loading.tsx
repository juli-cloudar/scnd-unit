export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold tracking-tighter mb-4">
          <span className="text-[#FF4400]">SCND</span>_UNIT
        </div>
        <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-gray-500">
          <div className="w-2 h-2 bg-[#FF4400] animate-pulse"></div>
          Lade...
        </div>
      </div>
    </div>
  )
}
