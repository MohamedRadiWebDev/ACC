'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, Tr, Th, TBody, Td } from '@/components/ui/table';
import { liveAccounts, liveTransactions, calculateBalance } from '@/lib/repo';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const accounts = useLiveQuery(liveAccounts) ?? [];
  const transactions = useLiveQuery(liveTransactions) ?? [];
  const balances = accounts.map((account) => {
    const tx = transactions.filter((t) => t.accountId === account.id);
    return { account, balance: calculateBalance(account.openingBalance, tx) };
  });
  const totalIn = transactions.filter((t) => t.direction === 'IN').reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => t.direction === 'OUT').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">لوحة المعلومات</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>إجمالي المقبوضات</CardTitle>
          </CardHeader>
          <CardContent>{formatCurrency(totalIn)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>إجمالي المدفوعات</CardTitle>
          </CardHeader>
          <CardContent>{formatCurrency(totalOut)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>صافي التدفق</CardTitle>
          </CardHeader>
          <CardContent>{formatCurrency(totalIn - totalOut)}</CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>أرصدة الحسابات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <Tr>
                <Th>الحساب</Th>
                <Th>النوع</Th>
                <Th>الرصيد</Th>
              </Tr>
            </THead>
            <TBody>
              {balances.map(({ account, balance }) => (
                <Tr key={account.id}>
                  <Td>{account.name}</Td>
                  <Td>{account.type}</Td>
                  <Td>{formatCurrency(balance)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
