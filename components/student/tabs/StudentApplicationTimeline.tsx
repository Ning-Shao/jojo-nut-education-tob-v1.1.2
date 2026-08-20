import React, { useState } from 'react';
import { 
  Filter, 
  User, 
  Users, 
  GanttChart, 
  List, 
  Globe, 
  Flag, 
  X, 
  CheckSquare, 
  Plus, 
  ChevronRight,
  Calendar,
  MoreHorizontal,
  CheckCircle,
  Clock
} from '../../common/Icons';
import { useLanguage } from '../../../contexts/LanguageContext';

// --- Types ---

interface TimelineTemplate {
  id: string;
  title: string;
  flag: string;
  tag: string;
  description: string;
  events: string[];
}

interface TimelineTask {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  category: 'Application' | 'Exam' | 'Activity' | 'Academic' | 'Other';
  type: 'Official' | 'Custom';
  role: 'Student' | 'Counselor';
  status: 'Pending' | 'Completed';
  tag?: string;
}

// --- Mock Data ---

const TEMPLATES: TimelineTemplate[] = [
  {
    id: 'ucas-2025',
    title: 'UK UCAS Undergraduate 2025',
    flag: '🇬🇧',
    tag: 'UCAS',
    description: 'Standard timeline for UK university applications via UCAS.',
    events: [
      'UCAS Application Opens',
      'Oxbridge / Medicine / Vet Deadline',
      'UCAS Equal Consideration Deadline'
    ]
  },
  {
    id: 'common-app-2025',
    title: 'US Common App 2025',
    flag: '🇺🇸',
    tag: 'Common App',
    description: 'General timeline for US colleges using Common App.',
    events: [
      'Common App Opens',
      'Early Decision I / Early Action Deadline',
      'UC Application Deadline'
    ]
  },
  {
    id: 'hk-non-jupas-2025',
    title: 'Hong Kong Non-JUPAS 2025',
    flag: '🇭🇰',
    tag: 'Non-JUPAS',
    description: 'Timeline for international students applying to HK universities.',
    events: [
      'Applications Open (Main Round)',
      'Main Round Deadline',
      'Late Round Deadline'
    ]
  },
  {
    id: 'hk-jupas-2025',
    title: 'Hong Kong JUPAS 2025',
    flag: '🇭🇰',
    tag: 'JUPAS',
    description: 'Timeline for local students applying via JUPAS.',
    events: [
      'JUPAS Account Creation',
      'Submission Deadline',
      'Update Choices'
    ]
  }
];

const INITIAL_UNSCHEDULED_TASKS: TimelineTask[] = [
  {
    id: 'u1',
    title: 'Physics Competition Registration',
    date: '',
    category: 'Activity',
    type: 'Custom',
    role: 'Student',
    status: 'Pending',
    tag: 'P1'
  }
];

const MOCKED_IMPORTED_TASKS: TimelineTask[] = [
  {
    id: 't1',
    title: 'Finalize School List',
    date: '2024-09-15',
    category: 'Application',
    type: 'Custom',
    role: 'Student',
    status: 'Completed'
  },
  {
    id: 't2',
    title: 'Early Decision (ED) Application',
    date: '2024-11-01',
    category: 'Application',
    type: 'Official',
    role: 'Student',
    status: 'Pending'
  }
];

// --- Components ---

const StudentApplicationTimeline: React.FC = () => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  // State
  const [isImported, setIsImported] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  const [viewFilter, setViewFilter] = useState<'all' | 'official' | 'custom'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'counselor'>('all');
  const [viewMode, setViewMode] = useState<'gantt' | 'list'>('gantt');
  const [granularity, setGranularity] = useState<'month' | 'stage'>('month');
  const [isUnscheduledOpen, setIsUnscheduledOpen] = useState(true);

  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState<TimelineTask[]>(INITIAL_UNSCHEDULED_TASKS);

  // Handlers
  const handleImport = () => {
    if (selectedTemplate) {
      setTasks(MOCKED_IMPORTED_TASKS); // In real app, generate based on template
      setIsImported(true);
      setShowImportModal(false);
    }
  };

  // Filter Logic
  const filteredTasks = tasks.filter(task => {
    if (viewFilter === 'official' && task.type !== 'Official') return false;
    if (viewFilter === 'custom' && task.type !== 'Custom') return false;
    if (roleFilter === 'student' && task.role !== 'Student') return false;
    if (roleFilter === 'counselor' && task.role !== 'Counselor') return false;
    return true;
  });

  // Group by Category for Gantt
  const categories = ['Application', 'Exam', 'Activity', 'Academic', 'Other'];
  
  // Helpers
  const getStageInfo = (date: Date) => {
    const month = date.getMonth() + 1; // 1-12
    if (month >= 9 || month === 1) return { name: isEn ? 'Fall' : '上学期', id: 'fall', color: 'bg-orange-50/50 text-orange-700' };
    if (month === 2) return { name: isEn ? 'Winter' : '寒假', id: 'winter', color: 'bg-blue-50/50 text-blue-700' };
    if (month >= 3 && month <= 6) return { name: isEn ? 'Spring' : '下学期', id: 'spring', color: 'bg-emerald-50/50 text-emerald-700' };
    return { name: isEn ? 'Summer' : '暑假', id: 'summer', color: 'bg-amber-50/50 text-amber-700' };
  };

  const baseAcademicYear = React.useMemo(() => {
    const dates = tasks.map(t => t.date).filter(Boolean).map(d => new Date(d));
    if (dates.length === 0) return new Date().getFullYear();
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    return minDate.getMonth() >= 8 ? minDate.getFullYear() : minDate.getFullYear() - 1;
  }, [tasks]);

  const getGradeLabel = (academicYear: number) => {
    const diff = academicYear - baseAcademicYear;
    const grade = 10 + diff;
    return `G${grade}`;
  };

  // Timeline Range
  const viewRange = React.useMemo(() => {
    const dates = tasks.map(t => t.date).filter(Boolean).map(d => new Date(d));
    if (dates.length === 0) dates.push(new Date());
    
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const start = new Date(minDate.getFullYear(), minDate.getMonth() - 1, 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 24, 1);
    
    // Ensure at least 36 months
    const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (monthDiff < 36) {
      end.setMonth(start.getMonth() + 36);
    }
    return { start, end };
  }, [tasks]);

  // Timeline Columns
  const columns = React.useMemo(() => {
    if (granularity === 'month') {
      const months = [];
      const curr = new Date(viewRange.start);
      while (curr < viewRange.end) {
        months.push({
          type: 'month' as const,
          date: new Date(curr),
          label: curr.toLocaleDateString(isEn ? 'en-US' : 'zh-CN', { year: 'numeric', month: isEn ? 'short' : 'long' }),
          sub: `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`
        });
        curr.setMonth(curr.getMonth() + 1);
      }
      return months;
    } else {
      const stages = [];
      const curr = new Date(viewRange.start);
      while (curr < viewRange.end) {
        const stage = getStageInfo(curr);
        const academicYear = curr.getMonth() >= 8 ? curr.getFullYear() : curr.getFullYear() - 1;
        const stageKey = `${academicYear}-${stage.id}`;
        
        if (stages.length === 0 || stages[stages.length - 1].key !== stageKey) {
          stages.push({
            type: 'stage' as const,
            key: stageKey,
            name: stage.name,
            academicYear,
            color: stage.color,
            months: [new Date(curr)]
          });
        } else {
          stages[stages.length - 1].months.push(new Date(curr));
        }
        curr.setMonth(curr.getMonth() + 1);
      }
      return stages;
    }
  }, [viewRange, granularity, language]);

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc] dark:bg-zinc-950/50 relative">
      
      {/* 1. Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-6">
          {/* View Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-zinc-400">{isEn ? 'View:' : '视图:'}</span>
            <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1">
              {(['all', 'official', 'custom'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setViewFilter(f)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    viewFilter === f 
                      ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                  }`}
                >
                  {f === 'all' ? (isEn ? 'All' : '全部') : 
                   f === 'official' ? (isEn ? 'Official' : '官方') : 
                   (isEn ? 'Custom' : '自定义')}
                </button>
              ))}
            </div>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-zinc-400">{isEn ? 'Role:' : '角色:'}</span>
            <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1">
              {(['all', 'student', 'counselor'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                    roleFilter === r 
                      ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                  }`}
                >
                  {r === 'student' && <User className="w-3 h-3" />}
                  {r === 'counselor' && <Users className="w-3 h-3" />}
                  {r === 'all' ? (isEn ? 'All' : '全部') : 
                   r === 'student' ? (isEn ? 'Student' : '学生') : 
                   (isEn ? 'Counselor' : '顾问')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-4">
          {/* Granularity Toggle */}
          <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1">
            {(['month', 'stage'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  granularity === g 
                    ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                }`}
              >
                {g === 'month' ? <Clock className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                {g === 'month' ? (isEn ? 'Month' : '按月') : (isEn ? 'Stage' : '按阶段')}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-gray-200 dark:bg-white/10"></div>

          <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'gantt'
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
              }`}
            >
              <GanttChart className="w-3.5 h-3.5" /> Gantt
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>
        </div>
      </div>

      {/* 2. Banner (If not imported) */}
      {!isImported && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 px-6 py-3 flex items-center justify-between border-b border-indigo-100 dark:border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                {isEn ? 'Official Timeline Not Imported' : '尚未导入官方时间线'}
              </h3>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                {isEn ? 'Please import an official timeline template to start planning.' : '请先导入官方申请时间轴模板以开始规划。'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            {isEn ? 'Import Now' : '立即导入'}
          </button>
        </div>
      )}

      {/* 3. Main Content */}
      <div className="flex-1 overflow-hidden flex gap-4 p-4">
        
        {/* Gantt Chart Area */}
        <div className="flex-1 overflow-auto border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900 shadow-sm">
          {/* Header */}
          <div className="flex border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900/50 sticky top-0 z-40">
            <div className="w-32 flex-shrink-0 p-3 text-xs font-bold text-gray-500 dark:text-zinc-400 border-r border-gray-200 dark:border-white/10 flex items-center justify-center bg-gray-50 dark:bg-zinc-900/50 sticky left-0 z-50">
              {isEn ? 'Category' : '分类'}
            </div>
            {columns.map((col, i) => {
              if (col.type === 'month') {
                return (
                  <div key={i} className="w-60 flex-shrink-0 p-2 text-center border-r border-gray-100 dark:border-white/5 last:border-r-0">
                    <div className="text-sm font-bold text-gray-800 dark:text-zinc-200">{col.label}</div>
                    <div className="text-xs text-gray-400 dark:text-zinc-500">{col.sub}</div>
                  </div>
                );
              } else {
                return (
                  <div key={i} className={`w-80 flex-shrink-0 p-2 text-center border-r border-gray-100 dark:border-white/5 last:border-r-0 flex flex-col justify-center ${col.color}`}>
                    <div className="text-[10px] font-bold opacity-60 uppercase tracking-wider">{getGradeLabel(col.academicYear)}</div>
                    <div className="text-sm font-bold">{col.name}</div>
                  </div>
                );
              }
            })}
          </div>

          {/* Swimlanes */}
          <div className="flex flex-col">
            {categories.map((cat) => {
              const catTasks = filteredTasks.filter(t => t.category === cat);
              return (
                <div key={cat} className="flex border-b border-gray-100 dark:border-white/5 min-h-[120px] group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  {/* Row Header */}
                  <div className="w-32 flex-shrink-0 p-3 border-r border-gray-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-zinc-900 sticky left-0 z-30 group-hover:bg-gray-50/50 dark:group-hover:bg-zinc-900">
                    <span className="text-sm font-bold text-gray-700 dark:text-zinc-300">{cat}</span>
                    <span className="bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-zinc-500 text-xs px-1.5 py-0.5 rounded-full">
                      {catTasks.length}
                    </span>
                  </div>

                  {/* Grid Cells */}
                  <div className="flex">
                    {columns.map((col, i) => {
                      const isStage = col.type === 'stage';
                      const width = isStage ? 'w-80' : 'w-60';
                      
                      let cellTasks: TimelineTask[] = [];
                      let isCurrent = false;

                      if (!isStage) {
                        const monthKey = col.sub;
                        isCurrent = new Date().getMonth() === col.date.getMonth() && new Date().getFullYear() === col.date.getFullYear();
                        cellTasks = catTasks.filter(task => task.date.startsWith(monthKey));
                      } else {
                        isCurrent = col.months.some(m => new Date().getMonth() === m.getMonth() && new Date().getFullYear() === m.getFullYear());
                        cellTasks = catTasks.filter(task => {
                          if (!task.date) return false;
                          return col.months.some(m => {
                            const mKey = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
                            return task.date.startsWith(mKey);
                          });
                        });
                      }

                      return (
                        <div key={i} className={`${width} flex-shrink-0 border-r border-dashed border-gray-100 dark:border-white/5 last:border-r-0 p-2.5 flex flex-col gap-2.5 ${isCurrent ? 'bg-violet-50/10 dark:bg-violet-500/5' : ''}`}>
                          {cellTasks.map(task => (
                            <div 
                              key={task.id}
                              className={`relative z-10 p-3 rounded-lg border shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all bg-white dark:bg-zinc-800 flex flex-col gap-2 ${task.status === 'Completed' ? 'opacity-60 bg-gray-50 dark:bg-zinc-800/50' : ''} ${task.type === 'Official' ? 'border-violet-200 dark:border-violet-500/30' : 'border-gray-200 dark:border-white/10'}`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 leading-snug line-clamp-2" title={task.title}>
                                  {task.type === 'Official' && <Globe className="w-3.5 h-3.5 inline mr-1 text-violet-500" />}
                                  {task.title}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-1">
                                {/* Role */}
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-zinc-400 flex items-center gap-1">
                                  {task.role === 'Student' ? <User className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
                                  {task.role === 'Student' ? (isEn ? 'Stu' : '学生') : (isEn ? 'Coun' : '顾问')}
                                </span>
                                {/* Status */}
                                {task.status === 'Completed' && <CheckCircle className="w-3.5 h-3.5 text-green-500 ml-auto" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Planning List Sidebar */}
        <div className={`flex-shrink-0 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50 transition-all duration-300 flex flex-col ${isUnscheduledOpen ? 'w-80' : 'w-12'}`}>
          <div 
            className="flex justify-between items-center cursor-pointer select-none p-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 rounded-t-xl"
            onClick={() => setIsUnscheduledOpen(!isUnscheduledOpen)}
          >
            {isUnscheduledOpen ? (
              <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-2">
                <List className="w-4 h-4 text-violet-500" /> {isEn ? 'Planning List' : '规划清单'} 
                <span className="bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 px-2 py-0.5 rounded-full text-xs font-bold">{unscheduledTasks.length}</span>
              </h3>
            ) : (
              <div className="flex flex-col items-center gap-4 w-full">
                <List className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                <span className="bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-zinc-400 px-2 py-0.5 rounded-full text-[10px] font-bold">{unscheduledTasks.length}</span>
              </div>
            )}
            {isUnscheduledOpen && (
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
              </div>
            )}
          </div>

          {isUnscheduledOpen && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-4">
              {unscheduledTasks.length > 0 ? (
                <div className="space-y-3">
                  {unscheduledTasks.map(task => (
                    <div 
                      key={task.id}
                      className="bg-white dark:bg-zinc-800 p-3.5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-500/50 transition-all flex flex-col gap-2.5 group relative"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-sm font-bold text-gray-800 dark:text-zinc-200 leading-snug flex-1" title={task.title}>{task.title}</span>
                        {task.tag && (
                          <span className="bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300 text-[10px] px-1.5 py-0.5 rounded border border-orange-100 dark:border-orange-500/20 font-bold flex-shrink-0">
                            {task.tag}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-zinc-400 text-[10px] px-2 py-0.5 rounded font-medium">
                          {task.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full py-8 text-gray-400 dark:text-zinc-500 text-sm italic border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 bg-white dark:bg-zinc-900">
                  <CheckCircle className="w-8 h-8 text-gray-300 dark:text-zinc-600" /> 
                  {isEn ? 'All tasks scheduled!' : '所有任务均已排期！'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-black/5 dark:ring-white/10 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-start bg-white dark:bg-zinc-900">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {isEn ? 'Import Official Timeline' : '导入官方时间线'}
                </h2>
                <p className="text-gray-500 dark:text-zinc-400">
                  {isEn ? 'Select the official application timeline template to import.' : '选择需要导入的官方申请时间轴模板。'}
                </p>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-black/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {TEMPLATES.map(template => (
                  <div 
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`relative bg-white dark:bg-zinc-800 rounded-xl p-6 border-2 cursor-pointer transition-all duration-200 group
                      ${selectedTemplate === template.id 
                        ? 'border-violet-600 shadow-lg shadow-violet-500/10 ring-1 ring-violet-600' 
                        : 'border-transparent hover:border-gray-200 dark:hover:border-white/10 shadow-sm hover:shadow-md'}
                    `}
                  >
                    {/* Selection Radio */}
                    <div className={`absolute top-6 right-6 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                      ${selectedTemplate === template.id 
                        ? 'border-violet-600 bg-violet-600' 
                        : 'border-gray-300 dark:border-zinc-600 group-hover:border-violet-400'}
                    `}>
                      {selectedTemplate === template.id && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{template.flag}</span>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                          {template.title}
                        </h3>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-zinc-400 text-xs rounded border border-gray-200 dark:border-white/5">
                          {template.tag}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4 h-10 line-clamp-2">
                      {template.description}
                    </p>

                    <div className="space-y-2">
                      {template.events.map((event, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400/50"></div>
                          {event}
                        </div>
                      ))}
                      <div className="text-xs text-gray-400 dark:text-zinc-600 pl-3.5 italic">
                        + more events
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900 flex justify-end gap-3">
              <button 
                onClick={() => setShowImportModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                {isEn ? 'Cancel' : '取消'}
              </button>
              <button 
                onClick={handleImport}
                disabled={!selectedTemplate}
                className={`px-6 py-2.5 text-sm font-bold text-white rounded-lg shadow-sm transition-all
                  ${selectedTemplate 
                    ? 'bg-violet-600 hover:bg-violet-700 hover:shadow-md hover:shadow-violet-500/20' 
                    : 'bg-gray-300 dark:bg-zinc-700 cursor-not-allowed'}
                `}
              >
                {isEn ? 'Confirm Import' : '确认导入'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentApplicationTimeline;
