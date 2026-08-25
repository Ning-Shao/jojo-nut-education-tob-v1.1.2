
import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckSquare, Search, Filter, Plus, Calendar, 
  Clock, AlertTriangle, User, MoreHorizontal, 
  CheckCircle, XCircle, ArrowRight, ListTodo,
  CheckCheck, RotateCcw, Flag, FileText, Check, Save,
  Trash2, X, Bell, Edit, LayoutGrid
} from '../common/Icons';
import TaskEditDialog, { TaskEditField } from '../common/TaskEditDialog';
import { createTaskAuditEntry, TaskFieldChange } from '../common/taskAudit';
import { mockStudents } from './StudentList';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  formatTeacherTaskDueDate,
  formatTeacherTaskDescription,
  formatTeacherTaskPriority,
  formatTeacherTaskTitle,
  getTeacherTaskTimingStatus,
  getTeacherTaskEffectiveStatus,
  isTeacherOverdueTodo,
  isTeacherReviewTodo,
  isTeacherTaskDueThisWeek,
  isTeacherTaskTerminal,
  isTeacherTodayTodo,
  resolveTeacherReviewDeadline,
  TeacherTask as Task,
  TeacherTaskCategory as TaskCategory,
  TeacherTaskPriority as TaskPriority,
  TeacherTaskStatus as TaskStatus,
} from './teacherTasks';

const CATEGORIES: TaskCategory[] = ['建档', '规划', '考试', '活动', '材料', '面试', '申请', 'Offer', '复盘'];

// Toast Component
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-lg shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
    <CheckCircle className="w-4 h-4 text-green-400 dark:text-green-600" />
    <span className="text-sm font-medium">{message}</span>
    <button onClick={onClose} className="text-gray-400 dark:text-zinc-500 hover:text-white dark:hover:text-zinc-900"><X className="w-3 h-3" /></button>
  </div>
);

interface TaskCenterProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  initialTaskId?: string;
}

const TaskCenter: React.FC<TaskCenterProps> = ({ tasks, setTasks, initialTaskId }) => {
  // State
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Today' | 'Week' | 'Overdue' | 'Review' | 'All'>('Today');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [sourceContextTaskId, setSourceContextTaskId] = useState<string | null>(null);
  const handledInitialTaskId = useRef<string | undefined>();
  
  // Delete Modal State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    taskIds: string[];
  }>({ isOpen: false, taskIds: [] });

  const { language } = useLanguage();
  const isEn = language === 'en-US';

  // New Task Form State
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    studentId: '',
    category: '建档' as TaskCategory,
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
    const target = tasks.find(task => task.id === initialTaskId);
    if (!target) {
      setFocusedTaskId(null);
      setDetailTaskId(null);
      setSourceContextTaskId(initialTaskId);
      setToastMessage(isEn ? `The source task (${initialTaskId}) is no longer available.` : `来源任务（${initialTaskId}）已失效或不存在，已保留来源上下文。`);
      return;
    }
    setSourceContextTaskId(null);
    setFocusedTaskId(target.id);
    setDetailTaskId(target.id);
    window.setTimeout(() => {
      document.getElementById(`teacher-task-${target.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 0);
  }, [initialTaskId, isEn, tasks]);

  // Helper: Date format getters
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  // “今日待办”是待处理视图：今天截止且尚未完成。
  // 列表与左侧计数共用此条件，避免完成后仍显示在今日待办中。
  const isTodayTodo = isTeacherTodayTodo;

  // Helper: Translate Category
  const translateCategory = (cat: string) => {
      if (!isEn) return cat;
      const map: Record<string, string> = {
          '建档': 'Onboarding',
          '规划': 'Planning',
          '考试': 'Testing',
          '活动': 'Activity',
          '材料': 'Materials',
          '面试': 'Interview',
          '申请': 'Application',
          'Offer': 'Offer',
          '复盘': 'Review',
          '全部': 'All'
      };
      return map[cat] || cat;
  };

  const getStatusLabel = (status: TaskStatus) => {
    const workflowStatus = status === 'Overdue' ? 'Pending' : status;
    if (isEn) return workflowStatus;
    return ({ Pending: '待处理', Review: '待审核', Completed: '已完成', Cancelled: '已取消' } as Record<Exclude<TaskStatus, 'Overdue'>, string>)[workflowStatus];
  };

  const getTimingStatusLabel = (task: Task) => {
    const timingStatus = getTeacherTaskTimingStatus(task);
    if (isEn) return ({ NO_DEADLINE: 'No deadline', OVERDUE: 'Overdue', DUE_TODAY: 'Due today', DUE_THIS_WEEK: 'Due this week', UPCOMING: 'Upcoming' } as const)[timingStatus];
    return ({ NO_DEADLINE: '无截止时间', OVERDUE: '已逾期', DUE_TODAY: '今日到期', DUE_THIS_WEEK: '本周到期', UPCOMING: '未到期' } as const)[timingStatus];
  };

  const renderStatusBadges = (task: Task) => {
    const workflowStatus = getTeacherTaskEffectiveStatus(task);
    if (workflowStatus === 'Completed' || workflowStatus === 'Cancelled') {
      return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${workflowStatus === 'Completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-100 text-gray-600'}`}>{getStatusLabel(workflowStatus)}</span>;
    }
    const timingStatus = getTeacherTaskTimingStatus(task);
    return <div className="flex flex-wrap gap-1.5 whitespace-nowrap">
      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${timingStatus === 'OVERDUE' ? 'border-red-200 bg-red-50 text-red-700' : timingStatus === 'DUE_TODAY' ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>{getTimingStatusLabel(task)}</span>
      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${workflowStatus === 'Review' ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-gray-200 bg-white text-gray-700'}`}>{getStatusLabel(workflowStatus)}</span>
    </div>;
  };

  // Filtering Logic
  const filteredTasks = tasks.filter(task => {
    // 1. Tab Filter
    let matchesTab = true;

    if (activeTab === 'Today') {
        matchesTab = isTodayTodo(task);
    }
    if (activeTab === 'Overdue') matchesTab = isTeacherOverdueTodo(task);
    if (activeTab === 'Review') matchesTab = isTeacherReviewTodo(task);
    if (activeTab === 'Week') matchesTab = isTeacherTaskDueThisWeek(task);
    
    // 2. Category Filter
    const matchesCategory = selectedCategory === '全部' || task.category === selectedCategory;

    // 3. Search
    const matchesSearch = formatTeacherTaskTitle(task, isEn).toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.studentName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesCategory && matchesSearch;
  });

  const handleCreateTask = () => {
    if (!newTaskForm.title || !newTaskForm.studentId) {
      alert(isEn ? 'Please fill in task title and student' : '请填写任务内容和关联学生');
      return;
    }

    const student = mockStudents.find(s => s.id === newTaskForm.studentId);
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskForm.title,
      studentName: student ? student.name : 'Unknown',
      studentAvatar: student ? student.avatarUrl : '',
      category: newTaskForm.category,
      priority: newTaskForm.priority,
      dueDate: newTaskForm.dueDate || getTodayStr(),
      status: 'Pending',
      assignee: 'Sarah',
      description: newTaskForm.description,
      source: 'manual',
      auditHistory: [],
    };

    setTasks([newTask, ...tasks]);
    setIsNewTaskModalOpen(false);
    setToastMessage(isEn ? 'Task created successfully' : '新建任务成功');
    setNewTaskForm({
      title: '',
      studentId: '',
      category: '建档',
      dueDate: '',
      priority: 'Medium',
      description: ''
    });
  };

  // Trigger Delete Modal
  const handleDeleteTask = (id: string) => {
    setDeleteConfirmation({ isOpen: true, taskIds: [id] });
  };

  // Actual Delete Logic
  const confirmDelete = () => {
    const idsToDelete = new Set(deleteConfirmation.taskIds);
    setTasks(prev => prev.filter(t => !idsToDelete.has(t.id)));
    
    setDeleteConfirmation({ isOpen: false, taskIds: [] });
    setToastMessage(isEn ? 'Task deleted' : '任务已删除');
  };

  // Core Complete Handler (Single)
  const handleCompleteTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? {
      ...t,
      status: 'Completed',
      completedFromStatus: t.status,
      auditHistory: [...(t.auditHistory || []), createTaskAuditEntry(isEn ? 'Sarah (Teacher)' : 'Sarah（教师）', 'teacher', [{ field: '状态', before: getTeacherTaskEffectiveStatus(t), after: 'Completed' }])],
    } : t));
    setActiveTab('All');
    setToastMessage(isEn ? 'Task Completed' : '任务已完成');
  }

  const handleUndoCompleteTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id || t.status !== 'Completed') return t;
      const restoredStatus = t.completedFromStatus || 'Pending';
      const restoredEffectiveStatus = getTeacherTaskEffectiveStatus({ ...t, status: restoredStatus });
      return {
        ...t,
        status: restoredStatus,
        completedFromStatus: undefined,
        auditHistory: [...(t.auditHistory || []), createTaskAuditEntry(isEn ? 'Sarah (Teacher)' : 'Sarah（教师）', 'teacher', [{ field: '状态', before: 'Completed', after: restoredEffectiveStatus }])],
      };
    }));
    setActiveTab('All');
    setToastMessage(isEn ? 'Completion undone; original status restored' : '已撤销完成，任务恢复到原状态');
  };

  const editingTask = tasks.find(task => task.id === editingTaskId);
  const detailTask = tasks.find(task => task.id === detailTaskId);

  const getTeacherEditFields = (task: Task): TaskEditField[] => {
    const isSystemReview = task.source === 'system-review';
    const fields: TaskEditField[] = [
      { key: 'title', label: isEn ? 'Task title' : '任务内容', value: formatTeacherTaskTitle(task, isEn), disabled: isSystemReview },
      { key: 'studentName', label: isEn ? 'Student' : '关联学生', value: task.studentName, type: 'select', disabled: isSystemReview, options: mockStudents.map(student => ({ value: student.name, label: student.name })) },
      { key: 'category', label: isEn ? 'Category' : '业务类型', value: task.category, type: 'select', disabled: isSystemReview, options: CATEGORIES.map(category => ({ value: category, label: translateCategory(category) })) },
      { key: 'dueDate', label: isEn ? 'Due date' : '截止时间', value: task.dueDate },
      { key: 'priority', label: isEn ? 'Priority' : '优先级', value: task.priority, type: 'select', options: (['High', 'Medium', 'Low'] as TaskPriority[]).map(value => ({ value, label: formatTeacherTaskPriority(value, isEn) })) },
      { key: 'assignee', label: isEn ? 'Assignee' : '负责人', value: task.assignee },
      { key: 'description', label: isEn ? 'Description' : '任务说明', value: formatTeacherTaskDescription(task, isEn) || '', type: 'textarea', disabled: isSystemReview },
    ];
    if (isSystemReview) {
      fields.push(
        { key: 'sourceEventId', label: isEn ? 'Source event ID' : '来源事件 ID', value: task.sourceEventId || '', disabled: true },
        { key: 'createdBy', label: isEn ? 'Created by' : '事件发起人', value: task.createdBy || '', disabled: true },
        { key: 'createdAt', label: isEn ? 'Created at' : '事件发生时间', value: task.createdAt || '', disabled: true },
      );
    }
    return fields;
  };

  const saveTeacherTaskEdit = (values: Record<string, string>) => {
    if (!editingTask) return;
    const isSystemReview = editingTask.source === 'system-review';
    const allowedKeys = isSystemReview
      ? ['dueDate', 'priority', 'assignee']
      : ['title', 'studentName', 'category', 'dueDate', 'priority', 'assignee', 'description'];
    const labels: Record<string, string> = { title: '任务内容', studentName: '关联学生', category: '业务类型', dueDate: '截止时间', priority: '优先级', assignee: '负责人', description: '任务说明' };
    const changes: TaskFieldChange[] = allowedKeys.flatMap(key => {
      const before = String(editingTask[key as keyof Task] || '');
      return before === values[key] ? [] : [{ field: labels[key], before, after: values[key] }];
    });
    if (changes.length === 0) {
      setEditingTaskId(null);
      return;
    }
    const selectedStudent = mockStudents.find(student => student.name === values.studentName);
    const audit = createTaskAuditEntry(isEn ? 'Sarah (Teacher)' : 'Sarah（教师）', 'teacher', changes);
    setTasks(previous => previous.map(task => task.id === editingTask.id ? {
      ...task,
      title: isSystemReview ? task.title : values.title,
      studentName: isSystemReview ? task.studentName : values.studentName,
      studentAvatar: isSystemReview ? task.studentAvatar : (selectedStudent?.avatarUrl || task.studentAvatar),
      category: isSystemReview ? task.category : values.category as TaskCategory,
      dueDate: values.dueDate,
      reviewDeadlineAt: isSystemReview ? resolveTeacherReviewDeadline(values.dueDate) : task.reviewDeadlineAt,
      priority: values.priority as TaskPriority,
      assignee: values.assignee,
      description: isSystemReview ? task.description : values.description,
      auditHistory: [...(task.auditHistory || []), audit],
    } : task));
    setEditingTaskId(null);
    setToastMessage(isEn ? 'Task updated' : '任务已更新，修改记录已保存');
  };

  // Helper: Priority Color
  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'High': return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      case 'Medium': return 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20';
      case 'Low': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
    }
  };

  return (
    <div className="flex h-full gap-6 relative transition-colors duration-300">
       {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

       {/* Delete Confirmation Modal */}
       {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDeleteConfirmation({ isOpen: false, taskIds: [] })}>
             <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-[400px] p-6 animate-in zoom-in-95 duration-200 border dark:border-white/10" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                   <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                      <AlertTriangle className="w-6 h-6" />
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {isEn ? 'Confirm Delete' : '确认删除'}
                   </h3>
                   <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 leading-relaxed">
                      {isEn 
                        ? `Are you sure you want to delete ${deleteConfirmation.taskIds.length} task(s)? This action cannot be undone.` 
                        : `您确定要删除这 ${deleteConfirmation.taskIds.length} 个任务吗？此操作无法撤销。`}
                   </p>
                   <div className="flex gap-3 w-full">
                      <button 
                         onClick={() => setDeleteConfirmation({ isOpen: false, taskIds: [] })}
                         className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm"
                      >
                         {isEn ? 'Cancel' : '取消'}
                      </button>
                      <button 
                         onClick={confirmDelete}
                         className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-md transition-colors text-sm"
                      >
                         {isEn ? 'Delete' : '确认删除'}
                      </button>
                   </div>
                </div>
             </div>
          </div>
       )}

       {/* 1. Sidebar Filters */}
       <div className="w-64 flex-shrink-0 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 p-5 h-full flex flex-col transition-colors">
          <button 
             onClick={() => setIsNewTaskModalOpen(true)}
             className="w-full py-3 bg-[#b0826d] text-white rounded-xl font-bold hover:bg-[#966a57] transition-all flex items-center justify-center gap-2 shadow-sm mb-6"
          >
             <Plus className="w-5 h-5" /> {isEn ? 'New Task' : '新建任务'}
          </button>

          <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar">
             {/* Task Views */}
             <div>
                <label className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-3 block px-1">{isEn ? 'Task Views' : '任务视图'}</label>
                <div className="space-y-1">
                   {[
                      { id: 'Today', label: isEn ? 'Today' : '今日待办', icon: <ListTodo className="w-4 h-4" />, count: tasks.filter(task => isTodayTodo(task)).length },
                      { id: 'Week', label: isEn ? 'This Week' : '本周任务', icon: <Calendar className="w-4 h-4" />, count: tasks.filter(task => isTeacherTaskDueThisWeek(task)).length },
                      { id: 'Overdue', label: isEn ? 'Overdue' : '已逾期', icon: <AlertTriangle className="w-4 h-4" />, count: tasks.filter(task => isTeacherOverdueTodo(task)).length, alert: true },
                      { id: 'Review', label: isEn ? 'Pending Approval' : '待审批', icon: <CheckCheck className="w-4 h-4" />, count: tasks.filter(task => isTeacherReviewTodo(task)).length, info: true },
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
                         <span className={`text-xs px-2 py-0.5 rounded-full font-bold border dark:border-transparent ${tab.alert ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : tab.info ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400' : 'bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'}`}>
                            {tab.count}
                         </span>
                      </button>
                   ))}
                </div>
             </div>

             {/* Business Types (Categories) */}
             <div className="border-t border-gray-100 dark:border-white/5 pt-5">
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
       <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 flex flex-col overflow-hidden relative transition-colors">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#e5e0dc] dark:border-white/5 flex justify-between items-center bg-[#fbf7f5] dark:bg-white/5">
             <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                   {activeTab === 'Today' && (isEn ? 'Today\'s To-Do' : '今日待办')}
                   {activeTab === 'Week' && (isEn ? 'This Week' : '本周任务')}
                   {activeTab === 'Overdue' && (isEn ? 'Overdue' : '已逾期')}
                   {activeTab === 'Review' && (isEn ? 'Pending Approval' : '待审批')}
                   {activeTab === 'All' && (isEn ? 'All Tasks' : '全部任务')}
                </h2>
                <span className="text-sm font-medium text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 px-3 py-1 rounded border border-gray-200 dark:border-white/10 shadow-sm">
                   {filteredTasks.length} {isEn ? 'Tasks' : '个任务'}
                </span>
             </div>
             
             <div className="flex items-center gap-3">
                <div className="relative">
                   <Search className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                   <input 
                      type="text" 
                      placeholder={isEn ? "Search tasks..." : "搜索任务..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-[#b0826d] dark:focus:border-primary-700 focus:ring-2 focus:ring-[#b0826d]/20 dark:focus:ring-primary-900/30 transition-all w-64 text-gray-900 dark:text-white"
                   />
                </div>
                <button className="p-2 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 dark:text-zinc-400 transition-colors bg-white dark:bg-zinc-800">
                   <Filter className="w-4 h-4" />
                </button>
                <button className="p-2 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 dark:text-zinc-400 transition-colors bg-white dark:bg-zinc-800">
                   <MoreHorizontal className="w-4 h-4" />
                </button>
             </div>
          </div>

          {sourceContextTaskId && (
            <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <p className="font-bold">{isEn ? 'Source task unavailable' : '来源任务已失效'}</p>
              <p className="mt-1 text-xs">{isEn ? `The dashboard requested task ${sourceContextTaskId}, but it is no longer in the task dataset. The source ID is retained for troubleshooting.` : `首页请求打开任务 ${sourceContextTaskId}，但该任务已不在任务数据中。来源任务 ID 已保留，便于继续追查。`}</p>
            </div>
          )}

          {/* Task List Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
             <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-zinc-900/50 sticky top-0 z-10 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">
                   <tr>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5 w-1/3">{isEn ? 'Task Content' : '任务内容'}</th>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5">{isEn ? 'Student' : '关联学生'}</th>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5 text-center">{isEn ? 'Category' : '分类'}</th>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5">{isEn ? 'Deadline' : '截止时间'}</th>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5">{isEn ? 'Priority' : '优先级'}</th>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5">{isEn ? 'Status' : '状态'}</th>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5 text-right">{isEn ? 'Operation' : '操作'}</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                   {filteredTasks.map(task => {
                      const displayTitle = formatTeacherTaskTitle(task, isEn);
                      const displayDescription = formatTeacherTaskDescription(task, isEn);
                      return (
                      <tr
                        id={`teacher-task-${task.id}`}
                        key={task.id}
                        onClick={() => { setFocusedTaskId(task.id); setDetailTaskId(task.id); }}
                        className={`group cursor-pointer transition-all ${focusedTaskId === task.id ? 'bg-amber-50 ring-2 ring-inset ring-amber-300 dark:bg-amber-500/10 dark:ring-amber-500/40' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                      >
                         <td className="px-6 py-4">
                            <div className="flex items-start gap-3">
                               <div className="mt-0.5">
                                  {getTeacherTaskEffectiveStatus(task) === 'Review' ? (
                                     <FileText className="w-4 h-4 text-orange-500" />
                                  ) : getTeacherTaskEffectiveStatus(task) === 'Completed' ? (
                                     <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : getTeacherTaskTimingStatus(task) === 'OVERDUE' ? (
                                     <AlertTriangle className="w-4 h-4 text-red-500" />
                                  ) : (
                                     <Clock className="w-4 h-4 text-gray-400" />
                                  )}
                               </div>
                               <div>
                                  <p className={`text-sm font-bold ${getTeacherTaskEffectiveStatus(task) === 'Completed' ? 'text-gray-400 dark:text-zinc-600 line-through' : 'text-gray-900 dark:text-zinc-200'}`}>
                                     {displayTitle}
                                  </p>
                                  {displayDescription && (
                                     <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1 line-clamp-1">{displayDescription}</p>
                                  )}
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                               {task.studentAvatar ? (
                                  <img src={task.studentAvatar} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-white/10" alt="avatar" />
                               ) : (
                                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] text-gray-500 dark:text-zinc-400 font-bold">S</div>
                               )}
                               <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-800 dark:text-zinc-300">{task.studentName}</span>
                               </div>
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
                            <div className={`flex items-center gap-1.5 text-sm font-medium ${getTeacherTaskTimingStatus(task) === 'OVERDUE' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-zinc-400'}`}>
                               {formatTeacherTaskDueDate(task.dueDate, isEn)}
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                               task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 
                               task.priority === 'Medium' ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' :
                               'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                            }`}>
                               {formatTeacherTaskPriority(task.priority, isEn)}
                            </span>
                         </td>
                         <td className="px-6 py-4">{renderStatusBadges(task)}</td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                               <button
                                 onClick={(e) => { e.stopPropagation(); setEditingTaskId(task.id); }}
                                 className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-full text-[#9b6f5c] hover:bg-[#f5ebe6] dark:hover:bg-primary-500/10 transition-colors shadow-sm"
                                 title={isEn ? 'Edit task' : '编辑任务'}
                                 aria-label={isEn ? `Edit ${displayTitle}` : `编辑任务：${displayTitle}`}
                               >
                                 <Edit className="w-4 h-4" />
                               </button>
                               {!isTeacherTaskTerminal(task) ? (
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); handleCompleteTask(task.id); }}
                                     className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-full text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors shadow-sm group/btn"
                                     title={isEn ? "Complete" : "完成"}
                                   >
                                      <Check className="w-4 h-4 transform group-hover/btn:scale-110 transition-transform" />
                                   </button>
                               ) : getTeacherTaskEffectiveStatus(task) === 'Completed' ? (
                                   <button
                                     onClick={(e) => { e.stopPropagation(); handleUndoCompleteTask(task.id); }}
                                     className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-full text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors shadow-sm group/btn"
                                     title={isEn ? "Undo completion" : "撤销完成"}
                                     aria-label={isEn ? `Undo completion for ${displayTitle}` : `撤销完成：${displayTitle}`}
                                   >
                                     <RotateCcw className="w-4 h-4 transform group-hover/btn:-rotate-45 transition-transform" />
                                   </button>
                               ) : null}
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                 className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-red-500 dark:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shadow-sm group/btn"
                                 title={isEn ? "Delete" : "删除"}
                               >
                                  <Trash2 className="w-4 h-4 transform group-hover/btn:scale-110 transition-transform" />
                               </button>
                            </div>
                         </td>
                      </tr>
                   );})}
                   
                   {filteredTasks.length === 0 && (
                      <tr>
                         <td colSpan={7} className="px-6 py-16 text-center text-gray-400 dark:text-zinc-600">
                            <div className="flex justify-center mb-3">
                               <CheckSquare className="w-12 h-12 text-gray-200 dark:text-zinc-700" />
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
           <div role="dialog" aria-modal="true" aria-labelledby="teacher-task-detail-title" className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900" onClick={event => event.stopPropagation()}>
             <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 dark:border-white/5">
               <div>
                 <div className="mb-2 flex items-center gap-2">
                   <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{isEn ? 'Source: dashboard task list' : '来源：首页待办'}</span>
                   <span className="text-xs text-gray-400">ID: {detailTask.id}</span>
                 </div>
                 <h3 id="teacher-task-detail-title" className="text-lg font-bold text-gray-900 dark:text-white">{isEn ? 'Task details' : '任务详情'}</h3>
               </div>
               <button onClick={() => setDetailTaskId(null)} aria-label={isEn ? 'Close task details' : '关闭任务详情'} className="text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-zinc-200">
                 <XCircle className="h-5 w-5" />
               </button>
             </div>
             <div className="space-y-5 px-6 py-5">
               <div>
                 <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{isEn ? 'Title' : '任务标题'}</p>
                 <p className="mt-1 font-bold text-gray-900 dark:text-zinc-100">{formatTeacherTaskTitle(detailTask, isEn)}</p>
                 {formatTeacherTaskDescription(detailTask, isEn) && <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">{formatTeacherTaskDescription(detailTask, isEn)}</p>}
               </div>
               <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                 <div><p className="text-xs text-gray-400">{isEn ? 'Student' : '关联学生'}</p><p className="mt-1 font-medium text-gray-800 dark:text-zinc-200">{detailTask.studentName}</p></div>
                 <div><p className="text-xs text-gray-400">{isEn ? 'Timing status' : '时效状态'}</p><p className="mt-1 font-medium text-gray-800 dark:text-zinc-200">{getTimingStatusLabel(detailTask)}</p></div>
                 <div><p className="text-xs text-gray-400">{isEn ? 'Workflow status' : '流程状态'}</p><p className="mt-1 font-medium text-gray-800 dark:text-zinc-200">{getStatusLabel(detailTask.status)}</p></div>
                 <div><p className="text-xs text-gray-400">{isEn ? 'Category' : '分类'}</p><p className="mt-1 font-medium text-gray-800 dark:text-zinc-200">{translateCategory(detailTask.category)}</p></div>
                 <div><p className="text-xs text-gray-400">{isEn ? 'Deadline' : '截止时间'}</p><p className="mt-1 font-medium text-gray-800 dark:text-zinc-200">{formatTeacherTaskDueDate(detailTask.dueDate, isEn)}</p></div>
                 <div><p className="text-xs text-gray-400">{isEn ? 'Priority' : '优先级'}</p><p className="mt-1 font-medium text-gray-800 dark:text-zinc-200">{formatTeacherTaskPriority(detailTask.priority, isEn)}</p></div>
                 <div><p className="text-xs text-gray-400">{isEn ? 'Assignee' : '负责人'}</p><p className="mt-1 font-medium text-gray-800 dark:text-zinc-200">{detailTask.assignee || (isEn ? 'Unassigned' : '未分配')}</p></div>
               </div>
             </div>
           </div>
         </div>
       )}

       {editingTask && (
         <TaskEditDialog
           key={editingTask.id}
           title={formatTeacherTaskTitle(editingTask, isEn)}
           fields={getTeacherEditFields(editingTask)}
           auditHistory={editingTask.auditHistory || []}
           restrictionNote={editingTask.source === 'system-review'
             ? (isEn ? 'System-generated review task: only priority, due date, and assignee can be edited. Task content, student, category, status, and description are locked.' : '系统自动生成的审核任务：仅允许修改优先级、截止时间和负责人；任务内容、关联学生、分类、状态及说明均锁定。')
             : (isEn ? 'Authorized teachers can edit task fields. Status changes remain controlled by the task action buttons.' : '有权限教师可编辑任务字段；状态仍通过任务操作按钮变更。')}
           isEn={isEn}
           onClose={() => setEditingTaskId(null)}
           onSave={saveTeacherTaskEdit}
         />
       )}

       {/* --- NEW TASK MODAL --- */}
       {isNewTaskModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-[450px] overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-white/10" onClick={e => e.stopPropagation()}>
               <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                     <Plus className="w-5 h-5 text-[#b0826d]" /> {isEn ? 'New Task' : '新建任务'}
                  </h3>
                  <button onClick={() => setIsNewTaskModalOpen(false)} className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
                     <XCircle className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="p-6 space-y-5">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-1.5 tracking-wider">
                        {isEn ? 'Task Title' : '任务内容'} <span className="text-red-500">*</span>
                     </label>
                     <input 
                        className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:border-[#b0826d] focus:ring-2 focus:ring-[#b0826d]/20 dark:focus:ring-[#b0826d]/30 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-zinc-600 text-gray-900 dark:text-white"
                        value={newTaskForm.title}
                        onChange={(e) => setNewTaskForm({...newTaskForm, title: e.target.value})}
                        placeholder={isEn ? "Task Title..." : "输入任务标题 (例如：审核文书初稿)"}
                        autoFocus
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-1.5 tracking-wider">
                           {isEn ? 'Student' : '关联学生'} <span className="text-red-500">*</span>
                        </label>
                        <select 
                           className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-[#b0826d] outline-none transition-all text-gray-900 dark:text-white"
                           value={newTaskForm.studentId}
                           onChange={(e) => setNewTaskForm({...newTaskForm, studentId: e.target.value})}
                        >
                           <option value="">{isEn ? 'Select (Required)...' : '选择学生 (必选)'}</option>
                           {mockStudents.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                           ))}
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-1.5 tracking-wider">{isEn ? 'Category' : '业务类型'}</label>
                        <select 
                           className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-[#b0826d] outline-none transition-all text-gray-900 dark:text-white"
                           value={newTaskForm.category}
                           onChange={(e) => setNewTaskForm({...newTaskForm, category: e.target.value as TaskCategory})}
                        >
                           {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{translateCategory(cat)}</option>
                           ))}
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-1.5 tracking-wider">{isEn ? 'Due Date' : '截止时间'}</label>
                        <div className="relative">
                           <input 
                              type="date"
                              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:border-[#b0826d] focus:ring-2 focus:ring-[#b0826d]/20 dark:focus:ring-[#b0826d]/30 outline-none transition-all pr-24 text-gray-900 dark:text-white"
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
                        <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-1.5 tracking-wider">{isEn ? 'Priority' : '优先级'}</label>
                        <select 
                           className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-[#b0826d] outline-none transition-all text-gray-900 dark:text-white"
                           value={newTaskForm.priority}
                           onChange={(e) => setNewTaskForm({...newTaskForm, priority: e.target.value as TaskPriority})}
                        >
                           <option value="High">🔥 {formatTeacherTaskPriority('High', isEn)}</option>
                           <option value="Medium">⚡️ {formatTeacherTaskPriority('Medium', isEn)}</option>
                           <option value="Low">🌱 {formatTeacherTaskPriority('Low', isEn)}</option>
                        </select>
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-1.5 tracking-wider">{isEn ? 'Description (Optional)' : '详细说明 (可选)'}</label>
                     <textarea 
                        className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:border-[#b0826d] focus:ring-2 focus:ring-[#b0826d]/20 dark:focus:ring-[#b0826d]/30 outline-none transition-all h-24 resize-none placeholder:text-gray-300 dark:placeholder:text-zinc-600 text-gray-900 dark:text-white"
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
                    className="px-6 py-2.5 bg-[#b0826d] text-white text-sm font-bold rounded-lg hover:bg-[#966a57] shadow-md transition-all active:scale-95"
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

export default TaskCenter;
