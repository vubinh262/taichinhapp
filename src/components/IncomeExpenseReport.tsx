import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { TimeRange } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon, 
  AlertCircle,
  PiggyBank,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface IncomeExpenseReportProps {
  timeRange: TimeRange;
}

export const IncomeExpenseReport: React.FC<IncomeExpenseReportProps> = ({ timeRange }) => {
  const { transactions, categories, formatCurrency } = useFinance();
  const { isDark } = useTheme();

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      const txDate = new Date(t.date);
      if (timeRange === 'THIS_MONTH') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      if (timeRange === 'LAST_MONTH') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return txDate.getMonth() === lastMonth && txDate.getFullYear() === year;
      }
      if (timeRange === 'THIS_QUARTER') {
        const currentQ = Math.floor(now.getMonth() / 3);
        const txQ = Math.floor(txDate.getMonth() / 3);
        return currentQ === txQ && txDate.getFullYear() === now.getFullYear();
      }
      if (timeRange === 'THIS_YEAR') {
        return txDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, timeRange]);

  // Total Income and Expense
  const { totalIncome, totalExpense, balanceSurplus, savingsRate } = useMemo(() => {
    let inc = 0;
    let exp = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === 'INCOME') inc += t.amount;
      if (t.type === 'EXPENSE') exp += t.amount;
    });

    const surplus = inc - exp;
    const rate = inc > 0 ? Math.round((surplus / inc) * 100) : 0;

    return {
      totalIncome: inc,
      totalExpense: exp,
      balanceSurplus: surplus,
      savingsRate: rate
    };
  }, [filteredTransactions]);

  // Breakdown by Expense Category
  const expenseByCategory = useMemo(() => {
    const map: { [catId: string]: { categoryId: string; name: string; amount: number; color: string; icon: string } } = {};

    filteredTransactions.forEach((t) => {
      if (t.type === 'EXPENSE' && t.categoryId) {
        if (!map[t.categoryId]) {
          const cat = categories.find((c) => c.id === t.categoryId);
          map[t.categoryId] = {
            categoryId: t.categoryId,
            name: cat ? cat.name : 'Khác',
            amount: 0,
            color: cat ? cat.color : '#94a3b8',
            icon: cat ? cat.icon : 'Receipt'
          };
        }
        map[t.categoryId].amount += t.amount;
      }
    });

    const items = Object.values(map).sort((a, b) => b.amount - a.amount);
    return items.map((item) => ({
      ...item,
      percentage: totalExpense > 0 ? ((item.amount / totalExpense) * 100).toFixed(1) : '0'
    }));
  }, [filteredTransactions, categories, totalExpense]);

  // Breakdown by Income Category
  const incomeByCategory = useMemo(() => {
    const map: { [catId: string]: { categoryId: string; name: string; amount: number; color: string; icon: string } } = {};

    filteredTransactions.forEach((t) => {
      if (t.type === 'INCOME' && t.categoryId) {
        if (!map[t.categoryId]) {
          const cat = categories.find((c) => c.id === t.categoryId);
          map[t.categoryId] = {
            categoryId: t.categoryId,
            name: cat ? cat.name : 'Khác',
            amount: 0,
            color: cat ? cat.color : '#10b981',
            icon: cat ? cat.icon : 'Briefcase'
          };
        }
        map[t.categoryId].amount += t.amount;
      }
    });

    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, categories]);

  // Monthly Comparison Chart Data
  const monthlyComparison = useMemo(() => {
    const buckets: { [key: string]: { name: string; income: number; expense: number } } = {};
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const display = `T${d.getMonth() + 1}/${d.getFullYear()}`;

      if (!buckets[key]) {
        buckets[key] = { name: display, income: 0, expense: 0 };
      }

      if (t.type === 'INCOME') buckets[key].income += t.amount;
      if (t.type === 'EXPENSE') buckets[key].expense += t.amount;
    });

    return Object.values(buckets);
  }, [transactions]);

  // Budget vs Actual for Expense Categories
  const budgetVsActual = useMemo(() => {
    const expCategories = categories.filter((c) => c.type === 'EXPENSE');

    return expCategories.map((cat) => {
      // Sum actual expense for this category in current filtered period
      const actual = filteredTransactions
        .filter((t) => t.type === 'EXPENSE' && t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);

      const budget = cat.budgetMonthly || 0;
      const percentUsed = budget > 0 ? Math.round((actual / budget) * 100) : 0;
      const isOverBudget = budget > 0 && actual > budget;

      return {
        ...cat,
        actual,
        budget,
        percentUsed,
        isOverBudget,
        remaining: budget - actual
      };
    }).sort((a, b) => b.actual - a.actual);
  }, [categories, filteredTransactions]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Báo cáo Thu Chi</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              Income & Expense
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Tổng hợp cơ cấu nguồn thu, phân tích hạng mục chi tiêu và giám sát ngân sách
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#161f30] text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-white/[0.08] shadow-2xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] self-start sm:self-auto">
          <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Tỷ lệ tiết kiệm: <strong className="font-mono">{savingsRate}%</strong></span>
        </div>
      </div>

      {/* 4 Tactile Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Income Card */}
        <div className="bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tổng Thu Nhập
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/70 dark:border-emerald-800/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums text-emerald-700 dark:text-emerald-400 mb-1.5">
            {formatCurrency(totalIncome)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {incomeByCategory.length} nguồn thu khác nhau
          </p>
        </div>

        {/* Expense Card */}
        <div className="bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-rose-300 dark:hover:border-rose-700/60 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tổng Chi Tiêu
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/70 dark:border-rose-800/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
              <TrendingDown className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums text-rose-600 dark:text-rose-400 mb-1.5">
            {formatCurrency(totalExpense)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {expenseByCategory.length} nhóm chi tiêu trong kỳ
          </p>
        </div>

        {/* Balance / Savings Surplus */}
        <div className="bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-teal-300 dark:hover:border-teal-700/60 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Thặng Dư Tích Lũy
            </span>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] ${
              balanceSurplus >= 0 
                ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/60' 
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/60'
            }`}>
              <PiggyBank className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums mb-1.5 ${
            balanceSurplus >= 0 ? 'text-teal-700 dark:text-teal-300' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatCurrency(balanceSurplus, true)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Thu nhập trừ chi tiêu thực tế
          </p>
        </div>

        {/* Savings Rate Ratio */}
        <div className="bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tỷ Lệ Tiết Kiệm
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-200/70 dark:border-indigo-800/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]" aria-hidden>
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums text-indigo-700 dark:text-indigo-400 mb-1.5">
            {savingsRate}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {savingsRate >= 20 ? 'Rất tốt (Mục tiêu chuẩn ≥20%)' : 'Nên tối ưu thêm chi tiêu'}
          </p>
        </div>
      </div>

      {/* Two Main Charts: Expense Structure & Monthly Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart: Cơ cấu chi tiêu */}
        <div className="lg:col-span-6 bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Cơ cấu Chi Tiêu Theo Hạng Mục</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tỷ trọng phần trăm từng nhóm chi phí trong tổng chi tiêu
            </p>
          </div>

          {expenseByCategory.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Chưa có giao dịch chi tiêu nào trong khoảng thời gian này.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {expenseByCategory.map((entry) => (
                        <Cell key={entry.categoryId} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [formatCurrency(Number(val) || 0), 'Số tiền']}
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

              {/* List legend with icons */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                {expenseByCategory.map((item) => (
                  <div key={item.categoryId} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <div 
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: item.color }}
                      >
                        <CategoryIcon name={item.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold font-mono tabular-nums text-slate-900 dark:text-white">{formatCurrency(item.amount)}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono font-bold">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar Chart: Thu vs Chi qua các tháng */}
        <div className="lg:col-span-6 bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                So Sánh Thu vs Chi Các Tháng
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lịch sử đối chiếu thu nhập và chi tiêu định kỳ
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block shadow-2xs" />
                <span className="text-slate-600 dark:text-slate-300">Thu nhập</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-rose-400 inline-block shadow-2xs" />
                <span className="text-slate-600 dark:text-slate-300">Chi tiêu</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparison} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => {
                    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(0)}Tr`;
                    return val;
                  }}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(val: any, name: any) => [
                    formatCurrency(Number(val) || 0),
                    name === 'income' ? 'Thu nhập' : 'Chi tiêu'
                  ]}
                  contentStyle={{
                    backgroundColor: isDark ? '#111827' : '#fff',
                    borderRadius: '16px',
                    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '12px'
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ display: 'none' }} />
                {/* Rounded bars */}
                <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expense" fill="#f87171" radius={[8, 8, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Budget vs Actual Monitoring Table */}
      <div className="bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Tiến Độ Ngân Sách Chi Tiêu (Budget vs Actual)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kiểm soát hạn mức chi tiêu đã thiết lập để không bị vỡ kế hoạch tài chính
            </p>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Có thể điều chỉnh hạn mức ngân sách trong mục <strong className="text-emerald-700 dark:text-emerald-400">Setup</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetVsActual.map((item) => {
            const isDanger = item.isOverBudget;
            const isWarning = !isDanger && item.percentUsed >= 80;

            return (
              <div 
                key={item.id} 
                className={`p-4 rounded-2xl border transition-all ${
                  isDanger 
                    ? 'border-rose-200/90 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30' 
                    : isWarning 
                    ? 'border-amber-200/90 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/30' 
                    : 'border-slate-200/70 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] hover:bg-slate-100/60 dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: item.color }}
                    >
                      <CategoryIcon name={item.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.name}</h4>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Hạn mức: {item.budget > 0 ? formatCurrency(item.budget) : 'Chưa đặt'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-xs font-bold font-mono tabular-nums ${isDanger ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                      {formatCurrency(item.actual)}
                    </div>
                    <div className="text-[11px] font-semibold flex items-center justify-end gap-1">
                      {isDanger ? (
                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5 font-mono">
                          <AlertCircle className="w-3 h-3" />
                          Vượt {formatCurrency(Math.abs(item.remaining))} · đã dùng {item.percentUsed}%
                        </span>
                      ) : item.budget > 0 ? (
                        <span className={`font-mono ${isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          Còn {formatCurrency(item.remaining)} · đã dùng {item.percentUsed}%
                        </span>
                      ) : (
                        <span className="text-slate-400">Không giới hạn</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {item.budget > 0 && (
                  <div className="w-full bg-slate-200/80 dark:bg-white/[0.1] h-2 rounded-full overflow-hidden mt-2.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDanger 
                          ? 'bg-rose-500' 
                          : isWarning 
                          ? 'bg-amber-500' 
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, item.percentUsed)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

