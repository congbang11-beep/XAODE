// API Client for Google Apps Script Web App (v1.0.0) with seamless offline/demo fallback
import {
  CauHoi,
  De,
  MaDe,
  GiaoDe,
  BaiLam,
  Lop,
  HocSinh,
  ServerConfig,
  ThongTinGiaoDeResponse,
  LayDeThiResponse,
  NopBaiResponse
} from '../types';
import { storage, gradeSubmission, keyFor, newId, dsArr } from './storage';

export class ApiClient {
  private get config(): ServerConfig {
    return storage.getConfig();
  }

  private isConnected(): boolean {
    const cfg = this.config;
    return !!(cfg.webAppUrl && cfg.webAppUrl.trim().startsWith('http'));
  }

  private async callRemote(action: string, payload: any): Promise<any> {
    const url = this.config.webAppUrl.trim();
    if (!url) {
      throw new Error('Chưa cấu hình URL Google Apps Script trong mục Cài đặt.');
    }

    const body = {
      action,
      ...payload
    };

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // Apps Script handles text/plain JSON reliably without CORS preflight block
        },
        body: JSON.stringify(body)
      });

      const res = await resp.json();
      if (!res.ok) {
        throw new Error(res.error || 'Lỗi không xác định từ máy chủ Google Apps Script.');
      }
      return res.data;
    } catch (err: any) {
      console.warn('Google Apps Script request error, checking error details:', err);
      throw new Error(err.message || 'Không thể kết nối tới Google Apps Script. Vui lòng kiểm tra lại URL và quyền triển khai.');
    }
  }

  // TEACHER APIS
  async ping(key?: string): Promise<{
    version: string;
    hasKey: boolean;
    keyOk: boolean | null;
    initialized: boolean;
    missingSheets?: string[];
    spreadsheetId?: string;
    spreadsheetName?: string;
    spreadsheetUrl?: string;
  }> {
    const teacherKey = key ?? this.config.teacherKey;
    if (this.isConnected()) {
      return await this.callRemote('ping', { key: teacherKey });
    }
    // Local / Demo mode response
    return {
      version: '1.0.0',
      hasKey: true,
      keyOk: true,
      initialized: true,
      missingSheets: [],
      spreadsheetId: 'demo-local-storage',
      spreadsheetName: 'Đề Online (Chế độ Trải nghiệm Nội bộ)',
      spreadsheetUrl: '#'
    };
  }

  async khoiTao(key: string): Promise<any> {
    if (this.isConnected()) {
      const res = await this.callRemote('khoiTao', { key });
      const cfg = this.config;
      cfg.teacherKey = key;
      cfg.isOnlineConnected = true;
      cfg.spreadsheetInfo = {
        spreadsheetId: res.spreadsheetId,
        spreadsheetName: res.spreadsheetName,
        spreadsheetUrl: res.spreadsheetUrl
      };
      storage.saveConfig(cfg);
      return res;
    }

    // Local mode
    const cfg = this.config;
    cfg.teacherKey = key;
    storage.saveConfig(cfg);
    return {
      sheets: ['CaiDat', 'Lop', 'HocSinh', 'CauHoi', 'De', 'MaDe', 'GiaoDe', 'BaiLam', 'NhatKy'],
      spreadsheetName: 'Đã khởi tạo thành công (Bộ nhớ Nội bộ)'
    };
  }

  async doiMatKhau(matKhauMoi: string): Promise<any> {
    if (this.isConnected()) {
      return await this.callRemote('doiMatKhau', {
        key: this.config.teacherKey,
        matKhauMoi
      });
    }
    const cfg = this.config;
    cfg.teacherKey = matKhauMoi;
    storage.saveConfig(cfg);
    return { changed: true };
  }

  async taiTatCa(since = 0, tables?: string[]): Promise<Record<string, any[]>> {
    if (this.isConnected()) {
      const res = await this.callRemote('taiTatCa', {
        key: this.config.teacherKey,
        since,
        tables
      });
      // Sync into local cache
      if (res && res.tables) {
        Object.entries(res.tables).forEach(([table, rows]: [string, any]) => {
          if (Array.isArray(rows)) {
            storage.setTable(table, rows);
          }
        });
      }
      return res.tables || {};
    }

    // Local mode:
    const result: Record<string, any[]> = {
      CauHoi: storage.getTable<CauHoi>('CauHoi'),
      De: storage.getTable<De>('De'),
      MaDe: storage.getTable<MaDe>('MaDe'),
      GiaoDe: storage.getTable<GiaoDe>('GiaoDe'),
      BaiLam: storage.getTable<BaiLam>('BaiLam'),
      Lop: storage.getTable<Lop>('Lop'),
      HocSinh: storage.getTable<HocSinh>('HocSinh')
    };
    return result;
  }

  async luu(table: string, rows: any[]): Promise<any> {
    // Optimistic local save
    const localSaved = storage.upsertRows(table, rows);

    if (this.isConnected()) {
      try {
        const res = await this.callRemote('luu', {
          key: this.config.teacherKey,
          table,
          rows
        });
        return res;
      } catch (e: any) {
        console.error('Lỗi lưu đám mây, dữ liệu đã lưu tạm ở máy cục bộ:', e);
        throw e;
      }
    }

    return { saved: localSaved, conflicts: [] };
  }

  async xoa(table: string, ids: string[]): Promise<any> {
    storage.softDelete(table, ids);
    if (this.isConnected()) {
      return await this.callRemote('xoa', {
        key: this.config.teacherKey,
        table,
        ids
      });
    }
    return { deleted: ids };
  }

  async donRac(tables?: string[]): Promise<any> {
    const localRes = storage.purgeDeleted();
    if (this.isConnected()) {
      return await this.callRemote('donRac', {
        key: this.config.teacherKey,
        tables
      });
    }
    return { removed: localRes };
  }

  async chamLai(giaoDeId: string): Promise<any> {
    if (this.isConnected()) {
      return await this.callRemote('chamLai', {
        key: this.config.teacherKey,
        giaoDeId
      });
    }

    // Local grading
    const deList = storage.getTable<De>('De');
    const maDes = storage.getTable<MaDe>('MaDe');
    const qList = storage.getTable<CauHoi>('CauHoi');
    const qmap: Record<string, CauHoi> = {};
    qList.forEach((q) => (qmap[q.id] = q));
    const maDeMap: Record<string, MaDe> = {};
    maDes.forEach((m) => (maDeMap[m.id] = m));

    const gd = storage.getTable<GiaoDe>('GiaoDe').find((g) => g.id === giaoDeId);
    if (!gd) throw new Error('Không tìm thấy bài giao.');
    const de = deList.find((d) => d.id === gd.deId);

    const bList = storage.getTable<BaiLam>('BaiLam').filter((b) => b.giaoDeId === giaoDeId && b.trangThai !== 'dang_lam');
    const updated = bList.map((b) => {
      const g = gradeSubmission(de, maDeMap[b.maDeId], qmap, b.traLoi || [], b.chiTiet);
      return {
        ...b,
        chiTiet: g.chiTiet,
        diem: g.diem,
        tongDiem: g.tongDiem,
        trangThai: (g.canChamTay ? 'cho_cham' : 'da_nop') as any
      };
    });

    storage.upsertRows('BaiLam', updated);
    return { soBai: updated.length };
  }

  async chamTay(baiLamId: string, diemObj: Record<string, number | null>): Promise<any> {
    if (this.isConnected()) {
      return await this.callRemote('chamTay', {
        key: this.config.teacherKey,
        baiLamId,
        diem: diemObj
      });
    }

    const b = storage.getTable<BaiLam>('BaiLam').find((item) => item.id === baiLamId);
    if (!b) throw new Error('Không tìm thấy bài làm.');
    const gd = storage.getTable<GiaoDe>('GiaoDe').find((g) => g.id === b.giaoDeId);
    const de = storage.getTable<De>('De').find((d) => d.id === (gd?.deId || b.deId));
    const md = storage.getTable<MaDe>('MaDe').find((m) => m.id === b.maDeId);
    const qmap: Record<string, CauHoi> = {};
    storage.getTable<CauHoi>('CauHoi').forEach((q) => (qmap[q.id] = q));

    const oldChiTiet = (b.chiTiet || []).map((c) => ({ ...c }));
    Object.keys(diemObj).forEach((stt) => {
      const i = Number(stt) - 1;
      if (oldChiTiet[i]) {
        const val = diemObj[stt];
        oldChiTiet[i].diem = val === null || val === undefined ? null : Number(val);
      }
    });

    const g = gradeSubmission(de, md, qmap, b.traLoi || [], oldChiTiet);
    const saved = storage.upsertRows('BaiLam', [
      {
        ...b,
        chiTiet: g.chiTiet,
        diem: g.diem,
        tongDiem: g.tongDiem,
        trangThai: (g.canChamTay ? 'cho_cham' : 'da_nop') as any
      }
    ])[0];

    return saved;
  }

  // STUDENT APIS
  async thongTinGiaoDe(code: string): Promise<ThongTinGiaoDeResponse> {
    code = code.trim().toUpperCase();
    if (this.isConnected()) {
      return await this.callRemote('thongTinGiaoDe', { code });
    }

    const gd = storage.getTable<GiaoDe>('GiaoDe').find((g) => g.maTruyCap.toUpperCase() === code);
    if (!gd) throw new Error(`Không tìm thấy bài thi có mã: ${code}`);

    const de = storage.getTable<De>('De').find((d) => d.id === gd.deId);
    const lops = storage.getTable<Lop>('Lop');
    const lopMap: Record<string, string> = {};
    lops.forEach((l) => (lopMap[l.id] = l.tenLop));

    const now = Date.now();
    let tinhTrang: 'mo' | 'dong' | 'chua_mo' | 'het_han' = 'mo';
    if (gd.trangThai === 'dong' || gd.trangThai === 'nhap') tinhTrang = 'dong';
    else if (gd.batDau && now < gd.batDau) tinhTrang = 'chua_mo';
    else if (gd.ketThuc && now > gd.ketThuc) tinhTrang = 'het_han';

    return {
      tieuDe: gd.tieuDe || de?.tenDe || 'Bài kiểm tra',
      tenDe: de?.tenDe || '',
      monHoc: de?.monHoc || '',
      thoiLuong: gd.thoiLuong || de?.thoiGian || null,
      batDau: gd.batDau || null,
      ketThuc: gd.ketThuc || null,
      soCau: de?.cauHoiIds?.length || null,
      canMatKhau: !!gd.matKhau,
      yeuCauDanhSach: !!gd.yeuCauDanhSach,
      soLanLam: gd.soLanLam || 0,
      chongGianLan: !!gd.chongGianLan,
      lop: (gd.lopIds || []).map((id) => ({ id, tenLop: lopMap[id] || '' })),
      tinhTrang,
      serverTime: Date.now()
    };
  }

  async layDeThi(params: {
    code: string;
    hoTen: string;
    lop: string;
    maHS?: string;
    matKhau?: string;
    thietBi?: string;
  }): Promise<LayDeThiResponse> {
    if (this.isConnected()) {
      return await this.callRemote('layDeThi', params);
    }

    const code = params.code.trim().toUpperCase();
    const gd = storage.getTable<GiaoDe>('GiaoDe').find((g) => g.maTruyCap.toUpperCase() === code);
    if (!gd) throw new Error('Không tìm thấy bài thi.');

    if (gd.matKhau && params.matKhau?.trim() !== gd.matKhau.trim()) {
      throw new Error('Mật khẩu bài thi không đúng.');
    }

    let hoTen = params.hoTen.trim();
    let lop = params.lop.trim();
    const maHS = params.maHS?.trim();

    if (gd.yeuCauDanhSach) {
      if (!maHS) throw new Error('Vui lòng nhập mã học sinh.');
      const allHS = storage.getTable<HocSinh>('HocSinh');
      const hs = allHS.find(
        (h) => h.maHS.toUpperCase() === maHS.toUpperCase() && (!gd.lopIds?.length || gd.lopIds.includes(h.lopId))
      );
      if (!hs) throw new Error('Mã học sinh không có trong danh sách được giao bài.');
      hoTen = hs.hoTen;
      const l = storage.getTable<Lop>('Lop').find((x) => x.id === hs.lopId);
      if (l) lop = l.tenLop;
    } else if (!hoTen) {
      throw new Error('Vui lòng nhập họ và tên.');
    }

    const de = storage.getTable<De>('De').find((d) => d.id === gd.deId);
    if (!de) throw new Error('Không tìm thấy đề thi.');

    const maDes = storage.getTable<MaDe>('MaDe').filter((m) => m.deId === gd.deId);
    if (!maDes.length) throw new Error('Đề thi chưa có mã đề.');

    // Pick MaDe
    const selectedMd = maDes[Math.floor(Math.random() * maDes.length)];

    const now = Date.now();
    const newSubmission: BaiLam = {
      id: newId('BL'),
      giaoDeId: gd.id,
      deId: de.id,
      maDeId: selectedMd.id,
      maDe: selectedMd.maDe,
      hoTen,
      lop,
      maHS,
      batDau: now,
      traLoi: [],
      soLanRoiTab: 0,
      trangThai: 'dang_lam',
      thietBi: params.thietBi || 'Web Browser',
      createdAt: now,
      updatedAt: now
    };

    storage.upsertRows('BaiLam', [newSubmission]);

    const qmap: Record<string, CauHoi> = {};
    storage.getTable<CauHoi>('CauHoi').forEach((q) => (qmap[q.id] = q));

    const cauHoi = (selectedMd.thuTu || []).map((it, i) => {
      const q = qmap[it.q] || {
        loai: 'TN',
        noiDung: '(Câu hỏi không tìm thấy)',
        phuongAn: []
      };
      const pa = Array.isArray(q.phuongAn) ? q.phuongAn : [];
      const opts = it.p && it.p.length ? it.p.map((j) => pa[j]) : pa;

      return {
        stt: i + 1,
        phan: it.phan || '',
        loai: q.loai || 'TN',
        noiDung: q.noiDung || '',
        hinhAnh: q.hinhAnh,
        phuongAn: q.loai === 'TN' || q.loai === 'DS' ? opts : []
      };
    });

    const hanNop = gd.thoiLuong ? now + gd.thoiLuong * 60000 : null;

    return {
      baiLamId: newSubmission.id,
      tieuDe: gd.tieuDe || de.tenDe,
      tenDe: de.tenDe,
      monHoc: de.monHoc,
      maDe: selectedMd.maDe,
      hoTen,
      lop,
      maHS,
      batDau: now,
      hanNop,
      serverTime: now,
      traLoi: [],
      soLanRoiTab: 0,
      chongGianLan: !!gd.chongGianLan,
      tiepTuc: false,
      cauHoi
    };
  }

  async luuNhap(params: { baiLamId: string; traLoi: any[]; soLanRoiTab: number }): Promise<any> {
    if (this.isConnected()) {
      return await this.callRemote('luuNhap', params);
    }

    const b = storage.getTable<BaiLam>('BaiLam').find((item) => item.id === params.baiLamId);
    if (!b) return { daNop: false, luuLuc: Date.now() };

    b.traLoi = params.traLoi;
    b.soLanRoiTab = Math.max(b.soLanRoiTab || 0, params.soLanRoiTab || 0);
    storage.upsertRows('BaiLam', [b]);
    return { daNop: false, luuLuc: Date.now() };
  }

  async nopBai(params: { baiLamId: string; traLoi: any[]; soLanRoiTab: number }): Promise<NopBaiResponse> {
    if (this.isConnected()) {
      return await this.callRemote('nopBai', params);
    }

    const b = storage.getTable<BaiLam>('BaiLam').find((item) => item.id === params.baiLamId);
    if (!b) throw new Error('Không tìm thấy bài làm.');

    const gd = storage.getTable<GiaoDe>('GiaoDe').find((g) => g.id === b.giaoDeId);
    const de = storage.getTable<De>('De').find((d) => d.id === (gd?.deId || b.deId));
    const md = storage.getTable<MaDe>('MaDe').find((m) => m.id === b.maDeId);
    const qmap: Record<string, CauHoi> = {};
    storage.getTable<CauHoi>('CauHoi').forEach((q) => (qmap[q.id] = q));

    const g = gradeSubmission(de, md, qmap, params.traLoi, undefined);
    const now = Date.now();
    const thoiGianLam = Math.max(0, Math.round((now - b.batDau) / 1000));

    b.traLoi = params.traLoi;
    b.chiTiet = g.chiTiet;
    b.diem = g.diem;
    b.tongDiem = g.tongDiem;
    b.nopLuc = now;
    b.thoiGianLam = thoiGianLam;
    b.soLanRoiTab = Math.max(b.soLanRoiTab || 0, params.soLanRoiTab || 0);
    b.trangThai = g.canChamTay ? 'cho_cham' : 'da_nop';

    storage.upsertRows('BaiLam', [b]);

    const res: NopBaiResponse = {
      daNop: true,
      nopTre: false,
      trangThai: b.trangThai,
      nopLuc: now,
      thoiGianLam
    };

    if (gd?.hienDiem !== false) {
      res.diem = g.diem;
      res.tongDiem = g.tongDiem;
      res.soCauDung = g.chiTiet.filter((c) => c.dung).length;
      res.choChamTuLuan = g.canChamTay;
    }

    if (gd?.hienDapAn) {
      res.chiTiet = g.chiTiet.map((c) => ({
        ...c,
        loiGiai: qmap[c.q]?.loiGiai || ''
      }));
    }

    return res;
  }
}

export const api = new ApiClient();
