import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { UserPlus, Key, Trash2 } from "lucide-react";
import { logActivity } from "../utils/helpers";
import { ToastType } from "../hooks/useToast";

interface Employee {
  id: number; username: string; password: string; role: string;
  login_count: number; online: boolean; last_login?: string;
  permissions: { canAddProducts: boolean; canEditProducts: boolean; canDeleteProducts: boolean; canViewStats: boolean; canManageEmployees: boolean; };
}

export function EmployeesTab({ currentUser, toast, confirm }: { currentUser: Employee, toast: (msg: string, type?: ToastType) => void, confirm: (msg: string, onConfirm: () => void) => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newEmployee, setNewEmployee] = useState({ username: '', password: '', role: 'Mitarbeiter' as const, permissions: { canAddProducts: false, canEditProducts: false, canDeleteProducts: false, canViewStats: false, canManageEmployees: false } });

  useEffect(() => { const loadEmployees = async () => { const { data } = await supabase.from('employees').select('*').order('id'); if (data) setEmployees(data); }; loadEmployees(); }, []);

  const handleAddEmployee = () => { if (!newEmployee.username || !newEmployee.password) { toast('Username und Passwort sind Pflicht!', 'error'); return; } setIsAdding(true); supabase.from('employees').insert({ username: newEmployee.username, password: newEmployee.password, role: newEmployee.role, permissions: newEmployee.permissions, login_count: 0, total_work_hours: 0, online: false }).then(({ error }) => { if (error) { toast('Fehler: ' + error.message, 'error'); } else { toast('Mitarbeiter erstellt!'); logActivity(currentUser.id, currentUser.username, 'Mitarbeiter erstellt', `"${newEmployee.username}"`); setNewEmployee({ username: '', password: '', role: 'Mitarbeiter', permissions: { canAddProducts: false, canEditProducts: false, canDeleteProducts: false, canViewStats: false, canManageEmployees: false } }); const loadEmployees = async () => { const { data } = await supabase.from('employees').select('*').order('id'); if (data) setEmployees(data); }; loadEmployees(); } setIsAdding(false); }); };

  return (
    <div className="space-y-6">
      <div className="bg-[#111] border border-yellow-400/30 p-6">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5"/> Neuer Mitarbeiter</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input placeholder="Username" value={newEmployee.username} onChange={e => setNewEmployee({...newEmployee, username: e.target.value})} className="bg-[#1A1A1A] border border-yellow-400/30 px-4 py-3 text-sm"/>
          <input placeholder="Passwort" type="password" value={newEmployee.password} onChange={e => setNewEmployee({...newEmployee, password: e.target.value})} className="bg-[#1A1A1A] border border-yellow-400/30 px-4 py-3 text-sm"/>
          <select value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value as any})} className="bg-[#1A1A1A] border border-yellow-400/30 px-4 py-3 text-sm"><option>Mitarbeiter</option><option>Manager</option></select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">{Object.entries(newEmployee.permissions).map(([key, value]) => (<label key={key} className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={value} onChange={e => setNewEmployee({...newEmployee, permissions: {...newEmployee.permissions, [key]: e.target.checked}})} className="accent-yellow-400"/><span className="text-gray-400">{key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}</span></label>))}</div>
        <button onClick={handleAddEmployee} disabled={isAdding} className="px-6 py-3 bg-yellow-400 text-black font-bold uppercase text-xs disabled:opacity-50">{isAdding ? 'Wird erstellt...' : 'Hinzufügen'}</button>
      </div>
      {editingEmployee && (
        <div className="bg-[#111] border border-blue-500/30 p-6">
          <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2"><Key className="w-5 h-5"/> Passwort ändern für {editingEmployee.username}</h3>
          <div className="flex gap-2">
            <input type="password" placeholder="Neues Passwort" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="flex-1 bg-[#1A1A1A] border border-blue-500/30 px-4 py-3 text-sm"/>
            <button onClick={() => { if (!newPassword) { toast('Bitte neues Passwort eingeben', 'error'); return; } supabase.from('employees').update({ password: newPassword }).eq('id', editingEmployee.id).then(() => { toast('Passwort geändert'); logActivity(currentUser.id, currentUser.username, 'Passwort geändert', `für "${editingEmployee.username}"`); setNewPassword(''); setEditingEmployee(null); const loadEmployees = async () => { const { data } = await supabase.from('employees').select('*').order('id'); if (data) setEmployees(data); }; loadEmployees(); }); }} className="px-6 py-3 bg-blue-500 text-white font-bold uppercase text-xs">Speichern</button>
            <button onClick={() => { setEditingEmployee(null); setNewPassword(''); }} className="px-6 py-3 border border-gray-600 text-gray-400 uppercase text-xs">Abbrechen</button>
          </div>
        </div>
      )}
      <div className="bg-[#111] border border-[#FF4400]/20 overflow-hidden">
        <div className="max-h-[calc(100vh-350px)] overflow-y-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-[#FF4400] text-white sticky top-0">
              <tr><th className="px-4 py-3 text-left">Username</th><th className="px-4 py-3 text-left">Rolle</th><th className="px-4 py-3 text-left">Logins</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Letzter Login</th><th className="px-4 py-3 text-left">Aktionen</th></tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className="border-t border-[#FF4400]/10">
                  <td className="px-4 py-3 font-bold">{emp.username}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-xs ${emp.role === 'Manager' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-600/20 text-gray-400'}`}>{emp.role}</span></td>
                  <td className="px-4 py-3">{emp.login_count}×</td>
                  <td className="px-4 py-3"><span className={`flex items-center gap-1 ${emp.online ? 'text-green-500' : 'text-gray-500'}`}><div className={`w-2 h-2 rounded-full ${emp.online ? 'bg-green-500' : 'bg-gray-500'}`}/>{emp.online ? 'Online' : 'Offline'}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{emp.last_login ? new Date(emp.last_login).toLocaleString('de-DE') : 'Nie'}</td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => setEditingEmployee(emp)} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs"><Key className="w-3 h-3"/></button><button onClick={() => confirm(`${emp.username} wirklich löschen?`, () => { supabase.from('employees').delete().eq('id', emp.id).then(() => { toast('Mitarbeiter gelöscht', 'info'); logActivity(currentUser.id, currentUser.username, 'Mitarbeiter gelöscht', `"${emp.username}"`); const loadEmployees = async () => { const { data } = await supabase.from('employees').select('*').order('id'); if (data) setEmployees(data); }; loadEmployees(); }); })} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs"><Trash2 className="w-3 h-3"/></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
