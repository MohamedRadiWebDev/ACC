'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { liveAccounts, liveTransactions } from '@/lib/repo';
import { LedgerTable } from '@/components/ledger-table';

const wallets = ['INSTAPAY', 'VODAFONE', 'ETISALAT', 'AMAN', 'FAWRY'];

export default function DigitalPage() {
  const accounts = useLiveQuery(liveAccounts) ?? [];
  const transactions = useLiveQuery(liveTransactions) ?? [];
  const [tab, setTab] = useState('INSTAPAY');
  const account = accounts.find((a) => a.provider === tab);

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
        <LedgerTable accounts={accounts} transactions={transactions} ledger="DIGITAL" openingBalance={account.openingBalance} />
      ) : (
        <p>أنشئ حساب محفظة للمزود المختار.</p>
      )}
    </div>
  );
}
