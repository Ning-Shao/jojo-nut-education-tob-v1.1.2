import React, { useMemo, useState } from 'react';

type Tier = 'Safety' | 'Match' | 'Reach';

const tierStyles: Record<Tier, string> = {
  Safety: 'border-green-200 bg-green-50 text-green-700',
  Match: 'border-blue-200 bg-blue-50 text-blue-700',
  Reach: 'border-red-200 bg-red-50 text-red-700',
};

const gradeRank: Record<string, number> = { 'A*': 5, A: 4, B: 3, C: 2, D: 1, E: 0 };

const parseGradeCombination = (value: string) => {
  const normalized = value.toUpperCase().replace(/\s/g, '');
  const grades = normalized.match(/A\*|[A-E]/g) || [];
  return grades.join('') === normalized ? grades.sort((a, b) => gradeRank[b] - gradeRank[a]) : null;
};

const describeGradeGap = (studentValue: string, targetValue: string) => {
  const student = parseGradeCombination(studentValue);
  const target = parseGradeCombination(targetValue);
  if (!student || !target || student.length !== target.length) return '-';

  const changes = target.flatMap((targetGrade, index) => {
    const studentGrade = student[index];
    return gradeRank[studentGrade] < gradeRank[targetGrade] ? [`${studentGrade}→${targetGrade}`] : [];
  });
  if (changes.length === 0) return '已达到';

  const counts = new Map<string, number>();
  changes.forEach(change => counts.set(change, (counts.get(change) || 0) + 1));
  return Array.from(counts.entries()).map(([change, count]) => `${count} 门 ${change}`).join('、');
};

type RequirementEntry = { value: string; school: string };

const baseRows: Array<{
  tier: Tier;
  grades: RequirementEntry[];
  aggregates: RequirementEntry[];
  tariffs: RequirementEntry[];
  others: RequirementEntry[];
}> = [
  {
    tier: 'Safety' as Tier,
    grades: [
      { value: 'BBC', school: 'University of Manchester' },
      { value: 'BCC', school: 'University of Kent' },
    ],
    aggregates: [
      { value: '11 / 15', school: 'Monash University' },
      { value: '12 / 15', school: 'University of Adelaide' },
    ],
    tariffs: [
      { value: '112', school: 'University of Portsmouth' },
      { value: '120', school: 'Nottingham Trent University' },
    ],
    others: [
      { value: '至少 4 门 A-Level', school: 'National University of Singapore' },
      { value: '3 门 A-Level + 指定科目', school: 'The University of Hong Kong' },
    ],
  },
  {
    tier: 'Match' as Tier,
    grades: [
      { value: 'BBB', school: 'University of Manchester' },
      { value: 'ABB', school: 'University of Birmingham' },
    ],
    aggregates: [
      { value: '12 / 15', school: 'Monash University' },
      { value: '14 / 15', school: 'UNSW Sydney' },
    ],
    tariffs: [
      { value: '120', school: 'Oxford Brookes University' },
      { value: '128', school: 'University of Sussex' },
    ],
    others: [
      { value: '4 门良好成绩，关注内容型科目', school: 'Nanyang Technological University' },
      { value: '至少 3 门 A-Level，专业科目匹配', school: 'The Chinese University of Hong Kong' },
    ],
  },
  {
    tier: 'Reach' as Tier,
    grades: [
      { value: 'A*AA', school: 'University of Oxford' },
      { value: 'AAA', school: 'Imperial College London' },
    ],
    aggregates: [
      { value: '15 / 15', school: 'University of Melbourne' },
      { value: '16 / 18', school: 'Australian National University' },
    ],
    tariffs: [
      { value: '152', school: 'University of Bristol' },
      { value: '160', school: 'University of Warwick' },
    ],
    others: [
      { value: '4 门强成绩 + 专业科目匹配', school: 'The University of Hong Kong' },
      { value: '3 门高等级成绩 + 指定科目', school: 'The Hong Kong University of Science and Technology' },
    ],
  },
];

const HoverSchoolValue: React.FC<{
  value: string;
  schools: string[];
  gap: string;
  tooltipId: string;
  className?: string;
  placement?: 'top' | 'bottom';
}> = ({ value, schools, gap, tooltipId, className = '', placement = 'bottom' }) => (
  <span
    tabIndex={0}
    aria-describedby={tooltipId}
    className={`group relative inline-flex cursor-help items-center gap-1 rounded px-1 py-0.5 outline-none hover:bg-[#FFF8F2] focus-visible:bg-[#FFF8F2] focus-visible:ring-2 focus-visible:ring-[#C7A48B] ${className}`}
  >
    {value}
    <span className="text-[10px] text-gray-400" aria-hidden="true">ⓘ</span>
    <span
      id={tooltipId}
      role="tooltip"
      className={`pointer-events-none absolute left-0 z-20 hidden min-w-max max-w-[260px] rounded-lg bg-gray-900 px-3 py-2 text-[11px] font-medium normal-case tracking-normal text-white shadow-lg group-hover:block group-focus:block ${
        placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
      }`}
    >
      <span className="block text-[10px] text-gray-300">对应院校</span>
      <span className="block">{schools.join('、')}</span>
      <span className="mt-2 block border-t border-white/15 pt-2 text-[10px] text-gray-300">学生差距</span>
      <span className="block text-amber-200">{gap}</span>
    </span>
  </span>
);

const RequirementList: React.FC<{
  entries: RequirementEntry[];
  gaps: string[];
  idPrefix: string;
  placement: 'top' | 'bottom';
  className?: string;
}> = ({ entries, gaps, idPrefix, placement, className }) => (
  <div className="divide-y divide-gray-100">
    {entries.map((entry, index) => (
      <div key={`${entry.school}-${entry.value}`} className="py-1.5 first:pt-0 last:pb-0">
        <HoverSchoolValue
          value={entry.value}
          schools={[entry.school]}
          gap={gaps[index] ?? '-'}
          tooltipId={`${idPrefix}-${index}`}
          className={className}
          placement={placement}
        />
      </div>
    ))}
  </div>
);

const summarizeGradeGaps = (gaps: string[]) => {
  if (gaps.every(gap => gap === '-')) return 'Grade Combination 无法比较';
  const achieved = gaps.filter(gap => gap === '已达到').length;
  const unmet = gaps.filter(gap => gap !== '已达到' && gap !== '-');
  if (achieved === gaps.length) return `${gaps.length} 所院校均已达到`;
  const parts = [];
  if (achieved > 0) parts.push(`${achieved} 所已达到`);
  if (unmet.length > 0) parts.push(`需提升：${unmet.join('；')}`);
  return parts.join('；');
};

const ALevelGapSummary: React.FC<{ studentScore?: string }> = ({ studentScore = '' }) => {
  const [expandedColumns, setExpandedColumns] = useState({ australia: false, ucas: false, others: false });
  const normalizedStudentScore = studentScore.trim().toUpperCase() || '-';
  const rows = useMemo(() => baseRows.map(row => {
    const gradeGaps = row.grades.map(entry => describeGradeGap(normalizedStudentScore, entry.value));
    return { ...row, gradeGaps, difference: summarizeGradeGaps(gradeGaps) };
  }), [normalizedStudentScore]);

  const toggleColumn = (column: keyof typeof expandedColumns) => {
    setExpandedColumns(current => ({ ...current, [column]: !current[column] }));
  };
  const optionalColumns = [
    { key: 'australia' as const, label: 'A-Level Aggregate Score' },
    { key: 'ucas' as const, label: 'UCAS Tariff Points' },
    { key: 'others' as const, label: 'Others' },
  ];
  const visibleColumnCount = 4 + Object.values(expandedColumns).filter(Boolean).length;

  return (
    <div className="pb-5">
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full border-collapse text-left text-xs">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
              <tr className="border-b border-gray-100 normal-case tracking-normal">
                <th colSpan={visibleColumnCount} className="px-3 py-2.5 font-normal">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 font-bold text-gray-500">展开更多要求</span>
                    {optionalColumns.map(column => {
                      const isExpanded = expandedColumns[column.key];
                      return (
                        <button
                          key={column.key}
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() => toggleColumn(column.key)}
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-semibold transition-colors ${
                            isExpanded
                              ? 'border-[#C7A48B] bg-[#FFF8F2] text-[#7D5646]'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
                          }`}
                        >
                          <span aria-hidden="true" className="text-sm leading-none">{isExpanded ? '−' : '+'}</span>
                          {column.label}
                        </button>
                      );
                    })}
                  </div>
                </th>
              </tr>
              <tr>
                <th className="p-3">梯度</th>
                <th className="p-3">Grade Combination</th>
                {expandedColumns.australia && <th className="p-3">A-Level Aggregate Score</th>}
                {expandedColumns.ucas && <th className="p-3">UCAS Tariff Points</th>}
                {expandedColumns.others && <th className="p-3">Others</th>}
                <th className="p-3">Student</th>
                <th className="p-3">Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(row => {
                const placement = row.tier === 'Reach' ? 'top' : 'bottom';
                const tierKey = row.tier.toLowerCase();
                return (
                  <tr key={row.tier} className="align-top">
                    <td className="p-3"><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold ${tierStyles[row.tier]}`}>{row.tier}</span></td>
                    <td className="p-3">
                      <RequirementList entries={row.grades} gaps={row.gradeGaps} idPrefix={`grade-schools-${tierKey}`} className="font-bold text-gray-800" placement={placement} />
                    </td>
                    {expandedColumns.australia && <td className="p-3"><RequirementList entries={row.aggregates} gaps={['-', '-']} idPrefix={`australia-schools-${tierKey}`} className="font-semibold text-gray-800" placement={placement} /></td>}
                    {expandedColumns.ucas && <td className="p-3"><RequirementList entries={row.tariffs} gaps={['-', '-']} idPrefix={`ucas-schools-${tierKey}`} placement={placement} /></td>}
                    {expandedColumns.others && <td className="max-w-[240px] p-3"><RequirementList entries={row.others} gaps={['-', '-']} idPrefix={`other-schools-${tierKey}`} placement={placement} /></td>}
                    <td className="p-3 font-semibold text-[#9A6B43]">{normalizedStudentScore}</td>
                    <td className="max-w-[300px] p-3 leading-5">
                      <span className="block font-medium text-gray-800">可比较：{row.difference}</span>
                      <span className="mt-1 block text-[11px] text-gray-400">无法换算：Aggregate、UCAS、Others</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ALevelGapSummary;
