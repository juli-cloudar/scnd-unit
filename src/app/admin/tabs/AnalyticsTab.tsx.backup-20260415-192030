import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Employee {
  id: number; username: string; role: string; login_count: number; last_login?: string; online: boolean;
}

export function AnalyticsTab() {
  const [stats, setStats] = useState({ total: 0, sold: 0, active: 0, revenue: 0 });
  const [employeeStats, setEmployeeStats] = useState<Employee[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      const { data: products } = await supabase.from('products').select('*');
      if (products) {
        const sold = products.filter(p => p.sold).length;
        setStats({ total: products.length, sold, active: products.length - sold, revenue: products.filter(p => p.sold).reduce((acc, p) => acc + (parseFloat(p.price) || 0), 0) });
      }
      const { data: employees } = await supabase.from('employees').select('*').order('login_count', { ascending: false });
      if (employees) setEmployeeStats(employees);
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Gesamt', value: stats.total, color: 'text-[#FF4400]' },
          { label: 'Aktiv', value: stats.active, color: 'text-green-500' },
          { label: 'Verkauft', value: stats.sold, color: 'text-red-500' },
          { label: 'Umsatz', value: `€${stats.revenue.toFixed(2)}`, color: 'text-yellow-400' }
        ].map(s => (
          <div key={s.label} className="bg-[#111] border border-[#FF4400]/20 p-6 text-center">
            <div className={`text-4xl font-bold ${s.color} mb-2`}>{s.value}</div>
            <div className="text-xs uppercase text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-[#111] border border-[#FF4400]/20 p-6">
        <h3 className="text-lg font-bold text-[#FF4400] mb-4">Mitarbeiter Aktivität</h3>
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#FF4400]/30 sticky top-0 bg-[#111]">
              <tr><th className="text-left py-2 px-2">Username</th><th className="text-left py-2 px-2">Rolle</th><th className="text-left py-2 px-2">Logins</th><th className="text-left py-2 px-2">Letzter Login</th><th className="text-left py-2 px-2">Status</th></tr>
            </thead>
            <tbody>
              {employeeStats.map(emp => (
                <tr key={emp.id} className="border-b border-[#FF4400]/10">
                  <td className="py-3 px-2 font-bold">{emp.username}</td>
                  <td className="py-3 px-2">{emp.role}</td>
                  <td className="py-3 px-2">{emp.login_count}×</td>
                  <td className="py-3 px-2 text-gray-500 text-xs">{emp.last_login ? new Date(emp.last_login).toLocaleString('de-DE') : 'Nie'}</td>
                  <td className="py-3 px-2"><span className={emp.online ? 'text-green-500' : 'text-gray-500'}>{emp.online ? '● Online' : '○ Offline'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
