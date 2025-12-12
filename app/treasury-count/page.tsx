'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { db } from '@/lib/db';
import { TreasuryCashCount } from '@/lib/types';

const denominations = [200, 100, 50, 20, 10, 5, 1, 0.5, 0.25];

export default function TreasuryCountPage() {
  const { push } = useToast();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [counts, setCounts] = useState<Record<number, number>>(
    Object.fromEntries(denominations.map((d) => [d, 0])) as Record<number, number>
  );

  const previous = useLiveQuery(() => db.treasuryCounts.orderBy('date').reverse().toArray(), []);
  const ledgerBalance = useLiveQuery(async () => {
    const txs = await db.treasuryTransactions.toArray();
    return txs.reduce((acc, tx) => acc + tx.inAmount - tx.outAmount, 0);
  }, []);

  const totalCash = useMemo(
    () => denominations.reduce((sum, d) => sum + d * (counts[d] ?? 0), 0),
    [counts]
  );

  async function save() {
    const entry: TreasuryCashCount = {
      id: uuid(),
      date,
      items: denominations.map((d) => ({ denomination: d, count: counts[d] ?? 0 })),
      totalCash,
      createdAt: new Date().toISOString(),
    };
    await db.treasuryCounts.put(entry);
    push({ title: 'تم حفظ الجرد' });
  }

  const lastCount = previous?.[0];
  const difference = (lastCount?.totalCash ?? 0) - (ledgerBalance ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">جرد الخزينة</h1>
        <div className="text-sm text-muted-foreground">حساب الزيادة/العجز تلقائيًا</div>
      </div>
      <Card className="p-4 space-y-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="col-span-2 md:col-span-1 flex items-center gap-2 text-sm">
            <div>رصيد آخر حركة:</div>
            <div className="font-semibold">{ledgerBalance ?? 0}</div>
          </div>
          <div className="col-span-2 md:col-span-1 flex items-center gap-2 text-sm">
            <div>آخر جرد:</div>
            <div className="font-semibold">{lastCount?.totalCash ?? 0}</div>
          </div>
        </div>
        <div className="overflow-auto">
          <Table>
            <THead>
              <Tr>
                <Th>الفئة</Th>
                <Th>العدد</Th>
                <Th>القيمة</Th>
              </Tr>
            </THead>
            <TBody>
              {denominations.map((d) => (
                <Tr key={d}>
                  <Td>{d}</Td>
                  <Td>
                    <Input
                      type="number"
                      value={counts[d] ?? 0}
                      onChange={(e) => setCounts({ ...counts, [d]: Number(e.target.value) })}
                    />
                  </Td>
                  <Td>{(counts[d] ?? 0) * d}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </div>
        <div className="flex items-center justify-between">
          <div className="font-semibold">الإجمالي النقدي: {totalCash}</div>
          <Button onClick={save}>حفظ الجرد</Button>
        </div>
      </Card>

      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">مطابقة الخزنة</h2>
        <div className="flex gap-4 text-sm">
          <div>رصيد الدفتر: {ledgerBalance ?? 0}</div>
          <div>آخر جرد: {lastCount?.totalCash ?? 0}</div>
          <div>
            الفارق: {difference} — {difference > 0 ? 'زيادة' : difference < 0 ? 'عجز' : 'مطابق'}
          </div>
        </div>
        <div className="overflow-auto">
          <Table>
            <THead>
              <Tr>
                <Th>التاريخ</Th>
                <Th>الإجمالي</Th>
                <Th>الفارق</Th>
                <Th>الحالة</Th>
              </Tr>
            </THead>
            <TBody>
              {previous?.map((row) => {
                const diff = row.totalCash - (ledgerBalance ?? 0);
                return (
                  <Tr key={row.id}>
                    <Td>{row.date}</Td>
                    <Td>{row.totalCash}</Td>
                    <Td>{diff}</Td>
                    <Td>{diff > 0 ? 'زيادة' : diff < 0 ? 'عجز' : 'مطابق'}</Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
