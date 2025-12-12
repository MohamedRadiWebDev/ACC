'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { liveTransactions, createMatch, suggestMatches } from '@/lib/repo';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

export default function ReconcilePage() {
  const transactions = useLiveQuery(liveTransactions) ?? [];
  const cashCandidates = transactions.filter((t) => t.ledger === 'CASHBOX' && !t.matchId && (t.description.includes('تحويل') || t.category?.includes('تحويل')));
  const digitalCandidates = transactions.filter((t) => t.ledger === 'DIGITAL' && !t.matchId && (t.description.includes('تحويل') || t.category?.includes('تحويل')));
  const suggestions = suggestMatches(cashCandidates, digitalCandidates);
  const { push } = useToast();
  const [selected, setSelected] = useState<{ cash?: string; digital?: string }>({});

  const matchSelected = async () => {
    if (!selected.cash || !selected.digital) return;
    await createMatch(selected.cash, selected.digital);
    push({ title: 'تمت المطابقة' });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">المطابقة</h1>
      <Card>
        <CardHeader>
          <CardTitle>اقتراحات تلقائية</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <Td>{s.cash.date} - {s.cash.description}</Td>
                  <Td>{s.digital.date} - {s.digital.description}</Td>
                  <Td>{formatCurrency(s.cash.amount)}</Td>
                  <Td>
                    <Button size="sm" onClick={() => createMatch(s.cash.id, s.digital.id)}>مطابقة</Button>
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
