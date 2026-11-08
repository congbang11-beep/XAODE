import React, { useState, useEffect, useCallback } from 'react';
import {
  CauHoi,
  De,
  MaDe,
  GiaoDe,
  BaiLam,
  Lop,
  HocSinh,
  ServerConfig,
  LayDeThiResponse,
  NopBaiResponse
} from './types';
import { api } from './services/api';
import { storage } from './services/storage';
import { Navbar } from './components/Navbar';
import { DashboardTab } from './components/TeacherView/DashboardTab';
import { QuestionBankTab } from './components/TeacherView/QuestionBankTab';
import { ExamListTab } from './components/TeacherView/ExamListTab';
import { ExamAssignmentTab } from './components/TeacherView/ExamAssignmentTab';
import { GradingTab } from './components/TeacherView/GradingTab';
import { ClassManagementTab } from './components/TeacherView/ClassManagementTab';
import { SettingsTab } from './components/TeacherView/SettingsTab';
import { StudentLogin } from './components/StudentView/StudentLogin';
import { ExamRoom } from './components/StudentView/ExamRoom';
import { ExamResult } from './components/StudentView/ExamResult';

export default function App() {
  const [appMode, setAppMode] = useState<'teacher' | 'student'>('teacher');
  const [currentTeacherTab, setCurrentTeacherTab] = useState<string>('dashboard');

  // Server & Data State
  const [config, setConfig] = useState<ServerConfig>(storage.getConfig());
  const [questions, setQuestions] = useState<CauHoi[]>(storage.getTable<CauHoi>('CauHoi'));
  const [exams, setExams] = useState<De[]>(storage.getTable<De>('De'));
  const [maDes, setMaDes] = useState<MaDe[]>(storage.getTable<MaDe>('MaDe'));
  const [assignments, setAssignments] = useState<GiaoDe[]>(storage.getTable<GiaoDe>('GiaoDe'));
  const [submissions, setSubmissions] = useState<BaiLam[]>(storage.getTable<BaiLam>('BaiLam'));
  const [classes, setClasses] = useState<Lop[]>(storage.getTable<Lop>('Lop'));
  const [students, setStudents] = useState<HocSinh[]>(storage.getTable<HocSinh>('HocSinh'));

  // Student Flow State
  const [studentStage, setStudentStage] = useState<'login' | 'exam' | 'result'>('login');
  const [activeExamSession, setActiveExamSession] = useState<LayDeThiResponse | null>(null);
  const [examResult, setExamResult] = useState<NopBaiResponse | null>(null);

  // Load from remote or local storage
  const reloadData = useCallback(async () => {
    try {
      const data = await api.taiTatCa();
      if (data.CauHoi) setQuestions(data.CauHoi);
      if (data.De) setExams(data.De);
      if (data.MaDe) setMaDes(data.MaDe);
      if (data.GiaoDe) setAssignments(data.GiaoDe);
      if (data.BaiLam) setSubmissions(data.BaiLam);
      if (data.Lop) setClasses(data.Lop);
      if (data.HocSinh) setStudents(data.HocSinh);
    } catch {
      // fallback local
      setQuestions(storage.getTable<CauHoi>('CauHoi'));
      setExams(storage.getTable<De>('De'));
      setMaDes(storage.getTable<MaDe>('MaDe'));
      setAssignments(storage.getTable<GiaoDe>('GiaoDe'));
      setSubmissions(storage.getTable<BaiLam>('BaiLam'));
      setClasses(storage.getTable<Lop>('Lop'));
      setStudents(storage.getTable<HocSinh>('HocSinh'));
    }
  }, []);

  useEffect(() => {
    reloadData();

    // Check query params for quick navigation (?code=ABC or ?tab=...)
    try {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('code');
      if (codeParam) {
        setAppMode('student');
      }
    } catch {
      // ignore
    }
  }, [reloadData]);

  // TEACHER HANDLERS
  const handleSaveQuestion = async (q: CauHoi) => {
    await api.luu('CauHoi', [q]);
    setQuestions(storage.getTable<CauHoi>('CauHoi'));
  };

  const handleDeleteQuestions = async (ids: string[]) => {
    await api.xoa('CauHoi', ids);
    setQuestions(storage.getTable<CauHoi>('CauHoi'));
  };

  const handleSaveExam = async (exam: De, generatedMaDes?: MaDe[]) => {
    await api.luu('De', [exam]);
    if (generatedMaDes && generatedMaDes.length) {
      await api.luu('MaDe', generatedMaDes);
    }
    setExams(storage.getTable<De>('De'));
    setMaDes(storage.getTable<MaDe>('MaDe'));
  };

  const handleDeleteExam = async (id: string) => {
    await api.xoa('De', [id]);
    setExams(storage.getTable<De>('De'));
  };

  const handleSaveAssignment = async (assignment: GiaoDe) => {
    await api.luu('GiaoDe', [assignment]);
    setAssignments(storage.getTable<GiaoDe>('GiaoDe'));
  };

  const handleDeleteAssignment = async (id: string) => {
    await api.xoa('GiaoDe', [id]);
    setAssignments(storage.getTable<GiaoDe>('GiaoDe'));
  };

  const handleReGradeAssignment = async (giaoDeId: string) => {
    await api.chamLai(giaoDeId);
    setSubmissions(storage.getTable<BaiLam>('BaiLam'));
  };

  const handleManualGrade = async (baiLamId: string, scores: Record<string, number | null>) => {
    await api.chamTay(baiLamId, scores);
    setSubmissions(storage.getTable<BaiLam>('BaiLam'));
  };

  const handleSaveClass = async (lop: Lop) => {
    await api.luu('Lop', [lop]);
    setClasses(storage.getTable<Lop>('Lop'));
  };

  const handleDeleteClass = async (id: string) => {
    await api.xoa('Lop', [id]);
    setClasses(storage.getTable<Lop>('Lop'));
  };

  const handleSaveStudent = async (student: HocSinh) => {
    await api.luu('HocSinh', [student]);
    setStudents(storage.getTable<HocSinh>('HocSinh'));
  };

  const handleDeleteStudent = async (id: string) => {
    await api.xoa('HocSinh', [id]);
    setStudents(storage.getTable<HocSinh>('HocSinh'));
  };

  const handleBulkImportStudents = async (lopId: string, text: string) => {
    const lines = text.split('\n').filter((l) => l.trim());
    const items: HocSinh[] = lines.map((line, idx) => {
      const parts = line.split(/[,;\t]/).map((s) => s.trim());
      const ma = parts[0] || 'HS' + (1000 + idx);
      const name = parts[1] || 'Học sinh ' + (idx + 1);
      const dob = parts[2] || '';
      return {
        id: 'HS_' + Date.now().toString(36) + '_' + idx,
        lopId,
        maHS: ma.toUpperCase(),
        hoTen: name,
        ngaySinh: dob,
        createdAt: Date.now() + idx,
        updatedAt: Date.now() + idx
      };
    });

    await api.luu('HocSinh', items);
    setStudents(storage.getTable<HocSinh>('HocSinh'));
    alert(`Đã thêm thành công ${items.length} học sinh vào lớp!`);
  };

  const handleSaveConfig = (cfg: ServerConfig) => {
    storage.saveConfig(cfg);
    setConfig(cfg);
    reloadData();
  };

  const handlePingServer = async () => {
    return await api.ping();
  };

  const handleInitServer = async (k: string) => {
    return await api.khoiTao(k);
  };

  const handleChangePassword = async (k: string) => {
    return await api.doiMatKhau(k);
  };

  const handlePurgeDeleted = async () => {
    return await api.donRac();
  };

  const handleResetDemoData = () => {
    storage.resetToDefault();
    reloadData();
  };

  // STUDENT HANDLERS
  const handleFetchExamInfo = async (code: string) => {
    return await api.thongTinGiaoDe(code);
  };

  const handleStartExam = async (params: {
    code: string;
    hoTen: string;
    lop: string;
    maHS?: string;
    matKhau?: string;
  }) => {
    const session = await api.layDeThi({
      ...params,
      thietBi: navigator.userAgent.slice(0, 150)
    });
    setActiveExamSession(session);
    setStudentStage('exam');
  };

  const handleStudentAutoSave = async (traLoi: any[], soLanRoiTab: number) => {
    if (!activeExamSession) return;
    return await api.luuNhap({
      baiLamId: activeExamSession.baiLamId,
      traLoi,
      soLanRoiTab
    });
  };

  const handleStudentSubmit = async (traLoi: any[], soLanRoiTab: number) => {
    if (!activeExamSession) throw new Error('Không có phiên thi hợp lệ.');
    const res = await api.nopBai({
      baiLamId: activeExamSession.baiLamId,
      traLoi,
      soLanRoiTab
    });
    setExamResult(res);
    setStudentStage('result');
    // Refresh submissions for teacher view
    setSubmissions(storage.getTable<BaiLam>('BaiLam'));
    return res;
  };

  const handleExitStudent = () => {
    setStudentStage('login');
    setActiveExamSession(null);
    setExamResult(null);
    setAppMode('teacher');
    setCurrentTeacherTab('grading');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTeacherTab}
        onTabChange={(tab) => setCurrentTeacherTab(tab)}
        appMode={appMode}
        onModeChange={(mode) => {
          setAppMode(mode);
          if (mode === 'student' && studentStage !== 'exam') {
            setStudentStage('login');
          }
        }}
        isOnline={config.isOnlineConnected}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {appMode === 'teacher' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {currentTeacherTab === 'dashboard' && (
              <DashboardTab
                questions={questions}
                exams={exams}
                assignments={assignments}
                submissions={submissions}
                onNavigate={(tab) => setCurrentTeacherTab(tab)}
                onOpenNewQuestion={() => setCurrentTeacherTab('questions')}
                onOpenNewExam={() => setCurrentTeacherTab('exams')}
                onOpenNewAssignment={() => setCurrentTeacherTab('assignments')}
              />
            )}

            {currentTeacherTab === 'questions' && (
              <QuestionBankTab
                questions={questions}
                onSaveQuestion={handleSaveQuestion}
                onDeleteQuestions={handleDeleteQuestions}
              />
            )}

            {currentTeacherTab === 'exams' && (
              <ExamListTab
                exams={exams}
                maDes={maDes}
                questions={questions}
                onSaveExam={handleSaveExam}
                onDeleteExam={handleDeleteExam}
                onAssignExam={(examId) => {
                  setCurrentTeacherTab('assignments');
                }}
              />
            )}

            {currentTeacherTab === 'assignments' && (
              <ExamAssignmentTab
                assignments={assignments}
                exams={exams}
                classes={classes}
                submissions={submissions}
                onSaveAssignment={handleSaveAssignment}
                onDeleteAssignment={handleDeleteAssignment}
                onReGradeAssignment={handleReGradeAssignment}
              />
            )}

            {currentTeacherTab === 'grading' && (
              <GradingTab
                submissions={submissions}
                assignments={assignments}
                exams={exams}
                questions={questions}
                onManualGrade={handleManualGrade}
              />
            )}

            {currentTeacherTab === 'classes' && (
              <ClassManagementTab
                classes={classes}
                students={students}
                onSaveClass={handleSaveClass}
                onDeleteClass={handleDeleteClass}
                onSaveStudent={handleSaveStudent}
                onDeleteStudent={handleDeleteStudent}
                onBulkImportStudents={handleBulkImportStudents}
              />
            )}

            {currentTeacherTab === 'settings' && (
              <SettingsTab
                config={config}
                onSaveConfig={handleSaveConfig}
                onPing={handlePingServer}
                onInitServer={handleInitServer}
                onChangePassword={handleChangePassword}
                onPurgeDeleted={handlePurgeDeleted}
                onResetDemoData={handleResetDemoData}
              />
            )}
          </div>
        ) : (
          <div>
            {studentStage === 'login' && (
              <StudentLogin
                onFetchExamInfo={handleFetchExamInfo}
                onStartExam={handleStartExam}
              />
            )}

            {studentStage === 'exam' && activeExamSession && (
              <ExamRoom
                session={activeExamSession}
                onAutoSave={handleStudentAutoSave}
                onSubmitExam={handleStudentSubmit}
                onExit={handleExitStudent}
              />
            )}

            {studentStage === 'result' && examResult && (
              <ExamResult
                result={examResult}
                onExit={handleExitStudent}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Đề Online · Hệ thống Khảo thí & Ngân hàng Đề thi Trực tuyến v1.0.0 (Chuẩn THPT 2025)
          </span>
          <span className="text-slate-400">
            Hỗ trợ kết nối Google Apps Script & Google Sheet hai chiều
          </span>
        </div>
      </footer>
    </div>
  );
}
