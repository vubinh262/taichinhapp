import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { TimeRange } from '../types';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle,
  Wallet,
  Activity,
  CalendarCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface CashFlowReportProps {
  timeRange: TimeRange;
}

export const CashFlowReport: React.FC<CashFlowReportProps> = ({ timeRange }) => {
  const { transactions, accounts, formatCurrency, getAccountBalance } = useFinance();
  const { isDark } = useTheme();

  // Filter transactions according to time range
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
      return true; // ALL
    });
  }, [transactions, timeRange]);

  // Aggregate inflow, outflow, net
  const { totalInflow, totalOutflow, netCashFlow, savingsRate } = useMemo(() => {
    let inflow = 0;
    let outflow = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === 'INCOME') {
        inflow += t.amount;
      } else if (t.type === 'EXPENSE') {
        outflow += t.amount;
      }
    });

    const net = inflow - outflow;
    const rate = inflow > 0 ? Math.round((net / inflow) * 100) : 0;

    return {
      totalInflow: inflow,
      totalOutflow: outflow,
      netCashFlow: net,
      savingsRate: rate
    };
  }, [filteredTransactions]);

  // Cash Runway calculation (Liquid funds / Average monthly expense)
  const cashRunwayMonths = useMemo(() => {
    // Liquid accounts: CASH, BANK
    const liquidAssets = accounts
      .filter((a) => a.type === 'CASH' || a.type === 'BANK')
      .reduce((sum, a) => sum + Math.max(0, getAccountBalance(a.id)), 0);

    // Calculate monthly expense rate from all historical expense transactions
    const expenseTx = transactions.filter((t) => t.type === 'EXPENSE');
    const totalExp = expenseTx.reduce((sum, t) => sum + t.amount, 0);

    // Estimate number of months spanned by transactions (min 1)
    if (expenseTx.length === 0) return 12;
    const dates = expenseTx.map((t) => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates, Date.now());
    const months = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24 * 30));
    const avgMonthlyExp = totalExp / months;

    if (avgMonthlyExp <= 0) return 12;
    return parseFloat((liquidAssets / avgMonthlyExp).toFixed(1));
  }, [accounts, transactions, getAccountBalance]);

  // Group cash flow by monthly buckets for chart
  const monthlyChartData = useMemo(() => {
    const buckets: { [key: string]: { monthKey: string; name: string; inflow: number; outflow: number; net: number } } = {};

    // Sort chronologically
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const display = `T${d.getMonth() + 1}/${d.getFullYear()}`;

      if (!buckets[key]) {
        buckets[key] = { monthKey: key, name: display, inflow: 0, outflow: 0, net: 0 };
      }

      if (t.type === 'INCOME') {
        buckets[key].inflow += t.amount;
        buckets[key].net += t.amount;
      } else if (t.type === 'EXPENSE') {
        buckets[key].outflow += t.amount;
        buckets[key].net -= t.amount;
      }
    });

    return Object.values(buckets);
  }, [transactions]);

  // Cash flow by accounts breakdown
  const accountFlows = useMemo(() => {
    return accounts.map((acc) => {
      let inflow = 0;
      let outflow = 0;

      filteredTransactions.forEach((t) => {
        if (t.accountId === acc.id) {
          if (t.type === 'INCOME') inflow += t.amount;
          if (t.type === 'EXPENSE') outflow += t.amount;
          if (t.type === 'TRANSFER') outflow += t.amount;
        }
        if (t.type === 'TRANSFER' && t.toAccountId === acc.id) {
          inflow += t.amount;
        }
      });

      return {
        ...acc,
        inflow,
        outflow,
        net: inflow - outflow,
        currentBalance: getAccountBalance(acc.id)
      };
    });
  }, [accounts, filteredTransactions, getAccountBalance]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Báo cáo Dòng tiền</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              Cash Flow
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Theo dõi tổng tiền vào, tiền ra và tốc độ tích lũy thực tế của dòng tiền
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#161f30] text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-slate-200/80 dark:border-white/[0.08] shadow-2xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] self-start sm:self-auto">
          <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Sức khỏe dòng tiền: {netCashFlow >= 0 ? 'Thặng dư tích cực' : 'Thâm hụt cần chú ý'}</span>
        </div>
      </div>

      {/* 4 Tactile KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Inflow */}
        <div className="bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Dòng tiền vào (Inflows)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/70 dark:border-emerald-800/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums text-slate-900 dark:text-white mb-1.5">
            {formatCurrency(totalInflow)}
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Nguồn thu nhập thực nhận</span>
          </p>
        </div>

        {/* Total Outflow */}
        <div className="bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-rose-300 dark:hover:border-rose-700/60 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Dòng tiền ra (Outflows)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/70 dark:border-rose-800/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
              <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums text-rose-600 dark:text-rose-400 mb-1.5">
            {formatCurrency(totalOutflow)}
          </div>
          <p className="text-xs text-rose-700/90 dark:text-rose-300/80 font-medium">
            Chi phí sinh hoạt & tiêu dùng
          </p>
        </div>

        {/* Net Cash Flow */}
        <div className="bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-teal-300 dark:hover:border-teal-700/60 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Dòng tiền thuần (Net Flow)
            </span>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] ${
              netCashFlow >= 0 
                ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/60' 
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/60'
            }`}>
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums mb-1.5 ${
            netCashFlow >= 0 ? 'text-teal-700 dark:text-teal-300' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatCurrency(netCashFlow, true)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tỷ lệ tích lũy: <strong className="text-slate-800 dark:text-slate-200 font-mono">{savingsRate}%</strong> dòng tiền
          </p>
        </div>

        {/* Emergency Runway */}
        <div className="bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-blue-300 dark:hover:border-blue-700/60 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Dự phòng sinh hoạt
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/70 dark:border-blue-800/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
              {cashRunwayMonths >= 6 ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
              )}
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums text-slate-900 dark:text-white mb-1.5">
            {cashRunwayMonths} <span className="text-base font-sans font-semibold text-slate-400 dark:text-slate-500">tháng</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {cashRunwayMonths >= 6 
              ? 'Đạt ngưỡng an toàn tài chính (≥ 6 tháng)' 
              : 'Nên duy trì quỹ dự phòng 3 - 6 tháng'}
          </p>
        </div>
      </div>

      {/* Main Chart: Cash Flow Over Time */}
      <div className="bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Xu hướng Dòng tiền Theo Thời Gian
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              So sánh dòng tiền vào, dòng tiền ra và dòng tiền thuần tích lũy qua các tháng
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block shadow-2xs" />
              <span className="text-slate-600 dark:text-slate-300">Tiền vào</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-400 inline-block shadow-2xs" />
              <span className="text-slate-600 dark:text-slate-300">Tiền ra</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-teal-500 inline-block shadow-2xs" />
              <span className="text-slate-600 dark:text-slate-300">Dòng tiền thuần</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
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
                  if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}k`;
                  return val;
                }}
              />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => {
                  const labelMap: Record<string, string> = {
                    inflow: 'Tiền vào',
                    outflow: 'Tiền ra',
                    net: 'Dòng tiền thuần'
                  };
                  return [formatCurrency(Number(value) || 0), labelMap[name] || name];
                }}
                contentStyle={{
                  backgroundColor: isDark ? '#111827' : '#ffffff',
                  borderRadius: '16px',
                  border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0',
                  boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.08)',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  fontSize: '12px'
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ display: 'none' }} />
              {/* Rounded chart bars (rounded-t-lg) */}
              <Bar dataKey="inflow" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={32} />
              <Bar dataKey="outflow" fill="#f87171" radius={[8, 8, 0, 0]} maxBarSize={32} />
              <Area 
                type="monotone" 
                dataKey="net" 
                stroke="#0d9488" 
                strokeWidth={2.5} 
                fillOpacity={0.15} 
                fill="#0d9488" 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Account Cash Flow Breakdown Table: Tactile Card */}
      <div className="bg-white dark:bg-[#111827]/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-900/[0.04] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Dòng tiền Luân chuyển Qua Từng Tài khoản</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kiểm soát số tiền đi vào, đi ra và số dư thực tế tại từng ví / ngân hàng
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.06] text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Tài khoản</th>
                <th className="py-3 px-3 text-right">Tổng tiền vào</th>
                <th className="py-3 px-3 text-right">Tổng tiền ra</th>
                <th className="py-3 px-3 text-right">Dòng tiền thuần</th>
                <th className="py-3 px-3 text-right">Số dư hiện tại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs">
              {accountFlows.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors">
                  <td className="py-3.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs" 
                        style={{ backgroundColor: acc.color }}
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{acc.name}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">{acc.institution || acc.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(acc.inflow)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                    -{formatCurrency(acc.outflow)}
                  </td>
                  <td className={`py-3.5 px-3 text-right font-bold font-mono tabular-nums ${
                    acc.net >= 0 ? 'text-teal-700 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {formatCurrency(acc.net, true)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {formatCurrency(acc.currentBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tactile Cash Flow Health Advice Card */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-transparent p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-emerald-200/80 dark:border-emerald-800/50 shadow-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 border border-emerald-500/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Lời khuyên tối ưu hóa dòng tiền cá nhân
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
              Duy trì tỷ lệ thặng dư dòng tiền từ <strong className="text-emerald-700 dark:text-emerald-400 font-mono">20% - 30%</strong> mỗi tháng và tự động trích 
              chuyển sang tài khoản tiết kiệm / đầu tư ngay khi nhận lương để tạo kỷ luật tài chính bền vững.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

