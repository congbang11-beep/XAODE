import React from 'react';
import { BookOpen, User, GraduationCap, CloudCheck, WifiOff } from 'lucide-react';

interface Props {
  currentTab: string;
  onTabChange: (tab: string) => void;
  appMode: 'teacher' | 'student';
  onModeChange: (mode: 'teacher' | 'student') => void;
  isOnline: boolean;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  onTabChange,
  appMode,
  onModeChange,
  isOnline
}) => {
  const teacherTabs = [
    { id: 'dashboard', label: 'Tổng quan' },
    { id: 'questions', label: 'Ngân hàng câu hỏi' },
    { id: 'exams', label: 'Đề thi & Mã đề' },
    { id: 'assignments', label: 'Giao đề thi' },
    { id: 'grading', label: 'Chấm thi & Kết quả' },
    { id: 'classes', label: 'Lớp & Học sinh' },
    { id: 'settings', label: 'Cài đặt kết nối' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                if (appMode === 'teacher') onTabChange('dashboard');
              }}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-105">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap block">
                  Đề Online
                </span>
                <span className="text-[11px] font-medium text-slate-400 block -mt-1">
                  Chuẩn đề thi 2025 · Google Apps Script
                </span>
              </div>
            </button>

            {/* Subtle connection indicator */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ml-2 ${
                isOnline
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                  : 'text-amber-700 bg-amber-50 border border-amber-200'
              }`}
              title={isOnline ? 'Đã kết nối Google Sheet qua Apps Script' : 'Đang chạy bộ nhớ nội bộ (Demo/Offline)'}
            >
              {isOnline ? <CloudCheck className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
              <span>{isOnline ? 'Đám mây Google' : 'Nội bộ (Demo)'}</span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Teacher mode) */}
          {appMode === 'teacher' ? (
            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600 overflow-x-auto py-2">
              {teacherTabs.map((tab) => {
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors text-xs font-semibold ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          ) : (
            <div className="hidden sm:block text-xs text-slate-500 font-medium">
              Khu vực phòng thi dành cho thí sinh · Chống gian lận & Tự động lưu
            </div>
          )}

          {/* Zone 3: 1 Primary Action (Mode Toggle) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => onModeChange('teacher')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  appMode === 'teacher'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Giáo viên</span>
              </button>
              <button
                onClick={() => onModeChange('student')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  appMode === 'student'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Vào thi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav strip for Teacher */}
        {appMode === 'teacher' && (
          <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
            {teacherTabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-2.5 py-1 text-xs whitespace-nowrap rounded font-medium ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
