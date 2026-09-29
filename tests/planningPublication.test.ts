import { describe, expect, it } from 'vitest';
import { preparePlanningPublication, planningToday, planningDeadline } from '../components/teacher/planning/planningPublication';
import type { TimelineEvent } from '../components/teacher/planning/PlanningData';
const student = { id: 'one', name: 'One', avatarUrl: '' };
const event = (id: string, startDate: string): TimelineEvent => ({ id, startDate, title: id, category: 'Other', status: 'Pending', priority: 'Medium', assignee: 'Student', isMilestone: true, type: 'Point' });
describe('planning publication', () => {
  it('skips only new overdue tasks and accepts today', () => {
    const result = preparePlanningPublication([event('old', '2026-09-28'), event('today', '2026-09-29')], [], student, '2026-09-29');
    expect(result.blocked.map(e => e.id)).toEqual(['old']);
    expect(result.tasks.map(t => t.title)).toEqual(['today']);
  });
  it('keeps existing overdue tasks and their workflow status, without duplicate publication', () => {
    const first = preparePlanningPublication([event('task', '2026-09-29')], [], student, '2026-09-29');
    first.tasks[0].status = 'Review';
    const second = preparePlanningPublication([event('task', '2026-09-29')], first.tasks, student, '2026-09-30');
    expect(second.blocked).toHaveLength(0);
    expect(second.tasks).toHaveLength(1);
    expect(second.tasks[0].status).toBe('Review');
  });
  it('deletes the final published task but leaves other students intact', () => {
    const first = preparePlanningPublication([event('task', '2026-10-01')], [], student, '2026-09-29');
    const other = preparePlanningPublication([event('task', '2026-10-01')], first.tasks, { ...student, id: 'two' }, '2026-09-29');
    const result = preparePlanningPublication([], other.tasks, student, '2026-09-29');
    expect(result.removedCount).toBe(1);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].id).toContain('planning:two:');
  });
  it('can retry a skipped task after its deadline is corrected', () => {
    const first = preparePlanningPublication([event('task', '2026-09-28')], [], student, '2026-09-29');
    expect(first.tasks).toHaveLength(0);
    expect(preparePlanningPublication([event('task', '2026-10-01')], first.tasks, student, '2026-09-29').tasks).toHaveLength(1);
  });
  it('counts only pending changes and resets after publishing, including deletions', () => {
    const events = [event('one', '2026-10-01'), event('two', '2026-10-02')];
    const first = preparePlanningPublication(events, [], student, '2026-09-29');
    expect(first.pendingCount).toBe(2);
    expect(preparePlanningPublication(events, first.tasks, student, '2026-09-29').pendingCount).toBe(0);
    const edited = [{ ...events[0], title: 'Changed' }];
    const next = preparePlanningPublication(edited, first.tasks, student, '2026-09-29');
    expect(next.pendingCount).toBe(2);
    expect(next.changedCount).toBe(1);
    expect(next.removedCount).toBe(1);
    expect(preparePlanningPublication(edited, next.tasks, student, '2026-09-29').pendingCount).toBe(0);
  });
  it('blocks overdue official and custom tasks equally', () => {
    const events = [{ ...event('official', '2026-09-01'), isOfficial: true }, event('custom', '2026-09-01')];
    const first = preparePlanningPublication(events, [], student, '2026-09-29');
    expect(first.changedCount).toBe(0);
    const next = preparePlanningPublication(events, first.tasks, student, '2026-09-29');
    expect(next.pendingCount).toBe(2);
    expect(next.changedCount).toBe(0);
    expect(next.blocked.map(e => e.id)).toEqual(['official', 'custom']);
  });
  it('uses Shanghai midnight, range end dates, and legacy month end', () => {
    expect(planningToday(new Date('2026-09-28T16:00:00Z'))).toBe('2026-09-29');
    expect(planningDeadline(event('month', '2026-09'))).toBe('2026-09-30');
    expect(planningDeadline({ ...event('range', '2026-09-01'), type: 'Range', endDate: '2026-10-01' })).toBe('2026-10-01');
  });
});

it('completion flows back without creating pending changes', () => {
  const events = [event('task', '2026-10-01')];
  const first = preparePlanningPublication(events, [], student, '2026-09-29');
  first.tasks[0].status = 'Completed';
  const next = preparePlanningPublication(events, first.tasks, student, '2026-10-02');
  expect(next.pendingCount).toBe(0);
  expect(next.completedIds.has('task')).toBe(true);
});
it('reverting an edit and deleting an unpublished task create no changes', () => {
  const events = [event('task', '2026-10-01')];
  const first = preparePlanningPublication(events, [], student, '2026-09-29');
  expect(preparePlanningPublication([{...events[0], title:'edited'}], first.tasks, student).pendingCount).toBe(1);
  expect(preparePlanningPublication(events, first.tasks, student).pendingCount).toBe(0);
  expect(preparePlanningPublication([], [], student).pendingCount).toBe(0);
});
