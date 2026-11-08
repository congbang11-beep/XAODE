import React, { useEffect } from 'react';
import { NopBaiResponse } from '../../types';
import { FormulaRenderer } from '../FormulaRenderer';
import confetti from 'canvas-confetti';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Award,
  BookOpen,
  AlertCircle
} from 'lucide-react';

interface Props {
  result: NopBaiResponse;
  onExit: () => void;
}

export const ExamResult: React.FC<Props> = ({ result, onExit }) => {
  useEffect(() => {
    // Fire festive celebratory confetti on submission
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  }, []);

  const mins = Math.floor((result.thoiGianLam || 0) / 60);
  const secs = (result.thoiGianLam || 0) % 60;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* Top Completion Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Nộp bài thi thành công!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Bài thi của bạn đã được ghi nhận an toàn vào cơ sở dữ liệu hệ thống
          </p>
        </div>

        {/* Score Display (if enabled) */}
        {result.diem !== undefined ? (
          <div className="py-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Điểm số của bạn
            </span>
            <div className="text-5xl font-extrabold text-indigo-700 font-mono tracking-tight">
              {result.diem}
              <span className="text-2xl text-slate-400 font-normal"> / {result.tongDiem}</span>
            </div>
            {result.choChamTuLuan && (
              <div className="mt-2 text-xs text-amber-700 font-semibold bg-amber-50 border border-amber-200 py-1 px-3 rounded-full inline-block">
                Bài có phần tự luận đang chờ giáo viên chấm bổ sung điểm
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl max-w-sm mx-auto">
            Giáo viên đã cài đặt ẩn điểm của đợt thi này cho đến khi kết thúc thời gian thi chung.
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-4 border-t border-slate-100 text-xs">
          {result.soCauDung !== undefined && (
            <div className="p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 block">Số câu đúng</span>
              <span className="font-bold text-emerald-700 font-mono text-base">
                {result.soCauDung} câu
              </span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50">
            <span className="text-slate-400 block">Thời gian làm bài</span>
            <span className="font-bold text-slate-800 font-mono text-base">
              {mins}p {secs}s
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 col-span-2 sm:col-span-1">
            <span className="text-slate-400 block">Thời điểm nộp</span>
            <span className="font-bold text-slate-800 text-xs mt-1 block">
              {new Date(result.nopLuc).toLocaleTimeString('vi-VN')}
            </span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onExit}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Trở về màn hình chính</span>
          </button>
        </div>
      </div>

      {/* Detailed Solution / Answers Review (if enabled) */}
      {result.chiTiet && result.chiTiet.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Đối chiếu kết quả & Lời giải chi tiết</span>
            </h2>
            <span className="text-xs text-slate-500">
              {result.chiTiet.length} câu hỏi
            </span>
          </div>

          <div className="space-y-4">
            {result.chiTiet.map((item, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border bg-white shadow-xs space-y-3 ${
                  item.dung
                    ? 'border-emerald-200'
                    : item.loai === 'TL'
                    ? 'border-indigo-200'
                    : 'border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      Câu {item.stt} ({item.loai})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        item.dung
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.loai === 'TL'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.dung ? 'ĐÚNG' : item.loai === 'TL' ? 'TỰ LUẬN' : 'CHƯA ĐÚNG'}
                    </span>
                  </div>

                  <span className="font-mono font-bold text-slate-700">
                    {item.diem !== null ? `${item.diem} / ${item.diemToiDa} điểm` : `Tối đa ${item.diemToiDa} điểm`}
                  </span>
                </div>

                {/* Answers Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Câu trả lời của bạn:</span>
                    <span className="font-mono font-bold text-slate-900 break-words">
                      {item.traLoi !== null && item.traLoi !== undefined && item.traLoi !== ''
                        ? String(item.traLoi)
                        : '(Không chọn đáp án)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Đáp án chính xác:</span>
                    <span className="font-mono font-bold text-emerald-700 break-words">
                      {String(item.dapAn)}
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                {item.loiGiai && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950 space-y-1">
                    <span className="font-bold block">Lời giải:</span>
                    <p className="whitespace-pre-line leading-relaxed">{item.loiGiai}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
