
import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Users, GraduationCap, ChevronRight, ArrowUpRight } from '../common/Icons';
import { useLanguage } from '../../contexts/LanguageContext';

export interface OverviewFilterTarget {
  type: 'all' | 'grade' | 'direction' | 'phase';
  value?: string;
}

interface StudentOverviewProps {
  onNavigate?: (target: OverviewFilterTarget) => void;
}

// Colors: Nut/Earth Tones
const COLORS = {
  walnut: '#7d5646',
  hazelnut: '#b0826d',
  beige: '#dfc4b6',
  almond: '#f5ebe6',
  cream: '#e5e5e5',
  green: '#577d46', 
};

// Custom Label Renderer
const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, name, value } = props;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.35; 
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      className="fill-gray-500 dark:fill-zinc-400 text-[10px] font-medium pointer-events-none"
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central" 
    >
      {`${name} ${value}`}
    </text>
  );
};

const StudentOverview: React.FC<StudentOverviewProps> = ({ onNavigate }) => {
  const [mounted, setMounted] = useState(false);
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const dataGrade = [
    { name: 'G12', value: 45, color: COLORS.walnut }, 
    { name: 'G11', value: 30, color: COLORS.hazelnut }, 
    { name: 'G10', value: 15, color: COLORS.beige }, 
    { name: 'G9', value: 10, color: COLORS.cream },  
  ];

  const dataDirection = useMemo(() => [
    { id: 'US', name: isEn ? 'US' : '美本', value: 60, color: COLORS.walnut },
    { id: 'UK', name: isEn ? 'UK' : '英联邦', value: 30, color: COLORS.hazelnut },
    { id: 'Other', name: isEn ? 'Other' : '其他', value: 10, color: COLORS.beige },
  ], [isEn]);

  const dataPhases = useMemo(() => [
    { name: isEn ? 'Phase 0 Onboarding' : 'Phase 0 建档', phaseKey: 'Phase 0 建档', count: 5, color: '#e5e5e5' },
    { name: isEn ? 'Phase 1 Planning' : 'Phase 1 规划', phaseKey: 'Phase 1 规划', count: 35, color: '#dfc4b6' },
    { name: isEn ? 'Phase 2 Tutoring' : 'Phase 2 教学', phaseKey: 'Phase 2 教学运营', count: 20, color: '#cfa593' }, 
    { name: isEn ? 'Phase 3 App' : 'Phase 3 申请', phaseKey: 'Phase 3 申请', count: 22, color: '#b0826d' },
    { name: isEn ? 'Phase 4 Admission' : 'Phase 4 录取', phaseKey: 'Phase 4 录取', count: 12, color: '#7d5646' },
    { name: isEn ? 'Phase 5 Review' : 'Phase 5 复盘', phaseKey: 'Phase 5 复盘', count: 6, color: '#553c35' },
  ], [isEn]);

  const handleTrigger = (target: OverviewFilterTarget) => {
    if (onNavigate) {
      onNavigate(target);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 h-full flex flex-col overflow-hidden transition-colors duration-300">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-bold text-gray-800 dark:text-zinc-100">{isEn ? 'Student Overview' : '我的学生概览'}</h3>
        <span className="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2.5 py-1 rounded-md font-medium border border-gray-200/60 dark:border-white/5">
          {isEn ? 'This Semester' : '本学期'}
        </span>
      </div>
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        <div className="flex flex-col h-full min-w-0">
          {/* Total Students Clickable Card */}
          <div 
            onClick={() => handleTrigger({ type: 'all' })}
            className="flex items-center justify-between gap-4 mb-4 bg-gray-50 dark:bg-zinc-850 hover:bg-primary-50/60 dark:hover:bg-primary-950/30 p-4 rounded-xl border border-gray-100 hover:border-primary-200 dark:border-white/5 dark:hover:border-primary-500/30 flex-shrink-0 transition-all duration-200 cursor-pointer group shadow-2xs hover:shadow-md"
            title={isEn ? "Click to view all responsible students" : "点击跳转并查看全部负责学生"}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 group-hover:bg-primary-600 group-hover:text-white flex items-center justify-center text-primary-700 dark:text-primary-300 shadow-sm transition-colors duration-200">
                 <Users className="w-6 h-6" />
              </div>
              <div>
                 <div className="flex items-center gap-1.5">
                   <p className="text-sm text-gray-600 dark:text-zinc-400 font-medium group-hover:text-primary-900 dark:group-hover:text-primary-200 transition-colors">
                     {isEn ? 'Total Students' : '负责学生总数'}
                   </p>
                   <span className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                     {isEn ? 'View all' : '查看全部'}
                   </span>
                 </div>
                 <div className="flex items-baseline gap-2 mt-0.5">
                   <p className="text-3xl font-bold text-gray-900 dark:text-white leading-none group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">100</p>
                   <span className="text-xs text-green-600 dark:text-green-400 font-medium">↑ 5 {isEn ? 'New' : '新增'}</span>
                 </div>
              </div>
            </div>

            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-300 group-hover:bg-white dark:group-hover:bg-white/10 group-hover:translate-x-0.5 transition-all">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
             {/* By Grade Card */}
             <div className="relative w-full h-full flex flex-col items-center justify-between min-h-0 bg-gray-50/50 dark:bg-zinc-850/40 p-3 rounded-xl border border-gray-100/80 dark:border-white/5">
                <div className="w-full flex items-center justify-between px-1">
                  <p className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{isEn ? 'By Grade' : '按年级'}</p>
                  <span className="text-[10px] text-primary-600 dark:text-primary-400 font-medium">{isEn ? 'Click to filter' : '可点击'}</span>
                </div>
                <div className="w-full flex-1 relative min-h-[110px] flex items-center justify-center">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%" debounce={300}>
                      <PieChart>
                        <Pie
                          data={dataGrade}
                          cx="50%"
                          cy="50%"
                          innerRadius={26}
                          outerRadius={44}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                          label={renderCustomizedLabel}
                          labelLine={{ stroke: '#52525b', strokeWidth: 1, opacity: 0.3 }}
                          onClick={(entry: any) => {
                            if (entry && entry.name) {
                              handleTrigger({ type: 'grade', value: entry.name });
                            }
                          }}
                          className="cursor-pointer"
                        >
                          {dataGrade.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color} 
                              strokeWidth={0}
                              className="cursor-pointer hover:opacity-75 transition-opacity"
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{fontSize:'12px', borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.3)', backgroundColor: '#18181b', color: '#fff'}} 
                          itemStyle={{color: '#fff'}}
                          formatter={(val: any, name: any) => [`${val} ${isEn ? 'students' : '人'} (点击筛选)`, `${name}`]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
             </div>

             {/* By Region/Direction Card */}
             <div className="relative w-full h-full flex flex-col items-center justify-between min-h-0 bg-gray-50/50 dark:bg-zinc-850/40 p-3 rounded-xl border border-gray-100/80 dark:border-white/5">
                <div className="w-full flex items-center justify-between px-1">
                  <p className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{isEn ? 'By Region' : '按方向'}</p>
                  <span className="text-[10px] text-primary-600 dark:text-primary-400 font-medium">{isEn ? 'Click to filter' : '可点击'}</span>
                </div>
                <div className="w-full flex-1 relative min-h-[110px] flex items-center justify-center">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%" debounce={300}>
                      <PieChart>
                        <Pie
                          data={dataDirection}
                          cx="50%"
                          cy="50%"
                          innerRadius={26}
                          outerRadius={44}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                          label={renderCustomizedLabel}
                          labelLine={{ stroke: '#52525b', strokeWidth: 1, opacity: 0.3 }}
                          onClick={(entry: any) => {
                            if (entry) {
                              handleTrigger({ type: 'direction', value: entry.id || entry.name });
                            }
                          }}
                          className="cursor-pointer"
                        >
                          {dataDirection.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color} 
                              strokeWidth={0}
                              className="cursor-pointer hover:opacity-75 transition-opacity"
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{fontSize:'12px', borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.3)', backgroundColor: '#18181b', color: '#fff'}} 
                          itemStyle={{color: '#fff'}}
                          formatter={(val: any, name: any) => [`${val} ${isEn ? 'students' : '人'} (点击筛选)`, `${name}`]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
             </div>
          </div>
        </div>

        {/* Phase 0-5 Section */}
        <div className="flex flex-col justify-between border-l border-dashed border-gray-100 dark:border-white/10 pl-6 lg:pl-8 min-w-0 transition-colors">
           <div className="flex items-center justify-between mb-3">
             <p className="text-xs font-bold text-gray-600 dark:text-zinc-400 flex items-center gap-2 uppercase tracking-wide">
               <GraduationCap className="w-4 h-4 text-primary-500" />
               {isEn ? 'Phase Distribution' : '阶段分布 (Phase 0-5)'}
             </p>
             <span className="text-[11px] text-gray-400 dark:text-zinc-500">
               {isEn ? 'Click to jump & filter' : '点击跳转对应阶段'}
             </span>
           </div>

           <div className="space-y-2 pr-1 flex-1 flex flex-col justify-around">
              {dataPhases.map((phase, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleTrigger({ type: 'phase', value: phase.phaseKey })}
                  className="group cursor-pointer p-2 rounded-xl hover:bg-primary-50/70 dark:hover:bg-white/5 border border-transparent hover:border-primary-200/80 dark:hover:border-white/10 transition-all duration-200 hover:shadow-2xs"
                  title={isEn ? `Filter by ${phase.name}` : `筛选 ${phase.name} 学生`}
                >
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-zinc-300 group-hover:text-primary-900 dark:group-hover:text-primary-200 transition-colors flex items-center gap-1.5">
                        {phase.name}
                        <ArrowUpRight className="w-3 h-3 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                      <span className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200/60 dark:border-white/5 group-hover:border-primary-200 group-hover:bg-primary-100/70 group-hover:text-primary-800 dark:group-hover:text-primary-300 transition-all">
                        {phase.count} {isEn ? 'students' : '人'}
                      </span>
                   </div>
                   <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden border border-gray-100/50 dark:border-white/5">
                      <div 
                        className="h-full rounded-full transition-all duration-700 relative group-hover:opacity-100 opacity-80"
                        style={{ width: `${(phase.count / 40) * 100}%`, backgroundColor: phase.color }}
                      >
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudentOverview;

