'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { computeRevenueDerived, arabicMonth } from '@/lib/calculations';
import { db } from '@/lib/db';
import { RevenueInvoice } from '@/lib/types';
import { z } from 'zod';

const schema = z.object({
  customer: z.string(),
  invoiceDate: z.string(),
  totalWithVat14: z.coerce.number().nonnegative(),
  totalWithoutVat14: z.coerce.number().nonnegative(),
  cairo: z.coerce.number().nonnegative().default(0),
  mansoura: z.coerce.number().nonnegative().default(0),
  legal: z.coerce.number().nonnegative().default(0),
  other: z.coerce.number().nonnegative().default(0),
  vat14: z.coerce.number().nonnegative().default(0),
  tax3: z.coerce.number().nonnegative().default(0),
  requiredToTransfer: z.coerce.number().nonnegative().default(0),
  paidAmount: z.coerce.number().nonnegative().default(0),
  expenses: z.coerce.number().nonnegative().default(0),
  dueAmount: z.coerce.number().nonnegative().default(0),
  dueDate: z.string(),
  paymentTerm: z.string().default(''),
  paidDate: z.string().optional(),
  actualRevenueMinus14: z.coerce.number().nonnegative().default(0),
  notes: z.string().optional(),
});

export default function RevenuePage() {
  const { push } = useToast();
  const [form, setForm] = useState({
    customer: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    totalWithVat14: 0,
    totalWithoutVat14: 0,
    cairo: 0,
    mansoura: 0,
    legal: 0,
    other: 0,
    vat14: 0,
    tax3: 0,
    requiredToTransfer: 0,
    paidAmount: 0,
    expenses: 0,
    dueAmount: 0,
    dueDate: new Date().toISOString().slice(0, 10),
    paymentTerm: '',
    paidDate: '',
    actualRevenueMinus14: 0,
    notes: '',
  });

  const invoices = useLiveQuery(() => db.revenueInvoices.toArray(), []);

  async function save() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      push({ title: 'خطأ', description: parsed.error.errors.map((e) => e.message).join('\n'), variant: 'destructive' });
      return;
    }
    const base: RevenueInvoice = {
      ...parsed.data,
      invoiceMonth: arabicMonth(parsed.data.invoiceDate),
      eligibility: 'غير مستحق',
      delayDays: 0,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    const derived = computeRevenueDerived(base);
    await db.revenueInvoices.add({ ...base, ...derived });
    push({ title: 'تم الحفظ' });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">الايراد</h1>
      <Card className="p-4 space-y-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} placeholder="العميل" />
          <Input value={form.invoiceDate} type="date" onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} />
          <Input value={form.totalWithVat14} type="number" onChange={(e) => setForm({ ...form, totalWithVat14: Number(e.target.value) })} placeholder="الاجمالي بالضريبة" />
          <Input value={form.totalWithoutVat14} type="number" onChange={(e) => setForm({ ...form, totalWithoutVat14: Number(e.target.value) })} placeholder="الاجمالي بدون الضريبة" />
          <Input value={form.cairo} type="number" onChange={(e) => setForm({ ...form, cairo: Number(e.target.value) })} placeholder="القاهرة" />
          <Input value={form.mansoura} type="number" onChange={(e) => setForm({ ...form, mansoura: Number(e.target.value) })} placeholder="المنصورة" />
          <Input value={form.legal} type="number" onChange={(e) => setForm({ ...form, legal: Number(e.target.value) })} placeholder="القانونية" />
          <Input value={form.other} type="number" onChange={(e) => setForm({ ...form, other: Number(e.target.value) })} placeholder="أخري" />
          <Input value={form.vat14} type="number" onChange={(e) => setForm({ ...form, vat14: Number(e.target.value) })} placeholder="14%" />
          <Input value={form.tax3} type="number" onChange={(e) => setForm({ ...form, tax3: Number(e.target.value) })} placeholder="3%" />
          <Input value={form.requiredToTransfer} type="number" onChange={(e) => setForm({ ...form, requiredToTransfer: Number(e.target.value) })} placeholder="المطلوب تحويله" />
          <Input value={form.paidAmount} type="number" onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) })} placeholder="المبلغ المسدد" />
          <Input value={form.expenses} type="number" onChange={(e) => setForm({ ...form, expenses: Number(e.target.value) })} placeholder="مصروفات" />
          <Input value={form.dueAmount} type="number" onChange={(e) => setForm({ ...form, dueAmount: Number(e.target.value) })} placeholder="المستحق" />
          <Input value={form.dueDate} type="date" onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Input value={form.paymentTerm} onChange={(e) => setForm({ ...form, paymentTerm: e.target.value })} placeholder="Payment term" />
          <Input value={form.paidDate} type="date" onChange={(e) => setForm({ ...form, paidDate: e.target.value })} placeholder="تاريخ السداد" />
          <Input value={form.actualRevenueMinus14} type="number" onChange={(e) => setForm({ ...form, actualRevenueMinus14: Number(e.target.value) })} placeholder="الايراد الفعلي -14%" />
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات" />
        </div>
        <Button onClick={save}>حفظ</Button>
      </Card>

      <Card className="p-4">
        <Table>
          <THead>
            <Tr>
              <Th>العميل</Th>
              <Th>الشهر</Th>
              <Th>تاريخ اصدار الفاتورة</Th>
              <Th>الاجمالي بالضريبه 14%</Th>
              <Th>الاجمالي بدون الضريبه14%</Th>
              <Th>القاهرة</Th>
              <Th>المنصورة</Th>
              <Th>القانونيه</Th>
              <Th>اخري</Th>
              <Th>14%</Th>
              <Th>3%</Th>
              <Th>المطلوب تحويله</Th>
              <Th>المبلغ المسدد</Th>
              <Th>مصروفات</Th>
              <Th>المستحق</Th>
              <Th>تاريخ الاستحقاق</Th>
              <Th>payment term</Th>
              <Th>الاستحقاق</Th>
              <Th>التاخير</Th>
              <Th>تاريخ السداد</Th>
              <Th>الايراد الفعلي -14%</Th>
            </Tr>
          </THead>
          <TBody>
            {invoices?.map((inv) => (
              <Tr key={inv.id}>
                <Td>{inv.customer}</Td>
                <Td>{inv.invoiceMonth}</Td>
                <Td>{inv.invoiceDate}</Td>
                <Td>{inv.totalWithVat14}</Td>
                <Td>{inv.totalWithoutVat14}</Td>
                <Td>{inv.cairo}</Td>
                <Td>{inv.mansoura}</Td>
                <Td>{inv.legal}</Td>
                <Td>{inv.other}</Td>
                <Td>{inv.vat14}</Td>
                <Td>{inv.tax3}</Td>
                <Td>{inv.requiredToTransfer}</Td>
                <Td>{inv.paidAmount}</Td>
                <Td>{inv.expenses}</Td>
                <Td>{inv.dueAmount}</Td>
                <Td>{inv.dueDate}</Td>
                <Td>{inv.paymentTerm}</Td>
                <Td>{inv.eligibility}</Td>
                <Td>{inv.delayDays}</Td>
                <Td>{inv.paidDate}</Td>
                <Td>{inv.actualRevenueMinus14}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
