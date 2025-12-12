'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/ui/card';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { db } from '@/lib/db';

const walletNames = [
  { key: 'INSTAPAY', label: 'InstaPay' },
  { key: 'VODAFONE', label: 'فودافون كاش' },
  { key: 'ETISALAT', label: 'اتصالات' },
  { key: 'AMAN', label: 'أمان' },
  { key: 'FAWRY', label: 'فوري' },
];

export default function DigitalWalletsPage() {
  const snapshots = useLiveQuery(() => db.balanceSnapshots.toArray(), []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">المحافظ الرقمية</h1>
      <Card className="p-4">
        <p className="text-sm text-muted-foreground mb-2">يتم استخدام رصيد فعلي للمقارنة مع الرصيد المحسوب.</p>
        <Table>
          <THead>
            <Tr>
              <Th>المحفظة</Th>
              <Th>آخر رصيد فعلي</Th>
              <Th>ملاحظات</Th>
            </Tr>
          </THead>
          <TBody>
            {walletNames.map((wallet) => {
              const latest = snapshots?.find((s) => s.accountId === wallet.key);
              return (
                <Tr key={wallet.key}>
                  <Td>{wallet.label}</Td>
                  <Td>{latest?.actualBalance ?? 0}</Td>
                  <Td>{latest?.notes}</Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
