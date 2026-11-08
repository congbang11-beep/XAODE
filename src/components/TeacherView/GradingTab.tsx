import React, { useState } from 'react';
import { BaiLam, GiaoDe, De, CauHoi } from '../../types';
import { FormulaRenderer } from '../FormulaRenderer';
import {
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  Edit3,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface Props {
  submissions: BaiLam[];
  assignments: GiaoDe[];
  exams: De[];
  questions: CauHoi[];
  onManualGrade: (baiLamId: string, scores: Record<string, number | null>) => Promise<void>;
}

export const GradingTab: React.FC<Props> = ({
  submissions,
  assignments,
  exams,
  questions,
  onManualGrade
}) => {
  const [filterAssignment, setFilterAssignment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  // Selected submission to view / grade
  const [selectedSub, setSelectedSub] = useState<BaiLam | null>(null);
  const [manualScores, setManualScores] = useState<Record<string, number | null>>({});
  const [savingGrade, setSavingGrade] = useState(false);

  const qMap = new Map<string, CauHoi>();
  questions.forEach((q) => qMap.set(q.id, q));

  const filteredSubs = submissions.filter((s) => {
    if (filterAssignment !== 'all' && s.giaoDeId !== filterAssignment) return false;
    if (filterStatus !== 'all' && s.trangThai !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.hoTen.toLowerCase().includes(q) ||
        s.lop.toLowerCase().includes(q) ||
        (s.maHS || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenDetail = (s: BaiLam) => {
    setSelectedSub(s);
    const initialScores: Record<string, number | null> = {};
    (s.chiTiet || []).forEach((c) => {
      if (c.loai === 'TL') {
        initialScores[c.stt] = c.diem;
      }
    });
    setManualScores(initialScores);
  };

  const handleSaveManualGrade = async () => {
    if (!selectedSub) return;
    setSavingGrade(true);
    try {
      await onManualGrade(selectedSub.id, manualScores);
      alert('Đã cập nhật điểm chấm tay thành công!');
      setSelectedSub(null);
    } catch (e: any) {
      alert('Lỗi chấm bài: ' + e.message);
    } finally {
      setSavingGrade(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredSubs.length === 0) {
      alert('Không có dữ liệu để xuất.');
      return;
    }
    let csv = '\uFEFFHọ và tên,Lớp,Mã học sinh,Mã đề,Thời gian làm (phút),Điểm số,Tổng điểm,Số lần rời tab,Trạng thái\n';
    filteredSubs.forEach((s) => {
      const mins = s.thoiGianLam ? Math.round(s.thoiGianLam / 60) : 0;
      csv += `"${s.hoTen}","${s.lop}","${s.maHS || ''}","${s.maDe}","${mins}","${s.diem || 0}","${s.tongDiem || 0}","${s.soLanRoiTab || 0}","${s.trangThai}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bang_diem_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Chấm thi & Kết quả ({filteredSubs.length} bài)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem bảng điểm, đối chiếu câu trả lời, chấm tay tự luận và xuất báo cáo kết quả
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Xuất bảng điểm CSV</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo họ tên, lớp, mã HS..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={filterAssignment}
              onChange={(e) => setFilterAssignment(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="all">Tất cả đợt giao đề</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.tieuDe} (Mã: {a.maTruyCap})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="da_nop">Đã nộp & Đã chấm</option>
              <option value="cho_cham">Chờ chấm tự luận (TL)</option>
              <option value="dang_lam">Đang làm bài</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Thí sinh</th>
                <th className="py-3 px-3">Lớp & Mã HS</th>
                <th className="py-3 px-3">Mã đề</th>
                <th className="py-3 px-3">Thời gian</th>
                <th className="py-3 px-3">Rời tab</th>
                <th className="py-3 px-3 text-right">Điểm số</th>
                <th className="py-3 px-3 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Chưa có bài nộp nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredSubs.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {s.hoTen}
                    </td>
                    <td className="py-3 px-3">
                      <div>Lớp {s.lop}</div>
                      {s.maHS && <div className="text-[11px] text-slate-400 font-mono">{s.maHS}</div>}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                      {s.maDe}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {s.thoiGianLam ? `${Math.round(s.thoiGianLam / 60)} phút` : '--'}
                    </td>
                    <td className="py-3 px-3">
                      {s.soLanRoiTab && s.soLanRoiTab > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{s.soLanRoiTab}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-sm">
                      {s.trangThai === 'cho_cham' ? (
                        <span className="text-amber-600 text-xs font-semibold">Chờ chấm</span>
                      ) : (
                        <span>
                          {s.diem} <span className="text-slate-400 text-xs font-normal">/ {s.tongDiem}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          s.trangThai === 'da_nop'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.trangThai === 'cho_cham'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {s.trangThai === 'da_nop'
                          ? 'Đã chấm'
                          : s.trangThai === 'cho_cham'
                          ? 'Chờ chấm TL'
                          : 'Đang làm'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(s)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                      >
                        {s.trangThai === 'cho_cham' ? 'Chấm bài' : 'Xem chi tiết'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submission Detail / Manual Grading Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Bài làm của {selectedSub.hoTen} · Lớp {selectedSub.lop} (Mã đề {selectedSub.maDe})
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Điểm hiện tại: <strong className="text-slate-900">{selectedSub.diem} / {selectedSub.tongDiem}</strong>
                  {selectedSub.soLanRoiTab && selectedSub.soLanRoiTab > 0 && (
                    <span className="text-rose-600 font-semibold ml-2">
                      · Cảnh báo: {selectedSub.soLanRoiTab} lần rời tab thi
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedSub(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(selectedSub.chiTiet || []).map((c, i) => {
                const q = qMap.get(c.q);
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border space-y-2.5 ${
                      c.loai === 'TL'
                        ? 'border-indigo-200 bg-indigo-50/20'
                        : c.dung
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">
                        Câu {c.stt} ({c.loai})
                      </span>
                      <span className="font-mono font-bold">
                        {c.diem !== null ? `${c.diem} / ${c.diemToiDa} điểm` : `Tối đa ${c.diemToiDa} điểm`}
                      </span>
                    </div>

                    <FormulaRenderer content={q?.noiDung || ''} className="text-xs text-slate-800" />

                    {/* Answer Comparison */}
                    <div className="pt-2 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 w-24">Bài làm:</span>
                        <span className="font-bold font-mono text-slate-900">
                          {c.traLoi !== null && c.traLoi !== undefined && c.traLoi !== '' ? String(c.traLoi) : '(Bỏ trống)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 w-24">Đáp án đúng:</span>
                        <span className="font-bold font-mono text-emerald-700">
                          {String(c.dapAn)}
                        </span>
                      </div>
                    </div>

                    {/* Manual Grading for TL questions */}
                    {c.loai === 'TL' && (
                      <div className="mt-3 p-3 bg-white border border-indigo-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-indigo-900">
                            Nhập điểm tự luận cho câu này:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.1"
                              max={c.diemToiDa}
                              min={0}
                              value={manualScores[c.stt] ?? ''}
                              onChange={(e) =>
                                setManualScores({
                                  ...manualScores,
                                  [c.stt]: e.target.value === '' ? null : Number(e.target.value)
                                })
                              }
                              className="w-20 px-2 py-1 text-xs border border-indigo-300 rounded font-mono font-bold text-indigo-700"
                              placeholder="0.0"
                            />
                            <span className="text-xs text-slate-500 font-mono">/ {c.diemToiDa} điểm</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50">
              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Đóng
              </button>
              <button
                onClick={handleSaveManualGrade}
                disabled={savingGrade}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                {savingGrade ? 'Đang lưu điểm...' : 'Lưu kết quả chấm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
