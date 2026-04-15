import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD || 'mastercontrol01010';
    
    // Admin Login
    if (password === adminPassword) {
      const cookieStore = await cookies();
      cookieStore.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8,
        path: '/',
      });
      return NextResponse.json({ success: true, mode: 'admin' });
    }
    
    // Employee Login
    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('password', password)
      .single();
    
    if (employee && !error) {
      const cookieStore = await cookies();
      cookieStore.set('employee_session', JSON.stringify({ id: employee.id, username: employee.username, role: employee.role }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8,
        path: '/',
      });
      return NextResponse.json({ success: true, mode: 'employee', user: employee });
    }
    
    return NextResponse.json({ error: 'Falsches Passwort' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Server Fehler' }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session');
  const employeeSession = cookieStore.get('employee_session');
  
  if (adminSession) {
    return NextResponse.json({ authenticated: true, mode: 'admin' });
  }
  if (employeeSession) {
    try {
      const user = JSON.parse(employeeSession.value);
      return NextResponse.json({ authenticated: true, mode: 'employee', user });
    } catch {
      return NextResponse.json({ authenticated: false });
    }
  }
  return NextResponse.json({ authenticated: false });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  cookieStore.delete('employee_session');
  return NextResponse.json({ success: true });
}
