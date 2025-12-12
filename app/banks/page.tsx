'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { bankRunningBalance } from '@/lib/calculations';
import { db } from '@/lib/db';
import { BankName, BankTransaction } from '@/lib/types';
import { z } from 'zod';

const schema = z
  .object({
    bankName: z.enum(['BANK_MISR', 'CREDIT_BANK', 'NBK', 'EG_BANK']),
    balance: z.coerce.number().optional(),
    credit: z.coerce.number().nonnegative(),
    debit: z.coerce.number().nonnegative(),
    date: z.string(),
    postedDate: z.string().optional(),
    valueDate: z.string().optional(),
    description: z.string().default(''),
  })
  .refine((data) => (data.credit > 0) !== (data.debit > 0), { message: 'يجب أن يكون أحد الدائن أو المدين أكبر من صفر' });

export default function BanksPage() {
  const { push } = useToast();
  const [bank, setBank] = useState<BankName>('BANK_MISR');
  const [form, setForm] = useState({
    bankName: 'BANK_MISR',
    balance: 0,
    credit: 0,
    debit: 0,
    date: new Date().toISOString().slice(0, 10),
    postedDate: '',
    valueDate: '',
    description: '',
  });

  const transactions = useLiveQuery(() => db.bankTransactions.where('bankName').equals(bank).toArray(), [bank]);
  const running = useMemo(() => bankRunningBalance(0, transactions ?? []), [transactions]);

  async function save() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      push({ title: 'خطأ', description: parsed.error.errors.map((e) => e.message).join('\n'), variant: 'destructive' });
      return;
    }
    const entry: BankTransaction = { ...parsed.data, id: uuid(), createdAt: new Date().toISOString() };
    await db.bankTransactions.add(entry);
    push({ title: 'تم الحفظ' });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">البنوك</h1>
        <select
          className="border rounded px-3 py-2"
          value={bank}
          onChange={(e) => {
            setBank(e.target.value as BankName);
            setForm({ ...form, bankName: e.target.value as BankName });
          }}
        >
          <option value="BANK_MISR">بنك مصر</option>
          <option value="CREDIT_BANK">كريدي أجريكول</option>
          <option value="NBK">بنك NBK</option>
          <option value="EG_BANK">EG Bank</option>
        </select>
      </div>

      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">إضافة حركة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Input value={form.date} type="date" onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input value={form.postedDate} type="date" onChange={(e) => setForm({ ...form, postedDate: e.target.value })} placeholder="تاريخ التسجيل" />
          <Input value={form.valueDate} type="date" onChange={(e) => setForm({ ...form, valueDate: e.target.value })} placeholder="تاريخ الحق" />
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="البيان" />
          <Input value={form.credit} type="number" onChange={(e) => setForm({ ...form, credit: Number(e.target.value) })} placeholder="دائن" />
          <Input value={form.debit} type="number" onChange={(e) => setForm({ ...form, debit: Number(e.target.value) })} placeholder="مدين" />
          <Input value={form.balance} type="number" onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })} placeholder="الرصيد (اختياري)" />
        </div>
        <Button onClick={save}>حفظ</Button>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">الرصيد الجاري: {running}</div>
        </div>
        <div className="overflow-auto">
          <Table>
            <THead>
              <Tr>
                <Th>الرصيد</Th>
                <Th>دائن</Th>
                <Th>مدين</Th>
                <Th>التاريخ</Th>
                <Th>تاريخ التسجيل</Th>
                <Th>تاريخ الحق</Th>
                <Th>البيان</Th>
              </Tr>
            </THead>
            <TBody>
              {transactions?.map((row) => (
                <Tr key={row.id}>
                  <Td>{row.balance}</Td>
                  <Td>{row.credit}</Td>
                  <Td>{row.debit}</Td>
                  <Td>{row.date}</Td>
                  <Td>{row.postedDate}</Td>
                  <Td>{row.valueDate}</Td>
                  <Td>{row.description}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
