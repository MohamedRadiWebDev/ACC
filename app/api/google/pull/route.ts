import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', note: 'سحب البيانات يتطلب إعداد Google Sheets.' });
}
