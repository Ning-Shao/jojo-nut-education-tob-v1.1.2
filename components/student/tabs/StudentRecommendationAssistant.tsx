
import React, { useState } from 'react';
import { 
  User, CheckCircle, 
  Clock, Sparkles, FileText,
  Mail, Quote
} from '../../common/Icons';
import { useLanguage } from '../../../contexts/LanguageContext';

// --- Types ---
interface RecommendationRequest {
  id: string;
  recommenderName: string;
  role: string; // e.g. "AP Physics Teacher" or "Counselor"
  status: 'Drafting' | 'Invited' | 'In Progress' | 'Completed';
  deadline: string;
  aiPolished?: boolean;
}

// --- Mock Data ---
const INITIAL_REQUESTS: RecommendationRequest[] = [
  {
    id: '1',
    recommenderName: 'Ms. Sarah',
    role: 'School Counselor',
    status: 'Completed',
    deadline: '2024-11-01',
    aiPolished: true
  },
  {
    id: '2',
    recommenderName: 'Mr. Wang',
    role: 'AP Calculus Teacher',
    status: 'Invited',
    deadline: '2024-11-15',
    aiPolished: false
  }
];

const StudentRecommendationAssistant: React.FC = () => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  const [requests] = useState<RecommendationRequest[]>(INITIAL_REQUESTS);

  // Helper: Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <span className="flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded text-xs font-bold border border-green-100 dark:border-green-500/20"><CheckCircle className="w-3 h-3" /> {isEn ? 'Submitted' : '已上传'}</span>;
      case 'In Progress': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded text-xs font-bold border border-blue-100 dark:border-blue-500/20"><Clock className="w-3 h-3" /> {isEn ? 'Writing' : '撰写中'}</span>;
      case 'Invited': return <span className="flex items-center gap-1 text-violet-600 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded text-xs font-bold border border-violet-100 dark:border-violet-500/20"><Mail className="w-3 h-3" /> {isEn ? 'Invited' : '已邀请'}</span>;
      default: return <span className="flex items-center gap-1 text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-xs font-bold border border-gray-200 dark:border-white/10"><FileText className="w-3 h-3" /> {isEn ? 'Drafting' : '草稿'}</span>;
    }
  };

  return (
    <div className="h-full flex flex-col p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 overflow-y-auto custom-scrollbar bg-[#fcfcfc] dark:bg-zinc-950/50">
      
      {/* Header */}
      <div className="max-w-5xl mx-auto w-full mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Quote className="w-7 h-7 text-violet-600 dark:text-violet-400" />
            {isEn ? 'Recommendation Assistant' : '推荐信助手'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 ml-1 max-w-xl">
            {isEn 
              ? 'View your recommenders.' 
              : '查看您的推荐信老师'}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Request Cards */}
        {requests.length === 0 && (
           <div className="col-span-1 md:col-span-2 text-center p-12 text-gray-400">
             {isEn ? 'No recommenders assigned yet.' : '暂无匹配的推荐人'}
           </div>
        )}
        {requests.map(req => (
          <div key={req.id} className="group bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/10 rounded-3xl p-8 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:border-violet-200">
             <div className="absolute top-0 right-0 p-6 opacity-5 text-violet-500 transform translate-x-4 -translate-y-4">
               <Quote className="w-24 h-24" />
             </div>
             
             <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold border-4 mb-5 shadow-sm
                  bg-violet-50 border-violet-100 text-violet-600 dark:bg-violet-900/30 dark:border-violet-500/30 dark:text-violet-300">
                  {req.recommenderName.charAt(0)}
             </div>
             
             <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2 z-10">{req.recommenderName}</h3>
             
             <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm font-medium text-gray-500 dark:text-gray-300 z-10">
                {req.role}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentRecommendationAssistant;
