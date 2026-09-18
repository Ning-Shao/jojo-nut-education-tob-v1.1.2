export type EssayReviewStatus = 'Not Started' | 'Drafting' | 'Reviewing' | 'Returned' | 'Finalized';
export type EssayDocumentMode = 'Viewing' | 'Suggesting' | 'Editing';
export type EssayCommentCategory = 'Content' | 'Structure' | 'Language' | 'Fact Check' | 'Grammar';

export interface SharedEssayTextStyle {
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  darkText?: boolean;
  color?: string;
  highlightColor?: string | null;
  strikethrough?: boolean;
  paragraphStyle?: string;
}

export interface SharedEssayFormatRange {
  id: string;
  start: number;
  end: number;
  style: SharedEssayTextStyle;
}

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
  type: 'insert' | 'replace' | 'delete';
  originalText: string;
  suggestedText: string;
  start: number;
  end: number;
  explanation?: string;
  author: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  suggestionColor?: string;
  decidedBy?: string;
  decidedAt?: string;
  isPublished?: boolean;
}

const ESSAY_SUGGESTION_COLORS = ['#188038', '#1a73e8', '#a142f4', '#d93025', '#e37400'];

export const getEssaySuggestionColor = (author: string) => {
  const hash = Array.from(author || 'Reviewer').reduce((total, character) => total + character.charCodeAt(0), 0);
  return ESSAY_SUGGESTION_COLORS[hash % ESSAY_SUGGESTION_COLORS.length];
};

export const transformEssayFormattingAfterContentEdit = (
  ranges: SharedEssayFormatRange[],
  previousContent: string,
  nextContent: string
) => {
  if (previousContent === nextContent) return ranges;
  let editStart = 0;
  while (editStart < previousContent.length && editStart < nextContent.length && previousContent[editStart] === nextContent[editStart]) editStart += 1;
  let suffixLength = 0;
  while (
    suffixLength < previousContent.length - editStart &&
    suffixLength < nextContent.length - editStart &&
    previousContent[previousContent.length - 1 - suffixLength] === nextContent[nextContent.length - 1 - suffixLength]
  ) suffixLength += 1;
  const previousEditEnd = previousContent.length - suffixLength;
  const insertedLength = nextContent.length - editStart - suffixLength;
  const delta = insertedLength - (previousEditEnd - editStart);
  const mapStart = (position: number) => {
    if (position <= editStart) return position;
    if (position >= previousEditEnd) return position + delta;
    return editStart;
  };
  const mapEnd = (position: number) => {
    if (position <= editStart) return position;
    if (position >= previousEditEnd) return position + delta;
    return editStart + insertedLength;
  };
  return ranges
    .map(range => ({ ...range, start: mapStart(range.start), end: mapEnd(range.end) }))
    .filter(range => range.start < range.end);
};

export interface SharedEssayVersion {
  id: string;
  versionNumber: string;
  content: string;
  author: 'Student' | 'Teacher' | 'AI';
  source: string;
  note?: string;
  updatedAt: string;
  timestamp: number;
  formatting?: SharedEssayFormatRange[];
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
  formatting: SharedEssayFormatRange[];
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
  } catch (error) {
    console.error('Failed to read essay reviews:', error);
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
    suggestions: (review.suggestions || []).map(suggestion => ({
      ...suggestion,
      type: !suggestion.originalText && suggestion.suggestedText ? 'insert' : suggestion.type,
      suggestionColor: suggestion.suggestionColor || getEssaySuggestionColor(suggestion.author)
    })),
    formatting: review.formatting || [],
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
  } catch (error) {
    console.error('Failed to save essay review:', error);
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
    formatting: [],
    versions,
    lastModifiedBy: 'Student',
    lastModifiedAt: now,
    revisionNumber: 1,
    documentMode: status === 'Finalized' || status === 'Returned'
      ? 'Viewing'
      : status === 'Reviewing'
        ? 'Suggesting'
        : 'Editing',
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
