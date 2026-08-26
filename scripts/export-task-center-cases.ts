import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TASK_CENTER_FIXED_CASES } from '../tests/fixtures/taskCenterFixedCases';

const outputDir = resolve(process.cwd(), 'docs');
mkdirSync(outputDir, { recursive: true });

const rows = TASK_CENTER_FIXED_CASES.map(item => ({
  caseId: item.caseId,
  title: item.title,
  studentName: item.studentName,
  category: item.category,
  priority: item.priority,
  dueDate: item.dueDate,
  workflowStatus: item.workflowStatus,
  expectedTimingStatus: item.expectedTimingStatus,
  expectedStatusLabel: item.expectedStatusLabel,
  viewToday: item.expectedViews.today,
  viewWeek: item.expectedViews.week,
  viewOverdue: item.expectedViews.overdue,
  viewReview: item.expectedViews.review,
  viewCompleted: item.expectedViews.completed,
  viewAll: item.expectedViews.all,
  note: item.note,
}));

writeFileSync(
  resolve(outputDir, 'task-center-fixed-cases.json'),
  `${JSON.stringify({ referenceNow: '2026-08-26T12:00:00+08:00', timezone: 'Asia/Shanghai', cases: rows }, null, 2)}\n`,
  'utf8',
);

console.log(`Exported ${rows.length} fixed task cases to docs/task-center-fixed-cases.json`);
