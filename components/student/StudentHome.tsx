
import React from 'react';
import { 
  Target, Calendar, CheckCircle, Clock, 
  TrendingUp, ArrowRight, Zap, BookOpen, 
  AlertCircle, Trophy, Sparkles 
} from '../common/Icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface StudentHomeProps {
  onNavigateToEssays?: () => void;
  onNavigateToPlan?: () => void;
  onNavigateToTasks?: () => void;
}

const StudentHome: React.FC<StudentHomeProps> = ({ 
  onNavigateToEssays, 
  onNavigateToPlan, 
  onNavigateToTasks 
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  // Mock Data
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
      value: '85%', 
      unit: '',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      border: 'border-emerald-100 dark:border-emerald-500/20'
    },
    { 
      label: isEn ? 'Target School' : '梦校目标', 
      value: 'CMU', 
      unit: 'Reach',
      icon: <Target className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      bg: 'bg-rose-50 dark:bg-rose-500/10',
      border: 'border-rose-100 dark:border-rose-500/20'
    },
  ];

  const tasks = [
    { id: 1, title: isEn ? 'Draft Personal Statement V2' : '完成主文书 V2 草稿', due: 'Today', tag: 'Essay', urgent: true },
    { id: 2, title: isEn ? 'Submit Physics Recommendation Request' : '提交物理老师推荐信申请', due: 'Tomorrow', tag: 'Material', urgent: false },
    { id: 3, title: isEn ? 'Review School List with Counselor' : '与顾问确认最终选校单', due: 'Fri', tag: 'Planning', urgent: false },
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
            {isEn ? 'Ready to achieve, Alex? 🚀' : '准备好迎接挑战了吗，Alex? 🚀'}
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm flex items-center gap-2">
            {isEn ? (
              <>You have <span className="font-bold text-violet-600 dark:text-violet-400">3</span> tasks due this week. Let's crush them!</>
            ) : (
              <>本周有 <span className="font-bold text-violet-600 dark:text-violet-400">3</span> 项任务待办。保持专注，继续前进！</>
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
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</span>
              <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">{stat.unit}</span>
            </div>
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
           <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 h-full">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" /> 
                    {isEn ? 'Up Next' : '待办事项'}
                 </h3>
                 <span className="text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">3 Pending</span>
              </div>
              
              <div className="space-y-3">
                 {tasks.map((task) => (
                    <div key={task.id} className="group p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-white/5 hover:border-violet-200 dark:hover:border-violet-500/30 hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer">
                       <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${task.urgent ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                             {task.tag}
                          </span>
                          <span className={`text-xs font-medium flex items-center gap-1 ${task.due === 'Today' ? 'text-red-500' : 'text-gray-400'}`}>
                             <Clock className="w-3 h-3" /> {task.due}
                          </span>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-zinc-600 group-hover:border-violet-500 transition-colors"></div>
                          <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 line-clamp-2 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                             {task.title}
                          </p>
                       </div>
                    </div>
                 ))}
              </div>
              
              <button 
                 onClick={onNavigateToTasks}
                 className="w-full mt-4 py-2 text-xs font-bold text-gray-500 dark:text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 flex items-center justify-center gap-1 transition-colors"
              >
                 {isEn ? 'View All Tasks' : '查看所有任务'} <ArrowRight className="w-3 h-3" />
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default StudentHome;
