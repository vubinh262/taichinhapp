import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { 
  Cloud, 
  Mail, 
  Lock, 
  User as UserIcon, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  ShieldCheck, 
  Loader2, 
  Sparkles,
  ArrowRight,
  Database,
  RefreshCw,
  CloudCheck,
  CloudOff,
  WifiOff,
  UploadCloud,
  DownloadCloud
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    authError, 
    clearError, 
    loginWithGoogle, 
    loginWithEmail, 
    registerWithEmail, 
    loginAnonymously,
    logout 
  } = useAuth();

  const {
    syncStatus,
    syncErrorMessage,
    clearSyncError,
    lastSyncedAt,
    syncNow,
    uploadLocalToCloud,
    downloadCloudToLocal
  } = useFinance();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [syncActionMsg, setSyncActionMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, displayName);
      }
      onClose();
    } catch (err: any) {
      // Error handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearError();
    setIsLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setLocalError(null);
    clearError();
    setIsLoading(true);
    try {
      await loginAnonymously();
      onClose();
    } catch (err) {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  const errorMessage = localError || authError;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative my-auto w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/[0.1] overflow-hidden animate-in zoom-in-95 duration-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-900/90 dark:via-teal-900/80 dark:to-cyan-950/90 px-6 pt-6 pb-5 text-white relative shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer active:scale-95"
            aria-label="Đóng"
          >
            ✕
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">
                {user ? 'Tài Khoản Cloud Đồng Bộ' : 'Đồng Bộ Hóa Dữ Liệu Firebase'}
              </h3>
              <p className="text-xs text-emerald-100/90 dark:text-emerald-200/80">
                {user 
                  ? 'Đang kết nối Firestore Cloud an toàn' 
                  : 'Lưu trữ đám mây & truy cập đa thiết bị'}
              </p>
            </div>
          </div>
        </div>

        {/* If user is already logged in, show user info and logout option */}
        {user ? (
          <div className="p-6 space-y-5 text-xs sm:text-sm">
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-base shadow-sm shrink-0 border border-emerald-500">
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
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {user.displayName || (user.isAnonymous ? 'Tài khoản Khách (Guest Sync)' : 'Người dùng')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Đã kết nối
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-mono truncate mt-0.5">
                  {user.email || `UID: ${user.uid.substring(0, 14)}...`}
                </p>
              </div>
            </div>

            {/* Sync Diagnostics & Status Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái đồng bộ</span>
                <div className="flex items-center gap-1.5">
                  {syncStatus === 'synced' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CloudCheck className="w-3.5 h-3.5" /> Đã đồng bộ an toàn
                    </span>
                  )}
                  {syncStatus === 'syncing' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang đồng bộ...
                    </span>
                  )}
                  {syncStatus === 'offline' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                      <WifiOff className="w-3.5 h-3.5" /> Ngoại tuyến (Đã lưu máy)
                    </span>
                  )}
                  {syncStatus === 'error' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                      <CloudOff className="w-3.5 h-3.5" /> Lỗi kết nối đồng bộ
                    </span>
                  )}
                </div>
              </div>

              {lastSyncedAt && (
                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                  Lần đồng bộ thành công gần nhất: <span className="text-slate-600 dark:text-slate-300">{lastSyncedAt.toLocaleTimeString('vi-VN')} {lastSyncedAt.toLocaleDateString('vi-VN')}</span>
                </div>
              )}

              {/* Error explanation banner if any */}
              {syncErrorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Chi tiết nguyên nhân:</p>
                      <p className="text-rose-700 dark:text-rose-300 leading-relaxed mt-0.5">{syncErrorMessage}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      clearSyncError();
                      setSyncActionMsg('Đang thử đồng bộ lại...');
                      try {
                        await syncNow();
                        setSyncActionMsg('Đồng bộ thành công!');
                        setTimeout(() => setSyncActionMsg(null), 3000);
                      } catch (err: any) {
                        setSyncActionMsg(null);
                      }
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Thử kết nối & đồng bộ lại ngay
                  </button>
                </div>
              )}

              {syncActionMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium text-center animate-in fade-in">
                  {syncActionMsg}
                </div>
              )}

              {/* Manual Cloud Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    setSyncActionMsg('Đang tải dữ liệu lên Cloud...');
                    try {
                      await uploadLocalToCloud();
                      setSyncActionMsg('Đã đồng bộ toàn bộ dữ liệu lên Cloud thành công!');
                      setTimeout(() => setSyncActionMsg(null), 3000);
                    } catch (e: any) {
                      setSyncActionMsg('Không thể tải lên: ' + (e.message || 'Lỗi mạng'));
                    }
                  }}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] shadow-2xs"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Đẩy dữ liệu lên Cloud
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Thao tác này sẽ tải dữ liệu từ Cloud Firestore về máy. Bạn có muốn tiếp tục?')) {
                      setSyncActionMsg('Đang tải dữ liệu từ Cloud...');
                      try {
                        await downloadCloudToLocal();
                        setSyncActionMsg('Đã cập nhật dữ liệu mới nhất từ Cloud!');
                        setTimeout(() => setSyncActionMsg(null), 3000);
                      } catch (e: any) {
                        setSyncActionMsg('Không thể tải về: ' + (e.message || 'Lỗi mạng'));
                      }
                    }
                  }}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] shadow-2xs"
                >
                  <DownloadCloud className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  Kéo dữ liệu từ Cloud
                </button>
              </div>
            </div>

            <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Toàn bộ dữ liệu giao dịch, tài khoản và danh mục được mã hóa và đồng bộ tức thời qua Cloud Firestore.</span>
              </div>
              <div className="flex items-start gap-2">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Dữ liệu vẫn được lưu ngoại tuyến trên trình duyệt nếu mất kết nối mạng.</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-[0.98] shadow-2xs"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 font-semibold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all cursor-pointer active:scale-[0.98] shadow-2xs"
              >
                Đăng xuất tài khoản
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Mode Switcher */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-white/[0.06] shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLocalError(null);
                  clearError();
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                  mode === 'login' 
                    ? 'bg-white dark:bg-[#1E293B] text-emerald-800 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-white/[0.08]' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setLocalError(null);
                  clearError();
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                  mode === 'register' 
                    ? 'bg-white dark:bg-[#1E293B] text-emerald-800 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-white/[0.08]' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Đăng ký mới</span>
              </button>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Google Fast Sign-in */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Tiếp tục với Google</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">hoặc email</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Họ và tên hiển thị</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Đăng nhập & Bắt đầu đồng bộ' : 'Tạo tài khoản mới'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Guest Sync button */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleAnonymousSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700/80 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Trải nghiệm ngay không cần mật khẩu (Guest Cloud)</span>
              </button>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-2">
                Dữ liệu hiện có của bạn sẽ được tự động sao lưu lên Firestore khi kích hoạt.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
