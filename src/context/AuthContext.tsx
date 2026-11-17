import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
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
import { auth } from '../lib/firebase';

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
      return 'Email này đã được đăng ký tài khoản khác.';
    case 'auth/weak-password':
      return 'Mật khẩu quá ngắn, vui lòng nhập ít nhất 6 ký tự.';
    case 'auth/popup-closed-by-user':
      return 'Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.';
    case 'auth/popup-blocked':
      return 'Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cấp quyền hoặc dùng Đăng nhập bằng Email.';
    case 'auth/network-request-failed':
      return 'Không thể kết nối mạng. Vui lòng kiểm tra lại đường truyền internet.';
    case 'auth/operation-not-allowed':
      return 'Phương thức đăng nhập này chưa được kích hoạt trong cài đặt Firebase.';
    default:
      return 'Đã xảy ra lỗi trong quá trình xác thực. Vui lòng thử lại.';
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
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
        logout
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
