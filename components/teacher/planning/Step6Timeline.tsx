import React, { useState, useMemo } from 'react';
import { TimelineEvent, OFFICIAL_TEMPLATES, TimelineTemplate, SelectedSchool } from './PlanningData';
import { 
  Plus, Trash2, Edit, Calendar, Clock, CheckCircle, 
  AlertCircle, X, Save, User, Users, Briefcase, 
  ChevronDown, ChevronUp, ChevronRight, GripVertical, CheckSquare, List,
  Flag, Globe, Lock, GanttChart, Download, LayoutGrid, Filter, Check
} from '../../common/Icons';
import { useLanguage } from '../../../contexts/LanguageContext';

interface Step6Props {
  timelineEvents: TimelineEvent[];
  setTimelineEvents: React.Dispatch<React.SetStateAction<TimelineEvent[]>>;
  selectedSchools: SelectedSchool[];
  onComplete?: () => void;
}

const Step6Timeline: React.FC<Step6Props> = ({ timelineEvents, setTimelineEvents, selectedSchools, onComplete }) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  // --- State ---
  const [viewFilter, setViewFilter] = useState<'All' | 'Official' | 'Custom'>('All');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Student' | 'Counselor'>('All');
  const [viewMode, setViewMode] = useState<'Gantt' | 'List'>('Gantt');
  const [granularity, setGranularity] = useState<'Month' | 'Stage'>('Month');
  
  const [isUnscheduledOpen, setIsUnscheduledOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  
  // Template Selection State
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());

  // Form State
  const [formData, setFormData] = useState<Partial<TimelineEvent>>({
    title: '',
    startDate: '',
    endDate: '',
    type: 'Point',
    category: 'Other',
    priority: 'Medium',
    status: 'Pending',
    description: '',
    assignee: 'Student',
    blocker: '',
    daysInPool: 0
  });

  // --- Constants ---
  const CATEGORIES = ['Application', 'Exam', 'Activity', 'Academic', 'Other'] as const;
  const COLUMN_WIDTH = 240; // Increased width for better card readability

  // Filter Events
  const filteredEvents = useMemo(() => {
    return timelineEvents.filter(e => {
       // View Filter
       if (viewFilter === 'Official' && !e.isOfficial) return false;
       if (viewFilter === 'Custom' && e.isOfficial) return false;
       
       // Role Filter
       if (roleFilter !== 'All' && e.assignee !== roleFilter) return false;
       
       return true;
    });
  }, [timelineEvents, viewFilter, roleFilter]);

  const scheduledEvents = useMemo(() => filteredEvents.filter(e => e.startDate), [filteredEvents]);
  const unscheduledEvents = useMemo(() => filteredEvents.filter(e => !e.startDate), [filteredEvents]);

  const baseAcademicYear = useMemo(() => {
      const dates = scheduledEvents.map(e => e.startDate).filter(Boolean).map(d => new Date(d));
      if (dates.length === 0) return new Date().getFullYear();
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      return minDate.getMonth() >= 8 ? minDate.getFullYear() : minDate.getFullYear() - 1;
  }, [scheduledEvents]);

  const getGradeLabel = (academicYear: number) => {
      const diff = academicYear - baseAcademicYear;
      const grade = 10 + diff;
      return `G${grade}`;
  };

  // --- Helpers ---
  const getMonthDiff = (d1: Date, d2: Date) => {
      return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  };

  const getStageInfo = (date: Date) => {
    const month = date.getMonth() + 1; // 1-12
    if (month >= 9 || month === 1) return { name: isEn ? 'Fall' : '上学期', id: 'fall', color: 'bg-orange-50/50 text-orange-700' };
    if (month === 2) return { name: isEn ? 'Winter' : '寒假', id: 'winter', color: 'bg-blue-50/50 text-blue-700' };
    if (month >= 3 && month <= 6) return { name: isEn ? 'Spring' : '下学期', id: 'spring', color: 'bg-emerald-50/50 text-emerald-700' };
    return { name: isEn ? 'Summer' : '暑假', id: 'summer', color: 'bg-amber-50/50 text-amber-700' };
  };
  
  const hasOfficialEvents = useMemo(() => timelineEvents.some(e => e.isOfficial), [timelineEvents]);

  const schoolsByRegion = useMemo(() => {
      const groups: Record<string, string[]> = {};
      selectedSchools.forEach((school: SelectedSchool) => {
          const region = school.uni.region;
          if (!groups[region]) groups[region] = [];
          if (!groups[region].includes(school.uni.name)) groups[region].push(school.uni.name);
      });
      return groups;
  }, [selectedSchools]);

  const recommendedTemplateIds = useMemo(() => {
      return new Set(
          OFFICIAL_TEMPLATES
              .filter(template => Boolean(schoolsByRegion[template.region]?.length))
              .map(template => template.id)
      );
  }, [schoolsByRegion]);

  const orderedTemplates = useMemo(() => {
      return [...OFFICIAL_TEMPLATES].sort((a, b) => {
          return Number(recommendedTemplateIds.has(b.id)) - Number(recommendedTemplateIds.has(a.id));
      });
  }, [recommendedTemplateIds]);

  const importedTemplateIds = useMemo(() => {
      return new Set(timelineEvents.map(event => event.templateId).filter(Boolean) as string[]);
  }, [timelineEvents]);

  // Calculate view range
  const viewRange = useMemo(() => {
      const dates = scheduledEvents.map(e => e.startDate).filter(Boolean).map(d => new Date(d));
      if (dates.length === 0) dates.push(new Date());
      
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      
      // Start 1 month before min
      const start = new Date(minDate.getFullYear(), minDate.getMonth() - 1, 1);
      // End 24 months after max (or at least 36 months total for 3-year planning)
      const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 24, 1);
      
      // Ensure at least 36 months for long-term view
      if (getMonthDiff(start, end) < 36) {
          end.setMonth(start.getMonth() + 36);
      }

      return { start, end };
  }, [scheduledEvents]);

  // Generate columns
  const ganttColumns = useMemo(() => {
      if (granularity === 'Month') {
          const months = [];
          const curr = new Date(viewRange.start);
          while (curr < viewRange.end) {
              months.push({
                  type: 'Month' as const,
                  date: new Date(curr),
                  key: `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`
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
                      type: 'Stage' as const,
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

  // --- Styles ---
  const getCategoryColor = (cat: string) => {
      switch(cat) {
          case 'Application': return 'bg-blue-500 border-blue-600 text-white';
          case 'Exam': return 'bg-purple-500 border-purple-600 text-white';
          case 'Activity': return 'bg-emerald-500 border-emerald-600 text-white';
          case 'Academic': return 'bg-orange-500 border-orange-600 text-white';
          default: return 'bg-slate-500 border-slate-600 text-white';
      }
  };

  const getRegionFlag = (region?: string) => {
      switch(region) {
          case 'UK': return '🇬🇧';
          case 'US': return '🇺🇸';
          case 'HK': return '🇭🇰';
          case 'SG': return '🇸🇬';
          case 'CA': return '🇨🇦';
          case 'AU': return '🇦🇺';
          default: return '🌐';
      }
  };

  // --- Handlers ---
  const handleOpenAdd = (initialData?: Partial<TimelineEvent>) => {
    setEditingId(null);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setFormData({
      title: '', startDate: currentMonth, endDate: '', type: 'Point',
      category: 'Other', priority: 'Medium', status: 'Pending', description: '', assignee: 'Student',
      ...initialData
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event: TimelineEvent) => {
    setEditingId(event.id);
    let formattedStartDate = event.startDate;
    if (formattedStartDate && formattedStartDate.length === 7) {
        formattedStartDate = `${formattedStartDate}-01`;
    }
    setFormData({ ...event, startDate: formattedStartDate });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title) return;
    const newEvent: TimelineEvent = {
        ...formData,
        id: editingId || `evt-${Date.now()}`,
        title: formData.title || 'Untitled',
        startDate: formData.startDate || '',
        category: formData.category || 'Other',
        status: formData.status || 'Pending',
        priority: formData.priority || 'Medium',
        assignee: formData.assignee || 'Student',
        type: formData.type || 'Point',
        isMilestone: true,
        isOfficial: formData.isOfficial,
        region: formData.region,
        channel: formData.channel,
        templateId: formData.templateId,
        blocker: formData.blocker,
        daysInPool: formData.daysInPool || (formData.startDate ? undefined : 1)
    } as TimelineEvent;

    if (editingId) {
        setTimelineEvents(prev => prev.map(e => e.id === editingId ? newEvent : e));
    } else {
        setTimelineEvents(prev => [...prev, newEvent]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(isEn ? 'Delete this event?' : '确认删除此事件？')) {
        setTimelineEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  // Template Handlers
  const handleTemplateSelection = (id: string) => {
      if (importedTemplateIds.has(id)) return;
      const newSet = new Set(selectedTemplateIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedTemplateIds(newSet);
  };

  const handleOpenTemplateModal = () => {
      const recommendedNotImported = [...recommendedTemplateIds].filter(id => !importedTemplateIds.has(id));
      setSelectedTemplateIds(new Set(recommendedNotImported));
      setIsTemplateModalOpen(true);
  };

  const handleImportTemplates = () => {
      const templatesToImport = OFFICIAL_TEMPLATES.filter(t => selectedTemplateIds.has(t.id));

      setTimelineEvents(prev => {
          const eventKey = (event: Pick<TimelineEvent, 'title' | 'startDate' | 'region' | 'channel'>) =>
              [event.title.trim().toLowerCase(), event.startDate, event.region || '', event.channel || ''].join('|');
          const existingKeys = new Set(prev.map(eventKey));
          const newEvents: TimelineEvent[] = [];

          templatesToImport.forEach(tpl => {
              tpl.events.forEach(event => {
                  const key = eventKey(event);
                  if (existingKeys.has(key)) return;
                  existingKeys.add(key);
                  newEvents.push({
                      ...event,
                      id: `tpl-${tpl.id}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
                      status: 'Pending',
                      assignee: 'Student',
                      isMilestone: true,
                      templateId: tpl.id
                  } as TimelineEvent);
              });
          });

          return newEvents.length ? [...prev, ...newEvents] : prev;
      });
      setIsTemplateModalOpen(false);
      setSelectedTemplateIds(new Set());
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggingId(id);
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
      setDraggingId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, monthKey: string) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      if (id) {
          setTimelineEvents(prev => prev.map(evt => {
              if (evt.id === id) {
                  return { ...evt, startDate: `${monthKey}-01` };
              }
              return evt;
          }));
          setDraggingId(null);
      }
  };

  return (
    <div className="h-full flex flex-col bg-white relative">
        {/* --- Header --- */}
        <div className="flex justify-between items-start mb-6 pt-2 px-2 flex-shrink-0">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Calendar className="w-7 h-7 text-[#7d5646]" /> 
                    {isEn ? 'Application Timeline' : '申请规划时间轴'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    {isEn ? 'Manage official milestones and personalized tasks.' : '管理官方申请节点与个性化任务。'}
                </p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={handleOpenTemplateModal}
                    className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors"
                >
                    <Download className="w-4 h-4" /> {isEn ? 'Import Official' : '导入官方'}
                </button>
                <button onClick={() => handleOpenAdd()} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-black transition-colors">
                    <Plus className="w-4 h-4" /> {isEn ? 'Add Task' : '添加任务'}
                </button>
                {onComplete && (
                    <button 
                        onClick={() => {
                            if (timelineEvents.length === 0) {
                                alert(isEn ? 'Planning list is empty. Please add at least one task or import official timeline events before publishing.' : '规划清单为空，请至少添加一项任务或导入官方申请节点后再发布规划方案。');
                                return;
                            }
                            onComplete();
                        }} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <Check className="w-4 h-4" /> {isEn ? 'Publish Plan' : '确认发布规划方案'}
                    </button>
                )}
            </div>
        </div>

        {/* --- Toolbar / Filters --- */}
        <div className="flex items-center justify-between bg-gray-50/50 p-2 rounded-xl border border-gray-100 mb-4">
            <div className="flex items-center gap-6 px-2">
                {/* View Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">{isEn ? 'View:' : '视图:'}</span>
                    <div className="flex bg-white rounded-lg border border-gray-200 p-0.5">
                        {(['All', 'Official', 'Custom'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setViewFilter(f)}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewFilter === f ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                {f === 'All' ? (isEn ? 'All' : '全部') : f === 'Official' ? (isEn ? 'Official' : '官方') : (isEn ? 'Custom' : '自定义')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-px h-4 bg-gray-300"></div>

                {/* Role Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">{isEn ? 'Role:' : '角色:'}</span>
                    <div className="flex bg-white rounded-lg border border-gray-200 p-0.5">
                        {(['All', 'Student', 'Counselor'] as const).map(r => (
                            <button
                                key={r}
                                onClick={() => setRoleFilter(r)}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${roleFilter === r ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                {r === 'Student' && <User className="w-3 h-3" />}
                                {r === 'Counselor' && <Briefcase className="w-3 h-3" />}
                                {r === 'All' ? (isEn ? 'All' : '全部') : r === 'Student' ? (isEn ? 'Student' : '学生') : (isEn ? 'Counselor' : '顾问')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-4 mr-2">
                {/* Granularity Toggle */}
                <div className="flex bg-white rounded-lg border border-gray-200 p-0.5">
                    {(['Month', 'Stage'] as const).map(g => (
                        <button
                            key={g}
                            onClick={() => setGranularity(g)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${granularity === g ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            {g === 'Month' ? <Clock className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
                            {g === 'Month' ? (isEn ? 'Month' : '按月') : (isEn ? 'Stage' : '按阶段')}
                        </button>
                    ))}
                </div>

                <div className="w-px h-4 bg-gray-300"></div>

                <div className="flex bg-white rounded-lg border border-gray-200 p-0.5">
                    <button 
                        onClick={() => setViewMode('Gantt')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${viewMode === 'Gantt' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}
                    >
                        <GanttChart className="w-3.5 h-3.5" /> Gantt
                    </button>
                    <button 
                        onClick={() => setViewMode('List')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${viewMode === 'List' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}
                    >
                        <List className="w-3.5 h-3.5" /> List
                    </button>
                </div>
            </div>
        </div>

        {/* --- Official Banner --- */}
        {!hasOfficialEvents && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-indigo-900">{isEn ? 'Official Timeline Not Imported' : '尚未导入官方时间线'}</h3>
                        <p className="text-xs text-indigo-600 mt-0.5">{isEn ? 'Please import official templates to start planning.' : '请先导入官方申请时间轴模版以开始规划。'}</p>
                    </div>
                </div>
                <button 
                    onClick={handleOpenTemplateModal}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-colors"
                >
                    {isEn ? 'Import Now' : '立即导入'}
                </button>
            </div>
        )}

        {/* --- Main Content Area (Gantt + Sidebar) --- */}
        <div className="flex-1 overflow-hidden flex gap-4">
            {/* --- Gantt Chart Area / List View Area --- */}
            <div className="flex-1 overflow-hidden flex flex-col relative border border-gray-200 rounded-xl bg-white shadow-sm">
                {viewMode === 'Gantt' ? (
                    <div className="flex-1 overflow-auto custom-scrollbar relative">
                        <div className="flex flex-col min-w-max">
                            {/* Gantt Header */}
                            <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-40">
                                {/* Fixed Corner */}
                                <div className="w-40 flex-shrink-0 border-r border-gray-200 p-4 bg-gray-50 font-bold text-sm text-gray-500 flex items-center justify-center sticky left-0 z-50">
                                    {isEn ? 'Category' : '分类'}
                                </div>
                                {/* Scrollable Timeline Header */}
                                <div className="flex">
                                    {ganttColumns.map((col, i) => {
                                        if (col.type === 'Month') {
                                            const date = col.date as Date;
                                            return (
                                                <div 
                                                    key={i} 
                                                    className="flex-shrink-0 border-r border-gray-200 py-3 text-center flex flex-col justify-center bg-gray-50"
                                                    style={{ width: COLUMN_WIDTH }}
                                                >
                                                    <span className="text-sm font-bold text-gray-800">{date.toLocaleDateString(isEn ? 'en-US' : 'zh-CN', { year: 'numeric', month: isEn ? 'short' : 'long' })}</span>
                                                    <span className="text-[10px] text-gray-400 font-mono mt-0.5">{date.getFullYear()}-{String(date.getMonth()+1).padStart(2,'0')}</span>
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div 
                                                    key={i} 
                                                    className={`flex-shrink-0 border-r border-gray-200 py-2 text-center flex flex-col justify-center ${col.color}`}
                                                    style={{ width: COLUMN_WIDTH * 1.5 }}
                                                >
                                                    <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">{getGradeLabel(col.academicYear)}</span>
                                                    <span className="text-sm font-bold">{col.name}</span>
                                                </div>
                                            );
                                        }
                                    })}
                                </div>
                            </div>

                            {/* Gantt Body */}
                            <div className="flex flex-col">
                                {CATEGORIES.map((cat) => {
                                    const catEvents = scheduledEvents.filter(e => e.category === cat);
                                    return (
                                        <div key={cat} className="flex border-b border-gray-100 min-h-[120px] group hover:bg-gray-50/30 transition-colors">
                                            {/* Left Column: Category Header */}
                                            <div className="w-40 flex-shrink-0 sticky left-0 z-30 bg-white group-hover:bg-gray-50/30 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] flex items-center justify-between p-4">
                                                <span className="text-sm font-bold text-gray-700">{cat}</span>
                                                <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{catEvents.length}</span>
                                            </div>

                                            {/* Right Column: Timeline Cells */}
                                            <div className="flex">
                                                {ganttColumns.map((col, i) => {
                                                    const isStage = col.type === 'Stage';
                                                    const width = isStage ? COLUMN_WIDTH * 1.5 : COLUMN_WIDTH;
                                                    
                                                    let cellEvents: TimelineEvent[] = [];
                                                    let dropKey = '';
                                                    let isCurrent = false;

                                                    if (!isStage) {
                                                        const date = col.date as Date;
                                                        const monthKey = col.key;
                                                        dropKey = monthKey;
                                                        isCurrent = new Date().getMonth() === date.getMonth() && new Date().getFullYear() === date.getFullYear();
                                                        cellEvents = catEvents.filter(e => e.startDate && e.startDate.startsWith(monthKey));
                                                    } else {
                                                        // Use first month of stage as drop key
                                                        const firstMonth = col.months[0];
                                                        dropKey = `${firstMonth.getFullYear()}-${String(firstMonth.getMonth() + 1).padStart(2, '0')}`;
                                                        isCurrent = col.months.some(m => new Date().getMonth() === m.getMonth() && new Date().getFullYear() === m.getFullYear());
                                                        cellEvents = catEvents.filter(e => {
                                                            if (!e.startDate) return false;
                                                            return col.months.some(m => {
                                                                const mKey = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
                                                                return e.startDate.startsWith(mKey);
                                                            });
                                                        });
                                                    }

                                                    return (
                                                        <div 
                                                            key={i}
                                                            className={`flex-shrink-0 border-r border-dashed border-gray-100 p-2.5 flex flex-col gap-2.5 relative group/cell ${isCurrent ? 'bg-blue-50/10' : ''}`}
                                                            style={{ width }}
                                                            onDragOver={handleDragOver}
                                                            onDrop={(e) => handleDrop(e, dropKey)}
                                                        >
                                                            {/* Drop Zone Highlight */}
                                                            {draggingId && (
                                                                <div className="absolute inset-0 z-0 bg-indigo-50/30 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
                                                            )}
                                                            
                                                            {cellEvents.map(evt => {
                                                                const isDone = evt.status === 'Done';
                                                                return (
                                                                    <div 
                                                                        key={evt.id}
                                                                        className={`relative z-10 p-3 rounded-lg border shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all bg-white flex flex-col gap-2 ${isDone ? 'opacity-60 bg-gray-50' : ''} ${evt.isOfficial ? 'border-indigo-200' : 'border-gray-200'}`}
                                                                        onClick={() => handleOpenEdit(evt)}
                                                                        draggable
                                                                        onDragStart={(e) => handleDragStart(e, evt.id)}
                                                                        onDragEnd={handleDragEnd}
                                                                    >
                                                                        <div className="flex justify-between items-start gap-1">
                                                                            <span className="text-xs font-bold text-gray-800 leading-snug line-clamp-2" title={evt.title}>
                                                                                {evt.isOfficial && <Globe className="w-3.5 h-3.5 inline mr-1 text-indigo-500" />}
                                                                                {evt.title}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-1">
                                                                            {/* Priority */}
                                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${evt.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : evt.priority === 'Medium' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                                                {evt.priority === 'High' ? 'P0' : evt.priority === 'Medium' ? 'P1' : 'P2'}
                                                                            </span>
                                                                            {/* Role */}
                                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600 flex items-center gap-1">
                                                                                {evt.assignee === 'Student' ? <User className="w-2.5 h-2.5" /> : <Briefcase className="w-2.5 h-2.5" />}
                                                                                {evt.assignee === 'Student' ? (isEn ? 'Stu' : '学生') : (isEn ? 'Coun' : '顾问')}
                                                                            </span>
                                                                            {/* Status */}
                                                                            {isDone && <CheckCircle className="w-3.5 h-3.5 text-green-500 ml-auto" />}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}

                                                            {/* Quick Add Button */}
                                                            <button 
                                                                onClick={() => handleOpenAdd({ startDate: `${dropKey}-01`, category: cat as any })}
                                                                className="mt-1 py-1.5 border border-dashed border-gray-300 rounded-lg text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-center gap-1 text-xs font-bold opacity-0 group-hover/cell:opacity-100"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" /> {isEn ? 'Add Task' : '添加任务'}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* --- List View --- */
                    <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-white">
                        <div className="max-w-4xl mx-auto space-y-8">
                            {CATEGORIES.map((cat) => {
                                const catEvents = filteredEvents.filter(e => e.category === cat);
                                if (catEvents.length === 0) return null;

                                return (
                                    <div key={cat} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center gap-3 mb-4 sticky top-0 bg-white py-2 z-10">
                                            <div className={`w-1.5 h-6 rounded-full ${getCategoryColor(cat).split(' ')[0]}`}></div>
                                            <h3 className="text-lg font-bold text-gray-900">{cat}</h3>
                                            <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                {catEvents.length}
                                            </span>
                                        </div>
                                        
                                        <div className="grid gap-3">
                                            {catEvents.map((evt, index) => {
                                                const isDone = evt.status === 'Done';
                                                return (
                                                    <div 
                                                        key={evt.id}
                                                        onClick={() => handleOpenEdit(evt)}
                                                        className={`group flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer bg-white shadow-sm hover:shadow-md ${isDone ? 'opacity-60' : ''}`}
                                                    >
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm font-mono font-bold text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors">
                                                            {String(index + 1).padStart(2, '0')}
                                                        </div>
                                                        
                                                        <div className="flex-1 flex items-center justify-between min-w-0">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                {evt.isOfficial && <Globe className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                                                                <span className={`text-sm font-bold truncate ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                                    {evt.title}
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                                                                {/* Priority */}
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${evt.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : evt.priority === 'Medium' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                                    {evt.priority}
                                                                </span>
                                                                
                                                                {/* Assignee */}
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                                                                    {evt.assignee === 'Student' ? <User className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                                                                    {evt.assignee === 'Student' ? (isEn ? 'Student' : '学生') : (isEn ? 'Counselor' : '顾问')}
                                                                </div>

                                                                {/* Status Icon */}
                                                                {isDone ? (
                                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                                ) : (
                                                                    <div className="w-5 h-5 rounded-full border-2 border-gray-200 group-hover:border-indigo-300 transition-colors"></div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {filteredEvents.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                    <List className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="text-sm italic">{isEn ? 'No tasks found matching current filters.' : '未找到符合当前筛选条件的任务。'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* --- Planning List Sidebar --- */}
            <div className={`flex-shrink-0 border border-gray-200 rounded-xl bg-gray-50/50 transition-all duration-300 flex flex-col ${isUnscheduledOpen ? 'w-80' : 'w-12'}`}>
                <div 
                    className="flex justify-between items-center cursor-pointer select-none p-4 border-b border-gray-200 bg-white rounded-t-xl"
                    onClick={() => setIsUnscheduledOpen(!isUnscheduledOpen)}
                >
                    {isUnscheduledOpen ? (
                        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <List className="w-4 h-4 text-indigo-500" /> {isEn ? 'Planning List' : '规划清单'} 
                            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold">{unscheduledEvents.length}</span>
                        </h3>
                    ) : (
                        <div className="flex flex-col items-center gap-4 w-full">
                            <List className="w-4 h-4 text-gray-400" />
                            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{unscheduledEvents.length}</span>
                        </div>
                    )}
                    {isUnscheduledOpen && (
                        <div className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                    )}
                </div>

                {isUnscheduledOpen && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-4">
                        {unscheduledEvents.length > 0 ? (
                            <>
                                {/* Group by Blocker/Status conceptually */}
                                <div className="space-y-3">
                                    {unscheduledEvents.map(evt => {
                                        const days = evt.daysInPool || 1;
                                        const isAging = days > 14;
                                        const isCritical = days > 30;
                                        
                                        return (
                                            <div 
                                                key={evt.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, evt.id)}
                                                onDragEnd={handleDragEnd}
                                                className={`bg-white p-3.5 rounded-xl border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all flex flex-col gap-2.5 group relative
                                                    ${isCritical ? 'border-red-300' : isAging ? 'border-orange-300' : 'border-gray-200 hover:border-indigo-300'}`}
                                            >
                                                <div className="flex justify-between items-start gap-2">
                                                    <span className="text-sm font-bold text-gray-800 leading-snug flex-1" title={evt.title}>{evt.title}</span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${evt.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                        {evt.priority === 'High' ? 'P0' : 'P1'}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${getCategoryColor(evt.category)}`}>{evt.category}</span>
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600 flex items-center gap-1">
                                                        {evt.assignee === 'Student' ? <User className="w-2.5 h-2.5" /> : <Briefcase className="w-2.5 h-2.5" />}
                                                        {evt.assignee === 'Student' ? (isEn ? 'Stu' : '学生') : (isEn ? 'Coun' : '顾问')}
                                                    </span>
                                                </div>

                                                {/* Blocker / Next Step */}
                                                <div className="bg-gray-50 rounded-lg p-2 mt-1 border border-gray-100">
                                                    <div className="flex items-start gap-1.5">
                                                        <AlertCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                                        <span className="text-xs text-gray-600 line-clamp-2">
                                                            {evt.blocker || (isEn ? 'Pending scheduling...' : '等待排期中...')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Aging Indicator */}
                                                {(isAging || isCritical) && (
                                                    <div className="flex justify-end items-center mt-1">
                                                        <span className={`text-[10px] font-medium flex items-center gap-1 ${isCritical ? 'text-red-500' : 'text-orange-500'}`}>
                                                            <Clock className="w-3 h-3" /> {isEn ? `Pending for ${days} days` : `已停留 ${days} 天`}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-md p-0.5">
                                                    <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(evt); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-indigo-600 transition-colors">
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="w-full py-8 text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-3 bg-white">
                                <CheckCircle className="w-8 h-8 text-gray-300" /> 
                                {isEn ? 'All tasks scheduled!' : '所有任务均已排期！'}
                            </div>
                        )}
                        
                        <button 
                            onClick={() => handleOpenAdd({ startDate: '' })}
                            className="w-full py-3 mt-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 text-sm font-bold bg-white"
                        >
                            <Plus className="w-4 h-4" /> {isEn ? 'Add to Planning List' : '添加到规划清单'}
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* --- Edit Modal --- */}
        {isModalOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl p-4">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-900 text-lg">{editingId ? (isEn ? 'Edit Task' : '编辑任务') : (isEn ? 'New Task' : '新建任务')}</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-5 space-y-5">
                        {/* Title & Quick Suggestions */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{isEn ? 'Task Name' : '任务名称'}</label>
                            <input 
                                className="w-full border border-gray-200 p-2.5 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                                placeholder={isEn ? 'e.g., Draft Personal Statement' : '例如：撰写个人陈述初稿'} 
                                value={formData.title} 
                                onChange={e => setFormData({...formData, title: e.target.value})} 
                                autoFocus
                            />
                            {!editingId && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {(isEn ? ['Draft Personal Statement', 'Request Recommendation', 'Submit Application', 'Standardized Test'] : ['撰写个人陈述初稿', '联系推荐人', '提交网申', '标化考试报名']).map(suggestion => (
                                        <button 
                                            key={suggestion}
                                            onClick={() => setFormData({...formData, title: suggestion})}
                                            className="text-[10px] font-medium bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 px-2 py-1 rounded-md transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Date */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{isEn ? 'Date' : '日期'}</label>
                                <input 
                                    type="date" 
                                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                                    value={formData.startDate} 
                                    onChange={e => setFormData({...formData, startDate: e.target.value})} 
                                />
                            </div>
                            
                            {/* Category */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{isEn ? 'Category' : '分类'}</label>
                                <select 
                                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white" 
                                    value={formData.category} 
                                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                                >
                                    <option value="Application">Application</option>
                                    <option value="Exam">Exam</option>
                                    <option value="Activity">Activity</option>
                                    <option value="Academic">Academic</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Blocker / Next Step (Only show if date is empty) */}
                        {!formData.startDate && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{isEn ? 'Blocker / Next Step' : '阻塞原因 / 下一步动作'}</label>
                                <input 
                                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                                    placeholder={isEn ? 'e.g., Waiting for Oct SAT score' : '例如：需等10月SAT出分后决定'} 
                                    value={formData.blocker || ''} 
                                    onChange={e => setFormData({...formData, blocker: e.target.value})} 
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            {/* Assignee Toggle */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{isEn ? 'Assignee' : '负责人'}</label>
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    <button 
                                        onClick={() => setFormData({...formData, assignee: 'Student'})}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${formData.assignee === 'Student' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <User className="w-3.5 h-3.5" /> {isEn ? 'Student' : '学生'}
                                    </button>
                                    <button 
                                        onClick={() => setFormData({...formData, assignee: 'Counselor'})}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${formData.assignee === 'Counselor' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Briefcase className="w-3.5 h-3.5" /> {isEn ? 'Counselor' : '顾问'}
                                    </button>
                                </div>
                            </div>

                            {/* Priority Toggle */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{isEn ? 'Priority' : '优先级'}</label>
                                <div className="flex gap-2">
                                    {(['High', 'Medium', 'Low'] as const).map(p => (
                                        <button 
                                            key={p}
                                            onClick={() => setFormData({...formData, priority: p})}
                                            className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                                                formData.priority === p 
                                                    ? (p === 'High' ? 'bg-red-50 border-red-200 text-red-700' : p === 'Medium' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-blue-50 border-blue-200 text-blue-700')
                                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {p === 'High' ? 'P0' : p === 'Medium' ? 'P1' : 'P2'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        {editingId ? (
                            <button onClick={() => handleDelete(editingId)} className="text-red-500 text-sm font-bold hover:text-red-600 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
                                <Trash2 className="w-4 h-4"/> {isEn ? 'Delete' : '删除'}
                            </button>
                        ) : <div />}
                        
                        <div className="flex gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">{isEn ? 'Cancel' : '取消'}</button>
                            <button 
                                onClick={handleSave} 
                                disabled={!formData.title}
                                className="px-6 py-2.5 text-sm bg-gray-900 text-white rounded-xl font-bold shadow-md hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" /> {isEn ? 'Save Task' : '保存任务'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- Template Selection Modal --- */}
        {isTemplateModalOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-white">
                        <div>
                            <h3 className="font-bold text-gray-900 text-2xl mb-1">{isEn ? 'Import Official Timeline' : '导入官方时间线'}</h3>
                            <p className="text-gray-500 text-sm">{isEn ? 'Select official application timeline templates to import.' : '选择需要导入的官方申请时间轴模版。'}</p>
                        </div>
                        <button onClick={() => setIsTemplateModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-6 h-6 text-gray-400"/>
                        </button>
                    </div>
                    
                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                        <div className={`mb-5 rounded-xl border px-4 py-3 ${selectedSchools.length > 0 ? 'border-indigo-200 bg-indigo-50' : 'border-amber-200 bg-amber-50'}`}>
                            <p className={`text-sm font-bold ${selectedSchools.length > 0 ? 'text-indigo-900' : 'text-amber-900'}`}>
                                {selectedSchools.length > 0
                                    ? (isEn ? 'Prioritized from the student school list' : '已优先匹配学生选校清单')
                                    : (isEn ? 'No schools in the student school list' : '学生选校清单暂无院校')}
                            </p>
                            <p className={`mt-1 text-xs leading-relaxed ${selectedSchools.length > 0 ? 'text-indigo-700' : 'text-amber-700'}`}>
                                {selectedSchools.length > 0
                                    ? (isEn
                                        ? `${selectedSchools.map(school => school.uni.name).join(', ')}. Matching templates are listed first and preselected.`
                                        : `${selectedSchools.map(school => school.uni.name).join('、')}。匹配模板已置顶并自动勾选。`)
                                    : (isEn
                                        ? 'Showing all system official templates. Add schools to the Final List to receive prioritized recommendations.'
                                        : '当前展示全部系统官方模板；请先在“选校清单”添加院校，以获得优先推荐。')}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {orderedTemplates.map(tpl => {
                                const isSelected = selectedTemplateIds.has(tpl.id);
                                const matchedSchools = schoolsByRegion[tpl.region] || [];
                                const isRecommended = matchedSchools.length > 0;
                                const isImported = importedTemplateIds.has(tpl.id);
                                return (
                                    <div 
                                        key={tpl.id} 
                                        className={`relative border-2 rounded-xl p-5 transition-all bg-white group
                                            ${isImported ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                                            ${isSelected 
                                                ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500' 
                                                : isRecommended
                                                    ? 'border-indigo-200 hover:border-indigo-400 hover:shadow-sm'
                                                    : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'}`}
                                        onClick={() => handleTemplateSelection(tpl.id)}
                                    >
                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                            {isRecommended && (
                                                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                                                    {isEn ? 'From school list' : '来自选校清单'}
                                                </span>
                                            )}
                                            {isImported && (
                                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                                    {isEn ? 'Imported' : '已导入'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-start gap-3">
                                                <span className="text-3xl">{getRegionFlag(tpl.region)}</span>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-base">{tpl.name}</h4>
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200 font-medium">
                                                        {tpl.channel}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                                ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 bg-white'}`}>
                                                {isSelected && <Check className="w-4 h-4 text-white" />}
                                            </div>
                                        </div>
                                        
                                        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                                            {tpl.description}
                                        </p>

                                        {isRecommended && (
                                            <p className="mb-4 rounded-lg bg-indigo-50 px-3 py-2 text-xs leading-relaxed text-indigo-700">
                                                <span className="font-bold">{isEn ? 'Matched schools: ' : '匹配院校：'}</span>
                                                {matchedSchools.join(isEn ? ', ' : '、')}
                                            </p>
                                        )}

                                        <div className="space-y-2">
                                            {tpl.events.slice(0, 3).map((e, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                                    <span className="truncate">{e.title}</span>
                                                </div>
                                            ))}
                                            {tpl.events.length > 3 && (
                                                <div className="text-xs text-gray-400 pl-3.5">
                                                    +{tpl.events.length - 3} {isEn ? 'more events' : '更多节点'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-3">
                        <button 
                            onClick={() => setIsTemplateModalOpen(false)} 
                            className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            {isEn ? 'Cancel' : '取消'}
                        </button>
                        <button 
                            onClick={handleImportTemplates} 
                            className="px-8 py-2.5 bg-indigo-500 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-600 transition-all flex items-center gap-2"
                            disabled={selectedTemplateIds.size === 0}
                        >
                            <Download className="w-4 h-4" />
                            {isEn ? `Import ${selectedTemplateIds.size} Templates` : `导入 ${selectedTemplateIds.size} 个模版`}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Step6Timeline;
