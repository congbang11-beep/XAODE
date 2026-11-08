import React from 'react';
import { CauHoi, De, GiaoDe, BaiLam } from '../../types';
import {
  HelpCircle,
  FileText,
  Send,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Users,
  Copy,
  Check
} from 'lucide-react';

interface Props {
  questions: CauHoi[];
  exams: De[];
  assignments: GiaoDe[];
  submissions: BaiLam[];
  onNavigate: (tab: string) => void;
  onOpenNewQuestion: () => void;
  onOpenNewExam: () => void;
  onOpenNewAssignment: () => void;
}

export const DashboardTab: React.FC<Props> = ({
  questions,
  exams,
  assignments,
  submissions,
  onNavigate,
  onOpenNewQuestion,
  onOpenNewExam,
  onOpenNewAssignment
}) => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const activeAssignments = assignments.filter((a) => a.trangThai === 'mo');
  const needGradingCount = submissions.filter((s) => s.trangThai === 'cho_cham').length;

  // Breakdown by types
  const tnCount = questions.filter((q) => q.loai === 'TN').length;
  const dsCount = questions.filter((q) => q.loai === 'DS').length;
  const tlnCount = questions.filter((q) => q.loai === 'TLN').length;
  const tlCount = questions.filter((q) => q.loai === 'TL').length;

  // Average score
  const gradedSubmissions = submissions.filter((s) => s.diem !== null && s.diem !== undefined);
  const avgScore = gradedSubmissions.length
    ? (gradedSubmissions.reduce((acc, curr) => acc + (curr.diem || 0), 0) / gradedSubmissions.length).toFixed(1)
    : '0';

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-8 py-2">
      {/* Top Banner / Welcome */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Hệ thống Quản lý Khảo thí & Ngân hàng Đề thi
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Hỗ trợ đầy đủ 4 dạng câu hỏi chuẩn Bộ GD&ĐT 2025: Trắc nghiệm 4 lựa chọn, Trắc nghiệm Đúng/Sai đa cấp điểm, Trả lời ngắn và Tự luận. Dữ liệu đồng bộ trực tiếp với Google Sheet qua Google Apps Script.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenNewQuestion}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm câu hỏi</span>
          </button>
          <button
            onClick={onOpenNewAssignment}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Giao bài thi mới</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ngân hàng câu hỏi
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {questions.length}
            </span>
            <span className="text-xs text-slate-500">câu hỏi</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
            <span>TN: {tnCount}</span>
            <span>·</span>
            <span>Đ/S: {dsCount}</span>
            <span>·</span>
            <span>TLN: {tlnCount}</span>
            <span>·</span>
            <span>TL: {tlCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Đề thi đã tạo
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {exams.length}
            </span>
            <span className="text-xs text-slate-500">bộ đề</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Hỗ trợ xáo đề, hoán vị phương án & ma trận chuẩn
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Phòng thi đang mở
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 font-mono tabular-nums">
              {activeAssignments.length}
            </span>
            <span className="text-xs text-slate-500">đợt thi trực tuyến</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Mã truy cập 6 ký tự bảo mật
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Bài nộp & Điểm TB
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {submissions.length}
            </span>
            <span className="text-xs text-slate-500">
              bài nộp (ĐTB: <span className="font-semibold text-slate-700 font-mono">{avgScore}</span>)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {needGradingCount > 0 ? (
              <span className="text-amber-600 font-medium">
                {needGradingCount} bài chờ chấm tự luận
              </span>
            ) : (
              'Tất cả đã được chấm điểm'
            )}
          </div>
        </div>
      </div>

      {/* Active Assignments & Recent Submissions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Assignments (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Đợt thi đang diễn ra
              </h2>
              <p className="text-xs text-slate-500">
                Cung cấp mã bài thi 6 ký tự cho học sinh để bắt đầu làm bài
              </p>
            </div>
            <button
              onClick={() => onNavigate('assignments')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeAssignments.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              Chưa có đợt thi nào đang mở. Bấm "Giao bài thi mới" để tạo phòng thi.
            </div>
          ) : (
            <div className="space-y-3">
              {activeAssignments.map((a) => {
                const subCount = submissions.filter((s) => s.giaoDeId === a.id).length;
                return (
                  <div
                    key={a.id}
                    className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {a.tieuDe}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          Đang mở
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{a.thoiLuong ? `${a.thoiLuong} phút` : 'Tự do'}</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{subCount} bài đã nộp</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <div className="flex items-center bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
                        <span className="text-xs text-slate-500 mr-2">Mã thi:</span>
                        <span className="font-mono font-bold text-indigo-700 tracking-wider text-sm">
                          {a.maTruyCap}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(a.maTruyCap)}
                        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg border border-slate-200 transition-colors"
                        title="Sao chép mã bài thi"
                      >
                        {copiedCode === a.maTruyCap ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Submissions (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Bài nộp gần đây
              </h2>
              <p className="text-xs text-slate-500">
                Danh sách thí sinh vừa nộp bài
              </p>
            </div>
            <button
              onClick={() => onNavigate('grading')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Chấm điểm</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {submissions.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              Chưa có bài thi nào được nộp.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {submissions.slice(0, 5).map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {s.hoTen}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Lớp {s.lop} · Mã đề: {s.maDe}
                      {s.soLanRoiTab && s.soLanRoiTab > 0 ? (
                        <span className="text-amber-600 ml-1">
                          ({s.soLanRoiTab} lần rời tab)
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right">
                    {s.trangThai === 'cho_cham' ? (
                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        Chờ chấm TL
                      </span>
                    ) : (
                      <div className="font-mono font-bold text-sm text-slate-900">
                        {s.diem} <span className="text-xs text-slate-400 font-normal">/ {s.tongDiem}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2025 Exam Structure Feature Overview */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">
              Quy chuẩn đề thi THPT từ năm 2025
            </span>
            <h3 className="text-lg font-bold mt-1">
              Hệ thống đáp ứng toàn diện 3 phần thi theo thông tư của Bộ Giáo dục & Đào tạo
            </h3>
            <p className="text-xs text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Phần I: Trắc nghiệm 4 lựa chọn (0.25đ/câu) · Phần II: Trắc nghiệm Đúng/Sai đa cấp điểm (đúng 1 ý: 0.1đ; 2 ý: 0.25đ; 3 ý: 0.5đ; 4 ý: 1.0đ) · Phần III: Trả lời ngắn tự điền số/phân số (0.5đ/câu).
            </p>
          </div>
          <button
            onClick={() => onNavigate('questions')}
            className="self-start md:self-center px-4 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg whitespace-nowrap transition-colors"
          >
            Quản lý ngân hàng câu hỏi
          </button>
        </div>
      </div>
    </div>
  );
};
