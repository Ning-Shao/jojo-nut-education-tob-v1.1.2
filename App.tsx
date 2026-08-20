
import React, { useState } from 'react';
import LoginScreen from './pages/LoginScreen';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import { LanguageProvider } from './contexts/LanguageContext';
import FeedbackModal from './components/common/FeedbackModal';

type ViewState = 'login' | 'teacher' | 'student';

const MainApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('login');
  // Track role selection on login screen for styling feedback button
  const [loginRole, setLoginRole] = useState<'teacher' | 'student' | null>(null);

  const handleLogin = (role: 'teacher' | 'student') => {
    // In a real app, authentication logic would go here.
    setCurrentView(role);
  };

  const handleLogout = () => {
    setCurrentView('login');
    setLoginRole(null);
  };

  // Determine feedback button theme based on current view OR pending login selection
  const feedbackTheme = (currentView === 'student' || (currentView === 'login' && loginRole === 'student')) ? 'violet' : 'primary';

  return (
    <>
      {currentView === 'login' && <LoginScreen onLogin={handleLogin} onRoleSelect={setLoginRole} />}
      {currentView === 'teacher' && <TeacherDashboard onLogout={handleLogout} />}
      {currentView === 'student' && <StudentDashboard onLogout={handleLogout} />}
      <FeedbackModal theme={feedbackTheme} />
    </>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
};

export default App;
