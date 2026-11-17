import React, { useEffect, useRef, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useJars, JARS } from '../context/JarsContext';
import { CategoryIcon } from './CategoryIcon';
import { DraftTx, parseLocal, parseWithGemini, GEMINI_KEY_STORAGE } from '../lib/quickParse';
import { Sparkles, Mic, Square, X, Settings2, Loader2 } from 'lucide-react';

const todayLocal = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

interface QuickAddProps {
  onSaved: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognitionCtor: any =
  typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : undefined;

/**
 * Nhập nhanh: gõ hoặc nói một câu, AI tách thành các giao dịch để kiểm tra rồi lưu.
 * Mặc định dùng bộ phân tích tại máy (không cần mạng). Nếu người dùng nhập API key Gemini, dùng Gemini cho câu phức tạp.
 */
export const QuickAdd: React.FC<QuickAddProps> = ({ onSaved }) => {
  const { categories, accounts, transactions, addTransaction, formatCurrency } = useFinance();
  const { jarOfCategory } = useJars();
  const [text, setText] = useState('');
  const [drafts, setDrafts] = useState<DraftTx[]>([]);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(GEMINI_KEY_STORAGE) || '');
  const recRef = useRef<any>(null);
  const ctx = { categories, accounts, transactions };

  useEffect(() => () => recRef.current?.abort?.(), []);

  const analyse = async (value = text) => {
    if (!value.trim()) return;
    setBusy(true);
    setMessage(null);
    let result: DraftTx[] | null = null;
    if (apiKey) result = await parseWithGemini(value, apiKey, ctx);
    if (!result) result = parseLocal(value, ctx);
    setDrafts(result);
    if (result.length === 0) setMessage('Lộc chưa thấy số tiền nào. Thử như: “phở 45k, xăng 80k tiền mặt”.');
    setBusy(false);
  };

  const toggleMic = () => {
    if (!SpeechRecognitionCtor) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SpeechRecognitionCtor();
    rec.lang = 'vi-VN';
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = '';
    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      setText((finalText + interim).trim());
    };
    rec.onerror = (e: any) => {
      setMessage(
        e.error === 'not-allowed'
          ? 'Bạn cần cho phép dùng micro để nhập bằng giọng nói.'
          : 'Không nghe được giọng nói trên thiết bị này. Bạn gõ giúp Lộc nhé.'
      );
    };
    rec.onend = () => {
      setListening(false);
      if (finalText.trim()) analyse(finalText.trim());
    };
    recRef.current = rec;
    setListening(true);
    setMessage(null);
    rec.start();
  };

  const saveAll = async () => {
    setBusy(true);
    for (const d of drafts) {
      await addTransaction({
        type: d.type,
        amount: d.amount,
        categoryId: d.categoryId,
        accountId: d.accountId,
        note: d.note,
        date: d.date,
        time: d.time,
        tags: ['nhập nhanh'],
      });
    }
    setBusy(false);
    setDrafts([]);
    setText('');
    onSaved();
  };

  const update = (key: string, patch: Partial<DraftTx>) =>
    setDrafts((list) => list.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  return (
    <section className="rounded-3xl p-3.5 border border-emerald-600/25 bg-emerald-50/60 dark:bg-emerald-950/20 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="quick-add-input" className="flex items-center gap-2 text-[13px] font-semibold text-emerald-800 dark:text-emerald-300">
          <Sparkles className="w-4 h-4" /> Gõ hoặc nói, Lộc tự ghi giúp bạn
        </label>
        <button
          type="button"
          onClick={() => setShowKey((v) => !v)}
          aria-expanded={showKey}
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 inline-flex items-center gap-1 cursor-pointer"
        >
          <Settings2 className="w-3.5 h-3.5" /> {apiKey ? 'Gemini: bật' : 'Dùng Gemini'}
        </button>
      </div>

      {showKey && (
        <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-3 flex flex-col gap-2 text-xs text-slate-700 dark:text-slate-300">
          <p>
            Không cần key, Lộc vẫn hiểu các câu thường gặp ngay trên máy. Muốn hiểu câu phức tạp hơn, dán API key Gemini miễn phí lấy tại
            {' '}<a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="font-semibold underline">aistudio.google.com/apikey</a>.
            Key chỉ lưu trên thiết bị này.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value.trim())}
              placeholder="Dán API key Gemini"
              aria-label="API key Gemini"
              className="flex-1 min-w-0 h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                if (apiKey) localStorage.setItem(GEMINI_KEY_STORAGE, apiKey);
                else localStorage.removeItem(GEMINI_KEY_STORAGE);
                setShowKey(false);
              }}
              className="h-10 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold cursor-pointer"
            >
              Lưu
            </button>
          </div>
        </div>
      )}

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          analyse();
        }}
      >
        <input
          id="quick-add-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="VD: trưa ăn phở 45k, xăng 80k tiền mặt"
          autoComplete="off"
          className="flex-1 min-w-0 h-11 rounded-2xl border-0 bg-white/90 dark:bg-white/[0.06] px-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
        {SpeechRecognitionCtor && (
          <button
            type="button"
            onClick={toggleMic}
            aria-label={listening ? 'Dừng ghi âm' : 'Nhập bằng giọng nói'}
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${listening ? 'bg-orange-600 text-white animate-pulse' : 'bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white'}`}
          >
            {listening ? <Square className="w-4 h-4" /> : <Mic className="w-[18px] h-[18px]" />}
          </button>
        )}
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="h-11 px-4 rounded-full bg-emerald-600 text-white text-sm font-semibold shrink-0 disabled:opacity-40 cursor-pointer inline-flex items-center gap-1.5"
        >
          {busy && drafts.length === 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Tách
        </button>
      </form>

      {message && <p className="text-xs text-orange-800 dark:text-orange-300">{message}</p>}

      {drafts.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-slate-600 dark:text-slate-400">Lộc tách được {drafts.length} giao dịch, kiểm tra rồi lưu nhé:</span>
          {drafts.map((d) => {
            const cat = categories.find((c) => c.id === d.categoryId);
            const jarId = jarOfCategory(d.categoryId);
            const jarName = JARS.find((j) => j.id === jarId)?.name;
            const pool = categories.filter((c) => c.type === d.type);
            return (
              <div key={d.key} className="rounded-2xl bg-white/90 dark:bg-white/[0.06] p-2.5 flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${d.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white'}`}>
                    <CategoryIcon name={cat?.icon || 'Receipt'} className="w-[18px] h-[18px]" />
                  </span>
                  <input
                    value={d.note}
                    onChange={(e) => update(d.key, { note: e.target.value })}
                    aria-label="Ghi chú"
                    className="flex-1 min-w-0 bg-transparent text-sm font-semibold focus:outline-none"
                  />
                  <span className={`text-sm font-semibold tabular-nums shrink-0 ${d.type === 'INCOME' ? 'text-emerald-700' : ''}`}>
                    {d.type === 'INCOME' ? '+' : '−'}{formatCurrency(d.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDrafts((l) => l.filter((x) => x.key !== d.key))}
                    aria-label="Bỏ giao dịch này"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2 pl-[46px]">
                  <select
                    value={d.categoryId}
                    onChange={(e) => update(d.key, { categoryId: e.target.value })}
                    aria-label="Hạng mục"
                    className="flex-1 min-w-0 h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 text-xs"
                  >
                    {pool.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={d.accountId}
                    onChange={(e) => update(d.key, { accountId: e.target.value })}
                    aria-label="Tài khoản"
                    className="flex-1 min-w-0 h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 text-xs"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                {d.type === 'EXPENSE' && jarName && (
                  <span className="pl-[46px] text-[11px] text-slate-600 dark:text-slate-400">
                    Hũ {jarName}{d.date !== todayLocal() ? ` · ngày ${d.date.split('-').reverse().slice(0, 2).join('/')}` : ''}
                  </span>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={saveAll}
            disabled={busy}
            className="h-12 rounded-full bg-emerald-600 text-white text-[15px] font-bold disabled:opacity-50 cursor-pointer"
          >
            {busy ? 'Đang lưu…' : `Lưu ${drafts.length} giao dịch`}
          </button>
        </div>
      )}
    </section>
  );
};
