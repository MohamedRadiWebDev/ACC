import Dexie, { Table } from 'dexie';
import {
  Account,
  AdvanceTransaction,
  BalanceSnapshot,
  BankTransaction,
  CashCount,
  CustodyTransaction,
  Match,
  RevenueInvoice,
  Transaction,
  Transfer,
  TreasuryCashCount,
  TreasuryTransaction,
} from './types';

export class LedgerDB extends Dexie {
  accounts!: Table<Account, string>;
  transactions!: Table<Transaction, string>;
  transfers!: Table<Transfer, string>;
  matches!: Table<Match, string>;
  cashCounts!: Table<CashCount, string>;
  balanceSnapshots!: Table<BalanceSnapshot, string>;
  treasuryTransactions!: Table<TreasuryTransaction, string>;
  treasuryCounts!: Table<TreasuryCashCount, string>;
  revenueInvoices!: Table<RevenueInvoice, string>;
  bankTransactions!: Table<BankTransaction, string>;
  advanceTransactions!: Table<AdvanceTransaction, string>;
  custodyTransactions!: Table<CustodyTransaction, string>;

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

    this.version(2).stores({
      accounts: 'id, name, type, provider',
      transactions: 'id, accountId, ledger, date, direction, transferId, matchId',
      transfers: 'id, fromAccountId, toAccountId, date',
      matches: 'id, txAId, txBId, createdAt',
      cashCounts: 'id, cashboxAccountId, date',
      balanceSnapshots: 'id, accountId, date',
      treasuryTransactions: 'id, date, approved',
      treasuryCounts: 'id, date',
      revenueInvoices: 'id, customer, invoiceMonth, invoiceDate',
      bankTransactions: 'id, bankName, date',
      advanceTransactions: 'id, employeeCode, date',
      custodyTransactions: 'id, paidTo, date',
    });
  }
}

export const db = new LedgerDB();
