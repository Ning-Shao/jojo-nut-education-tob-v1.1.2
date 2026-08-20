
export interface StudentStat {
  label: string;
  value: number;
  color: string;
}

export interface TodoItem {
  id: string;
  title: string;
  student: string;
  due: string;
  type: 'urgent' | 'pending' | 'approval';
  status: 'pending' | 'completed';
}

export interface MilestoneData {
  name: string;
  achieved: number;
  total: number;
}

export interface RiskCategory {
  type: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
  details: string;
}

export type NavTab = '首页' | '学生管理' | '知识库' | '任务中心' | '报告中心' | '复盘报表';

// New Types for Student Module
// Updated to Phase 0-5 structure
export type StudentPhase = 
  | 'Phase 0 建档' 
  | 'Phase 1 规划' 
  | 'Phase 2 教学运营' 
  | 'Phase 3 申请' 
  | 'Phase 4 录取' 
  | 'Phase 5 复盘';

export type ApplicationStatus = '未建档' | '规划中' | '申请中' | '已Offer' | '已去向确认';
export type RiskLevel = 'high' | 'medium' | 'low' | 'none';

export interface StudentSummary {
  id: string;
  name: string;
  studentId: string;
  grade: string; // e.g., G11
  class: string;
  direction: string; // Changed from union to string to support multi-select (e.g., "US, UK")
  phase: StudentPhase;
  status: ApplicationStatus;
  targetSummary: string; // e.g., "Top 30 Arts"
  riskLevel: RiskLevel;
  riskCategories: string[]; // Added: '成绩风险' | '目标风险' | '任务风险' | '材料风险' | '沟通风险'
  riskTags: string[]; // e.g., ["GPA Drop", "Material Missing"]
  nextTask: string;
  nextTaskDue: string;
  lastContact: string;
  dataCompleteness: number; // 0-100
  avatarInitials: string;
  avatarUrl: string; // Added avatar URL
}

export type AuditMode = 'save_only' | 'risk_only' | 'language_only' | 'full';
export type AuditStatus = 'not_started' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AIReviewReport {
  auditMode?: 'risk_only' | 'language_only' | 'full';
  auditDate?: string;
  negativeContentRisk?: {
    level: 'Low' | 'Medium' | 'High';
    analysis: string;
  };
  wordingGrammar?: {
    analysis: string;
    suggestions: string[];
  };
  errorMessage?: string;
}

export interface RecommendationVersion {
  id: string;
  versionLabel: string; // e.g., v1, v2, Final
  fileName: string;
  fileSize?: string;
  content: string; // Stored as text for the demo/AI analysis
  uploadDate: string;
  auditStatus?: AuditStatus;
  auditReport?: AIReviewReport;
}

export interface RecommenderReq {
  id: string;
  name: string;
  role: string;
  status: 'Not Started' | 'Drafting' | 'Completed';
  versions: RecommendationVersion[];
}

export type DetailTab = 
  | 'BasicInfo' 
  | 'Materials'
  | 'Planning'
  | 'Essays'
  | 'Recommendations'
  | 'OfferTracking'
  | 'Communication';
