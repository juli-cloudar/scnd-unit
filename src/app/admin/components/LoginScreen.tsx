'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Employee {
  id: number; 
  username: string; 
  role: string;
  permissions: { 
    canAddProducts: boolean; 
    canEditProducts: boolean; 
    canDeleteProducts: boolean; 
    canViewStats: boolean; 
    canManageEmployees: boolean; 
  };
}

export function LoginScreen({ onLogin }: { onLogin: (mode: 'admin' | 'employee', user: Employee | null) => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const tryLogin = async () => {
    if (!input) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: input })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // 🔑 WICHTIG: Speichere das eingegebene Passwort als Admin-Key
        sessionStorage.setItem('admin_key', input);
        
        if (data.mode === 'admin') {
          sessionStorage.setItem('scnd_auth', 'admin');
          onLogin('admin', null);
        } else if (data.mode === 'employee' && data.user) {
          sessionStorage.setItem('scnd_auth', 'employee');
          sessionStorage.setItem('scnd_user', JSON.stringify(data.user));
          onLogin('employee', data.user);
        }
      } else {
        setError('Ungültiges Passwort');
        setInput('');
        setTimeout(() => setError(''), 2000);
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
      <div className="w-full max-w-md p-8 border border-[#FF4400]/30 bg-[#111]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tighter mb-2">
            <span className="text-[#FF4400]">SCND</span>_UNIT
          </h1>
          <p className="text-gray-500 text-sm uppercase tracking-widest">Management Panel</p>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'} 
              value={input} 
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && tryLogin()} 
              placeholder="Passwort eingeben"
              className="w-full p-4 bg-[#1A1A1A] border border-[#FF4400]/30 text-[#F5F5F5] pr-12 focus:outline-none focus:border-[#FF4400]" 
              autoFocus 
            />
            <button 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#FF4400] transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          
          <button 
            onClick={tryLogin} 
            disabled={loading} 
            className="w-full py-4 bg-[#FF4400] text-white font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 disabled:opacity-50 transition-all"
          >
            {loading ? '...' : 'Einloggen'}
          </button>
        </div>
      </div>
    </div>
  );
}
