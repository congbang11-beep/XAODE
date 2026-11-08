import React, { useState } from 'react';
import { ThongTinGiaoDeResponse } from '../../types';
import {
  GraduationCap,
  Clock,
  Key,
  User,
  School,
  AlertCircle,
  Shield,
  ArrowRight
} from 'lucide-react';

interface Props {
  onStartExam: (data: {
    code: string;
    hoTen: string;
    lop: string;
    maHS?: string;
    matKhau?: string;
  }) => Promise<void>;
  onFetchExamInfo: (code: string) => Promise<ThongTinGiaoDeResponse>;
}

export const StudentLogin: React.FC<Props> = ({ onStartExam, onFetchExamInfo }) => {
  const [code, setCode] = useState('TOAN12');
  const [examInfo, setExamInfo] = useState<ThongTinGiaoDeResponse | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [hoTen, setHoTen] = useState('');
  const [lop, setLop] = useState('');
  const [maHS, setMaHS] = useState('');
  const [matKhau, setMatKhau] = useState('');

  // Fetch info when user inputs 6-char code
  const handleCheckCode = async (c: string) => {
    const trimmed = c.trim().toUpperCase();
    setCode(trimmed);
    if (trimmed.length < 4) {
      setExamInfo(null);
      return;
    }

    setLoadingInfo(true);
    setErrorMsg(null);
    try {
      const info = await onFetchExamInfo(trimmed);
      setExamInfo(info);
      if (info.lop && info.lop.length === 1) {
        setLop(info.lop[0].tenLop);
      }
    } catch (e: any) {
      setExamInfo(null);
      setErrorMsg(e.message || 'Không tìm thấy phòng thi với mã này.');
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMsg('Vui lòng nhập mã phòng thi.');
      return;
    }
    if (examInfo?.yeuCauDanhSach && !maHS.trim()) {
      setErrorMsg('Bài thi yêu cầu nhập mã học sinh.');
      return;
    }
    if (!examInfo?.yeuCauDanhSach && !hoTen.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên của bạn.');
      return;
    }

    setStarting(true);
    setErrorMsg(null);
    try {
      await onStartExam({
        code: code.trim().toUpperCase(),
        hoTen: hoTen.trim(),
        lop: lop.trim(),
        maHS: maHS.trim(),
        matKhau: matKhau.trim()
      });
    } catch (e: any) {
      setErrorMsg(e.message || 'Không thể vào thi.');
    } finally {
      setStarting(false);
    }
  };

  // Initial check on mount if code has value
  React.useEffect(() => {
    if (code) {
      handleCheckCode(code);
    }
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="bg-slate-900 text-white p-6 text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 mx-auto flex items-center justify-center mb-2">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Phòng thi Trực tuyến
          </h2>
          <p className="text-xs text-slate-400">
            Hệ thống Khảo thí Đề Online · Chuẩn định dạng 2025
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Room Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mã phòng thi (6 ký tự)
            </label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => handleCheckCode(e.target.value)}
                maxLength={8}
                className="w-full px-3 py-2 text-base font-mono font-bold tracking-wider text-center border border-slate-200 rounded-xl uppercase text-indigo-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                placeholder="TOAN12"
                required
              />
              {loadingInfo && (
                <div className="absolute right-3 top-2.5 text-xs text-slate-400">
                  Kiểm tra...
                </div>
              )}
            </div>
          </div>

          {/* Exam Info Card if found */}
          {examInfo && (
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-2">
              <div className="font-bold text-indigo-950 text-sm">
                {examInfo.tieuDe}
              </div>
              <div className="flex items-center gap-3 text-indigo-800 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{examInfo.thoiLuong ? `${examInfo.thoiLuong} phút` : 'Tự do'}</span>
                </span>
                <span>·</span>
                <span>Môn: {examInfo.monHoc || 'Tổng hợp'}</span>
                {examInfo.chongGianLan && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                      <Shield className="w-3 h-3 text-emerald-600" />
                      <span>Chống gian lận</span>
                    </span>
                  </>
                )}
              </div>

              {examInfo.tinhTrang !== 'mo' && (
                <div className="text-amber-800 font-bold bg-amber-100/60 p-2 rounded">
                  {examInfo.tinhTrang === 'dong'
                    ? 'Bài thi này hiện đang đóng.'
                    : examInfo.tinhTrang === 'chua_mo'
                    ? 'Bài thi chưa đến giờ mở.'
                    : 'Bài thi đã hết hạn nộp.'}
                </div>
              )}
            </div>
          )}

          {/* Student Info Fields */}
          {examInfo?.yeuCauDanhSach ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã học sinh (Đã đăng ký trong danh sách lớp)
              </label>
              <input
                type="text"
                value={maHS}
                onChange={(e) => setMaHS(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono uppercase"
                placeholder="Ví dụ: HS1201"
                required
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên thí sinh
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={hoTen}
                    onChange={(e) => setHoTen(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl font-semibold"
                    placeholder="Nguyễn Văn An"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lớp
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={lop}
                      onChange={(e) => setLop(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl"
                      placeholder="12A1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã học sinh (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={maHS}
                    onChange={(e) => setMaHS(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono uppercase"
                    placeholder="HS1201"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Password if required */}
          {examInfo?.canMatKhau && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu bài thi
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  value={matKhau}
                  onChange={(e) => setMatKhau(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl"
                  placeholder="Nhập mật khẩu do giáo viên cấp"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={Boolean(starting || (examInfo && examInfo.tinhTrang !== 'mo'))}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            <span>{starting ? 'Đang chuẩn bị đề thi...' : 'Vào phòng thi & Bắt đầu'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
