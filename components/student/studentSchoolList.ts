import { SelectedSchool, UniversityDisplay } from '../teacher/planning/PlanningData';

const createUniversity = (name: string, logoSeed: string, rank: number): UniversityDisplay => ({
  id: name,
  name,
  cnName: name,
  logo: `https://api.dicebear.com/7.x/initials/svg?seed=${logoSeed}&backgroundColor=f1f5f9`,
  rank,
  region: 'US',
  tags: [],
  avgGpa: 0,
  minToefl: 0,
  avgSat: 0,
});

export const getStudentFinalSchools = (isEn: boolean): SelectedSchool[] => [
  {
    id: 's1',
    uni: createUniversity('Carnegie Mellon Univ.', 'CMU', 22),
    tier: 'Reach',
    major: 'Financial Engineering',
    requirements: 'TOEFL 105+ (S25+)\nSAT 1550+ (Math 800)',
    admissionAdvice: isEn ? 'Math competition (AIME+) is essential. Coding portfolio needed.' : '必须有高级别数学竞赛奖项 (AIME+)，且需提交编程作品集证明工程能力。',
    deadlines: 'ED1: Nov 1\nRD: Jan 3',
  },
  {
    id: 's2',
    uni: createUniversity('Cornell University', 'Cornell', 12),
    tier: 'Reach',
    major: 'CS (Engineering)',
    requirements: 'SAT 1540+\nPhysics C Required',
    admissionAdvice: isEn ? 'High fit required. The Why Cornell essay should address specific labs or professors.' : '极度看重匹配度。Why Cornell 文书必须具体到实验室或教授，切忌泛泛而谈。',
    deadlines: 'ED: Nov 1\nRD: Jan 2',
  },
  {
    id: 's3',
    uni: createUniversity('UIUC', 'UIUC', 35),
    tier: 'Match',
    major: 'Computer Engineering',
    requirements: 'GPA 3.8+\nTOEFL 100+',
    admissionAdvice: isEn ? 'CS is reach-level difficult. CompE is slightly easier but remains competitive.' : 'CS 专业难度堪比藤校，CompE 相对容易但仍需过硬的理科成绩。',
    deadlines: 'EA: Nov 1 (Priority)',
  },
  {
    id: 's4',
    uni: createUniversity('UC San Diego', 'UCSD', 28),
    tier: 'Match',
    major: 'Data Science',
    requirements: 'GPA 3.9 (Weighted)\nTest Blind',
    admissionAdvice: isEn ? 'College selection matters. PIQ essays should focus on leadership.' : '七个学院的选择策略很重要。文书(PIQ)需侧重领导力与社区贡献。',
    deadlines: 'RD: Nov 30 (Hard)',
  },
  {
    id: 's5',
    uni: createUniversity('Penn State', 'PSU', 60),
    tier: 'Safety',
    major: 'Engineering Undecided',
    requirements: 'Rolling Admission\nNo Essays',
    admissionAdvice: isEn ? 'Apply before Nov 1 to improve the chance of securing Main Campus.' : '尽早申请（11月1日前）以确保录取到主校区 (University Park)。',
    deadlines: 'Priority: Nov 1',
  },
];
