import type { TimelineEvent } from './PlanningData';
import type { TeacherTask } from '../teacherTasks';
import type { StudentSummary } from '../../../types';

export const PLANNING_TASK_CHANGE_EVENT = 'nut-planning-task-change';
export const planningDraftKey = (studentId: string) => `nut_planning_draft_v1:${studentId}`;
export const planningTaskPrefix = (studentId: string) => `planning:${encodeURIComponent(studentId)}:`;
export const planningToday = (now = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(now);

export const planningDeadline = (event: TimelineEvent) => {
  const value = event.type === 'Range' && event.endDate ? event.endDate : event.startDate;
  // Legacy month-only milestones remain valid through the end of that month.
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-').map(Number);
    return `${value}-${new Date(Date.UTC(year, month, 0)).getUTCDate()}`;
  }
  return value;
};
export const isPlanningOverdue = (event: TimelineEvent, today = planningToday()) =>
  Boolean(planningDeadline(event) && planningDeadline(event) < today);

export const preparePlanningPublication = (
  events: TimelineEvent[], tasks: TeacherTask[], student: Pick<StudentSummary, 'id' | 'name' | 'avatarUrl'>,
  today = planningToday(),
) => {
  const prefix = planningTaskPrefix(student.id);
  const previous = new Map(tasks.filter(task => task.id.startsWith(prefix)).map(task => [task.id, task]));
  const blocked = events.filter(event => !previous.has(prefix + event.id) && isPlanningOverdue(event, today));
  const blockedIds = new Set(blocked.map(event => event.id));
  const allowed = events.filter(event => !blockedIds.has(event.id));
  const removedCount = [...previous.keys()].filter(id => !events.some(event => prefix + event.id === id)).length;
  const snapshot = (event: TimelineEvent) => JSON.stringify(Object.keys(event).filter(key => key !== 'status' && event[key as keyof TimelineEvent] !== undefined).sort().map(key => [key, event[key as keyof TimelineEvent]]));
  const synced = allowed.map(event => {
    const old = previous.get(prefix + event.id);
    return {
      ...old,
      id: prefix + event.id, title: event.title,
      studentName: student.name, studentAvatar: student.avatarUrl,
      category: '规划' as const, priority: event.priority, dueDate: planningDeadline(event),
      status: old?.status || (event.status === 'Done' ? 'Completed' as const : 'Pending' as const),
      assignee: event.assignee === 'Counselor' ? '顾问' : event.assignee === 'Parent' ? '家长' : student.name,
      description: event.description, planningSnapshot: snapshot(event), source: 'manual' as const,
    };
  });
  const changed = synced.filter(task => {
    const old = previous.get(task.id);
    if (!old) return true;
    if (old.planningSnapshot) {
      try {
        const normalized = JSON.stringify(JSON.parse(old.planningSnapshot).filter(([key, value]: [string, unknown]) => key !== 'status' && value !== null));
        return normalized !== task.planningSnapshot;
      } catch { return true; }
    }
    // Migrate previously published tasks without treating every task as a new change.
    return old.title !== task.title || old.priority !== task.priority || old.dueDate !== task.dueDate
      || old.assignee !== task.assignee || (old.description || '') !== (task.description || '');
  });
  const changedIds = new Set(changed.map(task => task.id.slice(prefix.length)));
  const pendingIds = new Set([...changedIds, ...blocked.map(event => event.id)]);
  const completedIds = new Set([...previous.values()].filter(task => task.status === 'Completed').map(task => task.id.slice(prefix.length)));
  const publishedIds = new Set([...previous.keys()].map(id => id.slice(prefix.length)));
  const pendingCount = changed.length + removedCount + blocked.length;
  return { blocked, allowed, pendingIds, completedIds, publishedIds, changedCount: changed.length, pendingCount, removedCount, tasks: [...tasks.filter(task => !task.id.startsWith(prefix)), ...synced] };
};
