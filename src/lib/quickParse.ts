import { Account, Category, Transaction, TransactionType } from '../types';

export interface DraftTx {
  key: string;
  type: TransactionType;
  amount: number;
  categoryId?: string;
  accountId: string;
  note: string;
  date: string;
  time: string;
}

/** Bỏ dấu tiếng Việt để so khớp từ khoá */
export const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');

const pad = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Từ khoá → từ khoá tìm trong tên hạng mục (đã bỏ dấu) */
const EXPENSE_RULES: { words: RegExp; cat: string[] }[] = [
  { words: /\b(pho|com|bun|mien|banh|an |an$|anh|uong|ca phe|cafe|cf|tra sua|tra|lau|nhau|bia|sang|trua|toi|do an|grabfood|shopeefood|kfc|pizza)\b/, cat: ['an uong', 'an'] },
  { words: /\b(xang|grab|be|taxi|xe|gui xe|ve xe|bus|may bay|ve tau|sua xe|rua xe)\b/, cat: ['di chuyen', 'xang'] },
  { words: /\b(tien nha|thue nha|tien phong|dien|nuoc|internet|wifi|gas|hoa don)\b/, cat: ['nha', 'tien ich'] },
  { words: /\b(mua|quan|ao|giay|dep|shopee|lazada|tiki|sieu thi|do dung|gia dung|my pham)\b/, cat: ['mua sam', 'gia dung'] },
  { words: /\b(thuoc|kham|benh vien|gym|yoga|bao hiem|nha khoa|suc khoe)\b/, cat: ['suc khoe', 'gym'] },
  { words: /\b(sach|hoc|khoa hoc|hoc phi|lop)\b/, cat: ['hoc', 'sach'] },
  { words: /\b(phim|game|du lich|karaoke|netflix|spotify|concert|di choi|khach san)\b/, cat: ['giai tri', 'du lich'] },
  { words: /\b(qua|cuoi|dam|bieu|mung|tu thien|sinh nhat)\b/, cat: ['hieu', 'qua'] },
  { words: /\b(tra no|tra gop|no the)\b/, cat: ['tra no'] },
];

const INCOME_RULES: { words: RegExp; cat: string[] }[] = [
  { words: /\b(luong)\b/, cat: ['luong'] },
  { words: /\b(thuong|phu cap)\b/, cat: ['thuong', 'phu cap'] },
  { words: /\b(freelance|du an|job|lam them)\b/, cat: ['freelance', 'nghe tay trai'] },
  { words: /\b(co tuc|lai|loi nhuan)\b/, cat: ['dau tu', 'co tuc'] },
  { words: /\b(ho tro|cho|bo me cho)\b/, cat: ['ho tro'] },
];

const INCOME_HINT = /\b(nhan|luong|thuong|duoc cho|duoc tang|ban duoc|hoan tien|thu ve|co tuc)\b/;

/** Đọc số tiền kiểu Việt Nam: 45k, 45 nghìn, 1tr2, 1,5tr, 2 triệu, 200.000, 45 (=45k) */
export const parseAmount = (text: string): { amount: number; match: string } | null => {
  const t = fold(text);
  const re = /(\d+(?:[.,]\d+)*)\s*(k|nghin|ngan|ng|tr|trieu|cu|m|ty|ti|d|dong|vnd)?(?:\s?(\d{1,3})(?!\d))?(?![a-z])/g;
  let best: { amount: number; match: string } | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const raw = m[1];
    const unit = m[2] || '';
    const tail = m[3];
    let n: number;
    if (/^\d{1,3}([.,]\d{3})+$/.test(raw)) n = Number(raw.replace(/[.,]/g, ''));
    else n = Number(raw.replace(',', '.'));
    if (!isFinite(n)) continue;
    let amount = n;
    if (['k', 'nghin', 'ngan', 'ng'].includes(unit)) amount = n * 1_000;
    else if (['tr', 'trieu', 'cu', 'm'].includes(unit)) {
      amount = n * 1_000_000;
      if (tail) amount += Number(tail.padEnd(3, '0')) * 1_000; // 1tr2 / 2 triệu 5 = 1.200.000 / 2.500.000
    } else if (['ty', 'ti'].includes(unit)) amount = n * 1_000_000_000;
    else if (!unit && n < 1000) amount = n * 1_000; // "phở 45" hiểu là 45k
    amount = Math.round(amount);
    if (amount > 0 && (!best || amount > 0)) {
      best = { amount, match: m[0] };
      break; // lấy số tiền đầu tiên trong đoạn
    }
  }
  return best;
};

const findCategory = (categories: Category[], type: 'INCOME' | 'EXPENSE', text: string) => {
  const f = ` ${fold(text)} `;
  const rules = type === 'INCOME' ? INCOME_RULES : EXPENSE_RULES;
  const pool = categories.filter((c) => c.type === type);
  for (const r of rules) {
    if (r.words.test(f)) {
      const hit = pool.find((c) => r.cat.some((k) => fold(c.name).includes(k)));
      if (hit) return hit;
    }
  }
  // tên hạng mục xuất hiện trực tiếp trong câu
  return pool.find((c) => fold(c.name).split(/[^a-z]+/).some((w) => w.length > 3 && f.includes(` ${w} `)));
};

const findAccount = (accounts: Account[], text: string) => {
  const f = fold(text);
  if (/\b(tien mat|cash|vi)\b/.test(f)) {
    const cash = accounts.find((a) => a.type === 'CASH');
    if (cash) return cash;
  }
  if (/\b(the|visa|credit|tin dung)\b/.test(f)) {
    const card = accounts.find((a) => a.type === 'CREDIT');
    if (card) return card;
  }
  const aliases: [RegExp, string][] = [
    [/\b(vcb|vietcombank)\b/, 'vietcombank'],
    [/\b(tcb|techcombank|techcom)\b/, 'techcombank'],
    [/\b(mb|mbbank)\b/, 'mb'],
    [/\b(acb)\b/, 'acb'],
    [/\b(bidv)\b/, 'bidv'],
    [/\b(vpb|vpbank)\b/, 'vpbank'],
    [/\b(tpb|tpbank)\b/, 'tpbank'],
    [/\b(momo)\b/, 'momo'],
    [/\b(zalopay|zalo)\b/, 'zalo'],
  ];
  for (const [re, key] of aliases) {
    if (re.test(f)) {
      const acc = accounts.find((a) => fold(`${a.name} ${a.institution || ''}`).includes(key));
      if (acc) return acc;
    }
  }
  return undefined;
};

const dateFromText = (text: string) => {
  const f = fold(text);
  const d = new Date();
  if (/\bhom kia\b/.test(f)) d.setDate(d.getDate() - 2);
  else if (/\bhom qua\b/.test(f)) d.setDate(d.getDate() - 1);
  return isoDate(d);
};

const cleanNote = (segment: string, amountMatch: string) => {
  let s = segment;
  // bỏ phần số tiền (so khớp không dấu nên cắt theo độ dài tương ứng)
  const idx = fold(s).indexOf(amountMatch.trim());
  if (idx >= 0) s = s.slice(0, idx) + s.slice(idx + amountMatch.trim().length);
  s = s
    .replace(/(^|\s)(bằng|qua|từ|trả bằng)?\s*(tiền mặt|thẻ tín dụng|thẻ|ví|vcb|tcb|mb|mbbank|vietcombank|techcombank|momo|zalopay|vpbank|bidv|acb|tpbank)(?=\s|$)/gi, ' ')
    .replace(/\b(tiền mặt|hôm qua|hôm kia|hôm nay)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,.\-–:]+|[\s,.\-–:]+$/g, '');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
};

/** Tài khoản mặc định: tài khoản dùng nhiều nhất cho loại giao dịch này */
const defaultAccount = (accounts: Account[], transactions: Transaction[], type: TransactionType) => {
  const count: Record<string, number> = {};
  transactions.filter((t) => t.type === type).forEach((t) => (count[t.accountId] = (count[t.accountId] || 0) + 1));
  const best = Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0];
  return best || accounts.find((a) => a.type === 'BANK')?.id || accounts[0]?.id || '';
};

/** Bộ phân tích tại máy: chạy ngay, không cần mạng */
export const parseLocal = (
  input: string,
  ctx: { categories: Category[]; accounts: Account[]; transactions: Transaction[] }
): DraftTx[] => {
  const now = new Date();
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const sharedAccount = findAccount(ctx.accounts, input);
  const segments = input
    .split(/[,;\n]+|\s+(?:và|va|rồi|roi|với|voi)\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const out: DraftTx[] = [];
  segments.forEach((seg, i) => {
    const amt = parseAmount(seg);
    if (!amt) return;
    const type: 'INCOME' | 'EXPENSE' = INCOME_HINT.test(` ${fold(seg)} `) ? 'INCOME' : 'EXPENSE';
    const cat = findCategory(ctx.categories, type, seg);
    const acc = findAccount(ctx.accounts, seg) || sharedAccount;
    out.push({
      key: `${Date.now()}-${i}`,
      type,
      amount: amt.amount,
      categoryId: cat?.id || ctx.categories.find((c) => c.type === type)?.id,
      accountId: acc?.id || defaultAccount(ctx.accounts, ctx.transactions, type),
      note: cleanNote(seg, amt.match) || cat?.name || '',
      date: dateFromText(seg),
      time,
    });
  });
  return out;
};

export const GEMINI_KEY_STORAGE = 'pf_gemini_key_v1';
export const GEMINI_MODEL = 'gemini-flash-latest';

/** Phân tích bằng Gemini (khi người dùng đã nhập API key của họ). Lỗi thì trả null để dùng bộ phân tích tại máy. */
export const parseWithGemini = async (
  input: string,
  apiKey: string,
  ctx: { categories: Category[]; accounts: Account[]; transactions: Transaction[] }
): Promise<DraftTx[] | null> => {
  try {
    const { GoogleGenAI, Type } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const today = isoDate(new Date());
    const prompt = `Bạn là trợ lý ghi chép chi tiêu tiếng Việt. Hôm nay là ${today}.
Tách câu của người dùng thành các giao dịch. Quy ước: "k"/"nghìn" = 1.000, "tr"/"triệu"/"củ" = 1.000.000, "1tr2" = 1.200.000, số trơn dưới 1000 hiểu là nghìn.
Chỉ dùng categoryId và accountId có trong danh sách. Nếu không nói tài khoản, để accountId rỗng.
Hạng mục: ${JSON.stringify(ctx.categories.map((c) => ({ id: c.id, name: c.name, type: c.type })))}
Tài khoản: ${JSON.stringify(ctx.accounts.map((a) => ({ id: a.id, name: a.name, type: a.type })))}
Câu: """${input}"""`;
    const res = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['INCOME', 'EXPENSE'] },
              amount: { type: Type.NUMBER },
              categoryId: { type: Type.STRING },
              accountId: { type: Type.STRING },
              note: { type: Type.STRING },
              date: { type: Type.STRING, description: 'YYYY-MM-DD' },
            },
            required: ['type', 'amount', 'note'],
          },
        },
      },
    });
    const items = JSON.parse(res.text || '[]') as Array<Partial<DraftTx>>;
    const now = new Date();
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const valid = items
      .filter((x) => typeof x.amount === 'number' && x.amount > 0)
      .map((x, i) => {
        const type = (x.type === 'INCOME' ? 'INCOME' : 'EXPENSE') as TransactionType;
        const cat = ctx.categories.find((c) => c.id === x.categoryId && c.type === type);
        const acc = ctx.accounts.find((a) => a.id === x.accountId) || findAccount(ctx.accounts, input);
        return {
          key: `${Date.now()}-g${i}`,
          type,
          amount: Math.round(x.amount as number),
          categoryId: cat?.id || findCategory(ctx.categories, type as 'INCOME' | 'EXPENSE', x.note || '')?.id || ctx.categories.find((c) => c.type === type)?.id,
          accountId: acc?.id || defaultAccount(ctx.accounts, ctx.transactions, type),
          note: x.note || '',
          date: /^\d{4}-\d{2}-\d{2}$/.test(x.date || '') ? (x.date as string) : today,
          time,
        };
      });
    return valid.length ? valid : null;
  } catch (e) {
    console.warn('Gemini parse failed, falling back to local parser', e);
    return null;
  }
};
