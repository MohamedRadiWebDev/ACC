'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, Tr, Th, TBody, Td } from '@/components/ui/table';
import { arabicMonth, treasuryRunningBalance, bankRunningBalance } from '@/lib/calculations';
import { db } from '@/lib/db';

export default function DashboardPage() {
  const treasury = useLiveQuery(() => db.treasuryTransactions.toArray(), []);
  const banks = useLiveQuery(() => db.bankTransactions.toArray(), []);
  const advances = useLiveQuery(() => db.advanceTransactions.toArray(), []);
  const custody = useLiveQuery(() => db.custodyTransactions.toArray(), []);
  const revenue = useLiveQuery(() => db.revenueInvoices.toArray(), []);

  const totalTreasuryIn = treasury?.reduce((sum, t) => sum + t.inAmount, 0) ?? 0;
  const totalTreasuryOut = treasury?.reduce((sum, t) => sum + t.outAmount, 0) ?? 0;
  const lastBalance = treasury ? treasuryRunningBalance(0, treasury) : 0;
  const bankBalance = bankRunningBalance(0, (banks ?? []).filter((b) => b.bankName === 'BANK_MISR'));

  const activities = [
    ...(treasury ?? []).map((t) => ({ date: t.date, description: t.description, type: 'خزنة' })),
    ...(banks ?? []).map((t) => ({ date: t.date, description: t.description, type: 'بنك' })),
    ...(advances ?? []).map((t) => ({ date: t.date, description: t.employeeName, type: 'سلفة' })),
    ...(custody ?? []).map((t) => ({ date: t.date, description: t.description, type: 'عهدة' })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20);

  const revenueSummary = revenue?.reduce(
    (acc, inv) => {
      acc.months[inv.invoiceMonth] = (acc.months[inv.invoiceMonth] ?? 0) + inv.totalWithVat14;
      return acc;
    },
    { months: {} as Record<string, number> }
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">لوحة التحكم</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>وارد الخزنة</CardTitle>
          </CardHeader>
          <CardContent>{totalTreasuryIn}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>منصرف الخزنة</CardTitle>
          </CardHeader>
          <CardContent>{totalTreasuryOut}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>رصيد الخزنة</CardTitle>
          </CardHeader>
          <CardContent>{lastBalance}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>رصيد بنك مصر</CardTitle>
          </CardHeader>
          <CardContent>{bankBalance}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الأنشطة الأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <Tr>
                <Th>التاريخ</Th>
                <Th>الوصف</Th>
                <Th>المصدر</Th>
              </Tr>
            </THead>
            <TBody>
              {activities.map((row, idx) => (
                <Tr key={idx}>
                  <Td>{row.date}</Td>
                  <Td>{row.description}</Td>
                  <Td>{row.type}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ملخص شهري للإيراد</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <Tr>
                <Th>الشهر</Th>
                <Th>القيمة</Th>
              </Tr>
            </THead>
            <TBody>
              {Object.entries(revenueSummary?.months ?? {}).map(([month, value]) => (
                <Tr key={month}>
                  <Td>{month || arabicMonth(new Date().toISOString().slice(0, 10))}</Td>
                  <Td>{value}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
