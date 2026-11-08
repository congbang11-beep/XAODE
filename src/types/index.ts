// Types for Đề Online System - Aligned with Google Apps Script Schema 1.0.0

export type QuestionType = 'TN' | 'DS' | 'TLN' | 'TL';
export type CognitiveLevel = 'NB' | 'TH' | 'VD' | 'VDC'; // Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao

export interface CauHoi {
  id: string;
  loai: QuestionType; // TN: Trắc nghiệm 4 lựa chọn, DS: Đúng/Sai 4 ý, TLN: Trả lời ngắn, TL: Tự luận
  monHoc: string;
  khoi: number;
  chuDe: string;
  bai?: string;
  mucDo: CognitiveLevel;
  noiDung: string;
  hinhAnh?: string;
  phuongAn?: string[]; // TN: 4 options; DS: 4 statements a, b, c, d
  dapAn: string; // TN: 'A'|'B'|'C'|'D'; DS: 'ĐSĐS' or array; TLN: '15' or '2.5;5/2'; TL: sample solution
  loiGiai?: string;
  diem?: number;
  khongTron?: boolean;
  tags?: string;
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
  _base?: number;
}

export interface ThangDiem {
  TN?: number; // Mặc định 0.25
  DS?: number[]; // Mặc định [0.1, 0.25, 0.5, 1.0] theo chuẩn Bộ GD&ĐT 2025
  TLN?: number; // Mặc định 0.5
  TL?: number; // Mặc định 1.0
}

export interface De {
  id: string;
  tenDe: string;
  monHoc: string;
  khoi: number;
  thoiGian: number; // Thời gian làm bài tính bằng phút
  moTa?: string;
  cauTruc?: {
    phanI?: number; // Số câu TN
    phanII?: number; // Số câu DS
    phanIII?: number; // Số câu TLN
    phanIV?: number; // Số câu TL
  };
  cauHoiIds: string[];
  thangDiem?: ThangDiem;
  trangThai?: 'so_thao' | 'chinh_thuc' | 'khoa';
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
  _base?: number;
}

export interface MaDeItem {
  q: string; // ID câu hỏi
  p?: number[]; // Hoán vị các phương án (nếu là TN hoặc DS)
  phan?: string; // Tên phần (Phần I, Phần II, ...)
}

export interface MaDe {
  id: string;
  deId: string;
  maDe: string; // e.g., '101', '102'
  thuTu: MaDeItem[];
  dapAn?: Record<number, string>; // Bảng đáp án tương ứng cho mã đề
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
  _base?: number;
}

export interface GiaoDe {
  id: string;
  deId: string;
  tieuDe: string;
  lopIds?: string[]; // Lớp được phép làm (rỗng = mọi học sinh)
  maTruyCap: string; // Mã 6 ký tự viết hoa (e.g. TOAN12)
  matKhau?: string;
  batDau?: number; // Timestamp
  ketThuc?: number; // Timestamp
  thoiLuong?: number; // Số phút làm bài
  soLanLam?: number; // 0: không giới hạn, hoặc số lần
  cheDoMaDe?: 'ngau_nhien' | 'lan_luot' | string; // 'co_dinh:101'
  hienDiem?: boolean;
  hienDapAn?: boolean;
  yeuCauDanhSach?: boolean;
  chongGianLan?: boolean;
  trangThai: 'mo' | 'dong' | 'nhap';
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
  _base?: number;
}

export interface ChiTietCauTraLoi {
  stt: number;
  q: string;
  loai: QuestionType;
  traLoi: any;
  dapAn: any;
  dung: boolean;
  soYDung?: number | null;
  diem: number | null;
  diemToiDa: number;
  loiGiai?: string;
}

export interface BaiLam {
  id: string;
  giaoDeId: string;
  deId: string;
  maDeId: string;
  maDe: string;
  hoTen: string;
  lop: string;
  maHS?: string;
  batDau: number;
  nopLuc?: number;
  thoiGianLam?: number; // Tính bằng giây
  traLoi: any[];
  chiTiet?: ChiTietCauTraLoi[];
  diem?: number;
  tongDiem?: number;
  soLanRoiTab?: number;
  trangThai: 'dang_lam' | 'da_nop' | 'cho_cham';
  thietBi?: string;
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
  _base?: number;
}

export interface Lop {
  id: string;
  tenLop: string;
  khoi: number;
  namHoc?: string;
  ghiChu?: string;
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
  _base?: number;
}

export interface HocSinh {
  id: string;
  lopId: string;
  maHS: string;
  hoTen: string;
  ngaySinh?: string;
  ghiChu?: string;
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
  _base?: number;
}

export interface ServerConfig {
  webAppUrl: string;
  teacherKey: string;
  isOnlineConnected: boolean;
  lastSyncTime?: number;
  spreadsheetInfo?: {
    spreadsheetId?: string;
    spreadsheetName?: string;
    spreadsheetUrl?: string;
  };
}

// Student API Payloads
export interface ThongTinGiaoDeResponse {
  tieuDe: string;
  tenDe: string;
  monHoc: string;
  thoiLuong: number | null;
  batDau: number | null;
  ketThuc: number | null;
  soCau: number | null;
  canMatKhau: boolean;
  yeuCauDanhSach: boolean;
  soLanLam: number;
  chongGianLan: boolean;
  lop: Array<{ id: string; tenLop: string }>;
  tinhTrang: 'mo' | 'dong' | 'chua_mo' | 'het_han';
  serverTime: number;
}

export interface StudentCauHoi {
  stt: number;
  phan?: string;
  loai: QuestionType;
  noiDung: string;
  hinhAnh?: string;
  phuongAn: string[];
}

export interface LayDeThiResponse {
  baiLamId: string;
  tieuDe: string;
  tenDe: string;
  monHoc: string;
  maDe: string;
  hoTen: string;
  lop: string;
  maHS?: string;
  batDau: number;
  hanNop: number | null;
  serverTime: number;
  traLoi: any[];
  soLanRoiTab: number;
  chongGianLan: boolean;
  tiepTuc: boolean;
  cauHoi: StudentCauHoi[];
}

export interface NopBaiResponse {
  daNop: boolean;
  nopTre: boolean;
  trangThai: 'da_nop' | 'cho_cham';
  nopLuc: number;
  thoiGianLam: number;
  diem?: number;
  tongDiem?: number;
  soCauDung?: number;
  choChamTuLuan?: boolean;
  chiTiet?: ChiTietCauTraLoi[];
}
