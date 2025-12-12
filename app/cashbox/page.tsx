'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { liveAccounts, liveTransactions, liveCashCounts } from '@/lib/repo';
import { LedgerTable } from '@/components/ledger-table';
import { formatCurrency } from '@/lib/utils';

export default function CashboxPage() {
  const accounts = useLiveQuery(liveAccounts) ?? [];
  const transactions = useLiveQuery(liveTransactions) ?? [];
  const cashCounts = useLiveQuery(liveCashCounts) ?? [];
  const cashAccount = accounts.find((a) => a.type === 'CASHBOX');
  const accountTx = transactions.filter((t) => t.ledger === 'CASHBOX');
  const lastBalance = useMemo(() => {
    if (!cashAccount) return 0;
    const sorted = accountTx.sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)));
    let bal = cashAccount.openingBalance;
    sorted.forEach((tx) => {
      bal = tx.direction === 'IN' ? bal + tx.amount : bal - tx.amount;
    });
    return bal;
  }, [accountTx, cashAccount]);
  const lastCount = cashCounts.sort((a, b) => b.date.localeCompare(a.date))[0];
  const diff = lastCount ? lastCount.totalCash - lastBalance : 0;

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
      {cashAccount ? (
        <LedgerTable accounts={accounts} transactions={transactions} ledger="CASHBOX" openingBalance={cashAccount.openingBalance} showRunning />
      ) : (
        <p>قم بإنشاء حساب خزنة أولاً</p>
      )}
    </div>
  );
}
