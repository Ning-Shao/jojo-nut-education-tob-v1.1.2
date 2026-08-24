
import React, { useEffect, useState } from 'react';
import { 
  LayoutGrid, 
  Map, 
  CheckSquare, 
  BookOpen, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  Library,
  School,
  Menu,
  X,
  GraduationCap,
  Globe,
  Calendar
} from '../components/common/Icons';
import StudentHome from '../components/student/StudentHome';
import StudentPlanningView, { PlanningTab } from '../components/student/StudentPlanningView';
import StudentTaskCenter from '../components/student/StudentTaskCenter';
// Import shared TargetLibrary and new Knowledge Sub-Libraries
import TargetLibrary from '../components/common/features/TargetLibrary';
import MajorEncyclopedia from '../components/knowledge/MajorEncyclopedia';
import CountryGuideLibrary from '../components/knowledge/CountryGuideLibrary';
import CompetitionCalendar from '../components/knowledge/CompetitionCalendar';
import CampusKnowledgeBase from '../components/knowledge/CampusKnowledgeBase';
import StudentProfile from '../components/student/StudentProfile';
import StudentSettings from '../components/student/StudentSettings';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getStoredStudentTasks,
  StudentTask,
  TASK_STORAGE_KEY,
} from '../components/student/studentTasks';

interface StudentDashboardProps {
  onLogout: () => void;
}

const FORMAL_STUDENT_NAME = 'Alex Chen';

// Student Specific Navigation Tabs
type StudentTab = 'Dashboard' | 'My Plan' | 'Tasks' | 'Knowledge';

interface NavItemDef {
  id: StudentTab;
  label: string;
  icon: React.ReactNode;
  children?: { id: string; label: string; icon?: React.ReactNode }[];
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onLogout }) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';
  
  const [activeTab, setActiveTab] = useState<StudentTab>('Dashboard');
  const [viewState, setViewState] = useState<string>('dashboard');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [planningInitialTab, setPlanningInitialTab] = useState<PlanningTab>('BasicInfo');
  const [preferredName, setPreferredName] = useState(() => localStorage.getItem('student_preferred_name') || localStorage.getItem('student_profile_name') || 'Alex');
  const [focusedTaskId, setFocusedTaskId] = useState<string | undefined>();
  const [studentTasks, setStudentTasks] = useState<StudentTask[]>(getStoredStudentTasks);

  useEffect(() => {
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(studentTasks));
  }, [studentTasks]);

  const handlePreferredNameChange = (name: string) => {
    setPreferredName(name);
    localStorage.setItem('student_preferred_name', name);
  };

  const navItems: NavItemDef[] = [
    { id: 'Dashboard', label: isEn ? 'Dashboard' : '首页', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'My Plan', label: isEn ? 'My Plan' : '我的规划', icon: <Map className="w-4 h-4" /> },
    { 
      id: 'Knowledge', 
      label: isEn ? 'Knowledge Base' : '知识库', 
      icon: <BookOpen className="w-4 h-4" />,
      children: [
        { id: 'knowledge-library', label: isEn ? 'School Library' : '院校库', icon: <Library className="w-4 h-4" /> },
        { id: 'knowledge-majors', label: isEn ? 'Major Encyclopedia' : '专业百科', icon: <GraduationCap className="w-4 h-4" /> },
        { id: 'knowledge-guides', label: isEn ? 'Country Guides' : '各国申请指南', icon: <Globe className="w-4 h-4" /> },
        { id: 'knowledge-competitions', label: isEn ? 'Competition Calendar' : '国际竞赛日历', icon: <Calendar className="w-4 h-4" /> },
        { id: 'knowledge-school', label: isEn ? 'Campus Archive' : '校内知识库', icon: <School className="w-4 h-4" /> }
      ]
    },
    { id: 'Tasks', label: isEn ? 'Tasks' : '任务中心', icon: <CheckSquare className="w-4 h-4" /> },
  ];

  const handleNavClick = (item: NavItemDef) => {
    setActiveTab(item.id);
    
    if (item.id === 'Dashboard') setViewState('dashboard');
    else if (item.id === 'My Plan') {
        setViewState('plan');
        setPlanningInitialTab('BasicInfo'); // Reset to default when clicking nav
    }
    else if (item.id === 'Tasks') {
        setFocusedTaskId(undefined);
        setViewState('tasks');
    }
    else if (item.id === 'Knowledge') setViewState('knowledge-library');
  };

  const handleSubNavClick = (childId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewState(childId);
    setActiveTab('Knowledge');
  };

  const handleNavigateToEssays = () => {
    setPlanningInitialTab('Essays');
    setActiveTab('My Plan');
    setViewState('plan');
  };

  const handleNavigateToPlan = () => {
    setPlanningInitialTab('Planning');
    setActiveTab('My Plan');
    setViewState('plan');
  };

  const handleHomeClick = () => {
    setActiveTab('Dashboard');
    setViewState('dashboard');
    setPlanningInitialTab('BasicInfo');
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleNavigateToTasks = (taskId?: string) => {
    setFocusedTaskId(taskId);
    setActiveTab('Tasks');
    setViewState('tasks');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f8f6] dark:bg-zinc-950 font-sans text-gray-800 dark:text-zinc-100 transition-colors duration-300">
      
      {/* 1. Top Navigation Bar (Violet Theme) */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-[#e5e0dc] dark:border-white/5 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Nav */}
          <div className="flex items-center">
            <button 
              type="button"
              id="student-brand-home-btn"
              onClick={handleHomeClick}
              className="mr-8 flex items-center gap-2.5 group cursor-pointer hover:opacity-90 transition-all text-left focus:outline-none"
              title={isEn ? "Back to Dashboard" : "返回首页"}
              aria-label={isEn ? "Back to student dashboard" : "返回学生首页"}
            >
               {/* Student Theme: Violet Logo */}
               <div className="w-8 h-8 bg-violet-600 group-hover:scale-105 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/30 transition-transform">N</div>
               <span className="font-bold text-lg text-gray-900 dark:text-white hidden sm:block tracking-tight group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">Nut Student</span>
            </button>
            
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => handleNavClick(item)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${activeTab === item.id 
                        ? 'bg-violet-50 text-violet-900 dark:bg-white/10 dark:text-white shadow-sm ring-1 ring-violet-100 dark:ring-white/5' 
                        : 'text-gray-500 dark:text-zinc-400 hover:text-violet-800 hover:bg-violet-50/50 dark:hover:text-zinc-100 dark:hover:bg-white/5'
                      }`}
                  >
                    <span className={activeTab === item.id ? 'text-violet-600 dark:text-white' : 'group-hover:text-violet-600 dark:group-hover:text-white transition-colors'}>{item.icon}</span>
                    {item.label}
                    {item.children && (
                      <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform duration-200 ${activeTab === item.id ? 'text-violet-400 dark:text-zinc-400' : 'text-gray-300 dark:text-zinc-500'} group-hover:rotate-180`} />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {item.children && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/10 rounded-xl shadow-xl dark:shadow-black/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left z-50 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                      <div className="py-1">
                        {item.children.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={(e) => handleSubNavClick(sub.id, e)}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-violet-50 dark:hover:bg-white/5 hover:text-violet-700 dark:hover:text-white transition-colors
                              ${viewState === sub.id ? 'bg-violet-50 dark:bg-white/10 text-violet-700 dark:text-white font-medium' : 'text-gray-600 dark:text-zinc-400'}
                            `}
                          >
                            {sub.icon && <span className="text-gray-400 dark:text-zinc-500 group-hover:text-violet-500 dark:group-hover:text-white transition-colors">{sub.icon}</span>}
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-4 relative">
             {/* Profile Dropdown */}
             <button 
                 id="student-profile-btn"
                 onClick={() => {
                   setIsProfileOpen(!isProfileOpen);
                   setIsMobileMenuOpen(false);
                 }}
                 className="flex items-center gap-2 sm:gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10"
             >
                 <div className="text-right hidden sm:block">
                   <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 leading-none">{preferredName}</p>
                   <p className="text-[10px] text-gray-500 dark:text-zinc-500 mt-1 leading-none">Grade 11</p>
                 </div>
                 {/* Student Avatar: Violet Ring */}
                 <div className="w-8 h-8 sm:w-9 sm:h-9 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-white dark:ring-zinc-900 shadow-sm">
                   {preferredName.trim().charAt(0).toUpperCase() || 'S'}
                 </div>
                 <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
             </button>

             {/* Mobile Navigation Toggle (方案A: 汉堡菜单) */}
             <button
                id="student-mobile-menu-btn"
                onClick={() => {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                  setIsProfileOpen(false);
                }}
                className="lg:hidden p-2 rounded-xl text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border border-gray-200/80 dark:border-white/10 shadow-xs"
                aria-label="Toggle Navigation Menu"
             >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
             </button>

             {isProfileOpen && (
               <>
                 <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                 <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/10 rounded-xl shadow-xl dark:shadow-black/50 z-20 py-2 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5 dark:ring-white/5">
                     <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 mb-1">
                       <p className="text-sm font-bold text-gray-900 dark:text-white">{preferredName}</p>
                       <p className="text-[10px] text-gray-400">{FORMAL_STUDENT_NAME}</p>
                       <p className="text-xs text-gray-500 dark:text-zinc-500">alex.c@student.nut.edu</p>
                     </div>
                     <button 
                         id="student-profile-menu-link"
                         onClick={() => { setViewState('profile'); setIsProfileOpen(false); }}
                         className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300 hover:bg-violet-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors"
                     >
                       <User className="w-4 h-4 text-gray-400" /> {isEn ? 'My Profile' : '个人中心'}
                     </button>
                     <button 
                         id="student-settings-menu-link"
                         onClick={() => { setViewState('settings'); setIsProfileOpen(false); }}
                         className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300 hover:bg-violet-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors"
                     >
                       <Settings className="w-4 h-4 text-gray-400" /> {isEn ? 'Settings' : '设置'}
                     </button>
                     <div className="h-px bg-gray-100 dark:bg-white/5 my-1 mx-2"></div>
                     <button 
                         id="student-logout-menu-link"
                         onClick={onLogout}
                         className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors rounded-b-lg"
                     >
                       <LogOut className="w-4 h-4" /> {isEn ? 'Log Out' : '退出登录'}
                     </button>
                 </div>
               </>
             )}

             {/* Mobile Nav Menu Dropdown (方案A: 汉堡菜单下拉列表) */}
             {isMobileMenuOpen && (
               <>
                 <div 
                   className="fixed inset-0 top-16 bg-black/30 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-150" 
                   onClick={() => setIsMobileMenuOpen(false)} 
                 />
                 <div className="absolute top-full right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5rem)] overflow-y-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-black/70 z-50 py-2.5 animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5 dark:ring-white/5 lg:hidden">
                    {/* User info header inside mobile menu */}
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/5 mb-1.5 flex items-center gap-2.5">
                       <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full flex items-center justify-center font-bold text-xs">
                          A
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{preferredName}</p>
                          <p className="text-[10px] text-gray-500 dark:text-zinc-400 truncate">Grade 11 · Student</p>
                       </div>
                    </div>

                    {/* Nav Items */}
                    <div className="px-2 space-y-1">
                       {navItems.map((item) => {
                          const isActive = activeTab === item.id;
                          const hasChildren = item.children && item.children.length > 0;
                          return (
                            <div key={item.id} className="space-y-0.5">
                               <button
                                  id={`student-mobile-nav-${item.id}`}
                                  onClick={() => {
                                     handleNavClick(item);
                                     if (!hasChildren) {
                                        setIsMobileMenuOpen(false);
                                     }
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between rounded-xl transition-colors ${
                                     isActive 
                                        ? 'bg-violet-50 dark:bg-white/10 text-violet-800 dark:text-white font-medium' 
                                        : 'text-gray-700 dark:text-zinc-300 hover:bg-violet-50/50 dark:hover:bg-white/5 hover:text-violet-700 dark:hover:text-white'
                                  }`}
                               >
                                  <div className="flex items-center gap-2.5">
                                     <span className={isActive ? 'text-violet-600 dark:text-white' : 'text-gray-400 dark:text-zinc-400'}>
                                        {item.icon}
                                     </span>
                                     <span>{item.label}</span>
                                  </div>
                                  {hasChildren && (
                                     <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isActive ? 'text-violet-600 dark:text-white' : ''}`} />
                                  )}
                               </button>

                               {/* Sub-items in mobile menu */}
                               {hasChildren && (
                                  <div className="pl-6 pr-2 py-1 space-y-1 bg-gray-50/70 dark:bg-zinc-800/40 rounded-xl my-1 border border-gray-100 dark:border-white/5">
                                     {item.children?.map((sub) => {
                                        const isSubActive = viewState === sub.id;
                                        return (
                                           <button
                                              key={sub.id}
                                              id={`student-mobile-subnav-${sub.id}`}
                                              onClick={(e) => {
                                                 handleSubNavClick(sub.id, e);
                                                 setIsMobileMenuOpen(false);
                                              }}
                                              className={`w-full text-left px-2.5 py-1.5 text-xs flex items-center gap-2 rounded-lg transition-colors ${
                                                 isSubActive 
                                                    ? 'bg-violet-100/70 text-violet-800 dark:bg-white/15 dark:text-white font-semibold' 
                                                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-zinc-200'
                                              }`}
                                           >
                                              {sub.icon && <span className="w-3.5 h-3.5 opacity-70">{sub.icon}</span>}
                                              <span>{sub.label}</span>
                                           </button>
                                        );
                                     })}
                                  </div>
                               )}
                            </div>
                          );
                       })}
                    </div>
                 </div>
               </>
             )}
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] overflow-hidden">
         {/* Violet decorative background blobs */}
         <div className="absolute top-20 left-[-100px] w-64 h-64 bg-violet-200/20 dark:bg-violet-900/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
         <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-indigo-200/20 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

         {viewState === 'dashboard' && (
            <StudentHome 
              preferredName={preferredName}
              tasks={studentTasks}
              onNavigateToEssays={handleNavigateToEssays} 
              onNavigateToPlan={handleNavigateToPlan}
              onNavigateToTasks={handleNavigateToTasks}
            />
         )}
         
         {viewState === 'plan' && <StudentPlanningView initialTab={planningInitialTab} />}

         {viewState === 'knowledge-library' && (
            <div className="h-full overflow-hidden">
               {/* Use the shared component with student role */}
               <TargetLibrary role="student" currentStudentId="1" />
            </div>
         )}

         {viewState === 'knowledge-majors' && (
            <div className="h-full overflow-hidden">
               <MajorEncyclopedia role="student" />
            </div>
         )}

         {viewState === 'knowledge-guides' && (
            <div className="h-full overflow-hidden">
               <CountryGuideLibrary role="student" />
            </div>
         )}

         {viewState === 'knowledge-competitions' && (
            <div className="h-full overflow-hidden">
               <CompetitionCalendar role="student" />
            </div>
         )}

         {(viewState === 'knowledge-school' || viewState === 'knowledge-resources') && (
            <div className="h-full overflow-hidden">
               <CampusKnowledgeBase role="student" />
            </div>
         )}

         {viewState === 'tasks' && (
            <StudentTaskCenter
              tasks={studentTasks}
              setTasks={setStudentTasks}
              initialTaskId={focusedTaskId}
              studentName={preferredName}
            />
         )}

         {viewState === 'profile' && (
            <div className="h-full overflow-y-auto custom-scrollbar">
            <StudentProfile formalName={FORMAL_STUDENT_NAME} preferredName={preferredName} onPreferredNameChange={handlePreferredNameChange} />
            </div>
         )}

         {viewState === 'settings' && (
            <div className="h-full overflow-y-auto custom-scrollbar">
                <StudentSettings />
            </div>
         )}
      </main>
    </div>
  );
};

export default StudentDashboard;
