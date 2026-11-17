import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { Loc, LocMood } from './Loc';
import { useJars } from '../context/JarsContext';
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, Plus, Sparkles } from 'lucide-react';

interface HomeViewProps {
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onGoTransactions: () => void;
  onGoReports: () => void;
}

const sameMonth = (d: Date, ref: Date) => d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenNewTransaction,
  onEditTransaction,
  onGoTransactions,
  onGoReports
}) => {
  const { transactions, categories, accounts, formatCurrency, netWorth } = useFinance();
  const jars = useJars();
  const useJarBudget = jars.monthIncome > 0;

  const data = useMemo(() => {
    const now = new Date();
    const lastMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    let income = 0, expense = 0, lastIncome = 0, lastExpense = 0;
    const spentByCat: Record<string, number> = {};

    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (sameMonth(d, now)) {
        if (t.type === 'INCOME') income += t.amount;
        if (t.type === 'EXPENSE') {
          expense += t.amount;
          if (t.categoryId) spentByCat[t.categoryId] = (spentByCat[t.categoryId] || 0) + t.amount;
        }
      } else if (sameMonth(d, lastMonthRef)) {
        if (t.type === 'INCOME') lastIncome += t.amount;
        if (t.type === 'EXPENSE') lastExpense += t.amount;
      }
    });

    const budgeted = categories.filter((c) => c.type === 'EXPENSE' && (c.budgetMonthly || 0) > 0);
    const totalBudget = budgeted.reduce((s, c) => s + (c.budgetMonthly || 0), 0);
    const over = budgeted
      .map((c) => ({ cat: c, over: (spentByCat[c.id] || 0) - (c.budgetMonthly || 0) }))
      .filter((x) => x.over > 0)
      .sort((a, b) => b.over - a.over);

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate() + 1;
    const remaining = Math.max(0, totalBudget - expense);
    const perDay = daysLeft > 0 ? Math.floor(remaining / daysLeft / 1000) * 1000 : 0;
    const usedPct = totalBudget > 0 ? Math.min(100, Math.round((expense / totalBudget) * 100)) : 0;

    const pctChange = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null);

    const recent = [...transactions]
      .sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')))
      .slice(0, 5);

    return {
      income, expense, totalBudget, remaining, perDay, usedPct, daysLeft, over, recent,
      incomeChange: pctChange(income, lastIncome),
      expenseChange: pctChange(expense, lastExpense),
      monthLabel: `Tháng ${now.getMonth() + 1}`,
      hour: now.getHours()
    };
  }, [transactions, categories]);

  const greeting = data.hour < 11 ? 'Chào buổi sáng' : data.hour < 14 ? 'Chào buổi trưa' : data.hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  // Lộc chỉ lên tiếng khi có điều đáng nói
  let locMood: LocMood = 'happy';
  let locText: React.ReactNode = <>Bạn đang tiêu đúng kế hoạch. Cứ giữ nhịp này nhé!</>;
  if (data.totalBudget === 0) {
    locMood = 'nudge';
    locText = <>Bạn chưa đặt ngân sách. Vào <b>Cài đặt → Danh mục</b> để đặt hạn mức, Lộc sẽ tính giúp mỗi ngày được tiêu bao nhiêu.</>;
  } else if (data.over.length > 0) {
    locMood = 'worried';
    const top = data.over[0];
    locText = <><b>{top.cat.name}</b> đã vượt hạn mức {formatCurrency(top.over)}. Mấy ngày tới mình tiết chế nhóm này chút nha?</>;
  } else if (jars.monthIncome > 0 && jars.stats.some((x) => x.kind === 'save' && x.used === 0)) {
    locMood = 'nudge';
    const j = jars.stats.find((x) => x.kind === 'save' && x.used === 0)!;
    locText = <>Hũ <b>{j.name}</b> tháng này chưa có đồng nào. Trích {formatCurrency(j.allocated)} luôn hôm nay nhé?</>;
  } else if (data.usedPct >= 80) {
    locMood = 'worried';
    locText = <>Đã dùng {data.usedPct}% ngân sách tháng mà còn {data.daysLeft} ngày. Chậm lại một chút nhé.</>;
  }

  const catById = (id?: string) => categories.find((c) => c.id === id);
  const accById = (id?: string) => accounts.find((a) => a.id === id);

  const prevMonth = ((new Date().getMonth() + 11) % 12) + 1;
  const Change: React.FC<{ value: number | null; goodWhenUp: boolean }> = ({ value, goodWhenUp }) => {
    if (value === null) return null;
    const good = goodWhenUp ? value >= 0 : value <= 0;
    return (
      <span className={`self-start text-[11px] font-semibold px-2 py-0.5 rounded-full ${good ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'}`}>
        {value >= 0 ? '↑' : '↓'} {Math.abs(value)}% so với T{prevMonth}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{greeting}</p>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Tổng quan {data.monthLabel.toLowerCase()}</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:gap-5 lg:grid-cols-4">
        {/* Hôm nay được tiêu */}
        <section className="relative overflow-hidden rounded-[28px] p-5 bg-emerald-600 text-white shadow-[0_14px_30px_rgba(21,128,61,0.28),inset_0_1px_0_rgba(255,255,255,0.35)] col-span-2">
          <div className="absolute -right-10 -top-16 w-44 h-44 rounded-full bg-white/10" aria-hidden />
          <div className="relative flex items-center justify-between">
            <span className="text-sm font-semibold">Hôm nay được tiêu</span>
            <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">Còn {data.daysLeft} ngày</span>
          </div>
          <p className="relative mt-2 text-4xl lg:text-5xl font-bold tabular-nums tracking-tight">{formatCurrency(useJarBudget ? jars.perDay : data.perDay)}</p>
          <p className="relative mt-2 text-sm leading-relaxed text-white/90">
            {useJarBudget
              ? <>Hũ Thiết yếu + Hưởng thụ còn {formatCurrency(jars.spendableLeft)} cho đến cuối tháng.</>
              : data.totalBudget > 0
              ? <>Ngân sách tháng còn {formatCurrency(data.remaining)}. Tiêu dưới mức này mỗi ngày là đúng kế hoạch.</>
              : <>Ghi thu nhập hoặc đặt ngân sách để con số này chính xác hơn.</>}
          </p>
          {(useJarBudget || data.totalBudget > 0) && (() => {
            const pool = jars.stats.filter((x) => x.id === 'NEC' || x.id === 'PLAY');
            const alloc = useJarBudget ? pool.reduce((a, x) => a + x.allocated, 0) : data.totalBudget;
            const spent = useJarBudget ? pool.reduce((a, x) => a + x.used, 0) : data.expense;
            const pct = alloc > 0 ? Math.min(100, Math.round((spent / alloc) * 100)) : 0;
            return (
              <div className="relative mt-3">
                <div className="h-2 rounded-full bg-white/25 overflow-hidden">
                  <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between text-xs text-white/90 tabular-nums">
                  <span>Đã chi {formatCurrency(spent)}</span>
                  <span>{useJarBudget ? 'Mức hũ' : 'Ngân sách'} {formatCurrency(alloc)}</span>
                </div>
              </div>
            );
          })()}
        </section>

        {/* Lộc */}
        <section className="glass rounded-3xl p-4 flex items-center gap-3 col-span-2">
          <Loc mood={locMood} size={68} label="Lộc, trợ lý tiết kiệm" className="shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            <p className="text-sm leading-relaxed"><b>Lộc nhắc:</b> {locText}</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={onOpenNewTransaction} className="h-9 px-3.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-semibold inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98]">
                <Sparkles className="w-3.5 h-3.5" /> Ghi chép nhanh
              </button>
              <button onClick={onGoReports} className="h-9 px-3.5 rounded-full bg-white/80 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[13px] font-semibold cursor-pointer active:scale-[0.98]">
                Xem báo cáo
              </button>
            </div>
          </div>
        </section>

        {/* Thu / chi / tài sản */}
        <div className="glass rounded-3xl p-4 flex flex-col gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Thu nhập</span>
          <span className="text-lg sm:text-xl font-bold tabular-nums">{formatCurrency(data.income)}</span>
          <Change value={data.incomeChange} goodWhenUp />
        </div>
        <div className="glass rounded-3xl p-4 flex flex-col gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Chi tiêu</span>
          <span className="text-lg sm:text-xl font-bold tabular-nums">{formatCurrency(data.expense)}</span>
          <Change value={data.expenseChange} goodWhenUp={false} />
        </div>
        <div className="glass rounded-3xl p-4 flex flex-col gap-2 col-span-2">
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Tài sản ròng</span>
          <span className="text-lg sm:text-xl font-bold tabular-nums">{formatCurrency(netWorth)}</span>
          <span className="text-xs text-slate-600 dark:text-slate-400">Tổng các ví, tiết kiệm và đầu tư trừ đi nợ</span>
        </div>
      </div>

      {/* Gần đây */}
      <div className="flex items-baseline justify-between px-1 pt-1">
        <h3 className="text-lg font-bold">Gần đây</h3>
        <button onClick={onGoTransactions} className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 cursor-pointer">Xem tất cả</button>
      </div>
      <section className="glass rounded-3xl px-4 py-1">
        {data.recent.length === 0 && (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <Loc mood="nudge" size={64} />
            <p className="text-sm text-slate-600 dark:text-slate-400">Chưa có giao dịch nào. Ghi khoản đầu tiên nhé!</p>
            <button onClick={onOpenNewTransaction} className="h-10 px-4 rounded-full bg-emerald-600 text-white text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4" /> Ghi chép mới
            </button>
          </div>
        )}
        {data.recent.map((t, i) => {
          const cat = catById(t.categoryId);
          const acc = accById(t.accountId);
          const isIncome = t.type === 'INCOME';
          const isTransfer = t.type === 'TRANSFER';
          const [, m, d] = t.date.split('-');
          return (
            <button
              key={t.id}
              onClick={() => onEditTransaction(t)}
              className={`w-full flex items-center gap-3 py-3 text-left cursor-pointer ${i < data.recent.length - 1 ? 'border-b border-slate-900/[0.06] dark:border-white/[0.06]' : ''}`}
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isIncome ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white'}`}>
                {isTransfer ? <ArrowLeftRight className="w-5 h-5" /> : isIncome && !cat ? <ArrowDownRight className="w-5 h-5" /> : cat ? <CategoryIcon name={cat.icon} className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              </span>
              <span className="flex-1 min-w-0 flex flex-col">
                <span className="text-[15px] font-semibold truncate">{t.note || cat?.name || (isTransfer ? 'Chuyển khoản' : 'Giao dịch')}</span>
                <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{d}/{m} · {acc?.name || ''}</span>
              </span>
              <span className={`text-[15px] font-semibold tabular-nums shrink-0 ${isIncome ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                {isTransfer ? '' : isIncome ? '+' : '−'}{formatCurrency(t.amount)}
              </span>
            </button>
          );
        })}
      </section>
    </div>
  );
};
