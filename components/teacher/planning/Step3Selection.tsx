
import React from 'react';
import { motion } from 'motion/react';
import { Target, Sliders, RotateCcw, Lightbulb, Sparkles, Search, Loader2, RefreshCw, AlertTriangle, CheckCircle, School, X, BookOpen, Plus, ChevronRight, ChevronLeft } from '../../common/Icons';
import { TargetPreference, UniversityDisplay, SelectedSchool } from './PlanningData';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getInitialSimParams } from '../StudentPlanning';

interface Step3Props {
  targetPreferences: TargetPreference[];
  simParams: any; // Temporarily using any to bypass strict type for now, or use exact type
  setSimParams: (val: any) => void;
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

const Toggle = ({ checked, onChange, disabled, title }: { checked: boolean, onChange: (val: boolean) => void, disabled?: boolean, title?: string }) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-4 w-7 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:ring-offset-1 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${checked ? 'bg-emerald-500' : 'bg-gray-300'}`}
  >
    <span
      className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-3.5' : 'translate-x-0.5'}`}
    />
  </button>
);

const Step3Selection: React.FC<Step3Props> = ({
  targetPreferences, simParams, setSimParams,
  schoolSearchQuery, setSchoolSearchQuery,
  selectedSchools, handleAddSchool, handleRemoveSchool,
  step3Tab, setStep3Tab, isRegenerating, handleRegenerateRecommendations,
  recommendedUniversities, getListHealth, onNext
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  const [activeRegionTab, setActiveRegionTab] = React.useState<string | null>(null);

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
                  onClick={() => setSimParams(getInitialSimParams())}
                  title={isEn ? "Reset" : "重置"}
               >
                  <RotateCcw className="w-3 h-3"/>
               </button>
            </div>
            
            <div className="space-y-6">
               {/* Academic Scores */}
               <div>
                  <h4 className="text-xs font-bold text-gray-700 mb-3">{isEn ? 'Academic Scores' : '学术成绩'}</h4>
                  <div className="space-y-4 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                     {/* A-Level */}
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                           <Toggle checked={simParams.alevelEnabled} onChange={(val) => setSimParams({...simParams, alevelEnabled: val})} title={isEn ? "Enable/Disable" : "启用/禁用"} />
                           <span className={`text-xs font-medium ${simParams.alevelEnabled ? 'text-gray-700' : 'text-gray-400'}`}>{isEn ? 'Predicted A-Level' : 'A-Level预估分'}</span>
                        </div>
                        {simParams.alevelEnabled && (
                           <div className="pl-9 pr-1 space-y-2">
                              {(simParams.alevelSubjects || []).map((sub: any, idx: number) => (
                                 <div key={sub.id} className="flex items-center gap-2">
                                    <input type="text" className="flex-1 min-w-0 text-xs px-2 py-1.5 border rounded bg-white shadow-sm font-medium focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder={isEn ? "Subject" : "科目名称"} value={sub.name} onChange={(e) => {
                                       const newSubs = [...simParams.alevelSubjects];
                                       newSubs[idx].name = e.target.value;
                                       setSimParams({...simParams, alevelSubjects: newSubs});
                                    }} />
                                    <select className="flex-shrink-0 text-xs px-2 py-1.5 border rounded bg-white text-gray-700 font-bold shadow-sm focus:ring-1 focus:ring-primary-500 focus:outline-none appearance-none cursor-pointer" value={sub.level || 'A-Level'} onChange={(e) => {
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
                                    <select className="flex-shrink-0 text-xs px-2 py-1.5 border rounded bg-white text-gray-700 font-bold shadow-sm focus:ring-1 focus:ring-primary-500 focus:outline-none appearance-none cursor-pointer" value={sub.grade} onChange={(e) => {
                                       const newSubs = [...simParams.alevelSubjects];
                                       newSubs[idx].grade = e.target.value;
                                       setSimParams({...simParams, alevelSubjects: newSubs, gpa: 4.0});
                                    }}>
                                       {sub.level === 'AS-Level' 
                                          ? ["a", "b", "c", "d", "e", "u"].map(g => <option key={g} value={g}>{g}</option>)
                                          : ["A*", "A", "B", "C", "D", "E", "U"].map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
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
                        <div className="flex items-center gap-2">
                           <Toggle checked={simParams.apEnabled} onChange={(val) => setSimParams({...simParams, apEnabled: val})} title={isEn ? "Enable/Disable" : "启用/禁用"} />
                           <span className={`text-xs font-medium ${simParams.apEnabled ? 'text-gray-700' : 'text-gray-400'}`}>AP</span>
                        </div>
                        {simParams.apEnabled && (
                           <div className="pl-9 pr-1 space-y-2">
                              {(simParams.apSubjects || []).map((sub: any, idx: number) => (
                                 <div key={sub.id} className="flex items-center gap-2">
                                    <input type="text" className="flex-1 min-w-0 text-xs px-2 py-1.5 border rounded bg-white shadow-sm font-medium focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder={isEn ? "Subject" : "科目名称"} value={sub.name} onChange={(e) => {
                                       const newSubs = [...simParams.apSubjects];
                                       newSubs[idx].name = e.target.value;
                                       setSimParams({...simParams, apSubjects: newSubs});
                                    }} />
                                    <select className="flex-shrink-0 text-xs px-2 py-1.5 border rounded bg-white text-gray-700 font-bold shadow-sm focus:ring-1 focus:ring-primary-500 focus:outline-none appearance-none cursor-pointer" value={sub.grade} onChange={(e) => {
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
                        <div className="flex items-center gap-2">
                           <Toggle checked={simParams.ibEnabled} onChange={(val) => setSimParams({...simParams, ibEnabled: val})} title={isEn ? "Enable/Disable" : "启用/禁用"} />
                           <span className={`text-xs font-medium ${simParams.ibEnabled ? 'text-gray-700' : 'text-gray-400'}`}>IB</span>
                        </div>
                        {simParams.ibEnabled && (
                           <div className="pl-9 pr-1 space-y-2">
                              {(simParams.ibSubjects || []).map((sub: any, idx: number) => (
                                 <div key={sub.id} className="flex items-center gap-2">
                                    <input type="text" className="flex-1 min-w-0 text-xs px-2 py-1.5 border rounded bg-white shadow-sm font-medium focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder={isEn ? "Subject" : "科目名称"} value={sub.name} onChange={(e) => {
                                       const newSubs = [...simParams.ibSubjects];
                                       newSubs[idx].name = e.target.value;
                                       setSimParams({...simParams, ibSubjects: newSubs});
                                    }} />
                                    <select className="flex-shrink-0 text-xs px-2 py-1.5 border rounded bg-white text-gray-700 font-bold shadow-sm focus:ring-1 focus:ring-primary-500 focus:outline-none appearance-none cursor-pointer" value={sub.level || 'HL'} onChange={(e) => {
                                       const newSubs = [...simParams.ibSubjects];
                                       newSubs[idx].level = e.target.value;
                                       setSimParams({...simParams, ibSubjects: newSubs});
                                    }}>
                                       <option value="HL">HL</option>
                                       <option value="SL">SL</option>
                                    </select>
                                    <select className="flex-shrink-0 text-xs px-2 py-1.5 border rounded bg-white text-gray-700 font-bold shadow-sm focus:ring-1 focus:ring-primary-500 focus:outline-none appearance-none cursor-pointer" value={sub.grade} onChange={(e) => {
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
                  </div>
               </div>

               {/* Standardized Tests */}
               <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-bold text-gray-700 mb-3">{isEn ? 'Standardized Tests' : '标化成绩'}</h4>
                  
                  <div className="space-y-4 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                     {/* New TOEFL */}
                     <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2">
                              <Toggle checked={simParams.toeflEnabled} onChange={(val) => setSimParams({...simParams, toeflEnabled: val})} title={isEn ? "Enable/Disable" : "启用/禁用"} />
                              <span className={`text-xs font-medium ${simParams.toeflEnabled ? 'text-gray-700' : 'text-gray-400'}`}>TOEFL (From 21 January 2026)</span>
                           </div>
                           <span className={`text-xs font-bold ${simParams.toeflEnabled ? 'text-primary-700' : 'text-gray-400'}`}>{simParams.toeflValue || '5.0'}</span>
                        </div>
                        <input 
                           type="range" min="0" max="6.0" step="0.5"
                           disabled={!simParams.toeflEnabled}
                           className={`w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600 ${!simParams.toeflEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                           value={simParams.toeflValue || '5.0'}
                           onChange={(e) => {
                              const val = e.target.value;
                              setSimParams({...simParams, toeflValue: val, toefl: Math.round(parseFloat(val) * 20)});
                           }}
                        />
                     </div>
                     {/* Old TOEFL */}
                     <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2">
                              <Toggle checked={simParams.oldToeflEnabled} onChange={(val) => setSimParams({...simParams, oldToeflEnabled: val})} title={isEn ? "Enable/Disable" : "启用/禁用"} />
                              <span className={`text-xs font-medium ${simParams.oldToeflEnabled ? 'text-gray-700' : 'text-gray-400'}`}>TOEFL (Before 21 January 2026)</span>
                           </div>
                           <span className={`text-xs font-bold ${simParams.oldToeflEnabled ? 'text-primary-700' : 'text-gray-400'}`}>{simParams.oldToeflValue || '100'}</span>
                        </div>
                        <input 
                           type="range" min="0" max="120" step="1"
                           disabled={!simParams.oldToeflEnabled}
                           className={`w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600 ${!simParams.oldToeflEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                           value={simParams.oldToeflValue || '100'}
                           onChange={(e) => {
                              const val = e.target.value;
                              setSimParams({...simParams, oldToeflValue: val, toefl: parseInt(val)});
                           }}
                        />
                     </div>
                     {/* IELTS */}
                     <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2">
                              <Toggle checked={simParams.ieltsEnabled} onChange={(val) => setSimParams({...simParams, ieltsEnabled: val})} title={isEn ? "Enable/Disable" : "启用/禁用"} />
                              <span className={`text-xs font-medium ${simParams.ieltsEnabled ? 'text-gray-700' : 'text-gray-400'}`}>IELTS</span>
                           </div>
                           <span className={`text-xs font-bold ${simParams.ieltsEnabled ? 'text-primary-700' : 'text-gray-400'}`}>{parseFloat(simParams.ieltsValue || '7.0').toFixed(1)}</span>
                        </div>
                        <input 
                           type="range" min="4.0" max="9.0" step="0.5"
                           disabled={!simParams.ieltsEnabled}
                           className={`w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600 ${!simParams.ieltsEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                           value={simParams.ieltsValue || '7.0'}
                           onChange={(e) => {
                              const val = e.target.value;
                              setSimParams({...simParams, ieltsValue: val, toefl: (parseFloat(val) || 0) * 12});
                           }}
                        />
                     </div>
                     {/* SAT */}
                     <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2">
                              <Toggle checked={simParams.satEnabled} onChange={(val) => setSimParams({...simParams, satEnabled: val})} title={isEn ? "Enable/Disable" : "启用/禁用"} />
                              <span className={`text-xs font-medium ${simParams.satEnabled ? 'text-gray-700' : 'text-gray-400'}`}>SAT</span>
                           </div>
                           <span className={`text-xs font-bold ${simParams.satEnabled ? 'text-primary-700' : 'text-gray-400'}`}>{simParams.satValue || '1400'}</span>
                        </div>
                        <input 
                           type="range" min="1000" max="1600" step="10"
                           disabled={!simParams.satEnabled}
                           className={`w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600 ${!simParams.satEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                           value={simParams.satValue || '1400'}
                           onChange={(e) => {
                              const val = e.target.value;
                              setSimParams({...simParams, satValue: val, sat: parseInt(val) || 0});
                           }}
                        />
                     </div>
                     {/* ACT */}
                     <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2">
                              <Toggle checked={simParams.actEnabled} onChange={(val) => setSimParams({...simParams, actEnabled: val})} title={isEn ? "Enable/Disable" : "启用/禁用"} />
                              <span className={`text-xs font-medium ${simParams.actEnabled ? 'text-gray-700' : 'text-gray-400'}`}>ACT</span>
                           </div>
                           <span className={`text-xs font-bold ${simParams.actEnabled ? 'text-primary-700' : 'text-gray-400'}`}>{simParams.actValue || '30'}</span>
                        </div>
                        <input 
                           type="range" min="20" max="36" step="1"
                           disabled={!simParams.actEnabled}
                           className={`w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600 ${!simParams.actEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                           value={simParams.actValue || '30'}
                           onChange={(e) => {
                              const val = e.target.value;
                              setSimParams({...simParams, actValue: val, sat: (parseInt(val) || 0) * 40});
                           }}
                        />
                     </div>
                  </div>
               </div>
            </div>

            <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 leading-relaxed border border-gray-100">
               <Lightbulb className="w-3 h-3 text-yellow-500 inline mr-1" />
               {isEn ? 'Adjust sliders to simulate admission probabilities and refresh recommendations.' : '调整滑条可实时模拟不同成绩组合下的录取概率与推荐列表变化。'}
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
                  const targetMajors = matchingTarget?.majors || [];

                  return (
                     <div key={uni.id} className={`bg-white border rounded-xl p-3 shadow-sm transition-all group relative
                        ${isSelected ? 'border-primary-200 bg-primary-50/30' : 'border-gray-200 hover:border-primary-300 hover:shadow-md'}
                     `}>
                                 <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                       <img src={uni.logo} className="w-10 h-10 rounded object-contain bg-white border border-gray-100 p-0.5" alt={uni.name} />
                                       <div>
                                          <div className="flex items-center gap-2">
                                             <h4 className="font-bold text-gray-900 text-sm">{uni.name}</h4>
                                             <span className="text-xs text-gray-500">#{uni.rank}</span>
                                          </div>
                                          
                                          {targetMajors.length > 0 && (
                                             <div className="mt-2 space-y-2">
                                                <div className="flex items-center gap-1.5 text-xs text-indigo-900 px-2 py-0.5 rounded-md border border-indigo-100/50 bg-indigo-50/30 w-fit mb-1">
                                                   <Target className="w-3 h-3 text-indigo-600" />
                                                   <span className="font-bold text-indigo-700">{isEn ? 'Major Match:' : '专业匹配:'}</span>
                                                </div>
                                                {targetMajors.map(major => {
                                                   const isMajorSelected = selectedSchools.some(s => s.uni.id === uni.id && s.major === major);
                                                   return (
                                                      <div key={major} className="flex justify-between items-center bg-gray-50/80 border border-gray-100 px-2 py-1.5 rounded text-xs hover:bg-white hover:shadow-sm transition-all group/major">
                                                         <span className="font-medium text-gray-700 truncate max-w-[120px] pr-2" title={major}>{major}</span>
                                                         
                                                         {!isMajorSelected ? (
                                                            <div className="flex gap-1 opacity-60 group-hover/major:opacity-100 transition-opacity">
                                                               <button onClick={() => handleAddSchool(uni, 'Reach', major)} className="px-1.5 py-0.5 text-[10px] font-bold bg-white text-red-600 border border-red-200 rounded hover:bg-red-50 hover:border-red-300">+R</button>
                                                               <button onClick={() => handleAddSchool(uni, 'Match', major)} className="px-1.5 py-0.5 text-[10px] font-bold bg-white text-blue-600 border border-blue-200 rounded hover:bg-blue-50 hover:border-blue-300">+M</button>
                                                               <button onClick={() => handleAddSchool(uni, 'Safety', major)} className="px-1.5 py-0.5 text-[10px] font-bold bg-white text-green-600 border border-green-200 rounded hover:bg-green-50 hover:border-green-300">+S</button>
                                                            </div>
                                                         ) : (
                                                            <span className="text-[10px] text-green-600 flex items-center gap-1 font-medium bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                                                               <CheckCircle className="w-3 h-3" /> Added
                                                            </span>
                                                         )}
                                                      </div>
                                                   )
                                                })}
                                             </div>
                                          )}

                                          <div className="flex flex-wrap gap-1 mt-2">
                                             {uni.tags.map(t => <span key={t} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{t}</span>)}
                                          </div>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <div className={`text-lg font-bold ${uni.matchScore! >= 80 ? 'text-green-600' : (uni.matchScore ?? 0) >= 60 ? 'text-primary-600' : 'text-red-500'}`}>
                                          {uni.matchScore}
                                       </div>
                                       <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold
                                          ${uni.winRate === 'High' ? 'bg-green-100 text-green-700' : uni.winRate === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-red-50 text-red-700 border border-red-100'}
                                       `}>
                                          Win: {uni.winRate}
                                       </span>
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
