import React from 'react';
import { BookPlus, FileEdit, FileSignature, BookOpen, Settings, ChevronRight } from 'lucide-react';
import { TabType } from '../types';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const getTabStyle = (tab: TabType) => {
    if (activeTab === tab) {
      return "flex items-center gap-2 py-2 px-4 rounded-lg bg-[#0d9488] text-sm font-medium text-white shadow-md whitespace-nowrap";
    }
    return "flex items-center gap-2 py-2 px-4 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 shadow-sm whitespace-nowrap hover:bg-gray-50 transition-colors";
  };

  const getNumberStyle = (tab: TabType) => {
    return activeTab === tab 
      ? "bg-white/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
      : "bg-gray-200 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold";
  };

  const getIconColor = (tab: TabType) => {
    return activeTab === tab ? "text-white" : "text-gray-500";
  };

  return (
    <div className="bg-white border-b border-gray-200 mb-6 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-2 overflow-x-auto">
              <button 
              onClick={() => onTabChange('initialization')}
              className={getTabStyle('initialization')}
            >
              <span className={getNumberStyle('initialization')}>1</span>
              <BookPlus className={`w-4 h-4 ${getIconColor('initialization')}`} />
              Khởi tạo sổ
            </button>

            <ChevronRight className="w-6 h-6 text-[#0d9488] flex-shrink-0 animate-blink" strokeWidth={3} />

            <button 
              onClick={() => onTabChange('input')}
              className={getTabStyle('input')}
            >
              <span className={getNumberStyle('input')}>2</span>
              <FileEdit className={`w-4 h-4 ${getIconColor('input')}`} />
              Nhập liệu
            </button>

            <ChevronRight className="w-6 h-6 text-[#0d9488] flex-shrink-0 animate-blink" strokeWidth={3} />

            <button 
              onClick={() => onTabChange('signature')}
              className={getTabStyle('signature')}
            >
              <span className={getNumberStyle('signature')}>3</span>
              <FileSignature className={`w-4 h-4 ${getIconColor('signature')}`} />
              Ký số cuối năm
            </button>

            <ChevronRight className="w-6 h-6 text-[#0d9488] flex-shrink-0 animate-blink" strokeWidth={3} />

            <button 
              onClick={() => onTabChange('view')}
              className={getTabStyle('view')}
            >
              <span className={getNumberStyle('view')}>4</span>
              <BookOpen className={`w-4 h-4 ${getIconColor('view')}`} />
              Xem sổ & Xuất sổ
            </button>
          </div>

          <button 
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 shadow-sm whitespace-nowrap ml-4 hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-500" />
            Tiện ích
          </button>
        </div>
      </div>
    </div>
  );
}
