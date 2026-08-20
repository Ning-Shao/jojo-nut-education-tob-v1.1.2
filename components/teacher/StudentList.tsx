
import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, SlidersHorizontal, Plus, 
  MoreHorizontal, AlertTriangle, Clock, CheckCircle, Mail,
  ChevronDown, XCircle, Check, MessageSquare, X,
  User, GraduationCap, Globe, Layers, Users, Edit, Trash2
} from '../common/Icons';
import { StudentSummary, RiskLevel, StudentPhase } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

export interface StudentListFilters {
  grade?: string;
  direction?: string;
  phase?: string;
  risk?: string | null;
}

interface StudentListProps {
  onStudentClick: (id: string) => void;
  initialFilter?: string | null;
  initialFilters?: StudentListFilters | null;
}

// --- Completeness Logic Start ---

// 1. Define Weights
const WEIGHTS = {
  basicInfo: 10,
  scores: 20,
  schoolList: 30,
  essays: 20,
  activities: 10,
  recommendations: 10
};

// 2. Define Mock Detailed Data (Simulating Database Relations)
// In a real app, this would be fetched via API
const MOCK_STUDENT_DETAILS: Record<string, {
  hasBasicInfo: boolean;
  scoreCount: number;
  schoolCount: number;
  essayCount: number; // Finalized or In Progress
  activityCount: number;
  recCount: number;
}> = {
  '1': { hasBasicInfo: true, scoreCount: 3, schoolCount: 8, essayCount: 2, activityCount: 5, recCount: 2 }, // Alex: High
  '2': { hasBasicInfo: true, scoreCount: 4, schoolCount: 10, essayCount: 4, activityCount: 6, recCount: 3 }, // Sarah: Very High
  '3': { hasBasicInfo: true, scoreCount: 0, schoolCount: 0, essayCount: 0, activityCount: 0, recCount: 0 }, // James: Low (New)
  '4': { hasBasicInfo: true, scoreCount: 2, schoolCount: 5, essayCount: 1, activityCount: 4, recCount: 1 }, // Emily: High
  '5': { hasBasicInfo: true, scoreCount: 1, schoolCount: 3, essayCount: 0, activityCount: 2, recCount: 0 }, // Michael: Medium
};

// 3. Calculation Function
const calculateCompleteness = (studentId: string) => {
  const details = MOCK_STUDENT_DETAILS[studentId];
  if (!details) return 15; // Default low score for unknown/new students

  let score = 0;
  if (details.hasBasicInfo) score += WEIGHTS.basicInfo;
  if (details.scoreCount > 0) score += WEIGHTS.scores;
  if (details.schoolCount > 0) score += WEIGHTS.schoolList; // Simple binary check for demo
  if (details.essayCount > 0) score += WEIGHTS.essays;
  if (details.activityCount > 0) score += WEIGHTS.activities;
  if (details.recCount > 0) score += WEIGHTS.recommendations;

  return Math.min(100, score);
};

// 4. Breakdown Generator for Tooltip
const getCompletenessBreakdown = (studentId: string, isEn: boolean) => {
  const details = MOCK_STUDENT_DETAILS[studentId];
  if (!details) return isEn ? "New Profile" : "新档案";

  const items = [
    `${isEn ? 'Basic' : '基础'}: ${details.hasBasicInfo ? WEIGHTS.basicInfo : 0}/${WEIGHTS.basicInfo}`,
    `${isEn ? 'Scores' : '标化'}: ${details.scoreCount > 0 ? WEIGHTS.scores : 0}/${WEIGHTS.scores}`,
    `${isEn ? 'Schools' : '选校'}: ${details.schoolCount > 0 ? WEIGHTS.schoolList : 0}/${WEIGHTS.schoolList}`,
    `${isEn ? 'Essays' : '文书'}: ${details.essayCount > 0 ? WEIGHTS.essays : 0}/${WEIGHTS.essays}`,
    `${isEn ? 'Activities' : '活动'}: ${details.activityCount > 0 ? WEIGHTS.activities : 0}/${WEIGHTS.activities}`,
    `${isEn ? 'Recs' : '推荐信'}: ${details.recCount > 0 ? WEIGHTS.recommendations : 0}/${WEIGHTS.recommendations}`,
  ];
  return items.join('\n');
};

// --- Completeness Logic End ---

export const mockStudents: StudentSummary[] = [
  {
    id: '1',
    name: 'Alex Chen',
    studentId: '2025001',
    grade: 'G11',
    class: '11-A',
    direction: 'US',
    phase: 'Phase 2 教学运营',
    status: '规划中',
    targetSummary: 'US Top 30 CS',
    riskLevel: 'high',
    riskCategories: ['成绩风险'],
    riskTags: ['GPA波动', '托福未达标'],
    nextTask: '选校名单确认',
    nextTaskDue: 'Today',
    lastContact: '3 days ago',
    dataCompleteness: 0, // Will be calculated
    avatarInitials: 'AC',
    avatarUrl: 'https://api.dicebear.com/7.x/micah/svg?seed=Alex&backgroundColor=ffdfbf'
  },
  {
    id: '2',
    name: 'Sarah Li',
    studentId: '2025002',
    grade: 'G12',
    class: '12-B',
    direction: 'UK',
    phase: 'Phase 4 录取',
    status: '申请中',
    targetSummary: 'G5 Bio',
    riskLevel: 'none',
    riskCategories: [],
    riskTags: [],
    nextTask: '文书终稿审核',
    nextTaskDue: 'Tomorrow',
    lastContact: 'Yesterday',
    dataCompleteness: 0, 
    avatarInitials: 'SL',
    avatarUrl: 'https://api.dicebear.com/7.x/micah/svg?seed=Sarah&backgroundColor=d1d4f9'
  },
  {
    id: '3',
    name: 'James Wang',
    studentId: '2025003',
    grade: 'G10',
    class: '10-C',
    direction: 'Global',
    phase: 'Phase 1 规划',
    status: '未建档',
    targetSummary: '待规划',
    riskLevel: 'medium',
    riskCategories: ['任务风险'],
    riskTags: ['缺课外活动规划', '首谈逾期'],
    nextTask: '首次面谈',
    nextTaskDue: 'Next Week',
    lastContact: '14 days ago',
    dataCompleteness: 0,
    avatarInitials: 'JW',
    avatarUrl: 'https://api.dicebear.com/7.x/micah/svg?seed=James&backgroundColor=b6e3f4'
  },
  {
    id: '4',
    name: 'Emily Zhang',
    studentId: '2025004',
    grade: 'G12',
    class: '12-A',
    direction: 'US',
    phase: 'Phase 3 申请',
    status: '申请中',
    targetSummary: 'US Top 20 Arts',
    riskLevel: 'low',
    riskCategories: ['材料风险'],
    riskTags: ['作品集进度慢'],
    nextTask: '作品集Review',
    nextTaskDue: 'In 2 days',
    lastContact: 'Today',
    dataCompleteness: 0,
    avatarInitials: 'EZ',
    avatarUrl: 'https://api.dicebear.com/7.x/micah/svg?seed=Emily&backgroundColor=ffd5dc'
  },
  {
    id: '5',
    name: 'Michael Wu',
    studentId: '2025005',
    grade: 'G11',
    class: '11-A',
    direction: 'US',
    phase: 'Phase 2 教学运营',
    status: '规划中',
    targetSummary: 'Top 50 Undecided',
    riskLevel: 'high',
    riskCategories: ['沟通风险', '目标风险'],
    riskTags: ['家长失联', '目标过高'],
    nextTask: '家长会预约',
    nextTaskDue: 'Overdue',
    lastContact: '1 month ago',
    dataCompleteness: 0,
    avatarInitials: 'MW',
    avatarUrl: 'https://api.dicebear.com/7.x/micah/svg?seed=Michael&backgroundColor=c0aede'
  },
  {
    id: '6',
    name: 'Olivia Chen',
    studentId: '2025006',
    grade: 'G10',
    class: '10-B',
    direction: 'UK',
    phase: 'Phase 1 规划',
    status: '规划中',
    targetSummary: 'G5 Prep',
    riskLevel: 'none',
    riskCategories: [],
    riskTags: [],
    nextTask: 'IGCSE Review',
    nextTaskDue: 'Next Week',
    lastContact: '2 days ago',
    dataCompleteness: 45,
    avatarInitials: 'OC',
    avatarUrl: 'https://api.dicebear.com/7.x/micah/svg?seed=Olivia&backgroundColor=b6e3f4'
  },
  {
    id: '7',
    name: 'Daniel Liu',
    studentId: '2025007',
    grade: 'G11',
    class: '11-C',
    direction: 'Canada',
    phase: 'Phase 2 教学运营',
    status: '规划中',
    targetSummary: 'Waterloo CS',
    riskLevel: 'medium',
    riskCategories: ['成绩风险'],
    riskTags: ['Math Grade Drop'],
    nextTask: 'Math Tutor Assign',
    nextTaskDue: 'Tomorrow',
    lastContact: 'Yesterday',
    dataCompleteness: 60,
    avatarInitials: 'DL',
    avatarUrl: 'https://api.dicebear.com/7.x/micah/svg?seed=Daniel&backgroundColor=ffdfbf'
  },
  {
    id: '8',
    name: 'Grace Kim',
    studentId: '2025008',
    grade: 'G12',
    class: '12-A',
    direction: 'US',
    phase: 'Phase 4 录取',
    status: '已Offer',
    targetSummary: 'NYU',
    riskLevel: 'none',
    riskCategories: [],
    riskTags: [],
    nextTask: 'Deposit Payment',
    nextTaskDue: 'In 3 days',
    lastContact: 'Today',
    dataCompleteness: 95,
    avatarInitials: 'GK',
    avatarUrl: 'https://api.dicebear.com/7.x/micah/svg?seed=Grace&backgroundColor=ffd5dc'
  },
  {
    id: '9',
    name: 'Henry Wilson',
    studentId: '2025009',
    grade: 'G9',
    class: '9-A',
    direction: 'Global',
    phase: 'Phase 0 建档',
    status: '未建档',
    targetSummary: 'Exploration',
    riskLevel: 'low',
    riskCategories: ['沟通风险'],
    riskTags: ['Slow Response'],
    nextTask: 'Parent Onboarding',
    nextTaskDue: 'Overdue',
    lastContact: '5 days ago',
    dataCompleteness: 20,
    avatarInitials: 'HW',
    avatarUrl: 'https://api.dicebear.com/7.x/micah/svg?seed=Henry&backgroundColor=c0aede'
  },
  {
    id: '10',
    name: 'Isabella Wang',
    studentId: '2025010',
    grade: 'G11',
    class: '11-B',
    direction: 'HK',
    phase: 'Phase 2 教学运营',
    status: '规划中',
    targetSummary: 'HKU/HKUST',
    riskLevel: 'medium',
    riskCategories: ['目标风险'],
    riskTags: ['Target Mismatch'],
    nextTask: 'School List Review',
    nextTaskDue: 'Today',
    lastContact: '1 week ago',
    dataCompleteness: 55,
    avatarInitials: 'IW',
    avatarUrl: 'https://api.dicebear.com/7.x/micah/svg?seed=Isabella&backgroundColor=d1d4f9'
  },
  {
    id: '11',
    name: 'Kevin Zhao',
    studentId: '2025011',
    grade: 'G12',
    class: '12-C',
    direction: 'US',
    phase: 'Phase 3 申请',
    status: '申请中',
    targetSummary: 'UC Berkeley',
    riskLevel: 'high',
    riskCategories: ['文书风险'],
    riskTags: ['Essay Quality'],
    nextTask: 'Essay Edit V3',
    nextTaskDue: 'Tomorrow',
    lastContact: 'Yesterday',
    dataCompleteness: 80,
    avatarInitials: 'KZ',
    avatarUrl: 'https://api.dicebear.com/7.x/micah/svg?seed=Kevin&backgroundColor=b6e3f4'
  },
  {
    id: '12',
    name: 'Lily Chen',
    studentId: '2025012',
    grade: 'G10',
    class: '10-A',
    direction: 'US',
    phase: 'Phase 1 规划',
    status: '规划中',
    targetSummary: 'Ivy League',
    riskLevel: 'none',
    riskCategories: [],
    riskTags: [],
    nextTask: 'Activity Planning',
    nextTaskDue: 'Next Month',
    lastContact: '2 weeks ago',
    dataCompleteness: 35,
    avatarInitials: 'LC',
    avatarUrl: 'https://api.dicebear.com/7.x/micah/svg?seed=Lily&backgroundColor=ffdfbf'
  }
];

const StudentList: React.FC<StudentListProps> = ({ onStudentClick, initialFilter, initialFilters }) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Initialize with a copy of mockStudents and CALCULATE completeness
  const [students, setStudents] = useState<StudentSummary[]>(
    mockStudents.map(s => ({
      ...s,
      dataCompleteness: calculateCompleteness(s.id) // Apply Logic Here
    }))
  );
  
  // Add/Edit Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Delete Modal State
  const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; studentId: string | null }>({ isOpen: false, studentId: null });

  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    studentId: '',
    grade: 'G10',
    class: '',
    direction: 'US',
    phase: 'Phase 0 建档' as StudentPhase
  });

  // Add Communication Record Modal State
  const [isCommModalOpen, setIsCommModalOpen] = useState(false);
  const [newCommLog, setNewCommLog] = useState({
    studentId: '',
    type: 'Meeting',
    date: new Date().toISOString().slice(0, 16),
    participants: ['Student', 'Counselor'],
    title: '',
    content: ''
  });

  const [riskFilterLabel, setRiskFilterLabel] = useState<string>(isEn ? 'Risk: All' : '风险: 全部'); 
  const [isRiskFilterActive, setIsRiskFilterActive] = useState(false);
  const [activeRiskValue, setActiveRiskValue] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState({
    grade: '全部',
    direction: '全部',
    phase: '全部'
  });
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Dynamic Options based on Language
  const FILTER_CONFIG = useMemo(() => ({
    grade: { 
      label: isEn ? 'Grade' : '年级', 
      options: ['全部', 'G9', 'G10', 'G11', 'G12'] 
    },
    direction: { 
      label: isEn ? 'Region' : '方向', 
      options: ['全部', 'US', 'UK', 'HK', 'SG', 'Canada', 'Australia', 'Global'] 
    },
    phase: { 
      label: isEn ? 'Phase' : '阶段', 
      options: [
        '全部', 
        'Phase 0 建档', 
        'Phase 1 规划', 
        'Phase 2 教学运营', 
        'Phase 3 申请', 
        'Phase 4 录取', 
        'Phase 5 复盘'
      ] 
    }
  }), [isEn]);

  const RISK_OPTIONS = useMemo(() => 
    isEn 
    ? ['All', 'Academic', 'Target', 'Task', 'Material', 'Comm'] 
    : ['全部', '成绩风险', '目标风险', '任务风险', '材料风险', '沟通风险'],
  [isEn]);

  useEffect(() => {
    if (initialFilters) {
      setFilters({
        grade: initialFilters.grade || '全部',
        direction: initialFilters.direction || '全部',
        phase: initialFilters.phase || '全部'
      });
      if (initialFilters.risk) {
        setRiskFilterLabel(isEn ? `Risk: ${initialFilters.risk}` : `风险: ${initialFilters.risk}`);
        setIsRiskFilterActive(true);
        setActiveRiskValue(initialFilters.risk);
      } else {
        setRiskFilterLabel(isEn ? 'Risk Filter' : '风险筛选');
        setIsRiskFilterActive(false);
        setActiveRiskValue(null);
      }
    } else if (initialFilter) {
      setRiskFilterLabel(isEn ? `Risk: ${initialFilter}` : `风险: ${initialFilter}`);
      setIsRiskFilterActive(true);
      setActiveRiskValue(initialFilter);
    } else {
      setRiskFilterLabel(isEn ? 'Risk Filter' : '风险筛选');
      setIsRiskFilterActive(false);
      setActiveRiskValue(null);
    }
  }, [initialFilter, initialFilters, isEn]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, activeRiskValue]);

  const handleClearRiskFilter = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRiskFilterLabel(isEn ? 'Risk Filter' : '风险筛选');
    setIsRiskFilterActive(false);
    setActiveRiskValue(null);
    setActiveDropdown(null);
  };

  const handleRiskSelect = (option: string) => {
    if (option === '全部' || option === 'All') {
        handleClearRiskFilter();
    } else {
        setRiskFilterLabel(isEn ? `Risk: ${option}` : `风险: ${option}`);
        setIsRiskFilterActive(true);
        setActiveRiskValue(option);
    }
    setActiveDropdown(null);
  };

  const handleClearSearch = () => setSearchQuery('');

  const toggleDropdown = (key: string) => {
    if (activeDropdown === key) setActiveDropdown(null);
    else setActiveDropdown(key);
  };

  const handleFilterSelect = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setActiveDropdown(null);
  };

  const handleClearDropdownFilter = (key: keyof typeof filters, e: React.MouseEvent) => {
    e.stopPropagation();
    setFilters(prev => ({ ...prev, [key]: '全部' }));
    setActiveDropdown(null);
  };

  const handleClearAllFilters = () => {
    handleClearRiskFilter();
    handleClearSearch();
    setFilters({
      grade: '全部',
      direction: '全部',
      phase: '全部'
    });
  };

  const handleOpenAddModal = () => {
      setEditingId(null);
      setNewStudentForm({ 
          name: '', 
          studentId: '', 
          grade: 'G10', 
          class: '', 
          direction: 'US', 
          phase: 'Phase 0 建档' 
      });
      setIsAddModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, student: StudentSummary) => {
      e.stopPropagation();
      setEditingId(student.id);
      setNewStudentForm({
          name: student.name,
          studentId: student.studentId,
          grade: student.grade,
          class: student.class,
          direction: student.direction,
          phase: student.phase
      });
      setIsAddModalOpen(true);
  };

  const handleDeleteStudent = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setDeleteModalState({ isOpen: true, studentId: id });
  };

  const confirmDelete = () => {
      if (deleteModalState.studentId) {
          const id = deleteModalState.studentId;
          setStudents(prev => prev.filter(s => s.id !== id));
          // Also remove from global mock data to persist deletion across navigation within the session
          const globalIndex = mockStudents.findIndex(s => s.id === id);
          if (globalIndex !== -1) {
              mockStudents.splice(globalIndex, 1);
          }
      }
      setDeleteModalState({ isOpen: false, studentId: null });
  };

  const handleSaveStudent = () => {
    if (!newStudentForm.name || !newStudentForm.studentId) {
        alert(isEn ? 'Please fill in Name and Student ID' : '请填写学生姓名和学号');
        return;
    }

    if (editingId) {
        // Edit Mode
        setStudents(prev => prev.map(s => {
            if (s.id === editingId) {
                const updatedStudent = {
                    ...s,
                    name: newStudentForm.name,
                    studentId: newStudentForm.studentId,
                    grade: newStudentForm.grade,
                    class: newStudentForm.class || (isEn ? 'TBD' : '待定'),
                    direction: newStudentForm.direction,
                    phase: newStudentForm.phase,
                    avatarInitials: newStudentForm.name.substring(0, 2).toUpperCase(),
                    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newStudentForm.name)}&backgroundColor=e5e7eb`
                };
                
                // Update global mock for consistency
                const globalIndex = mockStudents.findIndex(ms => ms.id === editingId);
                if (globalIndex !== -1) {
                    mockStudents[globalIndex] = { ...mockStudents[globalIndex], ...updatedStudent };
                }
                
                return updatedStudent;
            }
            return s;
        }));
    } else {
        // Create Mode
        // Business Logic: Determine initial status and next task based on phase
        let initialStatus = '未建档';
        let initialNextTask = '建档面谈';
        
        if (newStudentForm.phase === 'Phase 0 建档') {
            initialStatus = '未建档';
            initialNextTask = '建档面谈';
        } else if (newStudentForm.phase.includes('申请')) {
            initialStatus = '申请中';
            initialNextTask = '选校确认';
        } else {
            initialStatus = '规划中';
            initialNextTask = '首次面谈';
        }

        const newStudent: StudentSummary = {
            id: `new-${Date.now()}`,
            name: newStudentForm.name,
            studentId: newStudentForm.studentId,
            grade: newStudentForm.grade,
            class: newStudentForm.class || (isEn ? 'TBD' : '待定'), 
            direction: newStudentForm.direction,
            phase: newStudentForm.phase,
            status: initialStatus as any,
            targetSummary: isEn ? 'TBD' : '待规划',
            riskLevel: 'none',
            riskCategories: [],
            riskTags: [],
            nextTask: initialNextTask,
            nextTaskDue: isEn ? 'This Week' : '本周',
            lastContact: 'Never',
            dataCompleteness: 10, // Start with basic info only score
            avatarInitials: newStudentForm.name.substring(0, 2).toUpperCase(),
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newStudentForm.name)}&backgroundColor=e5e7eb`
        };

        // Update global mock for consistency across components
        mockStudents.unshift(newStudent);
        // Update local state
        setStudents([newStudent, ...students]);
    }

    setIsAddModalOpen(false);
    setEditingId(null);
    // Reset Form
    setNewStudentForm({ 
        name: '', 
        studentId: '', 
        grade: 'G10', 
        class: '', 
        direction: 'US', 
        phase: 'Phase 0 建档' 
    });
  };

  const handleSaveCommLog = () => {
    if (!newCommLog.studentId || !newCommLog.title) {
        alert(isEn ? 'Please select student and enter title' : '请选择学生并填写主题');
        return;
    }
    const student = students.find(s => s.id === newCommLog.studentId);
    alert(isEn 
        ? `Added log for ${student?.name || 'Unknown'}: ${newCommLog.title}` 
        : `已为学生 ${student?.name || 'Unknown'} 添加沟通记录: ${newCommLog.title}`);
    setIsCommModalOpen(false);
    setNewCommLog({
        studentId: '',
        type: 'Meeting',
        date: new Date().toISOString().slice(0, 16),
        participants: ['Student', 'Counselor'],
        title: '',
        content: ''
    });
  };

  const filteredStudents = students.filter(student => {
    let matchesRisk = true;
    if (isRiskFilterActive && activeRiskValue && activeRiskValue !== '全部' && activeRiskValue !== 'All') {
       const cnMap: Record<string, string> = {
           'Academic': '成绩风险', 'Target': '目标风险', 'Task': '任务风险', 'Material': '材料风险', 'Comm': '沟通风险'
       };
       const checkVal = cnMap[activeRiskValue] || activeRiskValue;
       matchesRisk = student.riskCategories.includes(checkVal);
    }
    let matchesSearch = true;
    if (searchQuery.trim()) {
       const query = searchQuery.toLowerCase().trim();
       matchesSearch = student.name.toLowerCase().includes(query) || student.studentId.includes(query);
    }
    const matchesGrade = filters.grade === '全部' || student.grade === filters.grade;
    
    // Direction/Region match
    const matchesDirection = filters.direction === '全部' || 
      ((filters.direction === 'Other' || filters.direction === '其他')
        ? !['US', 'UK'].includes(student.direction)
        : student.direction === filters.direction || student.direction.includes(filters.direction));

    // Phase 0-5 match
    const phasePrefix = filters.phase === '全部' ? '' : (filters.phase.split(' ')[0] + ' ' + (filters.phase.split(' ')[1] || ''));
    const matchesPhase = filters.phase === '全部' || 
      student.phase === filters.phase ||
      (phasePrefix.trim() !== '' && student.phase.startsWith(phasePrefix.trim())) ||
      student.phase.includes(filters.phase) ||
      filters.phase.includes(student.phase);

    return matchesRisk && matchesSearch && matchesGrade && matchesDirection && matchesPhase;
  });

  const isAnyFilterActive = filters.grade !== '全部' || 
    filters.direction !== '全部' || 
    filters.phase !== '全部' || 
    isRiskFilterActive || 
    searchQuery.trim().length > 0;

  // Pagination Logic
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  // --- Translation Helpers ---
  const translateTarget = (summary: string) => {
    if (!isEn) return summary;
    if (summary === '待规划' || summary === '待定') return 'TBD';
    if (summary === '未定') return 'TBD';
    return summary;
  };

  const translateNextTask = (task: string) => {
    if (!isEn) return task;
    const map: Record<string, string> = {
      '选校名单确认': 'School List Confirm',
      '文书终稿审核': 'Essay Review',
      '首次面谈': 'First Meeting',
      '作品集Review': 'Portfolio Review',
      '家长会预约': 'Parent Meeting',
      '建档面谈': 'Onboarding',
      '建档': 'Onboarding'
    };
    return map[task] || task;
  };

  const getRiskBadge = (level: RiskLevel, categories: string[], tags: string[]) => {
    if (level === 'none' || (!categories.length && !tags.length)) return <span className="text-gray-400 dark:text-zinc-600 text-xs">-</span>;
    
    const colors = {
      high: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20',
      medium: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/20',
      low: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20', 
      none: ''
    };

    const translateCat = (cat: string) => {
        if (!isEn) return cat;
        const map: Record<string, string> = { '成绩风险': 'Academic', '目标风险': 'Target', '任务风险': 'Task', '材料风险': 'Material', '沟通风险': 'Comm' };
        return map[cat] || cat;
    };

    return (
      <div className="flex flex-col items-start gap-1">
        <div className="flex flex-wrap gap-1">
           {categories.length > 0 ? (
             categories.map((cat, idx) => (
               <div key={idx} className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${colors[level]}`}>
                  <AlertTriangle className="w-3 h-3" />
                  {translateCat(cat)}
               </div>
             ))
           ) : (
             <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${colors[level]}`}>
                <AlertTriangle className="w-3 h-3" />
                {isEn ? 'Alert' : '需关注'}
             </div>
           )}
        </div>
      </div>
    );
  };

  const getPhaseBadge = (phase: string) => {
     let displayPhase = phase;
     if (isEn) {
         if (phase.includes('建档')) displayPhase = 'Phase 0 Onboarding';
         else if (phase.includes('规划')) displayPhase = 'Phase 1 Planning';
         else if (phase.includes('教学')) displayPhase = 'Phase 2 Tutoring';
         else if (phase.includes('申请')) displayPhase = 'Phase 3 App';
         else if (phase.includes('录取')) displayPhase = 'Phase 4 Admission';
         else if (phase.includes('复盘')) displayPhase = 'Phase 5 Review';
     }
     return <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-400/10 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-500/20 rounded-md text-xs font-medium whitespace-nowrap">{displayPhase}</span>;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 flex flex-col h-full min-h-[600px] relative transition-colors duration-300">
      
      {/* Create/Edit Student Modal */}
      {isAddModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-[550px] overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-white/10" onClick={e => e.stopPropagation()}>
               <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                     {editingId ? <Edit className="w-5 h-5 text-primary-600" /> : <Plus className="w-5 h-5 text-primary-600" />}
                     {editingId ? (isEn ? 'Edit Student Profile' : '编辑学生档案') : (isEn ? 'Create Student Profile' : '新建学生档案')}
                  </h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors">
                     <XCircle className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="p-6 space-y-6">
                  {/* Section 1: Basic Identity */}
                  <div>
                     <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-3 flex items-center gap-1.5">
                        <User className="w-4 h-4" /> {isEn ? 'Basic Identity' : '身份信息'}
                     </h4>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">{isEn ? 'Student Name' : '学生姓名'} <span className="text-red-500">*</span></label>
                           <input 
                              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 outline-none transition-all"
                              value={newStudentForm.name}
                              onChange={(e) => setNewStudentForm({...newStudentForm, name: e.target.value})}
                              placeholder={isEn ? "e.g. Alex Chen" : "例如：陈小明"}
                              autoFocus
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">{isEn ? 'Student ID' : '学号'} <span className="text-red-500">*</span></label>
                           <input 
                              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 outline-none transition-all"
                              value={newStudentForm.studentId}
                              onChange={(e) => setNewStudentForm({...newStudentForm, studentId: e.target.value})}
                              placeholder={isEn ? "Unique ID" : "唯一学号"}
                           />
                        </div>
                     </div>
                  </div>

                  <div className="h-px bg-gray-100 dark:bg-white/5 w-full"></div>

                  {/* Section 2: Planning Context */}
                  <div>
                     <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-3 flex items-center gap-1.5">
                        <Layers className="w-4 h-4" /> {isEn ? 'Planning Context' : '规划定位'}
                     </h4>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1"><GraduationCap className="w-3 h-3"/> {isEn ? 'Grade' : '年级'}</label>
                           <select 
                              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 outline-none"
                              value={newStudentForm.grade}
                              onChange={(e) => setNewStudentForm({...newStudentForm, grade: e.target.value})}
                           >
                              {['G9', 'G10', 'G11', 'G12'].map(g => <option key={g} value={g}>{g}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1"><Users className="w-3 h-3"/> {isEn ? 'Class' : '行政班级'}</label>
                           <input 
                              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 outline-none"
                              value={newStudentForm.class}
                              onChange={(e) => setNewStudentForm({...newStudentForm, class: e.target.value})}
                              placeholder={isEn ? "e.g. 10-A" : "例如：10-A"}
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1"><Globe className="w-3 h-3"/> {isEn ? 'Direction' : '申请方向'}</label>
                           <select 
                              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 outline-none"
                              value={newStudentForm.direction}
                              onChange={(e) => setNewStudentForm({...newStudentForm, direction: e.target.value})}
                           >
                              {['US', 'UK', 'HK', 'SG', 'Global'].map(d => <option key={d} value={d}>{d}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3"/> {isEn ? 'Current Phase' : '当前阶段'}</label>
                           <select 
                              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 outline-none"
                              value={newStudentForm.phase}
                              onChange={(e) => setNewStudentForm({...newStudentForm, phase: e.target.value as any})}
                           >
                              {FILTER_CONFIG.phase.options.filter(o => o !== '全部').map(p => (
                                 <option key={p} value={p}>{p}</option>
                              ))}
                           </select>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
                  <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors font-medium">{isEn ? 'Cancel' : '取消'}</button>
                  <button 
                     onClick={handleSaveStudent} 
                     disabled={!newStudentForm.name || !newStudentForm.studentId}
                     className="px-5 py-2 bg-primary-600 text-white text-sm font-bold rounded-lg hover:bg-primary-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {editingId ? (isEn ? 'Save Changes' : '保存修改') : (isEn ? 'Create Profile' : '建立档案')}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDeleteModalState({ isOpen: false, studentId: null })}>
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-[400px] p-6 animate-in zoom-in-95 duration-200 border dark:border-white/10" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {isEn ? 'Delete Student?' : '确认删除学生？'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 leading-relaxed">
                        {isEn 
                            ? 'This action is irreversible. Are you sure you want to permanently delete this student profile?' 
                            : '此操作是不可逆的。您确定要永久删除该学生档案吗？'}
                    </p>
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setDeleteModalState({ isOpen: false, studentId: null })}
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

      {/* Add Communication Modal */}
      {isCommModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-[500px] overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-white/10" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary-600" /> {isEn ? 'New Log' : '新增沟通记录'}
                    </h3>
                    <button onClick={() => setIsCommModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase mb-1.5">{isEn ? 'Student' : '关联学生'}</label>
                        <select 
                            className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 outline-none"
                            value={newCommLog.studentId}
                            onChange={(e) => setNewCommLog({...newCommLog, studentId: e.target.value})}
                        >
                            <option value="">{isEn ? 'Select Student...' : '请选择学生...'}</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase mb-1.5">{isEn ? 'Type' : '类型'}</label>
                            <select 
                                className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 outline-none"
                                value={newCommLog.type}
                                onChange={(e) => setNewCommLog({...newCommLog, type: e.target.value})}
                            >
                                <option value="Meeting">Meeting {isEn ? '' : '(面谈)'}</option>
                                <option value="Call">Call {isEn ? '' : '(通话)'}</option>
                                <option value="Email">Email {isEn ? '' : '(邮件)'}</option>
                                <option value="WeChat">WeChat {isEn ? '' : '(微信)'}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase mb-1.5">{isEn ? 'Time' : '时间'}</label>
                            <input 
                                type="datetime-local"
                                className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 outline-none"
                                value={newCommLog.date}
                                onChange={(e) => setNewCommLog({...newCommLog, date: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase mb-1.5">{isEn ? 'Participants' : '参与人'}</label>
                        <div className="flex flex-wrap gap-2">
                            {['Student', 'Mom', 'Dad', 'Counselor', 'Tutor'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => {
                                        const current = newCommLog.participants || [];
                                        const next = current.includes(p) ? current.filter(x => x !== p) : [...current, p];
                                        setNewCommLog({...newCommLog, participants: next});
                                    }}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors
                                        ${newCommLog.participants?.includes(p) 
                                        ? 'bg-primary-50 dark:bg-primary-400/10 border-primary-200 dark:border-primary-500/30 text-primary-700 dark:text-primary-300' 
                                        : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600'}
                                    `}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase mb-1.5">{isEn ? 'Topic' : '主题摘要'}</label>
                        <input 
                            className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 outline-none"
                            placeholder={isEn ? "e.g., G11 Course Selection..." : "例如：G11 选课确认..."}
                            value={newCommLog.title}
                            onChange={(e) => setNewCommLog({...newCommLog, title: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase mb-1.5">{isEn ? 'Details' : '详细记录'}</label>
                        <textarea 
                            className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 outline-none h-24 resize-none"
                            placeholder={isEn ? "Enter content..." : "输入沟通内容..."}
                            value={newCommLog.content}
                            onChange={(e) => setNewCommLog({...newCommLog, content: e.target.value})}
                        />
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
                    <button onClick={() => setIsCommModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">{isEn ? 'Cancel' : '取消'}</button>
                    <button onClick={handleSaveCommLog} className="px-5 py-2 bg-primary-600 text-white text-sm font-bold rounded-lg hover:bg-primary-700 shadow-sm transition-all">{isEn ? 'Save Log' : '保存记录'}</button>
                </div>
            </div>
        </div>
      )}

      <div className="p-5 border-b border-[#e5e0dc] dark:border-white/5 bg-white dark:bg-zinc-900 rounded-t-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{isEn ? 'Students' : '学生管理'}</h2>
          <div className="flex gap-3">
             <button 
                onClick={() => setIsCommModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-850 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
             >
                <MessageSquare className="w-4 h-4" /> {isEn ? 'Log Comm' : '新增沟通记录'}
             </button>
             <button 
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
             >
                <Plus className="w-4 h-4" /> {isEn ? 'New Student' : '新建学生'}
             </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center relative">
           {activeDropdown && (
             <div className="fixed inset-0 z-10 cursor-default" onClick={() => setActiveDropdown(null)}></div>
           )}

           <div className="relative group z-0">
             <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
             <input 
               type="text" 
               placeholder={isEn ? "Search Name" : "搜索姓名"}
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-zinc-850 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-primary-300 dark:focus:border-primary-700 focus:bg-white dark:focus:bg-zinc-800 transition-all w-64 text-gray-800 dark:text-zinc-200"
             />
             {searchQuery && (
               <button onClick={handleClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200">
                 <XCircle className="w-3 h-3" />
               </button>
             )}
           </div>
           
           <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>

           {(Object.keys(FILTER_CONFIG) as Array<keyof typeof filters>).map((key) => {
             const config = FILTER_CONFIG[key];
             const isActive = filters[key] !== '全部';
             const isOpen = activeDropdown === key;

             return (
               <div key={key as string} className="relative z-20">
                 <button 
                    onClick={() => toggleDropdown(key as string)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm border transition-colors
                      ${isActive || isOpen
                        ? 'bg-primary-50 dark:bg-primary-400/10 border-primary-200 dark:border-primary-500/30 text-primary-800 dark:text-primary-300' 
                        : 'bg-white dark:bg-zinc-850 border-gray-200 dark:border-white/10 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-white/20'
                      }`}
                 >
                    {config.label}: <span className={isActive ? 'font-semibold' : ''}>{filters[key]}</span>
                    {isActive ? (
                        <span onClick={(e) => handleClearDropdownFilter(key, e)} className="hover:text-primary-900 dark:hover:text-primary-200 flex items-center ml-1 p-0.5 rounded-full hover:bg-primary-100/50">
                           <XCircle className="w-3 h-3" />
                        </span>
                    ) : (
                        <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    )}
                 </button>

                 {isOpen && (
                   <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/10 rounded-lg shadow-lg dark:shadow-black/50 py-1 animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto ring-1 ring-black/5 dark:ring-white/5">
                      {config.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleFilterSelect(key, option)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between group"
                        >
                          {option}
                          {filters[key] === option && <Check className="w-3 h-3 text-primary-600 dark:text-primary-400" />}
                        </button>
                      ))}
                   </div>
                 )}
               </div>
             );
           })}

           <div className="relative z-20">
             <button 
               onClick={() => toggleDropdown('risk')}
               className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm border transition-colors cursor-pointer
                 ${isRiskFilterActive || activeDropdown === 'risk'
                   ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 font-medium ring-2 ring-red-100 dark:ring-red-900/20 ring-offset-1 dark:ring-offset-0' 
                   : 'bg-white dark:bg-zinc-850 border-gray-200 dark:border-white/10 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-white/20'
                 }`}
             >
                {riskFilterLabel} 
                {isRiskFilterActive ? (
                  <span onClick={handleClearRiskFilter} className="hover:text-red-900 dark:hover:text-red-300 flex items-center">
                    <XCircle className="w-3 h-3 ml-1" />
                  </span>
                ) : (
                  <ChevronDown className={`w-3 h-3 opacity-50 ml-1 transition-transform ${activeDropdown === 'risk' ? 'rotate-180' : ''}`} />
                )}
             </button>

             {activeDropdown === 'risk' && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/10 rounded-lg shadow-lg dark:shadow-black/50 py-1 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5 dark:ring-white/5">
                  {RISK_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleRiskSelect(option)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between group"
                    >
                      {option}
                      {activeRiskValue === option && <Check className="w-3 h-3 text-red-600 dark:text-red-400" />}
                    </button>
                  ))}
                </div>
             )}
           </div>

           {isAnyFilterActive && (
             <div className="flex items-center gap-2 ml-auto">
               <span className="text-xs text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-md font-medium border border-gray-200/50 dark:border-white/5">
                 {isEn ? `Filtered: ${filteredStudents.length} students` : `共筛选出 ${filteredStudents.length} 名学生`}
               </span>
               <button
                 onClick={handleClearAllFilters}
                 className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded-lg transition-colors font-medium cursor-pointer"
                 title={isEn ? "Reset all filters" : "清空全部筛选条件"}
               >
                 <XCircle className="w-3.5 h-3.5" />
                 {isEn ? 'Clear All' : '清空筛选'}
               </button>
             </div>
           )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white dark:bg-zinc-900 custom-scrollbar">
        {paginatedStudents.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#fbf7f5] dark:bg-zinc-900 sticky top-0 z-10 border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{isEn ? 'Student Info' : '学生信息'}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{isEn ? 'Phase/Status' : '阶段/状态'}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{isEn ? 'Target' : '目标摘要'}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{isEn ? 'Risks' : '风险/需关注'}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{isEn ? 'Next Task' : '下一步待办'}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{isEn ? 'Completion' : '完整度'}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider text-right">{isEn ? 'Actions' : '操作'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {paginatedStudents.map((student) => (
                <tr 
                  key={student.id} 
                  className={`hover:bg-primary-50/30 dark:hover:bg-white/5 transition-colors cursor-pointer group`}
                  onClick={() => onStudentClick(student.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={student.avatarUrl} 
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
                      />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{student.name}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">{student.grade} {student.class === '待定' ? (isEn ? 'TBD' : '待定') : student.class} • {student.direction}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col items-start gap-1.5">
                        {getPhaseBadge(student.phase)}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-sm text-gray-700 dark:text-zinc-300 font-medium block truncate max-w-[120px]">{translateTarget(student.targetSummary)}</span>
                  </td>
                  <td className="px-6 py-4">
                     {getRiskBadge(student.riskLevel, student.riskCategories, student.riskTags)}
                  </td>
                  <td className="px-6 py-4">
                     <div className="text-sm text-gray-800 dark:text-zinc-200">{translateNextTask(student.nextTask)}</div>
                     <div className={`text-xs mt-0.5 flex items-center gap-1 ${student.nextTaskDue === 'Today' || student.nextTaskDue === 'Overdue' ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-zinc-400'}`}>
                        <Clock className="w-3 h-3" /> {student.nextTaskDue}
                     </div>
                  </td>
                  <td className="px-6 py-4 align-middle">
                     {/* Dynamic Completeness Render */}
                     <div className="flex items-center gap-2 group/tooltip relative">
                       <div className="w-16 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ease-out ${
                                student.dataCompleteness < 40 ? 'bg-red-400' : 
                                student.dataCompleteness < 70 ? 'bg-orange-400' : 'bg-green-500'
                            }`} 
                            style={{width: `${student.dataCompleteness}%`}}
                          ></div>
                       </div>
                       <span className="text-xs text-gray-400 dark:text-zinc-500">{student.dataCompleteness}%</span>
                       
                       {/* Tooltip */}
                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-gray-900 text-white text-[10px] p-2 rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-50 whitespace-pre-wrap leading-tight">
                          {getCompletenessBreakdown(student.id, isEn)}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                       </div>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={(e) => handleEditClick(e, student)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-colors"
                            title={isEn ? "Edit" : "编辑"}
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={(e) => handleDeleteStudent(e, student.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title={isEn ? "Delete" : "删除"}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-zinc-400">
            <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-full mb-3">
              <Search className="w-6 h-6 text-gray-400 dark:text-zinc-500" />
            </div>
            <p className="text-sm font-medium">{isEn ? 'No results found' : '没有找到符合条件的搜索结果'}</p>
            {isAnyFilterActive && (
              <button 
                onClick={handleClearAllFilters} 
                className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                {isEn ? 'Clear filters' : '清除所有筛选'}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#e5e0dc] dark:border-white/5 flex justify-between items-center text-sm text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 rounded-b-2xl">
         <span>
            {isEn 
              ? `Showing ${filteredStudents.length > 0 ? startIndex + 1 : 0}-${Math.min(startIndex + ITEMS_PER_PAGE, filteredStudents.length)} of ${filteredStudents.length} students` 
              : `显示 ${filteredStudents.length > 0 ? startIndex + 1 : 0}-${Math.min(startIndex + ITEMS_PER_PAGE, filteredStudents.length)} 共 ${filteredStudents.length} 名学生`
            } 
         </span>
         <div className="flex gap-2">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-zinc-300 transition-colors text-xs font-medium"
            >
              {isEn ? 'Prev' : '上一页'}
            </button>
            <button 
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || totalPages === 0}
              className="px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-zinc-300 transition-colors text-xs font-medium"
            >
              {isEn ? 'Next' : '下一页'}
            </button>
         </div>
      </div>
    </div>
  );
};

export default StudentList;
