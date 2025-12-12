'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { db } from '@/lib/db';
import { CustodyTransaction } from '@/lib/types';
import { arabicMonth, custodyBalance } from '@/lib/calculations';
import { z } from 'zod';

const schema = z.object({
  date: z.string(),
  description: z.string(),
  paidTo: z.string(),
  invoiceOrEmployeeRef: z.string(),
  department: z.string().default(''),
  classification: z.string().default(''),
  expenseType: z.string().default(''),
  receiptRef: z.string().default(''),
  type: z.enum(['CUSTODY', 'SETTLEMENT']),
  amount: z.coerce.number().positive(),
  notes: z.string().optional(),
});

export default function CustodyPage() {
  const { push } = useToast();
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '',
    paidTo: '',
    invoiceOrEmployeeRef: '',
    department: '',
    classification: '',
    expenseType: '',
    receiptRef: '',
    type: 'CUSTODY',
    amount: 0,
    notes: '',
  });
  const entries = useLiveQuery(() => db.custodyTransactions.toArray(), []);

  async function save() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      push({ title: 'خطأ', description: parsed.error.errors.map((e) => e.message).join('\n'), variant: 'destructive' });
      return;
    }
    const entry: CustodyTransaction = {
      ...parsed.data,
      month: arabicMonth(parsed.data.date),
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    await db.custodyTransactions.add(entry);
    push({ title: 'تم الحفظ' });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">العهد</h1>
      <Card className="p-4 space-y-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Input value={form.date} type="date" onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="البيان" />
          <Input value={form.paidTo} onChange={(e) => setForm({ ...form, paidTo: e.target.value })} placeholder="المنصرف إليه" />
          <Input value={form.invoiceOrEmployeeRef} onChange={(e) => setForm({ ...form, invoiceOrEmployeeRef: e.target.value })} placeholder="رقم الفاتورة / كود موظف" />
          <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="القسم" />
          <Input value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value })} placeholder="التصنيف" />
          <Input value={form.expenseType} onChange={(e) => setForm({ ...form, expenseType: e.target.value })} placeholder="نوع المصروف" />
          <Input value={form.receiptRef} onChange={(e) => setForm({ ...form, receiptRef: e.target.value })} placeholder="رقم إيصال الصرف/استلام" />
          <Input value={form.amount} type="number" onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="العهدة" />
          <select className="border rounded px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="CUSTODY">عهدة</option>
            <option value="SETTLEMENT">سداد</option>
          </select>
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات" />
        </div>
        <Button onClick={save}>حفظ</Button>
      </Card>

      <Card className="p-4">
        <Table>
          <THead>
            <Tr>
              <Th>التاريخ</Th>
              <Th>الشهر</Th>
              <Th>البيان</Th>
              <Th>المنصرف إليه</Th>
              <Th>المرجع</Th>
              <Th>القسم</Th>
              <Th>التصنيف</Th>
              <Th>نوع المصروف</Th>
              <Th>رقم إيصال</Th>
              <Th>العهدة / سداد</Th>
              <Th>العهدة</Th>
              <Th>ملاحظات</Th>
              <Th>الرصيد</Th>
            </Tr>
          </THead>
          <TBody>
            {entries?.map((row) => (
              <Tr key={row.id}>
                <Td>{row.date}</Td>
                <Td>{row.month}</Td>
                <Td>{row.description}</Td>
                <Td>{row.paidTo}</Td>
                <Td>{row.invoiceOrEmployeeRef}</Td>
                <Td>{row.department}</Td>
                <Td>{row.classification}</Td>
                <Td>{row.expenseType}</Td>
                <Td>{row.receiptRef}</Td>
                <Td>{row.type === 'CUSTODY' ? 'عهدة' : 'سداد'}</Td>
                <Td>{row.amount}</Td>
                <Td>{row.notes}</Td>
                <Td>{custodyBalance(entries ?? [], row.paidTo)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
