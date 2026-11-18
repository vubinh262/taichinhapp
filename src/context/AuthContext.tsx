import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithRedirect,
  getRedirectResult,
  EmailAuthProvider,
  linkWithCredential,
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  signInAnonymously as fbSignInAnonymously,
  updateProfile
} from 'firebase/auth';
import { auth, isOnHosting } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  clearError: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  /** Thêm mật khẩu cho tài khoản đang đăng nhập bằng Google để đăng nhập bằng email trên thiết bị khác */
  addPassword: (pass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Địa chỉ email không hợp lệ.';
    case 'auth/user-disabled':
      return 'Tài khoản này đã bị khóa.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email hoặc mật khẩu không chính xác.';
    case 'auth/email-already-in-use':
      return 'Email này đã có tài khoản (có thể bạn từng đăng nhập bằng Google). Hãy đăng nhập Google trên máy tính rồi bấm "Tạo mật khẩu" trong mục Tài khoản, sau đó đăng nhập bằng email ở đây.';
    case 'auth/provider-already-linked':
      return 'Tài khoản này đã có mật khẩu. Bạn đăng nhập bằng email và mật khẩu đó nhé.';
    case 'auth/requires-recent-login':
      return 'Vì lý do bảo mật, hãy đăng xuất rồi đăng nhập Google lại, sau đó tạo mật khẩu.';
    case 'auth/weak-password':
      return 'Mật khẩu quá ngắn, vui lòng nhập ít nhất 6 ký tự.';
    case 'auth/popup-closed-by-user':
      return 'Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.';
    case 'auth/popup-blocked':
      return 'Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cấp quyền hoặc dùng Đăng nhập bằng Email.';
    case 'auth/network-request-failed':
      return 'Không thể kết nối mạng. Vui lòng kiểm tra lại đường truyền internet.';
    case 'auth/operation-not-allowed':
      return 'Đăng nhập bằng email chưa được bật trong Firebase (Authentication → Sign-in method → Email/Password).';
    case 'auth/unauthorized-domain':
      return 'Địa chỉ của app chưa được Firebase cho phép đăng nhập Google. Bạn dùng Đăng nhập bằng Email trong lúc chờ cấu hình nhé.';
    case 'auth/operation-not-supported-in-this-environment':
      return 'Môi trường này chưa hỗ trợ đăng nhập Google. Bạn dùng Đăng nhập bằng Email nhé.';
    case 'auth/web-storage-unsupported':
      return 'Thiết bị đang chặn bộ nhớ trình duyệt nên không đăng nhập Google được. Bạn dùng Đăng nhập bằng Email nhé.';
    default:
      return `Đã xảy ra lỗi trong quá trình xác thực${errorCode ? ` (${errorCode})` : ''}. Vui lòng thử lại hoặc dùng Đăng nhập bằng Email.`;
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Nhận kết quả sau khi quay lại từ trang đăng nhập Google (iOS)
    getRedirectResult(auth).catch((err: any) => {
      console.error('Google redirect error:', err);
      setAuthError(mapAuthErrorMessage(err?.code || ''));
    });
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setAuthError(null);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      // iPhone/iPad chặn cửa sổ bật lên trong app web; khi app chạy trên tên miền Firebase Hosting
      // thì chuyển trang đăng nhập (redirect) cùng tên miền – cách này chạy ổn định trên iOS.
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      if (isIOS && isOnHosting) {
        await signInWithRedirect(auth, provider);
        return;
      }
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setAuthError(mapAuthErrorMessage(err?.code || ''));
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      console.error('Email Sign In error:', err);
      setAuthError(mapAuthErrorMessage(err?.code || ''));
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, displayName?: string) => {
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName: displayName.trim() });
      }
    } catch (err: any) {
      console.error('Email Registration error:', err);
      setAuthError(mapAuthErrorMessage(err?.code || ''));
      throw err;
    }
  };

  const loginAnonymously = async () => {
    setAuthError(null);
    try {
      await fbSignInAnonymously(auth);
    } catch (err: any) {
      console.error('Anonymous Sign In error:', err);
      setAuthError(mapAuthErrorMessage(err?.code || ''));
      throw err;
    }
  };

  const addPassword = async (pass: string) => {
    setAuthError(null);
    const current = auth.currentUser;
    if (!current?.email) {
      setAuthError('Tài khoản này không có email để gắn mật khẩu.');
      throw new Error('no-email');
    }
    try {
      await linkWithCredential(current, EmailAuthProvider.credential(current.email, pass));
      await current.reload();
      setUser(auth.currentUser);
    } catch (err: any) {
      console.error('Link password error:', err);
      setAuthError(mapAuthErrorMessage(err?.code || ''));
      throw err;
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await fbSignOut(auth);
    } catch (err: any) {
      console.error('Sign Out error:', err);
      setAuthError(mapAuthErrorMessage(err?.code || ''));
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        clearError,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginAnonymously,
        logout,
        addPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
