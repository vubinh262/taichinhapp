import React, { useMemo, useState } from 'react';
import { useJars } from '../context/JarsContext';
import { Loc } from './Loc';

const short = (n: number) => {
  if (!isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2).replace('.', ',').replace(/,?0+$/, '') + ' tỷ';
  return Math.round(n / 1e6).toLocaleString('vi-VN') + ' triệu';
};
const vn = (n: number) => n.toString().replace('.', ',');

/** Giá trị tương lai khi góp đều mỗi tháng */
const futureValue = (monthly: number, years: number, annualRate: number) => {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return r > 0 ? (monthly * (Math.pow(1 + r, n) - 1)) / r : monthly * n;
};

const Slider: React.FC<{
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}> = ({ label, value, display, min, max, step, onChange }) => (
  <label className="flex flex-col gap-1 text-sm">
    <span className="flex justify-between gap-2 text-slate-700 dark:text-slate-300">
      <span>{label}</span>
      <b className="tabular-nums text-slate-900 dark:text-white">{display}</b>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-7 accent-emerald-600 cursor-pointer"
    />
  </label>
);

export const InvestView: React.FC = () => {
  const { stats, monthIncome } = useJars();
  const ffa = stats.find((s) => s.id === 'FFA')?.allocated || 0;
  const ffaPlusLtss = stats.filter((s) => s.kind === 'save').reduce((a, s) => a + s.allocated, 0);

  const [tab, setTab] = useState<'gold' | 'home'>('gold');
  const [monthly, setMonthly] = useState(() => Math.max(0.5, Math.round(ffa / 1e5) / 10 || 3));
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(6);
  const [price, setPrice] = useState(2.5);
  const [downPct, setDownPct] = useState(30);
  const [save, setSave] = useState(() => Math.max(1, Math.round(ffaPlusLtss / 1e5) / 10 || 8));
  const [loanRate, setLoanRate] = useState(10);
  const [loanYears, setLoanYears] = useState(20);

  const gold = useMemo(() => {
    const P = monthly * 1e6;
    const fv = futureValue(P, years, rate);
    const contrib = P * years * 12;
    return { fv, contrib, gain: fv - contrib, pct: fv > 0 ? Math.round((contrib / fv) * 100) : 100 };
  }, [monthly, years, rate]);

  const home = useMemo(() => {
    const p = price * 1e9;
    const down = (p * downPct) / 100;
    const loan = p - down;
    const S = save * 1e6;
    const rs = 0.05 / 12; // tiền để dành gửi tiết kiệm 5%/năm
    const months = Math.ceil(Math.log((down * rs) / S + 1) / Math.log(1 + rs));
    const i = loanRate / 100 / 12;
    const N = loanYears * 12;
    const pay = loan > 0 ? (loan * i) / (1 - Math.pow(1 + i, -N)) : 0;
    const totalInterest = pay * N - loan;
    const ratio = monthIncome > 0 ? Math.round((pay / monthIncome) * 100) : null;
    const y = Math.floor(months / 12);
    const m = months % 12;
    return {
      down, loan, pay, totalInterest, ratio,
      time: months <= 0 ? 'Đã đủ' : `${y > 0 ? `${y} năm ` : ''}${m > 0 ? `${m} tháng` : ''}`.trim()
    };
  }, [price, downPct, save, loanRate, loanYears, monthIncome]);

  const tip =
    tab === 'gold'
      ? 'Mua đều mỗi tháng giúp bạn không phải đoán đúng lúc giá thấp. Có thể lấy luôn từ hũ Tự do tài chính.'
      : home.ratio === null
      ? 'Ghi thu nhập tháng này để Lộc so sánh tiền trả góp với thu nhập của bạn.'
      : home.ratio <= 40
      ? `Trả góp chiếm ${home.ratio}% thu nhập hiện tại, vẫn trong ngưỡng an toàn 40%.`
      : `Trả góp chiếm ${home.ratio}% thu nhập, vượt ngưỡng 40%. Thử trả trước nhiều hơn hoặc chọn nhà giá thấp hơn.`;

  return (
    <div className="flex flex-col gap-4 lg:gap-5 max-w-3xl">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Tính phương án đầu tư</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Kéo thanh trượt để thử các kịch bản</p>
      </div>

      <div role="tablist" aria-label="Loại đầu tư" className="glass grid grid-cols-2 gap-1 p-1 rounded-full">
        {([['gold', 'Tích lũy vàng'], ['home', 'Mua nhà đất']] as const).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`h-11 rounded-full text-sm font-semibold cursor-pointer ${tab === id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-400'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tab === 'gold' ? (
          <>
            <section className="rounded-[28px] p-5 bg-emerald-600 text-white flex flex-col gap-2 shadow-[0_14px_30px_rgba(21,128,61,0.28),inset_0_1px_0_rgba(255,255,255,0.35)]">
              <span className="text-sm font-semibold">Sau {years} năm bạn có khoảng</span>
              <span className="text-4xl font-bold tabular-nums">{short(gold.fv)}</span>
              <div className="h-2 rounded-full bg-white/25 overflow-hidden mt-1">
                <div className="h-full bg-white" style={{ width: `${gold.pct}%` }} />
              </div>
              <div className="flex justify-between text-xs tabular-nums">
                <span>Tiền góp {short(gold.contrib)}</span>
                <span>Tăng giá {short(gold.gain)}</span>
              </div>
            </section>
            <section className="glass rounded-3xl p-5 flex flex-col gap-3">
              <Slider label="Mua vàng mỗi tháng" value={monthly} display={`${vn(monthly)} triệu`} min={0.5} max={30} step={0.1} onChange={setMonthly} />
              <Slider label="Thời gian" value={years} display={`${years} năm`} min={1} max={30} step={1} onChange={setYears} />
              <Slider label="Giá vàng tăng giả định" value={rate} display={`${vn(rate)}%/năm`} min={0} max={15} step={0.5} onChange={setRate} />
            </section>
          </>
        ) : (
          <>
            <section className="rounded-[28px] p-5 bg-emerald-600 text-white flex flex-col gap-2 shadow-[0_14px_30px_rgba(21,128,61,0.28),inset_0_1px_0_rgba(255,255,255,0.35)]">
              <span className="text-sm font-semibold">Đủ tiền trả trước sau</span>
              <span className="text-4xl font-bold tabular-nums">{home.time}</span>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 tabular-nums">
                <div className="flex flex-col"><span>Cần trả trước</span><b className="text-base">{short(home.down)}</b></div>
                <div className="flex flex-col"><span>Trả góp mỗi tháng</span><b className="text-base">{short(home.pay)}</b></div>
                <div className="flex flex-col"><span>Khoản vay</span><b className="text-base">{short(home.loan)}</b></div>
                <div className="flex flex-col"><span>Tổng tiền lãi</span><b className="text-base">{short(home.totalInterest)}</b></div>
              </div>
            </section>
            <section className="glass rounded-3xl p-5 flex flex-col gap-3">
              <Slider label="Giá nhà mục tiêu" value={price} display={short(price * 1e9)} min={0.5} max={15} step={0.1} onChange={setPrice} />
              <Slider label="Trả trước" value={downPct} display={`${downPct}%`} min={20} max={100} step={5} onChange={setDownPct} />
              <Slider label="Để dành mỗi tháng" value={save} display={`${vn(save)} triệu`} min={1} max={60} step={0.1} onChange={setSave} />
              <Slider label="Lãi vay ngân hàng" value={loanRate} display={`${vn(loanRate)}%/năm`} min={5} max={15} step={0.5} onChange={setLoanRate} />
              <Slider label="Thời hạn vay" value={loanYears} display={`${loanYears} năm`} min={5} max={35} step={1} onChange={setLoanYears} />
            </section>
          </>
        )}
      </div>

      <section className="glass rounded-3xl p-4 flex items-center gap-3">
        <Loc mood={tab === 'home' && home.ratio !== null && home.ratio > 40 ? 'worried' : 'happy'} size={52} label="Lộc" className="shrink-0" />
        <p className="text-sm leading-relaxed">{tip}</p>
      </section>
      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 px-1">
        Kết quả chỉ để tham khảo, dựa trên các giả định bạn chọn, không phải lời khuyên đầu tư. Giá vàng và lãi suất thực tế thay đổi theo thị trường.
        Tiền để dành mua nhà được tính lãi tiết kiệm 5%/năm; trả góp tính theo dư nợ giảm dần, góp đều hằng tháng.
      </p>
    </div>
  );
};
