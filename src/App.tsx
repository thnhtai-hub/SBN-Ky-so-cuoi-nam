import React, { useState } from 'react';
import Header from './components/Header';
import TabBar from './components/TabBar';
import StudentList from './pages/StudentList';
import InitializationList from './pages/InitializationList';
import { Role, TabType, Student } from './types';
import { MOCK_STUDENTS } from './data';

function App() {
  const [currentRole, setCurrentRole] = useState<Role>('teacher');
  const [activeTab, setActiveTab] = useState<TabType>('initialization');
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);

  const handleInitialize = (ids: string[]) => {
    setStudents(prev => prev.map(s => {
      if (ids.includes(s.id)) {
        return {
          ...s,
          status: 'created',
          bookId: `SYTMN${s.studentId}`
        };
      }
      return s;
    }));
  };

  return (
    <div className="min-h-screen bg-cyan-50 font-sans text-gray-900">
      <Header currentRole={currentRole} onRoleChange={setCurrentRole} />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'initialization' ? (
          <InitializationList 
            students={students} 
            onInitialize={handleInitialize} 
            onTabChange={setActiveTab}
          />
        ) : (
          <StudentList 
            currentRole={currentRole} 
            students={students}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}
      </main>
    </div>
  );
}

export default App;
