
import React from 'react';
import { Briefcase, Users, User, Loader2, Sparkles, Brain, Globe, ExternalLink, TrendingUp, Target, ArrowRight } from '../../common/Icons';
import { CareerResult } from './PlanningData';
import { useLanguage } from '../../../contexts/LanguageContext';

interface Step1Props {
  familyInputs: { expectations: string; resources: string };
  setFamilyInputs: (val: { expectations: string; resources: string }) => void;
  studentInputs: { interests: string; abilities: string; intentions: string };
  setStudentInputs: (val: { interests: string; abilities: string; intentions: string }) => void;
  isAnalyzingCareer: boolean;
  careerResult: CareerResult | null;
  handleAnalyzeCareer: () => void;
  onNext: () => void;
}

const Step1Career: React.FC<Step1Props> = ({
  familyInputs, setFamilyInputs, studentInputs, setStudentInputs,
  isAnalyzingCareer, careerResult, handleAnalyzeCareer, onNext
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-full">
      <div className="flex-1">
        <div className="mb-8">
           <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary-600" /> {isEn ? 'Career & Major Exploration' : '职业与专业方向探索'}
           </h2>
           <p className="text-sm text-gray-500">
              {isEn 
                ? 'Combine family resources and student traits with AI to find the best development path.' 
                : '结合家庭资源与学生特质，利用 AI 大模型进行联网检索与深度匹配，寻找最具发展潜力的赛道。'}
           </p>
        </div>
        
        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
           {/* Family */}
           <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-100 transition-all flex flex-col">
              <div className="flex items-center gap-2 mb-4 text-primary-800 border-b border-gray-200 pb-2">
                 <Users className="w-5 h-5" />
                 <h3 className="font-bold text-sm">{isEn ? 'Family Context' : '家庭期望与资源 (Family Context)'}</h3>
              </div>
              <div className="space-y-4 flex-1">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{isEn ? 'Expectations' : '家庭期望 (Expectations)'}</label>
                    <textarea 
                       className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-800 outline-none focus:border-primary-300 h-24 resize-none placeholder:text-gray-400"
                       placeholder={isEn ? "e.g., Industry preference, stability, salary..." : "例如：行业偏好、职业稳定性、薪资期待..."}
                       value={familyInputs.expectations}
                       onChange={(e) => setFamilyInputs({...familyInputs, expectations: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{isEn ? 'Resources' : '家庭资源 (Resources)'}</label>
                    <textarea 
                       className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-800 outline-none focus:border-primary-300 h-24 resize-none placeholder:text-gray-400"
                       placeholder={isEn ? "e.g., Connections, background, funding..." : "例如：人脉资源、行业背景、资金支持..."}
                       value={familyInputs.resources}
                       onChange={(e) => setFamilyInputs({...familyInputs, resources: e.target.value})}
                    />
                 </div>
              </div>
           </div>

           {/* Student */}
           <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-100 transition-all flex flex-col">
              <div className="flex items-center gap-2 mb-4 text-indigo-800 border-b border-gray-200 pb-2">
                 <User className="w-5 h-5" />
                 <h3 className="font-bold text-sm">{isEn ? 'Student Profile' : '学生画像 (Student Profile)'}</h3>
              </div>
              <div className="space-y-4 flex-1">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{isEn ? 'Interests' : '兴趣 (Interests)'}</label>
                    <input 
                       className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 outline-none focus:border-indigo-300 placeholder:text-gray-400"
                       placeholder={isEn ? "e.g., Badminton, Lego, Sci-Fi..." : "例如：羽毛球、乐高、科幻..."}
                       value={studentInputs.interests}
                       onChange={(e) => setStudentInputs({...studentInputs, interests: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{isEn ? 'Abilities' : '能力 (Abilities)'}</label>
                    <textarea 
                       className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-800 outline-none focus:border-indigo-300 h-20 resize-none placeholder:text-gray-400"
                       placeholder={isEn ? "e.g., Logical thinking, coding skills..." : "例如：数学逻辑强、擅长编程、写作..."}
                       value={studentInputs.abilities}
                       onChange={(e) => setStudentInputs({...studentInputs, abilities: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{isEn ? 'Intentions' : '意向 (Intentions)'}</label>
                    <textarea 
                       className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-800 outline-none focus:border-indigo-300 h-20 resize-none placeholder:text-gray-400"
                       placeholder={isEn ? "e.g., Challenging work, change the world..." : "例如：想做有挑战性的工作、改变世界..."}
                       value={studentInputs.intentions}
                       onChange={(e) => setStudentInputs({...studentInputs, intentions: e.target.value})}
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-10">
           <button 
              onClick={handleAnalyzeCareer}
              disabled={isAnalyzingCareer || !familyInputs.expectations}
              className="group relative flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-full font-bold text-sm shadow-lg hover:bg-black hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
           >
              {isAnalyzingCareer ? (
                 <>
                    <Loader2 className="w-4 h-4 animate-spin" /> {isEn ? 'Analyzing...' : '正在联网检索与分析...'}
                 </>
              ) : (
                 <>
                    <Sparkles className="w-4 h-4 text-yellow-300" /> {isEn ? 'Generate AI Plan' : '生成 AI 规划建议'}
                 </>
              )}
           </button>
        </div>

        {/* Results Area */}
        {careerResult && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 mb-8">
              {/* 1. Synthesis */}
              <div className="bg-gradient-to-r from-primary-50 to-white p-5 rounded-xl border border-primary-100 border-l-4 border-l-primary-500">
                 <h4 className="font-bold text-primary-900 flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5" /> {isEn ? 'Key Insights (AI Synthesis)' : '核心洞察 (AI Synthesis)'}
                 </h4>
                 <p className="text-sm text-primary-800 leading-relaxed">
                    {careerResult.synthesis}
                 </p>
                 
                 {/* Grounding Sources */}
                 {careerResult.groundingLinks && careerResult.groundingLinks.length > 0 && (
                   <div className="mt-4 pt-3 border-t border-primary-200/50">
                     <p className="text-[10px] font-bold text-primary-600 uppercase mb-1 flex items-center gap-1">
                       <Globe className="w-3 h-3" /> {isEn ? 'Sources & Trends' : '数据来源 & 趋势参考'}
                     </p>
                     <div className="flex flex-wrap gap-2">
                       {careerResult.groundingLinks.map((link, idx) => (
                         <a 
                           key={idx} 
                           href={link.url} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="text-[10px] text-primary-700 bg-white/60 px-2 py-1 rounded border border-primary-100 hover:bg-white hover:border-primary-300 flex items-center gap-1 transition-colors max-w-xs truncate"
                         >
                           <ExternalLink className="w-2.5 h-2.5" />
                           {link.title}
                         </a>
                       ))}
                     </div>
                   </div>
                 )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* 2. Majors */}
                 <div>
                    <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                       <Briefcase className="w-5 h-5 text-gray-500" /> {isEn ? 'Recommended Majors' : '推荐专业方向'}
                    </h4>
                    <div className="space-y-3">
                       {careerResult.majors.map((major, idx) => (
                          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-primary-300 transition-colors">
                             <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-gray-800 text-sm">{major.name}</span>
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                   {isEn ? 'Match' : '契合度'} {major.match}%
                                </span>
                             </div>
                             <p className="text-xs text-gray-500 leading-snug">{major.reason}</p>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* 3. Careers */}
                 <div>
                    <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                       <TrendingUp className="w-5 h-5 text-gray-500" /> {isEn ? 'Matched Careers' : '适配职业愿景'}
                    </h4>
                    <div className="space-y-3">
                       {careerResult.careers.map((career, idx) => (
                          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 transition-colors group">
                             <div className="flex items-center gap-2 mb-2">
                                <Target className="w-4 h-4 text-indigo-500" />
                                <span className="font-bold text-gray-800 text-sm group-hover:text-indigo-700">{career.title}</span>
                             </div>
                             <p className="text-xs text-gray-500 leading-snug">{career.desc}</p>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-100 mt-auto">
        <button 
          onClick={onNext}
          disabled={!careerResult}
          className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-bold shadow-md hover:bg-black hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEn ? 'Next: Target Setting (Step 2)' : '下一步：目标确认 (Step 2)'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Step1Career;
