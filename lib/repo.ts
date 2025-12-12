'use client';

import { db } from './db';
import { Account, BalanceSnapshot, CashCount, LedgerType, Match, Transaction, Transfer } from './types';
import { v4 as uuid } from 'uuid';
import { liveQuery } from 'dexie';

export const liveAccounts = () => liveQuery(() => db.accounts.toArray());
export const liveTransactions = () => liveQuery(() => db.transactions.toArray());
export const liveTransfers = () => liveQuery(() => db.transfers.toArray());
export const liveMatches = () => liveQuery(() => db.matches.toArray());
export const liveCashCounts = () => liveQuery(() => db.cashCounts.toArray());
export const liveBalanceSnapshots = () => liveQuery(() => db.balanceSnapshots.toArray());

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
  await db.cashCounts.add(entry);
  return entry;
}

export async function addBalanceSnapshot(data: Omit<BalanceSnapshot, 'id'>) {
  const entry: BalanceSnapshot = { ...data, id: uuid() };
  await db.balanceSnapshots.add(entry);
  return entry;
}

export async function seedDemo() {
  await db.transaction('rw', db.accounts, db.transactions, db.transfers, async () => {
    await db.delete();
  });
}

export function calculateBalance(openingBalance: number, transactions: Transaction[]) {
  return transactions.reduce((acc, tx) => (tx.direction === 'IN' ? acc + tx.amount : acc - tx.amount), openingBalance);
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
  const suggestions: { cash: Transaction; digital: Transaction }[] = [];
  cashTx.forEach((c) => {
    digitalTx.forEach((d) => {
      const days = Math.abs(new Date(c.date).getTime() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24);
      if (c.amount === d.amount && c.direction !== d.direction && days <= toleranceDays) {
        suggestions.push({ cash: c, digital: d });
      }
    });
  });
  return suggestions;
}

export async function exportAll(): Promise<string> {
  const [accounts, transactions, transfers, matches, cashCounts, balanceSnapshots] = await Promise.all([
    db.accounts.toArray(),
    db.transactions.toArray(),
    db.transfers.toArray(),
    db.matches.toArray(),
    db.cashCounts.toArray(),
    db.balanceSnapshots.toArray(),
  ]);
  return JSON.stringify({ accounts, transactions, transfers, matches, cashCounts, balanceSnapshots }, null, 2);
}
