import React from 'react';
import { Star, Workflow, ChevronDown, UserCircle } from 'lucide-react';
import { Role } from '../types';

interface HeaderProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
}

export default function Header({ currentRole, onRoleChange }: HeaderProps) {
  return (
    <header className="bg-teal-600 text-white shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Star className="w-6 h-6 text-yellow-400 fill-current" />
          <h1 className="text-xl font-bold">Sổ bé ngoan</h1>
        </div>

        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 bg-white text-teal-700 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-teal-50 transition-colors shadow-sm">
            <Workflow className="w-4 h-4" />
            <span>Xem quy trình</span>
          </button>
          
          <div className="flex items-center space-x-2 text-sm bg-teal-700/50 px-3 py-1.5 rounded-lg border border-teal-500/30">
            <span className="opacity-90">Năm học:</span>
            <div className="relative group cursor-pointer">
              <div className="flex items-center space-x-1 font-medium">
                <span>2023-2024</span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-teal-500/50 mx-2"></div>

          <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
            <UserCircle className="w-4 h-4 opacity-80" />
            <span className="text-sm opacity-90 mr-2">Vai trò:</span>
            <div className="flex bg-teal-800/50 rounded p-0.5">
              {(['teacher', 'principal', 'clerk'] as Role[]).map((role) => (
                <button
                  key={role}
                  onClick={() => onRoleChange(role)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                    currentRole === role
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-teal-100 hover:bg-white/10'
                  }`}
                >
                  {role === 'teacher' ? 'Giáo viên' : role === 'principal' ? 'Hiệu trưởng' : 'Văn thư'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
