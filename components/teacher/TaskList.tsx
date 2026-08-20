
import React, { useState, useMemo } from 'react';
import { ArrowRight, User, Clock, CheckCircle } from '../common/Icons';
import { TodoItem } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface TaskListProps {
  onViewAll?: () => void;
}

const TaskList: React.FC<TaskListProps> = ({ onViewAll }) => {
  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'approval'>('today');
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  // Enriched mock data to showcase filtering functionality
  // Note: For a real app, data should come from DB. Here we mock translation.
  const mockTodos: TodoItem[] = useMemo(() => [
    // Today's tasks
    { id: '1', title: isEn ? 'Review Alex Chen\'s College List' : '审核 Alex Chen 的选校名单', student: 'Alex Chen', due: 'Today', type: 'urgent', status: 'pending' },
    { id: '2', title: isEn ? 'Check Emily\'s Portfolio Progress' : '跟进 Emily 的作品集进度', student: 'Emily Zhang', due: 'Today', type: 'pending', status: 'pending' },
    
    // Approval tasks (Can be Today or others)
    { id: '3', title: isEn ? 'Sign Sarah Li\'s Rec Letter' : '签署 Sarah Li 的推荐信', student: 'Sarah Li', due: 'Today', type: 'approval', status: 'pending' },
    { id: '4', title: isEn ? 'Approve Michael\'s Contest Fee' : '审批 Michael 的竞赛报名费', student: 'Michael Wu', due: 'Tomorrow', type: 'approval', status: 'pending' },

    // Overdue tasks
    { id: '5', title: isEn ? 'Follow up James\' TOEFL Score' : '跟进 James Wang 的标化成绩', student: 'James Wang', due: 'Yesterday', type: 'urgent', status: 'pending' },
    { id: '6', title: isEn ? 'Collect G10 Parent Feedback' : '收集 G10 学生家长反馈表', student: 'Group G10', due: 'Yesterday', type: 'pending', status: 'pending' },
    { id: '7', title: isEn ? 'Update G12 App Status' : '更新 G12 申请状态汇总', student: 'All G12', due: 'Last Week', type: 'urgent', status: 'pending' },
  ], [isEn]);

  // Logic to filter tasks based on active tab
  const filteredTodos = mockTodos.filter(todo => {
    if (activeTab === 'today') {
      return todo.due === 'Today';
    }
    if (activeTab === 'overdue') {
      return ['Yesterday', 'Last Week'].includes(todo.due);
    }
    if (activeTab === 'approval') {
      return todo.type === 'approval';
    }
    return true;
  });

  // Calculate overdue count for the badge
  const overdueCount = mockTodos.filter(t => ['Yesterday', 'Last Week'].includes(t.due)).length;

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 h-full flex flex-col transition-colors duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-800 dark:text-zinc-100">{isEn ? 'Tasks & Reminders' : '待办与提醒'}</h3>
        <button 
          onClick={onViewAll}
          className="text-sm text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 flex items-center font-medium transition-colors"
        >
          {isEn ? 'View All' : '全部任务'} <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      <div className="flex gap-2 mb-4 bg-gray-50 dark:bg-zinc-850 p-1 rounded-xl w-fit border border-transparent dark:border-white/5">
        {(['today', 'overdue', 'approval'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === tab 
                ? 'bg-white dark:bg-zinc-800 text-primary-600 dark:text-primary-300 shadow-sm dark:shadow-none dark:border dark:border-white/5' 
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
            }`}
          >
            {tab === 'today' ? (isEn ? 'Today' : '今日待办') : tab === 'overdue' ? (isEn ? 'Overdue' : '本周逾期') : (isEn ? 'Approval' : '待审批')}
            {tab === 'overdue' && overdueCount > 0 && (
              <span className="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[1.2rem] text-center">
                {overdueCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar min-h-[200px]">
        {filteredTodos.length > 0 ? (
          filteredTodos.map((todo) => (
            <div 
              key={todo.id} 
              onClick={onViewAll}
              className="group flex items-start gap-3 p-3 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-white/10 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer animate-in fade-in slide-in-from-right-4 duration-300"
            >
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                   <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors line-clamp-1">{todo.title}</p>
                   {todo.type === 'approval' && <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100 whitespace-nowrap ml-2">{isEn ? 'APPR' : '审批'}</span>}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center text-xs text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full border border-transparent dark:border-white/5 truncate max-w-[100px]">
                    <User className="w-3 h-3 mr-1 flex-shrink-0" />
                    {todo.student}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    ['Yesterday', 'Last Week'].includes(todo.due)
                      ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20' 
                      : todo.due === 'Today'
                        ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20'
                        : 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/20'
                  }`}>
                    <Clock className="w-3 h-3" />
                    {todo.due}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-zinc-500">
             <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-zinc-800/50 flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-gray-300 dark:text-zinc-600" />
             </div>
             <p className="text-sm">{isEn ? 'No tasks found' : '暂无相关任务'}</p>
          </div>
        )}
      </div>
      

    </div>
  );
};

export default TaskList;
