import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  User,
  Users,
  GraduationCap,
  Medal,
  AlertTriangle,
  Edit,
  Plus,
  Save,
  X,
  Upload,
  Sparkles,
  Loader2,
  Trash2,
  TrendingUp,
  RefreshCw,
  Calculator,
  Table,
  FileText,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Eye,
  Check,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  File as FileIcon,
  ExternalLink,
  AlertCircle,
  XCircle,
  MessageSquare,
  ArrowLeft,
} from "../common/Icons";
import { StudentSummary } from "../../types";
import { calculateExamTotal, calculatedExamRules, type CalculatedExamKey, type ExamSectionDrafts } from "../common/features/examScoreRules";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "../../contexts/LanguageContext";

interface StudentBasicInfoProps {
  student: StudentSummary;
  onNavigateToTranscript?: () => void;
  // Callback to add verified proofs to materials
  onAddProof?: (fileName: string, type: "score" | "activity") => void;
  officialBatches: OfficialBatch[];
  onOfficialBatchesChange: React.Dispatch<React.SetStateAction<OfficialBatch[]>>;
  predictedBatches: PredictedBatch[];
  onPredictedBatchesChange: React.Dispatch<React.SetStateAction<PredictedBatch[]>>;
  subjectScores: SubjectScore[];
  onSubjectScoresChange: React.Dispatch<React.SetStateAction<SubjectScore[]>>;
}

// --- Data Types ---

export type DataStatus = "Verified" | "Pending" | "Rejected";

export interface OfficialCourse {
  id: string;
  subject: string;
  grade: string;
  score: string;
  courseLevel?: string;
}

export interface OfficialBatch {
  id: string;
  curriculum: string;
  level: string;
  time: string;
  board: string;
  courses: OfficialCourse[];
  isExpanded?: boolean;
}

export interface PredictedCourse {
  id: string;
  subject: string;
  predictedGrade: string;
  courseLevel?: string;
}

export interface PredictedBatch {
  id: string;
  curriculum: string;
  predictionLevel: string;
  predictedTime: string;
  applySeason: string;
  courses: PredictedCourse[];
  isExpanded?: boolean;
}

export interface SubjectScore {
  id: string;
  subject: string;
  score: string;
  type: "AP" | "IB" | "IGCSE" | "TOEFL" | "SAT" | "ACT" | "IELTS" | "A-Level" | "Other" | string;
  subScores?: {
    R?: string; // Reading
    L?: string; // Listening
    S?: string; // Speaking
    W?: string; // Writing
    M?: string; // Math
    EBRW?: string; // SAT Evidence-Based Reading & Writing
    E?: string; // ACT English
    SCI?: string; // ACT Science
  };
  date?: string;
  status: DataStatus;
  proof?: string; // Proof filename for review
  rejectReason?: string; // Reason / remarks when rejected
}

export interface Activity {
  id: number;
  date: string; // 时间
  title: string; // 项目名
  role: string; // 职责
  achievement: string; // 成就
  status: DataStatus;
  proof?: string; // Proof filename for review
  rejectReason?: string; // Reason / remarks when rejected
}

// --- Constants ---
const DIRECTION_OPTIONS = [
  "US",
  "UK",
  "HK",
  "SG",
  "Canada",
  "Australia",
  "Europe",
  "Global",
];
const GRADE_OPTIONS = ["G9", "G10", "G11", "G12"];

// --- Initial Mock Data ---
export const initialOfficialBatches: OfficialBatch[] = [
  {
    id: "ob1",
    curriculum: "A Level",
    level: "AS",
    time: "2023-05",
    board: "Cambridge",
    isExpanded: true,
    courses: [
      { id: "c1", subject: "Mathematics", grade: "a", score: "92" },
      { id: "c2", subject: "Physics", grade: "a", score: "88" },
      { id: "c3", subject: "Chemistry", grade: "a", score: "90" },
    ],
  },
];

export const initialPredictedBatches: PredictedBatch[] = [
  {
    id: "pb1",
    curriculum: "A Level",
    predictionLevel: "A Level",
    predictedTime: "2023 Fall",
    applySeason: "2024 Entry",
    isExpanded: true,
    courses: [
      { id: "pc1", subject: "Mathematics", predictedGrade: "A*" },
      { id: "pc2", subject: "Physics", predictedGrade: "A*" },
      { id: "pc3", subject: "Chemistry", predictedGrade: "A" },
    ],
  },
];

// Added Pending items for demo
export const initialSubjectScores: SubjectScore[] = [
  {
    id: "s99",
    subject: "TOEFL",
    score: "112",
    type: "TOEFL",
    subScores: { R: "29", L: "30", S: "26", W: "27" },
    date: "2024-10-20",
    status: "Pending",
    proof: "toefl_oct_score.pdf",
  },
  {
    id: "s1",
    subject: "TOEFL",
    score: "102",
    type: "TOEFL",
    subScores: { R: "28", L: "26", S: "23", W: "25" },
    date: "2023-10",
    status: "Verified",
  },
  {
    id: "s2",
    subject: "SAT",
    score: "1520",
    type: "SAT",
    subScores: { EBRW: "720", M: "800" },
    date: "2023-12",
    status: "Verified",
  },
  {
    id: "s3",
    subject: "IELTS",
    score: "7.5",
    type: "IELTS",
    subScores: { R: "8.0", L: "8.5", S: "6.5", W: "6.5" },
    date: "2024-02",
    status: "Verified",
  },
  {
    id: "s4",
    subject: "ACT",
    score: "34",
    type: "ACT",
    subScores: { E: "34", M: "35", R: "33", SCI: "34" },
    date: "2024-05",
    status: "Verified",
  },
];

export const initialActivities: Activity[] = [
  {
    id: 99,
    date: "2023.07-2023.08",
    title: "AI Research Summer Camp",
    role: "Team Leader",
    achievement: "Led a team of 4 to develop a machine learning model for predicting crop yield. Awarded 'Best Project'.",
    status: "Pending",
    proof: "camp_certificate.jpg",
  },
  {
    id: 1,
    date: "2022.09-Present",
    title: "School Robotics Club",
    role: "Founder & President",
    achievement: "Founded the club and grew it to 50+ members. Organized 3 inter-school robotics competitions.",
    status: "Verified",
  },
  {
    id: 2,
    date: "2022.11",
    title: "AMC 12 Math Competition",
    role: "Participant (Distinction)",
    achievement: "Scored in the top 5% globally, advancing to the AIME. Dedicated 100+ hours to preparation.",
    status: "Verified",
  },
  {
    id: 3,
    date: "2021.09-2023.06",
    title: "Community Elderly Care",
    role: "Volunteer",
    achievement: "Volunteered weekly at a local nursing home, assisting seniors with technology and organizing social events.",
    status: "Verified",
  },
];

const StudentBasicInfo: React.FC<StudentBasicInfoProps> = ({
  student,
  onNavigateToTranscript,
  onAddProof,
  officialBatches,
  onOfficialBatchesChange: setOfficialBatches,
  predictedBatches,
  onPredictedBatchesChange: setPredictedBatches,
  subjectScores,
  onSubjectScoresChange: setSubjectScores,
}) => {
  const { language } = useLanguage();
  const isEn = language === "en-US";

  // --- State: Modes ---
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingFamily, setIsEditingFamily] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingALevel, setIsEditingALevel] = useState(false);
  const [isEditingTests, setIsEditingTests] = useState(false);
  const [isEditingActivities, setIsEditingActivities] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDirectionDropdownOpen, setIsDirectionDropdownOpen] = useState(false);

  // Modal State for Review Workflow
  const [reviewModalState, setReviewModalState] = useState<{
    type: "score" | "activity";
    id: string | number;
  } | null>(null);
  const [reviewRemark, setReviewRemark] = useState("");
  const [reviewStep, setReviewStep] = useState<"view" | "reject">("view");

  const handleOpenReviewModal = (
    type: "score" | "activity",
    id: string | number,
    initialStep: "view" | "reject" = "view",
  ) => {
    const item =
      type === "score"
        ? subjectScores.find((s) => s.id === id)
        : activities.find((a) => a.id === id);
    setReviewRemark(item?.rejectReason || "");
    setReviewStep(initialStep);
    setReviewModalState({ type, id });
  };

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const phaseOptions = useMemo(
    () =>
      isEn
        ? [
            "Phase 0 Onboarding",
            "Phase 1 Planning",
            "Phase 2 Tutoring",
            "Phase 3 Application",
            "Phase 4 Admission",
            "Phase 5 Review",
          ]
        : [
            "Phase 0 建档",
            "Phase 1 规划",
            "Phase 2 教学运营",
            "Phase 3 申请",
            "Phase 4 录取",
            "Phase 5 复盘",
          ],
    [isEn],
  );

  // --- State: Data ---
  const [profileData, setProfileData] = useState({
    school: "Ascent International School",
    grade: student.grade,
    class: student.class,
    direction: student.direction,
    studentId: student.studentId,
    nationality: isEn ? "China" : "中国",
    phase: student.phase,
  });

  const [familyData, setFamilyData] = useState({
    budget: isEn ? "500-800k RMB/Yr" : "50-80w RMB/年",
    location: isEn ? "US East / California" : "美国东海岸 / 加州",
    needs: isEn
      ? "Prefer Big U, high CS ranking, safety first."
      : "偏好大U，看重计算机排名，城市安全第一。",
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);

  // Add Activity Modal State
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [activityForm, setActivityForm] = useState<{
    title: string;
    grade: string;
    role: string;
    duration: string;
    proofFiles: { name: string; size: string; type: string }[];
  }>({
    title: "",
    grade: "",
    role: "",
    duration: "",
    proofFiles: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenAddActivityModal = () => {
    setActivityForm({
      title: "",
      grade: "",
      role: "",
      duration: "",
      proofFiles: [],
    });
    setIsAddActivityModalOpen(true);
  };

  const handleCloseAddActivityModal = () => {
    setIsAddActivityModalOpen(false);
  };

  const handleActivityFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).map((f: File) => ({
        name: f.name,
        size: (f.size / (1024 * 1024)).toFixed(1) + "MB",
        type: f.name.toLowerCase().endsWith(".pdf") ? "pdf" : "image",
      }));
      setActivityForm((prev) => ({
        ...prev,
        proofFiles: [...prev.proofFiles, ...files],
      }));
    }
  };

  const handleRemoveActivityProofFile = (index: number) => {
    setActivityForm((prev) => ({
      ...prev,
      proofFiles: prev.proofFiles.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitNewActivity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activityForm.title.trim()) {
      alert(isEn ? "Please enter an activity name." : "请输入活动名称");
      return;
    }

    const newActivity: Activity = {
      id: Date.now(),
      date: activityForm.grade ? `${activityForm.grade}` : "2024.09-Present",
      title: activityForm.title.trim(),
      role: activityForm.role.trim() || (isEn ? "Participant" : "参与者"),
      achievement: activityForm.duration
        ? `${isEn ? "Duration: " : "时长: "}${activityForm.duration}`
        : isEn
          ? "Activity record logged."
          : "活动记录已添加。",
      status: activityForm.proofFiles.length > 0 ? "Pending" : "Verified",
      proof:
        activityForm.proofFiles.length > 0
          ? activityForm.proofFiles[0].name
          : undefined,
    };

    setActivities((prev) => [newActivity, ...prev]);
    if (isEditingActivities) {
      setTempActivities((prev) => [newActivity, ...prev]);
    }

    // If proof files were added, archive them
    if (activityForm.proofFiles.length > 0 && onAddProof) {
      activityForm.proofFiles.forEach((file) => {
        onAddProof(file.name, "activity");
      });
    }

    handleCloseAddActivityModal();
  };

  const aLevelRef = useRef<HTMLDivElement>(null);
  const [pendingLeaveTarget, setPendingLeaveTarget] =
    useState<HTMLElement | null>(null);

  useEffect(() => {
    if (isEditingALevel && unsavedChanges) {
      const handleClick = (e: MouseEvent) => {
        if (aLevelRef.current && aLevelRef.current.contains(e.target as Node)) {
          return;
        }
        if (
          document
            .getElementById("leave-warning-modal")
            ?.contains(e.target as Node)
        ) {
          return;
        }
        e.stopPropagation();
        e.preventDefault();
        setPendingLeaveTarget(e.target as HTMLElement);
      };
      document.addEventListener("click", handleClick, true);
      return () => document.removeEventListener("click", handleClick, true);
    }
  }, [isEditingALevel, unsavedChanges]);

  const handleConfirmLeave = () => {
    // Save or clear? The user said '继续前行' means leaving and losing changes
    setIsEditingALevel(false);
    setUnsavedChanges(false);
    setTempOfficial([]);
    setTempPredicted([]);
    const target = pendingLeaveTarget;
    setPendingLeaveTarget(null);
    setTimeout(() => {
      target?.click();
    }, 50);
  };

  const [isOrganizing, setIsOrganizing] = useState(false);
  const [notes, setNotes] = useState(
    isEn ? "" : "",
  );

  const [termToDelete, setTermToDelete] = useState<string | null>(null);

  // --- Temp State for Edits ---
  const [tempProfileData, setTempProfileData] = useState(profileData);
  const [tempFamilyData, setTempFamilyData] = useState(familyData);
  const [tempNotes, setTempNotes] = useState("");
  const [tempOfficial, setTempOfficial] = useState<OfficialBatch[]>([]);
  const [tempPredicted, setTempPredicted] = useState<PredictedBatch[]>([]);
  const [tempSubjectScores, setTempSubjectScores] = useState<SubjectScore[]>(
    [],
  );
  const [calculatedTotalNotice, setCalculatedTotalNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!calculatedTotalNotice) return;
    const timer = window.setTimeout(() => setCalculatedTotalNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [calculatedTotalNotice]);
  const [tempActivities, setTempActivities] = useState<Activity[]>([]);

  // --- Handlers: Profile ---
  const handleStartEditProfile = () => {
    setTempProfileData({ ...profileData });
    setIsEditingProfile(true);
  };
  const handleSaveProfile = () => {
    setProfileData(tempProfileData);
    setIsEditingProfile(false);
  };
  const handleCancelProfile = () => {
    setIsEditingProfile(false);
  };

  // --- Handlers: Family ---
  const handleStartEditFamily = () => {
    setTempFamilyData({ ...familyData });
    setIsEditingFamily(true);
  };
  const handleSaveFamily = () => {
    setFamilyData(tempFamilyData);
    setIsEditingFamily(false);
  };
  const handleCancelFamily = () => {
    setIsEditingFamily(false);
  };

  // --- Handlers: Notes ---
  const handleStartEditNotes = () => {
    setTempNotes(notes || "");
    setIsEditingNotes(true);
  };
  const handleSaveNotes = () => {
    setNotes(tempNotes);
    setIsEditingNotes(false);
  };
  const handleCancelNotes = () => {
    setIsEditingNotes(false);
  };

  // --- Handlers: Tests ---
  const handleStartEditTests = () => {
    setTempSubjectScores(JSON.parse(JSON.stringify(subjectScores)));
    setIsEditingTests(true);
  };
  const handleSaveTests = () => {
    setSubjectScores(tempSubjectScores);
    setIsEditingTests(false);
  };
  const handleCancelTests = () => {
    setIsEditingTests(false);
    setCalculatedTotalNotice(null);
  };

  const getCalculatedSubjectTotal = (score: SubjectScore): { key: CalculatedExamKey; total: number } | null => {
    let key: CalculatedExamKey;
    let drafts: ExamSectionDrafts;

    if (score.type === "TOEFL") {
      const examDate = Date.parse(score.date || "");
      if (!Number.isFinite(examDate)) return null;
      key = examDate >= Date.parse("2026-01-21") ? "toefl" : "oldToefl";
      drafts = {
        reading: score.subScores?.R || "",
        listening: score.subScores?.L || "",
        speaking: score.subScores?.S || "",
        writing: score.subScores?.W || "",
      };
    } else if (score.type === "IELTS") {
      key = "ielts";
      drafts = {
        reading: score.subScores?.R || "",
        listening: score.subScores?.L || "",
        speaking: score.subScores?.S || "",
        writing: score.subScores?.W || "",
      };
    } else if (score.type === "SAT") {
      key = "sat";
      drafts = {
        readingWriting: score.subScores?.EBRW || "",
        math: score.subScores?.M || "",
      };
    } else if (score.type === "ACT") {
      key = "act";
      drafts = {
        english: score.subScores?.E || "",
        math: score.subScores?.M || "",
        reading: score.subScores?.R || "",
        science: score.subScores?.SCI || "",
      };
    } else {
      return null;
    }

    const total = calculateExamTotal(key, drafts);
    return total === null ? null : { key, total };
  };

  const handleUpdateTempSubjectScore = (
    id: string,
    field: keyof SubjectScore,
    value: string,
  ) => {
    setTempSubjectScores((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value, ...(field === 'type' ? { subject: value } : {}) } : s)),
    );
  };
  const handleUpdateTempSubjectSubScore = (
    id: string,
    subField: keyof NonNullable<SubjectScore["subScores"]>,
    value: string,
  ) => {
    setTempSubjectScores((prev) => {
      let updatedScore: SubjectScore | null = null;
      const nextScores = prev.map((s) => {
        if (s.id === id) {
          updatedScore = {
            ...s,
            subScores: {
              ...(s.subScores || {}),
              [subField]: value,
            },
          };
          return updatedScore;
        }
        return s;
      });

      if (updatedScore) {
        const calculated = getCalculatedSubjectTotal(updatedScore);
        if (calculated) {
          const displayTotal = calculatedExamRules[calculated.key].totalStep < 1
            ? calculated.total.toFixed(1)
            : String(calculated.total);
          setCalculatedTotalNotice(isEn ? `Total should be ${displayTotal}` : `总分应为${displayTotal}分`);
        } else {
          setCalculatedTotalNotice(null);
        }
      }

      return nextScores;
    });
  };
  const handleRemoveTempSubjectScore = (id: string) => {
    setTempSubjectScores((prev) => prev.filter((s) => s.id !== id));
  };
  const handleAddTempSubjectScore = () => {
    setTempSubjectScores([
      ...tempSubjectScores,
      {
        id: `s-${Date.now()}`,
        subject: "TOEFL",
        score: "-",
        type: "TOEFL",
        date: new Date().getFullYear().toString(),
        subScores: { R: "-", L: "-", S: "-", W: "-" },
        status: "Verified",
      },
    ]);
  };

  // --- Handlers: Activities ---
  const handleStartEditActivities = () => {
    setTempActivities(JSON.parse(JSON.stringify(activities)));
    setIsEditingActivities(true);
  };
  const handleSaveActivities = () => {
    setActivities(tempActivities);
    setIsEditingActivities(false);
  };
  const handleCancelActivities = () => {
    setIsEditingActivities(false);
  };
  const handleUpdateTempActivity = (
    id: number,
    field: keyof Activity,
    value: string,
  ) => {
    setTempActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );
  };
  const handleRemoveTempActivity = (id: number) => {
    setTempActivities((prev) => prev.filter((a) => a.id !== id));
  };
  const handleAddTempActivity = () => {
    setTempActivities([
      {
        id: Date.now(),
        date: "2024.01-Present",
        title: "New Activity",
        role: "Participant",
        achievement: "Describe the achievement here.",
        status: "Verified",
      },
      ...tempActivities,
    ]);
  };
  const handleOrganizeActivities = () => {
    setIsOrganizing(true);
    // Mock organizing on real state for demo simplicity, or could apply to temp if editing
    setTimeout(() => {
      setIsOrganizing(false);
      if (isEditingActivities) {
        setTempActivities([
          {
            id: 99,
            title: "AI Research Intern (Extracted)",
            role: "Assistant",
            level: "Regional",
            hours: "40h",
            grade: "11",
            status: "Verified",
          },
          ...tempActivities,
        ]);
      } else {
        setActivities([
          {
            id: 99,
            title: "AI Research Intern (Extracted)",
            role: "Assistant",
            level: "Regional",
            hours: "40h",
            grade: "11",
            status: "Verified",
          },
          ...activities,
        ]);
      }
    }, 1500);
  };

  // --- Handlers: A Level ---
  useEffect(() => {
    if (isEditingALevel && unsavedChanges) {
      const timer = setTimeout(() => {
        setLastSavedTime(new Date());
        setUnsavedChanges(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tempOfficial, tempPredicted, isEditingALevel, unsavedChanges]);

  const handleStartEditALevel = () => {
    setTempOfficial(JSON.parse(JSON.stringify(officialBatches)));
    setTempPredicted(JSON.parse(JSON.stringify(predictedBatches)));
    setIsEditingALevel(true);
    setUnsavedChanges(false);
    setLastSavedTime(null);
  };

  const handleSaveALevel = () => {
    setOfficialBatches(tempOfficial);
    setPredictedBatches(tempPredicted);
    setIsEditingALevel(false);
    setUnsavedChanges(false);
    setLastSavedTime(null);
  };

  const handleCancelALevel = () => {
    setIsEditingALevel(false);
  };

  const wrapChange = (setter: any) => {
    setter();
    setUnsavedChanges(true);
  };

  const handleToggleOfficialBatch = (id: string) => {
    if (isEditingALevel) {
      wrapChange(() =>
        setTempOfficial((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, isExpanded: !t.isExpanded } : t,
          ),
        ),
      );
    } else {
      setOfficialBatches((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, isExpanded: !t.isExpanded } : t,
        ),
      );
    }
  };

  const handleTogglePredictedBatch = (id: string) => {
    if (isEditingALevel) {
      wrapChange(() =>
        setTempPredicted((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, isExpanded: !t.isExpanded } : t,
          ),
        ),
      );
    } else {
      setPredictedBatches((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, isExpanded: !t.isExpanded } : t,
        ),
      );
    }
  };

  const handleUpdateOfficialBatch = (
    id: string,
    field: keyof OfficialBatch,
    value: string,
  ) => {
    wrapChange(() =>
      setTempOfficial((prev) =>
        prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
      ),
    );
  };

  const handleUpdatePredictedBatch = (
    id: string,
    field: keyof PredictedBatch,
    value: string,
  ) => {
    wrapChange(() =>
      setTempPredicted((prev) =>
        prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
      ),
    );
  };

  const handleUpdateOfficialCourse = (
    batchId: string,
    courseId: string,
    field: keyof OfficialCourse,
    value: string,
  ) => {
    wrapChange(() =>
      setTempOfficial((prev) =>
        prev.map((t) => {
          if (t.id !== batchId) return t;
          return {
            ...t,
            courses: t.courses.map((c) =>
              c.id === courseId ? { ...c, [field]: value } : c,
            ),
          };
        }),
      ),
    );
  };

  const handleUpdatePredictedCourse = (
    batchId: string,
    courseId: string,
    field: keyof PredictedCourse,
    value: string,
  ) => {
    wrapChange(() =>
      setTempPredicted((prev) =>
        prev.map((t) => {
          if (t.id !== batchId) return t;
          return {
            ...t,
            courses: t.courses.map((c) =>
              c.id === courseId ? { ...c, [field]: value } : c,
            ),
          };
        }),
      ),
    );
  };

  const handleAddOfficialCourse = (batchId: string) => {
    wrapChange(() =>
      setTempOfficial((prev) =>
        prev.map((t) => {
          if (t.id !== batchId) return t;
          return {
            ...t,
            courses: [
              ...t.courses,
              { id: `c-${Date.now()}`, subject: "", grade: "", score: "" },
            ],
          };
        }),
      ),
    );
  };

  const handleAddPredictedCourse = (batchId: string) => {
    wrapChange(() =>
      setTempPredicted((prev) =>
        prev.map((t) => {
          if (t.id !== batchId) return t;
          return {
            ...t,
            courses: [
              ...t.courses,
              { id: `pc-${Date.now()}`, subject: "", predictedGrade: "" },
            ],
          };
        }),
      ),
    );
  };

  const handleRemoveOfficialCourse = (batchId: string, courseId: string) => {
    wrapChange(() =>
      setTempOfficial((prev) =>
        prev.map((t) => {
          if (t.id !== batchId) return t;
          return { ...t, courses: t.courses.filter((c) => c.id !== courseId) };
        }),
      ),
    );
  };

  const handleRemovePredictedCourse = (batchId: string, courseId: string) => {
    wrapChange(() =>
      setTempPredicted((prev) =>
        prev.map((t) => {
          if (t.id !== batchId) return t;
          return { ...t, courses: t.courses.filter((c) => c.id !== courseId) };
        }),
      ),
    );
  };

  const handleAddOfficialBatch = (sys: string) => {
    wrapChange(() =>
      setTempOfficial([
        ...tempOfficial,
        {
          id: `ob-${Date.now()}`,
          curriculum: sys,
          level: "",
          time: "",
          board: "",
          courses: [],
          isExpanded: true,
        },
      ]),
    );
  };

  const handleAddPredictedBatch = (sys: string) => {
    wrapChange(() =>
      setTempPredicted([
        ...tempPredicted,
        {
          id: `pb-${Date.now()}`,
          curriculum: sys,
          predictionLevel: "",
          predictedTime: "",
          applySeason: "",
          courses: [],
          isExpanded: true,
        },
      ]),
    );
  };

  const requestDeleteOfficialBatch = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setTermToDelete(id);
  };
  const requestDeletePredictedBatch = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setTermToDelete(id);
  };

  const confirmDeleteTerm = () => {
    if (termToDelete) {
      setTempOfficial((prev) => prev.filter((t) => t.id !== termToDelete));
      setTempPredicted((prev) => prev.filter((t) => t.id !== termToDelete));
      setTermToDelete(null);
    }
  };

  // --- Approval Workflow Handlers ---
  const handleProcessReview = (action: "approve" | "reject") => {
    if (!reviewModalState) return;

    if (action === "approve") {
      if (reviewModalState.type === "score") {
        setSubjectScores((prev) =>
          prev.map((s) =>
            s.id === reviewModalState.id
              ? { ...s, status: "Verified", rejectReason: undefined }
              : s,
          ),
        );
        const item = subjectScores.find((s) => s.id === reviewModalState.id);
        if (item && item.proof && onAddProof) onAddProof(item.proof, "score");
      } else {
        setActivities((prev) =>
          prev.map((a) =>
            a.id === reviewModalState.id
              ? { ...a, status: "Verified", rejectReason: undefined }
              : a,
          ),
        );
        const item = activities.find((a) => a.id === reviewModalState.id);
        if (item && item.proof && onAddProof)
          onAddProof(item.proof, "activity");
      }
    } else {
      const finalRemark =
        reviewRemark.trim() ||
        (isEn
          ? "The submitted information does not meet verification requirements."
          : "提交的信息或证明材料未通过核验，已驳回。");

      if (reviewModalState.type === "score") {
        setSubjectScores((prev) =>
          prev.map((s) =>
            s.id === reviewModalState.id
              ? { ...s, status: "Rejected", rejectReason: finalRemark }
              : s,
          ),
        );
      } else {
        setActivities((prev) =>
          prev.map((a) =>
            a.id === reviewModalState.id
              ? { ...a, status: "Rejected", rejectReason: finalRemark }
              : a,
          ),
        );
      }
    }
    setReviewModalState(null);
    setReviewRemark("");
    setReviewStep("view");
  };

  const getReviewingItem = () => {
    if (!reviewModalState) return null;
    if (reviewModalState.type === "score") {
      return subjectScores.find((s) => s.id === reviewModalState.id);
    } else {
      return activities.find((a) => a.id === reviewModalState.id);
    }
  };

  const reviewingItem = getReviewingItem();
  const pendingCount =
    subjectScores.filter((s) => s.status === "Pending").length +
    activities.filter((a) => a.status === "Pending").length;

  return (
    <>
      {calculatedTotalNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-5 z-[10000] flex w-[340px] max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 dark:border-red-500/30 dark:bg-red-950/90 dark:text-red-300"
        >
          <XCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
          <span className="flex-1">{calculatedTotalNotice}</span>
          <button
            type="button"
            aria-label={isEn ? "Close total score notice" : "关闭总分提示"}
            onClick={() => setCalculatedTotalNotice(null)}
            className="rounded p-0.5 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-1 focus:ring-red-400 dark:hover:bg-red-900/50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {pendingLeaveTarget && (
        <div
          id="leave-warning-modal"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {isEn ? "Unsaved Changes" : "未保存修改"}
                </h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  {isEn
                    ? "You have unsaved grade modifications. Leaving directly will cause them to be lost. Would you like to continue leaving or stay and save?"
                    : "您还有未保存的成绩修改，直接离开将会丢失，是否继续前行或留下来保存？"}
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setPendingLeaveTarget(null)}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                  >
                    {isEn ? "Stay & Save" : "留下来保存"}
                  </button>
                  <button
                    onClick={handleConfirmLeave}
                    className="px-4 py-2 bg-white text-gray-700 text-sm font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {isEn ? "Discard & Leave" : "继续前行"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 h-full overflow-y-auto pr-2 pb-10 relative min-h-0">
        {/* Pending Alerts Banner */}
        {pendingCount > 0 && (
          <div className="lg:col-span-3 bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between animate-in slide-in-from-top-2 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-bold text-orange-800">
                {isEn
                  ? `You have ${pendingCount} pending updates to review.`
                  : `您有 ${pendingCount} 条来自学生的更新申请待审核。`}
              </span>
            </div>
            <span className="text-xs text-orange-600 bg-white px-2 py-1 rounded border border-orange-100">
              Action Required
            </span>
          </div>
        )}

        {/* Review Modal */}
        {reviewingItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => {
              setReviewModalState(null);
              setReviewStep("view");
            }}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-[620px] max-w-[95%] m-4 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`px-6 py-4 border-b flex justify-between items-center ${
                reviewStep === "reject"
                  ? "bg-red-50/70 dark:bg-red-950/30 border-red-100 dark:border-red-900/30"
                  : "bg-gray-50/50 dark:bg-white/5 border-gray-100 dark:border-white/5"
              }`}>
                <div className="flex items-center gap-2">
                  {reviewStep === "reject" ? (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-red-900 dark:text-red-300 text-base">
                          {isEn ? "Reject & Provide Feedback" : "填写驳回原因与指导备注"}
                        </h3>
                        <p className="text-[11px] text-red-600/80 dark:text-red-400/80">
                          {isEn ? "Step 2: Enter note for student" : "步骤 2/2：填写修改指引后通知学生"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white text-base">
                          {isEn ? "Review Application" : "审核更新申请"}
                        </h3>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                          {reviewingItem.status === "Rejected"
                            ? (isEn ? "Status: Currently Rejected" : "状态：当前已驳回，可修改备注或重新核验")
                            : (isEn ? "Status: Pending Counselor Verification" : "状态：待顾问核验")}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    setReviewModalState(null);
                    setReviewStep("view");
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                {reviewStep === "reject" ? (
                  /* Dedicated Rejection Remarks Form */
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                    {/* Item Summary Banner */}
                    <div className="p-3.5 bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 block mb-0.5">
                          {isEn ? "Target Application" : "正在驳回的申请项目"}
                        </span>
                        <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                          {"subject" in reviewingItem
                            ? `${reviewingItem.subject} (${reviewingItem.score}) • ${reviewingItem.date || "No Date"}`
                            : `${reviewingItem.title} • ${reviewingItem.role}`}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-md border border-red-200 dark:border-red-800/50 flex-shrink-0">
                        {isEn ? "Reject Flow" : "驳回核验"}
                      </span>
                    </div>

                    {/* Feedback Prompt Banner */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-red-600" />
                          {isEn ? "Rejection Reason & Student Instructions" : "驳回原因与修改指引（将即时同步给学生）："}
                        </label>
                        <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                          {isEn ? "* Required/Recommended" : "建议详细填写"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed mb-3">
                        {isEn
                          ? "Please specify why the submission failed and what the student needs to provide."
                          : "请指出材料中存在的问题（如未盖章、不清晰、成绩不符等），帮助学生快速修正。"}
                      </p>

                      {/* Quick Presets */}
                      <div className="mb-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                          {isEn ? "Quick Presets (Click to insert):" : "快捷常用理由（点击添加）："}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            isEn ? "Proof document is blurry / illegible" : "佐证材料模糊不清",
                            isEn ? "Missing official seal or signature" : "缺少官方有效盖章或签名",
                            isEn ? "Score/Test date does not match certificate" : "成绩或考试日期与凭证不符",
                            isEn ? "Activity role & achievements lack detail" : "活动职责与成果描述不详",
                            isEn ? "Please re-upload original electronic PDF score report" : "请重新上传官方原版PDF电子成绩单",
                            isEn ? "Duplicate submission" : "重复提交",
                          ].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setReviewRemark((prev) =>
                                  prev ? `${prev}；${preset}` : preset
                                );
                              }}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-red-50/70 hover:bg-red-100 text-red-700 dark:bg-red-950/30 dark:hover:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800/40 font-medium transition-colors cursor-pointer text-left"
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Main Textarea */}
                      <div className="space-y-1">
                        <textarea
                          autoFocus
                          value={reviewRemark}
                          onChange={(e) => setReviewRemark(e.target.value)}
                          rows={4}
                          placeholder={
                            isEn
                              ? "Enter specific reasons for rejection or instructions for the student (e.g. please upload official sealed score report)..."
                              : "请输入单条驳回的具体原因或修改指导（例如：佐证材料缺少官方有效盖章，请重新上传清晰的高清扫描件）..."
                          }
                          className="w-full bg-white dark:bg-zinc-800 border-2 border-red-200 dark:border-red-500/30 rounded-xl p-3.5 text-xs text-gray-800 dark:text-white placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all resize-y min-h-[110px]"
                        />
                        <div className="flex justify-between items-center text-[10px] text-gray-400 px-1">
                          <span>{isEn ? "Visible in student's profile under rejected status." : "学生端基础信息列表将以红色醒目提示此驳回备注。"}</span>
                          <span>{reviewRemark.length} {isEn ? "characters" : "字"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Review View (Details + Proof) */
                  <div className="space-y-6">
                    {/* Item Details */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-3 tracking-wider">
                        {isEn ? "Item Details" : "申请内容详情"}
                      </h4>
                      <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-100 dark:border-white/5 grid grid-cols-2 gap-4">
                        {"subject" in reviewingItem ? (
                          // Score Details
                          <>
                            <div>
                              <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">
                                {isEn ? "Subject" : "科目"}
                              </p>
                              <p className="font-bold text-gray-900 dark:text-white text-sm">
                                {reviewingItem.subject}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">
                                {isEn ? "Score" : "分数"}
                              </p>
                              <p className="font-bold text-primary-600 dark:text-primary-400 text-lg">
                                {reviewingItem.score}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">
                                {isEn ? "Type" : "类型"}
                              </p>
                              <p className="font-medium text-gray-700 dark:text-zinc-300 text-sm">
                                {reviewingItem.type}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">
                                {isEn ? "Date" : "考试日期"}
                              </p>
                              <p className="font-medium text-gray-700 dark:text-zinc-300 text-sm">
                                {reviewingItem.date}
                              </p>
                            </div>
                          </>
                        ) : (
                          // Activity Details
                          <>
                            <div className="col-span-2">
                              <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">
                                {isEn ? "Title" : "活动名称"}
                              </p>
                              <p className="font-bold text-gray-900 dark:text-white text-sm">
                                {reviewingItem.title}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">
                                {isEn ? "Role" : "角色"}
                              </p>
                              <p className="font-medium text-gray-700 dark:text-zinc-300 text-sm">
                                {reviewingItem.role}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">
                                {isEn ? "Level" : "级别"}
                              </p>
                              <p className="font-medium text-gray-700 dark:text-zinc-300 text-sm">
                                {reviewingItem.level}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">
                                {isEn ? "Hours" : "时长"}
                              </p>
                              <p className="font-medium text-gray-700 dark:text-zinc-300 text-sm">
                                {reviewingItem.hours}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">
                                {isEn ? "Grade" : "年级"}
                              </p>
                              <p className="font-medium text-gray-700 dark:text-zinc-300 text-sm">
                                {reviewingItem.grade}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Proof Preview */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-3 tracking-wider flex items-center gap-2">
                        {isEn ? "Proof of Evidence" : "佐证材料"}
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-normal normal-case">
                          File Attached
                        </span>
                      </h4>
                      <div className="bg-gray-100 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center relative group overflow-hidden">
                        {reviewingItem.proof ? (
                          <>
                            <div className="w-16 h-16 bg-white dark:bg-zinc-700 rounded-xl shadow-sm flex items-center justify-center mb-3">
                              <ImageIcon className="w-8 h-8 text-gray-400 dark:text-zinc-500" />
                            </div>
                            <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">
                              {reviewingItem.proof}
                            </p>
                            <button className="mt-4 flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 font-bold hover:underline">
                              <ExternalLink className="w-3 h-3" />{" "}
                              {isEn ? "Open Full Preview" : "查看完整大图"}
                            </button>
                          </>
                        ) : (
                          <div className="text-gray-400 dark:text-zinc-500 text-sm flex flex-col items-center">
                            <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
                            {isEn ? "No proof attached" : "未上传证明材料"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* If item was already rejected, show current remark box */}
                    {reviewingItem.status === "Rejected" && (
                      <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-xl">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-red-900 dark:text-red-200 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            {isEn ? "Current Rejection Remarks" : "当前已填写的驳回备注"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setReviewStep("reject")}
                            className="text-xs text-red-700 hover:text-red-800 dark:text-red-300 font-semibold underline flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3 h-3" /> {isEn ? "Edit Remarks" : "修改驳回原因"}
                          </button>
                        </div>
                        <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed bg-white/70 dark:bg-zinc-800/60 p-2.5 rounded-lg border border-red-100 dark:border-red-500/10">
                          {reviewingItem.rejectReason || (isEn ? "No specific note." : "暂无详细备注。")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 bg-gray-50 dark:bg-zinc-900/50 border-t border-gray-100 dark:border-white/5 flex gap-4">
                {reviewStep === "reject" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setReviewStep("view")}
                      className="flex-1 py-3 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <ArrowLeft className="w-4 h-4" /> {isEn ? "Back to Details" : "返回申请详情"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProcessReview("reject")}
                      className="flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <XCircle className="w-5 h-5" />{" "}
                      {isEn ? "Confirm Rejection & Save Remarks" : "确认驳回并保存备注"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setReviewStep("reject")}
                      className="flex-1 py-3 border border-red-200 dark:border-red-500/25 bg-red-50/70 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <XCircle className="w-4 h-4" /> {isEn ? "Reject & Provide Remarks" : "驳回申请 (填写原因)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProcessReview("approve")}
                      className="flex-[2] py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-5 h-5" />{" "}
                      {isEn ? "Verify & Approve" : "确认无误，通过审核"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {termToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setTermToDelete(null)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-[90%] m-4 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {isEn ? "Delete Term?" : "确认删除学期？"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    {isEn
                      ? "This action will permanently delete this term and all its courses. This cannot be undone."
                      : "该操作将永久删除此学期及其包含的所有课程数据，无法撤销。"}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setTermToDelete(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                  {isEn ? "Cancel" : "取消"}
                </button>
                <button
                  onClick={confirmDeleteTerm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-sm transition-colors"
                >
                  {isEn ? "Delete" : "确认删除"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- LEFT COLUMN: Profile & Family --- */}
        <div className="space-y-6 min-w-0">
          {/* 1. Basic Profile */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-[#e5e0dc] transition-all hover:shadow-md">
            {/* ... Profile Content (Same as before) ... */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <User className="w-4 h-4 text-primary-600" />{" "}
                {isEn ? "Basic Profile" : "基础资料"}
              </h3>
              {isEditingProfile ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelProfile}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="text-xs text-green-600 hover:text-green-700"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartEditProfile}
                  className="text-xs text-primary-600 hover:underline"
                >
                  <Edit className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-3 text-sm">
              {/* Render based on tempProfileData if editing, else profileData */}
              {[
                { label: isEn ? "School" : "学校", key: "school" },
                { label: isEn ? "Grade" : "年级", key: "grade" },
                { label: isEn ? "Direction" : "方向", key: "direction" },
                { label: isEn ? "Student ID" : "学号", key: "studentId" },
                { label: isEn ? "Nationality" : "国籍", key: "nationality" },
                { label: isEn ? "Phase" : "当前阶段", key: "phase" },
              ].map(({ label, key }) => {
                const data = isEditingProfile ? tempProfileData : profileData;
                return (
                  <div
                    key={key}
                    className="flex justify-between border-b border-dashed border-gray-100 pb-2 items-center min-h-[32px]"
                  >
                    <span className="text-gray-500 w-24 flex-shrink-0">
                      {label}
                    </span>
                    {isEditingProfile ? (
                      key === "phase" ? (
                        <select
                          className="text-right font-medium text-gray-900 border-b border-primary-300 focus:border-primary-600 outline-none w-full bg-transparent py-0.5 cursor-pointer"
                          value={data[key as keyof typeof data]}
                          onChange={(e) =>
                            setTempProfileData({
                              ...tempProfileData,
                              [key]: e.target.value as any,
                            })
                          }
                        >
                          {phaseOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : key === "direction" ? (
                        <div className="relative w-full">
                          <div
                            className="flex flex-wrap justify-end gap-1 cursor-pointer border-b border-primary-300 min-h-[24px] pb-0.5"
                            onClick={() =>
                              setIsDirectionDropdownOpen(
                                !isDirectionDropdownOpen,
                              )
                            }
                          >
                            {data.direction.split(",").filter(Boolean).length >
                            0 ? (
                              data.direction
                                .split(",")
                                .filter(Boolean)
                                .map((d) => (
                                  <span
                                    key={d}
                                    className="bg-primary-100 text-primary-800 text-[10px] px-1.5 py-0.5 rounded font-medium"
                                  >
                                    {d.trim()}
                                  </span>
                                ))
                            ) : (
                              <span className="text-gray-400 text-xs">
                                {isEn ? "Select..." : "选择方向..."}
                              </span>
                            )}
                          </div>

                          {isDirectionDropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40 cursor-default"
                                onClick={() =>
                                  setIsDirectionDropdownOpen(false)
                                }
                              ></div>
                              <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                                <div className="space-y-1">
                                  {DIRECTION_OPTIONS.map((opt) => {
                                    const selected =
                                      data.direction.includes(opt);
                                    return (
                                      <div
                                        key={opt}
                                        className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer rounded transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const current = data.direction
                                            .split(",")
                                            .map((s) => s.trim())
                                            .filter(Boolean);
                                          let newDirs;
                                          if (selected) {
                                            newDirs = current.filter(
                                              (c) => c !== opt,
                                            );
                                          } else {
                                            newDirs = [...current, opt];
                                          }
                                          setTempProfileData({
                                            ...tempProfileData,
                                            direction: newDirs.join(","),
                                          });
                                        }}
                                      >
                                        <div
                                          className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${selected ? "bg-primary-600 border-primary-600" : "border-gray-300"}`}
                                        >
                                          {selected && (
                                            <Check className="w-3 h-3 text-white" />
                                          )}
                                        </div>
                                        <span className="text-sm text-gray-700">
                                          {opt}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="border-t mt-2 pt-2 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsDirectionDropdownOpen(false);
                                    }}
                                    className="text-xs text-primary-600 font-bold hover:text-primary-800"
                                  >
                                    {isEn ? "Done" : "完成"}
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : key === "grade" ? (
                        <select
                          className="text-right font-medium text-gray-900 border-b border-primary-300 focus:border-primary-600 outline-none w-full bg-transparent py-0.5 cursor-pointer"
                          value={data[key as keyof typeof data]}
                          onChange={(e) =>
                            setTempProfileData({
                              ...tempProfileData,
                              [key]: e.target.value,
                            })
                          }
                        >
                          {GRADE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="text-right font-medium text-gray-900 border-b border-primary-300 focus:border-primary-600 outline-none w-full bg-transparent"
                          value={data[key as keyof typeof data]}
                          onChange={(e) =>
                            setTempProfileData({
                              ...tempProfileData,
                              [key]: e.target.value,
                            })
                          }
                        />
                      )
                    ) : key === "direction" ? (
                      <div className="flex justify-end gap-1 flex-wrap">
                        {data.direction
                          .split(",")
                          .filter(Boolean)
                          .map((d) => (
                            <span
                              key={d}
                              className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700 font-bold border border-gray-200"
                            >
                              {d.trim()}
                            </span>
                          ))}
                      </div>
                    ) : (
                      <span className="text-gray-900 font-medium text-right w-full">
                        {data[key as keyof typeof data]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Family Preferences */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-[#e5e0dc] transition-all hover:shadow-md">
            {/* ... Family Content ... */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-600" />{" "}
                {isEn ? "Family Preferences" : "家庭偏好与约束"}
              </h3>
              {isEditingFamily ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelFamily}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSaveFamily}
                    className="text-xs text-green-600 hover:text-green-700"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartEditFamily}
                  className="text-xs text-primary-600 hover:underline"
                >
                  <Edit className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">
                  {isEn ? "Budget Range" : "预算范围"}
                </p>
                {isEditingFamily ? (
                  <input
                    className="w-full text-sm font-bold text-gray-800 bg-white border border-gray-300 rounded px-2 py-1"
                    value={tempFamilyData.budget}
                    onChange={(e) =>
                      setTempFamilyData({
                        ...tempFamilyData,
                        budget: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm font-bold text-gray-800">
                    {familyData.budget}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">
                  {isEn ? "Location" : "地理偏好"}
                </p>
                {isEditingFamily ? (
                  <input
                    className="w-full text-sm font-bold text-gray-800 bg-white border border-gray-300 rounded px-2 py-1"
                    value={tempFamilyData.location}
                    onChange={(e) =>
                      setTempFamilyData({
                        ...tempFamilyData,
                        location: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm font-bold text-gray-800">
                    {familyData.location}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 5. Teacher Notes */}
          <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100 relative overflow-hidden transition-all hover:shadow-md">
            {/* ... Notes Content ... */}
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-yellow-800 flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4" />{" "}
                {isEn ? "Counselor Notes" : "升学顾问备注"}
              </h3>
              {isEditingNotes ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelNotes}
                    className="text-xs text-yellow-600 hover:text-yellow-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    className="text-xs text-green-600 hover:text-green-700"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartEditNotes}
                  className="text-xs text-yellow-700 hover:underline"
                >
                  <Edit className="w-3 h-3" />
                </button>
              )}
            </div>
            {isEditingNotes ? (
              <textarea
                className="w-full bg-white border border-yellow-300 rounded-lg p-2.5 text-xs text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-400 outline-none resize-none transition-all shadow-xs"
                rows={3}
                placeholder={isEn ? "Enter counselor notes here..." : "在此输入升学顾问备注..."}
                value={tempNotes}
                autoFocus
                onChange={(e) => setTempNotes(e.target.value)}
              />
            ) : (
              <p className={`text-xs leading-relaxed whitespace-pre-wrap ${notes ? "text-yellow-900 font-medium" : "text-yellow-800/80"}`}>
                {notes || (isEn ? "No notes available." : "暂无备注。")}
              </p>
            )}
          </div>
        </div>

        {/* --- MIDDLE & RIGHT COLUMN --- */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* 3. Academic Results Management */}
          <div
            ref={aLevelRef}
            className="bg-white rounded-xl shadow-sm border border-[#e5e0dc] transition-all hover:shadow-md flex flex-col relative"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 flex-shrink-0">
              <div className="flex items-center gap-4 flex-wrap">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary-600" />{" "}
                  {isEn ? "Academic & Activity Background" : "学术活动背景"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAddActivityModal}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#A37B5C] text-white shadow-sm hover:bg-[#8E694C] transition-colors cursor-pointer"
                  title={isEn ? "Add New Activity" : "添加新活动"}
                >
                  <Plus className="w-3.5 h-3.5" />{" "}
                  {isEn ? "Add Activity" : "添加活动"}
                </button>
                {!isEditingALevel ? (
                  <>
                    <button
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />{" "}
                      {isEn ? "Preview PDF" : "预览PDF"}
                    </button>
                    <button
                      onClick={handleStartEditALevel}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-600 text-white shadow-sm hover:bg-primary-700 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />{" "}
                      {isEn ? "Edit Grades" : "编辑成绩"}
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    {unsavedChanges ? (
                      <div className="hidden sm:flex items-center gap-1 mr-1 px-2 py-1 bg-orange-50 border border-orange-100 rounded-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></div>
                        <span className="text-xs text-orange-600 font-medium whitespace-nowrap">
                          {isEn ? "Unsaved" : "未保存"}
                        </span>
                      </div>
                    ) : lastSavedTime ? (
                      <div className="hidden sm:flex items-center gap-1 mr-1 px-2 py-1 bg-green-50 border border-green-100 rounded-md">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600 font-medium whitespace-nowrap">
                          {isEn ? "Saved" : "已保存"}
                        </span>
                      </div>
                    ) : null}
                    <button
                      onClick={handleCancelALevel}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      {isEn ? "Cancel" : "取消"}
                    </button>
                    <button
                      onClick={handleSaveALevel}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600 text-white shadow-sm hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />{" "}
                      {isEn ? "Save" : "保存成绩"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Transcript Body */}
            <div className="p-5 bg-gray-50/50 space-y-8 flex-1 overflow-y-auto min-h-0">
              {/* Official Results Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-gray-800 text-base">
                    {isEn ? "Official Results" : "官方成绩"}
                  </h4>
                  {isEditingALevel && (
                    <div className="flex items-center gap-1">
                      {["A Level", "AP", "IB"].map((sys) => (
                        <button
                          key={sys}
                          onClick={() => handleAddOfficialBatch(sys)}
                          className="text-sm text-primary-600 font-bold hover:bg-primary-50 px-2 py-1.5 rounded transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> {sys}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {(isEditingALevel ? tempOfficial : officialBatches).map(
                    (batch) => (
                      <div
                        key={batch.id}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                      >
                        <div
                          className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleToggleOfficialBatch(batch.id)}
                        >
                          <div className="flex items-center gap-3">
                            {batch.isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                            {isEditingALevel ? (
                              <div
                                className="flex gap-2 flex-wrap items-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="font-bold text-primary-600 text-sm whitespace-nowrap">
                                  {batch.curriculum}
                                </span>
                                {batch.curriculum === "A Level" && (
                                  <select
                                    className="border border-gray-300 rounded px-2 py-1 text-sm font-medium"
                                    value={batch.level}
                                    onChange={(e) =>
                                      handleUpdateOfficialBatch(
                                        batch.id,
                                        "level",
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="" disabled hidden>
                                      [选择 Level ▼]
                                    </option>
                                    <option value="AS">AS</option>
                                    <option value="A Level">A Level</option>
                                  </select>
                                )}
                                {batch.curriculum === "AP" && (
                                  <select
                                    className="border border-gray-300 rounded px-2 py-1 text-sm font-medium"
                                    value={batch.level}
                                    onChange={(e) =>
                                      handleUpdateOfficialBatch(
                                        batch.id,
                                        "level",
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="" disabled hidden>
                                      [选择 Level ▼]
                                    </option>
                                    <option value="G9">Grade 9</option>
                                    <option value="G10">Grade 10</option>
                                    <option value="G11">Grade 11</option>
                                    <option value="G12">Grade 12</option>
                                  </select>
                                )}
                                {batch.curriculum === "IB" && (
                                  <select
                                    className="border border-gray-300 rounded px-2 py-1 text-sm font-medium"
                                    value={batch.level}
                                    onChange={(e) =>
                                      handleUpdateOfficialBatch(
                                        batch.id,
                                        "level",
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="" disabled hidden>
                                      [选择 Level ▼]
                                    </option>
                                    <option value="MYP">MYP</option>
                                    <option value="DP1">DP1</option>
                                    <option value="DP2">DP2</option>
                                  </select>
                                )}

                                <input
                                  type="month"
                                  className="w-32 border border-gray-300 rounded px-2 py-1 text-sm font-medium"
                                  placeholder="时间"
                                  value={batch.time}
                                  onChange={(e) =>
                                    handleUpdateOfficialBatch(
                                      batch.id,
                                      "time",
                                      e.target.value,
                                    )
                                  }
                                />

                                {batch.curriculum === "A Level" &&
                                  (() => {
                                    let standardBoards: string[] = [
                                      "Cambridge",
                                      "Edexcel",
                                      "AQA",
                                      "OCR",
                                    ];

                                    const isOtherBoard =
                                      batch.board === "Other" ||
                                      (batch.board !== "" &&
                                        !standardBoards.includes(batch.board));
                                    return (
                                      <div className="flex gap-1 inline-flex items-center">
                                        <select
                                          className="w-36 border border-gray-300 rounded px-2 py-1 text-sm font-medium"
                                          value={
                                            isOtherBoard ? "Other" : batch.board
                                          }
                                          onChange={(e) =>
                                            handleUpdateOfficialBatch(
                                              batch.id,
                                              "board",
                                              e.target.value,
                                            )
                                          }
                                        >
                                          <option value="" disabled hidden>
                                            [选择考试局 ▼]
                                          </option>
                                          {standardBoards.map((b) => (
                                            <option key={b} value={b}>
                                              {b}
                                            </option>
                                          ))}
                                          <option value="Other">Other</option>
                                        </select>
                                        {isOtherBoard && (
                                          <input
                                            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm font-medium"
                                            placeholder="自定义局"
                                            value={
                                              batch.board === "Other"
                                                ? ""
                                                : batch.board
                                            }
                                            onChange={(e) =>
                                              handleUpdateOfficialBatch(
                                                batch.id,
                                                "board",
                                                e.target.value || "Other",
                                              )
                                            }
                                          />
                                        )}
                                      </div>
                                    );
                                  })()}
                              </div>
                            ) : (
                              <span className="font-bold text-gray-800 text-sm">
                                {[
                                  batch.curriculum,
                                  batch.level,
                                  batch.time,
                                  batch.board,
                                ]
                                  .filter(Boolean)
                                  .join(" | ")}
                              </span>
                            )}
                          </div>
                          {isEditingALevel && (
                            <button
                              type="button"
                              onClick={(e) =>
                                requestDeleteOfficialBatch(e, batch.id)
                              }
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title={isEn ? "Delete Batch" : "删除批次"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {batch.isExpanded && (
                          <div>
                            <table className="w-full text-sm text-left">
                              <thead className="text-xs text-gray-500 bg-gray-50/50 uppercase font-medium">
                                <tr>
                                  <th className="px-4 py-2 w-1/3">
                                    {isEn ? "Subject" : "科目"}
                                  </th>
                                  <th className="px-4 py-2 w-1/3 text-center">
                                    {batch.curriculum === "IB"
                                      ? isEn
                                        ? "Level (HL/SL)"
                                        : "级别(HL/SL)"
                                      : batch.curriculum === "AP"
                                        ? isEn
                                          ? "Score (1-5)"
                                          : "分数"
                                        : isEn
                                          ? "Grade"
                                          : "等第"}
                                  </th>
                                  {batch.curriculum !== "AP" && (
                                    <th className="px-4 py-2 w-1/3 text-center">
                                      {batch.curriculum === "IB"
                                        ? isEn
                                          ? "Score (1-7)"
                                          : "分数 (1-7)"
                                        : isEn
                                          ? "Score"
                                          : "分数"}
                                    </th>
                                  )}
                                  {isEditingALevel && (
                                    <th className="px-4 py-2 w-10 text-center">
                                      {isEn ? "Action" : "操作"}
                                    </th>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {batch.courses.map((course) => (
                                  <tr
                                    key={course.id}
                                    className="hover:bg-gray-50/50 transition-colors"
                                  >
                                    <td className="px-4 py-2">
                                      {isEditingALevel ? (
                                        <input
                                          className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm focus:bg-white focus:border-primary-400 outline-none"
                                          value={course.subject}
                                          onChange={(e) =>
                                            handleUpdateOfficialCourse(
                                              batch.id,
                                              course.id,
                                              "subject",
                                              e.target.value,
                                            )
                                          }
                                          placeholder="Subject"
                                        />
                                      ) : (
                                        <span className="text-gray-800 font-medium">
                                          {course.subject}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                      {isEditingALevel ? (
                                        batch.curriculum === "IB" ? (
                                          <select
                                            className="w-full max-w-[80px] mx-auto text-center bg-gray-50 border border-gray-200 rounded px-1 py-1 text-sm focus:bg-white outline-none"
                                            value={course.courseLevel || ""}
                                            onChange={(e) =>
                                              handleUpdateOfficialCourse(
                                                batch.id,
                                                course.id,
                                                "courseLevel",
                                                e.target.value,
                                              )
                                            }
                                          >
                                            <option value="">-</option>
                                            <option value="HL">HL</option>
                                            <option value="SL">SL</option>
                                          </select>
                                        ) : (
                                          <select
                                            className="w-full max-w-[80px] mx-auto text-center bg-gray-50 border border-gray-200 rounded px-1 py-1 text-sm focus:bg-white outline-none"
                                            value={course.grade}
                                            onChange={(e) =>
                                              handleUpdateOfficialCourse(
                                                batch.id,
                                                course.id,
                                                "grade",
                                                e.target.value,
                                              )
                                            }
                                          >
                                            <option value="">-</option>
                                            {batch.curriculum === "AP" ? (
                                              <>
                                                <option value="5">5</option>
                                                <option value="4">4</option>
                                                <option value="3">3</option>
                                                <option value="2">2</option>
                                                <option value="1">1</option>
                                              </>
                                            ) : batch.level === "AS" ? (
                                              <>
                                                <option value="a">a</option>
                                                <option value="b">b</option>
                                                <option value="c">c</option>
                                                <option value="d">d</option>
                                                <option value="e">e</option>
                                                <option value="u">u</option>
                                              </>
                                            ) : (
                                              <>
                                                <option value="A*">A*</option>
                                                <option value="A">A</option>
                                                <option value="B">B</option>
                                                <option value="C">C</option>
                                                <option value="D">D</option>
                                                <option value="E">E</option>
                                                <option value="U">U</option>
                                              </>
                                            )}
                                          </select>
                                        )
                                      ) : (
                                        <span
                                          className={`font-bold ${batch.curriculum === "IB" ? (course.courseLevel === "HL" ? "text-blue-600" : "text-gray-800") : ["A*", "A", "a", "5"].includes(course.grade) ? "text-green-600" : ["B", "b", "4"].includes(course.grade) ? "text-primary-600" : "text-orange-500"}`}
                                        >
                                          {batch.curriculum === "IB"
                                            ? course.courseLevel || "-"
                                            : course.grade}
                                        </span>
                                      )}
                                    </td>
                                    {batch.curriculum !== "AP" && (
                                      <td className="px-4 py-2 text-center">
                                        {isEditingALevel ? (
                                          batch.curriculum === "IB" ? (
                                            <select
                                              className="w-full max-w-[80px] mx-auto text-center bg-gray-50 border border-gray-200 rounded px-1 py-1 text-sm focus:bg-white outline-none"
                                              value={course.grade}
                                              onChange={(e) =>
                                                handleUpdateOfficialCourse(
                                                  batch.id,
                                                  course.id,
                                                  "grade",
                                                  e.target.value,
                                                )
                                              }
                                            >
                                              <option value="">-</option>
                                              <option value="7">7</option>
                                              <option value="6">6</option>
                                              <option value="5">5</option>
                                              <option value="4">4</option>
                                              <option value="3">3</option>
                                              <option value="2">2</option>
                                              <option value="1">1</option>
                                            </select>
                                          ) : (
                                            <input
                                              type="number"
                                              min="0"
                                              max="100"
                                              className="w-full max-w-[80px] mx-auto text-center bg-gray-50 border border-gray-200 rounded px-1 py-1 text-sm focus:bg-white outline-none"
                                              value={course.score}
                                              onChange={(e) =>
                                                handleUpdateOfficialCourse(
                                                  batch.id,
                                                  course.id,
                                                  "score",
                                                  e.target.value,
                                                )
                                              }
                                              placeholder="0-100"
                                            />
                                          )
                                        ) : (
                                          <span
                                            className={`${batch.curriculum === "IB" ? `font-bold ${["7", "6"].includes(course.grade) ? "text-green-600" : ["5", "4"].includes(course.grade) ? "text-primary-600" : "text-orange-500"}` : "text-gray-800 font-medium"}`}
                                          >
                                            {batch.curriculum === "IB"
                                              ? course.grade
                                              : course.score || "-"}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {isEditingALevel && (
                                      <td className="px-4 py-2 text-center">
                                        <button
                                          onClick={() =>
                                            handleRemoveOfficialCourse(
                                              batch.id,
                                              course.id,
                                            )
                                          }
                                          className="text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4 mx-auto" />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {isEditingALevel && (
                              <div className="p-3 bg-gray-50/30 border-t border-gray-100 flex justify-center">
                                <button
                                  onClick={() =>
                                    handleAddOfficialCourse(batch.id)
                                  }
                                  className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
                                >
                                  <Plus className="w-4 h-4" />{" "}
                                  {isEn ? "Add Subject" : "新增一门科目"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                  {(isEditingALevel ? tempOfficial : officialBatches).length ===
                    0 && (
                    <div className="text-center p-6 text-sm text-gray-400 bg-gray-50 rounded-lg">
                      {isEn ? "No official results" : "暂无官方成绩"}
                    </div>
                  )}
                </div>
              </div>

              {/* Predicted Results Section */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-gray-800 text-base">
                    {isEn ? "Predicted Results" : "预估成绩"}
                  </h4>
                  {isEditingALevel && (
                    <div className="flex items-center gap-1">
                      {["A Level", "AP", "IB"].map((sys) => (
                        <button
                          key={sys}
                          onClick={() => handleAddPredictedBatch(sys)}
                          className="text-sm text-primary-600 font-bold hover:bg-primary-50 px-2 py-1.5 rounded transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> {sys}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {(isEditingALevel ? tempPredicted : predictedBatches).map(
                    (batch) => (
                      <div
                        key={batch.id}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                      >
                        <div
                          className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleTogglePredictedBatch(batch.id)}
                        >
                          <div className="flex items-center gap-3">
                            {batch.isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                            {isEditingALevel ? (
                              <div
                                className="flex gap-2 flex-wrap items-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="font-bold text-primary-600 text-sm whitespace-nowrap">
                                  {batch.curriculum}
                                </span>
                                {batch.curriculum === "A Level" && (
                                  <select
                                    className="border border-gray-300 rounded px-2 py-1 text-sm font-medium"
                                    value={batch.predictionLevel}
                                    onChange={(e) =>
                                      handleUpdatePredictedBatch(
                                        batch.id,
                                        "predictionLevel",
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="" disabled hidden>
                                      [选择 Level ▼]
                                    </option>
                                    <option value="A Level">A Level</option>
                                    <option value="AS Level">AS Level</option>
                                  </select>
                                )}
                                {batch.curriculum === "AP" && (
                                  <select
                                    className="border border-gray-300 rounded px-2 py-1 text-sm font-medium"
                                    value={batch.predictionLevel}
                                    onChange={(e) =>
                                      handleUpdatePredictedBatch(
                                        batch.id,
                                        "predictionLevel",
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="" disabled hidden>
                                      [选择 Level ▼]
                                    </option>
                                    <option value="G9">Grade 9</option>
                                    <option value="G10">Grade 10</option>
                                    <option value="G11">Grade 11</option>
                                    <option value="G12">Grade 12</option>
                                  </select>
                                )}
                                {batch.curriculum === "IB" && (
                                  <select
                                    className="border border-gray-300 rounded px-2 py-1 text-sm font-medium"
                                    value={batch.predictionLevel}
                                    onChange={(e) =>
                                      handleUpdatePredictedBatch(
                                        batch.id,
                                        "predictionLevel",
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="" disabled hidden>
                                      [选择 Level ▼]
                                    </option>
                                    <option value="MYP">MYP</option>
                                    <option value="DP1">DP1</option>
                                    <option value="DP2">DP2</option>
                                  </select>
                                )}
                                <input
                                  type="month"
                                  className="w-32 border border-gray-300 rounded px-2 py-1 text-sm font-medium"
                                  placeholder="预估时间"
                                  value={batch.predictedTime}
                                  onChange={(e) =>
                                    handleUpdatePredictedBatch(
                                      batch.id,
                                      "predictedTime",
                                      e.target.value,
                                    )
                                  }
                                />
                                <input
                                  className="w-24 border border-gray-300 rounded px-2 py-1 text-sm font-medium"
                                  placeholder="申请季"
                                  value={batch.applySeason}
                                  onChange={(e) =>
                                    handleUpdatePredictedBatch(
                                      batch.id,
                                      "applySeason",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            ) : (
                              <span className="font-bold text-gray-800 text-sm">
                                {[
                                  batch.curriculum,
                                  batch.predictionLevel,
                                  batch.applySeason,
                                  batch.predictedTime,
                                ]
                                  .filter(Boolean)
                                  .join(" | ")}
                              </span>
                            )}
                          </div>
                          {isEditingALevel && (
                            <button
                              type="button"
                              onClick={(e) =>
                                requestDeletePredictedBatch(e, batch.id)
                              }
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title={isEn ? "Delete Batch" : "删除批次"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {batch.isExpanded && (
                          <div>
                            <table className="w-full text-sm text-left">
                              <thead className="text-xs text-gray-500 bg-gray-50/50 uppercase font-medium">
                                <tr>
                                  <th className="px-4 py-2 w-1/3">
                                    {isEn ? "Subject" : "科目"}
                                  </th>
                                  <th className="px-4 py-2 w-1/3 text-center">
                                    {batch.curriculum === "IB"
                                      ? isEn
                                        ? "Level (HL/SL)"
                                        : "级别(HL/SL)"
                                      : batch.curriculum === "AP"
                                        ? isEn
                                          ? "Score (1-5)"
                                          : "分数"
                                        : isEn
                                          ? "Predicted Grade"
                                          : "预估等第"}
                                  </th>
                                  {batch.curriculum === "IB" && (
                                    <th className="px-4 py-2 w-1/3 text-center">
                                      {isEn ? "Score (1-7)" : "分数 (1-7)"}
                                    </th>
                                  )}
                                  {isEditingALevel && (
                                    <th className="px-4 py-2 w-10 text-center">
                                      {isEn ? "Action" : "操作"}
                                    </th>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {batch.courses.map((course) => (
                                  <tr
                                    key={course.id}
                                    className="hover:bg-gray-50/50 transition-colors"
                                  >
                                    <td className="px-4 py-2">
                                      {isEditingALevel ? (
                                        <input
                                          className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm focus:bg-white focus:border-primary-400 outline-none"
                                          value={course.subject}
                                          onChange={(e) =>
                                            handleUpdatePredictedCourse(
                                              batch.id,
                                              course.id,
                                              "subject",
                                              e.target.value,
                                            )
                                          }
                                          placeholder="Subject"
                                        />
                                      ) : (
                                        <span className="text-gray-800 font-medium">
                                          {course.subject}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                      {isEditingALevel ? (
                                        batch.curriculum === "IB" ? (
                                          <select
                                            className="w-full max-w-[80px] mx-auto text-center bg-gray-50 border border-gray-200 rounded px-1 py-1 text-sm focus:bg-white outline-none"
                                            value={course.courseLevel || ""}
                                            onChange={(e) =>
                                              handleUpdatePredictedCourse(
                                                batch.id,
                                                course.id,
                                                "courseLevel",
                                                e.target.value,
                                              )
                                            }
                                          >
                                            <option value="">-</option>
                                            <option value="HL">HL</option>
                                            <option value="SL">SL</option>
                                          </select>
                                        ) : (
                                          <select
                                            className="w-full max-w-[100px] mx-auto text-center bg-gray-50 border border-gray-200 rounded px-1 py-1 text-sm focus:bg-white outline-none"
                                            value={course.predictedGrade}
                                            onChange={(e) =>
                                              handleUpdatePredictedCourse(
                                                batch.id,
                                                course.id,
                                                "predictedGrade",
                                                e.target.value,
                                              )
                                            }
                                          >
                                            <option value="">-</option>
                                            {batch.curriculum === "AP" ? (
                                              <>
                                                <option value="5">5</option>
                                                <option value="4">4</option>
                                                <option value="3">3</option>
                                                <option value="2">2</option>
                                                <option value="1">1</option>
                                              </>
                                            ) : (
                                              <>
                                                <option value="A*">A*</option>
                                                <option value="A">A</option>
                                                <option value="B">B</option>
                                                <option value="C">C</option>
                                                <option value="D">D</option>
                                                <option value="E">E</option>
                                                <option value="U">U</option>
                                              </>
                                            )}
                                          </select>
                                        )
                                      ) : (
                                        <span
                                          className={`font-bold ${batch.curriculum === "IB" ? (course.courseLevel === "HL" ? "text-blue-600" : "text-gray-800") : ["A*", "A", "a", "5"].includes(course.predictedGrade) ? "text-green-600" : ["B", "b", "4"].includes(course.predictedGrade) ? "text-primary-600" : "text-orange-500"}`}
                                        >
                                          {batch.curriculum === "IB"
                                            ? course.courseLevel || "-"
                                            : course.predictedGrade}
                                        </span>
                                      )}
                                    </td>
                                    {batch.curriculum === "IB" && (
                                      <td className="px-4 py-2 text-center">
                                        {isEditingALevel ? (
                                          <select
                                            className="w-full max-w-[80px] mx-auto text-center bg-gray-50 border border-gray-200 rounded px-1 py-1 text-sm focus:bg-white outline-none"
                                            value={course.predictedGrade}
                                            onChange={(e) =>
                                              handleUpdatePredictedCourse(
                                                batch.id,
                                                course.id,
                                                "predictedGrade",
                                                e.target.value,
                                              )
                                            }
                                          >
                                            <option value="">-</option>
                                            <option value="7">7</option>
                                            <option value="6">6</option>
                                            <option value="5">5</option>
                                            <option value="4">4</option>
                                            <option value="3">3</option>
                                            <option value="2">2</option>
                                            <option value="1">1</option>
                                          </select>
                                        ) : (
                                          <span
                                            className={`font-bold ${["7", "6"].includes(course.predictedGrade) ? "text-green-600" : ["5", "4"].includes(course.predictedGrade) ? "text-primary-600" : "text-orange-500"}`}
                                          >
                                            {course.predictedGrade}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {isEditingALevel && (
                                      <td className="px-4 py-2 text-center">
                                        <button
                                          onClick={() =>
                                            handleRemovePredictedCourse(
                                              batch.id,
                                              course.id,
                                            )
                                          }
                                          className="text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4 mx-auto" />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {isEditingALevel && (
                              <div className="p-3 bg-gray-50/30 border-t border-gray-100 flex justify-center">
                                <button
                                  onClick={() =>
                                    handleAddPredictedCourse(batch.id)
                                  }
                                  className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
                                >
                                  <Plus className="w-4 h-4" />{" "}
                                  {isEn ? "Add Subject" : "新增一门科目"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                  {(isEditingALevel ? tempPredicted : predictedBatches)
                    .length === 0 && (
                    <div className="text-center p-6 text-sm text-gray-400 bg-gray-50 rounded-lg">
                      {isEn ? "No predicted results" : "暂无预估成绩"}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* 4. Standardized Tests & Activities (Side-by-Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
            {/* Tests */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-[#e5e0dc] transition-all hover:shadow-md flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                  <Table className="w-4 h-4 text-primary-600" />{" "}
                  {isEn ? "Standardized Tests" : "标化考试"}
                </h3>
                {isEditingTests ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelTests}
                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> {isEn ? "Cancel" : "取消"}
                    </button>
                    <button
                      onClick={handleSaveTests}
                      className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" /> {isEn ? "Save" : "保存"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleStartEditTests}
                    className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" /> {isEn ? "Edit" : "编辑"}
                  </button>
                )}
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-0">
                {(isEditingTests ? tempSubjectScores : subjectScores).map(
                  (score) => {
                    const isPending = score.status === "Pending";
                    const isRejected = score.status === "Rejected";
                    const canReview = !isEditingTests && (isPending || isRejected);

                    return (
                      <div
                        key={score.id}
                        onClick={
                          canReview
                            ? () => handleOpenReviewModal("score", score.id)
                            : undefined
                        }
                        className={`flex justify-between items-center p-2.5 rounded-lg border group transition-all ${
                          canReview
                            ? isPending
                              ? "bg-orange-50/80 border-orange-200 hover:border-orange-300 hover:shadow-xs cursor-pointer"
                              : "bg-red-50/60 border-red-200 hover:border-red-300 hover:shadow-xs cursor-pointer"
                            : isPending
                            ? "bg-orange-50 border-orange-200"
                            : isRejected
                            ? "bg-red-50/40 border-red-200"
                            : "bg-gray-50 border-gray-100"
                        }`}
                      >
                        {isEditingTests ? (
                          <div className="flex-1 flex flex-col gap-2">
                            <div className="grid grid-cols-3 gap-2">
                              <select
                                className="bg-white border border-gray-200 rounded px-1.5 py-1 text-xs outline-none focus:border-primary-400 w-full"
                                value={score.type}
                                onChange={(e) =>
                                  handleUpdateTempSubjectScore(
                                    score.id,
                                    "type",
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="TOEFL">TOEFL</option>
                                <option value="IELTS">IELTS</option>
                                <option value="SAT">SAT</option>
                                <option value="ACT">ACT</option>
                              </select>
                              <input
                                className="bg-white border border-gray-200 rounded px-1.5 py-1 text-xs outline-none focus:border-primary-400 w-full"
                                value={score.date || ""}
                                onChange={(e) =>
                                  handleUpdateTempSubjectScore(
                                    score.id,
                                    "date",
                                    e.target.value,
                                  )
                                }
                                placeholder="Date"
                              />
                              <input
                                className="bg-white border border-gray-200 rounded px-1.5 py-1 text-xs outline-none focus:border-primary-400 font-bold text-primary-700 w-full"
                                value={score.score || ""}
                                onChange={(e) =>
                                  handleUpdateTempSubjectScore(
                                    score.id,
                                    "score",
                                    e.target.value,
                                  )
                                }
                                placeholder={isEn ? "Total" : "总分"}
                              />
                            </div>
                            {/* Subscores */}
                            {(score.type === "TOEFL" || score.type === "IELTS") && (
                              <div className="grid grid-cols-4 gap-2 border-t pt-2 mt-0.5 border-gray-100">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-400 w-2.5">R</span>
                                  <input className="bg-white border border-gray-200 rounded px-1 py-1 text-xs outline-none w-full text-center" value={score.subScores?.R || ""} onChange={(e) => handleUpdateTempSubjectSubScore(score.id, "R", e.target.value)} placeholder="0" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-400 w-2.5">L</span>
                                  <input className="bg-white border border-gray-200 rounded px-1 py-1 text-xs outline-none w-full text-center" value={score.subScores?.L || ""} onChange={(e) => handleUpdateTempSubjectSubScore(score.id, "L", e.target.value)} placeholder="0" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-400 w-2.5">S</span>
                                  <input className="bg-white border border-gray-200 rounded px-1 py-1 text-xs outline-none w-full text-center" value={score.subScores?.S || ""} onChange={(e) => handleUpdateTempSubjectSubScore(score.id, "S", e.target.value)} placeholder="0" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-400 w-2.5">W</span>
                                  <input className="bg-white border border-gray-200 rounded px-1 py-1 text-xs outline-none w-full text-center" value={score.subScores?.W || ""} onChange={(e) => handleUpdateTempSubjectSubScore(score.id, "W", e.target.value)} placeholder="0" />
                                </div>
                              </div>
                            )}
                            {score.type === "SAT" && (
                              <div className="grid grid-cols-2 gap-2 border-t pt-2 mt-0.5 border-gray-100">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-400 truncate w-8">EBRW</span>
                                  <input className="bg-white border border-gray-200 rounded px-1 py-1 text-xs outline-none w-full text-center" value={score.subScores?.EBRW || ""} onChange={(e) => handleUpdateTempSubjectSubScore(score.id, "EBRW", e.target.value)} placeholder="0" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-400 w-3">M</span>
                                  <input className="bg-white border border-gray-200 rounded px-1 py-1 text-xs outline-none w-full text-center" value={score.subScores?.M || ""} onChange={(e) => handleUpdateTempSubjectSubScore(score.id, "M", e.target.value)} placeholder="0" />
                                </div>
                              </div>
                            )}
                            {score.type === "ACT" && (
                              <div className="grid grid-cols-4 gap-2 border-t pt-2 mt-0.5 border-gray-100">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-400 w-2.5">E</span>
                                  <input className="bg-white border border-gray-200 rounded px-1 py-1 text-xs outline-none w-full text-center" value={score.subScores?.E || ""} onChange={(e) => handleUpdateTempSubjectSubScore(score.id, "E", e.target.value)} placeholder="0" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-400 w-2.5">M</span>
                                  <input className="bg-white border border-gray-200 rounded px-1 py-1 text-xs outline-none w-full text-center" value={score.subScores?.M || ""} onChange={(e) => handleUpdateTempSubjectSubScore(score.id, "M", e.target.value)} placeholder="0" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-400 w-2.5">R</span>
                                  <input className="bg-white border border-gray-200 rounded px-1 py-1 text-xs outline-none w-full text-center" value={score.subScores?.R || ""} onChange={(e) => handleUpdateTempSubjectSubScore(score.id, "R", e.target.value)} placeholder="0" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-400 w-2.5">S</span>
                                  <input className="bg-white border border-gray-200 rounded px-1 py-1 text-xs outline-none w-full text-center" value={score.subScores?.SCI || ""} onChange={(e) => handleUpdateTempSubjectSubScore(score.id, "SCI", e.target.value)} placeholder="0" />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-800 truncate">
                                  {score.type}
                                </span>
                                {score.status === "Pending" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenReviewModal("score", score.id);
                                    }}
                                    className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded border border-orange-200 font-bold hover:bg-orange-200 transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    Review Request
                                  </button>
                                )}
                                {score.status === "Rejected" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenReviewModal("score", score.id);
                                    }}
                                    className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 font-bold hover:bg-red-200 transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <XCircle className="w-3 h-3 text-red-600" />
                                    {isEn ? "Rejected" : "已驳回"}
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 mt-[1px]">Total:</span>
                                <span className="text-sm font-bold text-primary-700">
                                  {score.score}
                                </span>
                                {score.status === "Verified" && (
                                  <span title="Verified" className="flex">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
                              <p>{score.date}</p>
                            </div>
                            
                            {score.subScores && (
                              <div className="flex flex-wrap gap-1.5 text-[10px] mt-1.5 pt-1.5 border-t border-gray-100/60">
                                 {(score.type === "TOEFL" || score.type === "IELTS") && (
                                   <>
                                     {score.subScores.R && <span className="bg-primary-50/50 text-gray-600 px-1.5 py-0.5 rounded">R: <strong className="text-gray-800">{score.subScores.R}</strong></span>}
                                     {score.subScores.L && <span className="bg-primary-50/50 text-gray-600 px-1.5 py-0.5 rounded">L: <strong className="text-gray-800">{score.subScores.L}</strong></span>}
                                     {score.subScores.S && <span className="bg-primary-50/50 text-gray-600 px-1.5 py-0.5 rounded">S: <strong className="text-gray-800">{score.subScores.S}</strong></span>}
                                     {score.subScores.W && <span className="bg-primary-50/50 text-gray-600 px-1.5 py-0.5 rounded">W: <strong className="text-gray-800">{score.subScores.W}</strong></span>}
                                   </>
                                 )}
                                 {score.type === "SAT" && (
                                   <>
                                     {score.subScores.EBRW && <span className="bg-primary-50/50 text-gray-600 px-1.5 py-0.5 rounded">EBRW: <strong className="text-gray-800">{score.subScores.EBRW}</strong></span>}
                                     {score.subScores.M && <span className="bg-primary-50/50 text-gray-600 px-1.5 py-0.5 rounded">M: <strong className="text-gray-800">{score.subScores.M}</strong></span>}
                                   </>
                                 )}
                                 {score.type === "ACT" && (
                                   <>
                                     {score.subScores.E && <span className="bg-primary-50/50 text-gray-600 px-1.5 py-0.5 rounded">E: <strong className="text-gray-800">{score.subScores.E}</strong></span>}
                                     {score.subScores.M && <span className="bg-primary-50/50 text-gray-600 px-1.5 py-0.5 rounded">M: <strong className="text-gray-800">{score.subScores.M}</strong></span>}
                                     {score.subScores.R && <span className="bg-primary-50/50 text-gray-600 px-1.5 py-0.5 rounded">R: <strong className="text-gray-800">{score.subScores.R}</strong></span>}
                                     {score.subScores.SCI && <span className="bg-primary-50/50 text-gray-600 px-1.5 py-0.5 rounded">SCI: <strong className="text-gray-800">{score.subScores.SCI}</strong></span>}
                                   </>
                                 )}
                              </div>
                            )}

                            {score.status === "Rejected" && (
                              <div className="mt-2 p-2 bg-red-100/70 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-md text-[11px] text-red-800 dark:text-red-300">
                                <div className="flex items-start gap-1.5 mb-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                                  <div className="leading-snug flex-1">
                                    <span className="font-semibold text-red-900 dark:text-red-200">{isEn ? "Rejection Note: " : "驳回备注："}</span>
                                    <span>{score.rejectReason || (isEn ? "Information does not meet verification requirements." : "材料或信息有误，已驳回。")}</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-1 border-t border-red-200/60 dark:border-red-800/40">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenReviewModal("score", score.id, "reject");
                                    }}
                                    className="text-[10px] font-bold text-red-700 dark:text-red-300 hover:text-red-900 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit className="w-2.5 h-2.5" /> {isEn ? "Edit Note" : "修改备注"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenReviewModal("score", score.id, "view");
                                    }}
                                    className="text-[10px] font-bold text-primary-700 dark:text-primary-400 hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <CheckCircle className="w-2.5 h-2.5" /> {isEn ? "Re-verify" : "重新核验"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {isEditingTests && (
                          <button
                            onClick={() => handleRemoveTempSubjectScore(score.id)}
                            className="ml-2 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  },
                )}
                {isEditingTests && (
                  <button
                    onClick={handleAddTempSubjectScore}
                    className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />{" "}
                    {isEn ? "Add Score" : "添加考试"}
                  </button>
                )}
              </div>
            </div>

            {/* Activities */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-[#e5e0dc] transition-all hover:shadow-md flex flex-col relative overflow-hidden min-h-0">
              <div className="flex justify-between items-center mb-4 relative z-10 flex-shrink-0">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                  <Medal className="w-4 h-4 text-primary-600" />{" "}
                  {isEn ? "Activities" : "活动列表"}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddActivityModal}
                    className="text-xs text-white bg-[#A37B5C] hover:bg-[#8E694C] px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                    title={isEn ? "Add New Activity" : "添加新活动"}
                  >
                    <Plus className="w-3 h-3" />
                    {isEn ? "Add Activity" : "添加活动"}
                  </button>
                  {isEditingActivities ? (
                    <>
                      <button
                        onClick={handleCancelActivities}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> {isEn ? "Cancel" : "取消"}
                      </button>
                      <button
                        onClick={handleSaveActivities}
                        className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" /> {isEn ? "Save" : "保存"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleStartEditActivities}
                        className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> {isEn ? "Edit" : "编辑"}
                      </button>
                      <button
                        onClick={handleOrganizeActivities}
                        className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                      >
                        {isOrganizing ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        {isOrganizing
                          ? isEn
                            ? "Organizing..."
                            : "整理中..."
                          : isEn
                            ? "AI Organize"
                            : "AI 整理"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-1 relative z-10 min-h-0">
                {(isEditingActivities ? tempActivities : activities).map(
                  (act) => {
                    const isPending = act.status === "Pending";
                    const isRejected = act.status === "Rejected";
                    const canReview = !isEditingActivities && (isPending || isRejected);

                    return (
                      <div
                        key={act.id}
                        onClick={
                          canReview
                            ? () => handleOpenReviewModal("activity", act.id)
                            : undefined
                        }
                        className={`p-3 border rounded-lg transition-all group ${
                          canReview
                            ? isPending
                              ? "bg-orange-50/80 border-orange-200 hover:border-orange-300 hover:shadow-xs cursor-pointer"
                              : "bg-red-50/60 border-red-200 hover:border-red-300 hover:shadow-xs cursor-pointer"
                            : isPending
                            ? "bg-orange-50 border-orange-200 cursor-default"
                            : isRejected
                            ? "bg-red-50/40 border-red-200 cursor-default"
                            : "bg-gray-50 border-gray-100 hover:border-primary-200 cursor-default"
                        }`}
                      >
                        {isEditingActivities ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                className="w-1/3 bg-white border border-gray-200 rounded px-2 py-1 text-[10px] text-gray-500 outline-none focus:border-primary-400"
                                value={act.date}
                                onChange={(e) =>
                                  handleUpdateTempActivity(
                                    act.id,
                                    "date",
                                    e.target.value,
                                  )
                                }
                                placeholder={isEn ? "Time" : "时间"}
                              />
                              <input
                                className="flex-1 bg-white border border-gray-200 rounded px-2 py-1 text-xs font-bold text-gray-800 outline-none focus:border-primary-400"
                                value={act.title}
                                onChange={(e) =>
                                  handleUpdateTempActivity(
                                    act.id,
                                    "title",
                                    e.target.value,
                                  )
                                }
                                placeholder={isEn ? "Project Name" : "项目名"}
                              />
                              <button
                                onClick={() => handleRemoveTempActivity(act.id)}
                                className="text-gray-300 hover:text-red-500 flex-shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div>
                              <input
                                className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-[10px] text-gray-600 outline-none focus:border-primary-400"
                                value={act.role}
                                onChange={(e) =>
                                  handleUpdateTempActivity(
                                    act.id,
                                    "role",
                                    e.target.value,
                                  )
                                }
                                placeholder={isEn ? "Role" : "职责"}
                              />
                            </div>
                            <div>
                              <textarea
                                className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-[10px] text-gray-600 outline-none focus:border-primary-400 min-h-[60px] resize-y"
                                value={act.achievement}
                                onChange={(e) =>
                                  handleUpdateTempActivity(
                                    act.id,
                                    "achievement",
                                    e.target.value,
                                  )
                                }
                                placeholder={isEn ? "Achievement (What did the student do?)" : "成就 (具体做了什么？)"}
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] text-gray-500 flex-shrink-0">
                                {act.date}
                              </span>
                              <div className="flex items-center gap-2">
                                {act.status === "Pending" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenReviewModal("activity", act.id);
                                    }}
                                    className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded border border-orange-200 font-bold hover:bg-orange-200 transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    Review Request
                                  </button>
                                )}
                                {act.status === "Rejected" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenReviewModal("activity", act.id);
                                    }}
                                    className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 font-bold hover:bg-red-200 transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <XCircle className="w-3 h-3 text-red-600" />
                                    {isEn ? "Rejected" : "已驳回"}
                                  </button>
                                )}
                                {act.status === "Verified" && (
                                  <span title="Verified" className="flex">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                  </span>
                                )}
                              </div>
                            </div>
                            <h4 className="text-[13px] font-bold text-gray-800 mb-0.5 break-words whitespace-normal">
                              {act.title}
                            </h4>
                            <p className="text-[11px] font-semibold text-gray-700 mb-1.5 break-words whitespace-normal">
                              {act.role}
                            </p>
                            <p className="text-[10px] text-gray-600 whitespace-pre-line leading-relaxed break-words">
                              {act.achievement}
                            </p>
                            {act.status === "Pending" && (
                              <div className="mt-2 text-[9px] text-orange-600 flex items-center gap-1">
                                <Upload className="w-2.5 h-2.5" /> Proof Attached
                              </div>
                            )}
                            {act.status === "Rejected" && (
                              <div className="mt-2 p-2 bg-red-100/70 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-md text-[11px] text-red-800 dark:text-red-300">
                                <div className="flex items-start gap-1.5 mb-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                                  <div className="leading-snug flex-1">
                                    <span className="font-semibold text-red-900 dark:text-red-200">{isEn ? "Rejection Note: " : "驳回备注："}</span>
                                    <span>{act.rejectReason || (isEn ? "Information does not meet verification requirements." : "材料或信息有误，已驳回。")}</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-1 border-t border-red-200/60 dark:border-red-800/40">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenReviewModal("activity", act.id, "reject");
                                    }}
                                    className="text-[10px] font-bold text-red-700 dark:text-red-300 hover:text-red-900 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit className="w-2.5 h-2.5" /> {isEn ? "Edit Note" : "修改备注"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenReviewModal("activity", act.id, "view");
                                    }}
                                    className="text-[10px] font-bold text-primary-700 dark:text-primary-400 hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <CheckCircle className="w-2.5 h-2.5" /> {isEn ? "Re-verify" : "重新核验"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  },
                )}
                {isEditingActivities && (
                  <button
                    onClick={handleOpenAddActivityModal}
                    className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400 hover:text-[#A37B5C] hover:border-[#A37B5C] hover:bg-[#FAF6F2] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />{" "}
                    {isEn ? "Add Activity" : "添加活动"}
                  </button>
                )}
              </div>

              {/* Decorative Blob */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-2xl z-0 pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>

      {/* --- ADD NEW ACTIVITY MODAL (添加新活动弹窗) --- */}
      {isAddActivityModalOpen && (
        <div 
          id="add-activity-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseAddActivityModal();
          }}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-gray-100 dark:border-white/10 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#f5ede6] dark:bg-amber-950/40 text-[#a37b5c] dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Medal className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {isEn ? "Add New Activity" : "添加新活动"}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseAddActivityModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitNewActivity} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                {/* 1. 活动名称 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                    {isEn ? "Activity Name" : "活动名称"}
                  </label>
                  <input
                    type="text"
                    value={activityForm.title}
                    onChange={(e) =>
                      setActivityForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder={isEn ? "Enter activity name" : "请输入活动名称"}
                    className="w-full bg-[#f9f9f9] dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:bg-white focus:border-[#a37b5c] focus:ring-2 focus:ring-[#a37b5c]/15 outline-none transition-all"
                    autoFocus
                  />
                </div>

                {/* 2. 年级 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                    {isEn ? "Grade" : "年级"}
                  </label>
                  <div className="relative">
                    <select
                      value={activityForm.grade}
                      onChange={(e) =>
                        setActivityForm((prev) => ({ ...prev, grade: e.target.value }))
                      }
                      className="w-full appearance-none bg-[#f9f9f9] dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 pr-8 text-xs text-gray-900 dark:text-white focus:bg-white focus:border-[#a37b5c] focus:ring-2 focus:ring-[#a37b5c]/15 outline-none transition-all cursor-pointer"
                    >
                      <option value="">
                        {isEn ? "Click to select grade" : "点击下拉选择年级"}
                      </option>
                      <option value="9年级">9年级 (Grade 9)</option>
                      <option value="10年级">10年级 (Grade 10)</option>
                      <option value="11年级">11年级 (Grade 11)</option>
                      <option value="12年级">12年级 (Grade 12)</option>
                      <option value="高一">高一</option>
                      <option value="高二">高二</option>
                      <option value="高三">高三</option>
                      <option value="其他">{isEn ? "Other" : "其他"}</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 3. 角色 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                    {isEn ? "Role" : "角色"}
                  </label>
                  <input
                    type="text"
                    value={activityForm.role}
                    onChange={(e) =>
                      setActivityForm((prev) => ({ ...prev, role: e.target.value }))
                    }
                    placeholder="e.g. Founder"
                    className="w-full bg-[#f9f9f9] dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:bg-white focus:border-[#a37b5c] focus:ring-2 focus:ring-[#a37b5c]/15 outline-none transition-all"
                  />
                </div>

                {/* 4. 时长 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                    {isEn ? "Duration" : "时长"}
                  </label>
                  <input
                    type="text"
                    value={activityForm.duration}
                    onChange={(e) =>
                      setActivityForm((prev) => ({ ...prev, duration: e.target.value }))
                    }
                    placeholder="e.g. 2h/week"
                    className="w-full bg-[#f9f9f9] dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:bg-white focus:border-[#a37b5c] focus:ring-2 focus:ring-[#a37b5c]/15 outline-none transition-all"
                  />
                </div>
              </div>

              {/* 5. 证明材料 (选填) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                  {isEn ? "Proof Materials (Optional)" : "证明材料 (选填)"}
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleActivityFileUpload}
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const files = Array.from(e.dataTransfer.files).map((f: File) => ({
                        name: f.name,
                        size: (f.size / (1024 * 1024)).toFixed(1) + "MB",
                        type: f.name.toLowerCase().endsWith(".pdf") ? "pdf" : "image",
                      }));
                      setActivityForm((prev) => ({
                        ...prev,
                        proofFiles: [...prev.proofFiles, ...files],
                      }));
                    }
                  }}
                  className="border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-[#a37b5c] dark:hover:border-primary-500 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#fafafa]/80 dark:bg-zinc-800/40 hover:bg-[#f8f5f2] dark:hover:bg-zinc-800/80 group"
                >
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#a37b5c] transition-colors mb-2" />
                  <p className="text-xs font-medium text-gray-600 dark:text-zinc-300">
                    {isEn ? "Click to upload certificate or photo (optional)" : "点击上传证书或照片 (选填)"}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                    {isEn ? "Supports multiple file uploads" : "支持多文件上传"}
                  </p>
                </div>

                {/* Selected Proof Files Preview */}
                {activityForm.proofFiles.length > 0 && (
                  <div className="mt-2.5 space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {activityForm.proofFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 rounded-lg text-xs border border-gray-200 dark:border-white/10"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <FileText className="w-3.5 h-3.5 text-[#a37b5c] flex-shrink-0" />
                          <span className="text-gray-700 dark:text-zinc-300 truncate font-medium">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            ({file.size})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveActivityProofFile(idx);
                          }}
                          className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCloseAddActivityModal}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {isEn ? "Cancel" : "取消"}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-semibold text-white bg-[#A37B5C] hover:bg-[#8E694C] shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  {isEn ? "Submit" : "提交"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentBasicInfo;
