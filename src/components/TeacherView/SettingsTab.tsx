import React, { useState } from 'react';
import { ServerConfig } from '../../types';
import { APPS_SCRIPT_SOURCE, SETUP_STEPS } from '../../services/appsScriptSource';
import {
  CloudCheck,
  Key,
  Database,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Trash,
  Code2,
  FileCheck2,
  AlertCircle
} from 'lucide-react';

interface Props {
  config: ServerConfig;
  onSaveConfig: (cfg: ServerConfig) => void;
  onPing: () => Promise<any>;
  onInitServer: (key: string) => Promise<any>;
  onChangePassword: (newKey: string) => Promise<any>;
  onPurgeDeleted: () => Promise<any>;
  onResetDemoData: () => void;
}

export const SettingsTab: React.FC<Props> = ({
  config,
  onSaveConfig,
  onPing,
  onInitServer,
  onChangePassword,
  onPurgeDeleted,
  onResetDemoData
}) => {
  const [url, setUrl] = useState(config.webAppUrl || '');
  const [key, setKey] = useState(config.teacherKey || '');
  const [newKey, setNewKey] = useState('');

  const [pingResult, setPingResult] = useState<any>(null);
  const [pinging, setPinging] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [purging, setPurging] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSaveConnection = () => {
    const updated: ServerConfig = {
      ...config,
      webAppUrl: url.trim(),
      teacherKey: key.trim(),
      isOnlineConnected: !!(url.trim().startsWith('http') && key.trim())
    };
    onSaveConfig(updated);
    setStatusMsg({ text: 'Đã lưu cấu hình kết nối thành công!', type: 'success' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handlePing = async () => {
    setPinging(true);
    setStatusMsg(null);
    try {
      const res = await onPing();
      setPingResult(res);
      setStatusMsg({
        text: res.keyOk
          ? 'Kết nối máy chủ Google Apps Script thành công!'
          : 'Kết nối được nhưng mật khẩu giáo viên chưa đúng hoặc chưa khởi tạo.',
        type: res.keyOk ? 'success' : 'error'
      });
    } catch (e: any) {
      setPingResult(null);
      setStatusMsg({ text: 'Lỗi kiểm tra: ' + e.message, type: 'error' });
    } finally {
      setPinging(false);
    }
  };

  const handleInitServer = async () => {
    if (!key.trim() || key.trim().length < 6) {
      alert('Mật khẩu giáo viên cần ít nhất 6 ký tự.');
      return;
    }
    setInitializing(true);
    setStatusMsg(null);
    try {
      const res = await onInitServer(key.trim());
      setStatusMsg({
        text: 'Khởi tạo thành công các bảng tính trên Google Sheet!',
        type: 'success'
      });
      await handlePing();
    } catch (e: any) {
      setStatusMsg({ text: 'Lỗi khởi tạo: ' + e.message, type: 'error' });
    } finally {
      setInitializing(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newKey.trim() || newKey.trim().length < 6) {
      alert('Mật khẩu mới cần ít nhất 6 ký tự.');
      return;
    }
    setChangingPass(true);
    setStatusMsg(null);
    try {
      await onChangePassword(newKey.trim());
      setKey(newKey.trim());
      setNewKey('');
      setStatusMsg({ text: 'Đã đổi mật khẩu giáo viên thành công!', type: 'success' });
    } catch (e: any) {
      setStatusMsg({ text: 'Lỗi đổi mật khẩu: ' + e.message, type: 'error' });
    } finally {
      setChangingPass(false);
    }
  };

  const handlePurge = async () => {
    if (confirm('Dọn dẹp sẽ xóa vĩnh viễn các dòng đã bị đánh dấu xóa trong Google Sheet. Tiếp tục?')) {
      setPurging(true);
      try {
        const res = await onPurgeDeleted();
        alert('Đã dọn dẹp dữ liệu rác thành công: ' + JSON.stringify(res.removed || res));
      } catch (e: any) {
        alert('Lỗi dọn rác: ' + e.message);
      } finally {
        setPurging(false);
      }
    }
  };

  const handleCopySource = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_SOURCE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="space-y-8 py-2">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Cài đặt Kết nối Máy chủ Google Apps Script & Google Sheet
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Quản lý kết nối cơ sở dữ liệu thời gian thực, khóa bảo mật giáo viên và hướng dẫn triển khai
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Connection Config Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Thông số kết nối Web App</span>
            </h3>
            <span className="text-xs text-slate-400">
              Nhận từ mục Triển khai (Deploy) trong Google Apps Script
            </span>
          </div>
          <span
            className={`px-2.5 py-1 rounded text-xs font-bold ${
              config.isOnlineConnected
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {config.isOnlineConnected ? 'Đã kết nối Google Sheet' : 'Đang ở chế độ Demo nội bộ'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL Ứng dụng web (Google Apps Script Web App URL)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
              placeholder="https://script.google.com/macros/s/.../exec"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              URL phải kết thúc bằng <code>/exec</code> và được triển khai với quyền "Bất kỳ ai" (Anyone).
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mật khẩu giáo viên (Teacher Key)
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
              placeholder="Ít nhất 6 ký tự"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Dùng để xác thực quyền quản trị đề thi và chấm điểm.
            </span>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveConnection}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              Lưu cấu hình
            </button>
            <button
              onClick={handlePing}
              disabled={pinging}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pinging ? 'animate-spin' : ''}`} />
              <span>Kiểm tra kết nối (Ping)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInitServer}
              disabled={initializing}
              className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              title="Tự động tạo các trang tính cần thiết trong Google Sheet"
            >
              {initializing ? 'Đang khởi tạo...' : 'Khởi tạo hệ thống (KhoiTao)'}
            </button>
            <button
              onClick={handlePurge}
              disabled={purging}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Dọn dẹp các dòng đã đánh dấu xóa"
            >
              <Trash className="w-3.5 h-3.5" />
              <span>Dọn rác</span>
            </button>
          </div>
        </div>

        {/* Ping Details Display */}
        {pingResult && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>Trạng thái máy chủ:</span>
              <span className="font-mono text-indigo-700">Phiên bản {pingResult.version || '1.0.0'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
              <div>
                Tên bảng tính: <strong>{pingResult.spreadsheetName || 'N/A'}</strong>
              </div>
              <div>
                Mật khẩu: <strong>{pingResult.keyOk ? 'Hợp lệ' : 'Chưa đúng'}</strong>
              </div>
              {pingResult.spreadsheetUrl && (
                <div className="sm:col-span-2">
                  <a
                    href={pingResult.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Mở Google Sheet trên trình duyệt</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Key className="w-4 h-4 text-indigo-600" />
          <span>Đổi mật khẩu giáo viên</span>
        </h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-lg">
          <input
            type="password"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            placeholder="Mật khẩu mới (>= 6 ký tự)"
          />
          <button
            onClick={handleChangePassword}
            disabled={changingPass}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors shrink-0"
          >
            {changingPass ? 'Đang đổi...' : 'Cập nhật mật khẩu'}
          </button>
        </div>
      </div>

      {/* Demo Reset */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Dữ liệu mẫu trải nghiệm (Demo)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Khôi phục lại dữ liệu mẫu nguyên bản gồm ngân hàng câu hỏi chuẩn 2025 (TN, DS, TLN, TL), đề thi thử, học sinh lớp 12A1 và đợt thi trực tuyến đang mở.
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm('Bạn có muốn nạp lại bộ dữ liệu mẫu ban đầu?')) {
              onResetDemoData();
              alert('Đã khôi phục dữ liệu mẫu thành công!');
            }
          }}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap transition-colors self-start sm:self-auto"
        >
          Khôi phục dữ liệu mẫu
        </button>
      </div>

      {/* Detailed Setup Guide & Source Code */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-600" />
              <span>Hướng dẫn Cài đặt Máy chủ Google Apps Script (v1.0.0)</span>
            </h3>
            <span className="text-xs text-slate-500">
              Chỉ mất khoảng 2 phút thiết lập trên tài khoản Google cá nhân của bạn
            </span>
          </div>

          <button
            onClick={handleCopySource}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors shrink-0"
          >
            {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Đã sao chép mã nguồn!' : 'Sao chép mã Apps Script'}</span>
          </button>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SETUP_STEPS.map((step) => (
            <div key={step.step} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {step.step}
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {step.title}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Code Snippet Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Mã nguồn Code.gs (ĐỀ ONLINE v1.0.0):</span>
            <button
              onClick={handleCopySource}
              className="text-indigo-600 hover:underline flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Sao chép toàn bộ ({APPS_SCRIPT_SOURCE.length} ký tự)</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] max-h-60 overflow-y-auto leading-relaxed border border-slate-800">
            <code>{APPS_SCRIPT_SOURCE.slice(0, 1500)}... (bấm Sao chép để lấy toàn bộ)</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
