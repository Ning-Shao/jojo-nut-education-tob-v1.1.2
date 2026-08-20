
import React, { useState, useEffect } from 'react';
import { 
  FileText, Printer, FileDown, Search, User, 
  ChevronRight, CheckCircle, AlertTriangle, 
  TrendingUp, Target, ListTodo, Eye, EyeOff,
  Stamp, Calendar, School, BarChart3, GraduationCap,
  MessageSquare, Check, FileSpreadsheet, Briefcase, MapPin, DollarSign,
  Trophy, Star, Info
} from '../common/Icons';
import { mockStudents } from './StudentList';
import { initialOfficialBatches } from './StudentBasicInfo';
import { initialOffers } from './StudentOfferTracking';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../../contexts/LanguageContext';

// --- Types ---
export type ReportType = 'comprehensive' | 'transcript' | 'offer';

interface ReportTemplate {
  id: ReportType;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: React.ReactNode;
  tags: string[];
  disabled?: boolean;
}

interface ReportCenterProps {
  initialStudentId?: string;
  initialTemplate?: ReportType;
}

// --- Mock Templates ---
const TEMPLATES: ReportTemplate[] = [
  {
    id: 'comprehensive',
    name: '一生一档·综合档案',
    nameEn: 'Comprehensive Student Profile',
    description: '标准完整的学生升学档案，包含基础信息、目标、差距分析及材料清单。',
    descriptionEn: 'Full student profile including basic info, targets, gap analysis, and materials checklist.',
    icon: <FileText className="w-5 h-5" />,
    tags: ['官方存档', '最全面'],
    disabled: true
  },
  {
    id: 'transcript',
    name: '学术成绩单 (Official Transcript)',
    nameEn: 'Official High School Transcript',
    description: '自动生成的官方格式成绩单，包含 GPA 计算与分学期课程记录。',
    descriptionEn: 'Auto-generated official transcript with GPA calculation and course records.',
    icon: <FileSpreadsheet className="w-5 h-5" />,
    tags: ['教务', '申请必备'],
    disabled: true
  },
  {
    id: 'offer',
    name: 'Offer 对比分析书',
    nameEn: 'Offer Comparison Analysis',
    description: '多维度对比已录取的学校（排名、专业、就业、成本），辅助最终决策。',
    descriptionEn: 'Multi-dimensional comparison of admitted schools to aid final decision making.',
    icon: <GraduationCap className="w-5 h-5" />,
    tags: ['决策辅助', '数据驱动'],
    disabled: true
  }
];

// --- Simple Chart Data for Report ---
const reportChartData = [
  { name: 'G9', value: 3.5 },
  { name: 'G10', value: 3.6 },
  { name: 'G11', value: 3.85 }
];

const ReportCenter: React.FC<ReportCenterProps> = ({ initialStudentId, initialTemplate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportType | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || mockStudents[0].id);
  const [isParentMode, setIsParentMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  // Helper to check if current template is in preview mode
  const currentTemplateDef = TEMPLATES.find(t => t.id === selectedTemplate);
  const isPreviewOnly = currentTemplateDef?.disabled;

  useEffect(() => {
    // Sync props to state if they change (handling navigation from other modules)
    if (initialTemplate) {
        setSelectedTemplate(initialTemplate);
    }
    if (initialStudentId) setSelectedStudentId(initialStudentId);
  }, [initialTemplate, initialStudentId]);

  useEffect(() => {
    // Standardize mounted state reset on data dependency change
    setMounted(false);
    const timer = setTimeout(() => setMounted(true), 400);
    return () => clearTimeout(timer);
  }, [selectedTemplate, selectedStudentId]);

  const activeStudent = mockStudents.find(s => s.id === selectedStudentId) || mockStudents[0];

  const handleTemplateClick = (id: ReportType) => {
    // ALLOW clicking even if disabled to show preview
    setIsGenerating(true);
    setMounted(false); 
    setSelectedTemplate(id);
    setTimeout(() => {
        setIsGenerating(false);
    }, 600);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    const element = document.getElementById('printable-report');
    if (!element) return;

    const htmlContent = element.innerHTML;
    // Basic CSS for Word compatibility
    const styles = `
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; color: #333; line-height: 1.5; }
        h1 { font-size: 24pt; font-weight: bold; margin-bottom: 10pt; text-align: center; color: #111; }
        h2 { font-size: 18pt; font-weight: bold; margin-top: 20pt; margin-bottom: 10pt; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5pt; }
        h3 { font-size: 14pt; font-weight: bold; margin-top: 15pt; margin-bottom: 5pt; color: #555; }
        h4 { font-size: 12pt; font-weight: bold; margin-top: 10pt; margin-bottom: 5pt; color: #666; }
        p { font-size: 11pt; margin-bottom: 8pt; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15pt; }
        th { border: 1px solid #000; padding: 5pt; background-color: #f2f2f2; font-weight: bold; text-align: left; font-size: 10pt; }
        td { border: 1px solid #ccc; padding: 5pt; font-size: 10pt; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .text-xs { font-size: 9pt; }
        .text-sm { font-size: 10pt; }
        .text-red-700 { color: #b91c1c; }
        .text-green-700 { color: #15803d; }
        .text-blue-700 { color: #1d4ed8; }
        .bg-red-50 { background-color: #fef2f2; }
        .bg-green-50 { background-color: #f0fdf4; }
        .bg-blue-50 { background-color: #eff6ff; }
        .border-b { border-bottom: 1px solid #ccc; }
      </style>
    `;
    
    const preHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${activeStudent.name} Report</title>
        ${styles}
      </head>
      <body>
        <div style="width: 100%; max-width: 800px; margin: 0 auto;">
    `;
    const postHtml = "</div></body></html>";
    const html = preHtml + htmlContent + postHtml;

    const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeStudent.name}_${selectedTemplate}_Report.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full gap-6">
       {/* Print Styles */}
       <style>{`
         @media print {
           body * {
             visibility: hidden;
           }
           #printable-report, #printable-report * {
             visibility: visible;
           }
           #printable-report {
             position: absolute;
             left: 0;
             top: 0;
             width: 100%;
             margin: 0;
             padding: 0 !important;
             box-shadow: none !important;
             border: none !important;
             background: white !important;
           }
           @page {
             size: A4;
             margin: 20mm;
           }
           .no-print {
             display: none !important;
           }
         }
       `}</style>
       
       {/* 1. Sidebar: Generator Controls */}
       <div className="w-80 flex-shrink-0 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 flex flex-col h-full no-print transition-colors">
          <div className="p-5 border-b border-[#e5e0dc] dark:border-white/5">
             <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                {isEn ? 'Report Generator' : '报告生成器'}
             </h2>
             <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">{isEn ? 'Select template and student to preview.' : '选择模板与学生，实时生成预览。'}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
             {/* Step 1: Select Student */}
             <div>
                <label className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-3 block">{isEn ? '1. Select Student' : '1. 选择学生'}</label>
                <div className="relative">
                   <User className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                   <select 
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer text-gray-900 dark:text-white transition-colors"
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                   >
                      {mockStudents.map(s => (
                         <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                      ))}
                   </select>
                   <ChevronRight className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 rotate-90" />
                </div>
             </div>

             {/* Step 2: Select Template */}
             <div>
                <label className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-3 block">{isEn ? '2. Select Template' : '2. 选择报告类型'}</label>
                <div className="space-y-3">
                   {TEMPLATES.map(t => (
                      <div 
                         key={t.id}
                         onClick={() => handleTemplateClick(t.id)}
                         className={`p-3 rounded-xl border transition-all relative cursor-pointer
                            ${selectedTemplate === t.id 
                               ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 dark:border-primary-500/50 shadow-sm ring-1 ring-primary-500 dark:ring-primary-500/50' 
                               : t.disabled 
                                 ? 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 opacity-80'
                                 : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-white/10 hover:border-primary-300 dark:hover:border-primary-500/30 hover:shadow-sm'
                            }`}
                      >
                         <div className="flex justify-between items-start mb-1">
                            <div className={`flex items-center gap-2 font-bold text-sm ${selectedTemplate === t.id ? 'text-primary-900 dark:text-primary-100' : 'text-gray-800 dark:text-zinc-300'}`}>
                               {t.icon} {isEn ? t.nameEn : t.name}
                            </div>
                            {t.disabled ? (
                                <span className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-zinc-400 px-1.5 py-0.5 rounded font-medium whitespace-nowrap border border-gray-200 dark:border-white/5">{isEn ? 'Preview' : '预览'}</span>
                            ) : (
                                selectedTemplate === t.id && <CheckCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            )}
                         </div>
                         <p className={`text-xs leading-snug ${selectedTemplate === t.id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-zinc-500'}`}>{isEn ? t.descriptionEn : t.description}</p>
                      </div>
                   ))}
                </div>
             </div>

             {/* Step 3: Options (Only for Comprehensive) */}
             {selectedTemplate === 'comprehensive' && (
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-3 block">{isEn ? '3. Options' : '3. 输出选项'}</label>
                    <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-2">
                            {isParentMode ? <EyeOff className="w-4 h-4 text-primary-600 dark:text-primary-400" /> : <Eye className="w-4 h-4 text-gray-500 dark:text-zinc-400" />}
                            <div className="text-sm">
                                <span className="font-medium text-gray-800 dark:text-zinc-200">{isEn ? 'Parent Mode' : '家长模式'}</span>
                                <p className="text-[10px] text-gray-400 dark:text-zinc-500">{isEn ? 'Hide internal notes & risks' : '隐藏内部备注与风险等级'}</p>
                            </div>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${isParentMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-zinc-600'}`}>
                            <input type="checkbox" className="hidden" checked={isParentMode} onChange={() => setIsParentMode(!isParentMode)} />
                            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isParentMode ? 'translate-x-5' : ''}`}></div>
                        </div>
                    </label>
                    </div>
                </div>
             )}
          </div>

          {/* Action Footer */}
          <div className="p-5 border-t border-[#e5e0dc] dark:border-white/5 space-y-3 bg-gray-50 dark:bg-zinc-900/50 rounded-b-2xl">
             <button 
               onClick={handleExportWord}
               disabled={!selectedTemplate || isPreviewOnly}
               className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-bold shadow-sm hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <FileDown className="w-4 h-4" /> 
                {isPreviewOnly ? (isEn ? 'Coming Soon' : '即将上线') : (isEn ? 'Export Word' : '导出 Word')}
             </button>
             <button 
               onClick={handlePrint}
               disabled={!selectedTemplate || isPreviewOnly}
               className="w-full py-2.5 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-zinc-300 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Printer className="w-4 h-4" /> {isEn ? 'Print / PDF' : '直接打印 / PDF'}
             </button>
          </div>
       </div>

       {/* 2. Main Content: A4 Preview Area */}
       <div className="flex-1 bg-gray-100/50 dark:bg-black/20 rounded-2xl border border-[#e5e0dc] dark:border-white/5 overflow-hidden flex flex-col relative print:bg-white print:border-none print:overflow-visible transition-colors">
          
          {/* Toolbar */}
          <div className="h-14 bg-white dark:bg-zinc-900 border-b border-[#e5e0dc] dark:border-white/5 flex justify-between items-center px-6 no-print transition-colors">
             <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">{isEn ? 'Preview: A4 Portrait' : '预览模式: A4 纵向'}</span>
             {selectedTemplate && (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-zinc-500">{isEn ? 'Last Saved: Just Now' : '上次保存: 刚刚'}</span>
                </div>
             )}
          </div>

          {/* Scrollable Canvas */}
          <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-[#525659] dark:bg-[#18181b] print:p-0 print:bg-white print:block custom-scrollbar transition-colors">
             {isGenerating ? (
                <div className="w-[210mm] h-[297mm] bg-white shadow-2xl flex items-center justify-center">
                   <div className="flex flex-col items-center gap-3 animate-pulse">
                      <FileText className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-400 font-medium">{isEn ? 'Generating report...' : '正在生成报告数据...'}</p>
                   </div>
                </div>
             ) : selectedTemplate ? (
                /* --- A4 PAPER START (Keep White for Reality Simulation) --- */
                <div id="printable-report" className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[20mm] relative text-gray-800 print:shadow-none print:w-full print:min-h-0">
                   
                   {/* Preview Overlay Banner */}
                   {isPreviewOnly && (
                      <div className="absolute top-0 left-0 w-full bg-blue-600/90 text-white py-1.5 px-4 text-center z-10 shadow-md">
                         <p className="text-xs font-bold flex items-center justify-center gap-2">
                            <Info className="w-4 h-4" /> 
                            {isEn ? 'FEATURE PREVIEW - Content structure subject to final release' : '功能预览 - 报告结构以最终上线为准'}
                         </p>
                      </div>
                   )}

                   {/* Watermark (Optional) */}
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] overflow-hidden">
                      <div className="transform -rotate-45 text-7xl font-bold text-black select-none whitespace-nowrap text-center leading-tight">
                         {isPreviewOnly ? 'SAMPLE PREVIEW' : 'NUT INTERNAL'}<br/>
                         {isPreviewOnly ? 'NOT FOR USE' : ''}
                      </div>
                   </div>

                   {/* --- TRANSCRIPT VIEW --- */}
                   {selectedTemplate === 'transcript' ? (
                      <div className="space-y-8 font-serif">
                         {/* Header */}
                         <div className="text-center border-b-2 border-gray-900 pb-6 mb-8">
                            <div className="flex justify-center items-center gap-3 mb-4">
                               <div className="w-12 h-12 bg-gray-900 text-white flex items-center justify-center text-2xl font-bold rounded-md">N</div>
                            </div>
                            <h1 className="text-3xl font-bold tracking-widest uppercase mb-2">Official High School Transcript</h1>
                            <p className="text-sm text-gray-600 tracking-widest uppercase">Nut International School</p>
                            <p className="text-xs text-gray-500 mt-1">123 Education Ave, Shanghai, China | CEEB: 123456</p>
                         </div>
                         
                         {/* Student Info Grid */}
                         <div className="grid grid-cols-2 gap-x-20 gap-y-3 text-sm mb-10 px-4">
                            <div className="space-y-3">
                               <div className="flex justify-between border-b border-gray-300 pb-1">
                                  <span className="font-bold text-gray-800 uppercase text-xs tracking-wide">Student Name</span>
                                  <span className="font-medium text-gray-900">{activeStudent.name}</span>
                               </div>
                               <div className="flex justify-between border-b border-gray-300 pb-1">
                                  <span className="font-bold text-gray-800 uppercase text-xs tracking-wide">Grade Level</span>
                                  <span className="font-medium text-gray-900">{activeStudent.grade}</span>
                               </div>
                               <div className="flex justify-between border-b border-gray-300 pb-1">
                                  <span className="font-bold text-gray-800 uppercase text-xs tracking-wide">Counselor</span>
                                  <span className="font-medium text-gray-900">Ms. Sarah</span>
                               </div>
                            </div>
                            <div className="space-y-3">
                               <div className="flex justify-between border-b border-gray-300 pb-1">
                                  <span className="font-bold text-gray-800 uppercase text-xs tracking-wide">Student ID</span>
                                  <span className="font-mono text-gray-900">{activeStudent.studentId}</span>
                               </div>
                               <div className="flex justify-between border-b border-gray-300 pb-1">
                                  <span className="font-bold text-gray-800 uppercase text-xs tracking-wide">Date of Birth</span>
                                  <span className="font-medium text-gray-900">2007-05-20</span>
                               </div>
                               <div className="flex justify-between border-b border-gray-300 pb-1">
                                  <span className="font-bold text-gray-800 uppercase text-xs tracking-wide">Graduation Date</span>
                                  <span className="font-medium text-gray-900">June 2026</span>
                               </div>
                            </div>
                         </div>

                         {/* Course Tables */}
                         <div className="space-y-6">
                            {initialOfficialBatches.map(batch => {
                               return (
                                  <div key={batch.id} className="border-2 border-blue-500/50">
                                     {/* Term Header */}
                                     <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-baseline">
                                        <span className="font-bold text-base text-gray-800 uppercase">{batch.level}</span>
                                        <span className="text-xs text-gray-500 font-medium font-sans">{batch.time} | {batch.board}</span>
                                     </div>
                                     
                                     {/* Table */}
                                     <table className="w-full text-sm text-left">
                                        <thead>
                                           <tr className="border-b border-gray-300 text-xs text-gray-500 font-bold uppercase tracking-wider">
                                              <th className="px-4 py-3 w-[50%]">SUBJECT</th>
                                              <th className="px-4 py-3 w-[25%] text-center">SCORE</th>
                                              <th className="px-4 py-3 w-[25%] text-center">GRADE</th>
                                           </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                           {batch.courses.map(course => (
                                              <tr key={course.id}>
                                                 <td className="px-4 py-3 font-bold text-gray-800">{course.subject}</td>
                                                 <td className="px-4 py-3 text-center text-gray-600">{course.score || '-'}</td>
                                                 <td className={`px-4 py-3 text-center font-bold text-base ${['A*','A','a'].includes(course.grade) ? 'text-green-600' : ['B+','B','b'].includes(course.grade) ? 'text-yellow-700' : 'text-gray-800'}`}>{course.grade}</td>
                                              </tr>
                                           ))}
                                        </tbody>
                                     </table>
                                  </div>
                               );
                            })}
                         </div>

                         {/* Summary & Grading Scale Footer */}
                         <div className="mt-auto pt-8 flex justify-between items-start text-xs text-gray-600">
                            <div>
                               <p className="font-bold text-gray-900 uppercase mb-2">Grading Scale</p>
                               <div className="grid grid-cols-2 gap-x-8 gap-y-1 font-mono">
                                  <span>A  (93-100) = 4.0</span>
                                  <span>C+ (77-79)  = 2.3</span>
                                  <span>A- (90-92)  = 3.7</span>
                                  <span>C  (73-76)  = 2.0</span>
                                  <span>B+ (87-89)  = 3.3</span>
                                  <span>D  (60-69)  = 1.0</span>
                                  <span>B  (83-86)  = 3.0</span>
                                  <span>F  (&lt;60)    = 0.0</span>
                                  <span>B- (80-82)  = 2.7</span>
                               </div>
                            </div>
                            
                            <div className="text-right space-y-8">
                               <div className="space-y-1">
                                  <div className="flex justify-end gap-6 text-sm border-b border-gray-200 pb-1 mb-1">
                                     <span>Cumulative GPA (Weighted):</span>
                                     <span className="font-bold text-gray-900">3.92</span>
                                  </div>
                                  <div className="flex justify-end gap-6 text-sm border-b border-gray-200 pb-1">
                                     <span>Credits Earned:</span>
                                     <span className="font-bold text-gray-900">15.0</span>
                                  </div>
                                </div>

                               <div>
                                  <div className="w-64 border-b border-gray-900 mb-2"></div>
                                  <p className="font-bold text-gray-900 uppercase">School Official Signature</p>
                                  <p className="mt-1">Date: {new Date().toLocaleDateString()}</p>
                               </div>
                            </div>
                         </div>
                      </div>
                   ) : selectedTemplate === 'offer' ? (
                      /* --- OFFER COMPARISON ANALYSIS VIEW --- */
                      <div className="font-sans text-gray-800">
                         {/* Header */}
                         <div className="text-center border-b-2 border-primary-600 pb-6 mb-8">
                            <div className="flex justify-center items-center gap-2 mb-2">
                               <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl">N</div>
                               <span className="font-bold text-2xl tracking-wide text-gray-900">NUT EDUCATION</span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-1">{isEn ? 'Offer Comparison Analysis' : 'Offer 对比分析书'}</h1>
                            <p className="text-sm text-gray-500 font-medium uppercase tracking-widest">{isEn ? 'Decision Matrix & Strategic Advice' : '决策矩阵与战略建议'}</p>
                            <div className="mt-4 flex justify-center gap-4 text-sm text-gray-600">
                               <span className="font-bold">{activeStudent.name}</span>
                               <span>|</span>
                               <span>{activeStudent.grade}</span>
                               <span>|</span>
                               <span>{new Date().toLocaleDateString()}</span>
                            </div>
                         </div>

                         {/* 1. Offer Summary (Dynamic) */}
                         <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                <h3 className="font-bold text-gray-800 text-lg uppercase tracking-wide">{isEn ? 'Offer Summary' : '录取汇总'}</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {initialOffers.map((offer) => (
                                    <div key={offer.id} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm text-center">
                                        <div className="w-12 h-12 mx-auto mb-2 bg-gray-50 text-gray-700 rounded-full flex items-center justify-center font-bold border border-gray-100">{offer.school.slice(0,2)}</div>
                                        <h4 className="font-bold text-gray-900">{offer.school}</h4>
                                        <p className="text-xs text-gray-500 mt-1">{offer.major}</p>
                                        <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded uppercase
                                            ${offer.result === 'Admitted' ? 'bg-green-100 text-green-700' : 
                                              offer.result === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {offer.result}
                                        </span>
                                    </div>
                                ))}
                            </div>
                         </div>

                         {/* 2. Detailed Comparison Matrix */}
                         <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-5 h-5 text-primary-600" />
                                <h3 className="font-bold text-gray-800 text-lg uppercase tracking-wide">{isEn ? 'Detailed Comparison' : '多维度深度对比'}</h3>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-gray-200">
                               <table className="w-full text-sm">
                                  <thead>
                                     <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                        <th className="py-3 px-4 text-left font-bold w-1/4">{isEn ? 'Dimension' : '维度'}</th>
                                        <th className="py-3 px-4 text-center font-bold w-1/4">CMU</th>
                                        <th className="py-3 px-4 text-center font-bold w-1/4">UIUC</th>
                                        <th className="py-3 px-4 text-center font-bold w-1/4">UCSD</th>
                                     </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                     <tr>
                                        <td className="py-3 px-4 font-medium flex items-center gap-2 text-gray-700">
                                            <Trophy className="w-4 h-4 text-gray-400"/> {isEn ? 'US News Ranking' : '综合排名'}
                                        </td>
                                        <td className="py-3 px-4 text-center">#22</td>
                                        <td className="py-3 px-4 text-center">#35</td>
                                        <td className="py-3 px-4 text-center">#28</td>
                                     </tr>
                                     <tr>
                                        <td className="py-3 px-4 font-medium flex items-center gap-2 text-gray-700">
                                            <Star className="w-4 h-4 text-yellow-500"/> {isEn ? 'CS Major Ranking' : 'CS 专业排名'}
                                        </td>
                                        <td className="py-3 px-4 text-center font-bold text-green-600">#1 (CSRankings)</td>
                                        <td className="py-3 px-4 text-center font-bold text-primary-600">#5</td>
                                        <td className="py-3 px-4 text-center">#11</td>
                                     </tr>
                                     <tr>
                                        <td className="py-3 px-4 font-medium flex items-center gap-2 text-gray-700">
                                            <MapPin className="w-4 h-4 text-gray-400"/> {isEn ? 'Location' : '地理位置'}
                                        </td>
                                        <td className="py-3 px-4 text-center text-xs">Pittsburgh, PA<br/><span className="text-gray-400">Urban/Cold</span></td>
                                        <td className="py-3 px-4 text-center text-xs">Urbana, IL<br/><span className="text-gray-400">Rural/College Town</span></td>
                                        <td className="py-3 px-4 text-center text-xs">La Jolla, CA<br/><span className="text-gray-400">Coastal/Sunny</span></td>
                                     </tr>
                                     <tr>
                                        <td className="py-3 px-4 font-medium flex items-center gap-2 text-gray-700">
                                            <DollarSign className="w-4 h-4 text-gray-400"/> {isEn ? 'Annual Cost' : '年度预估花费'}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono">$83,697</td>
                                        <td className="py-3 px-4 text-center font-mono text-green-600">$63,526</td>
                                        <td className="py-3 px-4 text-center font-mono">$68,400</td>
                                     </tr>
                                     <tr>
                                        <td className="py-3 px-4 font-medium flex items-center gap-2 text-gray-700">
                                            <Briefcase className="w-4 h-4 text-gray-400"/> {isEn ? 'Avg Starting Salary' : '平均起薪'}
                                        </td>
                                        <td className="py-3 px-4 text-center font-bold text-green-600">$138,900</td>
                                        <td className="py-3 px-4 text-center">$112,000</td>
                                        <td className="py-3 px-4 text-center">$105,000</td>
                                     </tr>
                                  </tbody>
                               </table>
                            </div>
                         </div>

                         {/* 3. Pros & Cons Analysis */}
                         <div className="mb-8 grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <h4 className="font-bold text-gray-800 text-sm text-center">CMU</h4>
                                <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-xs">
                                    <span className="font-bold text-green-700 block mb-1">Pros:</span>
                                    <ul className="list-disc pl-4 space-y-1 text-green-800">
                                        <li>Unrivaled CS reputation</li>
                                        <li>Strong alumni network</li>
                                        <li>Top-tier career outcome</li>
                                    </ul>
                                </div>
                                <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-xs">
                                    <span className="font-bold text-red-700 block mb-1">Cons:</span>
                                    <ul className="list-disc pl-4 space-y-1 text-red-800">
                                        <li>High academic pressure</li>
                                        <li>Expensive tuition</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-gray-800 text-sm text-center">UIUC</h4>
                                <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-xs">
                                    <span className="font-bold text-green-700 block mb-1">Pros:</span>
                                    <ul className="list-disc pl-4 space-y-1 text-green-800">
                                        <li>Top 5 Engineering</li>
                                        <li>Lower cost of living</li>
                                        <li>Huge campus resources</li>
                                    </ul>
                                </div>
                                <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-xs">
                                    <span className="font-bold text-red-700 block mb-1">Cons:</span>
                                    <ul className="list-disc pl-4 space-y-1 text-red-800">
                                        <li>Rural location</li>
                                        <li>Large class sizes</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-gray-800 text-sm text-center">UCSD</h4>
                                <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-xs">
                                    <span className="font-bold text-green-700 block mb-1">Pros:</span>
                                    <ul className="list-disc pl-4 space-y-1 text-green-800">
                                        <li>Perfect weather</li>
                                        <li>Strong bio/tech hub</li>
                                        <li>College system system</li>
                                    </ul>
                                </div>
                                <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-xs">
                                    <span className="font-bold text-red-700 block mb-1">Cons:</span>
                                    <ul className="list-disc pl-4 space-y-1 text-red-800">
                                        <li>Socially quieter</li>
                                        <li>High housing cost</li>
                                    </ul>
                                </div>
                            </div>
                         </div>

                         {/* 4. Recommendation */}
                         <div className="bg-gradient-to-r from-primary-50 to-white p-6 rounded-xl border border-primary-200 shadow-sm">
                            <h3 className="font-bold text-primary-900 mb-3 flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                {isEn ? "Counselor's Final Recommendation" : "顾问最终建议"}
                            </h3>
                            <p className="text-sm text-gray-800 leading-relaxed mb-4">
                                {isEn 
                                  ? "Considering your career goal in high-frequency trading and family budget is not a constraint, **CMU is the clear winner**. Its curriculum rigor and direct pipeline to Wall Street/Big Tech justify the higher cost. UIUC is a fantastic backup if you prefer a more traditional campus life, but CMU's brand in the CS world is unbeatable."
                                  : "考虑到你未来从事高频交易(HFT)的职业目标且家庭预算充足，**CMU 是毫无疑问的首选**。其课程硬核程度以及通往华尔街/科技巨头的就业通道完全值得其较高的学费投入。如果你更偏向传统的校园生活体验，UIUC 是极佳的第二选择，但在 CS 领域的各种资源与品牌溢价上，CMU 具有不可替代的统治力。"}
                            </p>
                            <div className="flex gap-4 pt-4 border-t border-primary-100">
                                <div className="text-xs text-gray-500">
                                    <span className="font-bold text-primary-800 block mb-1">{isEn ? 'Primary Choice:' : '首选推荐:'}</span>
                                    CMU (Accept)
                                </div>
                                <div className="text-xs text-gray-500">
                                    <span className="font-bold text-primary-800 block mb-1">{isEn ? 'Secondary Choice:' : '备选方案:'}</span>
                                    UIUC (Keep Offer)
                                </div>
                            </div>
                         </div>
                      </div>
                   ) : (
                      /* --- STANDARD REPORT VIEW (Comprehensive) --- */
                      <div className="h-full flex flex-col">
                         {/* Header */}
                         <div className="flex justify-between items-end border-b-2 border-primary-600 pb-4 mb-8">
                            <div>
                               <div className="flex items-center gap-2 mb-2">
                                  <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center text-white font-serif font-bold text-xl">N</div>
                                  <span className="font-bold text-xl tracking-wide text-gray-900">NUT EDUCATION</span>
                               </div>
                               <h1 className="text-2xl font-bold text-gray-900">
                                  {isEn ? 'Comprehensive Student Profile' : '学生升学综合档案'}
                               </h1>
                            </div>
                            <div className="text-right">
                               <p className="text-sm font-bold text-gray-600">Confidential</p>
                               <p className="text-xs text-gray-400">{isEn ? 'Generated:' : '生成日期:'} {new Date().toLocaleDateString()}</p>
                            </div>
                         </div>

                         {/* Section 1: Student Profile */}
                         <div className="mb-8">
                            <h2 className="text-sm font-bold text-primary-700 uppercase mb-4 flex items-center gap-2 border-b border-gray-100 pb-1">
                               <User className="w-4 h-4" /> 01. {isEn ? 'Student Profile' : '学生基础画像'}
                            </h2>
                            <div className="flex gap-6">
                               <div className="w-24 flex-shrink-0">
                                  <img src={activeStudent.avatarUrl} alt="avatar" className="w-24 h-24 rounded-lg object-cover border border-gray-100 bg-gray-50" />
                                </div>
                               <div className="flex-1 grid grid-cols-2 gap-y-3 gap-x-8 text-sm">
                                  <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
                                     <span className="text-gray-500">{isEn ? 'Name' : '姓名'}</span>
                                     <span className="font-bold">{activeStudent.name}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
                                     <span className="text-gray-500">{isEn ? 'Grade/Class' : '年级/班级'}</span>
                                     <span className="font-bold">{activeStudent.grade} {activeStudent.class}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
                                     <span className="text-gray-500">{isEn ? 'Direction' : '申请方向'}</span>
                                     <span className="font-bold">{activeStudent.direction}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
                                     <span className="text-gray-500">{isEn ? 'Phase' : '当前阶段'}</span>
                                     <span className="font-bold">{activeStudent.phase}</span>
                                  </div>
                                  <div className="col-span-2 mt-2">
                                     <p className="text-xs text-gray-500 mb-1">{isEn ? 'Tags / Interests' : '兴趣与标签'}</p>
                                     <div className="flex gap-2">
                                        {['CS', 'Robotics', 'Debate', 'Visual Arts'].map(tag => (
                                           <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs border border-gray-200">{tag}</span>
                                        ))}
                                     </div>
                                  </div>
                               </div>
                            </div>
                            
                            {/* Mini Academic Chart Container */}
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-6">
                                <div className="flex-1 h-24 relative min-h-[96px]">
                                    <p className="text-xs text-gray-500 mb-2 font-medium">GPA Trend (Weighted)</p>
                                    <div className="w-full h-16 relative">
                                        {mounted && (
                                            <ResponsiveContainer width="100%" height="100%" debounce={300}>
                                                <LineChart data={reportChartData}>
                                                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                   <XAxis dataKey="name" hide />
                                                   <YAxis domain={[3.0, 4.0]} hide />
                                                   <Line type="monotone" dataKey="value" stroke="#b0826d" strokeWidth={2} dot={{r:3}} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>
                                <div className="w-px h-16 bg-gray-200"></div>
                                <div className="w-1/3 space-y-2">
                                    <div className="flex justify-between text-xs">
                                       <span className="text-gray-500">Toefl</span>
                                       <span className="font-bold">92 / 120</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                       <span className="text-gray-500">SAT</span>
                                       <span className="font-bold text-gray-400">N/A</span>
                                    </div>
                                </div>
                            </div>
                         </div>

                         {/* Section 2: Targets */}
                         <div className="mb-8">
                            <h2 className="text-sm font-bold text-primary-700 uppercase mb-4 flex items-center gap-2 border-b border-gray-100 pb-1">
                               <Target className="w-4 h-4" /> 02. {isEn ? 'Target Schools' : '目标院校规划'}
                            </h2>
                            <div className="grid grid-cols-3 gap-4">
                               <div className="p-3 border border-red-100 bg-red-50/30 rounded-lg">
                                  <div className="text-xs font-bold text-red-600 mb-2 uppercase tracking-wide">Reach {isEn ? '' : '冲刺'}</div>
                                  <div className="space-y-2">
                                     <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center text-[8px] font-bold">CMU</div>
                                        <div>
                                           <p className="text-xs font-bold text-gray-800">Carnegie Mellon</p>
                                           <p className="text-[10px] text-gray-500">CS #1</p>
                                        </div>
                                     </div>
                                     <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center text-[8px] font-bold">CU</div>
                                        <div>
                                           <p className="text-xs font-bold text-gray-800">Cornell</p>
                                           <p className="text-[10px] text-gray-500">Ivy League</p>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                               <div className="p-3 border border-primary-100 bg-primary-50/30 rounded-lg">
                                  <div className="text-xs font-bold text-primary-600 mb-2 uppercase tracking-wide">Match {isEn ? '' : '匹配'}</div>
                                  <div className="space-y-2">
                                     <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center text-[8px] font-bold">UIUC</div>
                                        <div>
                                           <p className="text-xs font-bold text-gray-800">UIUC</p>
                                           <p className="text-[10px] text-gray-500">CS Strong</p>
                                        </div>
                                     </div>
                                     <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center text-[8px] font-bold">UCSD</div>
                                        <div>
                                           <p className="text-xs font-bold text-gray-800">UC San Diego</p>
                                           <p className="text-[10px] text-gray-500">Public Ivy</p>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                               <div className="p-3 border border-green-100 bg-green-50/30 rounded-lg">
                                  <div className="text-xs font-bold text-green-600 mb-2 uppercase tracking-wide">Safety {isEn ? '' : '保底'}</div>
                                  <div className="space-y-2">
                                     <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center text-[8px] font-bold">PSU</div>
                                        <div>
                                           <p className="text-xs font-bold text-gray-800">Penn State</p>
                                           <p className="text-[10px] text-gray-500">Big Ten</p>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>

                         {/* Section 3: Gap Analysis */}
                         <div className="mb-8">
                            <h2 className="text-sm font-bold text-primary-700 uppercase mb-4 flex items-center gap-2 border-b border-gray-100 pb-1">
                               <BarChart3 className="w-4 h-4" /> 03. {isEn ? 'Gap Analysis' : '差距诊断 (Gap Analysis)'}
                            </h2>
                            
                            <table className="w-full text-xs text-left border-collapse mb-4">
                               <thead className="bg-gray-50 border-y border-gray-200 font-bold text-gray-600">
                                  <tr>
                                     <th className="py-2 px-2 w-16">{isEn ? 'Priority' : '优先级'}</th>
                                     <th className="py-2 px-2 w-24">{isEn ? 'Dimension' : '维度'}</th>
                                     <th className="py-2 px-2">{isEn ? 'Observation' : '现状描述'}</th>
                                     <th className="py-2 px-2">{isEn ? 'Recommendation' : '提升建议'}</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-gray-100">
                                  <tr>
                                     <td className="py-3 px-2">
                                        <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">P0</span>
                                     </td>
                                     <td className="py-3 px-2 font-medium">{isEn ? 'Language' : '标化/语言'}</td>
                                     <td className="py-3 px-2 text-gray-600">{isEn ? 'TOEFL 92, significant gap for CMU (102+), especially Speaking (22).' : '托福 92，距离 CMU 要求 (102+) 差距明显，尤其是口语(22)。'}</td>
                                     <td className="py-3 px-2 text-gray-600">{isEn ? 'Join October intensive camp, 2 mock tests/week.' : '建议参加 10 月集训，每周增加 2 次口语模考。'}</td>
                                  </tr>
                                  <tr>
                                     <td className="py-3 px-2">
                                        <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">P1</span>
                                     </td>
                                     <td className="py-3 px-2 font-medium">{isEn ? 'Academic' : '学术/科研'}</td>
                                     <td className="py-3 px-2 text-gray-600">{isEn ? 'Lacks independent CS project output, only schoolwork.' : '目前缺乏独立的 CS 项目产出，仅有校内作业。'}</td>
                                     <td className="py-3 px-2 text-gray-600">{isEn ? 'Organize GitHub repo or join Kaggle entry-level.' : '整理 GitHub 仓库，或参加 Kaggle 初级竞赛补充证据。'}</td>
                                  </tr>
                               </tbody>
                            </table>
                         </div>

                         {/* Section 4: Checklist */}
                         <div className="mb-8">
                            <h2 className="text-sm font-bold text-primary-700 uppercase mb-4 flex items-center gap-2 border-b border-gray-100 pb-1">
                               <ListTodo className="w-4 h-4" /> 04. {isEn ? 'Application Checklist' : '申请材料准备清单'}
                            </h2>
                            <div className="space-y-3">
                               <div className="flex items-center gap-3">
                                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3"/></div>
                                  <span className="text-sm text-gray-400 line-through">9-11 Grade Transcript (Official)</span>
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3"/></div>
                                  <span className="text-sm text-gray-400 line-through">School Profile (2024-25)</span>
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0"></div>
                                  <span className="text-sm text-gray-800 font-medium">Common App Main Essay (Draft 3)</span>
                                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 font-bold">In Progress</span>
                               </div>
                            </div>
                         </div>
                      </div>
                   )}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <FileText className="w-16 h-16 mb-4 opacity-20" />
                    <p>{isEn ? 'Select a template to generate report' : '请选择一个模板生成报告'}</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default ReportCenter;
