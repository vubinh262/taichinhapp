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
import { AnimatePresence, motion } from 'motion/react';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('cashflow');
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Header & Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTransaction={handleOpenNewTransaction}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {activeTab === 'cashflow' && (
              <CashFlowReport timeRange={timeRange} />
            )}

            {activeTab === 'income-expense' && (
              <IncomeExpenseReport timeRange={timeRange} />
            )}

            {activeTab === 'accounts' && (
              <AccountsClassification onOpenTransfer={handleOpenTransfer} />
            )}

            {activeTab === 'transactions' && (
              <TransactionsData
                onOpenNewTransaction={handleOpenNewTransaction}
                onEditTransaction={handleEditTransaction}
              />
            )}

            {activeTab === 'setup' && (
              <SetupView />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Transaction Modal (Add / Edit / Transfer) */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        editingTransaction={editingTx}
        initialType={txModalInitialType}
      />

      {/* Tactile Footer */}
      <footer className="border-t border-slate-200/80 dark:border-white/[0.06] bg-white/70 dark:bg-[#111827]/70 py-4 text-center text-xs text-slate-400 dark:text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Báo cáo Tài chính Cá nhân • Tactile UI Engine</span>
          </div>
          <span className="text-slate-500 dark:text-slate-400 font-medium">Bảo mật dữ liệu trực tiếp trên thiết bị cá nhân của bạn</span>
        </div>
      </footer>
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

