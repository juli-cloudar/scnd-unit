import { supabase } from '@/lib/supabase';

export const proxyImg = (url: string) => {
  if (!url) return '';
  if (url.startsWith('/api/')) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

export const cleanImageUrl = (url: string): string => 
  url.replace(/[?&]s=[^&]+/, '').replace(/\/f\d+\//, '/f800/').replace(/\\/g, '').trim();

export async function logActivity(employeeId: number, username: string, action: string, details: string = '') {
  const { error } = await supabase.from('activity_logs').insert({
    employee_id: employeeId || null,
    username,
    action,
    details,
    timestamp: new Date().toISOString()
  });
  if (error) console.error('Log Fehler:', error);
}
