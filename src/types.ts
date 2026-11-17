export type AccountType = 
  | 'CASH'        // Tiền mặt
  | 'BANK'        // Ngân hàng thanh toán
  | 'CREDIT'      // Thẻ tín dụng (Khoản nợ ngắn hạn)
  | 'SAVING'      // Tiết kiệm tích lũy
  | 'INVESTMENT'  // Đầu tư (Chứng khoán, Quỹ, BĐS)
  | 'LOAN';       // Khoản nợ / Vay

export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string; // Tên icon từ Lucide (ví dụ: 'Utensils', 'Briefcase')
  color: string; // Hex color hoặc Tailwind class
  budgetMonthly?: number; // Ngân sách tháng (cho Chi) hoặc Mục tiêu (cho Thu)
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
  icon: string;
  accountNumber?: string;
  institution?: string; // Tên ngân hàng/tổ chức (VCB, TCB, MB, Tiền mặt...)
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  amount: number;
  type: TransactionType;
  categoryId?: string; // Bắt buộc nếu INCOME/EXPENSE
  accountId: string; // Tài khoản nguồn (hoặc tài khoản nhận nếu INCOME)
  toAccountId?: string; // Tài khoản đích nếu là TRANSFER
  note?: string;
  tags?: string[];
  createdAt: number;
}

export type ActiveTab = 'cashflow' | 'income-expense' | 'accounts' | 'transactions' | 'setup';

export type TimeRange = 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR' | 'ALL' | 'CUSTOM';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'local-only';
