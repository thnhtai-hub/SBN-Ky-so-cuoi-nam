import React, { useState, useMemo } from 'react';
import { Search, Filter, FileSignature, CheckCircle2, Circle, Loader2, FileText, ChevronRight, Check, Clock, Download, MessageSquare, X, Stamp, Utensils, Palette, Gamepad2, Users, Baby, User, MapPin, Image as ImageIcon, GraduationCap, CheckCircle, Info } from 'lucide-react';
import { MOCK_STUDENTS } from '../data';
import { Role, Student, SigningStatus, TabType } from '../types';

interface StudentListProps {
  currentRole: Role;
  students: Student[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const getNextStatus = (currentStatus: SigningStatus, role: Role): SigningStatus | null => {
  if (role === 'teacher' && currentStatus === 'created') return 'signed_teacher';
  if (role === 'principal' && currentStatus === 'signed_teacher') return 'signed_principal';
  if (role === 'clerk' && currentStatus === 'signed_principal') return 'signed_clerk';
  return null;
};

const isSignedByRole = (currentStatus: SigningStatus, role: Role): boolean => {
  if (role === 'teacher') return ['signed_teacher', 'signed_principal', 'signed_clerk'].includes(currentStatus);
  if (role === 'principal') return ['signed_principal', 'signed_clerk'].includes(currentStatus);
  if (role === 'clerk') return ['signed_clerk'].includes(currentStatus);
  return false;
};

export default function StudentList({ currentRole, students: initialStudents, activeTab, onTabChange }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSignatureStatus, setSelectedSignatureStatus] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBookStatus, setSelectedBookStatus] = useState('all');
  const [localStudents, setLocalStudents] = useState<Student[]>([]);
  const [signingIds, setSigningIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showSigningPreview, setShowSigningPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [previewSigningIds, setPreviewSigningIds] = useState<string[]>([]);
  const [viewingPdfStudent, setViewingPdfStudent] = useState<Student | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureTab, setSignatureTab] = useState<'draw' | 'upload'>('draw');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Sync local students with prop
  React.useEffect(() => {
    setLocalStudents(initialStudents);
  }, [initialStudents]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredStudents = useMemo(() => {
    return localStudents.filter(student => {
      // Filter by tab
      if (activeTab === 'input' && student.status === 'pending_create') return false;
      if (activeTab === 'signature') {
        if (student.status === 'pending_create') return false;
      }
      if (activeTab === 'view' && student.status !== 'signed_clerk') return false;

      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            student.studentId.includes(searchTerm);
      const matchesGroup = selectedGroup === 'all' || student.group === selectedGroup;
      const matchesClass = selectedClass === 'all' || student.className === selectedClass;
      const matchesSignatureStatus = selectedSignatureStatus === 'all' || 
                                     (selectedSignatureStatus === 'signed' ? isSignedByRole(student.status, currentRole) : !isSignedByRole(student.status, currentRole));
      
      return matchesSearch && matchesGroup && matchesClass && (activeTab === 'signature' ? matchesSignatureStatus : true);
    });
  }, [localStudents, searchTerm, selectedGroup, selectedClass, selectedSignatureStatus, activeTab, currentRole]);

  // Reset selection when filters change
  useMemo(() => {
    setSelectedIds([]);
  }, [selectedGroup, selectedClass, selectedStatus, selectedBookStatus, searchTerm, currentRole]);

  const executeSign = (ids: string[]) => {
    if (ids.length === 0) return;

    setSigningIds(prev => [...prev, ...ids]);

    setTimeout(() => {
      setLocalStudents(prev => prev.map(s => {
        if (ids.includes(s.id)) {
          const next = getNextStatus(s.status, currentRole);
          return next ? { ...s, status: next } : s;
        }
        return s;
      }));
      setSigningIds(prev => prev.filter(id => !ids.includes(id)));
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
      setShowSigningPreview(false);
    }, 1500);
  };

  const handleSign = (studentId: string) => {
    const student = localStudents.find(s => s.id === studentId);
    if (!student) return;

    const nextStatus = getNextStatus(student.status, currentRole);
    if (!nextStatus) return;

    if (currentRole === 'teacher' || currentRole === 'principal' || currentRole === 'clerk') {
      setPreviewSigningIds([studentId]);
      setShowSigningPreview(true);
      return;
    }

    executeSign([studentId]);
  };

  const handleBulkSign = () => {
    // Only sign selected students that are actionable
    const actionableSelectedStudents = filteredStudents.filter(s => 
      selectedIds.includes(s.id) && getNextStatus(s.status, currentRole)
    );
    
    if (actionableSelectedStudents.length === 0) return;

    if (currentRole === 'teacher' || currentRole === 'principal' || currentRole === 'clerk') {
      setPreviewSigningIds(actionableSelectedStudents.map(s => s.id));
      setShowSigningPreview(true);
      return;
    }

    executeSign(actionableSelectedStudents.map(s => s.id));
  };

  const handleBulkExport = () => {
    if (selectedIds.length === 0) return;
    
    setSigningIds(prev => [...prev, ...selectedIds]);
    
    // Simulate export process
    setTimeout(() => {
      setSigningIds(prev => prev.filter(id => !selectedIds.includes(id)));
      setSelectedIds([]);
      alert(`Đã xuất thành công ${selectedIds.length} sổ PDF!`);
    }, 1500);
  };

  const toggleSelectAll = () => {
    const selectableStudents = filteredStudents.filter(s => {
      return activeTab === 'view' || !!getNextStatus(s.status, currentRole);
    });

    if (selectedIds.length === selectableStudents.length && selectableStudents.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableStudents.map(s => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const renderStatusCell = (role: 'teacher' | 'principal' | 'clerk', currentStatus: SigningStatus) => {
    const isSigned = isSignedByRole(currentStatus, role);

    if (isSigned) {
      let signedText = 'Đã ký';

      return (
        <div className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-full border border-green-200 bg-green-50 text-green-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{signedText}</span>
        </div>
      );
    }

    if (role === 'teacher' && currentStatus === 'pending_create') {
      return (
        <div className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-full border border-orange-200 bg-orange-50 text-orange-700">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Chưa khởi tạo</span>
        </div>
      );
    }

    let waitingText = 'Chờ ký';
    let WaitingIcon = Clock;
    
    if (role === 'clerk') waitingText = 'Chờ đóng dấu';

    return (
      <div className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700">
        <WaitingIcon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{waitingText}</span>
      </div>
    );
  };

  const actionableCount = filteredStudents.filter(s => activeTab === 'view' || getNextStatus(s.status, currentRole)).length;
  const selectedActionableCount = filteredStudents.filter(s => selectedIds.includes(s.id) && (activeTab === 'view' ? true : getNextStatus(s.status, currentRole))).length;

  if (activeTab === 'input' && filteredStudents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border-2 border-white shadow-xl text-center px-10 max-w-5xl mx-auto mt-4">
        <div className="w-24 h-24 bg-cyan-50 rounded-full flex items-center justify-center mb-10 relative">
          <div className="absolute inset-0 bg-cyan-100/50 rounded-full animate-ping"></div>
          <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center relative z-10">
            <Info className="w-10 h-10 text-[#0d9488]" />
          </div>
        </div>
        <h3 className="text-3xl font-bold text-gray-800 mb-4 uppercase tracking-tight">Chưa có sổ nào để nhập liệu</h3>
        <p className="text-gray-500 max-w-2xl leading-relaxed text-xl">
          Giáo viên chưa có sổ nào để nhập liệu, cần khởi tạo sổ trước. <br />
          Vui lòng quay lại mục 
          <button 
            onClick={() => onTabChange('initialization')}
            className="ml-2 font-semibold text-[#0d9488] hover:text-[#0b7a6f] underline underline-offset-4 decoration-2 transition-all"
          >
            Khởi tạo sổ
          </button>
          {' '}để tiến hành tạo sổ.
        </p>
      </div>
    );
  }

  const pagination = (
    <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
      <span>Hiển thị 1-{filteredStudents.length} trên tổng số {localStudents.length} bản ghi</span>
      <div className="flex space-x-1">
        <button className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50" disabled>Trước</button>
        <button className="px-2 py-1 border rounded bg-teal-600 text-white">1</button>
        <button className="px-2 py-1 border rounded hover:bg-gray-50">2</button>
        <button className="px-2 py-1 border rounded hover:bg-gray-50">Sau</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {activeTab === 'input' ? (
        <div className="bg-white p-6 rounded-xl border-2 border-white shadow-md space-y-6">
          {/* Filters for Input Tab */}
          <div className="p-3 bg-cyan-50/40 rounded-lg flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center shrink-0">
              <select 
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white shadow-sm min-w-[160px]"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                <option value="all">Tất cả nhóm lớp</option>
                <option value="Nhà trẻ">Nhà trẻ</option>
                <option value="Mẫu giáo">Mẫu giáo</option>
              </select>

              <select 
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white shadow-sm min-w-[140px]"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="all">Tất cả lớp</option>
                <option value="Chồi 1">Chồi 1</option>
                <option value="Chồi 2">Chồi 2</option>
                <option value="Lá 1">Lá 1</option>
                <option value="Lá 2">Lá 2</option>
              </select>
            </div>

            <div className="relative w-full flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Table for Input Tab */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
              <thead className="bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-white uppercase text-xs font-bold">
                <tr>
                  <th className="p-4 border-r border-white/20 text-center text-xs font-bold uppercase tracking-wider w-16">STT</th>
                  <th className="p-4 border-r border-white/20 text-center text-xs font-bold uppercase tracking-wider">MÃ SỐ ĐỊNH DANH</th>
                  <th className="p-4 border-r border-white/20 text-center text-xs font-bold uppercase tracking-wider">HỌ VÀ TÊN</th>
                  <th className="p-4 border-r border-white/20 text-center text-xs font-bold uppercase tracking-wider">NHÓM LỚP</th>
                  <th className="p-4 border-r border-white/20 text-center text-xs font-bold uppercase tracking-wider">LỚP</th>
                  <th className="p-4 border-r border-white/20 text-center text-xs font-bold uppercase tracking-wider">MÃ SỐ SỔ</th>
                  <th className="p-4 text-center text-xs font-bold uppercase tracking-wider">HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student, index) => (
                  <tr 
                    key={student.id} 
                    className="transition-colors cursor-pointer hover:bg-gray-100"
                    onClick={() => setViewingPdfStudent(student)}
                  >
                    <td className="p-4 border-r border-gray-200 text-center text-sm text-gray-500">{index + 1}</td>
                    <td className="p-4 border-r border-gray-200 text-center text-sm text-gray-500 font-mono">{student.studentId}</td>
                    <td className="p-4 border-r border-gray-200 text-sm font-bold text-gray-800 uppercase">{student.name}</td>
                    <td className="p-4 border-r border-gray-200 text-center text-sm text-gray-600">{student.group}</td>
                    <td className="p-4 border-r border-gray-200 text-center text-sm text-gray-600">{student.className}</td>
                    <td className="p-4 border-r border-gray-200 text-center text-sm">
                      <span className="font-bold text-teal-700">{student.bookId}</span>
                    </td>
                    <td className="p-4 text-center text-sm">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingPdfStudent(student);
                        }}
                        className="text-[#0d9488] hover:text-[#0b7a6f] font-bold text-[13px] transition-colors"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination}
        </div>
      ) : (
        <>
          {activeTab === 'signature' && (
            <div className="flex items-center gap-4 p-5 bg-white border-2 border-amber-100 rounded-2xl text-amber-900 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400 group-hover:w-2 transition-all"></div>
              <div className="p-3 bg-amber-50 rounded-xl shrink-0 shadow-inner">
                <Info className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600/70">Thông tin lưu ý</div>
                <div className="text-[15px] font-medium leading-relaxed text-amber-900">
                  Hệ thống chỉ cho phép ký số cuối năm với các sổ đã hoàn thành <span className="font-bold text-amber-700 underline decoration-amber-300 decoration-2 underline-offset-4">nhận xét cuối năm</span>.
                </div>
              </div>
            </div>
          )}
          {activeTab === 'view' && currentRole === 'teacher' && (
            <div className="flex items-center gap-4 p-5 bg-white border-2 border-amber-100 rounded-2xl text-amber-900 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400 group-hover:w-2 transition-all"></div>
              <div className="p-3 bg-amber-50 rounded-xl shrink-0 shadow-inner">
                <Info className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600/70">Thông tin lưu ý</div>
                <div className="text-[15px] font-medium leading-relaxed text-amber-900">
                  Chỉ có thể xuất PDF đối với các sổ đã hoàn thành <span className="font-bold text-amber-700 underline decoration-amber-300 decoration-2 underline-offset-4">ký số cuối năm</span>.
                </div>
              </div>
            </div>
          )}
          <div className="bg-white p-6 rounded-xl border-2 border-white shadow-md space-y-6">
            {/* Filters & Actions for other tabs */}
          <div className="p-3 bg-cyan-50/40 rounded-lg flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center shrink-0">
              <select 
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white shadow-sm min-w-[160px]"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                <option value="all">Tất cả nhóm lớp</option>
                <option value="Nhà trẻ">Nhà trẻ</option>
                <option value="Mẫu giáo">Mẫu giáo</option>
              </select>

              <select 
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white shadow-sm min-w-[140px]"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="all">Tất cả lớp</option>
                <option value="Chồi 1">Chồi 1</option>
                <option value="Chồi 2">Chồi 2</option>
                <option value="Lá 1">Lá 1</option>
                <option value="Lá 2">Lá 2</option>
              </select>

              <select 
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white shadow-sm min-w-[140px]"
                value={selectedSignatureStatus}
                onChange={(e) => setSelectedSignatureStatus(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="waiting">Chờ ký</option>
                <option value="signed">Đã ký</option>
              </select>
            </div>

            <div className="relative w-full flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
              <button 
                onClick={activeTab === 'view' ? handleBulkExport : handleBulkSign}
                disabled={selectedActionableCount === 0 || signingIds.length > 0}
                className={`flex items-center space-x-2 ${activeTab === 'view' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-[#0d9488] hover:bg-[#0b7a6f]'} text-white px-5 py-1.5 rounded-lg shadow-sm text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:scale-95`}
              >
                {signingIds.length > 0 ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : activeTab === 'view' ? (
                  <Download className="w-4 h-4" />
                ) : currentRole === 'teacher' ? (
                  <FileSignature className="w-4 h-4" />
                ) : currentRole === 'clerk' ? (
                  <Stamp className="w-4 h-4" />
                ) : (
                  <FileSignature className="w-4 h-4" />
                )}
                <span>
                  {activeTab === 'view' ? 'Xuất PDF' : currentRole === 'teacher' ? 'Ký PDF' : currentRole === 'clerk' ? 'Đóng dấu' : 'Ký PDF'} {selectedActionableCount > 0 ? `(${selectedActionableCount})` : ''}
                </span>
              </button>
            </div>
          </div>

          {/* Table for other tabs */}
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
              <thead className="bg-[#0d9488] text-white uppercase text-xs font-bold">
                <tr>
                  <th className="px-4 py-4 w-10 text-center border-r border-white/10">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      checked={(() => {
                        const selectableStudents = filteredStudents.filter(s => {
                          return activeTab === 'view' || !!getNextStatus(s.status, currentRole);
                        });
                        return selectableStudents.length > 0 && selectedIds.length === selectableStudents.length;
                      })()}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-4 w-16 text-center border-r border-white/10">STT</th>
                  <th className="px-4 py-4 text-center border-r border-white/10">Mã số sổ</th>
                  <th className="px-4 py-4 border-r border-white/10">Họ và tên</th>
                  <th className="px-4 py-4 border-r border-white/10">Nhóm lớp</th>
                  <th className="px-4 py-4 border-r border-white/10">Lớp</th>
                  <th className="px-4 py-4 text-center border-r border-white/10">Giáo viên</th>
                  <th className="px-4 py-4 text-center border-r border-white/10">Hiệu trưởng</th>
                  <th className="px-4 py-4 text-center border-r border-white/10">Văn thư</th>
                  <th className="px-4 py-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStudents.map((student) => {
                  const hasBookId = student.status !== 'pending_create';
                  const showCheckbox = !!getNextStatus(student.status, currentRole);

                  return (
                    <tr key={student.id} className="hover:bg-teal-50/30 transition-colors border-b border-gray-50">
                      <td className="px-4 py-4 text-center border-r border-gray-50">
                        {(activeTab === 'view' || showCheckbox) && (
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                            checked={selectedIds.includes(student.id)}
                            onChange={() => toggleSelect(student.id)}
                          />
                        )}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-500 border-r border-gray-50">{student.stt}</td>
                      <td className="px-4 py-4 text-center border-r border-gray-50">
                        {hasBookId ? (
                          <span className="font-bold text-teal-700">{student.bookId}</span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Chưa có</span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-bold text-gray-800 uppercase border-r border-gray-50">{student.name}</td>
                      <td className="px-4 py-4 text-gray-600 border-r border-gray-50">{student.group}</td>
                      <td className="px-4 py-4 text-gray-600 border-r border-gray-50">{student.className}</td>
                      
                      {/* Status Columns */}
                      <td className="px-4 py-4 border-r border-gray-50 text-center">
                        {renderStatusCell('teacher', student.status)}
                      </td>
                      <td className="px-4 py-4 border-r border-gray-50 text-center">
                        {renderStatusCell('principal', student.status)}
                      </td>
                      <td className="px-4 py-4 border-r border-gray-50 text-center">
                        {renderStatusCell('clerk', student.status)}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => setViewingPdfStudent(student)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-slate-700 hover:bg-gray-50 font-bold text-xs transition-all shadow-sm active:scale-95"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Xem</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-gray-400 italic">
                      Không tìm thấy học sinh nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {pagination}
        </div>
        </>
      )}
      {/* Teacher Comment Method Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Chọn phương thức nhận xét</h3>
              <button 
                onClick={() => setShowCommentModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600 text-sm mb-2">
                Bạn đang chọn nhận xét cho <span className="font-semibold text-gray-900">{selectedActionableCount}</span> học sinh. Hệ thống sẽ điều hướng về trang danh sách học sinh để nhập nhận xét cho các bé.
              </p>
              
              <button 
                onClick={() => {
                  console.log('Navigate to individual comment');
                  const actionableIds = filteredStudents
                    .filter(s => selectedIds.includes(s.id) && getNextStatus(s.status, currentRole))
                    .map(s => s.id);
                  executeSign(actionableIds);
                  setShowCommentModal(false);
                }}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all group bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 text-blue-600 rounded-full group-hover:bg-blue-200 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Tiếp tục</div>
                    <div className="text-xs text-gray-500">Chuyển đến trang nhập nhận xét</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewingPdfStudent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sổ Bé Ngoan - {viewingPdfStudent.name}</h3>
                  <p className="text-xs text-gray-500">Mã số: SBN{viewingPdfStudent.studentId} • Lớp: {viewingPdfStudent.className}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingPdfStudent(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-[#f8f9fa] p-4 md:p-8 overflow-y-auto font-sans text-gray-800">
              <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Thông tin học sinh */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-bold mb-6 text-gray-900">Thông tin học sinh</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Mã học sinh</div>
                      <div className="font-bold text-gray-900">SBN{viewingPdfStudent.studentId}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Lớp</div>
                      <div className="font-bold text-gray-900">{viewingPdfStudent.className}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Năm học</div>
                      <div className="font-bold text-gray-900">2025-2026</div>
                    </div>
                  </div>
                </div>

                {/* Thông tin của bé */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-bold mb-6 text-gray-900">Thông tin của bé</h2>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Hình của bé</h3>
                    <img src="https://i.postimg.cc/GhCPLrMT/Anh-be-trai-3-tuoi.jpg" alt="Bé" className="w-32 h-32 rounded-2xl object-cover shadow-sm" />
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Sở thích của bé</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600"><Utensils size={20} /></div>
                        <div>
                          <div className="text-xs text-yellow-800 font-medium">Món ăn bé thích</div>
                          <div className="font-bold text-yellow-900">Cơm trắng</div>
                        </div>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600"><Palette size={20} /></div>
                        <div>
                          <div className="text-xs text-yellow-800 font-medium">Màu sắc bé thích</div>
                          <div className="font-bold text-yellow-900">Đỏ</div>
                        </div>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600"><Gamepad2 size={20} /></div>
                        <div>
                          <div className="text-xs text-yellow-800 font-medium">Đồ chơi bé thích</div>
                          <div className="font-bold text-yellow-900">Xe đạp, Xe máy đồ chơi</div>
                        </div>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600"><Users size={20} /></div>
                        <div>
                          <div className="text-xs text-yellow-800 font-medium">Gia đình có</div>
                          <div className="font-bold text-yellow-900">3 người</div>
                        </div>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600"><Baby size={20} /></div>
                        <div>
                          <div className="text-xs text-yellow-800 font-medium">Bé là con thứ</div>
                          <div className="font-bold text-yellow-900">1</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Hình gia đình của bé</h3>
                    <img src="https://i.postimg.cc/MKm7X44Q/chup-anh-be-va-gia-dinh.jpg" alt="Gia đình" className="w-48 h-32 rounded-2xl object-cover shadow-sm" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin gia đình</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      {/* Mẹ */}
                      <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-5">
                        <div className="flex items-center gap-2 text-purple-700 font-bold mb-4">
                          <User size={18} /> Mẹ
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between border-b border-purple-100 pb-2">
                            <span className="text-gray-500">Họ và tên:</span>
                            <span className="font-medium text-gray-900">—</span>
                          </div>
                          <div className="flex justify-between border-b border-purple-100 pb-2">
                            <span className="text-gray-500">Điện thoại:</span>
                            <span className="font-medium text-gray-900">—</span>
                          </div>
                          <div className="flex justify-between border-b border-purple-100 pb-2">
                            <span className="text-gray-500">Email:</span>
                            <span className="font-medium text-gray-900">—</span>
                          </div>
                          <div className="flex justify-between border-b border-purple-100 pb-2">
                            <span className="text-gray-500">Nghề nghiệp:</span>
                            <span className="font-medium text-gray-900">—</span>
                          </div>
                        </div>
                      </div>
                      {/* Cha */}
                      <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-5">
                        <div className="flex items-center gap-2 text-purple-700 font-bold mb-4">
                          <User size={18} /> Cha
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between border-b border-purple-100 pb-2">
                            <span className="text-gray-500">Họ và tên:</span>
                            <span className="font-medium text-gray-900">—</span>
                          </div>
                          <div className="flex justify-between border-b border-purple-100 pb-2">
                            <span className="text-gray-500">Điện thoại:</span>
                            <span className="font-medium text-gray-900">—</span>
                          </div>
                          <div className="flex justify-between border-b border-purple-100 pb-2">
                            <span className="text-gray-500">Email:</span>
                            <span className="font-medium text-gray-900">—</span>
                          </div>
                          <div className="flex justify-between border-b border-purple-100 pb-2">
                            <span className="text-gray-500">Nghề nghiệp:</span>
                            <span className="font-medium text-gray-900">—</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-green-700 font-semibold text-sm mb-2">
                          <MapPin size={16} /> Nơi ở thường trú
                        </div>
                        <div className="text-gray-900 font-medium">—</div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-green-700 font-semibold text-sm mb-2">
                          <MapPin size={16} /> Nơi ở tạm trú
                        </div>
                        <div className="text-gray-900 font-medium">—</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Đánh giá theo tháng */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-4">Đánh giá theo tháng</h2>
                  
                  {/* Tháng 1 */}
                  <div className="mb-8 border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <div className="inline-block bg-teal-500 text-white px-4 py-1.5 rounded-full font-bold text-sm mb-6">Tháng 1</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Left: 4 flowers */}
                      <div className="flex flex-col">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Hình ảnh theo tuần</h3>
                        <div className="grid grid-cols-2 grid-rows-2 gap-4 flex-1">
                          {[1, 2, 3, 4].map(week => (
                            <div key={week} className="relative border border-gray-200 rounded-xl overflow-hidden shadow-sm min-h-[120px]">
                              <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">TUẦN {week}</div>
                              <img src="https://i.postimg.cc/g0DQDNnD/698057eece53d27c7704dbaa.jpg" alt="Hoa bé ngoan" className="absolute inset-0 w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Monthly image */}
                      <div className="flex flex-col">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Hình tổng kết tháng</h3>
                        <div className="w-full flex-1 min-h-[200px] border border-gray-200 rounded-xl overflow-hidden shadow-sm relative">
                          <img src="https://i.postimg.cc/g0DQDNnD/698057eece53d27c7704dbaa.jpg" alt="Tổng kết tháng" className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Teacher evaluation full width */}
                    <div className="border border-gray-200 rounded-xl p-5 shadow-sm mb-6 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800"></div>
                      <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-3">
                        <GraduationCap size={16} /> Nhận xét của giáo viên
                      </div>
                      <p className="text-gray-700 mb-6 text-sm">Hay khóc đòi mẹ</p>
                      
                      <div className="border-t border-dashed border-gray-200 pt-4">
                        <div className="text-xs text-gray-500 font-semibold mb-2 uppercase">• Chữ ký giáo viên</div>
                        <div className="h-24 border border-blue-100 bg-blue-50/30 rounded-lg flex items-center justify-center w-full">
                          {['signed_teacher', 'signed_principal', 'signed_clerk'].includes(viewingPdfStudent.status) && (
                            <img src="https://i.postimg.cc/8CH9HtjR/chu-ky-ten-hau-dep-013424645.jpg" alt="Signature" className="h-16 object-contain mix-blend-multiply" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Parent opinion full width */}
                    <div className="border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800"></div>
                      <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm mb-3">
                        <User size={16} /> Ý kiến của gia đình
                      </div>
                      <p className="text-gray-700 mb-6 text-sm italic">Gia đình sẽ cố gắng rèn thêm cho bé ở nhà.</p>
                      
                      <div className="border-t border-dashed border-gray-200 pt-4">
                        <div className="text-xs text-gray-500 font-semibold mb-2 uppercase">• Chữ ký gia đình</div>
                        <div className="h-24 border border-blue-100 bg-blue-50/30 rounded-lg flex items-center justify-center w-full">
                          <img src="https://i.postimg.cc/8CH9HtjR/chu-ky-ten-hau-dep-013424645.jpg" alt="Signature" className="h-16 object-contain mix-blend-multiply" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nhận xét cuối năm */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-4">Nhận xét cuối năm</h2>
                  
                  {/* 1. Phát triển thể chất */}
                  <div className="mb-6 border border-blue-100 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">1</div>
                      <h3 className="text-lg font-bold text-gray-900">Phát triển thể chất</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="border border-gray-200 rounded-xl p-4 text-center">
                        <div className="text-xs text-gray-500 font-semibold uppercase mb-1">Cân nặng</div>
                        <div className="text-2xl font-bold text-gray-900">20 <span className="text-sm font-normal text-gray-500">kg</span></div>
                      </div>
                      <div className="border border-gray-200 rounded-xl p-4 text-center">
                        <div className="text-xs text-gray-500 font-semibold uppercase mb-1">Chiều cao</div>
                        <div className="text-2xl font-bold text-gray-900">100 <span className="text-sm font-normal text-gray-500">cm</span></div>
                      </div>
                      <div className="border border-gray-200 rounded-xl p-4 text-center">
                        <div className="text-xs text-gray-500 font-semibold uppercase mb-1">Sức khỏe</div>
                        <div className="text-xl font-bold text-gray-900">Bình thường</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm font-semibold text-blue-600 mb-2">Vận động thô</div>
                        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1 italic">
                          <li>Con thực hiện tốt các vận động cơ bản một cách vững vàng, đúng tư thế.</li>
                          <li>Chạy nhanh nhẹn, giữ thăng bằng tốt khi đi trên ghế thể dục.</li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-blue-600 mb-2">Vận động tinh</div>
                        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1 italic">
                          <li>Con thực hiện tốt các kỹ năng trong các hoạt động cần sự khéo léo.</li>
                          <li>Tô màu gọn gàng, không lem ra ngoài và biết phối màu sắc.</li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-blue-600 mb-2">Nề nếp sinh hoạt</div>
                        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1 italic">
                          <li>Ngủ trưa đúng giờ, giấc ngủ sâu và biết tự cất gối chăn.</li>
                          <li>Con tự lập và có thói quen tốt trong sinh hoạt hàng ngày.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 2. Phát triển nhận thức */}
                  <div className="mb-6 border border-blue-100 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">2</div>
                      <h3 className="text-lg font-bold text-gray-900">Phát triển nhận thức</h3>
                    </div>
                    <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1 italic">
                      <li>Ham học hỏi, thích tìm tòi và khám phá về môi trường xung quanh.</li>
                      <li>Nhận biết màu sắc, hình dạng và các chữ số rất nhanh chóng.</li>
                    </ul>
                  </div>

                  {/* 3. Phát triển ngôn ngữ */}
                  <div className="mb-6 border border-blue-100 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">3</div>
                      <h3 className="text-lg font-bold text-gray-900">Phát triển ngôn ngữ</h3>
                    </div>
                    <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1 italic">
                      <li>Con nghe hiểu và diễn đạt rõ ràng, mạch lạc các ý kiến.</li>
                      <li>Biết diễn đạt ý kiến cá nhân và nhu cầu của mình cho người khác.</li>
                    </ul>
                  </div>

                  {/* 4. Phát triển tình cảm */}
                  <div className="mb-6 border border-blue-100 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">4</div>
                      <h3 className="text-lg font-bold text-gray-900">Phát triển tình cảm và kĩ năng xã hội</h3>
                    </div>
                    <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1 italic">
                      <li>Hòa đồng, thân thiện và luôn vui vẻ với mọi người xung quanh.</li>
                      <li>Biết chia sẻ đồ chơi, giúp đỡ bạn bè khi gặp khó khăn.</li>
                    </ul>
                  </div>

                  {/* 5. Phát triển thẩm mĩ */}
                  <div className="mb-6 border border-blue-100 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">5</div>
                      <h3 className="text-lg font-bold text-gray-900">Phát triển thẩm mĩ</h3>
                    </div>
                    <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1 italic">
                      <li>Con biết cảm nhận, yêu quý cái đẹp và giữ gìn sản phẩm của mình.</li>
                      <li>Thích vẽ, tô màu và có những ý tưởng sáng tạo độc đáo.</li>
                    </ul>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="border border-purple-200 rounded-2xl p-6 relative overflow-hidden flex flex-col">
                      <div className="absolute left-0 top-0 right-0 h-1 bg-purple-500"></div>
                      <div className="flex items-center gap-2 text-purple-700 font-bold mb-4">
                        <GraduationCap size={20} /> Nhận xét của giáo viên phụ trách
                      </div>
                      <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1 italic mb-6 flex-1">
                        <li>Con có tiến bộ rõ rệt về mọi mặt phát triển trong học kỳ này.</li>
                      </ul>
                      <div className="border-t border-dashed border-purple-200 pt-4">
                        <div className="text-xs text-gray-500 font-semibold mb-2 uppercase">• Chữ ký giáo viên</div>
                        <div className="h-40 border border-blue-100 bg-blue-50/30 rounded-lg flex items-center justify-center w-full">
                          {['signed_teacher', 'signed_principal', 'signed_clerk'].includes(viewingPdfStudent.status) && (
                            <img src="https://i.postimg.cc/8CH9HtjR/chu-ky-ten-hau-dep-013424645.jpg" alt="Signature" className="h-32 object-contain mix-blend-multiply" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-orange-200 rounded-2xl p-6 relative overflow-hidden flex flex-col">
                      <div className="absolute left-0 top-0 right-0 h-1 bg-orange-500"></div>
                      <div className="flex items-center gap-2 text-orange-600 font-bold mb-4">
                        <CheckCircle size={20} /> Ý kiến của hiệu trưởng
                      </div>
                      <div className="flex-1"></div>
                      <div className="border-t border-dashed border-orange-200 pt-4">
                        <div className="text-xs text-gray-500 font-semibold mb-2 uppercase">• Chữ ký và đóng dấu</div>
                        <div className="h-40 border border-blue-100 bg-blue-50/30 rounded-lg flex items-center justify-center w-full relative">
                          {['signed_principal', 'signed_clerk'].includes(viewingPdfStudent.status) && (
                            <img src="https://i.postimg.cc/8CH9HtjR/chu-ky-ten-hau-dep-013424645.jpg" alt="Signature" className={`h-32 object-contain mix-blend-multiply ${viewingPdfStudent.status === 'signed_clerk' ? 'opacity-50 absolute' : ''}`} />
                          )}
                          {viewingPdfStudent.status === 'signed_clerk' && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-[160%] -translate-y-[75%] w-16 h-16 border-2 border-red-500 border-dashed rounded-full bg-red-50/50 flex items-center justify-center z-10">
                              <Stamp className="w-8 h-8 text-red-600" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signing Preview Modal */}
      {showSigningPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {currentRole === 'clerk' ? <Stamp className="w-5 h-5 text-teal-600" /> : <FileSignature className="w-5 h-5 text-teal-600" />}
                Xác nhận {currentRole === 'clerk' ? 'đóng dấu' : 'ký'} ({previewSigningIds.length} học sinh)
              </h3>
              <button 
                onClick={() => setShowSigningPreview(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              {/* Preview Area */}
              <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                <div className="max-w-3xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Card */}
                    <div className="border border-purple-200 rounded-2xl p-6 relative overflow-hidden bg-white shadow-sm flex flex-col">
                      <div className="absolute left-0 top-0 right-0 h-1 bg-purple-500"></div>
                      <div className="flex items-center gap-2 text-purple-600 font-bold mb-4">
                        <GraduationCap size={20} /> Nhận xét của giáo viên phụ trách
                      </div>
                      <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1 italic mb-6">
                        <li>Nhận xét của giáo viên phụ trách sẽ hiển thị tại đây.</li>
                      </ul>
                      <div className="border-t border-dashed border-purple-200 pt-4">
                        <div className="text-xs text-gray-500 font-semibold mb-2 uppercase">• Chữ ký giáo viên</div>
                        <div className="h-40 border border-blue-100 bg-blue-50/30 rounded-lg flex items-center justify-center w-full relative">
                          {currentRole === 'teacher' ? (
                            <div className="absolute inset-0 border-2 border-teal-500 border-dashed rounded-lg bg-teal-50/50 flex flex-col items-center justify-center animate-pulse z-10">
                              <FileSignature className="w-6 h-6 text-teal-600 mb-1" />
                              <span className="text-xs font-medium text-teal-700">Vị trí ký tên</span>
                            </div>
                          ) : (
                            <img src="https://i.postimg.cc/8CH9HtjR/chu-ky-ten-hau-dep-013424645.jpg" alt="Signature" className="h-32 object-contain mix-blend-multiply" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Card */}
                    <div className="border border-orange-200 rounded-2xl p-6 relative overflow-hidden bg-white shadow-sm flex flex-col">
                      <div className="absolute left-0 top-0 right-0 h-1 bg-orange-500"></div>
                      <div className="flex items-center gap-2 text-orange-600 font-bold mb-4">
                        <CheckCircle size={20} /> Ý kiến của hiệu trưởng
                      </div>
                      <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1 italic mb-6">
                        <li>Ý kiến của hiệu trưởng sẽ hiển thị tại đây.</li>
                      </ul>
                      <div className="border-t border-dashed border-orange-200 pt-4">
                        <div className="text-xs text-gray-500 font-semibold mb-2 uppercase">• Chữ ký và đóng dấu</div>
                        <div className="h-40 border border-blue-100 bg-blue-50/30 rounded-lg flex items-center justify-center w-full relative">
                          {currentRole === 'principal' && (
                            <div className="absolute inset-0 border-2 border-teal-500 border-dashed rounded-lg bg-teal-50/50 flex flex-col items-center justify-center animate-pulse z-10">
                              <FileSignature className="w-6 h-6 text-teal-600 mb-1" />
                              <span className="text-xs font-medium text-teal-700">Vị trí ký tên</span>
                            </div>
                          )}
                          {currentRole === 'clerk' && (
                            <>
                              <img src="https://i.postimg.cc/8CH9HtjR/chu-ky-ten-hau-dep-013424645.jpg" alt="Signature" className="h-32 object-contain mix-blend-multiply opacity-50 absolute" />
                              <div className="absolute top-1/2 left-1/2 -translate-x-[160%] -translate-y-[75%] w-16 h-16 border-2 border-red-500 border-dashed rounded-full bg-red-50/50 flex items-center justify-center animate-pulse z-10">
                                <Stamp className="w-8 h-8 text-red-600" />
                              </div>
                            </>
                          )}
                          {currentRole !== 'principal' && currentRole !== 'clerk' && (
                             <div className="text-gray-300 italic text-xs">Chưa ký</div>
                          )}
                        </div>
                        {currentRole === 'clerk' && (
                          <div className="mt-2 text-xs text-blue-600 italic text-center">
                            * Lưu ý: Con dấu sẽ được đóng tự động trùm lên 1/3 chữ ký về phía bên trái.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Wizard */}
              <div className="w-80 border-l border-gray-100 bg-white p-6 flex flex-col">
                <h3 className="font-bold text-gray-900 mb-6">Quy trình Ký duyệt</h3>
                <div className="space-y-6 flex-1">
                  {[
                    { id: 1, title: 'Xác nhận vùng ký', action: () => setCurrentStep(1) },
                    { id: 2, title: 'Tạo chữ ký', action: () => { setCurrentStep(2); setShowSignaturePad(true); } },
                    { id: 3, title: 'Hoàn tất', action: () => { setCurrentStep(3); executeSign(previewSigningIds); } }
                  ].map((step) => (
                    <button 
                      key={step.id} 
                      className="flex items-start gap-3 w-full text-left"
                      onClick={step.action}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep === step.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                        {step.id}
                      </div>
                      <div>
                        <div className={`font-bold ${currentStep === step.id ? 'text-indigo-900' : 'text-gray-400'}`}>{step.title}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-2">Hướng dẫn:</h4>
                  <p className="text-sm text-gray-600">
                    Sổ chỉ có 1 chỗ ký cuối năm duy nhất. Vui lòng xác nhận vị trí hiển thị bên trái để tiếp tục.
                  </p>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowSigningPreview(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={() => {
                      if (currentRole === 'teacher') {
                        setShowSignaturePad(true);
                        setShowSigningPreview(false);
                      } else {
                        executeSign(previewSigningIds);
                      }
                    }}
                    disabled={signingIds.length > 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {signingIds.length > 0 ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Xác nhận
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Tạo chữ ký</h3>
              <button 
                onClick={() => setShowSignaturePad(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setSignatureTab('draw')}
                  className={`px-6 py-2 text-sm font-bold transition-colors relative ${
                    signatureTab === 'draw' ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Ký tay
                  {signatureTab === 'draw' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>
                  )}
                </button>
                <button
                  onClick={() => setSignatureTab('upload')}
                  className={`px-6 py-2 text-sm font-bold transition-colors relative ${
                    signatureTab === 'upload' ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Tải ảnh
                  {signatureTab === 'upload' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>
                  )}
                </button>
              </div>

              {signatureTab === 'draw' ? (
                <div className="space-y-4">
                  <div className="border-2 border-gray-200 rounded-xl bg-white overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={448}
                      height={200}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="cursor-crosshair w-full touch-none"
                    />
                  </div>
                  <div className="flex justify-start">
                    <button
                      onClick={clearCanvas}
                      className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {signatureImage ? (
                      <img src={signatureImage} alt="Signature" className="max-h-32 object-contain" />
                    ) : (
                      <>
                        <Download className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Nhấn để tải ảnh chữ ký lên</p>
                        <p className="text-xs text-gray-400 mt-1">Hỗ trợ PNG, JPG, JPEG</p>
                      </>
                    )}
                  </div>
                  {signatureImage && (
                    <div className="flex justify-start">
                      <button
                        onClick={() => setSignatureImage(null)}
                        className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowSignaturePad(false)}
                className="px-6 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setShowSignaturePad(false);
                  executeSign(previewSigningIds);
                }}
                className="px-6 py-2 text-sm font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 shadow-md active:scale-95 transition-all"
              >
                Lưu chữ ký
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
