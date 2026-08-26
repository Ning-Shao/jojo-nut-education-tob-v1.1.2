import { describe, expect, it } from 'vitest';
import {
  getStudentTaskTimingStatus,
  isStudentTaskPastDue,
  isStudentTaskTerminal,
  isTaskDueThisWeek,
  isTodayPending,
  normalizeStudentTaskDueDate,
  StudentTask,
} from '../components/student/studentTasks';
import {
  formatTeacherTaskTitle,
  getTeacherTaskTimingStatus,
  isTeacherOverdueTodo,
  isTeacherReviewTodo,
  isTeacherTaskDueThisWeek,
  isTeacherTaskTerminal,
  isTeacherTodayTodo,
  normalizeTeacherTaskDueDate,
  reconcileReviewTasks,
  TeacherTask,
} from '../components/teacher/teacherTasks';
import { TASK_CENTER_FIXED_CASES, TASK_CENTER_REFERENCE_NOW, TaskCenterFixedCase } from './fixtures/taskCenterFixedCases';

const toStudentTask = (testCase: TaskCenterFixedCase): StudentTask => ({
  id: testCase.caseId,
  title: testCase.title,
  category: testCase.category,
  priority: testCase.priority,
  dueDate: testCase.dueDate,
  status: testCase.workflowStatus,
  assigner: 'Teacher',
  visibility: 'both',
});

const toTeacherTask = (testCase: TaskCenterFixedCase): TeacherTask => ({
  id: testCase.caseId,
  title: testCase.title,
  studentName: testCase.studentName,
  studentAvatar: '',
  category: testCase.category,
  priority: testCase.priority,
  dueDate: testCase.dueDate,
  status: testCase.workflowStatus,
  assignee: 'Sarah',
});

describe('任务中心固定业务用例（学生端）', () => {
  it.each(TASK_CENTER_FIXED_CASES)('$caseId $title', testCase => {
    const task = toStudentTask(testCase);
    const terminal = isStudentTaskTerminal(task);
    expect(terminal).toBe(testCase.workflowStatus === 'Completed' || testCase.workflowStatus === 'Cancelled');
    if (!terminal) expect(getStudentTaskTimingStatus(task, TASK_CENTER_REFERENCE_NOW)).toBe(testCase.expectedTimingStatus);
    expect(isTodayPending(task, TASK_CENTER_REFERENCE_NOW)).toBe(testCase.expectedViews.today);
    expect(isTaskDueThisWeek(task, TASK_CENTER_REFERENCE_NOW)).toBe(testCase.expectedViews.week);
    expect(isStudentTaskPastDue(task, TASK_CENTER_REFERENCE_NOW)).toBe(testCase.expectedViews.overdue);
    expect(task.status === 'Review').toBe(testCase.expectedViews.review);
    expect(task.status === 'Completed').toBe(testCase.expectedViews.completed);
  });
});

describe('任务中心固定业务用例（老师端）', () => {
  it.each(TASK_CENTER_FIXED_CASES)('$caseId $title', testCase => {
    const task = toTeacherTask(testCase);
    const terminal = isTeacherTaskTerminal(task);
    expect(terminal).toBe(testCase.workflowStatus === 'Completed' || testCase.workflowStatus === 'Cancelled');
    if (!terminal) expect(getTeacherTaskTimingStatus(task, TASK_CENTER_REFERENCE_NOW)).toBe(testCase.expectedTimingStatus);
    expect(isTeacherTodayTodo(task, TASK_CENTER_REFERENCE_NOW)).toBe(testCase.expectedViews.today);
    expect(isTeacherTaskDueThisWeek(task, TASK_CENTER_REFERENCE_NOW)).toBe(testCase.expectedViews.week);
    expect(isTeacherOverdueTodo(task, TASK_CENTER_REFERENCE_NOW)).toBe(testCase.expectedViews.overdue);
    expect(isTeacherReviewTodo(task)).toBe(testCase.expectedViews.review);
    expect(task.status === 'Completed').toBe(testCase.expectedViews.completed);
  });
});

describe('测试数据完整性', () => {
  it('至少包含20条固定用例且覆盖全部流程状态和时效状态', () => {
    expect(TASK_CENTER_FIXED_CASES.length).toBeGreaterThanOrEqual(20);
    expect(new Set(TASK_CENTER_FIXED_CASES.map(item => item.workflowStatus))).toEqual(
      new Set(['Pending', 'Review', 'Returned', 'Completed', 'Cancelled']),
    );
    expect(new Set(TASK_CENTER_FIXED_CASES.map(item => item.expectedTimingStatus))).toEqual(
      new Set(['NO_DEADLINE', 'INVALID_DATE', 'OVERDUE', 'DUE_TODAY', 'DUE_THIS_WEEK', 'UPCOMING', 'TERMINAL']),
    );
  });

  it('非法日期在刷新归一化后仍保留，不能被静默改成无DDL', () => {
    expect(normalizeStudentTaskDueDate('2026-02-31')).toBe('2026-02-31');
    expect(normalizeTeacherTaskDueDate('2026-02-31')).toBe('2026-02-31');
  });

  it('无法还原的历史相对日期不按打开页面当天转换', () => {
    expect(normalizeStudentTaskDueDate('Today')).toBe('');
    expect(normalizeTeacherTaskDueDate('Today')).toBe('');
  });

  it('本地验收审核任务在刷新重载后保留原始截止日期', () => {
    const acceptanceReview = {
      ...toTeacherTask(TASK_CENTER_FIXED_CASES.find(item => item.caseId === 'TC-006')!),
      source: 'acceptance-test' as const,
      sourceEventId: 'acceptance-event-TC-006',
      createdBy: 'acceptance-fixture',
      createdAt: '2026-08-26T09:00:00+08:00',
    };
    expect(reconcileReviewTasks([acceptanceReview], [])[0].dueDate).toBe('2026-08-26');
  });

  it('老师端不展示技术任务ID，但底层ID保持不变', () => {
    const task = { ...toTeacherTask(TASK_CENTER_FIXED_CASES[2]), id: 'acceptance-TC-003', title: '[TC-003] 审核昨日提交的活动记录' };
    expect(formatTeacherTaskTitle(task, false)).toBe('审核昨日提交的活动记录');
    expect(task.id).toBe('acceptance-TC-003');
  });
});
