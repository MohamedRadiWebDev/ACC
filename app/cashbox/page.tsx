'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { liveAccounts, liveTransactions, liveCashCounts, addCashCount, calculateBalanceUntil } from '@/lib/repo';
import { LedgerTable } from '@/components/ledger-table';
import { formatCurrency, formatVariance } from '@/lib/utils';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function CashboxPage() {
  const accounts = useLiveQuery(liveAccounts) ?? [];
  const transactions = useLiveQuery(liveTransactions) ?? [];
  const cashCounts = useLiveQuery(liveCashCounts) ?? [];
  const { push } = useToast();
  const [showRunning, setShowRunning] = useState(true);
  const [countDate, setCountDate] = useState(new Date().toISOString().slice(0, 10));
  const defaultItems = useMemo(
    () => [200, 100, 50, 20, 10, 5, 1, 0.5, 0.25].map((d) => ({ denomination: d, countFit: 0, countTorn: 0 })),
    []
  );
  const [items, setItems] = useState(defaultItems);
  const countSchema = z.object({
    cashboxAccountId: z.string(),
    date: z.string(),
    items: z
      .array(
        z.object({
          denomination: z.number(),
          countFit: z.coerce.number().min(0),
          countTorn: z.coerce.number().min(0),
        })
      )
      .nonempty(),
  });
  const cashAccount = accounts.find((a) => a.type === 'CASHBOX');
  const accountTx = transactions.filter((t) => t.ledger === 'CASHBOX');
  const lastBalance = useMemo(() => {
    if (!cashAccount) return 0;
    const sorted = [...accountTx].sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)));
    return calculateBalanceUntil(cashAccount.openingBalance, sorted);
  }, [accountTx, cashAccount]);
  const accountCounts = cashAccount ? cashCounts.filter((c) => c.cashboxAccountId === cashAccount.id) : [];
  const lastCount = accountCounts.sort((a, b) => b.date.localeCompare(a.date))[0];
  const diff = lastCount ? lastCount.totalCash - lastBalance : 0;

  const history = useMemo(() => {
    if (!cashAccount) return [] as { date: string; variance: number }[];
    const sortedCounts = [...accountCounts].sort((a, b) => a.date.localeCompare(b.date));
    return sortedCounts.map((count) => {
      const balanceAtDate = calculateBalanceUntil(cashAccount.openingBalance, accountTx, count.date);
      return { date: count.date, variance: count.totalCash - balanceAtDate };
    });
  }, [accountCounts, accountTx, cashAccount]);

  const totalCash = useMemo(
    () => items.reduce((sum, i) => sum + i.denomination * (Number(i.countFit) + Number(i.countTorn)), 0),
    [items]
  );

  const saveCount = async () => {
    if (!cashAccount) return;
    const parsed = countSchema.safeParse({ cashboxAccountId: cashAccount.id, date: countDate, items });
    if (!parsed.success) {
      push({ title: 'تحقق من بيانات الجرد', description: parsed.error.errors[0].message, type: 'error' });
      return;
    }
    await addCashCount(parsed.data);
    push({ title: 'تم حفظ الجرد' });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">الخزنة</h1>
      <Card>
        <CardHeader>
          <CardTitle>الحالة</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-6">
          <div>رصيد آخر حركة: {formatCurrency(lastBalance)}</div>
          <div>أخر جرد: {lastCount ? formatCurrency(lastCount.totalCash) : 'لا يوجد'}</div>
          <div>
            الفارق: {formatCurrency(diff)} ({diff > 0 ? 'زيادة' : diff < 0 ? 'عجز' : 'مطابق'})
          </div>
        </CardContent>
      </Card>
      {cashAccount && (
        <Card>
          <CardHeader>
            <CardTitle>الجرد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <label className="flex items-center gap-2">
                <span>التاريخ</span>
                <Input type="date" value={countDate} onChange={(e) => setCountDate(e.target.value)} className="w-44" />
              </label>
            </div>
            <Table>
              <THead>
                <Tr>
                  <Th>الفئة</Th>
                  <Th>سليم</Th>
                  <Th>مقطوع</Th>
                  <Th>العدد</Th>
                  <Th>القيمة</Th>
                </Tr>
              </THead>
              <TBody>
                {items.map((row, idx) => {
                  const totalCount = Number(row.countFit) + Number(row.countTorn);
                  const amount = totalCount * row.denomination;
                  return (
                    <Tr key={row.denomination}>
                      <Td>{row.denomination}</Td>
                      <Td>
                        <Input
                          type="number"
                          min={0}
                          value={row.countFit}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setItems((prev) => prev.map((r, i) => (i === idx ? { ...r, countFit: value } : r)));
                          }}
                        />
                      </Td>
                      <Td>
                        <Input
                          type="number"
                          min={0}
                          value={row.countTorn}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setItems((prev) => prev.map((r, i) => (i === idx ? { ...r, countTorn: value } : r)));
                          }}
                        />
                      </Td>
                      <Td>{totalCount}</Td>
                      <Td>{formatCurrency(amount)}</Td>
                    </Tr>
                  );
                })}
                <Tr>
                  <Td colSpan={4} className="font-semibold">
                    الإجمالي النقدي
                  </Td>
                  <Td className="font-bold">{formatCurrency(totalCash)}</Td>
                </Tr>
              </TBody>
            </Table>
            <div className="flex justify-end">
              <Button onClick={saveCount}>حفظ الجرد</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>مطابقة الخزنة</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div>رصيد الخزنة آخر حركة: {formatCurrency(lastBalance)}</div>
            <div>أخر جرد: {lastCount ? formatCurrency(lastCount.totalCash) : 'لا يوجد'} </div>
            <div>
              الفارق: {formatCurrency(diff)} - {formatVariance(diff)}
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="variance" fill="#0ea5e9" name="الفرق" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      {cashAccount ? (
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showRunning} onChange={(e) => setShowRunning(e.target.checked)} />
            <span>إظهار رصيد بعد كل سطر</span>
          </label>
          <LedgerTable
            accounts={accounts}
            transactions={transactions}
            ledger="CASHBOX"
            openingBalance={cashAccount.openingBalance}
            showRunning={showRunning}
          />
        </div>
      ) : (
        <p>قم بإنشاء حساب خزنة أولاً</p>
      )}
    </div>
  );
}
