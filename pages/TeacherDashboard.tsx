
import React, { useEffect, useState } from 'react';
import { 
  LayoutGrid, 
  Users, 
  Library, 
  CheckSquare, 
  FileBarChart, 
  PieChart, 
  ChevronDown,
  BookOpen,
  School,
  User,
  LogOut,
  Settings,
  Menu,
  X,
  GraduationCap,
  Globe,
  Calendar
} from '../components/common/Icons';
import { NavTab } from '../types';
import StudentOverview, { OverviewFilterTarget } from '../components/teacher/StudentOverview';
import RiskCard from '../components/teacher/RiskCard';
import TaskList from '../components/teacher/TaskList';
import ReviewSnapshot from '../components/teacher/ReviewSnapshot';
import StudentList, { StudentListFilters } from '../components/teacher/StudentList';
import StudentDetail from '../components/teacher/StudentDetail';
// Updated import path
import TargetLibrary from '../components/common/features/TargetLibrary';
import MajorEncyclopedia from '../components/knowledge/MajorEncyclopedia';
import CountryGuideLibrary from '../components/knowledge/CountryGuideLibrary';
import CompetitionCalendar from '../components/knowledge/CompetitionCalendar';
import CampusKnowledgeBase from '../components/knowledge/CampusKnowledgeBase';
import TaskCenter from '../components/teacher/TaskCenter';
import ReportCenter from '../components/teacher/ReportCenter';
import ReviewAnalytics from '../components/teacher/ReviewAnalytics';
import UserProfile from '../components/teacher/UserProfile';
import AccountSettings from '../components/teacher/AccountSettings';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getStoredTeacherTasks,
  isTeacherTodayTodo,
  reconcileReviewTasks,
  TEACHER_TASK_STORAGE_KEY,
  TeacherTask,
} from '../components/teacher/teacherTasks';
import { getStoredStudentReviewEvents, subscribeStudentReviewEvents } from '../services/studentReviewEvents';

// Helper type for navigation structure
interface NavItemDef {
  id: NavTab;
  label: string;
  icon: React.ReactNode;
  children?: { id: string; label: string; icon?: React.ReactNode }[];
}

interface TeacherDashboardProps {
  onLogout: () => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('首页');
  const [viewState, setViewState] = useState<
    'dashboard' | 'list' | 'detail' | 'tasks' | 'reports' | 'review' | 
    'knowledge-library' | 'knowledge-majors' | 'knowledge-guides' | 'knowledge-competitions' | 'knowledge-school' | 'knowledge-resources' | 'profile' | 'settings'
  >('dashboard');
  
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<string | null>(null);
  const [structuredListFilters, setStructuredListFilters] = useState<StudentListFilters | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [reportConfig, setReportConfig] = useState<{studentId: string, template: 'transcript'} | null>(null);
  const [focusedTaskId, setFocusedTaskId] = useState<string | undefined>();
  const [teacherTasks, setTeacherTasks] = useState<TeacherTask[]>(() =>
    reconcileReviewTasks(getStoredTeacherTasks(), getStoredStudentReviewEvents()),
  );

  useEffect(() => {
    localStorage.setItem(TEACHER_TASK_STORAGE_KEY, JSON.stringify(teacherTasks));
  }, [teacherTasks]);

  useEffect(() => subscribeStudentReviewEvents(() => {
    setTeacherTasks(current => reconcileReviewTasks(current, getStoredStudentReviewEvents()));
  }), []);

  const { language } = useLanguage();

  const isEn = language === 'en-US';
  const todayTodoCount = teacherTasks.filter(task => isTeacherTodayTodo(task)).length;

  const navItems: NavItemDef[] = [
    { id: '首页', label: isEn ? 'Dashboard' : '首页', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: '学生管理', label: isEn ? 'Students' : '学生管理', icon: <Users className="w-4 h-4" /> },
    { 
      id: '知识库', 
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
    { id: '任务中心', label: isEn ? 'Tasks' : '任务中心', icon: <CheckSquare className="w-4 h-4" /> },
    { id: '报告中心', label: isEn ? 'Reports' : '报告中心', icon: <FileBarChart className="w-4 h-4" /> },
    { id: '复盘报表', label: isEn ? 'Review' : '复盘报表', icon: <PieChart className="w-4 h-4" /> },
  ];

  const handleNavClick = (item: NavItemDef) => {
    setActiveTab(item.id);
    setSelectedStudentId(null);
    setListFilter(null);
    setStructuredListFilters(null);
    setReportConfig(null);

    if (item.id === '首页') setViewState('dashboard');
    else if (item.id === '学生管理') setViewState('list');
    else if (item.id === '任务中心') {
      setFocusedTaskId(undefined);
      setViewState('tasks');
    }
    else if (item.id === '报告中心') setViewState('reports');
    else if (item.id === '复盘报表') setViewState('review');
    else if (item.children) {
      if (item.id === '知识库') setViewState('knowledge-library');
    }
  };

  const handleSubNavClick = (viewId: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewState(viewId);
    setSelectedStudentId(null);
    setReportConfig(null);
  };

  const handleRiskClick = (riskType: string) => {
    setActiveTab('学生管理');
    setViewState('list');
    setListFilter(riskType);
    setStructuredListFilters({ risk: riskType, grade: '全部', direction: '全部', phase: '全部' });
    setSelectedStudentId(null);
  };

  const handleOverviewNavigate = (target: OverviewFilterTarget) => {
    setActiveTab('学生管理');
    setViewState('list');
    setSelectedStudentId(null);
    setListFilter(null);

    if (target.type === 'all') {
      setStructuredListFilters({ grade: '全部', direction: '全部', phase: '全部', risk: null });
    } else if (target.type === 'grade') {
      setStructuredListFilters({ grade: target.value, direction: '全部', phase: '全部', risk: null });
    } else if (target.type === 'direction') {
      setStructuredListFilters({ grade: '全部', direction: target.value, phase: '全部', risk: null });
    } else if (target.type === 'phase') {
      setStructuredListFilters({ grade: '全部', direction: '全部', phase: target.value, risk: null });
    }
  };

  const handleStudentClick = (id: string) => {
    setSelectedStudentId(id);
    setViewState('detail');
  };

  const handleBackToList = () => {
    setViewState('list');
    setSelectedStudentId(null);
  };

  const handleViewTasks = (taskId?: string) => {
    setActiveTab('任务中心');
    setViewState('tasks');
    setSelectedStudentId(null);
    setFocusedTaskId(taskId);
  };

  const handleViewReview = () => {
    setActiveTab('复盘报表');
    setViewState('review');
    setSelectedStudentId(null);
  };

  const handleHomeClick = () => {
    setActiveTab('首页');
    setViewState('dashboard');
    setSelectedStudentId(null);
    setListFilter(null);
    setStructuredListFilters(null);
    setReportConfig(null);
    setIsMobileMenuOpen(false);
  };

  const handleNavigateToTranscript = (studentId: string) => {
    setReportConfig({ studentId, template: 'transcript' });
    setActiveTab('报告中心');
    setViewState('reports');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f8f6] dark:bg-zinc-950 dark:text-zinc-100 font-sans text-gray-800 transition-colors duration-300">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-[#e5e0dc] dark:border-white/5 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              id="teacher-brand-home-btn"
              onClick={handleHomeClick}
              className="mr-8 flex items-center gap-2.5 group cursor-pointer hover:opacity-90 transition-all text-left focus:outline-none"
              title={isEn ? "Back to Dashboard" : "返回首页"}
            >
               <div className="w-8 h-8 bg-primary-600 group-hover:scale-105 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/30 transition-transform">N</div>
               <span className="font-bold text-lg text-gray-900 dark:text-white hidden sm:block tracking-tight group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">Nut</span>
            </button>
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => handleNavClick(item)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${activeTab === item.id 
                        ? 'bg-primary-50 text-primary-900 dark:bg-white/10 dark:text-white dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]' 
                        : 'text-gray-500 dark:text-zinc-400 hover:text-primary-800 hover:bg-primary-50/50 dark:hover:text-zinc-100 dark:hover:bg-white/5'
                      }`}
                  >
                    <span className={activeTab === item.id ? 'text-primary-600 dark:text-white' : 'group-hover:text-primary-600 dark:group-hover:text-white transition-colors'}>{item.icon}</span>
                    {item.label}
                    {item.children && (
                      <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform duration-200 ${activeTab === item.id ? 'text-primary-400 dark:text-zinc-400' : 'text-gray-300 dark:text-zinc-500'} group-hover:rotate-180`} />
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
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-primary-50 dark:hover:bg-white/5 hover:text-primary-700 dark:hover:text-white transition-colors
                              ${viewState === sub.id ? 'bg-primary-50 dark:bg-white/10 text-primary-700 dark:text-white font-medium' : 'text-gray-600 dark:text-zinc-400'}
                            `}
                          >
                            {sub.icon && <span className="text-gray-400 dark:text-zinc-500">{sub.icon}</span>}
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
             <button 
                id="teacher-profile-btn"
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 sm:gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10"
             >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 leading-none">Ms. Sarah</p>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-500 mt-1 leading-none">Senior Counselor</p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-white dark:ring-zinc-900 shadow-sm">
                  S
                </div>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
             </button>

             {/* Mobile Navigation Toggle (方案A: 汉堡菜单) */}
             <button
                id="teacher-mobile-menu-btn"
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

             {/* Profile Dropdown */}
             {isProfileOpen && (
               <>
                 <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                 <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/10 rounded-xl shadow-xl dark:shadow-black/50 z-20 py-2 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5 dark:ring-white/5">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 mb-1">
                       <p className="text-sm font-bold text-gray-900 dark:text-white">Sarah Wilson</p>
                       <p className="text-xs text-gray-500 dark:text-zinc-500">sarah@nut.edu</p>
                    </div>
                    <button 
                       id="teacher-profile-menu-link"
                       onClick={() => { setViewState('profile'); setIsProfileOpen(false); }}
                       className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors"
                    >
                       <User className="w-4 h-4 text-gray-400" /> {isEn ? 'Profile' : '个人中心'}
                    </button>
                    <button 
                       id="teacher-settings-menu-link"
                       onClick={() => { setViewState('settings'); setIsProfileOpen(false); }}
                       className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors"
                    >
                       <Settings className="w-4 h-4 text-gray-400" /> {isEn ? 'Settings' : '账户设置'}
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-white/5 my-1 mx-2"></div>
                    <button 
                        id="teacher-logout-menu-link"
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
                       <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center font-bold text-xs">
                          S
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Ms. Sarah</p>
                          <p className="text-[10px] text-gray-500 dark:text-zinc-400 truncate">Senior Counselor</p>
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
                                  id={`mobile-nav-${item.id}`}
                                  onClick={() => {
                                     handleNavClick(item);
                                     if (!hasChildren) {
                                        setIsMobileMenuOpen(false);
                                     }
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between rounded-xl transition-colors ${
                                     isActive 
                                        ? 'bg-primary-50 dark:bg-white/10 text-primary-800 dark:text-white font-medium' 
                                        : 'text-gray-700 dark:text-zinc-300 hover:bg-primary-50/50 dark:hover:bg-white/5 hover:text-primary-700 dark:hover:text-white'
                                  }`}
                               >
                                  <div className="flex items-center gap-2.5">
                                     <span className={isActive ? 'text-primary-600 dark:text-white' : 'text-gray-400 dark:text-zinc-400'}>
                                        {item.icon}
                                     </span>
                                     <span>{item.label}</span>
                                  </div>
                                  {hasChildren && (
                                     <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isActive ? 'text-primary-600 dark:text-white' : ''}`} />
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
                                              id={`mobile-subnav-${sub.id}`}
                                              onClick={(e) => {
                                                 handleSubNavClick(sub.id, e);
                                                 setActiveTab(item.id);
                                                 setIsMobileMenuOpen(false);
                                              }}
                                              className={`w-full text-left px-2.5 py-1.5 text-xs flex items-center gap-2 rounded-lg transition-colors ${
                                                 isSubActive 
                                                    ? 'bg-primary-100/70 text-primary-800 dark:bg-white/15 dark:text-white font-semibold' 
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] overflow-hidden">
        
        {viewState === 'dashboard' && (
          <div className="h-full overflow-y-auto pr-2 pb-10 custom-scrollbar">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                  {isEn ? 'Good Morning, Sarah ☕️' : '早安，Sarah 老师 ☕️'}
                </h1>
                <p className="text-gray-500 dark:text-zinc-400 text-sm">
                  {isEn ? (
                    <>It's Early Application sprint week. You have <span className="font-bold text-accent-600 dark:text-orange-400">{todayTodoCount}</span> tasks to handle today.</>
                  ) : (
                    <>本周是早申冲刺周，您有 <span className="font-bold text-accent-600 dark:text-orange-400">{todayTodoCount}</span> 项任务需要今日处理。</>
                  )}
                </p>
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-medium text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-4 py-2 rounded-lg shadow-sm border border-gray-100 dark:border-white/5">
                  {new Date().toLocaleDateString(isEn ? 'en-US' : 'zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <div className="h-[420px]"> 
                  <StudentOverview onNavigate={handleOverviewNavigate} />
                </div>
                <div className="h-auto">
                  <RiskCard onRiskClick={handleRiskClick} />
                </div>
              </div>

              <div className="xl:col-span-1 space-y-6">
                 <div className="h-[420px]">
                    <TaskList tasks={teacherTasks} onViewAll={handleViewTasks} />
                 </div>
                 <div className="h-auto">
                    <ReviewSnapshot onDetailClick={handleViewReview} />
                 </div>
              </div>
            </div>
          </div>
        )}

        {viewState === 'list' && (
           <div className="h-full overflow-hidden">
              <StudentList 
                onStudentClick={handleStudentClick} 
                initialFilter={listFilter}
                initialFilters={structuredListFilters}
              />
           </div>
        )}

        {viewState === 'detail' && selectedStudentId && (
           <div className="h-full overflow-hidden">
              <StudentDetail 
                studentId={selectedStudentId} 
                onBack={handleBackToList}
                onNavigateToTranscript={handleNavigateToTranscript}
              />
           </div>
        )}

        {viewState === 'knowledge-library' && (
           <div className="h-full overflow-hidden">
              {/* Pass teacher role explicity */}
              <TargetLibrary role="teacher" />
           </div>
        )}

        {viewState === 'knowledge-majors' && (
           <div className="h-full overflow-hidden">
              <MajorEncyclopedia role="teacher" />
           </div>
        )}

        {viewState === 'knowledge-guides' && (
           <div className="h-full overflow-hidden">
              <CountryGuideLibrary role="teacher" />
           </div>
        )}

        {viewState === 'knowledge-competitions' && (
           <div className="h-full overflow-hidden">
              <CompetitionCalendar role="teacher" />
           </div>
        )}

        {(viewState === 'knowledge-school' || viewState === 'knowledge-resources') && (
           <div className="h-full overflow-hidden">
              <CampusKnowledgeBase role="teacher" />
           </div>
        )}

        {viewState === 'tasks' && (
           <div className="h-full overflow-hidden">
              <TaskCenter tasks={teacherTasks} setTasks={setTeacherTasks} initialTaskId={focusedTaskId} />
           </div>
        )}

        {viewState === 'reports' && (
           <div className="h-full overflow-hidden">
              <ReportCenter 
                 initialStudentId={reportConfig?.studentId}
                 initialTemplate={reportConfig?.template}
              />
           </div>
        )}

        {viewState === 'review' && (
           <div className="h-full overflow-hidden">
              <ReviewAnalytics />
           </div>
        )}

        {viewState === 'profile' && (
           <div className="h-full overflow-y-auto pb-10">
              <UserProfile />
           </div>
        )}

        {viewState === 'settings' && (
           <div className="h-full overflow-y-auto pb-10">
              <AccountSettings />
           </div>
        )}

      </main>

    </div>
  );
};

export default TeacherDashboard;
