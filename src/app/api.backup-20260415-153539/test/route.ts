import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'API funktioniert!', timestamp: new Date().toISOString() });
}

export async function POST() {
  return NextResponse.json({ message: 'POST funktioniert!' });
}
