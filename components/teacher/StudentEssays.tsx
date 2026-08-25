
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, FileText, School, Edit, Save, History, 
  Send, Loader2, Plus, CheckCircle, Clock, Trash2, 
  ChevronRight, ChevronDown, ChevronUp, AlertCircle, AlertTriangle, RefreshCw, Lightbulb, 
  Zap, Target, LayoutGrid, MoreHorizontal, Quote, X,
  FolderOpen, User, Wand2, Check, ArrowRight, MousePointerClick,
  Maximize2, Minimize2, Star, GitCommit, RotateCcw, Calendar, Mail,
  Bot, FileDiff, Tag, Languages, Upload, File as FileIcon,
  MessageCircle, Lock, Unlock, PenTool, Undo2, Redo2
} from '../common/Icons';
import { GoogleGenAI, Type } from "@google/genai";
import { StudentSummary } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import { FileItem } from './StudentMaterials';
import {
  ensureEssayReview,
  getEssayReview,
  subscribeEssayReviews,
  updateEssayReview
} from '../../services/essayReviewStore';

interface StudentEssaysProps {
  student: StudentSummary;
  onAddFile?: (file: FileItem, showToast?: boolean) => void;
}

// --- Data Types ---
type ViewMode = 'Brainstorm' | 'Drafting' | 'History';
type ReviewPanelTab = 'Comments' | 'Feedback' | 'AI';
type ReviewSaveState = 'saved' | 'saving' | 'error';

type VersionSource = 'Student_Submit' | 'Teacher_Save' | 'AI_Generate' | 'System_Restore' | 'Teacher_Return' | 'Teacher_Finalize';

interface EssayVersion {
  id: string;
  versionNumber: string; 
  content: string; 
  updatedAt: string;
  timestamp: number;
  author: 'Student' | 'Teacher' | 'AI';
  source: VersionSource;
  note?: string; 
  tags?: string[];
  wordCount: number;
}

interface IdeaCard {
  id: string;
  title: string;
  hook: string;
  coreValues: string[];
  plotSummary: string;
  isFavorite: boolean;
}

// Ping-Pong States: Drafting -> Reviewing -> Returned -> Finalized
type EssayStatus = 'Not Started' | 'Brainstorming' | 'Drafting' | 'Reviewing' | 'Returned' | 'Finalized';

interface EssayTask {
  id: string;
  title: string;
  school: string; 
  type: 'Personal Statement' | 'Why Major' | 'Activity' | 'Community';
  prompt: string;
  wordLimit: number;
  deadline: string;
  status: EssayStatus;
  
  // Tab 1: Brainstorming Data
  contextKeywords: string; 
  ideaCards: IdeaCard[];   
  
  // Tab 2: Drafting Data
  currentContent: string;
  lastSavedAt: string;
  
  // Tab 3: History
  versions: EssayVersion[];
}

// New Types for the Editor
type SuggestionType = 'Correctness' | 'Clarity' | 'Engagement' | 'Delivery';

interface EditorSuggestion {
  id: string;
  originalText: string;
  suggestedText: string;
  type: SuggestionType;
  explanation: string; 
  shortReason: string; 
  contextStart?: number; 
}

// --- Mock Initial Data ---
const INITIAL_ESSAYS: EssayTask[] = [
  {
    id: 'e1',
    title: 'Common App Main Essay',
    school: 'Common App',
    type: 'Personal Statement',
    prompt: "The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?",
    wordLimit: 650,
    deadline: '2024-11-01',
    status: 'Reviewing', // Start in Reviewing to demo Teacher actions
    contextKeywords: '乐高比赛失败, 熬夜写代码, 喜欢科幻小说, 奶奶的缝纫机',
    ideaCards: [
      {
        id: 'c1',
        title: 'The Lego Metaphor',
        hook: "It wasn't the tower that mattered, but the pieces I couldn't fit.",
        coreValues: ['Resilience', 'Innovation'],
        plotSummary: '通过乐高搭建失败的经历，引申到编程中对完美代码的追求，最后感悟到“不完美”才是创新的开始。',
        isFavorite: false
      },
    ],
    currentContent: "I have always been fascinated by the way small peices come together to create something larger than life. My journey began with Legos. These early builds were more than play; they were my first lessons in structural integrity. I think I am a very hard working student who likes to build things.",
    lastSavedAt: '刚刚',
    versions: [
      { 
        id: 'v3', 
        versionNumber: 'V2.0', 
        content: "I have always been fascinated by the way small peices come together to create something larger than life. My journey began with Legos. These early builds were more than play; they were my first lessons in structural integrity. I think I am a very hard working student who likes to build things.", 
        updatedAt: '2024-10-24 14:20', 
        timestamp: 1729750800000,
        author: 'Student', 
        source: 'Student_Submit',
        note: 'Submitted for review',
        tags: ['Reviewing'],
        wordCount: 42
      }
    ]
  },
  {
    id: 'e2',
    title: 'Why Carnegie Mellon?',
    school: 'Carnegie Mellon University',
    type: 'Why Major',
    prompt: "Most students at CMU choose their intended major during the application process. Please explain your choice of major and why you believe Carnegie Mellon is the best place for you to pursue it.",
    wordLimit: 300,
    deadline: '2025-01-01',
    status: 'Drafting',
    contextKeywords: '',
    ideaCards: [],
    currentContent: "I love CMU because...",
    lastSavedAt: 'Yesterday',
    versions: []
  }
];

// --- Toast Notification Component ---
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
    <CheckCircle className="w-4 h-4 text-green-400" />
    <span className="text-sm font-medium">{message}</span>
    <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-3 h-3" /></button>
  </div>
);

// --- Helper Functions ---
const cleanJson = (text: string) => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
};

const getSuggestionColor = (type: SuggestionType) => {
  switch (type) {
    case 'Correctness': return { border: 'border-b-2 border-red-400', text: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-100' };
    case 'Clarity': return { border: 'border-b-2 border-blue-400', text: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-100' };
    case 'Engagement': return { border: 'border-b-2 border-purple-400', text: 'text-purple-600', bg: 'bg-purple-50', ring: 'ring-purple-100' };
    case 'Delivery': return { border: 'border-b-2 border-orange-400', text: 'text-orange-600', bg: 'bg-orange-50', ring: 'ring-orange-100' };
  }
};

const StudentEssays: React.FC<StudentEssaysProps> = ({ student, onAddFile }) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  const [essays, setEssays] = useState<EssayTask[]>(INITIAL_ESSAYS);
  const [activeEssayId, setActiveEssayId] = useState<string>(INITIAL_ESSAYS[0].id);
  const [activeView, setActiveView] = useState<ViewMode>('Drafting');
  
  // Interaction State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  // Revision Workflow State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnNote, setReturnNote] = useState('');

  // Editor & Suggestion State
  const [suggestions, setSuggestions] = useState<EditorSuggestion[]>([]);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [isDirectEditing, setIsDirectEditing] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [promptDraft, setPromptDraft] = useState('');
  
  // Editor Refs & Selection
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  const [inlineCommentDraft, setInlineCommentDraft] = useState('');
  const [reviewPanelTab, setReviewPanelTab] = useState<ReviewPanelTab>('Comments');
  const [sharedReview, setSharedReview] = useState<ReturnType<typeof getEssayReview>>(() => getEssayReview(INITIAL_ESSAYS[0].id));
  const [overallFeedbackDraft, setOverallFeedbackDraft] = useState('');
  const [reviewSaveState, setReviewSaveState] = useState<ReviewSaveState>('saved');
  const [reviewHasUnsavedChanges, setReviewHasUnsavedChanges] = useState(false);
  const reviewWorkspaceRef = useRef<HTMLDivElement>(null);
  const [contentUndoStack, setContentUndoStack] = useState<string[]>([]);
  const [contentRedoStack, setContentRedoStack] = useState<string[]>([]);

  const handleStartEditing = () => {
    setIsDirectEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 50);
  };
  
  // Score State
  const [essayScore, setEssayScore] = useState(85);

  // History State
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [newVersionNote, setNewVersionNote] = useState('');
  const [expandedVersionIds, setExpandedVersionIds] = useState<Set<string>>(new Set(['v3']));

  const toggleVersionExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedVersionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Brainstorm Multi-select State
  const [selectedIdeaIds, setSelectedIdeaIds] = useState<Set<string>>(new Set());

  // New Task Form State & Unsaved Confirmation State
  const INITIAL_NEW_TASK = {
    school: '',
    type: 'Personal Statement',
    title: '',
    prompt: '',
    wordLimit: '650',
    deadline: ''
  };
  const ESSAY_TASK_DRAFT_KEY = 'essay_task_draft';

  const [newTask, setNewTask] = useState(INITIAL_NEW_TASK);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

  // Check if current task form has unsaved modifications
  const isTaskFormDirty = Boolean(
    newTask.school.trim() !== '' ||
    newTask.title.trim() !== '' ||
    newTask.prompt.trim() !== '' ||
    newTask.deadline.trim() !== '' ||
    newTask.wordLimit !== '650' ||
    newTask.type !== 'Personal Statement'
  );

  const activeEssay = essays.find(e => e.id === activeEssayId) || essays[0];
  const hasUnsavedReviewChanges = reviewHasUnsavedChanges || reviewSaveState === 'error' || inlineCommentDraft.trim().length > 0;

  useEffect(() => {
    setContentUndoStack([]);
    setContentRedoStack([]);
  }, [activeEssayId]);

  // Derived System Context
  const systemContextItems = [
    { label: isEn ? 'Target Profile' : '目标画像', value: `${student.targetSummary} / ${student.direction}` },
    { label: isEn ? 'Activity' : '活动经历', value: 'Robotics Club Founder, AMC 12 Distinction' },
    { label: isEn ? 'Essay Material' : '文书素材', value: "'Discussion on failure in LEGO building' (from Interview Notes)" }
  ];

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    INITIAL_ESSAYS.forEach(essay => {
      ensureEssayReview(
        essay.id,
        essay.currentContent,
        essay.status === 'Brainstorming' ? 'Drafting' : essay.status,
        essay.versions.map(version => ({
          id: version.id,
          versionNumber: version.versionNumber,
          content: version.content,
          author: version.author,
          source: version.source,
          note: version.note,
          updatedAt: version.updatedAt,
          timestamp: version.timestamp
        }))
      );
    });

    const syncFromSharedReview = () => {
      setEssays(previous => previous.map(essay => {
        const review = getEssayReview(essay.id);
        if (!review) return essay;
        return {
          ...essay,
          status: review.status,
          currentContent: review.currentContent,
          lastSavedAt: review.lastModifiedAt,
          versions: review.versions.map(version => ({
            ...version,
            source: version.source as VersionSource,
            wordCount: version.content.trim().split(/\s+/).filter(Boolean).length
          }))
        };
      }));
    };

    syncFromSharedReview();
    return subscribeEssayReviews(syncFromSharedReview);
  }, []);

  useEffect(() => {
    const syncReviewWorkspace = (changedEssayId?: string) => {
      if (changedEssayId && changedEssayId !== activeEssayId) return;
      const review = getEssayReview(activeEssayId);
      setSharedReview(review);
      setOverallFeedbackDraft(review?.overallFeedback || '');
    };

    syncReviewWorkspace();
    return subscribeEssayReviews(syncReviewWorkspace);
  }, [activeEssayId]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedReviewChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };

    const handleExternalNavigation = (event: MouseEvent) => {
      if (!hasUnsavedReviewChanges) return;
      const target = event.target as HTMLElement | null;
      if (!target?.closest('button, a')) return;
      if (reviewWorkspaceRef.current?.contains(target)) return;

      const shouldLeave = window.confirm(
        isEn
          ? 'This review contains unsaved feedback or comments. Leave without saving?'
          : '当前审阅仍有未保存的整体反馈或批注，确定离开吗？'
      );
      if (shouldLeave) {
        setReviewHasUnsavedChanges(false);
        setInlineCommentDraft('');
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleExternalNavigation, true);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleExternalNavigation, true);
    };
  }, [hasUnsavedReviewChanges, isEn]);

  useEffect(() => {
    setSuggestions([]);
    setHasScanned(false);
    setEssayScore(85);
    // Select the latest version by default if in history mode
    setSelectedVersionId(activeEssay.versions.length > 0 ? activeEssay.versions[0].id : null);
    setSelectedIdeaIds(new Set());
    setIsEditingPrompt(false);
    setPromptDraft('');
    setSelection(null);
    setInlineCommentDraft('');
    setReviewPanelTab('Comments');
    setReviewHasUnsavedChanges(false);
    setReviewSaveState('saved');
  }, [activeEssayId]);

  const showToast = (msg: string) => setToastMessage(msg);

  const confirmDiscardReviewChanges = () => {
    if (!hasUnsavedReviewChanges) return true;
    return window.confirm(
      isEn
        ? 'This review contains unsaved feedback or comments. Discard them and continue?'
        : '当前审阅仍有未保存的整体反馈或批注，是否放弃修改并继续？'
    );
  };

  const handleSelectEssay = (essayId: string) => {
    if (essayId === activeEssayId) return;
    if (!confirmDiscardReviewChanges()) return;
    setReviewHasUnsavedChanges(false);
    setInlineCommentDraft('');
    setActiveEssayId(essayId);
  };

  const handleChangeView = (mode: ViewMode) => {
    if (mode === activeView) return;
    if (!confirmDiscardReviewChanges()) return;
    setReviewHasUnsavedChanges(false);
    setInlineCommentDraft('');
    setActiveView(mode);
  };

  // --- Core Handlers ---

  const handleContextUpdate = (val: string) => {
    setEssays(prev => prev.map(e => e.id === activeEssayId ? { ...e, contextKeywords: val } : e));
  };

  const handleStartPromptEdit = () => {
    setPromptDraft(activeEssay.prompt);
    setIsEditingPrompt(true);
  };

  const handleSavePrompt = () => {
    setEssays(prev => prev.map(essay =>
      essay.id === activeEssayId ? { ...essay, prompt: promptDraft.trim() } : essay
    ));
    setIsEditingPrompt(false);
    showToast(isEn ? 'Task requirements updated' : '任务要求已更新');
  };

  const handleCancelPromptEdit = () => {
    setPromptDraft('');
    setIsEditingPrompt(false);
  };

  const persistContentUpdate = (val: string) => {
    setReviewSaveState('saving');
    setReviewHasUnsavedChanges(true);
    setEssays(prev => prev.map(e => e.id === activeEssayId ? { ...e, currentContent: val, lastSavedAt: isEn ? 'Saving...' : 'Saving...' } : e));
    const saved = updateEssayReview(activeEssayId, review => ({
      ...review,
      currentContent: val,
      teacherModifiedContent: val,
      reviewAuthor: 'Ms. Sarah',
      reviewedAt: new Date().toLocaleString(),
      lastModifiedBy: 'Ms. Sarah',
      lastModifiedAt: new Date().toLocaleString(),
      revisionNumber: review.revisionNumber + 1
    }));
    if (!saved) {
      setReviewSaveState('error');
      showToast(isEn ? 'Auto-save failed' : '自动保存失败，请重试');
      return;
    }
    // Simulate auto-save delay
    setTimeout(() => {
        setEssays(prev => prev.map(e => e.id === activeEssayId ? { ...e, lastSavedAt: isEn ? 'Just now' : '刚刚' } : e));
        setReviewSaveState('saved');
        setReviewHasUnsavedChanges(false);
    }, 1000);
  };

  const handleContentUpdate = (val: string) => {
    if (val === activeEssay.currentContent) return;
    setContentUndoStack(previous => [...previous.slice(-99), activeEssay.currentContent]);
    setContentRedoStack([]);
    persistContentUpdate(val);
  };

  const handleUndoContent = () => {
    const previousContent = contentUndoStack[contentUndoStack.length - 1];
    if (previousContent === undefined) return;
    setContentUndoStack(previous => previous.slice(0, -1));
    setContentRedoStack(previous => [...previous.slice(-99), activeEssay.currentContent]);
    persistContentUpdate(previousContent);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleRedoContent = () => {
    const nextContent = contentRedoStack[contentRedoStack.length - 1];
    if (nextContent === undefined) return;
    setContentRedoStack(previous => previous.slice(0, -1));
    setContentUndoStack(previous => [...previous.slice(-99), activeEssay.currentContent]);
    persistContentUpdate(nextContent);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleEditorKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isUndoShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z';
    if (isUndoShortcut) {
      event.preventDefault();
      if (event.shiftKey) {
        handleRedoContent();
      } else {
        handleUndoContent();
      }
      return;
    }

    if (event.key === 'Escape') setIsDirectEditing(false);
  };

  const handleSelect = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const text = activeEssay.currentContent.substring(start, end);
      if (text.trim().length > 0) {
        setSelection({ start, end, text });
        setReviewPanelTab('Comments');
      } else {
        setSelection(null);
      }
    }
  };

  const handleAddInlineComment = () => {
    if (!selection || !inlineCommentDraft.trim()) return;
    setReviewSaveState('saving');
    const saved = updateEssayReview(activeEssayId, review => ({
      ...review,
      comments: [...review.comments, {
        id: `comment-${Date.now()}`,
        quote: selection.text,
        comment: inlineCommentDraft.trim(),
        start: selection.start,
        end: selection.end,
        author: 'Ms. Sarah',
        createdAt: new Date().toLocaleString()
      }],
      reviewAuthor: 'Ms. Sarah',
      reviewedAt: new Date().toLocaleString(),
      lastModifiedBy: 'Ms. Sarah',
      lastModifiedAt: new Date().toLocaleString(),
      revisionNumber: review.revisionNumber + 1
    }));
    if (!saved) {
      setReviewSaveState('error');
      setReviewHasUnsavedChanges(true);
      showToast(isEn ? 'Comment save failed' : '批注保存失败，请重试');
      return;
    }
    setReviewSaveState('saved');
    setReviewHasUnsavedChanges(false);
    setInlineCommentDraft('');
    setSelection(null);
    showToast(isEn ? 'Inline comment saved' : '文本批注已保存');
  };

  const saveReviewDraft = (showSuccessToast = true) => {
    setReviewSaveState('saving');
    const saved = updateEssayReview(activeEssayId, review => ({
      ...review,
      currentContent: activeEssay.currentContent,
      teacherModifiedContent: activeEssay.currentContent,
      overallFeedback: overallFeedbackDraft.trim(),
      reviewAuthor: 'Ms. Sarah',
      reviewedAt: new Date().toLocaleString(),
      lastModifiedBy: 'Ms. Sarah',
      lastModifiedAt: new Date().toLocaleString(),
      revisionNumber: review.revisionNumber + 1
    }));

    if (!saved) {
      setReviewSaveState('error');
      setReviewHasUnsavedChanges(true);
      showToast(isEn ? 'Review draft save failed' : '审阅草稿保存失败，请重试');
      return false;
    }

    setReviewSaveState('saved');
    setReviewHasUnsavedChanges(false);
    if (showSuccessToast) showToast(isEn ? 'Review draft saved' : '审阅草稿已保存');
    return true;
  };

  const handleSaveOverallFeedback = () => {
    if (!saveReviewDraft(false)) return;
    showToast(isEn ? 'Overall feedback saved' : '整体反馈已保存');
  };

  const handleAddContextToKeywords = (text: string) => {
    const current = activeEssay.contextKeywords || '';
    const separator = current.trim().length > 0 ? '\n' : '';
    handleContextUpdate(current + separator + text);
  };

  const handleToggleFavorite = (cardId: string) => {
    setEssays(prev => prev.map(e => {
        if (e.id !== activeEssayId) return e;
        return {
            ...e,
            ideaCards: e.ideaCards.map(c => c.id === cardId ? { ...c, isFavorite: !c.isFavorite } : c)
        };
    }));
  };

  const handleToggleIdeaSelection = (cardId: string) => {
    const newSet = new Set(selectedIdeaIds);
    if (newSet.has(cardId)) {
      newSet.delete(cardId);
    } else {
      newSet.add(cardId);
    }
    setSelectedIdeaIds(newSet);
  };

  const handleSendIdeasToStudent = () => {
    if (selectedIdeaIds.size === 0) return;
    showToast(isEn ? `Sent ${selectedIdeaIds.size} ideas to student` : `已将 ${selectedIdeaIds.size} 个灵感方案发送给学生`);
    setSelectedIdeaIds(new Set());
  };

  const handleDeleteIdea = (cardId: string) => {
      setEssays(prev => prev.map(e => {
          if (e.id !== activeEssayId) return e;
          return {
              ...e,
              ideaCards: e.ideaCards.filter(c => c.id !== cardId)
          };
      }));
  };

  // --- Assign Task Handlers & Draft Logic ---
  const handleOpenAssignModal = () => {
    const savedDraft = localStorage.getItem(ESSAY_TASK_DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === 'object') {
          setNewTask(parsed);
          setHasLoadedDraft(true);
        }
      } catch (e) {
        console.error('Failed to parse saved task draft:', e);
      }
    } else {
      setHasLoadedDraft(false);
    }
    setIsAssignModalOpen(true);
  };

  const handleRequestCloseTaskModal = () => {
    if (isTaskFormDirty) {
      setShowUnsavedConfirm(true);
    } else {
      setIsAssignModalOpen(false);
      setShowUnsavedConfirm(false);
    }
  };

  const handleSaveDraft = (closeModal: boolean = false) => {
    localStorage.setItem(ESSAY_TASK_DRAFT_KEY, JSON.stringify(newTask));
    setHasLoadedDraft(true);
    showToast(isEn ? 'Task draft saved. You can continue anytime.' : '文书任务草稿已保存，下次打开可继续编辑。');
    if (closeModal) {
      setShowUnsavedConfirm(false);
      setIsAssignModalOpen(false);
    }
  };

  const handleDiscardAndClose = () => {
    localStorage.removeItem(ESSAY_TASK_DRAFT_KEY);
    setNewTask(INITIAL_NEW_TASK);
    setHasLoadedDraft(false);
    setShowUnsavedConfirm(false);
    setIsAssignModalOpen(false);
    showToast(isEn ? 'Unsaved changes discarded.' : '已放弃修改。');
  };

  const handleClearDraftInForm = () => {
    localStorage.removeItem(ESSAY_TASK_DRAFT_KEY);
    setNewTask(INITIAL_NEW_TASK);
    setHasLoadedDraft(false);
    showToast(isEn ? 'Draft cleared.' : '草稿已清空。');
  };

  const handleAssignTask = () => {
    if (!newTask.title || !newTask.school) {
        showToast(isEn ? 'Please fill in required fields.' : '请填写必要信息。');
        return;
    }

    const newTaskObj: EssayTask = {
        id: `essay-${Date.now()}`,
        title: newTask.title,
        school: newTask.school,
        type: newTask.type as any,
        prompt: newTask.prompt,
        wordLimit: parseInt(newTask.wordLimit) || 650,
        deadline: newTask.deadline || 'TBD',
        status: 'Not Started',
        contextKeywords: '',
        ideaCards: [],
        currentContent: '',
        lastSavedAt: '-',
        versions: []
    };

    setEssays(prev => [newTaskObj, ...prev]);
    setActiveEssayId(newTaskObj.id);
    localStorage.removeItem(ESSAY_TASK_DRAFT_KEY);
    setHasLoadedDraft(false);
    setShowUnsavedConfirm(false);
    setIsAssignModalOpen(false);
    showToast(isEn ? 'Essay Assigned to Student' : '文书任务已下发给学生');
    
    // Reset Form
    setNewTask(INITIAL_NEW_TASK);
  };

  // --- VERSIONING LOGIC ---

  const createSnapshot = (source: VersionSource, note: string, author: 'Teacher' | 'AI' | 'Student' = 'Teacher') => {
    const lastVersion = activeEssay.versions[0];
    const newVersionNumber = `V${(parseFloat(lastVersion?.versionNumber.replace('V','') || '0') + 0.1).toFixed(1)}`;
    const wordCount = activeEssay.currentContent.split(/\s+/).filter(Boolean).length;
    
    const newVersion: EssayVersion = {
      id: `v-${Date.now()}`,
      versionNumber: newVersionNumber,
      content: activeEssay.currentContent,
      updatedAt: new Date().toLocaleString(isEn ? 'en-US' : 'zh-CN', {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'}),
      timestamp: Date.now(),
      author: author,
      source: source,
      note: note,
      wordCount: wordCount,
      tags: source === 'AI_Generate' ? ['AI Assisted'] : source === 'Teacher_Save' ? ['Teacher Snapshot'] : source === 'Teacher_Return' ? ['Returned'] : []
    };

    setEssays(prev => prev.map(e => 
      e.id === activeEssayId ? { ...e, versions: [newVersion, ...e.versions] } : e
    ));

    const sharedVersion = {
      id: newVersion.id,
      versionNumber: newVersion.versionNumber,
      content: newVersion.content,
      author: newVersion.author,
      source: newVersion.source,
      note: newVersion.note,
      updatedAt: newVersion.updatedAt,
      timestamp: newVersion.timestamp
    };
    const saved = updateEssayReview(activeEssayId, review => ({
      ...review,
      currentContent: activeEssay.currentContent,
      teacherModifiedContent: author === 'Teacher' ? activeEssay.currentContent : review.teacherModifiedContent,
      versions: [sharedVersion, ...review.versions.filter(version => version.id !== sharedVersion.id)],
      reviewAuthor: author === 'Teacher' ? 'Ms. Sarah' : review.reviewAuthor,
      reviewedAt: author === 'Teacher' ? newVersion.updatedAt : review.reviewedAt,
      lastModifiedBy: author === 'Teacher' ? 'Ms. Sarah' : author,
      lastModifiedAt: newVersion.updatedAt,
      revisionNumber: review.revisionNumber + 1
    }));
    if (!saved) showToast(isEn ? 'Version sync failed' : '版本同步失败，请重试');
    
    return newVersion;
  };

  const handleManualSaveVersion = () => {
    if (!newVersionNote.trim()) {
        showToast(isEn ? "Please enter version note" : "请输入版本备注");
        return;
    }
    createSnapshot('Teacher_Save', newVersionNote, 'Teacher');
    setIsCreatingVersion(false);
    setNewVersionNote('');
    showToast(isEn ? "Version Saved" : "版本已保存");
  };

  // --- WORKFLOW HANDLERS (Ping-Pong) ---

  const handleReturnForRevision = () => {
    setReturnNote(overallFeedbackDraft);
    setIsReturnModalOpen(true);
  };

  const confirmReturnForRevision = () => {
    if (!returnNote.trim()) {
      alert(isEn ? 'Please provide feedback/instructions for the student.' : '请填写修改意见或反馈。');
      return;
    }

    // 1. Create a snapshot (so we know what was sent back)
    createSnapshot('Teacher_Return', returnNote, 'Teacher');

    // 2. Update Status to 'Returned'
    setEssays(prev => prev.map(e => 
      e.id === activeEssayId ? { ...e, status: 'Returned' } : e
    ));

    const saved = updateEssayReview(activeEssayId, review => ({
      ...review,
      status: 'Returned',
      overallFeedback: returnNote.trim(),
      currentContent: activeEssay.currentContent,
      teacherModifiedContent: activeEssay.currentContent,
      reviewAuthor: 'Ms. Sarah',
      reviewedAt: new Date().toLocaleString(),
      lastModifiedBy: 'Ms. Sarah',
      lastModifiedAt: new Date().toLocaleString(),
      revisionNumber: review.revisionNumber + 1
    }));
    if (!saved) {
      showToast(isEn ? 'Return sync failed' : '退回同步失败，请重试');
      return;
    }

    setReviewSaveState('saved');
    setReviewHasUnsavedChanges(false);
    setIsReturnModalOpen(false);
    setReturnNote('');
    showToast(isEn ? 'Returned to student for revision.' : '已退回给学生修改。');
  };

  const handleFinalize = async () => {
    if (confirm(isEn ? 'Finalize this essay? This will lock the document and save a copy to Materials.' : '确认定稿？文档将被锁定，并自动保存 Word 文件至学生资料夹。')) {
      if (!saveReviewDraft(false)) return;
      // 1. Create Final Snapshot
      createSnapshot('Teacher_Finalize', 'Final Approved Version', 'Teacher');

      // 2. Update Status to 'Finalized'
      setEssays(prev => prev.map(e => 
        e.id === activeEssayId ? { ...e, status: 'Finalized' } : e
      ));
      const saved = updateEssayReview(activeEssayId, review => ({
        ...review,
        status: 'Finalized',
        currentContent: activeEssay.currentContent,
        teacherModifiedContent: activeEssay.currentContent,
        reviewAuthor: 'Ms. Sarah',
        reviewedAt: new Date().toLocaleString(),
        lastModifiedBy: 'Ms. Sarah',
        lastModifiedAt: new Date().toLocaleString(),
        revisionNumber: review.revisionNumber + 1
      }));
      if (!saved) {
        setReviewSaveState('error');
        setReviewHasUnsavedChanges(true);
        showToast(isEn ? 'Finalize failed' : '定稿保存失败，请重试');
        return;
      }
      
      // 3. Generate Word Document
      try {
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                text: activeEssay.title,
                heading: HeadingLevel.TITLE,
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: `${activeEssay.school} - ${activeEssay.type}`,
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: `Prompt: ${activeEssay.prompt}`,
                spacing: { after: 400 },
                style: "Intense Quote",
              }),
              ...activeEssay.currentContent.split('\n').map(line => 
                new Paragraph({
                  children: [new TextRun(line)],
                  spacing: { after: 120 },
                })
              ),
            ],
          }],
        });

        const blob = await Packer.toBlob(doc);
        const fileName = `${activeEssay.school}_${activeEssay.type}_Final.docx`.replace(/\s+/g, '_');
        
        // 4. Trigger Download
        saveAs(blob, fileName);

        // 5. Add to Materials (if callback provided)
        if (onAddFile) {
            const newFile: FileItem = {
                id: `essay-final-${Date.now()}`,
                name: fileName,
                category: 'others', // Or a specific 'essays' category if exists
                date: new Date().toISOString().split('T')[0],
                size: `${(blob.size / 1024).toFixed(1)}KB`,
                type: 'doc',
                uploader: 'Teacher'
            };
            onAddFile(newFile, false);
        }

        showToast(isEn ? 'Essay Finalized & Saved to Materials!' : '文书已定稿并归档至资料夹！');
      } catch (error) {
        console.error("Error generating doc:", error);
        showToast(isEn ? 'Finalized, but failed to generate file.' : '已定稿，但文件生成失败。');
      }
    }
  };

  const handleUnlock = () => {
    if (confirm(isEn ? 'Unlock for editing? Status will revert to Returned.' : '解锁编辑权限？状态将变更为“已退回”。')) {
        setEssays(prev => prev.map(e => 
            e.id === activeEssayId ? { ...e, status: 'Returned' } : e
        ));
        showToast(isEn ? 'Unlocked.' : '已解锁。');
    }
  };

  // --- Handlers: AI ---

  const handleGenerateIdeas = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const contextStr = systemContextItems.map(i => `${i.label}: ${i.value}`).join('; ');
      const prompt = `
        Role: Creative Writing Coach.
        Task: Brainstorm 3 distinct essay angles based on student profile.
        Context: ${contextStr}
        Manual Keywords: "${activeEssay.contextKeywords}"
        Essay Type: ${activeEssay.type}
        
        Requirements: Hook, Core Values, Plot Summary, Title.
        Output JSON Array.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        hook: { type: Type.STRING },
                        coreValues: { type: Type.ARRAY, items: { type: Type.STRING } },
                        plotSummary: { type: Type.STRING }
                    }
                }
            }
        }
      });

      if (response.text) {
        const parsedResult: any = JSON.parse(cleanJson(response.text));
        const rawIdeas: any[] = Array.isArray(parsedResult) ? parsedResult : [];
        const formattedIdeas: IdeaCard[] = rawIdeas.map((idea: any) => ({
          ...idea,
          id: `idea-${Date.now()}-${Math.random()}`,
          isFavorite: false
        }));
        setEssays(prev => prev.map(e => e.id === activeEssayId ? { ...e, ideaCards: [...e.ideaCards, ...formattedIdeas] } : e));
      }
    } catch (e) {
      console.error(e);
      showToast(isEn ? "Failed to generate, please try again." : "生成失败，请重试");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleScanEssay = async () => {
    if (!activeEssay.currentContent.trim()) return;
    setReviewPanelTab('AI');
    setIsAiLoading(true);
    setSuggestions([]);
    setActiveSuggestionId(null);
    setHasScanned(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Role: Ivy League Essay Editor.
        Task: Review the draft. Identify improvements (Correctness, Clarity, Engagement, Delivery).
        Content: "${activeEssay.currentContent}"
        Constraint: Find 3-6 specific actionable issues.
        Output JSON Array of {originalText, suggestedText, type, shortReason, explanation}.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      if (response.text) {
        const parsedResult: any = JSON.parse(cleanJson(response.text));
        const rawSuggestions: any[] = Array.isArray(parsedResult) ? parsedResult : [];
        const formatted: EditorSuggestion[] = rawSuggestions.map((item: any, idx: number) => ({
          ...item,
          id: `sug-${Date.now()}-${idx}`
        }));
        setSuggestions(formatted);
        setHasScanned(true);
      }
    } catch (e) {
      console.error(e);
      showToast(isEn ? "Scan failed" : "诊断失败");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion: EditorSuggestion) => {
    const newContent = activeEssay.currentContent.replace(suggestion.originalText, suggestion.suggestedText);
    handleContentUpdate(newContent);
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    setActiveSuggestionId(null);
    setEssayScore(prev => Math.min(100, prev + 5));
    showToast(isEn ? "Applied" : "已应用修改");
  };

  // --- Handlers: History ---
  const handleRestoreVersion = () => {
    const versionToRestore = activeEssay.versions.find(v => v.id === selectedVersionId);
    if (!versionToRestore) return;

    if (window.confirm(isEn 
        ? `Restore content to version ${versionToRestore.versionNumber}? Current content will be backed up.` 
        : `确认将内容回滚至版本 ${versionToRestore.versionNumber}？当前内容将自动保存为备份。`)) {
      // 1. Create Backup of current
      createSnapshot('System_Restore', `Auto-backup before restoring ${versionToRestore.versionNumber}`, 'Teacher');

      // 2. Restore
      setEssays(prev => prev.map(e => {
        if (e.id !== activeEssayId) return e;
        return { ...e, currentContent: versionToRestore.content };
      }));
      
      showToast(isEn ? "Restored" : "已恢复版本");
      setActiveView('Drafting');
    }
  };

  // --- Rendering Helpers ---
  const getSourceIcon = (source: VersionSource) => {
    switch (source) {
      case 'Student_Submit': return <User className="w-3 h-3 text-blue-600" />;
      case 'Teacher_Save': return <Edit className="w-3 h-3 text-primary-600" />;
      case 'AI_Generate': return <Sparkles className="w-3 h-3 text-purple-600" />;
      case 'System_Restore': return <RotateCcw className="w-3 h-3 text-gray-600" />;
      case 'Teacher_Return': return <MessageCircle className="w-3 h-3 text-orange-600" />;
      case 'Teacher_Finalize': return <CheckCircle className="w-3 h-3 text-green-600" />;
    }
  };

  const getSourceLabel = (source: VersionSource) => {
    switch (source) {
      case 'Student_Submit': return isEn ? 'Student Submitted' : '学生提交';
      case 'Teacher_Save': return isEn ? 'Teacher Snapshot' : '老师保存';
      case 'AI_Generate': return isEn ? 'AI Iteration' : 'AI 润色';
      case 'System_Restore': return isEn ? 'System Restore' : '系统恢复';
      case 'Teacher_Return': return isEn ? 'Returned for Revision' : '发回修改';
      case 'Teacher_Finalize': return isEn ? 'Finalized' : '已定稿';
    }
  };

  // Group versions by date
  const groupedVersions = activeEssay.versions.reduce((acc, version) => {
    const date = version.updatedAt.split(' ')[0]; // Simple grouping
    if (!acc[date]) acc[date] = [];
    acc[date].push(version);
    return acc;
  }, {} as Record<string, EssayVersion[]>);

  const renderHighlightedText = () => {
    if (suggestions.length === 0) {
      return (
        <div 
          onDoubleClick={handleStartEditing}
          className="whitespace-pre-wrap leading-loose font-serif text-lg text-gray-800 select-text cursor-text"
          title={isEn ? "Double-click text to edit" : "双击文本即可直接修改"}
        >
          {activeEssay.currentContent || (
            <span className="text-gray-400 italic">
              {isEn ? "No essay content yet. Double-click here to start typing..." : "暂无文书内容，双击此处直接输入..."}
            </span>
          )}
        </div>
      );
    }
    let content = activeEssay.currentContent;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const sortedSuggestions = [...suggestions].map(s => ({...s, index: content.indexOf(s.originalText)})).filter(s => s.index !== -1).sort((a, b) => a.index - b.index);
    if (sortedSuggestions.length === 0) {
      return (
        <div 
          onDoubleClick={handleStartEditing}
          className="whitespace-pre-wrap leading-loose font-serif text-lg text-gray-800 select-text cursor-text"
          title={isEn ? "Double-click text to edit" : "双击文本即可直接修改"}
        >
          {content}
        </div>
      );
    }
    sortedSuggestions.forEach((sug, i) => {
        if (sug.index < lastIndex) return; 
        parts.push(<span key={`text-${i}`}>{content.slice(lastIndex, sug.index)}</span>);
        const styles = getSuggestionColor(sug.type);
        parts.push(
            <span key={`sug-${sug.id}`} onClick={() => setActiveSuggestionId(sug.id)} className={`cursor-pointer ${styles.border} hover:bg-opacity-20 hover:bg-gray-200 transition-colors pb-0.5 ${activeSuggestionId === sug.id ? 'bg-yellow-100/50' : ''}`}>{sug.originalText}</span>
        );
        lastIndex = sug.index + sug.originalText.length;
    });
    parts.push(<span key="text-end">{content.slice(lastIndex)}</span>);
    return (
      <div 
        onDoubleClick={handleStartEditing}
        className="whitespace-pre-wrap leading-loose font-serif text-lg text-gray-800 select-text cursor-text"
        title={isEn ? "Double-click text to edit" : "双击文本即可直接修改"}
      >
        {parts}
      </div>
    );
  };

  // --- Header Status Badge Helper ---
  const renderStatusBadge = () => {
      switch (activeEssay.status) {
          case 'Reviewing': return <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-bold border border-orange-100 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {isEn ? 'Reviewing' : '审阅中'}</span>;
          case 'Returned': return <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold border border-purple-100 flex items-center gap-1"><RotateCcw className="w-3 h-3"/> {isEn ? 'Returned' : '已退回'}</span>;
          case 'Finalized': return <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-100 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> {isEn ? 'Finalized' : '已定稿'}</span>;
          default: return <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100 flex items-center gap-1"><PenTool className="w-3 h-3"/> {isEn ? 'Drafting' : '撰写中'}</span>;
      }
  };

  return (
     <div ref={reviewWorkspaceRef} className="flex h-full gap-0 animate-in fade-in slide-in-from-bottom-2 relative bg-[#f9f8f6]">
        
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

        {/* 1. Left Nav (Tasks) */}
        <div className="w-60 flex-shrink-0 bg-white border-r border-[#e5e0dc] flex flex-col z-10">
           <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm">{isEn ? 'Essay Tasks' : '文书任务'}</h3>
              <button 
                onClick={handleOpenAssignModal} 
                className="text-primary-600 hover:text-primary-800 bg-primary-50 p-1.5 rounded-full transition-colors"
                title={isEn ? "Assign New Essay" : "下发新文书"}
              >
                <Plus className="w-4 h-4"/>
              </button>
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {essays.map(essay => (
                 <div 
                    key={essay.id}
                    onClick={() => handleSelectEssay(essay.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all border group relative
                       ${activeEssayId === essay.id ? 'bg-primary-50 border-primary-200 shadow-sm' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'}
                    `}
                 >
                    {/* Status Dot */}
                    <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r
                        ${essay.status === 'Reviewing' ? 'bg-orange-500' : 
                          essay.status === 'Returned' ? 'bg-purple-500' : 
                          essay.status === 'Finalized' ? 'bg-green-500' : 'bg-blue-500'}
                    `}></div>
                    
                    <div className="pl-2">
                       <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${activeEssayId === essay.id ? 'text-primary-600' : 'text-gray-400'}`}>
                        {essay.school}
                       </p>
                       <p className={`text-sm font-bold leading-tight mb-1 ${activeEssayId === essay.id ? 'text-gray-900' : 'text-gray-600'}`}>
                        {essay.title}
                       </p>
                       <div className="flex items-center justify-between mt-2">
                          <span className={`text-[10px] flex items-center gap-1 ${new Date(essay.deadline) < new Date() ? 'text-red-500 font-bold' : 'text-gray-400'}`}><Clock className="w-2.5 h-2.5" /> {essay.deadline}</span>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* 2. Main Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
           
           {/* --- NEW HEADER DESIGN (Two-Row) --- */}
           <div className="flex flex-col border-b border-[#e5e0dc] bg-white z-30 shadow-sm">
              
              {/* Row 1: Title & Main Actions */}
              <div className="px-6 py-3 flex justify-between items-start border-b border-gray-50">
                 <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-tight">{activeEssay.title}</h1>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">{activeEssay.school}</span>
                        <span>•</span>
                        <span>{activeEssay.type}</span>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-3 pt-1">
                    {/* Workflow Actions */}
                    {activeEssay.status === 'Reviewing' && (
                        <>
                            <button 
                                onClick={handleReturnForRevision}
                                className="flex items-center gap-1.5 px-4 py-2 bg-white text-orange-600 border border-orange-200 rounded-lg text-sm font-bold hover:bg-orange-50 hover:border-orange-300 transition-colors shadow-sm"
                            >
                                <RotateCcw className="w-4 h-4" /> {isEn ? 'Return for Revision' : '退回学生修改'}
                            </button>
                            <button 
                                onClick={handleFinalize}
                                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-md transition-colors"
                            >
                                <CheckCircle className="w-4 h-4" /> {isEn ? 'Finalize' : '定稿'}
                            </button>
                        </>
                    )}
                    {(activeEssay.status === 'Drafting' || activeEssay.status === 'Returned') && (
                        <>
                            <button 
                                disabled
                                title={isEn ? 'Student is currently modifying the draft. Action available after student submits.' : '学生正在修改中，待学生提交后方可退回或定稿。'}
                                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-400 border border-gray-200 rounded-lg text-sm font-bold cursor-not-allowed opacity-60 transition-all select-none"
                            >
                                <RotateCcw className="w-4 h-4" /> {isEn ? 'Return for Revision' : '退回学生修改'}
                            </button>
                            <button 
                                disabled
                                title={isEn ? 'Student is currently modifying the draft.' : '学生正在修改中，待学生提交后方可定稿。'}
                                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-400 border border-gray-200 rounded-lg text-sm font-bold cursor-not-allowed opacity-60 transition-all select-none"
                            >
                                <CheckCircle className="w-4 h-4" /> {isEn ? 'Finalize' : '定稿'}
                            </button>
                        </>
                    )}
                    {activeEssay.status === 'Finalized' && (
                        <button 
                            onClick={handleUnlock}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                        >
                            <Unlock className="w-4 h-4" /> {isEn ? 'Unlock' : '解锁'}
                        </button>
                    )}
                 </div>
              </div>

              {/* Row 2: View Navigation & Status */}
              <div className="px-6 py-2 bg-[#fcfcfc] flex justify-between items-center">
                 {/* Segmented Control for Views */}
                 <div className="flex bg-gray-100 p-1 rounded-lg">
                    {(['Brainstorm', 'Drafting', 'History'] as ViewMode[]).map(mode => (
                        <button
                            key={mode}
                            onClick={() => handleChangeView(mode)}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2
                                ${activeView === mode 
                                    ? 'bg-white text-primary-700 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}
                            `}
                        >
                            {mode === 'Brainstorm' && <Lightbulb className="w-3 h-3" />}
                            {mode === 'Drafting' && <Edit className="w-3 h-3" />}
                            {mode === 'History' && <History className="w-3 h-3" />}
                            {mode === 'Brainstorm' ? (isEn ? 'Plan' : '构思') : mode === 'Drafting' ? (isEn ? 'Editor' : '写作') : (isEn ? 'History' : '历史版本')}
                        </button>
                    ))}
                 </div>

                 {/* Status Indicator */}
                 <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        reviewSaveState === 'saving'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : reviewSaveState === 'error'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      }`}
                      aria-live="polite"
                    >
                      {reviewSaveState === 'saving' ? (
                        <><RefreshCw className="h-3 w-3 animate-spin" />{isEn ? 'Saving' : '正在保存'}</>
                      ) : reviewSaveState === 'error' ? (
                        <><AlertCircle className="h-3 w-3" />{isEn ? 'Save failed' : '保存失败'}</>
                      ) : (
                        <><CheckCircle className="h-3 w-3" />{isEn ? 'Saved' : '已保存'}</>
                      )}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">{isEn ? 'Current Status:' : '当前状态:'}</span>
                    {renderStatusBadge()}
                 </div>
              </div>
           </div>

           {/* --- VIEW: BRAINSTORM --- */}
           {activeView === 'Brainstorm' && (
              <div className="flex-1 flex flex-col h-full bg-[#f9f8f6] p-8 overflow-y-auto">
                 <div className="max-w-5xl mx-auto w-full">
                    {/* Prompt Display */}
                    <div className="mb-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                       <div className="mb-3 flex items-center justify-between gap-3">
                         <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide">
                            <FileText className="w-4 h-4 text-primary-600" /> {isEn ? 'Task Requirements & Prompt' : '任务要求与题目 (Prompt)'}
                         </h3>
                         {isEditingPrompt ? (
                           <div className="flex items-center gap-2">
                             <button onClick={handleCancelPromptEdit} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                               {isEn ? 'Cancel' : '取消'}
                             </button>
                             <button onClick={handleSavePrompt} className="px-3 py-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-1">
                               <Save className="w-3.5 h-3.5" /> {isEn ? 'Save' : '保存'}
                             </button>
                           </div>
                         ) : (
                           <button onClick={handleStartPromptEdit} className="px-3 py-1.5 text-xs font-bold text-primary-700 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1">
                             <Edit className="w-3.5 h-3.5" /> {activeEssay.prompt ? (isEn ? 'Edit' : '修改') : (isEn ? 'Add' : '添加')}
                           </button>
                         )}
                       </div>
                       {isEditingPrompt ? (
                         <textarea
                           autoFocus
                           rows={5}
                           value={promptDraft}
                           onChange={(event) => setPromptDraft(event.target.value)}
                           placeholder={isEn ? 'Add the essay prompt or task requirements...' : '请输入文书题目或具体任务要求…'}
                           className="w-full p-4 bg-white rounded-lg border border-primary-300 text-sm text-gray-700 font-serif leading-relaxed resize-y outline-none focus:ring-2 focus:ring-primary-100"
                         />
                       ) : (
                         <div className={`p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm font-serif leading-relaxed whitespace-pre-wrap ${activeEssay.prompt ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                            {activeEssay.prompt || (isEn ? 'No task requirements yet. Click Add to provide them.' : '暂未添加任务要求，点击“添加”进行补充。')}
                         </div>
                       )}
                    </div>
                    {/* Input Area */}
                    <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm mb-8 focus-within:ring-2 focus-within:ring-primary-100 focus-within:border-primary-300 transition-all">
                        <textarea 
                            className="w-full h-32 p-4 text-sm text-gray-800 outline-none resize-none rounded-t-xl"
                            placeholder={isEn ? "Enter keywords, fragments, or requirements here..." : "在此输入您的灵感碎片、核心关键词或具体要求... (AI 将基于此进行发散)"}
                            value={activeEssay.contextKeywords}
                            onChange={(e) => handleContextUpdate(e.target.value)}
                        />
                        <div className="bg-gray-50 px-4 py-3 rounded-b-xl flex justify-between items-center border-t border-gray-100">
                            <span className="text-xs text-gray-400">
                                {activeEssay.contextKeywords.length} chars
                            </span>
                            <button 
                                onClick={handleGenerateIdeas}
                                disabled={isAiLoading || !activeEssay.contextKeywords.trim()}
                                className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4 text-yellow-300"/>}
                                {isEn ? 'Generate Ideas' : '开始生成灵感 (Brainstorm)'}
                            </button>
                        </div>
                    </div>
                    {/* Results Grid */}
                    {activeEssay.ideaCards.length > 0 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-end">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-primary-600" /> {isEn ? 'Results' : '生成结果'}
                                </h3>
                                {selectedIdeaIds.size > 0 && (
                                    <button 
                                        onClick={handleSendIdeasToStudent}
                                        className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm hover:bg-primary-700 transition-all flex items-center gap-1.5"
                                    >
                                        <Send className="w-3 h-3" />
                                        {isEn ? `Send (${selectedIdeaIds.size}) to Student` : `发送 (${selectedIdeaIds.size}) 给学生`}
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                               {activeEssay.ideaCards.map((card) => {
                                  const isSelected = selectedIdeaIds.has(card.id);
                                  return (
                                    <div 
                                      key={card.id} 
                                      onClick={() => handleToggleIdeaSelection(card.id)}
                                      className={`rounded-xl p-5 border shadow-sm transition-all relative group cursor-pointer
                                         ${isSelected 
                                            ? 'bg-primary-50/40 border-primary-500 ring-1 ring-primary-500' 
                                            : card.isFavorite 
                                                ? 'bg-yellow-50 border-yellow-200 hover:shadow-md' 
                                                : 'bg-white border-gray-200 hover:shadow-md'
                                         }
                                      `}
                                    >
                                       {/* Checkbox */}
                                       <div className={`absolute top-4 left-4 w-5 h-5 rounded border flex items-center justify-center transition-colors z-10
                                          ${isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-300 text-transparent group-hover:border-primary-300'}
                                       `}>
                                          <Check className="w-3.5 h-3.5" />
                                       </div>
                                       <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm p-1 rounded-lg z-20">
                                          <button 
                                              onClick={(e) => { e.stopPropagation(); handleToggleFavorite(card.id); }}
                                              className={`p-1.5 rounded-md transition-colors ${card.isFavorite ? 'text-yellow-500 hover:bg-yellow-100' : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100'}`}
                                          >
                                              <Star className={`w-4 h-4 ${card.isFavorite ? 'fill-yellow-500' : ''}`} />
                                          </button>
                                          <button 
                                              onClick={(e) => { e.stopPropagation(); handleDeleteIdea(card.id); }}
                                              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                          >
                                              <Trash2 className="w-4 h-4" />
                                          </button>
                                       </div>
                                       <div className="pl-8">
                                          <h3 className="font-bold text-gray-800 mb-2 pr-2">{card.title}</h3>
                                          <p className="text-xs text-gray-600 font-serif leading-relaxed line-clamp-2 italic mb-2">"{card.hook}"</p>
                                          <div className="flex flex-wrap gap-1 mb-3">
                                              {card.coreValues.map(v => <span key={v} className="text-[10px] bg-white/60 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">{v}</span>)}
                                          </div>
                                          <p className="text-xs text-gray-600 leading-snug">{card.plotSummary}</p>
                                       </div>
                                    </div>
                                  );
                               })}
                            </div>
                        </div>
                    )}
                 </div>
              </div>
           )}

           {/* --- VIEW: DRAFTING --- */}
           {activeView === 'Drafting' && (
              <div className="flex flex-1 flex-col h-full min-h-0 overflow-hidden xl:flex-row">
                 <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#fcfcfc]">
                    <div className="flex-1 overflow-y-auto relative" onClick={() => setActiveSuggestionId(null)}>
                       <div className="max-w-3xl mx-auto py-12 px-8 min-h-full">
                          <div className="relative z-0 min-h-[60vh] outline-none">
                             {/* Fixed Logic: No locking overlay for teacher in Reviewing status */}
                             
                             {isAiLoading ? (
                                <div className="animate-pulse opacity-50 whitespace-pre-wrap font-serif text-lg leading-loose">{activeEssay.currentContent}</div>
                             ) : isDirectEditing ? (
                                <div className="space-y-3 animate-in fade-in duration-200">
                                   <div className="flex items-center justify-between bg-primary-50/90 border border-primary-200 rounded-xl px-4 py-2.5 text-xs text-primary-900 shadow-2xs">
                                      <div className="flex items-center gap-2 font-medium">
                                         <Edit className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                         <span>{isEn ? 'Double-click to edit, changes auto-save in real-time' : '双击即可修改，修改实时自动保存'}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                         <button
                                            type="button"
                                            onClick={handleUndoContent}
                                            disabled={contentUndoStack.length === 0}
                                            title={isEn ? 'Undo (Command/Ctrl + Z)' : '撤销（Command/Ctrl + Z）'}
                                            aria-label={isEn ? 'Undo last essay edit' : '撤销上一步文书修改'}
                                            className="flex items-center gap-1 rounded-lg border border-primary-200 bg-white px-2.5 py-1.5 font-bold text-primary-700 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-40"
                                         >
                                            <Undo2 className="h-3.5 w-3.5" />
                                            <span>{isEn ? 'Undo' : '撤销'}</span>
                                         </button>
                                         <button
                                            type="button"
                                            onClick={handleRedoContent}
                                            disabled={contentRedoStack.length === 0}
                                            title={isEn ? 'Redo (Command/Ctrl + Shift + Z)' : '重做（Command/Ctrl + Shift + Z）'}
                                            aria-label={isEn ? 'Redo last essay edit' : '重做上一步文书修改'}
                                            className="flex items-center gap-1 rounded-lg border border-primary-200 bg-white px-2.5 py-1.5 font-bold text-primary-700 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-40"
                                         >
                                            <Redo2 className="h-3.5 w-3.5" />
                                            <span>{isEn ? 'Redo' : '重做'}</span>
                                         </button>
                                         <button
                                            type="button"
                                            onClick={() => setIsDirectEditing(false)}
                                            className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                                         >
                                            <Check className="w-3.5 h-3.5" />
                                            <span>{isEn ? 'Done' : '完成编辑'}</span>
                                         </button>
                                      </div>
                                   </div>
                                   {selection && (
                                      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                                         <p className="mb-2 text-xs font-bold text-indigo-800">
                                            {isEn ? 'Comment on selected text' : '为选中文本添加批注'}：
                                            <span className="ml-1 font-normal">“{selection.text}”</span>
                                         </p>
                                         <div className="flex gap-2">
                                            <input
                                               value={inlineCommentDraft}
                                               onChange={(event) => setInlineCommentDraft(event.target.value)}
                                               placeholder={isEn ? 'Enter a specific writing comment...' : '输入具体写作修改意见…'}
                                               className="min-w-0 flex-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                            />
                                            <button
                                               type="button"
                                               onClick={handleAddInlineComment}
                                               disabled={!inlineCommentDraft.trim()}
                                               className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                               {isEn ? 'Save comment' : '保存批注'}
                                            </button>
                                         </div>
                                      </div>
                                   )}
                                   <textarea
                                      ref={textareaRef}
                                      autoFocus
                                      rows={20}
                                      className="w-full p-6 bg-white border-2 border-primary-300 focus:border-primary-500 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary-500/15 outline-none text-gray-900 font-serif text-lg leading-loose resize-y transition-all"
                                      value={activeEssay.currentContent}
                                      onChange={(e) => handleContentUpdate(e.target.value)}
                                      onSelect={handleSelect}
                                      onKeyDown={handleEditorKeyDown}
                                      placeholder={isEn ? "Type or edit essay content here..." : "双击已进入直接编辑模式，请在此修改文书内容..."}
                                      spellCheck={false}
                                   />
                                </div>
                             ) : (
                                <div className="space-y-3">
                                   <div className="flex items-center justify-between bg-primary-50/90 border border-primary-200 rounded-xl px-4 py-2.5 text-xs text-primary-900 shadow-2xs">
                                      <div className="flex items-center gap-2 font-medium">
                                         <Edit className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                         <span>{isEn ? 'Double-click to edit, changes auto-save in real-time' : '双击即可修改，修改实时自动保存'}</span>
                                      </div>
                                      <button
                                         type="button"
                                         onClick={handleStartEditing}
                                         className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                                      >
                                         <Edit className="w-3.5 h-3.5" />
                                         <span>{isEn ? 'Start Editing' : '开始编辑'}</span>
                                      </button>
                                   </div>
                                   <div 
                                      onDoubleClick={handleStartEditing}
                                      className="relative p-6 -mx-6 rounded-2xl cursor-text select-text"
                                   >
                                      {renderHighlightedText()}
                                   </div>
                                </div>
                             )}
                          </div>
                       </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="absolute bottom-4 right-4 z-20 flex max-w-[calc(100%-2rem)] flex-wrap justify-end gap-2 xl:bottom-6 xl:right-8 xl:gap-3">
                       <button
                          type="button"
                          onClick={() => saveReviewDraft(true)}
                          className="flex items-center gap-2 rounded-full bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-700"
                       >
                          <Save className="h-4 w-4" /> {isEn ? 'Save Review Draft' : '保存审阅草稿'}
                       </button>
                       <div className="relative">
                          {isCreatingVersion ? (
                             <div className="absolute bottom-full right-0 mb-3 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-3 animate-in slide-in-from-bottom-2">
                                <p className="text-xs font-bold text-gray-600 mb-2">{isEn ? 'Create Snapshot' : '创建版本快照 (Snapshot)'}</p>
                                <input 
                                   autoFocus
                                   className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm outline-none focus:border-primary-500 mb-2"
                                   placeholder={isEn ? "Enter note (e.g. Fixed intro)" : "输入备注 (e.g. 完成了开头修改)"}
                                   value={newVersionNote}
                                   onChange={(e) => setNewVersionNote(e.target.value)}
                                />
                                <div className="flex gap-2">
                                   <button onClick={() => setIsCreatingVersion(false)} className="flex-1 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded">{isEn ? 'Cancel' : '取消'}</button>
                                   <button onClick={handleManualSaveVersion} className="flex-1 py-1.5 text-xs bg-primary-600 text-white rounded font-bold hover:bg-primary-700">{isEn ? 'Save' : '保存'}</button>
                                </div>
                             </div>
                          ) : (
                             <button 
                                onClick={() => setIsCreatingVersion(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-full shadow-lg hover:border-primary-400 hover:text-primary-600 transition-all font-bold text-sm"
                             >
                                <GitCommit className="w-4 h-4" /> {isEn ? 'Create Version' : '创建版本'}
                             </button>
                          )}
                       </div>

                       <button 
                          onClick={handleScanEssay}
                          disabled={isAiLoading || !activeEssay.currentContent}
                          className="flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-full shadow-xl hover:bg-black hover:scale-105 transition-all disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed"
                       >
                          {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Wand2 className="w-5 h-5 text-yellow-300"/>}
                          {isAiLoading ? (isEn ? 'Analyzing...' : 'Analyzing...') : (isEn ? 'AI Critique' : 'AI 深度批改')}
                       </button>
                    </div>
                 </div>

                 {/* Review Sidebar */}
                 <div className="z-20 flex h-[300px] w-full flex-shrink-0 flex-col border-t border-gray-200 bg-white shadow-[0_-4px_15px_rgba(0,0,0,0.02)] xl:h-full xl:w-[360px] xl:border-l xl:border-t-0 xl:shadow-[-4px_0_15px_rgba(0,0,0,0.02)]">
                    <div className="grid grid-cols-3 gap-1 border-b border-gray-100 bg-gray-50 p-2">
                       {([
                          ['Comments', isEn ? 'Comments' : '批注', MessageCircle],
                          ['Feedback', isEn ? 'Overall feedback' : '整体反馈', FileText],
                          ['AI', isEn ? 'AI suggestions' : 'AI建议', Bot]
                       ] as const).map(([tab, label, Icon]) => (
                          <button
                             key={tab}
                             type="button"
                             onClick={() => setReviewPanelTab(tab)}
                             className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold transition-colors ${
                                reviewPanelTab === tab
                                   ? 'bg-white text-primary-700 shadow-sm ring-1 ring-gray-200'
                                   : 'text-gray-500 hover:bg-white/70 hover:text-gray-700'
                             }`}
                          >
                             <Icon className="h-3.5 w-3.5" />
                             <span>{label}</span>
                             {tab === 'Comments' && sharedReview?.comments.length ? (
                                <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] text-indigo-700">{sharedReview.comments.length}</span>
                             ) : null}
                          </button>
                       ))}
                    </div>

                    {reviewPanelTab === 'Comments' && (
                       <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4">
                          {sharedReview?.comments.length ? (
                             <div className="space-y-3">
                                {sharedReview.comments.map(comment => (
                                   <div key={comment.id} className="rounded-xl border border-indigo-100 bg-white p-3 shadow-sm">
                                      <p className="mb-2 border-l-2 border-indigo-300 pl-2 text-xs italic text-gray-500">“{comment.quote}”</p>
                                      <p className="text-sm leading-relaxed text-gray-800">{comment.comment}</p>
                                      <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                                         <span>{comment.author}</span>
                                         <span>{comment.createdAt}</span>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          ) : (
                             <div className="flex h-full min-h-36 flex-col items-center justify-center px-6 text-center">
                                <MessageCircle className="mb-3 h-8 w-8 text-gray-300" />
                                <p className="text-xs leading-relaxed text-gray-500">
                                   {isEn ? 'Select text in editing mode to add a specific comment.' : '进入编辑模式并选中文字，即可添加与原文关联的具体批注。'}
                                </p>
                             </div>
                          )}
                       </div>
                    )}

                    {reviewPanelTab === 'Feedback' && (
                       <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-gray-50/50 p-4">
                          <div>
                             <h3 className="text-sm font-bold text-gray-800">{isEn ? 'Overall feedback' : '整体反馈'}</h3>
                             <p className="mt-1 text-xs leading-relaxed text-gray-500">
                                {isEn ? 'Saved independently from returning or finalizing the essay.' : '整体反馈可以独立保存，不会自动退回学生或确认定稿。'}
                             </p>
                          </div>
                          <textarea
                             value={overallFeedbackDraft}
                             onChange={(event) => {
                                setOverallFeedbackDraft(event.target.value);
                                setReviewHasUnsavedChanges(true);
                             }}
                             placeholder={isEn ? 'Summarize strengths, priorities, and the next revision direction...' : '填写整体评价、修改重点和下一轮建议…'}
                             className="min-h-36 flex-1 resize-y rounded-xl border border-gray-200 bg-white p-3 text-sm leading-relaxed outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                          />
                          <button
                             type="button"
                             onClick={handleSaveOverallFeedback}
                             disabled={!reviewHasUnsavedChanges && overallFeedbackDraft === (sharedReview?.overallFeedback || '')}
                             className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                             <Save className="h-4 w-4" /> {isEn ? 'Save feedback' : '保存整体反馈'}
                          </button>
                       </div>
                    )}

                    {reviewPanelTab === 'AI' && (
                       <div className="flex min-h-0 flex-1 flex-col">
                          <div className="flex items-center justify-between border-b border-gray-100 p-4">
                             <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Overall Score</p>
                                <div className="flex items-baseline gap-1">
                                   <span className="text-3xl font-bold text-gray-900">{hasScanned ? essayScore : '--'}</span>
                                   <span className="text-sm text-gray-400">/ 100</span>
                                </div>
                             </div>
                             <div className={`flex h-12 w-12 items-center justify-center rounded-full border-4 ${hasScanned ? 'border-primary-100' : 'border-gray-100'}`}>
                                <span className={`font-bold ${hasScanned ? 'text-primary-600' : 'text-gray-300'}`}>{hasScanned ? 'B+' : '-'}</span>
                             </div>
                          </div>
                          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50/50 p-4">
                             {!hasScanned && (
                                <div className="px-6 py-16 text-center">
                                   <Sparkles className="mx-auto mb-3 h-8 w-8 text-gray-300"/>
                                   <p className="text-xs text-gray-500">{isEn ? 'AI suggestions are optional. Click “AI Critique” when needed.' : 'AI建议为可选能力，需要时再点击“AI 深度批改”。'}</p>
                                </div>
                             )}
                             {suggestions.map((sug) => (
                                <div key={sug.id} onClick={() => setActiveSuggestionId(sug.id)} className={`cursor-pointer rounded-xl border bg-white p-4 ${activeSuggestionId === sug.id ? 'border-primary-500 shadow-md ring-1 ring-primary-500' : 'border-gray-200'}`}>
                                   <div className="mb-2 flex justify-between">
                                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${getSuggestionColor(sug.type).bg} ${getSuggestionColor(sug.type).text}`}>{sug.type}</span>
                                   </div>
                                   <p className="mb-1 text-xs text-gray-500 line-through">{sug.originalText}</p>
                                   <p className="text-sm font-bold text-gray-800">{sug.suggestedText}</p>
                                   <p className="mt-2 text-xs italic text-gray-500">{sug.shortReason}</p>
                                   <button onClick={(event) => { event.stopPropagation(); handleApplySuggestion(sug); }} className="mt-3 w-full rounded bg-green-50 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100">{isEn ? 'Apply' : '应用建议'}</button>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}
                 </div>
              </div>
           )}

           {/* --- VIEW: HISTORY --- */}
           {activeView === 'History' && (
              <div className="flex-1 flex h-full bg-[#f9f8f6]">
                 {/* Left: Enhanced Timeline List */}
                 <div className="w-80 flex-shrink-0 bg-white border-r border-[#e5e0dc] overflow-y-auto">
                    <div className="p-5 border-b border-gray-100">
                       <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <History className="w-5 h-5 text-primary-600" /> {isEn ? 'Version Timeline' : '版本演进 (Version Timeline)'}
                       </h3>
                    </div>
                    <div className="p-2 space-y-6">
                       {Object.entries(groupedVersions).map(([date, vers]) => (
                          <div key={date}>
                             <div className="px-4 py-2 text-xs font-bold text-gray-400 sticky top-0 bg-white z-10">{date}</div>
                             <div className="space-y-1">
                                {(vers as any[]).map((version: any) => {
                                   const isExpanded = expandedVersionIds.has(version.id);
                                   return (
                                   <div 
                                      key={version.id}
                                      onClick={() => setSelectedVersionId(version.id)}
                                      className={`mx-2 px-3 py-3 rounded-lg cursor-pointer transition-all border relative group
                                         ${selectedVersionId === version.id ? 'bg-primary-50 border-primary-200 shadow-sm' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'}
                                      `}
                                   >
                                      <div className="flex justify-between items-start">
                                         <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                            <div className="mt-0.5 relative flex-shrink-0">
                                               <div className={`w-6 h-6 rounded-full flex items-center justify-center border shadow-sm z-10 relative
                                                  ${version.author === 'Student' ? 'bg-blue-50 border-blue-100' : 
                                                    version.author === 'AI' ? 'bg-purple-50 border-purple-100' : 
                                                    'bg-orange-50 border-orange-100'}
                                               `}>
                                                  {getSourceIcon(version.source)}
                                               </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                               <div className="flex items-center justify-between">
                                                  <span className={`text-xs font-bold ${selectedVersionId === version.id ? 'text-primary-900' : 'text-gray-800'}`}>
                                                     {version.versionNumber}
                                                  </span>
                                                  <span className="text-[10px] text-gray-400">{version.updatedAt.split(' ')[1]}</span>
                                               </div>
                                               <p className="text-[10px] text-gray-500 font-medium mt-0.5">{getSourceLabel(version.source)}</p>
                                               {version.note && (
                                                  <p className={`text-xs text-gray-600 mt-1 bg-gray-50/50 p-1.5 rounded ${isExpanded ? 'whitespace-pre-line' : 'line-clamp-2'}`}>
                                                     "{version.note}"
                                                  </p>
                                               )}

                                               {/* Expanded Details */}
                                               {isExpanded && (
                                                  <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-500 space-y-1">
                                                     <div className="flex justify-between">
                                                        <span>{isEn ? 'Author:' : '作者:'}</span>
                                                        <span className="font-semibold text-gray-700">{version.author}</span>
                                                     </div>
                                                     <div className="flex justify-between">
                                                        <span>{isEn ? 'Words:' : '字数:'}</span>
                                                        <span className="font-semibold text-gray-700">
                                                           {version.content ? version.content.trim().split(/\s+/).filter(Boolean).length : 0} {isEn ? 'words' : '词'}
                                                        </span>
                                                     </div>
                                                     <div className="flex justify-between">
                                                        <span>{isEn ? 'Time:' : '时间:'}</span>
                                                        <span className="text-gray-600">{version.updatedAt}</span>
                                                     </div>
                                                  </div>
                                               )}
                                            </div>
                                         </div>

                                         {/* Expand/Collapse Toggle */}
                                         <button 
                                            onClick={(e) => toggleVersionExpand(version.id, e)}
                                            className="ml-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                            title={isExpanded ? (isEn ? 'Collapse' : '收起') : (isEn ? 'Expand' : '展开')}
                                         >
                                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                         </button>
                                      </div>
                                   </div>
                                   );
                                })}
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Right: Preview with Restore */}
                 <div className="flex-1 flex flex-col min-w-0">
                    {selectedVersionId ? (
                       <>
                          <div className="bg-white border-b border-[#e5e0dc] px-6 py-3 flex justify-between items-center shadow-sm z-10">
                             <div className="flex items-center gap-3">
                                <div className={`px-2 py-1 rounded text-xs font-bold border
                                   ${activeEssay.versions.find(v => v.id === selectedVersionId)?.author === 'Student' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'}
                                `}>
                                   {activeEssay.versions.find(v => v.id === selectedVersionId)?.versionNumber} Preview
                                </div>
                                <span className="text-xs text-gray-400">
                                   Author: {activeEssay.versions.find(v => v.id === selectedVersionId)?.author}
                                </span>
                             </div>
                             
                             <div className="flex gap-3">
                                <div className="h-4 w-px bg-gray-200"></div>
                                <button 
                                   onClick={handleRestoreVersion}
                                   className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors shadow-sm"
                                >
                                   <RotateCcw className="w-4 h-4" /> {isEn ? 'Restore Version' : '恢复此版本 (Restore)'}
                                </button>
                             </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-8 bg-gray-100/50">
                             <div className="max-w-3xl mx-auto bg-white p-10 rounded-xl shadow-sm border border-gray-200 min-h-[600px] relative">
                                <div className="whitespace-pre-wrap font-serif text-lg text-gray-800 leading-loose">
                                   {activeEssay.versions.find(v => v.id === selectedVersionId)?.content}
                                </div>
                                <div className="absolute top-4 right-4 text-xs text-gray-300 font-mono select-none">READ ONLY</div>
                             </div>
                          </div>
                       </>
                    ) : (
                       <div className="flex-1 flex items-center justify-center text-gray-400">
                          <div className="text-center">
                             <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                             <p>{isEn ? 'Select a version to preview' : '请从左侧选择一个版本进行预览'}</p>
                          </div>
                       </div>
                    )}
                 </div>
              </div>
           )}

        </div>

      {/* --- Assign Task Modal (Teacher View) --- */}
      {isAssignModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in" onClick={handleRequestCloseTaskModal}>
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                     <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary-600" /> {isEn ? 'Assign Essay Task' : '下发文书任务'}
                     </h3>
                     {isTaskFormDirty && (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                           {isEn ? 'Unsaved edits' : '编辑中（未保存）'}
                        </span>
                     )}
                  </div>
                  <button 
                     onClick={handleRequestCloseTaskModal} 
                     className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                     title={isEn ? "Close" : "关闭"}
                  >
                     <X className="w-5 h-5"/>
                  </button>
               </div>

               {/* Draft Loaded Notice */}
               {hasLoadedDraft && (
                  <div className="px-6 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-xs text-blue-700">
                     <span className="flex items-center gap-1.5 font-medium">
                        <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        {isEn ? 'Restored previously saved task draft.' : '已自动恢复您上次保存的文书任务草稿。'}
                     </span>
                     <button 
                        onClick={handleClearDraftInForm}
                        className="text-blue-600 hover:text-blue-800 font-bold underline ml-2 cursor-pointer flex-shrink-0"
                     >
                        {isEn ? 'Clear Draft' : '清空草稿'}
                     </button>
                  </div>
               )}
               
               <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{isEn ? 'Target School' : '目标院校'}</label>
                        <input 
                           className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                           placeholder={isEn ? "e.g. Yale University" : "例如：耶鲁大学"}
                           value={newTask.school}
                           onChange={e => setNewTask({...newTask, school: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{isEn ? 'Essay Type' : '文书类型'}</label>
                        <select 
                           className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                           value={newTask.type}
                           onChange={e => setNewTask({...newTask, type: e.target.value})}
                        >
                           <option>Personal Statement</option>
                           <option>Why Major</option>
                           <option>Why School</option>
                           <option>Activity/Community</option>
                           <option>Supplemental</option>
                        </select>
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{isEn ? 'Task Title' : '任务标题'}</label>
                     <input 
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-500 placeholder:text-gray-400"
                        placeholder={isEn ? "e.g. Main Essay Draft 1" : "例如：主文书初稿"}
                        value={newTask.title}
                        onChange={e => setNewTask({...newTask, title: e.target.value})}
                     />
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{isEn ? 'Prompt / Requirements' : '题目要求 / 写作指引 (Prompt)'}</label>
                     <textarea 
                        className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-primary-500 min-h-[150px] resize-none placeholder:text-gray-400 font-serif leading-relaxed"
                        placeholder={isEn ? "Paste the prompt here or add specific instructions..." : "在此粘贴文书题目或具体的写作要求..."}
                        value={newTask.prompt}
                        onChange={e => setNewTask({...newTask, prompt: e.target.value})}
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{isEn ? 'Word Limit' : '字数限制'}</label>
                        <input 
                           type="number"
                           className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                           value={newTask.wordLimit}
                           onChange={e => setNewTask({...newTask, wordLimit: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{isEn ? 'Deadline' : '截止日期'}</label>
                        <input 
                           type="date"
                           className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                           value={newTask.deadline}
                           onChange={e => setNewTask({...newTask, deadline: e.target.value})}
                        />
                     </div>
                  </div>

                  {/* Attachment Mock */}
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-primary-300 transition-colors cursor-pointer group">
                     <Upload className="w-6 h-6 mb-1 text-gray-300 group-hover:text-primary-500" />
                     <span className="text-xs group-hover:text-primary-600">{isEn ? 'Upload Reference Files (Optional)' : '上传参考资料 (可选)'}</span>
                  </div>
               </div>

               <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <button 
                     onClick={handleRequestCloseTaskModal} 
                     className="px-4 py-2 text-sm text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                     {isEn ? 'Cancel' : '取消'}
                  </button>
                  <div className="flex items-center gap-2.5">
                     <button 
                        onClick={() => handleSaveDraft(true)}
                        disabled={!isTaskFormDirty}
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-sm font-bold rounded-lg shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                        title={isEn ? 'Save as draft and exit' : '保存当前填写的内容为草稿，稍后继续'}
                     >
                        <Save className="w-3.5 h-3.5 text-gray-500" /> {isEn ? 'Save Draft' : '保存草稿'}
                     </button>
                     <button 
                        onClick={handleAssignTask}
                        disabled={!newTask.title || !newTask.school}
                        className="px-6 py-2 bg-primary-600 text-white text-sm font-bold rounded-lg hover:bg-primary-700 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                     >
                        <Send className="w-3.5 h-3.5" /> {isEn ? 'Assign to Student' : '下发给学生'}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* --- Unsaved Changes Confirmation Modal --- */}
      {showUnsavedConfirm && (
         <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={() => setShowUnsavedConfirm(false)}
         >
            <div 
               className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-amber-200 p-6 animate-in zoom-in-95 duration-150"
               onClick={e => e.stopPropagation()}
            >
               <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                     <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <h4 className="text-base font-bold text-gray-900 mb-1">
                        {isEn ? 'Unsaved Task Details' : '文书任务有未保存的修改'}
                     </h4>
                     <p className="text-xs text-gray-600 leading-relaxed mb-5">
                        {isEn 
                          ? 'You have entered content in the task form. If you close directly, unassigned changes will be lost. Please select an action:' 
                          : '您在文书任务表单中填写了内容，直接关闭将丢失当前输入。请选择接下来的操作：'}
                     </p>

                     <div className="flex flex-col gap-2">
                        <button 
                           onClick={() => setShowUnsavedConfirm(false)}
                           className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                           <PenTool className="w-3.5 h-3.5" /> {isEn ? 'Continue Editing' : '继续编辑'}
                        </button>
                        <button 
                           onClick={() => handleSaveDraft(true)}
                           className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                           <Save className="w-3.5 h-3.5 text-emerald-600" /> {isEn ? 'Save Draft & Close' : '保存草稿并退出'}
                        </button>
                        <button 
                           onClick={handleDiscardAndClose}
                           className="w-full py-2.5 px-4 bg-white border border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                           <Trash2 className="w-3.5 h-3.5" /> {isEn ? 'Discard Changes' : '放弃修改'}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* --- Revision Modal (Return to Student) --- */}
      {isReturnModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsReturnModalOpen(false)}>
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-orange-200 flex flex-col" onClick={e => e.stopPropagation()}>
               <div className="px-6 py-4 border-b border-orange-100 bg-orange-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-orange-800 text-lg flex items-center gap-2">
                     <RotateCcw className="w-5 h-5 text-orange-600" /> {isEn ? 'Return for Revision' : '发回修改'}
                  </h3>
                  <button onClick={() => setIsReturnModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                     <X className="w-5 h-5"/>
                  </button>
               </div>
               
               <div className="p-6">
                  <div className="mb-4 text-sm text-gray-600 leading-relaxed">
                     {isEn 
                       ? 'Provide revision notes for the student. The status will be changed to "Returned" and the student will be able to edit again.' 
                       : '请填写修改意见。状态将变更为“已退回”，学生将重新获得编辑权限。'}
                  </div>
                  <textarea 
                     autoFocus
                     className="w-full border border-gray-200 rounded-xl p-4 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 min-h-[120px] resize-none"
                     placeholder={isEn ? "Enter feedback summary..." : "输入修改意见摘要..."}
                     value={returnNote}
                     onChange={(e) => setReturnNote(e.target.value)}
                  />
               </div>

               <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                  <button onClick={() => setIsReturnModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors">
                     {isEn ? 'Cancel' : '取消'}
                  </button>
                  <button 
                     onClick={confirmReturnForRevision}
                     disabled={!returnNote.trim()}
                     className="px-6 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 shadow-md transition-colors disabled:opacity-50"
                  >
                     {isEn ? 'Send to Student' : '发送给学生'}
                  </button>
               </div>
            </div>
         </div>
      )}

     </div>
  );
};

export default StudentEssays;
