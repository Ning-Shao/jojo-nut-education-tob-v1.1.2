
import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, User, FolderOpen, 
  Compass, FileText, Quote, Trophy, TrendingDown,
  Clock, Paperclip, MessageCircle,
  Zap, AlertCircle, ChevronDown, ChevronUp, Loader2, RefreshCw, CheckCircle, XCircle
} from '../common/Icons';
import { GoogleGenAI } from "@google/genai";
import { DetailTab, RiskLevel } from '../../types';
import { mockStudents } from './StudentList';
import StudentBasicInfo from './StudentBasicInfo';
import StudentMaterials, { INITIAL_FILES, FileItem } from './StudentMaterials';
import StudentPlanning from './StudentPlanning';
import StudentEssays from './StudentEssays';
import StudentRecommendations from './StudentRecommendations';
import StudentOfferTracking from './StudentOfferTracking';
import StudentCommunication from './StudentCommunication';
import { useLanguage } from '../../contexts/LanguageContext';

interface StudentDetailProps {
  studentId: string;
  onBack: () => void;
  onNavigateToTranscript: (studentId: string) => void;
}

// --- Enhanced Risk & Health Types ---
interface RiskDimension {
  id: string;
  label: string;
  icon: React.ElementType;
  level: RiskLevel | 'unknown'; // Added 'unknown'
  statusText: string; 
  evidence: string;
  action: string;
  trend: 'up' | 'down' | 'stable';
}

// Toast Component
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-lg shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
    <CheckCircle className="w-4 h-4 text-green-400 dark:text-green-600" />
    <span className="text-sm font-medium">{message}</span>
    <button onClick={onClose} className="text-gray-400 dark:text-zinc-500 hover:text-white dark:hover:text-zinc-900"><XCircle className="w-3 h-3" /></button>
  </div>
);

const StudentDetail: React.FC<StudentDetailProps> = ({ studentId, onBack, onNavigateToTranscript }) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('BasicInfo');
  const [materialsInitialCategory, setMaterialsInitialCategory] = useState<string>('transcript');
  const [isPanelExpanded, setIsPanelExpanded] = useState(false); 
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Lifted Materials State
  const [materialFiles, setMaterialFiles] = useState<FileItem[]>(INITIAL_FILES);

  const { language } = useLanguage();
  const isEn = language === 'en-US';
  
  // Find the student
  const student = mockStudents.find(s => s.id === studentId);

  // --- Initial Static Data (Mock) with Localization ---
  const initialRisks: RiskDimension[] = useMemo(() => [
    { 
      id: 'academic', 
      label: isEn ? 'Academic' : '学术', 
      icon: TrendingDown, level: 'high', 
      statusText: isEn ? 'Grade Drop' : '成绩异常下滑',
      evidence: isEn ? 'GPA dropped by 0.3 in G11 Spring; TOEFL prep stalled (14 days overdue).' : 'G11下学期 GPA 较上学期下滑 0.3，且 TOEFL 备考进度停滞（已逾期14天）。', 
      action: isEn ? 'Schedule academic review meeting.' : '安排学术面谈，分析课程难度匹配度。',
      trend: 'down'
    },
    { 
      id: 'target', 
      label: isEn ? 'Target' : '目标', 
      icon: Compass, level: 'medium', 
      statusText: isEn ? 'Aggressive' : '选校方案激进',
      evidence: isEn ? '90% Reach schools, lacks Safety options. Major undecided.' : '选校清单中 Reach 校占比达 90%，缺乏 Safety 方案，且申请专业未定。', 
      action: isEn ? 'Add at least 2 safety schools.' : '建议在下周面谈中强制添加至少 2 所保底院校。',
      trend: 'stable'
    },
    { 
      id: 'task', 
      label: isEn ? 'Task' : '任务', 
      icon: Clock, level: 'none', 
      statusText: isEn ? 'On Track' : '进度完全正常',
      evidence: isEn ? 'Recent tasks (PS V1, Brag Sheet) completed on time.' : '所有近期任务（个人陈述 V1、Brag Sheet）均在计划内完成。', 
      action: isEn ? 'Keep it up.' : '继续保持。',
      trend: 'up'
    },
    { 
      id: 'material', 
      label: isEn ? 'Material' : '材料', 
      icon: Paperclip, level: 'low', 
      statusText: isEn ? 'Rec Pending' : '推荐信待催办',
      evidence: isEn ? 'Mr. Li (Math) hasn\'t confirmed rec letter request (3 days).' : 'Mr. Li (Math) 尚未点击推荐信确认邮件，已等待 3 天。', 
      action: isEn ? 'Send reminder.' : '一键发送催办短信。',
      trend: 'down'
    },
    { 
      id: 'comm', 
      label: isEn ? 'Comm' : '沟通', 
      icon: MessageCircle, level: 'high', 
      statusText: isEn ? 'Disengaged' : '家校互动断连',
      evidence: isEn ? 'Student inactive for 14 days; Parent email regarding budget unanswered.' : '学生连续 14 天未登录，家长上周关于“预算”的咨询邮件尚未回复。', 
      action: isEn ? 'Call parent immediately.' : '立即电话回访，缓解家长焦虑。',
      trend: 'down'
    },
  ], [isEn]);

  const [riskDimensions, setRiskDimensions] = useState<RiskDimension[]>(initialRisks);

  React.useEffect(() => {
      if (toastMessage) {
          const timer = setTimeout(() => setToastMessage(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [toastMessage]);

  // Update risks when language changes
  React.useEffect(() => {
      setRiskDimensions(initialRisks);
  }, [initialRisks]);

  const getDimensionIcon = (id: string) => {
    switch (id) {
      case 'academic': return TrendingDown;
      case 'target': return Compass;
      case 'task': return Clock;
      case 'material': return Paperclip;
      case 'comm': return MessageCircle;
      default: return AlertCircle;
    }
  };

  const handleDeepDiagnosis = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!student) return;
    
    setIsDiagnosing(true);
    setIsPanelExpanded(true); 

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Role: International School College Counselor Supervisor.
        Task: Diagnose the student's application status across 5 dimensions based on the provided profile.
        
        Student Profile:
        ${JSON.stringify(student)}
        
        Dimensions to Diagnose:
        1. Academic (学术)
        2. Target (目标)
        3. Task (任务)
        4. Material (材料)
        5. Communication (沟通)
        
        Output Requirements:
        - Return a JSON array of 5 objects.
        - Each object must have keys: "id" (one of: academic, target, task, material, comm), "label" (in ${isEn ? 'English' : 'Simplified Chinese'}), "level", "statusText", "evidence", "action", "trend".
        - "level" values: "high" (High Risk), "medium" (Medium Risk), "low" (Low Risk), "none" (Normal/Good), "unknown" (Insufficient Info).
        - If information for a dimension is missing or cannot be inferred from the student profile (e.g. unknown communication history), set "level" to "unknown" and "statusText" to "${isEn ? 'Info Missing' : '信息不足'}".
        - "statusText": Max 15 chars summary in ${isEn ? 'English' : 'Chinese'}.
        - "evidence": 1-2 sentences explaining the risk or status in ${isEn ? 'English' : 'Chinese'}.
        - "action": Specific recommendation in ${isEn ? 'English' : 'Chinese'}.
        - "trend": "up", "down", or "stable".
        
        Language: ${isEn ? 'English' : 'Simplified Chinese'}.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      if (response.text) {
        const rawData = JSON.parse(response.text);
        const mappedData = rawData.map((item: any) => ({
          ...item,
          icon: getDimensionIcon(item.id)
        }));
        setRiskDimensions(mappedData);
      }
    } catch (error) {
      console.error("Diagnosis error:", error);
      alert(isEn ? "AI Diagnosis unavailable." : "AI 诊断服务暂时不可用，请稍后重试。");
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Handler to add verified proof to materials
  const handleAddVerifiedProof = (fileName: string, type: 'score' | 'activity') => {
      const newFile: FileItem = {
          id: `proof-${Date.now()}`,
          name: fileName,
          date: new Date().toISOString().split('T')[0],
          size: '0.5MB', // Mock size
          // Determine category and file type based on input context
          category: type === 'score' ? 'certs' : 'activities',
          type: fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
          uploader: 'Teacher' // Added uploader property
      };
      setMaterialFiles(prev => [newFile, ...prev]);
      setToastMessage(isEn ? "Proof verified & saved to Materials" : "证明材料已核验并自动归档至资料夹");
  };

  const handleAddFile = (file: FileItem, showToast: boolean = true) => {
      setMaterialFiles(prev => [file, ...prev]);
      if (showToast) {
        setToastMessage(isEn ? "File saved to Materials" : "文件已保存至资料夹");
      }
  };

  if (!student) return <div className="p-8">{isEn ? 'Student not found.' : '未找到该学生信息。'}</div>;

  const tabs: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
    { id: 'BasicInfo', label: isEn ? '1. Basic Info' : '1. 基础信息', icon: <User className="w-4 h-4" /> },
    { id: 'Materials', label: isEn ? '2. Materials' : '2. 申请资料夹', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'Planning', label: isEn ? '3. Planning' : '3. 升学规划', icon: <Compass className="w-4 h-4" /> },
    { id: 'Essays', label: isEn ? '4. Essays' : '4. 文书助手', icon: <FileText className="w-4 h-4" /> },
    { id: 'Recommendations', label: isEn ? '5. Recommendations' : '5. 推荐信助手', icon: <Quote className="w-4 h-4" /> },
    { id: 'OfferTracking', label: isEn ? '6. Offers' : '6. Offer追踪', icon: <Trophy className="w-4 h-4" /> },
    { id: 'Communication', label: isEn ? '7. Communication' : '7. 沟通记录', icon: <MessageCircle className="w-4 h-4" /> },
  ];

  const getLevelColors = (level: RiskLevel | 'unknown') => {
    switch(level) {
      case 'high': return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: 'text-red-500' };
      case 'medium': return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', icon: 'text-orange-500' };
      case 'low': return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: 'text-blue-500' };
      case 'unknown': return { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', icon: 'text-gray-400' };
      default: return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', icon: 'text-green-500' };
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f9f8f6] dark:bg-zinc-950 transition-colors duration-300 relative">
      
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      {/* 1. Slim Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-[#e5e0dc] dark:border-white/5 px-6 py-3 flex-shrink-0 flex justify-between items-center z-40 transition-colors">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
               <ArrowLeft className="w-3.5 h-3.5" /> {isEn ? 'Back to List' : '返回列表'}
            </button>
            <div className="flex items-center gap-3">
               <img src={student.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full border border-gray-100 dark:border-white/10" />
               <div>
                  <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{student.name}</h1>
                  <p className="text-[10px] text-gray-400">{student.grade} • {isEn && (student.targetSummary === '待规划' || student.targetSummary === '待定') ? 'TBD' : student.targetSummary}</p>
               </div>
            </div>
         </div>
         
         <div className="flex items-center gap-8">
            {/* Quick Status Pill */}
            <div className="flex items-center gap-4">
               {riskDimensions.map(dim => (
                  <div key={dim.id} className="flex flex-col items-center gap-0.5">
                     <div className={`w-1.5 h-1.5 rounded-full ${getLevelColors(dim.level).bg.replace('bg-','bg-').replace('-50','-500')}`}></div>
                     <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tighter">{dim.label}</span>
                  </div>
               ))}
            </div>
         </div>
      </header>

      {/* 2. AI Clinical Dashboard */}
      <div className={`bg-white dark:bg-zinc-900 border-b border-[#e5e0dc] dark:border-white/5 transition-all duration-300 overflow-hidden z-30 shadow-sm
         ${isPanelExpanded ? 'max-h-[400px]' : 'max-h-12'}
      `}>
         {/* Toggle Bar */}
         <div 
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            className="px-6 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/5 group"
         >
            <div className="flex items-center gap-3">
               <button 
                  onClick={handleDeepDiagnosis}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
               >
                  {isDiagnosing ? <Loader2 className="w-3 h-3 animate-spin text-white" /> : <Zap className="w-3 h-3 text-yellow-300" />}
                  {isDiagnosing ? (isEn ? 'Diagnosing...' : '正在诊断中...') : (isEn ? 'AI Deep Diagnosis' : 'AI 状态深度诊断')}
               </button>
               
               {!isPanelExpanded && !isDiagnosing && (
                  <div className="flex gap-3 animate-in fade-in slide-in-from-left-2">
                     {riskDimensions.filter(r => r.level === 'high').map(r => (
                        <span key={r.id} className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                           <AlertCircle className="w-3.5 h-3.5" /> {r.statusText}
                        </span>
                     ))}
                  </div>
               )}
            </div>
            <div className="flex items-center gap-3">
               <button 
                  onClick={handleDeepDiagnosis}
                  className="p-1 rounded-full text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  title={isEn ? "Refresh Diagnosis" : "重新诊断"}
               >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
               </button>
               <div className="flex items-center gap-2 text-xs font-bold text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {isPanelExpanded ? (isEn ? 'Collapse' : '收起详情') : (isEn ? 'Expand' : '展开深度诊断')}
                  {isPanelExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
               </div>
            </div>
         </div>

         {/* Expanded Content */}
         <div className="px-8 pb-8 pt-2">
            <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
               {isEn ? 'Dimension Details' : '维度诊断详情 (Dimensions)'}
            </h4>
            
            {isDiagnosing ? (
               <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-300" />
                  <p className="text-xs">{isEn ? `AI is analyzing ${student.name}'s full profile...` : `AI 正在分析 ${student.name} 的全量数据...`}</p>
               </div>
            ) : (
               <div className="grid grid-cols-5 gap-3">
                  {riskDimensions.map(dim => {
                     const colors = getLevelColors(dim.level);
                     return (
                        <div key={dim.id} className={`p-3 rounded-xl border bg-opacity-50 dark:bg-opacity-10 ${colors.bg} ${colors.border} flex flex-col gap-3 transition-transform hover:scale-[1.02] relative group`}>
                           <div className="flex items-center justify-between">
                              <div className={`p-1.5 rounded-lg bg-white dark:bg-zinc-800 shadow-sm ${colors.icon}`}>
                                 <dim.icon className="w-3.5 h-3.5" />
                              </div>
                              <span className={`text-[10px] font-bold ${colors.text}`}>{dim.statusText}</span>
                           </div>
                           <div className="min-w-0">
                              <p className="text-xs font-black text-gray-900 dark:text-zinc-100 mb-1">{dim.label} {isEn ? 'Status' : '状态'}</p>
                              <p className="text-[10px] text-gray-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">{dim.evidence}</p>
                           </div>
                           {dim.level === 'unknown' && (
                              <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                 <span className="text-[10px] font-bold text-gray-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 px-2 py-1 rounded shadow-sm border border-gray-200 dark:border-white/10">{isEn ? 'Info Missing' : '信息不足'}</span>
                              </div>
                           )}
                        </div>
                     );
                  })}
               </div>
            )}
         </div>
      </div>

      {/* 3. Navigation Tabs */}
      <nav className="bg-white dark:bg-zinc-900 border-b border-[#e5e0dc] dark:border-white/5 px-6 transition-colors">
         <div className="flex gap-8">
            {tabs.map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2
                     ${activeTab === tab.id 
                        ? 'border-primary-600 text-primary-900 dark:text-primary-300 dark:border-primary-400' 
                        : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200'}
                  `}
               >
                  {tab.icon}
                  {tab.label}
               </button>
            ))}
         </div>
      </nav>

      {/* 4. Content Area */}
      <main className="flex-1 overflow-y-auto p-10 relative bg-[#f9f8f6] dark:bg-zinc-950 transition-colors">
         <div className="w-full h-full">
            {activeTab === 'BasicInfo' && (
               <StudentBasicInfo 
                  student={student} 
                  onNavigateToTranscript={() => {
                     setMaterialsInitialCategory('alevel');
                     setActiveTab('Materials');
                  }}
                  onAddProof={handleAddVerifiedProof}
               />
            )}
            {/* Pass lifted state to StudentMaterials */}
            {activeTab === 'Materials' && <StudentMaterials files={materialFiles} onUpdateFiles={setMaterialFiles} initialCategory={materialsInitialCategory} />}
            {activeTab === 'Planning' && <StudentPlanning student={student} />}
            {activeTab === 'Essays' && <StudentEssays student={student} onAddFile={handleAddFile} />}
            {activeTab === 'Recommendations' && <StudentRecommendations />}
            {activeTab === 'OfferTracking' && <StudentOfferTracking />}
            {activeTab === 'Communication' && <StudentCommunication />}
         </div>
      </main>
    </div>
  );
};

export default StudentDetail;
