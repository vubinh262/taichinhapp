import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Transaction, TransactionType } from '../types';
import { useFinance } from '../context/FinanceContext';
import { QuickAdd } from './QuickAdd';
import { CategoryIcon } from './CategoryIcon';
import { 
  X, 
  ArrowRight, 
  ArrowUpDown, 
  Check, 
  AlertCircle, 
  TrendingDown, 
  TrendingUp, 
  ArrowLeftRight, 
  Calendar, 
  Clock, 
  Wallet, 
  Tag, 
  FileText, 
  Plus,
  ChevronDown,
  Search,
  Sparkles
} from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
  initialType?: TransactionType;
}

const QUICK_EXPENSE_NOTES = ['☕ Cà phê', '🍚 Ăn trưa', '🍜 Ăn tối', '🛒 Siêu thị', '⛽ Xăng xe', '⚡ Điện nước', '💊 Thuốc men'];
const QUICK_INCOME_NOTES = ['💰 Tiền lương', '🎁 Thưởng', '📈 Lãi tiết kiệm', '📦 Bán hàng', '🧧 Quà biếu'];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  editingTransaction,
  initialType = 'EXPENSE'
}) => {
  const { categories, accounts, transactions, addTransaction, updateTransaction, formatCurrency, getAccountBalance } = useFinance();

  const [type, setType] = useState<TransactionType>(initialType);
  const [rawAmount, setRawAmount] = useState<number>(0);
  const [amountDisplay, setAmountDisplay] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [note, setNote] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when opened or editing
  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      setType(editingTransaction.type);
      const amt = Number(editingTransaction.amount) || 0;
      setRawAmount(amt);
      setAmountDisplay(amt > 0 ? amt.toLocaleString('vi-VN') : '');
      setDate(editingTransaction.date);
      setTime(editingTransaction.time || '12:00');
      setCategoryId(editingTransaction.categoryId || '');
      setAccountId(editingTransaction.accountId);
      setToAccountId(editingTransaction.toAccountId || '');
      setNote(editingTransaction.note || '');
      setTags(editingTransaction.tags || []);
    } else {
      const defaultType = initialType || 'EXPENSE';
      setType(defaultType);
      setRawAmount(0);
      setAmountDisplay('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }));
      setNote('');
      setTags([]);
      setError(null);
      setCategorySearch('');
      setIsAccountPickerOpen(false);

      // Default category and accounts
      const firstCat = categories.find((c) => c.type === defaultType);
      if (firstCat) setCategoryId(firstCat.id);
      if (accounts.length > 0) setAccountId(accounts[0].id);
      if (accounts.length > 1) setToAccountId(accounts[1].id);
    }
  }, [isOpen, editingTransaction, initialType, categories, accounts]);

  // When type changes, ensure valid category
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setError(null);
    if (newType !== 'TRANSFER') {
      const matchCat = categories.find((c) => c.type === newType);
      if (matchCat) setCategoryId(matchCat.id);
    }
  };

  // Amount formatting & parsing
  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    if (!rawVal) {
      setRawAmount(0);
      setAmountDisplay('');
      return;
    }
    const num = parseInt(rawVal, 10);
    setRawAmount(num);
    setAmountDisplay(num.toLocaleString('vi-VN'));
  };

  const handleQuickAdd = (addValue: number) => {
    const nextAmount = rawAmount + addValue;
    setRawAmount(nextAmount);
    setAmountDisplay(nextAmount.toLocaleString('vi-VN'));
  };

  const handleAddZeroes = () => {
    if (rawAmount === 0) return;
    const nextAmount = rawAmount * 1000;
    setRawAmount(nextAmount);
    setAmountDisplay(nextAmount.toLocaleString('vi-VN'));
  };

  const handleClearAmount = () => {
    setRawAmount(0);
    setAmountDisplay('');
    if (amountInputRef.current) {
      amountInputRef.current.focus();
    }
  };

  // Quick date presets
  const handleSetQuickDate = (preset: 'today' | 'yesterday') => {
    const now = new Date();
    if (preset === 'today') {
      setDate(now.toISOString().split('T')[0]);
    } else if (preset === 'yesterday') {
      now.setDate(now.getDate() - 1);
      setDate(now.toISOString().split('T')[0]);
    }
    setShowDatePicker(false);
  };

  // Quick note tag
  const handleQuickNote = (val: string) => {
    const cleanVal = val.replace(/^[^\s]+\s/, ''); // remove leading emoji
    if (!note) {
      setNote(cleanVal);
    } else if (!note.includes(cleanVal)) {
      setNote(`${note}, ${cleanVal}`);
    }
  };

  // Swap transfer accounts
  const handleSwapTransferAccounts = () => {
    const temp = accountId;
    setAccountId(toAccountId);
    setToAccountId(temp);
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rawAmount <= 0) {
      setError('Vui lòng nhập số tiền giao dịch hợp lệ (> 0 ₫)');
      return;
    }

    if (!accountId) {
      setError('Vui lòng chọn tài khoản giao dịch');
      return;
    }

    if (type === 'TRANSFER') {
      if (!toAccountId) {
        setError('Vui lòng chọn tài khoản nhận tiền chuyển');
        return;
      }
      if (accountId === toAccountId) {
        setError('Tài khoản nguồn và tài khoản đích không được trùng nhau');
        return;
      }
    } else {
      if (!categoryId) {
        setError('Vui lòng chọn hạng mục phân loại');
        return;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txPayload: any = {
      type,
      amount: rawAmount,
      date,
      time: time || new Date().toTimeString().substring(0, 5),
      accountId,
      note: note.trim(),
      tags: tags || []
    };

    if (type === 'TRANSFER') {
      if (toAccountId) txPayload.toAccountId = toAccountId;
    } else {
      if (categoryId) txPayload.categoryId = categoryId;
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, txPayload);
    } else {
      addTransaction(txPayload);
    }

    onClose();
  };

  if (!isOpen) return null;

  // Filter categories by type and search query
  // Hạng mục hay dùng nhất lên đầu để chọn nhanh hơn
  const usage: Record<string, number> = {};
  transactions.forEach((t) => {
    if (t.categoryId) usage[t.categoryId] = (usage[t.categoryId] || 0) + 1;
  });
  const filteredCategories = categories
    .filter((c) => {
      if (c.type !== type) return false;
      if (!categorySearch.trim()) return true;
      return c.name.toLowerCase().includes(categorySearch.trim().toLowerCase());
    })
    .sort((a, b) => (usage[b.id] || 0) - (usage[a.id] || 0));

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedToAccount = accounts.find((a) => a.id === toAccountId);

  const isToday = date === new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date === yesterday.toISOString().split('T')[0];

  return createPortal(
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="modal-transaction"
        className="w-full sm:max-w-xl bg-white dark:bg-[#111827] rounded-t-[28px] sm:rounded-3xl shadow-2xl shadow-slate-900/15 dark:shadow-black/70 border border-slate-200/90 dark:border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Pill */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between bg-white dark:bg-[#111827] shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs ${
              type === 'EXPENSE' ? 'bg-slate-900' : type === 'INCOME' ? 'bg-emerald-600' : 'bg-slate-700'
            }`}>
              {type === 'EXPENSE' && <TrendingDown className="w-4 h-4" />}
              {type === 'INCOME' && <TrendingUp className="w-4 h-4" />}
              {type === 'TRANSFER' && <ArrowLeftRight className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {editingTransaction ? 'Chỉnh sửa giao dịch' : 'Ghi chép giao dịch'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {type === 'EXPENSE' && 'Ghi nhận chi tiêu sinh hoạt & thanh toán'}
                {type === 'INCOME' && 'Ghi nhận tiền lương, thưởng & thu nhập'}
                {type === 'TRANSFER' && 'Chuyển tiền giữa các tài khoản / ví'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            title="Đóng hộp thoại"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5 overscroll-contain">
          {!editingTransaction && type !== 'TRANSFER' && (
            <>
              <QuickAdd onSaved={onClose} />
              <div className="flex items-center gap-3 text-xs font-medium text-slate-500" aria-hidden>
                <span className="flex-1 h-px bg-slate-900/10 dark:bg-white/10" />
                hoặc nhập tay
                <span className="flex-1 h-px bg-slate-900/10 dark:bg-white/10" />
              </div>
            </>
          )}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Type Selector (Segmented Switcher) */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/90 dark:bg-white/[0.04] rounded-2xl border border-slate-200/60 dark:border-white/[0.06] shadow-2xs">
            <button
              type="button"
              id="btn-type-expense"
              onClick={() => handleTypeChange('EXPENSE')}
              className={`py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.04]'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Chi tiêu</span>
            </button>
            <button
              type="button"
              id="btn-type-income"
              onClick={() => handleTypeChange('INCOME')}
              className={`py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.04]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Thu nhập</span>
            </button>
            <button
              type="button"
              id="btn-type-transfer"
              onClick={() => handleTypeChange('TRANSFER')}
              className={`py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'TRANSFER'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.04]'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Chuyển ví</span>
            </button>
          </div>

          {/* Hero Amount Section */}
          <div className="bg-slate-50/90 dark:bg-white/[0.03] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15 transition-all">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              <span>Số tiền giao dịch</span>
              {rawAmount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAmount}
                  className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Xóa số tiền</span>
                </button>
              )}
            </div>

            {/* Input & Currency Display */}
            <div className="relative flex items-center">
              <input
                ref={amountInputRef}
                id="input-transaction-amount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={amountDisplay}
                onChange={handleAmountInputChange}
                autoFocus
                className={`w-full text-3xl sm:text-4xl font-extrabold font-mono tracking-tight bg-transparent focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 tabular-nums pr-12 ${
                  type === 'EXPENSE'
                    ? 'text-rose-600 dark:text-rose-400'
                    : type === 'INCOME'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-indigo-600 dark:text-indigo-400'
                }`}
              />
              <span className="absolute right-0 text-xl sm:text-2xl font-bold font-mono text-slate-400 pointer-events-none">
                ₫
              </span>
            </div>

            {/* Quick Amount Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 mt-1 border-t border-slate-200/60 dark:border-white/[0.06]">
              {[20000, 50000, 100000, 200000, 500000, 1000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAdd(val)}
                  className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 font-semibold font-mono tabular-nums shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  +{val >= 1000000 ? `${val / 1000000} tr` : `${val / 1000}k`}
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddZeroes}
                className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold font-mono shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                title="Thêm 3 số 0 (Nhân 1.000)"
              >
                +000
              </button>
            </div>
          </div>

          {/* Category Selection Grid (For Expense / Income) */}
          {type !== 'TRANSFER' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>Hạng mục phân loại</span>
                  {selectedCategory && (
                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                      (Đã chọn: <strong className="text-slate-800 dark:text-slate-200">{selectedCategory.name}</strong>)
                    </span>
                  )}
                </label>

                {categories.filter((c) => c.type === type).length > 8 && (
                  <div className="relative w-36 sm:w-44">
                    <input
                      type="text"
                      placeholder="Tìm hạng mục..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full text-[11px] pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#161f30] text-slate-800 dark:text-white focus:bg-white dark:focus:bg-[#161f30] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Modern Grid with Squircle Icons and full wrapped text */}
              <div className="grid grid-cols-4 gap-2.5 p-1.5 border border-slate-100 dark:border-white/[0.06] rounded-2xl bg-slate-50/60 dark:bg-white/[0.02]">
                {filteredCategories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`group relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-white dark:bg-[#161f30] ring-2 ring-emerald-600 shadow-sm'
                          : 'border-transparent bg-white/70 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] hover:border-slate-200 dark:hover:border-white/[0.1] shadow-2xs'
                      }`}
                    >
                      {/* Squircle Icon Container */}
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105 relative"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="w-5 h-5" />
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#111827]">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Clean 2-line wrapped title without truncation */}
                      <span className={`text-[11px] font-medium mt-1.5 leading-tight text-center max-w-[72px] line-clamp-2 ${
                        isSelected ? 'text-emerald-950 dark:text-emerald-300 font-bold' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Account Selector (For Expense / Income) */}
          {type !== 'TRANSFER' ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {type === 'INCOME' ? 'Tài khoản nhận tiền' : 'Tài khoản chi trả'}
                </label>
                {selectedAccount && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Số dư: <strong className="font-mono text-emerald-700 dark:text-emerald-400">{formatCurrency(getAccountBalance(selectedAccount.id))}</strong>
                  </span>
                )}
              </div>

              {/* Account Dropdown with live balance & logo */}
              <div className="relative">
                <button
                  type="button"
                  id="select-account-btn"
                  onClick={() => setIsAccountPickerOpen(!isAccountPickerOpen)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15] bg-white dark:bg-[#161f30] shadow-2xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all text-left cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs"
                      style={{ backgroundColor: selectedAccount?.color || '#059669' }}
                    >
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-white">
                        {selectedAccount?.name || 'Chọn tài khoản'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {selectedAccount?.institution || selectedAccount?.type || 'Ví tiền'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {selectedAccount ? formatCurrency(getAccountBalance(selectedAccount.id)) : ''}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </button>

                {/* Account Picker Popup Menu */}
                {isAccountPickerOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white dark:bg-[#161f30] rounded-xl border border-slate-200 dark:border-white/[0.1] shadow-xl max-h-52 overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {accounts.map((acc) => {
                      const balance = getAccountBalance(acc.id);
                      const isChosen = acc.id === accountId;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => {
                            setAccountId(acc.id);
                            setIsAccountPickerOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                            isChosen ? 'bg-emerald-50/80 dark:bg-emerald-950/50 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[11px] shrink-0"
                              style={{ backgroundColor: acc.color }}
                            >
                              <Wallet className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                                {acc.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {acc.institution || acc.type}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {formatCurrency(balance)}
                            </div>
                            {isChosen && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">✓ Đang chọn</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Interactive Transfer Flow (From Wallet -> To Wallet) */
            <div className="space-y-3 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-300">
                <span>Thông tin luân chuyển tiền</span>
                <button
                  type="button"
                  onClick={handleSwapTransferAccounts}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer bg-white dark:bg-[#161f30] px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-2xs active:scale-[0.98] transition-all"
                  title="Đổi chiều chuyển tiền"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  <span>Đổi chiều</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Source Account */}
                <div className="bg-white dark:bg-[#161f30] p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Từ tài khoản (Nguồn trừ)
                  </label>
                  <select
                    id="select-from-account"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 dark:text-white bg-transparent focus:outline-none"
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id} className="dark:bg-[#161f30]">
                        {acc.name} • {formatCurrency(getAccountBalance(acc.id))}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Account */}
                <div className="bg-white dark:bg-[#161f30] p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <span>Đến tài khoản (Đích nhận)</span>
                    <ArrowRight className="w-3 h-3 text-indigo-500" />
                  </label>
                  <select
                    id="select-to-account"
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 dark:text-white bg-transparent focus:outline-none"
                    required
                  >
                    <option value="" className="dark:bg-[#161f30]">-- Chọn ví nhận --</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id} disabled={acc.id === accountId} className="dark:bg-[#161f30]">
                        {acc.name} • {formatCurrency(getAccountBalance(acc.id))}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Date & Time Shortcuts */}
          <div className="bg-slate-50/70 dark:bg-white/[0.03] p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Thời gian giao dịch</span>
              </label>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSetQuickDate('today')}
                  className={`text-[11px] px-2.5 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    isToday ? 'bg-emerald-600 text-white' : 'bg-slate-200/80 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/[0.12]'
                  }`}
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate('yesterday')}
                  className={`text-[11px] px-2.5 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    isYesterday ? 'bg-emerald-600 text-white' : 'bg-slate-200/80 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/[0.12]'
                  }`}
                >
                  Hôm qua
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                id="input-transaction-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-medium font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#161f30] text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
              <div className="relative">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full text-xs font-medium font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#161f30] text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Note & Quick Note Suggestions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Ghi chú diễn giải</span>
              </label>
            </div>
            <input
              id="input-transaction-note"
              type="text"
              placeholder="VD: Cà phê sáng, Lương tháng 9, Tiền chợ..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#161f30] text-slate-800 dark:text-white placeholder:text-slate-400"
            />

            {/* Common note suggestions */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-2 pt-0.5">
              {(type === 'INCOME' ? QUICK_INCOME_NOTES : QUICK_EXPENSE_NOTES).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleQuickNote(item)}
                  className="shrink-0 text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 font-medium transition-colors cursor-pointer active:scale-[0.98]"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Tags (Thẻ phân loại) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Thẻ gắn kèm (Tags)</span>
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập hashtag rồi nhấn Thêm (VD: Gia đình, Công việc)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#161f30] text-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer active:scale-[0.98]"
              >
                Thêm
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800/60"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-600 ml-0.5 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Mobile/Desktop Footer Action Bar */}
        <div className="sticky bottom-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2.5 shrink-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer text-center active:scale-[0.98]"
          >
            Hủy bỏ
          </button>

          <button
            id="btn-save-transaction"
            type="button"
            onClick={handleSubmit}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-all active:scale-[0.98] cursor-pointer ${
              type === 'EXPENSE'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                : type === 'INCOME'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">
              {editingTransaction
                ? 'Lưu thay đổi'
                : rawAmount > 0
                ? `${type === 'EXPENSE' ? 'Chi' : type === 'INCOME' ? 'Thu' : 'Chuyển'} ${rawAmount.toLocaleString('vi-VN')} ₫`
                : 'Ghi nhận giao dịch'}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
