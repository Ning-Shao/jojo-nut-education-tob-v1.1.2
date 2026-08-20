import React, { useState } from 'react';
import { 
  Globe, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  FileText, 
  ExternalLink, 
  Download, 
  Calendar, 
  Bookmark, 
  Info, 
  Sparkles, 
  Building2, 
  GraduationCap, 
  Layers,
  CheckCheck,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface CountryGuide {
  id: string;
  nameZh: string;
  nameEn: string;
  flag: string;
  taglineZh: string;
  taglineEn: string;
  popularSystem: string;
  popularSystemUrl: string;
  avgTuitionLiving: string;
  workVisaPolicy: string;
  timeline: {
    period: string;
    milestoneZh: string;
    milestoneEn: string;
    detailsZh: string;
    detailsEn: string;
    type: 'early' | 'regular' | 'rolling' | 'decision';
  }[];
  standardizedTests: {
    titleZh: string;
    titleEn: string;
    policyZh: string;
    policyEn: string;
    recommendedRange: string;
  }[];
  essayRequirements: {
    typeZh: string;
    typeEn: string;
    length: string;
    focusZh: string;
    focusEn: string;
  }[];
  counselorTips: {
    tipZh: string;
    tipEn: string;
    highlight: boolean;
  }[];
  checklist: {
    id: string;
    itemZh: string;
    itemEn: string;
    category: string;
  }[];
}

export const mockCountryGuides: CountryGuide[] = [
  {
    id: 'us',
    nameZh: '美国',
    nameEn: 'United States',
    flag: '🇺🇸',
    taglineZh: '全球最顶尖的综合通识教育与科研体系，采用“全人评估（Holistic Review）”机制。',
    taglineEn: 'World-leading liberal arts & research universities utilizing comprehensive Holistic Review.',
    popularSystem: 'Common Application / Coalition App / UC Application',
    popularSystemUrl: 'https://www.commonapp.org',
    avgTuitionLiving: '$55,000 - $85,000 美元/年',
    workVisaPolicy: 'F-1 签证享有 1-3 年 OPT（STEM专业可延长至36个月）',
    timeline: [
      {
        period: '每年 8月1日',
        milestoneZh: 'Common App 申请系统正式开放',
        milestoneEn: 'Common App Opens for the New Cycle',
        detailsZh: '可创建账号、完善个人信息并开始填写主文书（Personal Statement 650字）。',
        detailsEn: 'Create account, fill activities list, and draft the 650-word main essay.',
        type: 'early'
      },
      {
        period: '11月1日 / 11月15日',
        milestoneZh: '早申轮次截止 (ED1 / EA / REA)',
        milestoneEn: 'Early Action & Early Decision I Deadline',
        detailsZh: 'ED具有排他绑定法律效力，录取率通常高于常规轮；UC加州大学系统申请通道开放提交。',
        detailsEn: 'ED is binding; EA is non-binding. UC application submission window closes Nov 30.',
        type: 'early'
      },
      {
        period: '11月30日',
        milestoneZh: '加州大学系统 (UC) 统一截止',
        milestoneEn: 'UC System Unified Deadline',
        detailsZh: '提交9所UC分校申请及4篇 Personal Insight Questions (PIQ, 每篇350字)。',
        detailsEn: 'Submit all 9 UC campus applications and 4 chosen PIQs (350 words each).',
        type: 'early'
      },
      {
        period: '12月中旬',
        milestoneZh: 'ED1 / EA 早申放榜',
        milestoneEn: 'ED1 / EA Decisions Released',
        detailsZh: '若被ED1录取需撤回其他所有早申与常规申请；若Defer/Reject则迅速调整ED2与RD策略。',
        detailsEn: 'Admitted ED students must withdraw other apps. Deferred/rejected students prepare ED2 & RD.',
        type: 'decision'
      },
      {
        period: '次年 1月1日 - 1月15日',
        milestoneZh: '常规轮 (RD) 及 ED2 申请截止',
        milestoneEn: 'Regular Decision (RD) & ED2 Deadline',
        detailsZh: '提交各大学补充文书（Why School / Why Major），送出期末成绩Mid-year Report。',
        detailsEn: 'Submit university-specific supplements and high school mid-year transcripts.',
        type: 'regular'
      },
      {
        period: '次年 3月下旬 - 4月初',
        milestoneZh: '藤校常春藤日 (Ivy Day) 与全美常规放榜',
        milestoneEn: 'Ivy Day & Regular Decisions Released',
        detailsZh: '5月1日前确认入读并缴纳订金（National College Decision Day）。',
        detailsEn: 'Deposit deadline is May 1 (National College Decision Day).',
        type: 'decision'
      }
    ],
    standardizedTests: [
      {
        titleZh: '托福 / 雅思 / 多邻国 (Language Exams)',
        titleEn: 'TOEFL / IELTS / Duolingo English Test',
        policyZh: '绝大多数Top 50名校要求国际生提交。部分学校接受美高/IB纯英文授课免语言。',
        policyEn: 'Required for most international applicants. Waivers available for 3+ years in English-medium high schools.',
        recommendedRange: 'Top 30: 托福 105-112+ / 雅思 7.5-8.0+ / DET 135-150'
      },
      {
        titleZh: 'SAT / ACT 标化考试',
        titleEn: 'SAT / ACT Standardized Testing',
        policyZh: 'MIT、达特茅斯、耶鲁、德州奥斯汀等名校已恢复强制提交；多数学校保持Test-Optional。',
        policyEn: 'MIT, Dartmouth, Yale, UT Austin require test scores; others remain Test-Optional.',
        recommendedRange: 'Top 30: SAT 1500-1570+ (数学780-800) / ACT 34-36'
      },
      {
        titleZh: 'AP / IB / A-Level 高中课程与大考成绩',
        titleEn: 'AP / IB / A-Level Rigor',
        policyZh: '注重高中阶段最具挑战性的课程选修（Course Rigor）及 4-5分/HL 6-7分高分证明。',
        policyEn: 'Admissions looks heavily at maximum course rigor available at the high school.',
        recommendedRange: 'Top 30: 6-10门 AP (全5分) / IB 预估 40-44 / A-Level 3-4门 A*A*'
      }
    ],
    essayRequirements: [
      {
        typeZh: 'Common App 主文书 (Personal Statement)',
        typeEn: 'Common App Main Essay',
        length: '250 - 650 英文单词',
        focusZh: '展现独特的个人价值观、成长顿悟、思维方式及人格魅力。避免流水账式罗列简历。',
        focusEn: 'Demonstrate personal voice, core ethos, cognitive growth, and intellectual curiosity.'
      },
      {
        typeZh: '院校补充文书 (Supplemental Essays)',
        typeEn: 'School-Specific Supplements',
        length: '每所学校 1-3 篇 (100-350 词)',
        focusZh: '聚焦 "Why School", "Why Major", "社区贡献与多样性"，需高度结合学校具体教授、课程与资源。',
        focusEn: 'Tailored research into specific labs, professors, unique campus culture, and fit.'
      },
      {
        typeZh: '加州大学文书 (UC PIQs)',
        typeEn: 'UC Personal Insight Questions',
        length: '8选4篇，每篇 ≤ 350 词',
        focusZh: '务实直接，重点阐明领导力经历、学术热情、创造力或克服困难的实际行动与具体成果。',
        focusEn: 'Direct, straightforward evidence of leadership, creative problem-solving, and resilience.'
      }
    ],
    counselorTips: [
      {
        tipZh: '不要迷信 Test-Optional：对于亚裔理科/商科申请者，极高SAT/ACT（1530+）仍是破圈最有说服力的硬实力。',
        tipEn: 'Do not rely entirely on Test-Optional: High SAT (1530+) remains a critical differentiator for STEM/Business.',
        highlight: true
      },
      {
        tipZh: '活动列表（Activity List）重在“持续性与影响力”：1-2个深耕2-3年并产生实际社群影响力的项目远胜于10个浅尝辄止的水活动。',
        tipEn: 'Depth over breadth in Activity List: 2 core longitudinal spikes beat 10 superficial surface activities.',
        highlight: false
      },
      {
        tipZh: '早申 ED 策略是提效利器：将ED用于真正热爱且冲刺有胜算的梦校，能将录取率提升2-3倍。',
        tipEn: 'Strategic ED selection: Maximize ED for a true fit reach school to substantially elevate chances.',
        highlight: true
      }
    ],
    checklist: [
      { id: 'us-1', itemZh: '开具9-11年级中英文官方成绩单（GPA 3.8+）', itemEn: 'Official 9-11th Grade Transcripts', category: 'Academic' },
      { id: 'us-2', itemZh: '托福/雅思语言考试出分并完成官方送分', itemEn: 'TOEFL/IELTS Official Score Reports', category: 'Testing' },
      { id: 'us-3', itemZh: 'SAT/ACT 标化成绩单（如适用）', itemEn: 'SAT/ACT Score Reports (if applicable)', category: 'Testing' },
      { id: 'us-4', itemZh: '锁定3封推荐信（升学指导老师顾问信 + 2门主课学术老师推荐信）', itemEn: '3 Letters of Recommendation (Counselor + 2 Teachers)', category: 'Recommendation' },
      { id: 'us-5', itemZh: '完成 10 项课外活动与 5 项学术荣誉精炼填写（Common App 格式）', itemEn: '10 Activities & 5 Honors Profile Entries', category: 'Profile' },
      { id: 'us-6', itemZh: '主文书（Personal Statement）多轮润色定稿', itemEn: 'Finalized Common App 650-Word Personal Statement', category: 'Essays' },
      { id: 'us-7', itemZh: '各校补充文书（Why Us / Major）定稿与事实核查', itemEn: 'Finalized Supplemental Essays for Reach/Match/Safety', category: 'Essays' },
      { id: 'us-8', itemZh: '准备银行存款证明（资信证明约 80-100万人民币）', itemEn: 'Bank Financial Solvency Certification ($80k+ USD)', category: 'Financial' }
    ]
  },
  {
    id: 'uk',
    nameZh: '英国',
    nameEn: 'United Kingdom',
    flag: '🇬🇧',
    taglineZh: '学术导向鲜明、学制紧凑高效（英格兰本科3年），高度看重学术深度与学科单项能力。',
    taglineEn: 'Academia-first rigor, 3-year intensive undergraduate degree, laser-focused on specific discipline mastery.',
    popularSystem: 'UCAS (Universities and Colleges Admissions Service)',
    popularSystemUrl: 'https://www.ucas.com',
    avgTuitionLiving: '£25,000 - £45,000 英镑/年',
    workVisaPolicy: '毕业生享有 2年 Graduate Route (PSW) 签证无门槛留英工作',
    timeline: [
      {
        period: '每年 5月中旬',
        milestoneZh: 'UCAS 系统开放新一年注册',
        milestoneEn: 'UCAS Opens for Next Academic Cycle',
        detailsZh: '最多可填报 5 个志愿（牛津与剑桥只能二选一）。',
        detailsEn: 'Students can choose up to 5 course choices (Oxbridge: either Oxford or Cambridge).',
        type: 'early'
      },
      {
        period: '10月15日 (英国时间 18:00)',
        milestoneZh: '牛津大学、剑桥大学及医学类课程截止',
        milestoneEn: 'Oxbridge & Medicine Courses Deadline',
        detailsZh: '必须同时提交UCAS申请、PS文书，并报名对应加试（MAT/PAT/STEP/UCAT/TMUA等）。',
        detailsEn: 'Must register for admission tests (MAT/PAT/STEP/UCAT) alongside the UCAS application.',
        type: 'early'
      },
      {
        period: '10月下旬 - 11月',
        milestoneZh: '牛剑与帝国理工加试笔试进行',
        milestoneEn: 'Oxbridge & Imperial Admissions Testing',
        detailsZh: '全球统一考点举行笔试，成绩直接决定是否获得面试邀请（Interview Shortlist）。',
        detailsEn: 'Global testing determining shortlisting for collegiate interviews.',
        type: 'early'
      },
      {
        period: '12月上中旬',
        milestoneZh: '牛津、剑桥举行学院面试 (Online Interview)',
        milestoneEn: 'Oxbridge Collegiate Academic Interviews',
        detailsZh: '由学院教授进行模拟学术督导课形式的深度专业学术面试（Supervision-style）。',
        detailsEn: 'Rigorous academic dialog with college fellows simulating 1-on-1 supervisions.',
        type: 'regular'
      },
      {
        period: '次年 1月最后一个周三',
        milestoneZh: 'UCAS 绝大部分本科课程常规截止日',
        milestoneEn: 'Equal Consideration Deadline for Most UK Courses',
        detailsZh: 'G5超级精英大学（LSE、帝国理工、UCL）及其他罗素集团名校常规申请截止。',
        detailsEn: 'Deadline for Imperial, LSE, UCL, Edinburgh, and all Russell Group universities.',
        type: 'regular'
      },
      {
        period: '次年 5月 - 6月',
        milestoneZh: '确认首选志愿 (Firm) 与保底志愿 (Insurance)',
        milestoneEn: 'Select Firm & Insurance Offers',
        detailsZh: '收到全部大学预录取条件（Conditional Offer）后，在系统内锁定第一与第二志愿。',
        detailsEn: 'Pick one firm choice and one insurance choice from conditional offers received.',
        type: 'decision'
      },
      {
        period: '次年 8月中旬',
        milestoneZh: 'A-Level/IB 成绩公布与 UCAS Clearing (补录)',
        milestoneEn: 'A-Level Results Day & UCAS Clearing',
        detailsZh: '成绩达标即转为正式录取（Unconditional Offer）；未达标可参加补录调剂。',
        detailsEn: 'Offers confirmed unconditional upon meeting conditions; Clearing opens for open spots.',
        type: 'decision'
      }
    ],
    standardizedTests: [
      {
        titleZh: 'A-Level 考试成绩 / 预估分 (Predicted Grades)',
        titleEn: 'A-Level Grades / Predicted Scores',
        policyZh: '英国大学录取的绝对核心基石。G5名校必须提供对口科目的顶级预估分。',
        policyEn: 'The primary metric in UK admissions. Specific subject requirements must be met.',
        recommendedRange: 'G5: A*A*A* - A*AA / 顶尖罗素集团: AAA - AAB'
      },
      {
        titleZh: 'IB 国际文凭课程 (International Baccalaureate)',
        titleEn: 'IB Diploma Score & HL Requirements',
        policyZh: '英国名校对IB总分及高水准科目（Higher Level - 776 / 766）有非常明确的硬性条件。',
        policyEn: 'Rigid cut-offs for total score and Higher Level (HL) subjects (e.g. Math AA HL 7).',
        recommendedRange: '牛剑/G5: 总分 40-43+ (HL 776+) / 罗素大学: 36-38+'
      },
      {
        titleZh: '雅思学术类 (IELTS Academic) / 托福 (TOEFL)',
        titleEn: 'IELTS / TOEFL Language Scores',
        policyZh: '多数名校要求单项不低于 6.5-7.0。语言成绩可后补，最晚可在开学前达标。',
        policyEn: 'Language condition can be met after conditional offer, prior to summer enrollment.',
        recommendedRange: '牛剑/LSE: 雅思 7.5 (各单项7.0) / 其他名校: 6.5-7.0'
      }
    ],
    essayRequirements: [
      {
        typeZh: 'UCAS 个人陈述 (Personal Statement)',
        typeEn: 'UCAS Personal Statement',
        length: '严格限制 4000 个字符 (约 600-700 英文单词)',
        focusZh: '80%篇幅必须纯粹聚焦于“学术探索与专业求知”：深度阅读、学术论文、竞赛剖析与实验反思。不提具体学校名字。',
        focusEn: 'Strictly 80%+ pure academic exploration: super-curricular reading, research projects, competition puzzles. Do not name specific universities.'
      }
    ],
    counselorTips: [
      {
        tipZh: '文书切忌空谈情怀：英国招生官只想看到你读了什么书、做了什么实验、对某个学术悖论有什么独立思考。',
        tipEn: 'No storytelling fluff: UK tutors evaluate evidence of super-curricular engagement and academic depth.',
        highlight: true
      },
      {
        tipZh: '专业匹配度必须高度一致：UCAS一份文书投递5个志愿，因此5个选校的专业方向必须极其相近。',
        tipEn: 'Uniform course alignment: Since 1 PS goes to all 5 choices, degrees applied must align closely.',
        highlight: true
      },
      {
        tipZh: '笔试是牛剑录取的生死线：MAT/STEP/TMUA 等附加考试权重往往超过高中平时成绩。',
        tipEn: 'Admissions tests (MAT/STEP) carry monumental weight in shortlisting over high school grades.',
        highlight: false
      }
    ],
    checklist: [
      { id: 'uk-1', itemZh: '确定 UCAS 5 个专业志愿方案（冲刺+核心+稳妥梯队）', itemEn: 'Finalize 5 UCAS Course Choices', category: 'Profile' },
      { id: 'uk-2', itemZh: '获得由学校官方盖章的 A-Level/IB 官方预估分（Predicted Grades）', itemEn: 'Official School Predicted Grades Endorsement', category: 'Academic' },
      { id: 'uk-3', itemZh: '完成 4000 字符 UCAS 纯学术个人陈述（Personal Statement）', itemEn: 'Finalized 4000-character Academic PS', category: 'Essays' },
      { id: 'uk-4', itemZh: '专业主课老师学术推荐信（重点佐证学术潜力与预估分合理性）', itemEn: 'Academic Teacher Reference Letter', category: 'Recommendation' },
      { id: 'uk-5', itemZh: '报名并参加各专业附加考试（如牛剑 MAT / PAT / STEP / UCAT）', itemEn: 'Admission Test Registration & Prep', category: 'Testing' },
      { id: 'uk-6', itemZh: '准备雅思（IELTS UKVI Academic）语言备考或刷分', itemEn: 'IELTS Academic Score Certificate', category: 'Testing' }
    ]
  },
  {
    id: 'ca',
    nameZh: '加拿大',
    nameEn: 'Canada',
    flag: '🇨🇦',
    taglineZh: '多元包容、优质公立大学集群，Co-op带薪实习制度全球闻名，毕业移民政策极具吸引力。',
    taglineEn: 'Top-tier public research universities, globally renowned Co-op internships, and favorable post-study immigration paths.',
    popularSystem: 'OUAC (安省大学申请中心) / 各大学独立申请系统',
    popularSystemUrl: 'https://www.ouac.on.ca',
    avgTuitionLiving: 'CAD $45,000 - $65,000 加币/年',
    workVisaPolicy: '毕业享有最长 3年 PGWP 毕业后工签，省提名 (PNP) / EE 快速通道技术移民优势明显',
    timeline: [
      {
        period: '每年 10月 - 11月',
        milestoneZh: 'OUAC 与多伦多大学、麦吉尔大学系统开放',
        milestoneEn: 'OUAC & McGill/UBC Portals Open',
        detailsZh: '安大略省高中生（101）与国际生（105）分类申请。',
        detailsEn: 'OUAC 101/105 portals open along with UBC and McGill direct apps.',
        type: 'early'
      },
      {
        period: '12月上旬 - 1月中旬',
        milestoneZh: '名校工程与商学院早录取材料截止',
        milestoneEn: 'Early Evaluation Deadline for Eng/Business',
        detailsZh: '如多伦多大学工程科学、滑铁卢大学CS与工程第一轮审核。',
        detailsEn: 'First-round assessment for Waterloo CS/Eng and UofT Engineering.',
        type: 'early'
      },
      {
        period: '1月15日 - 1月31日',
        milestoneZh: '绝大多数名校主申请截止',
        milestoneEn: 'Main Application Submission Deadline',
        detailsZh: '提交基础选校申请并缴纳申请费。',
        detailsEn: 'Complete basic applicant submission and payment.',
        type: 'regular'
      },
      {
        period: '2月中旬',
        milestoneZh: '补充材料与视频面试 (Kira Talent) 截止',
        milestoneEn: 'Supplementary Profile & Video Interview Deadline',
        detailsZh: '完成滑铁卢 AIF 问卷、多大 Engineering/Rotman 线上即兴视频面试。',
        detailsEn: 'Submit Waterloo AIF and complete Kira Talent timed video assessments.',
        type: 'regular'
      },
      {
        period: '3月 - 5月',
        milestoneZh: '大批量录取通知书发放 (Rolling Offers)',
        milestoneEn: 'Rolling Admissions Decision Waves',
        detailsZh: '根据12年级最新学期成绩持续分批次发放预录取通知。',
        detailsEn: 'Universities evaluate ongoing semester 2 midterm transcripts and release offers.',
        type: 'decision'
      }
    ],
    standardizedTests: [
      {
        titleZh: '高中 12年级平时成绩 (Top 6 / 核心学术课)',
        titleEn: 'Grade 12 Academic Average (Top 6 Courses)',
        policyZh: '决定录取的绝对权重，加拿大大学最看重高中在校成绩单（特别是11-12年级数学/英语/物理）。',
        policyEn: 'Paramount factor in admissions: top 6 grade 12 U/M courses average.',
        recommendedRange: '多大/麦吉尔/滑铁卢CS: 93% - 98%+ / 综合名校: 85% - 90%+'
      },
      {
        titleZh: '语言考试 (IELTS / TOEFL / Duolingo)',
        titleEn: 'Language Requirements',
        policyZh: '雅思 6.5 (单项不低于6.0) 或 托福 100+。部分学校提供双录取/语言班通道。',
        policyEn: 'IELTS 6.5 (min 6.0 each) or TOEFL 100. Conditional ESL options available at select campuses.',
        recommendedRange: '多大/滑铁卢/UBC: 雅思 6.5-7.0 (各小分 6.0+) / 托福 100 (写作22+)'
      }
    ],
    essayRequirements: [
      {
        typeZh: '补充申请与文书 (Supplementary Applications / AIF)',
        typeEn: 'Supplementary Essays & Profiles',
        length: '200 - 500 词简答 + 即兴视频面试 (Kira Talent)',
        focusZh: '滑铁卢AIF问卷、多大Rotman/工程视频面试，考察即时逻辑表达、问题解决能力与真实性格。',
        focusEn: 'Timed written responses and real-time video answers measuring spontaneous logic & teamwork.'
      }
    ],
    counselorTips: [
      {
        tipZh: '滑铁卢大学竞赛是王牌敲门砖：欧几里得数学竞赛（Euclid - 前25%）与CCC计算机竞赛成绩是申请滑铁卢CS/工程的关键加分项。',
        tipEn: 'Waterloo math/computing contests (Euclid/CCC) are decisive differentiators for Waterloo CS/Eng admissions.',
        highlight: true
      },
      {
        tipZh: '重视12年级开学第一学期成绩：加拿大大学发早轮Offer完全依赖11年级大考与12年级期中GPA。',
        tipEn: 'Do not let senior year grades slip: Rolling offers rely heavily on 12th grade first semester marks.',
        highlight: false
      }
    ],
    checklist: [
      { id: 'ca-1', itemZh: '通过 OUAC 或大学官网注册账号并建立专业申请档案', itemEn: 'OUAC / Direct Portal Registration', category: 'Profile' },
      { id: 'ca-2', itemZh: '提交9-12年级高中成绩单并认证上传', itemEn: 'High School Transcript Upload', category: 'Academic' },
      { id: 'ca-3', itemZh: '参加滑铁卢大学欧几里得数学竞赛 (Euclid Contest)', itemEn: 'Waterloo Euclid Mathematics Contest', category: 'Testing' },
      { id: 'ca-4', itemZh: '完成 Kira Talent 即兴视频面试模拟与正式提交', itemEn: 'Kira Talent Video Interview Completion', category: 'Essays' },
      { id: 'ca-5', itemZh: '滑铁卢大学 AIF 补充信息表深度撰写', itemEn: 'Waterloo AIF Supplementary Form', category: 'Essays' }
    ]
  },
  {
    id: 'sg-hk',
    nameZh: '新加坡与中国香港',
    nameEn: 'Singapore & Hong Kong',
    flag: '🇸🇬 🇭🇰',
    taglineZh: '亚洲顶级名校双子星，国际化程度极高，全英文授课，QS世界排名超群，安全便利离家近。',
    taglineEn: 'Asia\'s premier English-medium hubs with stellar global QS rankings and high safety index.',
    popularSystem: 'NUS / NTU / HKU / HKUST 各大学官网直接申请',
    popularSystemUrl: 'https://www.nus.edu.sg',
    avgTuitionLiving: 'HK$ 180,000 - 250,000 港币/年 · SGD $30,000 - 45,000 新币/年',
    workVisaPolicy: '香港享有 IANG 签证留港2年；新加坡提供 Tuition Grant 签署3年工作协议学费减半',
    timeline: [
      {
        period: '每年 9月 - 10月',
        milestoneZh: '港大、港科大、港中文提前批/常规批开放',
        milestoneEn: 'HKU / HKUST / CUHK Application Opens',
        detailsZh: '香港名校多采用 Rolling 滚动录取，越早提交拿到面试和录取的概率越高。',
        detailsEn: 'Rolling admissions: early submissions receive priority interview invitations.',
        type: 'early'
      },
      {
        period: '10月中旬 - 11月',
        milestoneZh: '新加坡国立 (NUS) 与南洋理工 (NTU) 开放',
        milestoneEn: 'NUS & NTU Portals Open',
        detailsZh: '针对 IB / AP / A-Level 等不同国际高中文凭开放专用入口。',
        detailsEn: 'Specialized application channels for IB, AP, A-Level qualifications.',
        type: 'early'
      },
      {
        period: '11月中旬 - 12月',
        milestoneZh: '香港名校第一轮早批次截止与首轮面试',
        milestoneEn: 'Hong Kong Early Round & First Interviews',
        detailsZh: '商学院、计算机、法学专业密集组织全英文小组讨论或教授单面。',
        detailsEn: 'English group discussions and 1-on-1 interviews for Business, CS, and Law.',
        type: 'regular'
      },
      {
        period: '次年 1月 - 2月',
        milestoneZh: '新加坡两校 (NUS/NTU) 常规截止',
        milestoneEn: 'NUS & NTU Regular Deadline',
        detailsZh: '提交完整标化与高二高三全部平时成绩单。',
        detailsEn: 'Submit all transcripts and standardized test score reports.',
        type: 'regular'
      },
      {
        period: '次年 3月 - 5月',
        milestoneZh: '录取结果分批次公布',
        milestoneEn: 'Admissions Decisions Released',
        detailsZh: '香港学校发放带有高额奖学金（Full/Half Tuition Scholarship）的录取函。',
        detailsEn: 'Scholarship offers and conditional/firm admissions released in waves.',
        type: 'decision'
      }
    ],
    standardizedTests: [
      {
        titleZh: 'IB / A-Level / AP 顶级学术标化',
        titleEn: 'International Curriculum Cut-offs',
        policyZh: '新加坡NUS/NTU与港前三对学术标化要求极高，几乎只录取顶尖分数段学生。',
        policyEn: 'Stringent academic cut-offs: only top percentile scorers admitted.',
        recommendedRange: '港三/新二: IB 40-43+ (单科HL 776) / A-Level 3-4门 A*A*A* / AP 4-6门5分 + SAT 1500+'
      },
      {
        titleZh: '语言考试 (IELTS / TOEFL)',
        titleEn: 'Language Requirements',
        policyZh: '全英文授课大学，雅思 6.5-7.0+ 或 托福 93-100+。',
        policyEn: 'IELTS 6.5-7.0 (min 6.0) or TOEFL 93-100+.',
        recommendedRange: '港大商科/法学: 雅思 7.0-7.5 / 托福 100+'
      }
    ],
    essayRequirements: [
      {
        typeZh: '个人陈述与学术意向书 (Personal Statement)',
        typeEn: 'Statement of Purpose / Personal Statement',
        length: '500 - 800 英文单词',
        focusZh: '聚焦为何选择该地区及具体专业、未来在亚洲或全球的职业规划与过往科研成果。',
        focusEn: 'Academic passion, reason for choosing HK/Singapore, and career aspirations in Asia.'
      }
    ],
    counselorTips: [
      {
        tipZh: '早申早得优势明显：香港大学采用滚动录取，11月前提交第一轮申请的学生录取率显著高于次年1月后的常规批。',
        tipEn: 'Early bird advantage in Hong Kong: Submitting by November significantly increases interview and scholarship yields.',
        highlight: true
      },
      {
        tipZh: '英文群面技巧至关重要：香港高校面试非常喜欢 4-6人无领导小组讨论，重点考察倾听、协作与精准观点输出。',
        tipEn: 'Master group interviews: HK universities heavily favor 4-6 student unstructured case discussions.',
        highlight: true
      }
    ],
    checklist: [
      { id: 'hk-1', itemZh: '完成港大、港科大、港中文官网独立申请账号注册', itemEn: 'Create Application Profiles on HKU/HKUST/CUHK', category: 'Profile' },
      { id: 'hk-2', itemZh: 'NUS/NTU 新加坡官网申请提交与申请费缴纳', itemEn: 'NUS / NTU Application Submission', category: 'Profile' },
      { id: 'hk-3', itemZh: '英文个人陈述 (Personal Statement) 针对性定制', itemEn: 'Tailored Academic Personal Statement', category: 'Essays' },
      { id: 'hk-4', itemZh: '进行香港名校英文小组讨论与教授单面模拟特训', itemEn: 'Group & Individual Interview Mock Sessions', category: 'Interview' },
      { id: 'hk-5', itemZh: '开具官方全英文在读证明与高中成绩单认证件', itemEn: 'Official English School Enrollment & Transcripts', category: 'Academic' }
    ]
  }
];

interface CountryGuideLibraryProps {
  role?: 'teacher' | 'student';
}

const CountryGuideLibrary: React.FC<CountryGuideLibraryProps> = ({ role = 'teacher' }) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';
  const theme = role === 'student' ? 'violet' : 'primary';
  const mainHex = role === 'student' ? '#7c3aed' : '#b45309';

  const [activeCountryId, setActiveCountryId] = useState<string>('us');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nut_country_checklist');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleChecklist = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('nut_country_checklist', JSON.stringify(Array.from(next)));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  const activeGuide = mockCountryGuides.find(g => g.id === activeCountryId) || mockCountryGuides[0];

  return (
    <div className="h-full flex flex-col bg-[#f9f8f6] dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 transition-colors p-4 sm:p-6 lg:p-8 overflow-hidden">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold bg-${theme}-100 dark:bg-${theme}-900/30 text-${theme}-800 dark:text-${theme}-300 flex items-center gap-1`}>
              <Globe className="w-3.5 h-3.5" />
              {isEn ? 'Knowledge Base' : '知识库'} · {isEn ? 'Global Application Guides' : '各国申请指南'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {isEn ? 'Country Admissions Guides & Policy Playbook' : '各国本科申请权威政策与升学指南'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            {isEn 
              ? 'Comprehensive admissions timelines, testing policies, essay mechanics, and counselor pro-tips across major study destinations.' 
              : '一站式汇集美、英、加、新、港等主流留学国家/地区的申请系统、核心时间轴、标化门槛、文书侧重与名师避坑战略。'}
          </p>
        </div>

        {/* System portal quick launcher */}
        <a 
          href={activeGuide.popularSystemUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-[#e5e0dc] dark:border-white/10 text-xs font-bold text-gray-800 dark:text-zinc-200 hover:border-${theme}-500/40 hover:text-${theme}-600 dark:hover:text-${theme}-400 shadow-xs transition-all`}
        >
          <Building2 className="w-4 h-4 text-gray-400" />
          <span>{isEn ? 'Official Portal:' : '官方申请系统：'}{activeGuide.popularSystem.split('/')[0]}</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </a>
      </div>

      {/* Country Selection Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 flex-shrink-0 custom-scrollbar mb-4">
        {mockCountryGuides.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCountryId(c.id)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border ${
              activeCountryId === c.id
                ? `bg-white dark:bg-zinc-900 border-${theme}-500 text-gray-900 dark:text-white shadow-md ring-2 ring-${theme}-500/10`
                : 'bg-white/60 dark:bg-zinc-900/60 border-gray-200 dark:border-white/5 text-gray-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800'
            }`}
          >
            <span className="text-lg leading-none">{c.flag}</span>
            <span>{isEn ? c.nameEn : c.nameZh}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pr-1 pb-10 space-y-6 min-h-0 custom-scrollbar">
        
        {/* Country Overview Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[#e5e0dc] dark:border-white/5 shadow-xs transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{activeGuide.flag}</span>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">
                    {isEn ? `${activeGuide.nameEn} Undergraduate Admissions Guide` : `${activeGuide.nameZh}本科申请核心指南`}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    {isEn ? `Primary Application Portal: ${activeGuide.popularSystem}` : `官方申请系统：${activeGuide.popularSystem}`}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed mt-2">
                {isEn ? activeGuide.taglineEn : activeGuide.taglineZh}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:w-96 flex-shrink-0">
              <div className="bg-gray-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-500" /> {isEn ? 'Annual Tuition & Living' : '年度学费与生活费预算'}
                </p>
                <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">{activeGuide.avgTuitionLiving}</p>
              </div>

              <div className="bg-gray-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-blue-500" /> {isEn ? 'Post-Study Work Visa' : '毕业工签与就业政策'}
                </p>
                <p className="text-xs font-bold text-gray-900 dark:text-white mt-1 leading-snug">{activeGuide.workVisaPolicy}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Timeline */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[#e5e0dc] dark:border-white/5 shadow-xs transition-colors space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className={`w-5 h-5 text-${theme}-600`} />
              {isEn ? 'Key Admissions Milestones & Deadlines' : '核心申请时间轴与关键轮次节点'}
            </h3>
            <span className="text-xs text-gray-400 font-medium">{isEn ? 'Sorted chronologically' : '按申请季时间顺序排列'}</span>
          </div>

          <div className="relative border-l-2 border-gray-200 dark:border-zinc-800 ml-4 pl-6 space-y-6 py-2">
            {activeGuide.timeline.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* Dot */}
                <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 shadow-xs ${
                  item.type === 'early' 
                    ? 'bg-amber-500 ring-2 ring-amber-500/20' 
                    : item.type === 'decision' 
                    ? 'bg-emerald-500 ring-2 ring-emerald-500/20' 
                    : 'bg-blue-500 ring-2 ring-blue-500/20'
                }`} />

                <div className="bg-gray-50/80 dark:bg-zinc-800/40 hover:bg-gray-50 dark:hover:bg-zinc-800 p-4 rounded-2xl border border-gray-100 dark:border-white/5 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-black text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        item.type === 'early' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                        item.type === 'decision' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                      }`}>
                        {item.period}
                      </span>
                      {isEn ? item.milestoneEn : item.milestoneZh}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                    {isEn ? item.detailsEn : item.detailsZh}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grid: Standardized Tests & Essays */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Tests */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[#e5e0dc] dark:border-white/5 shadow-xs space-y-4">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              {isEn ? 'Standardized Tests & Academic Standards' : '标化成绩与学术门槛要求'}
            </h3>
            <div className="space-y-3.5">
              {activeGuide.standardizedTests.map((test, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-gray-100 dark:border-white/5 space-y-1.5">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">{isEn ? test.titleEn : test.titleZh}</h4>
                  <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">{isEn ? test.policyEn : test.policyZh}</p>
                  <div className="pt-2 mt-2 border-t border-gray-200/60 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-gray-400">{isEn ? 'Competitive Benchmark:' : '名校参考基准:'}</span>
                    <span className="text-[11px] font-black text-amber-700 dark:text-amber-300">{test.recommendedRange}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Essay Requirements */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[#e5e0dc] dark:border-white/5 shadow-xs space-y-4">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {isEn ? 'Essays & Holistic Evaluation Criteria' : '文书要求与综合评估侧重点'}
            </h3>
            <div className="space-y-3.5">
              {activeGuide.essayRequirements.map((essay, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-gray-100 dark:border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">{isEn ? essay.typeEn : essay.typeZh}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                      {essay.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed pt-1">{isEn ? essay.focusEn : essay.focusZh}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Counselor Tips & Common Pitfalls */}
        <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-3xl p-6 border border-amber-200/60 dark:border-amber-500/20 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-black text-amber-950 dark:text-amber-200">
              {isEn ? 'Senior Counselor Strategic Tips & Pitfalls to Avoid' : '资深升学指导避坑战略与专家建议'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeGuide.counselorTips.map((tip, idx) => (
              <div key={idx} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-amber-200/50 dark:border-white/5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-black flex items-center justify-center mb-2.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs text-gray-800 dark:text-zinc-200 font-medium leading-relaxed">
                    {isEn ? tip.tipEn : tip.tipZh}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Interactive Material Checklist */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[#e5e0dc] dark:border-white/5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCheck className={`w-5 h-5 text-${theme}-600`} />
                {isEn ? `${activeGuide.nameEn} Application Checklist Tracker` : `${activeGuide.nameZh}申请必备材料核对清单`}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {isEn ? 'Check off items as you gather credentials and finalize submissions.' : '逐项核对并勾选您当前已准备就绪的材料，状态自动保存。'}
              </p>
            </div>
            <div className="text-xs font-bold text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl">
              {isEn ? 'Progress:' : '准备进度:'} {activeGuide.checklist.filter(item => checkedItems.has(item.id)).length} / {activeGuide.checklist.length}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {activeGuide.checklist.map((item) => {
              const isDone = checkedItems.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isDone 
                      ? `bg-${theme}-50/60 dark:bg-${theme}-950/20 border-${theme}-200 dark:border-${theme}-500/30 text-${theme}-900 dark:text-${theme}-200` 
                      : 'bg-gray-50 dark:bg-zinc-800/50 border-gray-100 dark:border-white/5 text-gray-700 dark:text-zinc-300 hover:bg-gray-100/80 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                    isDone ? `bg-${theme}-600 border-${theme}-600 text-white` : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700'
                  }`}>
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold leading-snug block">{isEn ? item.itemEn : item.itemZh}</span>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-semibold">{item.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CountryGuideLibrary;
