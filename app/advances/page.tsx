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
import { AdvanceTransaction } from '@/lib/types';
import { advanceBalance, arabicMonth } from '@/lib/calculations';
import { z } from 'zod';

const schema = z.object({
  date: z.string(),
  employeeCode: z.string(),
  employeeName: z.string(),
  department: z.string().default(''),
  type: z.enum(['ADVANCE', 'REPAYMENT']),
  amount: z.coerce.number().positive(),
  repaymentMethod: z.string().default(''),
  notes: z.string().optional(),
});

export default function AdvancesPage() {
  const { push } = useToast();
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    employeeCode: '',
    employeeName: '',
    department: '',
    type: 'ADVANCE',
    amount: 0,
    repaymentMethod: '',
    notes: '',
  });
  const entries = useLiveQuery(() => db.advanceTransactions.toArray(), []);

  async function save() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      push({ title: 'خطأ', description: parsed.error.errors.map((e) => e.message).join('\n'), variant: 'destructive' });
      return;
    }
    const entry: AdvanceTransaction = {
      ...parsed.data,
      month: arabicMonth(parsed.data.date),
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    await db.advanceTransactions.add(entry);
    push({ title: 'تم الحفظ' });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">السلف</h1>
      <Card className="p-4 space-y-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Input value={form.date} type="date" onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} placeholder="الكود" />
          <Input value={form.employeeName} onChange={(e) => setForm({ ...form, employeeName: e.target.value })} placeholder="اسم الموظف" />
          <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="القسم" />
          <Input value={form.amount} type="number" onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="السلفة" />
          <Input value={form.repaymentMethod} onChange={(e) => setForm({ ...form, repaymentMethod: e.target.value })} placeholder="طريق السداد" />
          <select className="border rounded px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="ADVANCE">سلفة</option>
            <option value="REPAYMENT">سداد</option>
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
              <Th>الكود</Th>
              <Th>اسم الموظف</Th>
              <Th>القسم</Th>
              <Th>سلفة/سداد</Th>
              <Th>السلفة</Th>
              <Th>طريق السداد</Th>
              <Th>ملاحظات</Th>
              <Th>الرصيد المتراكم</Th>
            </Tr>
          </THead>
          <TBody>
            {entries?.map((row) => (
              <Tr key={row.id}>
                <Td>{row.date}</Td>
                <Td>{row.month}</Td>
                <Td>{row.employeeCode}</Td>
                <Td>{row.employeeName}</Td>
                <Td>{row.department}</Td>
                <Td>{row.type === 'ADVANCE' ? 'سلفة' : 'سداد'}</Td>
                <Td>{row.amount}</Td>
                <Td>{row.repaymentMethod}</Td>
                <Td>{row.notes}</Td>
                <Td>{advanceBalance(entries ?? [], row.employeeCode)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
