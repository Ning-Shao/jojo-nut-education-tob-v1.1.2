export type StudentReviewEventType = 'student.submitted' | 'student.rejected';

export interface StudentReviewEvent {
  id: string;
  type: StudentReviewEventType;
  entityType: 'essay' | 'profile-change' | 'material' | 'activity' | 'task';
  entityId: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  subject: string;
  taskCategory?: '建档' | '规划' | '考试' | '活动' | '材料' | '面试' | '申请' | 'Offer' | '复盘' | '其他';
  description?: string;
  createdBy: string;
  createdAt: string;
  deadlineAt?: string | null;
  slaHours?: number | null;
  locale?: 'zh-CN' | 'en-US';
}

export const STUDENT_REVIEW_EVENT_STORAGE_KEY = 'nut_student_review_events_v1';
export const STUDENT_REVIEW_EVENT_CHANGE = 'nut-student-review-event-change';

export const getStoredStudentReviewEvents = (): StudentReviewEvent[] => {
  try {
    const raw = localStorage.getItem(STUDENT_REVIEW_EVENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) as StudentReviewEvent[] : [];
  } catch {
    return [];
  }
};

const isValidStudentReviewEvent = (event: StudentReviewEvent) =>
  Boolean(
    event.id &&
    event.entityId &&
    event.studentId &&
    event.studentName &&
    event.subject &&
    event.createdBy &&
    event.createdAt &&
    (event.type === 'student.submitted' || event.type === 'student.rejected'),
  );

// 唯一可信写入口：无明确学生动作、无事件身份或字段不完整时拒绝写入。
export const publishStudentReviewEvent = (event: StudentReviewEvent): boolean => {
  if (!isValidStudentReviewEvent(event)) return false;
  const events = getStoredStudentReviewEvents();
  if (events.some(existing => existing.id === event.id)) return false;
  localStorage.setItem(STUDENT_REVIEW_EVENT_STORAGE_KEY, JSON.stringify([...events, event]));
  window.dispatchEvent(new CustomEvent<StudentReviewEvent>(STUDENT_REVIEW_EVENT_CHANGE, { detail: event }));
  return true;
};

export const subscribeStudentReviewEvents = (listener: () => void) => {
  const handleChange = () => listener();
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STUDENT_REVIEW_EVENT_STORAGE_KEY) listener();
  };
  window.addEventListener(STUDENT_REVIEW_EVENT_CHANGE, handleChange);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(STUDENT_REVIEW_EVENT_CHANGE, handleChange);
    window.removeEventListener('storage', handleStorage);
  };
};
