
import React, { useMemo, useState, useEffect } from 'react';
import { 
  AlertTriangle, CheckCircle, ArrowRight, Target, User, Users, 
  Briefcase, TrendingUp, Zap, LayoutGrid, Loader2, Sparkles, FileText,
  School, Flag, Award, Activity, Calendar, Clock, Check, List,
  BookOpen, Plus, X, RefreshCw
} from '../../common/Icons';
import { SelectedSchool, GapAnalysisResult, ActionItem, CourseDiagnosisResult, TimelineEvent } from './PlanningData';
import { GoogleGenAI, Type } from "../../../services/aiClient";
import { useLanguage } from '../../../contexts/LanguageContext';
import { StudentSummary } from '../../../types';
import { initialOfficialBatches } from '../StudentBasicInfo';

interface Step5Props {
  selectedSchools: SelectedSchool[];
  currentStats: any;
  studentInputs: { interests: string; abilities: string; intentions: string };
  setPlanningStep: (step: number) => void;
  onSyncToTimeline?: (actions: ActionItem[]) => void;
  studentProfile?: StudentSummary;
}

type ScoreMetricId = 'alevel' | 'ap' | 'ib' | 'toefl' | 'ielts' | 'sat' | 'act' | 'atar';
type SchoolTier = 'Safety' | 'Match' | 'Reach';
type TierRange = { tier: SchoolTier; min: number; max: number; count: number };

// --- Components: Metric Ruler ---
const MetricRuler: React.FC<{
  unit?: string;
  min: number;
  max: number;
  current: number | null;
  reachAvg: number | null;
  matchAvg: number | null;
  safetyAvg: number | null;
  tierRanges?: TierRange[];
  isEn: boolean;
}> = ({ unit = '', min, max, current, reachAvg, tierRanges = [], isEn }) => {
  const range = max - min;
  const getPercent = (val: number) => Math.min(Math.max(((val - min) / range) * 100, 0), 100);
  const hasCurrent = current !== null && Number.isFinite(current);
  const visibleTierRanges = hasCurrent ? tierRanges : [];

  return (
    <div className="mb-10">
      {visibleTierRanges.length > 0 && (
        <div className="mb-3 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
          <div className="flex flex-wrap gap-1.5">
            {visibleTierRanges.map(tierRange => {
              const styles = {
                Safety: { dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'Safety' },
                Match: { dot: 'bg-blue-500', text: 'text-blue-700', label: 'Match' },
                Reach: { dot: 'bg-red-500', text: 'text-red-700', label: 'Reach' },
              }[tierRange.tier];
              const rangeText = tierRange.min === tierRange.max
                ? `${tierRange.min}${unit}`
                : `${tierRange.min}–${tierRange.max}${unit}`;
              return (
                <span key={`${tierRange.tier}-legend`} className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] text-gray-700">
                  <span className={`h-1.5 w-4 rounded-full ${styles.dot}`} />
                  <span className={`font-bold ${styles.text}`}>{styles.label}</span>
                  <span>{rangeText}</span>
                  <span className="text-gray-400">({tierRange.count}{isEn ? ' schools' : ' 所'})</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="relative h-12 select-none mt-2">
        {/* Track */}
        <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-100 rounded-full transform -translate-y-1/2 border border-gray-200"></div>

        {/* Safety / Match / Reach min–max intervals share this axis and can overlap. */}
        {visibleTierRanges.map(tierRange => {
          const startPercent = getPercent(tierRange.min);
          const endPercent = getPercent(tierRange.max);
          const isPoint = tierRange.min === tierRange.max;
          const color = {
            Safety: 'bg-emerald-500/45 ring-1 ring-emerald-500/60',
            Match: 'bg-blue-500/40 ring-1 ring-blue-500/60',
            Reach: 'bg-red-500/40 ring-1 ring-red-500/60',
          }[tierRange.tier];
          return (
            <div
              key={tierRange.tier}
              aria-label={`${tierRange.tier} ${tierRange.min}–${tierRange.max}`}
              className={`absolute top-1/2 z-10 h-3 -translate-y-1/2 rounded-full ${color}`}
              style={isPoint
                ? { left: `${startPercent}%`, width: '4px', marginLeft: '-2px' }
                : { left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
            />
          );
        })}
        
        {/* Gap Bar: Connect Current to Reach if Gap exists */}
        {hasCurrent && reachAvg !== null && reachAvg > current && (
           <div 
              className="absolute top-1/2 h-1 bg-red-100 transform -translate-y-1/2 opacity-50 transition-all duration-500"
              style={{ 
                 left: `${getPercent(current)}%`, 
                 width: `${getPercent(reachAvg) - getPercent(current)}%` 
              }}
           ></div>
        )}

        {/* Ticks */}
        <div className="absolute top-[28px] left-0 w-full flex justify-between text-[10px] text-gray-300 font-mono">
           <span>{min}</span>
           <span>{max}</span>
        </div>

        {/* Current Student Marker (Purple - Top) */}
        {hasCurrent && (
          <div
            className="absolute top-1/2 transform -translate-y-1/2 flex flex-col items-center z-40 transition-all duration-700 ease-out"
            style={{ left: `${getPercent(current)}%` }}
          >
             <div className="w-4 h-4 rounded-full bg-purple-600 border-2 border-white shadow-[0_0_10px_rgba(147,51,234,0.5)] relative">
                <div className="absolute -inset-1 bg-purple-500/20 rounded-full animate-ping"></div>
             </div>
             <div className="absolute -top-7 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded arrow-bottom">
                {isEn ? 'You' : '当前'}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ScoreToggle: React.FC<{
  enabled: boolean;
  label: string;
  value: string;
  hasScore: boolean;
  isEn: boolean;
  onChange: (enabled: boolean) => void;
}> = ({ enabled, label, value, hasScore, isEn, onChange }) => (
  <div className={`rounded-lg border px-3 py-3 ${enabled ? 'border-primary-100 bg-primary-50/30' : 'border-gray-100 bg-gray-50/60'}`}>
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${isEn ? (enabled ? 'Hide' : 'Show') : (enabled ? '关闭' : '开启')} ${label}`}
          onClick={() => onChange(!enabled)}
          className={`relative inline-flex h-4 w-7 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1 ${enabled ? 'bg-primary-600' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
        </button>
        <span className={`text-xs font-medium ${enabled ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
      </div>
      <span className={`text-xs font-bold ${enabled ? 'text-primary-700' : 'text-gray-400'}`}>
        {hasScore ? value : (isEn ? 'No score' : '暂无成绩')}
      </span>
    </div>
  </div>
);

// --- Components: Qualitative Card ---
const QualitativeCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  level: 'Weak' | 'Medium' | 'Strong' | 'Unknown';
  analysis: string;
  isLoading: boolean;
  isEn: boolean;
}> = ({ title, icon, level, analysis, isLoading, isEn }) => {
  const getColors = (l: string) => {
    if (l === 'Strong') return 'bg-green-100 text-green-700 border-green-200';
    if (l === 'Medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (l === 'Unknown') return 'bg-gray-100 text-gray-500 border-gray-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
       <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 font-bold text-gray-700">
             {icon} {title}
          </div>
          {isLoading ? (
             <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
             <span className={`text-xs px-2 py-0.5 rounded font-bold border ${getColors(level)}`}>
                {level === 'Unknown' ? (isEn ? 'Data pending' : '待补充') : level}
             </span>
          )}
       </div>
       <div className="flex-1 text-xs text-gray-600 leading-relaxed">
          {isLoading ? (
             <div className="space-y-2 animate-pulse">
                <div className="h-2 bg-gray-100 rounded w-full"></div>
                <div className="h-2 bg-gray-100 rounded w-3/4"></div>
             </div>
          ) : (analysis || (isEn ? 'No verified data is available, so no assessment is shown.' : '暂无经核验的数据，因此不输出评估结论。'))}
       </div>
    </div>
  );
};

// --- Components: Action Matrix (REFACTORED) ---
const ActionMatrix: React.FC<{
  actionItems: ActionItem[];
  onToggleItem: (id: string) => void;
  isLoading: boolean;
  onGenerate: () => void;
  isEn: boolean;
}> = ({ actionItems, onToggleItem, isLoading, onGenerate, isEn }) => {
  
  // Revised Dimensions: Consolidated into 4 Core Categories
  const dimensions: {id: ActionItem['category'], label: string}[] = [
    { id: 'Application', label: isEn ? 'Application Core' : '申请管理 (Application)' },
    { id: 'Test', label: isEn ? 'Standardized Testing' : '标化与语言 (Testing)' },
    { id: 'Academics', label: isEn ? 'Academics' : '学术与课程 (Academics)' },
    { id: 'Extracurriculars', label: isEn ? 'Extracurriculars' : '背景提升 (Extracurriculars)' },
  ];

  // Revised Roles: Removed 'Parent'
  const roles: {id: ActionItem['role'], label: string, icon: React.ReactNode, color: string}[] = [
    { id: 'Student', label: isEn ? 'Student' : '学生', icon: <User className="w-4 h-4"/>, color: 'text-blue-600 bg-blue-50' },
    { id: 'Counselor', label: isEn ? 'Counselor' : '升学老师', icon: <Briefcase className="w-4 h-4"/>, color: 'text-purple-600 bg-purple-50' },
  ];

  if (actionItems.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
         <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
         <h3 className="text-gray-900 font-bold mb-2">{isEn ? 'Generate Personalized Action Plan' : '生成个性化提升方案'}</h3>
         <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            {isEn ? 'AI will generate specific to-do lists for student and counselor based on gap analysis, including hard deadlines and routines.' : 'AI 将根据差距分析，为您生成包含"关键节点"和"日常习惯"的详细行动清单。'}
         </p>
         <button 
            onClick={onGenerate}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2 mx-auto"
         >
            <Zap className="w-4 h-4 text-yellow-300" /> {isEn ? 'Generate Matrix' : '立即生成行动矩阵'}
         </button>
      </div>
    );
  }

  // Formatting Helper for Dates
  const renderDate = (item: ActionItem) => {
    if (item.type === 'Routine') {
      // For routines, if date is missing or "null" string, show Ongoing
      if (!item.deadline || item.deadline === 'null') {
        return (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 font-medium">
             <RefreshCw className="w-2.5 h-2.5" /> {isEn ? 'Ongoing' : '持续进行'}
          </span>
        );
      }
    }
    // For Milestones or Routines with dates
    return (
      <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${item.type === 'Milestone' ? 'bg-red-50 text-red-600 font-medium' : 'bg-gray-100'}`}>
         <Calendar className="w-2.5 h-2.5" /> {item.deadline || 'TBD'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-[#e5e0dc] shadow-sm overflow-hidden">
       {/* Header */}
       <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
             <List className="w-5 h-5 text-primary-600" /> {isEn ? 'Action Matrix' : '提升行动矩阵 (Action Matrix)'}
          </h3>
          <div className="flex gap-4 text-xs">
             <div className="flex items-center gap-2 px-2 py-1 rounded bg-indigo-50 border border-indigo-100">
                <Flag className="w-3 h-3 text-indigo-600" /> <span className="text-indigo-700 font-medium">{isEn ? 'Milestone' : '关键节点'}</span>
             </div>
             <div className="flex items-center gap-2 px-2 py-1 rounded bg-teal-50 border border-teal-100">
                <RefreshCw className="w-3 h-3 text-teal-600" /> <span className="text-teal-700 font-medium">{isEn ? 'Routine' : '持续习惯'}</span>
             </div>
          </div>
       </div>

       {/* Matrix Body */}
       <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
             <thead>
                <tr>
                   <th className="w-32 p-3 bg-gray-50 border-b border-r border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{isEn ? 'Dimension' : '核心维度'}</th>
                   {roles.map(role => (
                      <th key={role.id} className="p-3 bg-gray-50 border-b border-gray-200 text-left w-1/2 border-r last:border-r-0">
                         <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${role.color}`}>
                            {role.icon} {role.label}
                         </div>
                      </th>
                   ))}
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                   <tr>
                      <td colSpan={3} className="p-12 text-center text-gray-400">
                         <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary-500" />
                         <p>{isEn ? 'AI is planning actions...' : 'AI 正在分析差距并规划行动路径...'}</p>
                      </td>
                   </tr>
                ) : (
                   dimensions.map(dim => (
                      <tr key={dim.id} className="group hover:bg-gray-50/30 transition-colors">
                         <td className="p-3 border-r border-gray-200 text-center bg-gray-50/20 align-middle">
                            <span className="text-xs font-bold text-gray-700">{dim.label}</span>
                         </td>
                         {roles.map(role => {
                            const items = actionItems.filter(item => item.category === dim.id && item.role === role.id);
                            return (
                               <td key={`${dim.id}-${role.id}`} className="p-3 align-top border-r border-gray-100 last:border-r-0">
                                  <div className="space-y-2">
                                     {items.length > 0 ? items.map(item => (
                                        <div 
                                           key={item.id}
                                           onClick={() => onToggleItem(item.id)}
                                           className={`relative p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md
                                              ${item.isSelected 
                                                 ? 'bg-primary-50 border-primary-500 shadow-sm' 
                                                 : 'bg-white border-gray-200 hover:border-primary-200'}
                                           `}
                                        >
                                           <div className="flex justify-between items-start mb-1.5">
                                              {/* Milestone vs Routine Badge */}
                                              <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-bold
                                                 ${item.type === 'Milestone' 
                                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                                    : 'bg-teal-50 text-teal-700 border border-teal-100'}
                                              `}>
                                                 {item.type === 'Milestone' ? <Flag className="w-3 h-3"/> : <RefreshCw className="w-3 h-3"/>}
                                                 {item.type === 'Milestone' ? (isEn ? 'Milestone' : '节点') : (isEn ? 'Routine' : '习惯')}
                                              </div>
                                              
                                              {item.isSelected && <CheckCircle className="w-4 h-4 text-primary-600" />}
                                           </div>
                                           {/* Title & Description Split */}
                                           <div className="mb-2">
                                              <p className="text-xs font-bold text-gray-900 mb-0.5 leading-snug">{item.title}</p>
                                              <p className="text-[10px] text-gray-500 leading-snug line-clamp-2">{item.description}</p>
                                           </div>
                                           
                                           <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                                              <span className="flex items-center gap-0.5 bg-gray-100 px-1.5 py-0.5 rounded">
                                                 <Clock className="w-2.5 h-2.5" /> {item.duration}
                                              </span>
                                              {renderDate(item)}
                                           </div>
                                        </div>
                                     )) : (
                                        <div className="h-full min-h-[40px] flex items-center justify-center opacity-30">
                                           <span className="text-[10px] text-gray-300">-</span>
                                        </div>
                                     )}
                                  </div>
                               </td>
                            );
                         })}
                      </tr>
                   ))
                )}
             </tbody>
          </table>
       </div>
    </div>
  );
};


const Step5Gap: React.FC<Step5Props> = ({ selectedSchools, currentStats, studentInputs, setPlanningStep, onSyncToTimeline, studentProfile }) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';
  const [visibleScoreMetrics, setVisibleScoreMetrics] = useState<Record<ScoreMetricId, boolean>>(() => ({
    alevel: Boolean(currentStats.alevelEnabled && currentStats.alevelSubjects?.length),
    ap: Boolean(currentStats.apEnabled && currentStats.apSubjects?.length),
    ib: Boolean(currentStats.ibEnabled && currentStats.ibSubjects?.length),
    toefl: Boolean(currentStats.toeflEnabled || currentStats.oldToeflEnabled),
    // A missing IELTS score stays collapsed by default, while the toggle below
    // remains available for the user to open it manually.
    ielts: Boolean(
      currentStats.ieltsEnabled
      && Number.isFinite(Number(currentStats.ieltsValue))
      && Number(currentStats.ieltsValue) > 0
    ),
    sat: Boolean(currentStats.satEnabled),
    act: Boolean(currentStats.actEnabled),
    atar: Boolean(currentStats.atarEnabled),
  }));
  
  // State for AI Qualitative Analysis
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [qualitativeAnalysis, setQualitativeAnalysis] = useState<{
    leadership: { level: 'Weak'|'Medium'|'Strong', text: string };
    activity: { level: 'Weak'|'Medium'|'Strong', text: string };
    competition: { level: 'Weak'|'Medium'|'Strong', text: string };
  } | null>(null);

  // State for Action Plan
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // --- Logic to get latest transcript courses ---
  const latestTerm = useMemo(() => {
    if (!initialOfficialBatches || initialOfficialBatches.length === 0) return null;
    const sorted = [...initialOfficialBatches].sort((a, b) => {
        const timeA = a.time || '';
        const timeB = b.time || '';
        if (timeB < timeA) return -1;
        if (timeB > timeA) return 1;
        return 0;
    });
    return sorted[0];
  }, []);

  // State for Course Diagnosis
  const [currentCourses, setCurrentCourses] = useState<string[]>(
    latestTerm ? latestTerm.courses.map(c => c.subject) : []
  );
  
  const [newCourseInput, setNewCourseInput] = useState('');
  const [isCourseDiagLoading, setIsCourseDiagLoading] = useState(false);
  const [courseDiagnosis, setCourseDiagnosis] = useState<CourseDiagnosisResult | null>(null);

  // 1. Calculate Aggregated Targets for ALL tiers
  const tierStats = useMemo(() => {
    const calcTier = (tier: string) => {
      const schools = selectedSchools.filter(s => s.tier === tier);
      const average = (metric: 'gpa' | 'toefl' | 'toeflNew' | 'ielts' | 'sat' | 'act' | 'atar') => {
        const values = schools
          .map(school => school.requirementData?.[metric])
          .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
        if (values.length === 0) return null;
        return values.reduce((sum, value) => sum + value, 0) / values.length;
      };

      return {
        gpa: average('gpa') === null ? null : Number(average('gpa')!.toFixed(2)),
        toefl: average('toefl') === null ? null : Math.round(average('toefl')!),
        toeflNew: average('toeflNew') === null ? null : Number(average('toeflNew')!.toFixed(1)),
        ielts: average('ielts') === null ? null : Number(average('ielts')!.toFixed(1)),
        sat: average('sat') === null ? null : Math.round(average('sat')!),
        act: average('act') === null ? null : Number(average('act')!.toFixed(1)),
        atar: average('atar') === null ? null : Number(average('atar')!.toFixed(2)),
        count: schools.filter(school => Boolean(school.requirementData)).length
      };
    };

    return {
      reach: calcTier('Reach'),
      match: calcTier('Match'),
      safety: calcTier('Safety')
    };
  }, [selectedSchools]);

  const validNumber = (value: unknown): number | null => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  type RequirementMetric = 'gpa' | 'toefl' | 'ielts' | 'sat' | 'act' | 'atar';
  const getTierRanges = (metric: RequirementMetric): TierRange[] => {
    const getMetricValue = (school: SelectedSchool) => {
      const localFallback = metric === 'gpa'
        ? school.uni.avgGpa
        : metric === 'toefl'
          ? school.uni.minToefl
          : metric === 'sat'
            ? school.uni.avgSat
            : undefined;
      const value = school.requirementData?.[metric] ?? localFallback;
      return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
    };

    return (['Safety', 'Match', 'Reach'] as SchoolTier[]).flatMap(tier => {
      const valuesBySchool = new Map<string, number>();
      selectedSchools
        .filter(school => school.tier === tier)
        .forEach(school => {
          const value = getMetricValue(school);
          if (value !== null && !valuesBySchool.has(school.uni.id)) valuesBySchool.set(school.uni.id, value);
        });
      const values = Array.from(valuesBySchool.values());
      if (values.length === 0) return [];
      return [{ tier, min: Math.min(...values), max: Math.max(...values), count: values.length }];
    });
  };

  const quantitativeMetrics = [
    {
      id: 'alevel' as ScoreMetricId, group: 'academic', label: 'A-Level', enabled: visibleScoreMetrics.alevel, hasScore: Boolean(currentStats.alevelEnabled && currentStats.alevelSubjects?.length),
      value: `${currentStats.alevelSubjects?.length || 0}${isEn ? ' subjects' : ' 门'}`, rulerLabel: isEn ? 'A-Level (GPA Eq.)' : 'A-Level预估分 (GPA当量)',
      min: 3.0, max: 4.2, current: currentStats.alevelEnabled ? validNumber(currentStats.gpa) : null, metric: 'gpa' as RequirementMetric,
      reachAvg: tierStats.reach.gpa, matchAvg: tierStats.match.gpa, safetyAvg: tierStats.safety.gpa,
    },
    {
      id: 'ap' as ScoreMetricId, group: 'academic', label: 'AP', enabled: visibleScoreMetrics.ap, hasScore: Boolean(currentStats.apEnabled && currentStats.apSubjects?.length),
      value: `${currentStats.academicScoreText || currentStats.apSubjects?.[0]?.grade || ''}${isEn ? '' : ' 分'}`, rulerLabel: isEn ? 'AP (GPA Eq.)' : 'AP成绩 (GPA当量)',
      min: 3.0, max: 4.2, current: currentStats.apEnabled ? validNumber(currentStats.gpa) : null, metric: 'gpa' as RequirementMetric,
      reachAvg: tierStats.reach.gpa, matchAvg: tierStats.match.gpa, safetyAvg: tierStats.safety.gpa,
    },
    {
      id: 'ib' as ScoreMetricId, group: 'academic', label: 'IB', enabled: visibleScoreMetrics.ib, hasScore: Boolean(currentStats.ibEnabled && currentStats.ibSubjects?.length),
      value: `${currentStats.academicScoreText || ''}${isEn ? '' : ' 分'}`, rulerLabel: isEn ? 'IB (GPA Eq.)' : 'IB成绩 (GPA当量)',
      min: 3.0, max: 4.2, current: currentStats.ibEnabled ? validNumber(currentStats.gpa) : null, metric: 'gpa' as RequirementMetric,
      reachAvg: tierStats.reach.gpa, matchAvg: tierStats.match.gpa, safetyAvg: tierStats.safety.gpa,
    },
    {
      id: 'toefl' as ScoreMetricId, group: 'standardized', label: 'TOEFL', enabled: visibleScoreMetrics.toefl, hasScore: Boolean(currentStats.toeflEnabled || currentStats.oldToeflEnabled),
      value: String(currentStats.oldToeflValue || currentStats.toefl || ''), rulerLabel: 'TOEFL',
      min: 60, max: 120, current: (currentStats.toeflEnabled || currentStats.oldToeflEnabled) ? validNumber(currentStats.oldToeflValue || currentStats.toefl) : null, metric: 'toefl' as RequirementMetric,
      reachAvg: tierStats.reach.toefl, matchAvg: tierStats.match.toefl, safetyAvg: tierStats.safety.toefl,
    },
    {
      id: 'ielts' as ScoreMetricId, group: 'standardized', label: 'IELTS', enabled: visibleScoreMetrics.ielts, hasScore: Boolean(currentStats.ieltsEnabled),
      value: String(currentStats.ieltsValue || ''), rulerLabel: 'IELTS',
      min: 4, max: 9, current: currentStats.ieltsEnabled ? validNumber(currentStats.ieltsValue) : null, metric: 'ielts' as RequirementMetric,
      reachAvg: tierStats.reach.ielts, matchAvg: tierStats.match.ielts, safetyAvg: tierStats.safety.ielts,
    },
    {
      id: 'sat' as ScoreMetricId, group: 'standardized', label: 'SAT', enabled: visibleScoreMetrics.sat, hasScore: Boolean(currentStats.satEnabled),
      value: String(currentStats.satValue || ''), rulerLabel: 'SAT',
      min: 1000, max: 1600, current: currentStats.satEnabled ? validNumber(currentStats.satValue) : null, metric: 'sat' as RequirementMetric,
      reachAvg: tierStats.reach.sat, matchAvg: tierStats.match.sat, safetyAvg: tierStats.safety.sat,
    },
    {
      id: 'act' as ScoreMetricId, group: 'standardized', label: 'ACT', enabled: visibleScoreMetrics.act, hasScore: Boolean(currentStats.actEnabled),
      value: String(currentStats.actValue || ''), rulerLabel: 'ACT',
      min: 20, max: 36, current: currentStats.actEnabled ? validNumber(currentStats.actValue) : null, metric: 'act' as RequirementMetric,
      reachAvg: tierStats.reach.act, matchAvg: tierStats.match.act, safetyAvg: tierStats.safety.act,
    },
    {
      id: 'atar' as ScoreMetricId, group: 'standardized', label: 'ATAR', enabled: visibleScoreMetrics.atar, hasScore: Boolean(currentStats.atarEnabled),
      value: String(currentStats.atarValue || ''), rulerLabel: 'ATAR',
      min: 0, max: 99.95, current: currentStats.atarEnabled ? validNumber(currentStats.atarValue) : null, metric: 'atar' as RequirementMetric,
      reachAvg: tierStats.reach.atar, matchAvg: tierStats.match.atar, safetyAvg: tierStats.safety.atar,
    },
  ];

  // 2. Trigger AI Analysis on Mount (or when inputs change)
  useEffect(() => {
    if (selectedSchools.length > 0 && !qualitativeAnalysis && !isAiLoading) {
      handleRunAiAnalysis();
    }
  }, []);

  const handleRunAiAnalysis = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI();
      // Construct a prompt that compares student inputs vs Reach schools requirements implicitly
      const prompt = `
        Role: Senior College Counselor.
        Task: Analyze the gap between a student's profile and their "Reach" school targets (Top tier US/UK/Global universities).
        
        Student Profile:
        - Interests: ${studentInputs.interests}
        - Abilities/Achievements: ${studentInputs.abilities}
        - Intentions: ${studentInputs.intentions}
        
        Analyze 3 Dimensions: Leadership, Activity (Depth/Breadth), Competition (Awards).
        For each, assign a level (Weak, Medium, Strong) based on high-tier university standards and provide a 1-sentence ${isEn ? 'English' : 'Chinese'} analysis.
        
        Output JSON format:
        {
          "leadership": { "level": "Weak"|"Medium"|"Strong", "text": "..." },
          "activity": { "level": "Weak"|"Medium"|"Strong", "text": "..." },
          "competition": { "level": "Weak"|"Medium"|"Strong", "text": "..." }
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      if (response.text) {
        setQualitativeAnalysis(JSON.parse(response.text));
      }
    } catch (e) {
      console.error("AI Analysis Failed", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // 3. Generate Action Plan (UPDATED PROMPT with Student Context)
  const handleGenerateActionPlan = async () => {
    setIsActionLoading(true);
    try {
      const ai = new GoogleGenAI();
      
      // Simulate Materials Status based on riskTags if available
      const riskTags = studentProfile?.riskTags || [];
      const materialStatus = studentProfile?.riskCategories.includes('材料风险') 
        ? `Warning: Key application materials (e.g., Portfolio or Transcript) might be missing or incomplete. Risks identified: ${riskTags.join(', ')}` 
        : "On Track: Application materials appear to be in good order.";

      const schoolListSummary = selectedSchools.map(s => `${s.uni.name} (${s.tier})`).join(', ');

      const prompt = `
        Role: Senior College Counselor Strategy Director.
        Task: Create a highly actionable, structured To-Do Matrix for college application preparation, customized for THIS SPECIFIC STUDENT.
        
        Student Context:
        - Name: ${studentProfile?.name || 'Student'}
        - Grade: ${studentProfile?.grade || 'Unknown'}
        - Target Direction: ${studentProfile?.direction || 'Unknown'}
        - Application Phase: ${studentProfile?.phase || 'Unknown'}
        
        Status & Gaps:
        - Gap to Target: GPA ${currentStats.gpa} vs ${tierStats.reach.gpa}, TOEFL ${currentStats.toefl} vs ${tierStats.reach.toefl}.
        - Qualitative Analysis: ${JSON.stringify(qualitativeAnalysis)}
        - Application Materials Status: ${materialStatus}
        - School List: ${schoolListSummary}
        
        Output Requirements:
        1. **Categories**: You MUST strictly categorize all actions into these 4 buckets:
           - 'Application': School list finalization, Essays, Common App, Portal registration, Recommendations.
           - 'Test': Standardized tests (SAT/ACT/AP) and Language tests (TOEFL/IELTS). Merged category.
           - 'Academics': GPA maintenance, Course selection, Academic rigor.
           - 'Extracurriculars': Activities, Clubs, Competitions, Leadership, Summer programs, Research. Merged category.
        
        2. **Roles**: Assign strictly to 'Student' or 'Counselor'. 
           - **NO 'Parent' role**. If a task involves parents (e.g. paying fees, discussing budget), assign it to Student ("Discuss with family") or Counselor ("Nudge parents").
        
        3. **Types**: Classify each task as either:
           - 'Milestone': One-time task with a specific hard deadline (e.g. "Register for Oct SAT", "Submit ED Application").
           - 'Routine': Ongoing habit or maintenance task (e.g. "Read NYT weekly", "Maintain GPA 3.9+").
        
        4. **Specifics**:
           - "title": Short, punchy action verb (e.g. "Register SAT", "Daily Vocab"). Max 5 words.
           - "description": Concrete details on how/why (e.g. "Log into CollegeBoard, choose Dec date.", "Use Quizlet for 15 mins/day.").
           - "deadline": For Milestones, provide specific date (YYYY-MM-DD) relevant to the current date (${new Date().toISOString().split('T')[0]}). For Routines, return null or empty string.
        
        IMPORTANT: Output valid JSON array. Translate content to ${isEn ? 'English' : 'Simplified Chinese'}.
        Structure:
        [
          {
            "category": "Application", "role": "Student", "title": "...", "description": "...", "duration": "...", "priority": "High", "deadline": "2024-11-01", "type": "Milestone"
          },
          {
            "category": "Test", "role": "Student", "title": "...", "description": "...", "duration": "...", "priority": "High", "deadline": null, "type": "Routine"
          }
        ]
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      if (response.text) {
        const items = JSON.parse(response.text);
        // Add ID and selection state
        const formattedItems: ActionItem[] = items.map((item: any, idx: number) => ({
          ...item,
          id: `action-${Date.now()}-${idx}`,
          // Sanitize "null" string from AI just in case
          deadline: (item.deadline === "null" || item.deadline === null) ? "" : item.deadline,
          isSelected: false
        }));
        setActionItems(formattedItems);
      }
    } catch (e) {
      console.error("Action Plan Gen Failed", e);
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. Course Diagnosis Logic
  const handleRunCourseDiagnosis = async () => {
    setIsCourseDiagLoading(true);
    setCourseDiagnosis(null);
    try {
      const ai = new GoogleGenAI();
      
      const targetSummary = selectedSchools.map(s => `${s.uni.name} (${s.major || 'Undecided'})`).join(', ');
      
      const prompt = `
        Role: Senior Academic Advisor.
        Task: Evaluate if the student's current course selection meets the prerequisites for their target schools and majors.
        
        Current Courses (${latestTerm?.gradeLevel || 'Latest Term'}): ${currentCourses.join(', ')}
        Target Schools & Majors: ${targetSummary}
        
        Analysis Requirements:
        1. Check for missing prerequisites (e.g., Physics for Engineering, Calculus for Econ/CS).
        2. Evaluate rigor (AP/IB/Honors) against "Reach" school standards.
        3. Identify any "soft" subjects that might be viewed less favorably by top tier schools (e.g. UK G5 blacklist).
        
        Output JSON:
        {
          "status": "Safe" | "Warning" | "Critical",
          "analysis": "Detailed diagnosis in ${isEn ? 'English' : 'Simplified Chinese'}...",
          "suggestions": [
            { "type": "Change Course" | "Change Major", "content": "Suggestion..." }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      if (response.text) {
        setCourseDiagnosis(JSON.parse(response.text));
      }
    } catch (e) {
      console.error("Course Diagnosis Failed", e);
    } finally {
      setIsCourseDiagLoading(false);
    }
  };

  const handleAddCourse = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newCourseInput.trim()) {
      setCurrentCourses([...currentCourses, newCourseInput.trim()]);
      setNewCourseInput('');
    }
  };

  const handleRemoveCourse = (course: string) => {
    setCurrentCourses(currentCourses.filter(c => c !== course));
  };

  const handleToggleActionItem = (id: string) => {
    setActionItems(prev => prev.map(item => 
      item.id === id ? { ...item, isSelected: !item.isSelected } : item
    ));
  };

  const handleSync = () => {
    if (onSyncToTimeline) {
      const selected = actionItems.filter(i => i.isSelected);
      onSyncToTimeline(selected);
    } else {
      setPlanningStep(6);
    }
  };

  const getSelectedCount = () => actionItems.filter(i => i.isSelected).length;

  // --- Render ---

  if (selectedSchools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <div className="bg-gray-100 p-6 rounded-full">
          <School className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">{isEn ? 'School List Empty' : '选校清单为空'}</h3>
        <p className="text-gray-500 max-w-md">
          {isEn ? 'Gap analysis requires confirmed target schools. Please go back to Step 4.' : '差距分析需要基于已确认的目标院校。请先返回 Step 4 完善选校清单。'}
        </p>
        <button onClick={() => setPlanningStep(4)} className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700">
          {isEn ? 'Go to Step 4' : '前往 Step 4'}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2">
      
      {/* Header */}
      <div>
         <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-600" /> {isEn ? 'Gap Analysis' : '差距分析报告 (Gap Analysis)'}
         </h2>
         <p className="text-sm text-gray-500 mt-1">
            {isEn 
              ? 'Comparison between student current profile and Reach/Match/Safety standards.' 
              : '基于 Step 4 选校清单生成的 Reach/Match/Safety 梯度标准与学生现状的对比。'}
         </p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-8 pb-10">
         
         {/* PART 1: Quantitative Analysis (Rulers) */}
         <section className="bg-white p-6 rounded-xl border border-[#e5e0dc] shadow-sm">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
               <LayoutGrid className="w-5 h-5 text-primary-600" /> 1. {isEn ? 'Quantitative Gaps' : '硬性指标差距 (Quantitative)'}
            </h3>
            
            <div className="space-y-6">
              {([
                { id: 'academic', title: isEn ? 'Academic scores' : '学校成绩' },
                { id: 'standardized', title: isEn ? 'Standardized tests' : '标化成绩' },
              ]).map(section => (
                <div key={section.id} className="rounded-xl border border-gray-100 bg-gray-50/30 p-4">
                  <h4 className="mb-3 text-xs font-bold text-gray-700">{section.title}</h4>
                  <div className="space-y-5">
                    {quantitativeMetrics.filter(metric => metric.group === section.id).map(metric => (
                      <div key={metric.id} className="border-b border-gray-100 pb-1 last:border-b-0">
                        <ScoreToggle
                          enabled={metric.enabled}
                          label={metric.label}
                          value={metric.value}
                          hasScore={metric.hasScore}
                          isEn={isEn}
                          onChange={enabled => setVisibleScoreMetrics(previous => ({ ...previous, [metric.id]: enabled }))}
                        />
                        {metric.enabled && (
                          <div className="mt-5 px-1">
                            <MetricRuler
                              min={metric.min}
                              max={metric.max}
                              current={metric.current}
                              reachAvg={metric.reachAvg}
                              matchAvg={metric.matchAvg}
                        safetyAvg={metric.safetyAvg}
                        tierRanges={getTierRanges(metric.metric)}
                        isEn={isEn}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

         </section>

         {/* PART 2: Qualitative Analysis (AI Cards) */}
         <section>
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" /> 2. {isEn ? 'Qualitative Assessment (AI)' : '软性背景评估 (Qualitative AI)'}
               </h3>
               {!isAiLoading && (
                  <button onClick={handleRunAiAnalysis} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                     <Loader2 className="w-3 h-3" /> {isEn ? 'Re-analyze' : '重新分析'}
                  </button>
               )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <QualitativeCard 
                  title={isEn ? 'Leadership & Impact' : '领导力与影响力'}
                  icon={<Flag className="w-4 h-4 text-orange-500" />}
                  level={qualitativeAnalysis?.leadership.level || 'Unknown'}
                  analysis={qualitativeAnalysis?.leadership.text || ''}
                  isLoading={isAiLoading}
                  isEn={isEn}
               />
               <QualitativeCard 
                  title={isEn ? 'Competitions & Awards' : '竞赛与奖项'}
                  icon={<Award className="w-4 h-4 text-yellow-500" />}
                  level={qualitativeAnalysis?.competition.level || 'Unknown'}
                  analysis={qualitativeAnalysis?.competition.text || ''}
                  isLoading={isAiLoading}
                  isEn={isEn}
               />
               <QualitativeCard 
                  title={isEn ? 'Activity Depth' : '活动深度'}
                  icon={<Activity className="w-4 h-4 text-blue-500" />}
                  level={qualitativeAnalysis?.activity.level || 'Unknown'}
                  analysis={qualitativeAnalysis?.activity.text || ''}
                  isLoading={isAiLoading}
                  isEn={isEn}
               />
            </div>
         </section>

         {/* PART 3: Course Diagnosis */}
         <section className="bg-white p-6 rounded-xl border border-[#e5e0dc] shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary-600" /> 3. {isEn ? 'Course & Major Fit' : '选课与专业匹配度诊断'}
               </h3>
               <button 
                  onClick={handleRunCourseDiagnosis}
                  disabled={isCourseDiagLoading || currentCourses.length === 0}
                  className="px-4 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50"
               >
                  {isCourseDiagLoading ? (isEn ? 'Diagnosing...' : '诊断中...') : (isEn ? 'Run Diagnosis' : '运行诊断')}
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase">{isEn ? `Current Courses (${latestTerm?.gradeLevel || 'Latest'})` : `当前选课列表 (${latestTerm?.gradeLevel || 'Latest'})`}</p>
                  <div className="flex flex-wrap gap-2">
                     {currentCourses.map((c, i) => (
                        <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 group">
                           {c}
                           <button onClick={() => handleRemoveCourse(c)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3"/></button>
                        </span>
                     ))}
                     <input 
                        className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-500 w-40"
                        placeholder={isEn ? "+ Add Course" : "+ 添加课程"}
                        value={newCourseInput}
                        onChange={(e) => setNewCourseInput(e.target.value)}
                        onKeyDown={handleAddCourse}
                     />
                  </div>
               </div>

               <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 min-h-[120px]">
                  {courseDiagnosis ? (
                     <div className="space-y-3 animate-in fade-in">
                        <div className="flex items-center gap-2">
                           {courseDiagnosis.status === 'Safe' ? <CheckCircle className="w-5 h-5 text-green-500" /> : 
                            courseDiagnosis.status === 'Warning' ? <AlertTriangle className="w-5 h-5 text-yellow-500" /> : 
                            <AlertTriangle className="w-5 h-5 text-red-500" />}
                           <span className={`font-bold ${
                              courseDiagnosis.status === 'Safe' ? 'text-green-700' : 
                              courseDiagnosis.status === 'Warning' ? 'text-yellow-700' : 'text-red-700'
                           }`}>
                              {courseDiagnosis.status}
                           </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{courseDiagnosis.analysis}</p>
                        {courseDiagnosis.suggestions.length > 0 && (
                           <div className="space-y-1">
                              {courseDiagnosis.suggestions.map((s, i) => (
                                 <div key={i} className="flex items-start gap-2 text-xs text-primary-700 bg-primary-50 p-2 rounded">
                                    <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{s.content}</span>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <p className="text-xs">{isEn ? 'Add courses and click "Run Diagnosis"' : '添加课程后点击"运行诊断"'}</p>
                     </div>
                  )}
               </div>
            </div>
         </section>

         {/* PART 4: Action Matrix */}
         <section>
            <ActionMatrix 
               actionItems={actionItems}
               onToggleItem={handleToggleActionItem}
               isLoading={isActionLoading}
               onGenerate={handleGenerateActionPlan}
               isEn={isEn}
            />
         </section>

         {/* Navigation Footer */}
         <div className="flex justify-end pt-4 border-t border-gray-200">
            <button 
               onClick={handleSync}
               disabled={getSelectedCount() === 0}
               className="px-8 py-3 bg-gray-900 text-white rounded-full font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
               {isEn ? `Sync ${getSelectedCount()} Actions to Timeline (Step 6)` : `同步 ${getSelectedCount()} 项行动至时间轴 (Step 6)`} <ArrowRight className="w-4 h-4" />
            </button>
         </div>

      </div>
    </div>
  );
};

export default Step5Gap;
