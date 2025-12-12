'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { liveAccounts, liveTransactions, liveBalanceSnapshots, addBalanceSnapshot, updateBalanceSnapshot, deleteBalanceSnapshot, calculateBalance } from '@/lib/repo';
import { LedgerTable } from '@/components/ledger-table';
import { formatCurrency } from '@/lib/utils';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';

const wallets = ['INSTAPAY', 'VODAFONE', 'ETISALAT', 'AMAN', 'FAWRY'];

export default function DigitalPage() {
  const accounts = useLiveQuery(liveAccounts) ?? [];
  const transactions = useLiveQuery(liveTransactions) ?? [];
  const snapshots = useLiveQuery(liveBalanceSnapshots) ?? [];
  const [tab, setTab] = useState('INSTAPAY');
  const { push } = useToast();
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), actualBalance: '', notes: '', id: '' });
  const account = accounts.find((a) => a.provider === tab);

  const accountTransactions = useMemo(() => (account ? transactions.filter((t) => t.accountId === account.id) : []), [transactions, account]);
  const calculatedBalance = useMemo(
    () => (account ? calculateBalance(account.openingBalance, accountTransactions) : 0),
    [account, accountTransactions]
  );
  const accountSnapshots = account ? snapshots.filter((s) => s.accountId === account.id).sort((a, b) => b.date.localeCompare(a.date)) : [];
  const latestSnapshot = accountSnapshots[0];
  const variance = latestSnapshot ? latestSnapshot.actualBalance - calculatedBalance : 0;

  const schema = z.object({
    date: z.string(),
    actualBalance: z.coerce.number(),
    notes: z.string().optional(),
  });

  const onSaveSnapshot = async () => {
    if (!account) return;
    const parsed = schema.safeParse({ date: form.date, actualBalance: form.actualBalance, notes: form.notes });
    if (!parsed.success) {
      push({ title: 'تحقق من البيانات', description: parsed.error.errors[0].message, variant: 'destructive' });
      return;
    }
    if (form.id) {
      await updateBalanceSnapshot(form.id, parsed.data);
    } else {
      await addBalanceSnapshot({ ...parsed.data, accountId: account.id });
    }
    push({ title: 'تم الحفظ' });
    setForm({ date: new Date().toISOString().slice(0, 10), actualBalance: '', notes: '', id: '' });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">الإدارة الرقمية</h1>
      <Card>
        <CardHeader>
          <CardTitle>المحافظ</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          {wallets.map((w) => (
            <button
              key={w}
              onClick={() => setTab(w)}
              className={`px-3 py-2 rounded border ${tab === w ? 'bg-primary text-white' : ''}`}
            >
              {w}
            </button>
          ))}
        </CardContent>
      </Card>
      {account ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الرصيد الفعلي والفرق</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">الرصيد المحسوب</div>
                <div className="font-bold">{formatCurrency(calculatedBalance)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">آخر رصيد فعلي</div>
                <div className="font-bold">{latestSnapshot ? formatCurrency(latestSnapshot.actualBalance) : 'لا يوجد'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">الفرق</div>
                <div className={`font-bold ${variance === 0 ? '' : variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(variance)}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>تسجيل رصيد فعلي</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-3 gap-2">
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                <Input
                  type="number"
                  placeholder="الرصيد"
                  value={form.actualBalance}
                  onChange={(e) => setForm({ ...form, actualBalance: e.target.value })}
                />
                <Input placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                {form.id && (
                  <Button variant="secondary" onClick={() => setForm({ date: new Date().toISOString().slice(0, 10), actualBalance: '', notes: '', id: '' })}>
                    إلغاء التعديل
                  </Button>
                )}
                <Button onClick={onSaveSnapshot}>حفظ</Button>
              </div>
              <Table>
                <THead>
                  <Tr>
                    <Th>التاريخ</Th>
                    <Th>الرصيد الفعلي</Th>
                    <Th>ملاحظات</Th>
                    <Th></Th>
                  </Tr>
                </THead>
                <TBody>
                  {accountSnapshots.map((s) => (
                    <Tr key={s.id}>
                      <Td>{s.date}</Td>
                      <Td>{formatCurrency(s.actualBalance)}</Td>
                      <Td>{s.notes}</Td>
                      <Td className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setForm({ date: s.date, actualBalance: String(s.actualBalance), notes: s.notes ?? '', id: s.id })}>
                          تعديل
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteBalanceSnapshot(s.id)}>
                          حذف
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
          <LedgerTable accounts={accounts} transactions={transactions} ledger="DIGITAL" openingBalance={account.openingBalance} />
        </div>
      ) : (
        <p>أنشئ حساب محفظة للمزود المختار.</p>
      )}
    </div>
  );
}
