import React, { useEffect, useMemo, useRef, useState } from 'react';

type Tier = 'Safety' | 'Match' | 'Reach';
export type ChartRange = { tier: Tier; min: number; max: number; count: number; schools: Array<{ name: string; score: number }> };

// Scheme 14: tier bands, school dots and a hollow target for the student's score.
const CompactRangeChart = ({ ranges, min, max, current, label, isEn, scoreStep = 1 }: {
  ranges: ChartRange[];
  min: number;
  max: number;
  current: number | null;
  label: string;
  isEn: boolean;
  scoreStep?: number;
}) => {
  const studentScore = current === null ? undefined : current;
  const format = (value: number) => Number(value.toFixed(2)).toString();
  const TIERS: Tier[] = ['Safety', 'Match', 'Reach'];
  const tierColor: Record<Tier, string> = {
    Safety: '#16a34a',
    Match: '#2563eb',
    Reach: '#dc2626',
  };
  const [view, setView] = useState<[number, number]>([min, max]);
  useEffect(() => { setView([min, max]); }, [min, max]);
  const [showTicks, setShowTicks] = useState(false);
  const wheelDeltaRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const wheelAnchorRef = useRef(0.5);
  const wheelInputRef = useRef<'mouse' | 'trackpad'>('trackpad');
  const wheelModeRef = useRef<'zoom' | 'pan'>('zoom');
  const svgRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    tier: Tier;
    range?: string;
    schools: Array<{ name: string; score: number }>;
  } | null>(null);

  const x = (value: number) => 80 + ((value - view[0]) / (view[1] - view[0])) * 860;
  const bases: Record<Tier, number> = { Safety: 36, Match: 75, Reach: 114 };
  const axisY = 145;
  const studentX = studentScore === undefined ? null : x(studentScore);
  const studentVisible = studentScore !== undefined && studentScore >= view[0] && studentScore <= view[1];
  const groups = useMemo(
    () =>
      TIERS.map((tier) => {
        const range = ranges.find((r) => r.tier === tier);
        if (!range || !range.schools) return { tier, rows: [] as Array<{ name: string; score: number; index: number }> };
        return {
          tier,
          rows: range.schools
            .map((school, index) => ({ ...school, index }))
            .filter((row) => row.score >= view[0] && row.score <= view[1]),
        };
      }),
    [ranges, view],
  );

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const applyWheel = () => {
      frameRef.current = null;
      const rawDelta = wheelDeltaRef.current;
      wheelDeltaRef.current = 0;
      const input = wheelInputRef.current;
      const mode = wheelModeRef.current;
      setView((current) => {
        const span = current[1] - current[0];
        const limitedDelta = Math.min(Math.max(rawDelta, input === 'mouse' ? -40 : -24), input === 'mouse' ? 40 : 24);
        if (mode === 'pan') {
          const movement = (limitedDelta / 40) * span * 0.08;
          const nextStart = Math.min(Math.max(current[0] + movement, min), max - span);
          return [Number(nextStart.toFixed(2)), Number((nextStart + span).toFixed(2))];
        }
        const rate = input === 'mouse' ? 0.002 : 0.0015;
        const nextSpan = Math.min(Math.max(span * Math.exp(limitedDelta * rate), (max - min) / 8), max - min);
        const anchorRatio = wheelAnchorRef.current;
        const anchor = current[0] + span * anchorRatio;
        let nextStart = anchor - nextSpan * anchorRatio;
        nextStart = Math.min(Math.max(nextStart, min), max - nextSpan);
        return [Number(nextStart.toFixed(2)), Number((nextStart + nextSpan).toFixed(2))];
      });
    };

    const handleWheel = (event: WheelEvent) => {
      setTooltip(null);
      event.preventDefault();
      event.stopPropagation();
      const rect = svgRef.current?.getBoundingClientRect() ?? chart.getBoundingClientRect();
      const normalizedDelta = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? event.deltaY * 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? event.deltaY * rect.height
          : event.deltaY;
      const mouseLike = event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL
        || (!event.ctrlKey && Math.abs(normalizedDelta) >= 40);
      wheelInputRef.current = mouseLike ? 'mouse' : 'trackpad';
      wheelModeRef.current = event.shiftKey && !event.ctrlKey ? 'pan' : 'zoom';
      wheelAnchorRef.current = Math.min(Math.max(((event.clientX - rect.left) / rect.width * 1000 - 80) / 860, 0), 1);
      wheelDeltaRef.current += normalizedDelta;
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(applyWheel);
    };

    chart.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      chart.removeEventListener('wheel', handleWheel);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      wheelDeltaRef.current = 0;
    };
  }, [min, max]);

  const span = view[1] - view[0];
  const rawStep = span / 9;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = Math.max(scoreStep, [1, 2, 5, 10].find(n => n * magnitude >= rawStep)! * magnitude);
  const ticks: number[] = [];
  for (let v = Math.ceil(view[0] / step) * step; v <= view[1]; v += step) ticks.push(Number(v.toFixed(2)));

  const showTooltip = (
    event: React.MouseEvent<SVGElement>,
    tier: Tier,
    schools: Array<{ name: string; score: number }>,
    range?: string,
  ) => {
    const bounds = chartRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const tooltipHalfWidth = 144;
    setTooltip({
      x: Math.min(Math.max(event.clientX - bounds.left, tooltipHalfWidth), bounds.width - tooltipHalfWidth),
      y: Math.max(event.clientY - bounds.top - 10, 8),
      tier,
      range,
      schools,
    });
  };

  return (
    <div className="mb-6" data-score-chart={label}>
      <div className="mb-3 flex flex-wrap items-center gap-4 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2">
        {TIERS.map((tier) => (
          <span key={tier} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
            <span
              className="block h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: tierColor[tier] }}
            />
            {tier}
          </span>
        ))}
        <button type="button" aria-pressed={showTicks} onClick={() => setShowTicks(previous => !previous)} className={`ml-auto rounded-md border px-2.5 py-1 text-[10px] font-bold transition-colors ${showTicks ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
          {isEn ? (showTicks ? 'Hide ticks' : 'Show ticks') : (showTicks ? '隐藏刻度' : '显示刻度')}
        </button>
      </div>
      {ranges.length === 0 && <p className="mb-2 text-xs text-gray-400">{isEn ? 'No school requirements available for this metric.' : '暂无该指标的院校要求数据'}</p>}
      <div ref={chartRef} className="relative cursor-zoom-in rounded-lg border border-gray-100 bg-gray-50/40 px-3 py-4" title={isEn ? 'Scroll to zoom; Shift + scroll to pan' : '滚轮缩放；Shift + 滚轮平移'}>
        <div className="overflow-x-auto">
          <svg ref={svgRef} viewBox="0 0 1000 200" className="w-full" style={{ minWidth: 600, cursor: 'zoom-in' }} role="img" aria-label={`${label} ${isEn ? "score distribution" : "分数分布"}`}>
          <line x1="80" y1={axisY} x2="940" y2={axisY} stroke="#e5e7eb" strokeWidth="4" strokeLinecap="round" />
          {groups.map(({ tier, rows }) => {
            if (!rows.length) return null;
            const fullRange = ranges.find(range => range.tier === tier)!;
            const base = bases[tier];
            const counts: Record<number, number> = {};
            rows.forEach((row) => { counts[row.score] = (counts[row.score] || 0) + 1; });
            const maxStack = Math.max(...Object.values(counts)) - 1;
            const minX = Math.max(75, Math.min(...rows.map((row) => x(row.score))) - 10);
            const maxX = Math.min(945, Math.max(...rows.map((row) => x(row.score))) + 10);
            const top = base - maxStack * 8 - 10;
            const height = Math.max(20, maxStack * 8 + 20);
            return (
              <g key={tier}>
                <rect
                  x={minX}
                  y={top}
                  width={Math.max(20, maxX - minX)}
                  height={height}
                  rx={height / 2}
                  fill={tierColor[tier]}
                  fillOpacity="0.13"
                  stroke={tierColor[tier]}
                  strokeOpacity="0.42"
                  strokeWidth="1.5"
                  className="cursor-help"
                  onMouseEnter={(event) => showTooltip(event, tier, fullRange.schools, `${fullRange.min}–${fullRange.max}`)}
                  onMouseMove={(event) => showTooltip(event, tier, fullRange.schools, `${fullRange.min}–${fullRange.max}`)}
                  onMouseLeave={() => setTooltip(null)}
                />
                <text
                  x={(minX + maxX) / 2}
                  y={top - 5}
                  textAnchor="middle"
                  fill={tierColor[tier]}
                  fontSize="10"
                  fontWeight="800"
                >
                  {tier}
                </text>
                {rows.map((row, i) => {
                  const stack = rows.slice(0, i).filter((item) => item.score === row.score).length;
                  return (
                    <circle
                      key={`${tier}-${row.index}`}
                      tabIndex={0}
                      aria-label={`${row.name} ${row.score}`}
                      onFocus={event => {
                        const bounds = event.currentTarget.getBoundingClientRect();
                        const chart = chartRef.current?.getBoundingClientRect();
                        if (chart) setTooltip({ x: Math.min(Math.max(bounds.left - chart.left, 144), chart.width - 144), y: bounds.top - chart.top, tier, schools: [row] });
                      }}
                      onBlur={() => setTooltip(null)}
                      cx={x(row.score)}
                      cy={base - stack * 8}
                      r="5"
                      fill={tierColor[tier]}
                      stroke="#fff"
                      strokeWidth="2"
                      className="cursor-help"
                      onMouseEnter={(event) => showTooltip(event, tier, [row])}
                      onMouseMove={(event) => showTooltip(event, tier, [row])}
                      onMouseLeave={() => setTooltip(null)}
                    >
                    </circle>
                  );
                })}
              </g>
            );
          })}
          {showTicks ? ticks.map((v) => (
            <g key={v}>
              <line x1={x(v)} y1={axisY - 6} x2={x(v)} y2={axisY + 7} stroke="#9ca3af" />
              <text x={x(v)} y={axisY + 25} textAnchor="middle" fill="#6b7280" fontSize="11">{v}</text>
            </g>
          )) : (
            <>
              <text x="80" y={axisY + 25} textAnchor="middle" fill="#9ca3af" fontSize="11">{format(view[0])}</text>
              <text x="940" y={axisY + 25} textAnchor="middle" fill="#9ca3af" fontSize="11">{format(view[1])}</text>
            </>
          )}
          {studentVisible && studentX !== null && (
            <g className="pointer-events-none">
              <circle cx={studentX} cy={axisY} r="10" fill="#fffdf9" stroke="#B07A4A" strokeWidth="2" />
              <circle cx={studentX} cy={axisY} r="4" fill="#B07A4A" />
              <text x={studentX} y={axisY + 47} textAnchor="middle" fill="#6F6F71" fontSize="11" fontWeight="700">{isEn ? `Student current: ${studentScore}` : `学生当前：${studentScore}`}</text>
            </g>
          )}
          </svg>
        </div>
        {tooltip && (
          <div
            className="pointer-events-none absolute z-50 w-72 -translate-x-1/2 -translate-y-full rounded-xl border border-gray-200 bg-white p-3 text-left shadow-xl"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="mb-2 flex items-center justify-between gap-3 border-b border-gray-100 pb-2">
              <span className="text-xs font-bold" style={{ color: tierColor[tooltip.tier] }}>{tooltip.tier}</span>
              {tooltip.range && <span className="text-[10px] font-medium text-gray-400">{tooltip.range}</span>}
            </div>
            <div className="space-y-1.5">
              {tooltip.schools.map((school, index) => (
                <div key={`${school.name}-${school.score}-${index}`} className="flex items-start justify-between gap-3 text-[11px] leading-4">
                  <span className="min-w-0 text-gray-600">{school.name}</span>
                  <span className="shrink-0 font-bold text-gray-900">{school.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactRangeChart;
