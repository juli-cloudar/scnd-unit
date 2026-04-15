'use client';

import { ToastItem } from '../hooks/useToast';

export function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[], onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map(toast => (
        <div key={toast.id} className={`flex items-center gap-3 px-5 py-4 min-w-[280px] max-w-[400px] border font-mono text-sm uppercase tracking-wide shadow-lg
          ${toast.type === 'success' ? 'bg-[#0A0A0A] border-[#FF4400] text-[#F5F5F5]' : ''}
          ${toast.type === 'error'   ? 'bg-[#0A0A0A] border-red-500 text-red-400' : ''}
          ${toast.type === 'info'    ? 'bg-[#0A0A0A] border-gray-600 text-gray-300' : ''}
        `}>
          <div className={`w-1 h-8 shrink-0 
            ${toast.type === 'success' ? 'bg-[#FF4400]' : ''}
            ${toast.type === 'error'   ? 'bg-red-500' : ''}
            ${toast.type === 'info'    ? 'bg-gray-500' : ''}
          `}/>
          <span className="text-base shrink-0">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error'   && '✗'}
            {toast.type === 'info'    && '·'}
          </span>
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="text-gray-600 hover:text-white ml-2 shrink-0">×</button>
        </div>
      ))}
    </div>
  );
}
