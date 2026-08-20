
import React, { useState } from 'react';
import { 
  User, FolderOpen, Compass, FileText, Trophy, 
  Quote, GanttChart
} from '../common/Icons';
import { useLanguage } from '../../contexts/LanguageContext';
import StudentBaseInfo from './tabs/StudentBaseInfo';
import StudentRoadmap from './tabs/StudentRoadmap';
import StudentEssayWriter from './tabs/StudentEssayWriter';
import StudentMaterials from './tabs/StudentMaterials';
import StudentRecommendationAssistant from './tabs/StudentRecommendationAssistant';
import StudentOfferTracking from './tabs/StudentOfferTracking';

export type PlanningTab = 'BasicInfo' | 'Materials' | 'Planning' | 'Essays' | 'Recommendations' | 'OfferTracking';

interface StudentPlanningViewProps {
  initialTab?: PlanningTab;
}

const StudentPlanningView: React.FC<StudentPlanningViewProps> = ({ initialTab = 'BasicInfo' }) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';
  const [activeTab, setActiveTab] = useState<PlanningTab>(initialTab);

  // Sync activeTab with initialTab prop if it changes
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const tabs = [
    { id: 'BasicInfo', label: isEn ? '1. Basic Info' : '1. 基础信息', icon: <User className="w-4 h-4" /> },
    { id: 'Materials', label: isEn ? '2. Materials' : '2. 申请资料夹', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'Planning', label: isEn ? '3. My Plan' : '3. 升学规划', icon: <Compass className="w-4 h-4" /> },
    { id: 'Essays', label: isEn ? '4. Essays' : '4. 文书助手', icon: <FileText className="w-4 h-4" /> },
    { id: 'Recommendations', label: isEn ? '5. Recommendations' : '5. 推荐信助手', icon: <Quote className="w-4 h-4" /> },
    { id: 'OfferTracking', label: isEn ? '6. Offer Tracking' : '6. Offer追踪', icon: <GanttChart className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-[#e5e0dc] dark:border-white/5 overflow-hidden transition-colors">
      {/* Tab Navigation */}
      <div className="flex border-b border-[#e5e0dc] dark:border-white/5 overflow-x-auto no-scrollbar flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as PlanningTab)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2
              ${activeTab === tab.id 
                ? 'border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400 bg-violet-50/30 dark:bg-violet-900/10' 
                : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-50 dark:hover:bg-white/5'}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative bg-[#fcfcfc] dark:bg-zinc-950/50">
        {activeTab === 'BasicInfo' && <StudentBaseInfo />}
        {activeTab === 'Materials' && <StudentMaterials />}
        {activeTab === 'Planning' && <StudentRoadmap />}
        {activeTab === 'Essays' && <StudentEssayWriter />}
        {activeTab === 'Recommendations' && <StudentRecommendationAssistant />}
        {activeTab === 'OfferTracking' && <StudentOfferTracking />}
      </div>
    </div>
  );
};

export default StudentPlanningView;
