/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { ActiveTab, TimeRange, Transaction, TransactionType } from './types';
import { Navigation } from './components/Navigation';
import { CashFlowReport } from './components/CashFlowReport';
import { IncomeExpenseReport } from './components/IncomeExpenseReport';
import { AccountsClassification } from './components/AccountsClassification';
import { TransactionsData } from './components/TransactionsData';
import { SetupView } from './components/SetupView';
import { TransactionModal } from './components/TransactionModal';
import { HomeView } from './components/HomeView';
import { AnimatePresence, motion } from 'motion/react';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [timeRange, setTimeRange] = useState<TimeRange>('THIS_MONTH');

  // Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txModalInitialType, setTxModalInitialType] = useState<TransactionType>('EXPENSE');

  const handleOpenNewTransaction = () => {
    setEditingTx(null);
    setTxModalInitialType('EXPENSE');
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setTxModalInitialType(tx.type);
    setIsTxModalOpen(true);
  };

  const handleOpenTransfer = () => {
    setEditingTx(null);
    setTxModalInitialType('TRANSFER');
    setIsTxModalOpen(true);
  };

  const isReport = activeTab === 'cashflow' || activeTab === 'income-expense';
  const rangeLabels: { id: TimeRange; label: string }[] = [
    { id: 'THIS_MONTH', label: 'Tháng' },
    { id: 'THIS_QUARTER', label: 'Quý' },
    { id: 'THIS_YEAR', label: 'Năm' },
    { id: 'ALL', label: 'Tất cả' }
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-x-hidden">
      {/* Vệt sáng xanh rất nhẹ phía sau để hiệu ứng kính hiện rõ */}
      <div aria-hidden className="pointer-events-none fixed -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-emerald-200/70 dark:bg-emerald-900/30 blur-[90px]" />

      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTransaction={handleOpenNewTransaction}
      />

      <main className="relative lg:pl-64 pb-32 lg:pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 lg:pt-8">
          {isReport && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div role="tablist" aria-label="Loại báo cáo" className="glass inline-flex p-1 rounded-full">
                {([['income-expense', 'Thu chi'], ['cashflow', 'Dòng tiền']] as [ActiveTab, string][]).map(([id, label]) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={activeTab === id}
                    onClick={() => setActiveTab(id)}
                    className={`h-10 px-4 rounded-full text-sm font-semibold cursor-pointer ${activeTab === id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div role="tablist" aria-label="Kỳ báo cáo" className="glass inline-flex p-1 rounded-full">
                {rangeLabels.map((r) => (
                  <button
                    key={r.id}
                    role="tab"
                    aria-selected={timeRange === r.id}
                    onClick={() => setTimeRange(r.id)}
                    className={`h-10 px-3.5 rounded-full text-sm font-semibold cursor-pointer ${timeRange === r.id ? 'bg-white text-slate-900 shadow-sm dark:bg-white/15 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
            >
              {activeTab === 'home' && (
                <HomeView
                  onOpenNewTransaction={handleOpenNewTransaction}
                  onEditTransaction={handleEditTransaction}
                  onGoTransactions={() => setActiveTab('transactions')}
                  onGoReports={() => setActiveTab('income-expense')}
                />
              )}
              {activeTab === 'cashflow' && <CashFlowReport timeRange={timeRange} />}
              {activeTab === 'income-expense' && <IncomeExpenseReport timeRange={timeRange} />}
              {activeTab === 'accounts' && <AccountsClassification onOpenTransfer={handleOpenTransfer} />}
              {activeTab === 'transactions' && (
                <TransactionsData
                  onOpenNewTransaction={handleOpenNewTransaction}
                  onEditTransaction={handleEditTransaction}
                />
              )}
              {activeTab === 'setup' && <SetupView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        editingTransaction={editingTx}
        initialType={txModalInitialType}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FinanceProvider>
          <DashboardContent />
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

