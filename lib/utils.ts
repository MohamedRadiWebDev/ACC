import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Account, LedgerType, Transaction } from './types';
import Papa from 'papaparse';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return amount.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' });
}

export function ledgerForAccount(account: Account): LedgerType {
  if (account.type === 'WALLET') return 'DIGITAL';
  return account.type;
}

export function generateTemplateCSV() {
  const headersEn = [
    'date',
    'accountName',
    'direction',
    'amount',
    'description',
    'category',
    'employeeCode',
    'employeeName',
    'department',
    'branch',
    'invoiceNo',
    'receiptOutNo',
    'receiptInNo',
    'approved',
    'notes',
  ];
  const headersAr = [
    'التاريخ',
    'اسم الحساب',
    'نوع الحركة (IN/OUT)',
    'المبلغ',
    'الوصف',
    'التصنيف',
    'كود الموظف',
    'اسم الموظف',
    'القسم',
    'الفرع',
    'فاتورة',
    'إذن صرف',
    'إذن قبض',
    'معتمد',
    'ملاحظات',
  ];
  return {
    english: Papa.unparse([headersEn]),
    arabic: Papa.unparse([headersAr]),
  };
}

export function parseBool(value: string | undefined) {
  return value === 'true' || value === '1' || value?.toLowerCase() === 'yes';
}

export function runningBalance(openingBalance: number, transactions: Transaction[]) {
  let total = openingBalance;
  return transactions
    .sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)))
    .map((tx) => {
      total = tx.direction === 'IN' ? total + tx.amount : total - tx.amount;
      return { id: tx.id, balance: total };
    });
}

export function formatVariance(value: number) {
  if (value === 0) return 'مطابق';
  return value > 0 ? 'زيادة' : 'عجز';
}
