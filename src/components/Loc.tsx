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
