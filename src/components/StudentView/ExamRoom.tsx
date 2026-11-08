import React, { useState, useEffect, useRef } from 'react';
import { LayDeThiResponse, StudentCauHoi, NopBaiResponse } from '../../types';
import { FormulaRenderer } from '../FormulaRenderer';
import {
  Clock,
  ShieldAlert,
  Save,
  CheckCircle,
  Flag,
  ArrowLeft,
  ArrowRight,
  Send,
  AlertTriangle,
  X
} from 'lucide-react';

interface Props {
  session: LayDeThiResponse;
  onAutoSave: (traLoi: any[], soLanRoiTab: number) => Promise<any>;
  onSubmitExam: (traLoi: any[], soLanRoiTab: number) => Promise<NopBaiResponse>;
  onExit: () => void;
}

export const ExamRoom: React.FC<Props> = ({
  session,
  onAutoSave,
  onSubmitExam,
  onExit
}) => {
  const [answers, setAnswers] = useState<any[]>(session.traLoi || []);
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(session.soLanRoiTab || 0);
  const [tabWarning, setTabWarning] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const tabSwitchesRef = useRef(tabSwitches);
  tabSwitchesRef.current = tabSwitches;

  const currentQ = session.cauHoi[currentIndex];

  // ANTI-CHEAT: Track tab switches & window blur
  useEffect(() => {
    if (!session.chongGianLan) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const next = tabSwitchesRef.current + 1;
        setTabSwitches(next);
        setTabWarning(`CẢNH BÁO: Bạn vừa rời khỏi màn hình thi! Lần vi phạm thứ ${next}.`);
        onAutoSave(answersRef.current, next);
      }
    };

    const handleBlur = () => {
      // Small debounce
      setTimeout(() => {
        if (document.hidden) return; // already caught by visibilitychange
        const next = tabSwitchesRef.current + 1;
        setTabSwitches(next);
        setTabWarning(`CẢNH BÁO: Cửa sổ thi bị mất tiêu điểm (Lần ${next})!`);
        onAutoSave(answersRef.current, next);
      }, 300);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [session.chongGianLan]);

  // COUNTDOWN TIMER
  useEffect(() => {
    if (!session.hanNop) return;

    const checkTime = () => {
      const remaining = Math.max(0, Math.floor((session.hanNop! - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        // Auto-submit when time expires
        handleSubmit(true);
      }
    };

    checkTime();
    const timer = setInterval(checkTime, 1000);
    return () => clearInterval(timer);
  }, [session.hanNop]);

  // AUTO-SAVE periodic
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await onAutoSave(answersRef.current, tabSwitchesRef.current);
        const now = new Date();
        setLastSaved(
          `${now.getHours().toString().padStart(2, '0')}:${now
            .getMinutes()
            .toString()
            .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
        );
      } catch (e) {
        console.warn('Auto save error:', e);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectTN = (choice: string) => {
    const copy = [...answers];
    copy[currentIndex] = choice;
    setAnswers(copy);
    onAutoSave(copy, tabSwitchesRef.current);
  };

  const handleSelectDS = (statementIdx: number, val: 'Đ' | 'S') => {
    const copy = [...answers];
    let currentStr = copy[currentIndex] || '____';
    if (typeof currentStr !== 'string' || currentStr.length < 4) currentStr = '____';
    const chars = currentStr.split('');
    chars[statementIdx] = val;
    copy[currentIndex] = chars.join('');
    setAnswers(copy);
    onAutoSave(copy, tabSwitchesRef.current);
  };

  const handleTextChange = (val: string) => {
    const copy = [...answers];
    copy[currentIndex] = val;
    setAnswers(copy);
  };

  const handleToggleFlag = (idx: number) => {
    setFlagged((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSubmit = async (auto = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmitExam(answersRef.current, tabSwitchesRef.current);
    } catch (e: any) {
      alert('Lỗi nộp bài: ' + e.message);
      setIsSubmitting(false);
      setShowConfirmSubmit(false);
    }
  };

  // Format time remaining MM:SS
  const formatTimer = (secs: number | null) => {
    if (secs === null) return '--:--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Check unanswered count
  const isQuestionAnswered = (idx: number) => {
    const q = session.cauHoi[idx];
    const a = answers[idx];
    if (a === undefined || a === null || a === '') return false;
    if (q.loai === 'DS') {
      return typeof a === 'string' && !a.includes('_') && a.length === 4;
    }
    return true;
  };

  const answeredCount = session.cauHoi.filter((_, idx) => isQuestionAnswered(idx)).length;
  const unansweredCount = session.cauHoi.length - answeredCount;

  return (
    <div className="min-h-screen bg-slate-100/70 pb-12">
      {/* Sticky Exam Top Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Exam title & Student */}
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 truncate">
              {session.tieuDe}
            </h1>
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span className="font-semibold text-slate-700">{session.hoTen}</span>
              {session.lop && <span>· Lớp {session.lop}</span>}
              <span>· Mã đề: <strong className="font-mono text-indigo-700">{session.maDe}</strong></span>
              {lastSaved && (
                <span className="hidden sm:inline text-emerald-700">
                  · Đã lưu {lastSaved}
                </span>
              )}
            </div>
          </div>

          {/* Right: Anti-cheat badge, Countdown timer & Submit CTA */}
          <div className="flex items-center gap-3 shrink-0">
            {session.chongGianLan && tabSwitches > 0 && (
              <div className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Rời tab: {tabSwitches}</span>
              </div>
            )}

            {/* Timer */}
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm tracking-wider tabular-nums ${
                  timeLeft <= 60
                    ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                    : timeLeft <= 300
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-slate-50 text-slate-800 border-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            )}

            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp bài</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Warning Toast */}
      {tabWarning && (
        <div className="max-w-4xl mx-auto px-4 mt-3">
          <div className="p-3 bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{tabWarning}</span>
            </div>
            <button onClick={() => setTabWarning(null)} className="p-1 hover:bg-rose-700 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Examination Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Question Details (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {currentQ && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-indigo-700">
                    Câu {currentQ.stt}
                  </span>
                  <span className="text-xs text-slate-400">/ {session.cauHoi.length}</span>
                  {currentQ.phan && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 ml-2">
                      {currentQ.phan}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleToggleFlag(currentIndex)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                    flagged[currentIndex]
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'text-slate-500 hover:bg-slate-100 border-transparent'
                  }`}
                >
                  <Flag className={`w-3.5 h-3.5 ${flagged[currentIndex] ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>{flagged[currentIndex] ? 'Đã đặt cờ xem lại' : 'Đặt cờ xem lại'}</span>
                </button>
              </div>

              {/* Question Statement */}
              <div className="text-base text-slate-900 font-medium leading-relaxed">
                <FormulaRenderer content={currentQ.noiDung} />
              </div>

              {/* Image if any */}
              {currentQ.hinhAnh && (
                <div className="my-3">
                  <img
                    src={currentQ.hinhAnh}
                    alt={`Hình minh họa câu ${currentQ.stt}`}
                    className="max-h-72 rounded-lg border border-slate-200 object-contain mx-auto"
                  />
                </div>
              )}

              {/* Answer Input based on Question Type */}
              <div className="pt-2">
                {/* 1. TN (Trắc nghiệm 4 lựa chọn) */}
                {currentQ.loai === 'TN' && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-slate-500 block mb-2">
                      Chọn 1 phương án đúng:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentQ.phuongAn.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isSelected = answers[currentIndex] === letter;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectTN(letter)}
                            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                              isSelected
                                ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 ring-1 ring-indigo-600 shadow-xs'
                                : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <span
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white border border-slate-300 text-slate-700'
                              }`}
                            >
                              {letter}
                            </span>
                            <span className="text-sm pt-0.5 leading-snug break-words flex-1">
                              {opt}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. DS (Đúng / Sai 4 ý) */}
                {currentQ.loai === 'DS' && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-slate-500 block">
                      Xét tính Đúng hoặc Sai cho từng mệnh đề sau:
                    </span>
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      {currentQ.phuongAn.map((stmt, sIdx) => {
                        const currentChoices = (answers[currentIndex] || '____').split('');
                        const choice = currentChoices[sIdx] || '_';
                        const isDung = choice === 'Đ';
                        const isSai = choice === 'S';

                        return (
                          <div
                            key={sIdx}
                            className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60"
                          >
                            <span className="text-sm text-slate-800 flex-1 pr-3">
                              {stmt}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSelectDS(sIdx, 'Đ')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                  isDung
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                ĐÚNG
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSelectDS(sIdx, 'S')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                  isSai
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                SAI
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. TLN (Trả lời ngắn) */}
                {currentQ.loai === 'TLN' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-600">
                      Điền đáp án (số nguyên, số thập phân hoặc phân số a/b):
                    </label>
                    <input
                      type="text"
                      value={answers[currentIndex] || ''}
                      onChange={(e) => handleTextChange(e.target.value)}
                      onBlur={() => onAutoSave(answers, tabSwitchesRef.current)}
                      className="w-full max-w-sm px-4 py-2.5 text-sm font-mono font-bold border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ví dụ: 100 hoặc 2/3"
                    />
                    <p className="text-[11px] text-slate-400">
                      Ví dụ cách viết: <code>2.5</code>, <code>2,5</code>, hoặc phân số <code>5/2</code>.
                    </p>
                  </div>
                )}

                {/* 4. TL (Tự luận) */}
                {currentQ.loai === 'TL' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-600">
                      Trình bày bài làm chi tiết:
                    </label>
                    <textarea
                      rows={8}
                      value={answers[currentIndex] || ''}
                      onChange={(e) => handleTextChange(e.target.value)}
                      onBlur={() => onAutoSave(answers, tabSwitchesRef.current)}
                      className="w-full p-4 text-sm border border-slate-300 rounded-xl leading-relaxed focus:ring-2 focus:ring-indigo-500"
                      placeholder="Nhập các bước lập luận, chứng minh và kết quả của bạn..."
                    />
                  </div>
                )}
              </div>

              {/* Question Navigation Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Câu trước</span>
                </button>

                <span className="text-xs text-slate-400 font-medium">
                  {isQuestionAnswered(currentIndex) ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Đã chọn câu trả lời</span>
                    </span>
                  ) : (
                    <span>Chưa trả lời</span>
                  )}
                </span>

                <button
                  type="button"
                  disabled={currentIndex === session.cauHoi.length - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(session.cauHoi.length - 1, prev + 1))}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Câu tiếp theo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Question Navigator Grid (1 col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 sticky top-22">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Danh sách câu hỏi
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-700">
                {answeredCount} / {session.cauHoi.length} đã làm
              </span>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
              {session.cauHoi.map((q, idx) => {
                const isAnswered = isQuestionAnswered(idx);
                const isCurrent = idx === currentIndex;
                const isFlagged = flagged[idx];

                return (
                  <button
                    key={q.stt}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative h-9 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center ${
                      isCurrent
                        ? 'ring-2 ring-indigo-600 ring-offset-1 font-extrabold'
                        : ''
                    } ${
                      isAnswered
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <span>{q.stt}</span>
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-indigo-600" />
                <span>Đã trả lời ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200" />
                <span>Chưa trả lời ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Đặt cờ xem lại</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp bài thi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Submission Dialog */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Xác nhận nộp bài thi?
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <p>
                Bạn đã hoàn thành <strong>{answeredCount}</strong> / {session.cauHoi.length} câu hỏi.
              </p>
              {unansweredCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-medium">
                  Chú ý: Bạn vẫn còn <strong>{unansweredCount} câu chưa làm</strong>. Bạn có chắc chắn muốn nộp bài bây giờ không?
                </div>
              )}
              {session.chongGianLan && tabSwitches > 0 && (
                <p className="text-rose-600">
                  Hệ thống ghi nhận bạn đã rời tab thi <strong>{tabSwitches} lần</strong>.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                {isSubmitting ? 'Đang nộp bài...' : 'Đồng ý nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
