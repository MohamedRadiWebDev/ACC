'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { liveTransactions, createMatch, suggestMatches } from '@/lib/repo';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';

export default function ReconcilePage() {
  const transactions = useLiveQuery(liveTransactions) ?? [];
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [tolerance, setTolerance] = useState(2);
  const cashCandidates = useMemo(
    () =>
      transactions.filter(
        (t) =>
          t.ledger === 'CASHBOX' &&
          !t.matchId &&
          !t.transferId &&
          (!from || t.date >= from) &&
          (!to || t.date <= to) &&
          (t.description.includes('تحويل') || t.category?.includes('تحويل'))
      ),
    [transactions, from, to]
  );
  const digitalCandidates = useMemo(
    () =>
      transactions.filter(
        (t) =>
          t.ledger === 'DIGITAL' &&
          !t.matchId &&
          !t.transferId &&
          (!from || t.date >= from) &&
          (!to || t.date <= to) &&
          (t.description.includes('تحويل') || t.category?.includes('تحويل'))
      ),
    [transactions, from, to]
  );
  const suggestions = suggestMatches(cashCandidates, digitalCandidates, tolerance);
  const { push } = useToast();
  const [selected, setSelected] = useState<{ cash?: string; digital?: string }>({});

  const matchSelected = async () => {
    if (!selected.cash || !selected.digital) return;
    await createMatch(selected.cash, selected.digital);
    push({ title: 'تمت المطابقة' });
  };

  const unmatchedSummary = useMemo(() => {
    const totalUnmatched = [...cashCandidates, ...digitalCandidates].filter((t) => t.direction === 'OUT').reduce((s, t) => s + t.amount, 0);
    return {
      matchedCount: transactions.filter((t) => t.matchId).length,
      unmatchedCount: cashCandidates.length + digitalCandidates.length,
      totalUnmatched,
    };
  }, [cashCandidates, digitalCandidates, transactions]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">المطابقة</h1>
      <Card>
        <CardHeader>
          <CardTitle>تقرير سريع</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">حركات غير مرتبطة</div>
            <div className="font-bold">{unmatchedSummary.unmatchedCount}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">عدد المطابقات</div>
            <div className="font-bold">{unmatchedSummary.matchedCount}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">إجمالي غير مطابق</div>
            <div className="font-bold">{formatCurrency(unmatchedSummary.totalUnmatched)}</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>اقتراحات تلقائية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap items-center">
            <label className="flex items-center gap-2">
              من
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="flex items-center gap-2">
              إلى
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
            <label className="flex items-center gap-2">
              فارق أيام
              <Input
                type="number"
                className="w-24"
                min={0}
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
              />
            </label>
          </div>
          <Table>
            <THead>
              <Tr>
                <Th>الخزنة</Th>
                <Th>المحفظة</Th>
                <Th>المبلغ</Th>
                <Th></Th>
              </Tr>
            </THead>
            <TBody>
              {suggestions.map((s) => (
                <Tr key={`${s.cash.id}-${s.digital.id}`}>
                  <Td>
                    {s.cash.date} - {s.cash.description}
                  </Td>
                  <Td>
                    {s.digital.date} - {s.digital.description}
                  </Td>
                  <Td>{formatCurrency(s.cash.amount)}</Td>
                  <Td className="flex gap-2">
                    <span className="text-xs text-muted-foreground">الدرجة {s.score.toFixed(1)}</span>
                    <Button size="sm" onClick={() => createMatch(s.cash.id, s.digital.id)}>
                      مطابقة
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>مطابقة يدوية</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">حركات الخزنة</h3>
            {cashCandidates.map((tx) => (
              <div key={tx.id} className={`p-2 border rounded mb-2 ${selected.cash === tx.id ? 'border-primary' : ''}`} onClick={() => setSelected({ ...selected, cash: tx.id })}>
                {tx.date} - {tx.description} - {formatCurrency(tx.amount)}
              </div>
            ))}
          </div>
          <div>
            <h3 className="font-semibold">حركات المحافظ</h3>
            {digitalCandidates.map((tx) => (
              <div key={tx.id} className={`p-2 border rounded mb-2 ${selected.digital === tx.id ? 'border-primary' : ''}`} onClick={() => setSelected({ ...selected, digital: tx.id })}>
                {tx.date} - {tx.description} - {formatCurrency(tx.amount)}
              </div>
            ))}
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={matchSelected}>مطابقة</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
