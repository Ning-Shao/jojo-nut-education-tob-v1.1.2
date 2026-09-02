
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, MapPin, Globe, BookOpen, Star, 
  TrendingUp, CheckCircle, ArrowRight, ArrowLeft, 
  Plus, Bookmark, ExternalLink, School, Copy, 
  AlertTriangle, Info, ArrowUpRight, Check,
  Clock, FileText, Briefcase, Users, LayoutGrid, Building,
  ChevronDown,
  RefreshCw,
  XCircle
} from '../Icons';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
// Fix import path: Go up two levels from features/common to components, then to teacher
import { mockStudents } from '../../teacher/StudentList';
import { useLanguage } from '../../../contexts/LanguageContext';
import { calculateExamTotal, calculatedExamRules, emptyCalculatedExamSections, type CalculatedExamKey } from './examScoreRules';

// --- Types ---
interface EmploymentStatItem {
  name: string;
  count: number;
}

interface TargetProgram {
  id: string;
  schoolName: string;
  schoolLogo: string;
  programName: string;
  location: string;
  region: 'US' | 'UK' | 'HK' | 'SG' | 'Australia' | 'Canada';
  ranking: string;
  rankingLabel: string; 
  rankingLabelEn?: string;
  difficulty: 'High' | 'Medium' | 'Low';
  difficultyLabel: string;
  difficultyLabelEn?: string;
  trend: 'Rising' | 'Stable' | 'Falling';
  tags: string[];
  description: string;
  descriptionEn?: string;
  
  // Requirements
  req_gpa: string;
  req_language: string;
  req_standardized: string; 
  req_subjects: string[]; 
  
  // Checklist
  checklist: { item: string; required: boolean; note?: string; itemEn?: string; noteEn?: string }[];
  
  // Trends Data
  trendData: { year: string; rate: number; score: number }[]; 
  trendSummary: string;
  trendSummaryEn?: string;
  
  // Metadata
  source: string;
  updateTime: string;

  // Employment Data
  employment?: {
    avgSalary: string;
    employmentRate: string;
    alumniCount: number; 
    whereTheyWork: EmploymentStatItem[];
    whatTheyDo: EmploymentStatItem[];
    source: string;
  };
}

interface TargetLibraryProps {
  role?: 'teacher' | 'student';
  currentStudentId?: string;
}

type ScoreFilterKey = 'alevel' | 'ap' | 'ib' | 'toefl' | 'oldToefl' | 'ielts' | 'sat' | 'act' | 'atar';

interface ScoreFilterItem {
  enabled: boolean;
  value: number;
}

type LanguageScoreKey = CalculatedExamKey;

interface ALevelSubjectFilter {
  id: string;
  name: string;
  level?: 'A-Level' | 'AS-Level';
  grade: string; // Letter grade or numeric score entered by the user.
}

interface IBSubjectFilter {
  id: string;
  name: string;
  level: 'HL' | 'SL';
  grade: string;
}

const emptyLanguageSectionScores = emptyCalculatedExamSections;

const alevelSubjectOptions = [
  { name: 'Mathematics', aliases: ['math', 'maths'] },
  { name: 'Further Mathematics', aliases: ['further math', 'further maths'] },
  { name: 'Physics', aliases: ['phys'] },
  { name: 'Chemistry', aliases: ['chem'] },
  { name: 'Biology', aliases: ['bio'] },
  { name: 'Economics', aliases: ['econ'] },
  { name: 'Business', aliases: ['business studies'] },
  { name: 'Accounting', aliases: ['accounts'] },
  { name: 'Computer Science', aliases: ['cs', 'computing'] },
  { name: 'Information Technology', aliases: ['it', 'ict'] },
  { name: 'Psychology', aliases: ['psych'] },
  { name: 'Geography', aliases: ['geo'] },
  { name: 'History', aliases: ['hist'] },
  { name: 'Sociology', aliases: [] },
  { name: 'Law', aliases: [] },
  { name: 'English Language', aliases: ['english lang'] },
  { name: 'English Literature', aliases: ['english lit', 'literature'] },
  { name: 'Chinese', aliases: ['mandarin'] },
  { name: 'Art & Design', aliases: ['art', 'art and design', 'design'] }
];

type ScoreFilters = Record<ScoreFilterKey, ScoreFilterItem>;

const defaultScoreFilters: ScoreFilters = {
  alevel: { enabled: false, value: 3 },
  ap: { enabled: false, value: 4 },
  ib: { enabled: false, value: 38 },
  toefl: { enabled: false, value: 100 },
  oldToefl: { enabled: false, value: 100 },
  ielts: { enabled: false, value: 7 },
  sat: { enabled: false, value: 1450 },
  act: { enabled: false, value: 32 },
  atar: { enabled: false, value: 90 }
};

const scoreFilterMeta: Record<ScoreFilterKey, { label: string; min: number; max: number; step: number; suffix?: string }> = {
  alevel: { label: 'A-Level', min: 1, max: 4, step: 1 },
  ap: { label: 'AP', min: 1, max: 5, step: 1, suffix: ' 分' },
  ib: { label: 'IB', min: 24, max: 45, step: 1, suffix: ' 分' },
  toefl: { label: calculatedExamRules.toefl.label, min: 1, max: 6, step: 0.5 },
  oldToefl: { label: calculatedExamRules.oldToefl.label, min: 0, max: 120, step: 1 },
  ielts: { label: calculatedExamRules.ielts.label, min: 0, max: 9, step: 0.5 },
  sat: { label: calculatedExamRules.sat.label, min: 400, max: 1600, step: 10 },
  act: { label: calculatedExamRules.act.label, min: 1, max: 36, step: 1 },
  atar: { label: 'ATAR', min: 0, max: 99.95, step: 0.05 }
};

const FilterToggle = ({ checked, onChange, label, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-4 w-7 flex-shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-zinc-600'}`}
  >
    <span className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
  </button>
);

// --- Helpers ---
const getCompanyLogo = (name: string) => {
  const map: Record<string, string> = {
    'Google': 'google.com',
    'Meta': 'meta.com',
    'Amazon': 'amazon.com',
    'Apple': 'apple.com',
    'Microsoft': 'microsoft.com',
    'Duolingo': 'duolingo.com',
    'NVIDIA': 'nvidia.com',
    'Carnegie Mellon University': 'cmu.edu',
    'Teach First': 'teachfirst.org.uk',
    'British Council': 'britishcouncil.org',
    'UCL': 'ucl.ac.uk',
    'Penguin Books': 'penguin.co.uk',
    'Department for Education': 'gov.uk',
    'Tesla': 'tesla.com',
    'Spotify': 'spotify.com',
    'Netflix': 'netflix.com'
  };
  return map[name] ? `https://logo.clearbit.com/${map[name]}` : null;
};

// --- Mock Data ---
const mockPrograms: TargetProgram[] = [
  {
    id: 'p1',
    schoolName: 'Carnegie Mellon University',
    schoolLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=CMU&backgroundColor=b91c1c',
    programName: 'B.S. in Computer Science',
    location: 'Pittsburgh, PA',
    region: 'US',
    ranking: '#1',
    rankingLabel: 'CS Ranking #1',
    rankingLabelEn: 'CS Ranking #1',
    difficulty: 'High',
    difficultyLabel: 'T0 极高',
    difficultyLabelEn: 'T0 Extremely High',
    trend: 'Rising',
    tags: ['STEM', '高薪就业', '科研强'],
    description: 'CMU CS 是全球最顶尖的计算机项目之一，侧重于算法、系统和人工智能。课程设置极具挑战性，竞争极其惨烈。',
    descriptionEn: 'CMU CS is one of the top computer science programs globally, focusing on algorithms, systems, and AI. The curriculum is challenging and competition is intense.',
    req_gpa: 'Unweighted 3.9+',
    req_language: 'TOEFL 102+ (Sub 25+)',
    req_standardized: 'SAT 1550+ (Math 800)',
    req_subjects: ['AP Calculus BC (5)', 'AP Physics C (5)', 'CSA (5)'],
    checklist: [
      { item: 'Common App Essay', itemEn: 'Common App Essay', required: true },
      { item: 'Why Major Essay', itemEn: 'Why Major Essay', required: true },
      { item: 'Counselor Recommendation', itemEn: 'Counselor Recommendation', required: true },
      { item: 'Teacher Evaluations (2)', itemEn: 'Teacher Evaluations (2)', required: true, note: 'Prefer Math/Science teachers', noteEn: 'Prefer Math/Science teachers' },
      { item: 'Transcripts', itemEn: 'Transcripts', required: true },
    ],
    trendData: [
      { year: '2022', rate: 7.0, score: 1540 },
      { year: '2023', rate: 5.2, score: 1560 },
      { year: '2024', rate: 4.8, score: 1570 },
    ],
    trendSummary: '近三年录取率持续走低，标化门槛实际已提升至 1570+。更加看重竞赛金奖级别的软背景，女生申请有细微优势。',
    trendSummaryEn: 'Admissions rates have dropped consistently over the last 3 years. SAT threshold is effectively 1570+. Gold-level competition awards are heavily weighted.',
    source: 'CMU Official 2024-25',
    updateTime: '2024-09-01',
    employment: {
      avgSalary: '$148,500',
      employmentRate: '98%',
      alumniCount: 12450,
      whereTheyWork: [
        { name: 'Google', count: 1842 },
        { name: 'Meta', count: 935 },
        { name: 'Amazon', count: 820 },
        { name: 'Apple', count: 610 },
        { name: 'Microsoft', count: 585 },
        { name: 'Duolingo', count: 320 },
        { name: 'NVIDIA', count: 290 },
        { name: 'Carnegie Mellon University', count: 250 }
      ],
      whatTheyDo: [
        { name: 'Engineering', count: 8200 },
        { name: 'Research', count: 1850 },
        { name: 'Education', count: 920 },
        { name: 'Entrepreneurship', count: 610 },
        { name: 'Operations', count: 410 },
        { name: 'Arts and Design', count: 350 }
      ],
      source: 'LinkedIn Alumni Insights (All Time)'
    }
  },
  {
    id: 'p2',
    schoolName: 'University College London',
    schoolLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=UCL&backgroundColor=603cba',
    programName: 'BA Education Studies',
    location: 'London, UK',
    region: 'UK',
    ranking: '#1',
    rankingLabel: 'QS Edu #1',
    rankingLabelEn: 'QS Edu #1',
    difficulty: 'Medium',
    difficultyLabel: 'T1 热门',
    difficultyLabelEn: 'T1 Popular',
    trend: 'Stable',
    tags: ['G5', '社科', '伦敦'],
    description: 'IOE 学院连续多年世界排名第一，课程涵盖教育社会学、心理学等。虽然不是最难进的G5专业，但PS要求极高。',
    descriptionEn: 'IOE has been ranked #1 globally for Education. Covers sociology and psychology of education. High emphasis on Personal Statement.',
    req_gpa: 'A-Level: ABB',
    req_language: 'IELTS 7.0 (6.5)',
    req_standardized: 'None',
    req_subjects: ['No specific subjects', 'Essay based preferred'],
    checklist: [
      { item: 'UCAS Personal Statement', itemEn: 'UCAS Personal Statement', required: true },
      { item: 'Reference Letter', itemEn: 'Reference Letter', required: true },
      { item: 'Predicted Grades', itemEn: 'Predicted Grades', required: true },
    ],
    trendData: [
      { year: '2022', rate: 35.0, score: 0 },
      { year: '2023', rate: 32.0, score: 0 },
      { year: '2024', rate: 33.0, score: 0 },
    ],
    trendSummary: '录取标准相对稳定，但申请人数逐年增加。PS 权重极高，需展现对教育体制的深刻理解。',
    trendSummaryEn: 'Admissions criteria remain stable, but application volume is increasing. The PS carries significant weight.',
    source: 'UCAS / UCL Prospectus',
    updateTime: '2024-10-15',
    employment: {
      avgSalary: '£32,000',
      employmentRate: '92%',
      alumniCount: 4500,
      whereTheyWork: [
        { name: 'Teach First', count: 420 },
        { name: 'Department for Education', count: 310 },
        { name: 'British Council', count: 250 },
        { name: 'UCL', count: 200 },
        { name: 'Penguin Books', count: 80 }
      ],
      whatTheyDo: [
        { name: 'Education', count: 2500 },
        { name: 'Community and Social Services', count: 800 },
        { name: 'Research', count: 600 },
        { name: 'Consulting', count: 300 }
      ],
      source: 'LinkedIn Alumni Insights'
    }
  },
  {
    id: 'p3',
    schoolName: 'New York University',
    schoolLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=NYU&backgroundColor=57068c',
    programName: 'Game Design (Tisch)',
    location: 'New York, NY',
    region: 'US',
    ranking: '#10',
    rankingLabel: 'Top Arts',
    rankingLabelEn: 'Top Arts',
    difficulty: 'High',
    difficultyLabel: 'T1 艺术',
    difficultyLabelEn: 'T1 Arts',
    trend: 'Rising',
    tags: ['作品集', '就业强', '跨学科'],
    description: 'Tisch 游戏中心专注于游戏作为一种创意艺术形式，结合了编程、视觉艺术和叙事。需要极强的创意作品集。',
    descriptionEn: 'The NYU Game Center focuses on games as a creative art form, combining coding, visual arts, and narrative. Requires a strong creative portfolio.',
    req_gpa: '3.7+',
    req_language: 'TOEFL 100+',
    req_standardized: 'Optional',
    req_subjects: ['Art/Design', 'CS basics helpful'],
    checklist: [
      { item: 'Creative Portfolio', itemEn: 'Creative Portfolio', required: true, note: 'Critical component', noteEn: 'Critical component' },
      { item: 'Common App', itemEn: 'Common App', required: true },
      { item: 'Artist Statement', itemEn: 'Artist Statement', required: true },
    ],
    trendData: [
      { year: '2022', rate: 12.0, score: 0 },
      { year: '2023', rate: 10.5, score: 0 },
      { year: '2024', rate: 8.0, score: 0 },
    ],
    trendSummary: '由于行业热门，Game Center 申请难度激增。作品集创意成为决定性因素，而非标化。',
    trendSummaryEn: 'Due to popularity, Game Center admission is increasingly difficult. Portfolio creativity is the deciding factor.',
    source: 'NYU Tisch',
    updateTime: '2024-08-20'
  },
  {
    id: 'p4',
    schoolName: 'Imperial College London',
    schoolLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=Imperial&backgroundColor=003366',
    programName: 'MEng Mechanical Engineering',
    location: 'London, UK',
    region: 'UK',
    ranking: '#6',
    rankingLabel: 'QS #2',
    rankingLabelEn: 'QS #2',
    difficulty: 'High',
    difficultyLabel: 'T0 极高',
    difficultyLabelEn: 'T0 Extremely High',
    trend: 'Stable',
    tags: ['G5', 'STEM', '面试强'],
    description: '帝国理工机械工程，强调数学与物理的深度结合。申请过程中包含高难度的笔试与学术面试。',
    descriptionEn: 'Imperial Mech Eng emphasizes deep integration of math and physics. Includes a rigorous entrance exam and academic interview.',
    req_gpa: 'A-Level: A*A*A',
    req_language: 'IELTS 7.0 (6.5)',
    req_standardized: 'ESAT Required',
    req_subjects: ['Maths (A*)', 'Physics (A*)'],
    checklist: [
      { item: 'UCAS Application', itemEn: 'UCAS Application', required: true },
      { item: 'ESAT Score', itemEn: 'ESAT Score', required: true, note: 'Entrance Exam', noteEn: 'Entrance Exam' },
      { item: 'Online Interview', itemEn: 'Online Interview', required: true, note: 'If shortlisted', noteEn: 'If shortlisted' },
    ],
    trendData: [
      { year: '2022', rate: 11.5, score: 0 },
      { year: '2023', rate: 10.8, score: 0 },
      { year: '2024', rate: 9.5, score: 0 },
    ],
    trendSummary: '笔试改革为 ESAT 后，筛选机制更加严格。面试环节对物理直觉的考察比重增加。',
    trendSummaryEn: 'With the switch to ESAT, screening is stricter. Interviews focus heavily on physical intuition.',
    source: 'Imperial Official',
    updateTime: '2024-11-01'
  },
  {
    id: 'p5',
    schoolName: 'University of Hong Kong',
    schoolLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=HKU&backgroundColor=007d57',
    programName: 'Bachelor of Finance (IBGM)',
    location: 'Hong Kong',
    region: 'HK',
    ranking: '#26',
    rankingLabel: 'Asia Top',
    rankingLabelEn: 'Asia Top',
    difficulty: 'High',
    difficultyLabel: 'T0 神科',
    difficultyLabelEn: 'T0 Elite',
    trend: 'Stable',
    tags: ['商科', '高薪', '亚洲金融'],
    description: '港大王牌 IBGM，不仅看重学术成绩，还极度看重面试表现、领导力与国际视野。',
    descriptionEn: 'HKU\'s premier IBGM program values academic excellence, interview performance, leadership, and global vision.',
    req_gpa: 'IB: 42+ / A-Level: 4A*',
    req_language: 'IELTS 7.5',
    req_standardized: 'SAT 1500+ (Optional but recommended)',
    req_subjects: ['Maths', 'Economics preferred'],
    checklist: [
      { item: 'Online Application', itemEn: 'Online Application', required: true },
      { item: 'Personal Statement', itemEn: 'Personal Statement', required: true },
      { item: 'Group Interview', itemEn: 'Group Interview', required: true, note: 'High Weight', noteEn: 'High Weight' },
    ],
    trendData: [
      { year: '2022', rate: 5.0, score: 42 },
      { year: '2023', rate: 4.8, score: 43 },
      { year: '2024', rate: 5.0, score: 43 },
    ],
    trendSummary: '内卷严重，大陆生源竞争白热化。面试形式多变，包括小组讨论和Case Study。',
    trendSummaryEn: 'Extremely competitive for mainland students. Interviews include group discussions and Case Studies.',
    source: 'HKU Admissions',
    updateTime: '2024-10-01'
  }
];

// --- Sub-Components ---

// AssignModal removed as per request to simplify the "Add to Favorites" flow.



// --- Main Component ---
const TargetLibrary: React.FC<TargetLibraryProps> = ({ role = 'teacher', currentStudentId }) => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Bookmarks state with localStorage persistence
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nut_bookmarked_programs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {
      // ignore
    }
    return new Set();
  });
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // Recently Viewed state with localStorage persistence
  const [recentViewedIds, setRecentViewedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nut_recent_viewed_programs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [showRecentOnly, setShowRecentOnly] = useState(false);

  const [mounted, setMounted] = useState(false);
  const { language } = useLanguage();
  const isEn = language === 'en-US';
  
  // Theme Color Logic
  const theme = role === 'student' ? 'violet' : 'primary';
  const mainHex = role === 'student' ? '#7c3aed' : '#966a57'; // violet-600 vs primary-600/custom

  useEffect(() => {
    setMounted(false);
    const timer = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(timer);
  }, [view, selectedId]);

  // Filters (retained across detail navigation and tabs)
  const [filters, setFilters] = useState({ region: '全部', major: '全部', diff: '全部' });
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilters, setScoreFilters] = useState<ScoreFilters>(defaultScoreFilters);
  const [scoreDrafts, setScoreDrafts] = useState<Partial<Record<ScoreFilterKey, string>>>({});
  const [alevelScore, setAlevelScore] = useState('');
  const [alevelSubjects, setAlevelSubjects] = useState<ALevelSubjectFilter[]>([
    { id: 'alevel-subject-1', name: '', grade: 'A' }
  ]);
  const [apSubjects, setApSubjects] = useState([{ id: 'ap-subject-1', name: '', grade: '5' }]);
  const [ibSubjects, setIbSubjects] = useState<IBSubjectFilter[]>([
    { id: 'ib-subject-1', name: '', level: 'HL', grade: '7' }
  ]);
  const [activeAlevelSubjectId, setActiveAlevelSubjectId] = useState<string | null>(null);
  const [highlightedSubjectSuggestion, setHighlightedSubjectSuggestion] = useState(0);
  const [languageSectionScores, setLanguageSectionScores] = useState(emptyLanguageSectionScores);
  const [expandedLanguageSections, setExpandedLanguageSections] = useState<Record<LanguageScoreKey, boolean>>({
    toefl: false, oldToefl: false, ielts: false, sat: false, act: false
  });

  const activeProgram = mockPrograms.find(p => p.id === selectedId);

  const enabledScoreEntries = (Object.entries(scoreFilters) as [ScoreFilterKey, ScoreFilterItem][])
    .filter(([, item]) => item.enabled);

  // Preserve editing text separately from numbers used for matching.
  const getScoreValue = (key: ScoreFilterKey): number | null => {
    const raw = scoreDrafts[key] ?? String(scoreFilters[key].value);
    if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(raw)) return null;
    const value = Number(raw);
    if (!Number.isFinite(value)) return null;
    const meta = scoreFilterMeta[key];
    return value >= meta.min && value <= meta.max ? value : null;
  };

  const getLanguageTotal = (key: LanguageScoreKey) => calculateExamTotal(key, languageSectionScores[key]);

  const completedScoreEntries = enabledScoreEntries
    .filter(([key]) => key === 'alevel'
      ? /^(?:\d+(?:\.\d+)?|(?:A\*|[A-E]){2,4})$/.test(alevelScore.toUpperCase().replace(/\s/g, ''))
      : (['toefl', 'oldToefl', 'ielts', 'sat', 'act'] as ScoreFilterKey[]).includes(key)
        ? getLanguageTotal(key as LanguageScoreKey) !== null
        : getScoreValue(key) !== null)
    .map(([key, item]) => [key, { ...item, value: key === 'alevel' ? item.value : (['toefl', 'oldToefl', 'ielts', 'sat', 'act'] as ScoreFilterKey[]).includes(key) ? getLanguageTotal(key as LanguageScoreKey) as number : getScoreValue(key) as number }] as [ScoreFilterKey, ScoreFilterItem]);

  const updateScoreFilter = (key: ScoreFilterKey, patch: Partial<ScoreFilterItem>) => {
    if (patch.enabled === false && (['toefl', 'oldToefl', 'ielts', 'sat', 'act'] as ScoreFilterKey[]).includes(key)) {
      setExpandedLanguageSections(previous => ({ ...previous, [key]: false }));
    }
    setScoreFilters(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const resetScoreFilters = () => {
    setScoreFilters(defaultScoreFilters);
    setScoreDrafts({});
    setAlevelScore('');
    setAlevelSubjects([{ id: 'alevel-subject-1', name: '', grade: 'A' }]);
    setApSubjects([{ id: 'ap-subject-1', name: '', grade: '5' }]);
    setIbSubjects([{ id: 'ib-subject-1', name: '', level: 'HL', grade: '7' }]);
    setActiveAlevelSubjectId(null);
    setHighlightedSubjectSuggestion(0);
    setLanguageSectionScores(emptyLanguageSectionScores());
    setExpandedLanguageSections({ toefl: false, oldToefl: false, ielts: false, sat: false, act: false });
  };

  const getAlevelSubjectSuggestions = (value: string) => {
    const query = value.trim().toLowerCase();
    if (!query) return [];
    return alevelSubjectOptions
      .filter(option => option.name.toLowerCase().startsWith(query) || option.aliases.some(alias => alias.startsWith(query)))
      .slice(0, 5);
  };

  const commitAlevelSubject = (id: string, name: string) => {
    const trimmedName = name.trim();
    setAlevelSubjects(previous => previous.map(subject => subject.id === id ? { ...subject, name: trimmedName } : subject));
    setActiveAlevelSubjectId(null);
    setHighlightedSubjectSuggestion(0);
  };

  const parseAlevelGrades = (text: string) => {
    const normalized = text.toUpperCase().replace(/[\s,/-]/g, '');
    const repeatedGrade = normalized.match(/^(\d+)(A\*|[A-E])$/);
    if (repeatedGrade) return Array.from({ length: Number(repeatedGrade[1]) }, () => repeatedGrade[2]);
    const grades = normalized.match(/A\*|[A-E]/g);
    return grades && grades.join('') === normalized ? grades : null;
  };

  const meetsAlevelRequirement = (candidateText: string, requirementText: string) => {
    const candidateGrades = parseAlevelGrades(candidateText);
    const requirementToken = requirementText.toUpperCase().match(/(?:\d+(?:A\*|[A-E])|(?:A\*|[A-E]){2,4}|\d+(?:\.\d+)?)/)?.[0];
    if (!requirementToken) return null;
    const requirementGrades = parseAlevelGrades(requirementToken);

    if (candidateGrades && requirementGrades) {
      const gradeValue: Record<string, number> = { 'A*': 6, A: 5, B: 4, C: 3, D: 2, E: 1 };
      const candidate = [...candidateGrades].sort((a, b) => gradeValue[b] - gradeValue[a]);
      const requirement = [...requirementGrades].sort((a, b) => gradeValue[b] - gradeValue[a]);
      if (candidate.length < requirement.length) return false;
      return requirement.every((grade, index) => gradeValue[candidate[index]] >= gradeValue[grade]);
    }

    const candidateNumber = /^\d+(?:\.\d+)?$/.test(candidateText.trim()) ? Number(candidateText) : null;
    const requirementNumber = /^\d+(?:\.\d+)?$/.test(requirementToken) ? Number(requirementToken) : null;
    return candidateNumber !== null && requirementNumber !== null ? candidateNumber >= requirementNumber : null;
  };

  const getScoreMatch = (program: TargetProgram) => {
    if (completedScoreEntries.length === 0) return { status: 'none' as const, gaps: 0, unknown: 0 };

    let gaps = 0;
    let unknown = 0;
    completedScoreEntries.forEach(([key, item]) => {
      const source = key === 'toefl' || key === 'oldToefl' || key === 'ielts'
        ? program.req_language
        : key === 'sat' || key === 'act' || key === 'atar'
          ? program.req_standardized
          : program.req_gpa;
      const label = key === 'toefl' || key === 'oldToefl' ? 'TOEFL' : scoreFilterMeta[key].label;
      const scorePattern = new RegExp(`\\b${label.replace('-', '\\-')}\\b`, 'i');
      const scoreIndex = source.search(scorePattern);
      const mentionsScore = scoreIndex >= 0;

      if (!mentionsScore) {
        const testOptional = (key === 'sat' || key === 'act') && /optional|none/i.test(source);
        if (!testOptional) unknown += 1;
        return;
      }

      const relevantText = source.slice(scoreIndex + label.length);
      if (key === 'alevel') {
        const meetsRequirement = meetsAlevelRequirement(alevelScore, relevantText);
        if (meetsRequirement === false) gaps += 1;
        if (meetsRequirement === null) unknown += 1;
        return;
      }
      const threshold = Number(relevantText.match(/\d+(?:\.\d+)?/)?.[0]);
      if (!Number.isFinite(threshold)) unknown += 1;
      else if (item.value < threshold) gaps += 1;
    });

    return {
      status: gaps > 0 ? 'gap' as const : unknown > 0 ? 'unknown' as const : 'match' as const,
      gaps,
      unknown
    };
  };

  // Helper to translate tags
  const translateTag = (tag: string) => {
      if (!isEn) return tag;
      const map: Record<string, string> = {
          'STEM': 'STEM',
          '高薪就业': 'High Salary',
          '科研强': 'Strong Research',
          'G5': 'G5',
          '社科': 'Social Science',
          '伦敦': 'London',
          '作品集': 'Portfolio',
          '就业强': 'Strong Career',
          '跨学科': 'Interdisciplinary',
          '面试强': 'Strong Interview',
          '商科': 'Business',
          '高薪': 'High Pay',
          '亚洲金融': 'Asia Finance'
      };
      return map[tag] || tag;
  };

  const toggleBookmark = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(bookmarkedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setBookmarkedIds(next);
    try {
      localStorage.setItem('nut_bookmarked_programs', JSON.stringify(Array.from(next)));
    } catch {
      // ignore
    }
  };

  const handleAddToFavorites = () => {
     if (!activeProgram) return;
     
     // Add to bookmarks
     const next = new Set(bookmarkedIds);
     next.add(activeProgram.id);
     setBookmarkedIds(next);
     try {
       localStorage.setItem('nut_bookmarked_programs', JSON.stringify(Array.from(next)));
     } catch {
       // ignore
     }
     
     // Navigate to list and show bookmarks
     setView('list');
     setShowBookmarksOnly(true);
     setShowRecentOnly(false);
  };

  // Record viewing history
  const recordView = (id: string) => {
    setRecentViewedIds(prev => {
      const next = [id, ...prev.filter(item => item !== id)];
      try {
        localStorage.setItem('nut_recent_viewed_programs', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleToggleBookmarks = () => {
    if (showBookmarksOnly) {
      setShowBookmarksOnly(false);
    } else {
      setShowBookmarksOnly(true);
      setShowRecentOnly(false);
    }
  };

  const handleToggleRecent = () => {
    if (showRecentOnly) {
      setShowRecentOnly(false);
    } else {
      setShowRecentOnly(true);
      setShowBookmarksOnly(false);
    }
  };

  // Filter & Ordering Logic
  const filteredPrograms = useMemo(() => {
    let list = mockPrograms;

    if (showBookmarksOnly) {
      list = list.filter(program => bookmarkedIds.has(program.id));
    } else if (showRecentOnly) {
      const recentIndexMap = new Map<string, number>(recentViewedIds.map((id, index) => [id, index]));
      list = [...list]
        .filter(program => recentIndexMap.has(program.id))
        .sort((a, b) => {
          const indexA = recentIndexMap.get(a.id) ?? 999;
          const indexB = recentIndexMap.get(b.id) ?? 999;
          return indexA - indexB;
        });
    }

    const query = searchQuery.toLowerCase().trim();
    const matchingPrograms = list.filter(program => {
      const matchesSearch = !query || 
        program.schoolName.toLowerCase().includes(query) || 
        program.programName.toLowerCase().includes(query) ||
        program.tags.some(t => t.toLowerCase().includes(query));

      const matchesRegion = filters.region === '全部' || program.region === filters.region;
      const matchesDiff = filters.diff === '全部' || program.difficulty === filters.diff;

      let matchesMajor = true;
      if (filters.major !== '全部') {
         const majorLower = filters.major.toLowerCase(); 
         const textToSearch = (program.programName + program.tags.join('') + program.description).toLowerCase();
         if (filters.major === 'STEM') {
           matchesMajor = textToSearch.includes('cs') || textToSearch.includes('math') || textToSearch.includes('sci') || textToSearch.includes('eng') || program.tags.includes('STEM');
         } else if (filters.major === 'Arts') {
           matchesMajor = textToSearch.includes('art') || textToSearch.includes('design') || program.tags.includes('作品集');
         } else if (filters.major === 'Business') {
           matchesMajor = textToSearch.includes('business') || textToSearch.includes('finance') || textToSearch.includes('econ');
         } else if (filters.major === 'Humanities') {
           matchesMajor = textToSearch.includes('edu') || textToSearch.includes('social') || textToSearch.includes('history') || textToSearch.includes('comm') || program.tags.includes('社科');
         }
      }

      const scoreMatch = getScoreMatch(program);
      const matchesScores = enabledScoreEntries.length === 0 || (
        completedScoreEntries.length === enabledScoreEntries.length && scoreMatch.status === 'match'
      );

      return matchesSearch && matchesRegion && matchesDiff && matchesMajor && matchesScores;
    });

    if (showRecentOnly) return matchingPrograms;

    const getRankingNumber = (program: TargetProgram) => {
      const ranking = Number(program.ranking.match(/\d+/)?.[0]);
      return Number.isFinite(ranking) ? ranking : Number.POSITIVE_INFINITY;
    };

    return [...matchingPrograms].sort((a, b) => {
      return getRankingNumber(a) - getRankingNumber(b);
    });
  }, [showBookmarksOnly, showRecentOnly, bookmarkedIds, recentViewedIds, searchQuery, filters, scoreFilters, scoreDrafts, alevelScore, languageSectionScores]);

  const handleCardClick = (id: string) => {
    recordView(id);
    setSelectedId(id);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedId(null);
  };

  return (
    <div className="bg-[#f9f8f6] dark:bg-zinc-950 h-full flex flex-col min-h-0 transition-colors duration-300">
      {view === 'list' ? (
        <div className="flex h-full gap-6 overflow-hidden">
           {/* Sidebar Filter */}
           <div className="[&_input[type=number]]:[appearance:textfield] [&_input[type=number]::-webkit-inner-spin-button]:appearance-none [&_input[type=number]::-webkit-outer-spin-button]:appearance-none [&_input[type=number]::-webkit-inner-spin-button]:m-0 [&_input[type=number]::-webkit-outer-spin-button]:m-0 w-[261px] flex-shrink-0 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 p-6 h-full flex flex-col transition-colors">
              <div className={`flex items-center gap-2 mb-8 text-${theme}-700 dark:text-${theme}-400 border-b border-gray-100 dark:border-white/5 pb-4`}>
                 <Filter className="w-5 h-5" />
                 <span className="font-bold text-lg">{isEn ? 'Filters' : '筛选条件'}</span>
              </div>
              
              <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                 {/* Region */}
                 <div>
                    <label className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-4 block tracking-wider">{isEn ? 'Region' : '国家/地区'}</label>
                    <div className="space-y-3">
                       {['全部', 'US', 'UK', 'HK', 'SG', 'Australia', 'Canada'].map(opt => (
                          <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                             <div className="relative flex items-center justify-center">
                                <input 
                                  type="radio" 
                                  name="region" 
                                  checked={filters.region === opt} 
                                  onChange={() => setFilters({...filters, region: opt})}
                                  className={`appearance-none w-4 h-4 border-2 border-gray-300 dark:border-zinc-600 rounded-full checked:border-${theme}-500 transition-all cursor-pointer`} 
                                />
                                {filters.region === opt && (
                                   <div className={`absolute w-2 h-2 bg-${theme}-500 rounded-full`}></div>
                                )}
                             </div>
                             <span className={`text-sm transition-colors ${filters.region === opt ? `text-${theme}-700 dark:text-${theme}-400 font-bold` : `text-gray-600 dark:text-zinc-400 group-hover:text-${theme}-600 dark:group-hover:text-${theme}-300`}`}>
                                {isEn && opt === '全部' ? 'All' : opt} {(!isEn && opt !== '全部') && (
                                    opt === 'US' ? '美国' : 
                                    opt === 'UK' ? '英国' : 
                                    opt === 'HK' ? '中国香港' : 
                                    opt === 'SG' ? '新加坡' :
                                    opt === 'Australia' ? '澳大利亚' : 
                                    opt === 'Canada' ? '加拿大' : 
                                    ''
                                )}
                             </span>
                          </label>
                       ))}
                    </div>
                 </div>

                 {/* Major */}
                 <div>
                    <label className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-4 block tracking-wider">{isEn ? 'Major Category' : '专业大类'}</label>
                    <div className="space-y-3">
                       {['全部', 'STEM', 'Business', 'Arts', 'Humanities'].map(opt => (
                          <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                             <div className="relative flex items-center justify-center">
                                <input 
                                  type="radio" 
                                  name="major" 
                                  checked={filters.major === opt}
                                  onChange={() => setFilters({...filters, major: opt})}
                                  className={`appearance-none w-4 h-4 border-2 border-gray-300 dark:border-zinc-600 rounded-full checked:border-${theme}-500 transition-all cursor-pointer`} 
                                />
                                {filters.major === opt && (
                                   <div className={`absolute w-2 h-2 bg-${theme}-500 rounded-full`}></div>
                                )}
                             </div>
                             <span className={`text-sm transition-colors ${filters.major === opt ? `text-${theme}-700 dark:text-${theme}-400 font-bold` : `text-gray-600 dark:text-zinc-400 group-hover:text-${theme}-600 dark:group-hover:text-${theme}-300`}`}>
                                {isEn && opt === '全部' ? 'All' : opt} {(!isEn && opt !== '全部') && (opt === 'STEM' ? '理工' : opt === 'Business' ? '商科' : opt === 'Arts' ? '艺术' : '人文')}
                             </span>
                          </label>
                       ))}
                    </div>
                 </div>

                 {/* Score simulator */}
                 <div className="space-y-8">
                    {([
                       { id: 'academic' as const, label: isEn ? 'Academic scores' : '学术成绩', keys: ['alevel', 'ap', 'ib', 'atar'] as ScoreFilterKey[] },
                       { id: 'standardized' as const, label: isEn ? 'Standardized tests' : '标化成绩', keys: ['toefl', 'oldToefl', 'ielts', 'sat', 'act'] as ScoreFilterKey[] }
                    ]).map(section => (
                       <div key={section.id} className="last:pb-3">
                          <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-4 block tracking-wider">
                             {section.label}
                          </h4>

                             <div className="space-y-3">
                                {section.keys.map(key => {
                                   const item = scoreFilters[key];
                                   const meta = scoreFilterMeta[key];
                                   const calculatedKey = (['toefl', 'oldToefl', 'ielts', 'sat', 'act'] as ScoreFilterKey[]).includes(key) ? key as LanguageScoreKey : null;
                                   const languageTotal = calculatedKey ? getLanguageTotal(calculatedKey) : null;
                                   const formattedValue = key === 'alevel'
                                     ? (alevelScore || (isEn ? 'Incomplete' : '待填写'))
                                     : calculatedKey
                                       ? (languageTotal === null ? (isEn ? 'Complete all' : '待补全') : calculatedExamRules[calculatedKey].totalStep < 1 ? languageTotal.toFixed(1) : languageTotal)
                                       : (getScoreValue(key) ?? (isEn ? 'Incomplete' : '待补全'));
                                   return (
                                      <div key={key} className={key === 'ib' ? 'flex flex-col gap-2' : undefined}>
                                         <div className={calculatedKey
                                            ? 'group grid grid-cols-[28px_minmax(0,1fr)_22px_56px] items-center gap-x-2'
                                            : 'group flex items-center justify-between gap-3'}>
                                            <div className={calculatedKey ? 'contents' : 'flex items-center gap-3'}>
                                               <FilterToggle
                                                  checked={item.enabled}
                                                  onChange={enabled => updateScoreFilter(key, { enabled })}
                                                  label={`${isEn ? 'Enable' : '启用'} ${meta.label}`}
                                               />
                                               <span className={`text-sm transition-colors ${item.enabled ? `font-bold text-${theme}-700 dark:text-${theme}-400` : `text-gray-600 group-hover:text-${theme}-600 dark:text-zinc-400 dark:group-hover:text-${theme}-300`}`}>
                                                  {meta.label}
                                               </span>
                                               {calculatedKey && (
                                                  <button
                                                     type="button"
                                                     disabled={!item.enabled}
                                                     aria-expanded={expandedLanguageSections[calculatedKey]}
                                                     aria-controls={`language-sections-${key}`}
                                                     title={isEn ? (expandedLanguageSections[calculatedKey] ? 'Collapse section scores' : 'Add section scores') : (expandedLanguageSections[calculatedKey] ? '收起单项成绩' : '添加单项成绩')}
                                                     aria-label={`${meta.label} ${isEn ? (expandedLanguageSections[calculatedKey] ? 'Collapse section scores' : 'Add section scores') : (expandedLanguageSections[calculatedKey] ? '收起单项成绩' : '添加单项成绩')}`}
                                                     onClick={() => setExpandedLanguageSections(previous => ({ ...previous, [calculatedKey]: !previous[calculatedKey] }))}
                                                     className="inline-flex h-[26px] w-[22px] shrink-0 items-center justify-center rounded text-xs text-gray-500 transition-colors hover:text-primary-700 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary-400 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:text-primary-300"
                                                  >
                                                     <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${expandedLanguageSections[calculatedKey] ? 'rotate-180' : ''}`} />
                                                  </button>
                                               )}
                                            </div>
                                            {key === 'alevel' ? (
                                               <input
                                                  type="text"
                                                  value={alevelScore}
                                                  disabled={!item.enabled}
                                                  inputMode="text"
                                                  placeholder="AAB / 12"
                                                  aria-label={isEn ? 'A-Level grades or score' : 'A-Level等级组合或分数'}
                                                  onChange={event => setAlevelScore(event.target.value.toUpperCase().replace(/[^A-E*0-9.\s]/g, ''))}
                                                  className={`w-14 rounded-md border px-1.5 py-1 text-right text-xs font-bold uppercase outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-200 dark:border-zinc-700 dark:bg-zinc-800 ${item.enabled ? 'border-gray-200 bg-white text-primary-700 dark:text-primary-300' : 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400 opacity-60 dark:text-zinc-600'}`}
                                               />
                                            ) : (['ap', 'ib', 'atar', 'toefl', 'oldToefl', 'ielts', 'sat', 'act'] as ScoreFilterKey[]).includes(key) ? (
                                               <div className={calculatedKey ? 'contents' : 'flex shrink-0 items-center gap-1'}>
                                                  <input
                                                     type="text"
                                                     inputMode={calculatedKey && calculatedExamRules[calculatedKey].totalStep < 1 || key === 'atar' ? 'decimal' : 'numeric'}
                                                     value={calculatedKey ? formattedValue : scoreDrafts[key] ?? String(item.value)}
                                                     readOnly={!!calculatedKey}
                                                     aria-invalid={item.enabled && (calculatedKey ? languageTotal === null : getScoreValue(key) === null)}
                                                     disabled={!item.enabled}
                                                     aria-label={`${meta.label} ${isEn ? 'score' : '成绩'}`}
                                                     onChange={event => {
                                                        if (calculatedKey) return;
                                                        const nextValue = event.target.value;
                                                        if (!/^-?\d*\.?\d*$/.test(nextValue)) return;
                                                        setScoreDrafts(previous => ({ ...previous, [key]: nextValue }));
                                                     }}
                                                     className={`w-14 ${calculatedKey ? 'h-[26px] shrink-0 focus:ring-inset' : ''} rounded-md border px-1.5 py-1 text-right text-xs font-bold outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-200 dark:border-zinc-700 dark:bg-zinc-800 ${item.enabled ? `border-gray-200 ${calculatedKey ? 'bg-gray-50' : 'bg-white'} text-primary-700 dark:text-primary-300` : 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400 opacity-60 dark:text-zinc-600'}`}
                                                  />
                                               </div>
                                            ) : (
                                               <span className={`text-xs font-bold ${item.enabled ? 'text-primary-700 dark:text-primary-300' : 'text-gray-400 dark:text-zinc-600'}`}>
                                                  {formattedValue}{meta.suffix || ''}
                                               </span>
                                            )}
                                         </div>
                                         {key === 'alevel' ? (
                                            item.enabled && (
                                               <div className="mt-2 pr-1 space-y-2">
                                                  {alevelSubjects.map((subject, index) => {
                                                     const suggestions = getAlevelSubjectSuggestions(subject.name);
                                                     const suggestionsOpen = activeAlevelSubjectId === subject.id && suggestions.length > 0;
                                                     return (
                                                        <div key={subject.id} className="grid grid-cols-[minmax(0,1fr)_76px_36px_28px] items-start gap-1.5">
                                                           <div className="relative min-w-0">
                                                              <input
                                                                 type="text"
                                                                 role="combobox"
                                                                 value={subject.name} title={subject.name?.trim() ? subject.name : undefined}
                                                                 aria-expanded={suggestionsOpen}
                                                                 aria-controls={`alevel-suggestions-${subject.id}`}
                                                                 aria-autocomplete="list"
                                                                 aria-label={`${isEn ? 'A-Level subject' : 'A-Level科目'} ${index + 1}`}
                                                                 placeholder={isEn ? 'Subject' : '科目名称'}
                                                                 onFocus={() => {
                                                                    setActiveAlevelSubjectId(subject.id);
                                                                    setHighlightedSubjectSuggestion(0);
                                                                 }}
                                                                 onBlur={() => setActiveAlevelSubjectId(current => current === subject.id ? null : current)}
                                                                 onChange={event => {
                                                                    setAlevelSubjects(previous => previous.map(row => row.id === subject.id ? { ...row, name: event.target.value } : row));
                                                                    setActiveAlevelSubjectId(subject.id);
                                                                    setHighlightedSubjectSuggestion(0);
                                                                 }}
                                                                 onKeyDown={event => {
                                                                    if (event.key === 'ArrowDown' && suggestions.length > 0) {
                                                                       event.preventDefault();
                                                                       setHighlightedSubjectSuggestion(current => (current + 1) % suggestions.length);
                                                                    } else if (event.key === 'ArrowUp' && suggestions.length > 0) {
                                                                       event.preventDefault();
                                                                       setHighlightedSubjectSuggestion(current => (current - 1 + suggestions.length) % suggestions.length);
                                                                    } else if (event.key === 'Enter') {
                                                                       event.preventDefault();
                                                                       commitAlevelSubject(subject.id, suggestions[highlightedSubjectSuggestion]?.name || subject.name);
                                                                    } else if (event.key === 'Escape') {
                                                                       setActiveAlevelSubjectId(null);
                                                                    }
                                                                 }}
                                                                 className="w-full min-w-0 text-xs px-2 py-1.5 border rounded bg-white shadow-sm font-medium focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                                              />
                                                              {suggestionsOpen && (
                                                                 <div id={`alevel-suggestions-${subject.id}`} role="listbox" className="relative z-30 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                                                                    {suggestions.map((option, suggestionIndex) => (
                                                                       <button
                                                                          key={option.name}
                                                                          type="button"
                                                                          role="option"
                                                                          aria-selected={highlightedSubjectSuggestion === suggestionIndex}
                                                                          onMouseDown={event => {
                                                                             event.preventDefault();
                                                                             commitAlevelSubject(subject.id, option.name);
                                                                          }}
                                                                          className={`block w-full px-2.5 py-1.5 text-left text-[11px] ${highlightedSubjectSuggestion === suggestionIndex ? 'bg-primary-50 font-bold text-primary-800 dark:bg-primary-500/10 dark:text-primary-300' : 'text-gray-600 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-700'}`}
                                                                       >
                                                                          {option.name}
                                                                       </button>
                                                                    ))}
                                                                 </div>
                                                              )}
                                                              {activeAlevelSubjectId === subject.id && subject.name.trim() && suggestions.length === 0 && (
                                                                 <div className="relative z-30 mt-1 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[10px] text-gray-500 shadow-lg dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                                                                    {isEn ? `Press Enter to use “${subject.name.trim()}”` : `按回车使用“${subject.name.trim()}”`}
                                                                 </div>
                                                              )}
                                                           </div>
                                                           <select
                                                              value={subject.level || 'A-Level'}
                                                              aria-label={`${isEn ? 'Subject qualification' : '科目考试体系'} ${index + 1}`}
                                                              onChange={event => {
                                                                 const level = event.target.value as 'A-Level' | 'AS-Level';
                                                                 setAlevelSubjects(previous => previous.map(row => row.id === subject.id ? {
                                                                    ...row, level,
                                                                    grade: (level === 'AS-Level' ? (row.grade === 'A*' ? 'a' : row.grade.toLowerCase()) : row.grade.toUpperCase()) as ALevelSubjectFilter['grade']
                                                                 } : row));
                                                              }}
                                                              className="w-full min-w-0 shrink-0 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white text-gray-700 font-bold shadow-sm focus:ring-1 focus:ring-primary-500 focus:outline-none appearance-none cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                                           >
                                                              <option value="A-Level">A-Level</option>
                                                              <option value="AS-Level">AS-Level</option>
                                                           </select>
                                                           <input
                                                              type="text"
                                                              inputMode="text"
                                                              value={subject.grade}
                                                              title={subject.grade || undefined}
                                                              aria-label={`${isEn ? 'A-Level subject grade or score' : 'A-Level科目等级或分数'} ${index + 1}`}
                                                              onChange={event => setAlevelSubjects(previous => previous.map(row => row.id === subject.id ? { ...row, grade: event.target.value } : row))}
                                                              className="w-full min-w-0 text-right flex-shrink-0 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white text-gray-700 font-bold shadow-sm focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                                           />
                                                              <button type="button" aria-label={isEn ? 'Remove subject' : '删除科目'} onClick={() => setAlevelSubjects(previous => previous.filter(row => row.id !== subject.id))} className="text-gray-400 flex flex-shrink-0 justify-center items-center w-7 h-7 rounded border border-gray-200 bg-white hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors dark:border-zinc-700 dark:bg-zinc-800">
                                                                 <XCircle className="h-3.5 w-3.5" />
                                                              </button>
                                                        </div>
                                                     );
                                                  })}
                                                  <button type="button" onClick={() => setAlevelSubjects(previous => [...previous, { id: `alevel-subject-${Date.now()}`, name: '', level: 'A-Level', grade: 'A' }])} className="flex items-center gap-1.5 text-xs text-primary-600 font-medium hover:text-primary-700 py-1 transition-colors">
                                                     <Plus className="h-3 w-3" /> {isEn ? 'Add subject' : '添加科目'}
                                                  </button>
                                               </div>
                                            )
                                         ) : key === 'ap' ? (
                                            item.enabled && (
                                               <div className="mt-2 pr-1 space-y-2">
                                                  {apSubjects.map((subject, index) => (
                                                     <div key={subject.id} className="grid grid-cols-[minmax(0,1fr)_36px_28px] items-center gap-1.5">
                                                        <input
                                                           type="text"
                                                           value={subject.name} title={subject.name?.trim() ? subject.name : undefined}
                                                           placeholder={isEn ? 'Subject' : '科目名称'}
                                                           aria-label={`${isEn ? 'AP subject' : 'AP科目'} ${index + 1}`}
                                                           onChange={event => setApSubjects(previous => previous.map(row => row.id === subject.id ? {...row, name: event.target.value} : row))}
                                                           className="flex-1 min-w-0 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white shadow-sm font-medium focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                                        />
                                                        <select
                                                           value={subject.grade}
                                                           aria-label={`${isEn ? 'AP subject grade' : 'AP科目等级'} ${index + 1}`}
                                                           onChange={event => setApSubjects(previous => previous.map(row => row.id === subject.id ? {...row, grade: event.target.value} : row))}
                                                           className="w-full min-w-0 text-right [text-align-last:right] flex-shrink-0 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white text-gray-700 font-bold shadow-sm focus:ring-1 focus:ring-primary-500 focus:outline-none appearance-none cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                                        >
                                                           {['5', '4', '3', '2', '1'].map(grade => <option key={grade} value={grade}>{grade}</option>)}
                                                        </select>
                                                        <button
                                                           type="button"
                                                           aria-label={`${isEn ? 'Remove AP subject' : '删除AP科目'} ${index + 1}`}
                                                           onClick={() => setApSubjects(previous => previous.filter(row => row.id !== subject.id))}
                                                           className="text-gray-400 flex flex-shrink-0 justify-center items-center w-7 h-7 rounded border border-gray-200 bg-white hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors dark:border-zinc-700 dark:bg-zinc-800"
                                                        >
                                                           <XCircle className="w-3.5 h-3.5" />
                                                        </button>
                                                     </div>
                                                  ))}
                                                  <button
                                                     type="button"
                                                     onClick={() => setApSubjects(previous => [...previous, {id: `ap-subject-${Date.now()}`, name: '', grade: '5'}])}
                                                     className="flex items-center gap-1.5 text-xs text-primary-600 font-medium hover:text-primary-700 py-1 transition-colors"
                                                  >
                                                     <Plus className="w-3.5 h-3.5" /> {isEn ? 'Add Subject' : '添加科目'}
                                                  </button>
                                               </div>
                                            )
                                         ) : key === 'ib' ? (
                                            item.enabled && (
                                               <div className="pr-1 space-y-2">
                                                  {ibSubjects.map((subject, index) => (
                                                     <div key={subject.id} className="grid grid-cols-[minmax(0,1fr)_40px_36px_28px] items-center gap-1.5">
                                                        <input
                                                           type="text"
                                                           value={subject.name}
                                                           title={subject.name.trim() || undefined}
                                                           placeholder={isEn ? 'Subject' : '科目名称'}
                                                           aria-label={`${isEn ? 'IB subject' : 'IB科目'} ${index + 1}`}
                                                           onChange={event => setIbSubjects(previous => previous.map(row => row.id === subject.id ? { ...row, name: event.target.value } : row))}
                                                           className="flex-1 min-w-0 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white shadow-sm font-medium focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                                        />
                                                        <select
                                                           value={subject.level}
                                                           aria-label={`${isEn ? 'IB subject level' : 'IB科目等级'} ${index + 1}`}
                                                           onChange={event => setIbSubjects(previous => previous.map(row => row.id === subject.id ? { ...row, level: event.target.value as IBSubjectFilter['level'] } : row))}
                                                           className="w-full min-w-0 flex-shrink-0 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white text-gray-700 font-bold shadow-sm focus:ring-1 focus:ring-primary-500 focus:outline-none appearance-none cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                                        >
                                                           <option value="HL">HL</option>
                                                           <option value="SL">SL</option>
                                                        </select>
                                                        <select
                                                           value={subject.grade}
                                                           aria-label={`${isEn ? 'IB subject grade' : 'IB科目分数'} ${index + 1}`}
                                                           onChange={event => setIbSubjects(previous => previous.map(row => row.id === subject.id ? { ...row, grade: event.target.value } : row))}
                                                           className="w-full min-w-0 text-right [text-align-last:right] flex-shrink-0 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white text-gray-700 font-bold shadow-sm focus:ring-1 focus:ring-primary-500 focus:outline-none appearance-none cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                                        >
                                                           {['7', '6', '5', '4', '3', '2', '1'].map(grade => <option key={grade} value={grade}>{grade}</option>)}
                                                        </select>
                                                        <button
                                                           type="button"
                                                           aria-label={`${isEn ? 'Remove IB subject' : '删除IB科目'} ${index + 1}`}
                                                           onClick={() => setIbSubjects(previous => previous.filter(row => row.id !== subject.id))}
                                                           className="text-gray-400 flex flex-shrink-0 justify-center items-center w-7 h-7 rounded border border-gray-200 bg-white hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors dark:border-zinc-700 dark:bg-zinc-800"
                                                        >
                                                           <XCircle className="w-3.5 h-3.5" />
                                                        </button>
                                                     </div>
                                                  ))}
                                                  <button
                                                     type="button"
                                                     onClick={() => setIbSubjects(previous => [...previous, { id: `ib-subject-${Date.now()}`, name: '', level: 'HL', grade: '7' }])}
                                                     className="flex items-center gap-1.5 text-xs text-primary-600 font-medium hover:text-primary-700 py-1 transition-colors"
                                                  >
                                                     <Plus className="w-3.5 h-3.5" /> {isEn ? 'Add Subject' : '添加科目'}
                                                  </button>
                                               </div>
                                            )
                                         ) : calculatedKey ? (
                                               <div id={`language-sections-${calculatedKey}`} hidden={!item.enabled || !expandedLanguageSections[calculatedKey]} className="mt-2">
                                                  <div className={`grid gap-1.5 ${calculatedExamRules[calculatedKey].sections.length === 2 ? 'grid-cols-2' : 'grid-cols-4'}`}>
                                                     {calculatedExamRules[calculatedKey].sections.map(sectionRule => (
                                                        <label key={sectionRule.key} className="block">
                                                           <span className="mb-1 block truncate text-center text-[10px] font-bold text-gray-500 dark:text-zinc-400" title={sectionRule.label}>{sectionRule.shortLabel}</span>
                                                           <input
                                                              type="text"
                                                              inputMode={sectionRule.step < 1 ? 'decimal' : 'numeric'}
                                                              value={languageSectionScores[calculatedKey][sectionRule.key] ?? ''}
                                                              placeholder="—"
                                                              aria-label={`${meta.label} ${sectionRule.label}${sectionRule.optional ? ` ${isEn ? 'optional' : '可选'}` : ''}`}
                                                              onChange={event => {
                                                                 const nextValue = event.target.value;
                                                                 if (!/^\d*\.?\d*$/.test(nextValue)) return;
                                                                 setLanguageSectionScores(previous => ({
                                                                    ...previous,
                                                                    [calculatedKey]: { ...previous[calculatedKey], [sectionRule.key]: nextValue }
                                                                 }));
                                                              }}
                                                              className="w-full rounded-md border border-gray-200 bg-white px-1 py-1.5 text-right text-[11px] font-bold text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                                           />
                                                        </label>
                                                     ))}
                                                  </div>
                                               </div>
                                         ) : null}
                                      </div>
                                   );
                                })}
                             </div>
                       </div>
                    ))}

                 </div>

                 {/* Difficulty */}
                 <div>
                    <label className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-4 block tracking-wider">{isEn ? 'Admissions Difficulty' : '录取难度'}</label>
                    <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl w-full">
                       {[
                         { id: '全部', label: isEn ? 'All' : '全部' },
                         { id: 'High', label: isEn ? 'High' : '高' },
                         { id: 'Medium', label: isEn ? 'Med' : '中' },
                         { id: 'Low', label: isEn ? 'Low' : '低' }
                       ].map(opt => (
                          <button 
                             key={opt.id}
                             onClick={() => setFilters({...filters, diff: opt.id})}
                             className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all
                               ${filters.diff === opt.id 
                                 ? `bg-white dark:bg-zinc-700 text-${theme}-700 dark:text-${theme}-300 shadow-sm` 
                                 : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
                               }`}
                          >
                             {opt.label}
                          </button>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Sidebar Footer Links */}
              <div className="mt-auto pt-6 border-t border-gray-100 dark:border-white/5 flex-shrink-0 space-y-1.5">
                 <button 
                    id="target-library-favorites-btn"
                    onClick={handleToggleBookmarks}
                    className={`flex items-center justify-between text-sm font-bold w-full p-2.5 rounded-xl transition-all ${
                        showBookmarksOnly 
                        ? `bg-${theme}-50 dark:bg-white/10 text-${theme}-700 dark:text-${theme}-300 ring-1 ring-${theme}-500/20 shadow-xs` 
                        : `text-gray-600 dark:text-zinc-400 hover:bg-${theme}-50/60 dark:hover:bg-white/5 hover:text-${theme}-700 dark:hover:text-${theme}-300`
                    }`}
                 >
                    <div className="flex items-center gap-2.5">
                       <Bookmark className={`w-4 h-4 ${showBookmarksOnly ? 'fill-current' : ''}`} /> 
                       <span>{isEn ? 'My Favorites' : '我的收藏库'}</span>
                    </div>
                    {bookmarkedIds.size > 0 && (
                       <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${showBookmarksOnly ? `bg-${theme}-200/60 dark:bg-white/20 text-${theme}-800 dark:text-${theme}-200` : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'}`}>
                          {bookmarkedIds.size}
                       </span>
                    )}
                 </button>
                 <button 
                    id="target-library-recent-btn"
                    onClick={handleToggleRecent}
                    className={`flex items-center justify-between text-sm font-bold w-full p-2.5 rounded-xl transition-all ${
                        showRecentOnly 
                        ? `bg-${theme}-50 dark:bg-white/10 text-${theme}-700 dark:text-${theme}-300 ring-1 ring-${theme}-500/20 shadow-xs` 
                        : `text-gray-600 dark:text-zinc-400 hover:bg-${theme}-50/60 dark:hover:bg-white/5 hover:text-${theme}-700 dark:hover:text-${theme}-300`
                    }`}
                 >
                    <div className="flex items-center gap-2.5">
                       <Clock className="w-4 h-4 text-gray-400 dark:text-zinc-500" /> 
                       <span>{isEn ? 'Recently Viewed' : '最近浏览'}</span>
                    </div>
                    {recentViewedIds.length > 0 && (
                       <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${showRecentOnly ? `bg-${theme}-200/60 dark:bg-white/20 text-${theme}-800 dark:text-${theme}-200` : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'}`}>
                          {recentViewedIds.length}
                       </span>
                    )}
                 </button>
              </div>
           </div>

           {/* Main List Area */}
           <div className="flex-1 flex flex-col min-w-0 h-full">
              {/* Search Bar */}
              <div className="bg-white dark:bg-zinc-900 p-2 rounded-[24px] shadow-sm border border-[#e5e0dc] dark:border-white/5 mb-8 flex items-center flex-shrink-0 h-[64px] overflow-hidden transition-colors">
                 <div className="flex-1 relative flex items-center h-full px-4">
                    <input 
                       type="text" 
                       placeholder={isEn ? "Search school, program, major keywords..." : "搜索学校、项目、专业关键词..."} 
                       className="w-full bg-transparent text-gray-700 dark:text-zinc-200 font-medium placeholder:text-gray-300 dark:placeholder:text-zinc-600 outline-none text-base"
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
                 <button className={`h-[48px] px-8 bg-[${mainHex}] text-white font-bold rounded-[18px] hover:bg-${theme}-700 transition-all shadow-sm flex items-center gap-2`}>
                    <Search className="w-5 h-5" /> {isEn ? 'Search' : '搜索'}
                 </button>
              </div>

              {/* Result Meta & Sort */}
              <div className="flex justify-between items-center mb-6 px-1 flex-shrink-0">
                 <div className="flex items-center gap-2.5 flex-wrap">
                    {showRecentOnly && (
                       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-${theme}-50 dark:bg-white/10 text-${theme}-700 dark:text-${theme}-300 border border-${theme}-200/50 dark:border-white/10`}>
                          <Clock className="w-3.5 h-3.5" />
                          {isEn ? 'Recently Viewed' : '当前筛选：最近浏览'}
                          <button 
                             onClick={() => setShowRecentOnly(false)} 
                             className="ml-1 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                             title={isEn ? 'Clear' : '清除'}
                          >
                             ×
                          </button>
                       </span>
                    )}
                    {showBookmarksOnly && (
                       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-${theme}-50 dark:bg-white/10 text-${theme}-700 dark:text-${theme}-300 border border-${theme}-200/50 dark:border-white/10`}>
                          <Bookmark className="w-3.5 h-3.5 fill-current" />
                          {isEn ? 'My Favorites' : '当前筛选：我的收藏'}
                          <button 
                             onClick={() => setShowBookmarksOnly(false)} 
                             className="ml-1 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                             title={isEn ? 'Clear' : '清除'}
                          >
                             ×
                          </button>
                       </span>
                    )}
                    {enabledScoreEntries.map(([key, item]) => {
                       const meta = scoreFilterMeta[key];
                       const languageTotal = key === 'toefl' || key === 'oldToefl' || key === 'ielts' ? getLanguageTotal(key) : null;
                       const formattedValue = key === 'alevel'
                         ? (alevelScore || (isEn ? 'Incomplete' : '待填写'))
                         : key === 'toefl' || key === 'oldToefl' || key === 'ielts'
                           ? (languageTotal === null ? (isEn ? 'Incomplete' : '待补全') : key === 'ielts' ? languageTotal.toFixed(1) : languageTotal)
                           : (getScoreValue(key) ?? (isEn ? 'Incomplete' : '待补全'));
                       return (
                          <span key={key} className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200/60 bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700 dark:border-white/10 dark:bg-white/10 dark:text-primary-300">
                             {meta.label} {formattedValue}{key === 'alevel' ? '' : (meta.suffix || '')}
                             <button
                                type="button"
                                onClick={() => updateScoreFilter(key, { enabled: false })}
                                className="ml-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                                title={isEn ? 'Remove' : '移除'}
                             >×</button>
                          </span>
                       );
                    })}
                    <p className="text-sm font-medium text-gray-500 dark:text-zinc-500">
                       {isEn ? `Found ${filteredPrograms.length} programs` : `找到 ${filteredPrograms.length} 个相关项目`} 
                    </p>
                 </div>
                 <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-500">
                    <span className="font-medium">{isEn ? 'Sort:' : '排序:'}</span>
                    <div className={`flex items-center gap-1 font-bold text-gray-800 dark:text-zinc-200 cursor-pointer hover:text-${theme}-600 dark:hover:text-${theme}-400 transition-colors`}>
                       {showRecentOnly ? (isEn ? 'View Time' : '浏览时间') : (isEn ? 'Ranking' : '综合排名')} <ChevronDown className="w-4 h-4" />
                    </div>
                 </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2 pb-10 min-h-0 custom-scrollbar">
                 {filteredPrograms.length > 0 ? (
                   filteredPrograms.map((program) => {
                      return (
                      <div 
                         key={program.id} 
                         onClick={() => handleCardClick(program.id)}
                         className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-white/5 hover:border-${theme}-200 dark:hover:border-${theme}-500/30 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full`}
                      >
                         <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                               <div className={`w-12 h-12 rounded-xl flex items-center justify-center p-1 border border-gray-100 dark:border-white/5 shadow-sm bg-white dark:bg-zinc-800`}>
                                  <img src={program.schoolLogo} alt="logo" className="w-full h-full object-contain rounded-lg" />
                               </div>
                               <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                     <h3 className={`font-bold text-gray-900 dark:text-zinc-100 text-base line-clamp-1 group-hover:text-${theme}-800 dark:group-hover:text-${theme}-300 transition-colors`}>{program.schoolName}</h3>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                                     <span className="truncate">{program.location}</span>
                                     <span className="bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-gray-600 dark:text-zinc-400 font-bold uppercase tracking-tight border border-transparent dark:border-white/5">
                                        {isEn ? (program.rankingLabelEn || program.rankingLabel) : program.rankingLabel}
                                     </span>
                                  </div>
                               </div>
                            </div>
                            <button 
                               onClick={(e) => toggleBookmark(e, program.id)}
                               className={`p-1 transition-colors ${bookmarkedIds.has(program.id) ? `text-${theme}-600 dark:text-${theme}-400 fill-current` : `text-gray-300 dark:text-zinc-600 hover:text-${theme}-600 dark:hover:text-${theme}-400`}`}
                            >
                               <Bookmark className={`w-4 h-4 ${bookmarkedIds.has(program.id) ? 'fill-current' : ''}`} />
                            </button>
                         </div>

                         <h4 className="font-black text-base text-gray-800 dark:text-zinc-200 mb-2 leading-tight">{program.programName}</h4>
                         <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed line-clamp-2 mb-3 flex-1">
                            {isEn ? (program.descriptionEn || program.description) : program.description}
                         </p>

                         <div className="flex flex-wrap gap-1.5 mb-3">
                            {program.tags.map(tag => (
                               <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-lg border border-gray-100 dark:border-white/5 font-bold">
                                  {translateTag(tag)}
                                </span>
                            ))}
                         </div>

                         <div className="pt-3 border-t border-gray-50 dark:border-white/5 flex justify-between items-center mt-auto">
                            <div className="flex items-center gap-1.5 text-xs">
                               {program.trend === 'Rising' ? (
                                  <>
                                     <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                                     <span className="text-red-600 dark:text-red-400 font-bold">{isEn ? 'Difficulty Rising' : '难度上升'}</span>
                                  </>
                               ) : (
                                  <>
                                     <RefreshCw className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                                     <span className="text-gray-500 dark:text-zinc-500 font-bold">{isEn ? 'Difficulty Stable' : '难度稳定'}</span>
                                  </>
                               )}
                            </div>
                            <span className={`flex items-center gap-1 text-xs font-bold text-${theme}-700 dark:text-${theme}-400`}>
                               {isEn ? 'View Details' : '查看详情'} <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                            </span>
                         </div>
                      </div>
                      );
                   })
                 ) : (
                   <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
                      {showRecentOnly ? (
                        recentViewedIds.length === 0 ? (
                          <div className="max-w-md flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 rounded-2xl flex items-center justify-center mb-4 border border-gray-200/50 dark:border-white/5">
                              <Clock className="w-8 h-8 opacity-60" />
                            </div>
                            <h3 className="text-base font-bold text-gray-800 dark:text-zinc-200 mb-1">
                              {isEn ? 'No Recently Viewed Programs' : '暂无最近浏览记录'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-5 leading-relaxed">
                              {isEn 
                                ? 'Click into any university or program card to explore details, and your browsing history will appear here.' 
                                : '点击知识库中的院校或项目卡片查看详细信息后，系统将自动记录并在此处展示您的浏览历史。'}
                            </p>
                            <button
                              id="browse-all-programs-btn"
                              onClick={() => setShowRecentOnly(false)}
                              className={`px-5 py-2.5 text-xs font-bold bg-[${mainHex}] text-white rounded-xl hover:opacity-90 shadow-sm transition-all flex items-center gap-1.5`}
                            >
                              {isEn ? 'Browse All Programs' : '浏览全部项目'}
                            </button>
                          </div>
                        ) : (
                          <div className="max-w-md flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 rounded-2xl flex items-center justify-center mb-4 border border-gray-200/50 dark:border-white/5">
                              <Search className="w-8 h-8 opacity-60" />
                            </div>
                            <h3 className="text-base font-bold text-gray-800 dark:text-zinc-200 mb-1">
                              {isEn ? 'No Matching Recently Viewed Programs' : '未找到符合条件的最近浏览项目'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-5 leading-relaxed">
                              {isEn 
                                ? 'Try clearing your search query or adjusting your sidebar filters.' 
                                : '请尝试清空搜索关键词或调整左侧筛选条件。'}
                            </p>
                            <button
                              id="clear-recent-filters-btn"
                              onClick={() => {
                                setSearchQuery('');
                                setFilters({ region: '全部', major: '全部', diff: '全部' });
                                resetScoreFilters();
                              }}
                              className="px-5 py-2.5 text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all"
                            >
                              {isEn ? 'Clear Filters' : '重置筛选条件'}
                            </button>
                          </div>
                        )
                      ) : showBookmarksOnly ? (
                        <div className="max-w-md flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 rounded-2xl flex items-center justify-center mb-4 border border-gray-200/50 dark:border-white/5">
                            <Bookmark className="w-8 h-8 opacity-60" />
                          </div>
                          <h3 className="text-base font-bold text-gray-800 dark:text-zinc-200 mb-1">
                            {isEn ? 'No Bookmarked Programs' : '暂无收藏项目'}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-zinc-400 mb-5 leading-relaxed">
                            {isEn ? 'You haven\'t added any programs to your favorites yet.' : '您还没有收藏任何项目，点击卡片右上角的书签图标即可快速收藏。'}
                          </p>
                          <button
                            id="browse-all-from-bookmarks-btn"
                            onClick={() => setShowBookmarksOnly(false)}
                            className={`px-5 py-2.5 text-xs font-bold bg-[${mainHex}] text-white rounded-xl hover:opacity-90 shadow-sm transition-all`}
                          >
                            {isEn ? 'Browse All Programs' : '浏览全部项目'}
                          </button>
                        </div>
                      ) : (
                        <div className="max-w-md flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 rounded-2xl flex items-center justify-center mb-4 border border-gray-200/50 dark:border-white/5">
                            <Search className="w-8 h-8 opacity-60" />
                          </div>
                          <p className="font-bold text-gray-800 dark:text-zinc-200 mb-1">{isEn ? 'No programs found' : '未找到符合条件的项目'}</p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-4">{isEn ? 'Try adjusting your search criteria.' : '请尝试更换搜索词或筛选条件。'}</p>
                          <button
                            id="reset-all-filters-btn"
                            onClick={() => {
                              setSearchQuery('');
                              setFilters({ region: '全部', major: '全部', diff: '全部' });
                              resetScoreFilters();
                            }}
                            className="px-4 py-2 text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all"
                          >
                            {isEn ? 'Reset All Filters' : '重置所有筛选'}
                          </button>
                        </div>
                      )}
                   </div>
                 )}
              </div>
           </div>
        </div>
      ) : (
        // --- DETAIL VIEW ---
        activeProgram && (
           <div className="flex flex-col h-full overflow-hidden min-h-0 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Detail Header */}
              <div className="bg-white dark:bg-zinc-900 border-b border-[#e5e0dc] dark:border-white/5 px-8 py-6 flex-shrink-0 transition-colors">
                 <button onClick={handleBack} className={`flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-${theme}-700 dark:hover:text-${theme}-300 mb-6 transition-colors font-bold`}>
                    <ArrowLeft className="w-4 h-4" /> {isEn ? 'Back to List' : '返回列表'}
                 </button>
                 
                 <div className="flex justify-between items-start">
                    <div className="flex gap-6">
                       <div className="w-24 h-24 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm p-1 bg-white dark:bg-zinc-800 flex items-center justify-center">
                          <img src={activeProgram.schoolLogo} alt="logo" className="w-full h-full object-contain" />
                       </div>
                       <div>
                          <div className="flex items-center gap-4 mb-2">
                             <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{activeProgram.programName}</h1>
                             <span className={`px-3 py-1 rounded-lg text-xs font-black border uppercase
                                ${activeProgram.difficulty === 'High' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20'}
                             `}>
                                {isEn ? (activeProgram.difficultyLabelEn || activeProgram.difficultyLabel) : activeProgram.difficultyLabel}
                             </span>
                          </div>
                          <h2 className="text-lg text-gray-500 dark:text-zinc-400 font-bold flex items-center gap-3 mb-4">
                             <School className="w-5 h-5 text-gray-400 dark:text-zinc-500" /> {activeProgram.schoolName} 
                             <span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-zinc-700"></span> 
                             <MapPin className="w-5 h-5 text-gray-400 dark:text-zinc-500" /> {activeProgram.location}
                          </h2>
                          <div className="flex items-center gap-6 text-sm">
                             <span className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl font-bold text-gray-600 dark:text-zinc-300 border border-gray-100 dark:border-white/5"><Globe className="w-4 h-4 text-gray-400 dark:text-zinc-500" /> Fall Entry</span>
                             <span className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl font-bold text-gray-600 dark:text-zinc-300 border border-gray-100 dark:border-white/5"><BookOpen className="w-4 h-4 text-gray-400 dark:text-zinc-500" /> 4 Years Full-time</span>
                             <a href="#" className={`flex items-center gap-2 text-${theme}-600 dark:text-${theme}-400 font-bold hover:underline ml-2`}><ExternalLink className="w-4 h-4" /> {isEn ? 'Official Page' : '官方申请页'}</a>
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-4">
                       <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5 font-bold shadow-sm transition-all">
                          <Copy className="w-5 h-5" /> {isEn ? 'Cite Standards' : '引用标准'}
                       </button>
                       <button 
                          onClick={handleAddToFavorites}
                          className={`flex items-center gap-2 px-8 py-3 bg-[${mainHex}] text-white rounded-2xl font-black hover:bg-${theme}-700 shadow-lg transform transition hover:-translate-y-1 active:scale-95`}
                       >
                          <Plus className="w-6 h-6" /> {isEn ? 'Add to My Favorites' : '加入我的收藏'}
                       </button>
                    </div>
                 </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-10 min-h-0 bg-gray-50/30 dark:bg-black/20 custom-scrollbar">
                 <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 max-w-7xl mx-auto">
                    
                    {/* Hard Standards */}
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-[#e5e0dc] dark:border-white/5 h-fit">
                       <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-white/5">
                          <h3 className="font-black text-gray-800 dark:text-zinc-100 flex items-center gap-3 text-lg uppercase tracking-wide">
                             <Star className={`w-5 h-5 text-${theme}-600 dark:text-${theme}-400`} /> {isEn ? 'Admission Standards' : '录取硬性标准'}
                          </h3>
                       </div>
                       <div className="space-y-8">
                          <div>
                             <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2">{isEn ? 'GPA / Grades' : 'GPA / 成绩要求'}</p>
                             <p className="text-base font-bold text-gray-900 dark:text-white">{activeProgram.req_gpa}</p>
                          </div>
                          <div>
                             <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2">{isEn ? 'Standardized Tests' : '标化考试 (SAT/ACT)'}</p>
                             <p className="text-base font-bold text-gray-900 dark:text-white">{activeProgram.req_standardized}</p>
                          </div>
                          <div>
                             <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2">{isEn ? 'Language Proficiency' : '语言水平 (Language)'}</p>
                             <p className="text-base font-bold text-gray-900 dark:text-white">{activeProgram.req_language}</p>
                          </div>
                          <div className={`bg-${theme}-50/50 dark:bg-${theme}-900/10 p-5 rounded-2xl border border-${theme}-100 dark:border-${theme}-500/20`}>
                             <p className={`text-xs font-bold text-${theme}-800 dark:text-${theme}-300 uppercase tracking-widest mb-3`}>{isEn ? 'Prerequisites' : '先修课 / 学科要求'}</p>
                             <ul className="space-y-2">
                                {activeProgram.req_subjects.map((sub, i) => (
                                   <li key={i} className={`flex items-center gap-3 text-sm font-bold text-${theme}-900 dark:text-${theme}-200`}>
                                      <div className={`w-1.5 h-1.5 rounded-full bg-${theme}-400`}></div>
                                      {sub}
                                   </li>
                                ))}
                             </ul>
                          </div>
                          <div className="text-xs text-gray-300 dark:text-zinc-600 flex items-center gap-2 pt-4">
                             <Info className="w-3.5 h-3.5" /> {isEn ? 'Last Updated' : '最后更新'}: {activeProgram.updateTime} • {activeProgram.source}
                          </div>
                       </div>
                    </div>

                    {/* Process & Soft */}
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-[#e5e0dc] dark:border-white/5 h-fit">
                       <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-white/5">
                          <h3 className="font-black text-gray-800 dark:text-zinc-100 flex items-center gap-3 text-lg uppercase tracking-wide">
                             <FileText className={`w-5 h-5 text-${theme}-600 dark:text-${theme}-400`} /> {isEn ? 'Application Checklist' : '申请材料清单'}
                          </h3>
                       </div>
                       <div className="space-y-4">
                          {activeProgram.checklist.map((item, idx) => (
                             <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group border border-transparent hover:border-gray-100 dark:hover:border-white/10">
                                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors
                                   ${item.required ? `border-${theme}-200 dark:border-${theme}-800 text-${theme}-600 dark:text-${theme}-400 bg-${theme}-50 dark:bg-${theme}-900/20` : 'border-gray-200 dark:border-zinc-700 text-gray-300 dark:text-zinc-600'}
                                `}>
                                   <Check className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                   <div className="flex justify-between items-start">
                                      <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">{isEn ? (item.itemEn || item.item) : item.item}</p>
                                      {item.required && <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md uppercase">REQUIRED</span>}
                                   </div>
                                   {item.note && <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mt-1">{isEn ? (item.noteEn || item.note) : item.note}</p>}
                                </div>
                             </div>
                          ))}
                       </div>
                       <div className="mt-8 pt-8 border-t border-dashed border-gray-200 dark:border-white/10">
                          <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-4">{isEn ? 'Soft Skills & Insights' : '偏好画像 & 软实力洞察'}</p>
                          <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed bg-gray-50 dark:bg-zinc-800 p-5 rounded-2xl border border-gray-100 dark:border-white/5 italic font-medium">
                             "{isEn ? (activeProgram.descriptionEn || activeProgram.description) : activeProgram.description}"
                          </p>
                       </div>
                    </div>

                    {/* Analytics */}
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-[#e5e0dc] dark:border-white/5 h-fit flex flex-col">
                       <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-white/5">
                          <h3 className="font-black text-gray-800 dark:text-zinc-100 flex items-center gap-3 text-lg uppercase tracking-wide">
                             <TrendingUp className={`w-5 h-5 text-${theme}-600 dark:text-${theme}-400`} /> {isEn ? 'Difficulty Trend' : '难度趋势分析'}
                          </h3>
                       </div>

                       <div className="h-48 w-full mb-6 relative">
                          {mounted && (
                            <ResponsiveContainer width="100%" height="100%" debounce={200}>
                               <LineChart data={activeProgram.trendData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" strokeOpacity={0.2} />
                                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 'bold'}} />
                                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', fontWeight:'bold', backgroundColor: '#18181b', color: '#fff' }} />
                                  <Line type="monotone" dataKey="rate" name={isEn ? "Rate%" : "录取率%"} stroke={mainHex} strokeWidth={4} dot={{r: 6, fill: '#fff', strokeWidth: 3}} activeDot={{r: 8}} />
                               </LineChart>
                            </ResponsiveContainer>
                          )}
                       </div>

                       <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-2xl border border-orange-100 dark:border-orange-500/20 mb-6">
                          <div className="flex items-start gap-3">
                             <ArrowUpRight className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-1" />
                             <div>
                                <p className="text-sm font-black text-orange-800 dark:text-orange-300 mb-2 uppercase">{isEn ? 'Trend Insight' : '趋势解读'}</p>
                                <p className="text-xs text-orange-800/80 dark:text-orange-300/80 leading-relaxed font-bold">
                                   {isEn ? (activeProgram.trendSummaryEn || activeProgram.trendSummary) : activeProgram.trendSummary}
                                </p>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2">{isEn ? 'YoY Changes' : '对比去年变化点'}</p>
                          <div className="flex justify-between items-center p-3.5 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-white/5">
                             <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">{isEn ? 'Standardized Tests' : '标化考试'}</span>
                             <span className="text-xs font-black text-gray-800 dark:text-zinc-200 flex items-center gap-2">Optional <ArrowRight className="w-3 h-3 text-gray-400"/> Required</span>
                          </div>
                          <div className="flex justify-between items-center p-3.5 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-white/5">
                             <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">{isEn ? 'Difficulty' : '录取难度'}</span>
                             <span className="text-xs font-black text-red-600 dark:text-red-400">+15% Competitive</span>
                          </div>
                       </div>
                    </div>

                    {/* Full Width Employment Stats */}
                    {activeProgram.employment && (
                      <div className="xl:col-span-3 bg-white dark:bg-zinc-900 p-10 rounded-[32px] shadow-sm border border-[#e5e0dc] dark:border-white/5">
                         <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100 dark:border-white/5">
                            <h3 className="font-black text-gray-800 dark:text-zinc-100 flex items-center gap-4 text-xl uppercase tracking-widest">
                               <Briefcase className={`w-6 h-6 text-${theme}-600 dark:text-${theme}-400`} /> {isEn ? 'Career & Alumni Outcomes' : '就业与校友发展 (Career Outcomes)'}
                            </h3>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
                            <div className="bg-gray-50/50 dark:bg-zinc-800/50 p-8 rounded-3xl border border-gray-100 dark:border-white/5 text-center hover:bg-white dark:hover:bg-zinc-800 hover:shadow-lg hover:border-primary-100 dark:hover:border-primary-500/20 transition-all group">
                               <p className="text-xs text-gray-400 dark:text-zinc-500 uppercase font-black tracking-widest mb-3">{isEn ? 'Avg Salary' : '平均起薪 (Avg Salary)'}</p>
                               <p className={`text-3xl font-black text-gray-900 dark:text-white group-hover:text-${theme}-800 dark:group-hover:text-${theme}-300 transition-colors`}>{activeProgram.employment.avgSalary}</p>
                            </div>
                            <div className="bg-gray-50/50 dark:bg-zinc-800/50 p-8 rounded-3xl border border-gray-100 dark:border-white/5 text-center hover:bg-white dark:hover:bg-zinc-800 hover:shadow-lg hover:border-primary-100 dark:hover:border-primary-500/20 transition-all group">
                               <p className="text-xs text-gray-400 dark:text-zinc-500 uppercase font-black tracking-widest mb-3">{isEn ? 'Employment Rate' : '就业率 (Employment Rate)'}</p>
                               <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">{activeProgram.employment.employmentRate}</p>
                            </div>
                            <div className="bg-gray-50/50 dark:bg-zinc-800/50 p-8 rounded-3xl border border-gray-100 dark:border-white/5 text-center hover:bg-white dark:hover:bg-zinc-800 hover:shadow-lg hover:border-primary-100 dark:hover:border-primary-500/20 transition-all group">
                               <p className="text-xs text-gray-400 dark:text-zinc-500 uppercase font-black tracking-widest mb-3">{isEn ? 'Alumni Tracked' : '被追踪校友 (Alumni)'}</p>
                               <p className="text-3xl font-black text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">{activeProgram.employment.alumniCount.toLocaleString()}</p>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                            <div>
                               <h4 className="font-black text-gray-800 dark:text-zinc-200 flex items-center gap-3 text-base uppercase mb-8 tracking-wider">
                                  <Building className="w-5 h-5 text-gray-400 dark:text-zinc-500" /> Top Employers
                               </h4>
                               <div className="space-y-6">
                                  {activeProgram.employment.whereTheyWork.map((item, idx) => {
                                     const maxVal = Math.max(...activeProgram.employment!.whereTheyWork.map(i => i.count));
                                     const percent = (item.count / maxVal) * 100;
                                     const logo = getCompanyLogo(item.name);
                                     return (
                                        <div key={idx} className="group">
                                           <div className="flex justify-between items-end mb-2">
                                              <div className="flex items-center gap-3">
                                                 {logo && (
                                                    <div className="w-6 h-6 flex items-center justify-center p-0.5 border border-gray-100 dark:border-white/5 rounded bg-white dark:bg-zinc-800">
                                                       <img src={logo} alt="" className="max-w-full max-h-full" onError={(e) => {e.currentTarget.style.display = 'none'}} />
                                                    </div>
                                                 )}
                                                 <span className="text-xs font-black text-gray-700 dark:text-zinc-300 uppercase">{item.name}</span>
                                              </div>
                                              <span className="text-xs font-black text-gray-900 dark:text-zinc-200">{item.count}</span>
                                           </div>
                                           <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                                              <div className="bg-[#117d7c] h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${percent}%` }}></div>
                                           </div>
                                        </div>
                                     );
                                  })}
                               </div>
                            </div>

                            <div>
                               <h4 className="font-black text-gray-800 dark:text-zinc-200 flex items-center gap-3 text-base uppercase mb-8 tracking-wider">
                                  <LayoutGrid className="w-5 h-5 text-gray-400 dark:text-zinc-500" /> Career Functions
                               </h4>
                               <div className="space-y-6">
                                  {activeProgram.employment.whatTheyDo.map((item, idx) => {
                                     const maxVal = Math.max(...activeProgram.employment!.whatTheyDo.map(i => i.count));
                                     const percent = (item.count / maxVal) * 100;
                                     return (
                                        <div key={idx} className="group">
                                           <div className="flex justify-between items-end mb-2">
                                              <span className="text-xs font-black text-gray-700 dark:text-zinc-300 uppercase tracking-tight">{item.name}</span>
                                              <span className="text-xs font-black text-gray-900 dark:text-zinc-200">{item.count}</span>
                                           </div>
                                           <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                                              <div className="bg-[#445668] h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${percent}%` }}></div>
                                           </div>
                                        </div>
                                     );
                                  })}
                               </div>
                            </div>
                         </div>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        )
      )}
    </div>
  );
};

export default TargetLibrary;
