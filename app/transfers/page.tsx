'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { liveAccounts, createTransfer } from '@/lib/repo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export default function TransfersPage() {
  const accounts = useLiveQuery(liveAccounts) ?? [];
  const { push } = useToast();
  const [form, setForm] = useState({ from: '', to: '', amount: 0, date: new Date().toISOString().slice(0, 10), description: '' });

  const onSubmit = async () => {
    if (!form.from || !form.to || form.from === form.to) {
      push({ title: 'اختر حسابين مختلفين', type: 'error' });
      return;
    }
    if (form.amount <= 0) {
      push({ title: 'المبلغ غير صالح', type: 'error' });
      return;
    }
    await createTransfer({
      fromAccountId: form.from,
      toAccountId: form.to,
      amount: form.amount,
      date: form.date,
      description: form.description,
    });
    push({ title: 'تم تسجيل التحويل' });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">التحويلات</h1>
      <Card>
        <CardHeader>
          <CardTitle>تحويل جديد</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">من حساب</label>
            <select className="border rounded px-3 py-2 w-full" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })}>
              <option value="">--</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">إلى حساب</label>
            <select className="border rounded px-3 py-2 w-full" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })}>
              <option value="">--</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">التاريخ</label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="text-sm">المبلغ</label>
            <Input type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm">الوصف</label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={onSubmit}>إنشاء التحويل</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
