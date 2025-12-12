'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { treasuryBalanceAfter, arabicDay, arabicMonth } from '@/lib/calculations';
import { db } from '@/lib/db';
import { TreasuryTransaction } from '@/lib/types';
import { z } from 'zod';

const treasurySchema = z
  .object({
    date: z.string().min(1),
    description: z.string().default(''),
    payeeCompany: z.string().default(''),
    invoiceNo: z.string().default(''),
    employeeCode: z.string().default(''),
    employeeName: z.string().default(''),
    department: z.string().default(''),
    branch: z.string().default(''),
    expenseType: z.string().default(''),
    receiptOutNo: z.string().default(''),
    receiptInNo: z.string().default(''),
    approved: z.boolean().default(false),
    notes: z.string().optional(),
    inAmount: z.coerce.number().nonnegative(),
    outAmount: z.coerce.number().nonnegative(),
  })
  .refine((data) => (data.inAmount > 0) !== (data.outAmount > 0), {
    message: 'يجب أن يكون أحد الوارد أو المنصرف أكبر من صفر',
    path: ['inAmount'],
  });

export default function TreasuryPage() {
  const { push } = useToast();
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '',
    payeeCompany: '',
    invoiceNo: '',
    employeeCode: '',
    employeeName: '',
    department: '',
    branch: '',
    expenseType: '',
    receiptOutNo: '',
    receiptInNo: '',
    approved: false,
    notes: '',
    inAmount: 0,
    outAmount: 0,
  });

  const transactions = useLiveQuery(() => db.treasuryTransactions.toArray(), []);

  const derived = useMemo(() => {
    if (!transactions) return [];
    const mapped = transactions.map((t) => ({ ...t, dayName: arabicDay(t.date), monthName: arabicMonth(t.date) }));
    return treasuryBalanceAfter(0, mapped).map((t) => ({ ...t, dayName: arabicDay(t.date), monthName: arabicMonth(t.date) }));
  }, [transactions]);

  async function addTransaction() {
    const result = treasurySchema.safeParse(form);
    if (!result.success) {
      push({ title: 'خطأ في الإدخال', description: result.error.errors.map((e) => e.message).join('\n'), variant: 'destructive' });
      return;
    }
    const entry: TreasuryTransaction = {
      ...result.data,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    await db.treasuryTransactions.add(entry);
    push({ title: 'تم الحفظ' });
    setForm((prev) => ({ ...prev, description: '', payeeCompany: '', invoiceNo: '', inAmount: 0, outAmount: 0 }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الخزنة</h1>
        <div className="text-sm text-muted-foreground">جميع الحقول باللغة العربية واتجاه RTL</div>
      </div>
      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">إضافة حركة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} type="date" placeholder="التاريخ" />
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="البيان" />
          <Input value={form.payeeCompany} onChange={(e) => setForm({ ...form, payeeCompany: e.target.value })} placeholder="اسم الشركة المنصرف لها" />
          <Input value={form.invoiceNo} onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })} placeholder="رقم الفاتورة" />
          <Input value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} placeholder="كود موظف" />
          <Input value={form.employeeName} onChange={(e) => setForm({ ...form, employeeName: e.target.value })} placeholder="اسم الموظف" />
          <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="القسم" />
          <Input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="الفرع" />
          <Input value={form.expenseType} onChange={(e) => setForm({ ...form, expenseType: e.target.value })} placeholder="نوع المصروف" />
          <Input value={form.receiptOutNo} onChange={(e) => setForm({ ...form, receiptOutNo: e.target.value })} placeholder="رقم إيصال الصرف" />
          <Input value={form.receiptInNo} onChange={(e) => setForm({ ...form, receiptInNo: e.target.value })} placeholder="رقم إيصال استلام" />
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات" />
          <Input
            value={form.inAmount}
            onChange={(e) => setForm({ ...form, inAmount: Number(e.target.value) })}
            placeholder="الوارد"
            type="number"
          />
          <Input
            value={form.outAmount}
            onChange={(e) => setForm({ ...form, outAmount: Number(e.target.value) })}
            placeholder="المنصرف"
            type="number"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.approved}
              onChange={(e) => setForm({ ...form, approved: e.target.checked })}
              className="h-4 w-4"
            />
            اعتماد
          </label>
          <Button onClick={addTransaction}>حفظ</Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">جدول الحركات</h2>
          <div className="text-sm text-muted-foreground">يتم حساب الرصيد الجاري تلقائيًا</div>
        </div>
        <div className="overflow-auto">
          <Table>
            <THead>
              <Tr>
                <Th>التاريخ</Th>
                <Th>اليوم</Th>
                <Th>الشهر</Th>
                <Th>البيان</Th>
                <Th>اسم الشركة المنصرف لها</Th>
                <Th>رقم الفاتورة</Th>
                <Th>كود موظف</Th>
                <Th>اسم الموظف</Th>
                <Th>القسم</Th>
                <Th>الفرع</Th>
                <Th>نوع المصروف</Th>
                <Th>رقم إيصال الصرف</Th>
                <Th>رقم إيصال استلام</Th>
                <Th>اعتماد</Th>
                <Th>ملاحظات</Th>
                <Th>الوارد</Th>
                <Th>المنصرف</Th>
                <Th>الرصيد</Th>
              </Tr>
            </THead>
            <TBody>
              {derived?.map((tx) => (
                <Tr key={tx.id}>
                  <Td>{tx.date}</Td>
                  <Td>{tx.dayName}</Td>
                  <Td>{tx.monthName}</Td>
                  <Td>{tx.description}</Td>
                  <Td>{tx.payeeCompany}</Td>
                  <Td>{tx.invoiceNo}</Td>
                  <Td>{tx.employeeCode}</Td>
                  <Td>{tx.employeeName}</Td>
                  <Td>{tx.department}</Td>
                  <Td>{tx.branch}</Td>
                  <Td>{tx.expenseType}</Td>
                  <Td>{tx.receiptOutNo}</Td>
                  <Td>{tx.receiptInNo}</Td>
                  <Td>{tx.approved ? '✓' : ''}</Td>
                  <Td>{tx.notes}</Td>
                  <Td>{tx.inAmount}</Td>
                  <Td>{tx.outAmount}</Td>
                  <Td>{tx.runningBalance}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
