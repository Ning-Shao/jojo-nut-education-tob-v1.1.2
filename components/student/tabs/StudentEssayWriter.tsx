
import React, { useState, useRef, useEffect } from 'react';
import { 
  Edit, Save, Clock, CheckCircle, Sparkles, 
  Maximize2, Minimize2, ChevronLeft, ChevronRight,
  MessageSquare, Wand2, RefreshCw, Scissors, Type,
  AlertCircle, ArrowRight, Check, X, History,
  Languages, Lightbulb, BookOpen, ChevronDown, ChevronUp,
  FileText, FileDown, Download, User, Copy, Quote, Send,
  AlertTriangle, Lock, Unlock, RotateCcw, Loader2
} from '../../common/Icons';
import { GoogleGenAI } from "@google/genai";
import { useLanguage } from '../../../contexts/LanguageContext';

// --- Types ---
interface EssayTask {
  id: string;
  school: string; 
  title: string; 
  type: string;
  prompt: string; 
  wordLimit: number;
  deadline: string;
  status: 'Not Started' | 'Drafting' | 'Reviewing' | 'Returned' | 'Finalized';
  content: string;
  feedback: EssayFeedback[];
  latestReturnNote?: string; // New field for returned message
}

interface EssayFeedback {
  id: string;
  originalText: string;
  comment: string;
  type: 'Grammar' | 'Clarity' | 'Story';
  isResolved: boolean;
}

interface AiOption {
  label: string; 
  text: string;
  reason?: string;
}

interface InspirationIdea {
  title: string;
  description: string;
  matchReason: string;
}

interface TeacherBrief {
  id: string;
  author: string;
  avatar: string;
  date: string;
  title: string;
  content: string;
  tags: string[];
}

// Mock Teacher Briefs
const MOCK_BRIEFS: TeacherBrief[] = [
  {
    id: 'tb1',
    author: 'Ms. Sarah',
    avatar: 'https://api.dicebear.com/7.x/micah/svg?seed=Sarah&backgroundColor=ffdfbf',
    date: '2 hours ago',
    title: 'Essay Strategy: The Lego Metaphor',
    content: "Alex, let's stick to the 'Lego' story we brainstormed. \n\nKey Points to Cover:\n1. The 'Collapse': Describe the failure vividly.\n2. The 'Debug': How you analyzed the structure (connect to CS logic).\n3. The 'Rebuild': It's not just about toys, it's about systems engineering.",
    tags: ['Core Narrative', 'Structure']
  }
];

// --- Mock Data ---
const MOCK_ESSAYS: EssayTask[] = [
  {
    id: 'e1',
    school: 'Common App',
    title: 'Personal Statement',
    type: 'Personal Statement',
    prompt: "The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?",
    wordLimit: 650,
    deadline: 'Nov 1',
    status: 'Returned', // Set to Returned to demo flow
    latestReturnNote: "Great start, Alex. The intro hook is strong, but the second paragraph about the competition feels a bit rushed. Please expand on your internal thought process during the failure. See comments.",
    content: `I have always been fascinated by the way small pieces come together to create something larger than life. My journey began with Legos. These early builds were more than play; they were my first lessons in structural integrity.

When I was 10, I tried to build a replica of the Empire State Building. It collapsed three times. Each time, I learned something new about weight distribution. This experience taught me that failure isn't the end, but a data point for the next iteration.`,
    feedback: [
      { id: 'f1', originalText: 'larger than life', comment: 'A bit cliché. Try "complex systems" or something more specific?', type: 'Clarity', isResolved: false }
    ]
  },
  {
    id: 'e2',
    school: 'Carnegie Mellon Univ.',
    title: 'Why Major (SCS)',
    type: 'Why Major',
    prompt: "Most students at CMU choose their intended major during the application process. Please explain your choice of major and why you believe Carnegie Mellon is the best place for you to pursue it.",
    wordLimit: 300,
    deadline: 'Jan 1',
    status: 'Reviewing', // Demo Reviewing (Locked)
    content: "I want to study CS at CMU because...",
    feedback: []
  },
  {
    id: 'e3',
    school: 'New York Univ.',
    title: 'Global Network Essay',
    type: 'Supplemental',
    prompt: "We would like to understand your interest in NYU's global network. What motivates you to apply to NYU's campuses?",
    wordLimit: 400,
    deadline: 'Jan 5',
    status: 'Not Started',
    content: "",
    feedback: []
  }
];

// --- Simulation of Data from "Basic Info" & "Materials" ---
const STUDENT_FULL_PROFILE = {
  name: "Alex Chen",
  grade: "G11",
  intendedMajor: "Computer Science",
  bio: "Aspiring Computer Scientist with a passion for robotics and AI. Loves building Legos and solving complex problems.",
  activities: [
    { title: "School Robotics Club Founder", role: "President", details: "Led a team of 10 to regional finals. Overcame coding failures." },
    { title: "Community Elderly Care", role: "Volunteer", details: "Organized weekend visits. Learned empathy and communication." },
    { title: "Sci-Fi Novel Club", role: "Member", details: "Avid reader of Asimov and Liu Cixin." }
  ],
  awards: [
    { title: "AMC 12 Distinction", details: "Self-studied advanced calculus." },
    { title: "National Informatics Olympiad (Bronze)", details: "Algorithm design." }
  ],
  traits: ["Resilient", "Logical", "Creative", "Empathetic"]
};

// --- Types for Version History ---
type VersionSource = 'Student_Submit' | 'Teacher_Save' | 'AI_Generate' | 'System_Restore';

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

const StudentEssayWriter: React.FC = () => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';
  
  // --- State ---
  const [essays, setEssays] = useState<EssayTask[]>(MOCK_ESSAYS);
  const [activeEssayId, setActiveEssayId] = useState<string>(MOCK_ESSAYS[0].id);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState('Just now');
  
  // Submit Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  
  // Layout State
  const [isZenMode, setIsZenMode] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'Brief' | 'Inspiration' | 'Tools'>('Brief');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isPromptExpanded, setIsPromptExpanded] = useState(true);

  // Editor State
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  
  // Floating Menu State
  const [floatingMenu, setFloatingMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    mode: 'menu' | 'loading' | 'preview';
    results: AiOption[];
    error?: string;
  }>({ visible: false, x: 0, y: 0, mode: 'menu', results: [] });

  // Translation Tool State
  const [chineseInput, setChineseInput] = useState('');
  const [translationResult, setTranslationResult] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Inspiration AI State
  const [inspirationIdeas, setInspirationIdeas] = useState<InspirationIdea[]>([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);

  // Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // History State (Local for demo)
  const [versions, setVersions] = useState<EssayVersion[]>([]);

  const activeEssay = essays.find(e => e.id === activeEssayId) || essays[0];
  const wordCount = activeEssay.content.split(/\s+/).filter(Boolean).length;
  
  const isReadOnly = activeEssay.status === 'Reviewing' || activeEssay.status === 'Finalized';

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Click outside to close floating menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (floatingMenu.visible && !target.closest('.floating-menu') && target.tagName !== 'TEXTAREA') {
        setFloatingMenu(prev => ({ ...prev, visible: false }));
        // Also clear selection visual if possible, but standard behavior keeps it
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [floatingMenu.visible]);

  // Reset inspiration when switching essays
  useEffect(() => {
    setInspirationIdeas([]);
  }, [activeEssayId]);

  const showToast = (msg: string) => setToastMessage(msg);

  // --- Handlers ---

  const handleContentChange = (newContent: string) => {
    if (isReadOnly) return;
    setEssays(prev => prev.map(e => e.id === activeEssayId ? { ...e, content: newContent } : e));
    setIsSaving(true);
    const timeoutId = setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    }, 1000);
    return () => clearTimeout(timeoutId);
  };

  const createSnapshot = (source: VersionSource, note: string, author: 'Teacher' | 'AI' | 'Student') => {
    const lastVersion = versions[0];
    const newVersionNumber = `V${(parseFloat(lastVersion?.versionNumber.replace('V','') || '0') + 0.1).toFixed(1)}`;
    const count = activeEssay.content.split(/\s+/).filter(Boolean).length;
    
    const newVersion: EssayVersion = {
      id: `v-${Date.now()}`,
      versionNumber: newVersionNumber,
      content: activeEssay.content,
      updatedAt: new Date().toLocaleString(isEn ? 'en-US' : 'zh-CN', {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'}),
      timestamp: Date.now(),
      author: author,
      source: source,
      note: note,
      wordCount: count,
      tags: source === 'Student_Submit' ? ['Submitted'] : []
    };

    setVersions(prev => [newVersion, ...prev]);
    return newVersion;
  };

  const handleRequestSubmit = () => {
    if (isReadOnly) return;
    if (!activeEssay.content.trim()) {
      showToast(isEn ? "Content is empty!" : "内容为空，无法提交");
      return;
    }
    setIsSubmitModalOpen(true);
  };

  const handleConfirmSubmit = () => {
    const note = activeEssay.status === 'Returned' ? (isEn ? 'Resubmitted after revision' : '修改后重新提交') : (isEn ? 'Submitted for review' : '提交审阅');
    createSnapshot('Student_Submit', note, 'Student');
    
    setEssays(prev => prev.map(e => 
      e.id === activeEssayId ? { ...e, status: 'Reviewing' } : e
    ));
    
    setIsSubmitModalOpen(false);
    showToast(isEn ? "Submitted successfully! Teacher notified." : "提交成功！已通知老师进行批改。");
  };

  // Replaced handleSelect with handleMouseUp for better positioning
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isReadOnly) return;
    
    // Defer to allow selection to complete
    setTimeout(() => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        
        if (start !== end) {
            const text = textareaRef.current.value.substring(start, end);
            if (text.trim().length > 0) {
                setSelection({ start, end, text });
                
                // Calculate approximate position. 
                // Since textarea is scrollable, we position relative to viewport
                // but keep it near the mouse which is usually at the end of selection.
                // Ensuring it stays within bounds would be an enhancement.
                setFloatingMenu({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY - 50, // Above cursor
                    mode: 'menu',
                    results: []
                });
            }
        } else {
            // Only clear if we are not clicking ON the menu (handled by useEffect)
            // But since this is textarea mouseup, it means user clicked inside textarea.
            setSelection(null);
            setFloatingMenu(prev => ({ ...prev, visible: false }));
        }
    }, 10);
  };

  const handleResolveFeedback = (feedbackId: string) => {
    setEssays(prev => prev.map(e => {
        if (e.id !== activeEssayId) return e;
        return {
            ...e,
            feedback: e.feedback.map(f => f.id === feedbackId ? { ...f, isResolved: true } : f)
        };
    }));
  };

  const handleDownload = () => {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${activeEssay.title}</title></head><body>`;
    const footer = "</body></html>";
    const sourceHTML = header + `<h1>${activeEssay.title}</h1><h3>${activeEssay.school} - ${activeEssay.type}</h3><p>${activeEssay.prompt}</p><br/>` + activeEssay.content.replace(/\n/g, "<br/>") + footer;
    
    const sourceBlob = new Blob([sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(sourceBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeEssay.title.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveManual = () => {
    if (isReadOnly) return;
    setIsSaving(true);
    setTimeout(() => {
        setIsSaving(false);
        setLastSaved(isEn ? 'Just now (Manual)' : '刚刚 (手动保存)');
    }, 500);
  };

  const insertText = (textToInsert: string) => {
    if (isReadOnly || !textToInsert) return;
    const cursorPosition = textareaRef.current?.selectionStart || activeEssay.content.length;
    const newContent = activeEssay.content.slice(0, cursorPosition) + " " + textToInsert + " " + activeEssay.content.slice(cursorPosition);
    handleContentChange(newContent);
  };

  // --- AI Actions (Floating) ---

  const runAiFloatingTool = async (promptType: 'Polishing' | 'Fix') => {
    if (!selection || isReadOnly) return;
    setFloatingMenu(prev => ({ ...prev, mode: 'loading', error: undefined }));

    const contextText = selection.text; 

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let prompt = "";
      
      if (promptType === 'Polishing') {
          prompt = `
            Task: Rewrite the following college essay excerpt in 2 distinct styles.
            Original Text: "${contextText}"
            
            Output strictly as a JSON array of objects with keys: "label" (string), "text" (string), "reason" (short string).
            Styles to generate:
            1. "Academic" (More formal, sophisticated vocabulary)
            2. "Vivid" (More descriptive, sensory details)
            
            Language: English.
          `;
      } else if (promptType === 'Fix') {
          prompt = `
            Task: Fix grammar, spelling, and punctuation errors in the following text.
            Original Text: "${contextText}"
            
            Output strictly as a JSON object: { "fixedText": "...", "changes": "Brief explanation of fixes" }
          `;
      }

      const response = await ai.models.generateContent({ 
          model: 'gemini-3-flash-preview', 
          contents: prompt,
          config: { responseMimeType: "application/json" }
      });

      if (response.text) {
        const json = JSON.parse(response.text);
        let results: AiOption[] = [];
        if (promptType === 'Polishing' && Array.isArray(json)) {
            results = json;
        } else if (promptType === 'Fix' && json.fixedText) {
            results = [{ label: isEn ? 'Fixed' : '已修正', text: json.fixedText, reason: json.changes }];
        }
        setFloatingMenu(prev => ({ ...prev, mode: 'preview', results }));
      }
    } catch (e) {
      console.error(e);
      setFloatingMenu(prev => ({ ...prev, mode: 'menu', error: isEn ? "AI service busy." : "AI 服务繁忙。" }));
    }
  };

  const applyAiOption = (textToApply: string) => {
    if (isReadOnly || !textToApply) return;
    let newContent = activeEssay.content;
    
    if (selection) {
        newContent = activeEssay.content.substring(0, selection.start) + textToApply + activeEssay.content.substring(selection.end);
    }
    
    handleContentChange(newContent);
    setFloatingMenu(prev => ({ ...prev, visible: false }));
    setSelection(null);
  };

  // --- Translation Logic ---
  const handleTranslate = async () => {
    if (!chineseInput.trim()) return;
    setIsAiProcessing(true);
    setTranslationResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Translate the following Chinese text into high-quality, natural English suitable for a college application essay. Return ONLY the translated English text, without any additional explanations, notes, or markdown formatting.\n\nText: "${chineseInput}"`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      if (response.text) setTranslationResult(response.text.trim());
    } catch (e) { console.error(e); } 
    finally { setIsAiProcessing(false); }
  };

  const insertTranslation = () => {
    if (!translationResult || isReadOnly) return;
    insertText(translationResult);
    setTranslationResult(null);
    setChineseInput('');
  };

  // --- Inspiration Generator Logic ---
  const generateInspiration = async () => {
    setIsGeneratingIdeas(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const profileString = `
        Bio: ${STUDENT_FULL_PROFILE.bio}
        Intended Major: ${STUDENT_FULL_PROFILE.intendedMajor}
        Activities: ${STUDENT_FULL_PROFILE.activities.map(a => `${a.title} (${a.role}): ${a.details}`).join('; ')}
        Awards: ${STUDENT_FULL_PROFILE.awards.map(a => `${a.title}: ${a.details}`).join('; ')}
        Traits: ${STUDENT_FULL_PROFILE.traits.join(', ')}
      `;

      const prompt = `
        Role: Expert College Essay Coach.
        Task: Brainstorm 3 distinct, creative, and personalized essay angles/themes for the student based on their profile and the essay prompt.
        
        Student Profile:
        ${profileString}
        
        Essay Prompt:
        "${activeEssay.prompt}"
        
        Requirements:
        1. Connect a specific aspect of the student's background (an activity, trait, or experience) to the prompt.
        2. Be specific, not generic. Avoid clichés.
        3. Provide a 'title' (catchy hook), 'description' (the story arc), and 'matchReason' (why this fits the student).
        4. Output format: JSON array of objects.
        5. Language: ${isEn ? 'English' : 'English (with Chinese explanation in description)'}.
        
        Example JSON:
        [
          { "title": "The Robotic Symphony", "description": "...", "matchReason": "..." }
        ]
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      if (response.text) {
        setInspirationIdeas(JSON.parse(response.text));
      }
    } catch (e) {
      console.error(e);
      showToast(isEn ? "Failed to generate ideas." : "生成灵感失败，请重试。");
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  // Toast
  const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
      <CheckCircle className="w-4 h-4 text-green-400" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-3 h-3" /></button>
    </div>
  );

  return (
    <div className="flex h-full animate-in fade-in slide-in-from-bottom-2 overflow-hidden relative bg-[#fcfcfc] dark:bg-zinc-950">
      
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      {/* Floating Toolbar */}
      {floatingMenu.visible && (
        <div 
            className="fixed z-50 floating-menu"
            style={{ 
                left: Math.min(window.innerWidth - 320, Math.max(20, floatingMenu.x - 100)), // Keep within screen
                top: Math.max(20, floatingMenu.y) 
            }}
        >
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 p-1 flex flex-col gap-1 min-w-[200px] animate-in zoom-in-95 duration-200">
                {floatingMenu.mode === 'menu' && (
                    <div className="flex gap-1 p-1">
                        <button 
                            onClick={() => runAiFloatingTool('Polishing')}
                            className="flex items-center gap-2 px-3 py-2 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg text-xs font-bold transition-colors"
                        >
                            <Sparkles className="w-3.5 h-3.5" /> {isEn ? 'Polish' : '润色'}
                        </button>
                        <button 
                            onClick={() => runAiFloatingTool('Fix')}
                            className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors"
                        >
                            <CheckCircle className="w-3.5 h-3.5" /> {isEn ? 'Fix' : '纠错'}
                        </button>
                    </div>
                )}

                {floatingMenu.mode === 'loading' && (
                    <div className="p-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                        <RefreshCw className="w-4 h-4 animate-spin text-violet-500" />
                        {isEn ? 'AI Working...' : 'AI 正在思考...'}
                    </div>
                )}

                {floatingMenu.mode === 'preview' && (
                    <div className="w-72 p-2">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{isEn ? 'AI Suggestions' : 'AI 建议'}</span>
                            <button onClick={() => setFloatingMenu(prev => ({...prev, visible: false}))} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3"/></button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {floatingMenu.results.map((opt, idx) => (
                                <div key={idx} className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-2 border border-gray-100 dark:border-zinc-700 hover:border-violet-300 transition-colors cursor-pointer group" onClick={() => applyAiOption(opt.text)}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">{opt.label}</span>
                                        <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100">{isEn ? 'Click to Apply' : '点击应用'}</span>
                                    </div>
                                    <p className="text-xs text-gray-700 dark:text-zinc-300 leading-snug">{opt.text}</p>
                                    {opt.reason && <p className="text-[9px] text-gray-400 mt-1 italic">{opt.reason}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {floatingMenu.error && (
                    <div className="p-2 text-xs text-red-500 text-center">{floatingMenu.error}</div>
                )}
            </div>
            {/* Arrow */}
            <div className="w-3 h-3 bg-white dark:bg-zinc-800 border-r border-b border-gray-200 dark:border-zinc-700 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1.5 shadow-sm"></div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setIsSubmitModalOpen(false)}>
           <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                 <h3 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2">
                    <Send className="w-5 h-5 text-violet-600" /> {activeEssay.status === 'Returned' ? (isEn ? 'Confirm Resubmission' : '确认重新提交') : (isEn ? 'Confirm Submission' : '确认提交')}
                 </h3>
                 <button onClick={() => setIsSubmitModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="p-6 space-y-4">
                 <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-lg border border-blue-100 dark:border-blue-500/20">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>
                       {isEn 
                         ? "Your essay will be locked for review. You won't be able to make changes until your counselor returns feedback."
                         : "提交后文书将锁定并进入审阅状态。在老师反馈前，您将无法继续编辑内容。"
                       }
                    </p>
                 </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-900/50 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
                 <button onClick={() => setIsSubmitModalOpen(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                    {isEn ? 'Cancel' : '取消'}
                 </button>
                 <button 
                    onClick={handleConfirmSubmit}
                    className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 shadow-lg shadow-violet-500/20 transition-all flex items-center gap-2"
                 >
                    <Send className="w-4 h-4" /> {isEn ? 'Submit' : '确认提交'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* 1. LEFT SIDEBAR: Task List */}
      <div 
        className={`bg-white dark:bg-zinc-900 border-r border-[#e5e0dc] dark:border-white/5 flex flex-col transition-all duration-300 ease-in-out
            ${isZenMode ? 'w-0 opacity-0 overflow-hidden' : 'w-64 opacity-100'}
        `}
      >
         <div className="p-4 border-b border-[#e5e0dc] dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
            <h3 className="font-bold text-gray-800 dark:text-zinc-200 text-sm flex items-center gap-2">
               <FileText className="w-4 h-4 text-violet-600" /> {isEn ? 'Essay Tasks' : '文书任务清单'}
            </h3>
         </div>
         <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {essays.map(essay => (
               <div 
                  key={essay.id}
                  onClick={() => setActiveEssayId(essay.id)}
                  className={`p-3 rounded-lg cursor-pointer border transition-all group relative
                     ${activeEssayId === essay.id 
                        ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-500/30' 
                        : 'bg-white dark:bg-zinc-900 border-transparent hover:bg-gray-50 dark:hover:bg-white/5'}
                  `}
               >
                  {/* Status Indicator */}
                  {essay.status === 'Drafting' && <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r"></div>}
                  {essay.status === 'Reviewing' && <div className="absolute left-0 top-3 bottom-3 w-1 bg-orange-500 rounded-r"></div>}
                  {essay.status === 'Returned' && <div className="absolute left-0 top-3 bottom-3 w-1 bg-purple-500 rounded-r"></div>}
                  {essay.status === 'Finalized' && <div className="absolute left-0 top-3 bottom-3 w-1 bg-green-500 rounded-r"></div>}
                  
                  <div className="pl-2">
                     <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${activeEssayId === essay.id ? 'text-violet-600' : 'text-gray-400'}`}>
                        {essay.school}
                     </p>
                     <p className={`text-sm font-bold leading-tight mb-1 ${activeEssayId === essay.id ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-zinc-300'}`}>
                        {essay.title}
                     </p>
                     <div className="flex items-center justify-between mt-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            essay.status === 'Drafting' ? 'bg-blue-50 text-blue-700' : 
                            essay.status === 'Reviewing' ? 'bg-orange-50 text-orange-700' :
                            essay.status === 'Returned' ? 'bg-purple-50 text-purple-700' : 
                            essay.status === 'Finalized' ? 'bg-green-50 text-green-700' :
                            'bg-gray-100 text-gray-500'
                        }`}>{essay.status}</span>
                        <span className={`text-[10px] flex items-center gap-1 ${new Date(essay.deadline) < new Date() ? 'text-red-500 font-bold' : 'text-gray-400'}`}><Clock className="w-2.5 h-2.5" /> {essay.deadline}</span>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* 2. CENTER: Editor Area */}
      <div className="flex-1 flex flex-col relative h-full min-w-0">
         
         {/* Top Bar */}
         <div className="border-b border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900 flex-shrink-0 z-20">
            <div className="h-14 flex items-center justify-between px-6">
               <div className="flex items-center gap-3 min-w-0">
                  {isZenMode && (
                      <button onClick={() => setIsZenMode(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded" title="Show Sidebar">
                          <ChevronRight className="w-4 h-4 text-gray-500"/>
                      </button>
                  )}
                  <div className="flex flex-col truncate">
                     <div className="flex items-center gap-2">
                        <h2 className="font-bold text-gray-900 dark:text-white truncate text-sm sm:text-base">{activeEssay.title}</h2>
                        <span className="text-xs text-gray-400 hidden sm:inline">@ {activeEssay.school}</span>
                        {activeEssay.status === 'Finalized' && <Lock className="w-3 h-3 text-green-600" />}
                     </div>
                  </div>
               </div>
               
               <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Status & Word Count */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 px-3 py-1 bg-gray-50 dark:bg-white/5 rounded-full">
                     <span className={`${wordCount > activeEssay.wordLimit ? 'text-red-500 font-bold' : ''}`}>{wordCount}</span>
                     <span className="text-gray-300">/</span>
                     <span>{activeEssay.wordLimit} words</span>
                  </div>
                  
                  {/* Submit Button (Dynamic based on state) */}
                  {activeEssay.status !== 'Finalized' && (
                      <button 
                         onClick={handleRequestSubmit}
                         disabled={isReadOnly}
                         className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all
                           ${isReadOnly 
                             ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                             : 'bg-violet-600 text-white hover:bg-violet-700 hover:shadow-md'}
                         `}
                      >
                         <Send className="w-3.5 h-3.5" /> 
                         {activeEssay.status === 'Returned' 
                           ? (isEn ? 'Resubmit Revision' : '提交修改稿') 
                           : (activeEssay.status === 'Reviewing' 
                               ? (isEn ? 'Under Review' : '审阅中') 
                               : (isEn ? 'Submit to Teacher' : '提交给老师'))}
                      </button>
                  )}

                  <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>

                  <button onClick={handleSaveManual} disabled={isReadOnly} title={isEn ? "Save" : "保存"} className={`p-2 rounded-lg transition-colors ${isReadOnly ? 'text-gray-300' : 'text-gray-400 hover:text-primary-600 hover:bg-gray-100'}`}><Save className="w-4 h-4"/></button>
                  <button onClick={handleDownload} title={isEn ? "Download Word" : "下载 Word"} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"><FileDown className="w-4 h-4"/></button>
                  
                  <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>

                  <button onClick={() => setIsZenMode(!isZenMode)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
                     {isZenMode ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
                  </button>
                  <button onClick={() => setIsRightPanelOpen(!isRightPanelOpen)} className={`p-2 rounded-lg transition-colors ${isRightPanelOpen ? 'bg-gray-100 dark:bg-white/10 text-gray-900' : 'text-gray-400 hover:bg-gray-100'}`}>
                     <MessageSquare className="w-4 h-4" />
                  </button>
               </div>
            </div>

            {/* Prompt Display */}
            <div className={`px-6 overflow-hidden transition-all duration-300 border-t border-gray-50 dark:border-white/5 ${isPromptExpanded ? 'max-h-60 py-4' : 'max-h-0 py-0'}`}>
               <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20 p-4 rounded-xl relative group">
                  <p className="text-xs font-bold text-yellow-800 dark:text-yellow-500 uppercase mb-1">Essay Prompt</p>
                  <p className="text-sm text-gray-800 dark:text-zinc-200 leading-relaxed font-serif">{activeEssay.prompt}</p>
                  <button onClick={() => setIsPromptExpanded(false)} className="absolute top-2 right-2 p-1 text-yellow-700/50 hover:text-yellow-700 transition-colors"><ChevronUp className="w-4 h-4" /></button>
               </div>
            </div>
            {!isPromptExpanded && (
               <div className="flex justify-center -mt-3 relative z-10">
                  <button onClick={() => setIsPromptExpanded(true)} className="bg-white dark:bg-zinc-800 border border-t-0 border-gray-100 dark:border-white/10 px-3 py-0.5 rounded-b-lg shadow-sm text-[10px] text-gray-400 hover:text-primary-600 flex items-center gap-1 transition-colors">
                     Show Prompt <ChevronDown className="w-3 h-3" />
                  </button>
               </div>
            )}
         </div>

         {/* Editor */}
         <div className="flex-1 overflow-y-auto relative custom-scrollbar">
            {/* Status Banners */}
            {activeEssay.status === 'Returned' && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-500/30 px-8 py-4 flex items-start gap-3 animate-in slide-in-from-top-2">
                    <AlertTriangle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-purple-900 dark:text-purple-200">{isEn ? 'Teacher Request Revision' : '老师发回修改'}</p>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">{activeEssay.latestReturnNote}</p>
                    </div>
                </div>
            )}
            
            {activeEssay.status === 'Finalized' && (
                <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-500/30 px-8 py-3 flex items-center gap-3 animate-in slide-in-from-top-2 justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-bold text-green-800 dark:text-green-200">{isEn ? 'Essay Finalized. Good luck!' : '文书已定稿。祝申请顺利！'}</p>
                </div>
            )}

            <div className={`mx-auto h-full py-12 px-8 transition-all duration-300 ${isZenMode ? 'max-w-4xl' : 'max-w-3xl'}`}>
               <textarea 
                  ref={textareaRef}
                  className={`w-full h-full min-h-[60vh] resize-none outline-none text-lg leading-loose text-gray-800 dark:text-zinc-200 font-serif bg-transparent placeholder:text-gray-300 dark:placeholder:text-zinc-700 selection:bg-violet-200 dark:selection:bg-violet-900/50 ${isReadOnly ? 'cursor-not-allowed text-gray-500' : ''}`}
                  placeholder={isEn ? "Start writing your story here..." : "在此开始书写你的故事..."}
                  value={activeEssay.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onMouseUp={handleMouseUp}
                  spellCheck={false}
                  readOnly={isReadOnly}
               />
            </div>
         </div>
      </div>

      {/* 3. RIGHT SIDEBAR: The Copilot */}
      <div 
         className={`bg-white dark:bg-zinc-900 border-l border-[#e5e0dc] dark:border-white/5 flex flex-col transition-all duration-300 ease-in-out shadow-[-4px_0_15px_rgba(0,0,0,0.02)]
            ${isRightPanelOpen ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full overflow-hidden'}
         `}
      >
         {/* Tabs */}
         <div className="flex p-2 border-b border-gray-100 dark:border-white/5">
            {[
               { id: 'Brief', icon: User, label: isEn ? 'Brief' : '指引' },
               { id: 'Inspiration', icon: Lightbulb, label: isEn ? 'Ideas' : '灵感' },
               { id: 'Tools', icon: Wand2, label: isEn ? 'Tools' : '助手' },
            ].map(tab => (
               <button 
                  key={tab.id}
                  onClick={() => setRightPanelTab(tab.id as any)}
                  className={`flex-1 py-2 text-[10px] lg:text-xs font-bold rounded-lg flex flex-col lg:flex-row items-center justify-center gap-1 transition-colors
                     ${rightPanelTab === tab.id 
                        ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' 
                        : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}
                  `}
               >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
               </button>
            ))}
         </div>

         <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            
            {/* --- TAB 1: TEACHER BRIEF --- */}
            {rightPanelTab === 'Brief' && (
               <div className="space-y-4">
                  {MOCK_BRIEFS.map(brief => (
                     <div key={brief.id} className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4 shadow-sm relative group">
                        <div className="flex items-center gap-3 mb-3 border-b border-indigo-200 dark:border-indigo-500/20 pb-2">
                           <img src={brief.avatar} className="w-8 h-8 rounded-full border border-indigo-200" alt="avatar" />
                           <div>
                              <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">{brief.author}</p>
                              <p className="text-[10px] text-indigo-500 dark:text-indigo-400">{brief.date}</p>
                           </div>
                        </div>
                        
                        <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-2">{brief.title}</h4>
                        <div className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium">
                           {brief.content}
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-3">
                           {brief.tags.map(tag => (
                              <span key={tag} className="text-[9px] bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-white/10 text-indigo-600 dark:text-indigo-300">#{tag}</span>
                           ))}
                        </div>

                        {!isReadOnly && (
                            <button 
                            onClick={() => insertText(brief.content)}
                            className="absolute top-3 right-3 p-1.5 bg-white dark:bg-zinc-800 rounded-lg text-indigo-500 hover:text-indigo-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            title={isEn ? "Insert into editor" : "插入到编辑器"}
                            >
                            <Copy className="w-3.5 h-3.5" />
                            </button>
                        )}
                     </div>
                  ))}
                  
                  {MOCK_BRIEFS.length === 0 && (
                     <div className="text-center py-10 text-gray-400 text-xs">
                        {isEn ? 'No guidance from counselor yet.' : '暂无顾问指引。'}
                     </div>
                  )}
               </div>
            )}

            {/* --- TAB 2: INSPIRATION (AI Powered) --- */}
            {rightPanelTab === 'Inspiration' && (
               <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl border border-yellow-100 dark:border-yellow-500/20">
                     <p className="text-xs text-yellow-800 dark:text-yellow-500 font-bold mb-2 flex items-center gap-2"><Sparkles className="w-3 h-3" /> {isEn ? 'Profile Match AI' : '素材匹配推荐 (AI)'}</p>
                     <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                        {isEn 
                          ? 'AI will analyze your profile and the essay prompt to suggest unique story angles.' 
                          : 'AI 将分析您的个人档案（活动、奖项、特质）与当前文书题目，为您生成独特的写作切入点。'}
                     </p>
                     
                     {inspirationIdeas.length === 0 && (
                        <button 
                           onClick={generateInspiration}
                           disabled={isGeneratingIdeas}
                           className="w-full mt-3 py-2 bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-800 dark:text-yellow-200 rounded-lg text-xs font-bold border border-yellow-200 dark:border-yellow-500/30 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                           {isGeneratingIdeas ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                           {isGeneratingIdeas ? (isEn ? 'Analyzing...' : '分析中...') : (isEn ? 'Generate Ideas' : '生成灵感')}
                        </button>
                     )}
                  </div>

                  {inspirationIdeas.length > 0 && (
                     <div className="space-y-3 animate-in fade-in slide-in-from-right-2">
                        <div className="flex justify-between items-center px-1">
                           <span className="text-[10px] font-bold text-gray-400 uppercase">{isEn ? 'Suggestions' : 'AI 建议'}</span>
                           <button onClick={generateInspiration} className="text-[10px] text-violet-600 hover:underline flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" /> {isEn ? 'Regenerate' : '重新生成'}
                           </button>
                        </div>
                        {inspirationIdeas.map((idea, idx) => (
                           <div key={idx} className="border border-gray-200 dark:border-white/10 rounded-xl p-3 bg-white dark:bg-zinc-800 group relative hover:border-violet-300 dark:hover:border-violet-700 transition-colors shadow-sm">
                              <p className="text-xs font-bold text-gray-800 dark:text-zinc-200 mb-1 flex items-center gap-2">
                                 {idea.title}
                              </p>
                              <p className="text-[10px] text-gray-600 dark:text-zinc-400 leading-relaxed mb-2">
                                 {idea.description}
                              </p>
                              <div className="pt-2 border-t border-gray-50 dark:border-white/5 mt-2">
                                 <p className="text-[9px] text-violet-500 font-medium flex items-start gap-1">
                                    <span className="shrink-0 mt-0.5">🎯</span> {idea.matchReason}
                                 </p>
                              </div>
                              
                              {!isReadOnly && (
                                 <button 
                                    onClick={() => insertText(idea.description)}
                                    className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-violet-600 bg-white/80 dark:bg-zinc-800/80 rounded opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                                    title={isEn ? "Insert Idea" : "插入灵感"}
                                 >
                                    <ArrowRight className="w-3 h-3" />
                                 </button>
                              )}
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            )}

            {/* --- TAB 3: TOOLS (Simplified) --- */}
            {rightPanelTab === 'Tools' && (
               <div className={`space-y-6 ${isReadOnly ? 'opacity-50 pointer-events-none' : ''}`}>
                  {/* Chinese Helper Only */}
                  <div className="space-y-2">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Languages className="w-3 h-3" /> {isEn ? 'Chinese to English' : '中英写作助手'}
                     </p>
                     <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-1 focus:border-violet-300 transition-colors focus-within:ring-2 focus-within:ring-violet-100">
                        <textarea 
                           className="w-full p-3 text-xs bg-transparent outline-none resize-none h-20 text-gray-800 dark:text-zinc-200 placeholder:text-gray-400"
                           placeholder={isEn ? "Type Chinese idea..." : "输入中文想法，AI 帮你翻译..."}
                           value={chineseInput}
                           onChange={(e) => setChineseInput(e.target.value)}
                        />
                        {translationResult ? (
                           <div className="px-3 pb-3">
                              <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded text-xs text-violet-800 dark:text-violet-200 mb-2 italic">"{translationResult}"</div>
                              <div className="flex gap-2">
                                 <button onClick={insertTranslation} className="flex-1 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 shadow-sm">{isEn ? 'Insert' : '插入'}</button>
                                 <button onClick={() => setTranslationResult(null)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">{isEn ? 'Retry' : '重试'}</button>
                              </div>
                           </div>
                        ) : (
                           <div className="px-3 pb-3 flex justify-end">
                              <button onClick={handleTranslate} disabled={!chineseInput.trim() || isAiProcessing} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 dark:bg-zinc-700 dark:border-white/10 dark:text-zinc-200 rounded-lg text-xs font-bold hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1 shadow-sm">
                                 {isAiProcessing ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Languages className="w-3 h-3"/>} {isEn ? 'Translate' : '翻译'}
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
                  
                  {/* Floating Tool Hint */}
                  <div className="p-4 border-2 border-dashed border-gray-100 dark:border-white/10 rounded-xl text-center text-gray-400 text-xs mt-4">
                     {isEn ? 'Tip: Select text in the editor to use Polishing & Fixing tools.' : '提示：在编辑器中选中文字即可唤起润色与纠错浮窗。'}
                  </div>
               </div>
            )}

         </div>
      </div>

    </div>
  );
};

export default StudentEssayWriter;
