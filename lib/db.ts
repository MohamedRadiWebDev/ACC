import Dexie, { Table } from 'dexie';
import { Account, Transaction, Transfer, Match, CashCount, BalanceSnapshot } from './types';

export class LedgerDB extends Dexie {
  accounts!: Table<Account, string>;
  transactions!: Table<Transaction, string>;
  transfers!: Table<Transfer, string>;
  matches!: Table<Match, string>;
  cashCounts!: Table<CashCount, string>;
  balanceSnapshots!: Table<BalanceSnapshot, string>;

  constructor() {
    super('ledger-db');
    this.version(1).stores({
      accounts: 'id, name, type, provider',
      transactions: 'id, accountId, ledger, date, direction, transferId, matchId',
      transfers: 'id, fromAccountId, toAccountId, date',
      matches: 'id, txAId, txBId, createdAt',
      cashCounts: 'id, cashboxAccountId, date',
      balanceSnapshots: 'id, accountId, date',
    });
  }
}

export const db = new LedgerDB();
