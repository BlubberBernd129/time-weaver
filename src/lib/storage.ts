import { Category, Subcategory, TimeEntry, TimerState } from '@/types/timetracker';

const STORAGE_KEYS = {
  CATEGORIES: 'timetracker_categories',
  SUBCATEGORIES: 'timetracker_subcategories',
  TIME_ENTRIES: 'timetracker_entries',
  TIMER_STATE: 'timetracker_timer',
};

// Default categories with colors
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Arbeit', color: '#14b8a6', createdAt: new Date() },
  { id: 'cat_2', name: 'Uni', color: '#8b5cf6', createdAt: new Date() },
  { id: 'cat_3', name: 'Haushalt', color: '#f59e0b', createdAt: new Date() },
  { id: 'cat_4', name: 'Fitness', color: '#22c55e', createdAt: new Date() },
];

const DEFAULT_SUBCATEGORIES: Subcategory[] = [
  { id: 'sub_1', categoryId: 'cat_1', name: 'Stückliste', createdAt: new Date() },
  { id: 'sub_2', categoryId: 'cat_1', name: 'Reports', createdAt: new Date() },
  { id: 'sub_3', categoryId: 'cat_1', name: 'Tickets', createdAt: new Date() },
  { id: 'sub_4', categoryId: 'cat_2', name: 'Vorlesung', createdAt: new Date() },
  { id: 'sub_5', categoryId: 'cat_2', name: 'Lernen', createdAt: new Date() },
  { id: 'sub_6', categoryId: 'cat_2', name: 'Seminar', createdAt: new Date() },
  { id: 'sub_7', categoryId: 'cat_3', name: 'Kochen', createdAt: new Date() },
  { id: 'sub_8', categoryId: 'cat_3', name: 'Putzen', createdAt: new Date() },
  { id: 'sub_9', categoryId: 'cat_4', name: 'Krafttraining', createdAt: new Date() },
  { id: 'sub_10', categoryId: 'cat_4', name: 'Cardio', createdAt: new Date() },
];

function parseDate(date: string | Date): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

export function getCategories(): Category[] {
  const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (!stored) {
    saveCategories(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }
  return JSON.parse(stored).map((c: Category) => ({
    ...c,
    createdAt: parseDate(c.createdAt),
  }));
}

export function saveCategories(categories: Category[]): void {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
}

export function getSubcategories(): Subcategory[] {
  const stored = localStorage.getItem(STORAGE_KEYS.SUBCATEGORIES);
  if (!stored) {
    saveSubcategories(DEFAULT_SUBCATEGORIES);
    return DEFAULT_SUBCATEGORIES;
  }
  return JSON.parse(stored).map((s: Subcategory) => ({
    ...s,
    createdAt: parseDate(s.createdAt),
  }));
}

export function saveSubcategories(subcategories: Subcategory[]): void {
  localStorage.setItem(STORAGE_KEYS.SUBCATEGORIES, JSON.stringify(subcategories));
}

export function getTimeEntries(): TimeEntry[] {
  const stored = localStorage.getItem(STORAGE_KEYS.TIME_ENTRIES);
  if (!stored) return [];
  return JSON.parse(stored).map((e: TimeEntry) => ({
    ...e,
    startTime: parseDate(e.startTime),
    endTime: e.endTime ? parseDate(e.endTime) : null,
  }));
}

export function saveTimeEntries(entries: TimeEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(entries));
}

export function getTimerState(): TimerState | null {
  const stored = localStorage.getItem(STORAGE_KEYS.TIMER_STATE);
  if (!stored) return null;
  const state = JSON.parse(stored);
  return {
    ...state,
    startTime: state.startTime ? parseDate(state.startTime) : null,
  };
}

export function saveTimerState(state: TimerState | null): void {
  if (state) {
    localStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(state));
  } else {
    localStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
  }
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
