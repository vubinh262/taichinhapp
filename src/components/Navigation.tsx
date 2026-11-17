import React, { useState } from 'react';
import { ActiveTab, TimeRange } from '../types';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AuthModal } from './AuthModal';
import { 
  ArrowLeftRight, 
  PieChart, 
  WalletCards, 
  ReceiptText, 
  Settings2, 
  Plus, 
  Sparkles,
  Calendar,
  Cloud,
  CloudCheck,
  RefreshCw,
  WifiOff,
  CloudOff,
  LogIn,
  Sun,
  Moon
} from 'lucide-react';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewTransaction: () => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
  timeRange,
  setTimeRange
}) => {
  const { netWorth, formatCurrency, totalAssets, totalLiabilities, syncStatus } = useFinance();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'cashflow', label: 'Báo cáo dòng tiền', icon: ArrowLeftRight },
    { id: 'income-expense', label: 'Báo cáo thu chi', icon: PieChart },
    { id: 'accounts', label: 'Phân loại tài khoản', icon: WalletCards },
    { id: 'transactions', label: 'Dữ liệu giao dịch', icon: ReceiptText },
    { id: 'setup', label: 'Cài đặt & Cloud', icon: Settings2 },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] shadow-xs shadow-slate-900/[0.03] dark:shadow-black/40 transition-colors duration-200">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 border border-emerald-400/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                Báo cáo Tài chính Cá nhân
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Tactile UI • Dòng tiền, thu chi & tài sản
              </p>
            </div>
          </div>

          {/* Quick Net Worth Snapshot: Tactile Capsule Group */}
          <div className="hidden xl:flex items-center gap-2 p-1 rounded-2xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
            {/* Capsule 1: Tài sản ròng */}
            <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                Tài sản ròng
              </span>
              <span className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${
                netWorth >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatCurrency(netWorth)}
              </span>
            </div>

            {/* Capsule 2: Tổng tài sản */}
            <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                Tổng tài sản
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-slate-700 dark:text-slate-200">
                {formatCurrency(totalAssets)}
              </span>
            </div>

            {/* Capsule 3: Tổng nợ */}
            <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                Tổng nợ
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                {formatCurrency(totalLiabilities)}
              </span>
            </div>
          </div>

          {/* Top Actions: Time filter, Theme Switch & Add Button */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Time Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100/90 dark:bg-white/[0.05] p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.08] text-xs font-medium shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
              <Calendar className="w-3.5 h-3.5 ml-1.5 text-slate-400 dark:text-slate-500" />
              {(['THIS_MONTH', 'THIS_QUARTER', 'THIS_YEAR', 'ALL'] as TimeRange[]).map((r) => {
                const isCurrent = timeRange === r;
                const labels: Record<TimeRange, string> = {
                  THIS_MONTH: 'Tháng này',
                  LAST_MONTH: 'Tháng trước',
                  THIS_QUARTER: 'Quý này',
                  THIS_YEAR: 'Năm nay',
                  ALL: 'Tất cả',
                  CUSTOM: 'Tùy chỉnh'
                };
                return (
                  <button
                    key={r}
                    id={`filter-${r.toLowerCase()}`}
                    onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 rounded-lg transition-all active:scale-[0.98] cursor-pointer ${
                      isCurrent
                        ? 'bg-white dark:bg-[#1a2333] text-emerald-800 dark:text-emerald-300 font-semibold shadow-xs border border-slate-200/80 dark:border-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {labels[r]}
                  </button>
                );
              })}
            </div>

            {/* Tactile Dark / Light Mode Toggle Switch */}
            <button
              id="theme-toggle-switch"
              onClick={toggleTheme}
              title={isDark ? "Chuyển sang chế độ Sáng (Light Mode)" : "Chuyển sang chế độ Tối (Dark Mode)"}
              className="relative inline-flex items-center h-9 w-16 p-1 rounded-full bg-slate-200/80 dark:bg-slate-800/90 border border-slate-300/80 dark:border-white/[0.12] shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0"
              aria-label="Chuyển đổi giao diện Sáng/Tối"
            >
              {/* Sliding Tactile Pill */}
              <span
                className={`pointer-events-none flex items-center justify-center w-7 h-7 rounded-full bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/[0.15] shadow-md shadow-slate-900/15 dark:shadow-black/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] transform transition-transform duration-200 ease-out ${
                  isDark ? 'translate-x-7 text-indigo-400' : 'translate-x-0 text-amber-500'
                }`}
              >
                {isDark ? (
                  <Moon className="w-3.5 h-3.5 fill-indigo-400/20" />
                ) : (
                  <Sun className="w-3.5 h-3.5 fill-amber-400/30" />
                )}
              </span>

              {/* Background ambient icons */}
              <div className="absolute inset-0 flex items-center justify-between px-2 text-[11px] pointer-events-none">
                <Sun className={`w-3.5 h-3.5 transition-opacity duration-150 ${isDark ? 'opacity-40 text-slate-400' : 'opacity-0'}`} />
                <Moon className={`w-3.5 h-3.5 transition-opacity duration-150 ${isDark ? 'opacity-0' : 'opacity-40 text-slate-400'}`} />
              </div>
            </button>

            {/* Firebase Cloud Sync Status */}
            <button
              id="btn-cloud-sync-status"
              onClick={() => setIsAuthModalOpen(true)}
              title={
                syncStatus === 'synced'
                  ? 'Đã đồng bộ hóa dữ liệu an toàn trên Cloud Firestore'
                  : syncStatus === 'syncing'
                  ? 'Đang đồng bộ hóa dữ liệu lên Cloud...'
                  : syncStatus === 'offline'
                  ? 'Đang hoạt động ngoại tuyến'
                  : syncStatus === 'error'
                  ? 'Gặp lỗi đồng bộ Cloud - Nhấn để kiểm tra'
                  : 'Lưu trữ cục bộ - Nhấn để bật đồng bộ Cloud Firestore'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-2xs ${
                syncStatus === 'synced'
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70'
                  : syncStatus === 'syncing'
                  ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60 text-teal-800 dark:text-teal-300'
                  : syncStatus === 'offline'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
                  : syncStatus === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
                  : 'bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-700 border-slate-200 dark:border-white/[0.08]'
              }`}
            >
              {syncStatus === 'synced' && <CloudCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              {syncStatus === 'syncing' && <RefreshCw className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 animate-spin shrink-0" />}
              {syncStatus === 'offline' && <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
              {syncStatus === 'error' && <CloudOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />}
              {syncStatus === 'local-only' && <Cloud className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />}
              
              <span className="hidden lg:inline">
                {syncStatus === 'synced' && 'Cloud Sync'}
                {syncStatus === 'syncing' && 'Đồng bộ...'}
                {syncStatus === 'offline' && 'Offline'}
                {syncStatus === 'error' && 'Lỗi Sync'}
                {syncStatus === 'local-only' && 'Đồng bộ Cloud'}
              </span>
            </button>

            {/* User Profile / Sign In Button */}
            {user ? (
              <button
                id="btn-user-profile"
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                title={`Đã đăng nhập: ${user.email || user.displayName || 'Khách'}`}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 shadow-xs">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Avatar" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full rounded-full object-cover" 
                    />
                  ) : (
                    user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <span className="hidden sm:inline max-w-[90px] truncate">
                  {user.displayName || (user.isAnonymous ? 'Khách' : user.email?.split('@')[0])}
                </span>
              </button>
            ) : (
              <button
                id="btn-user-signin"
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </button>
            )}

            {/* Tactile Primary Action Button: + Ghi chép mới */}
            <button
              id="btn-quick-add-transaction"
              onClick={onOpenNewTransaction}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] border border-emerald-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)] transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="font-semibold">Ghi chép mới</span>
            </button>
          </div>
        </div>

        {/* Tactile Tab Navigation */}
        <nav className="flex space-x-1.5 sm:space-x-2.5 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-white/[0.06] py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-[#161f30] text-emerald-900 dark:text-emerald-300 font-bold border border-slate-200/90 dark:border-white/[0.12] shadow-sm shadow-slate-900/[0.05] dark:shadow-black/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Auth & Cloud Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
};

