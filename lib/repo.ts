'use client';

import { db } from './db';
import {
  Account,
  AdvanceTransaction,
  CashCount,
  BalanceSnapshot,
  BankTransaction,
  CustodyTransaction,
  LedgerType,
  Match,
  RevenueInvoice,
  Transaction,
  Transfer,
  TreasuryCashCount,
  TreasuryTransaction,
} from './types';
import { v4 as uuid } from 'uuid';

export const liveAccounts = () => db.accounts.toArray();
export const liveTransactions = () => db.transactions.toArray();
export const liveTransfers = () => db.transfers.toArray();
export const liveMatches = () => db.matches.toArray();
export const liveCashCounts = () => db.cashCounts.toArray();
export const liveBalanceSnapshots = () => db.balanceSnapshots.toArray();
export const liveTreasury = () => db.treasuryTransactions.toArray();
export const liveTreasuryCounts = () => db.treasuryCounts.toArray();
export const liveRevenueInvoices = () => db.revenueInvoices.toArray();
export const liveBankTransactions = () => db.bankTransactions.toArray();
export const liveAdvanceTransactions = () => db.advanceTransactions.toArray();
export const liveCustodyTransactions = () => db.custodyTransactions.toArray();

export async function createAccount(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  const account: Account = { ...data, id: uuid(), createdAt: now, updatedAt: now };
  await db.accounts.add(account);
  return account;
}

export async function updateAccount(id: string, patch: Partial<Account>) {
  await db.accounts.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteAccount(id: string) {
  await db.accounts.delete(id);
  const relatedTx = await db.transactions.where({ accountId: id }).toArray();
  await db.transactions.bulkDelete(relatedTx.map((t) => t.id));
}

export async function createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  const tx: Transaction = { ...data, id: uuid(), createdAt: now, updatedAt: now };
  await db.transactions.add(tx);
  return tx;
}

export async function updateTransaction(id: string, patch: Partial<Transaction>) {
  await db.transactions.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteTransaction(id: string) {
  await db.transactions.delete(id);
}

export async function createTransfer(data: Omit<Transfer, 'id' | 'createdAt'>) {
  const now = new Date().toISOString();
  const transfer: Transfer = { ...data, id: uuid(), createdAt: now };
  await db.transaction('rw', db.transfers, db.transactions, async () => {
    await db.transfers.add(transfer);
    const fromAccount = await db.accounts.get(data.fromAccountId);
    const toAccount = await db.accounts.get(data.toAccountId);
    if (!fromAccount || !toAccount) throw new Error('الحساب غير موجود');
    await createTransaction({
      accountId: fromAccount.id,
      ledger: fromAccount.type === 'WALLET' ? 'DIGITAL' : fromAccount.type,
      date: data.date,
      direction: 'OUT',
      amount: data.amount,
      description: data.description,
      transferId: transfer.id,
      matchId: null,
      source: 'Transfer',
    });
    await createTransaction({
      accountId: toAccount.id,
      ledger: toAccount.type === 'WALLET' ? 'DIGITAL' : toAccount.type,
      date: data.date,
      direction: 'IN',
      amount: data.amount,
      description: data.description,
      transferId: transfer.id,
      matchId: null,
      source: 'Transfer',
    });
  });
  return transfer;
}

export async function createMatch(txAId: string, txBId: string) {
  const match: Match = { id: uuid(), txAId, txBId, createdAt: new Date().toISOString() };
  await db.transaction('rw', db.matches, db.transactions, async () => {
    await db.matches.add(match);
    await db.transactions.update(txAId, { matchId: match.id });
    await db.transactions.update(txBId, { matchId: match.id });
  });
  return match;
}

export async function addCashCount(data: Omit<CashCount, 'id' | 'createdAt' | 'totalCash'>) {
  const totalCash = data.items.reduce((sum, item) => sum + item.denomination * (item.countFit + item.countTorn), 0);
  const entry: CashCount = { ...data, id: uuid(), totalCash, createdAt: new Date().toISOString() };
  const existing = await db.cashCounts.where({ cashboxAccountId: data.cashboxAccountId, date: data.date }).first();
  if (existing) {
    await db.cashCounts.update(existing.id, { ...entry, id: existing.id, createdAt: existing.createdAt });
    return { ...entry, id: existing.id, createdAt: existing.createdAt };
  }
  await db.cashCounts.add(entry);
  return entry;
}

export async function addBalanceSnapshot(data: Omit<BalanceSnapshot, 'id' | 'createdAt'>) {
  const entry: BalanceSnapshot = { ...data, id: uuid(), createdAt: new Date().toISOString() };
  await db.balanceSnapshots.add(entry);
  return entry;
}

export async function updateBalanceSnapshot(id: string, patch: Partial<BalanceSnapshot>) {
  await db.balanceSnapshots.update(id, patch);
}

export async function deleteBalanceSnapshot(id: string) {
  await db.balanceSnapshots.delete(id);
}

export async function seedDemo() {
  await db.transaction(
    'rw',
    [db.accounts, db.transactions, db.transfers, db.matches, db.cashCounts, db.balanceSnapshots],
    async () => {
      await db.accounts.clear();
      await db.transactions.clear();
      await db.transfers.clear();
      await db.matches.clear();
      await db.cashCounts.clear();
      await db.balanceSnapshots.clear();
    }
  );
}

export function calculateBalance(openingBalance: number, transactions: Transaction[]) {
  return transactions.reduce((acc, tx) => (tx.direction === 'IN' ? acc + tx.amount : acc - tx.amount), openingBalance);
}

export function calculateBalanceUntil(openingBalance: number, transactions: Transaction[], untilDate?: string) {
  const filtered = untilDate
    ? transactions.filter((t) => t.date <= untilDate).sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)))
    : transactions;
  return calculateBalance(openingBalance, filtered);
}

export function balanceAfterTransaction(openingBalance: number, transactions: Transaction[], targetId: string) {
  let running = openingBalance;
  for (const tx of transactions.sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)))) {
    running = tx.direction === 'IN' ? running + tx.amount : running - tx.amount;
    if (tx.id === targetId) return running;
  }
  return running;
}

export function suggestMatches(cashTx: Transaction[], digitalTx: Transaction[], toleranceDays = 2) {
  const suggestions: { cash: Transaction; digital: Transaction; score: number }[] = [];
  cashTx.forEach((c) => {
    digitalTx.forEach((d) => {
      const days = Math.abs(new Date(c.date).getTime() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24);
      if (c.amount === d.amount && c.direction !== d.direction && days <= toleranceDays) {
        let score = 1;
        if (c.description && d.description && c.description.includes('تحويل') && d.description.includes('تحويل')) score += 1;
        if (c.description && d.description && d.description.includes(c.description.slice(0, 5))) score += 0.5;
        score += Math.max(0, toleranceDays - days);
        suggestions.push({ cash: c, digital: d, score });
      }
    });
  });
  return suggestions.sort((a, b) => b.score - a.score);
}

export async function exportAll(): Promise<string> {
  const [
    accounts,
    transactions,
    transfers,
    matches,
    cashCounts,
    balanceSnapshots,
    treasuryTransactions,
    treasuryCounts,
    revenueInvoices,
    bankTransactions,
    advanceTransactions,
    custodyTransactions,
  ] = await Promise.all([
    db.accounts.toArray(),
    db.transactions.toArray(),
    db.transfers.toArray(),
    db.matches.toArray(),
    db.cashCounts.toArray(),
    db.balanceSnapshots.toArray(),
    db.treasuryTransactions.toArray(),
    db.treasuryCounts.toArray(),
    db.revenueInvoices.toArray(),
    db.bankTransactions.toArray(),
    db.advanceTransactions.toArray(),
    db.custodyTransactions.toArray(),
  ]);
  return JSON.stringify(
    {
      accounts,
      transactions,
      transfers,
      matches,
      cashCounts,
      balanceSnapshots,
      treasuryTransactions,
      treasuryCounts,
      revenueInvoices,
      bankTransactions,
      advanceTransactions,
      custodyTransactions,
    },
    null,
    2
  );
}

export async function importJson(payload: any, mode: 'replace' | 'merge' = 'merge') {
  const {
    accounts = [],
    transactions = [],
    transfers = [],
    matches = [],
    cashCounts = [],
    balanceSnapshots = [],
    treasuryTransactions = [],
    treasuryCounts = [],
    revenueInvoices = [],
    bankTransactions = [],
    advanceTransactions = [],
    custodyTransactions = [],
  } = payload || {};
  const tables = [
    db.accounts,
    db.transactions,
    db.transfers,
    db.matches,
    db.cashCounts,
    db.balanceSnapshots,
    db.treasuryTransactions,
    db.treasuryCounts,
    db.revenueInvoices,
    db.bankTransactions,
    db.advanceTransactions,
    db.custodyTransactions,
  ];
  if (mode === 'replace') {
    await db.transaction('rw', tables, async () => {
      await Promise.all(tables.map((table) => table.clear()));
    });
  }
  await db.transaction('rw', tables, async () => {
    if (accounts.length) await db.accounts.bulkPut(accounts);
    if (transactions.length) await db.transactions.bulkPut(transactions);
    if (transfers.length) await db.transfers.bulkPut(transfers);
    if (matches.length) await db.matches.bulkPut(matches);
    if (cashCounts.length) await db.cashCounts.bulkPut(cashCounts);
    if (balanceSnapshots.length) await db.balanceSnapshots.bulkPut(balanceSnapshots);
    if (treasuryTransactions.length) await db.treasuryTransactions.bulkPut(treasuryTransactions);
    if (treasuryCounts.length) await db.treasuryCounts.bulkPut(treasuryCounts);
    if (revenueInvoices.length) await db.revenueInvoices.bulkPut(revenueInvoices);
    if (bankTransactions.length) await db.bankTransactions.bulkPut(bankTransactions);
    if (advanceTransactions.length) await db.advanceTransactions.bulkPut(advanceTransactions);
    if (custodyTransactions.length) await db.custodyTransactions.bulkPut(custodyTransactions);
  });
}

export async function upsertTreasuryTransaction(entry: Omit<TreasuryTransaction, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) {
  const now = new Date().toISOString();
  const tx: TreasuryTransaction = {
    ...entry,
    id: entry.id ?? uuid(),
    createdAt: entry.id ? entry.createdAt ?? now : now,
  };
  await db.treasuryTransactions.put(tx);
  return tx;
}

export async function deleteTreasuryTransaction(id: string) {
  await db.treasuryTransactions.delete(id);
}

export async function upsertTreasuryCount(entry: Omit<TreasuryCashCount, 'id' | 'createdAt' | 'totalCash'> & { id?: string }) {
  const totalCash = entry.items.reduce((sum, item) => sum + item.denomination * item.count, 0);
  const now = new Date().toISOString();
  const record: TreasuryCashCount = { ...entry, id: entry.id ?? uuid(), totalCash, createdAt: now };
  await db.treasuryCounts.put(record);
  return record;
}

export async function upsertRevenueInvoice(entry: Omit<RevenueInvoice, 'id' | 'createdAt'> & { id?: string }) {
  const record: RevenueInvoice = { ...entry, id: entry.id ?? uuid(), createdAt: new Date().toISOString() };
  await db.revenueInvoices.put(record);
  return record;
}

export async function deleteRevenueInvoice(id: string) {
  await db.revenueInvoices.delete(id);
}

export async function upsertBankTransaction(entry: Omit<BankTransaction, 'id' | 'createdAt'> & { id?: string }) {
  const record: BankTransaction = { ...entry, id: entry.id ?? uuid(), createdAt: new Date().toISOString() };
  await db.bankTransactions.put(record);
  return record;
}

export async function deleteBankTransaction(id: string) {
  await db.bankTransactions.delete(id);
}

export async function upsertAdvanceTransaction(entry: Omit<AdvanceTransaction, 'id' | 'createdAt'> & { id?: string }) {
  const record: AdvanceTransaction = { ...entry, id: entry.id ?? uuid(), createdAt: new Date().toISOString() };
  await db.advanceTransactions.put(record);
  return record;
}

export async function deleteAdvanceTransaction(id: string) {
  await db.advanceTransactions.delete(id);
}

export async function upsertCustodyTransaction(entry: Omit<CustodyTransaction, 'id' | 'createdAt'> & { id?: string }) {
  const record: CustodyTransaction = { ...entry, id: entry.id ?? uuid(), createdAt: new Date().toISOString() };
  await db.custodyTransactions.put(record);
  return record;
}

export async function deleteCustodyTransaction(id: string) {
  await db.custodyTransactions.delete(id);
}
