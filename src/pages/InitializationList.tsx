import React, { useState } from 'react';
import { Search, ChevronDown, LayoutList, Info, X, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, TabType } from '../types';

interface InitializationListProps {
  students: Student[];
  onInitialize: (ids: string[]) => void;
  onTabChange: (tab: TabType) => void;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
}

function ConfirmationModal({ isOpen, onClose, onConfirm, count }: ModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-[760px] overflow-hidden"
        >
          <button 
            onClick={onClose}
            className="absolute right-8 top-8 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-7 h-7" />
          </button>

          <div className="p-12 flex flex-col items-center">
            <div className="w-20 h-20 bg-[#e0fdfa] rounded-full flex items-center justify-center mb-8">
              <CreditCard className="w-10 h-10 text-[#0d9488]" />
            </div>

            <h3 className="text-[28px] font-bold text-gray-900 mb-4">Xác nhận khởi tạo mã số sổ</h3>
            <p className="text-gray-500 text-lg mb-10">
              Bạn sắp khởi tạo mã số sổ cho <span className="font-bold text-gray-900">{count}</span> học sinh đã chọn.
            </p>

            <div className="w-full bg-white rounded-2xl border border-gray-200 p-8 mb-10">
              <p className="text-base font-bold text-gray-800 text-center mb-6">Cấu trúc mã số sẽ được tạo tự động như sau:</p>
              
              <div className="flex flex-col items-center mb-6">
                <div className="bg-[#f3f4f6] rounded-lg py-2.5 px-6 inline-block mb-2 border border-gray-100">
                  <span className="text-base font-medium text-gray-700">SBN + Số định danh cá nhân của học sinh</span>
                </div>
                <p className="text-sm text-gray-400 italic">Ví dụ: SBN079210922002</p>
              </div>

              <div className="bg-[#f0fdfa] rounded-xl p-5 flex items-center gap-4 text-left">
                <div className="w-6 h-6 bg-[#0d9488] rounded-full flex items-center justify-center flex-shrink-0">
                  <Info className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-[15px] text-[#0d9488] font-medium">
                  Hệ thống sẽ tự động lấy mã số định danh của học sinh để tạo mã số sổ.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 w-full justify-center">
              <button 
                onClick={onClose}
                className="w-[140px] py-3.5 px-6 rounded-xl border border-gray-200 bg-[#f8fafc] text-base font-bold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={onConfirm}
                className="w-[200px] py-3.5 px-6 rounded-xl bg-[#0d9488] text-base font-bold text-white hover:bg-[#0b7a6f] shadow-lg shadow-teal-500/20 transition-all active:scale-95"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function InitializationList({ students, onInitialize, onTabChange }: InitializationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const pendingStudents = students.filter(s => s.status === 'pending_create');

  const toggleSelectAll = () => {
    if (selectedStudents.length === pendingStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(pendingStudents.map(s => s.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(sid => sid !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  // No early return here anymore

  return (
    <div className="relative">
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-[#0d9488] text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-lg"
          >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Info className="w-5 h-5 text-white" />
            </div>
            Khởi tạo mã số sổ thành công!
          </motion.div>
        )}
      </AnimatePresence>

      {pendingStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border-2 border-white shadow-xl text-center px-10 max-w-5xl mx-auto mt-4">
          <div className="w-24 h-24 bg-cyan-50 rounded-full flex items-center justify-center mb-10 relative">
            <div className="absolute inset-0 bg-cyan-100/50 rounded-full animate-ping"></div>
            <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center relative z-10">
              <Info className="w-10 h-10 text-[#0d9488]" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-4 uppercase tracking-tight">Không có sổ nào cần khởi tạo</h3>
          <p className="text-gray-500 max-w-2xl leading-relaxed text-xl">
            Tất cả học sinh đã được khởi tạo mã số sổ thành công. <br />
            Bạn có thể tiến qua mục 
            <button 
              onClick={() => onTabChange('input')}
              className="ml-2 font-semibold text-[#0d9488] hover:text-[#0b7a6f] underline underline-offset-4 decoration-2 transition-all"
            >
              Nhập liệu
            </button>
            {' '}để tiến hành nhập dữ liệu cho các bé.
          </p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border-2 border-white shadow-md">
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-cyan-50/40 rounded-lg">
              <button 
                onClick={() => selectedStudents.length > 0 && setIsModalOpen(true)}
                disabled={selectedStudents.length === 0}
                className={`flex items-center gap-2 py-2 px-5 rounded-lg text-sm font-bold text-white shadow-sm whitespace-nowrap transition-all ${
                  selectedStudents.length > 0 
                    ? 'bg-[#0d9488] hover:bg-[#0b7a6f] scale-[1.02] active:scale-[0.98]' 
                    : 'bg-[#b2bec3] cursor-not-allowed'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                Khởi tạo sổ ({selectedStudents.length})
              </button>

              <div className="relative">
                <select className="appearance-none bg-white border border-gray-200 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer min-w-[180px] shadow-sm">
                  <option>Tất cả nhóm lớp</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select className="appearance-none bg-white border border-gray-200 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer min-w-[160px] shadow-sm">
                  <option>Tất cả lớp</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative flex-1 min-w-[300px]">
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc Số định danh cá nhân"
                  className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-white">
                    <th className="p-4 border-r border-white/20 w-12 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        checked={selectedStudents.length === pendingStudents.length && pendingStudents.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
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
                  {pendingStudents.map((student, index) => (
                    <tr 
                      key={student.id} 
                      className={`transition-colors cursor-pointer ${
                        selectedStudents.includes(student.id) 
                          ? 'bg-[#f0fdfa]' 
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => toggleSelectStudent(student.id)}
                    >
                      <td className="p-4 border-r border-gray-200 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleSelectStudent(student.id)}
                        />
                      </td>
                      <td className="p-4 border-r border-gray-200 text-center text-sm text-gray-500">{index + 1}</td>
                      <td className="p-4 border-r border-gray-200 text-center text-sm text-gray-500 font-mono">{student.studentId}</td>
                      <td className="p-4 border-r border-gray-200 text-sm font-bold text-gray-800 uppercase">{student.name}</td>
                      <td className="p-4 border-r border-gray-200 text-center text-sm text-gray-600">{student.group}</td>
                      <td className="p-4 border-r border-gray-200 text-center text-sm text-gray-600">{student.className}</td>
                      <td className="p-4 border-r border-gray-200 text-center text-sm">
                        <span className="text-gray-400 italic text-xs">Chưa có</span>
                      </td>
                      <td className="p-4 text-center text-sm">
                        <span className="text-red-500 text-[11px] font-bold">Cần tạo sổ</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <ConfirmationModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={() => {
              onInitialize(selectedStudents);
              setIsModalOpen(false);
              setSelectedStudents([]);
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 3000);
            }}
            count={selectedStudents.length}
          />
        </div>
      )}
    </div>
  );

}
