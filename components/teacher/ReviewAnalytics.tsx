
import React, { useState, useEffect } from 'react';
import { 
  PieChart, Trophy, TrendingUp, TrendingDown, 
  RefreshCw, Zap, Target, BarChart3,
  ArrowUpRight, Share2,
  Download, Clock, CheckCircle
} from '../common/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { useLanguage } from '../../contexts/LanguageContext';

// --- Types ---
interface StandardChange {
  id: string;
  school: string;
  change: 'Harder' | 'Easier' | 'NewRule';
  detail: string;
  detailEn: string;
  status: 'Pending' | 'Synced';
}

// --- Mock Data ---
const offerData = [
  { name: 'Top 10', offers: 15, target: 10 },
  { name: 'Top 30', offers: 45, target: 40 },
  { name: 'Top 50', offers: 85, target: 80 },
];

const destinationData = [
  { name: 'US East', value: 40, color: '#b0826d' },
  { name: 'US West', value: 30, color: '#cfa593' },
  { name: 'UK G5', value: 20, color: '#7d5646' },
  { name: 'Other', value: 10, color: '#e5e5e5' },
];

const standardChangesMock: StandardChange[] = [
  { id: '1', school: 'Carnegie Mellon (SCS)', change: 'Harder', detail: '托福实际门槛升至 105+，标化可选但录取的几乎都提交了。', detailEn: 'Effective TOEFL threshold raised to 105+. SAT optional but submitted by most admits.', status: 'Pending' },
  { id: '2', school: 'USC (Annenberg)', change: 'Harder', detail: '文书题目变更，更侧重社会影响力。', detailEn: 'Essay prompts changed, focusing more on social impact.', status: 'Synced' },
  { id: '3', school: 'NYU', change: 'Easier', detail: 'ED2 录取率略有回升，但仍在历史低位。', detailEn: 'ED2 acceptance rate slightly rebounded but remains historically low.', status: 'Pending' },
];

const ReviewAnalytics: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  useEffect(() => {
    // Force re-calculation by toggling mounted state after a delay
    setMounted(false);
    const timer = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col h-full gap-6 min-h-0 transition-colors duration-300">
      
      {/* Header Tabs */}
      <div className="bg-white dark:bg-zinc-900 px-6 py-4 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 flex justify-between items-center flex-shrink-0 transition-colors">
         <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
            <div className="px-4 py-2 rounded-lg text-sm font-bold bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm flex items-center gap-2">
               <PieChart className="w-4 h-4" /> {isEn ? 'Aggregate Review' : '聚合复盘 (Aggregate)'}
            </div>
         </div>

         <div className="flex items-center gap-3">
             <span className="text-sm font-medium text-gray-500 dark:text-zinc-500">{isEn ? 'Season:' : '当前复盘周期：'}</span>
             <select className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30">
                <option>2024 Application Season</option>
                <option>2023 Application Season</option>
             </select>
             <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm ml-2">
                <Download className="w-4 h-4" /> {isEn ? 'Export Report' : '导出报告'}
             </button>
         </div>
      </div>

      {/* CONTENT: AGGREGATE */}
      <div className="flex-1 overflow-y-auto space-y-6 min-h-0 custom-scrollbar">
        
        {/* 1. Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-[#e5e0dc] dark:border-white/5 shadow-sm transition-colors">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase">{isEn ? 'Total Offers' : 'Offer 总数'}</p>
                  <Trophy className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">142</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +12% YoY</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-[#e5e0dc] dark:border-white/5 shadow-sm transition-colors">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase">{isEn ? 'Top 30 Rate' : 'Top 30 录取率'}</p>
                  <Zap className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">42%</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +5% YoY</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-[#e5e0dc] dark:border-white/5 shadow-sm transition-colors">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase">{isEn ? 'ED Yield' : '早申下车率 (ED)'}</p>
                  <Target className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">38%</p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-medium flex items-center gap-1"><TrendingDown className="w-3 h-3"/> -2% YoY</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-[#e5e0dc] dark:border-white/5 shadow-sm transition-colors">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase">{isEn ? 'Avg SAT' : '平均标化 (SAT)'}</p>
                  <BarChart3 className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">1480</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +20 pts</p>
            </div>
        </div>

        {/* 2. Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
            {/* Offer vs Target */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-[#e5e0dc] dark:border-white/5 shadow-sm flex flex-col min-w-0 transition-colors">
              <h3 className="font-bold text-gray-800 dark:text-zinc-100 mb-6 flex items-center gap-2 flex-shrink-0">
                  <BarChart3 className="w-4 h-4 text-primary-600 dark:text-primary-400" /> {isEn ? 'Offers vs Targets' : 'Offer 分布 vs 目标设定'}
              </h3>
              <div className="flex-1 w-full min-h-[300px] relative min-w-0" style={{ minHeight: '300px' }}>
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%" debounce={300}>
                      <BarChart data={offerData} barSize={40}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" strokeOpacity={0.2} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                          <Tooltip cursor={{fill: '#3f3f46', opacity: 0.1}} contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.3)', backgroundColor: '#18181b', color: '#fff'}} />
                          <Legend />
                          <Bar dataKey="target" name={isEn ? "Target" : "设定目标数"} fill="#e5e5e5" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="offers" name={isEn ? "Actual Offers" : "实际录取数"} fill="#b0826d" fillOpacity={0.9} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
              </div>
            </div>

            {/* Destination Pie */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-[#e5e0dc] dark:border-white/5 shadow-sm flex flex-col min-w-0 transition-colors">
              <h3 className="font-bold text-gray-800 dark:text-zinc-100 mb-2 flex items-center gap-2 flex-shrink-0">
                  <Share2 className="w-4 h-4 text-primary-600 dark:text-primary-400" /> {isEn ? 'Destinations' : '最终去向分布'}
              </h3>
              <div className="flex-1 w-full min-h-[300px] relative min-w-0" style={{ minHeight: '300px' }}>
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%" debounce={300}>
                      <RePieChart>
                          <Pie
                            data={destinationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {destinationData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.3)', backgroundColor: '#18181b', color: '#fff'}} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </RePieChart>
                    </ResponsiveContainer>
                  )}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-xs text-gray-500 dark:text-zinc-500">{isEn ? 'Total' : '总去向'}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">42</p>
                  </div>
              </div>
            </div>
        </div>

        {/* 3. Feedback Loop (Data Write-back) */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-[#e5e0dc] dark:border-white/5 shadow-sm transition-colors">
            <div className="flex justify-between items-center mb-6">
              <div>
                  <h3 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-primary-600 dark:text-primary-400" /> {isEn ? 'Feedback Loop & Standard Updates' : '经验回流与标准更新 (Feedback Loop)'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">{isEn ? 'Suggested updates to Target Library based on results.' : '基于本届录取结果，建议更新以下院校的目标库标准。'}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-500 font-medium">
                    <tr>
                        <th className="px-4 py-3 rounded-l-lg">{isEn ? 'School/Program' : '院校/项目'}</th>
                        <th className="px-4 py-3">{isEn ? 'Trend' : '变化趋势'}</th>
                        <th className="px-4 py-3">{isEn ? 'Insight' : '经验洞察 (Insight)'}</th>
                        <th className="px-4 py-3">{isEn ? 'Status' : '状态'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {standardChangesMock.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="px-4 py-3 font-medium text-gray-800 dark:text-zinc-200">{item.school}</td>
                          <td className="px-4 py-3">
                              {item.change === 'Harder' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20"><TrendingUp className="w-3 h-3"/> {isEn ? 'Harder' : '变难'}</span>}
                              {item.change === 'Easier' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20"><TrendingDown className="w-3 h-3"/> {isEn ? 'Easier' : '变易'}</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-zinc-400 max-w-md">{isEn ? item.detailEn : item.detail}</td>
                          <td className="px-4 py-3">
                              {item.status === 'Synced' ? (
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3"/> {isEn ? 'Synced' : '已同步'}</span>
                              ) : (
                                <span className="text-xs text-orange-500 dark:text-orange-400 font-medium flex items-center gap-1"><Clock className="w-3 h-3"/> {isEn ? 'Pending' : '待确认'}</span>
                              )}
                          </td>
                        </tr>
                    ))}
                  </tbody>
              </table>
            </div>
        </div>
      </div>

    </div>
  );
};

export default ReviewAnalytics;
