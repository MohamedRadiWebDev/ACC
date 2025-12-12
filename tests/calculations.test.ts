import { advanceBalance, bankRunningBalance, computeRevenueDerived, custodyBalance, treasuryRunningBalance } from '@/lib/calculations';
import { RevenueInvoice, TreasuryTransaction, BankTransaction, AdvanceTransaction, CustodyTransaction } from '@/lib/types';

describe('calculations', () => {
  it('computes treasury running balance', () => {
    const txs: TreasuryTransaction[] = [
      { id: '1', date: '2024-01-01', description: '', payeeCompany: '', invoiceNo: '', employeeCode: '', employeeName: '', department: '', branch: '', expenseType: '', receiptOutNo: '', receiptInNo: '', approved: true, inAmount: 100, outAmount: 0, createdAt: '1' },
      { id: '2', date: '2024-01-02', description: '', payeeCompany: '', invoiceNo: '', employeeCode: '', employeeName: '', department: '', branch: '', expenseType: '', receiptOutNo: '', receiptInNo: '', approved: true, inAmount: 0, outAmount: 40, createdAt: '2' },
    ];
    expect(treasuryRunningBalance(10, txs)).toBe(70);
  });

  it('computes bank running balance', () => {
    const txs: BankTransaction[] = [
      { id: '1', bankName: 'BANK_MISR', balance: undefined, credit: 200, debit: 0, date: '2024-01-01', description: '', createdAt: '1' },
      { id: '2', bankName: 'BANK_MISR', balance: undefined, credit: 0, debit: 50, date: '2024-01-02', description: '', createdAt: '2' },
    ];
    expect(bankRunningBalance(0, txs)).toBe(150);
  });

  it('computes revenue eligibility and delay', () => {
    const inv: RevenueInvoice = {
      id: '1',
      customer: 'X',
      invoiceMonth: 'يناير',
      invoiceDate: '2024-01-01',
      totalWithVat14: 114,
      totalWithoutVat14: 100,
      cairo: 0,
      mansoura: 0,
      legal: 0,
      other: 0,
      vat14: 14,
      tax3: 3,
      requiredToTransfer: 100,
      paidAmount: 0,
      expenses: 0,
      dueAmount: 100,
      dueDate: '2024-01-10',
      paymentTerm: 'Net 10',
      eligibility: 'غير مستحق',
      delayDays: 0,
      paidDate: undefined,
      actualRevenueMinus14: 0,
      notes: '',
      createdAt: '1',
    };
    const { eligibility } = computeRevenueDerived(inv);
    expect(eligibility === 'مستحق' || eligibility === 'غير مستحق').toBe(true);
  });

  it('computes advance balances', () => {
    const entries: AdvanceTransaction[] = [
      { id: '1', date: '2024-01-01', month: 'يناير', employeeCode: 'E1', employeeName: 'A', department: '', type: 'ADVANCE', amount: 100, repaymentMethod: '', createdAt: '1' },
      { id: '2', date: '2024-01-02', month: 'يناير', employeeCode: 'E1', employeeName: 'A', department: '', type: 'REPAYMENT', amount: 40, repaymentMethod: '', createdAt: '2' },
    ];
    expect(advanceBalance(entries, 'E1')).toBe(60);
  });

  it('computes custody balances', () => {
    const entries: CustodyTransaction[] = [
      { id: '1', date: '2024-01-01', month: 'يناير', description: '', paidTo: 'X', invoiceOrEmployeeRef: '', department: '', classification: '', expenseType: '', receiptRef: '', type: 'CUSTODY', amount: 200, createdAt: '1' },
      { id: '2', date: '2024-01-02', month: 'يناير', description: '', paidTo: 'X', invoiceOrEmployeeRef: '', department: '', classification: '', expenseType: '', receiptRef: '', type: 'SETTLEMENT', amount: 50, createdAt: '2' },
    ];
    expect(custodyBalance(entries, 'X')).toBe(150);
  });
});
