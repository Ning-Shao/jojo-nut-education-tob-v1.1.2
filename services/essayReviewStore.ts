export type EssayReviewStatus = 'Not Started' | 'Drafting' | 'Reviewing' | 'Returned' | 'Finalized';
export type EssayDocumentMode = 'Viewing' | 'Suggesting' | 'Editing';
export type EssayCommentCategory = 'Content' | 'Structure' | 'Language' | 'Fact Check' | 'Grammar';

export interface SharedEssayCommentReply {
  id: string;
  message: string;
  author: string;
  createdAt: string;
}

export interface SharedEssayComment {
  id: string;
  quote: string;
  comment: string;
  start: number;
  end: number;
  author: string;
  createdAt: string;
  category?: EssayCommentCategory;
  isResolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  replies?: SharedEssayCommentReply[];
  isPublished?: boolean;
}

export interface SharedEssaySuggestion {
  id: string;
  type: 'replace' | 'delete';
  originalText: string;
  suggestedText: string;
  start: number;
  end: number;
  explanation?: string;
  author: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  decidedBy?: string;
  decidedAt?: string;
  isPublished?: boolean;
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
  publishedOverallFeedback?: string;
  publishedTeacherModifiedContent?: string;
  comments: SharedEssayComment[];
  suggestions: SharedEssaySuggestion[];
  versions: SharedEssayVersion[];
  reviewAuthor?: string;
  reviewedAt?: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
  revisionNumber: number;
  documentMode?: EssayDocumentMode;
  reviewDimensions?: Record<string, string>;
  studentRevisionNote?: string;
  auditLog?: Array<{ id: string; action: string; actor: string; createdAt: string; detail?: string }>;
  reviewPublishedAt?: string;
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
    documentMode: String(review.documentMode) === 'Reviewing' ? 'Suggesting' : (review.documentMode || (review.status === 'Finalized' ? 'Viewing' : 'Suggesting')),
    comments: (review.comments || []).map(comment => ({
      ...comment,
      category: comment.category || 'Content',
      isResolved: Boolean(comment.isResolved),
      replies: comment.replies || []
    })),
    suggestions: review.suggestions || [],
    reviewDimensions: review.reviewDimensions || {},
    auditLog: review.auditLog || [],
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
    suggestions: [],
    versions,
    lastModifiedBy: 'Student',
    lastModifiedAt: now,
    revisionNumber: 1,
    documentMode: status === 'Finalized' ? 'Viewing' : 'Suggesting',
    reviewDimensions: {},
    auditLog: []
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
