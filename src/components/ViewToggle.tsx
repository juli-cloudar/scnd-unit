'use client';

import { LayoutGrid, List, Minimize2 } from 'lucide-react';

export type ViewMode = 'grid' | 'list' | 'compact';

interface ViewToggleProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, setViewMode }: ViewToggleProps) {
  const viewButtonClass = (mode: ViewMode) => `
    p-2 transition-all duration-200 rounded-sm
    ${viewMode === mode 
      ? 'bg-[#FF4400] text-white' 
      : 'bg-[#1A1A1A] border border-[#FF4400]/30 text-gray-400 hover:text-[#FF4400]'
    }
  `;

  return (
    <div className="flex gap-1">
      <button onClick={() => setViewMode('grid')} className={viewButtonClass('grid')} title="Grid Ansicht">
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button onClick={() => setViewMode('list')} className={viewButtonClass('list')} title="Listen Ansicht">
        <List className="w-4 h-4" />
      </button>
      <button onClick={() => setViewMode('compact')} className={viewButtonClass('compact')} title="Kompakt Ansicht">
        <Minimize2 className="w-4 h-4" />
      </button>
    </div>
  );
}
