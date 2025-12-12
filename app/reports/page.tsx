'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { liveAccounts, liveTransactions, liveBalanceSnapshots } from '@/lib/repo';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useMemo, useState } from 'react';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

export default function ReportsPage() {
  const accounts = useLiveQuery(liveAccounts) ?? [];
  const transactions = useLiveQuery(liveTransactions) ?? [];
  const snapshots = useLiveQuery(liveBalanceSnapshots) ?? [];
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const monthly = useMemo(() => {
    const groups: Record<string, { month: string; in: number; out: number }> = {};
    transactions.forEach((tx) => {
      const month = tx.date.slice(0, 7);
      if (!groups[month]) groups[month] = { month, in: 0, out: 0 };
      if (tx.direction === 'IN') groups[month].in += tx.amount;
      else groups[month].out += tx.amount;
    });
    return Object.values(groups);
  }, [transactions]);

  const categories = useMemo(() => {
    const groups: Record<string, number> = {};
    transactions
      .filter((t) => t.direction === 'OUT' && t.category)
      .forEach((tx) => {
        groups[tx.category!] = (groups[tx.category!] || 0) + tx.amount;
      });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const balances = accounts.map((acc) => {
    const tx = transactions.filter((t) => t.accountId === acc.id);
    const balance = tx.reduce((s, t) => (t.direction === 'IN' ? s + t.amount : s - t.amount), acc.openingBalance);
    return { name: acc.name, balance };
  });

  const walletVariance = useMemo(() => {
    const wallets = accounts.filter((a) => a.type === 'WALLET');
    return wallets.map((acc) => {
      const tx = transactions.filter((t) => t.accountId === acc.id);
      const calculated = tx.reduce((s, t) => (t.direction === 'IN' ? s + t.amount : s - t.amount), acc.openingBalance);
      const latest = snapshots.filter((s) => s.accountId === acc.id).sort((a, b) => b.date.localeCompare(a.date))[0];
      const variance = latest ? latest.actualBalance - calculated : 0;
      return { account: acc.name, calculated, actual: latest?.actualBalance ?? 0, variance };
    });
  }, [accounts, transactions, snapshots]);

  const candidateTransfers = useMemo(
    () =>
      transactions.filter(
        (t) =>
          (t.description.includes('تحويل') || t.category?.includes('تحويل')) &&
          (!from || t.date >= from) &&
          (!to || t.date <= to)
      ),
    [transactions, from, to]
  );

  const unmatchedTransfers = candidateTransfers.filter((t) => !t.matchId && !t.transferId);

  const matchByMonth = useMemo(() => {
    const stats: Record<string, { matched: number; unmatched: number; amount: number }> = {};
    candidateTransfers.forEach((tx) => {
      const key = tx.date.slice(0, 7);
      if (!stats[key]) stats[key] = { matched: 0, unmatched: 0, amount: 0 };
      if (tx.matchId || tx.transferId) stats[key].matched += 1;
      else {
        stats[key].unmatched += 1;
        if (tx.direction === 'OUT') stats[key].amount += tx.amount;
      }
    });
    return Object.entries(stats).map(([month, data]) => ({ month, ...data }));
  }, [candidateTransfers]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">التقارير والتحليلات</h1>
      <Card>
        <CardHeader>
          <CardTitle>فلاتر</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2">
            من
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="flex items-center gap-2">
            إلى
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>التدفقات الشهرية</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="in" stackId="a" fill="#16a34a" name="وارد" />
              <Bar dataKey="out" stackId="a" fill="#ef4444" name="منصرف" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>مصروفات حسب التصنيف</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categories} dataKey="value" nameKey="name" outerRadius={90} label>
                {categories.map((entry, index) => (
                  <Cell key={entry.name} fill={['#0ea5e9', '#8b5cf6', '#f97316', '#10b981'][index % 4]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>أرصدة الحسابات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {balances.map((b) => (
            <div key={b.name} className="flex justify-between border-b pb-1">
              <span>{b.name}</span>
              <span>{formatCurrency(b.balance)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>فروقات المحافظ</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <Tr>
                <Th>المحفظة</Th>
                <Th>محسوب</Th>
                <Th>فعلي</Th>
                <Th>فرق</Th>
              </Tr>
            </THead>
            <TBody>
              {walletVariance.map((row) => (
                <Tr key={row.account} className={row.variance !== 0 ? 'bg-amber-50' : ''}>
                  <Td>{row.account}</Td>
                  <Td>{formatCurrency(row.calculated)}</Td>
                  <Td>{row.actual ? formatCurrency(row.actual) : 'لا يوجد'}</Td>
                  <Td className={row.variance !== 0 ? 'text-red-600 font-semibold' : ''}>{formatCurrency(row.variance)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>تحويلات غير مكتملة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">الحركات التي تبدو كتحويلات بدون Match أو Transfer ID</div>
          <Table>
            <THead>
              <Tr>
                <Th>التاريخ</Th>
                <Th>الحساب</Th>
                <Th>الوصف</Th>
                <Th>المبلغ</Th>
              </Tr>
            </THead>
            <TBody>
              {unmatchedTransfers.map((tx) => (
                <Tr key={tx.id}>
                  <Td>{tx.date}</Td>
                  <Td>{accounts.find((a) => a.id === tx.accountId)?.name}</Td>
                  <Td>{tx.description}</Td>
                  <Td>{formatCurrency(tx.amount)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>مطابقة التحويلات حسب الشهر</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={matchByMonth}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area dataKey="matched" stackId="a" stroke="#22c55e" fill="#bbf7d0" name="تمت مطابقتها" />
              <Area dataKey="unmatched" stackId="a" stroke="#f97316" fill="#fed7aa" name="غير مطابق" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>إجمالي غير مطابق</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-bold">{formatCurrency(matchByMonth.reduce((s, m) => s + m.amount, 0))}</div>
        </CardContent>
      </Card>
    </div>
  );
}
