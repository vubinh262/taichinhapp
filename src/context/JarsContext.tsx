import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useFinance } from './FinanceContext';
import { Category } from '../types';

/** Phương pháp 6 hũ (JARS) */
export type JarId = 'NEC' | 'FFA' | 'LTSS' | 'EDU' | 'PLAY' | 'GIVE';

export interface JarDef {
  id: JarId;
  name: string;
  short: string;
  description: string;
  /** spend: hũ để tiêu (theo dõi đã chi). save: hũ để dành (theo dõi đã góp). */
  kind: 'spend' | 'save';
  defaultPct: number;
}

export const JARS: JarDef[] = [
  { id: 'NEC', name: 'Thiết yếu', short: 'Thiết yếu', description: 'Ăn uống, nhà ở, đi lại, hóa đơn', kind: 'spend', defaultPct: 55 },
  { id: 'FFA', name: 'Tự do tài chính', short: 'Tự do TC', description: 'Đầu tư sinh lời, không tiêu', kind: 'save', defaultPct: 10 },
  { id: 'LTSS', name: 'Tiết kiệm dài hạn', short: 'Tiết kiệm', description: 'Mua nhà, xe, quỹ dự phòng', kind: 'save', defaultPct: 10 },
  { id: 'EDU', name: 'Giáo dục', short: 'Giáo dục', description: 'Sách, khóa học, phát triển bản thân', kind: 'spend', defaultPct: 10 },
  { id: 'PLAY', name: 'Hưởng thụ', short: 'Hưởng thụ', description: 'Giải trí, du lịch, tự thưởng', kind: 'spend', defaultPct: 10 },
  { id: 'GIVE', name: 'Cho đi', short: 'Cho đi', description: 'Biếu tặng, hiếu hỉ, từ thiện', kind: 'spend', defaultPct: 5 },
];

const STORAGE_KEY = 'pf_jars_v1';

interface JarSettings {
  percents: Record<JarId, number>;
  /** categoryId -> jar */
  mapping: Record<string, JarId>;
}

export interface JarStat extends JarDef {
  pct: number;
  allocated: number;
  /** Hũ tiêu: số đã chi. Hũ để dành: số đã góp. */
  used: number;
  /** Hũ tiêu: số còn lại. Hũ để dành: số còn thiếu. */
  remaining: number;
  /** 0–100: mức "nước" trong hũ. Hũ tiêu = phần còn lại, hũ để dành = phần đã góp. */
  level: number;
  categories: Category[];
}

interface JarsContextType {
  percents: Record<JarId, number>;
  setPercents: (p: Record<JarId, number>) => void;
  mapping: Record<string, JarId>;
  setCategoryJar: (categoryId: string, jar: JarId) => void;
  jarOfCategory: (categoryId?: string) => JarId | undefined;
  monthIncome: number;
  stats: JarStat[];
  /** Thiết yếu + Hưởng thụ còn lại, chia cho số ngày còn lại */
  perDay: number;
  spendableLeft: number;
  daysLeft: number;
  /** Tổng số dư các tài khoản tiết kiệm & đầu tư — để Lộc lớn lên */
  savingsTotal: number;
}

const defaultPercents = () =>
  JARS.reduce((acc, j) => ({ ...acc, [j.id]: j.defaultPct }), {} as Record<JarId, number>);

/** Gợi ý hũ từ tên hạng mục */
export const guessJar = (name: string): JarId => {
  const n = name.toLowerCase();
  if (/(học|sách|khóa|khoá|giáo dục|đào tạo)/.test(n)) return 'EDU';
  if (/(giải trí|du lịch|phim|game|spa|làm đẹp|hưởng thụ)/.test(n)) return 'PLAY';
  if (/(hiếu|quà|biếu|từ thiện|cho đi|tặng)/.test(n)) return 'GIVE';
  return 'NEC';
};

const JarsContext = createContext<JarsContextType | undefined>(undefined);

export const JarsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { categories, transactions, accounts, getAccountBalance } = useFinance();

  const [settings, setSettings] = useState<JarSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as JarSettings;
        return { percents: { ...defaultPercents(), ...parsed.percents }, mapping: parsed.mapping || {} };
      }
    } catch {
      /* dùng mặc định */
    }
    return { percents: defaultPercents(), mapping: {} };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const jarOfCategory = (categoryId?: string): JarId | undefined => {
    if (!categoryId) return undefined;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat || cat.type !== 'EXPENSE') return undefined;
    return settings.mapping[categoryId] || guessJar(cat.name);
  };

  const computed = useMemo(() => {
    const now = new Date();
    const inMonth = (d: string) => {
      const x = new Date(d);
      return x.getMonth() === now.getMonth() && x.getFullYear() === now.getFullYear();
    };
    const accType = (id?: string) => accounts.find((a) => a.id === id)?.type;

    let monthIncome = 0;
    const used: Record<JarId, number> = { NEC: 0, FFA: 0, LTSS: 0, EDU: 0, PLAY: 0, GIVE: 0 };

    transactions.forEach((t) => {
      if (!inMonth(t.date)) return;
      if (t.type === 'INCOME') monthIncome += t.amount;
      if (t.type === 'EXPENSE') {
        const cat = categories.find((c) => c.id === t.categoryId);
        const jar = cat ? settings.mapping[cat.id] || guessJar(cat.name) : 'NEC';
        used[jar] += t.amount;
      }
      if (t.type === 'TRANSFER') {
        const to = accType(t.toAccountId);
        const from = accType(t.accountId);
        // Chuyển vào tài khoản đầu tư = góp hũ Tự do tài chính; vào tiết kiệm = góp hũ Tiết kiệm dài hạn
        if (to === 'INVESTMENT' && from !== 'INVESTMENT') used.FFA += t.amount;
        if (to === 'SAVING' && from !== 'SAVING') used.LTSS += t.amount;
      }
    });

    const stats: JarStat[] = JARS.map((j) => {
      const pct = settings.percents[j.id] ?? j.defaultPct;
      const allocated = Math.round((monthIncome * pct) / 100);
      const u = used[j.id];
      const remaining = j.kind === 'spend' ? allocated - u : Math.max(0, allocated - u);
      const level =
        allocated <= 0
          ? 0
          : j.kind === 'spend'
          ? Math.max(0, Math.min(100, Math.round(((allocated - u) / allocated) * 100)))
          : Math.max(0, Math.min(100, Math.round((u / allocated) * 100)));
      const cats = categories.filter(
        (c) => c.type === 'EXPENSE' && (settings.mapping[c.id] || guessJar(c.name)) === j.id
      );
      return { ...j, pct, allocated, used: u, remaining, level, categories: j.kind === 'spend' ? cats : [] };
    });

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate() + 1;
    const spendableLeft = stats
      .filter((s) => s.id === 'NEC' || s.id === 'PLAY')
      .reduce((sum, s) => sum + Math.max(0, s.remaining), 0);
    const perDay = daysLeft > 0 ? Math.floor(spendableLeft / daysLeft / 1000) * 1000 : 0;

    const savingsTotal = accounts
      .filter((a) => a.type === 'SAVING' || a.type === 'INVESTMENT')
      .reduce((sum, a) => sum + Math.max(0, getAccountBalance(a.id)), 0);

    return { monthIncome, stats, daysLeft, spendableLeft, perDay, savingsTotal };
  }, [transactions, categories, accounts, settings, getAccountBalance]);

  const value: JarsContextType = {
    percents: settings.percents,
    setPercents: (p) => setSettings((s) => ({ ...s, percents: p })),
    mapping: settings.mapping,
    setCategoryJar: (categoryId, jar) =>
      setSettings((s) => ({ ...s, mapping: { ...s.mapping, [categoryId]: jar } })),
    jarOfCategory,
    ...computed,
  };

  return <JarsContext.Provider value={value}>{children}</JarsContext.Provider>;
};

export const useJars = () => {
  const ctx = useContext(JarsContext);
  if (!ctx) throw new Error('useJars must be used within JarsProvider');
  return ctx;
};

/** Các giai đoạn lớn lên của Lộc theo tổng tiền tích lũy */
export const LOC_STAGES = [
  { id: 'seed', name: 'Hạt', min: 0 },
  { id: 'sprout', name: 'Mầm', min: 10_000_000 },
  { id: 'young', name: 'Lộc non', min: 50_000_000 },
  { id: 'tree', name: 'Cây lộc', min: 100_000_000 },
] as const;

export const locStage = (total: number) => {
  let idx = 0;
  LOC_STAGES.forEach((s, i) => {
    if (total >= s.min) idx = i;
  });
  const next = LOC_STAGES[idx + 1];
  return { index: idx, stage: LOC_STAGES[idx], next };
};
