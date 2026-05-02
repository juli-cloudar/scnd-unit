import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { UserPlus, Key, Trash2, Shield, Package, Plus, Globe, BarChart3, Users, Clock, Gamepad2, Share2, TrendingUp } from "lucide-react";
import { logActivity } from "../utils/helpers";
import { ToastType } from "../hooks/useToast";

interface Employee {
  id: number;
  username: string;
  password: string;
  role: string;
  login_count: number;
  online: boolean;
  last_login?: string;
  permissions: {
    canAddProducts: boolean;
    canEditProducts: boolean;
    canDeleteProducts: boolean;
    canViewStats: boolean;
    canManageEmployees: boolean;
  };
  // Tab-Berechtigungen als separate Spalten in Supabase
  can_access_inventory: boolean;
  can_access_add: boolean;
  can_access_vintedTools: boolean;
  can_access_employees: boolean;
  can_access_logs: boolean;
  can_access_game: boolean;
  can_access_multiChannel: boolean;
  can_access_analyticsMarketing: boolean;
}

// Standard-Tab-Berechtigungen für verschiedene Rollen
const getDefaultTabPermissions = (role: string) => {
  if (role === 'Admin') {
    return {
      can_access_inventory: true,
      can_access_add: true,
      can_access_vintedTools: true,
      can_access_employees: true,
      can_access_logs: true,
      can_access_game: true,
      can_access_multiChannel: true,
      can_access_analyticsMarketing: true,
    };
  } else if (role === 'Manager') {
    return {
      can_access_inventory: true,
      can_access_add: true,
      can_access_vintedTools: true,
      can_access_employees: false,
      can_access_logs: false,
      can_access_game: true,
      can_access_multiChannel: true,
      can_access_analyticsMarketing: true,
    };
  } else {
    // Mitarbeiter
    return {
      can_access_inventory: true,
      can_access_add: true,
      can_access_vintedTools: false,
      can_access_employees: false,
      can_access_logs: false,
      can_access_game: true,
      can_access_multiChannel: false,
      can_access_analyticsMarketing: false,
    };
  }
};

const TabList = [
  { key: 'inventory' as const, dbField: 'can_access_inventory', label: 'Inventar', icon: Package },
  { key: 'add' as const, dbField: 'can_access_add', label: 'Hinzufügen', icon: Plus },
  { key: 'vintedTools' as const, dbField: 'can_access_vintedTools', label: 'Vinted Tools', icon: Globe },
  { key: 'employees' as const, dbField: 'can_access_employees', label: 'Team', icon: Users },
  { key: 'logs' as const, dbField: 'can_access_logs', label: 'Logs', icon: Clock },
  { key: 'game' as const, dbField: 'can_access_game', label: 'SCND DROP', icon: Gamepad2 },
  { key: 'multiChannel' as const, dbField: 'can_access_multiChannel', label: 'Multi-Channel', icon: Share2 },
  { key: 'analyticsMarketing' as const, dbField: 'can_access_analyticsMarketing', label: 'Analytics & Marketing', icon: TrendingUp },
];

export function EmployeesTab({ currentUser, toast, confirm }: { currentUser: Employee, toast: (msg: string, type?: ToastType) => void, confirm: (msg: string, onConfirm: () => void) => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newEmployee, setNewEmployee] = useState({
    username: '',
    password: '',
    role: 'Mitarbeiter' as const,
    permissions: {
      canAddProducts: false,
      canEditProducts: false,
      canDeleteProducts: false,
      canViewStats: false,
      canManageEmployees: false,
    },
    ...getDefaultTabPermissions('Mitarbeiter')
  });

  useEffect(() => {
    const loadEmployees = async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('id');
      
      if (error) {
        console.error('Fehler beim Laden:', error);
        return;
      }
      
      if (data) {
        // Stelle sicher, dass alle Mitarbeiter die Tab-Berechtigungsfelder haben
        const employeesWithDefaults = data.map(emp => ({
          ...emp,
          can_access_inventory: emp.can_access_inventory ?? true,
          can_access_add: emp.can_access_add ?? true,
          can_access_vintedTools: emp.can_access_vintedTools ?? false,
          can_access_employees: emp.can_access_employees ?? false,
          can_access_logs: emp.can_access_logs ?? false,
          can_access_game: emp.can_access_game ?? true,
          can_access_multiChannel: emp.can_access_multiChannel ?? false,
          can_access_analyticsMarketing: emp.can_access_analyticsMarketing ?? false,
        }));
        setEmployees(employeesWithDefaults);
      }
    };
    loadEmployees();
  }, []);

  const handleAddEmployee = () => {
    if (!newEmployee.username || !newEmployee.password) {
      toast('Username und Passwort sind Pflicht!', 'error');
      return;
    }
    setIsAdding(true);
    
    const { username, password, role, permissions, ...tabPermissions } = newEmployee;
    
    supabase.from('employees').insert({
      username,
      password,
      role,
      permissions,
      ...tabPermissions,
      login_count: 0,
      total_work_hours: 0,
      online: false
    }).then(({ error }) => {
      if (error) {
        toast('Fehler: ' + error.message, 'error');
      } else {
        toast('Mitarbeiter erstellt!');
        logActivity(currentUser.id, currentUser.username, 'Mitarbeiter erstellt', `"${newEmployee.username}"`);
        setNewEmployee({
          username: '',
          password: '',
          role: 'Mitarbeiter',
          permissions: {
            canAddProducts: false,
            canEditProducts: false,
            canDeleteProducts: false,
            canViewStats: false,
            canManageEmployees: false,
          },
          ...getDefaultTabPermissions('Mitarbeiter')
        });
        const loadEmployees = async () => {
          const { data } = await supabase.from('employees').select('*').order('id');
          if (data) setEmployees(data);
        };
        loadEmployees();
      }
      setIsAdding(false);
    });
  };

  const updateTabPermissions = async (employee: Employee, tabPermissions: {
    can_access_inventory: boolean;
    can_access_add: boolean;
    can_access_vintedTools: boolean;
    can_access_employees: boolean;
    can_access_logs: boolean;
    can_access_game: boolean;
    can_access_multiChannel: boolean;
    can_access_analyticsMarketing: boolean;
  }) => {
    const { error } = await supabase
      .from('employees')
      .update(tabPermissions)
      .eq('id', employee.id);
    
    if (error) {
      toast('Fehler beim Aktualisieren der Berechtigungen', 'error');
    } else {
      toast(`Tab-Berechtigungen für ${employee.username} aktualisiert`, 'success');
      logActivity(currentUser.id, currentUser.username, 'Tab-Berechtigungen geändert', `für "${employee.username}"`);
      setEmployees(prev => prev.map(e => e.id === employee.id ? { ...e, ...tabPermissions } : e));
      setEditingPermissions(null);
    }
  };

  // Hilfsfunktion: Prüft ob ein Mitarbeiter Zugriff auf einen Tab hat
  const hasTabAccess = (employee: Employee, tabKey: string) => {
    const fieldMap: Record<string, keyof Employee> = {
      inventory: 'can_access_inventory',
      add: 'can_access_add',
      vintedTools: 'can_access_vintedTools',
      employees: 'can_access_employees',
      logs: 'can_access_logs',
      game: 'can_access_game',
      multiChannel: 'can_access_multiChannel',
      analyticsMarketing: 'can_access_analyticsMarketing',
    };
    const field = fieldMap[tabKey];
    return employee[field] === true;
  };

  return (
    <div className="space-y-6">
      {/* Neuen Mitarbeiter hinzufügen */}
      <div className="bg-[#111] border border-yellow-400/30 p-6">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5"/> Neuer Mitarbeiter</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input placeholder="Username" value={newEmployee.username} onChange={e => setNewEmployee({...newEmployee, username: e.target.value})} className="bg-[#1A1A1A] border border-yellow-400/30 px-4 py-3 text-sm"/>
          <input placeholder="Passwort" type="password" value={newEmployee.password} onChange={e => setNewEmployee({...newEmployee, password: e.target.value})} className="bg-[#1A1A1A] border border-yellow-400/30 px-4 py-3 text-sm"/>
          <select value={newEmployee.role} onChange={e => {
            const role = e.target.value as any;
            setNewEmployee({
              ...newEmployee,
              role,
              ...getDefaultTabPermissions(role)
            });
          }} className="bg-[#1A1A1A] border border-yellow-400/30 px-4 py-3 text-sm">
            <option>Mitarbeiter</option>
            <option>Manager</option>
          </select>
        </div>

        {/* Alte Berechtigungen (Aktionen) */}
        <div className="mb-4">
          <h4 className="text-xs text-yellow-400 mb-2">Berechtigungen (Aktionen)</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(newEmployee.permissions).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={value} onChange={e => setNewEmployee({...newEmployee, permissions: {...newEmployee.permissions, [key]: e.target.checked}})} className="accent-yellow-400"/>
                <span className="text-gray-400">{key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tab-Berechtigungen */}
        <div className="mb-4">
          <h4 className="text-xs text-yellow-400 mb-2">Tab-Berechtigungen (welche Tabs sieht der Mitarbeiter?)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TabList.map(tab => (
              <label key={tab.key} className="flex items-center gap-2 text-xs cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={newEmployee[tab.dbField as keyof typeof newEmployee] as boolean || false} 
                  onChange={e => setNewEmployee({
                    ...newEmployee,
                    [tab.dbField]: e.target.checked
                  })} 
                  className="accent-yellow-400"
                />
                <tab.icon className="w-3 h-3 text-gray-400"/>
                <span className="text-gray-400">{tab.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button onClick={handleAddEmployee} disabled={isAdding} className="px-6 py-3 bg-yellow-400 text-black font-bold uppercase text-xs disabled:opacity-50">
          {isAdding ? 'Wird erstellt...' : 'Hinzufügen'}
        </button>
      </div>

      {/* Passwort ändern Modal */}
      {editingEmployee && (
        <div className="bg-[#111] border border-blue-500/30 p-6">
          <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2"><Key className="w-5 h-5"/> Passwort ändern für {editingEmployee.username}</h3>
          <div className="flex gap-2">
            <input type="password" placeholder="Neues Passwort" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="flex-1 bg-[#1A1A1A] border border-blue-500/30 px-4 py-3 text-sm"/>
            <button onClick={() => {
              if (!newPassword) { toast('Bitte neues Passwort eingeben', 'error'); return; }
              supabase.from('employees').update({ password: newPassword }).eq('id', editingEmployee.id).then(() => {
                toast('Passwort geändert');
                logActivity(currentUser.id, currentUser.username, 'Passwort geändert', `für "${editingEmployee.username}"`);
                setNewPassword('');
                setEditingEmployee(null);
                const loadEmployees = async () => {
                  const { data } = await supabase.from('employees').select('*').order('id');
                  if (data) setEmployees(data);
                };
                loadEmployees();
              });
            }} className="px-6 py-3 bg-blue-500 text-white font-bold uppercase text-xs">Speichern</button>
            <button onClick={() => { setEditingEmployee(null); setNewPassword(''); }} className="px-6 py-3 border border-gray-600 text-gray-400 uppercase text-xs">Abbrechen</button>
          </div>
        </div>
      )}

      {/* Tab-Berechtigungen bearbeiten Modal */}
      {editingPermissions && (
        <div className="bg-[#111] border border-purple-500/30 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2"><Shield className="w-5 h-5"/> Tab-Berechtigungen für {editingPermissions.username}</h3>
            <button onClick={() => setEditingPermissions(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {TabList.map(tab => (
              <label key={tab.key} className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-[#1A1A1A] rounded">
                <input
                  type="checkbox"
                  checked={editingPermissions[tab.dbField as keyof Employee] as boolean || false}
                  onChange={e => setEditingPermissions({
                    ...editingPermissions,
                    [tab.dbField]: e.target.checked
                  } as Employee)}
                  className="accent-purple-400"
                />
                <tab.icon className="w-4 h-4 text-purple-400"/>
                <span>{tab.label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => {
              const updates = {
                can_access_inventory: editingPermissions.can_access_inventory,
                can_access_add: editingPermissions.can_access_add,
                can_access_vintedTools: editingPermissions.can_access_vintedTools,
                can_access_employees: editingPermissions.can_access_employees,
                can_access_logs: editingPermissions.can_access_logs,
                can_access_game: editingPermissions.can_access_game,
                can_access_multiChannel: editingPermissions.can_access_multiChannel,
                can_access_analyticsMarketing: editingPermissions.can_access_analyticsMarketing,
              };
              updateTabPermissions(editingPermissions, updates);
            }} className="px-6 py-3 bg-purple-500 text-white font-bold uppercase text-xs">Speichern</button>
            <button onClick={() => setEditingPermissions(null)} className="px-6 py-3 border border-gray-600 text-gray-400 uppercase text-xs">Abbrechen</button>
          </div>
        </div>
      )}

      {/* Mitarbeiter Liste */}
      <div className="bg-[#111] border border-[#FF4400]/20 overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FF4400] text-white sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">Rolle</th>
                <th className="px-4 py-3 text-left">Logins</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Letzter Login</th>
                <th className="px-4 py-3 text-left">Tabs</th>
                <th className="px-4 py-3 text-left">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className="border-t border-[#FF4400]/10">
                  <td className="px-4 py-3 font-bold">{emp.username}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-xs ${emp.role === 'Admin' ? 'bg-yellow-400 text-black' : emp.role === 'Manager' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-600/20 text-gray-400'}`}>{emp.role}</span></td>
                  <td className="px-4 py-3">{emp.login_count}×</td>
                  <td className="px-4 py-3"><span className={`flex items-center gap-1 ${emp.online ? 'text-green-500' : 'text-gray-500'}`}><div className={`w-2 h-2 rounded-full ${emp.online ? 'bg-green-500' : 'bg-gray-500'}`}/>{emp.online ? 'Online' : 'Offline'}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{emp.last_login ? new Date(emp.last_login).toLocaleString('de-DE') : 'Nie'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {TabList.filter(tab => emp[tab.dbField as keyof Employee] === true).slice(0, 3).map(tab => (
                        <span key={tab.key} className="text-xs text-purple-400" title={tab.label}><tab.icon className="w-3 h-3"/></span>
                      ))}
                      {TabList.filter(tab => emp[tab.dbField as keyof Employee] === true).length > 3 && (
                        <span className="text-xs text-gray-500">+{TabList.filter(tab => emp[tab.dbField as keyof Employee] === true).length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditingPermissions(emp)} className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs" title="Tab-Berechtigungen"><Shield className="w-3 h-3"/></button>
                      <button onClick={() => setEditingEmployee(emp)} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs" title="Passwort ändern"><Key className="w-3 h-3"/></button>
                      <button onClick={() => confirm(`${emp.username} wirklich löschen?`, () => {
                        supabase.from('employees').delete().eq('id', emp.id).then(() => {
                          toast('Mitarbeiter gelöscht', 'info');
                          logActivity(currentUser.id, currentUser.username, 'Mitarbeiter gelöscht', `"${emp.username}"`);
                          setEmployees(prev => prev.filter(e => e.id !== emp.id));
                        });
                      })} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs"><Trash2 className="w-3 h-3"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          <tr>
        </div>
      </div>
    </div>
  );
}
