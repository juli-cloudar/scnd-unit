'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
  closeConfirm: () => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);

  const confirm = (options: ConfirmOptions) => {
    setConfirmOptions(options);
  };

  const closeConfirm = () => {
    setConfirmOptions(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm, closeConfirm }}>
      {children}
      {confirmOptions && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] border border-[#FF4400]/30 p-6 max-w-md w-full mx-4 rounded-sm">
            <h3 className="text-lg font-bold mb-2">{confirmOptions.title || 'Bestätigung'}</h3>
            <p className="text-gray-400 mb-6">{confirmOptions.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  confirmOptions.onConfirm();
                  closeConfirm();
                }}
                className="flex-1 py-2 bg-[#FF4400] text-white text-sm uppercase tracking-widest hover:bg-[#FF4400]/80"
              >
                Ja
              </button>
              <button
                onClick={() => {
                  confirmOptions.onCancel?.();
                  closeConfirm();
                }}
                className="flex-1 py-2 border border-gray-600 text-gray-400 text-sm uppercase tracking-widest hover:bg-gray-800"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context;
};
