import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useRef } from 'react';
import { Account, Category, Transaction, CurrencyConfig, SyncStatus } from '../types';
import { INITIAL_ACCOUNTS, INITIAL_CATEGORIES, INITIAL_TRANSACTIONS } from '../data/initialData';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  writeBatch, 
  getDocs,
  getDoc
} from 'firebase/firestore';

interface FinanceContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  currency: CurrencyConfig;
  setCurrency: (curr: CurrencyConfig) => void;
  formatCurrency: (amount: number, showSign?: boolean) => string;
  getAccountBalance: (accountId: string) => number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  // Firebase Sync State
  syncStatus: SyncStatus;
  syncErrorMessage: string | null;
  clearSyncError: () => void;
  lastSyncedAt: Date | null;
  isCloudActive: boolean;
  syncNow: () => Promise<void>;
  uploadLocalToCloud: () => Promise<void>;
  downloadCloudToLocal: () => Promise<void>;
  // Transaction operations
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteMultipleTransactions: (ids: string[]) => Promise<void>;
  // Account operations
  addAccount: (acc: Omit<Account, 'id'>) => Promise<void>;
  updateAccount: (id: string, acc: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  // Category operations
  addCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  // System operations
  resetToDefaultData: () => Promise<void>;
  exportBackupJSON: () => string;
  importBackupJSON: (jsonData: string) => Promise<boolean>;
}

// Deeply strip out any undefined keys so Firestore never rejects documents
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = sanitizeForFirestore(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned as T;
}

function formatSyncError(err: any): string {
  if (!err) return 'Lỗi đồng bộ không xác định.';
  const code = err.code || '';
  const msg = err.message || '';

  if (code.includes('permission-denied') || msg.includes('insufficient permissions')) {
    return 'Quyền truy cập Firestore bị từ chối. Vui lòng đăng nhập lại tài khoản để làm mới phiên làm việc.';
  }
  if (code.includes('unauthenticated')) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }
  if (code.includes('unavailable') || msg.includes('offline') || !navigator.onLine) {
    return 'Mất kết nối mạng hoặc máy chủ Cloud tạm thời không phản hồi. Dữ liệu đã lưu ngoại tuyến an toàn.';
  }
  if (msg.includes('Unsupported field value: undefined')) {
    return 'Dữ liệu chứa trường không tương thích (undefined). Hệ thống đã sửa lỗi này.';
  }
  return msg || 'Lỗi kết nối đồng bộ hóa Firebase.';
}

const STORAGE_KEYS = {
  ACCOUNTS: 'pf_accounts_v1',
  CATEGORIES: 'pf_categories_v1',
  TRANSACTIONS: 'pf_transactions_v1',
  CURRENCY: 'pf_currency_v1',
  LAST_SYNC: 'pf_last_sync_v1'
};

const DEFAULT_CURRENCY: CurrencyConfig = {
  code: 'VND',
  symbol: '₫',
  name: 'Việt Nam Đồng (VND)',
  locale: 'vi-VN'
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved) {
        const parsed: Category[] = JSON.parse(saved);
        // Ensure default essential categories (such as 'Hỗ trợ' and 'Trả nợ') exist
        const existingNames = new Set(parsed.map((c) => c.name.trim().toLowerCase()));
        const missing = INITIAL_CATEGORIES.filter((c) => !existingNames.has(c.name.trim().toLowerCase()));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
      return INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [currency, setCurrencyState] = useState<CurrencyConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENCY);
      return saved ? JSON.parse(saved) : DEFAULT_CURRENCY;
    } catch {
      return DEFAULT_CURRENCY;
    }
  });

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(user ? 'syncing' : 'local-only');
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return saved ? new Date(saved) : null;
  });

  const clearSyncError = () => {
    setSyncErrorMessage(null);
    if (syncStatus === 'error') {
      setSyncStatus(user ? 'synced' : 'local-only');
    }
  };

  // Avoid sync loops
  const isMigratingRef = useRef(false);

  // Online / Offline monitor
  useEffect(() => {
    const handleOnline = () => {
      if (user) {
        setSyncStatus('synced');
        setSyncErrorMessage(null);
      }
    };
    const handleOffline = () => {
      setSyncStatus('offline');
      setSyncErrorMessage('Thiết bị đang ngoại tuyến. Dữ liệu được lưu an toàn trên máy.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  // Sync to local storage always as offline cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.error('Save accounts to localStorage error', e);
    }
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Save categories to localStorage error', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Save transactions to localStorage error', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENCY, JSON.stringify(currency));
    } catch (e) {
      console.error('Save currency to localStorage error', e);
    }
  }, [currency]);

  // Helper: Chunk array for Firestore batch (max 400 per batch)
  const batchWriteAll = async (
    userId: string,
    accList: Account[],
    catList: Category[],
    txList: Transaction[],
    currConfig: CurrencyConfig
  ) => {
    setSyncStatus('syncing');
    setSyncErrorMessage(null);

    try {
      // 1. Update user profile & settings
      await setDoc(doc(db, 'users', userId), {
        email: user?.email || '',
        displayName: user?.displayName || (user?.isAnonymous ? 'Khách (Guest)' : ''),
        lastSyncedAt: Date.now()
      }, { merge: true });

      await setDoc(doc(db, 'users', userId, 'settings', 'preferences'), {
        currency: sanitizeForFirestore(currConfig),
        updatedAt: Date.now()
      }, { merge: true });

      // Prepare all operations
      const operations: Array<{ type: 'set'; ref: any; data: any }> = [];

      accList.forEach((acc) => {
        operations.push({
          type: 'set',
          ref: doc(db, 'users', userId, 'accounts', acc.id),
          data: sanitizeForFirestore(acc)
        });
      });

      catList.forEach((cat) => {
        operations.push({
          type: 'set',
          ref: doc(db, 'users', userId, 'categories', cat.id),
          data: sanitizeForFirestore(cat)
        });
      });

      txList.forEach((tx) => {
        operations.push({
          type: 'set',
          ref: doc(db, 'users', userId, 'transactions', tx.id),
          data: sanitizeForFirestore(tx)
        });
      });

      // Execute in batches of 400
      const CHUNK_SIZE = 400;
      for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
        const chunk = operations.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((op) => {
          batch.set(op.ref, op.data, { merge: true });
        });
        await batch.commit();
      }

      const now = new Date();
      setLastSyncedAt(now);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now.toISOString());
      setSyncStatus('synced');
      setSyncErrorMessage(null);
    } catch (err: any) {
      console.error('Batch write to Firestore error:', err);
      setSyncStatus('error');
      setSyncErrorMessage(formatSyncError(err));
      throw err;
    }
  };

  // Upload local data to Firestore
  const uploadLocalToCloud = async () => {
    if (!user) throw new Error('Cần đăng nhập để đồng bộ dữ liệu lên Cloud.');
    await batchWriteAll(user.uid, accounts, categories, transactions, currency);
  };

  // Download Cloud data to replace local
  const downloadCloudToLocal = async () => {
    if (!user) throw new Error('Cần đăng nhập để tải dữ liệu từ Cloud.');
    setSyncStatus('syncing');

    try {
      const [accSnap, catSnap, txSnap, prefSnap] = await Promise.all([
        getDocs(collection(db, 'users', user.uid, 'accounts')),
        getDocs(collection(db, 'users', user.uid, 'categories')),
        getDocs(collection(db, 'users', user.uid, 'transactions')),
        getDoc(doc(db, 'users', user.uid, 'settings', 'preferences'))
      ]);

      const cloudAccounts: Account[] = [];
      accSnap.forEach((doc) => cloudAccounts.push(doc.data() as Account));

      const cloudCategories: Category[] = [];
      catSnap.forEach((doc) => cloudCategories.push(doc.data() as Category));

      const cloudTransactions: Transaction[] = [];
      txSnap.forEach((doc) => cloudTransactions.push(doc.data() as Transaction));

      if (prefSnap.exists() && prefSnap.data()?.currency) {
        setCurrencyState(prefSnap.data().currency);
      }

      setAccounts(cloudAccounts.length > 0 ? cloudAccounts : INITIAL_ACCOUNTS);
      setCategories(cloudCategories.length > 0 ? cloudCategories : INITIAL_CATEGORIES);
      setTransactions(cloudTransactions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));

      const now = new Date();
      setLastSyncedAt(now);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now.toISOString());
      setSyncStatus('synced');
    } catch (err) {
      console.error('Download from cloud error:', err);
      setSyncStatus('error');
      throw err;
    }
  };

  // Force manual sync
  const syncNow = async () => {
    if (!user) return;
    await uploadLocalToCloud();
  };

  // Real-time Firestore sync listener when authenticated
  useEffect(() => {
    if (!user) {
      setSyncStatus('local-only');
      return;
    }

    setSyncStatus('syncing');

    // Subscribe to settings
    const unsubPref = onSnapshot(doc(db, 'users', user.uid, 'settings', 'preferences'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.currency) {
          setCurrencyState(data.currency);
        }
      }
    });

    // Subscribe to Accounts
    const unsubAcc = onSnapshot(collection(db, 'users', user.uid, 'accounts'), async (snap) => {
      if (isMigratingRef.current) return;

      if (snap.empty) {
        // If first time user has empty cloud data, automatically seed with local state
        isMigratingRef.current = true;
        try {
          await batchWriteAll(user.uid, accounts, categories, transactions, currency);
        } catch (e) {
          console.error('Initial migration error:', e);
        } finally {
          isMigratingRef.current = false;
        }
      } else {
        const loaded: Account[] = [];
        snap.forEach((d) => loaded.push(d.data() as Account));
        setAccounts(loaded);
        setSyncStatus('synced');
      }
    }, (err) => {
      console.error('Accounts snapshot error:', err);
      setSyncStatus('error');
      setSyncErrorMessage(formatSyncError(err));
    });

    // Subscribe to Categories
    const unsubCat = onSnapshot(collection(db, 'users', user.uid, 'categories'), (snap) => {
      if (isMigratingRef.current) return;
      if (!snap.empty) {
        const loaded: Category[] = [];
        snap.forEach((d) => loaded.push(d.data() as Category));
        setCategories(loaded);
      }
    }, (err) => {
      console.error('Categories snapshot error:', err);
      setSyncStatus('error');
      setSyncErrorMessage(formatSyncError(err));
    });

    // Subscribe to Transactions (instant real-time bi-directional sync)
    const unsubTx = onSnapshot(collection(db, 'users', user.uid, 'transactions'), (snap) => {
      if (isMigratingRef.current) return;
      if (!snap.empty) {
        const loaded: Transaction[] = [];
        snap.forEach((d) => loaded.push(d.data() as Transaction));
        loaded.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setTransactions(loaded);
      }
      const now = new Date();
      setLastSyncedAt(now);
      setSyncStatus('synced');
      setSyncErrorMessage(null);
    }, (err) => {
      console.error('Transactions snapshot error:', err);
      setSyncStatus('error');
      setSyncErrorMessage(formatSyncError(err));
    });

    return () => {
      unsubPref();
      unsubAcc();
      unsubCat();
      unsubTx();
    };
  }, [user]);

  // Balance calculation for each account
  const getAccountBalance = (accountId: string): number => {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return 0;
    let balance = acc.initialBalance;

    for (const tx of transactions) {
      if (tx.type === 'INCOME' && tx.accountId === accountId) {
        balance += tx.amount;
      } else if (tx.type === 'EXPENSE' && tx.accountId === accountId) {
        balance -= tx.amount;
      } else if (tx.type === 'TRANSFER') {
        if (tx.accountId === accountId) {
          balance -= tx.amount;
        }
        if (tx.toAccountId === accountId) {
          balance += tx.amount;
        }
      }
    }
    return balance;
  };

  // Aggregated Net Worth, Assets, Liabilities
  const { totalAssets, totalLiabilities, netWorth } = useMemo(() => {
    let assets = 0;
    let liabilities = 0;

    accounts.forEach((acc) => {
      const bal = getAccountBalance(acc.id);
      if (acc.type === 'CREDIT' || acc.type === 'LOAN') {
        if (bal < 0) {
          liabilities += Math.abs(bal);
        } else {
          assets += bal;
        }
      } else {
        if (bal >= 0) {
          assets += bal;
        } else {
          liabilities += Math.abs(bal);
        }
      }
    });

    return {
      totalAssets: assets,
      totalLiabilities: liabilities,
      netWorth: assets - liabilities
    };
  }, [accounts, transactions]);

  // Currency Formatter
  const formatCurrency = (amount: number, showSign = false): string => {
    const isNegative = amount < 0;
    const absVal = Math.abs(amount);

    let formatted = '';
    if (currency.code === 'VND') {
      formatted = new Intl.NumberFormat('vi-VN').format(absVal) + ' ' + currency.symbol;
    } else {
      formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(absVal);
    }

    if (showSign) {
      if (amount > 0) return `+${formatted}`;
      if (amount < 0) return `-${formatted}`;
      return formatted;
    }

    return isNegative ? `-${formatted}` : formatted;
  };

  // Set Currency
  const setCurrency = async (curr: CurrencyConfig) => {
    setCurrencyState(curr);
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'settings', 'preferences'), {
          currency: curr,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (e) {
        console.error('Error saving currency to Firestore:', e);
      }
    }
  };

  // Transaction CRUD
  const addTransaction = async (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...tx,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now()
    };

    setTransactions((prev) => [newTx, ...prev]);

    if (user) {
      try {
        setSyncStatus('syncing');
        setSyncErrorMessage(null);
        await setDoc(doc(db, 'users', user.uid, 'transactions', newTx.id), sanitizeForFirestore(newTx));
        setLastSyncedAt(new Date());
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('Error adding transaction to Firestore:', err);
        setSyncStatus('error');
        setSyncErrorMessage(formatSyncError(err));
      }
    }
  };

  const updateTransaction = async (id: string, updated: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
    );

    if (user) {
      try {
        setSyncStatus('syncing');
        setSyncErrorMessage(null);
        await updateDoc(doc(db, 'users', user.uid, 'transactions', id), sanitizeForFirestore(updated));
        setLastSyncedAt(new Date());
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('Error updating transaction in Firestore:', err);
        setSyncStatus('error');
        setSyncErrorMessage(formatSyncError(err));
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    if (user) {
      try {
        setSyncStatus('syncing');
        setSyncErrorMessage(null);
        await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
        setLastSyncedAt(new Date());
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('Error deleting transaction from Firestore:', err);
        setSyncStatus('error');
        setSyncErrorMessage(formatSyncError(err));
      }
    }
  };

  const deleteMultipleTransactions = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    setTransactions((prev) => prev.filter((t) => !idSet.has(t.id)));

    if (user) {
      try {
        setSyncStatus('syncing');
        setSyncErrorMessage(null);
        const CHUNK_SIZE = 400;
        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
          const chunk = ids.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);
          chunk.forEach((id) => {
            batch.delete(doc(db, 'users', user.uid, 'transactions', id));
          });
          await batch.commit();
        }
        setLastSyncedAt(new Date());
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('Error batch deleting transactions from Firestore:', err);
        setSyncStatus('error');
        setSyncErrorMessage(formatSyncError(err));
      }
    }
  };

  // Account CRUD
  const addAccount = async (acc: Omit<Account, 'id'>) => {
    const newAcc: Account = {
      ...acc,
      id: 'acc-' + Date.now()
    };

    setAccounts((prev) => [...prev, newAcc]);

    if (user) {
      try {
        setSyncStatus('syncing');
        setSyncErrorMessage(null);
        await setDoc(doc(db, 'users', user.uid, 'accounts', newAcc.id), sanitizeForFirestore(newAcc));
        setLastSyncedAt(new Date());
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('Error adding account to Firestore:', err);
        setSyncStatus('error');
        setSyncErrorMessage(formatSyncError(err));
      }
    }
  };

  const updateAccount = async (id: string, updated: Partial<Account>) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updated } : a))
    );

    if (user) {
      try {
        setSyncStatus('syncing');
        setSyncErrorMessage(null);
        await updateDoc(doc(db, 'users', user.uid, 'accounts', id), sanitizeForFirestore(updated));
        setLastSyncedAt(new Date());
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('Error updating account in Firestore:', err);
        setSyncStatus('error');
        setSyncErrorMessage(formatSyncError(err));
      }
    }
  };

  const deleteAccount = async (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));

    if (user) {
      try {
        setSyncStatus('syncing');
        setSyncErrorMessage(null);
        await deleteDoc(doc(db, 'users', user.uid, 'accounts', id));
        setLastSyncedAt(new Date());
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('Error deleting account from Firestore:', err);
        setSyncStatus('error');
        setSyncErrorMessage(formatSyncError(err));
      }
    }
  };

  // Category CRUD
  const addCategory = async (cat: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...cat,
      id: 'cat-' + Date.now()
    };

    setCategories((prev) => [...prev, newCat]);

    if (user) {
      try {
        setSyncStatus('syncing');
        setSyncErrorMessage(null);
        await setDoc(doc(db, 'users', user.uid, 'categories', newCat.id), sanitizeForFirestore(newCat));
        setLastSyncedAt(new Date());
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('Error adding category to Firestore:', err);
        setSyncStatus('error');
        setSyncErrorMessage(formatSyncError(err));
      }
    }
  };

  const updateCategory = async (id: string, updated: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );

    if (user) {
      try {
        setSyncStatus('syncing');
        setSyncErrorMessage(null);
        await updateDoc(doc(db, 'users', user.uid, 'categories', id), sanitizeForFirestore(updated));
        setLastSyncedAt(new Date());
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('Error updating category in Firestore:', err);
        setSyncStatus('error');
        setSyncErrorMessage(formatSyncError(err));
      }
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));

    if (user) {
      try {
        setSyncStatus('syncing');
        setSyncErrorMessage(null);
        await deleteDoc(doc(db, 'users', user.uid, 'categories', id));
        setLastSyncedAt(new Date());
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('Error deleting category from Firestore:', err);
        setSyncStatus('error');
        setSyncErrorMessage(formatSyncError(err));
      }
    }
  };

  // Reset & Backup
  const resetToDefaultData = async () => {
    setAccounts(INITIAL_ACCOUNTS);
    setCategories(INITIAL_CATEGORIES);
    setTransactions(INITIAL_TRANSACTIONS);
    setCurrencyState(DEFAULT_CURRENCY);

    if (user) {
      await batchWriteAll(user.uid, INITIAL_ACCOUNTS, INITIAL_CATEGORIES, INITIAL_TRANSACTIONS, DEFAULT_CURRENCY);
    }
  };

  const exportBackupJSON = (): string => {
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        cloudSyncEnabled: !!user,
        userId: user?.uid || null,
        accounts,
        categories,
        transactions,
        currency
      },
      null,
      2
    );
  };

  const importBackupJSON = async (jsonData: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data.accounts) && Array.isArray(data.categories) && Array.isArray(data.transactions)) {
        const nextCurrency = data.currency || DEFAULT_CURRENCY;
        setAccounts(data.accounts);
        setCategories(data.categories);
        setTransactions(data.transactions);
        setCurrencyState(nextCurrency);

        if (user) {
          await batchWriteAll(user.uid, data.accounts, data.categories, data.transactions, nextCurrency);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        categories,
        transactions,
        currency,
        setCurrency,
        formatCurrency,
        getAccountBalance,
        totalAssets,
        totalLiabilities,
        netWorth,
        syncStatus,
        syncErrorMessage,
        clearSyncError,
        lastSyncedAt,
        isCloudActive: !!user,
        syncNow,
        uploadLocalToCloud,
        downloadCloudToLocal,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteMultipleTransactions,
        addAccount,
        updateAccount,
        deleteAccount,
        addCategory,
        updateCategory,
        deleteCategory,
        resetToDefaultData,
        exportBackupJSON,
        importBackupJSON
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
