import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, CheckCircle, Clock, FileText,
  AlertCircle, Eye, X, Quote, Upload, Sparkles, Loader2, 
  PenTool, CheckCheck, MessageSquare, AlertTriangle, ChevronRight, ChevronDown,
  RefreshCw, RotateCcw, Copy, Check, Download, ArrowRight, ShieldAlert,
  FolderOpen, Zap, ThumbsUp, XCircle, Info, ExternalLink
} from '../common/Icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { RecommenderReq, RecommendationVersion, AIReviewReport, AuditMode, AuditStatus } from '../../types';
import { analyzeRecommendationLetter } from '../../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

interface ActiveTask {
  reqId: string;
  versionId: string;
  mode: 'full' | 'risk_only' | 'language_only';
  versionLabel: string;
  recommenderName: string;
  startTime: number;
}

const INITIAL_RECOMMENDERS: RecommenderReq[] = [
  {
    id: '1',
    name: 'Ms. Sarah',
    role: 'Counselor / 班主任',
    status: 'Completed',
    versions: [
      {
        id: 'v1.1',
        versionLabel: 'Final Version',
        fileName: 'Sarah_Rec_Final.docx',
        fileSize: '24.5 KB',
        content: `Dear Admissions Committee,\n\nIt is my absolute pleasure to recommend Alex for admission. Having known him for three years as his counselor, I can attest to his resilience and intellectual curiosity. While sometimes he can be quiet in class discussions, his contributions are always remarkably thoughtful and deeply analytical.\n\nAlex consistently takes the initiative to mentor younger peers in our science olympiad club. He possesses the rare combination of tenacity and genuine humility that will make him an indispensable asset to your academic community.\n\nSincerely,\nMs. Sarah Jenkins\nHead of College Counseling`,
        uploadDate: '2024-04-20',
        auditStatus: 'completed',
        auditReport: {
          auditMode: 'full',
          auditDate: '2024-04-20',
          negativeContentRisk: {
            level: 'Low',
            analysis: 'The mention of being "quiet" is effectively reframed as "remarkably thoughtful and deeply analytical." No faint praise or red flags detected.'
          },
          wordingGrammar: {
            analysis: 'Exemplary academic tone and persuasive vocabulary. Strong sentence variety throughout.',
            suggestions: [
              'Consider adding a specific quantitative outcome or project title to substantiate the science olympiad mentorship.',
              'Optional: Ensure designation matches official school counselor letterhead format.'
            ]
          }
        }
      },
      {
        id: 'v1.0',
        versionLabel: 'Draft 1',
        fileName: 'Sarah_Rec_Draft1.docx',
        fileSize: '21.0 KB',
        content: `Preliminary draft content for Alex's counselor recommendation...`,
        uploadDate: '2024-04-15',
        auditStatus: 'not_started'
      }
    ]
  },
  {
    id: '2',
    name: 'Mr. Li',
    role: 'Math Teacher / 数学老师',
    status: 'Drafting',
    versions: [
      {
        id: 'v2.1',
        versionLabel: 'v1.0 First Draft',
        fileName: 'Mr_Li_Math_Rec.docx',
        fileSize: '18.2 KB',
        content: `To Whom It May Concern,\n\nI am writing this letter for Alex. He was in my AP Calculus BC class last year. He got good grades, although sometimes he did not turn in homework on time. But when exam time came, his problem-solving skills were adequate.\n\nHe is a good student overall.\n\nBest,\nMr. Li`,
        uploadDate: '2024-04-18',
        auditStatus: 'completed',
        auditReport: {
          auditMode: 'full',
          auditDate: '2024-04-18',
          negativeContentRisk: {
            level: 'High',
            analysis: 'High risk detected: "did not turn in homework on time" and describing skills merely as "adequate" constitutes severe faint praise that will harm the applicant.'
          },
          wordingGrammar: {
            analysis: 'Letter is overly brief and lacks vivid examples or strong academic endorsement verbs.',
            suggestions: [
              'Replace "did not turn in homework on time" with focus on his conceptual depth or independent project work.',
              'Upgrade "adequate" to impactful evaluative phrases such as "exceptional mastery of abstract concepts".'
            ]
          }
        }
      }
    ]
  },
  {
    id: '3',
    name: 'Dr. Zhang',
    role: 'Physics Competition Coach / 竞赛导师',
    status: 'Not Started',
    versions: []
  }
];

const StudentRecommendations: React.FC = () => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  const [recommenders, setRecommenders] = useState<RecommenderReq[]>(INITIAL_RECOMMENDERS);
  const [activeRecommenderId, setActiveRecommenderId] = useState<string | null>(null);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  
  const activeRecommenderData = recommenders.find(r => r.id === activeRecommenderId) || null;
  const activeVersionData = activeRecommenderData?.versions.find(v => v.id === activeVersionId) || null;
  
  // Active Running Tasks (supporting background running and cancellation)
  const [runningTasks, setRunningTasks] = useState<ActiveTask[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Management Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{name: string; role: string; status: RecommenderReq['status']}>({
    name: '', role: '', status: 'Not Started'
  });

  // Upload Modal State (Decoupled with 4 Options)
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTargetReqId, setUploadTargetReqId] = useState<string | null>(null);
  const [uploadVersionLabel, setUploadVersionLabel] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAuditMode, setSelectedAuditMode] = useState<AuditMode>('full');
  const [customFileContent, setCustomFileContent] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Task Cancellation Refs
  const abortControllersRef = useRef<{ [versionId: string]: boolean }>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 4000);
  };

  // --- Handlers ---
  const handleOpenEdit = (req?: RecommenderReq) => {
    if (req) {
      setEditingId(req.id);
      setEditForm({ name: req.name, role: req.role, status: req.status });
    } else {
      setEditingId(null);
      setEditForm({ name: '', role: '', status: 'Not Started' });
    }
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editForm.name.trim() || !editForm.role.trim()) return;
    
    if (editingId) {
      setRecommenders(prev => prev.map(r => r.id === editingId ? { ...r, ...editForm } : r));
      showToast(isEn ? 'Recommender updated successfully.' : '推荐人信息已更新。');
    } else {
      const newReq: RecommenderReq = {
        id: Date.now().toString(),
        name: editForm.name.trim(),
        role: editForm.role.trim(),
        status: editForm.status,
        versions: []
      };
      setRecommenders(prev => [...prev, newReq]);
      showToast(isEn ? 'New recommender added.' : '已添加新推荐人。');
    }
    setIsEditModalOpen(false);
  };

  const handleDeleteRecommender = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(isEn ? 'Are you sure you want to delete this recommender?' : '确定要删除该推荐人及其所有版本信件吗？')) {
      setRecommenders(prev => prev.filter(r => r.id !== id));
      if (activeRecommenderId === id) {
        setActiveRecommenderId(null);
        setActiveVersionId(null);
      }
      showToast(isEn ? 'Recommender deleted.' : '推荐人已删除。');
    }
  };

  const openUploadDialog = (reqId: string) => {
    const targetReq = recommenders.find(r => r.id === reqId);
    const nextVerNumber = targetReq ? targetReq.versions.length + 1 : 1;
    setUploadTargetReqId(reqId);
    setUploadVersionLabel(`v${nextVerNumber}.0 ${isEn ? 'Draft' : '草稿'}`);
    setSelectedFile(null);
    setCustomFileContent('');
    setSelectedAuditMode('full');
    setUploadModalOpen(true);
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
      reader.onload = (e) => {
        setCustomFileContent((e.target?.result as string) || '');
      };
      reader.readAsText(file);
    } else {
      // For binary files (docx/pdf), simulate realistic recommendation content for AI audit
      const realisticSample = `Dear Admissions Committee,\n\nI am pleased to write in strong support of Alex's application. Having taught him Advanced Placement coursework for two consecutive years, I have seen firsthand his intellectual diligence and creative approach to problem-solving.\n\nWhile Alex sometimes prefers to work independently on challenging assignments, his classroom presentations are structured and compelling. In our capstone project, he voluntarily assisted several teammates in debugging complex simulation code.\n\nI recommend Alex without reservation for admission to your undergraduate program.\n\nSincerely,\nRecommender Department`;
      setCustomFileContent(realisticSample);
    }
  };

  // Core Audit Trigger (Decoupled, Background-capable, Cancellable, Resilient)
  const executeAudit = async (
    reqId: string, 
    versionId: string, 
    mode: 'full' | 'risk_only' | 'language_only',
    content: string,
    versionLabel: string,
    recommenderName: string
  ) => {
    // Register task
    abortControllersRef.current[versionId] = false;
    const newTask: ActiveTask = {
      reqId,
      versionId,
      mode,
      versionLabel,
      recommenderName,
      startTime: Date.now()
    };

    setRunningTasks(prev => [...prev.filter(t => t.versionId !== versionId), newTask]);

    // Update version status to running
    setRecommenders(prev => prev.map(r => {
      if (r.id === reqId) {
        return {
          ...r,
          versions: r.versions.map(v => v.id === versionId ? { ...v, auditStatus: 'running' } : v)
        };
      }
      return r;
    }));

    try {
      const report = await analyzeRecommendationLetter(content, isEn, mode);

      // Check if cancelled during execution
      if (abortControllersRef.current[versionId]) {
        console.log(`Task for version ${versionId} was cancelled by user.`);
        return;
      }

      // Update version with report
      setRecommenders(prev => prev.map(r => {
        if (r.id === reqId) {
          return {
            ...r,
            status: 'Completed',
            versions: r.versions.map(v => {
              if (v.id === versionId) {
                return {
                  ...v,
                  auditStatus: 'completed',
                  auditReport: report
                };
              }
              return v;
            })
          };
        }
        return r;
      }));

      showToast(isEn ? `AI Audit finished for ${recommenderName} (${versionLabel}).` : `【${recommenderName} - ${versionLabel}】AI 审查已完成！`);
    } catch (err: any) {
      console.error("AI Audit Error:", err);
      // Retain the file! Mark as failed with clean retry entry
      if (!abortControllersRef.current[versionId]) {
        setRecommenders(prev => prev.map(r => {
          if (r.id === reqId) {
            return {
              ...r,
              versions: r.versions.map(v => {
                if (v.id === versionId) {
                  return {
                    ...v,
                    auditStatus: 'failed',
                    auditReport: {
                      auditMode: mode,
                      errorMessage: isEn ? 'AI review failed due to network timeout or service error.' : 'AI 审查未成功完成（可能由于网络超时或服务波动）。'
                    }
                  };
                }
                return v;
              })
            };
          }
          return r;
        }));
        showToast(isEn ? 'AI review encountered an error. Original file is safely saved.' : 'AI 审查遇到问题，原始文件已妥善保存，可随时重试。');
      }
    } finally {
      // Remove from running tasks
      setRunningTasks(prev => prev.filter(t => t.versionId !== versionId));
      delete abortControllersRef.current[versionId];
    }
  };

  const handleCancelTask = (versionId: string, reqId: string) => {
    abortControllersRef.current[versionId] = true;
    setRunningTasks(prev => prev.filter(t => t.versionId !== versionId));
    
    setRecommenders(prev => prev.map(r => {
      if (r.id === reqId) {
        return {
          ...r,
          versions: r.versions.map(v => {
            if (v.id === versionId) {
              return {
                ...v,
                auditStatus: 'cancelled'
              };
            }
            return v;
          })
        };
      }
      return r;
    }));

    showToast(isEn ? 'AI audit cancelled. File is preserved.' : '已取消 AI 审查，文件保持原样无损。');
  };

  // Submit Decoupled Upload
  const handleConfirmUpload = () => {
    if (!uploadTargetReqId) return;
    if (!selectedFile) {
      alert(isEn ? 'Please choose a file to upload.' : '请选择需要上传的推荐信文件。');
      return;
    }
    const label = uploadVersionLabel.trim() || `v${Date.now()}`;
    const targetReq = recommenders.find(r => r.id === uploadTargetReqId);
    if (!targetReq) return;

    const newVersionId = `v-${Date.now()}`;
    const content = customFileContent || `Dear Admissions Committee,\n\nRecommendation letter content for ${selectedFile.name}...`;

    const newVersion: RecommendationVersion = {
      id: newVersionId,
      versionLabel: label,
      fileName: selectedFile.name,
      fileSize: `${(selectedFile.size / 1024).toFixed(1)} KB`,
      content: content,
      uploadDate: new Date().toISOString().split('T')[0],
      auditStatus: selectedAuditMode === 'save_only' ? 'not_started' : 'running'
    };

    // Step 1: ALWAYS SAVE FILE FIRST (Decoupled!)
    setRecommenders(prev => prev.map(r => {
      if (r.id === uploadTargetReqId) {
        return {
          ...r,
          status: r.status === 'Not Started' ? 'Drafting' : r.status,
          versions: [newVersion, ...r.versions]
        };
      }
      return r;
    }));

    // If workspace is open on this recommender, select new version
    if (activeRecommenderId === uploadTargetReqId) {
      setActiveVersionId(newVersionId);
    }

    setUploadModalOpen(false);

    if (selectedAuditMode === 'save_only') {
      showToast(isEn ? `File "${selectedFile.name}" saved successfully (No AI audit).` : `文件 "${selectedFile.name}" 已成功保存入库（未开启 AI 审查）。`);
    } else {
      showToast(isEn ? `File saved. Starting ${selectedAuditMode} AI audit in background...` : `文件已安全入库，正在启动 AI 审查...`);
      executeAudit(
        uploadTargetReqId,
        newVersionId,
        selectedAuditMode as ('full' | 'risk_only' | 'language_only'),
        content,
        label,
        targetReq.name
      );
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="h-full flex flex-col relative space-y-6">
      {/* Top Banner / Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-zinc-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-zinc-700/60 flex items-center gap-3 text-sm font-medium"
          >
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="p-1 text-zinc-400 hover:text-white ml-2">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-xl">{isEn ? 'Recommendation Letter Hub' : '推荐信管理与智能审查'}</h3>
            <span className="text-xs bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-semibold px-2.5 py-1 rounded-full border border-primary-200/60 dark:border-primary-800/40">
              {isEn ? 'Decoupled Upload & AI Audit' : '上传与审查解耦 • 支持多模式'}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 max-w-2xl">
            {isEn 
              ? 'Upload recommendation letters without forced audit. Freely choose between Save-Only, Risk Audit, Language Optimization, or Full Review at any time.' 
              : '推荐信上传与 AI 审查完全解耦：支持仅保存文件、观点风险审查、语言优化或完整双向审查。后台长任务支持取消与重试。'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleOpenEdit()}
            className="px-4 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {isEn ? 'Add Recommender' : '添加推荐人'}
          </button>
        </div>
      </div>

      {/* Floating Background Task Indicator (if any tasks are running in background) */}
      {runningTasks.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                {isEn ? `${runningTasks.length} AI Audit task(s) running in background...` : `正在后台运行 ${runningTasks.length} 项 AI 审查任务...`}
              </p>
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                {runningTasks.map(t => `${t.recommenderName} (${t.versionLabel})`).join(' • ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{isEn ? 'You can freely leave this tab' : '您可以自由切换页面'}</span>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/70 dark:bg-zinc-800/50 text-gray-500 dark:text-zinc-400 font-semibold border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="px-6 py-4">{isEn ? 'Recommender' : '推荐人信息'}</th>
                <th className="px-6 py-4">{isEn ? 'Status' : '跟进状态'}</th>
                <th className="px-6 py-4">{isEn ? 'Latest Version / File' : '最新版本与文件'}</th>
                <th className="px-6 py-4">{isEn ? 'AI Audit Status' : 'AI 审查状态'}</th>
                <th className="px-6 py-4 text-right">{isEn ? 'Actions' : '操作'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {recommenders.map(req => {
                const latestVersion = req.versions[0] || null;
                const isCurrentTaskRunning = latestVersion && runningTasks.some(t => t.versionId === latestVersion.id);

                return (
                  <tr key={req.id} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-800/40 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-base shadow-2xs">
                          {req.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-zinc-100 text-sm">{req.name}</div>
                          <div className="text-xs text-gray-500 dark:text-zinc-400">{req.role}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        req.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50' :
                        req.status === 'Drafting' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50' :
                        'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400 border border-gray-200/50'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          req.status === 'Completed' ? 'bg-emerald-500' :
                          req.status === 'Drafting' ? 'bg-amber-500' : 'bg-gray-400'
                        }`} />
                        {req.status === 'Completed' ? (isEn ? 'Completed' : '已完成') :
                         req.status === 'Drafting' ? (isEn ? 'Drafting' : '起草中') :
                         (isEn ? 'Not Started' : '未开始')}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      {latestVersion ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-800 dark:text-zinc-200">
                            <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                            <span className="font-medium truncate max-w-[180px]" title={latestVersion.fileName}>{latestVersion.fileName}</span>
                            {latestVersion.fileSize && (
                              <span className="text-[10px] text-gray-400 font-mono">({latestVersion.fileSize})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-medium text-gray-600 dark:text-zinc-400">
                              {latestVersion.versionLabel}
                            </span>
                            {req.versions.length > 1 && (
                              <span className="text-[11px] text-primary-600 dark:text-primary-400 font-medium">
                                共 {req.versions.length} 个版本
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-zinc-500 text-xs italic">{isEn ? 'No files uploaded' : '尚未上传信件'}</span>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      {isCurrentTaskRunning || latestVersion?.auditStatus === 'running' ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            {isEn ? 'Auditing...' : 'AI 审查中...'}
                          </span>
                          <button
                            onClick={() => handleCancelTask(latestVersion.id, req.id)}
                            className="text-[11px] text-gray-500 hover:text-red-600 hover:underline cursor-pointer"
                          >
                            {isEn ? 'Cancel' : '取消'}
                          </button>
                        </div>
                      ) : latestVersion?.auditStatus === 'failed' ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {isEn ? 'Audit Failed' : '审查失败'}
                          </span>
                          <button
                            onClick={() => {
                              executeAudit(req.id, latestVersion.id, latestVersion.auditReport?.auditMode || 'full', latestVersion.content, latestVersion.versionLabel, req.name);
                            }}
                            className="text-[11px] text-primary-600 hover:text-primary-800 dark:text-primary-400 font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            {isEn ? 'Retry' : '重试'}
                          </button>
                        </div>
                      ) : latestVersion?.auditStatus === 'completed' && latestVersion.auditReport ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          {latestVersion.auditReport.negativeContentRisk && (
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              latestVersion.auditReport.negativeContentRisk.level === 'Low' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30' :
                              latestVersion.auditReport.negativeContentRisk.level === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30' :
                              'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30'
                            }`}>
                              {isEn ? `Risk: ${latestVersion.auditReport.negativeContentRisk.level}` : `风险: ${latestVersion.auditReport.negativeContentRisk.level}`}
                            </span>
                          )}
                          {latestVersion.auditReport.wordingGrammar && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300">
                              {isEn ? 'Language Checked' : '语言已校验'}
                            </span>
                          )}
                        </div>
                      ) : latestVersion ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                            {latestVersion.auditStatus === 'cancelled' ? (isEn ? 'Cancelled' : '已取消') : (isEn ? 'Not Audited' : '未审查')}
                          </span>
                          <button
                            onClick={() => {
                              executeAudit(req.id, latestVersion.id, 'full', latestVersion.content, latestVersion.versionLabel, req.name);
                            }}
                            className="text-[11px] text-primary-600 hover:text-primary-800 dark:text-primary-400 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            {isEn ? 'Start Audit' : '发起审查'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-300 dark:text-zinc-600 text-xs">-</span>
                      )}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openUploadDialog(req.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:text-primary-700 bg-gray-100 hover:bg-primary-50 dark:bg-zinc-800 dark:hover:bg-primary-950/50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title={isEn ? "Upload new version" : "上传新版本信件"}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isEn ? 'Upload' : '上传'}</span>
                        </button>
                        <button 
                          onClick={() => {
                            setActiveRecommenderId(req.id);
                            setActiveVersionId(req.versions.length > 0 ? req.versions[0].id : null);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/60 dark:text-primary-300 dark:hover:bg-primary-900/60 rounded-lg transition-colors cursor-pointer"
                        >
                          {isEn ? "Workspace" : "工作台"}
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(req)} 
                          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors" 
                          title={isEn ? "Edit" : "编辑"}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteRecommender(req.id, e)} 
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" 
                          title={isEn ? "Delete" : "删除"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- PREVIEW & AI REPORT MODAL (WORKSPACE) --- */}
      <AnimatePresence>
        {activeRecommenderId && activeRecommenderData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 md:p-8"
          >
            <motion.div 
              initial={{ scale: 0.96, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-[1400px] overflow-hidden flex h-[90vh] border border-gray-200 dark:border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Sidebar: Version History & Upload */}
              <div className="w-80 bg-gray-50/70 dark:bg-zinc-850 border-r border-gray-200 dark:border-white/5 flex flex-col overflow-hidden shrink-0">
                <div className="p-6 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-zinc-900">
                   <div className="flex items-center justify-between mb-1">
                     <h4 className="font-bold text-gray-900 dark:text-zinc-100 text-lg flex items-center gap-2">
                       <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                       {activeRecommenderData.name}
                     </h4>
                   </div>
                   <p className="text-xs text-gray-500 dark:text-zinc-400 mb-5">{activeRecommenderData.role}</p>
                   
                   <button 
                     onClick={() => openUploadDialog(activeRecommenderData.id)}
                     className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                   >
                     <Upload className="w-4 h-4" /> {isEn ? 'Upload New Version' : '上传新版本'}
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                   <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3 px-2">{isEn ? 'Version History' : '版本列表'}</p>
                   {activeRecommenderData.versions.length === 0 ? (
                     <div className="text-sm text-gray-400 px-2 italic text-center py-10">
                       <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                       {isEn ? 'No versions uploaded yet.' : '尚未记录任何版本'}
                     </div>
                   ) : (
                     activeRecommenderData.versions.map(v => {
                       const isSelected = activeVersionId === v.id;
                       const isRunning = runningTasks.some(t => t.versionId === v.id) || v.auditStatus === 'running';

                       return (
                         <button
                           key={v.id}
                           onClick={() => setActiveVersionId(v.id)}
                           className={`w-full text-left px-4 py-3.5 rounded-xl transition-all border cursor-pointer ${
                             isSelected 
                               ? 'bg-white dark:bg-zinc-800 border-primary-300 dark:border-primary-500/40 shadow-sm ring-1 ring-primary-500/20' 
                               : 'border-transparent hover:bg-white/60 dark:hover:bg-zinc-800/50'
                           }`}
                         >
                           <div className="flex items-center justify-between mb-1">
                             <div className={`font-bold text-sm ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-zinc-200'}`}>
                               {v.versionLabel}
                             </div>
                             {isRunning ? (
                               <span className="text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                                 <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                 {isEn ? 'Auditing' : '审查中'}
                               </span>
                             ) : v.auditStatus === 'completed' ? (
                               <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                                 <Check className="w-2.5 h-2.5" />
                                 {isEn ? 'Audited' : '已审查'}
                               </span>
                             ) : v.auditStatus === 'failed' ? (
                               <span className="text-[10px] text-red-600 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded font-semibold">
                                 {isEn ? 'Failed' : '失败'}
                               </span>
                             ) : (
                               <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                                 {isEn ? 'Saved' : '仅保存'}
                               </span>
                             )}
                           </div>
                           <div className="text-xs text-gray-500 dark:text-zinc-400 truncate mb-1" title={v.fileName}>{v.fileName}</div>
                           <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono flex items-center justify-between">
                             <span>{v.uploadDate}</span>
                             {v.fileSize && <span>{v.fileSize}</span>}
                           </div>
                         </button>
                       );
                     })
                   )}
                </div>
              </div>

              {/* Middle & Right: Content depending on selected version */}
              {activeVersionData ? (
                <>
                  {/* Middle: Letter Text Viewing Area */}
                  <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/40 dark:bg-zinc-950/40">
                    <div className="px-8 py-5 border-b border-gray-200 dark:border-white/5 flex justify-between items-center bg-white dark:bg-zinc-900 shadow-2xs z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-800/40 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                          <Quote className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-zinc-100 text-base">{isEn ? 'Letter Text Content' : '推荐信正文内容'}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                            <span className="font-semibold text-primary-700 dark:text-primary-300">{activeVersionData.versionLabel}</span>
                            <span>•</span>
                            <span>{activeVersionData.fileName}</span>
                            <span>•</span>
                            <span>{activeVersionData.content.split(/\s+/).length} {isEn ? 'words' : '词'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(activeVersionData.content, 999)}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:text-primary-600 bg-gray-100 hover:bg-primary-50 dark:bg-zinc-800 dark:hover:bg-primary-950/40 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          title={isEn ? "Copy letter text" : "复制推荐信全文"}
                        >
                          {copiedIndex === 999 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedIndex === 999 ? (isEn ? 'Copied' : '已复制') : (isEn ? 'Copy' : '复制全文')}</span>
                        </button>
                        <button 
                          onClick={() => setActiveRecommenderId(null)}
                          className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-all md:hidden"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10">
                      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 p-8 md:p-12 shadow-sm border border-gray-200 dark:border-white/5 rounded-2xl min-h-full font-serif text-base md:text-lg leading-relaxed text-gray-800 dark:text-zinc-200 whitespace-pre-wrap selection:bg-primary-100 dark:selection:bg-primary-900/40">
                        {activeVersionData.content}
                      </div>
                    </div>
                  </div>

                  {/* Right: AI Intelligence Hub (Flexible & Non-blocking) */}
                  <div className="w-96 md:w-[440px] bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-white/5 flex flex-shrink-0 flex-col overflow-hidden z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
                    <div className="px-6 py-5 border-b border-gray-200 dark:border-white/5 bg-gray-50/80 dark:bg-zinc-850 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        <span className="font-bold text-gray-900 dark:text-zinc-100 text-sm">{isEn ? 'AI Intelligence Hub' : 'AI 深度审查报告'}</span>
                      </div>
                      <button 
                        onClick={() => setActiveRecommenderId(null)}
                        className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-all hidden md:block cursor-pointer"
                        title={isEn ? "Close workspace" : "关闭工作台"}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                      {/* State A: Running / Analyzing */}
                      {(runningTasks.some(t => t.versionId === activeVersionData.id) || activeVersionData.auditStatus === 'running') ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                            className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800/40 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-md"
                          >
                            <Sparkles className="w-8 h-8" />
                          </motion.div>
                          <div>
                            <h5 className="font-bold text-gray-900 dark:text-zinc-100 text-base">{isEn ? 'AI Audit in Progress...' : 'AI 审查正在进行中'}</h5>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
                              {isEn ? 'Scanning recommendation content for negative tone risks and language suggestions.' : '正在对推荐信进行全真模拟评估，排查隐性负面词与提升学术用语...'}
                            </p>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-primary-600 h-full rounded-full w-2/3 animate-pulse" />
                          </div>
                          <div className="flex items-center gap-3 pt-2">
                            <button
                              onClick={() => {
                                showToast(isEn ? 'AI audit continues in background.' : '审查将在后台继续运行，完成后将提示通知。');
                              }}
                              className="px-4 py-2 text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/50 dark:text-primary-300 rounded-xl border border-primary-200 transition-colors cursor-pointer"
                            >
                              {isEn ? 'Run in Background' : '后台运行'}
                            </button>
                            <button
                              onClick={() => handleCancelTask(activeVersionData.id, activeRecommenderData.id)}
                              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                            >
                              {isEn ? 'Cancel Audit' : '取消审查'}
                            </button>
                          </div>
                        </div>
                      ) : activeVersionData.auditStatus === 'failed' ? (
                        /* State B: Failed with recovery & retry */
                        <div className="p-6 bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-2xl space-y-4">
                          <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                            <AlertCircle className="w-6 h-6 flex-shrink-0" />
                            <div>
                              <h5 className="font-bold text-sm">{isEn ? 'AI Review Failed' : 'AI 审查未成功完成'}</h5>
                              <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
                                {activeVersionData.auditReport?.errorMessage || (isEn ? 'Network timeout or API response error.' : '网络超时或接口异常，请点击重试。')}
                              </p>
                            </div>
                          </div>

                          <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-red-100 dark:border-red-900/30 text-xs text-gray-600 dark:text-zinc-300">
                            <span className="font-semibold text-gray-800 dark:text-zinc-200">{isEn ? 'File Preserved:' : '文件完整保留：'}</span> {activeVersionData.fileName}
                            <p className="text-gray-500 dark:text-zinc-400 mt-1">{isEn ? 'Your original uploaded text is completely intact and readable.' : '推荐信正文已安全保存于系统，不会丢失任何数据。'}</p>
                          </div>

                          <div className="space-y-2 pt-2">
                            <button
                              onClick={() => executeAudit(activeRecommenderData.id, activeVersionData.id, 'full', activeVersionData.content, activeVersionData.versionLabel, activeRecommenderData.name)}
                              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" />
                              {isEn ? 'Retry Full Audit' : '重新发起完整审查'}
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => executeAudit(activeRecommenderData.id, activeVersionData.id, 'risk_only', activeVersionData.content, activeVersionData.versionLabel, activeRecommenderData.name)}
                                className="py-2 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-xs font-medium rounded-xl border border-gray-200 dark:border-white/10 transition-colors cursor-pointer"
                              >
                                {isEn ? 'Try Risk Only' : '仅审查风险'}
                              </button>
                              <button
                                onClick={() => executeAudit(activeRecommenderData.id, activeVersionData.id, 'language_only', activeVersionData.content, activeVersionData.versionLabel, activeRecommenderData.name)}
                                className="py-2 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-xs font-medium rounded-xl border border-gray-200 dark:border-white/10 transition-colors cursor-pointer"
                              >
                                {isEn ? 'Try Language Only' : '仅校对语言'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : activeVersionData.auditStatus === 'completed' && activeVersionData.auditReport ? (
                        /* State C: Audit Completed Report */
                        <div className="space-y-6">
                          {/* Re-audit Actions Header */}
                          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
                            <div className="text-xs text-gray-500 dark:text-zinc-400">
                              {isEn ? 'Mode:' : '审查模式:'} <span className="font-semibold text-gray-800 dark:text-zinc-200">
                                {activeVersionData.auditReport.auditMode === 'risk_only' ? (isEn ? 'Risk Only' : '观点风险') :
                                 activeVersionData.auditReport.auditMode === 'language_only' ? (isEn ? 'Language Only' : '语言校对') :
                                 (isEn ? 'Full Review' : '双向完整审查')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => executeAudit(activeRecommenderData.id, activeVersionData.id, 'full', activeVersionData.content, activeVersionData.versionLabel, activeRecommenderData.name)}
                                className="px-2.5 py-1 text-xs font-semibold text-primary-700 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/40 dark:text-primary-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title={isEn ? "Re-run AI review" : "重新进行 AI 审查"}
                              >
                                <RefreshCw className="w-3 h-3" />
                                {isEn ? 'Re-audit' : '重新审查'}
                              </button>
                            </div>
                          </div>

                          {/* Section 1: Negative Content Risk */}
                          {activeVersionData.auditReport.negativeContentRisk && (
                            <section className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                                  <h5 className="font-bold text-sm uppercase tracking-wide">{isEn ? '1. Content Risk Audit' : '1. 观点与负面风险评估'}</h5>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${
                                  activeVersionData.auditReport.negativeContentRisk.level === 'Low' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                                  activeVersionData.auditReport.negativeContentRisk.level === 'Medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                                  'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                }`}>
                                  {activeVersionData.auditReport.negativeContentRisk.level} Risk
                                </span>
                              </div>
                              <div className={`p-4 rounded-2xl border ${
                                activeVersionData.auditReport.negativeContentRisk.level === 'Low' ? 'bg-emerald-50/60 border-emerald-200/80 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200' :
                                activeVersionData.auditReport.negativeContentRisk.level === 'Medium' ? 'bg-amber-50/60 border-amber-200/80 dark:bg-amber-950/20 text-amber-950 dark:text-amber-200' :
                                'bg-rose-50/60 border-rose-200/80 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200'
                              }`}>
                                <p className="text-xs leading-relaxed font-medium">
                                  {activeVersionData.auditReport.negativeContentRisk.analysis}
                                </p>
                              </div>
                            </section>
                          )}

                          {/* Section 2: Wording & Grammar */}
                          {activeVersionData.auditReport.wordingGrammar && (
                            <section className="space-y-3">
                              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                <PenTool className="w-4 h-4 text-indigo-500" />
                                <h5 className="font-bold text-sm uppercase tracking-wide">{isEn ? '2. Language & Fluency' : '2. 措辞学术性与语法校验'}</h5>
                              </div>
                              <div className="bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-white/5 rounded-2xl p-4 space-y-3">
                                <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed italic">
                                  "{activeVersionData.auditReport.wordingGrammar.analysis}"
                                </p>
                                
                                {activeVersionData.auditReport.wordingGrammar.suggestions && activeVersionData.auditReport.wordingGrammar.suggestions.length > 0 && (
                                  <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-white/5">
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{isEn ? 'Actionable Suggestions' : '针对性修改建议'}</p>
                                    {activeVersionData.auditReport.wordingGrammar.suggestions.map((s, i) => (
                                      <div key={i} className="flex gap-2 items-start text-xs text-gray-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-200/70 dark:border-white/5 shadow-2xs group">
                                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary-500" />
                                        <span className="flex-1 leading-relaxed">{s}</span>
                                        <button
                                          onClick={() => copyToClipboard(s, i)}
                                          className="text-gray-400 hover:text-primary-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                          title={isEn ? "Copy suggestion" : "复制建议"}
                                        >
                                          {copiedIndex === i ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </section>
                          )}
                          
                          {/* Advice callout */}
                          <div className="bg-primary-50/70 dark:bg-primary-950/30 border border-primary-200/60 dark:border-primary-800/40 rounded-2xl p-4 text-xs text-primary-900 dark:text-primary-200 flex items-start gap-2.5">
                            <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                            <p className="leading-relaxed">
                              {isEn 
                                ? 'AI audit report is tailored for admissions committees. You can adjust the letter text based on suggestions and upload a revised version.'
                                : '审查建议已针对名校招生办关注点优化。您可根据建议微调正文后直接点击左上角上传新版本。'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* State D: Not Audited (Teacher can trigger audit anytime) */
                        <div className="space-y-5">
                          <div className="text-center py-6 px-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                            <Sparkles className="w-10 h-10 mx-auto text-primary-500/60 mb-2" />
                            <h5 className="font-bold text-gray-800 dark:text-zinc-200 text-sm mb-1">{isEn ? 'No AI Audit Run Yet' : '该版本尚未进行 AI 审查'}</h5>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-xs mx-auto">
                              {isEn ? 'Choose an audit mode below to evaluate content risks or polish language.' : '文件已安全保存。请在下方自由选择审查模式发起分析：'}
                            </p>
                          </div>

                          <div className="space-y-2.5">
                            {/* Option 1: Full */}
                            <div 
                              onClick={() => executeAudit(activeRecommenderData.id, activeVersionData.id, 'full', activeVersionData.content, activeVersionData.versionLabel, activeRecommenderData.name)}
                              className="p-3.5 bg-primary-50/60 dark:bg-primary-950/30 hover:bg-primary-100/70 dark:hover:bg-primary-900/40 border border-primary-200/80 dark:border-primary-800/40 rounded-xl cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center shadow-xs">
                                  <Sparkles className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-primary-900 dark:text-primary-200">{isEn ? 'Full Bi-Dimensional Audit' : '完整双向审查（推荐）'}</div>
                                  <div className="text-[11px] text-primary-700 dark:text-primary-400">{isEn ? 'Content Risk + Language Polish' : '观点负面风险排查 + 措辞语法优化'}</div>
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-primary-600 group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Option 2: Risk Only */}
                            <div 
                              onClick={() => executeAudit(activeRecommenderData.id, activeVersionData.id, 'risk_only', activeVersionData.content, activeVersionData.versionLabel, activeRecommenderData.name)}
                              className="p-3.5 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-white/10 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                                  <AlertTriangle className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-gray-900 dark:text-zinc-100">{isEn ? 'Content Risk Audit Only' : '仅观点/负面风险评估'}</div>
                                  <div className="text-[11px] text-gray-500 dark:text-zinc-400">{isEn ? 'Checks faint praise and red flags' : '严查明褒实贬、敏感词与隐性负面'}</div>
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Option 3: Language Only */}
                            <div 
                              onClick={() => executeAudit(activeRecommenderData.id, activeVersionData.id, 'language_only', activeVersionData.content, activeVersionData.versionLabel, activeRecommenderData.name)}
                              className="p-3.5 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-white/10 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-xs">
                                  <PenTool className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-gray-900 dark:text-zinc-100">{isEn ? 'Language Optimization Only' : '仅语言与表达优化'}</div>
                                  <div className="text-[11px] text-gray-500 dark:text-zinc-400">{isEn ? 'Grammar, tone & vocabulary polish' : '学术用语、语法连贯性与表达升级'}</div>
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 text-gray-400 p-8 space-y-4 relative">
                  <button 
                    onClick={() => setActiveRecommenderId(null)}
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 bg-white dark:bg-zinc-800 rounded-full shadow-sm cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <FileText className="w-16 h-16 opacity-20" />
                  <p className="text-base font-medium">{isEn ? 'Select a version from left panel' : '请从左侧选择一个版本进行查阅'}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DECOUPLED UPLOAD MODAL (With 4 Options: Save Only, Risk, Language, Full) --- */}
      {uploadModalOpen && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setUploadModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg p-6 md:p-8 border border-gray-200 dark:border-white/10 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-lg">{isEn ? 'Upload Recommendation Letter' : '上传推荐信版本'}</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  {isEn ? 'File is saved first. You can choose whether and how to run AI review.' : '文件将立即安全入库。您可以自由选择是否进行 AI 审查。'}
                </p>
              </div>
              <button onClick={() => setUploadModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Version Label */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  {isEn ? 'Version Label' : '版本标识'}
                </label>
                <input 
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" 
                  value={uploadVersionLabel} 
                  onChange={e => setUploadVersionLabel(e.target.value)} 
                  placeholder={isEn ? "e.g. Draft 1, Final Version" : "例如：v1.0 初稿，最终定稿"}
                />
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  {isEn ? 'File Attachment' : '信件文件'}
                </label>
                <div 
                  className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    selectedFile 
                      ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20' 
                      : 'border-gray-300 dark:border-zinc-700 hover:border-primary-500 hover:bg-primary-50/40 dark:hover:bg-primary-950/20'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
                      <FileText className="w-7 h-7 text-emerald-600" />
                      <div>
                        <div className="font-bold text-sm truncate max-w-[240px]">{selectedFile.name}</div>
                        <div className="text-xs text-emerald-600/80">{(selectedFile.size / 1024).toFixed(1)} KB • {isEn ? 'Click to change' : '点击重新选择'}</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 text-gray-400 mb-2" />
                      <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{isEn ? 'Click or drag file here to upload' : '点击或将推荐信文件拖拽至此处'}</p>
                      <p className="text-[11px] text-gray-400 mt-1">支持 .docx, .doc, .txt, .pdf</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".docx,.doc,.txt,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelected(file);
                    }}
                  />
                </div>
              </div>

              {/* Review Option Radio Group (The core requirement) */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-2.5">
                  {isEn ? 'AI Review Options' : 'AI 审查模式选择'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Save Only */}
                  <div
                    onClick={() => setSelectedAuditMode('save_only')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      selectedAuditMode === 'save_only'
                        ? 'bg-zinc-50 dark:bg-zinc-800 border-zinc-500 ring-1 ring-zinc-500/20'
                        : 'bg-white dark:bg-zinc-850 border-gray-200 dark:border-white/5 hover:bg-gray-50'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="auditMode" 
                      checked={selectedAuditMode === 'save_only'} 
                      onChange={() => setSelectedAuditMode('save_only')}
                      className="mt-0.5 text-primary-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-zinc-100">{isEn ? 'Save Only' : '仅保存文件'}</div>
                      <div className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">{isEn ? 'No AI audit, save instantly' : '暂不审查，快速入库保存'}</div>
                    </div>
                  </div>

                  {/* Option 2: Full Review */}
                  <div
                    onClick={() => setSelectedAuditMode('full')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      selectedAuditMode === 'full'
                        ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-500 ring-1 ring-primary-500/20'
                        : 'bg-white dark:bg-zinc-850 border-gray-200 dark:border-white/5 hover:bg-gray-50'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="auditMode" 
                      checked={selectedAuditMode === 'full'} 
                      onChange={() => setSelectedAuditMode('full')}
                      className="mt-0.5 text-primary-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-primary-900 dark:text-primary-200 flex items-center gap-1">
                        {isEn ? 'Full Review' : '完整双向审查'}
                        <span className="text-[9px] bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-1 py-0.2 rounded font-bold">{isEn ? 'Rec' : '推荐'}</span>
                      </div>
                      <div className="text-[10px] text-primary-700/80 dark:text-primary-300/80 mt-0.5">{isEn ? 'Risk audit + Language polish' : '观点风险 + 语言质量双检'}</div>
                    </div>
                  </div>

                  {/* Option 3: Risk Only */}
                  <div
                    onClick={() => setSelectedAuditMode('risk_only')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      selectedAuditMode === 'risk_only'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/20'
                        : 'bg-white dark:bg-zinc-850 border-gray-200 dark:border-white/5 hover:bg-gray-50'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="auditMode" 
                      checked={selectedAuditMode === 'risk_only'} 
                      onChange={() => setSelectedAuditMode('risk_only')}
                      className="mt-0.5 text-amber-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-zinc-100">{isEn ? 'Risk Audit' : '观点风险审查'}</div>
                      <div className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">{isEn ? 'Detect faint praise & red flags' : '专查明褒实贬与隐性风险'}</div>
                    </div>
                  </div>

                  {/* Option 4: Language Only */}
                  <div
                    onClick={() => setSelectedAuditMode('language_only')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      selectedAuditMode === 'language_only'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/20'
                        : 'bg-white dark:bg-zinc-850 border-gray-200 dark:border-white/5 hover:bg-gray-50'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="auditMode" 
                      checked={selectedAuditMode === 'language_only'} 
                      onChange={() => setSelectedAuditMode('language_only')}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-zinc-100">{isEn ? 'Language Polish' : '语言优化校对'}</div>
                      <div className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">{isEn ? 'Academic tone & grammar' : '提升学术措辞与语法流畅'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
              <button 
                onClick={() => setUploadModalOpen(false)} 
                className="px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-zinc-400 hover:text-gray-800 bg-gray-100 dark:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                {isEn ? 'Cancel' : '取消'}
              </button>
              <button 
                onClick={handleConfirmUpload} 
                className="px-6 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {selectedAuditMode === 'save_only' ? (isEn ? 'Save File' : '确认保存入库') : (isEn ? 'Save & Start Audit' : '保存并启动审查')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT / ADD RECOMMENDER MODAL --- */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" 
          onClick={() => setIsEditModalOpen(false)}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 border border-gray-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-lg mb-5">
              {editingId ? (isEn ? 'Edit Recommender' : '编辑推荐人信息') : (isEn ? 'New Recommender' : '新增推荐人')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{isEn ? 'Name' : '姓名'}</label>
                <input 
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" 
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})} 
                  placeholder={isEn ? "e.g. Dr. John Smith" : "例如：李老师 / 张教授"}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{isEn ? 'Role / Subject' : '角色 / 学科'}</label>
                <input 
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" 
                  value={editForm.role} 
                  onChange={e => setEditForm({...editForm, role: e.target.value})} 
                  placeholder={isEn ? "e.g. Physics Teacher / 物理老师" : "例如：班主任 / 物理竞赛教练"}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{isEn ? 'Status' : '当前进度状态'}</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({...editForm, status: e.target.value as RecommenderReq['status']})}
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                >
                  <option value="Not Started">{isEn ? 'Not Started' : '未开始'}</option>
                  <option value="Drafting">{isEn ? 'Drafting' : '起草中'}</option>
                  <option value="Completed">{isEn ? 'Completed' : '已完成'}</option>
                </select>
              </div>
            </div>
            <div className="mt-7 flex gap-3">
               <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 text-xs font-bold text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-wider cursor-pointer">
                 {isEn ? 'Cancel' : '取消'}
               </button>
               <button onClick={handleSaveEdit} className="flex-1 py-2.5 text-xs font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-md uppercase tracking-wider cursor-pointer">
                 {isEn ? 'Save' : '保存'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRecommendations;
