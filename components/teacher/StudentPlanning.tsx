
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "../../services/aiClient";
import { Check, CheckCircle, X, AlertTriangle } from '../common/Icons';
import { 
  UniversitySchema, SelectedSchool, TargetPreference, CareerResult,
  SCHOOL_DATABASE, ActionItem, TimelineEvent, initialTimelineData, UniversityDisplay
} from './planning/PlanningData';
import { StudentSummary } from '../../types';
import { OfficialBatch, PredictedBatch, SubjectScore } from './StudentBasicInfo';

// Import Modular Step Components
import Step1Career from './planning/Step1Career';
import Step2Target from './planning/Step2Target';
import Step3Selection from './planning/Step3Selection';
import Step4FinalList from './planning/Step4FinalList';
import Step5Gap from './planning/Step5Gap';
import Step6Timeline from './planning/Step6Timeline';
import { useLanguage } from '../../contexts/LanguageContext';

interface StudentScoreData {
  officialBatches: OfficialBatch[];
  predictedBatches: PredictedBatch[];
  subjectScores: SubjectScore[];
}

const scoreDateValue = (date?: string) => {
  if (!date) return Number.NEGATIVE_INFINITY;
  const parsed = Date.parse(date.length === 7 ? `${date}-01` : date);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
};

const selectPreferredScore = (scores: SubjectScore[]) => [...scores]
  .filter(score => score.status !== 'Rejected' && score.score.trim() !== '' && Number.isFinite(Number(score.score)))
  .sort((a, b) => {
    const statusDifference = Number(b.status === 'Verified') - Number(a.status === 'Verified');
    if (statusDifference !== 0) return statusDifference;
    const dateDifference = scoreDateValue(b.date) - scoreDateValue(a.date);
    return dateDifference !== 0 ? dateDifference : Number(b.score) - Number(a.score);
  })[0];

const sectionScoresFrom = (score?: SubjectScore) => ({
  reading: score?.subScores?.R || '',
  listening: score?.subScores?.L || '',
  speaking: score?.subScores?.S || '',
  writing: score?.subScores?.W || '',
});

const satSectionScoresFrom = (score?: SubjectScore) => ({
  readingWriting: score?.subScores?.EBRW || '',
  math: score?.subScores?.M || '',
});

const actSectionScoresFrom = (score?: SubjectScore) => ({
  english: score?.subScores?.E || '',
  math: score?.subScores?.M || '',
  reading: score?.subScores?.R || '',
  science: score?.subScores?.SCI || '',
});

export const getInitialSimParams = ({ officialBatches, predictedBatches, subjectScores }: StudentScoreData) => {
  let academicSystem = 'GPA';
  let academicScoreText = '3.8';
  let gpa = 3.8;
  let isPredicted = true;

  const latestPredicted = predictedBatches[predictedBatches.length - 1];
  const latestOfficial = officialBatches[officialBatches.length - 1];
  const academicBatch = latestPredicted || latestOfficial;
  const academicCourses = latestPredicted
    ? latestPredicted.courses.map(course => ({ id: course.id, name: course.subject, level: course.courseLevel, grade: course.predictedGrade }))
    : latestOfficial?.courses.map(course => ({ id: course.id, name: course.subject, level: course.courseLevel, grade: course.grade })) || [];

  if (latestPredicted) {
    if (latestPredicted.curriculum.includes('A Level')) {
      academicSystem = 'A-Level';
      const as = latestPredicted.courses.filter(c => c.predictedGrade === 'A*').length;
      if (as >= 3) academicScoreText = '8'; // A*A*A
      else academicScoreText = '7'; // A*AA
      gpa = 4.0;
    } else if (latestPredicted.curriculum.includes('IB')) {
      academicSystem = 'IB';
      academicScoreText = '38';
      gpa = (38 / 45) * 4.0;
    } else if (latestPredicted.curriculum.includes('AP')) {
      academicSystem = 'AP';
      academicScoreText = '4.5';
      gpa = 3.8;
    }
  } else if (latestOfficial) {
     isPredicted = false;
     if (latestOfficial.curriculum.includes('A Level')) {
      academicSystem = 'A-Level';
      academicScoreText = '7'; // Default A*AA
      gpa = 4.0;
    } else if (latestOfficial.curriculum.includes('IB')) {
      academicSystem = 'IB';
      academicScoreText = '38';
      gpa = (38 / 45) * 4.0;
    } else if (latestOfficial.curriculum.includes('AP')) {
      academicSystem = 'AP';
      academicScoreText = '4.5';
      gpa = 3.8;
    }
  }

  const toeflBoundary = Date.parse('2026-01-21');
  const toeflRecords = subjectScores.filter(score => score.type === 'TOEFL' && scoreDateValue(score.date) !== Number.NEGATIVE_INFINITY);
  const newToefl = selectPreferredScore(toeflRecords.filter(score => scoreDateValue(score.date) >= toeflBoundary));
  const oldToefl = selectPreferredScore(toeflRecords.filter(score => scoreDateValue(score.date) < toeflBoundary));
  const ieltsRecord = selectPreferredScore(subjectScores.filter(score => score.type === 'IELTS'));
  const satRecord = selectPreferredScore(subjectScores.filter(score => score.type === 'SAT'));
  const actRecord = selectPreferredScore(subjectScores.filter(score => score.type === 'ACT'));
  const atarRecord = selectPreferredScore(subjectScores.filter(score => score.type === 'ATAR'));
  const apRecords = subjectScores.filter(score => score.type === 'AP' && score.status !== 'Rejected');
  const ibRecords = subjectScores.filter(score => score.type === 'IB' && score.status !== 'Rejected');

  let languageTest = 'None';
  let languageScoreText = '-';
  let toefl = 0;
  if (newToefl) {
    languageTest = 'TOEFL';
    toefl = Math.round(Number(newToefl.score) * 20);
    languageScoreText = newToefl.score;
  } else if (oldToefl) {
    languageTest = 'TOEFL';
    toefl = Number(oldToefl.score);
    languageScoreText = oldToefl.score;
  } else if (ieltsRecord) {
    languageTest = 'IELTS';
    languageScoreText = ieltsRecord.score;
    toefl = Number(ieltsRecord.score) * 12;
  }

  let standardTest = 'None';
  let standardScoreText = '-';
  let sat = 0;
  if (satRecord) {
    standardTest = 'SAT';
    sat = Number(satRecord.score);
    standardScoreText = sat.toString();
  } else if (actRecord) {
    standardTest = 'ACT';
    standardScoreText = actRecord.score;
    sat = Number(actRecord.score) * 40;
  }

  const curriculum = academicBatch?.curriculum || '';
  const alevelSubjects = /A[ -]?Level/i.test(curriculum)
    ? academicCourses.map(course => ({ ...course, level: course.level || 'A-Level', grade: course.grade.toUpperCase() }))
    : [];
  const apSubjects = apRecords.map(score => ({ id: score.id, name: score.subject === 'AP' ? '' : score.subject, grade: score.score }));
  const ibSubjects = ibRecords.map(score => ({ id: score.id, name: score.subject === 'IB' ? '' : score.subject, level: 'HL', grade: score.score }));
  const alevelScore = alevelSubjects.map(course => course.grade).join('');
  const apScore = apSubjects.length ? String(Math.max(...apSubjects.map(course => Number(course.grade) || 0))) : '';
  const ibScoreRecord = selectPreferredScore(ibRecords);

  return {
    gpa, toefl, sat,
    academicSystem, academicScoreText, isPredicted,
    languageTest, languageScoreText,
    standardTest, standardScoreText,
    // Provide dedicated values for the UI to represent each slider independently
    alevelSubjects,
    apSubjects,
    ibSubjects,
    toeflValue: newToefl?.score || '',
    oldToeflValue: oldToefl?.score || '',
    ieltsValue: ieltsRecord?.score || '',
    satValue: satRecord?.score || '',
    actValue: actRecord?.score || '',
    atarValue: atarRecord?.score || '',
    alevelScore,
    apScore,
    ibScore: ibScoreRecord?.score || '',
    expandedLanguageSections: { toefl: false, oldToefl: false, ielts: false, sat: false, act: false },
    languageSectionScores: {
      toefl: sectionScoresFrom(newToefl),
      oldToefl: sectionScoresFrom(oldToefl),
      ielts: sectionScoresFrom(ieltsRecord),
      sat: satSectionScoresFrom(satRecord),
      act: actSectionScoresFrom(actRecord),
    },
    // Enable flags
    alevelEnabled: /A[ -]?Level/i.test(curriculum),
    apEnabled: /AP/i.test(curriculum) || apSubjects.length > 0,
    ibEnabled: /IB/i.test(curriculum) || ibRecords.length > 0,
    toeflEnabled: !!newToefl,
    oldToeflEnabled: !!oldToefl,
    ieltsEnabled: !!ieltsRecord,
    satEnabled: !!satRecord,
    actEnabled: !!actRecord,
    atarEnabled: !!atarRecord,
  };
};

interface StudentPlanningProps {
  student?: StudentSummary;
  officialBatches: OfficialBatch[];
  predictedBatches: PredictedBatch[];
  subjectScores: SubjectScore[];
}

// Toast Component
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
    <CheckCircle className="w-5 h-5 text-green-400" />
    <span className="font-bold text-sm whitespace-pre-wrap">{message}</span>
    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors ml-2">
      <X className="w-4 h-4" />
    </button>
  </div>
);

// Publish Confirm Modal
const PublishConfirmModal = ({ isOpen, onClose, onConfirm, taskCount, isEn }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; taskCount: number; isEn: boolean }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] max-w-[90%] transform scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{isEn ? 'Ready to Publish?' : '确认发布规划方案？'}</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {isEn 
              ? `This will sync the roadmap to the Student Portal and add ${taskCount} timeline items to the Task Center.` 
              : `此操作将把规划方案同步至学生端，并将 ${taskCount} 项时间轴事项自动添加到双端任务中心。`
            }
          </p>
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
              {isEn ? 'Cancel' : '取消'}
            </button>
            <button onClick={onConfirm} className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md transition-colors">
              {isEn ? 'Publish Now' : '立即发布'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentPlanning: React.FC<StudentPlanningProps> = ({ student, officialBatches, predictedBatches, subjectScores }) => {
  const [planningStep, setPlanningStep] = useState(1);
  const { language } = useLanguage();
  const isEn = language === 'en-US';
  
  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);
  
  // --- Step 1: Career Planning State ---
  const [familyInputs, setFamilyInputs] = useState({
    expectations: isEn ? 'Hopes for a career in finance or tech, preferring stable and high-paying paths.' : '希望从事金融或科技行业，偏好稳定且高薪的职业路径。',
    resources: isEn ? 'Parents are finance professionals with strong connections in top brokerage firms; ample budget.' : '父母均为金融从业者，在国内头部券商有丰富人脉资源；预算充足。'
  });

  const [studentInputs, setStudentInputs] = useState({
    interests: isEn ? 'Badminton, LEGO building, Sci-Fi novels.' : '羽毛球、乐高搭建、科幻小说。',
    abilities: isEn ? 'Strong logical thinking, AMC 12 Distinction; Python basics.' : '数学逻辑思维强，AMC 12 获得 Distinction；具备 Python 基础。',
    intentions: isEn ? 'Wants to do something cool and challenging, dislikes repetitive work.' : '想做很酷、很有挑战性的事情，不喜欢重复性工作。'
  });

  // Initialize from student prop if available (Partial sync logic)
  useEffect(() => {
    if (student) {
        // Logic to pre-fill can go here if StudentSummary had these specific fields
    }
  }, [student]);

  // Reset inputs when language changes (Optional, usually we might keep user input, but for demo defaults:
  useEffect(() => {
     if (isEn) {
         if (familyInputs.expectations.includes('希望从事')) {
             setFamilyInputs({
                 expectations: 'Hopes for a career in finance or tech, preferring stable and high-paying paths.',
                 resources: 'Parents are finance professionals with strong connections in top brokerage firms; ample budget.'
             });
             setStudentInputs({
                 interests: 'Badminton, LEGO building, Sci-Fi novels.',
                 abilities: 'Strong logical thinking, AMC 12 Distinction; Python basics.',
                 intentions: 'Wants to do something cool and challenging, dislikes repetitive work.'
             });
         }
     } else {
         if (familyInputs.expectations.includes('Hopes for')) {
             setFamilyInputs({
                 expectations: '希望从事金融或科技行业，偏好稳定且高薪的职业路径。',
                 resources: '父母均为金融从业者，在国内头部券商有丰富人脉资源；预算充足。'
             });
             setStudentInputs({
                 interests: '羽毛球、乐高搭建、科幻小说。',
                 abilities: '数学逻辑思维强，AMC 12 获得 Distinction；具备 Python 基础。',
                 intentions: '想做很酷、很有挑战性的事情，不喜欢重复性工作。'
             });
         }
     }
  }, [isEn]);

  const [isAnalyzingCareer, setIsAnalyzingCareer] = useState(false);
  const [careerResult, setCareerResult] = useState<CareerResult | null>(null);

  // --- Step 2: Target Confirmation State ---
  const [targetPreferences, setTargetPreferences] = useState<TargetPreference[]>([
    { id: 1, region: 'US', majors: [] }
  ]);
  const [targetInputValues, setTargetInputValues] = useState<{[key: number]: string}>({});
  const [activeRecommendMenu, setActiveRecommendMenu] = useState<number | null>(null);

  // --- Step 3: School Selection Assistant State ---
  const [simParams, setSimParams] = useState(() => getInitialSimParams({ officialBatches, predictedBatches, subjectScores }));
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [selectedSchools, setSelectedSchools] = useState<SelectedSchool[]>([]);
  const [step3Tab, setStep3Tab] = useState<'Recommend' | 'Search'>('Recommend');
  
  // Step 3 Logic: Pool & Regeneration
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [candidatePool, setCandidatePool] = useState<UniversitySchema[]>([]);
  const [lastGeneratedTargets, setLastGeneratedTargets] = useState<string[]>([]);

  // Step 4 Logic: Enrichment
  const [enrichingSchoolId, setEnrichingSchoolId] = useState<string | null>(null);
  const [isBatchEnriching, setIsBatchEnriching] = useState(false);

  // --- Step 6: Timeline State (Lifted Up) ---
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(initialTimelineData);

  // --- Helper: Date Parsing Logic ---
  const parseVagueDate = (dateStr: string): { start: string, end?: string, type: 'Point' | 'Range' } => {
    // Check if dateStr is valid/exists
    if (!dateStr || dateStr === 'null') {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return { start: currentMonth, type: 'Range' }; // Default for routines without dates
    }

    const currentYear = 2024; // Base year for G11 Start
    const s = dateStr.toLowerCase();

    if (/^\d{4}-\d{2}$/.test(s)) {
      return { start: s, type: 'Point' };
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return { start: s.substring(0, 7), type: 'Point' };
    }
    
    if (s.includes('summer')) {
      if (s.includes('g11')) return { start: `${currentYear + 1}-06`, end: `${currentYear + 1}-08`, type: 'Range' };
      if (s.includes('g10')) return { start: `${currentYear}-06`, end: `${currentYear}-08`, type: 'Range' };
    }
    if (s.includes('winter')) {
      if (s.includes('g11')) return { start: `${currentYear}-12`, end: `${currentYear + 1}-01`, type: 'Range' };
    }
    if (s.includes('fall') || s.includes('上学期')) {
      if (s.includes('g11')) return { start: `${currentYear}-09`, end: `${currentYear + 1}-01`, type: 'Range' };
      if (s.includes('g12')) return { start: `${currentYear + 1}-09`, end: `${currentYear + 2}-01`, type: 'Range' };
    }
    if (s.includes('spring') || s.includes('下学期')) {
      if (s.includes('g11')) return { start: `${currentYear + 1}-02`, end: `${currentYear + 1}-06`, type: 'Range' };
    }

    return { start: `${currentYear}-12`, type: 'Point' };
  };

  // Handler: Sync Step 5 Action Items to Step 6 Timeline
  const handleSyncActionsToTimeline = (actions: ActionItem[]) => {
    const newEvents: TimelineEvent[] = actions.map(action => {
      const { start, end, type } = parseVagueDate(action.deadline || '');
      
      let cat: TimelineEvent['category'] = 'Other';
      if (action.category === 'Test') cat = 'Exam';
      else if (action.category === 'Extracurriculars') cat = 'Activity';
      else if (action.category === 'Academics') cat = 'Academic';
      else if (action.category === 'Application') cat = 'Application';
      
      // Determine Type based on Action Item Type (Milestone -> Point, Routine -> Range)
      let finalType: 'Point' | 'Range' = type;
      let finalEnd = end;
      
      if (action.type === 'Routine') {
          finalType = 'Range';
          // If no end date parsed, add default duration (e.g. 1 month)
          if (!finalEnd) {
             const [y, m] = start.split('-').map(Number);
             let endM = m + 1;
             let endY = y;
             if (endM > 12) { endM = 1; endY++; }
             finalEnd = `${endY}-${endM.toString().padStart(2, '0')}`;
          }
      } else if (action.type === 'Milestone') {
          finalType = 'Point';
      }

      return {
        id: `evt-${action.id}`,
        title: action.title, // Use Title
        type: finalType,
        startDate: start,
        endDate: finalEnd,
        category: cat,
        status: 'Pending',
        priority: action.priority,
        // Combine description and duration for context
        description: `${action.description} ${action.duration ? `(Duration: ${action.duration})` : ''}`, 
        sourceActionId: action.id,
        assignee: action.role, // Map the Role to Assignee
        isMilestone: action.type === 'Milestone'
      };
    });

    const existingIds = new Set(timelineEvents.map(e => e.sourceActionId));
    const uniqueNewEvents = newEvents.filter(e => !existingIds.has(e.sourceActionId));

    setTimelineEvents([...timelineEvents, ...uniqueNewEvents]);
    setPlanningStep(6);
  };


  // Function to regenerate the candidate pool based on Step 2 targets
  const handleRegenerateRecommendations = () => {
    setIsRegenerating(true);
    
    // Simulate API delay
    setTimeout(() => {
      const targetRegions = targetPreferences.map(t => t.region);
      
      // Filter DB based on regions
      const filtered = SCHOOL_DATABASE.filter(uni => 
        targetRegions.length === 0 || targetRegions.includes(uni.region)
      );
      
      setCandidatePool(filtered);
      setLastGeneratedTargets(targetRegions);
      setIsRegenerating(false);
    }, 600);
  };

  // Initial load or tab switch check (Optional: Auto-load first time)
  useEffect(() => {
    if (planningStep === 3) {
      const currentRegions = targetPreferences.map(t => t.region).sort().join(',');
      const lastRegions = lastGeneratedTargets.sort().join(',');
      
      if (candidatePool.length === 0 || currentRegions !== lastRegions) {
        handleRegenerateRecommendations();
      }
    }
  }, [planningStep, targetPreferences, lastGeneratedTargets, candidatePool.length]);

  // --- Step 3 Logic: Real-time Scoring (The "Calculator") ---
  const recommendedUniversities = useMemo(() => {
    const sourceList = step3Tab === 'Search' ? SCHOOL_DATABASE : candidatePool;

    return sourceList.map(uni => {
      let score = 70; // Base score
      
      const gpaDiff = simParams.gpa - uni.avgGpa;
      score += gpaDiff * 20;

      if (simParams.toefl < uni.minToefl) score -= 30;
      else if (simParams.toefl >= uni.minToefl + 5) score += 5;

      if ((uni.region === 'US' || uni.region === 'HK' || uni.region === 'SG') && simParams.sat > 0) {
        const satDiff = (simParams.sat - uni.avgSat) / 10;
        score += satDiff;
      }

      score = Math.min(Math.max(score, 10), 98);

      let rate: 'High' | 'Medium' | 'Low' | 'Very Low' = 'Low';
      let reason = '';

      if (score >= 90) { rate = 'High'; reason = isEn ? 'Strong advantage in all metrics' : '各项指标均具备明显优势'; }
      else if (score >= 75) { rate = 'Medium'; reason = isEn ? 'GPA matched, test scores in range' : 'GPA 匹配，标化在区间内'; }
      else if (score >= 50) { rate = 'Low'; reason = isEn ? 'Gaps in metrics, need soft background' : '部分指标有差距，需软背景弥补'; }
      else { rate = 'Very Low'; reason = isEn ? 'Significant gap in hardware' : '硬件差距较大'; }

      if (simParams.toefl < uni.minToefl) {
         reason = isEn ? `Language Risk: TOEFL below threshold (${uni.minToefl})` : `语言风险：TOEFL 低于门槛 (${uni.minToefl})`;
         rate = 'Very Low';
      }

      return { ...uni, matchScore: Math.round(score), winRate: rate, reason };
    })
    .filter(u => {
        if (schoolSearchQuery) {
            return u.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()) || u.cnName.includes(schoolSearchQuery);
        }
        if (step3Tab === 'Recommend') {
           return (u.matchScore || 0) > 30;
        }
        return true;
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [simParams, candidatePool, schoolSearchQuery, step3Tab, isEn]);

  // Step 3 Handlers
  const handleAddSchool = (uni: UniversityDisplay, tier: 'Reach' | 'Match' | 'Safety', specificMajor?: string) => {
    // Determine which majors to add
    let majorsToAdd: string[] = [];

    if (specificMajor) {
      majorsToAdd = [specificMajor];
    } else {
      // If no specific major is passed (e.g. from the generic add button), 
      // try to find majors from preference, otherwise use Undecided.
      const preference = targetPreferences.find(t => t.region === uni.region);
      if (preference && preference.majors.length > 0) {
        // NOTE: In the new UI design, if multiple majors exist, users are forced to click specific buttons.
        // This fallback handles cases where there is only 1 major or "Add All" behavior is desired (though we are moving away from Add All).
        majorsToAdd = preference.majors;
      } else {
        majorsToAdd = ['Undecided'];
      }
    }

    // Create a unique entry for EACH major matched
    const newEntries: SelectedSchool[] = majorsToAdd.map(major => {
      // Check for duplicates (same school + same major)
      if (selectedSchools.some(s => s.uni.id === uni.id && s.major === major)) {
        return null;
      }
      return {
        id: `${uni.id}-${major || 'gen'}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        uni,
        tier,
        major,
        requirements: '',
        admissionAdvice: '',
        deadlines: '',
        process: '',
        portalLink: ''
      };
    }).filter(Boolean) as SelectedSchool[];

    if (newEntries.length > 0) {
      setSelectedSchools(prev => [...prev, ...newEntries]);
    }
  };

  const handleRemoveSchool = (uniqueId: string) => {
    setSelectedSchools(selectedSchools.filter(s => s.id !== uniqueId));
  };

  // Step 4 Handlers: Update specific fields
  const handleUpdateFinalSchool = (id: string, field: keyof SelectedSchool, value: string) => {
    setSelectedSchools(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  // Helper for single school enrichment
  const fetchSchoolDetails = async (school: SelectedSchool): Promise<Partial<SelectedSchool> | null> => {
    try {
      const ai = new GoogleGenAI();
      const prompt = `
        Search and summarize the undergraduate admission requirements for:
        School: ${school.uni.name}
        Major: ${school.major || 'General'}
        Entry: Fall 2025

        Output the result in pure valid JSON format. Do not use Markdown code blocks.
        JSON Structure:
        {
          "requirements": "GPA, Standardized Test (SAT/ACT policy), Language (TOEFL/IELTS), and any specific subject requirements.",
          "deadlines": "Application deadlines for ED, EA, RD (include dates).",
          "process": "Brief application process steps (e.g., Common App, Interview).",
          "portalLink": "URL to the application portal or admission page."
        }
        
        Keep text concise and formatted for a table cell (use line breaks).
        IMPORTANT: Translate the content values (requirements, deadlines, process) into ${isEn ? 'English' : 'Simplified Chinese (简体中文)'}.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      if (response.text) {
        let text = response.text;
        if (text.startsWith("```json")) {
            text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
        } else if (text.startsWith("```")) {
            text = text.replace(/^```\n?/, "").replace(/\n?```$/, "");
        }
        return JSON.parse(text);
      }
    } catch (e) {
      console.error(`Enrichment failed for ${school.uni.name}`, e);
    }
    return null;
  };

  // Step 4: Single AI Enrichment
  const handleEnrichSchoolInfo = async (schoolId: string) => {
    const school = selectedSchools.find(s => s.id === schoolId);
    if (!school) return;

    setEnrichingSchoolId(schoolId);
    try {
      const data = await fetchSchoolDetails(school);
      if (data) {
        setSelectedSchools(prev => prev.map(s => 
          s.id === schoolId ? { 
            ...s, 
            requirements: data.requirements,
            deadlines: data.deadlines,
            process: data.process,
            portalLink: data.portalLink
          } : s
        ));
      } else {
        alert(isEn ? "AI enrichment failed, please try again." : "AI 获取信息失败，请重试");
      }
    } finally {
      setEnrichingSchoolId(null);
    }
  };

  // Step 4: Batch AI Enrichment
  const handleBatchEnrich = async () => {
    setIsBatchEnriching(true);
    
    // Filter schools that need enrichment (missing requirements or deadlines)
    const schoolsToEnrich = selectedSchools.filter(s => !s.requirements || !s.deadlines);
    
    if (schoolsToEnrich.length === 0) {
      alert(isEn ? "All schools have info populated." : "所有学校信息已完善，无需补全。");
      setIsBatchEnriching(false);
      return;
    }

    try {
      const results = await Promise.all(schoolsToEnrich.map(async (school) => {
        const data = await fetchSchoolDetails(school);
        return { id: school.id, data };
      }));

      setSelectedSchools(prev => prev.map(s => {
        const result = results.find(r => r.id === s.id);
        if (result && result.data) {
          return {
            ...s,
            requirements: s.requirements || result.data.requirements,
            deadlines: s.deadlines || result.data.deadlines,
            process: s.process || result.data.process,
            portalLink: s.portalLink || result.data.portalLink
          };
        }
        return s;
      }));
    } catch (e) {
      console.error("Batch enrichment error", e);
      alert(isEn ? "Batch enrichment encountered errors." : "批量补全过程中发生错误，部分信息可能未更新。");
    } finally {
      setIsBatchEnriching(false);
    }
  };

  const getListHealth = () => {
    const reach = selectedSchools.filter(s => s.tier === 'Reach').length;
    const match = selectedSchools.filter(s => s.tier === 'Match').length;
    const safety = selectedSchools.filter(s => s.tier === 'Safety').length;
    
    if (reach > 0 && match >= 2 && safety >= 1) return { status: 'Healthy', color: 'text-green-600', text: isEn ? 'Balanced' : '结构合理' };
    if (safety === 0) return { status: 'Unbalanced', color: 'text-red-500', text: isEn ? 'No Safety' : '缺少保底' };
    if (match === 0) return { status: 'Unbalanced', color: 'text-orange-500', text: isEn ? 'No Match' : '缺少匹配' };
    return { status: 'Building', color: 'text-gray-400', text: isEn ? 'Building...' : '构建中...' };
  };

  const handleAddMajorToTarget = (targetId: number, majorName: string) => {
    setTargetPreferences(prev => prev.map(t => {
      if (t.id === targetId) {
        if (t.majors.includes(majorName)) return t;
        return { ...t, majors: [...t.majors, majorName] };
      }
      return t;
    }));
    setActiveRecommendMenu(null);
  };

  const handleAnalyzeCareer = async () => {
    const hasFamilyInfo = familyInputs.expectations && familyInputs.resources;
    if (!hasFamilyInfo) return;

    setIsAnalyzingCareer(true);
    setCareerResult(null);

    try {
      const ai = new GoogleGenAI();
      const prompt = `
        You are an expert educational consultant.
        Analyze:
        - Family: ${familyInputs.expectations}, ${familyInputs.resources}
        - Student: ${studentInputs.interests}, ${studentInputs.abilities}, ${studentInputs.intentions}

        Recommend 3 majors and 2 careers.
        Output ${isEn ? 'English' : 'Simplified Chinese'}.
        Format Majors/Careers as "English Name ${isEn ? '' : '(Chinese Name)'}".
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              synthesis: { type: Type.STRING },
              majors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    match: { type: Type.NUMBER },
                    reason: { type: Type.STRING }
                  }
                }
              },
              careers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    desc: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      const resultText = response.text;
      if (resultText) {
        const parsedData = JSON.parse(resultText);
        const groundingLinks: { title: string; url: string }[] = [];
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web?.uri) {
              groundingLinks.push({
                title: chunk.web.title || 'Source',
                url: chunk.web.uri
              });
            }
          });
        }
        setCareerResult({ ...parsedData, groundingLinks });
      }
    } catch (error) {
      console.error("AI Analysis Failed:", error);
      alert(isEn ? "AI Analysis unavailable." : "AI 分析暂时不可用，请稍后重试。");
    } finally {
      setIsAnalyzingCareer(false);
    }
  };

  // Open the modal instead of window.confirm
  const handleCompletePlanning = () => {
      setIsPublishModalOpen(true);
  };

  const confirmPublish = () => {
      setIsPublishModalOpen(false);
      setToastMessage(isEn ? 'Plan Published & Tasks Synced!' : '发布成功！规划与任务已双向同步。');
      // Here you would typically also trigger the actual API call to sync tasks/plan
  };

  const steps = [
    { step: 1, label: isEn ? '1. Career & Major' : '1. 职业与专业规划' },
    { step: 2, label: isEn ? '2. Target Setting' : '2. 目标确认' },
    { step: 3, label: isEn ? '3. Selection AI' : '3. 定校助手 (AI)' },
    { step: 4, label: isEn ? '4. Final List' : '4. 选校清单 (Final)' },
    { step: 5, label: isEn ? '5. Gap Analysis' : '5. 差距分析报告' },
    { step: 6, label: isEn ? '6. Timeline' : '6. 申请时间线' },
  ];

  return (
     <div className="flex flex-col h-full gap-4 animate-in fade-in slide-in-from-bottom-2 relative">
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
        
        <PublishConfirmModal 
          isOpen={isPublishModalOpen} 
          onClose={() => setIsPublishModalOpen(false)} 
          onConfirm={confirmPublish} 
          taskCount={timelineEvents.length}
          isEn={isEn}
        />

        <div className="w-full flex items-center justify-between gap-1 px-1 mb-1">
           {steps.map((item, idx) => (
              <React.Fragment key={item.step}>
                 <button 
                    onClick={() => setPlanningStep(item.step)}
                    className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all group flex-1 justify-center min-w-0
                       ${planningStep === item.step 
                          ? 'bg-white shadow-sm text-primary-900 ring-1 ring-gray-200 z-10' 
                          : 'text-gray-500 hover:bg-white/60 hover:text-gray-700 hover:shadow-sm'}
                    `}
                 >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors flex-shrink-0
                       ${planningStep === item.step 
                          ? 'bg-primary-600 border-primary-600 text-white' 
                          : item.step < planningStep 
                             ? 'bg-green-500 border-green-500 text-white' 
                             : 'bg-transparent border-gray-300 text-gray-400 group-hover:border-gray-400'}
                    `}>
                       {item.step < planningStep ? <Check className="w-3 h-3" /> : item.step}
                    </div>
                    
                    <span className={`text-xs whitespace-nowrap truncate hidden sm:block ${planningStep === item.step ? 'font-bold' : 'font-medium'}`}>
                       {item.label.split('. ')[1]}
                    </span>
                 </button>
                 
                 {idx < steps.length - 1 && (
                    <div className="h-px bg-gray-300 w-4 flex-shrink-0 opacity-50 hidden md:block"></div>
                 )}
              </React.Fragment>
           ))}
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-[#e5e0dc] p-8 overflow-y-auto">
            {planningStep === 1 && (
              <Step1Career 
                familyInputs={familyInputs} setFamilyInputs={setFamilyInputs}
                studentInputs={studentInputs} setStudentInputs={setStudentInputs}
                isAnalyzingCareer={isAnalyzingCareer} careerResult={careerResult}
                handleAnalyzeCareer={handleAnalyzeCareer}
                onNext={() => setPlanningStep(2)}
              />
            )}

            {planningStep === 2 && (
              <Step2Target 
                careerResult={careerResult}
                targetPreferences={targetPreferences} setTargetPreferences={setTargetPreferences}
                targetInputValues={targetInputValues} setTargetInputValues={setTargetInputValues}
                activeRecommendMenu={activeRecommendMenu} setActiveRecommendMenu={setActiveRecommendMenu}
                onNext={() => setPlanningStep(3)}
                handleAddMajorToTarget={handleAddMajorToTarget}
              />
            )}
            
            {planningStep === 3 && (
              <Step3Selection 
                targetPreferences={targetPreferences}
                simParams={simParams} setSimParams={setSimParams}
                resetSimParams={() => setSimParams(getInitialSimParams({ officialBatches, predictedBatches, subjectScores }))}
                schoolSearchQuery={schoolSearchQuery} setSchoolSearchQuery={setSchoolSearchQuery}
                selectedSchools={selectedSchools}
                handleAddSchool={handleAddSchool} handleRemoveSchool={handleRemoveSchool}
                step3Tab={step3Tab} setStep3Tab={setStep3Tab}
                isRegenerating={isRegenerating} handleRegenerateRecommendations={handleRegenerateRecommendations}
                recommendedUniversities={recommendedUniversities}
                getListHealth={getListHealth}
                onNext={() => setPlanningStep(4)}
              />
            )}

            {planningStep === 4 && (
              <Step4FinalList 
                selectedSchools={selectedSchools}
                setPlanningStep={setPlanningStep}
                handleUpdateFinalSchool={handleUpdateFinalSchool}
                handleEnrichSchoolInfo={handleEnrichSchoolInfo}
                handleBatchEnrich={handleBatchEnrich}
                isBatchEnriching={isBatchEnriching}
                enrichingSchoolId={enrichingSchoolId}
                onNext={() => setPlanningStep(5)}
                currentStats={simParams} // Pass stats for advice generation
                studentInputs={studentInputs} // Pass inputs for advice generation
              />
            )}

            {planningStep === 5 && (
              <Step5Gap 
                selectedSchools={selectedSchools}
                currentStats={simParams}
                studentInputs={studentInputs}
                setPlanningStep={setPlanningStep}
                onSyncToTimeline={handleSyncActionsToTimeline}
                studentProfile={student}
              />
            )}

            {planningStep === 6 && (
              <Step6Timeline 
                timelineEvents={timelineEvents}
                setTimelineEvents={setTimelineEvents}
                selectedSchools={selectedSchools}
                onComplete={handleCompletePlanning}
              />
            )}
        </div>
     </div>
  );
};

export default StudentPlanning;
