import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthPage } from './components/AuthPage';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { CalendarView } from './components/CalendarView';
import { UserManagement } from './components/UserManagement';
import { Analytics } from './components/Analytics';
import { ProfileModal } from './components/ProfileModal';
import { TaskModal } from './components/TaskModal';

function AppContent() {
  const { isAuthenticated } = useApp();
  const [currentView, setCurrentView] = useState<'board' | 'calendar' | 'users' | 'analytics' | 'profile'>('board');
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'board':
        return <KanbanBoard />;
      case 'calendar':
        return <CalendarView />;
      case 'users':
        return <UserManagement />;
      case 'analytics':
        return <Analytics />;
      case 'profile':
        return <div className="p-6"><ProfileModal isOpen={true} onClose={() => setCurrentView('board')} /></div>;
      default:
        return <KanbanBoard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onCreateTask={() => setShowCreateModal(true)}
      />
      
      <main className="h-[calc(100vh-120px)]">
        {renderView()}
      </main>

      <TaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;