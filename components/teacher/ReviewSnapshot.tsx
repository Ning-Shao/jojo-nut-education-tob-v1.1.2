
import React from 'react';
import { Calendar, Filter, ArrowRight } from '../common/Icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface ReviewSnapshotProps {
  onDetailClick?: () => void;
}

const ReviewSnapshot: React.FC<ReviewSnapshotProps> = ({ onDetailClick }) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  return (
    <div className="bg-white dark:bg-zinc-900 px-5 py-3 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 flex flex-col transition-colors duration-300">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-gray-800 dark:text-zinc-100 text-sm">{isEn ? 'Review Snapshot (2024 Season)' : '复盘快照 (2024申请季)'}</h3>
        <span className="text-[10px] bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-zinc-400 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-transparent dark:border-white/5">
            <Calendar className="w-3 h-3"/> {isEn ? 'This Season' : '本学期'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
          {/* Main Card */}
          <div className="bg-primary-50 dark:bg-primary-400/10 p-2 rounded-xl border border-primary-100 dark:border-primary-500/20 text-center">
             <p className="text-[10px] text-primary-600 dark:text-primary-400 font-medium mb-0.5">{isEn ? 'Total Offers' : 'Offer 总数'}</p>
             <p className="text-xl font-bold text-primary-900 dark:text-primary-100 leading-none">142</p>
             <p className="text-[10px] text-primary-700/60 dark:text-primary-400/60 mt-1 transform scale-90">↑ 12%</p>
          </div>
          {/* Second Card */}
          <div className="bg-stone-50 dark:bg-zinc-800 p-2 rounded-xl border border-stone-200 dark:border-white/5 text-center">
             <p className="text-[10px] text-stone-600 dark:text-zinc-400 font-medium mb-0.5">{isEn ? 'Top 30' : 'Top 30'}</p>
             <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">28</p>
             <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1 transform scale-90">{isEn ? 'Incl. 3 Ivies' : '含藤校 3'}</p>
          </div>
          {/* Third Card */}
          <div className="bg-orange-50 dark:bg-orange-500/10 p-2 rounded-xl border border-orange-100 dark:border-orange-500/20 text-center">
             <p className="text-[10px] text-orange-800 dark:text-orange-400 font-medium mb-0.5">{isEn ? 'Commit Rate' : '确认率'}</p>
             <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">95%</p>
             <p className="text-[10px] text-orange-700/60 dark:text-orange-400/60 mt-1 transform scale-90">{isEn ? '5 Pending' : '余 5 人'}</p>
          </div>
      </div>

      <div className="bg-[#fbf7f5] dark:bg-zinc-800/50 rounded-lg p-2.5 flex items-start gap-2 border border-[#f5ebe6] dark:border-white/5">
         <div className="bg-white dark:bg-zinc-800 p-1 rounded-md shadow-sm text-gray-700 dark:text-zinc-300 mt-0.5">
            <Filter className="w-3 h-3" />
         </div>
         <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-0.5">
                <p className="text-xs font-bold text-gray-800 dark:text-zinc-200">{isEn ? 'Trend Insight' : '标准变化提示'}</p>
                <button 
                  onClick={onDetailClick}
                  className="text-[10px] text-primary-600 dark:text-primary-400 font-medium flex items-center hover:underline whitespace-nowrap ml-2"
                >
                    {isEn ? 'Details' : '详情'} <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                </button>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-zinc-400 leading-tight truncate">
                {isEn ? 'US CS admissions significantly harder, advise G11 to add Safety schools.' : '美本 CS 方向难度显著提升，建议 G11 增加保底。'}
            </p>
         </div>
      </div>
    </div>
  );
};

export default ReviewSnapshot;
