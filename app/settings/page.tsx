'use client';

import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLiveQuery } from 'dexie-react-hooks';
import { exportAll, importJson, seedDemo, createAccount, createTransaction, liveAccounts } from '@/lib/repo';
import { generateTemplateCSV, parseBool } from '@/lib/utils';
import Papa from 'papaparse';
import { useState } from 'react';
import { AccountType } from '@/lib/types';

export default function SettingsPage() {
  const { push } = useToast();
  const accounts = useLiveQuery(liveAccounts) ?? [];
  const [ledgerChoice, setLedgerChoice] = useState<'CASHBOX' | 'DIGITAL' | 'BANK'>('CASHBOX');

  const download = async () => {
    const blob = new Blob([await exportAll()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup.json';
    a.click();
  };

  const downloadTemplate = (lang: 'arabic' | 'english') => {
    const template = generateTemplateCSV()[lang];
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `template-${lang}.csv`;
    a.click();
  };

  const importCSV = async (file: File) => {
    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    const rows = parsed.data as any[];
    let inserted = 0;
    for (const row of rows) {
      const accountName = row.accountName || row['اسم الحساب'];
      if (!accountName || !row.amount || !row.date) continue;
      let account = accounts.find((a) => a.name === accountName);
      if (!account) {
        account = await createAccount({
          name: accountName,
          type: ledgerChoice as AccountType,
          provider: ledgerChoice === 'DIGITAL' ? undefined : null,
          currency: 'EGP',
          openingBalance: 0,
          notes: 'من استيراد CSV',
        });
      }
      await createTransaction({
        ledger: ledgerChoice,
        accountId: account.id,
        date: row.date || row['التاريخ'],
        direction: (row.direction || row['نوع الحركة (IN/OUT)'] || 'IN').toUpperCase() === 'OUT' ? 'OUT' : 'IN',
        amount: Number(row.amount || row['المبلغ']),
        description: row.description || row['الوصف'] || 'وارد من استيراد',
        category: row.category || row['التصنيف'],
        employeeCode: row.employeeCode || row['كود الموظف'],
        employeeName: row.employeeName || row['اسم الموظف'],
        department: row.department || row['القسم'],
        branch: row.branch || row['الفرع'],
        invoiceNo: row.invoiceNo || row['فاتورة'],
        receiptOutNo: row.receiptOutNo || row['إذن صرف'],
        receiptInNo: row.receiptInNo || row['إذن قبض'],
        approved: parseBool(row.approved || row['معتمد']),
        notes: row.notes || row['ملاحظات'],
        matchId: null,
        transferId: null,
        source: 'Import',
      });
      inserted += 1;
    }
    push({ title: 'انتهى الاستيراد', description: `تم إدخال ${inserted} صفوف` });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">الإعدادات</h1>
      <Card>
        <CardHeader>
          <CardTitle>نسخ احتياطي واستيراد</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={download}>تصدير كامل (JSON)</Button>
            <label className="border rounded px-3 py-2 cursor-pointer">
              استيراد JSON (دمج)
              <input
                type="file"
                className="hidden"
                accept="application/json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  await importJson(JSON.parse(text), 'merge');
                  push({ title: 'تم الدمج بنجاح' });
                }}
              />
            </label>
            <label className="border rounded px-3 py-2 cursor-pointer">
              استيراد JSON (استبدال)
              <input
                type="file"
                className="hidden"
                accept="application/json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  await importJson(JSON.parse(text), 'replace');
                  push({ title: 'تم الاستبدال بنجاح' });
                }}
              />
            </label>
          </div>
          <div className="space-y-2">
            <div className="font-semibold">استيراد CSV</div>
            <div className="flex gap-2 flex-wrap items-center">
              <select className="border rounded px-3 py-2" value={ledgerChoice} onChange={(e) => setLedgerChoice(e.target.value as any)}>
                <option value="CASHBOX">الخزنة</option>
                <option value="DIGITAL">المحافظ الرقمية</option>
                <option value="BANK">البنك</option>
              </select>
              <label className="border rounded px-3 py-2 cursor-pointer">
                اختر ملف CSV
                <input
                  type="file"
                  className="hidden"
                  accept="text/csv"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    await importCSV(file);
                  }}
                />
              </label>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" onClick={() => downloadTemplate('arabic')}>
                نموذج CSV بالعربية
              </Button>
              <Button variant="secondary" onClick={() => downloadTemplate('english')}>
                CSV Template English
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>بيانات تجريبية</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => seedDemo()}>تفريغ وإعادة ضبط</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>دمج Google Sheets (اختياري)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>زر الاتصال يعمل كمكان مخصص لإضافة OAuth لاحقاً.</p>
          <Button variant="outline">الاتصال بـ Google</Button>
          <p className="text-xs text-muted-foreground">
            استخدم مسارات /api/google/auth و /api/google/push و /api/google/pull عند إضافة بيانات اعتماد API.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
