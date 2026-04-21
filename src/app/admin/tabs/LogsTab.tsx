import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Clock, RefreshCw, Download, Trash2 } from "lucide-react";
import { ToastType } from "../hooks/useToast";

interface ActivityLog {
  id: number; employee_id: number; username: string; action: string; details: string; timestamp: string;
}

export function LogsTab({ toast, confirm }: { toast: (msg: string, type?: ToastType) => void, confirm: (msg: string, onConfirm: () => void) => void }) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState('Alle');
  const [autoDeleteDays, setAutoDeleteDays] = useState(3);

  const loadLogs = useCallback(async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - autoDeleteDays);
    await supabase.from('activity_logs').delete().lt('timestamp', cutoff.toISOString());
    const { data } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(500);
    if (data) setLogs(data);
  }, [autoDeleteDays]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // Farben für verschiedene Aktionen (nur die, die noch vorkommen können)
  const actionColors: Record<string, string> = {
    'Eingeloggt': 'border-green-500 text-green-400',
    'Ausgeloggt': 'border-gray-500 text-gray-400',
    'Produkt hinzugefügt': 'border-[#FF4400] text-[#FF4400]',
    'Produkt bearbeitet': 'border-blue-500 text-blue-400',
    'Produkt gelöscht': 'border-red-500 text-red-400',
    'Produkt verkauft': 'border-yellow-400 text-yellow-400',
  };
  
  // Dynamisch die Aktionen aus den vorhandenen Logs ermitteln
  const availableActions = ['Alle', ...new Set(logs.map(l => l.action))];
  const filteredLogs = filter === 'Alle' ? logs : logs.filter(l => l.action === filter);

  return (
    <div className="bg-[#111] border border-purple-500/30 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
          <Clock className="w-5 h-5"/> Aktivitäts-Logs <span className="text-gray-500 text-sm font-normal">({filteredLogs.length} Einträge)</span>
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={loadLogs} className="p-2 border border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
            <RefreshCw className="w-4 h-4"/>
          </button>
          <button onClick={() => {
            const csv = ['Zeitpunkt,Mitarbeiter,Aktion,Details',
              ...filteredLogs.map(l => `"${new Date(l.timestamp).toLocaleString('de-DE')}","${l.username}","${l.action}","${l.details}"`)
            ].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast('Logs heruntergeladen');
          }} className="px-3 py-2 border border-green-500/30 text-green-400 hover:bg-green-500/10 text-xs uppercase font-bold flex items-center gap-1">
            <Download className="w-3 h-3"/> CSV
          </button>
          <button onClick={() => confirm('Alle Logs wirklich löschen?', async () => {
            const { error } = await supabase.from('activity_logs').delete().neq('id', 0);
            if (error) { toast('Fehler: ' + error.message, 'error'); return; }
            setLogs([]);
            toast('Alle Logs gelöscht', 'info');
          })} className="px-3 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs uppercase font-bold flex items-center gap-1">
            <Trash2 className="w-3 h-3"/> Leeren
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-3 bg-[#1A1A1A] border border-purple-500/20 px-4 py-3">
        <span className="text-xs uppercase text-gray-500">Auto-Löschen nach</span>
        {[1, 3, 7, 14, 30].map(days => (
          <button key={days} onClick={() => setAutoDeleteDays(days)}
            className={`px-2 py-1 text-xs font-bold uppercase ${autoDeleteDays === days ? 'bg-purple-500 text-white' : 'border border-purple-500/30 text-gray-500 hover:text-purple-400'}`}>
            {days}d
          </button>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {availableActions.map(action => (
          <button key={action} onClick={() => setFilter(action)}
            className={`px-2 py-1 text-xs uppercase font-bold transition-colors ${filter === action ? 'bg-purple-500 text-white' : 'border border-purple-500/30 text-gray-500 hover:text-purple-400'}`}>
            {action}
          </button>
        ))}
      </div>
      
      <div className="space-y-1 max-h-[calc(100vh-350px)] overflow-y-auto scrollbar-thin">
        {filteredLogs.map(log => {
          const colorClass = actionColors[log.action] || 'border-gray-600 text-gray-400';
          return (
            <div key={log.id} className={`flex items-start gap-3 p-3 bg-[#0A0A0A] border-l-2 ${colorClass.split(' ')[0]}`}>
              <div className="text-xs text-gray-600 w-36 shrink-0 pt-0.5">
                {new Date(log.timestamp).toLocaleString('de-DE')}
              </div>
              <div className={`text-xs font-bold w-24 shrink-0 pt-0.5 ${colorClass.split(' ')[1]}`}>
                {log.username}
              </div>
              <div className="text-xs flex-1">
                <span className="text-[#F5F5F5] font-bold">{log.action}</span>
                {log.details && <span className="text-gray-500 ml-2">{log.details}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
