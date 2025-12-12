import { differenceInCalendarDays, format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { AdvanceTransaction, BankTransaction, CustodyTransaction, RevenueInvoice, TreasuryTransaction } from './types';

export function arabicDay(date: string) {
  return format(new Date(date), 'EEEE', { locale: arSA });
}

export function arabicMonth(date: string) {
  return format(new Date(date), 'LLLL', { locale: arSA });
}

export function treasuryRunningBalance(opening: number, txs: TreasuryTransaction[]) {
  return txs
    .sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)))
    .reduce((acc, tx) => acc + tx.inAmount - tx.outAmount, opening);
}

export function treasuryBalanceAfter(opening: number, txs: TreasuryTransaction[]) {
  let running = opening;
  return txs
    .sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)))
    .map((tx) => {
      running += tx.inAmount - tx.outAmount;
      return { ...tx, runningBalance: running };
    });
}

export function bankRunningBalance(opening: number, txs: BankTransaction[]) {
  return txs
    .sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)))
    .reduce((acc, tx) => acc + tx.credit - tx.debit, opening);
}

export function computeRevenueDerived(invoice: RevenueInvoice) {
  const due = new Date(invoice.dueDate);
  const today = new Date();
  const eligibility = invoice.dueAmount > 0 && due <= today ? 'مستحق' : 'غير مستحق';
  let delayDays = 0;
  if (invoice.paidDate) {
    delayDays = Math.max(0, differenceInCalendarDays(new Date(invoice.paidDate), due));
  } else if (due < today && invoice.dueAmount > 0) {
    delayDays = differenceInCalendarDays(today, due);
  }
  return { eligibility, delayDays } as const;
}

export function advanceBalance(entries: AdvanceTransaction[], employeeCode: string) {
  return entries
    .filter((e) => e.employeeCode === employeeCode)
    .reduce((acc, e) => acc + (e.type === 'ADVANCE' ? e.amount : -e.amount), 0);
}

export function custodyBalance(entries: CustodyTransaction[], paidTo: string) {
  return entries
    .filter((e) => e.paidTo === paidTo)
    .reduce((acc, e) => acc + (e.type === 'CUSTODY' ? e.amount : -e.amount), 0);
}
