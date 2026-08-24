
import React, { useState } from 'react';
import { ArrowRight, User, Clock, CheckCircle } from '../common/Icons';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  formatTeacherTaskDueDate,
  formatTeacherTaskTitle,
  getTeacherTaskEffectiveStatus,
  isTeacherOverdueTodo,
  isTeacherReviewTodo,
  isTeacherTodayTodo,
  TeacherTask,
} from './teacherTasks';

interface TaskListProps {
  onViewAll?: (taskId?: string) => void;
  tasks: TeacherTask[];
}

const TaskList: React.FC<TaskListProps> = ({ onViewAll, tasks }) => {
  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'approval'>('today');
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  // Logic to filter tasks based on active tab
  const filteredTodos = tasks.filter(todo => {
    if (activeTab === 'today') {
      return isTeacherTodayTodo(todo);
    }
    if (activeTab === 'overdue') {
      return isTeacherOverdueTodo(todo);
    }
    if (activeTab === 'approval') {
      return isTeacherReviewTodo(todo);
    }
    return true;
  });

  // Calculate overdue count for the badge
  const overdueCount = tasks.filter(task => isTeacherOverdueTodo(task)).length;

  const statusBadge = (todo: TeacherTask) => {
    const status = getTeacherTaskEffectiveStatus(todo);
    if (status === 'Review') return { label: isEn ? 'Review' : '待审批', className: 'bg-purple-50 text-purple-600 border-purple-100' };
    if (status === 'Overdue') return { label: isEn ? 'Overdue' : '逾期', className: 'bg-red-50 text-red-600 border-red-100' };
    if (status === 'Completed') return { label: isEn ? 'Completed' : '已完成', className: 'bg-green-50 text-green-600 border-green-100' };
    return { label: isEn ? 'Pending' : '待处理', className: 'bg-gray-50 text-gray-600 border-gray-200' };
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 h-full flex flex-col transition-colors duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-800 dark:text-zinc-100">{isEn ? 'Tasks & Reminders' : '待办与提醒'}</h3>
        <button 
          onClick={() => onViewAll?.()}
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
          filteredTodos.map((todo) => {
            const badge = statusBadge(todo);
            const displayTitle = formatTeacherTaskTitle(todo, isEn);
            return (
            <div 
              key={todo.id} 
              onClick={() => onViewAll?.(todo.id)}
              role="button"
              tabIndex={0}
              aria-label={isEn ? `Open task: ${displayTitle}` : `打开任务：${displayTitle}`}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') onViewAll?.(todo.id);
              }}
              className="group flex items-start gap-3 p-3 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-white/10 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer animate-in fade-in slide-in-from-right-4 duration-300"
            >
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                   <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors line-clamp-1">{displayTitle}</p>
                   <span className={`text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap ml-2 ${badge.className}`}>{badge.label}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center text-xs text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full border border-transparent dark:border-white/5 truncate max-w-[100px]">
                    <User className="w-3 h-3 mr-1 flex-shrink-0" />
                    {todo.studentName}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    getTeacherTaskEffectiveStatus(todo) === 'Overdue'
                      ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20' 
                      : isTeacherTodayTodo(todo)
                        ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20'
                        : 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/20'
                  }`}>
                    <Clock className="w-3 h-3" />
                    {formatTeacherTaskDueDate(todo.dueDate, isEn)}
                  </span>
                </div>
              </div>
            </div>
          );})
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
