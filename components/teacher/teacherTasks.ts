import { TaskAuditEntry, TaskSource } from '../common/taskAudit';
import { StudentReviewEvent } from '../../services/studentReviewEvents';
import { TASK_CENTER_FIXED_CASES } from '../../tests/fixtures/taskCenterFixedCases';

export type TeacherTaskPriority = 'High' | 'Medium' | 'Low';
export type TeacherTaskStatus = 'Pending' | 'Returned' | 'Completed' | 'Cancelled' | 'Review' | 'Overdue';
export type TeacherTaskWorkflowStatus = Exclude<TeacherTaskStatus, 'Overdue'>;
export type TeacherTaskCategory = '建档' | '规划' | '考试' | '活动' | '材料' | '面试' | '申请' | 'Offer' | '复盘' | '其他';

export interface TeacherTask {
  id: string;
  title: string;
  studentName: string;
  studentAvatar: string;
  category: TeacherTaskCategory;
  priority: TeacherTaskPriority;
  dueDate: string;
  status: TeacherTaskStatus;
  assignee: string;
  description?: string;
  source?: TaskSource;
  auditHistory?: TaskAuditEntry[];
  sourceEventId?: string;
  createdBy?: string;
  createdAt?: string;
  reviewDeadlineAt?: string | null;
  reviewEntityType?: StudentReviewEvent['entityType'];
  reviewSubject?: string;
  reviewEventType?: StudentReviewEvent['type'];
  reviewEntityId?: string;
  completedFromStatus?: Exclude<TeacherTaskStatus, 'Completed'>;
}

export const TEACHER_TASK_STORAGE_KEY = 'nut_teacher_tasks_v1';
export const TEACHER_ACCEPTANCE_DATA_VERSION_KEY = 'nut_teacher_acceptance_data_version';
export const TEACHER_ACCEPTANCE_DATA_VERSION = 'task-center-24-v1';

export const createTeacherAcceptanceTasks = (): TeacherTask[] => TASK_CENTER_FIXED_CASES.map(testCase => ({
  id: `acceptance-${testCase.caseId}`,
  title: testCase.title,
  studentName: testCase.studentName,
  studentAvatar: `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(testCase.studentName)}`,
  category: testCase.category,
  priority: testCase.priority,
  dueDate: testCase.dueDate,
  status: testCase.workflowStatus,
  assignee: 'Sarah',
  description: testCase.note,
  source: 'acceptance-test',
  sourceEventId: testCase.workflowStatus === 'Review' ? `acceptance-event-${testCase.caseId}` : undefined,
  createdBy: 'acceptance-fixture',
  createdAt: '2026-08-26T09:00:00+08:00',
  auditHistory: [],
}));

// 审核 SLA 的唯一配置。null 表示该业务无自动截止时间，不能因跨日自动逾期。
export const REVIEW_TASK_SLA_HOURS: Record<StudentReviewEvent['entityType'], number | null> = {
  essay: 24,
  'profile-change': 48,
  material: null,
  activity: null,
  task: null,
};

export const formatReviewTaskSubject = (
  subject: string,
  entityType: StudentReviewEvent['entityType'],
  locale: 'zh-CN' | 'en-US' = 'zh-CN',
) => {
  const trimmed = subject.trim();
  if (entityType !== 'activity') return trimmed;
  if (locale === 'en-US') {
    const base = trimmed.replace(/(?:^|\s)(?:activity|activities)(?:\s+(?:activity|activities))*$/i, '').trim();
    return base ? `${base} Activity` : 'Activity';
  }
  const base = trimmed.replace(/(?:活动)+$/u, '').trim();
  return base ? `${base}活动` : '活动';
};

export const formatReviewTaskTitle = (
  event: Pick<StudentReviewEvent, 'studentName' | 'subject' | 'entityType' | 'locale'>,
) => {
  const locale = event.locale || 'zh-CN';
  const subject = formatReviewTaskSubject(event.subject, event.entityType, locale);
  return locale === 'en-US'
    ? `Review ${event.studentName}'s ${subject}`
    : `审核 ${event.studentName} 的${subject}`;
};

export const formatTeacherTaskTitle = (task: TeacherTask, isEn: boolean): string => {
  if (task.source !== 'system-review' || !task.reviewEntityType || !task.reviewSubject) {
    // Older acceptance data embedded its technical case ID in the visible
    // title. Keep IDs in task.id/source fields, never in user-facing copy.
    return task.title.replace(/^\s*\[TC-\d+\]\s*/i, '');
  }
  return formatReviewTaskTitle({
    studentName: task.studentName,
    subject: task.reviewSubject,
    entityType: task.reviewEntityType,
    locale: isEn ? 'en-US' : 'zh-CN',
  });
};

export const formatTeacherTaskDescription = (task: TeacherTask, isEn: boolean): string | undefined => {
  const legacySystemDescriptions = new Set([
    '提交审阅',
    'Submitted for review',
    '修改后重新提交',
    'Resubmitted after revision',
    '学生提交，请处理。',
    '学生拒绝，请处理。',
  ]);
  if (task.description && !legacySystemDescriptions.has(task.description.trim())) return task.description;
  if (task.source !== 'system-review' || !task.reviewEventType) return undefined;
  if (isEn) return task.reviewEventType === 'student.rejected'
    ? 'The student rejected the change. Please review it.'
    : 'The student submitted this item. Please review it.';
  return task.reviewEventType === 'student.rejected'
    ? '学生拒绝了该变更，请审核处理。'
    : '学生已提交该内容，请审核处理。';
};

export const getStoredTeacherTasks = (): TeacherTask[] => {
  try {
    if (import.meta.env.DEV && localStorage.getItem(TEACHER_ACCEPTANCE_DATA_VERSION_KEY) !== TEACHER_ACCEPTANCE_DATA_VERSION) {
      const acceptanceTasks = createTeacherAcceptanceTasks();
      localStorage.setItem(TEACHER_ACCEPTANCE_DATA_VERSION_KEY, TEACHER_ACCEPTANCE_DATA_VERSION);
      localStorage.setItem(TEACHER_TASK_STORAGE_KEY, JSON.stringify(acceptanceTasks));
      return acceptanceTasks;
    }
    const saved = localStorage.getItem(TEACHER_TASK_STORAGE_KEY);
    const stored = saved ? JSON.parse(saved) as TeacherTask[] : INITIAL_TEACHER_TASKS;
    return stored.filter(task => task.status !== 'Review' || task.source === 'acceptance-test' || Boolean(task.sourceEventId && task.createdBy && task.createdAt)).map(task => ({
      ...task,
      status: task.status === 'Overdue' ? 'Pending' : task.status,
      dueDate: normalizeTeacherTaskDueDate(task.dueDate),
      source: task.source || (task.status === 'Review' ? 'system-review' : 'manual'),
      auditHistory: task.auditHistory || [],
    }));
  } catch {
    return INITIAL_TEACHER_TASKS;
  }
};

export const createReviewTaskFromEvent = (
  event: StudentReviewEvent,
  existingTasks: TeacherTask[],
): TeacherTask | null => {
  if (!event.id || !event.createdBy || !event.createdAt) return null;
  if (existingTasks.some(task => task.sourceEventId === event.id)) return null;
  const createdAt = new Date(event.createdAt);
  const configuredSlaHours = event.slaHours === undefined ? REVIEW_TASK_SLA_HOURS[event.entityType] : event.slaHours;
  const deadlineFromSla = Number.isFinite(configuredSlaHours) && (configuredSlaHours as number) > 0 && !Number.isNaN(createdAt.getTime())
    ? new Date(createdAt.getTime() + (configuredSlaHours as number) * 60 * 60 * 1000).toISOString()
    : null;
  const reviewDeadlineAt = event.deadlineAt || deadlineFromSla;
  return {
    id: `review-${event.id}`,
    title: formatReviewTaskTitle(event),
    description: event.description,
    studentName: event.studentName,
    studentAvatar: event.studentAvatar || '',
    category: event.entityType === 'task' ? (event.taskCategory || '其他') : event.entityType === 'activity' ? '活动' : event.entityType === 'essay' ? '材料' : event.entityType === 'profile-change' ? '建档' : '材料',
    priority: 'High',
    dueDate: reviewDeadlineAt ? reviewDeadlineAt.slice(0, 10) : 'No deadline',
    status: 'Review',
    assignee: 'Sarah',
    source: 'system-review',
    sourceEventId: event.id,
    createdBy: event.createdBy,
    createdAt: event.createdAt,
    reviewDeadlineAt,
    reviewEntityType: event.entityType,
    reviewSubject: event.subject,
    reviewEventType: event.type,
    reviewEntityId: event.entityId,
    auditHistory: [],
  };
};

export const reconcileReviewTasks = (
  tasks: TeacherTask[],
  events: StudentReviewEvent[],
): TeacherTask[] => events.reduce((current, event) => {
  const generated = createReviewTaskFromEvent(event, current);
  return generated ? [generated, ...current] : current;
}, tasks.filter(task => task.status !== 'Review' || task.source === 'acceptance-test' || Boolean(task.sourceEventId && task.createdBy && task.createdAt)).map(task => {
  if (task.source === 'acceptance-test') return task;
  if (task.status !== 'Review' || !task.sourceEventId) return task;
  const sourceEvent = events.find(event => event.id === task.sourceEventId);
  if (!sourceEvent) return { ...task, dueDate: 'No deadline', reviewDeadlineAt: null };
  const reviewMetadata = {
    reviewEntityType: sourceEvent.entityType,
    reviewSubject: sourceEvent.subject,
    reviewEventType: sourceEvent.type,
    reviewEntityId: sourceEvent.entityId,
  };
  if (task.reviewDeadlineAt !== undefined) return { ...task, ...reviewMetadata };
  const regenerated = createReviewTaskFromEvent(sourceEvent, tasks.filter(existing => existing.id !== task.id));
  return regenerated
    ? { ...task, ...reviewMetadata, dueDate: regenerated.dueDate, reviewDeadlineAt: regenerated.reviewDeadlineAt }
    : { ...task, ...reviewMetadata };
}));

export const resolveTeacherReviewDeadline = (dueDate: string, now: Date = new Date()): string | null => {
  if (!dueDate.trim() || dueDate === 'No deadline') return null;
  const parsed = new Date(`${dueDate}T23:59:59.999`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

// 流程状态与时效状态是两个独立维度。历史 Overdue 值只迁移为 Pending，
// 不能再覆盖 Review 等真实流程状态。
export const getTeacherTaskEffectiveStatus = (
  task: TeacherTask,
  _now: Date = new Date(),
): TeacherTaskWorkflowStatus => task.status === 'Overdue' ? 'Pending' : task.status;

export const isTeacherTaskTerminal = (task: TeacherTask) => {
  const workflowStatus = getTeacherTaskEffectiveStatus(task);
  return workflowStatus === 'Completed' || workflowStatus === 'Cancelled';
};

const getLocalToday = (now: Date = new Date()) => {
  const date = new Date(now);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getShiftedTeacherDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return getLocalToday(date);
};

// Seed data uses absolute dates from the moment it is created. Persisted task
// dates must not depend on when the application is opened later.
export const INITIAL_TEACHER_TASKS: TeacherTask[] = [
  { id: 't3', title: '确认 Emily 的 RISD 作品集提交状态', description: '申请截止日期临近', studentName: 'Emily Zhang', studentAvatar: 'https://api.dicebear.com/7.x/micah/svg?seed=Emily&backgroundColor=ffd5dc', category: '申请', priority: 'High', dueDate: getShiftedTeacherDate(0), status: 'Pending', assignee: 'Sarah' },
  { id: 't5', title: '跟进 James Wang 的标化成绩', description: '上次模考成绩未达标', studentName: 'James Wang', studentAvatar: 'https://api.dicebear.com/7.x/micah/svg?seed=James&backgroundColor=b6e3f4', category: '考试', priority: 'Medium', dueDate: getShiftedTeacherDate(-1), status: 'Pending', assignee: 'Sarah' },
  { id: 't6', title: '更新 G12 申请状态汇总表', description: '每周例行更新', studentName: 'Grade 12 Group', studentAvatar: '', category: '规划', priority: 'Medium', dueDate: getShiftedTeacherDate(1), status: 'Pending', assignee: 'Sarah' },
];

export const resolveTeacherTaskDueDate = (dueDate: string, _now: Date = new Date()): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return null;
  const parsed = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  // Reject rollover dates such as 2026-02-31.
  if (getLocalToday(parsed) !== dueDate) return null;
  return parsed;
};

// Ambiguous legacy values such as "Today" cannot be reconstructed safely.
// Treat them as no deadline instead of silently moving the task to the load date.
export const normalizeTeacherTaskDueDate = (dueDate: string, now: Date = new Date()) => {
  const resolved = resolveTeacherTaskDueDate(dueDate, now);
  if (resolved) return getLocalToday(resolved);
  if (!dueDate.trim() || dueDate === 'No deadline') return '';
  if (['Today', 'Yesterday', 'Tomorrow', 'Tmrw', 'Last Week'].includes(dueDate)) return '';
  return dueDate;
};

export const formatTeacherTaskDueDate = (dueDate: string, isEn: boolean, now: Date = new Date()) => {
  const resolved = resolveTeacherTaskDueDate(dueDate, now);
  if (!dueDate.trim() || dueDate === 'No deadline') return isEn ? 'No deadline' : '无截止时间';
  if (!resolved) return isEn ? 'Invalid date' : '日期异常';
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const offset = Math.round((resolved.getTime() - today.getTime()) / 86400000);
  if (offset === 0) return isEn ? 'Today' : '今天';
  if (offset === -1) return isEn ? 'Yesterday' : '昨天';
  if (offset === 1) return isEn ? 'Tomorrow' : '明天';
  if (offset === -7) return isEn ? 'Last Week' : '上周';
  return getLocalToday(resolved);
};

export const formatTeacherTaskPriority = (priority: TeacherTaskPriority, isEn: boolean) => isEn
  ? priority
  : ({ High: '高', Medium: '中', Low: '低' } as Record<TeacherTaskPriority, string>)[priority];

export type TeacherTaskTimingStatus = 'NO_DEADLINE' | 'INVALID_DATE' | 'OVERDUE' | 'DUE_TODAY' | 'DUE_THIS_WEEK' | 'UPCOMING';

const getTeacherWeekBounds = (now: Date = new Date()) => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
};

export const getTeacherTaskTimingStatus = (task: TeacherTask, now: Date = new Date()): TeacherTaskTimingStatus => {
  const due = resolveTeacherTaskDueDate(task.dueDate, now);
  if (!task.dueDate.trim() || task.dueDate === 'No deadline') return 'NO_DEADLINE';
  if (!due) return 'INVALID_DATE';
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (due < today) return 'OVERDUE';
  if (due.getTime() === today.getTime()) return 'DUE_TODAY';
  if (due < getTeacherWeekBounds(now).end) return 'DUE_THIS_WEEK';
  return 'UPCOMING';
};

// “本周任务”的唯一口径：本周一（含）至下周一（不含），并排除已完成和无效日期任务。
export const isTeacherTaskDueThisWeek = (task: TeacherTask, now: Date = new Date()) => {
  if (isTeacherTaskTerminal(task)) return false;
  const due = resolveTeacherTaskDueDate(task.dueDate, now);
  if (!due) return false;
  const { start, end } = getTeacherWeekBounds(now);
  return due >= start && due < end;
};

export const isTeacherTodayTodo = (task: TeacherTask, now: Date = new Date()) =>
  resolveTeacherTaskDueDate(task.dueDate, now)?.getTime() === new Date(new Date(now).setHours(0, 0, 0, 0)).getTime() &&
  !isTeacherTaskTerminal(task);

export const isTeacherOverdueTodo = (task: TeacherTask, now: Date = new Date()) =>
  !isTeacherTaskTerminal(task) && getTeacherTaskTimingStatus(task, now) === 'OVERDUE';

// “待审批”是流程状态视图，不能被逾期这一时间维度覆盖。
// 已逾期且仍待审批的任务应同时出现在“已逾期”和“待审批”两个视图中。
export const isTeacherReviewTodo = (task: TeacherTask) => task.status === 'Review';
