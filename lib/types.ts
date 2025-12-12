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

// Treasury-focused data model
export interface TreasuryTransaction {
  id: string;
  date: string;
  description: string;
  payeeCompany: string;
  invoiceNo: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  branch: string;
  expenseType: string;
  receiptOutNo: string;
  receiptInNo: string;
  approved: boolean;
  notes?: string;
  inAmount: number;
  outAmount: number;
  createdAt: string;
}

export interface TreasuryCashCountItem {
  denomination: number;
  count: number;
}

export interface TreasuryCashCount {
  id: string;
  date: string;
  items: TreasuryCashCountItem[];
  totalCash: number;
  createdAt: string;
}

export type BankName = 'BANK_MISR' | 'CREDIT_BANK' | 'NBK' | 'EG_BANK';

export interface BankTransaction {
  id: string;
  bankName: BankName;
  balance?: number;
  credit: number;
  debit: number;
  date: string;
  postedDate?: string;
  valueDate?: string;
  description: string;
  createdAt: string;
}

export interface RevenueInvoice {
  id: string;
  customer: string;
  invoiceMonth: string;
  invoiceDate: string;
  totalWithVat14: number;
  totalWithoutVat14: number;
  cairo: number;
  mansoura: number;
  legal: number;
  other: number;
  vat14: number;
  tax3: number;
  requiredToTransfer: number;
  paidAmount: number;
  expenses: number;
  dueAmount: number;
  dueDate: string;
  paymentTerm: string;
  eligibility: 'مستحق' | 'غير مستحق';
  delayDays: number;
  paidDate?: string;
  actualRevenueMinus14: number;
  notes?: string;
  createdAt: string;
}

export type AdvanceType = 'ADVANCE' | 'REPAYMENT';

export interface AdvanceTransaction {
  id: string;
  date: string;
  month: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  type: AdvanceType;
  amount: number;
  repaymentMethod: string;
  notes?: string;
  createdAt: string;
}

export type CustodyType = 'CUSTODY' | 'SETTLEMENT';

export interface CustodyTransaction {
  id: string;
  date: string;
  month: string;
  description: string;
  paidTo: string;
  invoiceOrEmployeeRef: string;
  department: string;
  classification: string;
  expenseType: string;
  receiptRef: string;
  type: CustodyType;
  amount: number;
  notes?: string;
  createdAt: string;
}
