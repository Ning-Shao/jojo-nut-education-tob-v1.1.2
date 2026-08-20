
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Gradient of Brown/Beige/Nut
const funnelData = [
  { name: 'Phase 0 建档', value: 100, fill: '#e5e5e5' }, 
  { name: 'Phase 1 规划', value: 95, fill: '#dfc4b6' },
  { name: 'Phase 2 教学运营', value: 85, fill: '#cfa593' },
  { name: 'Phase 3 申请', value: 60, fill: '#b0826d' }, 
  { name: 'Phase 4 录取', value: 20, fill: '#7d5646' }, 
  { name: 'Phase 5 复盘', value: 12, fill: '#553c35' }, 
];

const ProgressCharts: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e5e0dc] h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-800">关键进度与里程碑</h3>
        <select className="text-xs bg-gray-50 border-none rounded-lg px-2 py-1 text-gray-600 focus:ring-0">
          <option>本月</option>
          <option>本学期</option>
        </select>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Funnel Representation using Horizontal Bar */}
        <div className="w-2/3 h-full flex flex-col min-w-0">
           <p className="text-xs font-semibold text-gray-500 mb-2">阶段推进漏斗 (人数)</p>
           <div className="flex-1 min-h-0 relative" style={{ minHeight: '150px' }}>
             {mounted && (
               <ResponsiveContainer width="100%" height="100%" debounce={300}>
                 <BarChart
                   layout="vertical"
                   data={funnelData}
                   margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                 >
                   <XAxis type="number" hide />
                   <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: '#6b7280' }} 
                    width={90}
                    axisLine={false}
                    tickLine={false}
                   />
                   <Tooltip 
                    cursor={{fill: '#f5ebe6', opacity: 0.5}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   />
                   <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                     {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             )}
           </div>
        </div>

        {/* Milestone Circle Stats */}
        <div className="w-1/3 flex flex-col justify-center space-y-6 border-l border-gray-100 pl-6 flex-shrink-0">
             <div>
                <div className="flex justify-between text-sm mb-1">
                   <span className="text-gray-600">标化出分率</span>
                   <span className="font-bold text-gray-900">78%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                   <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
             </div>
             
             <div>
                <div className="flex justify-between text-sm mb-1">
                   <span className="text-gray-600">文书定稿率</span>
                   <span className="font-bold text-gray-900">45%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                   <div className="bg-primary-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
             </div>

             <div>
                <div className="flex justify-between text-sm mb-1">
                   <span className="text-gray-600">选校确认率</span>
                   <span className="font-bold text-gray-900">92%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                   <div className="bg-gray-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressCharts;
