export type EssayReviewStatus = 'Not Started' | 'Drafting' | 'Reviewing' | 'Returned' | 'Finalized';

export interface SharedEssayComment {
  id: string;
  quote: string;
  comment: string;
  start: number;
  end: number;
  author: string;
  createdAt: string;
}

export interface SharedEssayVersion {
  id: string;
  versionNumber: string;
  content: string;
  author: 'Student' | 'Teacher' | 'AI';
  source: string;
  note?: string;
  updatedAt: string;
  timestamp: number;
}

export interface SharedEssayReview {
  essayId: string;
  status: EssayReviewStatus;
  studentOriginalContent: string;
  currentContent: string;
  teacherModifiedContent?: string;
  overallFeedback?: string;
  comments: SharedEssayComment[];
  versions: SharedEssayVersion[];
  reviewAuthor?: string;
  reviewedAt?: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
  revisionNumber: number;
}

const STORAGE_KEY = 'nut_education_shared_essay_reviews_v1';
const CHANGE_EVENT = 'nut-essay-review-change';

const readAll = (): Record<string, SharedEssayReview> => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const getEssayReview = (essayId: string): SharedEssayReview | null => {
  const review = readAll()[essayId];
  if (!review) return null;
  const latestTeacherVersion = review.versions.find(version => version.author === 'Teacher');
  const latestComment = review.comments[review.comments.length - 1];
  return {
    ...review,
    reviewAuthor: review.reviewAuthor || (review.overallFeedback || latestComment ? latestComment?.author || 'Ms. Sarah' : undefined),
    reviewedAt: review.reviewedAt || latestTeacherVersion?.updatedAt || latestComment?.createdAt
  };
};

export const saveEssayReview = (review: SharedEssayReview): boolean => {
  try {
    const all = readAll();
    all[review.essayId] = review;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { essayId: review.essayId } }));
    return true;
  } catch {
    return false;
  }
};

export const ensureEssayReview = (
  essayId: string,
  content: string,
  status: EssayReviewStatus,
  versions: SharedEssayVersion[] = []
): SharedEssayReview => {
  const existing = getEssayReview(essayId);
  if (existing) return existing;
  const now = new Date().toLocaleString();
  const review: SharedEssayReview = {
    essayId,
    status,
    studentOriginalContent: content,
    currentContent: content,
    comments: [],
    versions,
    lastModifiedBy: 'Student',
    lastModifiedAt: now,
    revisionNumber: 1
  };
  saveEssayReview(review);
  return review;
};

export const updateEssayReview = (
  essayId: string,
  updater: (review: SharedEssayReview) => SharedEssayReview
): SharedEssayReview | null => {
  const current = getEssayReview(essayId);
  if (!current) return null;
  const next = updater(current);
  return saveEssayReview(next) ? next : null;
};

export const subscribeEssayReviews = (listener: (essayId?: string) => void) => {
  const handleCustom = (event: Event) => listener((event as CustomEvent<{ essayId?: string }>).detail?.essayId);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener(CHANGE_EVENT, handleCustom);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
};
