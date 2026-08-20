import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Trophy, 
  Search, 
  Filter, 
  Clock, 
  Award, 
  ExternalLink, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  Bookmark, 
  ArrowRight, 
  X, 
  FileText, 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  Tag,
  Star
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface CompetitionItem {
  id: string;
  nameZh: string;
  nameEn: string;
  abbr: string;
  subject: 'math' | 'physics' | 'chemistry' | 'biology' | 'cs' | 'business' | 'writing_research';
  subjectLabelZh: string;
  subjectLabelEn: string;
  tier: 'S' | 'A' | 'B';
  tierLabelZh: string;
  tierLabelEn: string;
  suitableGrades: string;
  participationType: '个人' | '团队 (3-4人)' | '个人或团队';
  participationTypeEn: 'Individual' | 'Team (3-4)' | 'Individual or Team';
  registrationDeadline: string;
  competitionDate: string;
  resultsDate: string;
  status: 'registering' | 'upcoming' | 'in_progress' | 'ended';
  statusLabelZh: string;
  statusLabelEn: string;
  month: number; // 1-12
  officialUrl: string;
  taglineZh: string;
  taglineEn: string;
  overviewZh: string;
  overviewEn: string;
  awardsStructureZh: string[];
  awardsStructureEn: string[];
  preparationRoadmapZh: string[];
  preparationRoadmapEn: string[];
  samplePastPapers: string[];
}

export const mockCompetitions: CompetitionItem[] = [
  {
    id: 'amc-10-12',
    nameZh: 'AMC 10/12 美国数学思维挑战赛',
    nameEn: 'American Mathematics Competitions 10/12',
    abbr: 'AMC 10/12',
    subject: 'math',
    subjectLabelZh: '数学',
    subjectLabelEn: 'Mathematics',
    tier: 'S',
    tierLabelZh: 'S级 · 名校极高含金量',
    tierLabelEn: 'Tier S · Elite Gold Standard',
    suitableGrades: '9 - 12 年级',
    participationType: '个人',
    participationTypeEn: 'Individual',
    registrationDeadline: '2026年 10月 25日',
    competitionDate: '2026年 11月 08日 (A卷) / 11月 14日 (B卷)',
    resultsDate: '2026年 12月中旬',
    status: 'upcoming',
    statusLabelZh: '即将开放报名',
    statusLabelEn: 'Upcoming Registration',
    month: 11,
    officialUrl: 'https://maa.org/math-competitions',
    taglineZh: '全美最具知名度的高中数学学术挑战，进入 AIME 及 MIT/Stanford 理工申请的标配。',
    taglineEn: 'The preeminent US math competition. Qualifying for AIME is a vital credential for MIT/Caltech.',
    overviewZh: 'AMC 10适用于10年级及以下，AMC 12适用于12年级及以下。25道单选题，考试时长75分钟。全球排名前 2.5% (AMC 10) 或前 5% (AMC 12) 的选手可晋级 AIME (美国数学邀请赛)。',
    overviewEn: '75 minutes, 25 multiple-choice questions. Top 2.5% (AMC 10) or Top 5% (AMC 12) qualify for AIME.',
    awardsStructureZh: ['AIME 晋级资格线 (约前 2.5% - 5%)', '全球卓越奖 Honor Roll of Distinction (全球前 1%)', '全球优秀奖 Honor Roll (全球前 5%)', '全球荣誉奖 Certificate of Achievement (8/10年级以下高分者)'],
    awardsStructureEn: ['AIME Qualification (Top 2.5% - 5%)', 'Honor Roll of Distinction (Top 1%)', 'Honor Roll (Top 5%)', 'Certificate of Achievement'],
    preparationRoadmapZh: ['第1-2个月：系统梳理代数、数论、组合与几何4大核心板块高阶考点', '第3个月：按知识点专项攻克第15-25题高难度压轴题型', '第4个月：全真模考近10年AMC 10/12 真题，严格训练75分钟答题配速与策略'],
    preparationRoadmapEn: ['Month 1-2: Review Algebra, Number Theory, Combinatorics, Geometry', 'Month 3: Target problems 15-25 with advanced tricks', 'Month 4: Timed full past paper mocks from 2015-2025'],
    samplePastPapers: ['AMC12A_2025_Official_Exam.pdf', 'AMC10B_2025_Official_Exam.pdf', 'AMC12_Advanced_Number_Theory_Handbook.pdf']
  },
  {
    id: 'usaco',
    nameZh: 'USACO 美国计算机奥林匹克',
    nameEn: 'USA Computing Olympiad',
    abbr: 'USACO',
    subject: 'cs',
    subjectLabelZh: '计算机与AI',
    subjectLabelEn: 'CS & AI',
    tier: 'S',
    tierLabelZh: 'S级 · 顶尖计算机利器',
    tierLabelEn: 'Tier S · CS Ivy League Differentiator',
    suitableGrades: '8 - 12 年级',
    participationType: '个人',
    participationTypeEn: 'Individual',
    registrationDeadline: '开赛前随时在线注册',
    competitionDate: '2026年 12月 / 2027年 1月 / 2月 / 3月 (四轮月赛)',
    resultsDate: '每次比赛结束后 3天内公布晋级线',
    status: 'registering',
    statusLabelZh: '报名进行中',
    statusLabelEn: 'Open for Registration',
    month: 12,
    officialUrl: 'https://usaco.org',
    taglineZh: '全球公认含金量最高的青少年算法竞赛之一，黄金/白金组是申请美本顶尖CS的最硬核背书。',
    taglineEn: 'Elite global algorithm contest. Gold/Platinum levels are legendary differentiators for Top CS programs.',
    overviewZh: '线上免费参赛，支持 C++, Java, Python。分为铜组 (Bronze)、银组 (Silver)、黄金组 (Gold) 和白金组 (Platinum)。满分1000分，通常取得750-800分即可晋级下一级别。',
    overviewEn: 'Online free algorithmic contest in C++, Java, Python. Progression through Bronze -> Silver -> Gold -> Platinum.',
    awardsStructureZh: ['USACO Platinum (白金组 - 全球顶级算法高手)', 'USACO Gold (黄金组 - Top CS名校极强竞争力)', 'USACO Silver (银组 - 优秀算法基础证明)'],
    awardsStructureEn: ['USACO Platinum Division (Top ~300 globally)', 'USACO Gold Division (Major CS asset)', 'USACO Silver Division'],
    preparationRoadmapZh: ['Bronze阶段：熟练C++/Python基本语法，强化模拟、贪心与简单暴力搜索', 'Silver阶段：掌握图论DFS/BFS、二分查找、前缀和与双指针', 'Gold阶段：动态规划 (DP)、最短路、树状数组、线段树与高级图论'],
    preparationRoadmapEn: ['Bronze: Simulation, greedy, brute-force search', 'Silver: Graph traversal (DFS/BFS), binary search, prefix sums', 'Gold: Dynamic Programming, Segment Trees, shortest path, flows'],
    samplePastPapers: ['USACO_Guide_Standard_Algorithms.pdf', 'USACO_Gold_DP_Special_Topics.pdf']
  },
  {
    id: 'bpho',
    nameZh: 'BPhO 英国物理奥林匹克',
    nameEn: 'British Physics Olympiad (Round 1)',
    abbr: 'BPhO R1',
    subject: 'physics',
    subjectLabelZh: '物理',
    subjectLabelEn: 'Physics',
    tier: 'S',
    tierLabelZh: 'S级 · 牛剑理工必选',
    tierLabelEn: 'Tier S · Oxbridge Natural Sciences Must',
    suitableGrades: '10 - 12 年级',
    participationType: '个人',
    participationTypeEn: 'Individual',
    registrationDeadline: '2026年 10月 30日',
    competitionDate: '2026年 11月 15日',
    resultsDate: '2027年 1月',
    status: 'upcoming',
    statusLabelZh: '即将开放报名',
    statusLabelEn: 'Upcoming Registration',
    month: 11,
    officialUrl: 'https://bpho.org.uk',
    taglineZh: '牛津大学、帝国理工物理与工程系极度推崇的学术选拔标杆。',
    taglineEn: 'Heavily endorsed by Oxford and Imperial College London for Physics & Engineering admissions.',
    overviewZh: '试题涵盖力学、电磁学、热学、光学与近代物理，题型为大题推导与定量计算，要求极高的微积分数学工具运用与物理直觉建模能力。',
    overviewEn: 'Covers classical mechanics, electromagnetism, optics, thermodynamics, and calculus-based physics modeling.',
    awardsStructureZh: ['Super Gold 超级金奖 (Top 2%)', 'Gold 金奖 (Top 8%)', 'Silver 银奖 (Top 15%)', 'Bronze 铜奖 (Top 25%)'],
    awardsStructureEn: ['Super Gold (Top 2%)', 'Gold (Top 8%)', 'Silver (Top 15%)', 'Bronze (Top 25%)'],
    preparationRoadmapZh: ['熟练掌握大学先修微积分在物理运动学、变力做功与电磁场积分中的应用', '深入研读《大学物理导论》及 BPhO 近15年真题解答与评分标准', '强化非标准物理模型的近似处理与物理量量纲分析能力'],
    preparationRoadmapEn: ['Calculus-based derivations for mechanics and electromagnetism', 'Deep study of past 15 years of BPhO Round 1 solutions', 'Approximation techniques, perturbation, and dimensional analysis'],
    samplePastPapers: ['BPhO_Round1_2024_Paper.pdf', 'BPhO_SuperGold_Solutions_Guide.pdf']
  },
  {
    id: 'nec',
    nameZh: 'NEC 全美经济学挑战赛',
    nameEn: 'National Economics Challenge',
    abbr: 'NEC',
    subject: 'business',
    subjectLabelZh: '商科与经济',
    subjectLabelEn: 'Business & Econ',
    tier: 'S',
    tierLabelZh: 'S级 · 顶尖商科学术利器',
    tierLabelEn: 'Tier S · Top Business/Econ Standard',
    suitableGrades: '9 - 12 年级',
    participationType: '团队 (3-4人)',
    participationTypeEn: 'Team (3-4)',
    registrationDeadline: '2026年 11月 30日',
    competitionDate: '2026年 12月 初级站 / 2027年 3月 中国站 / 5月 全球站 (纽约)',
    resultsDate: '2027年 4月 - 6月',
    status: 'registering',
    statusLabelZh: '报名进行中',
    statusLabelEn: 'Open for Registration',
    month: 12,
    officialUrl: 'https://councilforeconed.org/national-economics-challenge',
    taglineZh: '由美国经济教育学会 (CEE) 举办，沃顿商学院、芝大、哈佛商科申请者必打的旗舰赛事。',
    taglineEn: 'Organized by CEE. The flagship economics competition recognized by Wharton, Chicago, and Harvard.',
    overviewZh: '分为入门组 (Pre)、初级组 (David Ricardo) 和高级组 (Adam Smith)。涵盖微观经济学、宏观经济学、国际经济与时事。包含客观题测评与最具观赏性的“经济学超级碗 (Quiz Bowl)”及案例大剖析 (Critical Thinking)。',
    overviewEn: 'Three divisions: Pre, David Ricardo, Adam Smith. Encompasses micro, macro, international economics, and Quiz Bowl case rounds.',
    awardsStructureZh: ['全国总决赛金银铜奖', '全球站资格晋级 (Top 10%)', 'Critical Thinking 案例大剖析单项特等奖', 'Quiz Bowl 经济超级碗冠军'],
    awardsStructureEn: ['National Finals Gold/Silver/Bronze', 'Global Finals Qualification', 'Critical Thinking Distinction Award', 'Quiz Bowl Championship'],
    preparationRoadmapZh: ['组建4人互补型战队，分别攻坚微观、宏观与国际时事三个核心考查模块', '精读曼昆《经济学原理》与 Krugman《国际经济学》经典教材', '进行全英文团队商业案例限时剖析与 PPT 答辩即兴模拟训练'],
    preparationRoadmapEn: ['Assemble a 4-person team dividing micro/macro/global duties', 'Deep study of Mankiw & Krugman Economics texts', 'Timed 15-minute case analysis presentation & Q&A simulations'],
    samplePastPapers: ['NEC_AdamSmith_CaseStudy_Sample.pdf', 'CEE_Economics_Challenge_Practice.pdf']
  },
  {
    id: 'usabo',
    nameZh: 'USABO 美国生物奥林匹克',
    nameEn: 'USA Biology Olympiad',
    abbr: 'USABO',
    subject: 'biology',
    subjectLabelZh: '生物与医学',
    subjectLabelEn: 'Biology & Pre-Med',
    tier: 'S',
    tierLabelZh: 'S级 · 生化预医王牌',
    tierLabelEn: 'Tier S · Pre-Med Gold Standard',
    suitableGrades: '9 - 12 年级',
    participationType: '个人',
    participationTypeEn: 'Individual',
    registrationDeadline: '2027年 03月 20日',
    competitionDate: '2027年 04月 10日',
    resultsDate: '2027年 05月',
    status: 'upcoming',
    statusLabelZh: '筹备中',
    statusLabelEn: 'Upcoming Prep',
    month: 4,
    officialUrl: 'https://www.usabo-trc.org',
    taglineZh: '由美国卓越教育中心 (CEE) 举办，约翰霍普金斯、杜克生化与预医科申请者核心荣誉。',
    taglineEn: 'Organized by CEE. Premier distinction for Johns Hopkins, Duke BME, and Pre-Med applicants.',
    overviewZh: '50道单选题，50分钟。考察细胞生物学、植物解剖生理、动物解剖生理、动物行为学、遗传与进化、生态学与生物系统学。极重专业词汇量与跨章节综合推断。',
    overviewEn: '50 multiple-choice questions in 50 minutes covering biochemistry, physiology, genetics, and ecology.',
    awardsStructureZh: ['Gold Medal 金奖 (Top 10%)', 'Silver Medal 银奖 (Top 25%)', 'Bronze Medal 铜奖 (Top 35%)', 'Honorable Mention 荣誉奖'],
    awardsStructureEn: ['Gold Medal (Top 10%)', 'Silver Medal (Top 25%)', 'Bronze Medal (Top 35%)', 'Honorable Mention'],
    preparationRoadmapZh: ['通读 Campbell Biology (第11/12版) 英文原版教材并制作专业词根词缀笔记', '针对遗传学推导概率题与动物生理回路进行专项专题刷题', '真题限时模考训练快速读题与图表信息提取能力 (平均1分钟1题)'],
    preparationRoadmapEn: ['Complete Campbell Biology reading and vocabulary index', 'Intensive problem sets on Genetics & Animal Physiology', 'Timed 50-minute test simulation (1 min per question)'],
    samplePastPapers: ['USABO_Semifinal_Official_Exam.pdf', 'Campbell_Biology_HighYield_Notes.pdf']
  },
  {
    id: 'john-locke',
    nameZh: 'John Locke 约翰·洛克全球论文竞赛',
    nameEn: 'John Locke Global Essay Competition',
    abbr: 'John Locke',
    subject: 'writing_research',
    subjectLabelZh: '人文写作与科研',
    subjectLabelEn: 'Humanities & Research',
    tier: 'S',
    tierLabelZh: 'S级 · 全球顶级论文赛事',
    tierLabelEn: 'Tier S · Elite Global Essay Prize',
    suitableGrades: '9 - 12 年级 (青年组适用 14岁及以下)',
    participationType: '个人',
    participationTypeEn: 'Individual',
    registrationDeadline: '2027年 05月 31日',
    competitionDate: '2027年 06月 30日 (论文截止提交)',
    resultsDate: '2027年 07月中旬 入围 Shortlist / 9月 牛津颁奖晚宴',
    status: 'upcoming',
    statusLabelZh: '筹备中',
    statusLabelEn: 'Upcoming Prep',
    month: 6,
    officialUrl: 'https://www.johnlockeinstitute.com',
    taglineZh: '牛津与普林斯顿学者评审，涵盖哲学、政治、经济、历史、心理学与法学等7大学科。',
    taglineEn: 'Evaluated by Oxford & Princeton senior academics. Top essay competition in Humanities & Social Sciences.',
    overviewZh: '字数限制2000字以内。考察学生的独立批判性思维、清晰的逻辑论证、深厚的学术引注以及流畅典雅的英文学术散文文风。入围 Shortlist 即可受邀前往英国牛津参加学术答辩与颁奖典礼。',
    overviewEn: 'Max 2000 words. Judged on intellectual independence, argumentative rigor, and lucid prose. Shortlisted authors invited to Oxford.',
    awardsStructureZh: ['Grand Prize 全球特等奖 (获得一万英镑奖学金)', '学科一、二、三等奖 (1st, 2nd, 3rd Prize in Subject)', 'Shortlist 优秀论文入围入选 (全球前 10%-15%)', 'Commendation 荣誉提名奖'],
    awardsStructureEn: ['Grand Prize (£10,000 scholarship)', '1st, 2nd, 3rd in Category', 'Shortlisted Finalist (Top 10-15%)', 'High Commendation'],
    preparationRoadmapZh: ['1-2月：选定具体学科并深度调研该题背后的经典学术流派与哲学争鸣', '3-4月：拟定清晰的反直觉或严密论点，广泛阅读 JSTOR / Google Scholar 学术文献', '5-6月：多轮论证重构、严谨引注核查 (Chicago/APA) 与英文母语学术润色'],
    preparationRoadmapEn: ['Jan-Feb: Select prompt and survey foundational philosophical debates', 'Mar-Apr: Formulate non-trivial thesis; conduct literature review', 'May-Jun: Multi-round structural revisions, peer reviews, Chicago citation formatting'],
    samplePastPapers: ['JohnLocke_GrandPrize_Winning_Essay.pdf', 'Philosophy_Essay_Structure_Handbook.pdf']
  },
  {
    id: 'euclid',
    nameZh: 'Euclid 滑铁卢大学欧几里得数学竞赛',
    nameEn: 'Euclid Mathematics Contest (CEMC Waterloo)',
    abbr: 'Euclid',
    subject: 'math',
    subjectLabelZh: '数学',
    subjectLabelEn: 'Mathematics',
    tier: 'A',
    tierLabelZh: 'A级 · 加拿大名校敲门砖',
    tierLabelEn: 'Tier A · Waterloo CS Benchmark',
    suitableGrades: '11 - 12 年级',
    participationType: '个人',
    participationTypeEn: 'Individual',
    registrationDeadline: '2027年 03月 05日',
    competitionDate: '2027年 04月 06日',
    resultsDate: '2027年 05月',
    status: 'upcoming',
    statusLabelZh: '筹备中',
    statusLabelEn: 'Upcoming Prep',
    month: 4,
    officialUrl: 'https://cemc.uwaterloo.ca/contests/euclid.html',
    taglineZh: '滑铁卢大学数学院与计算机系官方录取及高额奖学金的核心评估指标。',
    taglineEn: 'Essential assessment for University of Waterloo Mathematics & CS admissions and entrance scholarships.',
    overviewZh: '10道题，总分100分，考试时长2.5小时。题型分为简答题与完整过程解答题（Full Solution）。前8题侧重基础数学，最后2题具有极高创造性与区分度。',
    overviewEn: '10 questions, 100 points, 2.5 hours. Combination of short answer and full mathematical proof writeups.',
    awardsStructureZh: ['Certificate of Distinction 杰出证书 (全球前 25%)', 'School Champion 校冠军奖牌', 'Waterloo Scholarship 奖学金优先资格'],
    awardsStructureEn: ['Certificate of Distinction (Top 25%)', 'School Champion Plaque', 'Waterloo Faculty Entrance Scholarship eligibility'],
    preparationRoadmapZh: ['巩固高中函数、解析几何、数列与三角函数推导证明基础', '针对9-10题重点攻克数论余数定理、多项式根与组合极值证明', '注重英文数学解答过程规范书写（Step-by-step reasoning）'],
    preparationRoadmapEn: ['Review pre-calculus algebra, geometry, sequences, polynomials', 'Intensive drill on problems 9-10 (creative proofs and number theory)', 'Practice rigorous proof-writing with English mathematical notation'],
    samplePastPapers: ['Euclid_2024_Official_Exam.pdf', 'Euclid_Proof_Techniques_Guide.pdf']
  }
];

interface CompetitionCalendarProps {
  role?: 'teacher' | 'student';
}

const CompetitionCalendar: React.FC<CompetitionCalendarProps> = ({ role = 'teacher' }) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';
  const theme = role === 'student' ? 'violet' : 'primary';
  const mainHex = role === 'student' ? '#7c3aed' : '#b45309';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'grid' | 'tier'>('timeline');
  const [activeModalCompetition, setActiveModalCompetition] = useState<CompetitionItem | null>(null);

  // Watchlist
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nut_competition_watchlist');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleWatchlist = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setWatchlistIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('nut_competition_watchlist', JSON.stringify(Array.from(next)));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  const subjects = [
    { id: 'all', labelZh: '全部学科', labelEn: 'All Subjects' },
    { id: 'math', labelZh: '数学', labelEn: 'Mathematics' },
    { id: 'physics', labelZh: '物理', labelEn: 'Physics' },
    { id: 'cs', labelZh: '计算机与AI', labelEn: 'CS & AI' },
    { id: 'business', labelZh: '商科与经济', labelEn: 'Business & Econ' },
    { id: 'biology', labelZh: '生物与医学', labelEn: 'Biology & Pre-Med' },
    { id: 'writing_research', labelZh: '人文写作与科研', labelEn: 'Humanities & Research' }
  ];

  const filteredCompetitions = useMemo(() => {
    return mockCompetitions.filter(c => {
      const matchesSub = selectedSubject === 'all' || c.subject === selectedSubject;
      const matchesTier = selectedTier === 'all' || c.tier === selectedTier;
      const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
      
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        c.nameZh.toLowerCase().includes(q) || 
        c.nameEn.toLowerCase().includes(q) ||
        c.abbr.toLowerCase().includes(q) ||
        c.taglineZh.toLowerCase().includes(q);

      return matchesSub && matchesTier && matchesStatus && matchesSearch;
    });
  }, [searchQuery, selectedSubject, selectedTier, selectedStatus]);

  // Group by months for Timeline view
  const groupedByMonth = useMemo(() => {
    const map = new Map<number, CompetitionItem[]>();
    filteredCompetitions.forEach(c => {
      const list = map.get(c.month) || [];
      list.push(c);
      map.set(c.month, list);
    });
    // Sort keys starting from September (9, 10, 11, 12, 1, 2, 3, 4, 5, 6)
    const academicOrder = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
    const result: { month: number; items: CompetitionItem[] }[] = [];
    academicOrder.forEach(m => {
      if (map.has(m)) {
        result.push({ month: m, items: map.get(m)! });
      }
    });
    return result;
  }, [filteredCompetitions]);

  const monthNamesZh = ['', '1月 · 冬季赛期', '2月 · 初春赛期', '3月 · 春季竞赛季', '4月 · 核心冲刺季', '5月 · 论文与决赛季', '6月 · 国际峰会季', '7月 · 夏季集训', '8月 · 早秋集训', '9月 · 新学年启航', '10月 · 秋季报名季', '11月 · 黄金竞赛月', '12月 · 年终大考月'];
  const monthNamesEn = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="h-full flex flex-col bg-[#f9f8f6] dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 transition-colors p-4 sm:p-6 lg:p-8 overflow-hidden">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold bg-${theme}-100 dark:bg-${theme}-900/30 text-${theme}-800 dark:text-${theme}-300 flex items-center gap-1`}>
              <CalendarIcon className="w-3.5 h-3.5" />
              {isEn ? 'Knowledge Base' : '知识库'} · {isEn ? 'Global Competitions Calendar' : '国际竞赛日历'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {isEn ? 'International Competitions Timeline & Academic Atlas' : '全球中学生权威国际竞赛日历与学术图谱'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            {isEn 
              ? 'Multi-disciplinary competition roadmaps, registration timelines, past papers, and ivy admissions weight.' 
              : '全学科竞赛时间轴、含金量梯队分级、报名节点速查、备赛真题及名校升学加分权重。'}
          </p>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-[#e5e0dc] dark:border-white/5 shadow-xs">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'timeline'
                ? `bg-${theme}-600 text-white shadow-xs`
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {isEn ? 'Timeline' : '时间轴视图'}
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? `bg-${theme}-600 text-white shadow-xs`
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {isEn ? 'Card Grid' : '卡片矩阵'}
          </button>
          <button
            onClick={() => setViewMode('tier')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'tier'
                ? `bg-${theme}-600 text-white shadow-xs`
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {isEn ? 'Prestige Tier' : '含金量梯队'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-[#e5e0dc] dark:border-white/5 shadow-xs flex-shrink-0 space-y-3.5 mb-5 transition-colors">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder={isEn ? "Search competition by name, abbreviation, organizer..." : "搜索竞赛名称、缩写 (如 AMC / USACO / BPhO)、主办方关键词..."}
              className="w-full bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/20 text-gray-800 dark:text-zinc-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select 
              className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-zinc-300 outline-none"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
            >
              <option value="all">{isEn ? 'All Tiers' : '全部含金量'}</option>
              <option value="S">{isEn ? 'Tier S (Ivy Differentiator)' : 'S级 (顶尖藤校硬通货)'}</option>
              <option value="A">{isEn ? 'Tier A (High Recognition)' : 'A级 (高认可度)'}</option>
              <option value="B">{isEn ? 'Tier B (Exploration)' : 'B级 (进阶探索)'}</option>
            </select>

            <select 
              className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-zinc-300 outline-none"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">{isEn ? 'All Statuses' : '全部报名状态'}</option>
              <option value="registering">{isEn ? 'Open for Registration' : '报名进行中'}</option>
              <option value="upcoming">{isEn ? 'Upcoming Registration' : '即将开放'}</option>
            </select>
          </div>
        </div>

        {/* Subject Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedSubject === sub.id
                  ? `bg-${theme}-600 text-white shadow-xs`
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {isEn ? sub.labelEn : sub.labelZh}
            </button>
          ))}
        </div>
      </div>

      {/* Main Render Section */}
      <div className="flex-1 overflow-y-auto pr-1 pb-10 space-y-6 min-h-0 custom-scrollbar">
        
        {filteredCompetitions.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <Trophy className="w-12 h-12 text-gray-300 dark:text-zinc-600 mb-3" />
            <p className="font-bold text-gray-700 dark:text-zinc-300">{isEn ? 'No competitions found' : '未找到匹配的国际竞赛'}</p>
            <p className="text-xs text-gray-400 mt-1">{isEn ? 'Try adjusting your search criteria.' : '请尝试调整学科或重置筛选条件。'}</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedSubject('all'); setSelectedTier('all'); setSelectedStatus('all'); }}
              className={`mt-4 px-4 py-2 text-xs font-bold bg-${theme}-600 text-white rounded-xl shadow-xs`}
            >
              {isEn ? 'Reset All Filters' : '重置筛选条件'}
            </button>
          </div>
        ) : viewMode === 'timeline' ? (
          // --- TIMELINE VIEW ---
          <div className="space-y-8">
            {groupedByMonth.map(group => (
              <div key={group.month} className="space-y-4">
                {/* Month Header Banner */}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl bg-${theme}-100 dark:bg-${theme}-900/40 text-${theme}-800 dark:text-${theme}-300 flex items-center justify-center font-black text-sm shadow-xs`}>
                    {group.month}月
                  </div>
                  <h3 className="font-black text-base text-gray-900 dark:text-white">
                    {isEn ? monthNamesEn[group.month] : monthNamesZh[group.month]}
                  </h3>
                  <span className="text-xs text-gray-400 font-medium">({group.items.length} 项竞赛)</span>
                  <div className="flex-1 h-[1px] bg-gray-200 dark:bg-white/5 ml-2" />
                </div>

                {/* Month Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.items.map(comp => {
                    const isWatched = watchlistIds.has(comp.id);
                    return (
                      <div
                        key={comp.id}
                        onClick={() => setActiveModalCompetition(comp)}
                        className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-white/5 hover:border-${theme}-200 dark:hover:border-${theme}-500/30 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between`}
                      >
                        <div>
                          {/* Top Tag Row */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300">
                                {isEn ? comp.tierLabelEn : comp.tierLabelZh}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                                {isEn ? comp.subjectLabelEn : comp.subjectLabelZh}
                              </span>
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                comp.status === 'registering' 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' 
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                              }`}>
                                {isEn ? comp.statusLabelEn : comp.statusLabelZh}
                              </span>
                            </div>

                            <button
                              onClick={(e) => toggleWatchlist(e, comp.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isWatched 
                                  ? `text-${theme}-600 dark:text-${theme}-400 bg-${theme}-50 dark:bg-${theme}-500/10` 
                                  : 'text-gray-300 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-300'
                              }`}
                              title={isWatched ? '已加入备赛关注' : '关注此竞赛'}
                            >
                              <Bookmark className={`w-4 h-4 ${isWatched ? 'fill-current' : ''}`} />
                            </button>
                          </div>

                          {/* Title & Abbr */}
                          <h4 className={`font-black text-gray-900 dark:text-zinc-100 text-base leading-snug group-hover:text-${theme}-700 dark:group-hover:text-${theme}-400 transition-colors`}>
                            {comp.nameZh}
                          </h4>
                          <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium mb-3">
                            {comp.nameEn} ({comp.abbr})
                          </p>

                          <p className="text-xs text-gray-600 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                            {isEn ? comp.taglineEn : comp.taglineZh}
                          </p>

                          {/* Details strip */}
                          <div className="bg-gray-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-gray-100 dark:border-white/5 space-y-1.5 text-xs mb-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">{isEn ? 'Reg Deadline:' : '报名截止:'}</span>
                              <span className="font-bold text-red-600 dark:text-red-400">{comp.registrationDeadline}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">{isEn ? 'Exam Date:' : '比赛时间:'}</span>
                              <span className="font-bold text-gray-800 dark:text-zinc-200">{comp.competitionDate}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">{isEn ? 'Format / Grades:' : '形式与年级:'}</span>
                              <span className="font-medium text-gray-700 dark:text-zinc-300">{comp.participationType} · {comp.suitableGrades}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card bottom action */}
                        <div className={`pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-${theme}-600 dark:text-${theme}-400`}>
                          <span>{isEn ? 'View Syllabus & Past Papers' : '查看比赛大纲、备赛路线与真题'}</span>
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // --- GRID / TIER VIEW ---
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCompetitions.map(comp => {
              const isWatched = watchlistIds.has(comp.id);
              return (
                <div
                  key={comp.id}
                  onClick={() => setActiveModalCompetition(comp)}
                  className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-white/5 hover:border-${theme}-200 dark:hover:border-${theme}-500/30 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300">
                        {isEn ? comp.tierLabelEn : comp.tierLabelZh}
                      </span>
                      <button
                        onClick={(e) => toggleWatchlist(e, comp.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isWatched 
                            ? `text-${theme}-600 dark:text-${theme}-400 bg-${theme}-50 dark:bg-${theme}-500/10` 
                            : 'text-gray-300 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-300'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${isWatched ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <h4 className={`font-black text-gray-900 dark:text-zinc-100 text-base leading-snug group-hover:text-${theme}-700 dark:group-hover:text-${theme}-400 transition-colors`}>
                      {comp.nameZh}
                    </h4>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium mb-3">
                      {comp.abbr} · {comp.subjectLabelZh}
                    </p>

                    <p className="text-xs text-gray-600 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                      {isEn ? comp.taglineEn : comp.taglineZh}
                    </p>

                    <div className="bg-gray-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-gray-100 dark:border-white/5 space-y-1.5 text-xs mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">{isEn ? 'Exam Date:' : '比赛时间:'}</span>
                        <span className="font-bold text-gray-800 dark:text-zinc-200">{comp.competitionDate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">{isEn ? 'Grades:' : '适合年级:'}</span>
                        <span className="font-medium text-gray-700 dark:text-zinc-300">{comp.suitableGrades}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-${theme}-600 dark:text-${theme}-400`}>
                    <span>{isEn ? 'Details' : '查看完整详情'}</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {activeModalCompetition && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-3xl max-h-[90vh] rounded-3xl border border-gray-100 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-start justify-between gap-4 bg-gray-50/60 dark:bg-zinc-800/40">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300">
                    {isEn ? activeModalCompetition.tierLabelEn : activeModalCompetition.tierLabelZh}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-200">
                    {activeModalCompetition.subjectLabelZh}
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                  {activeModalCompetition.nameZh}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  {activeModalCompetition.nameEn} ({activeModalCompetition.abbr})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => toggleWatchlist(e, activeModalCompetition.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                    watchlistIds.has(activeModalCompetition.id)
                      ? `bg-${theme}-50 dark:bg-${theme}-900/30 text-${theme}-700 dark:text-${theme}-300 border-${theme}-200`
                      : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-white/10'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${watchlistIds.has(activeModalCompetition.id) ? 'fill-current' : ''}`} />
                  {watchlistIds.has(activeModalCompetition.id) ? (isEn ? 'Watched' : '已关注') : (isEn ? 'Watch' : '加入关注')}
                </button>
                <button
                  onClick={() => setActiveModalCompetition(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
              
              {/* Key Timeline Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-white/5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{isEn ? 'Registration Deadline' : '报名截止'}</p>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-1">{activeModalCompetition.registrationDeadline}</p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-white/5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{isEn ? 'Official Exam Date' : '考试时间'}</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">{activeModalCompetition.competitionDate}</p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-white/5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{isEn ? 'Format & Grades' : '形式与年级'}</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">{activeModalCompetition.participationType} · {activeModalCompetition.suitableGrades}</p>
                </div>
              </div>

              {/* Overview */}
              <div>
                <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">{isEn ? 'Competition Overview' : '竞赛简况与考察范围'}</h4>
                <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed bg-gray-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                  {isEn ? activeModalCompetition.overviewEn : activeModalCompetition.overviewZh}
                </p>
              </div>

              {/* Awards Distribution */}
              <div>
                <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  {isEn ? 'Award Distribution & Qualification Lines' : '奖项设置与晋级门槛'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(isEn ? activeModalCompetition.awardsStructureEn : activeModalCompetition.awardsStructureZh).map((award, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-500/20 text-xs font-bold text-amber-950 dark:text-amber-200">
                      <Star className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>{award}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preparation Roadmap */}
              <div>
                <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  {isEn ? 'Recommended Preparation Phases' : '推荐备考周期与提分策略'}
                </h4>
                <div className="space-y-2">
                  {(isEn ? activeModalCompetition.preparationRoadmapEn : activeModalCompetition.preparationRoadmapZh).map((step, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-white/5 text-xs text-gray-700 dark:text-zinc-300">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample past papers download */}
              <div>
                <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  {isEn ? 'Sample Past Exam Papers & Syllabus Handbooks' : '历年真题样卷与大纲资料包'}
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {activeModalCompetition.samplePastPapers.map((paper, i) => (
                    <div key={i} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-800 dark:text-zinc-200 hover:border-emerald-500/40 transition-colors">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      <span>{paper}</span>
                      <span className="text-[10px] text-gray-400">(PDF)</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/60 dark:bg-zinc-800/40 flex items-center justify-between">
              <a
                href={activeModalCompetition.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 text-xs font-bold text-${theme}-600 dark:text-${theme}-400 hover:underline`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {isEn ? 'Official Competition Website' : '访问竞赛官方报名网站'}
              </a>

              <button
                onClick={() => setActiveModalCompetition(null)}
                className="px-5 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:opacity-90 transition-opacity"
              >
                {isEn ? 'Close' : '关闭'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CompetitionCalendar;
