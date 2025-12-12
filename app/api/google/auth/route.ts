import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'OAuth placeholder. اضبط بيانات الاعتماد لبدء التدفق.' });
}
