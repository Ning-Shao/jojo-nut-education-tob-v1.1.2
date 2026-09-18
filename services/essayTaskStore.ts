export interface StoredEssayTaskVersion {
  id: string;
  versionNumber: string;
  content: string;
  updatedAt: string;
  timestamp: number;
  author: 'Student' | 'Teacher' | 'AI';
  source: string;
  note?: string;
  tags?: string[];
  wordCount: number;
}

export interface StoredEssayTask {
  id: string;
  title: string;
  school: string;
  type: string;
  prompt: string;
  wordLimit: number;
  deadline: string;
  status: string;
  contextKeywords: string;
  ideaCards: Array<{
    id: string;
    title: string;
    hook: string;
    coreValues: string[];
    plotSummary: string;
    isFavorite: boolean;
  }>;
  currentContent: string;
  lastSavedAt: string;
  versions: StoredEssayTaskVersion[];
}

const STORAGE_KEY = 'nut_education_essay_tasks_v1';
const CHANGE_EVENT = 'nut-essay-task-change';

const readAll = (): Record<string, StoredEssayTask[]> => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('Failed to read essay tasks:', error);
    return {};
  }
};

export const getEssayTasks = (studentId: string): StoredEssayTask[] => readAll()[studentId] || [];

export const saveEssayTask = (studentId: string, task: StoredEssayTask): boolean => {
  try {
    const all = readAll();
    const existing = all[studentId] || [];
    all[studentId] = [task, ...existing.filter(item => item.id !== task.id)];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { studentId } }));
    return true;
  } catch (error) {
    console.error('Failed to save essay task:', error);
    return false;
  }
};

export const subscribeEssayTasks = (listener: (studentId?: string) => void) => {
  const handleCustom = (event: Event) => listener((event as CustomEvent<{ studentId?: string }>).detail?.studentId);
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
