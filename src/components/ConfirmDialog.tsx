'use client';

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((res) => {
      setResolve(() => res);
    });
  }, []);

  const handleConfirm = () => {
    resolve?.(true);
    setIsOpen(false);
    setOptions(null);
  };

  const handleCancel = () => {
    resolve?.(false);
    setIsOpen(false);
    setOptions(null);
  };

  const getColors = () => {
    switch (options?.type) {
      case 'danger': return 'border-red-500/30 bg-red-950/20 text-red-400';
      case 'warning': return 'border-yellow-500/30 bg-yellow-950/20 text-yellow-400';
      default: return 'border-[#FF4400]/30 bg-[#FF4400]/10 text-[#FF4400]';
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      {isOpen && options && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0A0A0A] border border-[#FF4400]/30 max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#FF4400]/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-5 h-5 ${options.type === 'danger' ? 'text-red-500' : 'text-[#FF4400]'}`} />
                <span className="text-sm font-bold uppercase tracking-widest">
                  {options.title}
                </span>
              </div>
              <button 
                onClick={handleCancel}
                className="text-gray-500 hover:text-[#FF4400] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-300 text-sm leading-relaxed mb-2">
                {options.message}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                localhost:3000 • Bestätigung erforderlich
              </p>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-[#FF4400]/20 bg-[#111]">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 border border-gray-700 text-gray-300 text-xs font-bold uppercase tracking-widest hover:border-[#FF4400]/50 hover:text-[#FF4400] transition-colors"
              >
                {options.cancelText || 'Abbrechen'}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 py-3 text-white text-xs font-bold uppercase tracking-widest transition-colors ${
                  options.type === 'danger' 
                    ? 'bg-red-600 hover:bg-red-500' 
                    : 'bg-[#FF4400] hover:bg-[#FF4400]/80'
                }`}
              >
                {options.confirmText || 'Bestätigen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context.confirm;
}
