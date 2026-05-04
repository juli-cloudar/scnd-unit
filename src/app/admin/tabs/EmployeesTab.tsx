import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { UserPlus, Key, Trash2, Shield, Package, Plus, Globe, BarChart3, Users, Clock, Gamepad2, Share2, TrendingUp, Wand2 } from "lucide-react";
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
  can_access_inventory: boolean;
  can_access_add: boolean;
  can_access_vintedtools: boolean;
  can_access_employees: boolean;
  can_access_logs: boolean;
  can_access_game: boolean;
  can_access_multichannel: boolean;
  can_access_analyticsmarketing: boolean;
  can_access_marketingstudio: boolean; // NEU
}

const getDefaultTabPermissions = (role: string) => {
  if (role === 'Admin') {
    return {
      can_access_inventory: true,
      can_access_add: true,
      can_access_vintedtools: true,
      can_access_employees: true,
      can_access_logs: true,
      can_access_game: true,
      can_access_multichannel: true,
      can_access_analyticsmarketing: true,
      can_access_marketingstudio: true, // NEU
    };
  } else if (role === 'Manager') {
    return {
      can_access_inventory: true,
      can_access_add: true,
      can_access_vintedtools: true,
      can_access_employees: false,
      can_access_logs: false,
      can_access_game: true,
      can_access_multichannel: true,
      can_access_analyticsmarketing: true,
      can_access_marketingstudio: true, // NEU
    };
  } else {
    return {
      can_access_inventory: true,
      can_access_add: true,
      can_access_vintedtools: false,
      can_access_employees: false,
      can_access_logs: false,
      can_access_game: true,
      can_access_multichannel: false,
      can_access_analyticsmarketing: false,
      can_access_marketingstudio: false, // NEU
    };
  }
};

const TabList = [
  { key: 'inventory', dbField: 'can_access_inventory', label: 'Inventar', icon: Package },
  { key: 'add', dbField: 'can_access_add', label: 'Hinzufügen', icon: Plus },
  { key: 'vintedTools', dbField: 'can_access_vintedtools', label: 'Vinted Tools', icon: Globe },
  { key: 'employees', dbField: 'can_access_employees', label: 'Team', icon: Users },
  { key: 'logs', dbField: 'can_access_logs', label: 'Logs', icon: Clock },
  { key: 'game', dbField: 'can_access_game', label: 'SCND DROP', icon: Gamepad2 },
  { key: 'multiChannel', dbField: 'can_access_multichannel', label: 'Multi-Channel', icon: Share2 },
  { key: 'analyticsMarketing', dbField: 'can_access_analyticsmarketing', label: 'Analytics & Marketing', icon: TrendingUp },
  { key: 'marketingStudio', dbField: 'can_access_marketingstudio', label: 'Marketing Studio', icon: Wand2 }, // NEU
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
    can_access_inventory: true,
    can_access_add: true,
    can_access_vintedtools: false,
    can_access_employees: false,
    can_access_logs: false,
    can_access_game: true,
    can_access_multichannel: false,
    can_access_analyticsmarketing: false,
    can_access_marketingstudio: false, // NEU
  });

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
      const employeesWithDefaults = data.map(emp => ({
        ...emp,
        can_access_inventory: emp.can_access_inventory ?? true,
        can_access_add: emp.can_access_add ?? true,
        can_access_vintedtools: emp.can_access_vintedtools ?? false,
        can_access_employees: emp.can_access_employees ?? false,
        can_access_logs: emp.can_access_logs ?? false,
        can_access_game: emp.can_access_game ?? true,
        can_access_multichannel: emp.can_access_multichannel ?? false,
        can_access_analyticsmarketing: emp.can_access_analyticsmarketing ?? false,
        can_access_marketingstudio: emp.can_access_marketingstudio ?? false, // NEU
      }));
      setEmployees(employeesWithDefaults);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleAddEmployee = () => {
    if (!newEmployee.username || !newEmployee.password) {
      toast('Username und Passwort sind Pflicht!', 'error');
      return;
    }
    setIsAdding(true);
    
    supabase.from('employees').insert({
      username: newEmployee.username,
      password: newEmployee.password,
      role: newEmployee.role,
      permissions: newEmployee.permissions,
      can_access_inventory: newEmployee.can_access_inventory,
      can_access_add: newEmployee.can_access_add,
      can_access_vintedtools: newEmployee.can_access_vintedtools,
      can_access_employees: newEmployee.can_access_employees,
      can_access_logs: newEmployee.can_access_logs,
      can_access_game: newEmployee.can_access_game,
      can_access_multichannel: newEmployee.can_access_multichannel,
      can_access_analyticsmarketing: newEmployee.can_access_analyticsmarketing,
      can_access_marketingstudio: newEmployee.can_access_marketingstudio, // NEU
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
          can_access_inventory: true,
          can_access_add: true,
          can_access_vintedtools: false,
          can_access_employees: false,
          can_access_logs: false,
          can_access_game: true,
          can_access_multichannel: false,
          can_access_analyticsmarketing: false,
          can_access_marketingstudio: false, // NEU
        });
        loadEmployees();
      }
      setIsAdding(false);
    });
  };

  const updateTabPermissions = async (employee: Employee, updates: {
    can_access_inventory: boolean;
    can_access_add: boolean;
    can_access_vintedtools: boolean;
    can_access_employees: boolean;
    can_access_logs: boolean;
    can_access_game: boolean;
    can_access_multichannel: boolean;
    can_access_analyticsmarketing: boolean;
    can_access_marketingstudio: boolean; // NEU
  }) => {
    const { error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', employee.id);
    
    if (error) {
      toast('Fehler beim Aktualisieren der Berechtigungen: ' + error.message, 'error');
    } else {
      toast(`Tab-Berechtigungen für ${employee.username} aktualisiert`, 'success');
      logActivity(currentUser.id, currentUser.username, 'Tab-Berechtigungen geändert', `für "${employee.username}"`);
      setEmployees(prev => prev.map(e => e.id === employee.id ? { ...e, ...updates } : e));
      setEditingPermissions(null);
    }
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
            const defaultPerms = getDefaultTabPermissions(role);
            setNewEmployee({
              ...newEmployee,
              role,
              can_access_inventory: defaultPerms.can_access_inventory,
              can_access_add: defaultPerms.can_access_add,
              can_access_vintedtools: defaultPerms.can_access_vintedtools,
              can_access_employees: defaultPerms.can_access_employees,
              can_access_logs: defaultPerms.can_access_logs,
              can_access_game: defaultPerms.can_access_game,
              can_access_multichannel: defaultPerms.can_access_multichannel,
              can_access_analyticsmarketing: defaultPerms.can_access_analyticsmarketing,
              can_access_marketingstudio: defaultPerms.can_access_marketingstudio, // NEU
            });
          }} className="bg-[#1A1A1A] border border-yellow-400/30 px-4 py-3 text-sm">
            <option>Mitarbeiter</option>
            <option>Manager</option>
            <option>Admin</option>
          </select>
        </div>

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

        <div className="mb-4">
          <h4 className="text-xs text-yellow-400 mb-2">Tab-Berechtigungen</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {TabList.map(tab => (
              <label key={tab.key} className="flex items-center gap-2 text-xs cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={(newEmployee as any)[tab.dbField] || false} 
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-blue-500/30 rounded-lg w-full max-w-sm sm:max-w-md">
            <div className="p-3 sm:p-4 border-b border-blue-500/20">
              <h3 className="text-sm sm:text-base font-bold text-blue-400 flex items-center gap-2">
                <Key className="w-4 h-4"/> Passwort ändern
              </h3>
              <p className="text-xs text-gray-500 mt-1">für {editingEmployee.username}</p>
            </div>
            <div className="p-3 sm:p-4">
              <input 
                type="password" 
                placeholder="Neues Passwort" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                className="w-full bg-[#1A1A1A] border border-blue-500/30 rounded px-3 py-2 text-sm"
                autoFocus
              />
            </div>
            <div className="flex gap-2 p-3 sm:p-4 pt-0">
              <button 
                onClick={() => {
                  if (!newPassword) { toast('Bitte neues Passwort eingeben', 'error'); return; }
                  supabase.from('employees').update({ password: newPassword }).eq('id', editingEmployee.id).then(({ error }) => {
                    if (error) {
                      toast('Fehler: ' + error.message, 'error');
                    } else {
                      toast('Passwort geändert', 'success');
                      logActivity(currentUser.id, currentUser.username, 'Passwort geändert', `für "${editingEmployee.username}"`);
                      setNewPassword('');
                      setEditingEmployee(null);
                      loadEmployees();
                    }
                  });
                }} 
                className="flex-1 py-2 bg-blue-500 text-white font-bold uppercase text-xs rounded hover:bg-blue-600 transition-colors"
              >
                Speichern
              </button>
              <button 
                onClick={() => { setEditingEmployee(null); setNewPassword(''); }} 
                className="flex-1 py-2 border border-gray-600 text-gray-400 uppercase text-xs rounded hover:bg-gray-800 transition-colors"
              >
                Abbrechen
              </button>
            </div>
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {TabList.map(tab => (
              <label key={tab.key} className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-[#1A1A1A] rounded hover:bg-[#FF4400]/10 transition-colors">
                <input
                  type="checkbox"
                  checked={(editingPermissions as any)[tab.dbField] || false}
                  onChange={e => setEditingPermissions({
                    ...editingPermissions,
                    [tab.dbField]: e.target.checked
                  } as Employee)}
                  className="accent-purple-400"
                />
                <tab.icon className="w-4 h-4 text-purple-400"/>
                <span className="text-gray-300">{tab.label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => {
              const updates = {
                can_access_inventory: editingPermissions.can_access_inventory,
                can_access_add: editingPermissions.can_access_add,
                can_access_vintedtools: editingPermissions.can_access_vintedtools,
                can_access_employees: editingPermissions.can_access_employees,
                can_access_logs: editingPermissions.can_access_logs,
                can_access_game: editingPermissions.can_access_game,
                can_access_multichannel: editingPermissions.can_access_multichannel,
                can_access_analyticsmarketing: editingPermissions.can_access_analyticsmarketing,
                can_access_marketingstudio: editingPermissions.can_access_marketingstudio, // NEU
              };
              updateTabPermissions(editingPermissions, updates);
            }} className="px-6 py-3 bg-purple-500 text-white font-bold uppercase text-xs rounded hover:bg-purple-600 transition-colors">Speichern</button>
            <button onClick={() => setEditingPermissions(null)} className="px-6 py-3 border border-gray-600 text-gray-400 uppercase text-xs rounded hover:bg-gray-800 transition-colors">Abbrechen</button>
          </div>
        </div>
      )}

      {/* Mitarbeiter Liste - Tabelle */}
      <div className="bg-[#111] border border-[#FF4400]/20 overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-[#FF4400] text-white sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">Username</th>
                  <th className="px-4 py-3 text-left">Rolle</th>
                  <th className="px-4 py-3 text-left">Logins</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Letzter Login</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Tabs</th>
                  <th className="px-4 py-3 text-left">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="border-t border-[#FF4400]/10 hover:bg-[#FF4400]/5 transition-colors">
                    <td className="px-4 py-3 font-bold break-words max-w-[150px]">{emp.username}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs whitespace-nowrap ${emp.role === 'Admin' ? 'bg-yellow-400 text-black' : emp.role === 'Manager' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-600/20 text-gray-400'}`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">{emp.login_count}×</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 ${emp.online ? 'text-green-500' : 'text-gray-500'}`}>
                        <div className={`w-2 h-2 rounded-full ${emp.online ? 'bg-green-500' : 'bg-gray-500'}`}/>
                        <span className="hidden sm:inline">{emp.online ? 'Online' : 'Offline'}</span>
                        <span className="sm:hidden">{emp.online ? 'On' : 'Off'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                      {emp.last_login ? new Date(emp.last_login).toLocaleString('de-DE') : 'Nie'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {TabList.filter(tab => (emp as any)[tab.dbField] === true).slice(0, 4).map(tab => (
                          <span key={tab.key} className="text-purple-400" title={tab.label}>
                            <tab.icon className="w-3 h-3"/>
                          </span>
                        ))}
                        {TabList.filter(tab => (emp as any)[tab.dbField] === true).length > 4 && (
                          <span className="text-xs text-gray-500">
                            +{TabList.filter(tab => (emp as any)[tab.dbField] === true).length - 4}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setEditingPermissions(emp)} className="p-1.5 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors" title="Tab-Berechtigungen">
                          <Shield className="w-3.5 h-3.5"/>
                        </button>
                        <button onClick={() => setEditingEmployee(emp)} className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors" title="Passwort ändern">
                          <Key className="w-3.5 h-3.5"/>
                        </button>
                        <button onClick={() => confirm(`${emp.username} wirklich löschen?`, () => {
                          supabase.from('employees').delete().eq('id', emp.id).then(() => {
                            toast('Mitarbeiter gelöscht', 'info');
                            logActivity(currentUser.id, currentUser.username, 'Mitarbeiter gelöscht', `"${emp.username}"`);
                            loadEmployees();
                          });
                        })} className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors" title="Löschen">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
