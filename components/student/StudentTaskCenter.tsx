
import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckSquare, Search, Plus, Calendar,
  Clock, AlertTriangle,
  CheckCircle, XCircle, ListTodo,
  CheckCheck, Edit, FileText, RotateCcw, Trash2, User, LayoutGrid
} from '../common/Icons';
import TaskEditDialog, { TaskEditField } from '../common/TaskEditDialog';
import { createTaskAuditEntry, TaskFieldChange } from '../common/taskAudit';
import { useLanguage } from '../../contexts/LanguageContext';
import { publishStudentReviewEvent } from '../../services/studentReviewEvents';
import {
  formatStudentTaskDueDate,
  formatStudentTaskPriority,
  CURRENT_STUDENT_ID,
  getStudentTaskTimingStatus,
  getStudentTaskWorkflowStatus,
  getLocalTodayStr,
  getLocalTomorrowStr,
  isTaskDueThisWeek,
  isStudentTaskPastDue,
  isStudentTaskTerminal,
  isTodayPending,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  StudentTask as Task,
} from './studentTasks';

// Removed '建档'
const CATEGORIES: TaskCategory[] = ['建档', '规划', '考试', '活动', '材料', '面试', '申请', 'Offer', '复盘', '其他'];

// Toast Component
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-lg shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
    <CheckCircle className="w-4 h-4 text-green-400 dark:text-green-600" />
    <span className="text-sm font-medium">{message}</span>
    <button onClick={onClose} className="text-gray-400 dark:text-zinc-500 hover:text-white dark:hover:text-zinc-900"><XCircle className="w-3 h-3" /></button>
  </div>
);

interface StudentTaskCenterProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  initialTaskId?: string;
  studentName: string;
}

const StudentTaskCenter: React.FC<StudentTaskCenterProps> = ({ tasks, setTasks, initialTaskId, studentName }) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  // State
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Today' | 'Week' | 'Overdue' | 'Completed' | 'Review' | 'All'>('Today');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [sourceContextTaskId, setSourceContextTaskId] = useState<string | null>(null);
  const handledInitialTaskId = useRef<string | undefined>();

  // New Task Form State
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    category: '规划' as TaskCategory,
    dueDate: '',
    priority: 'Medium' as TaskPriority,
    description: ''
  });

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (!initialTaskId || handledInitialTaskId.current === initialTaskId) return;
    handledInitialTaskId.current = initialTaskId;
    setActiveTab('All');
    setSelectedCategory('全部');
    setSearchQuery('');
    const task = tasks.find(item => item.id === initialTaskId);
    if (!task) {
      setFocusedTaskId(null);
      setDetailTaskId(null);
      setSourceContextTaskId(initialTaskId);
      setToastMessage(isEn ? `The source task (${initialTaskId}) is no longer available.` : `来源任务（${initialTaskId}）已失效或不存在，已保留来源上下文。`);
      return;
    }
    setSourceContextTaskId(null);
    setFocusedTaskId(task.id);
    setDetailTaskId(task.id);
    window.setTimeout(() => document.getElementById(`student-task-${task.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 0);
  }, [initialTaskId, isEn, tasks]);

  // Helper: Date format getters
  const getTodayStr = getLocalTodayStr;
  const getTomorrowStr = getLocalTomorrowStr;

  // Helper: Translate Category
  const translateCategory = (cat: string) => {
      if (!isEn) return cat;
      const map: Record<string, string> = {
          '规划': 'Planning',
          '考试': 'Testing',
          '活动': 'Activity',
          '材料': 'Materials',
          '面试': 'Interview',
          '申请': 'Application',
          'Offer': 'Offer',
          '复盘': 'Review',
          '建档': 'Profile',
          '其他': 'Other',
          '全部': 'All'
      };
      return map[cat] || cat;
  };

  // Filtering Logic
  // 此集合只由全部任务和统一业务选择器派生，不受标签、搜索词或分类影响。
  const todayPendingTasks = tasks.filter(task => isTodayPending(task));

  const filteredTasks = tasks.filter(task => {
    // 1. Tab Filter
    let matchesTab = true;
    if (activeTab === 'Today') {
        matchesTab = isTodayPending(task);
    }
    if (activeTab === 'Overdue') matchesTab = isStudentTaskPastDue(task);
    if (activeTab === 'Completed') matchesTab = task.status === 'Completed';
    if (activeTab === 'Review') matchesTab = task.status === 'Review';
    if (activeTab === 'Week') matchesTab = isTaskDueThisWeek(task);
    
    // 2. Category Filter
    const matchesCategory = selectedCategory === '全部' || task.category === selectedCategory;

    // 3. Search
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesCategory && matchesSearch;
  });
  const detailTask = tasks.find(task => task.id === detailTaskId);

  const handleCreateTask = () => {
    if (!newTaskForm.title) {
      alert(isEn ? 'Please fill in task title' : '请填写任务内容');
      return;
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      studentId: CURRENT_STUDENT_ID,
      title: newTaskForm.title,
      category: newTaskForm.category,
      priority: newTaskForm.priority,
      dueDate: newTaskForm.dueDate || getTodayStr(),
      status: 'Pending',
      description: newTaskForm.description,
      assigner: 'Student', // Default for student created tasks
      visibility: 'student',
      source: 'manual',
      auditHistory: [],
    };

    setTasks([newTask, ...tasks]);
    setIsNewTaskModalOpen(false);
    setToastMessage(isEn ? 'Task created successfully' : '新建任务成功');
    setNewTaskForm({
      title: '',
      category: '规划',
      dueDate: '',
      priority: 'Medium',
      description: ''
    });
  };

  const handleCompleteTask = (id: string) => {
      const target = tasks.find(task => task.id === id);
      if (!target || target.status === 'Completed' || target.status === 'Review') return;
      const nextStatus: TaskStatus = target.assigner === 'Teacher' ? 'Review' : 'Completed';
      if (target.assigner === 'Teacher') {
        const now = new Date().toISOString();
        publishStudentReviewEvent({
          id: `task-submission-${target.id}-${Date.now()}`,
          type: 'student.submitted',
          entityType: 'task',
          entityId: target.id,
          studentId: target.studentId || CURRENT_STUDENT_ID,
          studentName,
          subject: target.title,
          taskCategory: target.category,
          description: target.status === 'Returned' ? '学生修改后重新提交任务。' : '学生已提交老师下发的任务。',
          createdBy: studentName,
          createdAt: now,
          locale: isEn ? 'en-US' : 'zh-CN',
        });
      }
      setTasks(prev => prev.map(t => {
          if (t.id === id && t.status !== 'Completed' && t.status !== 'Review') {
              const audit = createTaskAuditEntry(isEn ? studentName : `${studentName}（学生）`, 'student', [{ field: '状态', before: t.status, after: nextStatus }]);
              return { ...t, status: nextStatus, completedFromStatus: nextStatus === 'Completed' ? t.status : undefined, auditHistory: [...(t.auditHistory || []), audit] };
          }
          return t;
      }));
      setActiveTab('All');
      setToastMessage(target.assigner === 'Teacher'
        ? (isEn ? 'Submitted for teacher review' : target.status === 'Returned' ? '已重新提交，等待老师审核' : '已提交审核，等待老师处理')
        : (isEn ? 'Task completed' : '任务已完成'));
  };

  const handleUndoCompleteTask = (id: string) => {
      setTasks(prev => prev.map(t => {
          if (t.id !== id || t.status !== 'Completed' || t.assigner !== 'Student') return t;
          const restoredStatus = t.completedFromStatus || 'Pending';
          const audit = createTaskAuditEntry(isEn ? 'Alex Chen' : 'Alex Chen（学生）', 'student', [{ field: '状态', before: 'Completed', after: restoredStatus }]);
          return {
            ...t,
            status: restoredStatus,
            completedFromStatus: undefined,
            auditHistory: [...(t.auditHistory || []), audit],
          };
      }));
      setActiveTab('All');
      setToastMessage(isEn ? 'Completion undone' : '已撤销完成，任务恢复到原状态');
  };

  const handleDeleteTask = (id: string) => {
      setTasks(prev => prev.filter(t => t.id !== id || t.assigner !== 'Student'));
  };

  const editingTask = tasks.find(task => task.id === editingTaskId);
  const canStudentEdit = (task: Task) => task.assigner === 'Student' && task.source !== 'system-review';

  const getStudentEditFields = (task: Task): TaskEditField[] => [
    { key: 'title', label: isEn ? 'Task title' : '任务内容', value: task.title },
    { key: 'category', label: isEn ? 'Category' : '任务类型', value: task.category, type: 'select', options: CATEGORIES.map(category => ({ value: category, label: translateCategory(category) })) },
    { key: 'dueDate', label: isEn ? 'Due date' : '截止时间', value: task.dueDate },
    { key: 'priority', label: isEn ? 'Priority' : '优先级', value: task.priority, type: 'select', options: (['High', 'Medium', 'Low'] as TaskPriority[]).map(value => ({ value, label: formatStudentTaskPriority(value, isEn) })) },
    { key: 'description', label: isEn ? 'Description' : '任务说明', value: task.description || '', type: 'textarea' },
  ];

  const saveStudentTaskEdit = (values: Record<string, string>) => {
    if (!editingTask || !canStudentEdit(editingTask)) return;
    const labels: Record<string, string> = { title: '任务内容', category: '任务类型', dueDate: '截止时间', priority: '优先级', description: '任务说明' };
    const changes: TaskFieldChange[] = Object.keys(labels).flatMap(key => {
      const before = String(editingTask[key as keyof Task] || '');
      return before === values[key] ? [] : [{ field: labels[key], before, after: values[key] }];
    });
    if (changes.length === 0) {
      setEditingTaskId(null);
      return;
    }
    const audit = createTaskAuditEntry(isEn ? 'Alex Chen' : 'Alex Chen（学生）', 'student', changes);
    setTasks(previous => previous.map(task => task.id === editingTask.id ? {
      ...task,
      title: values.title,
      category: values.category as TaskCategory,
      dueDate: values.dueDate,
      priority: values.priority as TaskPriority,
      description: values.description,
      auditHistory: [...(task.auditHistory || []), audit],
    } : task));
    setEditingTaskId(null);
    setToastMessage(isEn ? 'Task updated' : '任务已更新，修改记录已保存');
  };

  const getStatusLabel = (status: TaskStatus) => {
    const workflowStatus = status === 'Overdue' ? 'Pending' : status;
    if (isEn) return workflowStatus;
    return ({ Pending: '待处理', Returned: '已退回', Completed: '已完成', Cancelled: '已取消', Review: '待审核' } as Record<Exclude<TaskStatus, 'Overdue'>, string>)[workflowStatus];
  };

  const getTimingStatusLabel = (task: Task) => {
    const timingStatus = getStudentTaskTimingStatus(task);
    if (isEn) return ({ NO_DEADLINE: 'No deadline', INVALID_DATE: 'Invalid date', OVERDUE: 'Overdue', DUE_TODAY: 'Due today', DUE_THIS_WEEK: 'Due this week', UPCOMING: 'Upcoming' } as const)[timingStatus];
    return ({ NO_DEADLINE: '无截止时间', INVALID_DATE: '日期异常', OVERDUE: '已逾期', DUE_TODAY: '今日到期', DUE_THIS_WEEK: '本周到期', UPCOMING: '未到期' } as const)[timingStatus];
  };

  const renderStatusBadges = (task: Task) => {
    const workflowStatus = getStudentTaskWorkflowStatus(task);
    if (workflowStatus === 'Completed' || workflowStatus === 'Cancelled') {
      return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${workflowStatus === 'Completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-100 text-gray-600'}`}>{getStatusLabel(workflowStatus)}</span>;
    }
    const timingStatus = getStudentTaskTimingStatus(task);
    return <div className="flex flex-wrap gap-1.5 whitespace-nowrap">
      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${timingStatus === 'OVERDUE' ? 'border-red-200 bg-red-50 text-red-700' : timingStatus === 'DUE_TODAY' ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>{getTimingStatusLabel(task)}</span>
      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${workflowStatus === 'Review' ? 'border-violet-200 bg-violet-50 text-violet-700' : workflowStatus === 'Returned' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700'}`}>{getStatusLabel(workflowStatus)}</span>
    </div>;
  };

  // Helper: Priority Color
  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'High': return 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20';
      case 'Medium': return 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/20';
      case 'Low': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20';
    }
  };

  // Helper: Status Icon
  const getStatusIcon = (s: TaskStatus) => {
    switch (s) {
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />;
      case 'Overdue': return <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />;
      case 'Review': return <FileText className="w-4 h-4 text-violet-500 dark:text-violet-400" />;
      case 'Returned': return <RotateCcw className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
      default: return <Clock className="w-4 h-4 text-gray-300 dark:text-zinc-600" />;
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row gap-4 lg:gap-6 relative transition-colors duration-300">
       {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

       {/* 1. Sidebar Filters */}
       <div className="w-full lg:w-64 flex-shrink-0 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 p-4 lg:p-5 max-h-72 lg:max-h-none lg:h-full flex flex-col transition-colors">
          <button 
             onClick={() => setIsNewTaskModalOpen(true)}
             className="w-full py-3 bg-[#b0826d] text-white rounded-xl font-bold hover:bg-[#966a57] transition-all flex items-center justify-center gap-2 shadow-sm mb-6"
          >
             <Plus className="w-5 h-5" /> {isEn ? 'New Task' : '新建任务'}
          </button>

          <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar">
             <div>
                <label className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-3 block px-1">{isEn ? 'Task Views' : '任务视图'}</label>
                <div className="space-y-1">
                   {[
                      { id: 'Today', label: isEn ? 'Today' : '今日待办', icon: <ListTodo className="w-4 h-4" />, count: todayPendingTasks.length },
                      { id: 'Week', label: isEn ? 'This Week' : '本周任务', icon: <Calendar className="w-4 h-4" />, count: tasks.filter(task => isTaskDueThisWeek(task)).length },
                      { id: 'Overdue', label: isEn ? 'Overdue' : '已逾期', icon: <AlertTriangle className="w-4 h-4" />, count: tasks.filter(task => isStudentTaskPastDue(task)).length, alert: true },
                      { id: 'Review', label: isEn ? 'In Review' : '待审核', icon: <FileText className="w-4 h-4" />, count: tasks.filter(t => t.status === 'Review').length },
                      { id: 'Completed', label: isEn ? 'Completed' : '已完成', icon: <CheckCheck className="w-4 h-4" />, count: tasks.filter(t => t.status === 'Completed').length },
                      { id: 'All', label: isEn ? 'All Tasks' : '全部任务', icon: <CheckSquare className="w-4 h-4" />, count: tasks.length },
                   ].map((tab) => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                           ${activeTab === tab.id 
                             ? 'bg-[#f5ebe6] text-[#7d5646] dark:bg-white/10 dark:text-white font-bold'
                             : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/5'
                           }`}
                      >
                         <div className="flex items-center gap-3">
                            {tab.icon}
                            {tab.label}
                         </div>
                         <span className={`text-xs px-2 py-0.5 rounded-full border dark:border-transparent ${tab.alert ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'}`}>
                            {tab.count}
                         </span>
                      </button>
                   ))}
                </div>
             </div>

             <div className="border-t border-gray-100 dark:border-white/5 pt-5">
                {/* Changed label from 'Categories' to 'Task Types' per request */}
                <label className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-3 block px-1">{isEn ? 'Business Types' : '业务类型'}</label>
                <div className="space-y-1">
                   <button 
                     onClick={() => setSelectedCategory('全部')}
                     className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors font-medium flex items-center gap-2 ${selectedCategory === '全部' ? 'bg-gray-100 dark:bg-white/10 font-bold text-gray-800 dark:text-white' : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                   >
                     <LayoutGrid className="w-4 h-4 opacity-50" />
                     {isEn ? 'All Types' : '全部类型'}
                   </button>
                   {CATEGORIES.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                           ${selectedCategory === cat 
                             ? 'bg-gray-100 dark:bg-white/10 font-bold text-gray-800 dark:text-white' 
                             : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/5'
                           }`}
                      >
                         <span className={`w-2 h-2 rounded-full ${selectedCategory === cat ? 'bg-[#b0826d]' : 'bg-gray-300 dark:bg-zinc-600'}`}></span>
                         {translateCategory(cat)}
                      </button>
                   ))}
                </div>
             </div>
          </div>
       </div>

       {/* 2. Main Content */}
       <div className="flex-1 min-w-0 min-h-0 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 flex flex-col overflow-hidden relative transition-colors">
          
          {/* Header */}
          <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-[#e5e0dc] dark:border-white/5 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center bg-[#fbf7f5] dark:bg-white/5">
             <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                   {activeTab === 'Today' && (isEn ? 'Today' : '今日待办')}
                   {activeTab === 'Week' && (isEn ? 'This Week' : '本周任务')}
                   {activeTab === 'Overdue' && (isEn ? 'Overdue' : '已逾期')}
                   {activeTab === 'Completed' && (isEn ? 'Completed' : '已完成')}
                   {activeTab === 'Review' && (isEn ? 'In Review' : '待审核')}
                   {activeTab === 'All' && (isEn ? 'All Tasks' : '全部任务')}
                   <span className="text-sm font-normal text-gray-500 dark:text-zinc-500 ml-2 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10">
                      {filteredTasks.length} {isEn ? 'Tasks' : '个任务'}
                   </span>
                </h2>
             </div>
             
             <div className="flex items-center gap-3">
                <div className="relative">
                   <Search className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                   <input 
                      type="text" 
                      placeholder={isEn ? "Search tasks..." : "搜索任务..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-[#b0826d] focus:ring-2 focus:ring-[#b0826d]/20 transition-all w-full sm:w-64 text-gray-900 dark:text-white"
                   />
                </div>
             </div>
          </div>

          {sourceContextTaskId && (
            <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 lg:mx-6">
              <p className="font-bold">{isEn ? 'Source task unavailable' : '来源任务已失效'}</p>
              <p className="mt-1 text-xs">{isEn ? 'The task requested from the dashboard is no longer available.' : '首页请求打开的任务已失效或不存在。'}</p>
            </div>
          )}

          {/* Task List Table */}
          <div className="flex-1 overflow-auto custom-scrollbar">
             <table className="w-full min-w-[900px] text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-zinc-900/50 sticky top-0 z-10 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">
                   <tr>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5">{isEn ? 'Task' : '任务内容'}</th>
                      {/* Added Assigner Column */}
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5 text-center w-36">{isEn ? 'Assigner' : '任务下发方'}</th>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5 text-center">{isEn ? 'Category' : '分类'}</th>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5">{isEn ? 'Due Date' : '截止时间'}</th>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5">{isEn ? 'Priority' : '优先级'}</th>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5">{isEn ? 'Status' : '状态'}</th>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5 text-right">{isEn ? 'Actions' : '操作'}</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                   {filteredTasks.map(task => (
                      <tr
                        id={`student-task-${task.id}`}
                        key={task.id}
                        onClick={() => { setFocusedTaskId(task.id); setDetailTaskId(task.id); }}
                        className={`group cursor-pointer transition-all ${focusedTaskId === task.id ? 'bg-amber-50 ring-2 ring-inset ring-amber-300 dark:bg-amber-500/10 dark:ring-amber-500/40' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                      >
                         <td className="px-6 py-4">
                            <div className="flex items-start gap-3">
                               <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                               <div>
                                  <p className={`text-sm font-medium ${task.status === 'Completed' ? 'text-gray-400 dark:text-zinc-600 line-through' : 'text-gray-900 dark:text-zinc-200'}`}>
                                     {task.title}
                                  </p>
                                  {task.description && (
                                     <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5 line-clamp-1">{task.description}</p>
                                  )}
                               </div>
                            </div>
                         </td>
                         {/* Assigner Cell - Updated to Avatar + Nickname Style */}
                         <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                               {task.assigner === 'Teacher' ? (
                                  <>
                                     <img 
                                       src="https://api.dicebear.com/7.x/micah/svg?seed=Sarah&backgroundColor=ffdfbf" 
                                       alt="Sarah"
                                       className="w-6 h-6 rounded-full border border-gray-200 dark:border-zinc-700"
                                     />
                                     <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Ms. Sarah</span>
                                  </>
                               ) : (
                                  <>
                                     <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold border border-violet-200 dark:border-violet-500/20">
                                        A
                                     </div>
                                     <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{isEn ? 'Me' : '我'}</span>
                                  </>
                               )}
                            </div>
                         </td>
                         <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center">
                                <span className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-lg text-xs font-bold border border-gray-200 dark:border-white/10 whitespace-nowrap">
                                {translateCategory(task.category)}
                                </span>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <div className={`flex items-center gap-1.5 text-sm ${getStudentTaskTimingStatus(task) === 'OVERDUE' ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-zinc-400'}`}>
                               {formatStudentTaskDueDate(task.dueDate, isEn)}
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                               {formatStudentTaskPriority(task.priority, isEn)}
                            </span>
                         </td>
                         <td className="px-6 py-4">{renderStatusBadges(task)}</td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                                {canStudentEdit(task) && (
                                  <button aria-label={isEn ? 'Edit task' : '编辑任务'} title={isEn ? 'Edit task' : '编辑任务'} onClick={(event) => { event.stopPropagation(); setEditingTaskId(task.id); }} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded transition-colors">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                                {!isStudentTaskTerminal(task) && task.status !== 'Review' && (
                                  <button aria-label={task.assigner === 'Teacher' ? (isEn ? (task.status === 'Returned' ? 'Resubmit' : 'Submit for review') : (task.status === 'Returned' ? '重新提交' : '提交审核')) : (isEn ? 'Complete task' : '完成任务')} title={task.assigner === 'Teacher' ? (isEn ? (task.status === 'Returned' ? 'Resubmit' : 'Submit for review') : (task.status === 'Returned' ? '重新提交' : '提交审核')) : (isEn ? 'Complete task' : '完成任务')} onClick={(event) => { event.stopPropagation(); handleCompleteTask(task.id); }} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded transition-colors">
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                                {task.status === 'Completed' && task.assigner === 'Student' && (
                                  <button aria-label={isEn ? 'Undo completion' : '撤销完成'} title={isEn ? 'Undo completion' : '撤销完成'} onClick={(event) => { event.stopPropagation(); handleUndoCompleteTask(task.id); }} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded transition-colors">
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                )}
                                {task.assigner === 'Student' && (
                                  <button aria-label={isEn ? 'Delete task' : '删除任务'} title={isEn ? 'Delete task' : '删除任务'} onClick={(event) => { event.stopPropagation(); handleDeleteTask(task.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors">
                                    <Trash2 className="w-4 h-4"/>
                                  </button>
                                )}
                            </div>
                         </td>
                      </tr>
                   ))}
                   
                   {filteredTasks.length === 0 && (
                      <tr>
                         <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-zinc-600">
                            <div className="flex justify-center mb-3">
                               <CheckSquare className="w-10 h-10 text-gray-200 dark:text-zinc-700" />
                            </div>
                            <p>{isEn ? 'No tasks found' : '暂无相关任务'}</p>
                         </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>

       </div>

       {detailTask && (
         <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setDetailTaskId(null)}>
           <div role="dialog" aria-modal="true" aria-labelledby="student-task-detail-title" className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900" onClick={event => event.stopPropagation()}>
             <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 dark:border-white/5">
               <div>
                 <div className="mb-2 flex items-center gap-2"><span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">{isEn ? 'Source: dashboard task list' : '来源：首页待办'}</span></div>
                 <h3 id="student-task-detail-title" className="text-lg font-bold text-gray-900 dark:text-white">{isEn ? 'Task details' : '任务详情'}</h3>
               </div>
               <button onClick={() => setDetailTaskId(null)} aria-label={isEn ? 'Close task details' : '关闭任务详情'} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><XCircle className="h-5 w-5" /></button>
             </div>
             <div className="space-y-5 px-6 py-5">
               <div><p className="text-xs font-bold uppercase tracking-wide text-gray-400">{isEn ? 'Title' : '任务标题'}</p><p className="mt-1 font-bold text-gray-900 dark:text-zinc-100">{detailTask.title}</p>{detailTask.description && <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">{detailTask.description}</p>}</div>
               <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                 <div><p className="text-xs text-gray-400">{isEn ? 'Student' : '学生'}</p><p className="mt-1 font-medium text-gray-800 dark:text-zinc-200">{studentName}</p></div>
                 <div><p className="text-xs text-gray-400">{isEn ? 'Timing status' : '时效状态'}</p><p className="mt-1 font-medium text-gray-800 dark:text-zinc-200">{getTimingStatusLabel(detailTask)}</p></div>
                 <div><p className="text-xs text-gray-400">{isEn ? 'Workflow status' : '流程状态'}</p><p className="mt-1 font-medium text-gray-800 dark:text-zinc-200">{getStatusLabel(detailTask.status)}</p></div>
                 <div><p className="text-xs text-gray-400">{isEn ? 'Category' : '分类'}</p><p className="mt-1 font-medium text-gray-800 dark:text-zinc-200">{translateCategory(detailTask.category)}</p></div>
                 <div><p className="text-xs text-gray-400">{isEn ? 'Deadline' : '截止时间'}</p><p className="mt-1 font-medium text-gray-800 dark:text-zinc-200">{formatStudentTaskDueDate(detailTask.dueDate, isEn)}</p></div>
                 <div><p className="text-xs text-gray-400">{isEn ? 'Priority' : '优先级'}</p><p className="mt-1 font-medium text-gray-800 dark:text-zinc-200">{formatStudentTaskPriority(detailTask.priority, isEn)}</p></div>
                 <div><p className="text-xs text-gray-400">{isEn ? 'Assigner' : '任务下发方'}</p><p className="mt-1 font-medium text-gray-800 dark:text-zinc-200">{detailTask.assigner === 'Teacher' ? (isEn ? 'Teacher' : '老师') : (isEn ? 'Self' : '学生自建')}</p></div>
               </div>
             </div>
           </div>
         </div>
       )}

       {editingTask && canStudentEdit(editingTask) && (
         <TaskEditDialog
           key={editingTask.id}
           title={editingTask.title}
           fields={getStudentEditFields(editingTask)}
           auditHistory={editingTask.auditHistory || []}
           restrictionNote={isEn ? 'Students can edit only tasks they created. Teacher-assigned and system review tasks are read-only.' : '学生仅可编辑自己创建的任务；老师下发和系统审核任务不可编辑。'}
           isEn={isEn}
           onClose={() => setEditingTaskId(null)}
           onSave={saveStudentTaskEdit}
         />
       )}

       {/* --- NEW TASK MODAL --- */}
       {isNewTaskModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-[calc(100vw-2rem)] max-w-[450px] max-h-[calc(100vh-2rem)] overflow-y-auto animate-in zoom-in-95 duration-200 border dark:border-white/10" onClick={e => e.stopPropagation()}>
               <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                     <Plus className="w-5 h-5 text-violet-600" /> {isEn ? 'New Task' : '新建任务'}
                  </h3>
                  <button onClick={() => setIsNewTaskModalOpen(false)} className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
                     <XCircle className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="p-6 space-y-5">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-1.5 tracking-wider">{isEn ? 'Task Title' : '任务内容'}</label>
                     <input 
                        className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-zinc-600 text-gray-900 dark:text-white"
                        value={newTaskForm.title}
                        onChange={(e) => setNewTaskForm({...newTaskForm, title: e.target.value})}
                        placeholder={isEn ? "Task Title..." : "输入任务标题 (例如：SAT 报名)"}
                        autoFocus
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        {/* Changed Label */}
                        <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-1.5 tracking-wider">{isEn ? 'Task Type' : '任务类型'}</label>
                        <select 
                           className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-violet-500 outline-none transition-all text-gray-900 dark:text-white"
                           value={newTaskForm.category}
                           onChange={(e) => setNewTaskForm({...newTaskForm, category: e.target.value as TaskCategory})}
                        >
                           {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{translateCategory(cat)}</option>
                           ))}
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-1.5 tracking-wider">{isEn ? 'Priority' : '优先级'}</label>
                        <select 
                           className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-violet-500 outline-none transition-all text-gray-900 dark:text-white"
                           value={newTaskForm.priority}
                           onChange={(e) => setNewTaskForm({...newTaskForm, priority: e.target.value as TaskPriority})}
                        >
                           <option value="High">🔥 {formatStudentTaskPriority('High', isEn)}</option>
                           <option value="Medium">⚡️ {formatStudentTaskPriority('Medium', isEn)}</option>
                           <option value="Low">🌱 {formatStudentTaskPriority('Low', isEn)}</option>
                        </select>
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-1.5 tracking-wider">{isEn ? 'Due Date' : '截止时间'}</label>
                     <div className="relative">
                        <input 
                           type="date"
                           className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30 outline-none transition-all pr-24 text-gray-900 dark:text-white"
                           value={newTaskForm.dueDate}
                           onChange={(e) => setNewTaskForm({...newTaskForm, dueDate: e.target.value})}
                        />
                        <div className="absolute right-9 top-1/2 -translate-y-1/2 flex gap-1">
                           <button 
                             type="button"
                             onClick={() => setNewTaskForm({...newTaskForm, dueDate: getTodayStr()})} 
                             className="text-[10px] bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 px-2 py-1 rounded text-gray-600 dark:text-zinc-300 transition-colors"
                           >
                             {isEn ? 'Today' : '今天'}
                           </button>
                           <button 
                             type="button"
                             onClick={() => setNewTaskForm({...newTaskForm, dueDate: getTomorrowStr()})} 
                             className="text-[10px] bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 px-2 py-1 rounded text-gray-600 dark:text-zinc-300 transition-colors"
                           >
                             {isEn ? 'Tomorrow' : '明天'}
                           </button>
                        </div>
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-1.5 tracking-wider">{isEn ? 'Description (Optional)' : '详细说明 (可选)'}</label>
                     <textarea 
                        className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30 outline-none transition-all h-24 resize-none placeholder:text-gray-300 dark:placeholder:text-zinc-600 text-gray-900 dark:text-white"
                        value={newTaskForm.description}
                        onChange={(e) => setNewTaskForm({...newTaskForm, description: e.target.value})}
                        placeholder={isEn ? "Details..." : "在此输入更多关于任务的细节..."}
                     />
                  </div>
               </div>

               <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
                  <button 
                    onClick={() => setIsNewTaskModalOpen(false)} 
                    className="px-4 py-2.5 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 font-bold hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {isEn ? 'Cancel' : '取消'}
                  </button>
                  <button 
                    onClick={handleCreateTask} 
                    className="px-6 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-lg hover:bg-violet-700 shadow-md transition-all active:scale-95"
                  >
                    {isEn ? 'Create' : '确认创建'}
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default StudentTaskCenter;
