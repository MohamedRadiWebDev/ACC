'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createAccount, deleteAccount, liveAccounts } from '@/lib/repo';
import { useToast } from '@/components/ui/use-toast';

const schema = z.object({
  name: z.string().min(2),
  type: z.enum(['CASHBOX', 'BANK', 'WALLET']),
  provider: z.union([z.enum(['INSTAPAY', 'VODAFONE', 'ETISALAT', 'AMAN', 'FAWRY']), z.literal(''), z.null()]),
  openingBalance: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export default function AccountsPage() {
  const accounts = useLiveQuery(liveAccounts) ?? [];
  const { push } = useToast();
  const [form, setForm] = useState({ name: '', type: 'CASHBOX', provider: '', openingBalance: 0, notes: '' });

  const onSubmit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      push({ title: 'تحقق من البيانات', description: parsed.error.errors[0].message, type: 'error' });
      return;
    }
    await createAccount({
      name: parsed.data.name,
      type: parsed.data.type,
      provider: parsed.data.provider ? (parsed.data.provider as any) : null,
      currency: 'EGP',
      openingBalance: parsed.data.openingBalance,
      notes: parsed.data.notes,
    });
    setForm({ name: '', type: 'CASHBOX', provider: '', openingBalance: 0, notes: '' });
    push({ title: 'تم إضافة الحساب' });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">إدارة الحسابات</h1>
      <Card>
        <CardHeader>
          <CardTitle>حساب جديد</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">الاسم</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm">النوع</label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="CASHBOX">خزنة</option>
              <option value="BANK">بنك</option>
              <option value="WALLET">محفظة</option>
            </Select>
          </div>
          <div>
            <label className="text-sm">المزود (للمحافظ)</label>
            <Select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
              <option value="">--</option>
              <option value="INSTAPAY">InstaPay</option>
              <option value="VODAFONE">فودافون</option>
              <option value="ETISALAT">اتصالات</option>
              <option value="AMAN">أمان</option>
              <option value="FAWRY">فوري</option>
            </Select>
          </div>
          <div>
            <label className="text-sm">رصيد افتتاحي</label>
            <Input type="number" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm">ملاحظات</label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={onSubmit}>حفظ</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>جميع الحسابات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <Tr>
                <Th>الاسم</Th>
                <Th>النوع</Th>
                <Th>المزود</Th>
                <Th>رصيد افتتاحي</Th>
                <Th></Th>
              </Tr>
            </THead>
            <TBody>
              {accounts.map((account) => (
                <Tr key={account.id}>
                  <Td>{account.name}</Td>
                  <Td>{account.type}</Td>
                  <Td>{account.provider ?? '-'}</Td>
                  <Td>{account.openingBalance}</Td>
                  <Td>
                    <Button variant="destructive" size="sm" onClick={() => deleteAccount(account.id)}>
                      حذف
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
