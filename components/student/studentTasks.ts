import { TaskAuditEntry, TaskSource } from '../common/taskAudit';

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Pending' | 'Returned' | 'Completed' | 'Cancelled' | 'Review' | 'Overdue';
export type TaskWorkflowStatus = Exclude<TaskStatus, 'Overdue'>;
export type TaskCategory = '建档' | '规划' | '考试' | '活动' | '材料' | '面试' | '申请' | 'Offer' | '复盘' | '其他';
export type TaskAssigner = 'Teacher' | 'Student';
export type TaskVisibility = 'student' | 'teacher' | 'both';

export interface StudentTask {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  description?: string;
  assigner: TaskAssigner;
  visibility?: TaskVisibility;
  source?: TaskSource;
  auditHistory?: TaskAuditEntry[];
  completedFromStatus?: Exclude<TaskStatus, 'Completed'>;
}

export const TASK_STORAGE_KEY = 'nut_student_tasks_v1';

export const isTaskVisibleToRole = (task: StudentTask, role: 'student' | 'teacher') => {
  // Legacy system-review records are teacher workflow tasks and must fail closed
  // when they do not yet carry an explicit visibility field.
  const visibility = task.visibility || (task.source === 'system-review' ? 'teacher' : 'student');
  return visibility === 'both' || visibility === role;
};

export const isStudentVisibleTask = (task: StudentTask) => isTaskVisibleToRole(task, 'student');

export const toLocalDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalTodayStr = () => toLocalDateStr(new Date());
const getShiftedLocalDateStr = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toLocalDateStr(date);
};
export const getLocalTomorrowStr = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toLocalDateStr(date);
};

// Seed data is materialized as absolute dates at creation time. Relative display
// strings must never be persisted because reopening them later changes meaning.
export const INITIAL_STUDENT_TASKS: StudentTask[] = [
  { id: 't1', title: 'Draft Personal Statement V2', category: '申请', priority: 'High', dueDate: getShiftedLocalDateStr(0), status: 'Returned', description: 'Focus on the "Lego" metaphor intro.', assigner: 'Teacher' },
  { id: 't2', title: 'Register for December SAT', category: '考试', priority: 'High', dueDate: getShiftedLocalDateStr(1), status: 'Pending', description: 'Deadline is approaching.', assigner: 'Student' },
  { id: 't3', title: 'Upload G10 Transcript', category: '材料', priority: 'Medium', dueDate: getShiftedLocalDateStr(-1), status: 'Pending', description: 'Original scan required.', assigner: 'Teacher' },
  { id: 't4', title: 'Brainstorm "Why Major" Essay', category: '申请', priority: 'Medium', dueDate: getShiftedLocalDateStr(3), status: 'Pending', assigner: 'Teacher' },
  { id: 't5', title: 'Robotics Club Meeting Notes', category: '活动', priority: 'Low', dueDate: getShiftedLocalDateStr(7), status: 'Pending', assigner: 'Student' },
  { id: 't6', title: 'Counselor Recommendation Form', category: '材料', priority: 'High', dueDate: getShiftedLocalDateStr(-7), status: 'Completed', assigner: 'Teacher' },
];

export const resolveTaskDueDate = (dueDate: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return null;
  const parsed = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  // Reject rollover dates such as 2026-02-31 instead of silently treating them as March.
  if (toLocalDateStr(parsed) !== dueDate) return null;
  return parsed;
};

// Ambiguous legacy values such as "Today" cannot be reconstructed safely.
// Treat them as no deadline instead of silently moving the task to the load date.
export const normalizeStudentTaskDueDate = (dueDate: string) => {
  const resolved = resolveTaskDueDate(dueDate);
  return resolved ? toLocalDateStr(resolved) : '';
};

export const formatStudentTaskDueDate = (dueDate: string, isEn: boolean, now: Date = new Date()) => {
  const resolved = resolveTaskDueDate(dueDate);
  if (!resolved) return isEn ? 'No deadline' : '无截止时间';
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const offset = Math.round((resolved.getTime() - today.getTime()) / 86400000);
  if (offset === 0) return isEn ? 'Today' : '今天';
  if (offset === -1) return isEn ? 'Yesterday' : '昨天';
  if (offset === 1) return isEn ? 'Tomorrow' : '明天';
  if (offset === -7) return isEn ? 'Last Week' : '上周';
  return toLocalDateStr(resolved);
};

export const formatStudentTaskPriority = (priority: TaskPriority, isEn: boolean) => isEn
  ? priority
  : ({ High: '高', Medium: '中', Low: '低' } as Record<TaskPriority, string>)[priority];

export type StudentTaskTimingStatus = 'NO_DEADLINE' | 'OVERDUE' | 'DUE_TODAY' | 'DUE_THIS_WEEK' | 'UPCOMING';

export const getStudentTaskWorkflowStatus = (task: StudentTask): TaskWorkflowStatus =>
  task.status === 'Overdue' ? 'Pending' : task.status;

export const isStudentTaskTerminal = (task: StudentTask) => {
  const workflowStatus = getStudentTaskWorkflowStatus(task);
  return workflowStatus === 'Completed' || workflowStatus === 'Cancelled';
};

const getStudentWeekBounds = (now: Date = new Date()) => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
};

export const getStudentTaskTimingStatus = (task: StudentTask, now: Date = new Date()): StudentTaskTimingStatus => {
  const due = resolveTaskDueDate(task.dueDate);
  if (!due) return 'NO_DEADLINE';
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (due < today) return 'OVERDUE';
  if (due.getTime() === today.getTime()) return 'DUE_TODAY';
  if (due < getStudentWeekBounds(now).end) return 'DUE_THIS_WEEK';
  return 'UPCOMING';
};

export const isStudentTaskPastDue = (task: StudentTask, now: Date = new Date()) =>
  !isStudentTaskTerminal(task) && getStudentTaskTimingStatus(task, now) === 'OVERDUE';

export const isTaskDueToday = (task: StudentTask, now: Date = new Date()) => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return resolveTaskDueDate(task.dueDate)?.getTime() === today.getTime();
};

// 今日待办的唯一业务口径：今日到期且尚未完成。
// 任务中心列表与侧边栏计数必须共同使用此选择器。
export const isTodayPending = (task: StudentTask, now: Date = new Date()) =>
  isTaskDueToday(task, now) && !isStudentTaskTerminal(task);

export const isTaskDueThisWeek = (task: StudentTask, now: Date = new Date()) => {
  const due = resolveTaskDueDate(task.dueDate);
  if (!due || isStudentTaskTerminal(task)) return false;
  const { start, end } = getStudentWeekBounds(now);
  return due >= start && due < end;
};

export const getStoredStudentTasks = (): StudentTask[] => {
  try {
    const saved = localStorage.getItem(TASK_STORAGE_KEY);
    const stored = saved ? JSON.parse(saved) as StudentTask[] : INITIAL_STUDENT_TASKS;
    return stored.map(task => {
      const source = task.source || (task.status === 'Review' && task.assigner === 'Teacher' ? 'system-review' : 'manual');
      const legacyStatus = task.status as TaskStatus | 'In Progress';
      return {
        ...task,
        status: legacyStatus === 'Overdue' ? 'Pending' : legacyStatus === 'In Progress' ? 'Returned' : legacyStatus,
        dueDate: normalizeStudentTaskDueDate(task.dueDate),
        source,
        visibility: task.visibility || (source === 'system-review' ? 'teacher' : 'student'),
        auditHistory: task.auditHistory || [],
      };
    }).filter(isStudentVisibleTask);
  } catch {
    return INITIAL_STUDENT_TASKS;
  }
};
