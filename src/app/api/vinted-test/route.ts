// src/app/api/vinted-test/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  console.log('Test POST received');
  return NextResponse.json({ message: 'Test POST works!' });
}

export async function GET() {
  return NextResponse.json({ message: 'Test GET works!' });
}
