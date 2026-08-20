import React, { useState, useMemo } from 'react';
import { 
  Search, 
  BookOpen, 
  GraduationCap, 
  TrendingUp, 
  Briefcase, 
  DollarSign, 
  School, 
  Star, 
  Bookmark, 
  ExternalLink, 
  ChevronRight, 
  ArrowLeft, 
  Filter, 
  Award, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Sparkles,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface MajorItem {
  id: string;
  nameZh: string;
  nameEn: string;
  category: 'cs_ai' | 'business' | 'engineering' | 'humanities' | 'art' | 'life_science' | 'natural_science' | 'interdisciplinary';
  categoryLabelZh: string;
  categoryLabelEn: string;
  degreeLevels: ('Bachelor' | 'Master' | 'PhD')[];
  competitiveness: '极高' | '高' | '中等';
  competitivenessEn: 'Very High' | 'High' | 'Moderate';
  avgStartingSalary: string;
  employmentOutlook: string;
  employmentOutlookEn: string;
  taglineZh: string;
  taglineEn: string;
  overviewZh: string;
  overviewEn: string;
  coreCoursesZh: string[];
  coreCoursesEn: string[];
  prerequisitesZh: string[];
  prerequisitesEn: string[];
  topUniversities: {
    name: string;
    location: string;
    ranking: string;
    badge: string;
  }[];
  careerPaths: {
    titleZh: string;
    titleEn: string;
    avgSalary: string;
    growthRate: string;
  }[];
  recommendedCompetitions: string[];
  recommendedResearchTopicsZh: string[];
  recommendedResearchTopicsEn: string[];
}

export const mockMajors: MajorItem[] = [
  {
    id: 'cs-ai',
    nameZh: '计算机科学与人工智能',
    nameEn: 'Computer Science & Artificial Intelligence',
    category: 'cs_ai',
    categoryLabelZh: '计算机与AI',
    categoryLabelEn: 'CS & AI',
    degreeLevels: ['Bachelor', 'Master', 'PhD'],
    competitiveness: '极高',
    competitivenessEn: 'Very High',
    avgStartingSalary: '$118,000 /年',
    employmentOutlook: '未来10年增长率预计达23%（远超平均水平）',
    employmentOutlookEn: 'Projected 10-year growth of 23% (Much faster than average)',
    taglineZh: '研究计算理论、算法设计、大语言模型与智能自主系统的全球最热门学科之一。',
    taglineEn: 'Focuses on computational theory, algorithmic systems, LLMs, and autonomous intelligent agents.',
    overviewZh: '计算机科学与AI涵盖深度学习、自然语言处理、计算机视觉、分布式系统与数据结构。申请极为重视学生的高阶数学（微积分BC/线性代数）与计算机编程竞赛/独立科研背景。',
    overviewEn: 'Spans deep learning, NLP, computer vision, distributed systems, and discrete mathematics. Highly values rigorous math (Calculus/Linear Algebra) and Olympiad CS achievements.',
    coreCoursesZh: ['数据结构与算法分析', '机器学习与深度学习导论', '计算机体系结构与操作系统', '离散数学与概率统计', '自然语言处理与大模型'],
    coreCoursesEn: ['Data Structures & Algorithms', 'Intro to Machine Learning & Deep Learning', 'Computer Architecture & OS', 'Discrete Mathematics & Probability', 'NLP & Foundation Models'],
    prerequisitesZh: ['AP/IB 计算机科学A (5分/7分)', 'AP 微积分BC / HL数学 (5分/7分)', 'Python / C++ / Java 扎实代码能力', '独立开源项目或算法竞赛经历'],
    prerequisitesEn: ['AP/IB Computer Science A (Score 5/7)', 'AP Calculus BC / HL Math (Score 5/7)', 'Proficiency in Python / C++ / Java', 'Open source portfolio or USACO achievements'],
    topUniversities: [
      { name: 'MIT (麻省理工学院)', location: '美国 · 剑桥', ranking: 'US News #1 CS', badge: 'EECS' },
      { name: 'Stanford University (斯坦福大学)', location: '美国 · 斯坦福', ranking: 'US News #1 CS', badge: 'AI Lab' },
      { name: 'Carnegie Mellon University (卡耐基梅隆)', location: '美国 · 匹兹堡', ranking: 'SCS 顶级学院', badge: 'SCS' },
      { name: 'Oxford / Cambridge (牛剑)', location: '英国', ranking: 'QS World #4', badge: 'Oxbridge CS' },
      { name: 'UC Berkeley (加州大学伯克利)', location: '美国 · 伯克利', ranking: 'US News #1 CS', badge: 'BA/BS CS' },
      { name: 'NUS (新加坡国立大学)', location: '新加坡', ranking: 'QS Asia #1 CS', badge: 'School of Computing' }
    ],
    careerPaths: [
      { titleZh: 'AI算法工程师 / 大模型研究员', titleEn: 'AI Research Scientist / ML Engineer', avgSalary: '$165,000', growthRate: '+32%' },
      { titleZh: '全栈软件开发工程师', titleEn: 'Full-Stack Software Engineer', avgSalary: '$125,000', growthRate: '+18%' },
      { titleZh: '量化交易与量化开发', titleEn: 'Quantitative Developer / Trader', avgSalary: '$220,000+', growthRate: '+25%' },
      { titleZh: '云计算与分布式架构师', titleEn: 'Cloud & Distributed Systems Architect', avgSalary: '$150,000', growthRate: '+20%' }
    ],
    recommendedCompetitions: ['USACO (美国计算机奥赛 - Gold/Platinum)', 'Kaggle AI竞赛', 'HMMT / AMC 12 数学竞赛', 'ISEF 国际科学与工程大奖赛'],
    recommendedResearchTopicsZh: ['大语言模型微调与高效推理架构优化', '医疗图像多模态分割与边缘设备部署', '强化学习在多智能体协同控制中的应用'],
    recommendedResearchTopicsEn: ['LLM Fine-tuning & Low-Rank Adaptation Optimization', 'Multi-modal Medical Imaging Segmentation', 'Multi-Agent Reinforcement Learning for Autonomous Systems']
  },
  {
    id: 'finance-econ',
    nameZh: '金融工程与应用经济学',
    nameEn: 'Financial Engineering & Applied Economics',
    category: 'business',
    categoryLabelZh: '商科与管理',
    categoryLabelEn: 'Business & Management',
    degreeLevels: ['Bachelor', 'Master'],
    competitiveness: '极高',
    competitivenessEn: 'Very High',
    avgStartingSalary: '$98,000 /年',
    employmentOutlook: '顶尖投行、对冲基金及咨询公司对数理复合型商科人才需求旺盛',
    employmentOutlookEn: 'Surging demand in top investment banks, hedge funds, and boutique consulting firms for quantitative business talent.',
    taglineZh: '融合数理统计、金融衍生品建模、微观经济分析与资产配置的黄金学科。',
    taglineEn: 'Synthesizes quantitative statistics, derivatives pricing, econometric modeling, and portfolio strategy.',
    overviewZh: '该方向既包括传统微观/宏观经济学与金融市场分析，也涵盖量化金融、风险管理与企业并购。申请注重数理背景、商业社团领导力与跨文化商业洞察。',
    overviewEn: 'Encompasses traditional macro/microeconomics, corporate finance, financial derivatives, and risk management. Values strong math, commercial acumen, and student leadership.',
    coreCoursesZh: ['中级微观与宏观经济学', '计量经济学与实证分析', '金融衍生品与投资学', '随机微积分与金融数学', '公司金融与并购分析'],
    coreCoursesEn: ['Intermediate Micro/Macroeconomics', 'Applied Econometrics', 'Investment & Derivatives', 'Stochastic Calculus in Finance', 'Corporate Finance & Valuation'],
    prerequisitesZh: ['AP/IB 微观/宏观经济学 (5分/7分)', 'AP 统计学与微积分BC (5分)', 'NEC 全美经济学挑战赛获奖', '沃顿商赛 (KWHS) 或 IEO 经济学奥赛经验'],
    prerequisitesEn: ['AP Micro/Macro Economics (Score 5)', 'AP Statistics & Calculus BC (Score 5)', 'NEC National Economics Challenge Award', 'Wharton KWHS or IEO experience'],
    topUniversities: [
      { name: 'UPenn Wharton (宾大沃顿商学院)', location: '美国 · 费城', ranking: 'US News #1 Undergraduate Business', badge: 'Wharton' },
      { name: 'NYU Stern (纽约大学斯特恩)', location: '美国 · 纽约', ranking: 'US News #5 Finance', badge: 'Stern BPE' },
      { name: 'LSE (伦敦政经学院)', location: '英国 · 伦敦', ranking: 'QS World #3 Economics', badge: 'BSc Econ' },
      { name: 'Columbia University (哥伦比亚大学)', location: '美国 · 纽约', ranking: 'Top 5 Financial Engineering', badge: 'MSFE' },
      { name: 'Chicago Booth (芝加哥大学)', location: '美国 · 芝加哥', ranking: 'Nobel Laureates Hub', badge: 'Booth Econ' },
      { name: 'HKU (香港大学经管学院)', location: '中国香港', ranking: 'Asia Top 3 Finance', badge: 'BBA F&E' }
    ],
    careerPaths: [
      { titleZh: '投资银行分析师 (IBD / S&T)', titleEn: 'Investment Banking Analyst', avgSalary: '$135,000 + Bonus', growthRate: '+14%' },
      { titleZh: '对冲基金量化研究员', titleEn: 'Quantitative Research Analyst', avgSalary: '$180,000+', growthRate: '+22%' },
      { titleZh: '战略咨询顾问 (MBB)', titleEn: 'Management Consultant (McKinsey/BCG/Bain)', avgSalary: '$115,000', growthRate: '+16%' },
      { titleZh: '私募股权与风险投资 (PE/VC)', titleEn: 'PE / VC Investment Associate', avgSalary: '$140,000', growthRate: '+19%' }
    ],
    recommendedCompetitions: ['NEC 全美经济学挑战赛 (Adam Smith / David Ricardo)', 'IEO 国际经济学奥林匹克', '沃顿全球高校高中生投资大赛 (KWHS)', 'SIC S&P 全球中学生投资挑战'],
    recommendedResearchTopicsZh: ['美联储货币政策周期对新兴市场主权债务的传导机制', '基于机器学习的多因子量化选股策略检验', '绿色金融与ESG评级对上市公司融资成本的影响'],
    recommendedResearchTopicsEn: ['Fed Monetary Policy Transmission to Emerging Market Debt', 'Multi-factor Alpha Strategies via Machine Learning', 'Impact of ESG Ratings on Corporate Bond Spreads']
  },
  {
    id: 'bio-med',
    nameZh: '生物医学工程与神经科学',
    nameEn: 'Biomedical Engineering & Neuroscience',
    category: 'life_science',
    categoryLabelZh: '生命与健康',
    categoryLabelEn: 'Life Sciences',
    degreeLevels: ['Bachelor', 'Master', 'PhD'],
    competitiveness: '极高',
    competitivenessEn: 'Very High',
    avgStartingSalary: '$92,000 /年',
    employmentOutlook: '基因编辑、脑机接口与精准医疗驱动下全球研发投入持续攀升',
    employmentOutlookEn: 'Rapid growth propelled by gene editing, brain-computer interfaces, and precision pharmaceuticals.',
    taglineZh: '生命奥秘与工程技术的交汇点，致力于疾病攻克、脑机接口与再生医学。',
    taglineEn: 'Intersection of biological discovery and engineering innovations in therapeutics, BCI, and regenerative medicine.',
    overviewZh: '涵盖分子生物学、神经回路机制、生物材料、组织工程与脑机接口。申请重视学术严谨度、湿实验（Wet Lab）科研经历、USABO或Brain Bee等高含金量竞赛战绩。',
    overviewEn: 'Explores molecular biology, neural circuitry, biomaterials, and BCI devices. Emphasizes rigorous wet-lab research, scientific papers, and USABO/Brain Bee credentials.',
    coreCoursesZh: ['细胞与分子生物学', '神经生物学与认知科学', '生物力学与生物材料', '基因组学与生物信息学', '生物医学信号处理'],
    coreCoursesEn: ['Cell & Molecular Biology', 'Neurobiology & Cognitive Neuroscience', 'Biomechanics & Biomaterials', 'Genomics & Bioinformatics', 'Biomedical Signal Processing'],
    prerequisitesZh: ['AP 生物 (5分) + AP 化学 (5分)', '大学实验室独立湿实验课题经验', 'USABO (美国生物奥赛) 铜奖以上', 'Brain Bee 脑科学大赛奖项'],
    prerequisitesEn: ['AP Biology (5) + AP Chemistry (5)', 'University-affiliated wet-lab research', 'USABO Semifinalist / Medalist', 'Brain Bee Championship Honors'],
    topUniversities: [
      { name: 'Johns Hopkins University (约翰霍普金斯)', location: '美国 · 巴尔的摩', ranking: 'US News #1 BME', badge: 'Whiting BME' },
      { name: 'Georgia Tech (佐治亚理工学院)', location: '美国 · 亚特兰大', ranking: 'US News #2 BME', badge: 'Coulter BME' },
      { name: 'Duke University (杜克大学)', location: '美国 · 达勒姆', ranking: 'US News #3 BME', badge: 'Pratt' },
      { name: 'Imperial College London (帝国理工)', location: '英国 · 伦敦', ranking: 'QS World #6 Eng', badge: 'Bioeng' },
      { name: 'Stanford University (斯坦福大学)', location: '美国 · 斯坦福', ranking: 'World Renowned BioE', badge: 'Bioengineering' },
      { name: 'UCL (伦敦大学学院)', location: '英国 · 伦敦', ranking: 'QS World #2 Neuroscience', badge: 'Brain Sciences' }
    ],
    careerPaths: [
      { titleZh: '生物医药研发科学家 (R&D)', titleEn: 'Biotech / Pharma R&D Scientist', avgSalary: '$115,000', growthRate: '+24%' },
      { titleZh: '脑机接口算法与硬件工程师', titleEn: 'Neural Interface & BCI Engineer', avgSalary: '$145,000', growthRate: '+35%' },
      { titleZh: '医疗器械高级系统工程师', titleEn: 'Medical Device Systems Engineer', avgSalary: '$105,000', growthRate: '+15%' },
      { titleZh: '预医科升学 (MD / PhD 临床医学)', titleEn: 'Pre-Med Pathway to MD / Physician', avgSalary: '$280,000+ (Post Residency)', growthRate: '+12%' }
    ],
    recommendedCompetitions: ['USABO (美国生物奥赛)', 'BBO (英国生物奥赛)', 'Brain Bee 脑科学大赛', 'iGEM 国际基因工程机器大赛'],
    recommendedResearchTopicsZh: ['CRISPR-Cas9 靶向基因编辑在神经退行性疾病中的递送载体设计', '基于微流控芯片的肿瘤循环细胞快速捕获与体外药敏筛选', '脑电信号 (EEG) 解码与无创神经假肢控制算法研究'],
    recommendedResearchTopicsEn: ['CRISPR Delivery Vectors for Neurodegenerative Therapy', 'Microfluidic Chips for Circulating Tumor Cell Isolation', 'EEG Decoding for Non-Invasive Neural Prosthetic Control']
  },
  {
    id: 'mechanical-aero',
    nameZh: '机械工程与航空航天',
    nameEn: 'Mechanical & Aerospace Engineering',
    category: 'engineering',
    categoryLabelZh: '工程与应用科学',
    categoryLabelEn: 'Engineering',
    degreeLevels: ['Bachelor', 'Master', 'PhD'],
    competitiveness: '高',
    competitivenessEn: 'High',
    avgStartingSalary: '$88,000 /年',
    employmentOutlook: '新能源汽车、商业航天、机器人与先进制造核心支柱',
    employmentOutlookEn: 'Backbone of commercial space exploration, robotics, EV automotive, and smart manufacturing.',
    taglineZh: '从超音速飞行器到精密工业机器人，掌控力学、热力学与动力系统的工程基石。',
    taglineEn: 'From supersonic spacecraft to humanoid robotics, mastering mechanics, thermodynamics, and physical systems.',
    overviewZh: '涵盖经典力学、流体力学、热力学、控制论与智能机器人。申请非常看重扎实的物理学基本功（BPhO/PhysicsBowl）、CAD建模与Maker动手工程制作（FRC/VEX机器人）。',
    overviewEn: 'Encompasses fluid dynamics, thermodynamics, materials science, and robotics. Emphasizes physics foundations, CAD engineering, and competitive robotics (FRC/VEX).',
    coreCoursesZh: ['理论力学与材料力学', '流体力学与空气动力学', '热力学与传热学', '机械设计与CAD/CAM制造', '自动控制原理与机器人学'],
    coreCoursesEn: ['Statics & Strength of Materials', 'Fluid Mechanics & Aerodynamics', 'Thermodynamics & Heat Transfer', 'Mechanical Design & CAM', 'Control Systems & Robotics'],
    prerequisitesZh: ['AP 物理C 力学 & 电磁学 (5分/5分)', 'AP 微积分BC (5分)', 'BPhO (英国物理奥赛) 奖项', 'FRC / VEX 机器人竞赛核心机械手/队长'],
    prerequisitesEn: ['AP Physics C Mechanics & E&M (5/5)', 'AP Calculus BC (5)', 'BPhO Physics Olympiad Honors', 'FRC / VEX Robotics Captain / Lead Engineer'],
    topUniversities: [
      { name: 'MIT (麻省理工学院)', location: '美国 · 剑桥', ranking: 'US News #1 MechE', badge: 'MechE' },
      { name: 'Purdue University (普渡大学)', location: '美国 · 西拉法叶', ranking: 'Top 3 Aerospace', badge: 'AAE Cradle' },
      { name: 'University of Michigan (密歇根安娜堡)', location: '美国 · 安娜堡', ranking: 'US News #4 MechE', badge: 'UM MechE' },
      { name: 'Imperial College London (帝国理工)', location: '英国 · 伦敦', ranking: 'QS World #7 Eng', badge: 'Aero Dept' },
      { name: 'Caltech (加州理工学院)', location: '美国 · 帕萨迪纳', ranking: 'JPL Affiliated', badge: 'GALCIT' },
      { name: 'Delft University (荷兰代尔夫特理工)', location: '荷兰 · 代尔夫特', ranking: 'Europe Top 3 Eng', badge: 'TU Delft Aerospace' }
    ],
    careerPaths: [
      { titleZh: '航空航天与推进系统工程师', titleEn: 'Aerospace & Propulsion Engineer', avgSalary: '$112,000', growthRate: '+16%' },
      { titleZh: '人形机器人与智能硬件架构师', titleEn: 'Robotics & Hardware Architect', avgSalary: '$130,000', growthRate: '+28%' },
      { titleZh: '新能源动力与热管理专家', titleEn: 'EV Powertrain & Thermal Systems Specialist', avgSalary: '$105,000', growthRate: '+22%' },
      { titleZh: '有限元分析 (FEA) 与结构优化工程师', titleEn: 'FEA / CFD Simulation Specialist', avgSalary: '$98,000', growthRate: '+14%' }
    ],
    recommendedCompetitions: ['BPhO 英国物理奥林匹克', 'PhysicsBowl 物理杯竞赛', 'FRC 国际高中生机器人挑战赛', 'FTC / VEX 机器人世锦赛'],
    recommendedResearchTopicsZh: ['高超音速飞行器热防护陶瓷基复合材料断裂力学模拟', '仿生水下柔性机器人流固耦合动力学建模与闭环控制', '基于拓扑优化的轻量化航空发动机涡轮叶片设计'],
    recommendedResearchTopicsEn: ['Thermal Protection Ceramic Matrix Composites in Hypersonics', 'Fluid-Structure Interaction in Biomimetic Underwater Robotics', 'Topology Optimization for Lightweight Aircraft Turbine Blades']
  },
  {
    id: 'media-comms',
    nameZh: '数字传媒与国际政治传播',
    nameEn: 'Digital Media & Strategic Communications',
    category: 'humanities',
    categoryLabelZh: '人文社科与传媒',
    categoryLabelEn: 'Humanities & Media',
    degreeLevels: ['Bachelor', 'Master'],
    competitiveness: '高',
    competitivenessEn: 'High',
    avgStartingSalary: '$72,000 /年',
    employmentOutlook: '跨国公关、数字营销、流媒体与科技大厂全球战略公关需求稳定',
    employmentOutlookEn: 'Robust career avenues in global PR, digital brand storytelling, streaming entertainment, and tech policy.',
    taglineZh: '探讨信息时代的话语权、新媒体内容生产、全球舆论生态与品牌传播战略。',
    taglineEn: 'Investigating media ecology, cross-cultural discourse, global public opinion, and strategic storytelling.',
    overviewZh: '涵盖新媒体传播学、国际关系与公共外交、数据新闻学、危机公关与内容创意。申请注重学生的批判性写作、辩论活动、校园刊物主编经历与深度社会调查产出。',
    overviewEn: 'Covers media sociology, strategic communications, investigative data journalism, and public diplomacy. Values published writing, MUN debate, and documentary research.',
    coreCoursesZh: ['大众传播理论与新媒体生态', '国际政治与跨文化传播', '数据新闻学与信息可视化', '品牌战略营销与公关危机管理', '数字影视制作与叙事策划'],
    coreCoursesEn: ['Mass Media & Digital Culture', 'Global Politics & Cross-cultural Comm', 'Data Journalism & Visualization', 'Strategic Brand & Crisis PR', 'Digital Video Production & Storytelling'],
    prerequisitesZh: ['托福 108+ 或 雅思 7.5+ (写作小分突出)', 'NYT 纽约时报中学生写作竞赛获奖', '模拟联合国 (MUN) 杰出代表经历', '校刊主编或个人深度社会调查报告集'],
    prerequisitesEn: ['TOEFL 108+ or IELTS 7.5+ (Strong writing score)', 'NYT Writing Competition Finalist', 'Model UN Outstanding Delegate honors', 'Editor-in-Chief of School Publication or published essays'],
    topUniversities: [
      { name: 'Northwestern University (西北大学)', location: '美国 · 埃文斯顿', ranking: 'US News #1 Journalism & Comm', badge: 'Medill' },
      { name: 'USC (南加州大学)', location: '美国 · 洛杉矶', ranking: 'US News #1 Comm & Media', badge: 'Annenberg' },
      { name: 'LSE (伦敦政经学院)', location: '英国 · 伦敦', ranking: 'QS World #3 Media', badge: 'Dept of Media' },
      { name: 'Columbia University (哥伦比亚大学)', location: '美国 · 纽约', ranking: 'Pulitzer Hub', badge: 'Journalism School' },
      { name: 'Amsterdam (阿姆斯特丹大学)', location: '荷兰 · 阿姆斯特丹', ranking: 'QS World #1 Communication', badge: 'ASCoR' },
      { name: 'NYU (纽约大学)', location: '美国 · 纽约', ranking: 'Tisch & Steinhardt', badge: 'Media Culture' }
    ],
    careerPaths: [
      { titleZh: '跨国品牌全球公关总监', titleEn: 'Global Corporate PR Director', avgSalary: '$110,000', growthRate: '+14%' },
      { titleZh: '科技大厂政策与国际战略专家', titleEn: 'Tech Public Policy & Government Relations', avgSalary: '$135,000', growthRate: '+20%' },
      { titleZh: '资深调查记者与数据新闻主播', titleEn: 'Investigative & Multimedia Journalist', avgSalary: '$78,000', growthRate: '+8%' },
      { titleZh: '数字创意制片人与内容运营总监', titleEn: 'Digital Creative Producer & Content Lead', avgSalary: '$95,000', growthRate: '+18%' }
    ],
    recommendedCompetitions: ['NYT 纽约时报中学生系列写作大赛', 'John Locke 全球论文竞赛', 'CTB 全球青年大挑战 (China Thinks Big)', 'NSDA 全美演讲与辩论联赛'],
    recommendedResearchTopicsZh: ['生成式AI对社交媒体新闻真实度认知与受众极化的影响机制', '短视频算法分发下的跨文化国家形象建构与认同心理', '重大公共危机中的政府危机传播与公众情绪引导策略'],
    recommendedResearchTopicsEn: ['Generative AI and Misinformation Polarization on Social Platforms', 'Cross-cultural National Identity in Algorithmic Short-form Video', 'Government Crisis Communication and Public Sentiment Dynamics']
  },
  {
    id: 'arch-design',
    nameZh: '建筑设计与人居空间科技',
    nameEn: 'Architecture & Spatial Computing Design',
    category: 'art',
    categoryLabelZh: '艺术与设计',
    categoryLabelEn: 'Art & Design',
    degreeLevels: ['Bachelor', 'Master'],
    competitiveness: '高',
    competitivenessEn: 'High',
    avgStartingSalary: '$76,000 /年',
    employmentOutlook: '可持续绿色建筑、元宇宙虚拟空间、城市更新与智能空间需求激增',
    employmentOutlookEn: 'Growing focus on sustainable ecological architecture, computational BIM, and spatial design.',
    taglineZh: '兼具美学感性、空间构造、结构工程与人居环境可持续性的经典设计学科。',
    taglineEn: 'Mastery of spatial aesthetics, tectonic structures, environmental physics, and computational urbanism.',
    overviewZh: '课程融合设计课（Studio）、建筑历史、结构力学、参数化设计（Rhino/Grasshopper）及可持续建筑物理。申请以高质量个人作品集（Portfolio - 15-20页）为核心决定性权重。',
    overviewEn: 'Blends design studios, architectural history, structural mechanics, parametric Grasshopper modeling, and environmental physics. Demands a stellar 15-20 page design portfolio.',
    coreCoursesZh: ['建筑设计课工作室 (Studio I-V)', '参数化建模与计算设计 (Grasshopper/Rhino)', '建筑结构与构造材料学', '绿色可持续建筑物理与能耗模拟', '现代城市规划与空间形态学'],
    coreCoursesEn: ['Architectural Design Studio I-V', 'Parametric Modeling & Computational Design', 'Building Structures & Material Tectonics', 'Sustainable Environmental Systems & Energy Simulation', 'Urbanism & Spatial Morphology'],
    prerequisitesZh: ['15-20页高质量个人原创建筑设计作品集 (Portfolio)', '熟练掌握 Rhino / CAD / Photoshop / 物理模型制作', 'AP 艺术史或 AP 2D/3D 艺术设计 (5分)', '扎实的几何数学与物理空间直觉'],
    prerequisitesEn: ['15-20 page high-quality original architecture portfolio', 'Proficiency in Rhino / AutoCAD / Adobe Suite & physical models', 'AP Art History or AP 2D/3D Art & Design (Score 5)', 'Strong intuitive grasp of spatial geometry and structural physics'],
    topUniversities: [
      { name: 'MIT (麻省理工学院)', location: '美国 · 剑桥', ranking: 'QS World #1 Architecture', badge: 'MIT Arch' },
      { name: 'UCL Bartlett (伦敦大学学院巴特莱特)', location: '英国 · 伦敦', ranking: 'QS World #2 Architecture', badge: 'The Bartlett' },
      { name: 'Cornell University (康奈尔大学)', location: '美国 · 伊萨卡', ranking: 'US News #1 B.Arch (5年制)', badge: 'AAP' },
      { name: 'Delft University (代尔夫特理工)', location: '荷兰 · 代尔夫特', ranking: 'QS World #3 Architecture', badge: 'TU Delft BK' },
      { name: 'Harvard GSD (哈佛大学设计学院)', location: '美国 · 剑桥', ranking: 'Global Preeminent Design', badge: 'Harvard GSD' },
      { name: 'AA School (英国建筑联盟学院)', location: '英国 · 伦敦', ranking: 'Avant-garde Icon', badge: 'AA Diploma' }
    ],
    careerPaths: [
      { titleZh: '注册建筑设计师 (AIA / RIBA)', titleEn: 'Licensed Architect (AIA / RIBA)', avgSalary: '$92,000', growthRate: '+10%' },
      { titleZh: '计算化设计与参数化算法总监', titleEn: 'Computational Design Lead / BIM Architect', avgSalary: '$118,000', growthRate: '+24%' },
      { titleZh: '可持续绿色建筑咨询顾问', titleEn: 'LEED Sustainable Building Consultant', avgSalary: '$96,000', growthRate: '+18%' },
      { titleZh: '元宇宙与虚拟空间体验设计师', titleEn: 'Spatial Experience & Game Level Designer', avgSalary: '$105,000', growthRate: '+26%' }
    ],
    recommendedCompetitions: ['青年建筑师全球概念奖 (Young Architects Competition)', 'eVolo 摩天大楼建筑设计竞赛', 'Scholastic 艺术与写作金钥匙大奖', 'RIBA 国际青年设计竞赛'],
    recommendedResearchTopicsZh: ['利用遗传算法对高密度城市遮阳与采光立面进行多目标形态优化', '木结构与竹质生物复合材料在低碳装配式建筑中的结构耐受性实验', '空间句法 (Space Syntax) 在历史街区活化与人流组织中的量化应用'],
    recommendedResearchTopicsEn: ['Multi-objective Facade Optimization for Daylight via Genetic Algorithms', 'Structural Durability of Timber-Bamboo Composites in Modular Housing', 'Space Syntax Quantitative Analysis in Historical Neighborhood Revitalization']
  }
];

interface MajorEncyclopediaProps {
  role?: 'teacher' | 'student';
}

const MajorEncyclopedia: React.FC<MajorEncyclopediaProps> = ({ role = 'teacher' }) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';
  const theme = role === 'student' ? 'violet' : 'primary';
  const mainHex = role === 'student' ? '#7c3aed' : '#b45309';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCompetitiveness, setSelectedCompetitiveness] = useState<string>('all');
  const [activeMajor, setActiveMajor] = useState<MajorItem | null>(null);
  
  // Bookmarks
  const [bookmarkedMajorIds, setBookmarkedMajorIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nut_bookmarked_majors');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleBookmark = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setBookmarkedMajorIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('nut_bookmarked_majors', JSON.stringify(Array.from(next)));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  const categories = [
    { id: 'all', labelZh: '全部专业大类', labelEn: 'All Disciplines' },
    { id: 'cs_ai', labelZh: '计算机与AI', labelEn: 'CS & AI' },
    { id: 'business', labelZh: '商科与管理', labelEn: 'Business & Management' },
    { id: 'engineering', labelZh: '工程与应用科学', labelEn: 'Engineering' },
    { id: 'life_science', labelZh: '生命与健康', labelEn: 'Life Sciences' },
    { id: 'humanities', labelZh: '人文社科与传媒', labelEn: 'Humanities & Media' },
    { id: 'art', labelZh: '艺术与空间设计', labelEn: 'Art & Design' }
  ];

  const filteredMajors = useMemo(() => {
    return mockMajors.filter(m => {
      const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
      const matchesDiff = selectedCompetitiveness === 'all' || m.competitiveness === selectedCompetitiveness;
      
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        m.nameZh.toLowerCase().includes(q) || 
        m.nameEn.toLowerCase().includes(q) ||
        m.categoryLabelZh.toLowerCase().includes(q) ||
        m.coreCoursesZh.some(c => c.toLowerCase().includes(q)) ||
        m.coreCoursesEn.some(c => c.toLowerCase().includes(q));

      return matchesCat && matchesDiff && matchesSearch;
    });
  }, [searchQuery, selectedCategory, selectedCompetitiveness]);

  return (
    <div className="h-full flex flex-col bg-[#f9f8f6] dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 transition-colors p-4 sm:p-6 lg:p-8 overflow-hidden">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold bg-${theme}-100 dark:bg-${theme}-900/30 text-${theme}-800 dark:text-${theme}-300 flex items-center gap-1`}>
              <GraduationCap className="w-3.5 h-3.5" />
              {isEn ? 'Knowledge Base' : '知识库'} · {isEn ? 'Major Encyclopedia' : '专业百科'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {isEn ? 'Global Major Encyclopedia & Career Atlas' : '全球专业百科与升学图谱'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            {isEn 
              ? 'In-depth analysis of university disciplines, prerequisite coursework, career salaries, and admissions competition.' 
              : '深度解析全球顶尖名校专业设置、先修课程要求、就业薪酬前景及名校录取偏好。'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-2xl px-4 py-2 shadow-xs text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isEn ? 'Disciplines' : '学科门类'}</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">8+</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-2xl px-4 py-2 shadow-xs text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isEn ? 'Major Profiles' : '深度专业'}</p>
            <p className={`text-lg font-black text-${theme}-600 dark:text-${theme}-400`}>150+</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-2xl px-4 py-2 shadow-xs text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isEn ? 'Saved' : '已收藏'}</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">{bookmarkedMajorIds.size}</p>
          </div>
        </div>
      </div>

      {!activeMajor ? (
        // --- LIST & EXPLORE VIEW ---
        <div className="flex-1 flex flex-col min-h-0 gap-6">
          
          {/* Controls Bar: Search & Category Pills */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-[#e5e0dc] dark:border-white/5 shadow-xs flex-shrink-0 space-y-4 transition-colors">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder={isEn ? "Search majors by name, keywords, core courses..." : "搜索专业名称、核心课程、研究方向关键词..."}
                  className="w-full bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/20 text-gray-800 dark:text-zinc-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Competitiveness Selector */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 whitespace-nowrap">{isEn ? 'Competition:' : '申请难度:'}</span>
                <select 
                  className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-zinc-300 outline-none"
                  value={selectedCompetitiveness}
                  onChange={(e) => setSelectedCompetitiveness(e.target.value)}
                >
                  <option value="all">{isEn ? 'All Levels' : '全部难度'}</option>
                  <option value="极高">{isEn ? 'Very High (Top Tier)' : '极高 (顶尖竞争)'}</option>
                  <option value="高">{isEn ? 'High' : '高'}</option>
                  <option value="中等">{isEn ? 'Moderate' : '中等'}</option>
                </select>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? `bg-${theme}-600 text-white shadow-sm`
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {isEn ? cat.labelEn : cat.labelZh}
                </button>
              ))}
            </div>
          </div>

          {/* Majors Grid */}
          <div className="flex-1 overflow-y-auto pr-1 pb-8 min-h-0 custom-scrollbar">
            {filteredMajors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMajors.map((major) => {
                  const isBookmarked = bookmarkedMajorIds.has(major.id);
                  return (
                    <div
                      key={major.id}
                      onClick={() => setActiveMajor(major)}
                      className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-white/5 hover:border-${theme}-200 dark:hover:border-${theme}-500/30 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between`}
                    >
                      <div>
                        {/* Card Top */}
                        <div className="flex justify-between items-start mb-3">
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                            major.competitiveness === '极高' 
                              ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200/50' 
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200/50'
                          }`}>
                            {isEn ? major.competitivenessEn : `竞争度：${major.competitiveness}`}
                          </span>

                          <button
                            onClick={(e) => toggleBookmark(e, major.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isBookmarked 
                                ? `text-${theme}-600 dark:text-${theme}-400 bg-${theme}-50 dark:bg-${theme}-500/10` 
                                : 'text-gray-300 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-300'
                            }`}
                          >
                            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Title & English */}
                        <h3 className={`font-black text-gray-900 dark:text-zinc-100 text-lg leading-snug group-hover:text-${theme}-700 dark:group-hover:text-${theme}-400 transition-colors`}>
                          {isEn ? major.nameEn : major.nameZh}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium mb-3">
                          {isEn ? major.nameZh : major.nameEn}
                        </p>

                        <p className="text-xs text-gray-600 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                          {isEn ? major.taglineEn : major.taglineZh}
                        </p>

                        {/* Key Specs Pills */}
                        <div className="space-y-2 mb-4 bg-gray-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400 flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> {isEn ? 'Avg Salary' : '起薪中位数'}
                            </span>
                            <span className="font-bold text-gray-800 dark:text-zinc-200">{major.avgStartingSalary}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400 flex items-center gap-1.5">
                              <School className="w-3.5 h-3.5 text-blue-500" /> {isEn ? 'Top Target' : '推荐标杆院校'}
                            </span>
                            <span className="font-bold text-gray-800 dark:text-zinc-200 truncate max-w-[140px] text-right">
                              {major.topUniversities[0]?.name.split('(')[0]}
                            </span>
                          </div>
                        </div>

                        {/* Core Course Chips */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {(isEn ? major.coreCoursesEn : major.coreCoursesZh).slice(0, 3).map((c, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-medium">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Footer CTA */}
                      <div className={`pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-${theme}-600 dark:text-${theme}-400 mt-2`}>
                        <span>{isEn ? 'Explore Roadmap & Requirements' : '查看完整先修与职业路径'}</span>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <GraduationCap className="w-12 h-12 text-gray-300 dark:text-zinc-600 mb-3" />
                <p className="font-bold text-gray-700 dark:text-zinc-300">{isEn ? 'No majors found' : '未找到匹配的专业'}</p>
                <p className="text-xs text-gray-400 mt-1">{isEn ? 'Try adjusting your search filters.' : '请尝试更换搜索词或重置筛选分类。'}</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedCompetitiveness('all'); }}
                  className={`mt-4 px-4 py-2 text-xs font-bold bg-${theme}-600 text-white rounded-xl shadow-xs`}
                >
                  {isEn ? 'Reset All Filters' : '重置筛选条件'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // --- MAJOR DEEP DIVE DETAIL VIEW ---
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-900 rounded-3xl border border-[#e5e0dc] dark:border-white/5 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
          
          {/* Detail Top Navigation */}
          <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between flex-shrink-0 bg-gray-50/50 dark:bg-zinc-900/80">
            <button
              onClick={() => setActiveMajor(null)}
              className={`flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-zinc-400 hover:text-${theme}-600 dark:hover:text-${theme}-300 transition-colors`}
            >
              <ArrowLeft className="w-4 h-4" /> {isEn ? 'Back to Major List' : '返回专业百科列表'}
            </button>

            <button
              onClick={(e) => toggleBookmark(e, activeMajor.id)}
              className={`flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all ${
                bookmarkedMajorIds.has(activeMajor.id)
                  ? `bg-${theme}-50 dark:bg-${theme}-900/30 text-${theme}-700 dark:text-${theme}-300 border-${theme}-200`
                  : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-white/10'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${bookmarkedMajorIds.has(activeMajor.id) ? 'fill-current' : ''}`} />
              {bookmarkedMajorIds.has(activeMajor.id) ? (isEn ? 'Bookmarked' : '已收藏') : (isEn ? 'Add to Favorites' : '收藏专业')}
            </button>
          </div>

          {/* Detail Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
            
            {/* Header Hero */}
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black bg-${theme}-100 dark:bg-${theme}-900/40 text-${theme}-800 dark:text-${theme}-300`}>
                  {isEn ? activeMajor.categoryLabelEn : activeMajor.categoryLabelZh}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200/40">
                  {isEn ? `Admissions: ${activeMajor.competitivenessEn}` : `申请竞争度：${activeMajor.competitiveness}`}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/40">
                  {isEn ? `Median Starting Salary: ${activeMajor.avgStartingSalary}` : `起薪中位数：${activeMajor.avgStartingSalary}`}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {isEn ? activeMajor.nameEn : activeMajor.nameZh}
              </h2>
              <p className="text-sm font-semibold text-gray-400 dark:text-zinc-500 mt-0.5">
                {isEn ? activeMajor.nameZh : activeMajor.nameEn}
              </p>
              <p className="text-sm text-gray-600 dark:text-zinc-300 mt-3 leading-relaxed max-w-4xl">
                {isEn ? activeMajor.overviewEn : activeMajor.overviewZh}
              </p>
            </div>

            {/* Grid Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Core Courses */}
              <div className="bg-gray-50 dark:bg-zinc-800/40 p-6 rounded-2xl border border-gray-100 dark:border-white/5 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen className={`w-4 h-4 text-${theme}-600`} />
                  {isEn ? 'Undergraduate Core Curriculum' : '本科与高阶核心课程设置'}
                </h3>
                <ul className="space-y-2.5">
                  {(isEn ? activeMajor.coreCoursesEn : activeMajor.coreCoursesZh).map((course, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-zinc-300">
                      <span className="w-5 h-5 rounded-full bg-white dark:bg-zinc-800 text-gray-500 flex items-center justify-center font-bold text-[10px] flex-shrink-0 shadow-xs border border-gray-200 dark:border-white/5">
                        {idx + 1}
                      </span>
                      <span className="font-semibold leading-relaxed">{course}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prerequisites & High School Prep */}
              <div className="bg-gray-50 dark:bg-zinc-800/40 p-6 rounded-2xl border border-gray-100 dark:border-white/5 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {isEn ? 'Recommended High School Preparation' : '建议高中阶段先修与学术背景储备'}
                </h3>
                <ul className="space-y-2.5">
                  {(isEn ? activeMajor.prerequisitesEn : activeMajor.prerequisitesZh).map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-zinc-300">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <span className="font-semibold leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Top Target Universities */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <School className={`w-5 h-5 text-${theme}-600`} />
                {isEn ? 'Global Top Target Universities for this Major' : '该专业全球标杆名校与特色学院'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeMajor.topUniversities.map((uni, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-white/10">
                          {uni.badge}
                        </span>
                        <span className={`text-[10px] font-bold text-${theme}-600`}>{uni.ranking}</span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{uni.name}</h4>
                      <p className="text-xs text-gray-400 mt-1">{uni.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Career & Salaries */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                {isEn ? 'Career Trajectories & Industry Compensation' : '典型毕业去向与行业薪资前景'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeMajor.careerPaths.map((cp, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-gray-100 dark:border-white/5 space-y-2">
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white leading-snug">{isEn ? cp.titleEn : cp.titleZh}</h4>
                    <div className="pt-2 border-t border-gray-200/60 dark:border-white/5 flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">{isEn ? 'Median' : '平均中位数'}</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">{cp.avgSalary}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">{isEn ? 'Growth' : '岗位增长'}</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{cp.growthRate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Competitions & Research */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              <div className="bg-amber-50/50 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200/50 dark:border-amber-500/20 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  {isEn ? 'High-Impact Competitions & Honors' : '对口高含金量国际竞赛与背提活动'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeMajor.recommendedCompetitions.map((comp, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-xs font-bold text-amber-950 dark:text-amber-200 border border-amber-200/60 dark:border-white/10 shadow-xs">
                      🏆 {comp}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-950/20 p-5 rounded-2xl border border-blue-200/50 dark:border-blue-500/20 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  {isEn ? 'Sample High-School Research Topics' : '建议学术探索与科研论文课题范例'}
                </h4>
                <ul className="space-y-1.5">
                  {(isEn ? activeMajor.recommendedResearchTopicsEn : activeMajor.recommendedResearchTopicsZh).map((topic, i) => (
                    <li key={i} className="text-xs text-blue-950 dark:text-blue-200 font-medium leading-relaxed flex items-start gap-1.5">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default MajorEncyclopedia;
