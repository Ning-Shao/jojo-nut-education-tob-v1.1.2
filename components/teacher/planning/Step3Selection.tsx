
import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Target, Sliders, RotateCcw, Lightbulb, Sparkles, Search, Loader2, RefreshCw, AlertTriangle, CheckCircle, XCircle, School, X, BookOpen, Plus, ChevronRight, ChevronLeft, ChevronDown, Info } from '../../common/Icons';
import { TargetPreference, UniversityDisplay, SelectedSchool } from './PlanningData';
import { useLanguage } from '../../../contexts/LanguageContext';
import { calculateExamTotal, calculatedExamRules, type CalculatedExamKey } from '../../common/features/examScoreRules';

interface Step3Props {
  targetPreferences: TargetPreference[];
  simParams: any; // Temporarily using any to bypass strict type for now, or use exact type
  setSimParams: (val: any) => void;
  resetSimParams: () => void;
  schoolSearchQuery: string;
  setSchoolSearchQuery: (val: string) => void;
  selectedSchools: SelectedSchool[];
  handleAddSchool: (uni: UniversityDisplay, tier: 'Reach' | 'Match' | 'Safety', specificMajor?: string) => void;
  handleRemoveSchool: (id: string) => void;
  step3Tab: 'Recommend' | 'Search';
  setStep3Tab: (val: 'Recommend' | 'Search') => void;
  isRegenerating: boolean;
  handleRegenerateRecommendations: () => void;
  recommendedUniversities: UniversityDisplay[];
  getListHealth: () => { status: string; color: string; text: string };
  onNext: () => void;
}

// Demo-only data used to mirror the production card when the local mock profile
// has no configured major. This is presentation data, not an admissions source.
const SIMULATED_MAJOR_OPTIONS: Record<string, string[]> = {
  u3: [
    'Bachelor of Arts (with Honours) – Sociology with Foundation Year',
    'Bachelor of Arts (with Honours) – Politics and Sociology',
    'Bachelor of Arts (with Honours) – Sociology',
  ],
  u8: [
    'Bachelor of Science – Computer Science',
    'Bachelor of Science – Data Sciences',
    'Bachelor of Arts – Economics',
  ],
};

const Toggle = ({ checked, onChange, disabled, title }: { checked: boolean, onChange: (val: boolean) => void, disabled?: boolean, title?: string }) => (
  <button
    type="button"
    title={title}
    role="switch"
    aria-checked={checked}
    aria-label={title}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary-400 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-zinc-600'}`}
  >
    <span
      className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-3.5' : 'translate-x-0.5'}`}
    />
  </button>
);

const TierAddButton = ({
  label,
  tooltip,
  onClick,
  className,
}: {
  label: string;
  tooltip: string;
  onClick: () => void;
  className: string;
}) => (
  <span className="group/tier-tooltip relative inline-flex">
    <button
      type="button"
      onClick={onClick}
      aria-label={tooltip}
      className={`${className} focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1`}
    >
      {label}
    </button>
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-normal text-white opacity-0 shadow-lg transition-opacity group-hover/tier-tooltip:opacity-100 group-focus-within/tier-tooltip:opacity-100"
    >
      {tooltip}
    </span>
  </span>
);

const Step3Selection: React.FC<Step3Props> = ({
  targetPreferences, simParams, setSimParams, resetSimParams,
  schoolSearchQuery, setSchoolSearchQuery,
  selectedSchools, handleAddSchool, handleRemoveSchool,
  step3Tab, setStep3Tab, isRegenerating, handleRegenerateRecommendations,
  recommendedUniversities, getListHealth, onNext
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  const [activeRegionTab, setActiveRegionTab] = React.useState<string | null>(null);
  const [calculatedTotalNotice, setCalculatedTotalNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
     if (!calculatedTotalNotice) return;
     const timer = window.setTimeout(() => setCalculatedTotalNotice(null), 5000);
     return () => window.clearTimeout(timer);
  }, [calculatedTotalNotice]);

  const groupedUniversities = React.useMemo(() => {
     return recommendedUniversities.reduce((acc, uni) => {
        const region = uni.region || (isEn ? 'Other' : '其它');
        if (!acc[region]) acc[region] = [];
        acc[region].push(uni);
        return acc;
     }, {} as Record<string, typeof recommendedUniversities>);
  }, [recommendedUniversities, isEn]);

  const availableRegions = React.useMemo(() => {
     const regions = new Set<string>();
     if (targetPreferences && targetPreferences.length > 0) {
        targetPreferences.forEach(t => {
           if (t.region) regions.add(t.region);
        });
     }
     return Array.from(regions);
  }, [targetPreferences]);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  }, []);

  const scrollRegions = React.useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  }, []);

  React.useEffect(() => {
     checkScroll();
     window.addEventListener('resize', checkScroll);
     return () => window.removeEventListener('resize', checkScroll);
  }, [availableRegions, checkScroll]);

  React.useEffect(() => {
     if (availableRegions.length > 0 && (!activeRegionTab || !availableRegions.includes(activeRegionTab))) {
        setActiveRegionTab(availableRegions[0]);
     }
  }, [availableRegions, activeRegionTab]);

  return (
    <div className="flex h-full gap-6">
      {calculatedTotalNotice && typeof document !== 'undefined' && createPortal(
         <div role="status" aria-live="polite" className="fixed left-1/2 top-[35%] z-[10000] flex w-[340px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <XCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
            <span className="flex-1">{calculatedTotalNotice}</span>
            <button type="button" aria-label={isEn ? 'Close total score notice' : '关闭总分提示'} onClick={() => setCalculatedTotalNotice(null)} className="rounded p-0.5 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-1 focus:ring-red-400">
               <X className="h-4 w-4" />
            </button>
         </div>,
         document.body
      )}
      {/* Left Column: Context & Simulator */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-6">
         {/* Target Context */}
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
               <Target className="w-3 h-3" /> {isEn ? 'Step 2 Targets' : 'Step 2 目标设定'}
            </h4>
            {targetPreferences.length > 0 ? (
               <div className="space-y-2">
                  {targetPreferences.map((t) => (
                     <div key={t.id} className="text-sm border-l-2 border-primary-300 pl-2">
                        <div className="font-bold text-gray-800">{t.region === 'US' ? (isEn ? '🇺🇸 US' : '🇺🇸 美国') : t.region === 'UK' ? (isEn ? '🇬🇧 UK' : '🇬🇧 英国') : t.region}</div>
                        <div className="text-xs text-gray-500 truncate">{t.majors.join(', ') || (isEn ? 'Undecided' : '未定专业')}</div>
                     </div>
                  ))}
               </div>
            ) : (
               <p className="text-xs text-red-400 bg-red-50 p-2 rounded">{isEn ? 'Please set targets in Step 2 first' : '请先完成 Step 2 设定目标'}</p>
            )}
         </div>

         {/* Capability Simulator */}
         <div className="bg-white p-4 rounded-xl border border-primary-100 shadow-sm flex-1">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                  <Sliders className="w-4 h-4 text-primary-600" /> {isEn ? 'Capability Simulator' : '能力模拟器'}
               </h3>
               <button 
                  className="text-xs text-gray-400 hover:text-primary-600" 
                  onClick={resetSimParams}
                  title={isEn ? "Reset" : "重置"}
               >
                  <RotateCcw className="w-3 h-3"/>
               </button>
            </div>
            
            <div className="space-y-6">
               {/* Academic Scores */}
               <div className="py-3 first:pt-0">
                  <h4 className="mb-4 block text-xs font-bold text-gray-700">{isEn ? 'Academic Scores' : '学术成绩'}</h4>
                  <div className="space-y-3">
                     {/* A-Level */}
                     <div className="flex flex-col gap-2">
                        <div className="group flex items-center justify-between gap-3">
                           <div className="flex items-center gap-3">
                              <Toggle checked={simParams.alevelEnabled} onChange={(val) => setSimParams({...simParams, alevelEnabled: val})} title={isEn ? 'Enable A-Level' : '启用 A-Level'} />
                              <span className={`text-sm transition-colors ${simParams.alevelEnabled ? 'font-bold text-primary-700' : 'text-gray-600 group-hover:text-primary-600'}`}>A-Level</span>
                           </div>
                           <input
                              type="text"
                              inputMode="text"
                              value={simParams.alevelScore ?? ''}
                              disabled={!simParams.alevelEnabled}
                              placeholder="AAB / 12"
                              aria-label={isEn ? 'A-Level grades or score' : 'A-Level等级组合或分数'}
                              onChange={(event) => setSimParams({...simParams, alevelScore: event.target.value.toUpperCase().replace(/[^A-E*0-9.\s]/g, '')})}
                              className={`w-14 rounded-md border px-1.5 py-1 text-right text-xs font-bold uppercase outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-200 ${simParams.alevelEnabled ? 'border-gray-200 bg-white text-primary-700' : 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400 opacity-60'}`}
                           />
                        </div>
                        {simParams.alevelEnabled && (
                           <div className="pr-1 space-y-2">
                              {(simParams.alevelSubjects || []).map((sub: any, idx: number) => (
                                 <div key={sub.id} className="grid grid-cols-[minmax(0,1fr)_76px_36px_28px] items-center gap-1.5">
                                    <input type="text" className="flex-1 min-w-0 text-xs px-2 py-1.5 border rounded bg-white shadow-sm font-medium focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder={isEn ? "Subject" : "科目名称"} value={sub.name} title={sub.name?.trim() ? sub.name : undefined} onChange={(e) => {
                                       const newSubs = [...simParams.alevelSubjects];
                                       newSubs[idx].name = e.target.value;
                                       setSimParams({...simParams, alevelSubjects: newSubs});
                                    }} />
                                    <select className="w-full min-w-0 flex-shrink-0 text-xs px-2 py-1.5 border rounded bg-white text-gray-700 font-bold shadow-sm focus:ring-1 focus:ring-primary-500 focus:outline-none appearance-none cursor-pointer" value={sub.level || 'A-Level'} onChange={(e) => {
                                       const newSubs = [...simParams.alevelSubjects];
                                       const newLevel = e.target.value;
                                       const oldLevel = sub.level || 'A-Level';
                                       newSubs[idx].level = newLevel;
                                       if (newLevel === 'AS-Level' && oldLevel !== 'AS-Level') {
                                          if (newSubs[idx].grade === 'A*') newSubs[idx].grade = 'a';
                                          else newSubs[idx].grade = (newSubs[idx].grade || 'A').toLowerCase();
                                       } else if (newLevel === 'A-Level' && oldLevel !== 'A-Level') {
                                          newSubs[idx].grade = (newSubs[idx].grade || 'a').toUpperCase();
                                       }
                                       setSimParams({...simParams, alevelSubjects: newSubs});
                                    }}>
                                       <option value="A-Level">A-Level</option>
                                       <option value="AS-Level">AS-Level</option>
                                    </select>
                                    <input
                                       type="text"
                                       inputMode="text"
                                       value={sub.grade ?? ''}
                                       title={sub.grade || undefined}
                                       aria-label={`${isEn ? 'A-Level subject grade or score' : 'A-Level科目等级或分数'} ${idx + 1}`}
                                       className="w-full min-w-0 text-right flex-shrink-0 text-xs px-2 py-1.5 border rounded bg-white text-gray-700 font-bold shadow-sm focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                       onChange={(e) => {
                                          const newSubs = [...simParams.alevelSubjects];
                                          newSubs[idx] = {...newSubs[idx], grade: e.target.value};
                                          setSimParams({...simParams, alevelSubjects: newSubs, gpa: 4.0});
                                       }}
                                    />
                                    <button onClick={() => {
                                       const newSubs = simParams.alevelSubjects.filter((_: any, i: number) => i !== idx);
                                       setSimParams({...simParams, alevelSubjects: newSubs});
                                    }} className="text-gray-400 flex flex-shrink-0 justify-center items-center w-7 h-7 rounded border border-gray-200 bg-white hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                 </div>
                              ))}
                              <button className="flex items-center gap-1.5 text-xs text-primary-600 font-medium hover:text-primary-700 py-1 transition-colors" onClick={() => {
                                 setSimParams({...simParams, alevelSubjects: [...(simParams.alevelSubjects||[]), { id: Math.random().toString(), name: '', level: 'A-Level', grade: 'A' }]});
                              }}>
                                 <Plus className="w-3.5 h-3.5" /> {isEn ? 'Add Subject' : '添加科目'}
                              </button>
                           </div>
                        )}
                     </div>
                     {/* AP */}
                     <div className="flex flex-col gap-2">
                        <div className="group flex items-center justify-between gap-3">
                           <div className="flex items-center gap-3">
                              <button
                                 type="button"
                                 role="switch"
                                 aria-checked={!!simParams.apEnabled}
                                 aria-label={isEn ? 'Enable AP' : '启用 AP'}
                                 onClick={() => setSimParams({...simParams, apEnabled: !simParams.apEnabled})}
                                 className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary-400 ${simParams.apEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-zinc-600'}`}
                              >
                                 <span className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${simParams.apEnabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                              </button>
                              <span className={`text-sm transition-colors ${simParams.apEnabled ? 'font-bold text-primary-700 dark:text-primary-400' : 'text-gray-600 group-hover:text-primary-600 dark:text-zinc-400 dark:group-hover:text-primary-300'}`}>AP</span>
                           </div>
                           <div className="flex shrink-0 items-center gap-1">
                           <input
                              type="text"
                              inputMode="numeric"
                              value={simParams.apScore ?? '4'}
                              disabled={!simParams.apEnabled}
                              aria-label={isEn ? 'AP score' : 'AP 成绩'}
                              onChange={event => {
                                 const value = event.target.value;
                                 if (!/^-?\d*\.?\d*$/.test(value)) return;
                                 setSimParams({...simParams, apScore: value});
                              }}
                              className={`w-14 rounded-md border px-1.5 py-1 text-right text-xs font-bold outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-200 dark:border-zinc-700 dark:bg-zinc-800 ${simParams.apEnabled ? 'border-gray-200 bg-white text-primary-700 dark:text-primary-300' : 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400 opacity-60 dark:text-zinc-600'}`}
                           />
                           </div>
                        </div>
                        {simParams.apEnabled && (
                           <div className="pr-1 space-y-2">
                              {(simParams.apSubjects || []).map((sub: any, idx: number) => (
                                 <div key={sub.id} className="grid grid-cols-[minmax(0,1fr)_36px_28px] items-center gap-1.5">
                                    <input type="text" className="flex-1 min-w-0 text-xs px-2 py-1.5 border rounded bg-white shadow-sm font-medium focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder={isEn ? "Subject" : "科目名称"} value={sub.name} title={sub.name?.trim() ? sub.name : undefined} onChange={(e) => {
                                       const newSubs = [...simParams.apSubjects];
                                       newSubs[idx].name = e.target.value;
                                       setSimParams({...simParams, apSubjects: newSubs});
                                    }} />
                                    <select className="w-full min-w-0 text-right [text-align-last:right] flex-shrink-0 text-xs px-2 py-1.5 border rounded bg-white text-gray-700 font-bold shadow-sm focus:ring-1 focus:ring-primary-500 focus:outline-none appearance-none cursor-pointer" value={sub.grade} onChange={(e) => {
                                       const newSubs = [...simParams.apSubjects];
                                       newSubs[idx].grade = e.target.value;
                                       let count5 = 0, count4 = 0;
                                       newSubs.forEach(s => { if(s.grade === '5') count5++; else if(s.grade === '4') count4++; });
                                       const gpaVal = Math.min(4.0, 3.3 + (count5 * 0.1) + (count4 * 0.04));
                                       setSimParams({...simParams, apSubjects: newSubs, gpa: gpaVal});
                                    }}>
                                       {["5", "4", "3", "2", "1"].map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                    <button onClick={() => {
                                       const newSubs = simParams.apSubjects.filter((_: any, i: number) => i !== idx);
                                       let count5 = 0, count4 = 0;
                                       newSubs.forEach(s => { if(s.grade === '5') count5++; else if(s.grade === '4') count4++; });
                                       const gpaVal = Math.min(4.0, 3.3 + (count5 * 0.1) + (count4 * 0.04));
                                       setSimParams({...simParams, apSubjects: newSubs, gpa: gpaVal});
                                    }} className="text-gray-400 flex flex-shrink-0 justify-center items-center w-7 h-7 rounded border border-gray-200 bg-white hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                 </div>
                              ))}
                              <button className="flex items-center gap-1.5 text-xs text-primary-600 font-medium hover:text-primary-700 py-1 transition-colors" onClick={() => {
                                 setSimParams({...simParams, apSubjects: [...(simParams.apSubjects||[]), { id: Math.random().toString(), name: '', grade: '5' }]});
                              }}>
                                 <Plus className="w-3.5 h-3.5" /> {isEn ? 'Add Subject' : '添加科目'}
                              </button>
                           </div>
                        )}
                     </div>
                     {/* IB */}
                     <div className="flex flex-col gap-2">
                        <div className="group flex items-center justify-between gap-3">
                           <div className="flex items-center gap-3">
                              <button
                                 type="button"
                                 role="switch"
                                 aria-checked={!!simParams.ibEnabled}
                                 aria-label={isEn ? 'Enable IB' : '启用 IB'}
                                 onClick={() => setSimParams({...simParams, ibEnabled: !simParams.ibEnabled})}
                                 className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary-400 ${simParams.ibEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-zinc-600'}`}
                              >
                                 <span className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${simParams.ibEnabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                              </button>
                              <span className={`text-sm transition-colors ${simParams.ibEnabled ? 'font-bold text-primary-700 dark:text-primary-400' : 'text-gray-600 group-hover:text-primary-600 dark:text-zinc-400 dark:group-hover:text-primary-300'}`}>IB</span>
                           </div>
                           <div className="flex shrink-0 items-center gap-1">
                           <input
                              type="text"
                              inputMode="numeric"
                              value={simParams.ibScore ?? '38'}
                              disabled={!simParams.ibEnabled}
                              aria-label={isEn ? 'IB score' : 'IB 成绩'}
                              onChange={event => {
                                 const value = event.target.value;
                                 if (!/^-?\d*\.?\d*$/.test(value)) return;
                                 setSimParams({...simParams, ibScore: value});
                              }}
                              className={`w-14 rounded-md border px-1.5 py-1 text-right text-xs font-bold outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-200 dark:border-zinc-700 dark:bg-zinc-800 ${simParams.ibEnabled ? 'border-gray-200 bg-white text-primary-700 dark:text-primary-300' : 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400 opacity-60 dark:text-zinc-600'}`}
                           />
                           </div>
                        </div>
                        {simParams.ibEnabled && (
                           <div className="pr-1 space-y-2">
                              {(simParams.ibSubjects || []).map((sub: any, idx: number) => (
                                 <div key={sub.id} className="grid grid-cols-[minmax(0,1fr)_40px_36px_28px] items-center gap-1.5">
                                    <input type="text" className="flex-1 min-w-0 text-xs px-2 py-1.5 border rounded bg-white shadow-sm font-medium focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder={isEn ? "Subject" : "科目名称"} value={sub.name} title={sub.name?.trim() ? sub.name : undefined} onChange={(e) => {
                                       const newSubs = [...simParams.ibSubjects];
                                       newSubs[idx].name = e.target.value;
                                       setSimParams({...simParams, ibSubjects: newSubs});
                                    }} />
                                    <select className="w-full min-w-0 flex-shrink-0 text-xs px-2 py-1.5 border rounded bg-white text-gray-700 font-bold shadow-sm focus:ring-1 focus:ring-primary-500 focus:outline-none appearance-none cursor-pointer" value={sub.level || 'HL'} onChange={(e) => {
                                       const newSubs = [...simParams.ibSubjects];
                                       newSubs[idx].level = e.target.value;
                                       setSimParams({...simParams, ibSubjects: newSubs});
                                    }}>
                                       <option value="HL">HL</option>
                                       <option value="SL">SL</option>
                                    </select>
                                    <select className="w-full min-w-0 text-right [text-align-last:right] flex-shrink-0 text-xs px-2 py-1.5 border rounded bg-white text-gray-700 font-bold shadow-sm focus:ring-1 focus:ring-primary-500 focus:outline-none appearance-none cursor-pointer" value={sub.grade} onChange={(e) => {
                                       const newSubs = [...simParams.ibSubjects];
                                       newSubs[idx].grade = e.target.value;
                                       let ibScore = 0;
                                       newSubs.forEach(s => ibScore += parseInt(s.grade) || 0);
                                       const gpaVal = newSubs.length > 0 ? (ibScore / (newSubs.length * 7)) * 4.0 : 3.8;
                                       setSimParams({...simParams, ibSubjects: newSubs, gpa: gpaVal});
                                    }}>
                                       {["7", "6", "5", "4", "3", "2", "1"].map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                    <button onClick={() => {
                                       const newSubs = simParams.ibSubjects.filter((_: any, i: number) => i !== idx);
                                       let ibScore = 0;
                                       newSubs.forEach(s => ibScore += parseInt(s.grade) || 0);
                                       const gpaVal = newSubs.length > 0 ? (ibScore / (newSubs.length * 7)) * 4.0 : 3.8;
                                       setSimParams({...simParams, ibSubjects: newSubs, gpa: gpaVal});
                                    }} className="text-gray-400 flex flex-shrink-0 justify-center items-center w-7 h-7 rounded border border-gray-200 bg-white hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                 </div>
                              ))}
                              <button className="flex items-center gap-1.5 text-xs text-primary-600 font-medium hover:text-primary-700 py-1 transition-colors" onClick={() => {
                                 setSimParams({...simParams, ibSubjects: [...(simParams.ibSubjects||[]), { id: Math.random().toString(), name: '', level: 'HL', grade: '7' }]});
                              }}>
                                 <Plus className="w-3.5 h-3.5" /> {isEn ? 'Add Subject' : '添加科目'}
                              </button>
                           </div>
                        )}
                     </div>
                     {/* ATAR */}
                     <div className="group flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                           <Toggle checked={simParams.atarEnabled} onChange={(val) => setSimParams({...simParams, atarEnabled: val})} title={isEn ? 'Enable/Disable ATAR' : '启用/禁用 ATAR'} />
                           <span className={`text-xs font-medium ${simParams.atarEnabled ? 'text-gray-700' : 'text-gray-400'}`}>ATAR</span>
                        </div>
                        <input
                           type="text"
                           inputMode="decimal"
                           value={simParams.atarValue ?? ''}
                           disabled={!simParams.atarEnabled}
                           placeholder="90"
                           aria-label={isEn ? 'ATAR score' : 'ATAR 成绩'}
                           onChange={(event) => {
                              const value = event.target.value;
                              if (!/^\d*\.?\d*$/.test(value)) return;
                              const score = Number(value);
                              if (value !== '' && (!Number.isFinite(score) || score < 0 || score > 99.95)) return;
                              setSimParams({...simParams, atarValue: value});
                           }}
                           className={`w-14 rounded-md border px-1.5 py-1 text-right text-xs font-bold outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-200 ${simParams.atarEnabled ? 'border-gray-200 bg-white text-primary-700' : 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400 opacity-60'}`}
                        />
                     </div>
                  </div>
               </div>

               {/* Standardized Tests */}
               <div className="py-3 first:pt-0">
                  <h4 className="mb-4 block text-xs font-bold text-gray-700">{isEn ? 'Standardized tests' : '标化成绩'}</h4>
                  <div className="space-y-3">
                     {(Object.keys(calculatedExamRules) as CalculatedExamKey[]).map(key => {
                        const rule = calculatedExamRules[key];
                        const label = rule.label;
                        const enabled = !!simParams[`${key}Enabled`];
                        const supportsSections = key === 'toefl' || key === 'oldToefl' || key === 'ielts';
                        const expanded = supportsSections && !!simParams.expandedLanguageSections?.[key];
                        const calculatedTotal = supportsSections ? calculateExamTotal(key, simParams.languageSectionScores?.[key] ?? {}) : null;
                        const directTotal = simParams[`${key}Value`] ?? '';
                        const directScore = Number(directTotal);
                        const directTotalValid = directTotal !== '' && Number.isFinite(directScore) && directScore >= rule.totalMin && directScore <= rule.totalMax
                           && Math.abs((directScore - rule.totalMin) / rule.totalStep - Math.round((directScore - rule.totalMin) / rule.totalStep)) < 1e-8;
                        const updateDirectTotal = (value: string) => {
                           const score = Number(value);
                           const valid = value !== '' && Number.isFinite(score) && score >= rule.totalMin && score <= rule.totalMax;
                           const derived = key === 'sat' ? { sat: valid ? score : 0 }
                              : key === 'act' ? { sat: valid ? score * 40 : 0 }
                              : { toefl: valid ? (key === 'toefl' ? Math.round(score * 20) : key === 'ielts' ? score * 12 : score) : 0 };
                           setSimParams({...simParams, [`${key}Value`]: value, ...derived});
                        };
                        return (
                           <div key={key}>
                              <div className={supportsSections
                                 ? 'group grid grid-cols-[28px_minmax(0,1fr)_22px_56px] items-center gap-x-2'
                                 : 'group flex items-center justify-between gap-3'}>
                                 <div className={supportsSections ? 'contents' : 'flex items-center gap-3'}>
                                    <button
                                       type="button"
                                       role="switch"
                                       aria-checked={enabled}
                                       aria-label={`${isEn ? 'Enable' : '启用'} ${label}`}
                                       onClick={() => setSimParams({...simParams, [`${key}Enabled`]: !enabled, expandedLanguageSections: {...simParams.expandedLanguageSections, [key]: false}})}
                                       className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary-400 ${enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-zinc-600'}`}
                                    >
                                       <span className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                    </button>
                                    <span className={`text-sm transition-colors ${enabled ? 'font-bold text-primary-700' : 'text-gray-600 group-hover:text-primary-600'}`}>{label}</span>
                                    {supportsSections && <button
                                          type="button"
                                          disabled={!enabled}
                                          aria-expanded={expanded}
                                          aria-controls={`sim-language-sections-${key}`}
                                          title={isEn ? (expanded ? 'Collapse section scores' : 'Add section scores') : (expanded ? '收起单项成绩' : '添加单项成绩')}
                                          aria-label={`${label} ${isEn ? (expanded ? 'Collapse section scores' : 'Add section scores') : (expanded ? '收起单项成绩' : '添加单项成绩')}`}
                                          onClick={() => setSimParams({...simParams, expandedLanguageSections: {...simParams.expandedLanguageSections, [key]: !expanded}})}
                                          className="inline-flex h-[26px] w-[22px] shrink-0 items-center justify-center rounded text-xs text-gray-500 transition-colors hover:text-primary-700 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary-400 disabled:cursor-not-allowed disabled:opacity-40"
                                       >
                                          <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                    </button>}
                                 </div>
                                 <div className={supportsSections ? 'contents' : 'flex shrink-0 items-center gap-1'}>
                                    <input
                                       type="text"
                                       inputMode={rule.totalStep < 1 ? 'decimal' : 'numeric'}
                                       value={directTotal}
                                       placeholder={isEn ? 'Incomplete' : '待补全'}
                                       disabled={!enabled}
                                       aria-invalid={enabled && !directTotalValid}
                                       aria-label={`${label} ${isEn ? 'score' : '成绩'}`}
                                       onChange={event => {
                                          const value = event.target.value;
                                          if (!/^\d*\.?\d*$/.test(value)) return;
                                          updateDirectTotal(value);
                                          if (key === 'toefl' && value !== '') {
                                             const numericValue = Number(value);
                                             if (Number.isFinite(numericValue) && (numericValue < 1 || numericValue > 6)) {
                                                setCalculatedTotalNotice(isEn ? 'Input value must be between 1 and 6' : '输入数值须在1—6之间');
                                             } else {
                                                setCalculatedTotalNotice(null);
                                             }
                                          } else if (key === 'toefl') {
                                             setCalculatedTotalNotice(null);
                                          }
                                       }}
                                       onBlur={event => {
                                          if (event.target.value === '') return;
                                          if (key === 'toefl') return;
                                          const score = Number(event.target.value);
                                          if (!Number.isFinite(score)) return;
                                          const normalized = Math.min(rule.totalMax, Math.max(rule.totalMin, Math.round((score - rule.totalMin) / rule.totalStep) * rule.totalStep + rule.totalMin));
                                          updateDirectTotal(String(normalized));
                                       }}
                                       className={`h-[26px] w-14 shrink-0 rounded-md border px-1.5 py-1 text-right text-xs font-bold outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-inset focus:ring-primary-200 ${enabled ? 'border-gray-200 bg-gray-50 text-primary-700' : 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400 opacity-60'}`}
                                    />
                                 </div>
                              </div>
                              {supportsSections && <div id={`sim-language-sections-${key}`} hidden={!enabled || !expanded} className="mt-2">
                                    <div className={`grid gap-1.5 ${rule.sections.length === 2 ? 'grid-cols-2' : 'grid-cols-4'}`}>
                                       {rule.sections.map(sectionRule => (
                                          <label key={sectionRule.key} className="block">
                                             <span className="mb-1 block truncate text-center text-[10px] font-bold text-gray-500" title={sectionRule.label}>{sectionRule.shortLabel}</span>
                                             <input
                                                type="text"
                                                inputMode={sectionRule.step < 1 ? 'decimal' : 'numeric'}
                                                value={simParams.languageSectionScores?.[key]?.[sectionRule.key] ?? ''}
                                                disabled={!enabled}
                                                placeholder="—"
                                                aria-label={`${label} ${sectionRule.label}${sectionRule.optional ? ` ${isEn ? 'optional' : '可选'}` : ''}`}
                                                onChange={event => {
                                                   const value = event.target.value;
                                                   if (!/^\d*\.?\d*$/.test(value)) return;
                                                   const nextSections = {...simParams.languageSectionScores, [key]: {...simParams.languageSectionScores?.[key], [sectionRule.key]: value}};
                                                   const nextTotal = calculateExamTotal(key, nextSections[key]);
                                                   if (nextTotal !== null) {
                                                      const displayTotal = rule.totalStep < 1 ? nextTotal.toFixed(1) : String(nextTotal);
                                                      setCalculatedTotalNotice(isEn ? `Total should be ${displayTotal}` : `总分应为${displayTotal}分`);
                                                   } else {
                                                      setCalculatedTotalNotice(null);
                                                   }
                                                   setSimParams({...simParams, languageSectionScores: nextSections});
                                                }}
                                                className="w-full rounded-md border border-gray-200 bg-white px-1 py-1.5 text-right text-[11px] font-bold text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-inset focus:ring-primary-200"
                                             />
                                          </label>
                                       ))}
                                    </div>
                                 </div>
                              }
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>

            <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 leading-relaxed border border-gray-100">
               <Lightbulb className="w-3 h-3 text-yellow-500 inline mr-1" />
               {isEn ? 'Adjust scores to simulate admission probabilities and refresh recommendations.' : '调整成绩可实时模拟不同成绩组合下的录取概率与推荐列表变化。'}
            </div>
         </div>
      </div>

      {/* Middle Column: Discovery */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-[#e5e0dc] overflow-hidden">
         <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex gap-2">
               <div className="flex bg-gray-200 p-1 rounded-lg">
                  <button 
                     onClick={() => setStep3Tab('Recommend')}
                     className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1
                        ${step3Tab === 'Recommend' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'}
                     `}
                  >
                     <Sparkles className="w-3 h-3" /> {isEn ? 'AI Recommend' : '智能推荐'}
                  </button>
                  <button 
                     onClick={() => setStep3Tab('Search')}
                     className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1
                        ${step3Tab === 'Search' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'}
                     `}
                  >
                     <Search className="w-3 h-3" /> {isEn ? 'Manual Search' : '自主选校'}
                  </button>
               </div>
               
               {step3Tab === 'Recommend' && (
                  <button 
                    onClick={handleRegenerateRecommendations}
                    disabled={isRegenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-primary-200 text-primary-700 rounded-lg text-xs font-bold hover:bg-primary-50 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isRegenerating ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCw className="w-3 h-3"/>}
                    {isRegenerating ? (isEn ? 'Refreshing...' : '刷新中...') : (isEn ? 'Refresh Recommendations' : '根据目标刷新推荐')}
                  </button>
               )}
            </div>

            {step3Tab === 'Search' && (
               <div className="relative">
                  <input 
                     type="text" 
                     placeholder={isEn ? "Search school..." : "搜索大学名称..."}
                     className="pl-7 pr-2 py-1.5 bg-white border border-gray-300 rounded-md text-xs w-40 focus:border-primary-400 outline-none"
                     value={schoolSearchQuery}
                     onChange={(e) => setSchoolSearchQuery(e.target.value)}
                  />
                  <Search className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
               </div>
            )}
         </div>

         <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
            {simParams.toefl < 100 && (
               <div className="mb-3 bg-orange-50 border border-orange-100 rounded-lg p-2.5 flex items-center gap-2 animate-in slide-in-from-top-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-orange-700 font-medium">
                     {isEn ? 'Language Risk: Current TOEFL is below Top 30 threshold.' : '语言风险预警：当前 TOEFL 低于部分 Top 30 院校门槛。'}
                  </span>
               </div>
            )}

            {availableRegions.length > 0 && (
               <div className="relative mb-5 w-full flex items-center group/scroll">
                  {canScrollLeft && (
                     <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-gray-100 via-gray-100/90 to-transparent z-10 flex items-center justify-start rounded-l-2xl pl-1">
                        <button onClick={() => scrollRegions('left')} className="p-1 hover:bg-gray-200/50 rounded-full text-gray-400 hover:text-gray-700 transition-colors pointer-events-auto">
                           <ChevronLeft className="w-4 h-4" />
                        </button>
                     </div>
                  )}
                  <div 
                     ref={scrollRef}
                     onScroll={checkScroll}
                     className="flex overflow-x-auto gap-1.5 bg-gray-100/80 p-1.5 rounded-2xl w-full snap-x scroll-smooth relative z-0"
                     style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                     {availableRegions.map(region => {
                     const unisList = groupedUniversities[region] || [];
                     const unisCount = unisList.length;
                     const displayRegion = region === 'US' ? (isEn ? '🇺🇸 US' : '🇺🇸 美国') : 
                                           region === 'UK' ? (isEn ? '🇬🇧 UK' : '🇬🇧 英国') : 
                                           region === 'HK' ? (isEn ? '🇭🇰 Hong Kong' : '🇭🇰 中国香港') : 
                                           region === 'SG' ? (isEn ? '🇸🇬 Singapore' : '🇸🇬 新加坡') : 
                                           region === 'AU' ? (isEn ? '🇦🇺 Australia' : '🇦🇺 澳大利亚') : 
                                           region === 'CA' ? (isEn ? '🇨🇦 Canada' : '🇨🇦 加拿大') :
                                           region === 'EU' ? (isEn ? '🇪🇺 Europe' : '🇪🇺 欧洲') :
                                           region;
                     
                     const isActive = activeRegionTab === region;

                     return (
                        <button
                           key={region}
                           onClick={() => setActiveRegionTab(region)}
                           className={`group relative px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-200 ease-out flex-1 flex justify-center items-center min-w-[max-content] sm:min-w-[120px] gap-2 outline-none
                              ${isActive ? 'text-primary-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}
                           `}
                        >
                           {isActive && (
                              <motion.div
                                 layoutId="activeRegionBg"
                                 className="absolute inset-0 bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/60"
                                 transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                              />
                           )}
                           <span className="relative z-10 whitespace-nowrap">{displayRegion}</span>
                           <span className={`relative z-10 text-[10px] px-2 py-0.5 rounded-full font-bold transition-all duration-300
                              ${isActive 
                                 ? 'bg-primary-100/80 text-primary-700 shadow-sm' 
                                 : 'bg-gray-200/80 text-gray-500 group-hover:bg-gray-300/80 group-hover:text-gray-700'}
                           `}>
                              {unisCount}
                           </span>
                        </button>
                     )
                  })}
                  </div>
                  {canScrollRight && (
                     <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-100 via-gray-100/90 to-transparent z-10 flex items-center justify-end rounded-r-2xl pr-1">
                        <button onClick={() => scrollRegions('right')} className="p-1 hover:bg-gray-200/50 rounded-full text-gray-400 hover:text-gray-700 transition-colors pointer-events-auto">
                           <ChevronRight className="w-4 h-4 animate-pulse relative right-[2px]" />
                        </button>
                     </div>
                  )}
               </div>
            )}

            <div className="space-y-3">
               {activeRegionTab && (!groupedUniversities[activeRegionTab] || groupedUniversities[activeRegionTab].length === 0) && (
                  <div className="text-center py-12 bg-white border border-gray-100 rounded-xl shadow-sm mx-1">
                     <p className="text-gray-500 text-sm font-medium mb-1.5">
                        {isEn ? 'Database updating, stay tuned.' : '数据库更新中，敬请期待'}
                     </p>
                     <p className="text-gray-400 text-xs px-4">
                        {isEn ? 'We are expanding our institutional data for this region.' : '我们正在积极扩增该地区的院校数据与分析模型'}
                     </p>
                  </div>
               )}
               {activeRegionTab && groupedUniversities[activeRegionTab] && groupedUniversities[activeRegionTab].map(uni => {
                  const isSelected = selectedSchools.some(s => s.uni.id === uni.id);
                  const matchingTarget = targetPreferences.find(t => t.region === uni.region);
                  const configuredMajors = matchingTarget?.majors || [];
                  const targetMajors = configuredMajors.length > 0
                     ? configuredMajors
                     : (SIMULATED_MAJOR_OPTIONS[uni.id] || []);

                  return (
                     <div key={uni.id} className={`bg-white border rounded-xl p-3 shadow-sm transition-all group relative
                        ${isSelected ? 'border-primary-200 bg-primary-50/30' : 'border-gray-200 hover:border-primary-300 hover:shadow-md'}
                     `}>
                        <div className="flex items-start gap-3">
                           <img src={uni.logo} className="w-10 h-10 rounded object-contain bg-white border border-gray-100 p-0.5 flex-shrink-0" alt={uni.name} />
                           <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                 <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                       <h4 className="font-bold text-gray-900 text-sm truncate max-w-full">{uni.name}</h4>
                                       <span className="text-xs text-gray-500 truncate max-w-full" title={isEn ? `Ranking: #${uni.rank}` : `排名：#${uni.rank}`}>
                                          #{uni.rank}
                                       </span>
                                    </div>
                                 </div>
                                 <div className="text-right flex-shrink-0">
                                    <div className="flex items-start justify-end gap-0.5">
                                       <div className={`text-lg font-bold leading-none ${uni.matchScore! >= 80 ? 'text-green-600' : (uni.matchScore ?? 0) >= 60 ? 'text-primary-600' : 'text-red-500'}`}>
                                          {uni.matchScore}
                                       </div>
                                       <div className="group/match-info relative -mt-1">
                                          <button
                                             type="button"
                                             aria-label={isEn ? 'How the match score is calculated' : '匹配度分数计算说明'}
                                             className="rounded-full text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1"
                                          >
                                             <Info className="h-3 w-3" />
                                          </button>
                                          <div
                                             role="tooltip"
                                             className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 w-56 rounded-md bg-gray-900 px-2.5 py-2 text-left text-[11px] font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover/match-info:opacity-100 group-focus-within/match-info:opacity-100"
                                          >
                                             {isEn ? 'The match score is calculated from xxxx.' : '匹配度分数由xxxx计算而来。'}
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              {targetMajors.length > 0 && (
                                 <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                       <div className="flex items-center gap-1.5 text-xs text-indigo-900 px-2 py-0.5 rounded-md border border-indigo-100/50 bg-indigo-50/30 w-fit mb-1">
                                          <Target className="w-3 h-3 text-indigo-600" />
                                          <span className="font-bold text-indigo-700">{isEn ? 'Major Match:' : '专业匹配:'}</span>
                                       </div>
                                       <span className="group/win-rate relative inline-block mb-1 flex-shrink-0">
                                          <span
                                             tabIndex={0}
                                             className={`inline-block cursor-help whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1
                                                ${uni.winRate === 'High' ? 'bg-green-100 text-green-700' : uni.winRate === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-red-50 text-red-700 border border-red-100'}
                                             `}
                                          >
                                             Win: {uni.winRate}
                                          </span>
                                          <span
                                             role="tooltip"
                                             className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-[11px] font-normal text-white opacity-0 shadow-lg transition-opacity group-hover/win-rate:opacity-100 group-focus-within/win-rate:opacity-100"
                                          >
                                             {isEn ? `Admission chance: ${uni.winRate}` : `录取率：${uni.winRate === 'High' ? '高' : uni.winRate === 'Medium' ? '中' : '低'}`}
                                          </span>
                                       </span>
                                    </div>
                                    {targetMajors.map(major => {
                                       const isMajorSelected = selectedSchools.some(s => s.uni.id === uni.id && s.major === major);
                                       return (
                                          <div key={major} className="flex justify-between items-center bg-gray-50/80 border border-gray-100 px-2 py-1.5 rounded text-xs hover:bg-white hover:shadow-sm transition-all group/major gap-2">
                                             <span className="font-medium text-gray-700 pr-2 min-w-0 flex-1" title={major}>{major}</span>
                                             {!isMajorSelected ? (
                                                <div className="flex gap-1 opacity-60 group-hover/major:opacity-100 transition-opacity flex-shrink-0">
                                                   <TierAddButton label="+R" tooltip="Reach 冲刺" onClick={() => handleAddSchool(uni, 'Reach', major)} className="px-1.5 py-0.5 text-[10px] font-bold bg-white text-red-600 border border-red-200 rounded hover:bg-red-50 hover:border-red-300" />
                                                   <TierAddButton label="+M" tooltip="Match 匹配" onClick={() => handleAddSchool(uni, 'Match', major)} className="px-1.5 py-0.5 text-[10px] font-bold bg-white text-blue-600 border border-blue-200 rounded hover:bg-blue-50 hover:border-blue-300" />
                                                   <TierAddButton label="+S" tooltip="Safety 保底" onClick={() => handleAddSchool(uni, 'Safety', major)} className="px-1.5 py-0.5 text-[10px] font-bold bg-white text-green-600 border border-green-200 rounded hover:bg-green-50 hover:border-green-300" />
                                                </div>
                                             ) : (
                                                <span className="text-[10px] text-green-600 flex items-center gap-1 font-medium bg-green-50 px-1.5 py-0.5 rounded border border-green-100 flex-shrink-0">
                                                   <CheckCircle className="w-3 h-3" /> Added
                                                </span>
                                             )}
                                          </div>
                                       );
                                    })}
                                 </div>
                              )}

                              {targetMajors.length === 0 && (
                                 <div className="flex justify-end">
                                    <span className="group/win-rate relative inline-block">
                                       <span tabIndex={0} className={`inline-block cursor-help whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1 ${uni.winRate === 'High' ? 'bg-green-100 text-green-700' : uni.winRate === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                          Win: {uni.winRate}
                                       </span>
                                       <span role="tooltip" className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-[11px] font-normal text-white opacity-0 shadow-lg transition-opacity group-hover/win-rate:opacity-100 group-focus-within/win-rate:opacity-100">
                                          {isEn ? `Admission chance: ${uni.winRate}` : `录取率：${uni.winRate === 'High' ? '高' : uni.winRate === 'Medium' ? '中' : '低'}`}
                                       </span>
                                    </span>
                                 </div>
                              )}

                              <div className="flex flex-wrap gap-1">
                                 {uni.tags.map(t => <span key={t} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{t}</span>)}
                              </div>
                           </div>
                        </div>

                        {uni.reason && (
                           <div className="mt-2 pt-2 border-t border-dashed border-gray-100 text-xs text-gray-500 leading-snug">
                              <span className="font-bold text-gray-400">{isEn ? 'AI Analysis: ' : 'AI 分析：'}</span>{uni.reason}
                           </div>
                        )}

                        {targetMajors.length === 0 && !isSelected && (
                           <div className="mt-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleAddSchool(uni, 'Reach')} className="px-2 py-1 text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100">+ Reach</button>
                              <button onClick={() => handleAddSchool(uni, 'Match')} className="px-2 py-1 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100">+ Match</button>
                              <button onClick={() => handleAddSchool(uni, 'Safety')} className="px-2 py-1 text-[10px] font-bold bg-green-50 text-green-600 border border-green-200 rounded hover:bg-green-100">+ Safety</button>
                           </div>
                        )}
                                 
                        {targetMajors.length === 0 && isSelected && (
                           <div className="absolute top-2 right-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                           </div>
                        )}
                     </div>
                  )
               })}
               {recommendedUniversities.length === 0 && targetPreferences.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-xs">
                     {step3Tab === 'Recommend' ? (
                        <>
                           <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-20" />
                           <p>{isEn ? 'Please set target regions in Step 2' : '请先在 Step 2 设定目标国家/地区'}</p>
                        </>
                     ) : (
                        <p>{isEn ? 'No results found' : '没有找到符合条件的学校'}</p>
                     )}
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* Right Column: List & Health */}
      <div className="w-72 flex-shrink-0 bg-white rounded-xl shadow-sm border border-[#e5e0dc] flex flex-col">
         <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
               <School className="w-4 h-4 text-primary-600" /> {isEn ? 'Selected List' : '定校清单'} ({selectedSchools.length})
            </h3>
            {/* Health Monitor */}
            <div className="mt-3 bg-white border border-gray-200 rounded-lg p-2">
               <div className="flex justify-between items-center text-[10px] mb-1">
                  <span className="font-bold text-gray-500">{isEn ? 'STRUCTURE HEALTH' : 'STRUCTURE HEALTH'}</span>
                  <span className={`font-bold ${getListHealth().color}`}>{getListHealth().status}</span>
               </div>
               <div className="flex h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-1">
                  <div className="bg-red-400 h-full" style={{width: `${(selectedSchools.filter(s=>s.tier==='Reach').length / Math.max(selectedSchools.length, 1))*100}%`}}></div>
                  <div className="bg-blue-400 h-full" style={{width: `${(selectedSchools.filter(s=>s.tier==='Match').length / Math.max(selectedSchools.length, 1))*100}%`}}></div>
                  <div className="bg-green-400 h-full" style={{width: `${(selectedSchools.filter(s=>s.tier==='Safety').length / Math.max(selectedSchools.length, 1))*100}%`}}></div>
               </div>
               <p className="text-[10px] text-gray-400">{getListHealth().text}</p>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {['Reach', 'Match', 'Safety'].map(tier => {
               const schools = selectedSchools.filter(s => s.tier === tier);
               const bg = tier === 'Reach' ? 'bg-red-50 text-red-700 border-red-100' : tier === 'Match' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100';
               
               return (
                  <div key={tier}>
                     <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border uppercase ${bg}`}>{tier}</span>
                        <span className="text-[10px] text-gray-400">{schools.length}</span>
                     </div>
                     <div className="space-y-1.5 min-h-[30px] p-1 rounded-lg border border-dashed border-gray-100 bg-gray-50/50">
                        {schools.map(s => (
                           <div key={s.id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 shadow-sm group">
                              <div className="flex flex-col overflow-hidden w-full">
                                 <div className="flex items-center gap-2">
                                    <img src={s.uni.logo} className="w-4 h-4 object-contain" alt="" />
                                    <span className="text-xs font-medium text-gray-700 truncate">{s.uni.name}</span>
                                 </div>
                                 {s.major && (
                                    <div className="flex items-center justify-between pl-6 mt-0.5">
                                       <span className="text-[10px] text-gray-400 truncate max-w-[100px]">{s.major}</span>
                                    </div>
                                 )}
                              </div>
                              <button onClick={() => handleRemoveSchool(s.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                 <X className="w-3 h-3" />
                              </button>
                           </div>
                        ))}
                        {schools.length === 0 && <p className="text-[10px] text-gray-300 text-center py-1">{isEn ? 'Drag or add here' : 'Drag or add here'}</p>}
                     </div>
                  </div>
               )
            })}
         </div>

         <div className="p-4 border-t border-gray-200 bg-gray-50/50 space-y-3">
            <button 
               onClick={onNext}
               disabled={selectedSchools.length === 0}
               className="w-full py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
               <CheckCircle className="w-3 h-3" /> {isEn ? 'Confirm & Proceed' : '确认定校并推送 (Confirm)'}
            </button>
         </div>
      </div>
    </div>
  );
};

export default Step3Selection;
