
import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Search, Filter, Plus, Calendar, 
  Clock, AlertTriangle, MoreHorizontal, 
  CheckCircle, XCircle, ListTodo,
  CheckCheck, FileText, Trash2, User
} from '../common/Icons';
import { useLanguage } from '../../contexts/LanguageContext';

// --- Types ---
type TaskPriority = 'High' | 'Medium' | 'Low';
type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Review' | 'Overdue';
// Removed '建档' as requested
type TaskCategory = '规划' | '考试' | '活动' | '材料' | '面试' | '申请' | 'Offer' | '复盘';
type TaskAssigner = 'Teacher' | 'Student';

interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string; // ISO date string or "Today", "Yesterday"
  status: TaskStatus;
  description?: string;
  assigner: TaskAssigner; // New field
}

// --- Mock Data ---
const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Draft Personal Statement V2',
    category: '申请',
    priority: 'High',
    dueDate: 'Today',
    status: 'In Progress',
    description: 'Focus on the "Lego" metaphor intro.',
    assigner: 'Teacher'
  },
  {
    id: 't2',
    title: 'Register for December SAT',
    category: '考试',
    priority: 'High',
    dueDate: 'Tomorrow',
    status: 'Pending',
    description: 'Deadline is approaching.',
    assigner: 'Student'
  },
  {
    id: 't3',
    title: 'Upload G10 Transcript',
    category: '材料',
    priority: 'Medium',
    dueDate: 'Yesterday',
    status: 'Overdue',
    description: 'Original scan required.',
    assigner: 'Teacher'
  },
  {
    id: 't4',
    title: 'Brainstorm "Why Major" Essay',
    category: '申请',
    priority: 'Medium',
    dueDate: 'In 3 days',
    status: 'Pending',
    assigner: 'Teacher'
  },
  {
    id: 't5',
    title: 'Robotics Club Meeting Notes',
    category: '活动',
    priority: 'Low',
    dueDate: 'Next Week',
    status: 'Pending',
    assigner: 'Student'
  },
  {
    id: 't6',
    title: 'Counselor Recommendation Form',
    category: '材料',
    priority: 'High',
    dueDate: 'Last Week',
    status: 'Completed',
    assigner: 'Teacher'
  },
];

// Removed '建档'
const CATEGORIES: TaskCategory[] = ['规划', '考试', '活动', '材料', '面试', '申请', 'Offer', '复盘'];

// Toast Component
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-lg shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
    <CheckCircle className="w-4 h-4 text-green-400 dark:text-green-600" />
    <span className="text-sm font-medium">{message}</span>
    <button onClick={onClose} className="text-gray-400 dark:text-zinc-500 hover:text-white dark:hover:text-zinc-900"><XCircle className="w-3 h-3" /></button>
  </div>
);

const StudentTaskCenter: React.FC = () => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  // State
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Today' | 'Week' | 'Overdue' | 'Completed' | 'All'>('Today');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Helper: Date format getters
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

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
          '全部': 'All'
      };
      return map[cat] || cat;
  };

  // Filtering Logic
  const filteredTasks = tasks.filter(task => {
    // 1. Tab Filter
    let matchesTab = true;
    const today = getTodayStr();

    if (activeTab === 'Today') {
        matchesTab = task.dueDate === 'Today' || task.dueDate === today;
    }
    if (activeTab === 'Overdue') matchesTab = task.status === 'Overdue';
    if (activeTab === 'Completed') matchesTab = task.status === 'Completed';
    if (activeTab === 'Week') matchesTab = task.dueDate !== 'Last Week' && task.status !== 'Completed';
    
    // 2. Category Filter
    const matchesCategory = selectedCategory === '全部' || task.category === selectedCategory;

    // 3. Search
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesCategory && matchesSearch;
  });

  // Batch Selection Logic
  const toggleSelectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const toggleSelectTask = (id: string) => {
    const newSet = new Set(selectedTaskIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTaskIds(newSet);
  };

  const handleBatchComplete = () => {
    setTasks(prev => prev.map(t => selectedTaskIds.has(t.id) ? { ...t, status: 'Completed' } : t));
    setSelectedTaskIds(new Set());
    setToastMessage(isEn ? `Completed ${selectedTaskIds.size} tasks` : `已批量完成 ${selectedTaskIds.size} 个任务`);
  };

  const handleBatchDelete = () => {
    if (window.confirm(isEn ? 'Are you sure you want to delete selected tasks?' : '确定要删除选中的任务吗？')) {
        setTasks(prev => prev.filter(t => !selectedTaskIds.has(t.id)));
        setSelectedTaskIds(new Set());
        setToastMessage(isEn ? 'Tasks deleted' : '任务已删除');
    }
  };

  const handleCreateTask = () => {
    if (!newTaskForm.title) {
      alert(isEn ? 'Please fill in task title' : '请填写任务内容');
      return;
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskForm.title,
      category: newTaskForm.category,
      priority: newTaskForm.priority,
      dueDate: newTaskForm.dueDate || 'Today',
      status: 'Pending',
      description: newTaskForm.description,
      assigner: 'Student' // Default for student created tasks
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

  const handleToggleStatus = (id: string) => {
      setTasks(prev => prev.map(t => {
          if (t.id === id) {
              return { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' };
          }
          return t;
      }));
  };

  const handleDeleteTask = (id: string) => {
      setTasks(prev => prev.filter(t => t.id !== id));
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
      case 'In Progress': return <Clock className="w-4 h-4 text-violet-500 dark:text-violet-400" />;
      default: return <Clock className="w-4 h-4 text-gray-300 dark:text-zinc-600" />;
    }
  };

  return (
    <div className="flex h-full gap-6 relative transition-colors duration-300">
       {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

       {/* 1. Sidebar Filters */}
       <div className="w-64 flex-shrink-0 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 p-5 h-full flex flex-col transition-colors">
          <button 
             onClick={() => setIsNewTaskModalOpen(true)}
             className="w-full py-3 bg-violet-600 dark:bg-violet-700 text-white rounded-xl font-bold hover:bg-violet-700 dark:hover:bg-violet-600 transition-all flex items-center justify-center gap-2 shadow-sm mb-6"
          >
             <Plus className="w-5 h-5" /> {isEn ? 'New Task' : '新建任务'}
          </button>

          <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar">
             <div>
                <label className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-3 block px-1">{isEn ? 'Task Views' : '任务视图'}</label>
                <div className="space-y-1">
                   {[
                      { id: 'Today', label: isEn ? 'Today' : '今日待办', icon: <ListTodo className="w-4 h-4" />, count: filteredTasks.filter(t => activeTab === 'Today' ? true : (t.dueDate === 'Today' || t.dueDate === getTodayStr()) && t.status !== 'Completed').length },
                      { id: 'Week', label: isEn ? 'This Week' : '本周任务', icon: <Calendar className="w-4 h-4" />, count: tasks.filter(t => t.dueDate !== 'Last Week' && t.status !== 'Completed').length },
                      { id: 'Overdue', label: isEn ? 'Overdue' : '已逾期', icon: <AlertTriangle className="w-4 h-4" />, count: tasks.filter(t => t.status === 'Overdue').length, alert: true },
                      { id: 'Completed', label: isEn ? 'Completed' : '已完成', icon: <CheckCheck className="w-4 h-4" />, count: tasks.filter(t => t.status === 'Completed').length },
                      { id: 'All', label: isEn ? 'All Tasks' : '全部任务', icon: <CheckSquare className="w-4 h-4" />, count: tasks.length },
                   ].map((tab) => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                           ${activeTab === tab.id 
                             ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-800 dark:text-violet-300' 
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
                <label className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-3 block px-1">{isEn ? 'Task Types' : '任务类型'}</label>
                <div className="space-y-1">
                   <button 
                     onClick={() => setSelectedCategory('全部')}
                     className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === '全部' ? 'bg-gray-100 dark:bg-white/10 font-bold text-gray-800 dark:text-white' : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                   >
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
                         <span className={`w-2 h-2 rounded-full ${selectedCategory === cat ? 'bg-violet-500' : 'bg-gray-300 dark:bg-zinc-600'}`}></span>
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
          <div className="px-6 py-5 border-b border-[#e5e0dc] dark:border-white/5 flex justify-between items-center bg-gray-50/30 dark:bg-white/5">
             <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                   {activeTab === 'Today' && (isEn ? 'Today' : '今日待办')}
                   {activeTab === 'Week' && (isEn ? 'This Week' : '本周任务')}
                   {activeTab === 'Overdue' && (isEn ? 'Overdue' : '逾期提醒')}
                   {activeTab === 'Completed' && (isEn ? 'Completed' : '已完成任务')}
                   {activeTab === 'All' && (isEn ? 'All Tasks' : '全部任务列表')}
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
                      className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-violet-300 dark:focus:border-violet-700 focus:ring-2 focus:ring-violet-50 dark:focus:ring-violet-900/30 transition-all w-64 text-gray-900 dark:text-white"
                   />
                </div>
                <button className="p-2 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 dark:text-zinc-400 transition-colors">
                   <Filter className="w-4 h-4" />
                </button>
             </div>
          </div>

          {/* Task List Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
             <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-zinc-900/50 sticky top-0 z-10 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">
                   <tr>
                      <th className="px-6 py-3 w-12 border-b border-gray-100 dark:border-white/5">
                         <input 
                           type="checkbox" 
                           checked={selectedTaskIds.size > 0 && selectedTaskIds.size === filteredTasks.length}
                           onChange={toggleSelectAll}
                           className="rounded border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-violet-600 focus:ring-violet-500 cursor-pointer" 
                         />
                      </th>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5">{isEn ? 'Task' : '任务内容'}</th>
                      {/* Added Assigner Column */}
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5 text-center w-36">{isEn ? 'Assigner' : '任务下发方'}</th>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5 text-center">{isEn ? 'Category' : '分类'}</th>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5">{isEn ? 'Due Date' : '截止时间'}</th>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5">{isEn ? 'Priority' : '优先级'}</th>
                      <th className="px-6 py-3 border-b border-gray-100 dark:border-white/5 text-right">{isEn ? 'Actions' : '操作'}</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                   {filteredTasks.map(task => (
                      <tr key={task.id} className={`group transition-colors ${selectedTaskIds.has(task.id) ? 'bg-violet-50/40 dark:bg-violet-900/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                         <td className="px-6 py-4">
                            <input 
                              type="checkbox" 
                              checked={selectedTaskIds.has(task.id)}
                              onChange={() => toggleSelectTask(task.id)}
                              className="rounded border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-violet-600 focus:ring-violet-500 cursor-pointer" 
                            />
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-start gap-3">
                               <div className="mt-0.5 cursor-pointer" onClick={() => handleToggleStatus(task.id)}>{getStatusIcon(task.status)}</div>
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
                            <div className={`flex items-center gap-1.5 text-sm ${task.status === 'Overdue' ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-zinc-400'}`}>
                               {task.dueDate}
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                               {task.priority}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors">
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded transition-colors">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
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

          {/* Batch Actions Bar (Floating) */}
          {selectedTaskIds.size > 0 && (
             <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-4 z-50">
                <span className="font-bold text-sm">{isEn ? `Selected ${selectedTaskIds.size}` : `已选择 ${selectedTaskIds.size} 项`}</span>
                <div className="h-4 w-px bg-gray-700 dark:bg-zinc-200"></div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={handleBatchComplete}
                     className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-800 dark:hover:bg-zinc-100 rounded-lg text-sm font-medium transition-colors"
                   >
                      <CheckCircle className="w-4 h-4" /> {isEn ? 'Complete' : '批量完成'}
                   </button>
                   <button 
                     onClick={handleBatchDelete}
                     className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-500/20 text-red-400 dark:text-red-600 rounded-lg text-sm font-medium transition-colors"
                   >
                      <Trash2 className="w-4 h-4" /> {isEn ? 'Delete' : '批量删除'}
                   </button>
                </div>
                <button 
                  onClick={() => setSelectedTaskIds(new Set())}
                  className="ml-2 text-gray-400 dark:text-zinc-400 hover:text-white dark:hover:text-zinc-900"
                >
                   <XCircle className="w-5 h-5" />
                </button>
             </div>
          )}

       </div>

       {/* --- NEW TASK MODAL --- */}
       {isNewTaskModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-[450px] overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-white/10" onClick={e => e.stopPropagation()}>
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
                           <option value="High">🔥 {isEn ? 'High' : '高 (High)'}</option>
                           <option value="Medium">⚡️ {isEn ? 'Medium' : '中 (Medium)'}</option>
                           <option value="Low">🌱 {isEn ? 'Low' : '低 (Low)'}</option>
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
                             {isEn ? 'Today' : 'Today'}
                           </button>
                           <button 
                             type="button"
                             onClick={() => setNewTaskForm({...newTaskForm, dueDate: getTomorrowStr()})} 
                             className="text-[10px] bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 px-2 py-1 rounded text-gray-600 dark:text-zinc-300 transition-colors"
                           >
                             {isEn ? 'Tmrw' : 'Tmrw'}
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
