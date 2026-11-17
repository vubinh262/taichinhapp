import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AuthModal } from './AuthModal';
import {
  Home,
  ReceiptText,
  BarChart3,
  WalletCards,
  Settings2,
  Plus,
  Sparkles,
  Cloud,
  CloudCheck,
  RefreshCw,
  WifiOff,
  CloudOff,
  Sun,
  Moon
} from 'lucide-react';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewTransaction: () => void;
}

type NavItem = { id: ActiveTab; label: string; short: string; icon: React.FC<{ className?: string }>; match: ActiveTab[] };

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Tổng quan', short: 'Tổng quan', icon: Home, match: ['home'] },
  { id: 'transactions', label: 'Giao dịch', short: 'Giao dịch', icon: ReceiptText, match: ['transactions'] },
  { id: 'income-expense', label: 'Báo cáo', short: 'Báo cáo', icon: BarChart3, match: ['income-expense', 'cashflow'] },
  { id: 'accounts', label: 'Tài sản', short: 'Tài sản', icon: WalletCards, match: ['accounts'] },
];

const SyncIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'synced') return <CloudCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
  if (status === 'syncing') return <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />;
  if (status === 'offline') return <WifiOff className="w-4 h-4 text-amber-600" />;
  if (status === 'error') return <CloudOff className="w-4 h-4 text-rose-600" />;
  return <Cloud className="w-4 h-4 text-slate-500" />;
};

const syncLabel: Record<string, string> = {
  synced: 'Đã đồng bộ',
  syncing: 'Đang đồng bộ…',
  offline: 'Đang ngoại tuyến',
  error: 'Lỗi đồng bộ',
  'local-only': 'Chỉ lưu trên máy này'
};

/**
 * Điều hướng:
 *  - Máy tính (≥1024px): thanh bên dạng kính bên trái.
 *  - Điện thoại/tablet: thanh tiêu đề gọn ở trên + thanh tab kính nổi ở dưới + nút "+" tròn.
 */
export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onOpenNewTransaction }) => {
  const { syncStatus } = useFinance();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const initial = user ? (user.displayName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase() : null;
  const isActive = (item: NavItem) => item.match.includes(activeTab);

  const Avatar = (
    <button
      onClick={() => setIsAuthModalOpen(true)}
      aria-label={user ? 'Tài khoản và đồng bộ' : 'Đăng nhập để đồng bộ'}
      className="glass w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer overflow-hidden shrink-0"
    >
      {user?.photoURL ? (
        <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
      ) : initial ? (
        initial
      ) : (
        <SyncIcon status={syncStatus} />
      )}
    </button>
  );

  return (
    <>
      {/* ---------- Thanh bên (máy tính) ---------- */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 p-4">
        <div className="glass rounded-[28px] flex-1 flex flex-col gap-5 p-4">
          <div className="flex items-center gap-2.5 px-1">
            <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="text-lg font-bold">Tài Chính</span>
          </div>

          <button
            onClick={onOpenNewTransaction}
            className="h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(21,128,61,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Ghi chép mới
          </button>

          <nav aria-label="Điều hướng chính" className="flex flex-col gap-1">
            {[...NAV_ITEMS, { id: 'setup' as ActiveTab, label: 'Cài đặt', short: 'Cài đặt', icon: Settings2, match: ['setup'] as ActiveTab[] }].map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`h-11 rounded-2xl px-3 flex items-center gap-3 text-sm font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-2">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="rounded-2xl p-3 bg-white/60 dark:bg-white/[0.05] flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 text-left cursor-pointer"
            >
              <SyncIcon status={syncStatus} />
              <span className="flex-1">{syncLabel[syncStatus] || 'Đồng bộ'}</span>
              {!user && <span className="font-semibold text-emerald-700 dark:text-emerald-400">Đăng nhập</span>}
            </button>
            <button
              onClick={toggleTheme}
              className="rounded-2xl p-3 flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDark ? 'Giao diện sáng' : 'Giao diện tối'}
            </button>
          </div>
        </div>
      </aside>

      {/* ---------- Thanh tiêu đề (điện thoại) ---------- */}
      <header className="lg:hidden sticky top-0 z-30 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-2 bg-slate-50/70 dark:bg-[#0B0F17]/70 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2 h-12">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-base font-bold">Tài Chính</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              className="glass w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
            >
              {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
            <button
              onClick={() => setActiveTab('setup')}
              aria-label="Cài đặt"
              className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer ${activeTab === 'setup' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'glass'}`}
            >
              <Settings2 className="w-[18px] h-[18px]" />
            </button>
            {Avatar}
          </div>
        </div>
      </header>

      {/* ---------- Thanh tab nổi (điện thoại) ---------- */}
      <nav
        aria-label="Điều hướng chính"
        className="lg:hidden fixed z-40 left-3 right-3 bottom-0 pb-safe flex items-center gap-2.5"
      >
        <div className="glass-strong flex-1 h-16 rounded-full flex items-center gap-0.5 px-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex-1 min-w-0 h-[52px] rounded-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  active ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon className="w-[22px] h-[22px]" />
                {item.short}
              </button>
            );
          })}
        </div>
        <button
          onClick={onOpenNewTransaction}
          aria-label="Ghi chép mới"
          className="w-16 h-16 shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-[0_10px_24px_rgba(21,128,61,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] cursor-pointer active:scale-95"
        >
          <Plus className="w-7 h-7 stroke-[2.4]" />
        </button>
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};
