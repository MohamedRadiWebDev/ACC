export type AccountType = 'CASHBOX' | 'BANK' | 'WALLET';
export type WalletProvider = 'INSTAPAY' | 'VODAFONE' | 'ETISALAT' | 'AMAN' | 'FAWRY';
export type LedgerType = 'CASHBOX' | 'DIGITAL' | 'BANK';
export type Direction = 'IN' | 'OUT';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  provider?: WalletProvider | null;
  currency: 'EGP';
  openingBalance: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  ledger: LedgerType;
  accountId: string;
  date: string;
  direction: Direction;
  amount: number;
  description: string;
  counterpartyName?: string;
  employeeCode?: string;
  employeeName?: string;
  department?: string;
  branch?: string;
  category?: string;
  invoiceNo?: string;
  receiptOutNo?: string;
  receiptInNo?: string;
  approved?: boolean;
  notes?: string;
  transferId?: string | null;
  matchId?: string | null;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  date: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface Match {
  id: string;
  txAId: string;
  txBId: string;
  createdAt: string;
}

export interface CashCountItem {
  denomination: number;
  countFit: number;
  countTorn: number;
}

export interface CashCount {
  id: string;
  cashboxAccountId: string;
  date: string;
  items: CashCountItem[];
  totalCash: number;
  createdAt: string;
}

export interface BalanceSnapshot {
  id: string;
  accountId: string;
  date: string;
  actualBalance: number;
  notes?: string;
  createdAt: string;
}
