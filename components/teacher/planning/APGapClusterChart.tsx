import React, { useMemo, useState } from 'react';
import { SelectedSchool } from './PlanningData';

type Tier = 'Safety' | 'Match' | 'Reach';
type APScore = 3 | 4 | 5;
type RequirementSource = 'structured' | 'text' | 'simulated';
type APSchoolRequirement = {
  id: string;
  name: string;
  category: Tier;
  requiredScore: APScore;
  requiredCount: number;
  source: RequirementSource;
};
type APCluster = {
  key: string;
  category: Tier;
  requiredScore: APScore;
  requiredCount: number;
  schools: APSchoolRequirement[];
};

const LEVELS: APScore[] = [3, 4, 5];
const TIERS: Tier[] = ['Safety', 'Match', 'Reach'];
const COLORS: Record<Tier, string> = { Safety: '#16a34a', Match: '#2563eb', Reach: '#dc2626' };
const FALLBACKS: Record<Tier, Array<[APScore, number]>> = {
  Safety: [[4, 3], [4, 4], [5, 2], [5, 3]],
  Match: [[4, 4], [5, 3], [5, 4]],
  Reach: [[5, 3], [5, 4], [5, 5]],
};

const stableHash = (value: string) => Array.from(value).reduce((result, character) => ((result * 31) + character.charCodeAt(0)) >>> 0, 0);
const validAPScore = (value: unknown): value is APScore => value === 3 || value === 4 || value === 5;

const parseAPRequirementText = (text?: string): { requiredScore: APScore; requiredCount: number } | null => {
  if (!text) return null;
  const countFirst = text.match(/(\d+)\s*(?:APs?|AP courses?).{0,32}?(?:score(?:\s+of)?|grade)?\s*([345])/i);
  if (countFirst) {
    const requiredCount = Number(countFirst[1]);
    const requiredScore = Number(countFirst[2]);
    if (requiredCount > 0 && validAPScore(requiredScore)) return { requiredScore, requiredCount };
  }
  const scoreFirst = text.match(/(?:score(?:\s+of)?|grade)?\s*([345]).{0,32}?(\d+)\s*(?:APs?|AP courses?)/i);
  if (scoreFirst) {
    const requiredScore = Number(scoreFirst[1]);
    const requiredCount = Number(scoreFirst[2]);
    if (requiredCount > 0 && validAPScore(requiredScore)) return { requiredScore, requiredCount };
  }
  const chinese = text.match(/([345])\s*分.{0,24}?(\d+)\s*门\s*AP/i);
  if (chinese) {
    const requiredScore = Number(chinese[1]);
    const requiredCount = Number(chinese[2]);
    if (requiredCount > 0 && validAPScore(requiredScore)) return { requiredScore, requiredCount };
  }
  return null;
};

const getAPCoverage = (subjects: Array<{ grade?: string | number; score?: string | number }>) => {
  const scores = subjects
    .map(subject => Number(subject.grade ?? subject.score))
    .filter(score => Number.isFinite(score) && score >= 1 && score <= 5);
  return Object.fromEntries(LEVELS.map(level => [level, scores.filter(score => score >= level).length])) as Record<APScore, number>;
};

const resolveSchoolRequirement = (school: SelectedSchool): APSchoolRequirement => {
  const structured = school.requirementData as (SelectedSchool['requirementData'] & { apScore?: number; apCount?: number }) | undefined;
  const structuredScore = Number(structured?.apScore);
  const structuredCount = Number(structured?.apCount);
  if (validAPScore(structuredScore) && Number.isFinite(structuredCount) && structuredCount > 0) {
    return { id: school.id, name: school.uni.name, category: school.tier, requiredScore: structuredScore, requiredCount: structuredCount, source: 'structured' };
  }
  const parsed = parseAPRequirementText(school.requirements);
  if (parsed) return { id: school.id, name: school.uni.name, category: school.tier, ...parsed, source: 'text' };
  const options = FALLBACKS[school.tier];
  const [requiredScore, requiredCount] = options[stableHash(`${school.uni.id}-${school.major}`) % options.length];
  return { id: school.id, name: school.uni.name, category: school.tier, requiredScore, requiredCount, source: 'simulated' };
};

const groupRequirements = (schools: APSchoolRequirement[]): APCluster[] => Object.values(schools.reduce<Record<string, APCluster>>((result, school) => {
  const key = `${school.requiredScore}-${school.requiredCount}-${school.category}`;
  (result[key] ??= { key, category: school.category, requiredScore: school.requiredScore, requiredCount: school.requiredCount, schools: [] }).schools.push(school);
  return result;
}, {}));

const APGapClusterChart: React.FC<{
  selectedSchools: SelectedSchool[];
  studentSubjects: Array<{ grade?: string | number; score?: string | number }>;
  isEn: boolean;
}> = ({ selectedSchools, studentSubjects, isEn }) => {
  const [tooltip, setTooltip] = useState<{ cluster: APCluster; x: number; y: number } | null>(null);
  const coverage = useMemo(() => getAPCoverage(studentSubjects), [studentSubjects]);
  const requirements = useMemo(() => selectedSchools.map(resolveSchoolRequirement), [selectedSchools]);
  const clusters = useMemo(() => groupRequirements(requirements), [requirements]);
  const hasStudentAPScores = studentSubjects.some(subject => {
    const score = Number(subject.grade ?? subject.score);
    return Number.isFinite(score) && score >= 1 && score <= 5;
  });
  const width = 760;
  const height = 430;
  const left = 108;
  const right = 706;
  const top = 54;
  const bottom = 340;
  const bandWidth = (right - left) / LEVELS.length;
  const yMax = Math.max(6, ...LEVELS.map(level => coverage[level]), ...requirements.map(requirement => requirement.requiredCount));
  const bandEdge = (index: number) => left + (bandWidth * index);
  const xFor = (score: APScore) => left + (bandWidth * (LEVELS.indexOf(score) + 0.5));
  const yFor = (count: number) => bottom - ((count / yMax) * (bottom - top));
  const areaPath = `M ${bandEdge(0)} ${bottom} L ${bandEdge(0)} ${yFor(coverage[3])} H ${bandEdge(1)} V ${yFor(coverage[4])} H ${bandEdge(2)} V ${yFor(coverage[5])} H ${bandEdge(3)} V ${bottom} Z`;
  const boundaryPath = `M ${bandEdge(0)} ${yFor(coverage[3])} H ${bandEdge(1)} V ${yFor(coverage[4])} H ${bandEdge(2)} V ${yFor(coverage[5])} H ${bandEdge(3)}`;
  const categoriesAt = (cluster: APCluster) => TIERS.filter(tier => clusters.some(item => item.requiredScore === cluster.requiredScore && item.requiredCount === cluster.requiredCount && item.category === tier));
  const offsetFor = (cluster: APCluster): [number, number] => {
    const categories = categoriesAt(cluster);
    if (categories.length === 1) return [0, 0];
    if (categories.length === 2) return categories.indexOf(cluster.category) === 0 ? [-10, 0] : [10, 0];
    return ({ Safety: [-11, 6], Match: [0, -10], Reach: [11, 6] } as Record<Tier, [number, number]>)[cluster.category];
  };
  const openTooltip = (event: React.MouseEvent<SVGGElement>, cluster: APCluster) => setTooltip({
    cluster,
    x: Math.min(event.clientX + 14, window.innerWidth - 320),
    y: event.clientY - 12,
  });
  const focusTooltip = (event: React.FocusEvent<SVGGElement>, cluster: APCluster) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setTooltip({ cluster, x: Math.min(bounds.right + 12, window.innerWidth - 320), y: bounds.top });
  };

  return <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
    <div className="mb-3 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2.5 dark:border-white/10 dark:bg-zinc-800/60">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">Student&apos;s AP Profile</div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {([5, 4, 3] as APScore[]).map(score => <span key={score} className="rounded-md border border-[#e7ded2] bg-[#f7f1e8] px-2 py-1 text-[11px] font-semibold text-[#7d5646] dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100">{score}{score < 5 ? '+' : ''} × {coverage[score]}</span>)}
        <span className="text-[10px] text-gray-500 dark:text-zinc-400">The student currently has {coverage[5]} APs at 5, {coverage[4]} APs at 4+, and {coverage[3]} APs at 3+.</span>
      </div>
    </div>

    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2 dark:border-white/10 dark:bg-zinc-800/60" aria-label="AP requirement legend">
      {TIERS.map(tier => <span key={tier} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600 dark:text-zinc-300"><span className="h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: COLORS[tier] }} />{tier}</span>)}
      <span className="inline-flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-zinc-400"><span className="h-2.5 w-2.5 rounded-full bg-gray-500" />Number — universities in cluster</span>
      <span className="inline-flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-zinc-400"><span className="h-3 w-5 rounded-sm border border-[#dfc4b6] bg-[#b0826d]/10" />Shaded area — The student&apos;s current AP coverage</span>
    </div>

    {requirements.length === 0 && <p className="mb-2 text-xs text-gray-400">{isEn ? 'No selected-school AP requirements to display.' : '暂无可展示的目标院校 AP 要求。'}</p>}

    <div className="overflow-x-auto pb-2">
      <div className="relative min-w-[720px]" style={{ aspectRatio: `${width} / ${height}` }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full" aria-label="AP requirement cluster matrix">
          {Array.from({ length: yMax }, (_, index) => index + 1).map(value => <g key={value}>
            <line x1={left} x2={right} y1={yFor(value)} y2={yFor(value)} stroke="#e5e7eb" strokeWidth="1" />
            <text x={left - 18} y={yFor(value) + 4} textAnchor="end" fontSize="11" fill="#6b7280">{value}</text>
          </g>)}
          {LEVELS.map((score, index) => <g key={score}>
            <line x1={xFor(score)} x2={xFor(score)} y1={top} y2={bottom} stroke="#eef0f2" />
            {index < LEVELS.length - 1 && <line x1={bandEdge(index + 1)} x2={bandEdge(index + 1)} y1={top} y2={bottom} stroke="#f3f4f6" strokeDasharray="3 5" />}
            <text x={xFor(score)} y={bottom + 27} textAnchor="middle" fontSize="12" fontWeight="600" fill="#4b5563">{score}</text>
          </g>)}
          <path d={areaPath} fill="#b0826d" fillOpacity="0.1" />
          <path d={boundaryPath} fill="none" stroke="#b0826d" strokeOpacity="0.45" strokeWidth="1.25" />
          {hasStudentAPScores && <text x={bandEdge(0) + 10} y={Math.max(top + 12, yFor(coverage[3]) - 10)} fontSize="11" fontWeight="600" fill="#966a57">Student&apos;s current AP Coverage</text>}
          <line x1={left} x2={right} y1={bottom} y2={bottom} stroke="#9ca3af" />
          <line x1={left} x2={left} y1={top} y2={bottom} stroke="#9ca3af" />
          <text x={(left + right) / 2} y="405" textAnchor="middle" fontSize="12" fontWeight="600" fill="#4b5563">AP Score Required</text>
          <text x="28" y={(top + bottom) / 2} textAnchor="middle" transform={`rotate(-90 28 ${(top + bottom) / 2})`} fontSize="12" fontWeight="600" fill="#4b5563">Number of APs Required</text>

          {clusters.map(cluster => {
            const [offsetX, offsetY] = offsetFor(cluster);
            const cx = xFor(cluster.requiredScore) + offsetX;
            const cy = yFor(cluster.requiredCount) + offsetY;
            return <g key={cluster.key} role="img" tabIndex={0} aria-label={`${cluster.category}, ${cluster.schools.length} school${cluster.schools.length === 1 ? '' : 's'}, ${cluster.requiredCount} APs at score ${cluster.requiredScore}`} className="cursor-help outline-none" onMouseEnter={event => openTooltip(event, cluster)} onMouseMove={event => openTooltip(event, cluster)} onMouseLeave={() => setTooltip(null)} onFocus={event => focusTooltip(event, cluster)} onBlur={() => setTooltip(null)}>
              <circle cx={cx} cy={cy} r="14" fill="transparent" />
              <circle cx={cx} cy={cy} r="7.5" fill={COLORS[cluster.category]} stroke="white" strokeWidth="1.5" className="drop-shadow-sm" />
              {cluster.schools.length > 1 && <text x={cx} y={cy + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="white" pointerEvents="none">{cluster.schools.length}</text>}
            </g>;
          })}
        </svg>
      </div>
    </div>

    {tooltip && (() => {
      const { cluster } = tooltip;
      const gap = Math.max(0, cluster.requiredCount - coverage[cluster.requiredScore]);
      const visibleSchools = cluster.schools.length > 6 ? cluster.schools.slice(0, 5) : cluster.schools;
      const simulated = cluster.schools.some(school => school.source === 'simulated');
      return <div role="tooltip" className="pointer-events-none fixed z-50 w-[320px] -translate-y-full rounded-xl border border-gray-200 bg-white p-3 text-left text-[11px] leading-4 text-gray-600 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300" style={{ left: tooltip.x, top: tooltip.y }}>
        <div className="mb-2 flex items-center justify-between gap-3 border-b border-gray-100 pb-2 dark:border-zinc-700"><span className="text-sm font-bold" style={{ color: COLORS[cluster.category] }}>{cluster.category}</span><span className="text-[10px] font-medium text-gray-400">{cluster.schools.length} school{cluster.schools.length === 1 ? '' : 's'}</span></div>
        <div className="rounded-lg border border-gray-100 border-l-4 bg-gray-50 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800/80" style={{ borderLeftColor: COLORS[cluster.category] }}>
          <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">{cluster.schools.length === 1 ? 'University' : 'Universities'}</div>
          <div className="space-y-1">{visibleSchools.map(school => <div key={school.id} className="text-sm font-bold leading-5 text-gray-950 dark:text-white">{school.name}</div>)}{cluster.schools.length > 6 && <div className="text-xs font-semibold text-gray-500 dark:text-zinc-400">+{cluster.schools.length - 5} more</div>}</div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5"><span className="font-semibold text-gray-900 dark:text-zinc-100">{cluster.requiredCount} APs at score {cluster.requiredScore}</span>{simulated && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">Simulated requirement</span>}</div>
        <div className="mt-2 border-t border-gray-100 pt-2 dark:border-zinc-700"><span className="font-semibold text-gray-900 dark:text-zinc-100">The student&apos;s current AP profile:</span><br />{coverage[cluster.requiredScore]} APs at score {cluster.requiredScore}</div>
        <div className="mt-2"><span className="font-semibold text-gray-900 dark:text-zinc-100">{gap ? 'Gap:' : 'Status:'}</span><br /><span className={`font-semibold ${gap ? 'text-[#966a57]' : 'text-green-700 dark:text-green-400'}`}>{gap ? `Need ${gap} more AP${gap === 1 ? '' : 's'} at score ${cluster.requiredScore}` : 'Requirement currently covered'}</span></div>
      </div>;
    })()}
  </div>;
};

export default APGapClusterChart;
