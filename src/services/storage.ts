// Local Storage & Seed Data Engine conforming to Apps Script 1.0.0
import { CauHoi, De, MaDe, GiaoDe, BaiLam, Lop, HocSinh, ServerConfig, ChiTietCauTraLoi } from '../types';

export const DEFAULT_SCORE = { TN: 0.25, DS: [0.1, 0.25, 0.5, 1], TLN: 0.5, TL: 1 };

export function newId(prefix: string): string {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function dsChar(c: any): string {
  const s = String(c || '').toUpperCase();
  if (s === 'Đ' || s === 'D' || s === 'T' || s === '1') return 'Đ';
  if (s === 'S' || s === 'F' || s === '0') return 'S';
  return '';
}

export function dsArr(v: any): string[] {
  if (Array.isArray(v)) return v.map(dsChar);
  return String(v == null ? '' : v)
    .toUpperCase()
    .replace(/[^ĐDTSF01]/g, '')
    .split('')
    .map(dsChar);
}

export function keyFor(q: CauHoi, p?: number[]): string {
  const L = 'ABCDEFGH';
  if (q.loai === 'TN') {
    const o = L.indexOf(String(q.dapAn || '').trim().toUpperCase().charAt(0));
    if (o < 0) return '';
    if (!p || !p.length) return L.charAt(o);
    return L.charAt(p.indexOf(o));
  }
  if (q.loai === 'DS') {
    const s = dsArr(q.dapAn);
    if (!p || !p.length) return s.join('');
    return p.map((j) => s[j] || '').join('');
  }
  return String(q.dapAn == null ? '' : q.dapAn);
}

export function normShort(s: any): string {
  return String(s == null ? '' : s).trim().toLowerCase().split(' ').join('').split(',').join('.');
}

export function parseNum(s: string): number {
  if (s === '') return NaN;
  if (s.indexOf('/') > 0) {
    const parts = s.split('/');
    if (parts.length === 2 && Number(parts[1]) !== 0) return Number(parts[0]) / Number(parts[1]);
    return NaN;
  }
  return Number(s);
}

export function matchShort(ans: any, key: any): boolean {
  const a = normShort(ans);
  if (a === '') return false;
  return String(key == null ? '' : key).split(';').some((k) => {
    const b = normShort(k);
    if (b === '') return false;
    const na = parseNum(a), nb = parseNum(b);
    if (!isNaN(na) && !isNaN(nb)) return Math.abs(na - nb) < 1e-9;
    return a === b;
  });
}

export function round2(x: number | null | undefined): number {
  return Math.round(Number(x || 0) * 100) / 100;
}

export function gradeSubmission(
  de: De | undefined,
  md: MaDe | undefined,
  qmap: Record<string, CauHoi>,
  traLoi: any[],
  oldChiTiet?: ChiTietCauTraLoi[]
) {
  const td = { ...DEFAULT_SCORE, ...(de?.thangDiem || {}) };
  const thangDS = Array.isArray(td.DS) && td.DS.length ? td.DS : DEFAULT_SCORE.DS;
  const items = md?.thuTu || [];
  let diem = 0;
  let tong = 0;
  let canChamTay = false;

  const chiTiet: ChiTietCauTraLoi[] = items.map((it, i) => {
    const q = qmap[it.q] || { loai: 'TN', dapAn: '', diem: 0 };
    const loai = q.loai || 'TN';
    const key = keyFor(q, it.p);
    const ans = traLoi[i] === undefined ? null : traLoi[i];
    let d: number | null = 0;
    let max = 0;
    let dung = false;
    let soYDung: number | null = null;

    if (loai === 'TN') {
      max = Number(q.diem ?? td.TN ?? 0.25);
      dung = !!ans && String(ans).trim().toUpperCase() === key;
      d = dung ? max : 0;
    } else if (loai === 'DS') {
      const a = dsArr(ans);
      const k = dsArr(key);
      soYDung = 0;
      k.forEach((v, j) => {
        if (a[j] && a[j] === v) soYDung!++;
      });
      const top = thangDS[thangDS.length - 1];
      max = Number(q.diem ?? top);
      const base = soYDung > 0 ? thangDS[Math.min(soYDung, thangDS.length) - 1] : 0;
      d = (base * max) / top;
      dung = k.length > 0 && soYDung === k.length;
    } else if (loai === 'TLN') {
      max = Number(q.diem ?? td.TLN ?? 0.5);
      dung = matchShort(ans, key);
      d = dung ? max : 0;
    } else {
      max = Number(q.diem ?? td.TL ?? 1.0);
      const prev = oldChiTiet && oldChiTiet[i];
      if (prev && prev.diem !== null && prev.diem !== undefined && prev.diem !== (' ' as any)) {
        d = Math.min(Number(prev.diem), max);
      } else {
        d = null;
        canChamTay = true;
      }
    }

    tong += max;
    if (d !== null) diem += d;

    return {
      stt: i + 1,
      q: it.q,
      loai,
      traLoi: ans,
      dapAn: key,
      dung,
      soYDung,
      diem: d === null ? null : round2(d),
      diemToiDa: round2(max),
      loiGiai: q.loiGiai
    };
  });

  return {
    chiTiet,
    diem: round2(diem),
    tongDiem: round2(tong),
    canChamTay
  };
}

// Preloaded realistic seed data conforming to Vietnam 2025 High School Graduation Exam standards
const INITIAL_CLASSES: Lop[] = [
  {
    id: 'LO_12A1',
    tenLop: '12A1',
    khoi: 12,
    namHoc: '2025 - 2026',
    ghiChu: 'Lớp chuyên Toán - Tự nhiên',
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now() - 30 * 86400000
  },
  {
    id: 'LO_12A2',
    tenLop: '12A2',
    khoi: 12,
    namHoc: '2025 - 2026',
    ghiChu: 'Lớp Tự nhiên ban A',
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now() - 30 * 86400000
  }
];

const INITIAL_STUDENTS: HocSinh[] = [
  {
    id: 'HS_001',
    lopId: 'LO_12A1',
    maHS: 'HS1201',
    hoTen: 'Nguyễn Văn An',
    ngaySinh: '15/03/2008',
    ghiChu: 'Học sinh giỏi Toán',
    createdAt: Date.now() - 25 * 86400000,
    updatedAt: Date.now() - 25 * 86400000
  },
  {
    id: 'HS_002',
    lopId: 'LO_12A1',
    maHS: 'HS1202',
    hoTen: 'Trần Thị Mai',
    ngaySinh: '22/07/2008',
    ghiChu: 'Lớp trưởng 12A1',
    createdAt: Date.now() - 25 * 86400000,
    updatedAt: Date.now() - 25 * 86400000
  },
  {
    id: 'HS_003',
    lopId: 'LO_12A1',
    maHS: 'HS1203',
    hoTen: 'Lê Hoàng Nam',
    ngaySinh: '10/11/2008',
    ghiChu: 'Học sinh 12A1',
    createdAt: Date.now() - 25 * 86400000,
    updatedAt: Date.now() - 25 * 86400000
  },
  {
    id: 'HS_004',
    lopId: 'LO_12A2',
    maHS: 'HS1204',
    hoTen: 'Phạm Quỳnh Chi',
    ngaySinh: '05/01/2008',
    ghiChu: 'Học sinh 12A2',
    createdAt: Date.now() - 25 * 86400000,
    updatedAt: Date.now() - 25 * 86400000
  }
];

const INITIAL_QUESTIONS: CauHoi[] = [
  // PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN (TN)
  {
    id: 'CH_TN_001',
    loai: 'TN',
    monHoc: 'Toán',
    khoi: 12,
    chuDe: 'Khảo sát hàm số',
    bai: 'Tính đơn điệu của hàm số',
    mucDo: 'NB',
    noiDung: 'Cho hàm số y = f(x) có bảng biến thiên với f\'(x) > 0 trên khoảng (-∞; 1) và (3; +∞), f\'(x) < 0 trên khoảng (1; 3). Hàm số đã cho nghịch biến trên khoảng nào dưới đây?',
    phuongAn: [
      '(-∞; 1)',
      '(1; 3)',
      '(3; +∞)',
      '(1; +∞)'
    ],
    dapAn: 'B',
    loiGiai: 'Dựa vào bảng biến thiên, f\'(x) < 0 trên khoảng (1; 3) nên hàm số nghịch biến trên (1; 3).',
    diem: 0.25,
    tags: 'Đơn điệu, Khảo sát hàm số, Nhận biết',
    createdAt: Date.now() - 20 * 86400000,
    updatedAt: Date.now() - 20 * 86400000
  },
  {
    id: 'CH_TN_002',
    loai: 'TN',
    monHoc: 'Toán',
    khoi: 12,
    chuDe: 'Nguyên hàm - Tích phân',
    bai: 'Tích phân cơ bản',
    mucDo: 'TH',
    noiDung: 'Tích phân ∫ từ 0 đến 1 của (2x + 1) dx bằng bao nhiêu?',
    phuongAn: [
      '1',
      '2',
      '3',
      '4'
    ],
    dapAn: 'B',
    loiGiai: '∫(2x + 1)dx = [x^2 + x] từ 0 đến 1 = (1 + 1) - (0 + 0) = 2.',
    diem: 0.25,
    tags: 'Tích phân, Thông hiểu',
    createdAt: Date.now() - 20 * 86400000,
    updatedAt: Date.now() - 20 * 86400000
  },
  {
    id: 'CH_TN_003',
    loai: 'TN',
    monHoc: 'Toán',
    khoi: 12,
    chuDe: 'Hình học Oxyz',
    bai: 'Tọa độ vectơ trong không gian',
    mucDo: 'NB',
    noiDung: 'Trong không gian Oxyz, cho vectơ a = (1; -2; 3) và b = (2; 0; -1). Tọa độ của vectơ a + b là:',
    phuongAn: [
      '(3; -2; 2)',
      '(3; -2; 4)',
      '(-1; -2; 4)',
      '(2; 0; -3)'
    ],
    dapAn: 'A',
    loiGiai: 'a + b = (1 + 2; -2 + 0; 3 - 1) = (3; -2; 2).',
    diem: 0.25,
    tags: 'Oxyz, Tọa độ, Nhận biết',
    createdAt: Date.now() - 20 * 86400000,
    updatedAt: Date.now() - 20 * 86400000
  },
  {
    id: 'CH_TN_004',
    loai: 'TN',
    monHoc: 'Toán',
    khoi: 12,
    chuDe: 'Xác suất thống kê',
    bai: 'Xác suất có điều kiện',
    mucDo: 'VD',
    noiDung: 'Gieo một con xúc xắc cân đối và đồng chất 2 lần liên tiếp. Biết rằng tổng số chấm trong 2 lần gieo bằng 7. Tính xác suất để lần gieo đầu tiên xuất hiện mặt 3 chấm.',
    phuongAn: [
      '1/6',
      '1/36',
      '1/3',
      '1/12'
    ],
    dapAn: 'A',
    loiGiai: 'Không gian các cặp có tổng bằng 7 là {(1,6), (2,5), (3,4), (4,3), (5,2), (6,1)} gồm 6 kết quả. Biến cố lần đầu ra 3 chấm có duy nhất (3,4). Xác suất là 1/6.',
    diem: 0.25,
    tags: 'Xác suất có điều kiện, Vận dụng',
    createdAt: Date.now() - 20 * 86400000,
    updatedAt: Date.now() - 20 * 86400000
  },

  // PHẦN II: TRẮC NGHIỆM ĐÚNG/SAI (DS) - Chuẩn format 2025
  {
    id: 'CH_DS_001',
    loai: 'DS',
    monHoc: 'Toán',
    khoi: 12,
    chuDe: 'Khảo sát hàm số',
    bai: 'Cực trị và tiệm cận',
    mucDo: 'VD',
    noiDung: 'Cho hàm số f(x) = (x^2 - 3x + 2) / (x - 1). Xét tính đúng/sai của các mệnh đề sau:',
    phuongAn: [
      'a) Tập xác định của hàm số là D = ℝ \\ {1}.',
      'b) Đồ thị hàm số có đường tiệm cận đứng là x = 1.',
      'c) Đạo hàm f\'(x) = 1 với mọi x ≠ 1.',
      'd) Đồ thị hàm số đi qua điểm M(3; 2).'
    ],
    dapAn: 'ĐSĐS', // a: Đúng, b: Sai (bị triệt tiêu (x-1)), c: Đúng (f(x) = x - 2 khi x != 1), d: Sai (f(3) = 1)
    loiGiai: 'Ta có f(x) = (x - 1)(x - 2)/(x - 1) = x - 2 với x ≠ 1.\na) Đúng vì mẫu số khác 0 khi x ≠ 1.\nb) Sai vì lim_{x->1} f(x) = -1 hữu hạn nên không có tiệm cận đứng.\nc) Đúng vì f\'(x) = (x - 2)\' = 1.\nd) Sai vì f(3) = 3 - 2 = 1 ≠ 2.',
    diem: 1.0,
    tags: 'Đúng sai, Tiệm cận, Đồ thị, Format 2025',
    createdAt: Date.now() - 19 * 86400000,
    updatedAt: Date.now() - 19 * 86400000
  },
  {
    id: 'CH_DS_002',
    loai: 'DS',
    monHoc: 'Toán',
    khoi: 12,
    chuDe: 'Vectơ và Hệ tọa độ trong không gian',
    bai: 'Tích có hướng và ứng dụng',
    mucDo: 'TH',
    noiDung: 'Trong không gian Oxyz, cho ba điểm A(1; 0; 0), B(0; 2; 0), C(0; 0; 3). Xét tính đúng/sai của các mệnh đề:',
    phuongAn: [
      'a) Phương trình mặt phẳng (ABC) là x/1 + y/2 + z/3 = 1.',
      'b) Vectơ n = (6; 3; 2) là một vectơ pháp tuyến của mặt phẳng (ABC).',
      'c) Thể tích khối tứ diện OABC bằng 2.',
      'd) Trọng tâm tam giác ABC có tọa độ là (1/3; 2/3; 1).'
    ],
    dapAn: 'ĐĐSĐ', // a: Đúng, b: Đúng (quy đồng 6x+3y+2z-6=0), c: Sai (V = 1/6 * 1*2*3 = 1), d: Đúng ((1+0+0)/3, (0+2+0)/3, (0+0+3)/3)
    loiGiai: 'a) Đúng: phương trình mặt phẳng theo đoạn chắn.\nb) Đúng: 6x + 3y + 2z - 6 = 0 có VTPT n = (6; 3; 2).\nc) Sai: V = 1/6 * OA * OB * OC = 1/6 * 1 * 2 * 3 = 1.\nd) Đúng: G(1/3; 2/3; 1).',
    diem: 1.0,
    tags: 'Oxyz, Khối tứ diện, Đúng sai',
    createdAt: Date.now() - 19 * 86400000,
    updatedAt: Date.now() - 19 * 86400000
  },

  // PHẦN III: TRẮC NGHIỆM TRẢ LỜI NGẮN (TLN) - Điền số / phân số
  {
    id: 'CH_TLN_001',
    loai: 'TLN',
    monHoc: 'Toán',
    khoi: 12,
    chuDe: 'Ứng dụng đạo hàm',
    bai: 'Giá trị lớn nhất, nhỏ nhất thực tế',
    mucDo: 'VD',
    noiDung: 'Một bác nông dân muốn làm một hàng rào hình chữ nhật có chu vi bằng 40 m để quây chuồng nuôi gia súc. Diện tích lớn nhất của chuồng gia súc đó bằng bao nhiêu mét vuông (m²)?',
    phuongAn: [],
    dapAn: '100',
    loiGiai: 'Nửa chu vi x + y = 20 => y = 20 - x. Diện tích S = x(20 - x) = -x^2 + 20x. S đạt GTLN tại x = 10, S_max = 100 m².',
    diem: 0.5,
    tags: 'GTLN, Thực tế, Trả lời ngắn',
    createdAt: Date.now() - 18 * 86400000,
    updatedAt: Date.now() - 18 * 86400000
  },
  {
    id: 'CH_TLN_002',
    loai: 'TLN',
    monHoc: 'Toán',
    khoi: 12,
    chuDe: 'Hình học Oxyz',
    bai: 'Khoảng cách từ điểm đến mặt phẳng',
    mucDo: 'TH',
    noiDung: 'Trong không gian Oxyz, khoảng cách từ điểm M(1; 2; -1) đến mặt phẳng (P): 2x - 2y + z + 5 = 0 bằng bao nhiêu?',
    phuongAn: [],
    dapAn: '2/3;0.67;0,67',
    loiGiai: 'd(M, P) = |2(1) - 2(2) + 1(-1) + 5| / √(2^2 + (-2)^2 + 1^2) = |2 - 4 - 1 + 5| / 3 = 2/3.',
    diem: 0.5,
    tags: 'Khoảng cách Oxyz, Trả lời ngắn',
    createdAt: Date.now() - 18 * 86400000,
    updatedAt: Date.now() - 18 * 86400000
  },
  {
    id: 'CH_TLN_003',
    loai: 'TLN',
    monHoc: 'Toán',
    khoi: 12,
    chuDe: 'Tích phân và Diện tích hình phẳng',
    bai: 'Ứng dụng hình học của tích phân',
    mucDo: 'VDC',
    noiDung: 'Cho parabol (P): y = x^2 và đường thẳng d: y = 2x. Diện tích hình phẳng giới hạn bởi (P) và d bằng a/b (với a/b là phân số tối giản). Tính giá trị của biểu thức T = a + b.',
    phuongAn: [],
    dapAn: '7',
    loiGiai: 'Phương trình hoành độ giao điểm x^2 = 2x <=> x = 0 hoặc x = 2.\nDiện tích S = ∫ từ 0 đến 2 của (2x - x^2)dx = [x^2 - x^3/3] từ 0 đến 2 = (4 - 8/3) = 4/3.\nDo đó a = 4, b = 3. T = 4 + 3 = 7.',
    diem: 0.5,
    tags: 'Diện tích tích phân, Vận dụng cao',
    createdAt: Date.now() - 18 * 86400000,
    updatedAt: Date.now() - 18 * 86400000
  },

  // PHẦN IV: TỰ LUẬN (TL) - Giáo viên chấm tay
  {
    id: 'CH_TL_001',
    loai: 'TL',
    monHoc: 'Toán',
    khoi: 12,
    chuDe: 'Hình không gian',
    bai: 'Góc giữa đường thẳng và mặt phẳng',
    mucDo: 'VD',
    noiDung: 'Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh a, cạnh bên SA vuông góc với đáy và SA = a√2. Tính côsin góc giữa đường thẳng SC và mặt phẳng (SAB). Trình bày chi tiết các bước giải.',
    phuongAn: [],
    dapAn: 'Gợi ý: CB vuông góc (SAB) tại B => SB là hình chiếu của SC trên (SAB). Góc là góc CSB. SB = a√3, SC = 2a, BC = a => cos(CSB) = SB/SC = √3/2.',
    loiGiai: 'Bước 1: Chứng minh CB ⊥ (SAB) vì CB ⊥ AB và CB ⊥ SA.\nBước 2: Hình chiếu của SC lên (SAB) là SB => góc giữa SC và (SAB) là góc CSB.\nBước 3: Tam giác SBC vuông tại B, SB = √(SA^2 + AB^2) = a√3, SC = √(SA^2 + AC^2) = 2a.\nBước 4: cos(CSB) = SB / SC = √3 / 2.',
    diem: 1.0,
    tags: 'Tự luận, Hình chóp, Góc',
    createdAt: Date.now() - 17 * 86400000,
    updatedAt: Date.now() - 17 * 86400000
  }
];

const INITIAL_EXAMS: De[] = [
  {
    id: 'DE_THPT2025_TOAN',
    tenDe: 'Đề khảo sát Chất lượng Toán 12 - Chuẩn cấu trúc 2025',
    monHoc: 'Toán',
    khoi: 12,
    thoiGian: 45,
    moTa: 'Đề thi trắc nghiệm gồm 4 phần: Trắc nghiệm 4 lựa chọn, Trắc nghiệm Đúng/Sai, Trả lời ngắn và Tự luận tổng hợp.',
    cauTruc: {
      phanI: 4,
      phanII: 2,
      phanIII: 3,
      phanIV: 1
    },
    cauHoiIds: [
      'CH_TN_001',
      'CH_TN_002',
      'CH_TN_003',
      'CH_TN_004',
      'CH_DS_001',
      'CH_DS_002',
      'CH_TLN_001',
      'CH_TLN_002',
      'CH_TLN_003',
      'CH_TL_001'
    ],
    thangDiem: {
      TN: 0.25,
      DS: [0.1, 0.25, 0.5, 1.0],
      TLN: 0.5,
      TL: 1.0
    },
    trangThai: 'chinh_thuc',
    createdAt: Date.now() - 15 * 86400000,
    updatedAt: Date.now() - 15 * 86400000
  }
];

const INITIAL_MADES: MaDe[] = [
  {
    id: 'MD_101',
    deId: 'DE_THPT2025_TOAN',
    maDe: '101',
    thuTu: [
      { q: 'CH_TN_001', p: [0, 1, 2, 3], phan: 'Phần I: Trắc nghiệm nhiều lựa chọn' },
      { q: 'CH_TN_002', p: [0, 1, 2, 3], phan: 'Phần I: Trắc nghiệm nhiều lựa chọn' },
      { q: 'CH_TN_003', p: [0, 1, 2, 3], phan: 'Phần I: Trắc nghiệm nhiều lựa chọn' },
      { q: 'CH_TN_004', p: [0, 1, 2, 3], phan: 'Phần I: Trắc nghiệm nhiều lựa chọn' },
      { q: 'CH_DS_001', p: [0, 1, 2, 3], phan: 'Phần II: Trắc nghiệm Đúng / Sai' },
      { q: 'CH_DS_002', p: [0, 1, 2, 3], phan: 'Phần II: Trắc nghiệm Đúng / Sai' },
      { q: 'CH_TLN_001', phan: 'Phần III: Trắc nghiệm Trả lời ngắn' },
      { q: 'CH_TLN_002', phan: 'Phần III: Trắc nghiệm Trả lời ngắn' },
      { q: 'CH_TLN_003', phan: 'Phần III: Trắc nghiệm Trả lời ngắn' },
      { q: 'CH_TL_001', phan: 'Phần IV: Câu hỏi Tự luận' }
    ],
    createdAt: Date.now() - 15 * 86400000,
    updatedAt: Date.now() - 15 * 86400000
  },
  {
    id: 'MD_102',
    deId: 'DE_THPT2025_TOAN',
    maDe: '102',
    thuTu: [
      { q: 'CH_TN_003', p: [1, 0, 2, 3], phan: 'Phần I: Trắc nghiệm nhiều lựa chọn' },
      { q: 'CH_TN_001', p: [2, 1, 0, 3], phan: 'Phần I: Trắc nghiệm nhiều lựa chọn' },
      { q: 'CH_TN_004', p: [3, 0, 1, 2], phan: 'Phần I: Trắc nghiệm nhiều lựa chọn' },
      { q: 'CH_TN_002', p: [0, 2, 1, 3], phan: 'Phần I: Trắc nghiệm nhiều lựa chọn' },
      { q: 'CH_DS_002', p: [0, 1, 2, 3], phan: 'Phần II: Trắc nghiệm Đúng / Sai' },
      { q: 'CH_DS_001', p: [0, 1, 2, 3], phan: 'Phần II: Trắc nghiệm Đúng / Sai' },
      { q: 'CH_TLN_002', phan: 'Phần III: Trắc nghiệm Trả lời ngắn' },
      { q: 'CH_TLN_001', phan: 'Phần III: Trắc nghiệm Trả lời ngắn' },
      { q: 'CH_TLN_003', phan: 'Phần III: Trắc nghiệm Trả lời ngắn' },
      { q: 'CH_TL_001', phan: 'Phần IV: Câu hỏi Tự luận' }
    ],
    createdAt: Date.now() - 15 * 86400000,
    updatedAt: Date.now() - 15 * 86400000
  }
];

const INITIAL_ASSIGNMENTS: GiaoDe[] = [
  {
    id: 'GD_TOAN12_ACTIVE',
    deId: 'DE_THPT2025_TOAN',
    tieuDe: 'Kiểm tra Giữa kỳ I - Toán 12 (Chuẩn 2025)',
    lopIds: ['LO_12A1', 'LO_12A2'],
    maTruyCap: 'TOAN12', // 6 ký tự dễ nhớ
    matKhau: '',
    batDau: Date.now() - 2 * 3600000,
    ketThuc: Date.now() + 7 * 86400000,
    thoiLuong: 45,
    soLanLam: 1,
    cheDoMaDe: 'ngau_nhien',
    hienDiem: true,
    hienDapAn: true,
    yeuCauDanhSach: false,
    chongGianLan: true,
    trangThai: 'mo',
    createdAt: Date.now() - 2 * 86400000,
    updatedAt: Date.now() - 2 * 86400000
  }
];

const INITIAL_SUBMISSIONS: BaiLam[] = [
  {
    id: 'BL_SAMPLE_001',
    giaoDeId: 'GD_TOAN12_ACTIVE',
    deId: 'DE_THPT2025_TOAN',
    maDeId: 'MD_101',
    maDe: '101',
    hoTen: 'Nguyễn Văn An',
    lop: '12A1',
    maHS: 'HS1201',
    batDau: Date.now() - 60 * 60000,
    nopLuc: Date.now() - 18 * 60000,
    thoiGianLam: 42 * 60,
    traLoi: ['B', 'B', 'A', 'A', 'ĐSĐS', 'ĐĐSĐ', '100', '2/3', '7', 'Em đã làm các bước chi tiết ra giấy nháp: CB vuông góc (SAB) nên góc là góc CSB, cos(CSB) = can(3)/2.'],
    chiTiet: [
      { stt: 1, q: 'CH_TN_001', loai: 'TN', traLoi: 'B', dapAn: 'B', dung: true, diem: 0.25, diemToiDa: 0.25 },
      { stt: 2, q: 'CH_TN_002', loai: 'TN', traLoi: 'B', dapAn: 'B', dung: true, diem: 0.25, diemToiDa: 0.25 },
      { stt: 3, q: 'CH_TN_003', loai: 'TN', traLoi: 'A', dapAn: 'A', dung: true, diem: 0.25, diemToiDa: 0.25 },
      { stt: 4, q: 'CH_TN_004', loai: 'TN', traLoi: 'A', dapAn: 'A', dung: true, diem: 0.25, diemToiDa: 0.25 },
      { stt: 5, q: 'CH_DS_001', loai: 'DS', traLoi: 'ĐSĐS', dapAn: 'ĐSĐS', dung: true, soYDung: 4, diem: 1.0, diemToiDa: 1.0 },
      { stt: 6, q: 'CH_DS_002', loai: 'DS', traLoi: 'ĐĐSĐ', dapAn: 'ĐĐSĐ', dung: true, soYDung: 4, diem: 1.0, diemToiDa: 1.0 },
      { stt: 7, q: 'CH_TLN_001', loai: 'TLN', traLoi: '100', dapAn: '100', dung: true, diem: 0.5, diemToiDa: 0.5 },
      { stt: 8, q: 'CH_TLN_002', loai: 'TLN', traLoi: '2/3', dapAn: '2/3;0.67;0,67', dung: true, diem: 0.5, diemToiDa: 0.5 },
      { stt: 9, q: 'CH_TLN_003', loai: 'TLN', traLoi: '7', dapAn: '7', dung: true, diem: 0.5, diemToiDa: 0.5 },
      { stt: 10, q: 'CH_TL_001', loai: 'TL', traLoi: 'Em đã làm các bước chi tiết...', dapAn: 'Gợi ý: ...', dung: true, diem: 1.0, diemToiDa: 1.0 }
    ],
    diem: 5.5,
    tongDiem: 5.5,
    soLanRoiTab: 0,
    trangThai: 'da_nop',
    thietBi: 'Chrome / Windows',
    createdAt: Date.now() - 60 * 60000,
    updatedAt: Date.now() - 18 * 60000
  },
  {
    id: 'BL_SAMPLE_002',
    giaoDeId: 'GD_TOAN12_ACTIVE',
    deId: 'DE_THPT2025_TOAN',
    maDeId: 'MD_102',
    maDe: '102',
    hoTen: 'Trần Thị Mai',
    lop: '12A1',
    maHS: 'HS1202',
    batDau: Date.now() - 40 * 60000,
    nopLuc: Date.now() - 5 * 60000,
    thoiGianLam: 35 * 60,
    traLoi: ['A', 'B', 'B', 'A', 'ĐSĐĐ', 'ĐĐSS', '100', '0.67', '6', 'Hình chiếu SB, góc CSB = 30 độ.'],
    chiTiet: [
      { stt: 1, q: 'CH_TN_003', loai: 'TN', traLoi: 'A', dapAn: 'B', dung: false, diem: 0, diemToiDa: 0.25 },
      { stt: 2, q: 'CH_TN_001', loai: 'TN', traLoi: 'B', dapAn: 'B', dung: true, diem: 0.25, diemToiDa: 0.25 },
      { stt: 3, q: 'CH_TN_004', loai: 'TN', traLoi: 'B', dapAn: 'A', dung: false, diem: 0, diemToiDa: 0.25 },
      { stt: 4, q: 'CH_TN_002', loai: 'TN', traLoi: 'A', dapAn: 'C', dung: false, diem: 0, diemToiDa: 0.25 },
      { stt: 5, q: 'CH_DS_002', loai: 'DS', traLoi: 'ĐSĐĐ', dapAn: 'ĐĐSĐ', dung: false, soYDung: 2, diem: 0.25, diemToiDa: 1.0 },
      { stt: 6, q: 'CH_DS_001', loai: 'DS', traLoi: 'ĐĐSS', dapAn: 'ĐSĐS', dung: false, soYDung: 2, diem: 0.25, diemToiDa: 1.0 },
      { stt: 7, q: 'CH_TLN_002', loai: 'TLN', traLoi: '100', dapAn: '2/3;0.67;0,67', dung: false, diem: 0, diemToiDa: 0.5 },
      { stt: 8, q: 'CH_TLN_001', loai: 'TLN', traLoi: '0.67', dapAn: '100', dung: false, diem: 0, diemToiDa: 0.5 },
      { stt: 9, q: 'CH_TLN_003', loai: 'TLN', traLoi: '6', dapAn: '7', dung: false, diem: 0, diemToiDa: 0.5 },
      { stt: 10, q: 'CH_TL_001', loai: 'TL', traLoi: 'Hình chiếu SB...', dapAn: 'Gợi ý: ...', dung: false, diem: null, diemToiDa: 1.0 }
    ],
    diem: 0.75,
    tongDiem: 5.5,
    soLanRoiTab: 2,
    trangThai: 'cho_cham',
    thietBi: 'Safari / iPad',
    createdAt: Date.now() - 40 * 60000,
    updatedAt: Date.now() - 5 * 60000
  }
];

class StorageManager {
  private configKey = 'de_online_config';
  private prefix = 'de_online_table_';

  getConfig(): ServerConfig {
    const raw = localStorage.getItem(this.configKey);
    if (!raw) {
      return {
        webAppUrl: '',
        teacherKey: '',
        isOnlineConnected: false
      };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return { webAppUrl: '', teacherKey: '', isOnlineConnected: false };
    }
  }

  saveConfig(cfg: ServerConfig) {
    localStorage.setItem(this.configKey, JSON.stringify(cfg));
  }

  initDataIfEmpty() {
    if (!localStorage.getItem(this.prefix + 'CauHoi')) {
      this.setTable('CauHoi', INITIAL_QUESTIONS);
    }
    if (!localStorage.getItem(this.prefix + 'De')) {
      this.setTable('De', INITIAL_EXAMS);
    }
    if (!localStorage.getItem(this.prefix + 'MaDe')) {
      this.setTable('MaDe', INITIAL_MADES);
    }
    if (!localStorage.getItem(this.prefix + 'GiaoDe')) {
      this.setTable('GiaoDe', INITIAL_ASSIGNMENTS);
    }
    if (!localStorage.getItem(this.prefix + 'BaiLam')) {
      this.setTable('BaiLam', INITIAL_SUBMISSIONS);
    }
    if (!localStorage.getItem(this.prefix + 'Lop')) {
      this.setTable('Lop', INITIAL_CLASSES);
    }
    if (!localStorage.getItem(this.prefix + 'HocSinh')) {
      this.setTable('HocSinh', INITIAL_STUDENTS);
    }
  }

  getTable<T>(table: string): T[] {
    const raw = localStorage.getItem(this.prefix + table);
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter((x: any) => !x.deleted) : [];
    } catch {
      return [];
    }
  }

  getAllRows<T>(table: string): T[] {
    const raw = localStorage.getItem(this.prefix + table);
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  setTable<T>(table: string, rows: T[]) {
    localStorage.setItem(this.prefix + table, JSON.stringify(rows));
  }

  upsertRows<T extends { id?: string; updatedAt?: number; createdAt?: number; deleted?: boolean }>(
    table: string,
    items: T[]
  ): T[] {
    const current = this.getAllRows<T>(table);
    const idMap = new Map<string, number>();
    current.forEach((row, i) => {
      if (row.id) idMap.set(row.id, i);
    });

    const now = Date.now();
    const saved: T[] = [];

    items.forEach((it) => {
      const copy = { ...it };
      if (!copy.id) {
        copy.id = newId(table.slice(0, 2).toUpperCase());
      }
      copy.updatedAt = now;
      if (!copy.createdAt) copy.createdAt = now;
      if (copy.deleted === undefined) copy.deleted = false;

      const idx = idMap.get(copy.id);
      if (idx !== undefined) {
        current[idx] = { ...current[idx], ...copy };
        saved.push(current[idx]);
      } else {
        current.push(copy);
        idMap.set(copy.id, current.length - 1);
        saved.push(copy);
      }
    });

    this.setTable(table, current);
    return saved;
  }

  softDelete(table: string, ids: string[]): string[] {
    const current = this.getAllRows<any>(table);
    const idSet = new Set(ids);
    const now = Date.now();
    current.forEach((r) => {
      if (idSet.has(r.id)) {
        r.deleted = true;
        r.updatedAt = now;
      }
    });
    this.setTable(table, current);
    return ids;
  }

  purgeDeleted(): Record<string, number> {
    const tables = ['CauHoi', 'De', 'MaDe', 'GiaoDe', 'BaiLam', 'Lop', 'HocSinh'];
    const result: Record<string, number> = {};
    tables.forEach((tbl) => {
      const all = this.getAllRows<any>(tbl);
      const keep = all.filter((r) => !r.deleted);
      result[tbl] = all.length - keep.length;
      this.setTable(tbl, keep);
    });
    return result;
  }

  resetToDefault() {
    this.setTable('CauHoi', INITIAL_QUESTIONS);
    this.setTable('De', INITIAL_EXAMS);
    this.setTable('MaDe', INITIAL_MADES);
    this.setTable('GiaoDe', INITIAL_ASSIGNMENTS);
    this.setTable('BaiLam', INITIAL_SUBMISSIONS);
    this.setTable('Lop', INITIAL_CLASSES);
    this.setTable('HocSinh', INITIAL_STUDENTS);
  }
}

export const storage = new StorageManager();
storage.initDataIfEmpty();
