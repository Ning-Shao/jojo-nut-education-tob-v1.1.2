import React, { useState, useMemo } from 'react';
import { 
  School, 
  Search, 
  BookOpen, 
  Award, 
  GraduationCap, 
  MessageSquare, 
  FileText, 
  ChevronRight, 
  Sparkles, 
  Star, 
  CheckCircle2, 
  Bookmark, 
  Lock, 
  ArrowLeft, 
  Download, 
  UserCheck, 
  HelpCircle,
  Clock,
  Layers,
  ThumbsUp,
  Tag
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface AdmissionCase {
  id: string;
  studentIdMasked: string; // e.g. "张同学 (Class of 2025)"
  admittedUniversity: string;
  admittedMajor: string;
  round: 'ED1' | 'ED2' | 'EA' | 'RD' | 'Oxbridge Direct';
  gpa: string;
  standardizedTests: string;
  curriculum: 'IB Diploma' | 'AP' | 'A-Level' | '美高';
  keyActivitiesZh: string[];
  keyActivitiesEn: string[];
  keyHonorsZh: string[];
  keyHonorsEn: string[];
  counselorAnalysisZh: string;
  counselorAnalysisEn: string;
  essayTopicZh: string;
  essayTopicEn: string;
}

export interface InterviewQuestion {
  id: string;
  university: string;
  type: 'Alumni' | 'Faculty' | 'Panel Group' | 'Kira Video';
  questionZh: string;
  questionEn: string;
  category: 'Personal Fit' | 'Academic Rigor' | 'Critical Thinking' | 'Leadership';
  counselorTipsZh: string;
  counselorTipsEn: string;
  difficulty: 'High' | 'Medium';
}

export interface EssaySample {
  id: string;
  titleZh: string;
  titleEn: string;
  type: 'Common App PS' | 'UC PIQ' | 'Why Major / Why School' | 'UCAS PS';
  targetUniversity: string;
  excerptZh: string;
  excerptEn: string;
  fullTextZh: string;
  fullTextEn: string;
  counselorCommentaryZh: string;
  counselorCommentaryEn: string;
  tags: string[];
}

export const mockAdmissionCases: AdmissionCase[] = [
  {
    id: 'case-1',
    studentIdMasked: 'L. Zhang (Class of 2025)',
    admittedUniversity: 'Cornell University (康奈尔大学)',
    admittedMajor: 'Computer Science (Bowers CIS)',
    round: 'ED1',
    gpa: '3.96 / 4.0 (Unweighted)',
    standardizedTests: 'SAT 1550 (Math 800) · 托福 114',
    curriculum: 'AP',
    keyActivitiesZh: [
      '创立校内开源编程社团，带领团队开发校园自习室预约小程序（日活500+）',
      '在清华大学智能计算实验室完成暑期科研实习，发表EI会议二作论文1篇',
      '担任校机器人队队长，负责控制算法编写与传感器融合调试'
    ],
    keyActivitiesEn: [
      'Founded school open-source coding club; built study room booking mini-app (500+ DAU)',
      'Summer research intern at Tsinghua AI Computing Lab; co-authored 1 EI-indexed paper',
      'Captain of School Robotics Team leading autonomous navigation code'
    ],
    keyHonorsZh: ['USACO Platinum 白金组晋级', 'AMC 12 全球卓越奖 (Honor Roll of Distinction - Top 1%)', 'ISEF 地区选拔赛一等奖'],
    keyHonorsEn: ['USACO Platinum Division Qualifier', 'AMC 12 Honor Roll of Distinction (Top 1%)', 'ISEF Regional Fair 1st Prize'],
    counselorAnalysisZh: '【升学指导破局点评】该生在理科高难度竞赛（USACO/AMC）硬实力达标的同时，文书摒弃了生硬的算法炫技，而是通过记录为校内视障同学制作无障碍语音导览插件的真实经历，生动体现了“技术向善”的同理心与社会责任感，极度契合康奈尔对于工程学院学生的人文关怀期望。',
    counselorAnalysisEn: 'The applicant combined stellar hard metrics with a deeply empathetic essay recounting building accessibility tools for visually impaired peers, showcasing tech for social good.',
    essayTopicZh: '《算法之外的声音：从一串报错代码到无障碍语音导览的诞生》',
    essayTopicEn: 'Beyond the Syntax: From Buggy Code to Campus Accessibility Software'
  },
  {
    id: 'case-2',
    studentIdMasked: 'C. Wang (Class of 2025)',
    admittedUniversity: 'Oxford University (牛津大学 · 圣约翰学院)',
    admittedMajor: 'Philosophy, Politics and Economics (PPE)',
    round: 'Oxbridge Direct',
    gpa: 'IB 预估 43/45 (HL 776: 经济7, 哲学7, 历史6)',
    standardizedTests: 'TSA 笔试 74.2分 · 雅思 8.5 (阅读9.0, 写作8.0)',
    curriculum: 'IB Diploma',
    keyActivitiesZh: [
      '校青年哲学思辨学会主席，定期组织古典伦理学与当代分配正义研讨沙龙',
      '独立开展《数字零工经济下骑手劳动权益与算法规制》实地调研，撰写2万字长文',
      '校模联核心学术理事，主导编写人权委员会背景学术指南'
    ],
    keyActivitiesEn: [
      'President of Youth Philosophy Society hosting weekly dialectic salons on distributive justice',
      'Fieldwork & 20,000-word paper on gig-economy delivery riders & algorithmic governance',
      'Academic Director of Model UN overseeing Human Rights Council background guides'
    ],
    keyHonorsZh: ['John Locke 约翰·洛克全球论文竞赛 哲学组入围 (Shortlist Finalist)', '全美演讲与辩论联赛 (NSDA) 公共论坛组全国八强'],
    keyHonorsEn: ['John Locke Essay Competition Shortlist Finalist in Philosophy', 'NSDA Public Forum Debate National Quarterfinalist'],
    counselorAnalysisZh: '【升学指导破局点评】牛津PPE极度看重学生在TSA笔试中的临场批判性逻辑以及学院面试中的思维敏捷度。该生在面试中针对“如果功利主义最大化会牺牲少数人，政府是否有权征税”等悖论提出了极具原创性的双层论证，深得牛津导师青睐。',
    counselorAnalysisEn: 'Stellar TSA test scores followed by brilliant philosophical defenses of redistributive taxation paradoxes in the Oxford collegiate interview.',
    essayTopicZh: '《罗尔斯无知之幕与现代外卖骑手算法压迫的法理审视》',
    essayTopicEn: 'Rawlsian Veil of Ignorance Applied to Algorithmic Delivery Systems'
  },
  {
    id: 'case-3',
    studentIdMasked: 'E. Chen (Class of 2024)',
    admittedUniversity: 'UPenn Wharton (宾夕法尼亚大学 · 沃顿商学院)',
    admittedMajor: 'Economics & Finance (BSc)',
    round: 'ED1',
    gpa: '3.98 / 4.0 · AP 8门全5分',
    standardizedTests: 'SAT 1570 · 托福 116',
    curriculum: 'AP',
    keyActivitiesZh: [
      '创立绿色农业碳汇溯源学生初创公司，获得校友天使轮 5万元种子基金支持并在县域落地',
      '担任校商业投资社社长，管理10万元虚拟学生基金并实现年化18%回报',
      '在某知名券商研究所参与新能源产业行研报告数据清洗与估值建模'
    ],
    keyActivitiesEn: [
      'Founded student agri-carbon credit startup, securing $7k angel seed grant and piloting in rural farms',
      'President of Investment Club managing a $15k virtual student fund with 18% alpha',
      'Intern at Securities Research Institute modeling EV supply chain valuations'
    ],
    keyHonorsZh: ['NEC 全美经济学挑战赛 AS 组全球总决赛季军', '沃顿全球高中生投资大赛 (KWHS) 亚太前十'],
    keyHonorsEn: ['NEC Adam Smith Division Global Finals 3rd Place', 'Wharton Global High School Investment Contest Asia-Pacific Top 10'],
    counselorAnalysisZh: '【升学指导破局点评】沃顿非常看重学生将金融理论转化为真实商业落地行动（Impact）的领导力。该生不仅在NEC商赛中展现了过硬的宏微观模型功底，更通过真实的农业碳汇落地项目证明了其将商业向善商业化的商业嗅觉。',
    counselorAnalysisEn: 'Proved rare business execution by translating carbon-finance theory into a functioning rural agricultural pilot, perfectly aligning with Wharton culture.',
    essayTopicZh: '《农田深处的复利：在泥土与代码之间架设绿色金融之桥》',
    essayTopicEn: 'Compound Interest in the Soil: Bridging Green Finance & Agritech'
  }
];

export const mockInterviewQuestions: InterviewQuestion[] = [
  {
    id: 'int-1',
    university: 'Harvard / Ivy League (哈佛大学及藤校)',
    type: 'Alumni',
    category: 'Personal Fit',
    difficulty: 'High',
    questionZh: '“如果你有一整天完全不受任何学业和作业限制的自由时间，你会如何度过？为什么？”',
    questionEn: '“If you had a completely free day with zero academic obligations, how would you spend it and why?”',
    counselorTipsZh: '【导师答题要诀】千万不要回答“继续刷题或睡觉”。招生官意在考察你的“真实内驱力（Intrinsic Motivation）与未被功利化侵蚀的纯粹好奇心”。可以描述一个你长期热爱却与升学无直接挂钩的深度爱好（如胶片暗房冲洗、烘焙酵母发酵、野外鸟类观测），展现立体丰满的人格。',
    counselorTipsEn: 'Demonstrates authentic intellectual vitality and hobbies beyond resume optimization. Focus on pure curiosity and craftsmanship.',
  },
  {
    id: 'int-2',
    university: 'Oxford University (牛津大学 · 面试真题)',
    type: 'Faculty',
    category: 'Academic Rigor',
    difficulty: 'High',
    questionZh: '“（物理/工程专业）为什么下雨天走路时衣服淋湿的程度，和跑步时会有所不同？请列出微积分或矢量物理方程推导。”',
    questionEn: '“Why does the amount of rain you get hit by differ when walking versus running? Set up the vector mechanics equation.”',
    counselorTipsZh: '【导师答题要诀】牛津导师不在乎你第一秒是否给出标准答案，而是观察你在导师给予渐进提示（Prompt）时，能否迅速建立简化的物理模型（如将人视为长方体，建立相对速度矢量三角形并做通量积分）。保持边想边大声说出思路（Think Out Loud）。',
    counselorTipsEn: 'Supervision style: Think out loud, set up simplified geometric boundaries, and adapt gracefully to professor counter-hints.',
  },
  {
    id: 'int-3',
    university: 'University of Pennsylvania (宾夕法尼亚大学)',
    type: 'Alumni',
    category: 'Leadership',
    difficulty: 'Medium',
    questionZh: '“请分享一次你在团队中与成员发生严重学术或执行分歧的经历，你最终是如何化解冲突并推进目标的？”',
    questionEn: '“Describe a time when you had a fierce disagreement within a team. How did you resolve the deadlock?”',
    counselorTipsZh: '【导师答题要诀】使用 STAR 架构（情境、任务、行动、结果）。核心在于展现“积极倾听、求同存异的同理心与数据驱动的决策说服力”，切忌在回答中单方面贬低队友或将功劳独揽。',
    counselorTipsEn: 'Use STAR format. Emphasize active listening, data-driven alignment, and diplomatic compromise without blaming peers.',
  }
];

export const mockEssaySamples: EssaySample[] = [
  {
    id: 'ess-1',
    titleZh: '范文精析：Common App 650字主文书（哈佛/康奈尔录取）',
    titleEn: 'Harvard/Cornell Admitted Main Essay: The Philosophy of the Repair Shop',
    type: 'Common App PS',
    targetUniversity: 'Cornell / Ivy League',
    tags: ['哲学思考', '动手创造', '成长顿悟'],
    excerptZh: '“祖父修表店里那台1978年的老式机械卡尺，教会了我世界上最深刻的真理：完美不是没有瑕疵，而是理解每一颗齿轮咬合的摩擦力……”',
    excerptEn: '“The 1978 vintage mechanical caliper in my grandfather’s watch repair shop taught me that perfection is not the absence of friction, but the harmonious reconciliation of moving parts…”',
    fullTextZh: '祖父的修表店坐落在老街拐角处，空气中常年弥漫着钟表油与黄铜氧化的清香。童年时期，我总喜欢趴在放大镜前看那些微小如尘埃的齿轮运转。高一时，我试图用3D打印机复刻一个复杂的擒纵轮机构，但连续五次打印出的塑料部件都在高频振荡中崩解断裂。正是在一次次的失败测量中，我领悟到了物理刚性与柔性阻尼的辩证关系。后来，我将这套修表工艺中汲取的精密测量哲学应用到了校内无障碍轮椅避障传感器的滤波算法设计中……',
    fullTextEn: 'My grandfather’s watch shop stood at the cobblestone corner. As a child, I marveled at gears finer than grains of sand. In 10th grade, my attempts to 3D-print an escapement wheel failed five consecutive times under vibrational shear. Through these failures, I learned the dialectic of rigidity and damping. Years later, I mapped this horological precision into designing sensor filtering algorithms for motorized wheelchair navigation…',
    counselorCommentaryZh: '【名师逐段点评】本文的高明之处在于将微观的“修表匠人精神”与宏观的“工程算法设计”巧妙串联。开篇意象极具电影镜头感，中段展现了在科研挫折中的坚韧不拔，结尾自然升华到利用科技服务弱势群体的社会担当，浑然天成毫无堆砌之感。',
    counselorCommentaryEn: 'Exemplary narrative arc connecting tactile watchmaking craftsmanship with sophisticated algorithmic engineering for human empathy.'
  }
];

interface CampusKnowledgeBaseProps {
  role?: 'teacher' | 'student';
}

const CampusKnowledgeBase: React.FC<CampusKnowledgeBaseProps> = ({ role = 'teacher' }) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';
  const theme = role === 'student' ? 'violet' : 'primary';
  const mainHex = role === 'student' ? '#7c3aed' : '#b45309';

  const [activeTab, setActiveTab] = useState<'cases' | 'interviews' | 'essays' | 'policies'>('cases');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<AdmissionCase | null>(null);
  const [selectedEssay, setSelectedEssay] = useState<EssaySample | null>(null);

  // Filtered cases
  const filteredCases = useMemo(() => {
    return mockAdmissionCases.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        c.admittedUniversity.toLowerCase().includes(q) ||
        c.admittedMajor.toLowerCase().includes(q) ||
        c.curriculum.toLowerCase().includes(q) ||
        c.keyActivitiesZh.some(a => a.toLowerCase().includes(q)) ||
        c.keyActivitiesEn.some(a => a.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  return (
    <div className="h-full flex flex-col bg-[#f9f8f6] dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 transition-colors p-4 sm:p-6 lg:p-8 overflow-hidden">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold bg-${theme}-100 dark:bg-${theme}-900/30 text-${theme}-800 dark:text-${theme}-300 flex items-center gap-1`}>
              <School className="w-3.5 h-3.5" />
              {isEn ? 'Knowledge Base' : '知识库'} · {isEn ? 'Campus Proprietary Knowledge' : '校内知识库'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {isEn ? 'Campus Admissions Archive & Asset Repository' : '校内历年真实录取案例库与升学资产中心'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            {isEn 
              ? 'Proprietary past admission cases, Ivy interview questions, annotated essay samples, and academic policies.' 
              : '汇集本校往届顶尖名校真实录取档案、藤校及牛剑面试真题库、名师批注满分文书范文及校内选课指南。'}
          </p>
        </div>

        {/* Top Tab Pills */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-[#e5e0dc] dark:border-white/5 shadow-xs">
          <button
            onClick={() => { setActiveTab('cases'); setSelectedCase(null); setSelectedEssay(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'cases' ? `bg-${theme}-600 text-white shadow-xs` : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            {isEn ? 'Admission Cases' : '录取案例库'}
          </button>
          <button
            onClick={() => { setActiveTab('interviews'); setSelectedCase(null); setSelectedEssay(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'interviews' ? `bg-${theme}-600 text-white shadow-xs` : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {isEn ? 'Interview Bank' : '面试真题库'}
          </button>
          <button
            onClick={() => { setActiveTab('essays'); setSelectedCase(null); setSelectedEssay(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'essays' ? `bg-${theme}-600 text-white shadow-xs` : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {isEn ? 'Essay Samples' : '高分文书库'}
          </button>
          <button
            onClick={() => { setActiveTab('policies'); setSelectedCase(null); setSelectedEssay(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'policies' ? `bg-${theme}-600 text-white shadow-xs` : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {isEn ? 'Campus Policies' : '校内选课指南'}
          </button>
        </div>
      </div>

      {/* Main Content Render */}
      <div className="flex-1 overflow-y-auto pr-1 pb-10 space-y-6 min-h-0 custom-scrollbar">
        
        {/* === TAB 1: ADMISSION CASES === */}
        {activeTab === 'cases' && (
          <div className="space-y-5">
            {/* Search Bar */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-[#e5e0dc] dark:border-white/5 shadow-xs flex items-center gap-3">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={isEn ? "Search cases by university, major, curriculum, background keywords..." : "搜索录取大学、专业、课程体系（AP/IB/A-Level）、活动背景关键词..."}
                className="w-full bg-transparent text-sm font-medium outline-none text-gray-800 dark:text-zinc-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Cases List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCases.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-white/5 hover:border-${theme}-200 dark:hover:border-${theme}-500/30 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2.5">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300">
                        {c.round} 录取
                      </span>
                      <span className="text-[11px] font-bold text-gray-400">{c.curriculum} 体系</span>
                    </div>

                    <h3 className={`font-black text-gray-900 dark:text-zinc-100 text-base leading-snug group-hover:text-${theme}-700 dark:group-hover:text-${theme}-400 transition-colors`}>
                      {c.admittedUniversity}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-3">
                      {c.admittedMajor}
                    </p>

                    <div className="bg-gray-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-gray-100 dark:border-white/5 space-y-1.5 text-xs mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">在校 GPA:</span>
                        <span className="font-bold text-gray-800 dark:text-zinc-200">{c.gpa}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">标化考试:</span>
                        <span className="font-bold text-gray-800 dark:text-zinc-200">{c.standardizedTests}</span>
                      </div>
                    </div>

                    <div className="space-y-1 mb-3">
                      <p className="text-[11px] font-bold text-gray-400">主活动亮点:</p>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {isEn ? c.keyActivitiesEn[0] : c.keyActivitiesZh[0]}
                      </p>
                    </div>
                  </div>

                  <div className={`pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-${theme}-600 dark:text-${theme}-400`}>
                    <span>查看完整软硬件画像与名师点评</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === TAB 2: INTERVIEW BANK === */}
        {activeTab === 'interviews' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {mockInterviewQuestions.map(q => (
                <div key={q.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-xs space-y-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {q.university}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">{q.type} 面试</span>
                    </div>

                    <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-relaxed">
                      {isEn ? q.questionEn : q.questionZh}
                    </h4>

                    <div className="mt-3 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/40 dark:border-amber-500/20 text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                      {isEn ? q.counselorTipsEn : q.counselorTipsZh}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100 dark:border-white/5">
                    <span>考查维度：{q.category}</span>
                    <span className="font-bold text-red-500">难度：{q.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === TAB 3: ESSAYS === */}
        {activeTab === 'essays' && (
          <div className="space-y-5">
            {mockEssaySamples.map(essay => (
              <div key={essay.id} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[#e5e0dc] dark:border-white/5 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-300">
                        {essay.type}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        录取院校：{essay.targetUniversity}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">{isEn ? essay.titleEn : essay.titleZh}</h3>
                  </div>

                  <div className="flex gap-1.5">
                    {essay.tags.map((t, i) => (
                      <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-bold">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50/80 dark:bg-zinc-800/40 p-5 rounded-2xl border border-gray-100 dark:border-white/5 space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{isEn ? 'Full Essay Text Sample' : '高分文书正文摘录'}</p>
                  <p className="text-xs text-gray-800 dark:text-zinc-200 leading-relaxed font-serif italic whitespace-pre-line">
                    {isEn ? essay.fullTextEn : essay.fullTextZh}
                  </p>
                </div>

                <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-500/20 text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                  {isEn ? essay.counselorCommentaryEn : essay.counselorCommentaryZh}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === TAB 4: CAMPUS POLICIES === */}
        {activeTab === 'policies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[#e5e0dc] dark:border-white/5 shadow-xs space-y-4">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className={`w-5 h-5 text-${theme}-600`} />
                AP / IB 选课进阶规则与先修前置条件
              </h3>
              <ul className="space-y-3 text-xs text-gray-700 dark:text-zinc-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span><strong>10年级选课：</strong> 建议选修 2-3门 基础AP（如 AP微积分AB、AP物理1、AP微观经济），夯实基础GPA。</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span><strong>11年级核心冲刺：</strong> 选修 3-5门 高阶AP（AP微积分BC、AP物理C、AP统计、AP计算机A），展示最大学术挑战度（Course Rigor）。</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span><strong>IB HL 课程组合：</strong> 申请理工科必须选修 Math AA HL 及 对应理科科目 HL，确保单科预估分达到 6-7分。</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[#e5e0dc] dark:border-white/5 shadow-xs space-y-4">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className={`w-5 h-5 text-${theme}-600`} />
                老师推荐信申请与文书提交时间节点
              </h3>
              <ul className="space-y-3 text-xs text-gray-700 dark:text-zinc-300">
                <li className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span><strong>5月15日前：</strong> 锁定2位主要学科老师，当面沟通推荐信意向并提交 Bragg Sheet（个人成就梳理表）。</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span><strong>9月20日前：</strong> 完成与升学指导老师顾问信（Counselor Recommendation）深度沟通访谈。</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span><strong>10月15日前：</strong> 完成早申（ED/EA）全部系统绑定与成绩单/推荐信电子上传封包。</span>
                </li>
              </ul>
            </div>
          </div>
        )}

      </div>

      {/* Case Detail Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[90vh] rounded-3xl border border-gray-100 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-start justify-between gap-4 bg-gray-50/60 dark:bg-zinc-800/40">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300">
                    {selectedCase.round} 录取
                  </span>
                  <span className="text-xs text-gray-500">{selectedCase.curriculum} · {selectedCase.studentIdMasked}</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                  {selectedCase.admittedUniversity}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedCase.admittedMajor}</p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-xs font-bold hover:bg-gray-200 dark:hover:bg-zinc-700"
              >
                关闭
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                <div>
                  <p className="text-gray-400 font-bold">高中平时 GPA</p>
                  <p className="text-gray-900 dark:text-white font-black mt-0.5">{selectedCase.gpa}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold">标化与语言考试</p>
                  <p className="text-gray-900 dark:text-white font-black mt-0.5">{selectedCase.standardizedTests}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">主文书题目与立意</h4>
                <p className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 text-blue-950 dark:text-blue-200 font-medium">
                  {isEn ? selectedCase.essayTopicEn : selectedCase.essayTopicZh}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">课外活动列表精粹 (Activities)</h4>
                <ul className="space-y-2">
                  {(isEn ? selectedCase.keyActivitiesEn : selectedCase.keyActivitiesZh).map((act, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">学术竞赛与荣誉 (Honors)</h4>
                <div className="flex flex-wrap gap-2">
                  {(isEn ? selectedCase.keyHonorsEn : selectedCase.keyHonorsZh).map((h, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200/50 dark:border-white/5 font-bold text-[11px]">
                      🏆 {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/50 dark:border-emerald-500/20">
                <p className="text-emerald-950 dark:text-emerald-200 leading-relaxed font-medium">
                  {isEn ? selectedCase.counselorAnalysisEn : selectedCase.counselorAnalysisZh}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CampusKnowledgeBase;
