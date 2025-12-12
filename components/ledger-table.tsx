'use client';

import { useMemo, useState } from 'react';
import { Transaction, Account } from '@/lib/types';
import { formatCurrency, runningBalance } from '@/lib/utils';
import { Table, THead, TBody, Tr, Th, Td } from './ui/table';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { createTransaction } from '@/lib/repo';
import { z } from 'zod';
import { useToast } from './ui/use-toast';
import { v4 as uuid } from 'uuid';

const schema = z.object({
  accountId: z.string(),
  date: z.string(),
  direction: z.enum(['IN', 'OUT']),
  amount: z.coerce.number().positive(),
  description: z.string(),
  category: z.string().optional(),
});

export function LedgerTable({
  accounts,
  transactions,
  ledger,
  openingBalance,
  showRunning,
}: {
  accounts: Account[];
  transactions: Transaction[];
  ledger: string;
  openingBalance: number;
  showRunning?: boolean;
}) {
  const [search, setSearch] = useState('');
  const { push } = useToast();
  const [form, setForm] = useState({ accountId: accounts[0]?.id ?? '', date: new Date().toISOString().slice(0, 10), direction: 'IN', amount: 0, description: '', category: '' });

  const filtered = useMemo(
    () =>
      transactions.filter(
        (t) =>
          t.ledger === ledger &&
          (!search || t.description.includes(search) || t.category?.includes(search))
      ),
    [transactions, ledger, search]
  );

  const running = useMemo(() => runningBalance(openingBalance, filtered), [filtered, openingBalance]);

  const onAdd = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      push({ title: 'تحقق من البيانات', description: parsed.error.errors[0].message, type: 'error' });
      return;
    }
    await createTransaction({
      ...parsed.data,
      ledger: ledger as any,
      accountId: parsed.data.accountId,
      matchId: null,
      transferId: null,
      source: 'Manual',
    });
    push({ title: 'تم إضافة الحركة' });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Input placeholder="بحث" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        <div className="flex gap-2">
          <SelectDirection value={form.direction} onChange={(direction) => setForm({ ...form, direction })} />
          <input type="date" className="border rounded px-3 py-2" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <select className="border rounded px-3 py-2" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
            {accounts
              .filter((a) => (ledger === 'DIGITAL' ? a.type === 'WALLET' : a.type !== 'WALLET' || ledger === 'CASHBOX'))
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
          </select>
          <input
            type="number"
            className="border rounded px-3 py-2 w-32"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            min={0}
          />
          <Input placeholder="وصف" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-48" />
          <Input placeholder="تصنيف" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-40" />
          <Button onClick={onAdd}>حفظ الحركة</Button>
        </div>
      </div>
      <Table>
        <THead>
          <Tr>
            <Th>التاريخ</Th>
            <Th>الحساب</Th>
            <Th>الوصف</Th>
            <Th>التصنيف</Th>
            <Th>دخول</Th>
            <Th>خروج</Th>
            {showRunning && <Th>الرصيد</Th>}
          </Tr>
        </THead>
        <TBody>
          {filtered.map((tx) => (
            <Tr key={tx.id}>
              <Td>{tx.date}</Td>
              <Td>{accounts.find((a) => a.id === tx.accountId)?.name}</Td>
              <Td>{tx.description}</Td>
              <Td>{tx.category}</Td>
              <Td>{tx.direction === 'IN' ? formatCurrency(tx.amount) : '-'}</Td>
              <Td>{tx.direction === 'OUT' ? formatCurrency(tx.amount) : '-'}</Td>
              {showRunning && <Td>{formatCurrency(running.find((r) => r.id === tx.id)?.balance ?? 0)}</Td>}
            </Tr>
          ))}
          <Tr>
            <Td colSpan={4}>الإجماليات</Td>
            <Td>{formatCurrency(filtered.filter((t) => t.direction === 'IN').reduce((s, t) => s + t.amount, 0))}</Td>
            <Td>{formatCurrency(filtered.filter((t) => t.direction === 'OUT').reduce((s, t) => s + t.amount, 0))}</Td>
            {showRunning && <Td></Td>}
          </Tr>
        </TBody>
      </Table>
    </div>
  );
}

function SelectDirection({ value, onChange }: { value: string; onChange: (v: 'IN' | 'OUT') => void }) {
  return (
    <select className="border rounded px-3 py-2" value={value} onChange={(e) => onChange(e.target.value as 'IN' | 'OUT')}>
      <option value="IN">وارد</option>
      <option value="OUT">منصرف</option>
    </select>
  );
}
