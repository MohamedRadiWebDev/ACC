'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { liveAccounts, liveTransactions } from '@/lib/repo';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useMemo } from 'react';

export default function ReportsPage() {
  const accounts = useLiveQuery(liveAccounts) ?? [];
  const transactions = useLiveQuery(liveTransactions) ?? [];

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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">التقارير والتحليلات</h1>
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
    </div>
  );
}
