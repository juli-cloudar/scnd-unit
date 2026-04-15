import { useState } from 'react';

interface ConfirmOptions { message: string; onConfirm: () => void; }

export function useConfirm() {
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const showConfirm = (message: string, onConfirm: () => void) => setConfirmOptions({ message, onConfirm });
  const closeConfirm = () => setConfirmOptions(null);
  return { confirmOptions, showConfirm, closeConfirm };
}
