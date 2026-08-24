
import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, CheckCircle, Lock, Target, Calendar, 
  ExternalLink, TrendingUp, Star,
  School, AlertTriangle, Zap, Sparkles, MapPin, 
  Clock, Check, ArrowRight, Brain, Briefcase, LayoutGrid,
  Globe, Info, FileText, Bookmark, BarChart3, Flag, Trophy,
  BookOpen, ChevronDown, ChevronUp, ArrowUpRight, List
} from '../../common/Icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import { SelectedSchool, TimelineEvent, UniversityDisplay } from '../../teacher/planning/PlanningData';
import { getStudentFinalSchools } from '../studentSchoolList';

// --- Sub-component: Metric Ruler for Quantitative Gaps ---
const MetricRuler: React.FC<{
  label: string;
  min: number;
  max: number;
  current: number;
  reachAvg: number;
  matchAvg: number;
  safetyAvg: number;
  isEn: boolean;
  diffLabel?: string;
  diffColor?: string;
}> = ({ label, min, max, current, reachAvg, matchAvg, safetyAvg, isEn, diffLabel, diffColor }) => {
  const range = max - min;
  const getPercent = (val: number) => Math.min(Math.max(((val - min) / range) * 100, 0), 100);
  const hasGap = reachAvg > current;

  return (
    <div className="mb-8 last:mb-0">
      <div className="flex justify-between items-end mb-4">
        <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-700 dark:text-zinc-200">{label}</span>
            {diffLabel && (
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${diffColor}`}>
                    {diffLabel}
                </span>
            )}
        </div>
        <div className="flex items-center gap-3">
            {hasGap && (
                <button className="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 px-2 py-1 rounded border border-violet-200 dark:border-violet-500/30 transition-colors flex items-center gap-1 group">
                    {isEn ? 'View Plan' : '查看提升方案'} <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
            )}
            <span className="text-xl font-black text-violet-600 dark:text-violet-400">
                {current} <span className="text-xs text-gray-400 font-normal ml-1">My Score</span>
            </span>
        </div>
      </div>
      
      <div className="relative h-10 select-none mt-2">
        {/* Track */}
        <div className="absolute top-1/2 left-0 w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full transform -translate-y-1/2"></div>
        
        {/* Gap Bar (Visual connector for Reach gap) */}
        {reachAvg > current && (
           <div 
              className="absolute top-1/2 h-1.5 bg-red-100 dark:bg-red-500/20 transform -translate-y-1/2 z-0"
              style={{ 
                 left: `${getPercent(current)}%`, 
                 width: `${getPercent(reachAvg) - getPercent(current)}%` 
              }}
           ></div>
        )}

        {/* Ticks Labels */}
        <div className="absolute top-[24px] left-0 w-full flex justify-between text-[10px] text-gray-300 dark:text-zinc-600 font-mono">
           <span>{min}</span>
           <span>{max}</span>
        </div>

        {/* Safety Marker */}
        <div 
            className="absolute top-1/2 transform -translate-y-1/2 flex flex-col items-center group z-10"
            style={{ left: `${getPercent(safetyAvg)}%` }}
        >
            <div className="w-0.5 h-3 bg-green-300 dark:bg-green-700 mb-1"></div>
            <div className="absolute top-4 text-[10px] text-green-600 dark:text-green-500 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-green-100 dark:border-green-900 whitespace-nowrap shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
               {isEn ? 'Safety' : '保底'} {safetyAvg}
            </div>
        </div>

        {/* Match Marker */}
        <div 
            className="absolute top-1/2 transform -translate-y-1/2 flex flex-col items-center group z-20"
            style={{ left: `${getPercent(matchAvg)}%` }}
        >
            <div className="w-0.5 h-4 bg-blue-300 dark:bg-blue-700 mb-1"></div>
            <div className="absolute top-5 text-[10px] text-blue-600 dark:text-blue-500 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900 whitespace-nowrap shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
               {isEn ? 'Match' : '匹配'} {matchAvg}
            </div>
        </div>

        {/* Reach Marker */}
        <div 
            className="absolute top-1/2 transform -translate-y-1/2 flex flex-col items-center group z-30"
            style={{ left: `${getPercent(reachAvg)}%` }}
        >
            <div className="w-0.5 h-5 bg-red-300 dark:bg-red-700 mb-1"></div>
            <div className="absolute top-6 text-[10px] text-red-600 dark:text-red-500 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900 whitespace-nowrap shadow-sm">
               {isEn ? 'Reach' : '冲刺'} {reachAvg}
            </div>
        </div>

        {/* Current Student Marker */}
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 flex flex-col items-center z-40 transition-all duration-700 ease-out"
          style={{ left: `${getPercent(current)}%` }}
        >
           <div className="w-4 h-4 rounded-full bg-violet-600 border-2 border-white dark:border-zinc-900 shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
           <div className="absolute -top-7 bg-violet-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
              You
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-component: Collapsible School Card ---
const SchoolCard: React.FC<{
    school: SelectedSchool;
    isEn: boolean;
    tierStyle: string;
}> = ({ school, isEn, tierStyle }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Extract first line of deadline for summary
    const nextDeadline = school.deadlines ? school.deadlines.split('\n')[0] : '';

    return (
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800/20 overflow-hidden hover:shadow-md transition-all">
            {/* Header / Trigger */}
            <div 
                className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-zinc-800/50 cursor-pointer select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/10 flex items-center justify-center shadow-sm p-1">
                        <img src={school.uni.logo} className="w-full h-full object-contain" alt={school.uni.name} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{school.uni.name}</p>
                            {school.tier === 'Reach' && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-500 dark:text-zinc-400">Rank {school.uni.rank}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                            <span className="text-[10px] font-medium text-gray-700 dark:text-zinc-300">{school.major}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {!isOpen && nextDeadline && (
                        <div className="text-right hidden sm:block animate-in fade-in">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">{isEn ? 'Next Deadline' : '最近截止'}</p>
                            <p className="text-xs font-mono font-medium text-red-600 dark:text-red-400">{nextDeadline}</p>
                        </div>
                    )}
                    <div className={`p-1.5 rounded-full transition-transform duration-200 ${isOpen ? 'bg-gray-200 dark:bg-zinc-700 rotate-180' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isOpen && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-white/5 text-xs animate-in slide-in-from-top-2">
                    {/* 1. Official Reqs */}
                    <div className="p-4 space-y-2">
                        <p className="font-bold text-gray-500 dark:text-zinc-500 uppercase text-[10px] flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {isEn ? 'Official Requirements' : '官网录取要求'}
                        </p>
                        <div className="text-gray-700 dark:text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
                            {school.requirements || '-'}
                        </div>
                    </div>

                    {/* 2. Admission Advice (Highlighted) */}
                    <div className="p-4 space-y-2 bg-yellow-50/30 dark:bg-yellow-500/5">
                        <p className="font-bold text-yellow-700 dark:text-yellow-500 uppercase text-[10px] flex items-center gap-1">
                            <Info className="w-3 h-3" /> {isEn ? 'Admission Advice' : '实际录取建议 (Advice)'}
                        </p>
                        <div className="text-gray-700 dark:text-zinc-300 leading-relaxed italic">
                            {school.admissionAdvice || '-'}
                        </div>
                    </div>

                    {/* 3. Deadlines */}
                    <div className="p-4 space-y-2">
                        <p className="font-bold text-gray-500 dark:text-zinc-500 uppercase text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {isEn ? 'Key Deadlines' : '关键时间 (Deadlines)'}
                        </p>
                        <div className="text-gray-700 dark:text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
                            {school.deadlines || '-'}
                        </div>
                        <div className="pt-2">
                            <button className="flex items-center gap-1 text-[10px] text-violet-600 hover:underline">
                                <ExternalLink className="w-3 h-3" /> {isEn ? 'Visit Website' : '访问官网'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StudentRoadmap: React.FC = () => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';
  
  const isPlanPublished = true;
  
  // Refs for scroll container and active section state
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState('section-strategy');

  // --- Scroll Spy Logic ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const sections = [
        'section-strategy', 
        'section-schools', 
        'section-gaps', 
        'section-courses', 
        'section-timeline'
      ];
      
      let current = sections[0];
      
      for (const id of sections) {
        const el = document.getElementById(id);
        // Robust check to avoid "e.getBoundingClientRect is not a function"
        if (el && typeof el.getBoundingClientRect === 'function') {
           const rect = el.getBoundingClientRect();
           // Since the container scrolls, we check relative to viewport top (assuming header ~100px)
           // If the top of the element is near the top of the view (e.g. < 250px), it's active
           if (rect.top < 250) {
             current = id;
           }
        }
      }
      setActiveSection(current);
    };

    container.addEventListener('scroll', handleScroll);
    // Trigger once to set initial state
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // --- 1. Strategic Data ---
  const aiAnalysis = {
    title: isEn ? "Core Insight (AI Synthesis)" : "核心洞察 (AI Synthesis)",
    content: isEn 
      ? "The student is a typical high-math-talent individual. It is recommended to follow an elite path of 'Technology as the foundation, Finance as the application'. Leveraging their outstanding performance in AMC 12 and interest in complex systems, they should avoid repetitive traditional finance roles and instead target high-barrier Quantitative Finance or frontier AI fields. This strategy utilizes their logical strengths, satisfies their desire to 'do cool things', and perfectly bridges their family's deep connections in the financial sector for a high-trajectory career launch."
      : "该生是一名典型的高数理天赋型学生，建议走“技术为本、金融为用”的精英路径。利用其AMC 12的优异表现和对复杂系统的兴趣，避开传统金融的重复性业务，转而攻克技术壁垒极高的量化金融或前沿AI领域。这既能发挥其逻辑专长并满足“做酷事”的心理需求，又能完美衔接家庭在金融圈的深厚人脉，实现高起点的职业爆发。"
  };

  const targetPreferences = [
    { 
      id: 1, 
      region: 'US', 
      label: isEn ? 'United States' : '美国 (United States)',
      icon: '🇺🇸',
      majors: isEn ? ['Computer Science', 'Financial Engineering'] : ['Computer Science (计算机科学)', 'Financial Engineering (金融工程)']
    },
    { 
      id: 2, 
      region: 'UK', 
      label: isEn ? 'United Kingdom' : '英国 (United Kingdom)',
      icon: '🇬🇧',
      majors: isEn ? ['Computer Science', 'Mathematics'] : ['Computer Science (计算机科学)', 'Mathematics (数学)']
    }
  ];

  const recommendedMajors = [
    {
      name: isEn ? "Financial Engineering" : "Financial Engineering (金融工程)",
      match: 95,
      reason: isEn 
        ? "With advanced math logic from AMC 12 and Python basics, the student is perfectly suited for complex pricing models, directly connecting to family resources in top brokerages."
        : "学生具备AMC 12的高级数学逻辑和Python基础，非常适合处理复杂的定价模型，且能直接对接父母在头部券商的量化交易资源。"
    },
    {
      name: isEn ? "Computer Science" : "Computer Science (计算机科学)",
      match: 90,
      reason: isEn 
        ? "Interest in LEGO and Sci-Fi shows potential for building complex systems. CS offers a high-challenge technical environment and ensures a stable high-paying path."
        : "学生对乐高搭建和科幻的兴趣展现了其构建复杂系统的潜力，CS能提供高挑战性的技术环境，并保障科技行业的稳定高薪路径。"
    }
  ];

  const careerProspects = [
    {
      title: isEn ? "Quantitative Researcher" : "Quantitative Researcher (量化研究员)",
      desc: isEn 
        ? "Develop trading strategies using advanced math models and coding. Highly challenging with top-tier compensation."
        : "利用高阶数学模型和编程能力开发交易策略，工作极具挑战性且薪资水平顶尖。"
    },
    {
      title: isEn ? "FinTech Solutions Architect" : "FinTech Solutions Architect (金融科技方案架构师)",
      desc: isEn 
        ? "Design innovative technical architectures or algorithms in financial institutions. Applying cutting-edge tech to finance."
        : "在金融机构中设计创新的技术架构或算法方案，将尖端科技应用于金融场景。"
    }
  ];

  // --- 2. Execution Data ---
  const finalSchools = getStudentFinalSchools(isEn);

  // --- Gap Analysis Data (New Structure) ---
  const quantitativeStats = [
    { id: 'gpa', current: 3.85, reach: 3.95, match: 3.65, safety: 3.5, min: 3.0, max: 4.2, label: isEn ? 'GPA (Weighted)' : 'GPA (Weighted)', diffLabel: isEn ? 'Good' : '达标', diffColor: 'bg-green-100 text-green-700' },
    { id: 'toefl', current: 102, reach: 110, match: 90, safety: 80, min: 80, max: 120, label: isEn ? 'TOEFL / Language' : 'TOEFL / Language', diffLabel: isEn ? 'Gap -8' : '差距 -8', diffColor: 'bg-red-100 text-red-700' },
    { id: 'sat', current: 1450, reach: 1520, match: 1440, safety: 1350, min: 1200, max: 1600, label: isEn ? 'SAT / Standardized' : 'SAT / Standardized', diffLabel: isEn ? 'Gap -50' : '差距 -50', diffColor: 'bg-red-100 text-red-700' }
  ];

  const qualitativeStats = [
    { 
      title: isEn ? 'Leadership & Impact' : '领导力与影响力',
      level: 'Weak',
      analysis: isEn 
        ? 'Lacks evidence of organizational management or community influence. Hard to support top-tier leadership requirements.' 
        : '学生背景中完全缺失组织管理、社群影响力或团队领导的具体案例，难以支撑顶尖名校对领导力的要求。',
      icon: <Flag className="w-5 h-5 text-red-500" />
    },
    { 
      title: isEn ? 'Competitions & Awards' : '竞赛与奖项',
      level: 'Medium',
      analysis: isEn 
        ? 'AMC 12 Distinction shows strong math logic, but still need AIME or higher CS competitions to hit top tier.' 
        : 'AMC 12 Distinction 展示了扎实的数学逻辑基础，但若冲击顶缓院校，仍需在 AIME 或高层级的计算机/综合类竞赛中获得重磅奖项。',
      icon: <Trophy className="w-5 h-5 text-yellow-500" />
    },
    { 
      title: isEn ? 'Activity Depth' : '活动深度/广度',
      level: 'Weak',
      analysis: isEn 
        ? 'Current hobbies (Badminton, Lego) remain at personal consumption level. Lacks depth, interdisciplinary nature, or social impact.' 
        : '现有的羽毛球和乐高爱好主要停留在个人消费阶段，缺乏有深度、跨学科属性或社会影响力的长期项目。',
      icon: <Zap className="w-5 h-5 text-red-500" />
    }
  ];

  const courseDiagnosis = {
    courses: ['AP Calculus BC', 'AP Physics C', 'Honors English', 'AP Psychology'],
    riskLevel: 'Warning',
    risks: isEn ? [
        "Missing AP Computer Science A - Critical for CS Major targets.",
        "Missing Macroeconomics - Incomplete economics profile for Finance targets.",
        "Lack of AP Science breadth (Chem/Bio) for top-tier holistic review."
    ] : [
        "缺乏 AP Computer Science A，申请顶尖 CS 项目时会显缺乏专业基础。",
        "针对金融工程目标，仅修读微观经济学而未包含宏观经济学。",
        "缺乏一门 AP 级别的实验室科学（如 Chemistry 或 Biology），全面性略显单薄。"
    ],
    suggestions: [
      isEn ? '[Change Course] Strongly recommend adding AP Computer Science A.' : '[Change Course] 强烈建议增加 AP Computer Science A，以补全 CS 专业的预修课程要求，并在背景中体现编程能力。',
      isEn ? '[Change Course] Add AP Macroeconomics to complement Micro.' : '[Change Course] 补修 AP Macroeconomics，与现有的 Microeconomics 组成完整的经济学评价体系，更有利于 Financial Engineering 的申请。',
      isEn ? '[Change Course] Upgrade Honors English 11 to AP English Language if possible.' : '[Change Course] 若时间允许，建议将 Honors English 11 提升为 AP English Language and Composition，以增强在 UIUC 或 HKU 等高学术要求学校的文科竞争力。'
    ]
  };

  const timelineEvents: TimelineEvent[] = [
    { id: 't1', title: isEn ? 'Submit ED Application (CMU)' : '提交早申 (CMU)', startDate: '2024-10', type: 'Point', category: 'Application', status: 'In Progress', priority: 'High', assignee: 'Student', isMilestone: true },
    { id: 't2', title: isEn ? 'AMC 12 Competition' : 'AMC 12 数学竞赛', startDate: '2024-11', type: 'Point', category: 'Exam', status: 'Pending', priority: 'Medium', assignee: 'Student', isMilestone: true },
    { id: 't3', title: isEn ? 'Alumni Interview Prep' : '校友面试辅导', startDate: '2024-11', endDate: '2024-12', type: 'Range', category: 'Activity', status: 'Pending', priority: 'High', assignee: 'Counselor', isMilestone: false },
    { id: 't4', title: isEn ? 'UC Application Deadline' : '加州大学申请截止', startDate: '2024-11', type: 'Point', category: 'Application', status: 'Pending', priority: 'High', assignee: 'Student', isMilestone: true },
  ];

  if (!isPlanPublished) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10 animate-in fade-in">
        <div className="w-24 h-24 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Lock className="w-10 h-10 text-gray-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{isEn ? 'Plan Not Published' : '规划方案暂未发布'}</h3>
        <p className="text-gray-500 dark:text-zinc-400 max-w-md text-sm leading-relaxed">
          {isEn 
            ? 'Your counselor is currently crafting your personalized roadmap. Once finalized in the Planning Module, it will appear here.' 
            : '顾问老师正在为您制定个性化升学方案。方案在教师端定稿并发布后，您将在此处看到详细的规划蓝图。'}
        </p>
      </div>
    );
  }

  // Helper for Tier Styles
  const getTierStyle = (tier: string) => {
    switch(tier) {
      case 'Reach': return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      case 'Match': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      default: return 'bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
    }
  };

  // TOC Click Handler
  const scrollToSection = (id: string) => {
      const el = document.getElementById(id);
      if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  };

  return (
    <div ref={containerRef} className="p-6 lg:p-8 h-full overflow-y-auto animate-in fade-in slide-in-from-bottom-2 custom-scrollbar bg-[#fcfcfc] dark:bg-zinc-950/50">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
           <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                 <Compass className="w-7 h-7 text-violet-600 dark:text-violet-400" />
                 {isEn ? 'My Strategic Roadmap' : '我的升学战略蓝图'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 ml-1">
                 {isEn ? 'Personalized plan designed by your counselor.' : '由顾问老师基于您的个人画像量身定制的升学方案。'}
              </p>
           </div>
           <div className="hidden sm:block">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-full text-xs font-bold border border-green-100 dark:border-green-500/20">
                 <CheckCircle className="w-3.5 h-3.5" /> {isEn ? 'Plan Active' : '方案执行中'}
              </span>
           </div>
        </div>

        {/* --- MAIN LAYOUT: GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative items-start">
            
            {/* LEFT: Main Content (Cols 9) */}
            <div className="lg:col-span-9 space-y-10 min-w-0">
                
                {/* --- SECTION 1: STRATEGY & AI INSIGHT --- */}
                <div id="section-strategy" className="space-y-6 scroll-mt-6">
                    
                    {/* Core Insight Box */}
                    <div className="bg-[#a37f6e] bg-opacity-5 dark:bg-opacity-10 border-l-4 border-[#a37f6e] rounded-r-xl p-6 shadow-sm">
                        <h3 className="font-bold text-[#7d5646] dark:text-[#cfa593] flex items-center gap-2 mb-3 text-base">
                            <Brain className="w-5 h-5" /> {aiAnalysis.title}
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed font-medium">
                            {aiAnalysis.content}
                        </p>
                    </div>

                    {/* Majors & Careers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                        {/* Recommended Majors */}
                        <div className="flex flex-col h-full">
                            <h3 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2 mb-4 text-base">
                                <Briefcase className="w-5 h-5 text-gray-500" /> {isEn ? 'Recommended Direction' : '推荐专业方向'}
                            </h3>
                            <div className="space-y-4 flex-1">
                                {recommendedMajors.map((major, idx) => (
                                    <div key={idx} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{major.name}</h4>
                                            <span className="text-xs font-bold text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-500/10 px-2 py-1 rounded-full whitespace-nowrap">
                                                {isEn ? 'Match' : '契合度'} {major.match}%
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                                            {major.reason}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Career Prospects */}
                        <div className="flex flex-col h-full">
                            <h3 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2 mb-4 text-base">
                                <TrendingUp className="w-5 h-5 text-gray-500" /> {isEn ? 'Career Vision' : '适配职业愿景'}
                            </h3>
                            <div className="flex-1 flex flex-col gap-4">
                                {careerProspects.map((career, idx) => (
                                    <div key={idx} className="flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{career.title}</h4>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                                            {career.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Application Targets */}
                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
                        <h3 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2 mb-4 text-base">
                            <Globe className="w-5 h-5 text-violet-600 dark:text-violet-400" /> 
                            {isEn ? 'Application Target Intentions' : '申请目标意向 (Target Intentions)'}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {targetPreferences.map(target => (
                                <div key={target.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-white/5 transition-all hover:border-violet-100 hover:bg-white dark:hover:bg-zinc-800">
                                    <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-gray-100 dark:border-zinc-700/50 flex-shrink-0">
                                        {target.icon}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-zinc-100 mb-2">{target.label}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {target.majors.map((m, i) => (
                                                <span key={i} className="text-xs font-medium text-gray-600 dark:text-zinc-300 bg-white dark:bg-zinc-700 px-2.5 py-1 rounded-md border border-gray-200 dark:border-zinc-600 shadow-sm">
                                                    {m}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gray-200 dark:bg-white/10 w-full"></div>

                {/* --- SECTION 2: EXECUTION --- */}
                
                {/* Block 1: School List (Refactored Collapsible) */}
                <div id="section-schools" className="space-y-6 scroll-mt-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2 text-base">
                            <School className="w-5 h-5 text-rose-500" /> {isEn ? 'Final School List' : '定校清单'}
                        </h3>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-lg">
                            {finalSchools.length} Schools
                        </span>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#e5e0dc] dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="grid grid-cols-1 divide-y divide-gray-100 dark:divide-white/5">
                            {['Reach', 'Match', 'Safety'].map((tier) => {
                                const schools = finalSchools.filter(s => s.tier === tier);
                                if (schools.length === 0) return null;
                                
                                return (
                                    <div key={tier} className="p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded border tracking-wide ${getTierStyle(tier)}`}>
                                            {tier}
                                            </span>
                                            <div className="h-px bg-gray-100 dark:bg-white/5 flex-1"></div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {schools.map((school) => (
                                                <SchoolCard 
                                                    key={school.id} 
                                                    school={school} 
                                                    isEn={isEn} 
                                                    tierStyle={getTierStyle(tier)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Block 2: Gap Analysis (REFACTORED - New Structure) */}
                <div id="section-gaps" className="space-y-6 scroll-mt-6">
                        <h3 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2 text-base">
                            <TrendingUp className="w-5 h-5 text-purple-500" /> {isEn ? 'Gap Analysis Report' : '差距分析报告 (Gap Analysis)'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 -mt-4">
                            {isEn 
                            ? 'Comparison based on finalized school list standards (Reach/Match/Safety targets).' 
                            : '基于 Step 4 选校清单生成的 Reach/Match/Safety 梯度标准与学生现状的对比。'}
                        </p>

                        {/* 1. Quantitative Gaps */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#e5e0dc] dark:border-white/5 p-6 shadow-sm">
                            <h4 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-white/5 pb-2 text-sm">
                            <LayoutGrid className="w-4 h-4 text-purple-500" /> 1. {isEn ? 'Quantitative Gaps' : '硬性指标差距 (Quantitative)'}
                            </h4>
                            <div className="space-y-4">
                            {quantitativeStats.map((stat) => (
                                <MetricRuler 
                                    key={stat.id}
                                    {...stat}
                                    reachAvg={stat.reach}
                                    matchAvg={stat.match}
                                    safetyAvg={stat.safety}
                                    isEn={isEn}
                                />
                            ))}
                            </div>
                        </div>

                        {/* 2. Qualitative AI */}
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2 mb-4 text-sm">
                            <Sparkles className="w-4 h-4 text-violet-500" /> 2. {isEn ? 'Qualitative Assessment (AI)' : '软性背景评估 (Qualitative AI)'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {qualitativeStats.map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-zinc-200 text-sm">
                                        {item.icon} {item.title}
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${item.level === 'Strong' ? 'bg-green-100 text-green-700 border-green-200' : item.level === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                        {item.level}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                                        {item.analysis}
                                    </p>
                                </div>
                            ))}
                            </div>
                        </div>

                        {/* 3. Course Diagnosis (Updated Design) */}
                        <div id="section-courses" className="bg-[#f0f9ff] dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-500/20 p-6 scroll-mt-6">
                            <h4 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2 mb-6 text-base">
                                <BookOpen className="w-5 h-5" /> {isEn ? 'Course Diagnosis' : '选课合理性诊断'}
                            </h4>
                            
                            <div className="mb-6">
                                <p className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-3">{isEn ? 'Current Courses' : '当前在读课程'}</p>
                                <div className="flex flex-wrap gap-3">
                                    {courseDiagnosis.courses.map((c, i) => (
                                        <div key={i} className="bg-white dark:bg-zinc-800 text-blue-700 dark:text-blue-300 px-5 py-2.5 rounded-xl text-sm font-bold border border-blue-200 dark:border-blue-500/30 shadow-sm hover:shadow-md transition-shadow cursor-default">
                                            {c}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-orange-200 dark:border-orange-500/30 relative overflow-hidden shadow-sm">
                                <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-bold border border-orange-200 dark:border-orange-500/30">
                                        <AlertTriangle className="w-3 h-3" /> {isEn ? 'Warning' : '存在隐患 (Warning)'}
                                    </span>
                                </div>
                                <ul className="space-y-2 mb-4">
                                    {courseDiagnosis.risks.map((risk, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-zinc-300">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0"></span>
                                            <span className="leading-relaxed">{risk}</span>
                                        </li>
                                    ))}
                                </ul>
                                
                                <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-lg mt-4">
                                    <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                        <Zap className="w-3 h-3 text-blue-500" /> {isEn ? 'AI Suggestions' : 'AI 调整建议'}
                                    </p>
                                    <ul className="space-y-2">
                                        {courseDiagnosis.suggestions.map((s, i) => (
                                            <li key={i} className="text-xs text-blue-700 dark:text-blue-400 flex items-start gap-2">
                                                <span className="mt-0.5 text-[10px]">💡</span>
                                                <span className="leading-relaxed">{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                </div>

                {/* Block 4: Timeline (Full Width) */}
                <div id="section-timeline" className="space-y-6 scroll-mt-6">
                        <h3 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2 text-base mb-4">
                            <Calendar className="w-5 h-5 text-emerald-500" /> {isEn ? 'Key Milestones' : '关键节点'}
                        </h3>
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#e5e0dc] dark:border-white/5 p-6 relative overflow-hidden">
                            <div className="absolute top-6 bottom-6 left-[27px] w-0.5 bg-gray-100 dark:bg-white/10"></div>
                            <div className="space-y-6 relative z-10">
                            {timelineEvents.map((evt, idx) => (
                                <div key={idx} className="flex items-start gap-4 group">
                                    <div className={`w-3 h-3 mt-1.5 rounded-full border-2 flex-shrink-0 z-10 bg-white dark:bg-zinc-900 transition-colors
                                        ${evt.status === 'In Progress' 
                                        ? 'border-violet-500 bg-violet-500 ring-4 ring-violet-100 dark:ring-violet-900/30' 
                                        : evt.status === 'Done' 
                                            ? 'border-green-500 bg-green-500' 
                                            : 'border-gray-300 dark:border-zinc-600'}
                                    `}></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                        <p className={`text-sm font-bold flex items-center gap-2 ${evt.status === 'In Progress' ? 'text-violet-700 dark:text-violet-400' : 'text-gray-700 dark:text-zinc-300'}`}>
                                            {evt.isOfficial && <Globe className="w-3 h-3 text-blue-500" />}
                                            {evt.title}
                                        </p>
                                        <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-white/5 px-1.5 py-0.5 rounded">
                                            {evt.startDate}
                                        </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] px-1.5 rounded border 
                                            ${evt.category === 'Application' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : 
                                                evt.category === 'Exam' ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' :
                                                'bg-gray-50 text-gray-600 border-gray-100 dark:bg-white/5 dark:text-zinc-400 dark:border-white/10'}
                                        `}>
                                            {evt.category}
                                        </span>
                                        {evt.status === 'In Progress' && (
                                            <span className="text-[10px] text-violet-500 font-medium animate-pulse flex items-center gap-1">
                                                <Clock className="w-3 h-3"/> {isEn ? 'Ongoing' : '进行中'}
                                            </span>
                                        )}
                                        {evt.status === 'Done' && (
                                            <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                                                <Check className="w-3 h-3"/> {isEn ? 'Done' : '已完成'}
                                            </span>
                                        )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            </div>
                        </div>
                </div>
            
            </div>

            {/* RIGHT: Sticky TOC Sidebar (Hidden on mobile) */}
            <div className="hidden lg:block lg:col-span-3 relative">
                <div className="sticky top-6 space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider pl-4">
                        {isEn ? 'On This Page' : '本页目录'}
                    </h4>
                    <nav className="flex flex-col space-y-1">
                        {[
                            { id: 'section-strategy', label: isEn ? 'Strategy' : '战略蓝图' },
                            { id: 'section-schools', label: isEn ? 'School List' : '定校清单' },
                            { id: 'section-gaps', label: isEn ? 'Gap Analysis' : '差距分析' },
                            { id: 'section-courses', label: isEn ? 'Courses' : '选课诊断' },
                            { id: 'section-timeline', label: isEn ? 'Timeline' : '关键节点' },
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className={`text-left text-sm py-1.5 pl-4 border-l-2 transition-all
                                    ${activeSection === item.id 
                                        ? 'border-violet-600 text-violet-700 font-bold dark:text-violet-400 dark:border-violet-400' 
                                        : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-zinc-500 dark:hover:text-zinc-300'}
                                `}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default StudentRoadmap;
