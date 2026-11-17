import { Account, Category, Transaction } from '../types';

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-cash',
    name: 'Ví tiền mặt',
    type: 'CASH',
    initialBalance: 3500000,
    color: '#10b981',
    icon: 'Wallet',
    institution: 'Tiền mặt'
  },
  {
    id: 'acc-vcb',
    name: 'Vietcombank (Lương chính)',
    type: 'BANK',
    initialBalance: 45000000,
    color: '#059669',
    icon: 'Landmark',
    accountNumber: '****9824',
    institution: 'Vietcombank'
  },
  {
    id: 'acc-tcb',
    name: 'Techcombank (Thanh toán)',
    type: 'BANK',
    initialBalance: 12500000,
    color: '#dc2626',
    icon: 'Building2',
    accountNumber: '****6618',
    institution: 'Techcombank'
  },
  {
    id: 'acc-saving',
    name: 'Tiết kiệm Online 6 tháng',
    type: 'SAVING',
    initialBalance: 120000000,
    color: '#2563eb',
    icon: 'PiggyBank',
    institution: 'MB Bank (Lãi suất 5.8%)'
  },
  {
    id: 'acc-invest',
    name: 'Quỹ Đầu tư & Cổ phiếu',
    type: 'INVESTMENT',
    initialBalance: 85000000,
    color: '#7c3aed',
    icon: 'TrendingUp',
    institution: 'TCBS & Dragon Capital'
  },
  {
    id: 'acc-credit',
    name: 'Thẻ tín dụng Visa Cash Back',
    type: 'CREDIT',
    initialBalance: -6200000,
    color: '#ea580c',
    icon: 'CreditCard',
    accountNumber: '****3105',
    institution: 'VPBank'
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  // Thu nhập
  { id: 'cat-in-1', name: 'Lương cố định', type: 'INCOME', icon: 'Briefcase', color: '#10b981', budgetMonthly: 35000000 },
  { id: 'cat-in-2', name: 'Thưởng & Phụ cấp', type: 'INCOME', icon: 'Award', color: '#06b6d4', budgetMonthly: 5000000 },
  { id: 'cat-in-3', name: 'Thu nhập Freelance / Nghề tay trái', type: 'INCOME', icon: 'Sparkles', color: '#3b82f6', budgetMonthly: 4000000 },
  { id: 'cat-in-4', name: 'Lợi nhuận đầu tư & Cổ tức', type: 'INCOME', icon: 'TrendingUp', color: '#8b5cf6', budgetMonthly: 2500000 },
  { id: 'cat-in-5', name: 'Hỗ trợ', type: 'INCOME', icon: 'HeartHandshake', color: '#0d9488', budgetMonthly: 2000000 },
  // Chi tiêu
  { id: 'cat-ex-1', name: 'Ăn uống & Cà phê', type: 'EXPENSE', icon: 'Utensils', color: '#ef4444', budgetMonthly: 6000000 },
  { id: 'cat-ex-2', name: 'Tiền thuê nhà & Tiện ích', type: 'EXPENSE', icon: 'Home', color: '#f97316', budgetMonthly: 7500000 },
  { id: 'cat-ex-3', name: 'Di chuyển & Xăng xe', type: 'EXPENSE', icon: 'Car', color: '#eab308', budgetMonthly: 1800000 },
  { id: 'cat-ex-4', name: 'Mua sắm & Gia dụng', type: 'EXPENSE', icon: 'ShoppingBag', color: '#ec4899', budgetMonthly: 3500000 },
  { id: 'cat-ex-5', name: 'Sức khỏe & Phòng gym', type: 'EXPENSE', icon: 'HeartPulse', color: '#14b8a6', budgetMonthly: 1500000 },
  { id: 'cat-ex-6', name: 'Học tập & Sách vở', type: 'EXPENSE', icon: 'BookOpen', color: '#6366f1', budgetMonthly: 1200000 },
  { id: 'cat-ex-7', name: 'Giải trí & Du lịch', type: 'EXPENSE', icon: 'Film', color: '#a855f7', budgetMonthly: 2500000 },
  { id: 'cat-ex-8', name: 'Hiếu hỉ & Quà biếu', type: 'EXPENSE', icon: 'Gift', color: '#0284c7', budgetMonthly: 1000000 },
  { id: 'cat-ex-9', name: 'Trả nợ', type: 'EXPENSE', icon: 'Receipt', color: '#e11d48', budgetMonthly: 3000000 }
];

// Helper to generate dynamic dates relative to current date
function formatDateOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysOffset);
  return d.toISOString().split('T')[0];
}

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Tháng này
  {
    id: 'tx-01',
    date: formatDateOffset(1),
    time: '08:30',
    amount: 55000,
    type: 'EXPENSE',
    categoryId: 'cat-ex-1',
    accountId: 'acc-tcb',
    note: 'Cà phê sáng & ăn sáng công ty',
    tags: ['Cá nhân', 'Ăn uống'],
    createdAt: Date.now() - 1 * 86400000
  },
  {
    id: 'tx-02',
    date: formatDateOffset(2),
    time: '19:15',
    amount: 480000,
    type: 'EXPENSE',
    categoryId: 'cat-ex-1',
    accountId: 'acc-credit',
    note: 'Ăn tối lẩu cùng bạn bè cuối tuần',
    tags: ['Bạn bè', 'Ăn ngoài'],
    createdAt: Date.now() - 2 * 86400000
  },
  {
    id: 'tx-03',
    date: formatDateOffset(3),
    time: '10:00',
    amount: 35000000,
    type: 'INCOME',
    categoryId: 'cat-in-1',
    accountId: 'acc-vcb',
    note: 'Nhận lương tháng',
    tags: ['Lương', 'Công ty'],
    createdAt: Date.now() - 3 * 86400000
  },
  {
    id: 'tx-04',
    date: formatDateOffset(4),
    time: '14:20',
    amount: 5000000,
    type: 'TRANSFER',
    accountId: 'acc-vcb',
    toAccountId: 'acc-saving',
    note: 'Trích quỹ tiết kiệm tự động đầu tháng',
    tags: ['Tiết kiệm', 'Kỷ luật'],
    createdAt: Date.now() - 4 * 86400000
  },
  {
    id: 'tx-05',
    date: formatDateOffset(4),
    time: '15:00',
    amount: 3000000,
    type: 'TRANSFER',
    accountId: 'acc-vcb',
    toAccountId: 'acc-tcb',
    note: 'Chuyển tiền vào tài khoản chi tiêu hằng ngày',
    tags: ['Chuyển khoản'],
    createdAt: Date.now() - 4 * 86400000
  },
  {
    id: 'tx-06',
    date: formatDateOffset(5),
    time: '18:45',
    amount: 7200000,
    type: 'EXPENSE',
    categoryId: 'cat-ex-2',
    accountId: 'acc-vcb',
    note: 'Tiền thuê căn hộ tháng này',
    tags: ['Cố định', 'Nhà ở'],
    createdAt: Date.now() - 5 * 86400000
  },
  {
    id: 'tx-07',
    date: formatDateOffset(6),
    time: '11:10',
    amount: 650000,
    type: 'EXPENSE',
    categoryId: 'cat-ex-2',
    accountId: 'acc-tcb',
    note: 'Tiền điện sinh hoạt & Internet VNPT',
    tags: ['Hóa đơn'],
    createdAt: Date.now() - 6 * 86400000
  },
  {
    id: 'tx-08',
    date: formatDateOffset(7),
    time: '09:00',
    amount: 120000,
    type: 'EXPENSE',
    categoryId: 'cat-ex-3',
    accountId: 'acc-cash',
    note: 'Đổ xăng xe máy Petrolimex',
    tags: ['Xăng xe'],
    createdAt: Date.now() - 7 * 86400000
  },
  {
    id: 'tx-09',
    date: formatDateOffset(8),
    time: '16:30',
    amount: 4500000,
    type: 'INCOME',
    categoryId: 'cat-in-3',
    accountId: 'acc-tcb',
    note: 'Thanh toán dự án thiết kế Web Freelance',
    tags: ['Freelance', 'Dự án'],
    createdAt: Date.now() - 8 * 86400000
  },
  {
    id: 'tx-10',
    date: formatDateOffset(9),
    time: '20:10',
    amount: 1250000,
    type: 'EXPENSE',
    categoryId: 'cat-ex-4',
    accountId: 'acc-credit',
    note: 'Mua bàn phím cơ công thái học làm việc',
    tags: ['Thiết bị', 'Làm việc'],
    createdAt: Date.now() - 9 * 86400000
  },
  {
    id: 'tx-11',
    date: formatDateOffset(11),
    time: '07:00',
    amount: 800000,
    type: 'EXPENSE',
    categoryId: 'cat-ex-5',
    accountId: 'acc-tcb',
    note: 'Gia hạn gói tập Gym & Yoga 1 tháng',
    tags: ['Sức khỏe'],
    createdAt: Date.now() - 11 * 86400000
  },
  {
    id: 'tx-12',
    date: formatDateOffset(13),
    time: '15:20',
    amount: 320000,
    type: 'EXPENSE',
    categoryId: 'cat-ex-6',
    accountId: 'acc-tcb',
    note: 'Mua 2 cuốn sách Tài chính cá nhân & Đầu tư',
    tags: ['Sách', 'Phát triển bản thân'],
    createdAt: Date.now() - 13 * 86400000
  },
  {
    id: 'tx-13',
    date: formatDateOffset(15),
    time: '19:40',
    amount: 1200000,
    type: 'INCOME',
    categoryId: 'cat-in-4',
    accountId: 'acc-vcb',
    note: 'Cổ tức tiền mặt nhận từ cổ phiếu HPG',
    tags: ['Đầu tư', 'Cổ tức'],
    createdAt: Date.now() - 15 * 86400000
  },
  {
    id: 'tx-13b',
    date: formatDateOffset(16),
    time: '14:15',
    amount: 2500000,
    type: 'INCOME',
    categoryId: 'cat-in-5',
    accountId: 'acc-vcb',
    note: 'Khoản hỗ trợ kinh tế từ người thân / quỹ hỗ trợ',
    tags: ['Hỗ trợ', 'Gia đình'],
    createdAt: Date.now() - 16 * 86400000
  },
  {
    id: 'tx-13c',
    date: formatDateOffset(17),
    time: '10:30',
    amount: 3000000,
    type: 'EXPENSE',
    categoryId: 'cat-ex-9',
    accountId: 'acc-tcb',
    note: 'Thanh toán tiền trả nợ định kỳ / trả góp thiết bị',
    tags: ['Trả nợ', 'Khoản vay'],
    createdAt: Date.now() - 17 * 86400000
  },
  {
    id: 'tx-14',
    date: formatDateOffset(18),
    time: '17:30',
    amount: 500000,
    type: 'EXPENSE',
    categoryId: 'cat-ex-8',
    accountId: 'acc-cash',
    note: 'Mừng cưới đồng nghiệp công ty',
    tags: ['Hiếu hỉ'],
    createdAt: Date.now() - 18 * 86400000
  },
  // Các giao dịch các tuần/tháng trước để tạo biểu đồ xu hướng phong phú
  {
    id: 'tx-15',
    date: formatDateOffset(22),
    time: '18:00',
    amount: 1450000,
    type: 'EXPENSE',
    categoryId: 'cat-ex-1',
    accountId: 'acc-credit',
    note: 'Siêu thị WinMart mua thực phẩm tuần',
    tags: ['Đi chợ', 'Gia đình'],
    createdAt: Date.now() - 22 * 86400000
  },
  {
    id: 'tx-16',
    date: formatDateOffset(26),
    time: '21:00',
    amount: 1800000,
    type: 'EXPENSE',
    categoryId: 'cat-ex-7',
    accountId: 'acc-credit',
    note: 'Vé máy bay khứ hồi đi Đà Nẵng nghỉ phép',
    tags: ['Du lịch'],
    createdAt: Date.now() - 26 * 86400000
  },
  {
    id: 'tx-17',
    date: formatDateOffset(32),
    time: '10:00',
    amount: 35000000,
    type: 'INCOME',
    categoryId: 'cat-in-1',
    accountId: 'acc-vcb',
    note: 'Lương tháng trước',
    tags: ['Lương'],
    createdAt: Date.now() - 32 * 86400000
  },
  {
    id: 'tx-18',
    date: formatDateOffset(33),
    time: '14:00',
    amount: 6000000,
    type: 'INCOME',
    categoryId: 'cat-in-2',
    accountId: 'acc-vcb',
    note: 'Thưởng KPI quý xuất sắc',
    tags: ['Thưởng'],
    createdAt: Date.now() - 33 * 86400000
  },
  {
    id: 'tx-19',
    date: formatDateOffset(35),
    time: '11:00',
    amount: 7200000,
    type: 'EXPENSE',
    categoryId: 'cat-ex-2',
    accountId: 'acc-vcb',
    note: 'Tiền thuê căn hộ tháng trước',
    tags: ['Nhà ở'],
    createdAt: Date.now() - 35 * 86400000
  },
  {
    id: 'tx-20',
    date: formatDateOffset(38),
    time: '19:20',
    amount: 4200000,
    type: 'EXPENSE',
    categoryId: 'cat-ex-1',
    accountId: 'acc-tcb',
    note: 'Tổng chi tiêu ăn uống gia đình',
    tags: ['Ăn uống'],
    createdAt: Date.now() - 38 * 86400000
  },
  {
    id: 'tx-21',
    date: formatDateOffset(42),
    time: '16:00',
    amount: 2200000,
    type: 'EXPENSE',
    categoryId: 'cat-ex-4',
    accountId: 'acc-credit',
    note: 'Mua sắm quần áo Uniqlo',
    tags: ['Mua sắm'],
    createdAt: Date.now() - 42 * 86400000
  },
  {
    id: 'tx-22',
    date: formatDateOffset(50),
    time: '10:00',
    amount: 10000000,
    type: 'TRANSFER',
    accountId: 'acc-vcb',
    toAccountId: 'acc-invest',
    note: 'Nạp tiền mua thêm chứng chỉ quỹ DCDS',
    tags: ['Đầu tư'],
    createdAt: Date.now() - 50 * 86400000
  },
  {
    id: 'tx-23',
    date: formatDateOffset(62),
    time: '09:30',
    amount: 35000000,
    type: 'INCOME',
    categoryId: 'cat-in-1',
    accountId: 'acc-vcb',
    note: 'Lương tháng 2 tháng trước',
    tags: ['Lương'],
    createdAt: Date.now() - 62 * 86400000
  },
  {
    id: 'tx-24',
    date: formatDateOffset(65),
    time: '15:10',
    amount: 7200000,
    type: 'EXPENSE',
    categoryId: 'cat-ex-2',
    accountId: 'acc-vcb',
    note: 'Tiền thuê căn hộ 2 tháng trước',
    tags: ['Nhà ở'],
    createdAt: Date.now() - 65 * 86400000
  },
  {
    id: 'tx-25',
    date: formatDateOffset(68),
    time: '12:00',
    amount: 5100000,
    type: 'EXPENSE',
    categoryId: 'cat-ex-1',
    accountId: 'acc-tcb',
    note: 'Chi phí ăn uống tháng đó',
    tags: ['Ăn uống'],
    createdAt: Date.now() - 68 * 86400000
  }
];
