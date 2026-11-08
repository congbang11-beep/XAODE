import React, { useState } from 'react';
import { Lop, HocSinh } from '../../types';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Upload,
  UserPlus,
  X,
  Search
} from 'lucide-react';

interface Props {
  classes: Lop[];
  students: HocSinh[];
  onSaveClass: (lop: Lop) => Promise<void>;
  onDeleteClass: (id: string) => Promise<void>;
  onSaveStudent: (student: HocSinh) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onBulkImportStudents: (lopId: string, text: string) => Promise<void>;
}

export const ClassManagementTab: React.FC<Props> = ({
  classes,
  students,
  onSaveClass,
  onDeleteClass,
  onSaveStudent,
  onDeleteStudent,
  onBulkImportStudents
}) => {
  const [selectedLopId, setSelectedLopId] = useState<string>(classes[0]?.id || '');
  const [search, setSearch] = useState('');

  // Modals
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Form states
  const [className, setClassName] = useState('');
  const [classGrade, setClassGrade] = useState(12);
  const [classYear, setClassYear] = useState('2025 - 2026');

  const [studentMa, setStudentMa] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentDob, setStudentDob] = useState('');
  const [bulkText, setBulkText] = useState('');

  const currentClass = classes.find((c) => c.id === selectedLopId);
  const classStudents = students.filter((s) => s.lopId === selectedLopId);

  const filteredStudents = classStudents.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.hoTen.toLowerCase().includes(q) || s.maHS.toLowerCase().includes(q);
  });

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;
    const newLop: Lop = {
      id: 'LO_' + Date.now().toString(36),
      tenLop: className.trim(),
      khoi: Number(classGrade),
      namHoc: classYear.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await onSaveClass(newLop);
    setSelectedLopId(newLop.id);
    setIsClassModalOpen(false);
    setClassName('');
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentMa.trim() || !selectedLopId) {
      alert('Vui lòng điền đủ Mã HS, Họ tên và chọn lớp.');
      return;
    }
    const newStudent: HocSinh = {
      id: 'HS_' + Date.now().toString(36),
      lopId: selectedLopId,
      maHS: studentMa.trim().toUpperCase(),
      hoTen: studentName.trim(),
      ngaySinh: studentDob.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await onSaveStudent(newStudent);
    setIsStudentModalOpen(false);
    setStudentName('');
    setStudentMa('');
    setStudentDob('');
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim() || !selectedLopId) return;
    await onBulkImportStudents(selectedLopId, bulkText);
    setIsBulkOpen(false);
    setBulkText('');
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Quản lý Lớp học & Danh sách Học sinh
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tạo danh sách lớp và mã định danh học sinh để xác thực vào phòng thi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsClassModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>Thêm lớp mới</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Class Tabs on Left, Student list on Right */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left: Class selection list */}
        <div className="md:col-span-1 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Danh sách lớp ({classes.length})
          </span>
          <div className="bg-white rounded-xl border border-slate-200/80 p-2 shadow-xs space-y-1">
            {classes.map((cls) => {
              const count = students.filter((s) => s.lopId === cls.id).length;
              const isSelected = cls.id === selectedLopId;
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedLopId(cls.id)}
                  className={`w-full p-2.5 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold">{cls.tenLop}</div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      Khối {cls.khoi} · {cls.namHoc}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600 font-mono">
                    {count} HS
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Student Roster */}
        <div className="md:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {currentClass ? `Danh sách lớp ${currentClass.tenLop}` : 'Chọn lớp'}
                </h3>
                <span className="text-xs text-slate-500">
                  {classStudents.length} học sinh trong lớp
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBulkOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Nhập danh sách</span>
                </button>
                <button
                  onClick={() => setIsStudentModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Thêm học sinh</span>
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mt-4 mb-4 relative max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc mã học sinh..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">STT</th>
                    <th className="py-2.5 px-3">Mã học sinh</th>
                    <th className="py-2.5 px-3">Họ và tên</th>
                    <th className="py-2.5 px-3">Ngày sinh</th>
                    <th className="py-2.5 px-3 text-right">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Chưa có học sinh nào trong lớp này.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((hs, idx) => (
                      <tr key={hs.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                          {hs.maHS}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {hs.hoTen}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{hs.ngaySinh || '--'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Xóa học sinh ${hs.hoTen}?`)) onDeleteStudent(hs.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Class Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tạo lớp học mới</h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveClass} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên lớp</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-bold"
                  placeholder="Ví dụ: 12A3"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Khối</label>
                  <select
                    value={classGrade}
                    onChange={(e) => setClassGrade(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  >
                    <option value={10}>Khối 10</option>
                    <option value={11}>Khối 11</option>
                    <option value={12}>Khối 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Năm học</label>
                  <input
                    type="text"
                    value={classYear}
                    onChange={(e) => setClassYear(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Tạo lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Modal */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Thêm học sinh</h3>
              <button onClick={() => setIsStudentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mã học sinh</label>
                <input
                  type="text"
                  value={studentMa}
                  onChange={(e) => setStudentMa(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono font-bold uppercase"
                  placeholder="HS1205"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-bold"
                  placeholder="Nguyễn Văn B"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày sinh</label>
                <input
                  type="text"
                  value={studentDob}
                  onChange={(e) => setStudentDob(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-xs"
                  placeholder="dd/MM/yyyy"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Thêm vào lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Students Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Nhập danh sách học sinh</h3>
              <button onClick={() => setIsBulkOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Nhập mỗi học sinh một dòng theo mẫu: <code>MãHS, Họ và tên, Ngày sinh</code>
            </p>
            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg font-mono"
              placeholder={`HS1205, Đỗ Đức Anh, 12/04/2008\nHS1206, Hoàng Hải Yến, 28/09/2008`}
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsBulkOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkImport}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                Nhập danh sách
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
