import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  User, GraduationCap, Medal, 
  Plus, Save, X, Sparkles, 
  Trash2, TrendingUp, Table, 
  FileText, ChevronDown, ChevronUp, Loader2,
  CheckCircle, Clock, Upload, AlertCircle, XCircle, File as FileIcon
} from '../../common/Icons';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useLanguage } from '../../../contexts/LanguageContext';

// --- Types ---
export type DataStatus = 'Verified' | 'Pending' | 'Rejected';

export interface Course {
  id: string;
  examTime: string;
  subject: string;
  grade: string;
  score: string;
}

export interface TermTranscript {
  id: string;
  gradeLevel: string;
  term: string;
  courses: Course[];
  isExpanded?: boolean;
}

export interface SubjectScore {
  id: string;
  subject: string;
  score: string;
  type: 'AP' | 'IB' | 'IGCSE' | 'TOEFL' | 'SAT' | 'ACT';
  date?: string;
  subScores?: string; 
  status: DataStatus; 
  rejectReason?: string;
  proof?: string; // Keep for backward compatibility if needed
  proofs?: string[]; // New: Multiple proofs
}

interface Activity {
  id: number;
  title: string;
  role: string;
  level: string;
  hours: string;
  grade: string;
  status: DataStatus;
  rejectReason?: string;
  proof?: string;
  proofs?: string[]; // New: Multiple proofs
}

// --- Constants & Mock Data ---
const INITIAL_TRANSCRIPT: TermTranscript[] = [
  {
    id: 't1', gradeLevel: 'AS Level', term: 'May/June 2023', isExpanded: false,
    courses: [
      { id: 'c1', examTime: '2023-05', subject: 'Mathematics', grade: 'a', score: '92' },
      { id: 'c2', examTime: '2023-05', subject: 'Physics', grade: 'a', score: '88' },
      { id: 'c3', examTime: '2023-05', subject: 'Chemistry', grade: 'a', score: '90' },
    ]
  },
  {
    id: 't2', gradeLevel: 'A2 Level', term: 'May/June 2024', isExpanded: true,
    courses: [
      { id: 'c4', examTime: '2024-05', subject: 'Mathematics', grade: 'A*', score: '96' },
      { id: 'c5', examTime: '2024-05', subject: 'Physics', grade: 'A*', score: '94' },
      { id: 'c6', examTime: '2024-05', subject: 'Chemistry', grade: 'A', score: '87' },
      { id: 'c7', examTime: '2024-05', subject: 'Further Mathematics', grade: 'A', score: '89' },
    ]
  },
];

const INITIAL_SCORES: SubjectScore[] = [
  { id: 's1', subject: 'TOEFL', score: '102', type: 'TOEFL', date: '2023-10', subScores: 'TOEFL', status: 'Verified' },
  { id: 's2', subject: 'SAT', score: '1450', type: 'SAT', date: '2023-12', subScores: 'SAT', status: 'Verified' },
  { id: 's3', subject: 'Calculus BC', score: '5', type: 'AP', date: '2024-05', subScores: 'AP', status: 'Verified' },
  { id: 's4', subject: 'Physics C: Mech', score: '5', type: 'AP', date: '2024-05', subScores: 'AP', status: 'Verified' },
  { id: 's5', subject: 'Physics C: E&M', score: '4', type: 'AP', date: '2024-05', subScores: 'AP', status: 'Verified' },
];

const INITIAL_ACTIVITIES: Activity[] = [
  { id: 1, title: 'School Robotics Club', role: 'Founder & President', level: 'School', hours: '4h/week', grade: '10, 11, 12', status: 'Verified' },
  { id: 2, title: 'AMC 12 Math Competition', role: 'Participant (Distinction)', level: 'National', hours: '-', grade: '11', status: 'Verified' },
  { id: 3, title: 'Community Elderly Care', role: 'Volunteer', level: 'Community', hours: '50h Total', grade: '10, 11', status: 'Verified' },
];

const StudentBaseInfo: React.FC = () => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  const [mounted, setMounted] = useState(false);

  // Data State
  const [profileData] = useState({
    school: 'Ascent International School',
    grade: 'G11',
    direction: 'US',
    studentId: '2025001',
    nationality: isEn ? 'China' : '中国'
  });

  const [transcript, setTranscript] = useState<TermTranscript[]>(INITIAL_TRANSCRIPT);
  const [subjectScores, setSubjectScores] = useState<SubjectScore[]>(INITIAL_SCORES);
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);

  // Modal States
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  
  // Form States
  const [newScoreForm, setNewScoreForm] = useState({ type: 'TOEFL', subject: '', score: '', date: '' });
  const [scoreProofFiles, setScoreProofFiles] = useState<File[]>([]);

  const [newActivityForm, setNewActivityForm] = useState({ title: '', role: '', level: 'School', hours: '', grade: '' });
  const [activityProofFiles, setActivityProofFiles] = useState<File[]>([]);

  // File Input Refs
  const scoreFileRef = useRef<HTMLInputElement>(null);
  const activityFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Handlers
  const handleToggleTerm = (id: string) => {
    setTranscript(prev => prev.map(t => t.id === id ? { ...t, isExpanded: !t.isExpanded } : t));
  };

  const handleScoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setScoreProofFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeScoreFile = (index: number) => {
    setScoreProofFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleActivityFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setActivityProofFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeActivityFile = (index: number) => {
    setActivityProofFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitScore = () => {
    if (!newScoreForm.score || scoreProofFiles.length === 0) return;
    const newScore: SubjectScore = {
      id: `s-${Date.now()}`,
      type: newScoreForm.type as any,
      subject: newScoreForm.subject || newScoreForm.type,
      score: newScoreForm.score,
      date: newScoreForm.date || new Date().toISOString().split('T')[0],
      subScores: newScoreForm.type,
      status: 'Pending',
      proofs: scoreProofFiles.map(f => f.name)
    };
    setSubjectScores([newScore, ...subjectScores]);
    setIsTestModalOpen(false);
    setNewScoreForm({ type: 'TOEFL', subject: '', score: '', date: '' });
    setScoreProofFiles([]);
  };

  const handleSubmitActivity = () => {
    if (!newActivityForm.title || activityProofFiles.length === 0) return;
    const newAct: Activity = {
      id: Date.now(),
      title: newActivityForm.title,
      role: newActivityForm.role,
      level: newActivityForm.level,
      hours: newActivityForm.hours,
      grade: newActivityForm.grade,
      status: 'Pending',
      proofs: activityProofFiles.map(f => f.name)
    };
    setActivities([newAct, ...activities]);
    setIsActivityModalOpen(false);
    setNewActivityForm({ title: '', role: '', level: 'School', hours: '', grade: '' });
    setActivityProofFiles([]);
  };

  // Render Helpers
  const renderStatusBadge = (status: DataStatus) => {
    if (status === 'Verified') {
      return (
        <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded border border-green-100 dark:border-green-500/20">
          <CheckCircle className="w-3 h-3" /> {isEn ? 'Verified' : '已核验'}
        </span>
      );
    }
    if (status === 'Rejected') {
      return (
        <span className="flex items-center gap-1 text-[10px] text-red-600 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-500/20 font-bold">
          <XCircle className="w-3 h-3 text-red-600" /> {isEn ? 'Rejected' : '已驳回'}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-100 dark:border-orange-500/20">
        <Clock className="w-3 h-3" /> {isEn ? 'Pending' : '审核中'}
      </span>
    );
  };

  return (
    <div className="p-6 h-full overflow-y-auto animate-in fade-in slide-in-from-bottom-2 custom-scrollbar bg-[#f9f8f6] dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- LEFT COLUMN --- */}
        <div className="space-y-6">
           {/* Basic Profile */}
           <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-[#e5e0dc] dark:border-white/5 transition-all hover:shadow-md">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-2 text-sm">
                     <User className="w-4 h-4 text-gray-500" /> {isEn ? 'Basic Profile' : '基础资料'}
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-full border border-green-100 dark:border-green-500/20">
                     <CheckCircle className="w-3 h-3" /> {isEn ? 'Verified' : '已认证'}
                  </div>
               </div>
               
               <div className="space-y-4 text-sm">
                  {/* Read Only Fields */}
                  <div className="flex justify-between items-center">
                     <span className="text-gray-500 dark:text-zinc-500">{isEn ? 'School' : '学校'}</span>
                     <span className="font-bold text-gray-900 dark:text-zinc-100 text-right max-w-[180px] truncate">{profileData.school}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-gray-500 dark:text-zinc-500">{isEn ? 'Grade' : '年级'}</span>
                     <span className="font-bold text-gray-900 dark:text-zinc-100">{profileData.grade}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-gray-500 dark:text-zinc-500">{isEn ? 'Student ID' : '学号'}</span>
                     <span className="font-bold text-gray-900 dark:text-zinc-100 font-mono">{profileData.studentId}</span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg text-xs text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-white/5 flex gap-2">
                     <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                     <span>{isEn ? 'To update basic info, please contact your school administrator.' : '如需修改基础信息，请联系教务老师。'}</span>
                  </div>
               </div>
           </div>
        </div>

        {/* --- RIGHT COLUMN (Spans 2) --- */}
        <div className="lg:col-span-2 space-y-6">
           
           {/* Transcript View Only */}
           <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-[#e5e0dc] dark:border-white/5 overflow-hidden flex flex-col">
               <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/30 dark:bg-white/5">
                  <h3 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
                     <GraduationCap className="w-5 h-5 text-violet-600 dark:text-violet-400" /> {isEn ? 'A-Level Official Results' : 'Alevel官考成绩'}
                  </h3>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                     <CheckCircle className="w-3 h-3 text-green-500" /> {isEn ? 'Synced with School System' : '已同步校务系统'}
                  </span>
               </div>

               {/* Transcript List */}
               <div className="p-5 bg-[#fcfcfc] dark:bg-zinc-950/50 space-y-3">
                  {transcript.map((term) => (
                     <div key={term.id} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                        <div 
                           className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                           onClick={() => handleToggleTerm(term.id)}
                        >
                           <div className="flex items-center gap-3">
                              {term.isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400"/> : <ChevronDown className="w-4 h-4 text-gray-400"/>}
                              <span className="font-bold text-gray-800 dark:text-zinc-200 text-sm">{term.gradeLevel} - {term.term}</span>
                              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                                 {term.courses.length} Courses
                              </span>
                           </div>
                        </div>
                        {term.isExpanded && (
                           <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left">
                                 <thead className="text-xs text-gray-500 dark:text-zinc-500 bg-gray-50/50 dark:bg-white/5 uppercase font-medium">
                                    <tr>
                                       <th className="px-4 py-2 w-1/4">{isEn ? 'Exam Time' : '考试时间'}</th>
                                       <th className="px-4 py-2 w-1/4">{isEn ? 'Subject' : '科目'}</th>
                                       <th className="px-4 py-2 w-1/4 text-center">{isEn ? 'Grade' : '等第'}</th>
                                       <th className="px-4 py-2 w-1/4 text-center">{isEn ? 'Score' : '分数'}</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {term.courses.map(course => (
                                       <tr key={course.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                          <td className="px-4 py-2 text-gray-600 dark:text-zinc-400">{course.examTime}</td>
                                          <td className="px-4 py-2 font-medium text-gray-800 dark:text-zinc-200">{course.subject}</td>
                                          <td className="px-4 py-2 text-center">
                                             <span className={`font-bold ${['A*','A','a'].includes(course.grade) ? 'text-green-600' : ['B','b'].includes(course.grade) ? 'text-violet-600 dark:text-violet-400' : 'text-orange-500'}`}>
                                                {course.grade}
                                             </span>
                                          </td>
                                          <td className="px-4 py-2 text-center text-gray-600 dark:text-zinc-400">{course.score}</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        )}
                     </div>
                  ))}
               </div>
           </div>

           {/* 5. Standardized Tests & Activities */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
               {/* Tests */}
               <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-[#e5e0dc] dark:border-white/5 transition-all hover:shadow-md flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-2 text-sm">
                        <Table className="w-4 h-4 text-violet-600 dark:text-violet-400" /> {isEn ? 'Standardized Tests' : '标化考试'}
                     </h3>
                     <button onClick={() => setIsTestModalOpen(true)} className="text-xs text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors">
                        <Plus className="w-3 h-3"/> {isEn ? 'Update Score' : '更新最新成绩'}
                     </button>
                  </div>
                  <div className="space-y-2.5 flex-1 overflow-y-auto">
                     {subjectScores.map(score => (
                        <div 
                           key={score.id} 
                           className={`p-3 rounded-lg border flex flex-col gap-1.5 ${
                              score.status === 'Pending' 
                                 ? 'bg-orange-50/50 border-orange-100 dark:bg-orange-500/5 dark:border-orange-500/20' 
                                 : score.status === 'Rejected'
                                 ? 'bg-red-50/60 border-red-200 dark:bg-red-950/20 dark:border-red-500/20'
                                 : 'bg-gray-50 dark:bg-zinc-800 border-gray-100 dark:border-white/5'
                           }`}
                        >
                           <div className="flex justify-between items-center">
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-sm font-bold text-gray-800 dark:text-zinc-200">{score.subject}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-white/10 rounded text-gray-500 dark:text-zinc-400">{score.subScores}</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <p className="text-[10px] text-gray-400">{score.date}</p>
                                    {renderStatusBadge(score.status)}
                                 </div>
                              </div>
                              <span className={`text-lg font-bold ${
                                 score.status === 'Pending' 
                                    ? 'text-orange-500' 
                                    : score.status === 'Rejected'
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-violet-600 dark:text-violet-400'
                              }`}>
                                 {score.score}
                              </span>
                           </div>

                           {score.status === 'Rejected' && (
                              <div className="p-2 bg-red-100/70 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-md text-[11px] text-red-800 dark:text-red-300 flex items-start gap-1.5 mt-1">
                                 <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                                 <div className="leading-snug">
                                    <span className="font-semibold text-red-900 dark:text-red-200">{isEn ? 'Rejection Note: ' : '驳回备注：'}</span>
                                    <span>{score.rejectReason || (isEn ? 'Materials did not meet verification criteria. Please resubmit.' : '材料未通过核验，请根据指导修改后重新提交。')}</span>
                                 </div>
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               </div>

               {/* Activities */}
               <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-[#e5e0dc] dark:border-white/5 transition-all hover:shadow-md flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-2 text-sm">
                        <Medal className="w-4 h-4 text-violet-600 dark:text-violet-400" /> {isEn ? 'Activities' : '活动列表'}
                     </h3>
                     <button onClick={() => setIsActivityModalOpen(true)} className="text-xs text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors">
                        <Plus className="w-3 h-3"/> {isEn ? 'Add Activity' : '添加新活动'}
                     </button>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto">
                     {activities.map(act => (
                        <div 
                           key={act.id} 
                           className={`p-3 rounded-lg border ${
                              act.status === 'Pending' 
                                 ? 'bg-orange-50/50 border-orange-100 dark:bg-orange-500/5 dark:border-orange-500/20' 
                                 : act.status === 'Rejected'
                                 ? 'bg-red-50/60 border-red-200 dark:bg-red-950/20 dark:border-red-500/20'
                                 : 'bg-gray-50 dark:bg-zinc-800/50 border-gray-100 dark:border-white/5'
                           }`}
                        >
                           <div className="flex justify-between items-start gap-2 mb-1">
                              <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 break-words">{act.title}</span>
                              {renderStatusBadge(act.status)}
                           </div>
                           <p className="text-[10px] text-gray-600 dark:text-zinc-400 break-words">{act.role} • {act.hours}</p>

                           {act.status === 'Rejected' && (
                              <div className="p-2 bg-red-100/70 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-md text-[11px] text-red-800 dark:text-red-300 flex items-start gap-1.5 mt-2">
                                 <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                                 <div className="leading-snug">
                                    <span className="font-semibold text-red-900 dark:text-red-200">{isEn ? 'Rejection Note: ' : '驳回备注：'}</span>
                                    <span>{act.rejectReason || (isEn ? 'Materials did not meet verification criteria. Please resubmit.' : '材料未通过核验，请根据指导修改后重新提交。')}</span>
                                 </div>
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               </div>

           </div>
        </div>
      </div>

      {/* --- TEST SUBMISSION MODAL --- */}
      {isTestModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsTestModalOpen(false)}>
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
               <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                     <TrendingUp className="w-5 h-5 text-violet-600" /> {isEn ? 'Update Test Score' : '更新最新成绩'}
                  </h3>
                  <button onClick={() => setIsTestModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
               </div>
               <div className="p-6 space-y-4">
                  <div className="p-3 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs rounded-lg border border-violet-100 dark:border-violet-500/20">
                     {isEn ? 'New scores will be marked as "Pending" until verified by your counselor.' : '提交的新成绩将显示为"审核中"，需等待顾问老师核验后生效。'}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{isEn ? 'Type' : '类型'}</label>
                        <select className="w-full bg-gray-50 dark:bg-zinc-800 border rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
                           value={newScoreForm.type} onChange={e => setNewScoreForm({...newScoreForm, type: e.target.value})}
                        >
                           <option>TOEFL</option><option>SAT</option><option>AP</option><option>IB</option><option>ACT</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{isEn ? 'Score' : '分数'}</label>
                        <input className="w-full bg-gray-50 dark:bg-zinc-800 border rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
                           placeholder="e.g. 1500" value={newScoreForm.score} onChange={e => setNewScoreForm({...newScoreForm, score: e.target.value})}
                        />
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{isEn ? 'Subject (Optional)' : '科目 (选填)'}</label>
                     <input className="w-full bg-gray-50 dark:bg-zinc-800 border rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
                        placeholder="e.g. Calculus BC" value={newScoreForm.subject} onChange={e => setNewScoreForm({...newScoreForm, subject: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        {isEn ? 'Proof of Evidence' : '上传成绩单截图 (Proof)'} <span className="text-red-500">*</span>
                     </label>
                     <input 
                        type="file" 
                        ref={scoreFileRef} 
                        className="hidden" 
                        onChange={handleScoreFileChange}
                        accept="image/*,.pdf"
                        multiple
                     />
                     <div 
                        onClick={() => scoreFileRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${scoreProofFiles.length > 0 ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                     >
                        <Upload className="w-6 h-6 mb-2 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{isEn ? 'Click to upload proof (Required)' : '点击上传证明文件 (必填)'}</span>
                        <span className="text-[10px] text-gray-400 mt-1">{isEn ? 'Supports multiple files' : '支持多文件上传'}</span>
                     </div>
                     
                     {/* File List */}
                     {scoreProofFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                           {scoreProofFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded border border-gray-100 dark:border-white/5">
                                 <div className="flex items-center gap-2 overflow-hidden">
                                    <FileIcon className="w-4 h-4 text-violet-500 flex-shrink-0" />
                                    <span className="text-xs text-gray-700 dark:text-zinc-300 truncate">{file.name}</span>
                                 </div>
                                 <button onClick={() => removeScoreFile(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <X className="w-4 h-4" />
                                 </button>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
               <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-900/50 flex justify-end gap-3 border-t border-gray-100 dark:border-white/5">
                  <button onClick={() => setIsTestModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 font-bold hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg">{isEn ? 'Cancel' : '取消'}</button>
                  <button 
                     onClick={handleSubmitScore} 
                     disabled={!newScoreForm.score || scoreProofFiles.length === 0}
                     className="px-6 py-2 bg-violet-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {isEn ? 'Submit for Review' : '提交审核'}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* --- ACTIVITY SUBMISSION MODAL --- */}
      {isActivityModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsActivityModalOpen(false)}>
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
               <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                     <Medal className="w-5 h-5 text-violet-600" /> {isEn ? 'Add Activity' : '添加新活动'}
                  </h3>
                  <button onClick={() => setIsActivityModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
               </div>
               <div className="p-6 space-y-4">
                  <div className="p-3 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs rounded-lg border border-violet-100 dark:border-violet-500/20">
                     {isEn ? 'Activities will be marked as "Pending" until verified.' : '新增活动需等待顾问审核后生效。'}
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{isEn ? 'Title' : '活动名称'}</label>
                     <input className="w-full bg-gray-50 dark:bg-zinc-800 border rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
                        placeholder="Activity Name" value={newActivityForm.title} onChange={e => setNewActivityForm({...newActivityForm, title: e.target.value})}
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{isEn ? 'Role' : '角色'}</label>
                        <input className="w-full bg-gray-50 dark:bg-zinc-800 border rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
                           placeholder="e.g. Founder" value={newActivityForm.role} onChange={e => setNewActivityForm({...newActivityForm, role: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{isEn ? 'Hours' : '时长'}</label>
                        <input className="w-full bg-gray-50 dark:bg-zinc-800 border rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
                           placeholder="e.g. 2h/week" value={newActivityForm.hours} onChange={e => setNewActivityForm({...newActivityForm, hours: e.target.value})}
                        />
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        {isEn ? 'Proof / Certificate' : '证明材料 (Proof)'} <span className="text-red-500">*</span>
                     </label>
                     <input 
                        type="file" 
                        ref={activityFileRef} 
                        className="hidden" 
                        onChange={handleActivityFileChange}
                        accept="image/*,.pdf"
                        multiple
                     />
                     <div 
                        onClick={() => activityFileRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${activityProofFiles.length > 0 ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                     >
                        <Upload className="w-6 h-6 mb-2 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{isEn ? 'Upload certificate (Required)' : '上传证书或照片 (必填)'}</span>
                        <span className="text-[10px] text-gray-400 mt-1">{isEn ? 'Supports multiple files' : '支持多文件上传'}</span>
                     </div>
                     
                     {/* File List */}
                     {activityProofFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                           {activityProofFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded border border-gray-100 dark:border-white/5">
                                 <div className="flex items-center gap-2 overflow-hidden">
                                    <FileIcon className="w-4 h-4 text-violet-500 flex-shrink-0" />
                                    <span className="text-xs text-gray-700 dark:text-zinc-300 truncate">{file.name}</span>
                                 </div>
                                 <button onClick={() => removeActivityFile(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <X className="w-4 h-4" />
                                 </button>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
               <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-900/50 flex justify-end gap-3 border-t border-gray-100 dark:border-white/5">
                  <button onClick={() => setIsActivityModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 font-bold hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg">{isEn ? 'Cancel' : '取消'}</button>
                  <button 
                     onClick={handleSubmitActivity} 
                     disabled={!newActivityForm.title || activityProofFiles.length === 0}
                     className="px-6 py-2 bg-violet-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {isEn ? 'Submit for Review' : '提交审核'}
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default StudentBaseInfo;