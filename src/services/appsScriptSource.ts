// Google Apps Script source code and setup instructions

export const APPS_SCRIPT_SOURCE = `/******************************************************************
 * ĐỀ ONLINE – MÁY CHỦ GOOGLE APPS SCRIPT (phiên bản 1.0.0)
 * ---------------------------------------------------------------
 * CÁCH CÀI ĐẶT
 * 1. Mở Google Sheet sẽ dùng làm kho dữ liệu.
 * 2. Tiện ích mở rộng > Apps Script > xoá mã mẫu, dán TOÀN BỘ mã này vào Code.gs > Lưu.
 * 3. Cài đặt dự án (biểu tượng bánh răng) > Múi giờ: (GMT+07:00) Asia/Ho_Chi_Minh.
 * 4. Triển khai > Tùy chọn triển khai mới > Loại: Ứng dụng web
 *      - Thực thi dưới dạng: Tôi (tài khoản của bạn)
 *      - Người có quyền truy cập: Bất kỳ ai
 *    > Triển khai > Cấp quyền > sao chép "URL ứng dụng web" (đuôi /exec).
 * 5. Dán URL đó vào mục Cài đặt của ứng dụng, nhập mật khẩu giáo viên (>= 6 ký tự)
 *    rồi bấm "Khởi tạo". Lần khởi tạo đầu tiên sẽ đặt mật khẩu này.
 * 6. Khi sửa mã: Triển khai > Quản lý bản triển khai > Sửa > Phiên bản: Mới > Triển khai
 *    (giữ nguyên URL).
 ******************************************************************/

const APP_VERSION = '1.0.0';
const TIMEZONE = 'Asia/Ho_Chi_Minh';
const GRACE_MS = 2 * 60 * 1000; // cho phép trễ 2 phút do mạng

// Cấu trúc các trang tính (thứ tự cột chỉ là gợi ý; mã đọc theo tên cột ở hàng 1)
const SCHEMA = {
  CaiDat:  ['id', 'value', 'createdAt', 'updatedAt', 'deleted'],
  Lop:     ['id', 'tenLop', 'khoi', 'namHoc', 'ghiChu', 'createdAt', 'updatedAt', 'deleted'],
  HocSinh: ['id', 'lopId', 'maHS', 'hoTen', 'ngaySinh', 'ghiChu', 'createdAt', 'updatedAt', 'deleted'],
  CauHoi:  ['id', 'loai', 'monHoc', 'khoi', 'chuDe', 'bai', 'mucDo', 'noiDung', 'hinhAnh', 'phuongAn',
            'dapAn', 'loiGiai', 'diem', 'khongTron', 'tags', 'createdAt', 'updatedAt', 'deleted'],
  De:      ['id', 'tenDe', 'monHoc', 'khoi', 'thoiGian', 'moTa', 'cauTruc', 'cauHoiIds', 'thangDiem',
            'trangThai', 'createdAt', 'updatedAt', 'deleted'],
  MaDe:    ['id', 'deId', 'maDe', 'thuTu', 'dapAn', 'createdAt', 'updatedAt', 'deleted'],
  GiaoDe:  ['id', 'deId', 'tieuDe', 'lopIds', 'maTruyCap', 'matKhau', 'batDau', 'ketThuc', 'thoiLuong',
            'soLanLam', 'cheDoMaDe', 'hienDiem', 'hienDapAn', 'yeuCauDanhSach', 'chongGianLan',
            'trangThai', 'createdAt', 'updatedAt', 'deleted'],
  BaiLam:  ['id', 'giaoDeId', 'deId', 'maDeId', 'maDe', 'hoTen', 'lop', 'maHS', 'batDau', 'nopLuc',
            'thoiGianLam', 'traLoi', 'chiTiet', 'diem', 'tongDiem', 'soLanRoiTab', 'trangThai',
            'thietBi', 'createdAt', 'updatedAt', 'deleted'],
  NhatKy:  ['thoiGian', 'hanhDong', 'chiTiet']
};

const JSON_FIELDS = {
  CauHoi: ['phuongAn'],
  De: ['cauTruc', 'cauHoiIds', 'thangDiem'],
  MaDe: ['thuTu', 'dapAn'],
  GiaoDe: ['lopIds'],
  BaiLam: ['traLoi', 'chiTiet']
};
const BOOL_FIELDS = ['deleted', 'khongTron', 'hienDiem', 'hienDapAn', 'yeuCauDanhSach', 'chongGianLan'];
const NUM_FIELDS = ['createdAt', 'updatedAt', 'thoiGian', 'thoiLuong', 'soLanLam', 'diem', 'tongDiem',
                    'soLanRoiTab', 'batDau', 'ketThuc', 'nopLuc', 'thoiGianLam'];

// Thang điểm mặc định theo cấu trúc đề TN THPT từ 2025 (có thể ghi đè trong De.thangDiem)
const DEFAULT_SCORE = { TN: 0.25, DS: [0.1, 0.25, 0.5, 1], TLN: 0.5, TL: 1 };

const PUBLIC_ACTIONS = ['ping', 'thongTinGiaoDe', 'layDeThi', 'luuNhap', 'nopBai'];

const ACTIONS = {
  ping: apiPing,
  khoiTao: apiKhoiTao,
  taiTatCa: apiTaiTatCa,
  luu: apiLuu,
  xoa: apiXoa,
  donRac: apiDonRac,
  doiMatKhau: apiDoiMatKhau,
  chamLai: apiChamLai,
  chamTay: apiChamTay,
  thongTinGiaoDe: apiThongTinGiaoDe,
  layDeThi: apiLayDeThi,
  luuNhap: apiLuuNhap,
  nopBai: apiNopBai
};

/* ======================= ĐIỂM VÀO WEB APP ======================= */

function doPost(e) {
  let p;
  try {
    p = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return out_({ ok: false, error: 'Dữ liệu gửi lên không hợp lệ (không phải JSON).' });
  }
  return out_(handle_(p));
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (!p.action) p.action = 'ping';
  if (['ping', 'thongTinGiaoDe'].indexOf(p.action) < 0) {
    return out_({ ok: false, error: 'Thao tác này chỉ hỗ trợ phương thức POST.' });
  }
  return out_(handle_(p));
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function handle_(p) {
  try {
    const action = String(p.action || '');
    const fn = ACTIONS[action];
    if (!fn) throw new Error('Thao tác không hợp lệ: ' + action);
    if (PUBLIC_ACTIONS.indexOf(action) < 0 && action !== 'khoiTao') checkKey_(p.key);
    const data = fn(p);
    return { ok: true, data: data, serverTime: Date.now(), version: APP_VERSION };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err), serverTime: Date.now(), version: APP_VERSION };
  }
}

/* ======================= TIỆN ÍCH CHUNG ======================= */

function ss_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Hãy dán mã vào Apps Script GẮN VỚI Google Sheet (Tiện ích mở rộng > Apps Script).');
  return ss;
}

function checkKey_(key) {
  const saved = PropertiesService.getScriptProperties().getProperty('TEACHER_KEY');
  if (!saved) throw new Error('CHUA_KHOI_TAO: Máy chủ chưa được khởi tạo. Vào Cài đặt và bấm "Khởi tạo".');
  if (String(key || '') !== saved) throw new Error('SAI_MAT_KHAU: Mật khẩu giáo viên không đúng.');
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('Máy chủ đang bận, vui lòng thử lại sau vài giây.');
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function newId_(name) {
  const prefix = { CauHoi: 'CH', De: 'DE', MaDe: 'MD', GiaoDe: 'GD', BaiLam: 'BL', Lop: 'LO', HocSinh: 'HS', CaiDat: 'CD' }[name] || 'ID';
  return prefix + '_' + Date.now().toString(36) + Utilities.getUuid().replace(/-/g, '').slice(0, 6);
}

function round2_(x) {
  return Math.round(Number(x || 0) * 100) / 100;
}

function num_(v, def) {
  if (v === null || v === undefined || v === '' || isNaN(Number(v))) return Number(def);
  return Number(v);
}

function fmt_(ms) {
  return Utilities.formatDate(new Date(ms), TIMEZONE, 'HH:mm dd/MM/yyyy');
}

function clean_(s) {
  return String(s == null ? '' : s).trim().split('  ').join(' ');
}

function log_(action, detail) {
  try {
    const info = ensureSheet_(ss_(), 'NhatKy');
    info.sh.appendRow([fmt_(Date.now()), action, String(detail || '').slice(0, 500)]);
    if (info.sh.getLastRow() > 3000) info.sh.deleteRows(2, 1000);
  } catch (err) { /* bỏ qua lỗi ghi nhật ký */ }
}

/* ======================= ĐỌC / GHI TRANG TÍNH ======================= */

function ensureSheet_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  const fields = SCHEMA[name];
  const lastCol = Math.max(sh.getLastColumn(), 1);
  let headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
  if (headers.length === 1 && headers[0] === '') headers = [];
  let changed = false;
  fields.forEach(function (f) {
    if (headers.indexOf(f) < 0) { headers.push(f); changed = true; }
  });
  if (changed) {
    sh.getRange(1, 1, sh.getMaxRows(), headers.length).setNumberFormat('@');
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#DBEAFE');
    sh.setFrozenRows(1);
  }
  return { sh: sh, headers: headers };
}

function read_(ss, name) {
  const info = ensureSheet_(ss, name);
  const lastRow = info.sh.getLastRow();
  const values = lastRow > 1 ? info.sh.getRange(2, 1, lastRow - 1, info.headers.length).getValues() : [];
  return { sh: info.sh, headers: info.headers, values: values };
}

function fromCell_(name, field, v) {
  if ((JSON_FIELDS[name] || []).indexOf(field) >= 0) {
    if (v === '' || v === null || v === undefined) return null;
    try { return JSON.parse(v); } catch (err) { return v; }
  }
  if (BOOL_FIELDS.indexOf(field) >= 0) {
    return v === true || v === 1 || ['TRUE', '1', 'X', 'CÓ'].indexOf(String(v).trim().toUpperCase()) >= 0;
  }
  if (NUM_FIELDS.indexOf(field) >= 0) {
    if (v instanceof Date) return v.getTime();
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(String(v).replace(',', '.'));
    return isNaN(n) ? null : n;
  }
  if (v instanceof Date) return Utilities.formatDate(v, TIMEZONE, 'dd/MM/yyyy');
  return v === null || v === undefined ? '' : String(v);
}

function toCell_(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return String(v.getTime());
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'object') v = JSON.stringify(v);
  v = String(v);
  if (v.length > 49000) throw new Error('Một ô dữ liệu vượt quá 49.000 ký tự (giới hạn của Google Sheet). Hãy rút gọn nội dung hoặc dùng link ảnh thay cho ảnh nhúng.');
  return v;
}

function rowToObj_(name, headers, row) {
  const o = {};
  headers.forEach(function (h, i) { if (h) o[h] = fromCell_(name, h, row[i]); });
  return o;
}

function listAll_(ss, name) {
  const t = read_(ss, name);
  return t.values.map(function (r) { return rowToObj_(name, t.headers, r); }).filter(function (o) { return o.id; });
}

function mapById_(ss, name) {
  const m = {};
  listAll_(ss, name).forEach(function (o) { m[o.id] = o; });
  return m;
}

function getById_(ss, name, id) {
  if (!id) return null;
  const t = read_(ss, name);
  const idIdx = t.headers.indexOf('id');
  for (let i = 0; i < t.values.length; i++) {
    if (String(t.values[i][idIdx]) === String(id)) return rowToObj_(name, t.headers, t.values[i]);
  }
  return null;
}

function upsert_(ss, name, rows, opts) {
  opts = opts || {};
  const t = read_(ss, name);
  const idIdx = t.headers.indexOf('id');
  const index = {};
  t.values.forEach(function (r, i) { const id = String(r[idIdx] || ''); if (id) index[id] = i; });

  const byId = {};
  const order = [];
  rows.forEach(function (r) {
    const o = Object.assign({}, r);
    if (!o.id) o.id = newId_(name);
    if (!byId[o.id]) order.push(o.id);
    byId[o.id] = Object.assign(byId[o.id] || {}, o);
  });

  let codes = null;
  if (name === 'GiaoDe') {
    const cIdx = t.headers.indexOf('maTruyCap');
    codes = {};
    t.values.forEach(function (r) { if (r[cIdx]) codes[String(r[cIdx]).toUpperCase()] = true; });
  }

  const now = Date.now();
  const saved = [], conflicts = [], appends = [];
  let updates = 0;
  order.forEach(function (id) {
    const obj = byId[id];
    const base = obj._base;
    delete obj._base;
    const i = index[id];
    const existing = i !== undefined ? rowToObj_(name, t.headers, t.values[i]) : null;
    if (opts.mustExist && !existing) return;
    if (opts.checkConflict && existing && base && existing.updatedAt && existing.updatedAt > Number(base)) {
      conflicts.push(existing);
      return;
    }
    const merged = Object.assign({}, existing || {}, obj);
    merged.updatedAt = now;
    if (!merged.createdAt) merged.createdAt = now;
    if (merged.deleted === undefined || merged.deleted === null || merged.deleted === '') merged.deleted = false;
    if (name === 'GiaoDe') {
      if (merged.maTruyCap) merged.maTruyCap = String(merged.maTruyCap).trim().toUpperCase();
      if (!merged.maTruyCap) {
        let c;
        do { c = randomCode_(6); } while (codes[c]);
        merged.maTruyCap = c;
      }
      codes[merged.maTruyCap] = true;
    }
    const values = t.headers.map(function (h) { return h ? toCell_(merged[h]) : ''; });
    if (i !== undefined) {
      t.values[i] = values;
      updates++;
      if (updates <= 20) t.sh.getRange(i + 2, 1, 1, t.headers.length).setNumberFormat('@').setValues([values]);
    } else {
      appends.push(values);
    }
    saved.push(merged);
  });

  if (updates > 20) {
    const block = t.values.map(function (r) { return r.map(toCell_); });
    t.sh.getRange(2, 1, block.length, t.headers.length).setNumberFormat('@').setValues(block);
  }
  if (appends.length) {
    const start = t.sh.getLastRow() + 1;
    t.sh.getRange(start, 1, appends.length, t.headers.length).setNumberFormat('@').setValues(appends);
  }
  return { saved: saved, conflicts: conflicts };
}

function randomCode_(n) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < n; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

/* ======================= API GIÁO VIÊN ======================= */

function apiPing(p) {
  const ss = ss_();
  const props = PropertiesService.getScriptProperties();
  const saved = props.getProperty('TEACHER_KEY');
  const keyOk = saved && p.key ? String(p.key) === saved : null;
  const missing = Object.keys(SCHEMA).filter(function (n) { return !ss.getSheetByName(n); });
  const r = { version: APP_VERSION, hasKey: !!saved, keyOk: keyOk, initialized: !!saved && missing.length === 0, missingSheets: missing };
  if (keyOk) {
    r.spreadsheetId = ss.getId();
    r.spreadsheetName = ss.getName();
    r.spreadsheetUrl = ss.getUrl();
  }
  return r;
}

function apiKhoiTao(p) {
  const props = PropertiesService.getScriptProperties();
  const saved = props.getProperty('TEACHER_KEY');
  if (saved) {
    checkKey_(p.key);
  } else {
    if (!p.key || String(p.key).length < 6) throw new Error('Mật khẩu giáo viên cần ít nhất 6 ký tự.');
    props.setProperty('TEACHER_KEY', String(p.key));
  }
  const ss = ss_();
  const names = Object.keys(SCHEMA);
  names.forEach(function (n) { ensureSheet_(ss, n); });
  const def = ss.getSheetByName('Sheet1') || ss.getSheetByName('Trang tính1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);
  log_('khoiTao', 'Khởi tạo các trang: ' + names.join(', '));
  return { sheets: names, spreadsheetId: ss.getId(), spreadsheetName: ss.getName(), spreadsheetUrl: ss.getUrl() };
}

function apiDoiMatKhau(p) {
  const k = String(p.matKhauMoi || '');
  if (k.length < 6) throw new Error('Mật khẩu mới cần ít nhất 6 ký tự.');
  PropertiesService.getScriptProperties().setProperty('TEACHER_KEY', k);
  log_('doiMatKhau', 'Đã đổi mật khẩu giáo viên');
  return { changed: true };
}

function apiTaiTatCa(p) {
  const ss = ss_();
  const since = Number(p.since || 0);
  const names = Array.isArray(p.tables) && p.tables.length ? p.tables : Object.keys(SCHEMA);
  const tables = {};
  names.forEach(function (name) {
    if (!SCHEMA[name] || name === 'NhatKy') return;
    tables[name] = listAll_(ss, name).filter(function (o) {
      return since > 0 ? (o.updatedAt || 0) > since : !o.deleted;
    });
  });
  return { since: since, full: since <= 0, tables: tables };
}

function apiLuu(p) {
  const name = String(p.table || '');
  if (!SCHEMA[name] || name === 'NhatKy') throw new Error('Bảng dữ liệu không hợp lệ: ' + name);
  const rows = Array.isArray(p.rows) ? p.rows : (p.row ? [p.row] : []);
  if (!rows.length) return { saved: [], conflicts: [] };
  return withLock_(function () {
    return upsert_(ss_(), name, rows, { checkConflict: true });
  });
}

function apiXoa(p) {
  const name = String(p.table || '');
  if (!SCHEMA[name] || name === 'NhatKy') throw new Error('Bảng dữ liệu không hợp lệ: ' + name);
  const ids = Array.isArray(p.ids) ? p.ids : [];
  return withLock_(function () {
    const r = upsert_(ss_(), name, ids.map(function (id) { return { id: id, deleted: true }; }), { mustExist: true });
    log_('xoa', name + ': ' + ids.join(', '));
    return { deleted: r.saved.map(function (o) { return o.id; }) };
  });
}

function apiDonRac(p) {
  return withLock_(function () {
    const ss = ss_();
    const names = Array.isArray(p.tables) && p.tables.length ? p.tables : Object.keys(SCHEMA);
    const result = {};
    names.forEach(function (name) {
      if (!SCHEMA[name] || name === 'NhatKy') return;
      const t = read_(ss, name);
      const dIdx = t.headers.indexOf('deleted');
      if (dIdx < 0 || !t.values.length) return;
      const keep = t.values.filter(function (r) { return !fromCell_(name, 'deleted', r[dIdx]); });
      const removed = t.values.length - keep.length;
      if (!removed) return;
      t.sh.getRange(2, 1, t.values.length, t.headers.length).clearContent();
      if (keep.length) {
        t.sh.getRange(2, 1, keep.length, t.headers.length).setNumberFormat('@').setValues(keep.map(function (r) { return r.map(toCell_); }));
      }
      result[name] = removed;
    });
    log_('donRac', JSON.stringify(result));
    return { removed: result };
  });
}

function apiChamLai(p) {
  return withLock_(function () {
    const ss = ss_();
    const gd = getById_(ss, 'GiaoDe', p.giaoDeId);
    if (!gd) throw new Error('Không tìm thấy lần giao đề.');
    const de = getById_(ss, 'De', gd.deId) || {};
    const maDeMap = mapById_(ss, 'MaDe');
    const qmap = mapById_(ss, 'CauHoi');
    const list = listAll_(ss, 'BaiLam').filter(function (b) {
      return b.giaoDeId === gd.id && !b.deleted && b.trangThai !== 'dang_lam';
    });
    const rows = list.map(function (b) {
      const g = grade_(de, maDeMap[b.maDeId], qmap, b.traLoi || [], b.chiTiet);
      return { id: b.id, chiTiet: g.chiTiet, diem: g.diem, tongDiem: g.tongDiem, trangThai: g.canChamTay ? 'cho_cham' : 'da_nop' };
    });
    if (rows.length) upsert_(ss, 'BaiLam', rows, {});
    log_('chamLai', gd.id + ': ' + rows.length + ' bài');
    return { soBai: rows.length };
  });
}

function apiChamTay(p) {
  return withLock_(function () {
    const ss = ss_();
    const b = getById_(ss, 'BaiLam', p.baiLamId);
    if (!b) throw new Error('Không tìm thấy bài làm.');
    const gd = getById_(ss, 'GiaoDe', b.giaoDeId) || {};
    const de = getById_(ss, 'De', gd.deId || b.deId) || {};
    const md = getById_(ss, 'MaDe', b.maDeId);
    const qmap = mapById_(ss, 'CauHoi');
    const old = (b.chiTiet || []).map(function (c) { return Object.assign({}, c); });
    Object.keys(p.diem || {}).forEach(function (stt) {
      const i = Number(stt) - 1;
      if (old[i]) old[i].diem = p.diem[stt] === '' || p.diem[stt] === null ? null : Number(p.diem[stt]);
    });
    const g = grade_(de, md, qmap, b.traLoi || [], old);
    const saved = upsert_(ss, 'BaiLam', [{ id: b.id, chiTiet: g.chiTiet, diem: g.diem, tongDiem: g.tongDiem, trangThai: g.canChamTay ? 'cho_cham' : 'da_nop' }], {}).saved[0];
    return saved;
  });
}

/* ======================= CHẤM ĐIỂM ======================= */

function dsChar_(c) {
  c = String(c || '').toUpperCase();
  if (c === 'Đ' || c === 'D' || c === 'T' || c === '1') return 'Đ';
  if (c === 'S' || c === 'F' || c === '0') return 'S';
  return '';
}

function dsArr_(v) {
  if (Array.isArray(v)) return v.map(dsChar_);
  return String(v == null ? '' : v).toUpperCase().replace(/[^ĐDTSF01]/g, '').split('').map(dsChar_);
}

function keyFor_(q, p) {
  const L = 'ABCDEFGH';
  if (q.loai === 'TN') {
    const o = L.indexOf(String(q.dapAn || '').trim().toUpperCase().charAt(0));
    if (o < 0) return '';
    if (!p || !p.length) return L.charAt(o);
    return L.charAt(p.indexOf(o));
  }
  if (q.loai === 'DS') {
    const s = dsArr_(q.dapAn);
    if (!p || !p.length) return s.join('');
    return p.map(function (j) { return s[j] || ''; }).join('');
  }
  return String(q.dapAn == null ? '' : q.dapAn);
}

function normShort_(s) {
  return String(s == null ? '' : s).trim().toLowerCase().split(' ').join('').split(',').join('.');
}

function parseNum_(s) {
  if (s === '') return NaN;
  if (s.indexOf('/') > 0) {
    const parts = s.split('/');
    if (parts.length === 2 && Number(parts[1]) !== 0) return Number(parts[0]) / Number(parts[1]);
    return NaN;
  }
  return Number(s);
}

function matchShort_(ans, key) {
  const a = normShort_(ans);
  if (a === '') return false;
  return String(key == null ? '' : key).split(';').some(function (k) {
    const b = normShort_(k);
    if (b === '') return false;
    const na = parseNum_(a), nb = parseNum_(b);
    if (!isNaN(na) && !isNaN(nb)) return Math.abs(na - nb) < 1e-9;
    return a === b;
  });
}

function grade_(de, md, qmap, traLoi, oldChiTiet) {
  const td = Object.assign({}, DEFAULT_SCORE, (de && de.thangDiem) || {});
  const thangDS = Array.isArray(td.DS) && td.DS.length ? td.DS : DEFAULT_SCORE.DS;
  const items = (md && md.thuTu) || [];
  let diem = 0, tong = 0, canChamTay = false;
  const chiTiet = items.map(function (it, i) {
    const q = qmap[it.q] || {};
    const loai = q.loai || 'TN';
    const key = keyFor_(q, it.p);
    const ans = traLoi[i] === undefined ? null : traLoi[i];
    let d = 0, max = 0, dung = false, soYDung = null;
    if (loai === 'TN') {
      max = num_(q.diem, td.TN);
      dung = !!ans && String(ans).trim().toUpperCase() === key;
      d = dung ? max : 0;
    } else if (loai === 'DS') {
      const a = dsArr_(ans), k = dsArr_(key);
      soYDung = 0;
      k.forEach(function (v, j) { if (a[j] && a[j] === v) soYDung++; });
      const top = thangDS[thangDS.length - 1];
      max = num_(q.diem, top);
      const base = soYDung > 0 ? thangDS[Math.min(soYDung, thangDS.length) - 1] : 0;
      d = base * max / top;
      dung = k.length > 0 && soYDung === k.length;
    } else if (loai === 'TLN') {
      max = num_(q.diem, td.TLN);
      dung = matchShort_(ans, key);
      d = dung ? max : 0;
    } else {
      max = num_(q.diem, td.TL);
      const prev = oldChiTiet && oldChiTiet[i];
      if (prev && prev.diem !== null && prev.diem !== undefined && prev.diem !== '') {
        d = Math.min(Number(prev.diem), max);
      } else {
        d = null;
        canChamTay = true;
      }
    }
    tong += max;
    if (d) diem += d;
    return {
      stt: i + 1, q: it.q, loai: loai, traLoi: ans, dapAn: key, dung: dung, soYDung: soYDung,
      diem: d === null ? null : round2_(d), diemToiDa: round2_(max)
    };
  });
  return { chiTiet: chiTiet, diem: round2_(diem), tongDiem: round2_(tong), canChamTay: canChamTay };
}

/* ======================= API HỌC SINH ======================= */

function findGiaoDe_(ss, code) {
  code = String(code || '').trim().toUpperCase();
  if (!code) throw new Error('Vui lòng nhập mã bài thi.');
  const list = listAll_(ss, 'GiaoDe');
  for (let i = 0; i < list.length; i++) {
    if (!list[i].deleted && String(list[i].maTruyCap).toUpperCase() === code) return list[i];
  }
  throw new Error('Không tìm thấy bài thi có mã ' + code + '.');
}

function tinhTrang_(gd) {
  const now = Date.now();
  if (gd.trangThai === 'dong' || gd.trangThai === 'nhap') return 'dong';
  if (gd.batDau && now < gd.batDau) return 'chua_mo';
  if (gd.ketThuc && now > gd.ketThuc) return 'het_han';
  return 'mo';
}

function checkOpen_(gd) {
  const s = tinhTrang_(gd);
  if (s === 'dong') throw new Error('Bài thi hiện đang đóng.');
  if (s === 'chua_mo') throw new Error('Bài thi chưa mở. Thời gian mở: ' + fmt_(gd.batDau) + '.');
  if (s === 'het_han') throw new Error('Bài thi đã hết hạn lúc ' + fmt_(gd.ketThuc) + '.');
}

function deadline_(gd, batDau) {
  let d = Infinity;
  const tl = Number(gd.thoiLuong || 0);
  if (tl > 0) d = Number(batDau) + tl * 60000;
  if (gd.ketThuc) d = Math.min(d, Number(gd.ketThuc));
  return d === Infinity ? null : d;
}

function studentKey_(maHS, hoTen, lop) {
  if (maHS) return 'MA:' + String(maHS).trim().toUpperCase();
  return 'TEN:' + clean_(hoTen).toLowerCase() + '|' + clean_(lop).toLowerCase();
}

function apiThongTinGiaoDe(p) {
  const ss = ss_();
  const gd = findGiaoDe_(ss, p.code);
  const de = getById_(ss, 'De', gd.deId) || {};
  const lopMap = mapById_(ss, 'Lop');
  return {
    tieuDe: gd.tieuDe || de.tenDe || 'Bài kiểm tra',
    tenDe: de.tenDe || '',
    monHoc: de.monHoc || '',
    thoiLuong: gd.thoiLuong || de.thoiGian || null,
    batDau: gd.batDau || null,
    ketThuc: gd.ketThuc || null,
    soCau: Array.isArray(de.cauHoiIds) ? de.cauHoiIds.length : null,
    canMatKhau: !!gd.matKhau,
    yeuCauDanhSach: !!gd.yeuCauDanhSach,
    soLanLam: gd.soLanLam || 0,
    chongGianLan: !!gd.chongGianLan,
    lop: (gd.lopIds || []).map(function (id) { return { id: id, tenLop: (lopMap[id] || {}).tenLop || '' }; }),
    tinhTrang: tinhTrang_(gd),
    serverTime: Date.now()
  };
}

function apiLayDeThi(p) {
  return withLock_(function () {
    const ss = ss_();
    const gd = findGiaoDe_(ss, p.code);
    checkOpen_(gd);
    if (gd.matKhau && String(p.matKhau || '').trim() !== String(gd.matKhau).trim()) {
      throw new Error('Mật khẩu bài thi không đúng.');
    }
    let hoTen = clean_(p.hoTen), lop = clean_(p.lop), maHS = clean_(p.maHS);
    if (gd.yeuCauDanhSach) {
      if (!maHS) throw new Error('Vui lòng nhập mã học sinh.');
      const lopIds = gd.lopIds || [];
      const hs = listAll_(ss, 'HocSinh').filter(function (h) {
        return !h.deleted && String(h.maHS).trim().toUpperCase() === maHS.toUpperCase() &&
          (!lopIds.length || lopIds.indexOf(h.lopId) >= 0);
      })[0];
      if (!hs) throw new Error('Mã học sinh không có trong danh sách lớp được giao bài.');
      hoTen = hs.hoTen;
      lop = ((mapById_(ss, 'Lop')[hs.lopId]) || {}).tenLop || lop;
    } else if (!hoTen) {
      throw new Error('Vui lòng nhập họ và tên.');
    }

    const who = studentKey_(maHS, hoTen, lop);
    const all = listAll_(ss, 'BaiLam').filter(function (b) { return b.giaoDeId === gd.id && !b.deleted; });
    const mine = all.filter(function (b) { return studentKey_(b.maHS, b.hoTen, b.lop) === who; });
    const now = Date.now();

    for (let i = 0; i < mine.length; i++) {
      const b = mine[i];
      if (b.trangThai !== 'dang_lam') continue;
      const dl = deadline_(gd, b.batDau);
      if (!dl || dl + GRACE_MS > now) return buildPayload_(ss, gd, b, true, null);
      finalize_(ss, gd, b, b.traLoi || [], b.soLanRoiTab, true);
      b.trangThai = 'da_nop';
    }

    if (gd.soLanLam && gd.soLanLam > 0 && mine.length >= gd.soLanLam) {
      throw new Error('Bạn đã hết số lần làm bài cho phép (' + gd.soLanLam + ' lần).');
    }

    const maDes = listAll_(ss, 'MaDe').filter(function (m) { return m.deId === gd.deId && !m.deleted; })
      .sort(function (a, b) { return String(a.maDe).localeCompare(String(b.maDe)); });
    if (!maDes.length) throw new Error('Đề thi chưa có mã đề. Giáo viên cần xáo đề trước khi giao.');
    const mode = String(gd.cheDoMaDe || 'ngau_nhien');
    let md = null;
    if (mode.indexOf('co_dinh:') === 0) {
      const want = mode.slice(8);
      md = maDes.filter(function (m) { return String(m.maDe) === want; })[0] || null;
    } else if (mode === 'lan_luot') {
      md = maDes[all.length % maDes.length];
    }
    if (!md) md = maDes[Math.floor(Math.random() * maDes.length)];

    const row = {
      id: newId_('BaiLam'), giaoDeId: gd.id, deId: gd.deId, maDeId: md.id, maDe: md.maDe,
      hoTen: hoTen, lop: lop, maHS: maHS, batDau: now, traLoi: [], soLanRoiTab: 0,
      trangThai: 'dang_lam', thietBi: String(p.thietBi || '').slice(0, 200)
    };
    const saved = upsert_(ss, 'BaiLam', [row], {}).saved[0];
    log_('layDeThi', gd.maTruyCap + ' – ' + hoTen + ' – ' + lop + ' – mã đề ' + md.maDe);
    return buildPayload_(ss, gd, saved, false, md);
  });
}

function buildPayload_(ss, gd, b, resumed, md) {
  md = md || getById_(ss, 'MaDe', b.maDeId) || {};
  const de = getById_(ss, 'De', gd.deId) || {};
  const qmap = mapById_(ss, 'CauHoi');
  const cauHoi = (md.thuTu || []).map(function (it, i) {
    const q = qmap[it.q] || { loai: 'TN', noiDung: '(Câu hỏi đã bị xoá khỏi ngân hàng)' };
    const pa = Array.isArray(q.phuongAn) ? q.phuongAn : [];
    const opts = it.p && it.p.length ? it.p.map(function (j) { return pa[j]; }) : pa;
    return {
      stt: i + 1, phan: it.phan || '', loai: q.loai || 'TN', noiDung: q.noiDung || '', hinhAnh: q.hinhAnh || '',
      phuongAn: q.loai === 'TN' || q.loai === 'DS' ? opts : []
    };
  });
  return {
    baiLamId: b.id, tieuDe: gd.tieuDe || de.tenDe || '', tenDe: de.tenDe || '', monHoc: de.monHoc || '',
    maDe: md.maDe || b.maDe, hoTen: b.hoTen, lop: b.lop, maHS: b.maHS,
    batDau: b.batDau, hanNop: deadline_(gd, b.batDau), serverTime: Date.now(),
    traLoi: b.traLoi || [], soLanRoiTab: b.soLanRoiTab || 0,
    chongGianLan: !!gd.chongGianLan, tiepTuc: !!resumed, cauHoi: cauHoi
  };
}

function apiLuuNhap(p) {
  const ss = ss_();
  const b = getById_(ss, 'BaiLam', p.baiLamId);
  if (!b) throw new Error('Không tìm thấy bài làm.');
  const gd = getById_(ss, 'GiaoDe', b.giaoDeId) || {};
  if (b.trangThai !== 'dang_lam') return resultFor_(ss, gd, b, false);
  const dl = deadline_(gd, b.batDau);
  if (dl && Date.now() > dl + GRACE_MS) {
    const done = finalize_(ss, gd, b, b.traLoi || [], p.soLanRoiTab, true);
    return resultFor_(ss, gd, done, true);
  }
  upsert_(ss, 'BaiLam', [{
    id: b.id, traLoi: Array.isArray(p.traLoi) ? p.traLoi : (b.traLoi || []),
    soLanRoiTab: Math.max(Number(b.soLanRoiTab || 0), Number(p.soLanRoiTab || 0))
  }], {});
  return { daNop: false, luuLuc: Date.now() };
}

function apiNopBai(p) {
  const ss = ss_();
  const b = getById_(ss, 'BaiLam', p.baiLamId);
  if (!b) throw new Error('Không tìm thấy bài làm.');
  const gd = getById_(ss, 'GiaoDe', b.giaoDeId) || {};
  if (b.trangThai !== 'dang_lam') return resultFor_(ss, gd, b, false);
  const dl = deadline_(gd, b.batDau);
  const late = !!dl && Date.now() > dl + GRACE_MS;
  const traLoi = late ? (b.traLoi || []) : (Array.isArray(p.traLoi) ? p.traLoi : []);
  const done = finalize_(ss, gd, b, traLoi, p.soLanRoiTab, late);
  log_('nopBai', (gd.maTruyCap || '') + ' – ' + b.hoTen + ' – ' + done.diem + '/' + done.tongDiem);
  return resultFor_(ss, gd, done, late);
}

function finalize_(ss, gd, b, traLoi, soLanRoiTab, auto) {
  const md = getById_(ss, 'MaDe', b.maDeId);
  const de = getById_(ss, 'De', gd.deId || b.deId) || {};
  const qmap = mapById_(ss, 'CauHoi');
  const g = grade_(de, md, qmap, traLoi || [], null);
  const dl = deadline_(gd, b.batDau);
  const nopLuc = auto && dl ? Math.min(dl, Date.now()) : Date.now();
  const row = {
    id: b.id, traLoi: traLoi || [], chiTiet: g.chiTiet, diem: g.diem, tongDiem: g.tongDiem, nopLuc: nopLuc,
    thoiGianLam: Math.max(0, Math.round((nopLuc - Number(b.batDau)) / 1000)),
    soLanRoiTab: Math.max(Number(b.soLanRoiTab || 0), Number(soLanRoiTab || 0)),
    trangThai: g.canChamTay ? 'cho_cham' : 'da_nop'
  };
  return upsert_(ss, 'BaiLam', [row], {}).saved[0];
}

function resultFor_(ss, gd, b, late) {
  const r = { daNop: true, nopTre: !!late, trangThai: b.trangThai, nopLuc: b.nopLuc, thoiGianLam: b.thoiGianLam };
  if (gd.hienDiem) {
    r.diem = b.diem;
    r.tongDiem = b.tongDiem;
    r.soCauDung = (b.chiTiet || []).filter(function (c) { return c.dung; }).length;
    r.choChamTuLuan = b.trangThai === 'cho_cham';
  }
  if (gd.hienDapAn) {
    const qmap = mapById_(ss, 'CauHoi');
    r.chiTiet = (b.chiTiet || []).map(function (c) {
      return Object.assign({}, c, { loiGiai: (qmap[c.q] || {}).loiGiai || '' });
    });
  }
  return r;
}
`;

export const SETUP_STEPS = [
  {
    step: 1,
    title: 'Tạo Google Sheet mới',
    desc: 'Truy cập Google Sheets (sheets.new) để tạo một bảng tính trống mới dùng làm cơ sở dữ liệu lưu trữ.'
  },
  {
    step: 2,
    title: 'Mở trình soạn thảo Google Apps Script',
    desc: 'Trên thanh menu Google Sheet, chọn Tiện ích mở rộng (Extensions) > Apps Script. Xóa toàn bộ mã mặc định trong tệp Code.gs.'
  },
  {
    step: 3,
    title: 'Dán toàn bộ mã nguồn máy chủ',
    desc: 'Sao chép toàn bộ mã nguồn Apps Script v1.0.0 ở dưới và dán vào Code.gs rồi bấm Lưu (biểu tượng đĩa mềm).'
  },
  {
    step: 4,
    title: 'Đặt múi giờ Việt Nam',
    desc: 'Vào Cài đặt dự án (biểu tượng bánh răng ở cột trái) > Tích chọn Hiển thị tệp appsscript.json trong trình soạn thảo, hoặc chọn Múi giờ: (GMT+07:00) Asia/Ho_Chi_Minh.'
  },
  {
    step: 5,
    title: 'Triển khai dưới dạng Ứng dụng web (Web App)',
    desc: 'Bấm nút "Triển khai" (Deploy) > "Tùy chọn triển khai mới" (New deployment) > Chọn loại: "Ứng dụng web" (Web app). Thiết lập: Thực thi dưới dạng: Tôi (tài khoản của bạn); Người có quyền truy cập: Bất kỳ ai (Anyone). Bấm "Triển khai", cấp quyền khi Google hỏi, và sao chép "URL ứng dụng web" (kết thúc bằng /exec).'
  },
  {
    step: 6,
    title: 'Kết nối và Khởi tạo',
    desc: 'Dán URL vừa sao chép vào mục "Cài đặt" của ứng dụng này, nhập mật khẩu giáo viên (ít nhất 6 ký tự) và bấm "Khởi tạo hệ thống". Google Sheet của bạn sẽ tự động sinh đầy đủ 9 bảng tính tiêu chuẩn!'
  }
];
