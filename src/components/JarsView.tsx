import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useJars, JARS, JarId, JarStat, LOC_STAGES, locStage } from '../context/JarsContext';
import { Loc, LocGrowth } from './Loc';
import { ChevronDown, SlidersHorizontal, Check } from 'lucide-react';

interface JarsViewProps {
  onOpenTransfer: () => void;
}

const JarGlass: React.FC<{ level: number; size?: 'sm' | 'md' }> = ({ level, size = 'sm' }) => {
  const w = size === 'sm' ? 'w-[30px] h-9' : 'w-12 h-14';
  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0" aria-hidden>
      <div className={`${size === 'sm' ? 'w-5' : 'w-8'} h-1 rounded-full bg-slate-900 dark:bg-white/80`} />
      <div className={`${w} relative overflow-hidden rounded-t-lg rounded-b-xl border-[1.5px] border-slate-900/15 dark:border-white/20 bg-white/70 dark:bg-white/[0.06]`}>
        <div
          className="absolute inset-x-0 bottom-0 bg-emerald-600 shadow-[inset_0_3px_0_rgba(255,255,255,0.35)] transition-[height] duration-500"
          style={{ height: `${level}%` }}
        />
      </div>
    </div>
  );
};

export const JarsView: React.FC<JarsViewProps> = ({ onOpenTransfer }) => {
  const { formatCurrency } = useFinance();
  const { stats, monthIncome, percents, setPercents, setCategoryJar, savingsTotal } = useJars();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<JarId, number>>(percents);
  const [open, setOpen] = useState<JarId | null>(null);

  const draftTotal = (Object.values(draft) as number[]).reduce((a, b) => a + (Number(b) || 0), 0);
  const growth = locStage(savingsTotal);

  // Lộc chọn điều đáng nói nhất
  const emptySave = stats.find((s) => s.kind === 'save' && s.allocated > 0 && s.used === 0);
  const overSpend = stats.filter((s) => s.kind === 'spend' && s.remaining < 0).sort((a, b) => a.remaining - b.remaining)[0];

  const rowSub = (s: JarStat) => {
    if (monthIncome === 0) return 'Chưa có thu nhập tháng này';
    if (s.kind === 'save') {
      if (s.used === 0) return `Chưa góp · cần ${formatCurrency(s.allocated)}`;
      return `Đã góp ${formatCurrency(s.used)} / ${formatCurrency(s.allocated)}`;
    }
    if (s.remaining < 0) return `Vượt ${formatCurrency(-s.remaining)} · mức ${formatCurrency(s.allocated)}`;
    return `Còn ${formatCurrency(s.remaining)} / ${formatCurrency(s.allocated)}`;
  };

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">6 hũ</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Chia thu nhập tháng này vào 6 mục đích</p>
        </div>
        <button
          onClick={() => {
            setDraft(percents);
            setEditing((v) => !v);
          }}
          aria-expanded={editing}
          className="glass h-11 px-4 rounded-full inline-flex items-center gap-2 text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" /> Chỉnh tỉ lệ
        </button>
      </div>

      {editing && (
        <section className="glass rounded-3xl p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {JARS.map((j) => (
              <label key={j.id} className="flex flex-col gap-1 text-sm">
                <span className="font-semibold">{j.name}</span>
                <span className="flex items-center gap-1.5">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    value={draft[j.id]}
                    onChange={(e) => setDraft({ ...draft, [j.id]: Number(e.target.value) })}
                    className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 tabular-nums"
                  />
                  <span className="text-slate-600">%</span>
                </span>
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className={`text-sm font-semibold ${draftTotal === 100 ? 'text-emerald-700' : 'text-orange-700'}`}>
              Tổng: {draftTotal}% {draftTotal !== 100 && '(cần đúng 100%)'}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setDraft(JARS.reduce((a, j) => ({ ...a, [j.id]: j.defaultPct }), {} as Record<JarId, number>))} className="h-10 px-4 rounded-full text-sm font-semibold border border-slate-200 dark:border-white/10 cursor-pointer">
                Mặc định 55/10/10/10/10/5
              </button>
              <button
                disabled={draftTotal !== 100}
                onClick={() => {
                  setPercents(draft);
                  setEditing(false);
                }}
                className="h-10 px-4 rounded-full text-sm font-semibold bg-slate-900 text-white disabled:opacity-40 cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Lưu
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:gap-5 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <section className="glass rounded-3xl p-4 flex flex-col gap-3">
            <div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Thu nhập tháng này</span>
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(monthIncome)}</p>
            </div>
            <div className="flex gap-[3px] h-2.5" role="img" aria-label={`Tỉ lệ chia: ${stats.map((s) => `${s.name} ${s.pct}%`).join(', ')}`}>
              {stats.map((s, i) => (
                <div
                  key={s.id}
                  className="rounded-full"
                  style={{ width: `${s.pct}%`, background: ['#111827', '#15803D', '#4ADE80', '#86EFAC', '#9CA3AF', '#D1D5DB'][i] }}
                />
              ))}
            </div>
          </section>

          {(emptySave || overSpend) && (
            <section className="glass rounded-3xl p-3.5 flex items-center gap-3">
              <Loc mood={overSpend ? 'worried' : 'nudge'} size={56} label="Lộc" className="shrink-0" />
              <p className="flex-1 text-sm leading-relaxed">
                {overSpend ? (
                  <>Hũ <b>{overSpend.name}</b> đã vượt {formatCurrency(-overSpend.remaining)}. Thử bớt chi nhóm này vài ngày nhé.</>
                ) : (
                  <>Hũ <b>{emptySave!.name}</b> tháng này chưa có đồng nào. Chuyển {formatCurrency(emptySave!.allocated)} vào tài khoản {emptySave!.id === 'FFA' ? 'đầu tư' : 'tiết kiệm'} luôn nhé?</>
                )}
              </p>
              {!overSpend && (
                <button onClick={onOpenTransfer} className="h-10 px-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold shrink-0 cursor-pointer">
                  Trích
                </button>
              )}
            </section>
          )}

          <section className="glass rounded-3xl px-4 py-1">
            {stats.map((s, i) => {
              const isOpen = open === s.id;
              const warn = (s.kind === 'save' && s.used === 0 && s.allocated > 0) || s.remaining < 0;
              return (
                <div key={s.id} className={i < stats.length - 1 ? 'border-b border-slate-900/[0.06] dark:border-white/[0.06]' : ''}>
                  <button
                    onClick={() => setOpen(isOpen ? null : s.id)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center gap-3 py-3 text-left cursor-pointer"
                  >
                    <JarGlass level={s.level} />
                    <span className="flex-1 min-w-0 flex flex-col">
                      <span className="text-[15px] font-semibold">{s.name}</span>
                      <span className={`text-xs tabular-nums ${warn ? 'text-orange-700 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>{rowSub(s)}</span>
                    </span>
                    <span className="text-xs font-bold bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-full">{s.pct}%</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="pb-3 pl-[42px] flex flex-col gap-2 text-sm">
                      <p className="text-slate-600 dark:text-slate-400">{s.description}.</p>
                      {s.kind === 'save' ? (
                        <p className="text-slate-600 dark:text-slate-400">
                          Tự tính khi bạn chuyển tiền vào tài khoản loại <b>{s.id === 'FFA' ? 'Đầu tư' : 'Tiết kiệm'}</b>.
                        </p>
                      ) : (
                        <>
                          <span className="text-xs font-semibold text-slate-600">Hạng mục chi thuộc hũ này (bấm để chuyển hũ):</span>
                          {s.categories.length === 0 && <span className="text-slate-500">Chưa có hạng mục nào.</span>}
                          {s.categories.map((c) => (
                            <label key={c.id} className="flex items-center justify-between gap-2">
                              <span className="truncate">{c.name}</span>
                              <select
                                value={s.id}
                                onChange={(e) => setCategoryJar(c.id, e.target.value as JarId)}
                                className="h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-2 text-sm"
                                aria-label={`Chọn hũ cho ${c.name}`}
                              >
                                {JARS.filter((j) => j.kind === 'spend').map((j) => (
                                  <option key={j.id} value={j.id}>{j.name}</option>
                                ))}
                              </select>
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </div>

        {/* Lộc lớn lên */}
        <section className="glass rounded-3xl p-5 flex flex-col gap-4 lg:col-span-2 self-start w-full">
          <div className="flex items-center gap-4">
            <LocGrowth stage={growth.index} size={88} />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tracking-wide">LỘC ĐANG Ở GIAI ĐOẠN</span>
              <p className="text-xl font-bold">{growth.stage.name}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Tích lũy {formatCurrency(savingsTotal)}</p>
            </div>
          </div>
          {growth.next ? (
            <div className="flex flex-col gap-1.5">
              <div className="h-2 rounded-full bg-slate-900/[0.08] overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${Math.min(100, Math.round(((savingsTotal - growth.stage.min) / (growth.next.min - growth.stage.min)) * 100))}%` }}
                />
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Còn {formatCurrency(growth.next.min - savingsTotal)} nữa để thành <b>{growth.next.name}</b>
              </span>
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">Lộc đã thành cây! Tiếp tục để dành để cây ra thêm lộc nhé.</p>
          )}
          <div className="grid grid-cols-4 gap-2 items-end pt-1">
            {LOC_STAGES.map((st, i) => (
              <div key={st.id} className={`flex flex-col items-center gap-1 ${i > growth.index ? 'opacity-35' : ''}`}>
                <LocGrowth stage={i} size={40 + i * 6} />
                <span className="text-[11px] font-semibold">{st.name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">Tính từ số dư các tài khoản Tiết kiệm và Đầu tư.</p>
        </section>
      </div>
    </div>
  );
};
