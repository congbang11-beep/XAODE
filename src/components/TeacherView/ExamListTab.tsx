import React, { useState } from 'react';
import { De, MaDe, CauHoi, GiaoDe } from '../../types';
import { FormulaRenderer } from '../FormulaRenderer';
import {
  Plus,
  Shuffle,
  FileText,
  Trash2,
  Eye,
  Send,
  CheckCircle2,
  Clock,
  Layers,
  X,
  Printer
} from 'lucide-react';

interface Props {
  exams: De[];
  maDes: MaDe[];
  questions: CauHoi[];
  onSaveExam: (exam: De, generatedMaDes?: MaDe[]) => Promise<void>;
  onDeleteExam: (id: string) => Promise<void>;
  onAssignExam: (examId: string) => void;
}

export const ExamListTab: React.FC<Props> = ({
  exams,
  maDes,
  questions,
  onSaveExam,
  onDeleteExam,
  onAssignExam
}) => {
  const [selectedExam, setSelectedExam] = useState<De | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isShuffleOpen, setIsShuffleOpen] = useState(false);
  const [shuffleExam, setShuffleExam] = useState<De | null>(null);
  const [numVariants, setNumVariants] = useState(4); // default 4 test codes (101, 102, 103, 104)

  // Creation form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Toán');
  const [newGrade, setNewGrade] = useState(12);
  const [newDuration, setNewDuration] = useState(45);
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const qMap = new Map<string, CauHoi>();
  questions.forEach((q) => qMap.set(q.id, q));

  const handleOpenCreate = () => {
    setNewTitle('Đề kiểm tra định kỳ ' + newSubject + ' ' + newGrade);
    setSelectedQIds(questions.slice(0, 10).map((q) => q.id));
    setIsCreateOpen(true);
  };

  const handleToggleSelectQuestion = (id: string) => {
    setSelectedQIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Vui lòng nhập tên đề thi.');
      return;
    }
    if (selectedQIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 câu hỏi vào đề.');
      return;
    }

    setCreating(true);
    try {
      const examId = 'DE_' + Date.now().toString(36);
      const newExam: De = {
        id: examId,
        tenDe: newTitle.trim(),
        monHoc: newSubject,
        khoi: newGrade,
        thoiGian: newDuration,
        cauHoiIds: selectedQIds,
        trangThai: 'chinh_thuc',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Auto generate standard MaDe 101
      const initialMaDe: MaDe = {
        id: 'MD_' + Date.now().toString(36),
        deId: examId,
        maDe: '101',
        thuTu: selectedQIds.map((qid) => {
          const q = qMap.get(qid);
          const phan =
            q?.loai === 'TN'
              ? 'Phần I: Trắc nghiệm 4 lựa chọn'
              : q?.loai === 'DS'
              ? 'Phần II: Đúng / Sai'
              : q?.loai === 'TLN'
              ? 'Phần III: Trả lời ngắn'
              : 'Phần IV: Tự luận';
          return {
            q: qid,
            p: [0, 1, 2, 3],
            phan
          };
        }),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await onSaveExam(newExam, [initialMaDe]);
      setIsCreateOpen(false);
    } catch (e: any) {
      alert('Lỗi tạo đề thi: ' + e.message);
    } finally {
      setCreating(false);
    }
  };

  // Shuffle generator: creates multiple MaDe with permutations
  const handleShuffle = async () => {
    if (!shuffleExam) return;
    const count = Math.min(Math.max(1, numVariants), 24);
    const generated: MaDe[] = [];
    const baseIds = shuffleExam.cauHoiIds || [];

    // Group questions by type to keep parts in order (Phần I, II, III, IV)
    const tnIds = baseIds.filter((id) => qMap.get(id)?.loai === 'TN');
    const dsIds = baseIds.filter((id) => qMap.get(id)?.loai === 'DS');
    const tlnIds = baseIds.filter((id) => qMap.get(id)?.loai === 'TLN');
    const tlIds = baseIds.filter((id) => qMap.get(id)?.loai === 'TL');

    const shuffleArr = <T,>(arr: T[], keepFixed: (item: T) => boolean): T[] => {
      const result = [...arr];
      for (let i = result.length - 1; i > 0; i--) {
        if (keepFixed(result[i])) continue;
        const j = Math.floor(Math.random() * (i + 1));
        if (keepFixed(result[j])) continue;
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    };

    const permuteOptions = (): number[] => {
      const p = [0, 1, 2, 3];
      for (let i = p.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
      }
      return p;
    };

    for (let codeIdx = 1; codeIdx <= count; codeIdx++) {
      const codeStr = String(100 + codeIdx);

      // Shuffle within each part
      const sTn = shuffleArr(tnIds, (id) => !!qMap.get(id)?.khongTron);
      const sDs = shuffleArr(dsIds, (id) => !!qMap.get(id)?.khongTron);
      const sTln = shuffleArr(tlnIds, (id) => !!qMap.get(id)?.khongTron);
      const sTl = shuffleArr(tlIds, (id) => !!qMap.get(id)?.khongTron);

      const items = [
        ...sTn.map((id) => ({
          q: id,
          p: qMap.get(id)?.khongTron ? [0, 1, 2, 3] : permuteOptions(),
          phan: 'Phần I: Trắc nghiệm 4 lựa chọn'
        })),
        ...sDs.map((id) => ({
          q: id,
          p: [0, 1, 2, 3], // keep a, b, c, d order in statements for clarity
          phan: 'Phần II: Đúng / Sai'
        })),
        ...sTln.map((id) => ({
          q: id,
          phan: 'Phần III: Trả lời ngắn'
        })),
        ...sTl.map((id) => ({
          q: id,
          phan: 'Phần IV: Tự luận'
        }))
      ];

      generated.push({
        id: 'MD_' + Date.now().toString(36) + '_' + codeStr,
        deId: shuffleExam.id,
        maDe: codeStr,
        thuTu: items,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }

    await onSaveExam(shuffleExam, generated);
    setIsShuffleOpen(false);
    alert(`Đã xáo và sinh thành công ${count} mã đề (${generated.map((m) => m.maDe).join(', ')})!`);
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Quản lý Đề thi & Trộn mã đề ({exams.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Soạn đề từ ngân hàng, tự động xáo hoán vị phương án và sinh các mã đề phân tán
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo đề thi mới</span>
        </button>
      </div>

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {exams.map((exam) => {
          const examMaDes = maDes.filter((m) => m.deId === exam.id);
          return (
            <div
              key={exam.id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Môn {exam.monHoc} · Khối {exam.khoi}
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{exam.thoiGian} phút</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                  {exam.tenDe}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {exam.moTa || 'Đề thi theo chuẩn cấu trúc kỳ thi tốt nghiệp THPT 2025.'}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Số câu: <strong>{exam.cauHoiIds.length}</strong></span>
                  <span>
                    Mã đề đã sinh:{' '}
                    <strong>{examMaDes.length > 0 ? examMaDes.map((m) => m.maDe).join(', ') : 'Chưa có'}</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedExam(exam);
                      setIsPreviewOpen(true);
                    }}
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                    title="Xem chi tiết đề & đáp án"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setShuffleExam(exam);
                      setIsShuffleOpen(true);
                    }}
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                    title="Trộn đề & Tạo mã đề mới"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn xóa đề thi này?')) {
                        onDeleteExam(exam.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                    title="Xóa đề thi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => onAssignExam(exam.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Giao đề</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Shuffle Dialog */}
      {isShuffleOpen && shuffleExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Xáo đề & Sinh mã đề ngẫu nhiên
              </h3>
              <button onClick={() => setIsShuffleOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Thuật toán sẽ tự động hoán vị thứ tự các câu hỏi trong từng phần và hoán vị 4 phương án A, B, C, D của từng câu trắc nghiệm (các câu đánh dấu "Cố định vị trí" sẽ được giữ nguyên).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số lượng mã đề muốn sinh:
              </label>
              <select
                value={numVariants}
                onChange={(e) => setNumVariants(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-bold text-indigo-700"
              >
                <option value={2}>2 mã đề (101, 102)</option>
                <option value={4}>4 mã đề (101, 102, 103, 104) · Khuyên dùng</option>
                <option value={6}>6 mã đề (101 đến 106)</option>
                <option value={8}>8 mã đề (101 đến 108)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsShuffleOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleShuffle}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                Bắt đầu trộn đề
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Preview Modal */}
      {isPreviewOpen && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedExam.tenDe}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Môn {selectedExam.monHoc} · Khối {selectedExam.khoi} · {selectedExam.thoiGian} phút · {selectedExam.cauHoiIds.length} câu hỏi
                </div>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedExam.cauHoiIds.map((qid, idx) => {
                const q = qMap.get(qid);
                if (!q) return null;
                return (
                  <div key={qid} className="p-4 rounded-lg border border-slate-200 bg-slate-50/40 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Câu {idx + 1} ({q.loai})</span>
                      <span className="font-mono">{q.diem || 0.25} điểm</span>
                    </div>
                    <FormulaRenderer content={q.noiDung} className="text-xs text-slate-800 font-medium" />

                    {q.phuongAn && q.phuongAn.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {q.phuongAn.map((opt, oIdx) => (
                          <div key={oIdx} className="p-2 rounded bg-white border border-slate-200">
                            <strong>{String.fromCharCode(65 + oIdx)}.</strong> {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-emerald-800 font-bold bg-emerald-50 p-2 rounded border border-emerald-200">
                      Đáp án gốc: {q.dapAn}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Create Exam Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                Tạo đề thi mới từ ngân hàng câu hỏi
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên đề thi
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-bold"
                    placeholder="Tên đề thi..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thời lượng làm bài (phút)
                  </label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Question Picker List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Chọn câu hỏi vào đề ({selectedQIds.length} câu đã chọn)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedQIds.length === questions.length) setSelectedQIds([]);
                      else setSelectedQIds(questions.map((q) => q.id));
                    }}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    {selectedQIds.length === questions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {questions.map((q, idx) => {
                    const isSelected = selectedQIds.includes(q.id);
                    return (
                      <div
                        key={q.id}
                        onClick={() => handleToggleSelectQuestion(q.id)}
                        className={`p-3 text-xs flex items-start gap-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by wrapper click
                          className="mt-0.5 rounded text-indigo-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-800">
                              Câu {idx + 1}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px]">
                              {q.loai}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {q.monHoc} · {q.chuDe}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-slate-600 font-normal">
                            {q.noiDung}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  {creating ? 'Đang tạo...' : 'Tạo đề thi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
