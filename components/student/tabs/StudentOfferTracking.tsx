
import React, { useState } from 'react';
import { 
  CheckCircle, XCircle, Clock, Trophy
} from '../../common/Icons';
import { useLanguage } from '../../../contexts/LanguageContext';

interface OfferRecord {
  id: string;
  school: string;
  major: string;
  round: string;
  result: 'Pending' | 'Admitted' | 'Rejected' | 'Deferred' | 'Waitlisted';
  condition?: string;
  date: string;
}

const initialOffers: OfferRecord[] = [
    { id: 'o1', school: 'Carnegie Mellon Univ', major: 'CS', round: 'ED1', result: 'Pending', condition: '', date: '-' },
    { id: 'o2', school: 'UIUC', major: 'CS', round: 'EA', result: 'Admitted', condition: 'Maintain 3.8 GPA', date: '2024-12-15' },
    { id: 'o3', school: 'Georgia Tech', major: 'CS', round: 'EA', result: 'Deferred', condition: '', date: '2024-12-10' },
];

const StudentOfferTracking: React.FC = () => {
  const [offers] = useState<OfferRecord[]>(initialOffers);
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  return (
     <div className="h-full flex flex-col p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 overflow-y-auto custom-scrollbar bg-[#fcfcfc] dark:bg-zinc-950/50">
        
        {/* Header */}
        <div className="max-w-5xl mx-auto w-full mb-8 flex justify-between items-end">
            <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                <Trophy className="w-7 h-7 text-violet-600 dark:text-violet-400" />
                {isEn ? 'Application & Offer Tracking' : '申请与录取追踪'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 ml-1">
                {isEn ? 'Track your application status and results.' : '实时追踪各校申请进度与最终录取结果。'}
            </p>
            </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
           <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-zinc-400 font-bold border-b border-gray-100 dark:border-white/5">
                  <tr>
                    <th className="px-6 py-4">{isEn ? 'School' : '学校'}</th>
                    <th className="px-6 py-4">{isEn ? 'Major' : '专业'}</th>
                    <th className="px-6 py-4">{isEn ? 'Round' : '申请轮次'}</th>
                    <th className="px-6 py-4">{isEn ? 'Result' : '录取结果'}</th>
                    <th className="px-6 py-4">{isEn ? 'Condition' : '录取条件'}</th>
                    <th className="px-6 py-4">{isEn ? 'Date' : '通知日期'}</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                 {offers.map(offer => (
                    <tr key={offer.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group">
                       <td className="px-6 py-4 font-bold text-gray-800 dark:text-zinc-200">{offer.school}</td>
                       <td className="px-6 py-4 text-gray-600 dark:text-zinc-400">{offer.major}</td>
                       <td className="px-6 py-4">
                          <span className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-zinc-300 px-2 py-0.5 rounded text-xs font-bold border border-gray-200 dark:border-white/5">{offer.round}</span>
                       </td>
                       <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
                             ${offer.result === 'Admitted' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30' :
                               offer.result === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' :
                               offer.result === 'Pending' ? 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-zinc-400 dark:border-white/10' :
                               'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30'}
                          `}>
                             {offer.result === 'Admitted' && <CheckCircle className="w-3.5 h-3.5" />}
                             {offer.result === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
                             {offer.result === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                             {offer.result}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-gray-600 dark:text-zinc-400 text-sm">{offer.condition || '-'}</td>
                       <td className="px-6 py-4 text-gray-500 dark:text-zinc-500 font-mono text-xs">{offer.date}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
           {offers.length === 0 && (
               <div className="p-8 text-center text-gray-400 dark:text-zinc-500 text-sm">
                   {isEn ? 'No applications tracked yet.' : '暂无申请记录。'}
               </div>
           )}
        </div>
     </div>
  );
};

export default StudentOfferTracking;
