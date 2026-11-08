import React, { useState } from 'react';
import { GiaoDe, De, Lop, BaiLam } from '../../types';
import {
  Plus,
  Send,
  Copy,
  Check,
  Clock,
  Shield,
  Eye,
  RefreshCw,
  Users,
  AlertTriangle,
  Lock,
  X,
  ExternalLink
} from 'lucide-react';

interface Props {
  assignments: GiaoDe[];
  exams: De[];
  classes: Lop[];
  submissions: BaiLam[];
  onSaveAssignment: (assignment: GiaoDe) => Promise<void>;
  onDeleteAssignment: (id: string) => Promise<void>;
  onReGradeAssignment: (assignmentId: string) => Promise<void>;
}

export const ExamAssignmentTab: React.FC<Props> = ({
  assignments,
  exams,
  classes,
  submissions,
  onSaveAssignment,
  onDeleteAssignment,
  onReGradeAssignment
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [monitoringGd, setMonitoringGd] = useState<GiaoDe | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [regrading, setRegrading] = useState<string | null>(null);

  // Form State
  const [selectedDeId, setSelectedDeId] = useState(exams[0]?.id || '');
  const [tieuDe, setTieuDe] = useState('');
  const [maTruyCap, setMaTruyCap] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [selectedLopIds, setSelectedLopIds] = useState<string[]>([]);
  const [thoiLuong, setThoiLuong] = useState(45);
  const [soLanLam, setSoLanLam] = useState(1);
  const [hienDiem, setHienDiem] = useState(true);
  const [hienDapAn, setHienDapAn] = useState(true);
  const [yeuCauDanhSach, setYeuCauDanhSach] = useState(false);
  const [chongGianLan, setChongGianLan] = useState(true);
  const [saving, setSaving] = useState(false);

  const lopMap = new Map<string, string>();
  classes.forEach((l) => lopMap.set(l.id, l.tenLop));

  const examMap = new Map<string, De>();
  exams.forEach((d) => examMap.set(d.id, d));

  const handleOpenAdd = () => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setMaTruyCap(randomCode);
    const firstExam = exams[0];
    if (firstExam) {
      setSelectedDeId(firstExam.id);
      setTieuDe(`Kiểm tra ${firstExam.monHoc} - ${firstExam.tenDe}`);
      setThoiLuong(firstExam.thoiGian || 45);
    }
    setMatKhau('');
    setSelectedLopIds(classes.map((c) => c.id));
    setSoLanLam(1);
    setHienDiem(true);
    setHienDapAn(true);
    setYeuCauDanhSach(false);
    setChongGianLan(true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tieuDe.trim()) {
      alert('Vui lòng nhập tiêu đề đợt giao đề.');
      return;
    }
    if (!maTruyCap.trim()) {
      alert('Vui lòng nhập hoặc sinh mã truy cập 6 ký tự.');
      return;
    }

    setSaving(true);
    try {
      const now = Date.now();
      const newAssignment: GiaoDe = {
        id: 'GD_' + Date.now().toString(36),
        deId: selectedDeId,
        tieuDe: tieuDe.trim(),
        lopIds: selectedLopIds,
        maTruyCap: maTruyCap.trim().toUpperCase(),
        matKhau: matKhau.trim(),
        batDau: now,
        ketThuc: now + 7 * 86400000, // 7 days default
        thoiLuong: Number(thoiLuong),
        soLanLam: Number(soLanLam),
        cheDoMaDe: 'ngau_nhien',
        hienDiem,
        hienDapAn,
        yeuCauDanhSach,
        chongGianLan,
        trangThai: 'mo',
        createdAt: now,
        updatedAt: now
      };

      await onSaveAssignment(newAssignment);
      setIsModalOpen(false);
    } catch (e: any) {
      alert('Lỗi khi giao đề: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (gd: GiaoDe) => {
    const nextStatus = gd.trangThai === 'mo' ? 'dong' : 'mo';
    await onSaveAssignment({
      ...gd,
      trangThai: nextStatus as any,
      updatedAt: Date.now()
    });
  };

  const handleReGrade = async (id: string) => {
    if (confirm('Bạn có muốn chấm lại toàn bộ các bài thi đã nộp của đợt này?')) {
      setRegrading(id);
      try {
        await onReGradeAssignment(id);
        alert('Đã chấm lại toàn bộ bài thi thành công!');
      } catch (e: any) {
        alert('Lỗi chấm lại: ' + e.message);
      } finally {
        setRegrading(null);
      }
    }
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Quản lý Đợt thi & Giao đề ({assignments.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấp mã phòng thi cho học sinh, cài đặt thời gian, bảo mật và giám sát chống gian lận
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Giao đề thi mới</span>
        </button>
      </div>

      {/* Assignment List */}
      <div className="space-y-4">
        {assignments.map((gd) => {
          const subs = submissions.filter((s) => s.giaoDeId === gd.id);
          const activeTaking = subs.filter((s) => s.trangThai === 'dang_lam');
          const de = examMap.get(gd.deId);
          const isOpen = gd.trangThai === 'mo';

          return (
            <div
              key={gd.id}
              className={`bg-white rounded-xl border p-5 shadow-xs transition-all space-y-4 ${
                isOpen ? 'border-slate-200/90' : 'border-slate-200/50 opacity-80'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-base font-bold text-slate-900">
                      {gd.tieuDe}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        isOpen
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isOpen ? 'Đang mở thi' : 'Đã đóng'}
                    </span>
                    {gd.chongGianLan && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        <Shield className="w-3 h-3" />
                        <span>Chống gian lận</span>
                      </span>
                    )}
                    {gd.matKhau && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Lock className="w-3 h-3" />
                        <span>Có mật khẩu</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>Đề gốc: {de?.tenDe || gd.deId}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{gd.thoiLuong ? `${gd.thoiLuong} phút` : 'Tự do'}</span>
                    </span>
                    <span>·</span>
                    <span>
                      Lớp: {gd.lopIds?.length ? gd.lopIds.map((lid) => lopMap.get(lid) || lid).join(', ') : 'Tất cả học sinh'}
                    </span>
                  </div>
                </div>

                {/* Room Code Badge */}
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <span className="text-xs text-slate-500">Mã phòng:</span>
                    <span className="font-mono font-bold text-base text-indigo-700 tracking-wider">
                      {gd.maTruyCap}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(gd.maTruyCap)}
                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                    title="Sao chép mã phòng thi"
                  >
                    {copiedCode === gd.maTruyCap ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Status & Monitoring Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/70 p-3 rounded-lg border border-slate-200/60">
                <div>
                  <span className="text-slate-400 block">Bài đã nộp</span>
                  <span className="font-bold text-slate-800 text-sm font-mono">
                    {subs.filter((s) => s.trangThai !== 'dang_lam').length}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Đang làm bài</span>
                  <span className="font-bold text-indigo-600 text-sm font-mono">
                    {activeTaking.length}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Xem điểm / Lời giải</span>
                  <span className="font-semibold text-slate-700">
                    {gd.hienDiem ? 'Xem điểm ngay' : 'Ẩn điểm'} · {gd.hienDapAn ? 'Hiện giải' : 'Ẩn giải'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Số lần làm tối đa</span>
                  <span className="font-semibold text-slate-700 font-mono">
                    {gd.soLanLam === 0 ? 'Không giới hạn' : `${gd.soLanLam} lần`}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMonitoringGd(gd)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Giám sát phòng thi ({activeTaking.length} đang làm)</span>
                  </button>

                  <button
                    onClick={() => handleReGrade(gd.id)}
                    disabled={regrading === gd.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    title="Chấm lại toàn bộ bài nộp theo đáp án mới nhất"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${regrading === gd.id ? 'animate-spin' : ''}`} />
                    <span>Chấm lại đề này</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(gd)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      isOpen
                        ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {isOpen ? 'Đóng phòng thi' : 'Mở lại phòng thi'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monitoring Modal */}
      {monitoringGd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Giám sát trực tiếp: {monitoringGd.tieuDe}
                </h3>
                <div className="text-xs text-slate-500">
                  Mã phòng: <strong className="font-mono text-indigo-700">{monitoringGd.maTruyCap}</strong>
                </div>
              </div>
              <button onClick={() => setMonitoringGd(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Thí sinh tham gia phòng thi
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                {submissions.filter((s) => s.giaoDeId === monitoringGd.id).length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    Chưa có thí sinh nào vào phòng thi này.
                  </div>
                ) : (
                  submissions
                    .filter((s) => s.giaoDeId === monitoringGd.id)
                    .map((sub) => {
                      const isDoing = sub.trangThai === 'dang_lam';
                      return (
                        <div key={sub.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <div className="font-bold text-slate-900">{sub.hoTen}</div>
                            <div className="text-slate-400 text-[11px]">
                              Lớp {sub.lop} · Mã đề: {sub.maDe} · Bắt đầu: {new Date(sub.batDau).toLocaleTimeString('vi-VN')}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {sub.soLanRoiTab && sub.soLanRoiTab > 0 ? (
                              <span className="flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>{sub.soLanRoiTab} lần rời tab</span>
                              </span>
                            ) : null}

                            <span
                              className={`px-2 py-0.5 rounded font-semibold ${
                                isDoing
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isDoing ? 'Đang làm bài...' : `Đã nộp (${sub.diem}/${sub.tongDiem}đ)`}
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                Giao bài thi mới cho học sinh
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn bộ đề thi gốc
                </label>
                <select
                  value={selectedDeId}
                  onChange={(e) => {
                    setSelectedDeId(e.target.value);
                    const selected = examMap.get(e.target.value);
                    if (selected) {
                      setTieuDe(`Kiểm tra ${selected.monHoc} - ${selected.tenDe}`);
                      setThoiLuong(selected.thoiGian || 45);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-medium"
                >
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.tenDe} ({exam.monHoc} - {exam.thoiGian} phút)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiêu đề hiển thị cho thí sinh
                </label>
                <input
                  type="text"
                  value={tieuDe}
                  onChange={(e) => setTieuDe(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-bold"
                  placeholder="Kiểm tra 1 tiết, Đề thi học kỳ..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã phòng thi (6 ký tự)
                  </label>
                  <input
                    type="text"
                    value={maTruyCap}
                    onChange={(e) => setMaTruyCap(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono font-bold text-indigo-700 uppercase"
                    maxLength={6}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mật khẩu vào thi (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={matKhau}
                    onChange={(e) => setMatKhau(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    placeholder="Bỏ trống nếu không cần"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thời lượng làm bài (phút)
                  </label>
                  <input
                    type="number"
                    value={thoiLuong}
                    onChange={(e) => setThoiLuong(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số lần làm bài tối đa
                  </label>
                  <input
                    type="number"
                    value={soLanLam}
                    onChange={(e) => setSoLanLam(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                    min={0}
                    placeholder="0 = Không giới hạn"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 space-y-2.5 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chongGianLan"
                    checked={chongGianLan}
                    onChange={(e) => setChongGianLan(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <label htmlFor="chongGianLan" className="text-xs text-slate-700 font-semibold cursor-pointer">
                    Bật giám sát chống gian lận (ghi nhận số lần chuyển tab, phím tắt, rời màn hình)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hienDiem"
                    checked={hienDiem}
                    onChange={(e) => setHienDiem(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <label htmlFor="hienDiem" className="text-xs text-slate-700 cursor-pointer">
                    Cho phép học sinh xem điểm ngay sau khi nộp bài
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hienDapAn"
                    checked={hienDapAn}
                    onChange={(e) => setHienDapAn(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <label htmlFor="hienDapAn" className="text-xs text-slate-700 cursor-pointer">
                    Cho phép học sinh xem chi tiết đáp án & lời giải sau khi nộp bài
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  {saving ? 'Đang tạo phòng thi...' : 'Tạo phòng thi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
