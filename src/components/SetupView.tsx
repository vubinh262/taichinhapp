import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { Category, CategoryType, CurrencyConfig } from '../types';
import { CategoryIcon, AVAILABLE_ICONS } from './CategoryIcon';
import { AuthModal } from './AuthModal';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  AlertCircle,
  Coins,
  Settings,
  FolderKanban,
  Cloud,
  CloudCheck,
  RefreshCw,
  Database,
  ShieldCheck,
  LogIn,
  LogOut,
  Sparkles,
  Server
} from 'lucide-react';

export const SetupView: React.FC = () => {
  const { 
    accounts,
    categories, 
    transactions,
    addCategory, 
    updateCategory, 
    deleteCategory, 
    currency, 
    setCurrency, 
    resetToDefaultData, 
    exportBackupJSON, 
    importBackupJSON,
    formatCurrency,
    syncStatus,
    lastSyncedAt,
    isCloudActive,
    syncNow,
    uploadLocalToCloud,
    downloadCloudToLocal
  } = useFinance();

  const { user, logout } = useAuth();

  const [activeSetupTab, setActiveSetupTab] = useState<'categories' | 'currency' | 'backup' | 'firebase'>('firebase');
  const [catTypeTab, setCatTypeTab] = useState<CategoryType>('EXPENSE');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSyncingAction, setIsSyncingAction] = useState(false);

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<CategoryType>('EXPENSE');
  const [catIcon, setCatIcon] = useState('Utensils');
  const [catColor, setCatColor] = useState('#ef4444');
  const [catBudget, setCatBudget] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const openAddCategory = (defaultType: CategoryType) => {
    setEditingCat(null);
    setCatName('');
    setCatType(defaultType);
    setCatIcon(defaultType === 'INCOME' ? 'Briefcase' : 'Utensils');
    setCatColor(defaultType === 'INCOME' ? '#10b981' : '#ef4444');
    setCatBudget('');
    setIsCatModalOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatType(cat.type);
    setCatIcon(cat.icon);
    setCatColor(cat.color);
    setCatBudget(cat.budgetMonthly ? cat.budgetMonthly.toString() : '');
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const budget = catBudget ? parseFloat(catBudget.replace(/[^0-9.]/g, '')) || 0 : 0;

    if (editingCat) {
      updateCategory(editingCat.id, {
        name: catName.trim(),
        type: catType,
        icon: catIcon,
        color: catColor,
        budgetMonthly: budget > 0 ? budget : undefined
      });
    } else {
      addCategory({
        name: catName.trim(),
        type: catType,
        icon: catIcon,
        color: catColor,
        budgetMonthly: budget > 0 ? budget : undefined
      });
    }

    setIsCatModalOpen(false);
  };

  // Currencies list
  const currencyOptions: CurrencyConfig[] = [
    { code: 'VND', symbol: '₫', name: 'Việt Nam Đồng (VND)', locale: 'vi-VN' },
    { code: 'USD', symbol: '$', name: 'Đô la Mỹ (USD)', locale: 'en-US' },
    { code: 'EUR', symbol: '€', name: 'Đồng Euro (EUR)', locale: 'de-DE' }
  ];

  // Backup & Restore
  const handleExportData = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sao_Luu_Tai_Chinh_Ca_Nhan_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setStatusMessage({ type: 'success', text: 'Đã xuất file sao lưu JSON thành công!' });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBackupJSON(content);
      if (success) {
        setStatusMessage({ type: 'success', text: 'Khôi phục dữ liệu từ bản sao lưu thành công!' });
      } else {
        setStatusMessage({ type: 'error', text: 'File sao lưu không hợp lệ hoặc bị lỗi cấu trúc.' });
      }
      setTimeout(() => setStatusMessage(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('Bạn có chắc chắn muốn nạp lại dữ liệu mẫu ban đầu? Toàn bộ giao dịch và thiết lập hiện tại sẽ được thay bằng dữ liệu mẫu.')) {
      resetToDefaultData();
      setStatusMessage({ type: 'success', text: 'Đã khôi phục dữ liệu mẫu tài chính cá nhân thành công!' });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleManualSync = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSyncingAction(true);
    try {
      await syncNow();
      setStatusMessage({ type: 'success', text: 'Đã đồng bộ hóa dữ liệu thành công với Cloud Firestore!' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Đồng bộ thất bại, vui lòng kiểm tra kết nối mạng.' });
    } finally {
      setIsSyncingAction(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleUploadLocal = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn đẩy toàn bộ dữ liệu trên máy này lên Cloud Firestore? Dữ liệu trên Cloud sẽ được ghi đè bằng dữ liệu hiện tại.')) {
      return;
    }
    setIsSyncingAction(true);
    try {
      await uploadLocalToCloud();
      setStatusMessage({ type: 'success', text: 'Đã đẩy dữ liệu nội bộ lên Cloud Firestore thành công!' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Không thể tải lên Cloud, vui lòng thử lại.' });
    } finally {
      setIsSyncingAction(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleDownloadCloud = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn tải dữ liệu từ Cloud Firestore về máy? Dữ liệu trên máy sẽ được cập nhật đồng bộ theo bản lưu trên Cloud.')) {
      return;
    }
    setIsSyncingAction(true);
    try {
      await downloadCloudToLocal();
      setStatusMessage({ type: 'success', text: 'Đã tải và cập nhật dữ liệu từ Cloud Firestore thành công!' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Không thể tải dữ liệu từ Cloud, vui lòng thử lại.' });
    } finally {
      setIsSyncingAction(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const currentTypeCategories = categories.filter((c) => c.type === catTypeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <Settings className="w-4 h-4" />
            </div>
            <span>Cài Đặt Hệ Thống (Setup & Configuration)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý danh mục phân loại thu chi, định dạng tiền tệ và sao lưu dự phòng dữ liệu
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 border shadow-2xs transition-all ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
        }`}>
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Setup Subtabs (Tactile Segmented Control) */}
      <div className="p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-white/[0.08] flex space-x-1 overflow-x-auto no-scrollbar shadow-inner">
        <button
          id="setup-tab-firebase"
          onClick={() => setActiveSetupTab('firebase')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
            activeSetupTab === 'firebase'
              ? 'bg-white dark:bg-[#1E293B] text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Đồng bộ Firebase Cloud</span>
          {syncStatus === 'synced' && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>
        <button
          id="setup-tab-categories"
          onClick={() => setActiveSetupTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
            activeSetupTab === 'categories'
              ? 'bg-white dark:bg-[#1E293B] text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Danh mục Phân loại</span>
        </button>
        <button
          id="setup-tab-currency"
          onClick={() => setActiveSetupTab('currency')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
            activeSetupTab === 'currency'
              ? 'bg-white dark:bg-[#1E293B] text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Đơn vị Tiền tệ</span>
        </button>
        <button
          id="setup-tab-backup"
          onClick={() => setActiveSetupTab('backup')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
            activeSetupTab === 'backup'
              ? 'bg-white dark:bg-[#1E293B] text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Sao lưu & Khôi phục</span>
        </button>
      </div>

      {/* 0. Firebase Cloud Sync Management */}
      {activeSetupTab === 'firebase' && (
        <div className="space-y-6">
          {/* Top Status Banner with tactile highlights */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-900/90 dark:via-teal-900/80 dark:to-cyan-950/90 rounded-2xl p-6 text-white shadow-md border border-emerald-500/30 dark:border-emerald-400/20 relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold border border-white/20">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Google Firebase Cloud Firestore</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {user ? 'Hệ thống Đồng Bộ Đang Hoạt Động' : 'Kích Hoạt Đồng Bộ Đám Mây'}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/90 dark:text-emerald-200/80 max-w-xl leading-relaxed">
                  {user 
                    ? `Dữ liệu tài chính cá nhân của bạn đang được tự động đồng bộ thời gian thực 2 chiều giữa thiết bị này và máy chủ Firebase Cloud Firestore.` 
                    : `Lưu trữ dữ liệu thu chi, tài khoản an toàn trên Firebase để truy cập từ điện thoại, máy tính bảng hoặc khôi phục ngay khi đổi trình duyệt.`}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                {user ? (
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncingAction}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 text-xs font-bold shadow-sm shadow-black/10 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingAction ? 'animate-spin' : ''}`} />
                    <span>{isSyncingAction ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 text-xs font-bold shadow-sm shadow-black/10 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Đăng nhập / Bắt đầu ngay</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cards Grid: Connection & Account Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Cloud Connection Details */}
            <div className="bg-white dark:bg-[#111827]/90 rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] shadow-xs shadow-slate-900/[0.03] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Thông Số Kết Nối</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Hạ tầng Firebase Firestore</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/[0.04]">
                  <span className="text-slate-500 dark:text-slate-400">Trạng thái:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500 animate-pulse' : (syncStatus === 'syncing' ? 'bg-teal-500 animate-spin' : 'bg-slate-400')}`} />
                    {syncStatus === 'synced' && 'Đã đồng bộ thời gian thực'}
                    {syncStatus === 'syncing' && 'Đang đồng bộ hóa...'}
                    {syncStatus === 'offline' && 'Hoạt động ngoại tuyến'}
                    {syncStatus === 'error' && 'Gặp sự cố kết nối'}
                    {syncStatus === 'local-only' && 'Lưu trên thiết bị'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/[0.04]">
                  <span className="text-slate-500 dark:text-slate-400">Firebase Project:</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 text-[11px]">earnest-goal-jdtd0</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/[0.04]">
                  <span className="text-slate-500 dark:text-slate-400">Database Engine:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Cloud Firestore (Multi-region)</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/[0.04]">
                  <span className="text-slate-500 dark:text-slate-400">Lần đồng bộ gần nhất:</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                    {lastSyncedAt ? lastSyncedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + lastSyncedAt.toLocaleDateString('vi-VN') : 'Chưa đồng bộ'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: User Account & Security */}
            <div className="bg-white dark:bg-[#111827]/90 rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] shadow-xs shadow-slate-900/[0.03] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-2xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Tài Khoản Đồng Bộ</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Bảo mật phân quyền người dùng</p>
                </div>
              </div>

              {user ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/[0.06]">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                      {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {user.displayName || (user.isAnonymous ? 'Tài khoản Khách' : 'Người dùng')}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                        {user.email || `UID: ${user.uid.substring(0, 14)}...`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all cursor-pointer text-center active:scale-[0.98] shadow-2xs"
                    >
                      Chi tiết tài khoản
                    </button>
                    <button
                      onClick={async () => {
                        await logout();
                        setStatusMessage({ type: 'success', text: 'Đã đăng xuất tài khoản Firebase.' });
                        setTimeout(() => setStatusMessage(null), 3000);
                      }}
                      className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98] shadow-2xs"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Bạn hiện đang sử dụng ứng dụng ở chế độ lưu trữ cục bộ (Local Storage). Hãy đăng nhập để lưu trữ trên Cloud vĩnh viễn.
                  </p>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Đăng nhập hoặc Đăng ký Cloud</span>
                  </button>
                </div>
              )}
            </div>

            {/* Card 3: Cloud Data Stats */}
            <div className="bg-white dark:bg-[#111827]/90 rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] shadow-xs shadow-slate-900/[0.03] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Dữ Liệu Đang Quản Lý</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Số lượng bản ghi trên hệ thống</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">Tài khoản</span>
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">{accounts.length}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">Danh mục</span>
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">{categories.length}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">Giao dịch</span>
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">{transactions.length}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">Đơn vị tiền</span>
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">{currency.code}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cloud Synchronization Operations */}
          <div className="bg-white dark:bg-[#111827]/90 rounded-2xl p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-xs shadow-slate-900/[0.03] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                Thao Tác Đồng Bộ Thủ Công & Sao Lưu Đám Mây
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chủ động đẩy hoặc kéo dữ liệu giữa thiết bị hiện tại và máy chủ Firebase Cloud Firestore
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={handleManualSync}
                disabled={isSyncingAction || !user}
                className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-bold text-emerald-800 dark:text-emerald-300 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingAction ? 'animate-spin' : ''}`} />
                <span>Đồng bộ 2 chiều (Sync)</span>
              </button>

              <button
                onClick={handleUploadLocal}
                disabled={isSyncingAction || !user}
                className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 shadow-2xs"
              >
                <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Đẩy dữ liệu lên Cloud (Upload)</span>
              </button>

              <button
                onClick={handleDownloadCloud}
                disabled={isSyncingAction || !user}
                className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 shadow-2xs"
              >
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Tải dữ liệu từ Cloud (Download)</span>
              </button>
            </div>
            {!user && (
              <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800/50 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Vui lòng đăng nhập hoặc nhấn "Đăng nhập / Bắt đầu ngay" ở trên để thực hiện đồng bộ Cloud.</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* 1. Categories Management */}
      {activeSetupTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111827]/90 p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs shadow-slate-900/[0.03] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-white/[0.06] shadow-inner">
              <button
                onClick={() => setCatTypeTab('EXPENSE')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                  catTypeTab === 'EXPENSE'
                    ? 'bg-white dark:bg-[#1E293B] text-rose-600 dark:text-rose-400 shadow-xs border border-slate-200/60 dark:border-white/[0.08]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Danh mục Chi tiêu ({categories.filter((c) => c.type === 'EXPENSE').length})
              </button>
              <button
                onClick={() => setCatTypeTab('INCOME')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                  catTypeTab === 'INCOME'
                    ? 'bg-white dark:bg-[#1E293B] text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-white/[0.08]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Danh mục Thu nhập ({categories.filter((c) => c.type === 'INCOME').length})
              </button>
            </div>

            <button
              onClick={() => openAddCategory(catTypeTab)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs shadow-emerald-600/20 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm hạng mục mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {currentTypeCategories.map((cat) => (
              <div 
                key={cat.id}
                className="bg-white dark:bg-[#111827]/90 rounded-2xl p-4 border border-slate-200/80 dark:border-white/[0.08] shadow-xs shadow-slate-900/[0.03] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-slate-300 dark:hover:border-white/[0.14] transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 truncate pr-2">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs border border-black/10"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{cat.name}</h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono tabular-nums mt-0.5">
                      {cat.budgetMonthly && cat.budgetMonthly > 0 
                        ? `Hạn mức: ${formatCurrency(cat.budgetMonthly)}` 
                        : 'Chưa đặt hạn mức'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditCategory(cat)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    title="Sửa hạng mục"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Bạn có muốn xóa hạng mục "${cat.name}"?`)) {
                        deleteCategory(cat.id);
                      }
                    }}
                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    title="Xóa hạng mục"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Currency Settings */}
      {activeSetupTab === 'currency' && (
        <div className="bg-white dark:bg-[#111827]/90 rounded-2xl p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-xs shadow-slate-900/[0.03] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] max-w-xl">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
            Lựa Chọn Đơn Vị Tiền Tệ
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Định dạng số tiền và biểu tượng hiển thị xuyên suốt toàn bộ ứng dụng
          </p>

          <div className="space-y-3">
            {currencyOptions.map((opt) => (
              <label
                key={opt.code}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all active:scale-[0.99] ${
                  currency.code === opt.code
                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs shadow-emerald-600/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="currencyOption"
                    checked={currency.code === opt.code}
                    onChange={() => setCurrency(opt)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">{opt.name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Mã: {opt.code} • Ký hiệu: {opt.symbol}</span>
                  </div>
                </div>
                <span className="text-base font-bold font-mono text-slate-700 dark:text-slate-300">{opt.symbol}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 3. Backup, Restore, Sample Data */}
      {activeSetupTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export & Import */}
          <div className="bg-white dark:bg-[#111827]/90 rounded-2xl p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-xs shadow-slate-900/[0.03] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                Sao Lưu & Khôi Phục Dữ Liệu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toàn bộ danh mục, tài khoản và lịch sử giao dịch được lưu an toàn trong trình duyệt hoặc tải về máy
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer active:scale-[0.98] shadow-2xs"
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Tải về file sao lưu (JSON)</span>
              </button>

              <label className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer active:scale-[0.98] shadow-2xs">
                <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Nhập dữ liệu từ file JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset to Default */}
          <div className="bg-white dark:bg-[#111827]/90 rounded-2xl p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-xs shadow-slate-900/[0.03] dark:shadow-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                Nạp Lại Dữ Liệu Mẫu (Demo Data)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Khôi phục lại dữ liệu mẫu đầy đủ ban đầu gồm tài khoản ngân hàng, danh mục chi tiêu chuẩn và các giao dịch mẫu thực tế
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold text-rose-700 dark:text-rose-300 transition-all cursor-pointer active:scale-[0.98] shadow-2xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Khôi phục dữ liệu mẫu gốc</span>
            </button>
          </div>
        </div>
      )}

      {/* Category Modal (Tactile Dialog) */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 dark:border-white/[0.1] overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {editingCat ? 'Chỉnh sửa hạng mục' : 'Thêm hạng mục mới'}
              </h3>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Tên hạng mục</label>
                <input
                  type="text"
                  placeholder="VD: Ăn trưa, Thưởng công ty, Quỹ dự phòng..."
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Loại hạng mục</label>
                  <select
                    value={catType}
                    onChange={(e) => setCatType(e.target.value as CategoryType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  >
                    <option value="EXPENSE">Khoản Chi tiêu</option>
                    <option value="INCOME">Khoản Thu nhập</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {catType === 'EXPENSE' ? 'Ngân sách tháng (₫)' : 'Mục tiêu tháng (₫)'}
                  </label>
                  <input
                    type="number"
                    placeholder="VD: 5000000"
                    value={catBudget}
                    onChange={(e) => setCatBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Màu sắc nhận diện</label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-600 p-0.5 bg-white dark:bg-slate-800"
                  />
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{catColor}</span>
                </div>
              </div>

              {/* Icon selector grid */}
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Chọn biểu tượng Icon</label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-1.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-800/40">
                  {AVAILABLE_ICONS.map((icName) => {
                    const isSelected = catIcon === icName;
                    return (
                      <button
                        key={icName}
                        type="button"
                        onClick={() => setCatIcon(icName)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs scale-105'
                            : 'bg-white dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                        title={icName}
                      >
                        <CategoryIcon name={icName} className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-all active:scale-[0.98]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs shadow-emerald-600/20 transition-all active:scale-[0.98]"
                >
                  {editingCat ? 'Lưu cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modal for Login / Sync */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
