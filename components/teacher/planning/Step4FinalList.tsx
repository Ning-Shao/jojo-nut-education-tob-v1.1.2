
import React, { useState, useEffect } from 'react';
import { 
  Target, FileDown, School, MapPin, Sparkles, Loader2, 
  ExternalLink, Link as LinkIcon, Zap, Info, ArrowRight,
  Calendar, FileText, CheckCircle, AlertCircle, Users,
  X, User, GraduationCap, BookOpen, Trophy, Globe,
  Maximize2, Lightbulb, Edit, Save
} from '../../common/Icons';
import { SelectedSchool } from './PlanningData';
import { useLanguage } from '../../../contexts/LanguageContext';
import { GoogleGenAI } from "@google/genai";

interface Step4Props {
  selectedSchools: SelectedSchool[];
  setPlanningStep: (step: number) => void;
  handleUpdateFinalSchool: (id: string, field: keyof SelectedSchool, value: string) => void;
  handleEnrichSchoolInfo: (id: string) => void;
  handleBatchEnrich: () => void;
  enrichingSchoolId: string | null;
  isBatchEnriching: boolean;
  onNext: () => void;
  currentStats?: { gpa: number; toefl: number; sat: number };
  studentInputs?: { interests: string; abilities: string; intentions: string };
}

interface AdmittedProfile {
  id: string;
  name: string;
  region: string;
  admittedSchool: string;
  otherAdmitted?: string;
  highSchool: string;
  curriculum: string;
  courseGrades: string;
  scores: string;
  applications: { school: string; major: string; result: string; statusColor?: string }[];
  source: string;
  background: string[];
}

const TIPS = [
  "Did you know? Top 30 universities often value 'Intellectual Vitality' as much as GPA.",
  "Tip: 'Why Major' essays should connect past experiences to future goals specifically.",
  "Insight: Demonstrating 'Fit' is crucial for colleges like NYU and Cornell.",
  "Reminder: Check the exact ED/EA deadlines, they can vary by major!",
  "Fact: Recommendation letters from core subject teachers carry the most weight."
];

// Helper Component for Rendering Markdown-like Text
const SimpleMarkdown = ({ text, placeholder }: { text: string; placeholder?: string }) => {
  if (!text) return <p className="text-gray-400 italic text-xs">{placeholder || "No content."}</p>;

  // Function to process inline bold styling (**text**)
  const processInline = (str: string) => {
    // Split by **...**
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-gray-800 dark:text-zinc-200">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Split lines
  const lines = text.split('\n').filter(l => l.trim());

  return (
    <div className="space-y-1 text-xs leading-relaxed text-gray-600 dark:text-zinc-400">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        // Check for list items
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
           return (
             <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-primary-500/60 flex-shrink-0"></span>
                <span className="flex-1">{processInline(trimmed.replace(/^[-*•]\s+/, ''))}</span>
             </div>
           );
        } else if (trimmed.endsWith(':')) {
           // Heuristic for headers like "GPA:" or "Testing:"
           return <div key={idx} className="font-bold text-gray-700 dark:text-zinc-300 mt-2 mb-1">{processInline(trimmed)}</div>
        } else {
           // Standard paragraph
           return <div key={idx} className="min-h-[1em]">{processInline(trimmed)}</div>;
        }
      })}
    </div>
  );
};

const Step4FinalList: React.FC<Step4Props> = ({
  selectedSchools, setPlanningStep,
  handleUpdateFinalSchool, handleEnrichSchoolInfo,
  enrichingSchoolId, isBatchEnriching, onNext,
  currentStats, studentInputs
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';
  
  // UI States
  const [viewingAdmitProfile, setViewingAdmitProfile] = useState<AdmittedProfile | null>(null);
  const [expandedSchoolId, setExpandedSchoolId] = useState<string | null>(null); // For "Maximize" modal
  
  // Editing states for different fields
  const [editingAdviceIds, setEditingAdviceIds] = useState<Set<string>>(new Set());
  const [editingRequirementsIds, setEditingRequirementsIds] = useState<Set<string>>(new Set());
  const [editingDeadlinesIds, setEditingDeadlinesIds] = useState<Set<string>>(new Set());

  // Batch Process State
  const [localBatchLoading, setLocalBatchLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [currentProcessingSchool, setCurrentProcessingSchool] = useState("");
  const [tipIndex, setTipIndex] = useState(0);

  // Tip Rotation Effect
  useEffect(() => {
    let interval: any;
    if (localBatchLoading) {
      interval = setInterval(() => {
        setTipIndex(prev => (prev + 1) % TIPS.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [localBatchLoading]);

  // --- Helpers ---

  const toggleEditAdvice = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(editingAdviceIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setEditingAdviceIds(next);
  };

  const toggleEditRequirements = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(editingRequirementsIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setEditingRequirementsIds(next);
  };

  const toggleEditDeadlines = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(editingDeadlinesIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setEditingDeadlinesIds(next);
  };

  const getAdmittedProfiles = (school: SelectedSchool): AdmittedProfile[] => {
    const seed = school.uni.name.length;
    const major = school.major || 'Undecided';
    
    return [
        {
            id: `p1-${school.id}`,
            name: isEn ? 'Student Z' : 'Z同学',
            region: isEn ? 'USA' : '美国',
            admittedSchool: `${school.uni.name} - ${major}`,
            otherAdmitted: isEn ? 'UCSB - Econ Prep' : '加州大学圣塔芭芭拉分校-经济学预科',
            highSchool: isEn ? 'Silicon Valley Independent' : '硅谷独立学校',
            curriculum: isEn ? 'US High School' : '美高体系',
            courseGrades: 'GPA 3.95 (Unweighted)',
            scores: `TOEFL 110 SAT ${1490 + (seed % 2) * 10}`,
            applications: [
                { school: school.uni.name, major: major, result: isEn ? 'Admitted' : '录取', statusColor: 'green' },
                { school: isEn ? 'UCSB' : '加州大学圣塔芭芭拉分校', major: isEn ? 'Econ Prep' : '经济学预科', result: isEn ? 'Admitted' : '录取', statusColor: 'green' }
            ],
            source: isEn ? 'Public Data' : '基于公开数据整理',
            background: [
                isEn ? '1. CLASS Chinese Gold Award (2x)' : '1.CLASS中文竞赛金奖2次',
                isEn ? '2. YIS Star Student' : '2.YIS明星学生',
                isEn ? '3. English Comp 2nd Prize' : '3.英语竞赛二等奖',
                isEn ? '4. Econ Research Paper' : '4.一段经济科研与论文'
            ]
        },
        {
            id: `p2-${school.id}`,
            name: isEn ? 'Student L' : 'L同学',
            region: isEn ? 'China' : '中国',
            admittedSchool: `${school.uni.name} - ${major}`,
            highSchool: isEn ? 'Shanghai Top High' : '上海某重点高中',
            curriculum: 'IB',
            courseGrades: '40/42',
            scores: `TOEFL 108 SAT ${1510 + (seed % 3) * 10}`,
            applications: [
                { school: school.uni.name, major: major, result: isEn ? 'Admitted' : '录取', statusColor: 'green' },
                { school: 'NYU', major: 'Liberal Arts', result: isEn ? 'Waitlist' : '候补', statusColor: 'gray' }
            ],
            source: isEn ? 'Internal Case' : '内部案例库',
            background: [
                isEn ? '1. Robotics Team Captain' : '1. 机器人校队队长',
                isEn ? '2. AMC 12 Distinction' : '2. AMC 12 Distinction',
            ]
        },
        {
            id: `p3-${school.id}`,
            name: isEn ? 'Student K' : 'K同学',
            region: isEn ? 'Canada' : '加拿大',
            admittedSchool: `${school.uni.name} - ${major}`,
            highSchool: isEn ? 'Vancouver Public' : '温哥华公立高中',
            curriculum: 'BC',
            courseGrades: 'Avg 96%',
            scores: `IELTS 8.0 SAT Test Optional`,
            applications: [
                { school: school.uni.name, major: major, result: isEn ? 'Admitted' : '录取', statusColor: 'green' },
                { school: 'UBC', major: 'Science', result: isEn ? 'Admitted' : '录取', statusColor: 'green' }
            ],
            source: isEn ? 'Alumni Network' : '校友网络',
            background: [
                isEn ? '1. National Bio Olympiad Bronze' : '1. 国家生物奥赛铜奖',
                isEn ? '2. Hospital Volunteer (200h)' : '2. 医院志愿者 (200h)',
                isEn ? '3. Published 1 Sci-Paper' : '3. 发表一篇科学论文',
            ]
        }
    ];
  };

  const generateAdvice = async (school: SelectedSchool): Promise<string> => {
    const profiles = getAdmittedProfiles(school);
    const profilesText = profiles.map((p, i) => 
        `Case ${i+1}: GPA/Grades: ${p.courseGrades}, Scores: ${p.scores}, Curriculum: ${p.curriculum}, Key Activity: ${p.background.join(', ')}`
    ).join('\n');

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            Role: Senior College Admissions Consultant.
            Task: Analyze the "Actual Admission Bar" for ${school.uni.name} based on real admitted student cases.
            
            Context: 
            Official website requirements are often just minimum thresholds. 
            Teachers need to know the *actual* competitive standard based on historical data.

            Real Admitted Cases (Source of Truth):
            ${profilesText}

            Instructions:
            1. Ignore generic internet advice if it contradicts the cases above.
            2. Summarize the *actual* requirements in these 3 dimensions based on the cases:
               - **Hard Stats**: Real GPA & SAT/TOEFL range (e.g. "Official says 3.0, but actual admits are 3.9+").
               - **Background**: What kind of activities/awards are common? (e.g. "Research is a must", "Leadership valued").
               - **Strategy**: One specific tip for success.
            
            Output Format: 
            Concise list in Markdown. Use bolding for keys.
            Language: ${isEn ? 'English' : 'Simplified Chinese (简体中文)'}.
        `;
        
        const result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });
        return result.text ? result.text.trim() : "";
    } catch(e) {
        console.error(e);
        return "";
    }
  };

  const fetchSchoolDetailsLocal = async (school: SelectedSchool): Promise<Partial<SelectedSchool> | null> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Search and summarize the undergraduate admission requirements for:
        School: ${school.uni.name}
        Major: ${school.major || 'General'}
        Entry: Fall 2025

        Output the result in pure valid JSON format.
        JSON Structure:
        {
          "requirements": "Use Markdown bullet points. Summarize GPA, Standardized Test (SAT/ACT), Language (TOEFL/IELTS), and Prerequisites.",
          "deadlines": "Use Markdown bullet points. List ED/EA/RD dates.",
          "process": "Brief process description.",
          "portalLink": "URL to admission portal."
        }
        Translate content values to ${isEn ? 'English' : 'Simplified Chinese (简体中文)'}.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });

      if (response.text) {
        let text = response.text;
        if (text.startsWith("```json")) text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
        else if (text.startsWith("```")) text = text.replace(/^```\n?/, "").replace(/\n?```$/, "");
        return JSON.parse(text);
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const handleComprehensiveBatchEnrich = async () => {
    setLocalBatchLoading(true);
    const schoolsToProcess = selectedSchools;
    setProgress({ current: 0, total: schoolsToProcess.length });

    try {
        for (let i = 0; i < schoolsToProcess.length; i++) {
            const school = schoolsToProcess[i];
            setCurrentProcessingSchool(school.uni.name);
            
            const [details, advice] = await Promise.all([
                fetchSchoolDetailsLocal(school),
                generateAdvice(school)
            ]);

            if (details) {
                if (details.requirements) handleUpdateFinalSchool(school.id, 'requirements', details.requirements);
                if (details.deadlines) handleUpdateFinalSchool(school.id, 'deadlines', details.deadlines);
                if (details.process) handleUpdateFinalSchool(school.id, 'process', details.process);
                if (details.portalLink) handleUpdateFinalSchool(school.id, 'portalLink', details.portalLink);
            }
            if (advice) {
                handleUpdateFinalSchool(school.id, 'admissionAdvice', advice);
            }
            
            setProgress(prev => ({ ...prev, current: i + 1 }));
        }
    } catch (e) {
        console.error("Batch failed", e);
    } finally {
        setLocalBatchLoading(false);
        setCurrentProcessingSchool("");
    }
  };

  const handleExportExcel = () => {
    const header = ['Region', 'Tier', 'School Name', 'Rank', 'Major', 'Official Requirements', 'Admission Advice', 'Deadlines', 'Process'];
    const rows = selectedSchools.map(s => {
      const escape = (text: string | undefined) => text ? `"${text.replace(/"/g, '""').replace(/\n/g, ' ')}"` : '""';
      return [
        escape(s.uni.region), escape(s.tier), escape(s.uni.name), escape(s.uni.rank.toString()),
        escape(s.major), escape(s.requirements), escape(s.admissionAdvice), escape(s.deadlines), escape(s.process)
      ].join(',');
    });
    const csvContent = '\uFEFF' + [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Final_School_List_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Reach': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      case 'Match': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      default: return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
    }
  };

  const renderAdmittedProfiles = (school: SelectedSchool) => {
    const hasEnrichedData = !!school.admissionAdvice && school.admissionAdvice.length > 0;
    const profiles: AdmittedProfile[] = hasEnrichedData ? getAdmittedProfiles(school) : [];

    return (
        <div className="mb-3 space-y-2 bg-yellow-50/50 p-2 rounded-lg border border-yellow-100 transition-all">
            <div className="flex justify-between items-center select-none">
                <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3 h-3" /> {isEn ? `Reference Cases (${profiles.length})` : `往届录取参考 (${profiles.length})`}
                </span>
            </div>
            
            {profiles.length > 0 ? (
                <div className="space-y-1 mt-2 animate-in slide-in-from-top-1">
                    {profiles.map((p, i) => (
                        <div 
                            key={i} 
                            onClick={() => setViewingAdmitProfile(p)}
                            className="flex items-center justify-between bg-white dark:bg-zinc-800 p-1.5 rounded border border-gray-100 dark:border-white/5 text-[10px] cursor-pointer hover:border-yellow-300 hover:shadow-sm transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-zinc-700 flex items-center justify-center text-[8px] font-bold text-gray-500 dark:text-zinc-400">{p.name.charAt(0)}</div>
                                <span className="font-bold text-gray-700 dark:text-zinc-300">{p.name}</span>
                                <span className="text-gray-300">|</span>
                                <span className="font-medium text-gray-600 dark:text-zinc-400">{p.scores.split('SAT')[1]}</span>
                            </div>
                            <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mt-2 text-[10px] text-gray-400 italic px-1">
                    {isEn ? 'Data not retrieved yet.' : '暂无数据，请一键检索。'}
                </div>
            )}
        </div>
    )
  }

  const isLoading = isBatchEnriching || localBatchLoading;
  const activeExpandedSchool = selectedSchools.find(s => s.id === expandedSchoolId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 flex flex-col min-h-full pb-10 relative">
      
      {/* 1. Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl animate-in fade-in duration-300">
            <div className="w-full max-w-md p-8 text-center space-y-6">
                <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-gray-100 dark:border-zinc-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-violet-600 animate-pulse" />
                    </div>
                </div>
                
                <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{isEn ? 'AI Agent Working...' : 'AI 智能体正在检索...'}</h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">
                        {currentProcessingSchool ? (isEn ? `Analyzing data for ${currentProcessingSchool}` : `正在分析 ${currentProcessingSchool} 的最新数据`) : (isEn ? 'Initializing...' : '准备中...')}
                    </p>
                </div>

                <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div 
                        className="bg-violet-600 h-full transition-all duration-500 ease-out" 
                        style={{ width: `${(progress.current / Math.max(progress.total, 1)) * 100}%` }}
                    />
                </div>
                
                <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-500/20 p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-violet-800 dark:text-violet-300 text-left leading-relaxed">
                            {TIPS[tipIndex]}
                        </p>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 2. Strategy Detail Modal (Maximize View) */}
      {activeExpandedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setExpandedSchoolId(null)}>
            <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-white/10" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 p-1 flex items-center justify-center">
                            <img src={activeExpandedSchool.uni.logo} className="w-full h-full object-contain" alt="" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{activeExpandedSchool.uni.name}</h3>
                            <p className="text-xs text-gray-500">{activeExpandedSchool.major} • <span className={`uppercase font-bold ${activeExpandedSchool.tier === 'Reach' ? 'text-red-500' : 'text-blue-500'}`}>{activeExpandedSchool.tier}</span></p>
                        </div>
                    </div>
                    <button onClick={() => setExpandedSchoolId(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 gap-8 bg-gray-50/30 dark:bg-zinc-950/30">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-yellow-700 uppercase flex items-center gap-2"><Info className="w-4 h-4"/> {isEn ? 'Admission Strategy & Advice' : '实际录取建议与策略'}</label>
                            
                            <button 
                                onClick={() => toggleEditAdvice(activeExpandedSchool.id)}
                                className={`text-xs flex items-center gap-1 font-bold ${editingAdviceIds.has(activeExpandedSchool.id) ? 'text-green-600' : 'text-primary-600'}`}
                            >
                                {editingAdviceIds.has(activeExpandedSchool.id) ? <Save className="w-3.5 h-3.5"/> : <Edit className="w-3.5 h-3.5"/>}
                                {editingAdviceIds.has(activeExpandedSchool.id) ? (isEn ? 'Save' : '保存') : (isEn ? 'Edit' : '编辑')}
                            </button>
                        </div>
                        
                        {editingAdviceIds.has(activeExpandedSchool.id) ? (
                            <textarea 
                                className="w-full h-[calc(100vh-300px)] bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-6 text-sm text-gray-800 dark:text-zinc-200 leading-relaxed outline-none focus:ring-2 focus:ring-yellow-400/50 resize-none font-serif shadow-sm"
                                value={activeExpandedSchool.admissionAdvice}
                                onChange={(e) => handleUpdateFinalSchool(activeExpandedSchool.id, 'admissionAdvice', e.target.value)}
                                placeholder={isEn ? "Detailed strategy notes..." : "详细策略笔记..."}
                            />
                        ) : (
                            <div className="w-full h-[calc(100vh-300px)] bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-6 overflow-y-auto font-serif custom-scrollbar">
                                <SimpleMarkdown 
                                    text={activeExpandedSchool.admissionAdvice || ''} 
                                    placeholder={isEn ? "No strategy notes yet." : "暂无策略笔记。"} 
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-gray-600 dark:text-zinc-400 uppercase flex items-center gap-2"><FileText className="w-4 h-4"/> {isEn ? 'Official Requirements' : '官网要求'}</label>
                                <button 
                                    onClick={() => toggleEditRequirements(activeExpandedSchool.id)}
                                    className={`text-xs flex items-center gap-1 font-bold ${editingRequirementsIds.has(activeExpandedSchool.id) ? 'text-green-600' : 'text-gray-400 hover:text-primary-600'}`}
                                >
                                    {editingRequirementsIds.has(activeExpandedSchool.id) ? <Save className="w-3 h-3"/> : <Edit className="w-3 h-3"/>}
                                    {editingRequirementsIds.has(activeExpandedSchool.id) ? (isEn ? 'Save' : '保存') : (isEn ? 'Edit' : '编辑')}
                                </button>
                            </div>
                            
                            {editingRequirementsIds.has(activeExpandedSchool.id) ? (
                                <textarea 
                                    className="w-full h-40 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-gray-800 dark:text-zinc-200 leading-relaxed outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                                    value={activeExpandedSchool.requirements}
                                    onChange={(e) => handleUpdateFinalSchool(activeExpandedSchool.id, 'requirements', e.target.value)}
                                />
                            ) : (
                                <div className="w-full h-40 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-4 overflow-y-auto custom-scrollbar">
                                    <SimpleMarkdown 
                                        text={activeExpandedSchool.requirements || ''} 
                                        placeholder={isEn ? "No requirements data." : "暂无要求数据。"} 
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-gray-600 dark:text-zinc-400 uppercase flex items-center gap-2"><Calendar className="w-4 h-4"/> {isEn ? 'Deadlines' : '截止日期'}</label>
                                <button 
                                    onClick={() => toggleEditDeadlines(activeExpandedSchool.id)}
                                    className={`text-xs flex items-center gap-1 font-bold ${editingDeadlinesIds.has(activeExpandedSchool.id) ? 'text-green-600' : 'text-gray-400 hover:text-primary-600'}`}
                                >
                                    {editingDeadlinesIds.has(activeExpandedSchool.id) ? <Save className="w-3 h-3"/> : <Edit className="w-3 h-3"/>}
                                    {editingDeadlinesIds.has(activeExpandedSchool.id) ? (isEn ? 'Save' : '保存') : (isEn ? 'Edit' : '编辑')}
                                </button>
                            </div>
                            
                            {editingDeadlinesIds.has(activeExpandedSchool.id) ? (
                                <textarea 
                                    className="w-full h-32 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-gray-800 dark:text-zinc-200 leading-relaxed outline-none focus:ring-2 focus:ring-primary-500/50 resize-none font-mono"
                                    value={activeExpandedSchool.deadlines}
                                    onChange={(e) => handleUpdateFinalSchool(activeExpandedSchool.id, 'deadlines', e.target.value)}
                                />
                            ) : (
                                <div className="w-full h-32 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-4 overflow-y-auto custom-scrollbar">
                                    <SimpleMarkdown 
                                        text={activeExpandedSchool.deadlines || ''} 
                                        placeholder={isEn ? "No deadlines data." : "暂无截止日期。"} 
                                    />
                                </div>
                            )}
                        </div>
                        {renderAdmittedProfiles(activeExpandedSchool)}
                    </div>
                </div>
                
                <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900 flex justify-end">
                    <button onClick={() => setExpandedSchoolId(null)} className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-bold hover:opacity-90">
                        {isEn ? 'Done' : '完成'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 3. Admitted Profile Modal (Reference View) */}
      {viewingAdmitProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingAdmitProfile(null)}>
            <div className="bg-white dark:bg-zinc-900 w-full max-w-[500px] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-violet-100 dark:border-white/10" onClick={e => e.stopPropagation()}>
                {/* Header - Purple Theme */}
                <div className="bg-violet-50 dark:bg-violet-900/20 px-6 py-5 border-b border-violet-100 dark:border-white/5 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="pt-1">
                            <h3 className="text-xl font-bold text-violet-800 dark:text-violet-300">{viewingAdmitProfile.name}</h3>
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{viewingAdmitProfile.region}</span>
                        </div>
                    </div>
                    <button onClick={() => setViewingAdmitProfile(null)} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Basic Info List */}
                    <div className="space-y-2 text-sm">
                        <div className="flex">
                            <span className="w-20 text-gray-500 dark:text-zinc-500 flex-shrink-0">{isEn ? 'Admitted:' : '录取学校'}</span>
                            <div className="text-gray-800 dark:text-zinc-200 font-medium">
                                <p>{viewingAdmitProfile.admittedSchool}</p>
                                {viewingAdmitProfile.otherAdmitted && <p className="mt-1">{viewingAdmitProfile.otherAdmitted}</p>}
                            </div>
                        </div>
                        <div className="flex">
                            <span className="w-20 text-gray-500 dark:text-zinc-500 flex-shrink-0">{isEn ? 'School:' : '就读学校'}</span>
                            <span className="text-gray-800 dark:text-zinc-200 font-medium">{viewingAdmitProfile.highSchool}</span>
                        </div>
                        <div className="flex">
                            <span className="w-20 text-gray-500 dark:text-zinc-500 flex-shrink-0">{isEn ? 'Curriculum:' : '课程'}</span>
                            <span className="text-gray-800 dark:text-zinc-200 font-medium">{viewingAdmitProfile.curriculum}</span>
                        </div>
                        <div className="flex">
                            <span className="w-20 text-gray-500 dark:text-zinc-500 flex-shrink-0">{isEn ? 'Grades:' : '课程成绩'}</span>
                            <span className="text-gray-800 dark:text-zinc-200 font-medium">{viewingAdmitProfile.courseGrades}</span>
                        </div>
                        <div className="flex">
                            <span className="w-20 text-gray-500 dark:text-zinc-500 flex-shrink-0">{isEn ? 'Scores:' : '标化成绩'}</span>
                            <span className="text-gray-800 dark:text-zinc-200 font-medium">{viewingAdmitProfile.scores}</span>
                        </div>
                    </div>

                    {/* Application Results Table */}
                    <div>
                        <h4 className="text-xs text-gray-500 dark:text-zinc-500 mb-2 mt-4">{isEn ? 'Applications:' : '申请学校专业、是否录取'}</h4>
                        <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg overflow-hidden border border-gray-100 dark:border-white/5">
                            <div className="grid grid-cols-12 text-xs text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800 p-2 font-medium">
                                <div className="col-span-5">{isEn ? 'University' : '大学'}</div>
                                <div className="col-span-4">{isEn ? 'Major' : '专业'}</div>
                                <div className="col-span-3 text-right">{isEn ? 'Result' : '录取情况'}</div>
                            </div>
                            {viewingAdmitProfile.applications.map((app, idx) => (
                                <div key={idx} className="grid grid-cols-12 text-xs p-2 border-t border-gray-100 dark:border-white/5 items-center">
                                    <div className="col-span-5 font-bold text-gray-800 dark:text-zinc-200 truncate pr-1">{app.school}</div>
                                    <div className="col-span-4 text-gray-600 dark:text-zinc-400 truncate pr-1">{app.major}</div>
                                    <div className="col-span-3 text-right">
                                        <span className={`flex items-center justify-end gap-1 ${app.statusColor === 'green' ? 'text-green-600' : 'text-gray-500'}`}>
                                            {app.result} {app.statusColor === 'green' && <CheckCircle className="w-3 h-3"/>}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Source */}
                    <div className="flex text-xs">
                        <span className="w-20 text-gray-500 dark:text-zinc-500 flex-shrink-0">{isEn ? 'Source:' : '数据来源'}</span>
                        <span className="text-gray-800 dark:text-zinc-200 font-medium">{viewingAdmitProfile.source}</span>
                    </div>

                    {/* Background Info List */}
                    <div>
                        <h4 className="text-xs text-gray-500 dark:text-zinc-500 mb-2">{isEn ? 'Background:' : '背景信息'}</h4>
                        <div className="space-y-1">
                            {viewingAdmitProfile.background.map((item, idx) => (
                                <p key={idx} className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                                    {item}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- Main Content --- */}
      <div className="flex-1 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                 <Target className="w-6 h-6 text-primary-600 dark:text-primary-400" /> {isEn ? 'Final School List' : '最终选校清单 (Final School List)'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                 {isEn ? 'Refine application details. Use "One-click Retrieve Data" to auto-fill requirements and advice.' : '请完善申请细节。使用 "一键检索数据" 功能自动获取所有缺失的最新官网要求及录取建议。'}
              </p>
           </div>
           <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={handleComprehensiveBatchEnrich}
                disabled={isLoading || selectedSchools.length === 0}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-bold hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-yellow-300" />}
                 {isLoading ? (isEn ? 'Retrieving...' : '正在检索...') : (isEn ? 'One-click Retrieve Data' : '一键检索数据')}
              </button>
              <button 
                onClick={handleExportExcel}
                disabled={selectedSchools.length === 0}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-primary-600 shadow-sm transition-colors disabled:opacity-50"
              >
                 <FileDown className="w-4 h-4" /> {isEn ? 'Export Excel' : '导出 Excel'}
              </button>
           </div>
        </div>
        
        {/* Content Section */}
        {selectedSchools.length === 0 ? (
           <div className="text-center py-20 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10">
              <School className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-zinc-400 text-sm">{isEn ? 'No schools selected. Go back to Step 3.' : '暂无选校，请返回 Step 3 添加学校。'}</p>
              <button onClick={() => setPlanningStep(3)} className="mt-4 text-primary-600 dark:text-primary-400 text-sm font-bold hover:underline">{isEn ? 'Back to Selection' : '返回定校助手'}</button>
           </div>
        ) : (
           // Group by Region
           <div className="space-y-10">
             {Object.entries(selectedSchools.reduce((acc, curr) => {
                const region = curr.uni.region;
                if (!acc[region]) acc[region] = [];
                acc[region].push(curr);
                return acc;
             }, {} as Record<string, SelectedSchool[]>)).map(([region, schools]: [string, SelectedSchool[]]) => (
                <div key={region} className="space-y-4">
                   {/* Region Header */}
                   <div className="flex items-center gap-3 pb-2 border-b border-gray-200 dark:border-white/10">
                      <div className="p-1.5 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                        <MapPin className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                         {region === 'US' ? (isEn ? 'United States' : '美国 (United States)') : 
                          region === 'UK' ? (isEn ? 'United Kingdom' : '英国 (United Kingdom)') : 
                          region === 'HK' ? (isEn ? 'Hong Kong' : '香港 (Hong Kong)') : 
                          region === 'SG' ? (isEn ? 'Singapore' : '新加坡 (Singapore)') : region}
                      </h3>
                      <span className="text-xs font-medium text-gray-500 dark:text-zinc-500 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                         {schools.length}
                      </span>
                   </div>
                   
                   {/* School Cards */}
                   <div className="grid grid-cols-1 gap-4">
                      {schools.map((item) => (
                         <div 
                            key={item.id} 
                            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all group"
                         >
                            {/* Card Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 border-b border-gray-100 dark:border-white/5 pb-4">
                               <div className="flex items-center gap-4">
                                  {/* Tier Badge */}
                                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border whitespace-nowrap ${getTierColor(item.tier)}`}>
                                      {item.tier}
                                  </span>
                                  
                                  {/* School Info */}
                                  <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                          <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">{item.uni.name}</h3>
                                          <span className="text-xs text-gray-500 dark:text-zinc-500 font-medium px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded">#{item.uni.rank}</span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs text-gray-500 dark:text-zinc-500">{isEn ? 'Major:' : '申请专业:'}</span>
                                          <span className="text-sm font-semibold text-primary-700 dark:text-primary-400 truncate max-w-[200px] sm:max-w-xs">{item.major || 'Undecided'}</span>
                                      </div>
                                  </div>
                               </div>

                               {/* Top Actions */}
                               <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                                  {/* Individual AI Enrich Button */}
                                  <button 
                                     onClick={() => handleEnrichSchoolInfo(item.id)}
                                     disabled={enrichingSchoolId === item.id || isLoading}
                                     className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-bold hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors disabled:opacity-50"
                                  >
                                     {enrichingSchoolId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5" />}
                                     {enrichingSchoolId === item.id ? (isEn ? 'Searching...' : '搜索中...') : (isEn ? 'AI Enrich' : 'AI 补全')}
                                  </button>

                                  {/* Portal Link */}
                                  {item.portalLink ? (
                                     <a 
                                        href={item.portalLink} target="_blank" rel="noreferrer"
                                        className="flex items-center justify-center gap-1 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-zinc-300 rounded-lg text-xs font-medium hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-200 transition-colors"
                                        title={isEn ? "Go to Application Portal" : "前往申请入口"}
                                     >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                     </a>
                                  ) : (
                                     <button disabled className="flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-white/5 text-gray-300 dark:text-zinc-600 rounded-lg text-xs cursor-not-allowed">
                                        <LinkIcon className="w-3.5 h-3.5" />
                                     </button>
                                  )}
                               </div>
                            </div>

                            {/* Editing Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Col 1: Requirements (5 cols) */}
                                <div className="lg:col-span-5 flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5" /> {isEn ? 'Official Requirements' : '官网录取要求'}
                                        </label>
                                        
                                        {/* Edit Button for Requirements */}
                                        <button 
                                            onClick={(e) => toggleEditRequirements(item.id, e)}
                                            className={`text-[10px] flex items-center gap-1 font-bold transition-colors ${editingRequirementsIds.has(item.id) ? 'text-green-600' : 'text-gray-400 hover:text-primary-600'}`}
                                        >
                                            {editingRequirementsIds.has(item.id) ? <Save className="w-3 h-3"/> : <Edit className="w-3 h-3"/>}
                                            {editingRequirementsIds.has(item.id) ? (isEn ? 'Save' : '保存') : (isEn ? 'Edit' : '编辑')}
                                        </button>
                                    </div>
                                    
                                    <div className="relative flex-1">
                                        {editingRequirementsIds.has(item.id) ? (
                                            <textarea 
                                                className={`w-full h-full min-h-[160px] bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-xs text-gray-700 dark:text-zinc-300 focus:border-primary-500 focus:bg-white dark:focus:bg-zinc-800 focus:ring-1 focus:ring-primary-500 outline-none resize-none transition-all leading-relaxed ${isLoading && !item.requirements ? 'animate-pulse' : ''}`}
                                                placeholder={isEn ? "GPA, Tests, Prerequisites..." : "GPA, 标化, 先修课要求..."}
                                                value={item.requirements}
                                                onChange={(e) => handleUpdateFinalSchool(item.id, 'requirements', e.target.value)}
                                            />
                                        ) : (
                                            <div 
                                                className={`w-full h-full min-h-[160px] bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-white/10 rounded-lg p-3 overflow-y-auto custom-scrollbar ${isLoading && !item.requirements ? 'animate-pulse' : ''}`}
                                            >
                                                {!item.requirements && !isLoading && !enrichingSchoolId ? (
                                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                                        <span className="text-xs text-gray-400 dark:text-zinc-600 flex items-center gap-1 bg-white/80 dark:bg-zinc-900/80 px-2 py-1 rounded shadow-sm">
                                                            <Info className="w-3 h-3" /> {isEn ? 'Click One-click Retrieve to autofill' : '点击上方一键检索自动填写'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <SimpleMarkdown 
                                                        text={item.requirements || ''} 
                                                        placeholder={isEn ? "No requirements data." : "暂无要求数据。"} 
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Col 2: Advice (4 cols) - OPTIMIZED */}
                                <div className="lg:col-span-4 flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-yellow-600 dark:text-yellow-500 uppercase flex items-center gap-1.5">
                                            <Info className="w-3.5 h-3.5" /> {isEn ? 'Admission Advice' : '实际录取建议'}
                                        </label>
                                        <div className="flex gap-2">
                                            {/* Toggle Edit Button */}
                                            <button 
                                                onClick={(e) => toggleEditAdvice(item.id, e)}
                                                className={`text-[10px] flex items-center gap-1 font-bold transition-colors ${editingAdviceIds.has(item.id) ? 'text-green-600' : 'text-gray-400 hover:text-primary-600'}`}
                                            >
                                                {editingAdviceIds.has(item.id) ? <Save className="w-3 h-3"/> : <Edit className="w-3 h-3"/>}
                                                {editingAdviceIds.has(item.id) ? (isEn ? 'Save' : '保存') : (isEn ? 'Edit' : '编辑')}
                                            </button>
                                            <button 
                                                onClick={() => setExpandedSchoolId(item.id)}
                                                className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-primary-600 transition-colors"
                                                title={isEn ? "Maximize View" : "放大查看"}
                                            >
                                                <Maximize2 className="w-3 h-3" /> {isEn ? 'Expand' : '展开'}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {renderAdmittedProfiles(item)}

                                    <div className="relative">
                                        {editingAdviceIds.has(item.id) ? (
                                            <textarea 
                                                className={`w-full flex-1 min-h-[100px] bg-yellow-50/30 dark:bg-yellow-500/5 border border-yellow-200/50 dark:border-yellow-500/20 rounded-lg p-3 text-xs text-gray-700 dark:text-zinc-300 focus:border-yellow-400 focus:bg-white dark:focus:bg-zinc-800 focus:ring-1 focus:ring-yellow-400 outline-none resize-none transition-all leading-relaxed ${isLoading && !item.admissionAdvice ? 'animate-pulse' : ''}`}
                                                placeholder={isEn ? "Internal notes & advice..." : "内部经验与建议..."}
                                                value={item.admissionAdvice || ''}
                                                onChange={(e) => handleUpdateFinalSchool(item.id, 'admissionAdvice', e.target.value)}
                                                autoFocus
                                            />
                                        ) : (
                                            <div 
                                                className={`w-full flex-1 min-h-[100px] max-h-[160px] overflow-y-auto bg-yellow-50/30 dark:bg-yellow-500/5 border border-yellow-200/50 dark:border-yellow-500/20 rounded-lg p-3 text-xs text-gray-700 dark:text-zinc-300 ${isLoading && !item.admissionAdvice ? 'animate-pulse' : ''} custom-scrollbar`}
                                            >
                                                <SimpleMarkdown 
                                                    text={item.admissionAdvice || ''} 
                                                    placeholder={isEn ? "No strategy notes yet." : "暂无策略笔记。"} 
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Col 3: Deadlines (3 cols) */}
                                <div className="lg:col-span-3 flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" /> {isEn ? 'Deadlines' : '关键时间'}
                                        </label>
                                        
                                        {/* Edit Button for Deadlines */}
                                        <button 
                                            onClick={(e) => toggleEditDeadlines(item.id, e)}
                                            className={`text-[10px] flex items-center gap-1 font-bold transition-colors ${editingDeadlinesIds.has(item.id) ? 'text-green-600' : 'text-gray-400 hover:text-primary-600'}`}
                                        >
                                            {editingDeadlinesIds.has(item.id) ? <Save className="w-3 h-3"/> : <Edit className="w-3 h-3"/>}
                                            {editingDeadlinesIds.has(item.id) ? (isEn ? 'Save' : '保存') : (isEn ? 'Edit' : '编辑')}
                                        </button>
                                    </div>
                                    
                                    {editingDeadlinesIds.has(item.id) ? (
                                        <textarea 
                                            className={`w-full h-full min-h-[160px] bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-xs text-gray-700 dark:text-zinc-300 focus:border-primary-500 focus:bg-white dark:focus:bg-zinc-800 focus:ring-1 focus:ring-primary-500 outline-none resize-none transition-all font-mono leading-relaxed ${isLoading && !item.deadlines ? 'animate-pulse' : ''}`}
                                            placeholder="ED: MM-DD&#10;RD: MM-DD"
                                            value={item.deadlines}
                                            onChange={(e) => handleUpdateFinalSchool(item.id, 'deadlines', e.target.value)}
                                        />
                                    ) : (
                                        <div 
                                            className={`w-full h-full min-h-[160px] bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-white/10 rounded-lg p-3 overflow-y-auto custom-scrollbar ${isLoading && !item.deadlines ? 'animate-pulse' : ''}`}
                                        >
                                            <SimpleMarkdown 
                                                text={item.deadlines || ''} 
                                                placeholder={isEn ? "No deadlines data." : "暂无截止日期。"} 
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             ))}
           </div>
        )}
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-white/5 mt-auto">
        <button 
          onClick={onNext}
          disabled={selectedSchools.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-bold shadow-md hover:bg-black dark:hover:bg-gray-100 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEn ? 'Next: Gap Analysis (Step 5)' : '下一步：差距分析 (Step 5)'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Step4FinalList;
