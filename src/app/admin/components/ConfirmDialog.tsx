'use client';

interface ConfirmOptions { message: string; onConfirm: () => void; }

export function ConfirmDialog({ options, onClose }: { options: ConfirmOptions, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0A0A0A] border border-[#FF4400]/50 p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-1 h-12 bg-[#FF4400] shrink-0 mt-0.5"/>
          <p className="text-sm uppercase tracking-wide text-[#F5F5F5] font-mono leading-relaxed">{options.message}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { options.onConfirm(); onClose(); }}
            className="flex-1 py-3 bg-[#FF4400] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#FF4400]/80">
            Bestätigen
          </button>
          <button onClick={onClose}
            className="flex-1 py-3 border border-gray-600 text-gray-400 text-xs font-bold uppercase tracking-widest hover:border-gray-400">
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
