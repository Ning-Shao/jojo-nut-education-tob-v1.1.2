export type TaskActorRole = 'teacher' | 'student';

export interface TaskFieldChange {
  field: string;
  before: string;
  after: string;
}

export interface TaskAuditEntry {
  id: string;
  actorName: string;
  actorRole: TaskActorRole;
  changedAt: string;
  changes: TaskFieldChange[];
}

export type TaskSource = 'manual' | 'system-review';

export const createTaskAuditEntry = (
  actorName: string,
  actorRole: TaskActorRole,
  changes: TaskFieldChange[],
): TaskAuditEntry => ({
  id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  actorName,
  actorRole,
  changedAt: new Date().toISOString(),
  changes,
});
