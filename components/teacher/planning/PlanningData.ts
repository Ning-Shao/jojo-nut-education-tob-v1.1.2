
// --- Types ---
export interface UniversitySchema {
  id: string;
  name: string;
  cnName: string;
  logo: string;
  rank: number;
  region: string;
  tags: string[];
  avgGpa: number;
  minToefl: number;
  avgSat: number;
}

export interface UniversityDisplay extends UniversitySchema {
  matchScore?: number;
  winRate?: 'High' | 'Medium' | 'Low' | 'Very Low';
  reason?: string;
}

export interface SelectedSchool {
  id: string; // Unique identifier for the selection entry (uniId + major + timestamp)
  uni: UniversityDisplay;
  tier: 'Reach' | 'Match' | 'Safety';
  major: string;
  requirements?: string;
  admissionAdvice?: string; // New field for practical advice
  deadlines?: string;
  process?: string;
  portalLink?: string;
  requirementData?: {
    major: string;
    round: string;
    year: string;
    source: string;
    sourceUrl?: string;
    gpa?: number;
    toefl?: number;
    toeflNew?: number;
    ielts?: number;
    sat?: number;
    act?: number;
  };
}

export interface CareerResult {
  synthesis: string;
  majors: { name: string; match: number; reason: string }[];
  careers: { title: string; desc: string }[];
  groundingLinks?: { title: string; url: string }[];
}

export interface TargetPreference {
  id: number;
  region: string;
  majors: string[];
}

export interface GapAnalysisResult {
  summary: string;
  radarAnalysis: string;
  actionPlan: {
    student: string[];
    parent: string[];
    counselor: string[];
  };
}

export type TaskType = 'Milestone' | 'Routine';

export interface ActionItem {
  id: string;
  // Updated categories: Consolidated into 4 core dimensions
  category: 'Application' | 'Test' | 'Academics' | 'Extracurriculars';
  // Updated roles: Removed 'Parent'
  role: 'Student' | 'Counselor';
  // Refactored Content
  title: string;       // Short headline (e.g. "Register SAT")
  description: string; // Detailed steps (e.g. "Log into CollegeBoard...")
  duration: string;    // e.g., "2个月", "每周4小时"
  priority: 'High' | 'Medium' | 'Low';
  deadline?: string;   // Optional now to handle routines better
  type: TaskType;      // Milestone vs Routine
  isSelected: boolean;
}

export interface CourseDiagnosisResult {
  status: 'Safe' | 'Warning' | 'Critical';
  analysis: string; // Detailed analysis text
  suggestions: {
    type: 'Change Course' | 'Change Major' | 'Add Activity';
    content: string;
  }[];
}

// New Interface for Step 6 - Aligned with Task Center
export interface TimelineEvent {
  id: string;
  title: string;
  // Point = Specific Deadline, Range = Duration
  type: 'Point' | 'Range'; 
  startDate: string; // YYYY-MM or YYYY-MM-DD. Empty string if unscheduled.
  endDate?: string; 
  category: 'Exam' | 'Activity' | 'Application' | 'Academic' | 'Other';
  status: 'Pending' | 'In Progress' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
  description?: string;
  sourceActionId?: string; // Link back to Gap Analysis Action Item
  assignee: 'Student' | 'Parent' | 'Counselor'; 
  isMilestone: boolean; // Sync flag for Task Center
  tags?: string[];
  
  // New fields for Official Timeline support
  isOfficial?: boolean;
  region?: string;
  channel?: string;
  templateId?: string;
  blocker?: string;      // Reason for being unscheduled
  daysInPool?: number;   // Days spent in the unscheduled pool
}

export interface TimelineTemplate {
  id: string;
  name: string;
  region: string;
  channel?: string;
  description?: string;
  events: Omit<TimelineEvent, 'id' | 'status' | 'assignee' | 'isMilestone'>[];
}

export const OFFICIAL_TEMPLATES: TimelineTemplate[] = [
  {
    id: 'uk-ucas',
    name: 'UK UCAS Undergraduate 2025',
    region: 'UK',
    channel: 'UCAS',
    description: 'Standard timeline for UK university applications via UCAS.',
    events: [
      { title: 'UCAS Application Opens', startDate: '2024-09-03', type: 'Point', category: 'Application', priority: 'High', isOfficial: true, region: 'UK', channel: 'UCAS' },
      { title: 'Oxbridge / Medicine / Vet Deadline', startDate: '2024-10-15', type: 'Point', category: 'Application', priority: 'High', isOfficial: true, region: 'UK', channel: 'UCAS', tags: ['Deadline'] },
      { title: 'UCAS Equal Consideration Deadline', startDate: '2025-01-29', type: 'Point', category: 'Application', priority: 'High', isOfficial: true, region: 'UK', channel: 'UCAS', tags: ['Deadline'] },
      { title: 'UCAS Extra Opens', startDate: '2025-02-26', type: 'Point', category: 'Application', priority: 'Medium', isOfficial: true, region: 'UK', channel: 'UCAS' },
      { title: 'Decision Deadline', startDate: '2025-06-04', type: 'Point', category: 'Application', priority: 'High', isOfficial: true, region: 'UK', channel: 'UCAS' }
    ]
  },
  {
    id: 'us-commonapp',
    name: 'US Common App 2025',
    region: 'US',
    channel: 'Common App',
    description: 'General timeline for US colleges using Common App.',
    events: [
      { title: 'Common App Opens', startDate: '2024-08-01', type: 'Point', category: 'Application', priority: 'High', isOfficial: true, region: 'US', channel: 'Common App' },
      { title: 'Early Decision I / Early Action Deadline', startDate: '2024-11-01', type: 'Point', category: 'Application', priority: 'High', isOfficial: true, region: 'US', channel: 'Common App', tags: ['Deadline'] },
      { title: 'ED/EA Decisions Released', startDate: '2024-12-15', type: 'Point', category: 'Application', priority: 'High', isOfficial: true, region: 'US', channel: 'Common App' },
      { title: 'Regular Decision (RD) Deadline', startDate: '2025-01-01', type: 'Point', category: 'Application', priority: 'High', isOfficial: true, region: 'US', channel: 'Common App', tags: ['Deadline'] },
      { title: 'National College Decision Day', startDate: '2025-05-01', type: 'Point', category: 'Application', priority: 'High', isOfficial: true, region: 'US', channel: 'Common App' }
    ]
  },
  {
    id: 'hk-non-jupas',
    name: 'Hong Kong Non-JUPAS 2025',
    region: 'HK',
    channel: 'Non-JUPAS',
    description: 'Timeline for international students applying to HK universities.',
    events: [
      { title: 'Applications Open (Main Round)', startDate: '2024-09-20', type: 'Point', category: 'Application', priority: 'Medium', isOfficial: true, region: 'HK', channel: 'Non-JUPAS' },
      { title: 'Main Round Deadline', startDate: '2025-01-08', type: 'Point', category: 'Application', priority: 'High', isOfficial: true, region: 'HK', channel: 'Non-JUPAS', tags: ['Deadline'] },
      { title: 'Late Round Deadline', startDate: '2025-05-31', type: 'Point', category: 'Application', priority: 'High', isOfficial: true, region: 'HK', channel: 'Non-JUPAS', tags: ['Deadline'] }
    ]
  },
  {
    id: 'hk-jupas',
    name: 'Hong Kong JUPAS 2025',
    region: 'HK',
    channel: 'JUPAS',
    description: 'Timeline for local students applying via JUPAS.',
    events: [
      { title: 'JUPAS Account Creation', startDate: '2024-10-04', type: 'Point', category: 'Application', priority: 'High', isOfficial: true, region: 'HK', channel: 'JUPAS' },
      { title: 'Submission Deadline', startDate: '2024-12-04', type: 'Point', category: 'Application', priority: 'High', isOfficial: true, region: 'HK', channel: 'JUPAS', tags: ['Deadline'] },
      { title: 'Update Choices', startDate: '2025-05-28', type: 'Point', category: 'Application', priority: 'Medium', isOfficial: true, region: 'HK', channel: 'JUPAS' }
    ]
  },
  {
    id: 'sg-universities',
    name: 'Singapore Universities 2025',
    region: 'SG',
    channel: 'Direct',
    description: 'Timeline for NUS, NTU, SMU.',
    events: [
      { title: 'Applications Open', startDate: '2024-10-15', type: 'Point', category: 'Application', priority: 'Medium', isOfficial: true, region: 'SG', channel: 'Direct' },
      { title: 'Application Deadline', startDate: '2025-02-28', type: 'Point', category: 'Application', priority: 'High', isOfficial: true, region: 'SG', channel: 'Direct', tags: ['Deadline'] }
    ]
  },
  {
    id: 'au-universities',
    name: 'Australia Universities (Feb Intake)',
    region: 'AU',
    channel: 'Direct',
    description: 'Standard timeline for February intake in Australia.',
    events: [
      { title: 'Applications Open', startDate: '2024-04-01', type: 'Point', category: 'Application', priority: 'Medium', isOfficial: true, region: 'AU', channel: 'Direct' },
      { title: 'Application Deadline', startDate: '2024-11-30', type: 'Point', category: 'Application', priority: 'High', isOfficial: true, region: 'AU', channel: 'Direct', tags: ['Deadline'] }
    ]
  }
];

// --- Mock Data ---
export const SCHOOL_DATABASE: UniversitySchema[] = [
  { id: 'u1', name: 'Carnegie Mellon University', cnName: '卡内基梅隆', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=CMU&backgroundColor=b91c1c', rank: 22, region: 'US', tags: ['CS #1', 'STEM强'], avgGpa: 3.92, minToefl: 102, avgSat: 1560 },
  { id: 'u2', name: 'New York University', cnName: '纽约大学', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=NYU&backgroundColor=57068c', rank: 35, region: 'US', tags: ['商科强', '城市校园'], avgGpa: 3.8, minToefl: 100, avgSat: 1520 },
  { id: 'u3', name: 'Univ. of Illinois Urbana-Champaign', cnName: 'UIUC', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UIUC&backgroundColor=e84a27', rank: 35, region: 'US', tags: ['公立常春藤', '工程强'], avgGpa: 3.65, minToefl: 90, avgSat: 1440 },
  { id: 'u4', name: 'Boston University', cnName: '波士顿大学', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=BU&backgroundColor=cc0000', rank: 43, region: 'US', tags: ['传媒强', '实习多'], avgGpa: 3.7, minToefl: 95, avgSat: 1450 },
  { id: 'u5', name: 'Imperial College London', cnName: '帝国理工', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=Imperial&backgroundColor=003366', rank: 6, region: 'UK', tags: ['G5', '理工强'], avgGpa: 3.95, minToefl: 100, avgSat: 0 },
  { id: 'u6', name: 'University of Hong Kong', cnName: '香港大学', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=HKU&backgroundColor=007d57', rank: 26, region: 'HK', tags: ['亚洲Top', '金融强'], avgGpa: 3.85, minToefl: 95, avgSat: 1500 },
  { id: 'u7', name: 'Cornell University', cnName: '康奈尔大学', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=Cornell&backgroundColor=b31b1b', rank: 12, region: 'US', tags: ['藤校', '学术压强'], avgGpa: 3.95, minToefl: 105, avgSat: 1540 },
  { id: 'u8', name: 'Penn State University', cnName: '宾州州立', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=PSU&backgroundColor=001e44', rank: 60, region: 'US', tags: ['Big Ten', '公立'], avgGpa: 3.5, minToefl: 80, avgSat: 1350 },
  { id: 'u9', name: 'University of Manchester', cnName: '曼彻斯特大学', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=Man&backgroundColor=660099', rank: 27, region: 'UK', tags: ['红砖大学', '商科'], avgGpa: 3.5, minToefl: 90, avgSat: 0 },
  { id: 'u10', name: 'National University of Singapore', cnName: '新加坡国立', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=NUS&backgroundColor=ef7c00', rank: 8, region: 'SG', tags: ['亚洲第一', '工科强'], avgGpa: 3.95, minToefl: 100, avgSat: 1550 },
];

export const COMMON_MAJORS = [
  'Computer Science (计算机科学)',
  'Mathematics (数学)',
  'Economics (经济学)',
  'Psychology (心理学)',
  'Business Administration (工商管理)',
  'Electrical Engineering (电子工程)',
  'Biology (生物学)',
  'Communication (传媒)'
];

export const gapAnalysisData = [
  { subject: 'GPA', A: 3.85, B: 3.95, fullMark: 4.0 },
  { subject: 'TOEFL', A: 102, B: 110, fullMark: 120 },
  { subject: 'SAT', A: 1450, B: 1520, fullMark: 1600 },
  { subject: 'Activity', A: 85, B: 95, fullMark: 100 },
  { subject: 'Competition', A: 70, B: 90, fullMark: 100 },
  { subject: 'Leadership', A: 90, B: 85, fullMark: 100 },
];

// Initial timeline data
export const initialTimelineData: TimelineEvent[] = [
  { id: 't1', title: 'Finalize School List', startDate: '2024-09', type: 'Point', category: 'Application', status: 'Done', priority: 'High', assignee: 'Counselor', isMilestone: true, tags: ['Strategy'] },
  { id: 't2', title: 'Early Decision (ED) Application', startDate: '2024-10', endDate: '2024-11', type: 'Range', category: 'Application', status: 'In Progress', priority: 'High', assignee: 'Student', isMilestone: true, tags: ['Deadline'] },
  { id: 't3', title: 'Physics Competition Preparation', startDate: '', type: 'Range', category: 'Activity', status: 'Pending', priority: 'Medium', assignee: 'Student', isMilestone: false, tags: ['Extracurricular'] }
];
