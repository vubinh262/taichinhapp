import React from 'react';

export type LocMood = 'happy' | 'worried' | 'celebrate' | 'nudge';

interface LocProps {
  mood?: LocMood;
  size?: number;
  className?: string;
  /** Mô tả cho trình đọc màn hình. Bỏ trống nếu Lộc chỉ để trang trí. */
  label?: string;
}

/**
 * Lộc – trợ lý tiết kiệm: một mầm lộc non.
 * Thân xanh có vệt sáng kiểu "liquid glass", biểu cảm đổi theo `mood`.
 */
export const Loc: React.FC<LocProps> = ({ mood = 'happy', size = 64, className, label }) => {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} {...a11y}>
      <ellipse cx="60" cy="112" rx="26" ry="4" fill="#111827" opacity="0.08" />
      <path d="M60 40c22 0 38 15 38 36s-16 34-38 34-38-13-38-34 16-36 38-36z" fill="#22C55E" />
      <ellipse cx="44" cy="56" rx="10" ry="6" fill="#FFFFFF" opacity="0.45" transform="rotate(-30 44 56)" />

      {/* Mầm lá */}
      {mood === 'celebrate' ? (
        <>
          <path d="M60 41V24" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
          <path d="M60 28c-5-12-16-15-25-11 2 11 14 15 25 11z" fill="#16A34A" />
          <path d="M60 25c4-13 15-17 25-14-1 11-13 17-25 14z" fill="#4ADE80" />
        </>
      ) : mood === 'worried' ? (
        <>
          <path d="M60 41V30" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
          <path d="M60 33c-6-6-14-6-20-2 4 7 12 8 20 2z" fill="#16A34A" />
          <path d="M60 31c5-7 14-8 20-5-3 8-12 10-20 5z" fill="#4ADE80" />
        </>
      ) : (
        <>
          <path d="M60 41V27" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
          <path d="M60 30c-4-10-14-13-22-10 2 9 12 13 22 10z" fill="#16A34A" />
          <path d="M60 27c3-11 13-15 22-13-1 10-11 15-22 13z" fill="#4ADE80" />
        </>
      )}

      {/* Mắt */}
      {(mood === 'happy' || mood === 'celebrate') && (
        <path d="M43 76q6-7 12 0M65 76q6-7 12 0" stroke="#111827" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      )}
      {mood === 'worried' && (
        <>
          <circle cx="49" cy="76" r="3.5" fill="#111827" />
          <circle cx="71" cy="76" r="3.5" fill="#111827" />
          <path d="M43 68l10-4M77 68l-10-4" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {mood === 'nudge' && (
        <>
          <circle cx="49" cy="75" r="3.5" fill="#111827" />
          <path d="M65 76q6-6 12 0" stroke="#111827" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Má hồng */}
      <ellipse cx="40" cy="85" rx="6" ry="3.5" fill="#FCA5A5" opacity="0.6" />
      <ellipse cx="80" cy="85" rx="6" ry="3.5" fill="#FCA5A5" opacity="0.6" />

      {/* Miệng & phụ kiện */}
      {mood === 'happy' && <path d="M53 86q7 7 14 0" stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" />}
      {mood === 'nudge' && (
        <>
          <path d="M54 87q6 5 12 0" stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="99" cy="92" r="11" fill="#FACC15" stroke="#CA8A04" strokeWidth="2" />
          <path d="M99 86v12M95.5 89.5h7" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {mood === 'worried' && (
        <>
          <path d="M53 90q3.5-3 7 0t7 0" stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M88 56c3 4 4 8 1 9.5s-5-4-1-9.5z" fill="#7DD3FC" />
        </>
      )}
      {mood === 'celebrate' && (
        <>
          <path d="M50 83q10 14 20 0z" fill="#111827" />
          <path d="M18 46l2.5 5.5 5.5 2.5-5.5 2.5-2.5 5.5-2.5-5.5-5.5-2.5 5.5-2.5z" fill="#FACC15" />
          <path d="M101 36l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z" fill="#FACC15" />
        </>
      )}
    </svg>
  );
};

/** Lộc theo giai đoạn lớn lên: 0 Hạt, 1 Mầm, 2 Lộc non, 3 Cây lộc */
export const LocGrowth: React.FC<{ stage: number; size?: number; className?: string }> = ({ stage, size = 72, className }) => {
  if (stage <= 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-hidden>
        <ellipse cx="60" cy="112" rx="22" ry="4" fill="#111827" opacity="0.08" />
        <path d="M60 58c17 0 28 11 28 26s-11 24-28 24-28-9-28-24 11-26 28-26z" fill="#4ADE80" />
        <circle cx="52" cy="84" r="3" fill="#111827" />
        <circle cx="68" cy="84" r="3" fill="#111827" />
        <path d="M56 93q4 3 8 0" stroke="#111827" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (stage === 1) {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-hidden>
        <ellipse cx="60" cy="112" rx="24" ry="4" fill="#111827" opacity="0.08" />
        <path d="M60 50c20 0 33 13 33 30s-13 30-33 30-33-11-33-30 13-30 33-30z" fill="#4ADE80" />
        <path d="M60 51V40" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
        <path d="M60 42c3-9 11-12 18-10-1 8-9 12-18 10z" fill="#16A34A" />
        <circle cx="51" cy="80" r="3.2" fill="#111827" />
        <circle cx="69" cy="80" r="3.2" fill="#111827" />
        <path d="M55 90q5 4 10 0" stroke="#111827" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (stage === 2) return <Loc mood="happy" size={size} className={className} />;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-hidden>
      <ellipse cx="60" cy="112" rx="28" ry="4" fill="#111827" opacity="0.08" />
      <path d="M60 44c22 0 38 14 38 34s-16 32-38 32-38-12-38-32 16-34 38-34z" fill="#16A34A" />
      <ellipse cx="44" cy="58" rx="10" ry="6" fill="#FFFFFF" opacity="0.4" transform="rotate(-30 44 58)" />
      <path d="M60 45V14" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
      <path d="M60 36c-5-10-15-12-23-8 3 9 13 12 23 8z" fill="#22C55E" />
      <path d="M60 30c4-10 14-13 22-10-2 9-12 13-22 10z" fill="#4ADE80" />
      <path d="M60 20c-4-8-12-10-18-6 2 7 10 9 18 6z" fill="#4ADE80" />
      <circle cx="60" cy="12" r="5" fill="#FACC15" />
      <circle cx="49" cy="77" r="3.5" fill="#111827" />
      <circle cx="71" cy="77" r="3.5" fill="#111827" />
      <path d="M53 87q7 6 14 0" stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
};
