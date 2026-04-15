import { useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';
export interface ToastItem { id: number; message: string; type: ToastType; }

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  const addToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));
  
  return { toasts, addToast, removeToast };
}
