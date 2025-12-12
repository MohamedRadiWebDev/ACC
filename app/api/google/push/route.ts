import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ status: 'ok', note: 'أضف بيانات اعتماد Google لاستخدام المزامنة.' });
}
