export type DecisionStatus = 'Pending' | 'Admitted' | 'Rejected' | 'Deferred' | 'Waitlisted';
export interface DecisionHistory {
  id: string;
  result: DecisionStatus;
  date: string;
  condition?: string;
}
export interface ApplicationIdentity { school: string; major: string; round: string }
export interface Application extends ApplicationIdentity { id: string; decisions: DecisionHistory[] }
export const DUPLICATE_DECISION = '该录取状态记录已存在，请勿重复添加。';
// Prototype identity only. No country-specific application-plan assumptions.
export const applicationKey = (a: ApplicationIdentity) => JSON.stringify([a.school, a.major, a.round].map(v => v.trim().toLowerCase()));
// Same-day results: the later appended item wins. Editing does not change this order.
export const sortedDecisions = (a: Application) => a.decisions.map((d, index) => ({ d, index }))
  .sort((a, b) => b.d.date.localeCompare(a.d.date) || b.index - a.index).map(({ d }) => d);
export const currentDecision = (a: Application) => sortedDecisions(a)[0];
export function saveDecision(apps: Application[], identity: ApplicationIdentity, decision: DecisionHistory, applicationId?: string | null, decisionId?: string | null): Application[] {
  const target = applicationId ? apps.find(a => a.id === applicationId) : apps.find(a => applicationKey(a) === applicationKey(identity));
  if (applicationId && !target) throw new Error('申请已不存在，请重新打开。');
  if (apps.some(a => a.id !== target?.id && applicationKey(a) === applicationKey(identity))) throw new Error('已存在相同申请，请在该申请中添加状态。');
  if (target?.decisions.some(d => d.id !== decisionId && d.result === decision.result && d.date === decision.date)) throw new Error(DUPLICATE_DECISION);
  const clean = { school: identity.school.trim(), major: identity.major.trim(), round: identity.round.trim() };
  if (!target) return [{ ...clean, id: crypto.randomUUID(), decisions: [decision] }, ...apps];
  return apps.map(a => a.id !== target.id ? a : { ...a, ...clean, decisions: decisionId ? a.decisions.map(d => d.id === decisionId ? { ...decision, id: d.id } : d) : [...a.decisions, decision] });
}
export function deleteDecision(apps: Application[], applicationId: string, decisionId: string) {
  return apps.map(a => a.id === applicationId ? { ...a, decisions: a.decisions.filter(d => d.id !== decisionId) } : a).filter(a => a.decisions.length > 0);
}
export const demoSteps = [
  { school: 'TMU', major: 'CSE', round: 'ED1', result: 'Waitlisted', date: '2026-03-01' },
  { school: 'TMU', major: 'CSE', round: 'ED1', result: 'Admitted', date: '2026-04-15' },
  { school: 'TMU', major: 'CSE', round: 'ED1', result: 'Admitted', date: '2026-04-15' },
  { school: 'TMU', major: 'Data Science', round: 'ED1', result: 'Admitted', date: '2026-04-20' },
] satisfies (ApplicationIdentity & Omit<DecisionHistory, 'id'>)[];
