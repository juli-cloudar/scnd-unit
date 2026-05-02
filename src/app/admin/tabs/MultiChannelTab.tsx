'use client';

import { useState, useEffect } from 'react';
import { 
  Package, BarChart3, Plus, Globe, Users, Clock, LogOut, Gamepad2, Share2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Components
import { ToastContainer } from './components/ToastContainer';
import { ConfirmDialog } from './components/ConfirmDialog';
import { LoginScreen } from './components/LoginScreen';
import { ScndDropGame } from '@/components/ScndDropGame';

// Hooks
import { useToast } from './hooks/useToast';
import { useConfirm } from './hooks/useConfirm';

// Tabs
import { InventoryTab } from './tabs/InventoryTab';
import { AddTab } from './tabs/AddTab';
import { VintedToolsTab } from './tabs/VintedToolsTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { EmployeesTab } from './tabs/EmployeesTab';
import { LogsTab } from './tabs/LogsTab';
import { MultiChannelTab } from './tabs/MultiChannelTab';

// Types
interface Employee {
  id: number;
  username: string;
  role: 'Mitarbeiter' | 'Manager' | 'Admin';
  password: string;
  login_count: number;
  total_work_hours: number;
  online: boolean;
  last_login?: string;
  permissions: {
    canAddProducts: boolean;
    canEditProducts: boolean;
    canDeleteProducts: boolean;
    canViewStats: boolean;
    canManageEmployees: boolean;
  };
}

// Helper um Employee zu erstellen
function createEmployeeFromUser(user: any): Employee {
  return {
    id: user.id || 0,
    username: user.username || 'Mastercontrol',
    role: user.role || 'Admin',
    password: user.password || '',
    login_count: user.login_count || 0,
    total_work_hours: user.total_work_hours || 0,
    online: user.online || true,
    last_login: user.last_login,
    permissions: user.permissions || {
      canAddProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      canViewStats: true,
      canManageEmployees: true
    }
  };
}

export default function ManagementPanel() {
  const [authed, setAuthed] = useState(false);
  const [authMode, setAuthMode] = useState<'admin' | 'employee' | null>(null);
  const [checking, setChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState('inventory');
  const { toasts, addToast, removeToast } = useToast();
  const { confirmOptions, showConfirm, closeConfirm } = useConfirm();

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('scnd_auth');
    const savedUser = sessionStorage.getItem('scnd_user');
    if (savedAuth === 'admin') {
      setAuthed(true);
      setAuthMode('admin');
      setCurrentUser({
        id: 0,
        username: 'Mastercontrol',
        role: 'Admin',
        password: '',
        login_count: 0,
        total_work_hours: 0,
        online: true,
        permissions: {
          canAddProducts: true,
          canEditProducts: true,
          canDeleteProducts: true,
          canViewStats: true,
          canManageEmployees: true
        }
      });
    } else if (savedAuth === 'employee' && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setAuthed(true);
        setAuthMode('employee');
        setCurrentUser(createEmployeeFromUser(user));
      } catch (e) {
        console.error('Fehler beim Parsen des Benutzers:', e);
      }
    }
    setChecking(false);
  }, []);

  const handleLogout = async () => {
    if (currentUser && currentUser.id !== 0) {
      await supabase.from('employees').update({ online: false }).eq('id', currentUser.id);
    }
    sessionStorage.removeItem('scnd_auth');
    sessionStorage.removeItem('scnd_user');
    setAuthed(false);
    setAuthMode(null);
    setCurrentUser(null);
  };

  if (checking) return null;
  if (!authed) {
    return <LoginScreen onLogin={(mode, user) => {
      setAuthed(true);
      setAuthMode(mode);
      if (mode === 'admin') {
        setCurrentUser({
          id: 0,
          username: 'Mastercontrol',
          role: 'Admin',
          password: '',
          login_count: 0,
          total_work_hours: 0,
          online: true,
          permissions: {
            canAddProducts: true,
            canEditProducts: true,
            canDeleteProducts: true,
            canViewStats: true,
            canManageEmployees: true
          }
        });
      } else if (user) {
        setCurrentUser(createEmployeeFromUser(user));
      }
      sessionStorage.setItem('scnd_auth', mode);
      if (user) sessionStorage.setItem('scnd_user', JSON.stringify(user));
    }} />;
  }

  return (
    <div className="min-h-screen font-sans bg-[#0A0A0A] text-[#F5F5F5]">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {confirmOptions && <ConfirmDialog options={confirmOptions} onClose={closeConfirm} />}
      
      <header className="border-b border-[#FF4400]/30 px-6 py-4 sticky top-0 bg-[#0A0A0A]/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tighter">
              <span className="text-[#FF4400]">SCND</span>_UNIT
              <span className="text-gray-500 text-lg ml-2">/ Management</span>
            </h1>
            {currentUser && (
              <span className={`px-2 py-1 text-xs uppercase font-bold ${
                currentUser.role === 'Admin' ? 'bg-yellow-400 text-black' :
                currentUser.role === 'Manager' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-white'
              }`}>
                {currentUser.role}: {currentUser.username}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {currentUser?.permissions.canViewStats && (
              <button onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${
                  activeTab === 'analytics' ? 'bg-[#FF4400] text-white' : 'border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10'
                }`}>
                <BarChart3 className="w-4 h-4 inline mr-1"/>Analytics
              </button>
            )}
            <button onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${
                activeTab === 'inventory' ? 'bg-[#FF4400] text-white' : 'border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10'
              }`}>
              <Package className="w-4 h-4 inline mr-1"/>Inventar
            </button>
            {currentUser?.permissions.canAddProducts && (
              <button onClick={() => setActiveTab('add')}
                className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${
                  activeTab === 'add' ? 'bg-[#FF4400] text-white' : 'border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10'
                }`}>
                <Plus className="w-4 h-4 inline mr-1"/>Hinzufuegen
              </button>
            )}
            {currentUser?.permissions.canAddProducts && (
              <button onClick={() => setActiveTab('vinted-tools')}
                className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${
                  activeTab === 'vinted-tools' ? 'bg-green-600 text-white' : 'border border-green-600/30 text-green-500 hover:bg-green-600/10'
                }`}>
                <Globe className="w-4 h-4 inline mr-1"/>Vinted Tools
              </button>
            )}
            {currentUser?.permissions.canManageEmployees && (
              <button onClick={() => setActiveTab('employees')}
                className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${
                  activeTab === 'employees' ? 'bg-yellow-400 text-black' : 'border border-yellow-400 text-yellow-400 hover:bg-yellow-400/10'
                }`}>
                <Users className="w-4 h-4 inline mr-1"/>Team
              </button>
            )}
            {currentUser?.role === 'Admin' && (
              <button onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${
                  activeTab === 'logs' ? 'bg-purple-500 text-white' : 'border border-purple-500 text-purple-500 hover:bg-purple-500/10'
                }`}>
                <Clock className="w-4 h-4 inline mr-1"/>Logs
              </button>
            )}
            <button onClick={() => setActiveTab('game')}
              className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${
                activeTab === 'game' ? 'bg-[#FF4400] text-white' : 'border border-[#FF4400]/30 text-[#FF4400] hover:bg-[#FF4400]/10'
              }`}>
              <Gamepad2 className="w-4 h-4 inline mr-1"/>SCND DROP
            </button>
            <button onClick={() => setActiveTab('multichannel')}
              className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${
                activeTab === 'multichannel' ? 'bg-purple-600 text-white' : 'border border-purple-600/30 text-purple-500 hover:bg-purple-600/10'
              }`}>
              <Share2 className="w-4 h-4 inline mr-1"/>Multi-Channel
            </button>
            <button onClick={handleLogout}
              className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 text-xs uppercase font-bold">
              <LogOut className="w-4 h-4 inline mr-1"/>Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'inventory' && <InventoryTab user={currentUser} toast={addToast} confirm={showConfirm} />}
        {activeTab === 'add' && <AddTab user={currentUser} toast={addToast} onProductAdded={() => {}} />}
        {activeTab === 'vinted-tools' && currentUser?.permissions.canAddProducts && <VintedToolsTab user={currentUser} toast={addToast} confirm={showConfirm} />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'employees' && currentUser?.permissions.canManageEmployees && <EmployeesTab currentUser={currentUser} toast={addToast} confirm={showConfirm} />}
        {activeTab === 'logs' && currentUser?.role === 'Admin' && <LogsTab toast={addToast} confirm={showConfirm} />}
        {activeTab === 'game' && (
          <div className="py-4">
            <ScndDropGame />
          </div>
        )}
        {activeTab === 'multichannel' && <MultiChannelTab user={currentUser} toast={addToast} />}
      </main>
    </div>
  );
}
