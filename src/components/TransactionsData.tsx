import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { Transaction, TransactionType } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Tag,
  ArrowUpDown,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';

interface TransactionsDataProps {
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionsData: React.FC<TransactionsDataProps> = ({
  onOpenNewTransaction,
  onEditTransaction
}) => {
  const { 
    transactions, 
    categories, 
    accounts, 
    formatCurrency, 
    deleteTransaction,
    deleteMultipleTransactions 
  } = useFinance();

  // Multi-select state
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filtered and Sorted list
  const filteredList = useMemo(() => {
    return transactions.filter((t) => {
      // Type
      if (selectedType !== 'ALL' && t.type !== selectedType) return false;

      // Account
      if (selectedAccount !== 'ALL') {
        if (t.type === 'TRANSFER') {
          if (t.accountId !== selectedAccount && t.toAccountId !== selectedAccount) return false;
        } else {
          if (t.accountId !== selectedAccount) return false;
        }
      }

      // Category
      if (selectedCategory !== 'ALL' && t.categoryId !== selectedCategory) return false;

      // Date range
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const noteMatch = (t.note || '').toLowerCase().includes(query);
        const tagMatch = (t.tags || []).some((tag) => tag.toLowerCase().includes(query));
        const cat = categories.find((c) => c.id === t.categoryId);
        const catMatch = cat?.name.toLowerCase().includes(query);
        const acc = accounts.find((a) => a.id === t.accountId);
        const accMatch = acc?.name.toLowerCase().includes(query);

        if (!noteMatch && !tagMatch && !catMatch && !accMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
      return sortOrder === 'DESC' ? dateB - dateA : dateA - dateB;
    });
  }, [transactions, selectedType, selectedAccount, selectedCategory, startDate, endDate, searchTerm, sortOrder, categories, accounts]);

  // Pagination items
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Aggregate stats of filtered results
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredList.forEach((t) => {
      if (t.type === 'INCOME') income += t.amount;
      if (t.type === 'EXPENSE') expense += t.amount;
    });
    return {
      count: filteredList.length,
      income,
      expense,
      net: income - expense
    };
  }, [filteredList]);

  // Multi-select helper computed states
  const isAllPageSelected = useMemo(() => {
    return paginatedList.length > 0 && paginatedList.every((tx) => selectedTxIds.has(tx.id));
  }, [paginatedList, selectedTxIds]);

  const isSomePageSelected = useMemo(() => {
    return paginatedList.some((tx) => selectedTxIds.has(tx.id)) && !isAllPageSelected;
  }, [paginatedList, selectedTxIds, isAllPageSelected]);

  const toggleSelectOne = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        paginatedList.forEach((tx) => next.delete(tx.id));
      } else {
        paginatedList.forEach((tx) => next.add(tx.id));
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedTxIds(new Set(filteredList.map((tx) => tx.id)));
  };

  const clearSelection = () => {
    setSelectedTxIds(new Set());
  };

  const handleBatchDelete = async () => {
    if (selectedTxIds.size === 0) return;
    const count = selectedTxIds.size;
    const isConfirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa nhanh ${count} giao dịch đã chọn?\n\nThao tác này sẽ xóa vĩnh viễn và tự động cập nhật lại số dư các tài khoản liên quan.`
    );
    if (!isConfirmed) return;

    setIsDeletingBatch(true);
    try {
      const idsToDelete: string[] = Array.from(selectedTxIds);
      await deleteMultipleTransactions(idsToDelete);
      setSelectedTxIds(new Set());
      setFeedbackMessage(`Đã xóa thành công ${count} giao dịch.`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      console.error('Error batch deleting transactions:', err);
      alert('Đã xảy ra lỗi khi xóa giao dịch. Vui lòng thử lại.');
    } finally {
      setIsDeletingBatch(false);
    }
  };

  // Export to CSV with UTF-8 BOM for perfect Excel Vietnamese rendering
  const handleExportCSV = () => {
    const headers = ['Mã GD', 'Ngày', 'Giờ', 'Loại', 'Hạng mục', 'Số tiền', 'Tài khoản nguồn', 'Tài khoản nhận', 'Ghi chú', 'Thẻ tags'];
    const rows = filteredList.map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      const fromAcc = accounts.find((a) => a.id === t.accountId);
      const toAcc = accounts.find((a) => a.id === t.toAccountId);

      return [
        t.id,
        t.date,
        t.time || '',
        t.type === 'INCOME' ? 'Thu nhập' : t.type === 'EXPENSE' ? 'Chi tiêu' : 'Chuyển khoản',
        cat ? cat.name : (t.type === 'TRANSFER' ? 'Chuyển nội bộ' : 'Khác'),
        t.amount,
        fromAcc ? fromAcc.name : t.accountId,
        toAcc ? toAcc.name : '',
        `"${(t.note || '').replace(/"/g, '""')}"`,
        `"${(t.tags || []).join(', ')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Giao_Dich_Tai_Chinh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('ALL');
    setSelectedAccount('ALL');
    setSelectedCategory('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Dữ Liệu Giao Dịch</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              Records
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Sổ chi tiết toàn bộ các khoản thu chi và chuyển khoản với bộ lọc nâng cao
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.06] text-xs font-semibold shadow-2xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Xuất Excel/CSV</span>
          </button>
          <button
            onClick={onOpenNewTransaction}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm shadow-emerald-700/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm giao dịch</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Container */}
      <div className="bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] space-y-4">
        {/* Search input & Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm theo ghi chú, tên hạng mục, thẻ tag hoặc tài khoản..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/70 dark:bg-white/[0.03] text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#161f30] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-xs font-semibold text-slate-700 dark:text-slate-200 self-start sm:self-auto cursor-pointer shadow-2xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] active:scale-[0.98] transition-all"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{sortOrder === 'DESC' ? 'Mới nhất trước' : 'Cũ nhất trước'}</span>
          </button>
        </div>

        {/* Detailed Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06] text-xs">
          {/* Filter by Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-400 mb-1.5">Loại giao dịch</label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#161f30] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
            >
              <option value="ALL" className="dark:bg-[#161f30]">Tất cả các loại</option>
              <option value="INCOME" className="dark:bg-[#161f30]">Chỉ Thu nhập</option>
              <option value="EXPENSE" className="dark:bg-[#161f30]">Chỉ Chi tiêu</option>
              <option value="TRANSFER" className="dark:bg-[#161f30]">Chuyển khoản</option>
            </select>
          </div>

          {/* Filter by Account */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-400 mb-1.5">Tài khoản</label>
            <select
              value={selectedAccount}
              onChange={(e) => {
                setSelectedAccount(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#161f30] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
            >
              <option value="ALL" className="dark:bg-[#161f30]">Tất cả tài khoản</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="dark:bg-[#161f30]">
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-400 mb-1.5">Hạng mục</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#161f30] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
            >
              <option value="ALL" className="dark:bg-[#161f30]">Tất cả hạng mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="dark:bg-[#161f30]">
                  {cat.type === 'INCOME' ? '[Thu]' : '[Chi]'} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Date Range */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-400 mb-1.5">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#161f30] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
            />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-400 mb-1.5">Đến ngày</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#161f30] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
              />
            </div>
            {(searchTerm || selectedType !== 'ALL' || selectedAccount !== 'ALL' || selectedCategory !== 'ALL' || startDate || endDate) && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 text-[11px] text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors shrink-0 cursor-pointer font-semibold"
                title="Đặt lại bộ lọc"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* Filter Summary Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-white/[0.03] p-3.5 rounded-2xl border border-slate-200/60 dark:border-white/[0.05]">
          <div>
            Hiển thị <strong className="text-slate-800 dark:text-slate-200">{filteredList.length}</strong> giao dịch phù hợp
          </div>
          <div className="flex flex-wrap items-center gap-4 font-semibold font-mono tabular-nums">
            <span className="text-emerald-700 dark:text-emerald-400">
              Tổng thu: +{formatCurrency(stats.income)}
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              Tổng chi: -{formatCurrency(stats.expense)}
            </span>
            <span className={stats.net >= 0 ? 'text-teal-700 dark:text-teal-300' : 'text-rose-600 dark:text-rose-400'}>
              Dòng tiền ròng: {formatCurrency(stats.net, true)}
            </span>
          </div>
        </div>
      </div>

      {/* Success / Info Feedback Banner */}
      {feedbackMessage && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button 
            onClick={() => setFeedbackMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-300 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Multi-Select Floating Action Toolbar */}
      {selectedTxIds.size > 0 && (
        <div className="bg-white dark:bg-[#161f30] border border-emerald-500/40 dark:border-emerald-400/30 rounded-2xl sm:rounded-3xl p-3.5 sm:px-6 flex flex-wrap items-center justify-between gap-3 shadow-md shadow-emerald-900/5 dark:shadow-black/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-emerald-700/30">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-white">
                Đã chọn <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-sm font-mono">{selectedTxIds.size}</span> giao dịch
              </span>
              {filteredList.length > paginatedList.length && selectedTxIds.size < filteredList.length && (
                <button
                  onClick={selectAllFiltered}
                  className="ml-2 text-emerald-700 dark:text-emerald-400 underline font-semibold hover:text-emerald-900 dark:hover:text-emerald-300 cursor-pointer"
                >
                  (Chọn tất cả {filteredList.length} giao dịch lọc)
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearSelection}
              className="px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer"
            >
              Bỏ chọn
            </button>
            <button
              onClick={handleBatchDelete}
              disabled={isDeletingBatch}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold shadow-xs shadow-rose-700/20 transition-all cursor-pointer"
              title="Xóa nhanh các giao dịch đã chọn"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeletingBatch ? 'Đang xóa...' : `Xóa ${selectedTxIds.size} giao dịch đã chọn`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Transactions Table */}
      <div className="bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200/70 dark:border-white/[0.06] text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomePageSelected;
                    }}
                    onChange={toggleSelectAllPage}
                    title={isAllPageSelected ? 'Bỏ chọn trang này' : 'Chọn tất cả giao dịch ở trang này'}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-white/[0.2] dark:bg-[#161f30] cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Phân loại & Hạng mục</th>
                <th className="py-3 px-4">Ghi chú & Thẻ</th>
                <th className="py-3 px-4">Tài khoản</th>
                <th className="py-3 px-4 text-right">Số tiền</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy giao dịch nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginatedList.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const fromAcc = accounts.find((a) => a.id === tx.accountId);
                  const toAcc = accounts.find((a) => a.id === tx.toAccountId);

                  const isIncome = tx.type === 'INCOME';
                  const isExpense = tx.type === 'EXPENSE';
                  const isTransfer = tx.type === 'TRANSFER';
                  const isSelected = selectedTxIds.has(tx.id);

                  return (
                    <tr 
                      key={tx.id} 
                      className={`transition-colors group ${
                        isSelected 
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/60' 
                          : 'hover:bg-slate-50/70 dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      {/* Checkbox column */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(tx.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-white/[0.2] dark:bg-[#161f30] cursor-pointer"
                        />
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white font-mono">{tx.date}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{tx.time || '--:--'}</div>
                      </td>

                      {/* Category & Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ 
                              backgroundColor: isTransfer ? '#6366f1' : (cat ? cat.color : '#94a3b8') 
                            }}
                          >
                            <CategoryIcon name={isTransfer ? 'ArrowRightLeft' : (cat ? cat.icon : 'Receipt')} className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {isTransfer ? 'Chuyển khoản nội bộ' : (cat ? cat.name : 'Khác')}
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              isIncome ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60' :
                              isExpense ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60' :
                              'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
                            }`}>
                              {isIncome ? 'Thu nhập' : isExpense ? 'Chi tiêu' : 'Chuyển tiền'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Note & Tags */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1 max-w-xs">
                          {tx.note || <span className="text-slate-400 dark:text-slate-500 italic">Không có ghi chú</span>}
                        </div>
                        {tx.tags && tx.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tx.tags.map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 font-medium"
                              >
                                <Tag className="w-2.5 h-2.5 text-slate-400" />
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Account */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isTransfer ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{fromAcc?.name || 'Tài khoản nguồn'}</span>
                            <ArrowRight className="w-3 h-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
                            <span className="font-medium text-indigo-700 dark:text-indigo-300">{toAcc?.name || 'Tài khoản đích'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                            <div 
                              className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: fromAcc?.color || '#94a3b8' }}
                            />
                            <span>{fromAcc?.name || 'Tài khoản'}</span>
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className={`text-sm font-bold font-mono tabular-nums ${
                          isIncome ? 'text-emerald-700 dark:text-emerald-400' :
                          isExpense ? 'text-rose-600 dark:text-rose-400' :
                          'text-indigo-600 dark:text-indigo-400'
                        }`}>
                          {isIncome && '+'}
                          {isExpense && '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                            title="Sửa giao dịch"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Bạn có chắc chắn muốn xóa giao dịch này không?')) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Xóa giao dịch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3.5 bg-slate-50/70 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Trang <strong className="text-slate-800 dark:text-slate-200 font-mono">{currentPage}</strong> trên <strong className="text-slate-800 dark:text-slate-200 font-mono">{totalPages}</strong> (Tổng cộng {filteredList.length} giao dịch)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-2 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#161f30] hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#161f30] hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
