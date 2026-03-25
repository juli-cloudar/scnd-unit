'use client';
import { useState, useEffect } from 'react';
import { Trash2, ExternalLink, RefreshCw, ShoppingBag, Plus, Check, X, ChevronLeft, ChevronRight, ImageIcon, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useConfirm } from '@/components/ConfirmDialog';

/* ================= USERS ================= */

type User = {
  username: string;
  password: string;
  role: 'admin' | 'user';
};

const DEFAULT_USERS: User[] = [
  { username: 'admin', password: 'mastercontrol01010', role: 'admin' },
];

/* ================= TYPES ================= */

interface Product {
  id: number; name: string; category: string; price: string;
  size: string; condition: string; images: string[]; vinted_url: string; sold: boolean;
}

/* ================= LOGIN ================= */

function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('users');
    if (stored) setUsers(JSON.parse(stored));
  }, []);

  const tryLogin = () => {
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      sessionStorage.setItem('auth', '1');
      sessionStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-sm">
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" className="w-full mb-2 p-3 bg-[#111]" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Passwort" className="w-full mb-2 p-3 bg-[#111]" />
        {error && <p className="text-red-500 text-xs">Falsch</p>}
        <button onClick={tryLogin} className="w-full p-3 bg-[#FF4400]">Login</button>
      </div>
    </div>
  );
}

/* ================= PAGE ================= */

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    setChecking(false);
  }, []);

  if (checking) return null;
  if (!user) return <LoginScreen onLogin={setUser} />;

  return <AdminDashboard user={user} />;
}

/* ================= DASHBOARD ================= */

function AdminDashboard({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'add' | 'admin'>('inventory');
  const confirm = useConfirm();

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*');
    if (data) setProducts(data);
  };

  const logout = () => {
    sessionStorage.clear();
    location.reload();
  };

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      <div className="flex gap-2 mb-6">
        <button onClick={()=>setActiveTab('inventory')}>Inventar</button>
        <button onClick={()=>setActiveTab('add')}>Add</button>

        {user.role === 'admin' && (
          <button onClick={()=>setActiveTab('admin')}>Admin</button>
        )}

        <button onClick={logout}>Logout</button>
      </div>

      {activeTab === 'inventory' && <div>Inventar: {products.length}</div>}
      {activeTab === 'add' && <div>Form placeholder</div>}

      {activeTab === 'admin' && user.role === 'admin' && (
        <AdminPanel />
      )}
    </div>
  );
}

/* ================= ADMIN PANEL ================= */

function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [u, setU] = useState('');
  const [p, setP] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('users');
    if (stored) setUsers(JSON.parse(stored));
  }, []);

  const save = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem('users', JSON.stringify(newUsers));
  };

  const addUser = () => {
    if (!u || !p) return;
    save([...users, { username: u, password: p, role: 'user' }]);
    setU(''); setP('');
  };

  const changePw = (i: number) => {
    const np = prompt('Neues Passwort');
    if (!np) return;
    const copy = [...users];
    copy[i].password = np;
    save(copy);
  };

  return (
    <div className="space-y-4">
      <div>
        <input value={u} onChange={e=>setU(e.target.value)} placeholder="User" className="mr-2 p-2 bg-[#111]" />
        <input value={p} onChange={e=>setP(e.target.value)} placeholder="Passwort" className="mr-2 p-2 bg-[#111]" />
        <button onClick={addUser} className="bg-[#FF4400] p-2">Add</button>
      </div>

      {users.map((x,i)=>(
        <div key={i} className="flex justify-between">
          <span>{x.username}</span>
          <button onClick={()=>changePw(i)}>PW ändern</button>
        </div>
      ))}
    </div>
  );
}
