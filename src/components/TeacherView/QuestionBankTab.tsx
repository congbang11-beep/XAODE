import React, { useState } from 'react';
import { CauHoi, QuestionType, CognitiveLevel } from '../../types';
import { FormulaRenderer } from '../FormulaRenderer';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  HelpCircle,
  Copy,
  UploadCloud,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface Props {
  questions: CauHoi[];
  onSaveQuestion: (question: CauHoi) => Promise<void>;
  onDeleteQuestions: (ids: string[]) => Promise<void>;
}

export const QuestionBankTab: React.FC<Props> = ({
  questions,
  onSaveQuestion,
  onDeleteQuestions
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  // Modal states
  const [editingQuestion, setEditingQuestion] = useState<CauHoi | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [saving, setSaving] = useState(false);

  // Form states for modal
  const [formData, setFormData] = useState<Partial<CauHoi>>({
    loai: 'TN',
    monHoc: 'Toán',
    khoi: 12,
    chuDe: '',
    bai: '',
    mucDo: 'TH',
    noiDung: '',
    phuongAn: ['', '', '', ''],
    dapAn: 'A',
    loiGiai: '',
    diem: 0.25,
    khongTron: false,
    tags: ''
  });

  // Unique lists for filters
  const subjects = Array.from(new Set(questions.map((q) => q.monHoc).filter(Boolean)));
  if (!subjects.includes('Toán')) subjects.unshift('Toán');

  // Filtered questions
  const filtered = questions.filter((q) => {
    if (filterType !== 'all' && q.loai !== filterType) return false;
    if (filterSubject !== 'all' && q.monHoc !== filterSubject) return false;
    if (filterLevel !== 'all' && q.mucDo !== filterLevel) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      const matchContent = (q.noiDung || '').toLowerCase().includes(s);
      const matchTopic = (q.chuDe || '').toLowerCase().includes(s);
      const matchTags = (q.tags || '').toLowerCase().includes(s);
      return matchContent || matchTopic || matchTags;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setFormData({
      loai: 'TN',
      monHoc: filterSubject !== 'all' ? filterSubject : 'Toán',
      khoi: 12,
      chuDe: 'Khảo sát hàm số',
      bai: '',
      mucDo: 'TH',
      noiDung: '',
      phuongAn: ['', '', '', ''],
      dapAn: 'A',
      loiGiai: '',
      diem: 0.25,
      khongTron: false,
      tags: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q: CauHoi) => {
    setEditingQuestion(q);
    setFormData({
      ...q,
      phuongAn: q.phuongAn ? [...q.phuongAn] : ['', '', '', '']
    });
    setIsModalOpen(true);
  };

  const handleTypeChange = (type: QuestionType) => {
    let defScore = 0.25;
    let defAnswer = 'A';
    let options = formData.phuongAn || ['', '', '', ''];

    if (type === 'DS') {
      defScore = 1.0;
      defAnswer = 'ĐSĐS';
      if (options.length < 4) options = ['', '', '', ''];
    } else if (type === 'TLN') {
      defScore = 0.5;
      defAnswer = '';
      options = [];
    } else if (type === 'TL') {
      defScore = 1.0;
      defAnswer = '';
      options = [];
    } else {
      // TN
      defScore = 0.25;
      defAnswer = 'A';
      if (options.length < 4) options = ['', '', '', ''];
    }

    setFormData({
      ...formData,
      loai: type,
      diem: defScore,
      dapAn: defAnswer,
      phuongAn: options
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.noiDung?.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    setSaving(true);
    try {
      const qToSave: CauHoi = {
        id: editingQuestion?.id || '',
        loai: formData.loai as QuestionType,
        monHoc: formData.monHoc || 'Toán',
        khoi: Number(formData.khoi || 12),
        chuDe: formData.chuDe || '',
        bai: formData.bai || '',
        mucDo: (formData.mucDo || 'TH') as CognitiveLevel,
        noiDung: formData.noiDung.trim(),
        hinhAnh: formData.hinhAnh || '',
        phuongAn: formData.loai === 'TN' || formData.loai === 'DS' ? formData.phuongAn || [] : [],
        dapAn: formData.dapAn || '',
        loiGiai: formData.loiGiai || '',
        diem: Number(formData.diem || 0.25),
        khongTron: !!formData.khongTron,
        tags: formData.tags || '',
        createdAt: editingQuestion?.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      await onSaveQuestion(qToSave);
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Lỗi lưu câu hỏi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      await onDeleteQuestions([id]);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    try {
      // Quick parser for lines or JSON
      let importedQuestions: CauHoi[] = [];
      if (bulkText.trim().startsWith('[') || bulkText.trim().startsWith('{')) {
        const parsed = JSON.parse(bulkText);
        importedQuestions = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // Simple plain-text parser: questions separated by "Câu "
        const blocks = bulkText.split(/(?:^|\n)(?=Câu\s+\d+[:.])/gi).filter((b) => b.trim());
        importedQuestions = blocks.map((block, idx) => {
          const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
          const firstLine = lines[0] || '';
          const noiDung = lines.slice(0, Math.min(lines.length, 3)).join(' ');
          return {
            id: '',
            loai: 'TN' as QuestionType,
            monHoc: filterSubject !== 'all' ? filterSubject : 'Toán',
            khoi: 12,
            chuDe: 'Nhập nhanh',
            mucDo: 'TH' as CognitiveLevel,
            noiDung: noiDung || firstLine,
            phuongAn: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
            dapAn: 'A',
            loiGiai: '',
            diem: 0.25,
            createdAt: Date.now() + idx,
            updatedAt: Date.now() + idx
          };
        });
      }

      for (const q of importedQuestions) {
        await onSaveQuestion(q);
      }
      setIsBulkImportOpen(false);
      setBulkText('');
      alert(`Đã thêm thành công ${importedQuestions.length} câu hỏi vào ngân hàng!`);
    } catch (e: any) {
      alert('Lỗi định dạng khi nhập nhanh: ' + e.message);
    }
  };

  const getLevelLabel = (lvl: string) => {
    switch (lvl) {
      case 'NB':
        return { text: 'Nhận biết', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'TH':
        return { text: 'Thông hiểu', color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'VD':
        return { text: 'Vận dụng', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'VDC':
        return { text: 'Vận dụng cao', color: 'text-rose-700 bg-rose-50 border-rose-200' };
      default:
        return { text: lvl, color: 'text-slate-700 bg-slate-50 border-slate-200' };
    }
  };

  const getTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'TN':
        return 'Trắc nghiệm 4 lựa chọn';
      case 'DS':
        return 'Đúng / Sai 4 ý';
      case 'TLN':
        return 'Trả lời ngắn';
      case 'TL':
        return 'Tự luận';
    }
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Ngân hàng câu hỏi ({filtered.length} / {questions.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân loại theo môn học, khối lớp, 4 mức độ nhận thức và chuẩn cấu trúc đề 2025
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-slate-500" />
            <span>Nhập nhanh</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo câu hỏi mới</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nội dung, chủ đề, từ khóa..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Type filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Tất cả loại câu hỏi</option>
              <option value="TN">Phần I: Trắc nghiệm 4 lựa chọn (TN)</option>
              <option value="DS">Phần II: Đúng / Sai 4 ý (DS)</option>
              <option value="TLN">Phần III: Trả lời ngắn (TLN)</option>
              <option value="TL">Phần IV: Tự luận (TL)</option>
            </select>
          </div>

          {/* Subject filter */}
          <div>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Tất cả môn học</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  Môn {s}
                </option>
              ))}
            </select>
          </div>

          {/* Cognitive Level filter */}
          <div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Tất cả mức độ nhận thức</option>
              <option value="NB">Nhận biết (NB)</option>
              <option value="TH">Thông hiểu (TH)</option>
              <option value="VD">Vận dụng (VD)</option>
              <option value="VDC">Vận dụng cao (VDC)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Question List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
            <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">Không tìm thấy câu hỏi phù hợp với bộ lọc.</p>
            <p className="text-xs mt-1">Hãy thử xóa bộ lọc hoặc bấm "Tạo câu hỏi mới".</p>
          </div>
        ) : (
          filtered.map((q, idx) => {
            const lvl = getLevelLabel(q.mucDo);
            return (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-indigo-50 text-indigo-700 border-indigo-200">
                      {getTypeLabel(q.loai)}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${lvl.color}`}>
                      {lvl.text}
                    </span>
                    <span className="text-xs text-slate-500">
                      Môn {q.monHoc} · Khối {q.khoi}
                    </span>
                    {q.chuDe && (
                      <span className="text-xs text-slate-400">
                        · {q.chuDe}
                      </span>
                    )}
                    <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      {q.diem || 0.25} điểm
                    </span>
                    {q.khongTron && (
                      <span className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Cố định vị trí
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                      title="Chỉnh sửa câu hỏi"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content body */}
                <FormulaRenderer content={q.noiDung} className="text-sm font-medium text-slate-900" />

                {/* Options display based on type */}
                {q.loai === 'TN' && q.phuongAn && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                    {q.phuongAn.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isCorrect = q.dapAn?.trim().toUpperCase() === letter;
                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-colors ${
                            isCorrect
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-medium'
                              : 'bg-slate-50/50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="pt-0.5 break-words flex-1">{opt}</span>
                          {isCorrect && (
                            <span className="text-[10px] uppercase font-bold text-emerald-700 px-1.5 py-0.5 bg-emerald-100 rounded shrink-0">
                              Đáp án đúng
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.loai === 'DS' && q.phuongAn && (
                  <div className="space-y-1.5 pt-1 border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-100/70 px-3 py-1.5 text-[11px] font-semibold text-slate-600 flex justify-between items-center">
                      <span>Các mệnh đề</span>
                      <span className="w-24 text-center">Đáp án đúng</span>
                    </div>
                    {q.phuongAn.map((stmt, sIdx) => {
                      const answerChar = (q.dapAn || '')[sIdx] || 'Đ';
                      const isDung = answerChar === 'Đ' || answerChar === 'D' || answerChar === '1';
                      return (
                        <div
                          key={sIdx}
                          className="px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50/70 transition-colors border-t border-slate-100"
                        >
                          <span className="text-slate-800 pr-4">{stmt}</span>
                          <span
                            className={`w-24 text-center px-2 py-0.5 rounded font-bold text-xs shrink-0 ${
                              isDung
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {isDung ? 'ĐÚNG' : 'SAI'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.loai === 'TLN' && (
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">
                      Đáp án chấp nhận:
                    </span>
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      {q.dapAn || '(Chưa nhập)'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      (Nhiều đáp án cách nhau bởi dấu chấm phẩy ;)
                    </span>
                  </div>
                )}

                {q.loai === 'TL' && (
                  <div className="pt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    <span className="font-semibold text-slate-900 block mb-1">
                      Biểu điểm & Gợi ý chấm:
                    </span>
                    <p className="whitespace-pre-line">{q.dapAn || '(Chưa nhập gợi ý)'}</p>
                  </div>
                )}

                {/* Explanation */}
                {q.loiGiai && (
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-900">
                    <span className="font-bold text-amber-950 block mb-0.5">
                      Lời giải chi tiết:
                    </span>
                    <p className="whitespace-pre-line leading-relaxed">{q.loiGiai}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Question Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingQuestion ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Type selection tabs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Dạng câu hỏi (Chuẩn THPT 2025)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'TN', label: 'Trắc nghiệm (TN)', sub: '4 phương án A,B,C,D' },
                    { id: 'DS', label: 'Đúng / Sai (DS)', sub: '4 mệnh đề a,b,c,d' },
                    { id: 'TLN', label: 'Trả lời ngắn (TLN)', sub: 'Điền số / phân số' },
                    { id: 'TL', label: 'Tự luận (TL)', sub: 'Giáo viên chấm tay' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTypeChange(item.id as QuestionType)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        formData.loai === item.id
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject, Grade, Level, Score */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Môn học
                  </label>
                  <input
                    type="text"
                    value={formData.monHoc}
                    onChange={(e) => setFormData({ ...formData, monHoc: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    placeholder="Toán, Vật lí, Hóa..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Khối lớp
                  </label>
                  <select
                    value={formData.khoi}
                    onChange={(e) => setFormData({ ...formData, khoi: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  >
                    <option value={10}>Lớp 10</option>
                    <option value={11}>Lớp 11</option>
                    <option value={12}>Lớp 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mức độ nhận thức
                  </label>
                  <select
                    value={formData.mucDo}
                    onChange={(e) => setFormData({ ...formData, mucDo: e.target.value as CognitiveLevel })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  >
                    <option value="NB">Nhận biết</option>
                    <option value="TH">Thông hiểu</option>
                    <option value="VD">Vận dụng</option>
                    <option value="VDC">Vận dụng cao</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Điểm số câu
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.diem}
                    onChange={(e) => setFormData({ ...formData, diem: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Topic & Lesson */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chủ đề / Chuyên đề
                  </label>
                  <input
                    type="text"
                    value={formData.chuDe}
                    onChange={(e) => setFormData({ ...formData, chuDe: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    placeholder="e.g. Khảo sát hàm số, Dao động cơ..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Từ khóa / Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    placeholder="cực trị, tiệm cận, Oxyz..."
                  />
                </div>
              </div>

              {/* Question Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nội dung câu hỏi (hỗ trợ công thức trong $...$ hoặc ký tự toán học)
                </label>
                <textarea
                  rows={4}
                  value={formData.noiDung}
                  onChange={(e) => setFormData({ ...formData, noiDung: e.target.value })}
                  className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed"
                  placeholder="Nhập đề bài câu hỏi tại đây..."
                  required
                />
              </div>

              {/* Conditional Options by Question Type */}
              {formData.loai === 'TN' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    4 Phương án trắc nghiệm (Chọn đáp án đúng)
                  </label>
                  {['A', 'B', 'C', 'D'].map((letter, idx) => (
                    <div key={letter} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, dapAn: letter })}
                        className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border transition-colors ${
                          formData.dapAn === letter
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Bấm để chọn làm đáp án đúng"
                      >
                        {letter}
                      </button>
                      <input
                        type="text"
                        value={formData.phuongAn?.[idx] || ''}
                        onChange={(e) => {
                          const newOpts = [...(formData.phuongAn || ['', '', '', ''])];
                          newOpts[idx] = e.target.value;
                          setFormData({ ...formData, phuongAn: newOpts });
                        }}
                        className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                        placeholder={`Nội dung phương án ${letter}...`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {formData.loai === 'DS' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    4 Mệnh đề Đúng / Sai (a, b, c, d)
                  </label>
                  {['a', 'b', 'c', 'd'].map((letter, idx) => {
                    const currentArr = (formData.dapAn || 'ĐĐĐĐ').split('');
                    const isDung = currentArr[idx] === 'Đ';
                    return (
                      <div key={letter} className="flex items-center gap-2">
                        <span className="w-5 text-center font-bold text-xs text-slate-500 shrink-0">
                          {letter})
                        </span>
                        <input
                          type="text"
                          value={formData.phuongAn?.[idx] || ''}
                          onChange={(e) => {
                            const newOpts = [...(formData.phuongAn || ['', '', '', ''])];
                            newOpts[idx] = e.target.value;
                            setFormData({ ...formData, phuongAn: newOpts });
                          }}
                          className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                          placeholder={`Mệnh đề ${letter}...`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newArr = [...currentArr];
                            newArr[idx] = isDung ? 'S' : 'Đ';
                            setFormData({ ...formData, dapAn: newArr.join('') });
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border shrink-0 transition-colors ${
                            isDung
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {isDung ? 'ĐÚNG' : 'SAI'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {formData.loai === 'TLN' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đáp án chuẩn cho Trả lời ngắn
                  </label>
                  <input
                    type="text"
                    value={formData.dapAn}
                    onChange={(e) => setFormData({ ...formData, dapAn: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                    placeholder="Ví dụ: 100 hoặc 2/3;0.67;0,67 (cách nhau bởi dấu chấm phẩy)"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Hệ thống tự động hiểu phân số (2/3 = 4/6) và dấu phẩy thập phân (2,5 = 2.5).
                  </p>
                </div>
              )}

              {formData.loai === 'TL' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gợi ý đáp án & Biểu điểm tự luận
                  </label>
                  <textarea
                    rows={3}
                    value={formData.dapAn}
                    onChange={(e) => setFormData({ ...formData, dapAn: e.target.value })}
                    className="w-full p-3 text-xs border border-slate-200 rounded-lg"
                    placeholder="Gợi ý các bước giải và thang điểm để giáo viên đối chiếu khi chấm..."
                  />
                </div>
              )}

              {/* Detailed Solution */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lời giải chi tiết (hiển thị cho học sinh sau khi nộp bài)
                </label>
                <textarea
                  rows={3}
                  value={formData.loiGiai || ''}
                  onChange={(e) => setFormData({ ...formData, loiGiai: e.target.value })}
                  className="w-full p-3 text-xs border border-slate-200 rounded-lg"
                  placeholder="Giải thích từng bước để học sinh xem lại sau khi nộp..."
                />
              </div>

              {/* Fixed option */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="khongTron"
                  checked={formData.khongTron}
                  onChange={(e) => setFormData({ ...formData, khongTron: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="khongTron" className="text-xs text-slate-700 font-medium">
                  Cố định vị trí câu hỏi này (không xáo trộn khi giáo viên trộn đề)
                </label>
              </div>

              {/* Modal footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu câu hỏi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                Nhập nhanh câu hỏi hàng loạt
              </h3>
              <button
                onClick={() => setIsBulkImportOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Dán văn bản các câu hỏi ngăn cách bởi <code>Câu 1:</code>, <code>Câu 2:</code> hoặc mảng JSON câu hỏi:
              </p>
              <textarea
                rows={10}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="w-full p-3 font-mono text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                placeholder={`Câu 1: Cho hàm số y = f(x) có bảng biến thiên...\nCâu 2: Trong không gian Oxyz cho điểm A(1; 2; 3)...`}
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsBulkImportOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={handleBulkImport}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Nhập vào ngân hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
