
import React, { useEffect, useMemo, useState } from 'react';
import { 
  Target, Calendar, CheckCircle, Clock, 
  TrendingUp, ArrowRight, Zap, BookOpen, 
  AlertCircle, Trophy, Sparkles 
} from '../common/Icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { getStudentFinalSchools } from './studentSchoolList';
import { formatStudentTaskDueDate, isStudentTaskPastDue, isTaskDueThisWeek, isTodayPending, StudentTask } from './studentTasks';

interface StudentHomeProps {
  preferredName: string;
  tasks: StudentTask[];
  onNavigateToEssays?: () => void;
  onNavigateToPlan?: () => void;
  onNavigateToTasks?: (taskId?: string) => void;
}

const StudentHome: React.FC<StudentHomeProps> = ({ 
  preferredName,
  tasks,
  onNavigateToEssays, 
  onNavigateToPlan, 
  onNavigateToTasks 
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';
  const schoolList = useMemo(() => getStudentFinalSchools(isEn), [isEn]);
  const [dreamSchoolId, setDreamSchoolId] = useState(() => localStorage.getItem('student_dream_school_id') || '');
  const [taskReminderTab, setTaskReminderTab] = useState<'today' | 'overdue' | 'review'>('today');
  const dreamSchool = schoolList.find(school => school.id === dreamSchoolId) || schoolList.find(school => school.tier === 'Reach') || schoolList[0];
  const taskStatusLabel = (status: StudentTask['status']) => isEn
    ? status
    : ({ Pending: '待处理', Returned: '已退回', Completed: '已完成', Cancelled: '已取消', Review: '待审核', Overdue: '已逾期' } as Record<StudentTask['status'], string>)[status];

  useEffect(() => {
    if (!dreamSchoolId && dreamSchool) {
      setDreamSchoolId(dreamSchool.id);
      localStorage.setItem('student_dream_school_id', dreamSchool.id);
    }
  }, [dreamSchool, dreamSchoolId]);

  const handleDreamSchoolChange = (schoolId: string) => {
    setDreamSchoolId(schoolId);
    localStorage.setItem('student_dream_school_id', schoolId);
  };

  // Mock Data
  const completedTaskCount = tasks.filter(task => task.status === 'Completed').length;
  const completionRate = tasks.length === 0 ? 0 : Math.round((completedTaskCount / tasks.length) * 100);
  const weeklyTasks = useMemo(() => tasks.filter(task => isTaskDueThisWeek(task)), [tasks]);
  const taskReminderGroups = useMemo(() => ({
    today: tasks.filter(task => isTodayPending(task)),
    overdue: tasks.filter(task => isStudentTaskPastDue(task)),
    review: tasks.filter(task => task.status === 'Review'),
  }), [tasks]);
  const taskReminderItems = taskReminderGroups[taskReminderTab];

  const stats = [
    { 
      label: isEn ? 'Days to ED' : '距离早申截止', 
      value: '42', 
      unit: isEn ? 'Days' : '天',
      icon: <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
      bg: 'bg-violet-50 dark:bg-violet-500/10',
      border: 'border-violet-100 dark:border-violet-500/20'
    },
    { 
      label: isEn ? 'Task Completion' : '任务完成率', 
      value: `${completionRate}%`,
      unit: '',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      border: 'border-emerald-100 dark:border-emerald-500/20'
    },
    { 
      label: isEn ? 'Target School' : '梦校目标', 
      value: dreamSchool?.uni.name || (isEn ? 'Not selected' : '未选择'),
      unit: dreamSchool?.tier || '',
      isDreamSchool: true,
      icon: <Target className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      bg: 'bg-rose-50 dark:bg-rose-500/10',
      border: 'border-rose-100 dark:border-rose-500/20'
    },
  ];

  const timeline = [
    { month: 'Sep', title: isEn ? 'Finalize Essay' : '定稿文书', status: 'done' },
    { month: 'Oct', title: isEn ? 'ED Application' : '早申递交', status: 'current' },
    { month: 'Nov', title: isEn ? 'Interviews' : '校友面试', status: 'upcoming' },
    { month: 'Dec', title: isEn ? 'Offer Release' : '放榜时刻', status: 'upcoming' },
  ];

  return (
    <div className="h-full overflow-y-auto pr-2 pb-10 custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Welcome Banner */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
            {isEn ? `Ready to achieve, ${preferredName}? 🚀` : `准备好迎接挑战了吗，${preferredName}? 🚀`}
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm flex items-center gap-2">
            {isEn ? (
              <>You have <span className="font-bold text-violet-600 dark:text-violet-400">{weeklyTasks.length}</span> tasks due this week. Let's crush them!</>
            ) : (
              <>本周有 <span className="font-bold text-violet-600 dark:text-violet-400">{weeklyTasks.length}</span> 项任务待办。保持专注，继续前进！</>
            )}
          </p>
        </div>
        <div className="hidden sm:block text-right">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-zinc-800 rounded-full border border-gray-200 dark:border-white/10 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold text-gray-600 dark:text-zinc-300">{isEn ? 'Application Season: On Track' : '申请季状态: 正常推进'}</span>
           </div>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className={`p-5 rounded-2xl border ${stat.bg} ${stat.border} transition-transform hover:scale-[1.02] cursor-default`}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{stat.label}</span>
              <div className="p-1.5 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">{stat.icon}</div>
            </div>
            {stat.isDreamSchool ? (
              <div>
                <select
                  aria-label={isEn ? 'Choose dream school from my school list' : '从我的选校清单中选择梦校'}
                  value={dreamSchool?.id || ''}
                  onChange={(event) => handleDreamSchoolChange(event.target.value)}
                  className="w-full min-w-0 rounded-lg border border-rose-200 bg-white/80 px-3 py-2 text-sm font-bold text-gray-900 outline-none transition-colors hover:border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:border-rose-500/20 dark:bg-zinc-900 dark:text-white"
                >
                  {schoolList.map(school => (
                    <option key={school.id} value={school.id}>
                      {school.uni.name} · {school.major} · {school.tier}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400">
                  {isEn ? 'Selected from My Plan school list' : '选自“我的规划”选校清单'}
                </p>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</span>
                <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">{stat.unit}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 3. Left Column: Focus & Timeline */}
        <div className="lg:col-span-2 space-y-6">
           
           {/* Timeline Preview */}
           <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400" /> 
                    {isEn ? 'Season Timeline' : '申请季时间轴'}
                 </h3>
                 <button 
                    onClick={onNavigateToPlan}
                    className="text-xs text-violet-600 dark:text-violet-400 font-bold hover:underline"
                 >
                    {isEn ? 'View Full Plan' : '查看完整规划'}
                 </button>
              </div>
              <div className="relative">
                 {/* Line */}
                 <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-zinc-800 rounded-full -translate-y-1/2 z-0"></div>
                 <div className="grid grid-cols-4 relative z-10">
                    {timeline.map((item, idx) => (
                       <div key={idx} className="flex flex-col items-center text-center group cursor-pointer">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-300 mb-3
                             ${item.status === 'done' ? 'bg-violet-600 border-violet-100 text-white' : 
                               item.status === 'current' ? 'bg-white border-violet-600 text-violet-600 scale-110 shadow-lg' : 
                               'bg-gray-100 border-white text-gray-400 dark:bg-zinc-800 dark:border-zinc-900'}
                          `}>
                             {item.status === 'done' ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span className={`text-xs font-bold mb-1 ${item.status === 'current' ? 'text-violet-700 dark:text-violet-400' : 'text-gray-500 dark:text-zinc-500'}`}>{item.month}</span>
                          <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-600">{item.title}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* AI Assistant Teaser */}
           <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10 flex justify-between items-center">
                 <div>
                    <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                       <Sparkles className="w-5 h-5 text-yellow-300" /> {isEn ? 'Essay Brainstorming AI' : '文书灵感 AI 助手'}
                    </h3>
                    <p className="text-violet-100 text-sm max-w-md">
                       {isEn ? 'Stuck on your Personal Statement? Let AI help you find your unique story angle.' : '主文书写作卡壳了？让 AI 帮你挖掘独特的个人故事切入点。'}
                    </p>
                 </div>
                 <button 
                    onClick={onNavigateToEssays}
                    className="bg-white text-violet-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-violet-50 transition-colors shadow-sm"
                 >
                    {isEn ? 'Try Now' : '立即尝试'}
                 </button>
              </div>
           </div>

        </div>

        {/* 4. Right Column: Tasks & Notices */}
        <div className="space-y-6">
           {/* Tasks Widget */}
           <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 h-full min-h-[480px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                    {isEn ? 'Tasks & Reminders' : '待办与提醒'}
                 </h3>
                 <button
                    type="button"
                    onClick={() => onNavigateToTasks?.()}
                    className="flex items-center gap-1 text-sm font-bold text-[#b0826d] hover:text-[#8f6856] transition-colors"
                 >
                    {isEn ? 'All Tasks' : '全部任务'} <ArrowRight className="w-4 h-4" />
                 </button>
              </div>

              <div className="grid grid-cols-3 rounded-xl bg-gray-50 dark:bg-zinc-800/70 p-1 mb-5">
                 {([
                    { id: 'today', label: isEn ? 'Today' : '今日待办' },
                    { id: 'overdue', label: isEn ? 'Overdue' : '本周逾期' },
                    { id: 'review', label: isEn ? 'In Review' : '待审核' },
                 ] as const).map(tab => (
                    <button
                       key={tab.id}
                       type="button"
                       onClick={() => setTaskReminderTab(tab.id)}
                       className={`min-w-0 rounded-lg px-2 py-2.5 text-sm font-bold transition-all ${taskReminderTab === tab.id ? 'bg-white dark:bg-zinc-700 text-[#9b6f5c] dark:text-[#d4a894] shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}
                    >
                       <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                          {tab.label}
                          {taskReminderGroups[tab.id].length > 0 && (
                             <span className={`min-w-5 h-5 px-1 rounded-full inline-flex items-center justify-center text-xs ${tab.id === 'overdue' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}>
                                {taskReminderGroups[tab.id].length}
                             </span>
                          )}
                       </span>
                    </button>
                 ))}
              </div>

              <div className="h-80 overflow-y-auto pr-2 custom-scrollbar">
                 {taskReminderItems.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                       {taskReminderItems.map(task => (
                          <button
                             type="button"
                             key={task.id}
                             onClick={() => onNavigateToTasks?.(task.id)}
                             className="group w-full text-left px-3 py-5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
                          >
                             <div className="flex items-start justify-between gap-3">
                                <p className="min-w-0 text-sm font-bold text-gray-900 dark:text-zinc-100 line-clamp-2 group-hover:text-[#9b6f5c] dark:group-hover:text-[#d4a894] transition-colors">
                                   {task.title}
                                </p>
                                <span className="flex-shrink-0 rounded-md border border-violet-100 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/10 px-2 py-1 text-xs font-bold text-violet-600 dark:text-violet-400">{taskStatusLabel(task.status)}</span>
                             </div>
                             <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-gray-100 dark:bg-zinc-800 px-3 py-1 text-xs text-gray-500 dark:text-zinc-400">{preferredName}</span>
                                <span className="rounded-full bg-gray-100 dark:bg-zinc-800 px-3 py-1 text-xs text-gray-500 dark:text-zinc-400">
                                   {task.assigner === 'Teacher' ? (isEn ? 'Teacher assigned' : '老师下发') : (isEn ? 'Self-created' : '学生自建')}
                                </span>
                                <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${isStudentTaskPastDue(task) ? 'border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-zinc-400'}`}>
                                   <Clock className="w-3 h-3" /> {formatStudentTaskDueDate(task.dueDate, isEn)}
                                </span>
                             </div>
                          </button>
                       ))}
                    </div>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-zinc-600">
                       <CheckCircle className="w-9 h-9 mb-3 text-gray-200 dark:text-zinc-700" />
                       <p className="text-sm">{isEn ? 'No tasks in this view' : '当前没有相关任务'}</p>
                    </div>
                 )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default StudentHome;
