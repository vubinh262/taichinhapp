import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { Account, AccountType } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { 
  Wallet, 
  Landmark, 
  CreditCard, 
  PiggyBank, 
  TrendingUp, 
  Plus, 
  Edit3, 
  Trash2, 
  ArrowRightLeft,
  ShieldCheck,
  Building2,
  Check,
  LayoutGrid,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';

export interface BankOption {
  code: string;
  name: string;
  fullName: string;
  color: string;
}

export function getBankCardStyle(institution?: string, type?: AccountType, customColor?: string) {
  const inst = (institution || '').toLowerCase();
  
  if (inst.includes('vietcombank') || inst.includes('vcb')) {
    return {
      gradient: 'from-[#033e2b] via-[#085a40] to-[#012419]',
      border: 'border-emerald-500/30',
      accentColor: '#34d399',
      badge: 'Vietcombank',
      cardType: 'VIETCOMBANK DEBIT',
      chipColor: 'from-amber-200 via-amber-300 to-amber-500'
    };
  }
  if (inst.includes('techcombank') || inst.includes('tcb')) {
    return {
      gradient: 'from-[#6e0a0d] via-[#991b1b] to-[#2d0204]',
      border: 'border-rose-500/30',
      accentColor: '#f87171',
      badge: 'Techcombank',
      cardType: 'PLATINUM PRIORITY',
      chipColor: 'from-amber-200 via-amber-300 to-amber-500'
    };
  }
  if (inst.includes('mb') || inst.includes('quân đội')) {
    return {
      gradient: 'from-[#021d4d] via-[#093c99] to-[#010e28]',
      border: 'border-blue-500/30',
      accentColor: '#60a5fa',
      badge: 'MB Bank',
      cardType: 'MILITARY BANK VISA',
      chipColor: 'from-amber-200 via-amber-300 to-amber-500'
    };
  }
  if (inst.includes('acb')) {
    return {
      gradient: 'from-[#042861] via-[#0848a6] to-[#021536]',
      border: 'border-sky-500/30',
      accentColor: '#38bdf8',
      badge: 'ACB',
      cardType: 'ACB PRIVILEGE',
      chipColor: 'from-amber-200 via-amber-300 to-amber-500'
    };
  }
  if (inst.includes('bidv')) {
    return {
      gradient: 'from-[#02332c] via-[#065449] to-[#011915]',
      border: 'border-teal-500/30',
      accentColor: '#2dd4bf',
      badge: 'BIDV',
      cardType: 'BIDV PREMIER',
      chipColor: 'from-amber-200 via-amber-300 to-amber-500'
    };
  }
  if (inst.includes('vietinbank') || inst.includes('ctg')) {
    return {
      gradient: 'from-[#032647] via-[#073d70] to-[#011526]',
      border: 'border-sky-500/30',
      accentColor: '#38bdf8',
      badge: 'VietinBank',
      cardType: 'VIETINBANK ELITE',
      chipColor: 'from-amber-200 via-amber-300 to-amber-500'
    };
  }
  if (inst.includes('vpbank') || inst.includes('vpb')) {
    return {
      gradient: 'from-[#033b1c] via-[#086b36] to-[#011e0e]',
      border: 'border-emerald-500/30',
      accentColor: '#4ade80',
      badge: 'VPBank',
      cardType: 'DIAMOND PRIVILEGE',
      chipColor: 'from-amber-200 via-amber-300 to-amber-500'
    };
  }
  if (inst.includes('tpbank') || inst.includes('tpb')) {
    return {
      gradient: 'from-[#2e0b47] via-[#52197d] to-[#170524]',
      border: 'border-purple-500/30',
      accentColor: '#c084fc',
      badge: 'TPBank',
      cardType: 'TPBANK SIGNATURE',
      chipColor: 'from-amber-200 via-amber-300 to-amber-500'
    };
  }
  if (inst.includes('momo')) {
    return {
      gradient: 'from-[#4d032e] via-[#7d084d] to-[#260117]',
      border: 'border-pink-500/30',
      accentColor: '#f472b6',
      badge: 'MoMo',
      cardType: 'SMART E-WALLET',
      chipColor: 'from-pink-200 via-pink-300 to-pink-400'
    };
  }
  if (inst.includes('zalopay')) {
    return {
      gradient: 'from-[#023154] via-[#055794] to-[#011729]',
      border: 'border-sky-500/30',
      accentColor: '#38bdf8',
      badge: 'ZaloPay',
      cardType: 'ZALOPAY WALLET',
      chipColor: 'from-sky-200 via-sky-300 to-sky-400'
    };
  }
  if (type === 'CASH') {
    return {
      gradient: 'from-[#1e293b] via-[#334155] to-[#0f172a]',
      border: 'border-slate-500/30',
      accentColor: '#94a3b8',
      badge: 'Tiền mặt',
      cardType: 'CASH RESERVE',
      chipColor: 'from-slate-200 via-slate-300 to-slate-400'
    };
  }
  if (type === 'SAVING') {
    return {
      gradient: 'from-[#043328] via-[#065744] to-[#021c15]',
      border: 'border-teal-500/30',
      accentColor: '#2dd4bf',
      badge: 'Sổ Tiết Kiệm',
      cardType: 'TERM DEPOSIT',
      chipColor: 'from-amber-200 via-amber-300 to-amber-500'
    };
  }
  if (type === 'INVESTMENT') {
    return {
      gradient: 'from-[#2b1055] via-[#431885] to-[#170830]',
      border: 'border-indigo-500/30',
      accentColor: '#818cf8',
      badge: 'Đầu Tư',
      cardType: 'INVESTMENT ASSET',
      chipColor: 'from-amber-200 via-amber-300 to-amber-500'
    };
  }
  if (type === 'CREDIT' || type === 'LOAN') {
    return {
      gradient: 'from-[#4a0418] via-[#750a29] to-[#24010b]',
      border: 'border-rose-500/30',
      accentColor: '#fb7185',
      badge: 'Thẻ Tín Dụng',
      cardType: 'CREDIT LINE',
      chipColor: 'from-amber-200 via-amber-300 to-amber-500'
    };
  }

  return {
    gradient: 'from-[#1e293b] via-[#334155] to-[#0f172a]',
    border: 'border-slate-600/30',
    accentColor: customColor || '#10b981',
    badge: institution || 'Tài khoản',
    cardType: 'STANDARD ACCOUNT',
    chipColor: 'from-amber-200 via-amber-300 to-amber-500'
  };
}

export const VIETNAMESE_BANKS: BankOption[] = [
  { code: 'VCB', name: 'Vietcombank', fullName: 'TMCP Ngoại Thương Việt Nam', color: '#005a3c' },
  { code: 'TCB', name: 'Techcombank', fullName: 'TMCP Kỹ Thương Việt Nam', color: '#e01a22' },
  { code: 'MB', name: 'MB Bank', fullName: 'TMCP Quân Đội', color: '#002882' },
  { code: 'ACB', name: 'ACB', fullName: 'TMCP Á Châu', color: '#0052cc' },
  { code: 'BIDV', name: 'BIDV', fullName: 'TMCP Đầu tư & Phát triển Việt Nam', color: '#00685e' },
  { code: 'CTG', name: 'VietinBank', fullName: 'TMCP Công Thương Việt Nam', color: '#004c8f' },
  { code: 'VPB', name: 'VPBank', fullName: 'TMCP Việt Nam Thịnh Vượng', color: '#009345' },
  { code: 'TPB', name: 'TPBank', fullName: 'TMCP Tiên Phong', color: '#5b2d82' },
  { code: 'STB', name: 'Sacombank', fullName: 'TMCP Sài Gòn Thương Tín', color: '#005596' },
  { code: 'HDB', name: 'HDBank', fullName: 'TMCP Phát Triển TP.HCM', color: '#c8102e' },
  { code: 'VBA', name: 'Agribank', fullName: 'Nông Nghiệp & PTNT Việt Nam', color: '#800000' },
  { code: 'VIB', name: 'VIB', fullName: 'TMCP Quốc tế Việt Nam', color: '#00458a' },
  { code: 'MSB', name: 'MSB', fullName: 'TMCP Hàng Hải Việt Nam', color: '#d9251d' },
  { code: 'SHB', name: 'SHB', fullName: 'TMCP Sài Gòn - Hà Nội', color: '#f37021' },
  { code: 'OCB', name: 'OCB', fullName: 'TMCP Phương Đông', color: '#00874e' },
  { code: 'LPB', name: 'LPBank', fullName: 'TMCP Lộc Phát Việt Nam', color: '#e58900' },
  { code: 'EIB', name: 'Eximbank', fullName: 'TMCP Xuất Nhập Khẩu', color: '#0065a4' },
  { code: 'SEAB', name: 'SeABank', fullName: 'TMCP Đông Nam Á', color: '#e2001a' },
  { code: 'TIMO', name: 'Timo', fullName: 'Ngân hàng số Timo', color: '#6c5ce7' },
  { code: 'CAKE', name: 'Cake by VPBank', fullName: 'Ngân hàng số Cake', color: '#e84393' },
  { code: 'MOMO', name: 'MoMo', fullName: 'Ví điện tử MoMo', color: '#a50064' },
  { code: 'ZALOPAY', name: 'ZaloPay', fullName: 'Ví điện tử ZaloPay', color: '#008fe5' },
  { code: 'VIETTEL', name: 'Viettel Money', fullName: 'Dịch vụ Viettel Money', color: '#ee0033' },
  { code: 'SHINHAN', name: 'Shinhan Bank', fullName: 'Ngân hàng Shinhan Việt Nam', color: '#003087' },
  { code: 'HSBC', name: 'HSBC', fullName: 'Ngân hàng HSBC Việt Nam', color: '#db0011' },
  { code: 'OTHER', name: 'Ngân hàng / Đơn vị khác', fullName: 'Tự nhập tên ngân hàng', color: '#475569' },
];

// Helper: Formats 1000000 -> "1.000.000"
const formatAmountWithDots = (val: string | number): string => {
  if (val === '' || val === null || val === undefined) return '';
  const str = val.toString();
  const isNegative = str.startsWith('-');
  const cleanDigits = str.replace(/\D/g, '');
  if (!cleanDigits) return isNegative ? '-' : '';
  const formatted = cleanDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return isNegative ? `-${formatted}` : formatted;
};

// Helper: Parses "1.000.000" -> 1000000
const parseAmountFromDots = (val: string): number => {
  if (!val) return 0;
  const isNegative = val.includes('-');
  const cleanDigits = val.replace(/\D/g, '');
  if (!cleanDigits) return 0;
  const num = parseInt(cleanDigits, 10);
  return isNegative ? -num : num;
};

interface AccountGroup {
  key: string;
  title: string;
  description: string;
  items: Account[];
  total: number;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
}

interface AccountsClassificationProps {
  onOpenTransfer: () => void;
}

export const AccountsClassification: React.FC<AccountsClassificationProps> = ({ onOpenTransfer }) => {
  const { 
    accounts, 
    getAccountBalance, 
    formatCurrency, 
    totalAssets, 
    totalLiabilities, 
    netWorth,
    addAccount,
    updateAccount,
    deleteAccount
  } = useFinance();
  const { isDark } = useTheme();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);

  // Form states for Account modal
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK');
  const [selectedBankCode, setSelectedBankCode] = useState('VCB');
  const [institution, setInstitution] = useState('Vietcombank');
  const [customInstitution, setCustomInstitution] = useState('');
  const [initialBalanceDisplay, setInitialBalanceDisplay] = useState('0');
  const [color, setColor] = useState('#005a3c');
  const [icon, setIcon] = useState('Landmark');

  const openAddModal = () => {
    setEditingAcc(null);
    setName('Vietcombank');
    setType('BANK');
    setSelectedBankCode('VCB');
    setInstitution('Vietcombank');
    setCustomInstitution('');
    setInitialBalanceDisplay('0');
    setColor('#005a3c');
    setIcon('Landmark');
    setIsModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAcc(acc);
    setName(acc.name);
    setType(acc.type);
    setInitialBalanceDisplay(formatAmountWithDots(acc.initialBalance));

    // Match bank option
    const matchedBank = VIETNAMESE_BANKS.find(
      (b) =>
        b.code !== 'OTHER' &&
        (b.name.toLowerCase() === (acc.institution || '').toLowerCase() ||
          b.code.toLowerCase() === (acc.institution || '').toLowerCase() ||
          acc.name.toLowerCase().includes(b.name.toLowerCase()))
    );

    if (matchedBank) {
      setSelectedBankCode(matchedBank.code);
      setInstitution(matchedBank.name);
      setCustomInstitution('');
    } else if (acc.institution) {
      setSelectedBankCode('OTHER');
      setInstitution(acc.institution);
      setCustomInstitution(acc.institution);
    } else {
      setSelectedBankCode('VCB');
      setInstitution('Vietcombank');
      setCustomInstitution('');
    }

    setColor(acc.color || '#005a3c');
    setIcon(acc.icon || 'Landmark');
    setIsModalOpen(true);
  };

  const handleBankChange = (code: string) => {
    setSelectedBankCode(code);
    const bank = VIETNAMESE_BANKS.find((b) => b.code === code);
    if (!bank) return;

    if (code === 'OTHER') {
      setInstitution(customInstitution);
    } else {
      setInstitution(bank.name);
      // Auto update name if it matches any known bank name or is empty
      const isAutoName = VIETNAMESE_BANKS.some((b) => b.name === name) || !name;
      if (isAutoName) {
        setName(bank.name);
      }
      setColor(bank.color);
    }
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      setInitialBalanceDisplay('');
      return;
    }
    if (raw === '-') {
      setInitialBalanceDisplay('-');
      return;
    }
    const isNegative = raw.startsWith('-');
    const digitsOnly = raw.replace(/\D/g, '');
    if (!digitsOnly) {
      setInitialBalanceDisplay(isNegative ? '-' : '');
      return;
    }
    const formatted = formatAmountWithDots((isNegative ? '-' : '') + digitsOnly);
    setInitialBalanceDisplay(formatted);
  };

  const adjustBalance = (delta: number) => {
    const current = parseAmountFromDots(initialBalanceDisplay);
    const next = current + delta;
    setInitialBalanceDisplay(formatAmountWithDots(next));
  };

  const setZeroBalance = () => {
    setInitialBalanceDisplay('0');
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedBal = parseAmountFromDots(initialBalanceDisplay);
    const finalInstitution = selectedBankCode === 'OTHER' ? customInstitution.trim() : institution.trim();

    if (editingAcc) {
      updateAccount(editingAcc.id, {
        name: name.trim(),
        type,
        initialBalance: parsedBal,
        institution: finalInstitution,
        color,
        icon
      });
    } else {
      addAccount({
        name: name.trim(),
        type,
        initialBalance: parsedBal,
        institution: finalInstitution,
        color,
        icon
      });
    }
    setIsModalOpen(false);
  };

  // Group accounts by financial category
  const groupedAccounts = useMemo<AccountGroup[]>(() => {
    const liquid = accounts.filter((a) => a.type === 'CASH' || a.type === 'BANK');
    const savingAndInvest = accounts.filter((a) => a.type === 'SAVING' || a.type === 'INVESTMENT');
    const debts = accounts.filter((a) => a.type === 'CREDIT' || a.type === 'LOAN');

    const sumBalance = (list: Account[]) => list.reduce((sum, a) => sum + getAccountBalance(a.id), 0);

    return [
      {
        key: 'liquid',
        title: 'Tài sản thanh khoản (Tiền mặt & Ngân hàng)',
        description: 'Dễ dàng rút và thanh toán ngay lập tức',
        items: liquid,
        total: sumBalance(liquid),
        icon: Wallet,
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      },
      {
        key: 'savingAndInvest',
        title: 'Tài sản tích lũy & Đầu tư (Tiết kiệm & Quỹ/Cổ phiếu)',
        description: 'Sinh lời và tích sản dài hạn',
        items: savingAndInvest,
        total: sumBalance(savingAndInvest),
        icon: PiggyBank,
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
      },
      {
        key: 'debts',
        title: 'Nợ phải trả & Thẻ tín dụng',
        description: 'Khoản chi tiêu trước trả sau hoặc vay nợ',
        items: debts,
        total: sumBalance(debts),
        icon: CreditCard,
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
      }
    ];
  }, [accounts, getAccountBalance]);

  // Asset distribution for pie chart
  const assetChartData = useMemo(() => {
    return accounts
      .map((acc) => {
        const bal = getAccountBalance(acc.id);
        return {
          id: acc.id,
          name: acc.name,
          value: Math.max(0, bal),
          color: acc.color,
          type: acc.type
        };
      })
      .filter((item) => item.value > 0);
  }, [accounts, getAccountBalance]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Phân Loại Tài Khoản</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              Net Worth
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Tổng quan tài sản ròng (Net Worth), phân bổ dòng vốn và chi tiết số dư từng tài khoản
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenTransfer}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#161f30] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-white/[0.08] shadow-2xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Chuyển tiền nội bộ</span>
            <span className="sm:hidden">Chuyển tiền</span>
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm shadow-emerald-700/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      {/* 3 Overview Net Worth Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Net Worth */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 rounded-2xl sm:rounded-3xl p-6 text-white shadow-lg shadow-emerald-950/20 dark:shadow-black/50 border border-emerald-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-emerald-400/15 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Tài Sản Ròng (Net Worth)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-semibold text-emerald-200 border border-white/10">
                Live
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-xs shadow-2xs border border-white/20">
              <ShieldCheck className="w-5 h-5 text-emerald-300 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight tabular-nums mb-3 relative z-10 text-white drop-shadow-xs">
            {formatCurrency(netWorth)}
          </div>
          <div className="flex items-center justify-between text-xs text-emerald-100/90 pt-3 border-t border-white/15 relative z-10">
            <span>Tài sản: <strong className="font-mono text-white">{formatCurrency(totalAssets)}</strong></span>
            <span>Nợ: <strong className="font-mono text-rose-300">-{formatCurrency(totalLiabilities)}</strong></span>
          </div>
        </div>

        {/* Total Assets */}
        <div className="bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-blue-300 dark:hover:border-blue-700/60 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Tổng Tài Sản (Assets)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[10px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                {accounts.filter(a => a.type !== 'CREDIT' && a.type !== 'LOAN').length} tài khoản
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/70 dark:border-blue-800/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums text-slate-900 dark:text-white mb-2">
            {formatCurrency(totalAssets)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tiền mặt, số dư ngân hàng, tiết kiệm & danh mục đầu tư
          </p>
        </div>

        {/* Total Liabilities */}
        <div className="bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-rose-300 dark:hover:border-rose-700/60 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Tổng Nợ Phải Trả
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-[10px] font-semibold text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                {accounts.filter(a => a.type === 'CREDIT' || a.type === 'LOAN').length} khoản
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/70 dark:border-rose-800/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
              <CreditCard className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums text-rose-600 dark:text-rose-400 mb-2">
            {formatCurrency(totalLiabilities)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dư nợ thẻ tín dụng & các khoản vay cần thanh toán
          </p>
        </div>
      </div>

      {/* Asset Distribution Chart */}
      <div className="bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Cơ cấu Phân bổ Tài sản theo Tài khoản
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Tỷ trọng từng nguồn vốn nắm giữ trên tổng giá trị tài sản
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
          <div className="md:col-span-5 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {assetChartData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [formatCurrency(Number(val) || 0), 'Giá trị']}
                  contentStyle={{
                    backgroundColor: isDark ? '#111827' : '#fff',
                    borderRadius: '16px',
                    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assetChartData.map((item) => {
              const ratio = totalAssets > 0 ? ((item.value / totalAssets) * 100).toFixed(1) : '0';
              return (
                <div key={item.id} className="p-3 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <div 
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs" 
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold">{ratio}% tổng tài sản</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold font-mono tabular-nums text-slate-900 dark:text-white shrink-0">
                    {formatCurrency(item.value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Categorized Account Lists */}
      <div className="space-y-6">
        {groupedAccounts.map((group) => {
          const GroupIcon = group.icon;
          return (
            <div key={group.key} className="bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <GroupIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {group.title}
                    </h3>
                    <p className="text-xs text-slate-400">{group.description}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">Tổng nhóm</span>
                  <span className={`text-base sm:text-lg font-bold font-mono tabular-nums ${
                    group.total < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                  }`}>
                    {formatCurrency(group.total)}
                  </span>
                </div>
              </div>

              {group.items.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Chưa có tài khoản nào thuộc nhóm này.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((acc) => {
                    const balance = getAccountBalance(acc.id);
                    const isDebt = acc.type === 'CREDIT' || acc.type === 'LOAN';
                    return (
                      <div 
                        key={acc.id}
                        className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] shadow-2xs hover:shadow-sm bg-white dark:bg-[#161f30] transition-all group flex flex-col justify-between shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2.5">
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                                style={{ backgroundColor: acc.color }}
                              >
                                <CategoryIcon name={acc.icon} className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                  {acc.name}
                                </h4>
                                <span className="text-[11px] text-slate-400">
                                  {acc.institution || acc.type}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditModal(acc)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${acc.name}"?`)) {
                                    deleteAccount(acc.id);
                                  }
                                }}
                                className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1.5 my-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Số dư hiện tại:</span>
                              <span className={`font-bold font-mono tabular-nums text-sm ${
                                isDebt && balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                              }`}>
                                {formatCurrency(balance)}
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                              <span>Số dư ban đầu:</span>
                              <span>{formatCurrency(acc.initialBalance)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px]">
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 font-medium">
                            {acc.type === 'CASH' && 'Tiền mặt'}
                            {acc.type === 'BANK' && 'Tài khoản Ngân hàng'}
                            {acc.type === 'SAVING' && 'Tiền gửi Tiết kiệm'}
                            {acc.type === 'INVESTMENT' && 'Đầu tư & Quỹ'}
                            {acc.type === 'CREDIT' && 'Thẻ tín dụng'}
                            {acc.type === 'LOAN' && 'Khoản vay'}
                          </span>
                          <button
                            type="button"
                            onClick={onOpenTransfer}
                            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>Chuyển tiền</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Account Add/Edit Modal */}
      {isModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative my-auto bg-white dark:bg-[#111827] rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 dark:border-white/[0.1] overflow-hidden animate-in zoom-in-95 duration-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between bg-slate-50/70 dark:bg-white/[0.02]">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                {editingAcc ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] text-sm font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-6 space-y-4 text-xs">
              {/* Bank selection with logo/badge */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Ngân hàng / Đơn vị quản lý</label>
                  <span className="text-[11px] text-slate-400">Chọn từ danh mục ngân hàng</span>
                </div>
                
                {/* Bank dropdown with badge */}
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-xs text-white shrink-0 shadow-xs border border-white/20 transition-colors"
                    style={{ 
                      backgroundColor: VIETNAMESE_BANKS.find(b => b.code === selectedBankCode)?.color || '#005a3c' 
                    }}
                    title={VIETNAMESE_BANKS.find(b => b.code === selectedBankCode)?.fullName}
                  >
                    {selectedBankCode === 'OTHER' ? (
                      <Landmark className="w-5 h-5" />
                    ) : (
                      selectedBankCode
                    )}
                  </div>

                  <div className="flex-1">
                    <select
                      value={selectedBankCode}
                      onChange={(e) => handleBankChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-[#161f30] font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    >
                      {VIETNAMESE_BANKS.map((b) => (
                        <option key={b.code} value={b.code} className="dark:bg-[#161f30]">
                          {b.code === 'OTHER' ? b.name : `[${b.code}] ${b.name} - ${b.fullName}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Custom bank input if 'OTHER' selected */}
                {selectedBankCode === 'OTHER' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Nhập tên ngân hàng hoặc tổ chức..."
                      value={customInstitution}
                      onChange={(e) => {
                        setCustomInstitution(e.target.value);
                        setInstitution(e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-[#161f30] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                      required={selectedBankCode === 'OTHER'}
                    />
                  </div>
                )}
              </div>

              {/* Account Name */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên hiển thị tài khoản</label>
                <input
                  type="text"
                  placeholder="VD: Vietcombank, MB Bank, Ví tiền mặt, Tiết kiệm Techcombank..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-[#161f30] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                  required
                />
              </div>

              {/* Account Type & Initial Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Loại tài khoản</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-[#161f30] text-slate-800 dark:text-white text-xs font-medium"
                  >
                    <option value="BANK" className="dark:bg-[#161f30]">Tài khoản Ngân hàng</option>
                    <option value="CASH" className="dark:bg-[#161f30]">Tiền mặt</option>
                    <option value="SAVING" className="dark:bg-[#161f30]">Tiết kiệm</option>
                    <option value="INVESTMENT" className="dark:bg-[#161f30]">Đầu tư</option>
                    <option value="CREDIT" className="dark:bg-[#161f30]">Thẻ tín dụng (Nợ)</option>
                    <option value="LOAN" className="dark:bg-[#161f30]">Khoản vay (Nợ)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Số dư ban đầu
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {type === 'CREDIT' || type === 'LOAN' ? 'Nhập âm nếu nợ' : 'VNĐ'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="1.000.000"
                      value={initialBalanceDisplay}
                      onChange={handleBalanceChange}
                      className="w-full px-3 py-2.5 pr-7 rounded-xl border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-[#161f30] focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold text-slate-900 dark:text-white tracking-wide font-mono"
                      required
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                      ₫
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick balance increment chips */}
              <div className="p-3 bg-slate-50 dark:bg-white/[0.04] rounded-2xl border border-slate-200/70 dark:border-white/[0.08]">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1.5 font-medium flex items-center justify-between">
                  <span>Cộng nhanh số dư ban đầu:</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{initialBalanceDisplay || '0'} ₫</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => adjustBalance(500000)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#161f30] border border-slate-200 dark:border-white/[0.1] hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-600 dark:text-slate-300 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    +500.000
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustBalance(1000000)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#161f30] border border-slate-200 dark:border-white/[0.1] hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-600 dark:text-slate-300 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    +1.000.000
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustBalance(5000000)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#161f30] border border-slate-200 dark:border-white/[0.1] hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-600 dark:text-slate-300 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    +5.000.000
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustBalance(10000000)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#161f30] border border-slate-200 dark:border-white/[0.1] hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-600 dark:text-slate-300 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    +10.000.000
                  </button>
                  <button
                    type="button"
                    onClick={setZeroBalance}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#161f30] border border-slate-200 dark:border-white/[0.1] hover:border-rose-400 hover:text-rose-600 text-slate-500 dark:text-slate-400 text-[10px] font-semibold transition-colors ml-auto cursor-pointer"
                  >
                    Về 0
                  </button>
                </div>
              </div>

              {/* Color and Icon Picker */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Màu nhận diện</label>
                  <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#161f30]">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <span className="text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300">{color}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Biểu tượng</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-[#161f30] text-slate-800 dark:text-white text-xs font-medium"
                  >
                    <option value="Landmark" className="dark:bg-[#161f30]">Landmark (Ngân hàng)</option>
                    <option value="Wallet" className="dark:bg-[#161f30]">Wallet (Ví tiền)</option>
                    <option value="CreditCard" className="dark:bg-[#161f30]">CreditCard (Thẻ)</option>
                    <option value="PiggyBank" className="dark:bg-[#161f30]">PiggyBank (Heo tiết kiệm)</option>
                    <option value="TrendingUp" className="dark:bg-[#161f30]">TrendingUp (Đầu tư)</option>
                    <option value="Building2" className="dark:bg-[#161f30]">Building2 (Tòa nhà)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] font-semibold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                >
                  {editingAcc ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
