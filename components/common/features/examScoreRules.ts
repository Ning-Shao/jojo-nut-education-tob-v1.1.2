export type CalculatedExamKey = 'toefl' | 'oldToefl' | 'ielts' | 'sat' | 'act';
export type ExamSectionKey = 'reading' | 'listening' | 'speaking' | 'writing' | 'readingWriting' | 'math' | 'english' | 'science';

export interface ExamSectionRule {
  key: ExamSectionKey;
  shortLabel: string;
  label: string;
  min: number;
  max: number;
  step: number;
  optional?: boolean;
}

export const calculatedExamRules: Record<CalculatedExamKey, {
  label: string;
  totalMin: number;
  totalMax: number;
  totalStep: number;
  sections: ExamSectionRule[];
  calculate: (scores: number[]) => number;
}> = {
  oldToefl: {
    label: 'TOEFL (Before 21 January 2026)', totalMin: 0, totalMax: 120, totalStep: 1,
    sections: [
      { key: 'reading', shortLabel: 'R', label: 'Reading', min: 0, max: 30, step: 1 },
      { key: 'listening', shortLabel: 'L', label: 'Listening', min: 0, max: 30, step: 1 },
      { key: 'speaking', shortLabel: 'S', label: 'Speaking', min: 0, max: 30, step: 1 },
      { key: 'writing', shortLabel: 'W', label: 'Writing', min: 0, max: 30, step: 1 },
    ],
    calculate: scores => scores.reduce((sum, score) => sum + score, 0),
  },
  toefl: {
    label: 'TOEFL (From 21 January 2026)', totalMin: 1, totalMax: 6, totalStep: 0.5,
    sections: [
      { key: 'reading', shortLabel: 'R', label: 'Reading', min: 1, max: 6, step: 0.5 },
      { key: 'listening', shortLabel: 'L', label: 'Listening', min: 1, max: 6, step: 0.5 },
      { key: 'speaking', shortLabel: 'S', label: 'Speaking', min: 1, max: 6, step: 0.5 },
      { key: 'writing', shortLabel: 'W', label: 'Writing', min: 1, max: 6, step: 0.5 },
    ],
    calculate: scores => Math.round((scores.reduce((sum, score) => sum + score, 0) / 4) * 2) / 2,
  },
  ielts: {
    label: 'IELTS', totalMin: 0, totalMax: 9, totalStep: 0.5,
    sections: [
      { key: 'listening', shortLabel: 'L', label: 'Listening', min: 0, max: 9, step: 0.5 },
      { key: 'reading', shortLabel: 'R', label: 'Reading', min: 0, max: 9, step: 0.5 },
      { key: 'writing', shortLabel: 'W', label: 'Writing', min: 0, max: 9, step: 0.5 },
      { key: 'speaking', shortLabel: 'S', label: 'Speaking', min: 0, max: 9, step: 0.5 },
    ],
    calculate: scores => Math.round((scores.reduce((sum, score) => sum + score, 0) / 4) * 2) / 2,
  },
  sat: {
    label: 'SAT', totalMin: 400, totalMax: 1600, totalStep: 10,
    sections: [
      { key: 'readingWriting', shortLabel: 'R&W', label: 'Reading and Writing', min: 200, max: 800, step: 10 },
      { key: 'math', shortLabel: 'Math', label: 'Math', min: 200, max: 800, step: 10 },
    ],
    calculate: scores => scores[0] + scores[1],
  },
  act: {
    label: 'ACT', totalMin: 1, totalMax: 36, totalStep: 1,
    sections: [
      { key: 'english', shortLabel: 'E', label: 'English', min: 1, max: 36, step: 1 },
      { key: 'math', shortLabel: 'M', label: 'Math', min: 1, max: 36, step: 1 },
      { key: 'reading', shortLabel: 'R', label: 'Reading', min: 1, max: 36, step: 1 },
      { key: 'science', shortLabel: 'S*', label: 'Science (optional)', min: 1, max: 36, step: 1, optional: true },
    ],
    calculate: scores => Math.round((scores[0] + scores[1] + scores[2]) / 3),
  },
};

export type ExamSectionDrafts = Partial<Record<ExamSectionKey, string>>;

export const isValidSectionScore = (raw: string, rule: ExamSectionRule) => {
  if (!/^\d+(?:\.\d+)?$/.test(raw)) return false;
  const value = Number(raw);
  const stepUnits = (value - rule.min) / rule.step;
  return value >= rule.min && value <= rule.max && Math.abs(stepUnits - Math.round(stepUnits)) < 1e-8;
};

export const calculateExamTotal = (key: CalculatedExamKey, drafts: ExamSectionDrafts): number | null => {
  const rule = calculatedExamRules[key];
  const required = rule.sections.filter(section => !section.optional);
  if (!required.every(section => isValidSectionScore(drafts[section.key] ?? '', section))) return null;
  const invalidOptional = rule.sections.some(section => section.optional && (drafts[section.key] ?? '') !== '' && !isValidSectionScore(drafts[section.key] ?? '', section));
  if (invalidOptional) return null;
  return rule.calculate(required.map(section => Number(drafts[section.key])));
};

export const emptyCalculatedExamSections = (): Record<CalculatedExamKey, ExamSectionDrafts> => ({
  toefl: {}, oldToefl: {}, ielts: {}, sat: {}, act: {},
});
